import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity } from './task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,
  ) {}

  async findByProject(projectId: string): Promise<TaskEntity[]> {
    return this.taskRepo.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<TaskEntity> {
    const task = await this.taskRepo.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }

  async create(projectId: string, data: Partial<TaskEntity>): Promise<TaskEntity> {
    const task = this.taskRepo.create({ ...data, projectId });
    return this.taskRepo.save(task);
  }

  async update(id: string, data: Partial<TaskEntity>): Promise<TaskEntity> {
    const task = await this.findById(id);
    Object.assign(task, data);
    return this.taskRepo.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findById(id);
    await this.taskRepo.remove(task);
  }
}
