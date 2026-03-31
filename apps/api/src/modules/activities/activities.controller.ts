import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/activity.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@telnub/shared';

@ApiTags('Activities')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @ApiQuery({ name: 'opportunityId', required: false })
  @ApiQuery({ name: 'accountId', required: false })
  @ApiQuery({ name: 'contactId', required: false })
  @ApiQuery({ name: 'type', required: false })
  async findAll(
    @Query() query: PaginationDto & { opportunityId?: string; accountId?: string; contactId?: string; type?: string },
  ) {
    return this.activitiesService.findAll({ ...query, sortBy: query.sortBy || 'createdAt', order: query.order || 'DESC' });
  }

  @Get('upcoming')
  async findUpcoming(@Request() req: { user: { sub: string } }) {
    const data = await this.activitiesService.findUpcoming(req.user.sub);
    return { data };
  }

  @Get('overdue')
  async findOverdue(@Request() req: { user: { sub: string } }) {
    const data = await this.activitiesService.findOverdue(req.user.sub);
    return { data };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.activitiesService.findById(id);
    return { data };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE, UserRole.PROJECT_MANAGER, UserRole.PROGRAM_MANAGER)
  async create(
    @Body() dto: CreateActivityDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.activitiesService.create(dto, req.user.sub);
    return { data };
  }
}

/**
 * Nested activity endpoints for opportunities, accounts, and contacts.
 */
@ApiTags('Activities')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller()
export class ActivityTimelineController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get('opportunities/:id/activities')
  async opportunityTimeline(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationDto,
  ) {
    return this.activitiesService.findByEntity('opportunity', id, { ...query, sortBy: query.sortBy || 'createdAt', order: query.order || 'DESC' });
  }

  @Post('opportunities/:id/activities')
  async logOnOpportunity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateActivityDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.activitiesService.create({ ...dto, opportunityId: id }, req.user.sub);
    return { data };
  }

  @Get('accounts/:id/activities')
  async accountTimeline(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationDto,
  ) {
    return this.activitiesService.findByEntity('account', id, { ...query, sortBy: query.sortBy || 'createdAt', order: query.order || 'DESC' });
  }

  @Post('accounts/:id/activities')
  async logOnAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateActivityDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.activitiesService.create({ ...dto, accountId: id }, req.user.sub);
    return { data };
  }

  @Get('contacts/:id/activities')
  async contactTimeline(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationDto,
  ) {
    return this.activitiesService.findByEntity('contact', id, { ...query, sortBy: query.sortBy || 'createdAt', order: query.order || 'DESC' });
  }

  @Post('contacts/:id/activities')
  async logOnContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateActivityDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.activitiesService.create({ ...dto, contactId: id }, req.user.sub);
    return { data };
  }
}
