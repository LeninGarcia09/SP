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
import { OpportunitiesService } from './opportunities.service';
import {
  CreateOpportunityDto,
  UpdateOpportunityDto,
  ConvertOpportunityDto,
  ChangeStageDto,
} from './dto/opportunity.dto';
import { CreateStakeholderDto, UpdateStakeholderDto } from './dto/stakeholder.dto';
import { CreateTeamMemberDto, UpdateTeamMemberDto } from './dto/team-member.dto';
import { CreateLineItemDto, UpdateLineItemDto } from './dto/line-item.dto';
import { CreateCompetitorDto, UpdateCompetitorDto } from './dto/competitor.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@telnub/shared';

@ApiTags('Opportunities')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  async findAll(@Query() query: PaginationDto) {
    return this.opportunitiesService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.opportunitiesService.findById(id);
    return { data };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async create(
    @Body() dto: CreateOpportunityDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.opportunitiesService.create(dto, req.user.sub);
    return { data };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOpportunityDto,
  ) {
    const data = await this.opportunitiesService.update(id, dto);
    return { data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.opportunitiesService.softDelete(id);
    return { data };
  }

  @Post(':id/convert')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR)
  async convert(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertOpportunityDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.opportunitiesService.convert(id, dto, req.user.sub);
    return { data };
  }

  // ─── Stage Change ───

  @Post(':id/stage')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async changeStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStageDto,
  ) {
    const data = await this.opportunitiesService.changeStage(id, dto);
    return { data };
  }

  // ─── Stakeholders ───

  @Get(':id/stakeholders')
  async getStakeholders(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.opportunitiesService.findStakeholders(id);
    return { data };
  }

  @Post(':id/stakeholders')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async addStakeholder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateStakeholderDto,
  ) {
    const data = await this.opportunitiesService.addStakeholder(id, dto);
    return { data };
  }

  @Patch('stakeholders/:stakeholderId')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async updateStakeholder(
    @Param('stakeholderId', ParseUUIDPipe) stakeholderId: string,
    @Body() dto: UpdateStakeholderDto,
  ) {
    const data = await this.opportunitiesService.updateStakeholder(stakeholderId, dto);
    return { data };
  }

  @Delete('stakeholders/:stakeholderId')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async removeStakeholder(@Param('stakeholderId', ParseUUIDPipe) stakeholderId: string) {
    await this.opportunitiesService.removeStakeholder(stakeholderId);
    return { data: { deleted: true } };
  }

  // ─── Team Members ───

  @Get(':id/team')
  async getTeamMembers(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.opportunitiesService.findTeamMembers(id);
    return { data };
  }

  @Post(':id/team')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async addTeamMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTeamMemberDto,
  ) {
    const data = await this.opportunitiesService.addTeamMember(id, dto);
    return { data };
  }

  @Patch('team/:memberId')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async updateTeamMember(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    const data = await this.opportunitiesService.updateTeamMember(memberId, dto);
    return { data };
  }

  @Delete('team/:memberId')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async removeTeamMember(@Param('memberId', ParseUUIDPipe) memberId: string) {
    await this.opportunitiesService.removeTeamMember(memberId);
    return { data: { deleted: true } };
  }

  // ─── Line Items ───

  @Get(':id/line-items')
  async getLineItems(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.opportunitiesService.findLineItems(id);
    return { data };
  }

  @Post(':id/line-items')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async addLineItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateLineItemDto,
  ) {
    const data = await this.opportunitiesService.addLineItem(id, dto);
    return { data };
  }

  @Patch('line-items/:itemId')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async updateLineItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateLineItemDto,
  ) {
    const data = await this.opportunitiesService.updateLineItem(itemId, dto);
    return { data };
  }

  @Delete('line-items/:itemId')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async removeLineItem(@Param('itemId', ParseUUIDPipe) itemId: string) {
    await this.opportunitiesService.removeLineItem(itemId);
    return { data: { deleted: true } };
  }

  // ─── Competitors ───

  @Get(':id/competitors')
  async getCompetitors(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.opportunitiesService.findCompetitors(id);
    return { data };
  }

  @Post(':id/competitors')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async addCompetitor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCompetitorDto,
  ) {
    const data = await this.opportunitiesService.addCompetitor(id, dto);
    return { data };
  }

  @Patch('competitors/:competitorId')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async updateCompetitor(
    @Param('competitorId', ParseUUIDPipe) competitorId: string,
    @Body() dto: UpdateCompetitorDto,
  ) {
    const data = await this.opportunitiesService.updateCompetitor(competitorId, dto);
    return { data };
  }

  @Delete('competitors/:competitorId')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async removeCompetitor(@Param('competitorId', ParseUUIDPipe) competitorId: string) {
    await this.opportunitiesService.removeCompetitor(competitorId);
    return { data: { deleted: true } };
  }
}
