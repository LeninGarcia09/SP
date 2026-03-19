import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { PersonEntity } from './person.entity';
import { ProjectAssignmentEntity } from './project-assignment.entity';
import { PersonSkillEntity } from '../skills/person-skill.entity';
import {
  CreatePersonDto,
  UpdatePersonDto,
  CreateAssignmentDto,
  UpdateAssignmentDto,
} from './dto/personnel.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import type { ResourceMatch, Person } from '@bizops/shared';

@Injectable()
export class PersonnelService {
  constructor(
    @InjectRepository(PersonEntity)
    private readonly personRepo: Repository<PersonEntity>,
    @InjectRepository(ProjectAssignmentEntity)
    private readonly assignmentRepo: Repository<ProjectAssignmentEntity>,
    @InjectRepository(PersonSkillEntity)
    private readonly personSkillRepo: Repository<PersonSkillEntity>,
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

  // ─── Skills-Based Resource Matching (Wave 3) ───

  async matchPersonnel(
    skillNames: string[],
    minAllocation?: number,
    availableFrom?: string,
  ): Promise<ResourceMatch[]> {
    if (!skillNames.length) return [];

    const lowerSkills = skillNames.map((s) => s.toLowerCase());

    // Get all person skills with skill info eager-loaded
    const allPersonSkills = await this.personSkillRepo.find({
      relations: ['person', 'skill'],
    });

    // Group skills by person
    const personSkillsMap = new Map<string, { person: PersonEntity; skills: { name: string; proficiency: string }[] }>();
    for (const ps of allPersonSkills) {
      if (!ps.person || !ps.skill) continue;
      const entry = personSkillsMap.get(ps.personId) || { person: ps.person, skills: [] };
      entry.skills.push({ name: ps.skill.name, proficiency: ps.proficiency });
      personSkillsMap.set(ps.personId, entry);
    }

    // Get active assignments for allocation calculation
    const activeAssignments = await this.assignmentRepo.find({
      where: { isActive: true },
    });
    const allocationMap = new Map<string, number>();
    for (const a of activeAssignments) {
      allocationMap.set(a.personId, (allocationMap.get(a.personId) || 0) + Number(a.allocationPercent));
    }

    // Score each person
    const matches: ResourceMatch[] = [];
    for (const [personId, { person, skills }] of personSkillsMap) {
      const matchedSkills = skills.filter((s) =>
        lowerSkills.includes(s.name.toLowerCase()),
      );
      if (matchedSkills.length === 0) continue;

      const matchScore = Math.round((matchedSkills.length / lowerSkills.length) * 100);
      const currentAllocation = allocationMap.get(personId) || 0;
      const availablePercent = Math.max(0, 100 - currentAllocation);

      // Filter by minimum available allocation
      if (minAllocation && availablePercent < minAllocation) continue;

      matches.push({
        person: {
          id: person.id,
          userId: person.userId,
          employeeId: person.employeeId,
          firstName: person.firstName,
          lastName: person.lastName,
          email: person.email,
          jobTitle: person.jobTitle,
          departmentId: person.departmentId ?? '',
          assignmentStatus: person.assignmentStatus as Person['assignmentStatus'],
          startDate: person.startDate,
          skills: person.skills || [],
          availabilityNotes: person.availabilityNotes,
          createdAt: String(person.createdAt),
          updatedAt: String(person.updatedAt),
        } satisfies Person,
        matchScore,
        currentAllocation,
        availablePercent,
        matchedSkills: matchedSkills.map((s) => s.name),
      });
    }

    // Sort by match score descending, then available percent descending
    matches.sort((a, b) => b.matchScore - a.matchScore || b.availablePercent - a.availablePercent);

    return matches;
  }
}
