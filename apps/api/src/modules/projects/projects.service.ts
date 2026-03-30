import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, Not, Repository } from 'typeorm';
import { ProjectEntity } from './project.entity';
import { ProjectMemberEntity } from './project-member.entity';
import { ProjectNoteEntity } from './project-note.entity';
import { TaskEntity } from '../tasks/task.entity';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { AddProjectMemberDto, UpdateProjectMemberDto } from './dto/project-member.dto';
import { CreateProjectNoteDto, UpdateProjectNoteDto } from './dto/project-note.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { getTenantFilter, getCurrentTenantId } from '../../common/tenant/tenant.context';
import type { ProjectHoursSummary } from '@telnub/shared';

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
    const tf = getTenantFilter();

    const where = search
      ? [
          { name: ILike(`%${search}%`), ...tf },
          { code: ILike(`%${search}%`), ...tf },
        ]
      : Object.keys(tf).length > 0 ? [tf] : undefined;

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
    const tf = getTenantFilter();
    const project = await this.projectRepo.findOneBy({ id, ...tf });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async create(dto: CreateProjectDto, createdBy: string): Promise<ProjectEntity> {
    // Sequential code: PROJ-YYYY-NNN (use MAX to avoid collisions after deletions)
    const year = new Date().getFullYear();
    const prefix = `PROJ-${year}-`;
    const result = await this.projectRepo
      .createQueryBuilder('p')
      .withDeleted()
      .select('MAX(p.code)', 'maxCode')
      .where('p.code LIKE :prefix', { prefix: `${prefix}%` })
      .getRawOne();
    const lastNum = result?.maxCode ? parseInt(result.maxCode.replace(prefix, ''), 10) : 0;
    const code = `${prefix}${String(lastNum + 1).padStart(3, '0')}`;
    const projectLeadId = dto.projectLeadId ?? createdBy;
    const entity = this.projectRepo.create({ ...dto, code, createdBy, projectLeadId, tenantId: getCurrentTenantId() });
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

  async findDeleted(): Promise<ProjectEntity[]> {
    const tf = getTenantFilter();
    return this.projectRepo.find({
      withDeleted: true,
      where: { deletedAt: Not(IsNull()), ...tf },
      order: { deletedAt: 'DESC' },
    });
  }

  async restore(id: string): Promise<ProjectEntity> {
    const tf = getTenantFilter();
    const project = await this.projectRepo.findOne({
      where: { id, ...tf },
      withDeleted: true,
    });
    if (!project || !project.deletedAt) {
      throw new NotFoundException(`Deleted project ${id} not found`);
    }
    return this.projectRepo.recover(project);
  }

  // ─── Members ───

  async findMembers(projectId: string): Promise<ProjectMemberEntity[]> {
    await this.findById(projectId); // ensure project exists + tenant check
    const tf = getTenantFilter();
    return this.memberRepo.find({ where: { projectId, ...tf }, order: { joinedAt: 'DESC' } });
  }

  async addMember(projectId: string, dto: AddProjectMemberDto): Promise<ProjectMemberEntity> {
    await this.findById(projectId);
    const existing = await this.memberRepo.findOneBy({ projectId, userId: dto.userId, ...getTenantFilter() });
    if (existing) throw new ConflictException('User is already a member of this project');
    const entity = this.memberRepo.create({ projectId, ...dto, tenantId: getCurrentTenantId() });
    return this.memberRepo.save(entity);
  }

  async updateMemberRole(memberId: string, dto: UpdateProjectMemberDto): Promise<ProjectMemberEntity> {
    const tf = getTenantFilter();
    const member = await this.memberRepo.findOneBy({ id: memberId, ...tf });
    if (!member) throw new NotFoundException(`Member ${memberId} not found`);
    member.role = dto.role;
    return this.memberRepo.save(member);
  }

  async removeMember(memberId: string): Promise<void> {
    const tf = getTenantFilter();
    const member = await this.memberRepo.findOneBy({ id: memberId, ...tf });
    if (!member) throw new NotFoundException(`Member ${memberId} not found`);
    await this.memberRepo.remove(member);
  }

  // ─── Notes ───

  async findNotes(projectId: string): Promise<ProjectNoteEntity[]> {
    await this.findById(projectId);
    const tf = getTenantFilter();
    return this.noteRepo.find({
      where: { projectId, ...tf },
      order: { isPinned: 'DESC', createdAt: 'DESC' },
    });
  }

  async createNote(projectId: string, dto: CreateProjectNoteDto, authorId: string): Promise<ProjectNoteEntity> {
    await this.findById(projectId);
    const entity = this.noteRepo.create({ projectId, authorId, ...dto, tenantId: getCurrentTenantId() });
    return this.noteRepo.save(entity);
  }

  async updateNote(noteId: string, dto: UpdateProjectNoteDto): Promise<ProjectNoteEntity> {
    const tf = getTenantFilter();
    const note = await this.noteRepo.findOneBy({ id: noteId, ...tf });
    if (!note) throw new NotFoundException(`Note ${noteId} not found`);
    Object.assign(note, dto);
    return this.noteRepo.save(note);
  }

  async deleteNote(noteId: string): Promise<void> {
    const tf = getTenantFilter();
    const note = await this.noteRepo.findOneBy({ id: noteId, ...tf });
    if (!note) throw new NotFoundException(`Note ${noteId} not found`);
    await this.noteRepo.remove(note);
  }

  // ─── Hours Summary ───

  async getHoursSummary(projectId: string): Promise<ProjectHoursSummary> {
    const project = await this.findById(projectId);
    const tasks = await this.taskRepo.find({ where: { projectId, ...getTenantFilter() } });

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
