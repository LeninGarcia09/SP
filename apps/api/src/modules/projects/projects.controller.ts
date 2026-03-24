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
import { UserRole } from '@telnub/shared';

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

  @Get('deleted')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR)
  async findDeleted() {
    const data = await this.projectsService.findDeleted();
    return { data };
  }

  @Patch('deleted/:id/restore')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR)
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.projectsService.restore(id);
    return { data };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.projectsService.findById(id);
    return { data };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  async create(
    @Body() dto: CreateProjectDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.projectsService.create(dto, req.user.sub);
    return { data };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    const data = await this.projectsService.update(id, dto);
    return { data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
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
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.PROJECT_MANAGER)
  async addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddProjectMemberDto,
  ) {
    const data = await this.projectsService.addMember(id, dto);
    return { data };
  }

  @Patch('members/:memberId')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.PROJECT_MANAGER)
  async updateMember(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateProjectMemberDto,
  ) {
    const data = await this.projectsService.updateMemberRole(memberId, dto);
    return { data };
  }

  @Delete('members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.PROJECT_MANAGER)
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
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER)
  async createNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProjectNoteDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.projectsService.createNote(id, dto, req.user.sub);
    return { data };
  }

  @Patch('notes/:noteId')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER)
  async updateNote(
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Body() dto: UpdateProjectNoteDto,
  ) {
    const data = await this.projectsService.updateNote(noteId, dto);
    return { data };
  }

  @Delete('notes/:noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.PROJECT_MANAGER)
  async deleteNote(@Param('noteId', ParseUUIDPipe) noteId: string) {
    await this.projectsService.deleteNote(noteId);
  }

  // ─── Hours Summary ───

  @Get(':id/hours-summary')
  async getHoursSummary(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.projectsService.getHoursSummary(id);
    return { data };
  }
}
