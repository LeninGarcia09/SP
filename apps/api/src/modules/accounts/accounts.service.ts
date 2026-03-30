import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { AccountEntity } from './account.entity';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { getTenantFilter, getCurrentTenantId } from '../../common/tenant/tenant.context';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
  ) {}

  async findAll(query: PaginationDto): Promise<PaginatedResult<AccountEntity>> {
    const { page, limit, sortBy, order, search } = query;
    const skip = (page - 1) * limit;
    const tf = getTenantFilter();

    const where = search
      ? [
          { name: ILike(`%${search}%`), ...tf },
          { code: ILike(`%${search}%`), ...tf },
          { industry: ILike(`%${search}%`), ...tf },
        ]
      : Object.keys(tf).length > 0
        ? [tf]
        : undefined;

    const [data, total] = await this.accountRepo.findAndCount({
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

  async findById(id: string): Promise<AccountEntity> {
    const tf = getTenantFilter();
    const account = await this.accountRepo.findOneBy({ id, ...tf });
    if (!account) throw new NotFoundException(`Account ${id} not found`);
    return account;
  }

  async create(dto: CreateAccountDto, createdBy: string): Promise<AccountEntity> {
    const year = new Date().getFullYear();
    const prefix = `ACC-${year}-`;
    const result = await this.accountRepo
      .createQueryBuilder('a')
      .select('MAX(a.code)', 'maxCode')
      .where('a.code LIKE :prefix', { prefix: `${prefix}%` })
      .getRawOne();
    const lastNum = result?.maxCode ? parseInt(result.maxCode.replace(prefix, ''), 10) : 0;
    const code = `${prefix}${String(lastNum + 1).padStart(3, '0')}`;
    const entity = this.accountRepo.create({
      ...dto,
      code,
      ownerId: createdBy,
      createdBy,
      tenantId: getCurrentTenantId(),
    });
    return this.accountRepo.save(entity);
  }

  async update(id: string, dto: UpdateAccountDto): Promise<AccountEntity> {
    const account = await this.findById(id);
    Object.assign(account, dto);
    return this.accountRepo.save(account);
  }

  async softDelete(id: string): Promise<AccountEntity> {
    const account = await this.findById(id);
    account.isActive = false;
    return this.accountRepo.save(account);
  }
}
