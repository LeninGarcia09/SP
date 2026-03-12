import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from './project.entity';
import { CreateProjectDto, UpdateProjectDto } from '@bizops/shared';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
  ) {}

  findAll() {
    return this.projectRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string) {
    const project = await this.projectRepo.findOneBy({ id });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  create(dto: CreateProjectDto, createdBy: string) {
    const code = `PROJ-${Date.now()}`; // TODO: sequential code generation
    const entity = this.projectRepo.create({ ...dto, code, createdBy });
    return this.projectRepo.save(entity);
  }

  async update(id: string, dto: UpdateProjectDto) {
    const project = await this.findById(id);
    Object.assign(project, dto);
    return this.projectRepo.save(project);
  }

  async softDelete(id: string) {
    const project = await this.findById(id);
    project.status = 'CANCELLED' as never;
    return this.projectRepo.save(project);
  }
}
