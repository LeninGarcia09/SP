import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectHealthSnapshotEntity } from './health-snapshot.entity';
import { ProjectEntity } from '../projects/project.entity';
import { TaskEntity } from '../tasks/task.entity';
import { RagEngine } from './rag.engine';

@Injectable()
export class HealthService {
  constructor(
    @InjectRepository(ProjectHealthSnapshotEntity)
    private readonly snapshotRepo: Repository<ProjectHealthSnapshotEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,
    private readonly ragEngine: RagEngine,
  ) {}

  async getHistory(projectId: string): Promise<ProjectHealthSnapshotEntity[]> {
    return this.snapshotRepo.find({
      where: { projectId },
      order: { snapshotDate: 'DESC' },
    });
  }

  async triggerCalculation(projectId: string): Promise<ProjectHealthSnapshotEntity> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const tasks = await this.taskRepo.find({ where: { projectId } });
    const result = this.ragEngine.calculate(project, tasks);

    const snapshot = this.snapshotRepo.create({
      projectId,
      snapshotDate: new Date().toISOString().split('T')[0],
      ...result,
      autoCalculated: true,
    });

    return this.snapshotRepo.save(snapshot);
  }

  async override(
    projectId: string,
    overallRag: string,
    overrideReason: string,
    overrideBy: string,
    userRole: string,
  ): Promise<ProjectHealthSnapshotEntity> {
    // Only ADMIN and OPERATIONS_DIRECTOR can override
    const allowedRoles = ['ADMIN', 'OPERATIONS_DIRECTOR'];
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException('Only ADMIN and OPERATIONS_DIRECTOR can override RAG');
    }

    if (!overrideReason || overrideReason.length < 20) {
      throw new ForbiddenException('Override reason must be at least 20 characters');
    }

    const snapshot = this.snapshotRepo.create({
      projectId,
      snapshotDate: new Date().toISOString().split('T')[0],
      overallRag,
      scheduleRag: 'GRAY', // sub-RAGs not meaningful for manual override
      budgetRag: 'GRAY',
      autoCalculated: false,
      overrideReason,
      overrideBy,
    });

    return this.snapshotRepo.save(snapshot);
  }
}
