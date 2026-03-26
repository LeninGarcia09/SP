import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliverableEntity } from './deliverable.entity';
import { TaskEntity } from '../tasks/task.entity';
import { CostEntryEntity } from '../costs/cost-entry.entity';
import { ProjectEntity } from '../projects/project.entity';
import { CreateDeliverableDto, UpdateDeliverableDto } from './dto/deliverable.dto';
import { CostEntryStatus, TaskStatus } from '@telnub/shared';
import { getTenantFilter, getCurrentTenantId } from '../../common/tenant/tenant.context';
import type { DeliverableSummary, TaskCostBreakdown } from '@telnub/shared';

@Injectable()
export class DeliverablesService {
  constructor(
    @InjectRepository(DeliverableEntity)
    private readonly deliverableRepo: Repository<DeliverableEntity>,
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,
    @InjectRepository(CostEntryEntity)
    private readonly costRepo: Repository<CostEntryEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
  ) {}

  async findByProject(projectId: string): Promise<DeliverableSummary[]> {
    const tf = getTenantFilter();
    const deliverables = await this.deliverableRepo.find({
      where: { projectId, ...tf },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    const project = await this.projectRepo.findOneBy({ id: projectId, ...tf });
    const projectCostRate = Number(project?.costRate || 0);

    const summaries: DeliverableSummary[] = [];
    for (const d of deliverables) {
      const tasks = await this.taskRepo.find({ where: { deliverableId: d.id, ...tf } });
      const taskIds = tasks.map((t) => t.id);

      const taskCount = tasks.length;
      const completedTaskCount = tasks.filter((t) => t.status === TaskStatus.DONE).length;
      const totalEstimatedHours = tasks.reduce((s, t) => s + Number(t.estimatedHours || 0), 0);
      const totalActualHours = tasks.reduce((s, t) => s + Number(t.actualHours || 0), 0);

      // Labor cost: each task uses its own costRate if set, else project rate
      const laborCost = tasks.reduce((s, t) => {
        const rate = Number(t.costRate ?? projectCostRate);
        return s + Number(t.actualHours || 0) * rate;
      }, 0);

      // Direct costs: approved cost entries linked to tasks in this deliverable
      let directCost = 0;
      if (taskIds.length > 0) {
        const result = await this.costRepo
          .createQueryBuilder('ce')
          .select('COALESCE(SUM(ce.amount), 0)', 'total')
          .where('ce.taskId IN (:...taskIds)', { taskIds })
          .andWhere('ce.status = :status', { status: CostEntryStatus.APPROVED })
          .getRawOne();
        directCost = Number(result?.total || 0);
      }

      summaries.push({
        ...this.toPlain(d),
        taskCount,
        completedTaskCount,
        totalEstimatedHours,
        totalActualHours,
        laborCost: Math.round(laborCost * 100) / 100,
        directCost: Math.round(directCost * 100) / 100,
        totalCost: Math.round((laborCost + directCost) * 100) / 100,
      });
    }

    return summaries;
  }

  async findById(id: string): Promise<DeliverableEntity> {
    const tf = getTenantFilter();
    const deliverable = await this.deliverableRepo.findOneBy({ id, ...tf });
    if (!deliverable) throw new NotFoundException(`Deliverable ${id} not found`);
    return deliverable;
  }

  async create(projectId: string, dto: CreateDeliverableDto): Promise<DeliverableEntity> {
    const tf = getTenantFilter();
    const project = await this.projectRepo.findOneBy({ id: projectId, ...tf });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const deliverable = this.deliverableRepo.create({ ...dto, projectId, tenantId: getCurrentTenantId() });
    return this.deliverableRepo.save(deliverable);
  }

  async update(id: string, dto: UpdateDeliverableDto): Promise<DeliverableEntity> {
    const deliverable = await this.findById(id);
    Object.assign(deliverable, dto);
    return this.deliverableRepo.save(deliverable);
  }

  async remove(id: string): Promise<void> {
    const deliverable = await this.findById(id);
    // Unlink tasks from this deliverable before removing
    await this.taskRepo.update({ deliverableId: id, ...getTenantFilter() }, { deliverableId: null });
    await this.deliverableRepo.remove(deliverable);
  }

  /** Get per-task cost breakdown for a deliverable */
  async getTaskCosts(deliverableId: string): Promise<TaskCostBreakdown[]> {
    const deliverable = await this.findById(deliverableId);
    const project = await this.projectRepo.findOneBy({ id: deliverable.projectId, ...getTenantFilter() });
    const projectCostRate = Number(project?.costRate || 0);

    const tasks = await this.taskRepo.find({
      where: { deliverableId, ...getTenantFilter() },
      order: { createdAt: 'ASC' },
    });

    const breakdowns: TaskCostBreakdown[] = [];
    for (const t of tasks) {
      const rate = Number(t.costRate ?? projectCostRate);
      const actualHours = Number(t.actualHours || 0);
      const laborCost = actualHours * rate;

      const result = await this.costRepo
        .createQueryBuilder('ce')
        .select('COALESCE(SUM(ce.amount), 0)', 'total')
        .where('ce.taskId = :taskId', { taskId: t.id })
        .andWhere('ce.status = :status', { status: CostEntryStatus.APPROVED })
        .getRawOne();
      const directCosts = Number(result?.total || 0);

      breakdowns.push({
        taskId: t.id,
        taskTitle: t.title,
        estimatedHours: Number(t.estimatedHours || 0),
        actualHours,
        costRate: rate,
        laborCost: Math.round(laborCost * 100) / 100,
        directCosts: Math.round(directCosts * 100) / 100,
        totalCost: Math.round((laborCost + directCosts) * 100) / 100,
      });
    }

    return breakdowns;
  }

  private toPlain(entity: DeliverableEntity): Omit<DeliverableSummary, 'taskCount' | 'completedTaskCount' | 'totalEstimatedHours' | 'totalActualHours' | 'laborCost' | 'directCost' | 'totalCost'> {
    return {
      id: entity.id,
      projectId: entity.projectId,
      title: entity.title,
      description: entity.description,
      status: entity.status as import('@telnub/shared').DeliverableStatus,
      budget: Number(entity.budget),
      startDate: entity.startDate,
      dueDate: entity.dueDate,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt?.toISOString?.() ?? String(entity.createdAt),
      updatedAt: entity.updatedAt?.toISOString?.() ?? String(entity.updatedAt),
    };
  }
}
