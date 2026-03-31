import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityEntity } from './activity.entity';
import { CreateActivityDto } from './dto/activity.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { getTenantFilter, getCurrentTenantId } from '../../common/tenant/tenant.context';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(ActivityEntity)
    private readonly activityRepo: Repository<ActivityEntity>,
  ) {}

  async findAll(query: PaginationDto & { opportunityId?: string; accountId?: string; contactId?: string; type?: string }): Promise<PaginatedResult<ActivityEntity>> {
    const { page, limit, sortBy, order, search } = query;
    const skip = (page - 1) * limit;
    const tf = getTenantFilter();

    const qb = this.activityRepo.createQueryBuilder('a');

    if (tf.tenantId) {
      qb.andWhere('a.tenantId = :tenantId', { tenantId: tf.tenantId });
    }
    if (query.opportunityId) {
      qb.andWhere('a.opportunityId = :opportunityId', { opportunityId: query.opportunityId });
    }
    if (query.accountId) {
      qb.andWhere('a.accountId = :accountId', { accountId: query.accountId });
    }
    if (query.contactId) {
      qb.andWhere('a.contactId = :contactId', { contactId: query.contactId });
    }
    if (query.type) {
      qb.andWhere('a.type = :type', { type: query.type });
    }
    if (search) {
      qb.andWhere('(a.subject ILIKE :search OR a.description ILIKE :search)', { search: `%${search}%` });
    }

    qb.orderBy(`a.${sortBy === 'createdAt' ? 'createdAt' : sortBy}`, order as 'ASC' | 'DESC');
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<ActivityEntity> {
    const tf = getTenantFilter();
    const qb = this.activityRepo.createQueryBuilder('a').where('a.id = :id', { id });
    if (tf.tenantId) {
      qb.andWhere('a.tenantId = :tenantId', { tenantId: tf.tenantId });
    }
    const activity = await qb.getOne();
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    return activity;
  }

  async create(dto: CreateActivityDto, createdBy: string): Promise<ActivityEntity> {
    const entity = this.activityRepo.create({
      ...dto,
      createdBy,
      tenantId: getCurrentTenantId(),
    });
    return this.activityRepo.save(entity);
  }

  /** Activities by entity (timeline for opportunity/account/contact) */
  async findByEntity(entityType: 'opportunity' | 'account' | 'contact', entityId: string, query: PaginationDto): Promise<PaginatedResult<ActivityEntity>> {
    const filterKey = `${entityType}Id`;
    return this.findAll({ ...query, [filterKey]: entityId });
  }

  /** Upcoming planned activities for current user */
  async findUpcoming(userId: string, limit = 10): Promise<ActivityEntity[]> {
    const tf = getTenantFilter();
    const qb = this.activityRepo.createQueryBuilder('a')
      .where('a.assignedToId = :userId', { userId })
      .andWhere('a.status = :status', { status: 'PLANNED' })
      .andWhere('a.dueDate IS NOT NULL')
      .andWhere('a.dueDate >= NOW()');

    if (tf.tenantId) {
      qb.andWhere('a.tenantId = :tenantId', { tenantId: tf.tenantId });
    }

    return qb.orderBy('a.dueDate', 'ASC').take(limit).getMany();
  }

  /** Overdue planned activities for current user */
  async findOverdue(userId: string, limit = 10): Promise<ActivityEntity[]> {
    const tf = getTenantFilter();
    const qb = this.activityRepo.createQueryBuilder('a')
      .where('a.assignedToId = :userId', { userId })
      .andWhere('a.status = :status', { status: 'PLANNED' })
      .andWhere('a.dueDate IS NOT NULL')
      .andWhere('a.dueDate < NOW()');

    if (tf.tenantId) {
      qb.andWhere('a.tenantId = :tenantId', { tenantId: tf.tenantId });
    }

    return qb.orderBy('a.dueDate', 'ASC').take(limit).getMany();
  }
}
