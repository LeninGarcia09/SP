import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { InventoryItemEntity } from './inventory-item.entity';
import { InventoryTransactionEntity } from './inventory-transaction.entity';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findAllItems(): Promise<InventoryItemEntity[]> {
    return this.inventoryService.findAllItems();
  }

  @Get(':id')
  findItemById(@Param('id', ParseUUIDPipe) id: string): Promise<InventoryItemEntity> {
    return this.inventoryService.findItemById(id);
  }

  @Post()
  createItem(@Body() body: Partial<InventoryItemEntity>): Promise<InventoryItemEntity> {
    return this.inventoryService.createItem(body);
  }

  @Patch(':id')
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<InventoryItemEntity>,
  ): Promise<InventoryItemEntity> {
    return this.inventoryService.updateItem(id, body);
  }

  @Get(':id/transactions')
  findTransactions(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InventoryTransactionEntity[]> {
    return this.inventoryService.findTransactionsByItem(id);
  }

  @Post(':id/transactions')
  createTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<InventoryTransactionEntity>,
  ): Promise<InventoryTransactionEntity> {
    return this.inventoryService.createTransaction({ ...body, itemId: id });
  }

  // No PATCH/DELETE for transactions — append-only audit log
}
