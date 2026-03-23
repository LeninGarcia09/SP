import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { ProjectEntity } from './project.entity';
import { ProjectMemberEntity } from './project-member.entity';
import { ProjectNoteEntity } from './project-note.entity';
import { TaskEntity } from '../tasks/task.entity';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { AddProjectMemberDto, UpdateProjectMemberDto } from './dto/project-member.dto';
import { CreateProjectNoteDto, UpdateProjectNoteDto } from './dto/project-note.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import type { ProjectHoursSummary } from '@bizops/shared';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(ProjectMemberEntity)
    private readonly memberRepo: Repository<ProjectMemberEntity>,
    @InjectRepository(ProjectNoteEntity)
    private readonly noteRepo: Repository<ProjectNoteEntity>,
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,
  ) {}

  async findAll(query: PaginationDto): Promise<PaginatedResult<ProjectEntity>> {
    const { page, limit, sortBy, order, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? [
          { name: ILike(`%${search}%`) },
          { code: ILike(`%${search}%`) },
        ]
      : undefined;

    const [data, total] = await this.projectRepo.findAndCount({
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

  async findById(id: string): Promise<ProjectEntity> {
    const project = await this.projectRepo.findOneBy({ id });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async create(dto: CreateProjectDto, createdBy: string): Promise<ProjectEntity> {
    // Sequential code: PROJ-YYYY-NNN (include soft-deleted to avoid code collisions)
    const year = new Date().getFullYear();
    const count = await this.projectRepo.count({ withDeleted: true });
    const code = `PROJ-${year}-${String(count + 1).padStart(3, '0')}`;
    const projectLeadId = dto.projectLeadId ?? createdBy;
    const entity = this.projectRepo.create({ ...dto, code, createdBy, projectLeadId });
    return this.projectRepo.save(entity);
  }

  async update(id: string, dto: UpdateProjectDto): Promise<ProjectEntity> {
    const project = await this.findById(id);
    Object.assign(project, dto);
    return this.projectRepo.save(project);
  }

  async softDelete(id: string): Promise<ProjectEntity> {
    const project = await this.findById(id);
    return this.projectRepo.softRemove(project);
  }

  // ─── Members ───

  async findMembers(projectId: string): Promise<ProjectMemberEntity[]> {
    await this.findById(projectId); // ensure project exists
    return this.memberRepo.find({ where: { projectId }, order: { joinedAt: 'DESC' } });
  }

  async addMember(projectId: string, dto: AddProjectMemberDto): Promise<ProjectMemberEntity> {
    await this.findById(projectId);
    const existing = await this.memberRepo.findOneBy({ projectId, userId: dto.userId });
    if (existing) throw new ConflictException('User is already a member of this project');
    const entity = this.memberRepo.create({ projectId, ...dto });
    return this.memberRepo.save(entity);
  }

  async updateMemberRole(memberId: string, dto: UpdateProjectMemberDto): Promise<ProjectMemberEntity> {
    const member = await this.memberRepo.findOneBy({ id: memberId });
    if (!member) throw new NotFoundException(`Member ${memberId} not found`);
    member.role = dto.role;
    return this.memberRepo.save(member);
  }

  async removeMember(memberId: string): Promise<void> {
    const member = await this.memberRepo.findOneBy({ id: memberId });
    if (!member) throw new NotFoundException(`Member ${memberId} not found`);
    await this.memberRepo.remove(member);
  }

  // ─── Notes ───

  async findNotes(projectId: string): Promise<ProjectNoteEntity[]> {
    await this.findById(projectId);
    return this.noteRepo.find({
      where: { projectId },
      order: { isPinned: 'DESC', createdAt: 'DESC' },
    });
  }

  async createNote(projectId: string, dto: CreateProjectNoteDto, authorId: string): Promise<ProjectNoteEntity> {
    await this.findById(projectId);
    const entity = this.noteRepo.create({ projectId, authorId, ...dto });
    return this.noteRepo.save(entity);
  }

  async updateNote(noteId: string, dto: UpdateProjectNoteDto): Promise<ProjectNoteEntity> {
    const note = await this.noteRepo.findOneBy({ id: noteId });
    if (!note) throw new NotFoundException(`Note ${noteId} not found`);
    Object.assign(note, dto);
    return this.noteRepo.save(note);
  }

  async deleteNote(noteId: string): Promise<void> {
    const note = await this.noteRepo.findOneBy({ id: noteId });
    if (!note) throw new NotFoundException(`Note ${noteId} not found`);
    await this.noteRepo.remove(note);
  }

  // ─── Hours Summary ───

  async getHoursSummary(projectId: string): Promise<ProjectHoursSummary> {
    const project = await this.findById(projectId);
    const tasks = await this.taskRepo.find({ where: { projectId } });

    let totalEstimatedHours = 0;
    let totalActualHours = 0;
    let tasksWithEstimates = 0;
    let tasksWithActuals = 0;

    for (const task of tasks) {
      const est = Number(task.estimatedHours) || 0;
      const act = Number(task.actualHours) || 0;
      totalEstimatedHours += est;
      totalActualHours += act;
      if (est > 0) tasksWithEstimates++;
      if (act > 0) tasksWithActuals++;
    }

    const variance = totalEstimatedHours - totalActualHours;
    const completionPercent = totalEstimatedHours > 0
      ? Math.round((totalActualHours / totalEstimatedHours) * 100)
      : 0;
    const costRate = Number(project.costRate) || 0;
    const laborCost = totalActualHours * costRate;

    return {
      totalEstimatedHours,
      totalActualHours,
      variance,
      completionPercent,
      taskCount: tasks.length,
      tasksWithEstimates,
      tasksWithActuals,
      laborCost,
    };
  }
}
