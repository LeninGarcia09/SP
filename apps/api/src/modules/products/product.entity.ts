import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ProductCategory, RecurringInterval } from '@telnub/shared';

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 36, nullable: true })
  tenantId!: string | null;

  @Column({ unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Index()
  @Column({ type: 'enum', enum: ProductCategory, default: ProductCategory.SERVICE })
  category!: ProductCategory;

  @Column({ type: 'varchar', length: 100, nullable: true })
  family!: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  unitPrice!: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency!: string;

  @Column({ type: 'varchar', length: 50, default: 'unit' })
  unit!: string;

  @Column({ type: 'boolean', default: false })
  isRecurring!: boolean;

  @Column({ type: 'enum', enum: RecurringInterval, nullable: true })
  recurringInterval!: RecurringInterval | null;

  @Column({ type: 'int', default: 1 })
  minQuantity!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  maxDiscount!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Index({ spatial: false })
  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
