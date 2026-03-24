import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { OpportunityEntity } from './opportunity.entity';
import { ProjectEntity } from '../projects/project.entity';
import { CreateOpportunityDto, UpdateOpportunityDto, ConvertOpportunityDto } from './dto/opportunity.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { OpportunityStatus } from '@telnub/shared';

@Injectable()
export class OpportunitiesService {
  constructor(
    @InjectRepository(OpportunityEntity)
    private readonly opportunityRepo: Repository<OpportunityEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
  ) {}

  async findAll(query: PaginationDto): Promise<PaginatedResult<OpportunityEntity>> {
    const { page, limit, sortBy, order, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? [
          { name: ILike(`%${search}%`) },
          { code: ILike(`%${search}%`) },
          { clientName: ILike(`%${search}%`) },
        ]
      : undefined;

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
    const opp = await this.opportunityRepo.findOneBy({ id });
    if (!opp) throw new NotFoundException(`Opportunity ${id} not found`);
    return opp;
  }

  async create(dto: CreateOpportunityDto, ownerId: string): Promise<OpportunityEntity> {
    const year = new Date().getFullYear();
    const count = await this.opportunityRepo.count();
    const code = `OPP-${year}-${String(count + 1).padStart(3, '0')}`;
    const entity = this.opportunityRepo.create({ ...dto, code, ownerId });
    return this.opportunityRepo.save(entity);
  }

  async update(id: string, dto: UpdateOpportunityDto): Promise<OpportunityEntity> {
    const opp = await this.findById(id);
    if (opp.status === OpportunityStatus.CONVERTED) {
      throw new BadRequestException('Cannot update a converted opportunity');
    }
    Object.assign(opp, dto);
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
    const projCount = await this.projectRepo.count();
    const projectCode = `PROJ-${year}-${String(projCount + 1).padStart(3, '0')}`;

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
    });
    const savedProject = await this.projectRepo.save(project);

    // Update the opportunity
    opp.status = OpportunityStatus.CONVERTED;
    opp.convertedProjectId = savedProject.id;
    opp.convertedAt = new Date();
    const savedOpp = await this.opportunityRepo.save(opp);

    return { opportunity: savedOpp, project: savedProject };
  }
}
