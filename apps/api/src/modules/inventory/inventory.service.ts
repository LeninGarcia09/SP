import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { InventoryItemEntity } from './inventory-item.entity';
import { InventoryTransactionEntity } from './inventory-transaction.entity';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  CreateInventoryTransactionDto,
} from './dto/inventory.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { AssetCategory } from '@telnub/shared';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItemEntity)
    private readonly itemRepo: Repository<InventoryItemEntity>,
    @InjectRepository(InventoryTransactionEntity)
    private readonly transactionRepo: Repository<InventoryTransactionEntity>,
  ) {}

  // --- Items ---

  async findAllItems(query: PaginationDto): Promise<PaginatedResult<InventoryItemEntity>> {
    const { page, limit, sortBy, order, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? [
          { name: ILike(`%${search}%`) },
          { sku: ILike(`%${search}%`) },
        ]
      : undefined;

    const [data, total] = await this.itemRepo.findAndCount({
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

  async findItemById(id: string): Promise<InventoryItemEntity> {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Inventory item ${id} not found`);
    return item;
  }

  async createItem(dto: CreateInventoryItemDto): Promise<InventoryItemEntity> {
    const item = this.itemRepo.create(dto);
    return this.itemRepo.save(item);
  }

  async updateItem(id: string, dto: UpdateInventoryItemDto): Promise<InventoryItemEntity> {
    const item = await this.findItemById(id);
    Object.assign(item, dto);
    return this.itemRepo.save(item);
  }

  // --- Transactions (append-only) ---

  async findTransactionsByItem(itemId: string): Promise<InventoryTransactionEntity[]> {
    return this.transactionRepo.find({
      where: { itemId },
      order: { transactionDate: 'DESC' },
    });
  }

  async createTransaction(
    itemId: string,
    dto: CreateInventoryTransactionDto,
    performedById: string,
  ): Promise<InventoryTransactionEntity> {
    const transaction = this.transactionRepo.create({ ...dto, itemId, performedById });
    return this.transactionRepo.save(transaction);
  }

  // No update or delete methods — transactions are append-only

  // --- Excel Import ---

  async importFromExcel(buffer: Buffer): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      throw new BadRequestException('Excel file contains no sheets');
    }
    const rows: Record<string, unknown>[] = [];
    const headers: string[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell, colNumber) => {
          headers[colNumber] = String(cell.value ?? '');
        });
      } else {
        const obj: Record<string, unknown> = {};
        row.eachCell((cell, colNumber) => {
          if (headers[colNumber]) {
            obj[headers[colNumber]] = cell.value;
          }
        });
        rows.push(obj);
      }
    });
    if (rows.length === 0) {
      throw new BadRequestException('Excel sheet is empty');
    }

    const validCategories = new Set(Object.values(AssetCategory));
    const imported: InventoryItemEntity[] = [];
    const errors: string[] = [];
    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const rowNum = i + 2; // 1-indexed + header row
      const sku = String(row['sku'] ?? row['SKU'] ?? '').trim();
      const name = String(row['name'] ?? row['Name'] ?? '').trim();
      const category = String(
        row['category'] ?? row['Category'] ?? '',
      ).trim().toUpperCase().replace(/\s+/g, '_');

      if (!sku || !name) {
        errors.push(`Row ${rowNum}: missing required sku or name`);
        skipped++;
        continue;
      }

      if (!validCategories.has(category as AssetCategory)) {
        errors.push(
          `Row ${rowNum}: invalid category "${category}". Valid: ${[...validCategories].join(', ')}`,
        );
        skipped++;
        continue;
      }

      // Check for duplicate SKU in database
      const exists = await this.itemRepo.findOne({ where: { sku } });
      if (exists) {
        errors.push(`Row ${rowNum}: SKU "${sku}" already exists — skipped`);
        skipped++;
        continue;
      }

      const item = this.itemRepo.create({
        sku,
        name,
        category,
        description: row['description'] != null ? String(row['description']) : null,
        serialNumber: row['serialNumber'] ?? row['serial_number']
          ? String(row['serialNumber'] ?? row['serial_number'])
          : null,
        location: row['location'] ? String(row['location']) : null,
        purchaseDate: row['purchaseDate'] ?? row['purchase_date']
          ? String(row['purchaseDate'] ?? row['purchase_date'])
          : null,
        purchaseCost: row['purchaseCost'] ?? row['purchase_cost']
          ? Number(row['purchaseCost'] ?? row['purchase_cost'])
          : null,
      });
      imported.push(item);
    }

    if (imported.length > 0) {
      await this.itemRepo.save(imported);
    }

    return { imported: imported.length, skipped, errors };
  }
}
