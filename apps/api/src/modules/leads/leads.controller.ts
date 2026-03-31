import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@telnub/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto, ConvertLeadDto } from './dto/lead.dto';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'source', required: false })
  @ApiQuery({ name: 'rating', required: false })
  @ApiQuery({ name: 'ownerId', required: false })
  async findAll(
    @Query() query: PaginationDto & { status?: string; source?: string; rating?: string; ownerId?: string },
  ) {
    return this.leadsService.findAll({
      ...query,
      sortBy: query.sortBy || 'createdAt',
      order: query.order || 'DESC',
    });
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async getStats() {
    const data = await this.leadsService.getStats();
    return { data };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.leadsService.findById(id);
    return { data };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async create(
    @Body() dto: CreateLeadDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.leadsService.create(dto, req.user.sub);
    return { data };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    const data = await this.leadsService.update(id, dto);
    return { data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.leadsService.softDelete(id);
    return { data };
  }

  @Post(':id/convert')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async convert(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertLeadDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.leadsService.convert(id, dto, req.user.sub);
    return { data };
  }

  @Post(':id/qualify')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async qualify(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.leadsService.qualify(id);
    return { data };
  }

  @Post(':id/disqualify')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async disqualify(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.leadsService.disqualify(id);
    return { data };
  }
}
