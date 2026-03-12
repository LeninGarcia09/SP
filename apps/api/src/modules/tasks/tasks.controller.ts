import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { TaskEntity } from './task.entity';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findByProject(@Param('projectId', ParseUUIDPipe) projectId: string): Promise<TaskEntity[]> {
    return this.tasksService.findByProject(projectId);
  }

  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string): Promise<TaskEntity> {
    return this.tasksService.findById(id);
  }

  @Post()
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() body: Partial<TaskEntity>,
  ): Promise<TaskEntity> {
    return this.tasksService.create(projectId, body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<TaskEntity>,
  ): Promise<TaskEntity> {
    return this.tasksService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.tasksService.remove(id);
  }
}
