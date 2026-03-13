import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PersonnelService } from './personnel.service';
import {
  CreatePersonDto,
  UpdatePersonDto,
  CreateAssignmentDto,
  UpdateAssignmentDto,
} from './dto/personnel.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@bizops/shared';

@ApiTags('Personnel')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller()
export class PersonnelController {
  constructor(private readonly personnelService: PersonnelService) {}

  // --- Person endpoints ---

  @Get('personnel')
  async findAllPersons(@Query() query: PaginationDto) {
    return this.personnelService.findAllPersons(query);
  }

  @Get('personnel/:id')
  async findPersonById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.personnelService.findPersonById(id);
    return { data };
  }

  @Post('personnel')
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.RESOURCE_MANAGER)
  async createPerson(@Body() dto: CreatePersonDto) {
    const data = await this.personnelService.createPerson(dto);
    return { data };
  }

  @Patch('personnel/:id')
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.RESOURCE_MANAGER)
  async updatePerson(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePersonDto,
  ) {
    const data = await this.personnelService.updatePerson(id, dto);
    return { data };
  }

  // --- Assignment endpoints ---

  @Get('personnel/:personId/assignments')
  async findAssignmentsByPerson(
    @Param('personId', ParseUUIDPipe) personId: string,
  ) {
    const data = await this.personnelService.findAssignmentsByPerson(personId);
    return { data };
  }

  @Get('assignments')
  async findAllActiveAssignments() {
    const data = await this.personnelService.findAllActiveAssignments();
    return { data };
  }

  @Get('projects/:projectId/assignments')
  async findAssignmentsByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    const data = await this.personnelService.findAssignmentsByProject(projectId);
    return { data };
  }

  @Post('assignments')
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.RESOURCE_MANAGER)
  async createAssignment(@Body() dto: CreateAssignmentDto) {
    const data = await this.personnelService.createAssignment(dto);
    return { data };
  }

  @Patch('assignments/:id')
  @Roles(UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.RESOURCE_MANAGER)
  async updateAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssignmentDto,
  ) {
    const data = await this.personnelService.updateAssignment(id, dto);
    return { data };
  }
}
