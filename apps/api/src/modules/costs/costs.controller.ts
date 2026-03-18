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
import { UserRole } from '@bizops/shared';

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
  async update(
    @Param('projectId', ParseUUIDPipe) _projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCostEntryDto,
  ) {
    const data = await this.costsService.update(id, dto);
    return { data };
  }

  @Delete('projects/:projectId/costs/:id')
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
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.PROJECT_LEAD)
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.costsService.approve(id, req.user.sub);
    return { data };
  }

  @Post('costs/:id/reject')
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.PROJECT_LEAD)
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectCostEntryDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.costsService.reject(id, req.user.sub, dto);
    return { data };
  }

  @Post('costs/:id/transfer')
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER)
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
}
