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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@bizops/shared';

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

  @Post()
  @Roles(UserRole.GLOBAL_LEAD, UserRole.PROJECT_LEAD)
  async create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    const data = await this.tasksService.create(projectId, dto);
    return { data };
  }

  @Patch(':id')
  @Roles(UserRole.GLOBAL_LEAD, UserRole.PROJECT_LEAD, UserRole.PROJECT_PERSONNEL)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    const data = await this.tasksService.update(id, dto);
    return { data };
  }

  @Delete(':id')
  @Roles(UserRole.GLOBAL_LEAD)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.tasksService.remove(id);
    return { data: null };
  }
}
