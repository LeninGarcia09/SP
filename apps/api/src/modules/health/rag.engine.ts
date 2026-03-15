import { Injectable } from '@nestjs/common';
import { TaskEntity } from '../tasks/task.entity';
import { ProjectEntity } from '../projects/project.entity';

interface RagResult {
  scheduleRag: string;
  budgetRag: string;
  overallRag: string;
}

/**
 * Server-side RAG calculation engine.
 * Clients NEVER calculate or set RAG directly.
 *
 * Schedule RAG:
 *   GREEN  → < 5% tasks overdue
 *   AMBER  → 5–20% tasks overdue OR any CRITICAL task overdue
 *   RED    → > 20% tasks overdue OR project end date passed with status ACTIVE
 *   BLUE   → All tasks DONE, project marked COMPLETED
 *   GRAY   → Project in PLANNING status (not yet started)
 *
 * Budget RAG:
 *   GREEN  → actual spend ≤ 90% of budget
 *   AMBER  → actual spend 90–100% of budget
 *   RED    → actual spend > 100% of budget
 *   GRAY   → no budget set
 *
 * Overall RAG = worst of all active sub-RAGs
 */
@Injectable()
export class RagEngine {
  calculate(project: ProjectEntity, tasks: TaskEntity[]): RagResult {
    const scheduleRag = this.calculateScheduleRag(project, tasks);
    const budgetRag = this.calculateBudgetRag(project, tasks);
    const overallRag = this.worstOf(scheduleRag, budgetRag);

    return { scheduleRag, budgetRag, overallRag };
  }

  private calculateScheduleRag(project: ProjectEntity, tasks: TaskEntity[]): string {
    if (project.status === 'PLANNING') return 'GRAY';
    if (project.status === 'COMPLETED') {
      const allDone = tasks.length === 0 || tasks.every((t) => t.status === 'DONE');
      if (allDone) return 'BLUE';
    }

    const now = new Date();

    // Check if project end date has passed while still ACTIVE
    if (project.status === 'ACTIVE' && project.endDate) {
      const endDate = new Date(project.endDate);
      if (now > endDate) return 'RED';
    }

    if (tasks.length === 0) return 'GREEN';

    const overdueTasks = tasks.filter((t) => {
      if (t.status === 'DONE') return false;
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < now;
    });

    const overduePercent = overdueTasks.length / tasks.length;

    // Any CRITICAL task overdue → at least AMBER
    const criticalOverdue = overdueTasks.some((t) => t.priority === 'CRITICAL');

    if (overduePercent > 0.2) return 'RED';
    if (overduePercent >= 0.05 || criticalOverdue) return 'AMBER';
    return 'GREEN';
  }

  private calculateBudgetRag(project: ProjectEntity, tasks: TaskEntity[]): string {
    if (!project.budget || Number(project.budget) === 0) return 'GRAY';

    const budget = Number(project.budget);
    const costRate = Number(project.costRate || 0);

    let actualSpend: number;
    if (Number(project.actualCost) > 0) {
      // Use explicitly tracked actual cost
      actualSpend = Number(project.actualCost);
    } else if (costRate > 0) {
      // Derive cost from task hours * costRate
      const totalHours = tasks.reduce((sum, t) => sum + Number(t.actualHours || 0), 0);
      actualSpend = totalHours * costRate;
    } else {
      // No cost data available
      return 'GRAY';
    }

    const spendRatio = actualSpend / budget;

    if (spendRatio > 1.0) return 'RED';
    if (spendRatio >= 0.9) return 'AMBER';
    return 'GREEN';
  }

  private worstOf(...rags: string[]): string {
    const severity: Record<string, number> = {
      RED: 4,
      AMBER: 3,
      GREEN: 2,
      BLUE: 1,
      GRAY: 0,
    };

    let worst = 'GRAY';
    let worstScore = 0;

    for (const rag of rags) {
      const score = severity[rag] ?? 0;
      if (score > worstScore) {
        worstScore = score;
        worst = rag;
      }
    }

    return worst;
  }
}
