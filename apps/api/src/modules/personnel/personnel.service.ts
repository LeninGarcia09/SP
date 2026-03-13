import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { PersonEntity } from './person.entity';
import { ProjectAssignmentEntity } from './project-assignment.entity';
import {
  CreatePersonDto,
  UpdatePersonDto,
  CreateAssignmentDto,
  UpdateAssignmentDto,
} from './dto/personnel.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class PersonnelService {
  constructor(
    @InjectRepository(PersonEntity)
    private readonly personRepo: Repository<PersonEntity>,
    @InjectRepository(ProjectAssignmentEntity)
    private readonly assignmentRepo: Repository<ProjectAssignmentEntity>,
  ) {}

  // --- Person CRUD ---

  async findAllPersons(query: PaginationDto): Promise<PaginatedResult<PersonEntity>> {
    const { page, limit, sortBy, order, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? [
          { firstName: ILike(`%${search}%`) },
          { lastName: ILike(`%${search}%`) },
          { email: ILike(`%${search}%`) },
        ]
      : undefined;

    const [data, total] = await this.personRepo.findAndCount({
      where,
      order: { [sortBy]: order },
      skip,
      take: limit,
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findPersonById(id: string): Promise<PersonEntity> {
    const person = await this.personRepo.findOne({ where: { id } });
    if (!person) throw new NotFoundException(`Person ${id} not found`);
    return person;
  }

  async createPerson(dto: CreatePersonDto): Promise<PersonEntity> {
    const person = this.personRepo.create(dto);
    return this.personRepo.save(person);
  }

  async updatePerson(id: string, dto: UpdatePersonDto): Promise<PersonEntity> {
    const person = await this.findPersonById(id);
    Object.assign(person, dto);
    return this.personRepo.save(person);
  }

  // --- Assignments ---

  async findAssignmentsByPerson(personId: string): Promise<ProjectAssignmentEntity[]> {
    return this.assignmentRepo.find({ where: { personId }, relations: ['project'] });
  }

  async findAllActiveAssignments(): Promise<ProjectAssignmentEntity[]> {
    return this.assignmentRepo.find({
      where: { isActive: true },
      relations: ['person', 'project'],
    });
  }

  async findAssignmentsByProject(projectId: string): Promise<ProjectAssignmentEntity[]> {
    return this.assignmentRepo.find({ where: { projectId }, relations: ['person'] });
  }

  async createAssignment(dto: CreateAssignmentDto): Promise<ProjectAssignmentEntity> {
    const assignment = this.assignmentRepo.create(dto);
    return this.assignmentRepo.save(assignment);
  }

  async updateAssignment(
    id: string,
    dto: UpdateAssignmentDto,
  ): Promise<ProjectAssignmentEntity> {
    const assignment = await this.assignmentRepo.findOne({ where: { id } });
    if (!assignment) throw new NotFoundException(`Assignment ${id} not found`);
    Object.assign(assignment, dto);
    return this.assignmentRepo.save(assignment);
  }
}
