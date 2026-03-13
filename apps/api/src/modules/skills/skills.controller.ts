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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto';
import { AssignSkillDto, UpdatePersonSkillDto } from './dto/person-skill.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@bizops/shared';

@ApiTags('Skills')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  // ─── Skills Catalog ───

  @Get()
  async findAll(@Query() query: PaginationDto) {
    return this.skillsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.skillsService.findById(id);
    return { data };
  }

  @Post()
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.HR_ADMIN)
  async create(@Body() dto: CreateSkillDto) {
    const data = await this.skillsService.create(dto);
    return { data };
  }

  @Patch(':id')
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.HR_ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSkillDto,
  ) {
    const data = await this.skillsService.update(id, dto);
    return { data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.GLOBAL_LEAD, UserRole.HR_ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.skillsService.remove(id);
  }

  // ─── Person Skills (nested under /personnel/:personId/skills) ───
  // These are mounted separately via PersonnelSkillsController below
}

@ApiTags('Personnel Skills')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('personnel/:personId/skills')
export class PersonnelSkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  async findPersonSkills(@Param('personId', ParseUUIDPipe) personId: string) {
    const data = await this.skillsService.findPersonSkills(personId);
    return { data };
  }

  @Post()
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.HR_ADMIN, UserRole.RESOURCE_MANAGER)
  async assignSkill(
    @Param('personId', ParseUUIDPipe) personId: string,
    @Body() dto: AssignSkillDto,
  ) {
    const data = await this.skillsService.assignSkill(personId, dto);
    return { data };
  }

  @Patch(':personSkillId')
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.HR_ADMIN, UserRole.RESOURCE_MANAGER)
  async updatePersonSkill(
    @Param('personSkillId', ParseUUIDPipe) personSkillId: string,
    @Body() dto: UpdatePersonSkillDto,
  ) {
    const data = await this.skillsService.updatePersonSkill(personSkillId, dto);
    return { data };
  }

  @Delete(':personSkillId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.HR_ADMIN)
  async removePersonSkill(@Param('personSkillId', ParseUUIDPipe) personSkillId: string) {
    await this.skillsService.removePersonSkill(personSkillId);
  }
}
