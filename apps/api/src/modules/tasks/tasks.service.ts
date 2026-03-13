import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { TaskEntity } from './task.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,
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

  async create(projectId: string, dto: CreateTaskDto): Promise<TaskEntity> {
    const task = this.taskRepo.create({ ...dto, projectId });
    return this.taskRepo.save(task);
  }

  async update(id: string, dto: UpdateTaskDto): Promise<TaskEntity> {
    const task = await this.findById(id);
    Object.assign(task, dto);
    return this.taskRepo.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findById(id);
    await this.taskRepo.remove(task);
  }
}
