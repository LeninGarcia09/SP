import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { ProductEntity } from './product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { getTenantFilter, getCurrentTenantId } from '../../common/tenant/tenant.context';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  async findAll(query: PaginationDto): Promise<PaginatedResult<ProductEntity>> {
    const { page, limit, sortBy, order, search } = query;
    const skip = (page - 1) * limit;
    const tf = getTenantFilter();

    const where = search
      ? [
          { name: ILike(`%${search}%`), ...tf },
          { code: ILike(`%${search}%`), ...tf },
          { family: ILike(`%${search}%`), ...tf },
        ]
      : Object.keys(tf).length > 0 ? [tf] : undefined;

    const [data, total] = await this.productRepo.findAndCount({
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

  async findById(id: string): Promise<ProductEntity> {
    const tf = getTenantFilter();
    const product = await this.productRepo.findOneBy({ id, ...tf });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async create(dto: CreateProductDto): Promise<ProductEntity> {
    const count = await this.productRepo.count();
    const code = `PROD-${String(count + 1).padStart(3, '0')}`;
    const entity = this.productRepo.create({
      ...dto,
      code,
      tenantId: getCurrentTenantId(),
    });
    return this.productRepo.save(entity);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductEntity> {
    const product = await this.findById(id);
    Object.assign(product, dto);
    return this.productRepo.save(product);
  }

  async softDelete(id: string): Promise<ProductEntity> {
    const product = await this.findById(id);
    product.isActive = false;
    return this.productRepo.save(product);
  }
}
