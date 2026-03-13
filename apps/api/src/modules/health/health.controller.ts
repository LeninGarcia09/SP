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
import { RagOverrideDto } from './dto/rag-override.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@bizops/shared';

@ApiTags('Project Health')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('projects/:projectId/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHistory(@Param('projectId', ParseUUIDPipe) projectId: string) {
    const data = await this.healthService.getHistory(projectId);
    return { data };
  }

  @Post('trigger')
  async triggerCalculation(@Param('projectId', ParseUUIDPipe) projectId: string) {
    const data = await this.healthService.triggerCalculation(projectId);
    return { data };
  }

  @Post('override')
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER)
  async override(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: RagOverrideDto,
    @Request() req: { user: { sub: string; role: string } },
  ) {
    const data = await this.healthService.override(
      projectId,
      dto.overallRag,
      dto.overrideReason,
      req.user.sub,
      req.user.role,
    );
    return { data };
  }
}
