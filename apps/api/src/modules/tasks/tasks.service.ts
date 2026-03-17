import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { And, ILike, IsNull, LessThan, Not, Repository } from 'typeorm';
import { TaskEntity } from './task.entity';
import { TaskActivityEntity } from './task-activity.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectsService } from '../projects/projects.service';
import { NotificationType, ProjectMemberRole, TaskActivityType, TaskStatus } from '@bizops/shared';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,
    @InjectRepository(TaskActivityEntity)
    private readonly activityRepo: Repository<TaskActivityEntity>,
    private readonly notificationsService: NotificationsService,
    private readonly projectsService: ProjectsService,
  ) {}

  async findByProject(
    projectId: string,
    query: PaginationDto,
  ): Promise<PaginatedResult<TaskEntity>> {
    const { page, limit, sortBy, order, search } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown>[] = search
      ? [{ projectId, title: ILike(`%${search}%`) }]
      : [{ projectId }];

    const [data, total] = await this.taskRepo.findAndCount({
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

  async findById(id: string): Promise<TaskEntity> {
    const task = await this.taskRepo.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }

  async create(
    projectId: string,
    dto: CreateTaskDto,
    userId: string,
  ): Promise<TaskEntity> {
    const task = this.taskRepo.create({ ...dto, projectId, createdById: userId });
    const saved = await this.taskRepo.save(task);

    // Log creation activity
    await this.logActivity(saved.id, userId, TaskActivityType.CREATED, null, null, saved.title);

    // Notify assignee if assigned at creation
    if (saved.assigneeId) {
      await this.notifyAssignment(saved, userId);
      await this.ensureProjectMember(projectId, saved.assigneeId);
    }

    return saved;
  }

  async update(
    id: string,
    dto: UpdateTaskDto,
    userId: string,
  ): Promise<TaskEntity> {
    const task = await this.findById(id);
    const oldTask = { ...task };

    Object.assign(task, dto);

    // Auto-set completedDate when status changes to DONE
    if (dto.status === TaskStatus.DONE && oldTask.status !== TaskStatus.DONE) {
      task.completedDate = new Date().toISOString().split('T')[0] ?? null;
    } else if (dto.status && dto.status !== TaskStatus.DONE && oldTask.status === TaskStatus.DONE) {
      task.completedDate = null;
    }

    const saved = await this.taskRepo.save(task);

    // Track specific field changes
    await this.trackChanges(saved, oldTask, userId);

    // Auto-add new assignee as project member
    if (saved.assigneeId && saved.assigneeId !== oldTask.assigneeId) {
      await this.ensureProjectMember(saved.projectId, saved.assigneeId);
    }

    return saved;
  }

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.findById(id);
    await this.taskRepo.remove(task);
  }

  // ─── Activity Log ───

  async getActivities(taskId: string): Promise<TaskActivityEntity[]> {
    return this.activityRepo.find({
      where: { taskId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async addComment(
    taskId: string,
    userId: string,
    comment: string,
  ): Promise<TaskActivityEntity> {
    const task = await this.findById(taskId);

    const activity = await this.logActivity(
      taskId,
      userId,
      TaskActivityType.COMMENT_ADDED,
      null,
      null,
      null,
      comment,
    );

    // Notify task creator and assignee about the comment
    const recipients = new Set<string>();
    if (task.createdById && task.createdById !== userId) recipients.add(task.createdById);
    if (task.assigneeId && task.assigneeId !== userId) recipients.add(task.assigneeId);

    for (const recipientId of recipients) {
      await this.notificationsService.create({
        userId: recipientId,
        type: NotificationType.TASK_COMMENT,
        title: `Comment on: ${task.title}`,
        message: comment.length > 200 ? comment.slice(0, 197) + '...' : comment,
        relatedEntityType: 'TASK',
        relatedEntityId: task.id,
      });
    }

    return activity;
  }

  // ─── Overdue Check ───

  async findOverdueTasks(): Promise<TaskEntity[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.taskRepo.find({
      where: {
        dueDate: And(Not(IsNull()), LessThan(today)),
        status: Not(TaskStatus.DONE),
      },
    });
  }

  // ─── Private Helpers ───

  private async logActivity(
    taskId: string,
    userId: string,
    activityType: TaskActivityType,
    field: string | null,
    oldValue: string | null,
    newValue: string | null,
    comment?: string | null,
  ): Promise<TaskActivityEntity> {
    const activity = this.activityRepo.create({
      taskId,
      userId,
      activityType,
      field,
      oldValue,
      newValue,
      comment: comment ?? null,
    });
    return this.activityRepo.save(activity);
  }

  private async trackChanges(
    newTask: TaskEntity,
    oldTask: TaskEntity,
    userId: string,
  ): Promise<void> {
    // Status change
    if (newTask.status !== oldTask.status) {
      await this.logActivity(
        newTask.id, userId, TaskActivityType.STATUS_CHANGED,
        'status', oldTask.status, newTask.status,
      );

      // Notify task creator about status change
      if (newTask.createdById && newTask.createdById !== userId) {
        await this.notificationsService.create({
          userId: newTask.createdById,
          type: NotificationType.TASK_STATUS_CHANGED,
          title: `Task status: ${newTask.title}`,
          message: `Status changed from ${oldTask.status} to ${newTask.status}`,
          relatedEntityType: 'TASK',
          relatedEntityId: newTask.id,
        });
      }

      // Notify assignee about status change (if different from updater and creator)
      if (newTask.assigneeId && newTask.assigneeId !== userId && newTask.assigneeId !== newTask.createdById) {
        await this.notificationsService.create({
          userId: newTask.assigneeId,
          type: NotificationType.TASK_STATUS_CHANGED,
          title: `Task status: ${newTask.title}`,
          message: `Status changed from ${oldTask.status} to ${newTask.status}`,
          relatedEntityType: 'TASK',
          relatedEntityId: newTask.id,
        });
      }
    }

    // Assignment change
    if (newTask.assigneeId !== oldTask.assigneeId) {
      if (oldTask.assigneeId && !newTask.assigneeId) {
        await this.logActivity(
          newTask.id, userId, TaskActivityType.UNASSIGNED,
          'assigneeId', oldTask.assigneeId, null,
        );
      } else {
        await this.logActivity(
          newTask.id, userId, TaskActivityType.ASSIGNED,
          'assigneeId', oldTask.assigneeId, newTask.assigneeId,
        );
      }

      // Notify new assignee
      if (newTask.assigneeId && newTask.assigneeId !== userId) {
        await this.notifyAssignment(newTask, userId);
      }
    }

    // Priority change
    if (newTask.priority !== oldTask.priority) {
      await this.logActivity(
        newTask.id, userId, TaskActivityType.PRIORITY_CHANGED,
        'priority', oldTask.priority, newTask.priority,
      );
    }

    // Due date change
    if (newTask.dueDate !== oldTask.dueDate) {
      await this.logActivity(
        newTask.id, userId, TaskActivityType.DUE_DATE_CHANGED,
        'dueDate', oldTask.dueDate, newTask.dueDate,
      );
    }

    // Start date change
    if (newTask.startDate !== oldTask.startDate) {
      await this.logActivity(
        newTask.id, userId, TaskActivityType.UPDATED,
        'startDate', oldTask.startDate, newTask.startDate,
      );
    }

    // Generic field changes (title, description, hours)
    const genericFields = ['title', 'description', 'estimatedHours', 'actualHours'] as const;
    for (const field of genericFields) {
      const oldVal = String(oldTask[field] ?? '');
      const newVal = String(newTask[field] ?? '');
      if (oldVal !== newVal) {
        await this.logActivity(
          newTask.id, userId, TaskActivityType.UPDATED,
          field, oldVal, newVal,
        );
      }
    }
  }

  private async notifyAssignment(task: TaskEntity, assignedByUserId: string): Promise<void> {
    if (!task.assigneeId || task.assigneeId === assignedByUserId) return;
    await this.notificationsService.create({
      userId: task.assigneeId,
      type: NotificationType.TASK_ASSIGNED,
      title: `Assigned: ${task.title}`,
      message: `You have been assigned to task "${task.title}"`,
      relatedEntityType: 'TASK',
      relatedEntityId: task.id,
    });
  }

  private async ensureProjectMember(projectId: string, userId: string): Promise<void> {
    try {
      await this.projectsService.addMember(projectId, {
        userId,
        role: ProjectMemberRole.MEMBER,
      });
    } catch {
      // ConflictException means user is already a member — that's fine
    }
  }
}
