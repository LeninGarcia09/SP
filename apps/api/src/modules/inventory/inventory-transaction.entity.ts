import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { InventoryItemEntity } from './inventory-item.entity';

/**
 * APPEND-ONLY audit log. Never UPDATE or DELETE rows from this table.
 */
@Entity('inventory_transactions')
export class InventoryTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  itemId: string;

  @ManyToOne(() => InventoryItemEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: InventoryItemEntity;

  @Column({ type: 'varchar', length: 50 })
  transactionType: string; // CHECK_OUT | CHECK_IN | TRANSFER | MAINTENANCE | RETIREMENT

  @Column({ type: 'uuid', nullable: true })
  fromPersonId: string | null;

  @Column({ type: 'uuid', nullable: true })
  toPersonId: string | null;

  @Column({ type: 'uuid', nullable: true })
  fromProjectId: string | null;

  @Column({ type: 'uuid', nullable: true })
  toProjectId: string | null;

  @Column({ type: 'uuid' })
  performedById: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  transactionDate: Date;

  // NO updatedAt — append-only table

  @Index()
  @Column({ type: 'varchar', length: 36, nullable: true })
  tenantId: string | null;
}
