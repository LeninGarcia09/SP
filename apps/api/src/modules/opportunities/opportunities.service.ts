import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { OpportunityEntity } from './opportunity.entity';
import { OpportunityStakeholderEntity } from './opportunity-stakeholder.entity';
import { OpportunityTeamMemberEntity } from './opportunity-team-member.entity';
import { OpportunityLineItemEntity } from './opportunity-line-item.entity';
import { OpportunityCompetitorEntity } from './opportunity-competitor.entity';
import { ProjectEntity } from '../projects/project.entity';
import { PipelineStageEntity } from '../pipelines/pipeline-stage.entity';
import {
  CreateOpportunityDto,
  UpdateOpportunityDto,
  ConvertOpportunityDto,
  ChangeStageDto,
} from './dto/opportunity.dto';
import { CreateStakeholderDto, UpdateStakeholderDto } from './dto/stakeholder.dto';
import { CreateTeamMemberDto, UpdateTeamMemberDto } from './dto/team-member.dto';
import { CreateLineItemDto, UpdateLineItemDto } from './dto/line-item.dto';
import { CreateCompetitorDto, UpdateCompetitorDto } from './dto/competitor.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { getTenantFilter, getCurrentTenantId } from '../../common/tenant/tenant.context';
import { OpportunityStatus } from '@telnub/shared';

@Injectable()
export class OpportunitiesService {
  constructor(
    @InjectRepository(OpportunityEntity)
    private readonly opportunityRepo: Repository<OpportunityEntity>,
    @InjectRepository(OpportunityStakeholderEntity)
    private readonly stakeholderRepo: Repository<OpportunityStakeholderEntity>,
    @InjectRepository(OpportunityTeamMemberEntity)
    private readonly teamMemberRepo: Repository<OpportunityTeamMemberEntity>,
    @InjectRepository(OpportunityLineItemEntity)
    private readonly lineItemRepo: Repository<OpportunityLineItemEntity>,
    @InjectRepository(OpportunityCompetitorEntity)
    private readonly competitorRepo: Repository<OpportunityCompetitorEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(PipelineStageEntity)
    private readonly stageRepo: Repository<PipelineStageEntity>,
  ) {}

