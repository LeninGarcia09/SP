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
import { CreateOpportunityDto, UpdateOpportunityDto, ConvertOpportunityDto } from './dto/opportunity.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@bizops/shared';

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
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER)
  async create(
    @Body() dto: CreateOpportunityDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.opportunitiesService.create(dto, req.user.sub);
    return { data };
  }

  @Patch(':id')
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOpportunityDto,
  ) {
    const data = await this.opportunitiesService.update(id, dto);
    return { data };
  }

  @Delete(':id')
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.opportunitiesService.softDelete(id);
    return { data };
  }

  @Post(':id/convert')
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER)
  async convert(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertOpportunityDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.opportunitiesService.convert(id, dto, req.user.sub);
    return { data };
  }
}
