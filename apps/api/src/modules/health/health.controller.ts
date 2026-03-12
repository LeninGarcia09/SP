import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ProjectHealthSnapshotEntity } from './health-snapshot.entity';
import { UserRole } from '@bizops/shared';

@ApiTags('Project Health')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('projects/:projectId/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHistory(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<ProjectHealthSnapshotEntity[]> {
    return this.healthService.getHistory(projectId);
  }

  @Post('trigger')
  triggerCalculation(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<ProjectHealthSnapshotEntity> {
    return this.healthService.triggerCalculation(projectId);
  }

  @Post('override')
  @UseGuards(RolesGuard)
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER)
  override(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() body: { overallRag: string; overrideReason: string },
    @Request() req: { user: { sub: string; role: string } },
  ): Promise<ProjectHealthSnapshotEntity> {
    return this.healthService.override(
      projectId,
      body.overallRag,
      body.overrideReason,
      req.user.sub,
      req.user.role,
    );
  }
}