  async findAll(query: PaginationDto): Promise<PaginatedResult<OpportunityEntity>> {
    const { page, limit, sortBy, order, search } = query;
    const skip = (page - 1) * limit;
    const tf = getTenantFilter();

    const where = search
      ? [
          { name: ILike(`%${search}%`), ...tf },
          { code: ILike(`%${search}%`), ...tf },
          { clientName: ILike(`%${search}%`), ...tf },
        ]
      : Object.keys(tf).length > 0 ? [tf] : undefined;

    const [data, total] = await this.opportunityRepo.findAndCount({
      where,
      order: { [sortBy]: order },
      skip,
      take: limit,
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<OpportunityEntity> {
    const tf = getTenantFilter();
    const opp = await this.opportunityRepo.findOne({
      where: { id, ...tf },
      relations: ['currentStage', 'stakeholders', 'teamMembers', 'lineItems', 'competitors'],
    });
    if (!opp) throw new NotFoundException(`Opportunity ${id} not found`);
    return opp;
  }

  async create(dto: CreateOpportunityDto, ownerId: string): Promise<OpportunityEntity> {
    const year = new Date().getFullYear();
    const prefix = `OPP-${year}-`;
    const result = await this.opportunityRepo
      .createQueryBuilder('o')
      .select('MAX(o.code)', 'maxCode')
      .where('o.code LIKE :prefix', { prefix: `${prefix}%` })
      .getRawOne();
    const lastNum = result?.maxCode ? parseInt(result.maxCode.replace(prefix, ''), 10) : 0;
    const code = `${prefix}${String(lastNum + 1).padStart(3, '0')}`;

    // If stageId provided, auto-set probability + pipeline from stage
    let probability = dto.probability ?? 0;
    let pipelineId = dto.pipelineId ?? null;
    if (dto.stageId) {
      const stage = await this.stageRepo.findOneBy({ id: dto.stageId });
      if (stage) {
        if (!dto.probability) probability = stage.defaultProbability;
        if (!dto.pipelineId) pipelineId = stage.pipelineId;
      }
    }

    const estimatedValue = dto.estimatedValue ?? 0;
    const weightedValue = estimatedValue * (probability / 100);

    const entity = this.opportunityRepo.create({
      ...dto,
      code,
      ownerId: dto.ownerId ?? ownerId,
      pipelineId,
      probability,
      weightedValue,
      tenantId: getCurrentTenantId(),
      stageChangedAt: dto.stageId ? new Date() : null,
    });
    return this.opportunityRepo.save(entity);
  }

  async update(id: string, dto: UpdateOpportunityDto): Promise<OpportunityEntity> {
    const opp = await this.findById(id);
    if (opp.status === OpportunityStatus.CONVERTED) {
      throw new BadRequestException('Cannot update a converted opportunity');
    }
    Object.assign(opp, dto);

    // Recalculate weighted value
    opp.weightedValue = Number(opp.estimatedValue) * (opp.probability / 100);

    return this.opportunityRepo.save(opp);
  }

  async softDelete(id: string): Promise<OpportunityEntity> {
    const opp = await this.findById(id);
    if (opp.status === OpportunityStatus.CONVERTED) {
      throw new BadRequestException('Cannot delete a converted opportunity');
    }
    opp.status = OpportunityStatus.LOST;
    return this.opportunityRepo.save(opp);
  }

  async convert(id: string, dto: ConvertOpportunityDto, createdBy: string): Promise<{ opportunity: OpportunityEntity; project: ProjectEntity }> {
    const opp = await this.findById(id);
    if (opp.status === OpportunityStatus.CONVERTED) {
      throw new BadRequestException('Opportunity already converted');
    }

    // Create the project
    const year = new Date().getFullYear();
    const projPrefix = `PROJ-${year}-`;
    const projResult = await this.projectRepo
      .createQueryBuilder('p')
      .withDeleted()
      .select('MAX(p.code)', 'maxCode')
      .where('p.code LIKE :prefix', { prefix: `${projPrefix}%` })
      .getRawOne();
    const projLastNum = projResult?.maxCode ? parseInt(projResult.maxCode.replace(projPrefix, ''), 10) : 0;
    const projectCode = `${projPrefix}${String(projLastNum + 1).padStart(3, '0')}`;

    const project = this.projectRepo.create({
      code: projectCode,
      name: dto.projectName,
      startDate: dto.startDate,
      endDate: dto.endDate,
      budget: dto.budget ?? opp.estimatedValue,
      projectLeadId: dto.projectLeadId,
      programId: dto.programId ?? null,
      createdBy,
      metadata: { convertedFromOpportunity: opp.code },
      tenantId: getCurrentTenantId(),
    });
    const savedProject = await this.projectRepo.save(project);

    // Update the opportunity
    opp.status = OpportunityStatus.CONVERTED;
    opp.convertedProjectId = savedProject.id;
    opp.convertedAt = new Date();
    const savedOpp = await this.opportunityRepo.save(opp);

    return { opportunity: savedOpp, project: savedProject };
  }

  // ─── Stage Change ───

  async changeStage(id: string, dto: ChangeStageDto): Promise<OpportunityEntity> {
    const opp = await this.findById(id);
    if (opp.status === OpportunityStatus.CONVERTED) {
      throw new BadRequestException('Cannot change stage of a converted opportunity');
    }

    const stage = await this.stageRepo.findOneBy({ id: dto.stageId });
    if (!stage) throw new NotFoundException(`Stage ${dto.stageId} not found`);

    const oldExpectedClose = opp.expectedCloseDate;
    const probability = dto.probability ?? stage.defaultProbability;

    opp.stageId = stage.id;
    opp.pipelineId = stage.pipelineId;
    opp.probability = probability;
    opp.weightedValue = Number(opp.estimatedValue) * (probability / 100);
    opp.forecastCategory = stage.forecastCategory;
    opp.stageChangedAt = new Date();
    opp.daysInCurrentStage = 0;

    if (stage.isClosed) {
      opp.actualCloseDate = dto.actualCloseDate ?? new Date().toISOString().slice(0, 10);
      if (stage.isWon) {
        opp.status = OpportunityStatus.WON;
      } else {
        opp.status = OpportunityStatus.LOST;
        opp.lostReason = dto.lostReason ?? opp.lostReason;
      }
    }

    // Track close-date pushes
    if (dto.actualCloseDate && oldExpectedClose && dto.actualCloseDate > oldExpectedClose) {
      opp.pushCount = (opp.pushCount ?? 0) + 1;
    }

    return this.opportunityRepo.save(opp);
  }

  // ─── Stakeholders ───

  async findStakeholders(opportunityId: string): Promise<OpportunityStakeholderEntity[]> {
    await this.findById(opportunityId); // ensures exists + tenant check
    return this.stakeholderRepo.find({ where: { opportunityId }, relations: ['contact'] });
  }

  async addStakeholder(opportunityId: string, dto: CreateStakeholderDto): Promise<OpportunityStakeholderEntity> {
    await this.findById(opportunityId);
    const entity = this.stakeholderRepo.create({ ...dto, opportunityId });
    return this.stakeholderRepo.save(entity);
  }

  async updateStakeholder(id: string, dto: UpdateStakeholderDto): Promise<OpportunityStakeholderEntity> {
    const stakeholder = await this.stakeholderRepo.findOneBy({ id });
    if (!stakeholder) throw new NotFoundException(`Stakeholder ${id} not found`);
    Object.assign(stakeholder, dto);
    return this.stakeholderRepo.save(stakeholder);
  }

  async removeStakeholder(id: string): Promise<void> {
    const result = await this.stakeholderRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Stakeholder ${id} not found`);
  }

  // ─── Team Members ───

  async findTeamMembers(opportunityId: string): Promise<OpportunityTeamMemberEntity[]> {
    await this.findById(opportunityId);
    return this.teamMemberRepo.find({ where: { opportunityId } });
  }

  async addTeamMember(opportunityId: string, dto: CreateTeamMemberDto): Promise<OpportunityTeamMemberEntity> {
    await this.findById(opportunityId);
    const entity = this.teamMemberRepo.create({ ...dto, opportunityId });
    return this.teamMemberRepo.save(entity);
  }

  async updateTeamMember(id: string, dto: UpdateTeamMemberDto): Promise<OpportunityTeamMemberEntity> {
    const member = await this.teamMemberRepo.findOneBy({ id });
    if (!member) throw new NotFoundException(`Team member ${id} not found`);
    Object.assign(member, dto);
    return this.teamMemberRepo.save(member);
  }

  async removeTeamMember(id: string): Promise<void> {
    const result = await this.teamMemberRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Team member ${id} not found`);
  }

  // ─── Line Items ───

  async findLineItems(opportunityId: string): Promise<OpportunityLineItemEntity[]> {
    await this.findById(opportunityId);
    return this.lineItemRepo.find({
      where: { opportunityId },
      order: { sortOrder: 'ASC' },
      relations: ['product'],
    });
  }

  async addLineItem(opportunityId: string, dto: CreateLineItemDto): Promise<OpportunityLineItemEntity> {
    await this.findById(opportunityId);
    const quantity = dto.quantity ?? 1;
    const discount = dto.discount ?? 0;
    const totalPrice = quantity * dto.unitPrice * (1 - discount / 100);
    const entity = this.lineItemRepo.create({ ...dto, opportunityId, totalPrice });
    const saved = await this.lineItemRepo.save(entity);
    await this.recalcOpportunityValue(opportunityId);
    return saved;
  }

  async updateLineItem(id: string, dto: UpdateLineItemDto): Promise<OpportunityLineItemEntity> {
    const item = await this.lineItemRepo.findOneBy({ id });
    if (!item) throw new NotFoundException(`Line item ${id} not found`);
    Object.assign(item, dto);
    // Recalculate totalPrice
    item.totalPrice = Number(item.quantity) * Number(item.unitPrice) * (1 - Number(item.discount) / 100);
    const saved = await this.lineItemRepo.save(item);
    await this.recalcOpportunityValue(item.opportunityId);
    return saved;
  }

  async removeLineItem(id: string): Promise<void> {
    const item = await this.lineItemRepo.findOneBy({ id });
    if (!item) throw new NotFoundException(`Line item ${id} not found`);
    const oppId = item.opportunityId;
    await this.lineItemRepo.delete(id);
    await this.recalcOpportunityValue(oppId);
  }

  /** Recalculate opportunity estimatedValue + weightedValue from line items */
  private async recalcOpportunityValue(opportunityId: string): Promise<void> {
    const items = await this.lineItemRepo.find({ where: { opportunityId } });
    if (items.length === 0) return;
    const total = items.reduce((sum, i) => sum + Number(i.totalPrice), 0);
    await this.opportunityRepo.update(opportunityId, {
      estimatedValue: total,
      weightedValue: total * ((await this.opportunityRepo.findOneBy({ id: opportunityId }))!.probability / 100),
    });
  }

  // ─── Competitors ───

  async findCompetitors(opportunityId: string): Promise<OpportunityCompetitorEntity[]> {
    await this.findById(opportunityId);
    return this.competitorRepo.find({ where: { opportunityId } });
  }

  async addCompetitor(opportunityId: string, dto: CreateCompetitorDto): Promise<OpportunityCompetitorEntity> {
    await this.findById(opportunityId);
    const entity = this.competitorRepo.create({ ...dto, opportunityId });
    return this.competitorRepo.save(entity);
  }

  async updateCompetitor(id: string, dto: UpdateCompetitorDto): Promise<OpportunityCompetitorEntity> {
    const competitor = await this.competitorRepo.findOneBy({ id });
    if (!competitor) throw new NotFoundException(`Competitor ${id} not found`);
    Object.assign(competitor, dto);
    return this.competitorRepo.save(competitor);
  }

  async removeCompetitor(id: string): Promise<void> {
    const result = await this.competitorRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Competitor ${id} not found`);
  }
}
