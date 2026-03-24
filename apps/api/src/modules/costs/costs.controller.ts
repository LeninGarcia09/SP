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
import { CostsService } from './costs.service';
import {
  CreateCostEntryDto,
  UpdateCostEntryDto,
  TransferCostEntryDto,
  RejectCostEntryDto,
} from './dto/cost-entry.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@telnub/shared';

@ApiTags('Costs')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller()
export class CostsController {
  constructor(private readonly costsService: CostsService) {}

  // ─── Project-scoped endpoints ───

  @Get('projects/:projectId/costs')
  async findByProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    const data = await this.costsService.findByProject(projectId);
    return { data };
  }

  @Post('projects/:projectId/costs')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER)
  async create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateCostEntryDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.costsService.create(projectId, dto, req.user.sub);
    return { data };
  }

  @Get('projects/:projectId/costs/:id')
  async findById(
    @Param('projectId', ParseUUIDPipe) _projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.costsService.findById(id);
    return { data };
  }

  @Patch('projects/:projectId/costs/:id')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.PROJECT_MANAGER)
  async update(
    @Param('projectId', ParseUUIDPipe) _projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCostEntryDto,
  ) {
    const data = await this.costsService.update(id, dto);
    return { data };
  }

  @Delete('projects/:projectId/costs/:id')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.PROJECT_MANAGER)
  async delete(
    @Param('projectId', ParseUUIDPipe) _projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.costsService.delete(id);
    return { data: { deleted: true } };
  }

  // ─── Cost entry actions ───

  @Post('costs/:id/submit')
  async submit(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.costsService.submit(id);
    return { data };
  }

  @Post('costs/:id/approve')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.PROJECT_MANAGER)
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.costsService.approve(id, req.user.sub);
    return { data };
  }

  @Post('costs/:id/reject')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.PROJECT_MANAGER)
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectCostEntryDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.costsService.reject(id, req.user.sub, dto);
    return { data };
  }

  @Post('costs/:id/transfer')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR)
  async transfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransferCostEntryDto,
  ) {
    const data = await this.costsService.transfer(id, dto);
    return { data };
  }

  // ─── Cost summary ───

  @Get('projects/:projectId/cost-summary')
  async getCostSummary(@Param('projectId', ParseUUIDPipe) projectId: string) {
    const data = await this.costsService.getCostSummary(projectId);
    return { data };
  }

  @Get('projects/:projectId/task-costs')
  async getTaskCosts(@Param('projectId', ParseUUIDPipe) projectId: string) {
    const data = await this.costsService.getTaskCostBreakdowns(projectId);
    return { data };
  }

  // ─── Cost forecasting (Wave 3) ───

  @Get('projects/:projectId/cost-forecast')
  async getCostForecast(@Param('projectId', ParseUUIDPipe) projectId: string) {
    const data = await this.costsService.getCostForecast(projectId);
    return { data };
  }

  @Get('projects/:projectId/burn-data')
  async getBurnData(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('metric') metric?: string,
  ) {
    const m = metric === 'cost' ? 'cost' : 'hours';
    const data = await this.costsService.getBurnData(projectId, m);
    return { data };
  }
}
