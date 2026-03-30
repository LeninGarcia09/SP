import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { ContactEntity } from './contact.entity';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { getTenantFilter, getCurrentTenantId } from '../../common/tenant/tenant.context';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(ContactEntity)
    private readonly contactRepo: Repository<ContactEntity>,
  ) {}

  async findAll(query: PaginationDto): Promise<PaginatedResult<ContactEntity>> {
    const { page, limit, sortBy, order, search } = query;
    const skip = (page - 1) * limit;
    const tf = getTenantFilter();

    const where = search
      ? [
          { firstName: ILike(`%${search}%`), ...tf },
          { lastName: ILike(`%${search}%`), ...tf },
          { email: ILike(`%${search}%`), ...tf },
          { code: ILike(`%${search}%`), ...tf },
        ]
      : Object.keys(tf).length > 0
        ? [tf]
        : undefined;

    const [data, total] = await this.contactRepo.findAndCount({
      where,
      relations: ['account'],
      order: { [sortBy]: order },
      skip,
      take: limit,
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByAccountId(accountId: string, query: PaginationDto): Promise<PaginatedResult<ContactEntity>> {
    const { page, limit, sortBy, order } = query;
    const skip = (page - 1) * limit;
    const tf = getTenantFilter();

    const [data, total] = await this.contactRepo.findAndCount({
      where: { accountId, ...tf },
      order: { [sortBy]: order },
      skip,
      take: limit,
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<ContactEntity> {
    const tf = getTenantFilter();
    const contact = await this.contactRepo.findOne({
      where: { id, ...tf },
      relations: ['account'],
    });
    if (!contact) throw new NotFoundException(`Contact ${id} not found`);
    return contact;
  }

  async create(dto: CreateContactDto, createdBy: string): Promise<ContactEntity> {
    const year = new Date().getFullYear();
    const prefix = `CON-${year}-`;
    const result = await this.contactRepo
      .createQueryBuilder('c')
      .select('MAX(c.code)', 'maxCode')
      .where('c.code LIKE :prefix', { prefix: `${prefix}%` })
      .getRawOne();
    const lastNum = result?.maxCode ? parseInt(result.maxCode.replace(prefix, ''), 10) : 0;
    const code = `${prefix}${String(lastNum + 1).padStart(3, '0')}`;
    const entity = this.contactRepo.create({
      ...dto,
      code,
      createdBy,
      tenantId: getCurrentTenantId(),
    });
    return this.contactRepo.save(entity);
  }

  async update(id: string, dto: UpdateContactDto): Promise<ContactEntity> {
    const contact = await this.findById(id);
    Object.assign(contact, dto);
    return this.contactRepo.save(contact);
  }

  async softDelete(id: string): Promise<ContactEntity> {
    const contact = await this.findById(id);
    contact.isActive = false;
    return this.contactRepo.save(contact);
  }
}
