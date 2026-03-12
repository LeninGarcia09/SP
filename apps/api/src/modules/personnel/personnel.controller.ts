import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PersonnelService } from './personnel.service';
import { PersonEntity } from './person.entity';
import { ProjectAssignmentEntity } from './project-assignment.entity';

@ApiTags('Personnel')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller()
export class PersonnelController {
  constructor(private readonly personnelService: PersonnelService) {}

  // --- Person endpoints ---

  @Get('personnel')
  findAllPersons(): Promise<PersonEntity[]> {
    return this.personnelService.findAllPersons();
  }

  @Get('personnel/:id')
  findPersonById(@Param('id', ParseUUIDPipe) id: string): Promise<PersonEntity> {
    return this.personnelService.findPersonById(id);
  }

  @Post('personnel')
  createPerson(@Body() body: Partial<PersonEntity>): Promise<PersonEntity> {
    return this.personnelService.createPerson(body);
  }

  @Patch('personnel/:id')
  updatePerson(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<PersonEntity>,
  ): Promise<PersonEntity> {
    return this.personnelService.updatePerson(id, body);
  }

  // --- Assignment endpoints ---

  @Get('personnel/:personId/assignments')
  findAssignmentsByPerson(
    @Param('personId', ParseUUIDPipe) personId: string,
  ): Promise<ProjectAssignmentEntity[]> {
    return this.personnelService.findAssignmentsByPerson(personId);
  }

  @Get('projects/:projectId/assignments')
  findAssignmentsByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<ProjectAssignmentEntity[]> {
    return this.personnelService.findAssignmentsByProject(projectId);
  }

  @Post('assignments')
  createAssignment(
    @Body() body: Partial<ProjectAssignmentEntity>,
  ): Promise<ProjectAssignmentEntity> {
    return this.personnelService.createAssignment(body);
  }

  @Patch('assignments/:id')
  updateAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<ProjectAssignmentEntity>,
  ): Promise<ProjectAssignmentEntity> {
    return this.personnelService.updateAssignment(id, body);
  }
}
