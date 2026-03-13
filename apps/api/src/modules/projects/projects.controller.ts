import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { AddProjectMemberDto, UpdateProjectMemberDto } from './dto/project-member.dto';
import { CreateProjectNoteDto, UpdateProjectNoteDto } from './dto/project-note.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@bizops/shared';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async findAll(@Query() query: PaginationDto) {
    return this.projectsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.projectsService.findById(id);
    return { data };
  }

  @Post()
  @Roles(UserRole.GLOBAL_LEAD, UserRole.PROJECT_LEAD)
  async create(
    @Body() dto: CreateProjectDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.projectsService.create(dto, req.user.sub);
    return { data };
  }

  @Patch(':id')
  @Roles(UserRole.GLOBAL_LEAD, UserRole.PROJECT_LEAD)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    const data = await this.projectsService.update(id, dto);
    return { data };
  }

  @Delete(':id')
  @Roles(UserRole.GLOBAL_LEAD, UserRole.PROJECT_LEAD)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.projectsService.softDelete(id);
    return { data };
  }

  // ─── Members ───

  @Get(':id/members')
  async findMembers(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.projectsService.findMembers(id);
    return { data };
  }

  @Post(':id/members')
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.PROJECT_LEAD)
  async addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddProjectMemberDto,
  ) {
    const data = await this.projectsService.addMember(id, dto);
    return { data };
  }

  @Patch('members/:memberId')
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.PROJECT_LEAD)
  async updateMember(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateProjectMemberDto,
  ) {
    const data = await this.projectsService.updateMemberRole(memberId, dto);
    return { data };
  }

  @Delete('members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.PROJECT_LEAD)
  async removeMember(@Param('memberId', ParseUUIDPipe) memberId: string) {
    await this.projectsService.removeMember(memberId);
  }

  // ─── Notes ───

  @Get(':id/notes')
  async findNotes(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.projectsService.findNotes(id);
    return { data };
  }

  @Post(':id/notes')
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.PROJECT_LEAD, UserRole.PROJECT_PERSONNEL)
  async createNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProjectNoteDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.projectsService.createNote(id, dto, req.user.sub);
    return { data };
  }

  @Patch('notes/:noteId')
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.PROJECT_LEAD, UserRole.PROJECT_PERSONNEL)
  async updateNote(
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Body() dto: UpdateProjectNoteDto,
  ) {
    const data = await this.projectsService.updateNote(noteId, dto);
    return { data };
  }

  @Delete('notes/:noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.PROJECT_LEAD)
  async deleteNote(@Param('noteId', ParseUUIDPipe) noteId: string) {
    await this.projectsService.deleteNote(noteId);
  }
}
