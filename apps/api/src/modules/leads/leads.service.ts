import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, DataSource } from 'typeorm';
import { LeadEntity, LeadStatus, LeadSource, LeadRating } from './lead.entity';
import { CreateLeadDto, UpdateLeadDto, ConvertLeadDto } from './dto/lead.dto';
import { AccountEntity } from '../accounts/account.entity';
import { AccountType } from '@telnub/shared';
import { ContactEntity } from '../contacts/contact.entity';
import { OpportunityEntity } from '../opportunities/opportunity.entity';
import { PipelineStageEntity } from '../pipelines/pipeline-stage.entity';
import { ActivityEntity } from '../activities/activity.entity';
import { ActivityType } from '@telnub/shared';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { getTenantFilter, getCurrentTenantId } from '../../common/tenant/tenant.context';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leadRepo: Repository<LeadEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
    @InjectRepository(ContactEntity)
    private readonly contactRepo: Repository<ContactEntity>,
    @InjectRepository(OpportunityEntity)
    private readonly opportunityRepo: Repository<OpportunityEntity>,
    @InjectRepository(PipelineStageEntity)
    private readonly stageRepo: Repository<PipelineStageEntity>,
    @InjectRepository(ActivityEntity)
    private readonly activityRepo: Repository<ActivityEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(
    query: PaginationDto & { status?: string; source?: string; rating?: string; ownerId?: string },
  ): Promise<PaginatedResult<LeadEntity>> {
    const { page, limit, sortBy, order, search } = query;
    const skip = (page - 1) * limit;
    const tf = getTenantFilter();

    const qb = this.leadRepo.createQueryBuilder('l');

    if (tf.tenantId) {
      qb.andWhere('l.tenantId = :tenantId', { tenantId: tf.tenantId });
    }
    qb.andWhere('l.isActive = true');

    if (query.status) {
      qb.andWhere('l.status = :status', { status: query.status });
    }
    if (query.source) {
      qb.andWhere('l.source = :source', { source: query.source });
    }
    if (query.rating) {
      qb.andWhere('l.rating = :rating', { rating: query.rating });
    }
    if (query.ownerId) {
      qb.andWhere('l.ownerId = :ownerId', { ownerId: query.ownerId });
    }
    if (search) {
      qb.andWhere(
        '(l.firstName ILIKE :search OR l.lastName ILIKE :search OR l.companyName ILIKE :search OR l.email ILIKE :search OR l.code ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const validSortBy = ['createdAt', 'updatedAt', 'score', 'companyName', 'lastName', 'status', 'rating'].includes(
      sortBy,
    )
      ? sortBy
      : 'createdAt';
    qb.orderBy(`l.${validSortBy}`, order as 'ASC' | 'DESC');
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<LeadEntity> {
    const tf = getTenantFilter();
    const where: Record<string, unknown> = { id, ...tf };
    const lead = await this.leadRepo.findOne({
      where,
      relations: ['convertedAccount', 'convertedContact', 'convertedOpportunity'],
    });
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    return lead;
  }

  async create(dto: CreateLeadDto, createdBy: string): Promise<LeadEntity> {
    const year = new Date().getFullYear();
    const prefix = `LEAD-${year}-`;
    const result = await this.leadRepo
      .createQueryBuilder('l')
      .select('MAX(l.code)', 'maxCode')
      .where('l.code LIKE :prefix', { prefix: `${prefix}%` })
      .getRawOne();
    const lastNum = result?.maxCode ? parseInt(result.maxCode.replace(prefix, ''), 10) : 0;
    const code = `${prefix}${String(lastNum + 1).padStart(3, '0')}`;

    const entity = this.leadRepo.create({
      ...dto,
      code,
      createdBy,
      tenantId: getCurrentTenantId(),
      assignedAt: dto.ownerId ? new Date() : null,
    });
    return this.leadRepo.save(entity);
  }

  async update(id: string, dto: UpdateLeadDto): Promise<LeadEntity> {
    const lead = await this.findById(id);
    if (lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException('Cannot update a converted lead');
    }
    // Track owner assignment
    if (dto.ownerId && dto.ownerId !== lead.ownerId) {
      (lead as any).assignedAt = new Date();
    }
    Object.assign(lead, dto);
    return this.leadRepo.save(lead);
  }

  async softDelete(id: string): Promise<LeadEntity> {
    const lead = await this.findById(id);
    lead.isActive = false;
    return this.leadRepo.save(lead);
  }

  async qualify(id: string): Promise<LeadEntity> {
    const lead = await this.findById(id);
    if (lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException('Cannot qualify a converted lead');
    }
    lead.status = LeadStatus.QUALIFIED;
    return this.leadRepo.save(lead);
  }

  async disqualify(id: string): Promise<LeadEntity> {
    const lead = await this.findById(id);
    if (lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException('Cannot disqualify a converted lead');
    }
    lead.status = LeadStatus.UNQUALIFIED;
    return this.leadRepo.save(lead);
  }

  async convert(
    id: string,
    dto: ConvertLeadDto,
    userId: string,
  ): Promise<{ lead: LeadEntity; account: any; contact: any; opportunity: any | null }> {
    const lead = await this.findById(id);
    if (lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException('Lead has already been converted');
    }

    const tenantId = getCurrentTenantId();

    return this.dataSource.transaction(async (manager) => {
      // 1. Create or find Account
      let account: AccountEntity;
      if (dto.createAccount) {
        const year = new Date().getFullYear();
        const accPrefix = `ACC-${year}-`;
        const accResult = await manager
          .createQueryBuilder(AccountEntity, 'a')
          .select('MAX(a.code)', 'maxCode')
          .where('a.code LIKE :prefix', { prefix: `${accPrefix}%` })
          .getRawOne();
        const accNum = accResult?.maxCode ? parseInt(accResult.maxCode.replace(accPrefix, ''), 10) : 0;
        const accCode = `${accPrefix}${String(accNum + 1).padStart(3, '0')}`;

        account = manager.create(AccountEntity, {
          code: accCode,
          name: dto.accountName || lead.companyName,
          industry: dto.accountIndustry || lead.industry,
          website: dto.accountWebsite || lead.website,
          type: dto.accountType || AccountType.PROSPECT,
          ownerId: userId,
          createdBy: userId,
          tenantId,
        });
        account = await manager.save(AccountEntity, account);
      } else {
        if (!dto.existingAccountId) {
          throw new BadRequestException('Either createAccount must be true or existingAccountId must be provided');
        }
        const existing = await manager.findOneBy(AccountEntity, { id: dto.existingAccountId });
        if (!existing) throw new NotFoundException(`Account ${dto.existingAccountId} not found`);
        account = existing;
      }

      // 2. Create Contact
      const conYear = new Date().getFullYear();
      const conPrefix = `CON-${conYear}-`;
      const conResult = await manager
        .createQueryBuilder(ContactEntity, 'c')
        .select('MAX(c.code)', 'maxCode')
        .where('c.code LIKE :prefix', { prefix: `${conPrefix}%` })
        .getRawOne();
      const conNum = conResult?.maxCode ? parseInt(conResult.maxCode.replace(conPrefix, ''), 10) : 0;
      const conCode = `${conPrefix}${String(conNum + 1).padStart(3, '0')}`;

      let contact = manager.create(ContactEntity, {
        code: conCode,
        firstName: dto.contactFirstName || lead.firstName,
        lastName: dto.contactLastName || lead.lastName,
        email: dto.contactEmail || lead.email,
        phone: dto.contactPhone || lead.phone,
        jobTitle: dto.contactJobTitle || lead.jobTitle,
        accountId: account.id,
        createdBy: userId,
        tenantId,
      });
      contact = await manager.save(ContactEntity, contact);

      // 3. Optionally create Opportunity
      let opportunity: OpportunityEntity | null = null;
      if (dto.createOpportunity) {
        const oppYear = new Date().getFullYear();
        const oppPrefix = `OPP-${oppYear}-`;
        const oppResult = await manager
          .createQueryBuilder(OpportunityEntity, 'o')
          .select('MAX(o.code)', 'maxCode')
          .where('o.code LIKE :prefix', { prefix: `${oppPrefix}%` })
          .getRawOne();
        const oppNum = oppResult?.maxCode ? parseInt(oppResult.maxCode.replace(oppPrefix, ''), 10) : 0;
        const oppCode = `${oppPrefix}${String(oppNum + 1).padStart(3, '0')}`;

        // Default pipeline/stage
        let stageId: string | null = null;
        let pipelineId: string | null = dto.pipelineId || null;
        let probability = 0;

        if (pipelineId) {
          const firstStage = await manager.findOne(PipelineStageEntity, {
            where: { pipelineId },
            order: { sortOrder: 'ASC' },
          });
          if (firstStage) {
            stageId = firstStage.id;
            probability = firstStage.defaultProbability;
          }
        }

        const estimatedValue = dto.estimatedValue ?? (lead.budget ? Number(lead.budget) : 0);
        const weightedValue = estimatedValue * (probability / 100);

        opportunity = manager.create(OpportunityEntity, {
          code: oppCode,
          name: dto.opportunityName || `${lead.companyName} - ${lead.firstName} ${lead.lastName}`,
          estimatedValue,
          weightedValue,
          probability,
          expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : null,
          accountId: account.id,
          primaryContactId: contact.id,
          pipelineId,
          stageId,
          ownerId: lead.ownerId || userId,
          sourceLeadId: lead.id,
          leadSource: lead.source,
          tenantId,
          stageChangedAt: stageId ? new Date() : null,
        } as any);
        opportunity = await manager.save(OpportunityEntity, opportunity);
      }

      // 4. Update Lead
      lead.status = LeadStatus.CONVERTED;
      lead.convertedAt = new Date();
      lead.convertedAccountId = account.id;
      lead.convertedContactId = contact.id;
      lead.convertedOpportunityId = opportunity?.id || null;
      lead.convertedBy = userId;
      await manager.save(LeadEntity, lead);

      // 5. Log Activity
      const activity = manager.create(ActivityEntity, {
        type: ActivityType.SYSTEM,
        subject: `Lead converted: ${lead.firstName} ${lead.lastName} (${lead.companyName})`,
        description: `Lead ${lead.code} converted to Account ${account.code}, Contact ${contact.code}${opportunity ? `, Opportunity ${opportunity.code}` : ''}`,
        accountId: account.id,
        contactId: contact.id,
        opportunityId: opportunity?.id || null,
        isAutomated: true,
        createdBy: userId,
        tenantId,
      });
      await manager.save(ActivityEntity, activity);

      return { lead, account, contact, opportunity };
    });
  }

  async getStats(): Promise<{
    byStatus: Array<{ status: string; count: number }>;
    bySource: Array<{ source: string; count: number }>;
    byRating: Array<{ rating: string; count: number }>;
    total: number;
    convertedCount: number;
    conversionRate: number;
  }> {
    const tf = getTenantFilter();

    const qb = this.leadRepo.createQueryBuilder('l').where('l.isActive = true');
    if (tf.tenantId) {
      qb.andWhere('l.tenantId = :tenantId', { tenantId: tf.tenantId });
    }

    const byStatus = await qb
      .clone()
      .select('l.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('l.status')
      .getRawMany();

    const bySource = await qb
      .clone()
      .select('l.source', 'source')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('l.source')
      .getRawMany();

    const byRating = await qb
      .clone()
      .select('l.rating', 'rating')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('l.rating')
      .getRawMany();

    const total = await qb.clone().getCount();
    const convertedCount = await qb.clone().andWhere('l.status = :st', { st: LeadStatus.CONVERTED }).getCount();
    const conversionRate = total > 0 ? Math.round((convertedCount / total) * 100) : 0;

    return { byStatus, bySource, byRating, total, convertedCount, conversionRate };
  }
}
