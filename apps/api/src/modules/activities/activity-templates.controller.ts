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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ActivityTemplatesService } from './activity-templates.service';
import { CreateActivityTemplateDto, UpdateActivityTemplateDto } from './dto/activity.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@telnub/shared';

@ApiTags('Activity Templates')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('activity-templates')
export class ActivityTemplatesController {
  constructor(private readonly templatesService: ActivityTemplatesService) {}

  @Get()
  async findAll(@Query() query: PaginationDto) {
    return this.templatesService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.templatesService.findById(id);
    return { data };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async create(
    @Body() dto: CreateActivityTemplateDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.templatesService.create(dto, req.user.sub);
    return { data };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActivityTemplateDto,
  ) {
    const data = await this.templatesService.update(id, dto);
    return { data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.templatesService.delete(id);
  }
}
