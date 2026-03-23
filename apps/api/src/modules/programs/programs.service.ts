import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, Not, Repository } from 'typeorm';
import { ProgramEntity } from './program.entity';
import { CreateProgramDto, UpdateProgramDto } from './dto/program.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(ProgramEntity)
    private readonly programRepo: Repository<ProgramEntity>,
  ) {}

  async findAll(query: PaginationDto): Promise<PaginatedResult<ProgramEntity>> {
    const { page, limit, sortBy, order, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? [
          { name: ILike(`%${search}%`) },
          { code: ILike(`%${search}%`) },
        ]
      : undefined;

    const [data, total] = await this.programRepo.findAndCount({
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

  async findById(id: string): Promise<ProgramEntity & { totalBudget: number; totalActualCost: number }> {
    const program = await this.programRepo.findOne({
      where: { id },
      relations: ['projects'],
    });
    if (!program) throw new NotFoundException(`Program ${id} not found`);

    const projects = program.projects ?? [];
    const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
    const totalActualCost = projects.reduce((sum, p) => sum + Number(p.actualCost || 0), 0);

    return Object.assign(program, { totalBudget, totalActualCost });
  }

  async create(dto: CreateProgramDto, createdBy: string): Promise<ProgramEntity> {
    const year = new Date().getFullYear();
    const count = await this.programRepo.count();
    const code = `PROG-${year}-${String(count + 1).padStart(3, '0')}`;
    const entity = this.programRepo.create({ ...dto, code, createdBy, managerId: dto.managerId ?? createdBy });
    return this.programRepo.save(entity);
  }

  async update(id: string, dto: UpdateProgramDto): Promise<ProgramEntity> {
    const program = await this.findById(id);
    Object.assign(program, dto);
    return this.programRepo.save(program);
  }

  async softDelete(id: string): Promise<ProgramEntity> {
    const program = await this.findById(id);
    return this.programRepo.softRemove(program);
  }

  async findDeleted(): Promise<ProgramEntity[]> {
    return this.programRepo.find({
      withDeleted: true,
      where: { deletedAt: Not(IsNull()) },
      order: { deletedAt: 'DESC' },
    });
  }

  async restore(id: string): Promise<ProgramEntity> {
    const program = await this.programRepo.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!program || !program.deletedAt) {
      throw new NotFoundException(`Deleted program ${id} not found`);
    }
    return this.programRepo.recover(program);
  }
}
