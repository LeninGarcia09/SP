import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { ActivityTemplateEntity } from './activity-template.entity';
import { CreateActivityTemplateDto, UpdateActivityTemplateDto } from './dto/activity.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { getTenantFilter, getCurrentTenantId } from '../../common/tenant/tenant.context';

@Injectable()
export class ActivityTemplatesService {
  constructor(
    @InjectRepository(ActivityTemplateEntity)
    private readonly templateRepo: Repository<ActivityTemplateEntity>,
  ) {}

  async findAll(query: PaginationDto): Promise<PaginatedResult<ActivityTemplateEntity>> {
    const { page, limit, sortBy, order, search } = query;
    const skip = (page - 1) * limit;
    const tf = getTenantFilter();

    const where = search
      ? [
          { name: ILike(`%${search}%`), ...tf },
          { category: ILike(`%${search}%`), ...tf },
        ]
      : Object.keys(tf).length > 0 ? [tf] : undefined;

    const [data, total] = await this.templateRepo.findAndCount({
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

  async findById(id: string): Promise<ActivityTemplateEntity> {
    const tf = getTenantFilter();
    const template = await this.templateRepo.findOneBy({ id, ...tf });
    if (!template) throw new NotFoundException(`Activity template ${id} not found`);
    return template;
  }

  async create(dto: CreateActivityTemplateDto, createdBy: string): Promise<ActivityTemplateEntity> {
    const entity = this.templateRepo.create({
      ...dto,
      createdBy,
      tenantId: getCurrentTenantId(),
    });
    return this.templateRepo.save(entity);
  }

  async update(id: string, dto: UpdateActivityTemplateDto): Promise<ActivityTemplateEntity> {
    const template = await this.findById(id);
    Object.assign(template, dto);
    return this.templateRepo.save(template);
  }

  async delete(id: string): Promise<void> {
    const template = await this.findById(id);
    await this.templateRepo.remove(template);
  }
}
