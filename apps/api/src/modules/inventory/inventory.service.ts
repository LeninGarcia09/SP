import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItemEntity } from './inventory-item.entity';
import { InventoryTransactionEntity } from './inventory-transaction.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItemEntity)
    private readonly itemRepo: Repository<InventoryItemEntity>,
    @InjectRepository(InventoryTransactionEntity)
    private readonly transactionRepo: Repository<InventoryTransactionEntity>,
  ) {}

  // --- Items ---

  async findAllItems(): Promise<InventoryItemEntity[]> {
    return this.itemRepo.find({ order: { name: 'ASC' } });
  }

  async findItemById(id: string): Promise<InventoryItemEntity> {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Inventory item ${id} not found`);
    return item;
  }

  async createItem(data: Partial<InventoryItemEntity>): Promise<InventoryItemEntity> {
    const item = this.itemRepo.create(data);
    return this.itemRepo.save(item);
  }

  async updateItem(id: string, data: Partial<InventoryItemEntity>): Promise<InventoryItemEntity> {
    const item = await this.findItemById(id);
    Object.assign(item, data);
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
    data: Partial<InventoryTransactionEntity>,
  ): Promise<InventoryTransactionEntity> {
    const transaction = this.transactionRepo.create(data);
    return this.transactionRepo.save(transaction);
  }

  // No update or delete methods — transactions are append-only
}
