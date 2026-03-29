import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesPipelineEntity } from './sales-pipeline.entity';
import { PipelineStageEntity } from './pipeline-stage.entity';
import {
  CreatePipelineDto,
  UpdatePipelineDto,
  CreatePipelineStageDto,
  UpdatePipelineStageDto,
} from './dto/pipeline.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { getTenantFilter, getCurrentTenantId } from '../../common/tenant/tenant.context';

@Injectable()
export class PipelinesService {
  constructor(
    @InjectRepository(SalesPipelineEntity)
    private readonly pipelineRepo: Repository<SalesPipelineEntity>,
    @InjectRepository(PipelineStageEntity)
    private readonly stageRepo: Repository<PipelineStageEntity>,
  ) {}

  // ── Pipelines ──

  async findAllPipelines(query: PaginationDto): Promise<PaginatedResult<SalesPipelineEntity>> {
    const { page, limit, sortBy, order } = query;
    const skip = (page - 1) * limit;
    const tf = getTenantFilter();

    const where = Object.keys(tf).length > 0 ? [tf] : undefined;

    const [data, total] = await this.pipelineRepo.findAndCount({
      where,
      relations: ['stages'],
      order: { [sortBy]: order },
      skip,
      take: limit,
    });

    // Sort stages by sortOrder within each pipeline
    for (const pipeline of data) {
      if (pipeline.stages) {
        pipeline.stages.sort((a, b) => a.sortOrder - b.sortOrder);
      }
    }

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findPipelineById(id: string): Promise<SalesPipelineEntity> {
    const tf = getTenantFilter();
    const pipeline = await this.pipelineRepo.findOne({
      where: { id, ...tf },
      relations: ['stages'],
    });
    if (!pipeline) throw new NotFoundException(`Pipeline ${id} not found`);
    if (pipeline.stages) {
      pipeline.stages.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return pipeline;
  }

  async createPipeline(dto: CreatePipelineDto, createdBy: string): Promise<SalesPipelineEntity> {
    const tenantId = getCurrentTenantId();

    // If this pipeline is set as default, unset any existing default
    if (dto.isDefault) {
      await this.pipelineRepo.update(
        { tenantId, isDefault: true } as any,
        { isDefault: false },
      );
    }

    const entity = this.pipelineRepo.create({
      ...dto,
      createdBy,
      tenantId,
    });
    return this.pipelineRepo.save(entity);
  }

  async updatePipeline(id: string, dto: UpdatePipelineDto): Promise<SalesPipelineEntity> {
    const pipeline = await this.findPipelineById(id);

    // If setting as default, unset any existing default
    if (dto.isDefault) {
      await this.pipelineRepo.update(
        { tenantId: pipeline.tenantId, isDefault: true } as any,
        { isDefault: false },
      );
    }

    Object.assign(pipeline, dto);
    return this.pipelineRepo.save(pipeline);
  }

  async softDeletePipeline(id: string): Promise<SalesPipelineEntity> {
    const pipeline = await this.findPipelineById(id);
    if (pipeline.isDefault) {
      throw new BadRequestException('Cannot delete the default pipeline');
    }
    pipeline.isActive = false;
    return this.pipelineRepo.save(pipeline);
  }

  // ── Pipeline Stages ──

  async findStagesByPipelineId(pipelineId: string): Promise<PipelineStageEntity[]> {
    const tf = getTenantFilter();
    return this.stageRepo.find({
      where: { pipelineId, ...tf },
      order: { sortOrder: 'ASC' },
    });
  }

  async createStage(pipelineId: string, dto: CreatePipelineStageDto): Promise<PipelineStageEntity> {
    // Verify pipeline exists
    await this.findPipelineById(pipelineId);

    const entity = this.stageRepo.create({
      ...dto,
      pipelineId,
      tenantId: getCurrentTenantId(),
    });
    return this.stageRepo.save(entity);
  }

  async updateStage(stageId: string, dto: UpdatePipelineStageDto): Promise<PipelineStageEntity> {
    const tf = getTenantFilter();
    const stage = await this.stageRepo.findOneBy({ id: stageId, ...tf });
    if (!stage) throw new NotFoundException(`Pipeline stage ${stageId} not found`);
    Object.assign(stage, dto);
    return this.stageRepo.save(stage);
  }

  async deleteStage(stageId: string): Promise<void> {
    const tf = getTenantFilter();
    const stage = await this.stageRepo.findOneBy({ id: stageId, ...tf });
    if (!stage) throw new NotFoundException(`Pipeline stage ${stageId} not found`);
    await this.stageRepo.remove(stage);
  }
}
