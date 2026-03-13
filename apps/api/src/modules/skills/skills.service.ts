import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { SkillEntity } from './skill.entity';
import { PersonSkillEntity } from './person-skill.entity';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto';
import { AssignSkillDto, UpdatePersonSkillDto } from './dto/person-skill.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(SkillEntity)
    private readonly skillRepo: Repository<SkillEntity>,
    @InjectRepository(PersonSkillEntity)
    private readonly personSkillRepo: Repository<PersonSkillEntity>,
  ) {}

  // ─── Skills Catalog ───

  async findAll(query: PaginationDto): Promise<PaginatedResult<SkillEntity>> {
    const { page, limit, sortBy, order, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? [
          { name: ILike(`%${search}%`) },
        ]
      : undefined;

    const [data, total] = await this.skillRepo.findAndCount({
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

  async findById(id: string): Promise<SkillEntity> {
    const skill = await this.skillRepo.findOneBy({ id });
    if (!skill) throw new NotFoundException(`Skill ${id} not found`);
    return skill;
  }

  async create(dto: CreateSkillDto): Promise<SkillEntity> {
    const existing = await this.skillRepo.findOneBy({ name: dto.name });
    if (existing) throw new ConflictException(`Skill "${dto.name}" already exists`);
    const entity = this.skillRepo.create(dto);
    return this.skillRepo.save(entity);
  }

  async update(id: string, dto: UpdateSkillDto): Promise<SkillEntity> {
    const skill = await this.findById(id);
    if (dto.name && dto.name !== skill.name) {
      const existing = await this.skillRepo.findOneBy({ name: dto.name });
      if (existing) throw new ConflictException(`Skill "${dto.name}" already exists`);
    }
    Object.assign(skill, dto);
    return this.skillRepo.save(skill);
  }

  async remove(id: string): Promise<void> {
    const skill = await this.findById(id);
    await this.skillRepo.remove(skill);
  }

  // ─── Person Skills ───

  async findPersonSkills(personId: string): Promise<PersonSkillEntity[]> {
    return this.personSkillRepo.find({
      where: { personId },
      order: { proficiency: 'DESC' },
    });
  }

  async assignSkill(personId: string, dto: AssignSkillDto): Promise<PersonSkillEntity> {
    await this.findById(dto.skillId); // ensure skill exists
    const existing = await this.personSkillRepo.findOneBy({ personId, skillId: dto.skillId });
    if (existing) throw new ConflictException('Skill already assigned to this person');
    const entity = this.personSkillRepo.create({ personId, ...dto });
    return this.personSkillRepo.save(entity);
  }

  async updatePersonSkill(personSkillId: string, dto: UpdatePersonSkillDto): Promise<PersonSkillEntity> {
    const ps = await this.personSkillRepo.findOneBy({ id: personSkillId });
    if (!ps) throw new NotFoundException(`PersonSkill ${personSkillId} not found`);
    Object.assign(ps, dto);
    return this.personSkillRepo.save(ps);
  }

  async removePersonSkill(personSkillId: string): Promise<void> {
    const ps = await this.personSkillRepo.findOneBy({ id: personSkillId });
    if (!ps) throw new NotFoundException(`PersonSkill ${personSkillId} not found`);
    await this.personSkillRepo.remove(ps);
  }
}
