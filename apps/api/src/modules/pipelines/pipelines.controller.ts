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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PipelinesService } from './pipelines.service';
import {
  CreatePipelineDto,
  UpdatePipelineDto,
  CreatePipelineStageDto,
  UpdatePipelineStageDto,
} from './dto/pipeline.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@telnub/shared';

@ApiTags('Pipelines')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('pipelines')
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  // ── Pipelines ──

  @Get()
  async findAll(@Query() query: PaginationDto) {
    return this.pipelinesService.findAllPipelines(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.pipelinesService.findPipelineById(id);
    return { data };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR)
  async create(
    @Body() dto: CreatePipelineDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.pipelinesService.createPipeline(dto, req.user.sub);
    return { data };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePipelineDto,
  ) {
    const data = await this.pipelinesService.updatePipeline(id, dto);
    return { data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.pipelinesService.softDeletePipeline(id);
    return { data };
  }

  // ── Pipeline Stages ──

  @Get(':id/stages')
  async findStages(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.pipelinesService.findStagesByPipelineId(id);
    return { data };
  }

  @Post(':id/stages')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR)
  async createStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePipelineStageDto,
  ) {
    const data = await this.pipelinesService.createStage(id, dto);
    return { data };
  }

  @Patch('stages/:stageId')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR)
  async updateStage(
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @Body() dto: UpdatePipelineStageDto,
  ) {
    const data = await this.pipelinesService.updateStage(stageId, dto);
    return { data };
  }

  @Delete('stages/:stageId')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR)
  async removeStage(@Param('stageId', ParseUUIDPipe) stageId: string) {
    await this.pipelinesService.deleteStage(stageId);
    return { data: { deleted: true } };
  }
}
