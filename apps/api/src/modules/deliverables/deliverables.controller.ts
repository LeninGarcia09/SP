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
import { DeliverablesService } from './deliverables.service';
import { CreateDeliverableDto, UpdateDeliverableDto } from './dto/deliverable.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@bizops/shared';

@ApiTags('Deliverables')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('projects/:projectId/deliverables')
export class DeliverablesController {
  constructor(private readonly deliverablesService: DeliverablesService) {}

  @Get()
  async findByProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    const data = await this.deliverablesService.findByProject(projectId);
    return { data };
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.deliverablesService.findById(id);
    return { data };
  }

  @Get(':id/task-costs')
  async getTaskCosts(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.deliverablesService.getTaskCosts(id);
    return { data };
  }

  @Post()
  @Roles(UserRole.GLOBAL_LEAD, UserRole.PROJECT_LEAD)
  async create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateDeliverableDto,
  ) {
    const data = await this.deliverablesService.create(projectId, dto);
    return { data };
  }

  @Patch(':id')
  @Roles(UserRole.GLOBAL_LEAD, UserRole.PROJECT_LEAD)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeliverableDto,
  ) {
    const data = await this.deliverablesService.update(id, dto);
    return { data };
  }

  @Delete(':id')
  @Roles(UserRole.GLOBAL_LEAD)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deliverablesService.remove(id);
    return { data: null };
  }
}
