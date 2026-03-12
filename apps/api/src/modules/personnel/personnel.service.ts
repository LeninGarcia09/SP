import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonEntity } from './person.entity';
import { ProjectAssignmentEntity } from './project-assignment.entity';

@Injectable()
export class PersonnelService {
  constructor(
    @InjectRepository(PersonEntity)
    private readonly personRepo: Repository<PersonEntity>,
    @InjectRepository(ProjectAssignmentEntity)
    private readonly assignmentRepo: Repository<ProjectAssignmentEntity>,
  ) {}

  // --- Person CRUD ---

  async findAllPersons(): Promise<PersonEntity[]> {
    return this.personRepo.find({ order: { lastName: 'ASC', firstName: 'ASC' } });
  }

  async findPersonById(id: string): Promise<PersonEntity> {
    const person = await this.personRepo.findOne({ where: { id } });
    if (!person) throw new NotFoundException(`Person ${id} not found`);
    return person;
  }

  async createPerson(data: Partial<PersonEntity>): Promise<PersonEntity> {
    const person = this.personRepo.create(data);
    return this.personRepo.save(person);
  }

  async updatePerson(id: string, data: Partial<PersonEntity>): Promise<PersonEntity> {
    const person = await this.findPersonById(id);
    Object.assign(person, data);
    return this.personRepo.save(person);
  }

  // --- Assignments ---

  async findAssignmentsByPerson(personId: string): Promise<ProjectAssignmentEntity[]> {
    return this.assignmentRepo.find({ where: { personId }, relations: ['project'] });
  }

  async findAssignmentsByProject(projectId: string): Promise<ProjectAssignmentEntity[]> {
    return this.assignmentRepo.find({ where: { projectId }, relations: ['person'] });
  }

  async createAssignment(data: Partial<ProjectAssignmentEntity>): Promise<ProjectAssignmentEntity> {
    const assignment = this.assignmentRepo.create(data);
    return this.assignmentRepo.save(assignment);
  }

  async updateAssignment(
    id: string,
    data: Partial<ProjectAssignmentEntity>,
  ): Promise<ProjectAssignmentEntity> {
    const assignment = await this.assignmentRepo.findOne({ where: { id } });
    if (!assignment) throw new NotFoundException(`Assignment ${id} not found`);
    Object.assign(assignment, data);
    return this.assignmentRepo.save(assignment);
  }
}
