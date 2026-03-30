import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { VendorEntity } from './vendor.entity';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { getTenantFilter, getCurrentTenantId } from '../../common/tenant/tenant.context';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(VendorEntity)
    private readonly vendorRepo: Repository<VendorEntity>,
  ) {}

  async findAll(query: PaginationDto): Promise<PaginatedResult<VendorEntity>> {
    const { page, limit, sortBy, order, search } = query;
    const skip = (page - 1) * limit;
    const tf = getTenantFilter();

    const where = search
      ? [
          { name: ILike(`%${search}%`), ...tf },
          { code: ILike(`%${search}%`), ...tf },
          { contactPerson: ILike(`%${search}%`), ...tf },
        ]
      : Object.keys(tf).length > 0
        ? [tf]
        : undefined;

    const [data, total] = await this.vendorRepo.findAndCount({
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

  async findById(id: string): Promise<VendorEntity> {
    const tf = getTenantFilter();
    const vendor = await this.vendorRepo.findOneBy({ id, ...tf });
    if (!vendor) throw new NotFoundException(`Vendor ${id} not found`);
    return vendor;
  }

  async create(dto: CreateVendorDto): Promise<VendorEntity> {
    const prefix = 'VND-';
    const result = await this.vendorRepo
      .createQueryBuilder('v')
      .select('MAX(v.code)', 'maxCode')
      .where('v.code LIKE :prefix', { prefix: `${prefix}%` })
      .getRawOne();
    const lastNum = result?.maxCode ? parseInt(result.maxCode.replace(prefix, ''), 10) : 0;
    const code = `${prefix}${String(lastNum + 1).padStart(3, '0')}`;
    const entity = this.vendorRepo.create({
      ...dto,
      code,
      tenantId: getCurrentTenantId(),
    });
    return this.vendorRepo.save(entity);
  }

  async update(id: string, dto: UpdateVendorDto): Promise<VendorEntity> {
    const vendor = await this.findById(id);
    Object.assign(vendor, dto);
    return this.vendorRepo.save(vendor);
  }

  async softDelete(id: string): Promise<VendorEntity> {
    const vendor = await this.findById(id);
    vendor.isActive = false;
    return this.vendorRepo.save(vendor);
  }
}
