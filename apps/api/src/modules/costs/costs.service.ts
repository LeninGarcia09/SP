import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CostEntryEntity } from './cost-entry.entity';
import { ProjectEntity } from '../projects/project.entity';
import { TaskEntity } from '../tasks/task.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateCostEntryDto,
  UpdateCostEntryDto,
  TransferCostEntryDto,
  RejectCostEntryDto,
} from './dto/cost-entry.dto';
import { CostEntryStatus, NotificationType, TaskStatus } from '@telnub/shared';
import { getTenantFilter, getCurrentTenantId } from '../../common/tenant/tenant.context';
import type { CostSummary, CostForecast, BurnChartData, TaskCostBreakdown } from '@telnub/shared';

@Injectable()
export class CostsService {
  constructor(
    @InjectRepository(CostEntryEntity)
    private readonly costRepo: Repository<CostEntryEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findByProject(projectId: string): Promise<CostEntryEntity[]> {
    const tf = getTenantFilter();
    return this.costRepo.find({
      where: { projectId, ...tf },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<CostEntryEntity> {
    const tf = getTenantFilter();
    const entry = await this.costRepo.findOneBy({ id, ...tf });
    if (!entry) throw new NotFoundException(`Cost entry ${id} not found`);
    return entry;
  }

  async create(
    projectId: string,
    dto: CreateCostEntryDto,
    submittedById: string,
  ): Promise<CostEntryEntity> {
    const tf = getTenantFilter();
    const project = await this.projectRepo.findOneBy({ id: projectId, ...tf });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const entry = this.costRepo.create({
      ...dto,
      projectId,
      submittedById,
      status: CostEntryStatus.DRAFT,
      tenantId: getCurrentTenantId(),
    });
    const saved = await this.costRepo.save(entry);
    await this.recalculateProjectCost(projectId);
    return saved;
  }

  async update(id: string, dto: UpdateCostEntryDto): Promise<CostEntryEntity> {
    const entry = await this.findById(id);
    if (entry.status !== CostEntryStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT cost entries can be edited');
    }
    Object.assign(entry, dto);
    const saved = await this.costRepo.save(entry);
    await this.recalculateProjectCost(entry.projectId);
    return saved;
  }

  async delete(id: string): Promise<void> {
    const entry = await this.findById(id);
    if (entry.status !== CostEntryStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT cost entries can be deleted');
    }
    const projectId = entry.projectId;
    await this.costRepo.remove(entry);
    await this.recalculateProjectCost(projectId);
  }

  async submit(id: string): Promise<CostEntryEntity> {
    const entry = await this.findById(id);
    if (entry.status !== CostEntryStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT entries can be submitted');
    }
    entry.status = CostEntryStatus.SUBMITTED;
    const saved = await this.costRepo.save(entry);

    // Notify project lead
    const project = await this.projectRepo.findOneBy({ id: entry.projectId, ...getTenantFilter() });
    if (project) {
      await this.notificationsService.create({
        userId: project.projectLeadId,
        type: NotificationType.COST_SUBMITTED,
        title: 'Cost Entry Submitted',
        message: `A cost entry of $${Number(entry.amount).toLocaleString()} (${entry.category}) was submitted for ${project.name}`,
        relatedEntityType: 'cost_entry',
        relatedEntityId: entry.id,
      });
    }

    return saved;
  }

  async approve(id: string, approvedById: string): Promise<CostEntryEntity> {
    const entry = await this.findById(id);
    if (entry.status !== CostEntryStatus.SUBMITTED) {
      throw new BadRequestException('Only SUBMITTED entries can be approved');
    }
    entry.status = CostEntryStatus.APPROVED;
    entry.approvedById = approvedById;
    entry.approvedAt = new Date();
    const saved = await this.costRepo.save(entry);
    await this.recalculateProjectCost(entry.projectId);

    // Notify submitter
    await this.notificationsService.create({
      userId: entry.submittedById,
      type: NotificationType.COST_APPROVED,
      title: 'Cost Entry Approved',
      message: `Your cost entry of $${Number(entry.amount).toLocaleString()} (${entry.category}) was approved`,
      relatedEntityType: 'cost_entry',
      relatedEntityId: entry.id,
    });

    // Check budget threshold
    await this.checkBudgetThreshold(entry.projectId);

    return saved;
  }

  async reject(id: string, approvedById: string, dto: RejectCostEntryDto): Promise<CostEntryEntity> {
    const entry = await this.findById(id);
    if (entry.status !== CostEntryStatus.SUBMITTED) {
      throw new BadRequestException('Only SUBMITTED entries can be rejected');
    }
    entry.status = CostEntryStatus.REJECTED;
    entry.approvedById = approvedById;
    entry.approvedAt = new Date();
    if (dto.reason) {
      entry.notes = entry.notes ? `${entry.notes}\n\nRejection reason: ${dto.reason}` : `Rejection reason: ${dto.reason}`;
    }
    const saved = await this.costRepo.save(entry);

    await this.notificationsService.create({
      userId: entry.submittedById,
      type: NotificationType.COST_REJECTED,
      title: 'Cost Entry Rejected',
      message: `Your cost entry of $${Number(entry.amount).toLocaleString()} (${entry.category}) was rejected${dto.reason ? `: ${dto.reason}` : ''}`,
      relatedEntityType: 'cost_entry',
      relatedEntityId: entry.id,
    });

    return saved;
  }

  async transfer(id: string, dto: TransferCostEntryDto): Promise<CostEntryEntity> {
    const entry = await this.findById(id);
    const tf = getTenantFilter();
    const targetProject = await this.projectRepo.findOneBy({ id: dto.targetProjectId, ...tf });
    if (!targetProject) throw new NotFoundException(`Target project ${dto.targetProjectId} not found`);

    const sourceProjectId = entry.projectId;
    entry.projectId = dto.targetProjectId;
    entry.taskId = null; // Clear task reference when transferring
    if (dto.reason) {
      const transferNote = `Transferred from project ${sourceProjectId}: ${dto.reason}`;
      entry.notes = entry.notes ? `${entry.notes}\n\n${transferNote}` : transferNote;
    }
    const saved = await this.costRepo.save(entry);

    // Recalculate both projects
    await this.recalculateProjectCost(sourceProjectId);
    await this.recalculateProjectCost(dto.targetProjectId);

    return saved;
  }

  async getCostSummary(projectId: string): Promise<CostSummary> {
    const tf = getTenantFilter();
    const project = await this.projectRepo.findOneBy({ id: projectId, ...tf });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const entries = await this.costRepo.find({
      where: { projectId, status: CostEntryStatus.APPROVED, ...tf },
    });

    const totalCostEntries = entries.reduce((sum, e) => sum + Number(e.amount), 0);

    // Calculate labor cost (per-task rate with project fallback)
    const tasks = await this.taskRepo.find({ where: { projectId, ...tf } });
    const laborCost = tasks.reduce((sum, t) => {
      const rate = Number(t.costRate ?? project.costRate ?? 0);
      return sum + Number(t.actualHours || 0) * rate;
    }, 0);

    const totalActualCost = totalCostEntries + laborCost;
    const totalBudget = Number(project.budget || 0);
    const variance = totalBudget - totalActualCost;
    const burnPercent = totalBudget > 0 ? Math.round((totalActualCost / totalBudget) * 100) : 0;

    // Group by category
    const categoryMap = new Map<string, { count: number; total: number }>();
    for (const e of entries) {
      const existing = categoryMap.get(e.category) || { count: 0, total: 0 };
      existing.count++;
      existing.total += Number(e.amount);
      categoryMap.set(e.category, existing);
    }
    const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category: category as import('@telnub/shared').CostCategory,
      count: data.count,
      total: data.total,
      percentage: totalCostEntries > 0 ? Math.round((data.total / totalCostEntries) * 100) : 0,
    })).sort((a, b) => b.total - a.total);

    // Group by month
    const monthMap = new Map<string, number>();
    for (const e of entries) {
      const month = e.date.substring(0, 7); // YYYY-MM
      monthMap.set(month, (monthMap.get(month) || 0) + Number(e.amount));
    }
    const byMonth = Array.from(monthMap.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalBudget,
      totalCostEntries,
      laborCost,
      totalActualCost,
      variance,
      burnPercent,
      byCategory,
      byMonth,
    };
  }

  async getCostForecast(projectId: string): Promise<CostForecast> {
    const tf = getTenantFilter();
    const project = await this.projectRepo.findOneBy({ id: projectId, ...tf });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const tasks = await this.taskRepo.find({ where: { projectId, ...tf } });

    const totalEstimated = tasks.reduce((sum, t) => sum + Number(t.estimatedHours || 0), 0);
    const totalActual = tasks.reduce((sum, t) => sum + Number(t.actualHours || 0), 0);
    const remainingHours = Math.max(0, totalEstimated - totalActual);
    const costRate = Number(project.costRate || 0);

    // Labor cost using per-task rates with project fallback
    const laborCost = tasks.reduce((sum, t) => {
      const rate = Number(t.costRate ?? costRate);
      return sum + Number(t.actualHours || 0) * rate;
    }, 0);

    // Remaining labor uses weighted average rate from tasks with estimates
    const tasksWithEstimates = tasks.filter((t) => Number(t.estimatedHours || 0) > 0);
    const avgRate = tasksWithEstimates.length > 0
      ? tasksWithEstimates.reduce((s, t) => s + Number(t.costRate ?? costRate), 0) / tasksWithEstimates.length
      : costRate;

    // Non-labor cost from approved cost entries
    const costQb = this.costRepo
      .createQueryBuilder('ce')
      .select('COALESCE(SUM(ce.amount), 0)', 'total')
      .where('ce.projectId = :projectId', { projectId })
      .andWhere('ce.status = :status', { status: CostEntryStatus.APPROVED });
    const forecastTenantId = getCurrentTenantId();
    if (forecastTenantId) {
      costQb.andWhere('ce.tenantId = :tenantId', { tenantId: forecastTenantId });
    }
    const result = await costQb.getRawOne();
    const nonLaborCost = Number(result?.total || 0);

    const actualCost = laborCost + nonLaborCost;
    const budget = Number(project.budget || 0);

    // ETC = remaining hours × average rate (labor portion only; non-labor assumed done)
    const etc = remainingHours * avgRate;
    // EAC = actual cost + ETC
    const eac = actualCost + etc;
    // VAC = budget - EAC
    const vac = budget - eac;
    // CPI = budget / EAC (>1 = under budget, <1 = over budget)
    const cpi = eac > 0 ? Math.round((budget / eac) * 100) / 100 : 0;

    return {
      budget,
      actualCost,
      laborCost,
      eac,
      etc,
      vac,
      cpi,
      remainingHours,
      totalEstimated,
      totalActual,
      projectedOverrun: eac > budget && budget > 0,
      projectedCompletionCost: eac,
    };
  }

  async getBurnData(projectId: string, metric: 'hours' | 'cost'): Promise<BurnChartData> {
    const tf = getTenantFilter();
    const project = await this.projectRepo.findOneBy({ id: projectId, ...tf });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const tasks = await this.taskRepo.find({ where: { projectId, ...tf } });

    const totalEstimated = tasks.reduce((sum, t) => sum + Number(t.estimatedHours || 0), 0);
    const costRate = Number(project.costRate || 0);
    const totalScope = metric === 'hours' ? totalEstimated : totalEstimated * costRate;

    // Build date range from project start to end (or today if ongoing)
    const start = new Date(project.startDate);
    const endRaw = new Date(project.endDate);
    const today = new Date();
    const end = endRaw > today ? endRaw : today;

    // Generate weekly date points
    const dates: string[] = [];
    const ideal: number[] = [];
    const actual: number[] = [];
    const scope: number[] = [];

    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    // Collect completed task data indexed by completion date
    const completedByDate = new Map<string, number>();
    for (const task of tasks) {
      if (task.completedDate) {
        const date = task.completedDate.substring(0, 10);
        const value = metric === 'hours'
          ? Number(task.actualHours || task.estimatedHours || 0)
          : Number(task.actualHours || task.estimatedHours || 0) * costRate;
        completedByDate.set(date, (completedByDate.get(date) || 0) + value);
      }
    }

    // Generate data points (weekly intervals, max ~52 points)
    const interval = Math.max(1, Math.floor(totalDays / 52));
    let cumulativeActual = 0;

    for (let dayOffset = 0; dayOffset <= totalDays; dayOffset += interval) {
      const pointDate = new Date(start);
      pointDate.setDate(pointDate.getDate() + dayOffset);
      const dateStr = pointDate.toISOString().substring(0, 10);

      dates.push(dateStr);

      // Ideal: linear burn-down from total scope to 0
      const progress = dayOffset / totalDays;
      ideal.push(Math.round((totalScope * (1 - progress)) * 100) / 100);

      // Actual: remaining = scope - cumulative completed up to this date
      for (const [completedDate, value] of completedByDate.entries()) {
        if (completedDate <= dateStr) {
          cumulativeActual += value;
          completedByDate.delete(completedDate);
        }
      }
      actual.push(Math.round((totalScope - cumulativeActual) * 100) / 100);

      // Scope line (constant unless scope changes)
      scope.push(totalScope);
    }

    // Ensure the last point is included
    const lastDate = end.toISOString().substring(0, 10);
    if (dates[dates.length - 1] !== lastDate) {
      dates.push(lastDate);
      ideal.push(0);
      for (const [, value] of completedByDate.entries()) {
        cumulativeActual += value;
      }
      actual.push(Math.round((totalScope - cumulativeActual) * 100) / 100);
      scope.push(totalScope);
    }

    return { dates, ideal, actual, scope };
  }

  /** Per-task cost breakdown for an entire project */
  async getTaskCostBreakdowns(projectId: string): Promise<TaskCostBreakdown[]> {
    const tf = getTenantFilter();
    const project = await this.projectRepo.findOneBy({ id: projectId, ...tf });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const projectCostRate = Number(project.costRate || 0);
    const tasks = await this.taskRepo.find({
      where: { projectId, ...tf },
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

  private async recalculateProjectCost(projectId: string): Promise<void> {
    const recalcQb = this.costRepo
      .createQueryBuilder('ce')
      .select('COALESCE(SUM(ce.amount), 0)', 'total')
      .where('ce.projectId = :projectId', { projectId })
      .andWhere('ce.status = :status', { status: CostEntryStatus.APPROVED });
    const recalcTenantId = getCurrentTenantId();
    if (recalcTenantId) {
      recalcQb.andWhere('ce.tenantId = :tenantId', { tenantId: recalcTenantId });
    }
    const result = await recalcQb.getRawOne();

    const nonLaborCost = Number(result?.total || 0);

    // Get labor cost
    const tf = getTenantFilter();
    const tasks = await this.taskRepo.find({ where: { projectId, ...tf } });
    const project = await this.projectRepo.findOneBy({ id: projectId, ...tf });
    if (!project) return;

    const totalHours = tasks.reduce((sum, t) => sum + Number(t.actualHours || 0), 0);
    const laborCost = tasks.reduce((sum, t) => {
      const rate = Number(t.costRate ?? project.costRate ?? 0);
      return sum + Number(t.actualHours || 0) * rate;
    }, 0);

    project.actualCost = nonLaborCost + laborCost;
    await this.projectRepo.save(project);
  }

  private async checkBudgetThreshold(projectId: string): Promise<void> {
    const project = await this.projectRepo.findOneBy({ id: projectId, ...getTenantFilter() });
    if (!project || Number(project.budget) === 0) return;

    const budget = Number(project.budget);
    const actual = Number(project.actualCost);
    const ratio = actual / budget;

    if (ratio >= 0.8) {
      const pct = Math.round(ratio * 100);
      await this.notificationsService.create({
        userId: project.projectLeadId,
        type: NotificationType.BUDGET_THRESHOLD,
        title: 'Budget Threshold Alert',
        message: `Project "${project.name}" has reached ${pct}% of budget ($${actual.toLocaleString()} of $${budget.toLocaleString()})`,
        relatedEntityType: 'project',
        relatedEntityId: projectId,
      });
    }
  }
}
