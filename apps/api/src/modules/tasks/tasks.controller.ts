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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, CreateTaskCommentDto } from './dto/task.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@telnub/shared';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async findByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: PaginationDto,
  ) {
    return this.tasksService.findByProject(projectId, query);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.tasksService.findById(id);
    return { data };
  }

  @Get(':id/activities')
  async getActivities(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.tasksService.getActivities(id);
    return { data };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  async create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateTaskDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.tasksService.create(projectId, dto, req.user.sub);
    return { data };
  }

  @Post(':id/comments')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER)
  async addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTaskCommentDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.tasksService.addComment(id, req.user.sub, dto.comment);
    return { data };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.tasksService.update(id, dto, req.user.sub);
    return { data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { sub: string } },
  ) {
    await this.tasksService.remove(id, req.user.sub);
    return { data: null };
  }
}
