import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
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

  async findById(id: string): Promise<ProgramEntity> {
    const program = await this.programRepo.findOne({
      where: { id },
      relations: ['projects'],
    });
    if (!program) throw new NotFoundException(`Program ${id} not found`);
    return program;
  }

  async create(dto: CreateProgramDto, createdBy: string): Promise<ProgramEntity> {
    const year = new Date().getFullYear();
    const count = await this.programRepo.count();
    const code = `PROG-${year}-${String(count + 1).padStart(3, '0')}`;
    const entity = this.programRepo.create({ ...dto, code, createdBy });
    return this.programRepo.save(entity);
  }

  async update(id: string, dto: UpdateProgramDto): Promise<ProgramEntity> {
    const program = await this.findById(id);
    Object.assign(program, dto);
    return this.programRepo.save(program);
  }

  async softDelete(id: string): Promise<ProgramEntity> {
    const program = await this.findById(id);
    program.status = 'CANCELLED' as never;
    return this.programRepo.save(program);
  }
}
