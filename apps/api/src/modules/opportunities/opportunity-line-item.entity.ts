import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { OpportunityEntity } from './opportunity.entity';
import { ProductEntity } from '../products/product.entity';

@Entity('opportunity_line_items')
export class OpportunityLineItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  opportunityId!: string;

  @ManyToOne(() => OpportunityEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opportunityId' })
  opportunity?: OpportunityEntity;

  @Column({ type: 'uuid', nullable: true })
  productId!: string | null;

  @ManyToOne(() => ProductEntity, { eager: true, nullable: true })
  @JoinColumn({ name: 'productId' })
  product?: ProductEntity | null;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 1 })
  quantity!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  unitPrice!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalPrice!: number;

  @Column({ type: 'date', nullable: true })
  serviceStartDate!: string | null;

  @Column({ type: 'date', nullable: true })
  serviceEndDate!: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
