import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('inventory_items')
export class InventoryItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  sku: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50 })
  category: string; // TOOL_EQUIPMENT | CONSUMABLE | VEHICLE | SOFTWARE_LICENSE

  @Column({ type: 'varchar', length: 50, default: 'AVAILABLE' })
  status: string; // AVAILABLE | CHECKED_OUT | MAINTENANCE | RETIRED

  @Column({ type: 'varchar', length: 200, nullable: true })
  serialNumber: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location: string | null;

  @Column({ type: 'date', nullable: true })
  purchaseDate: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  purchaseCost: number | null;

  @Column({ type: 'uuid', nullable: true })
  assignedToPersonId: string | null;

  @Column({ type: 'uuid', nullable: true })
  assignedToProjectId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
