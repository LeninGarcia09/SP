import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AccountType, AccountTier } from '@telnub/shared';

@Entity('accounts')
export class AccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 36, nullable: true })
  tenantId!: string | null;

  @Column({ unique: true })
  code!: string;

  @Index()
  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  legalName!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  addressLine1!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  addressLine2!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode!: string | null;

  @Index()
  @Column({ type: 'enum', enum: AccountType, default: AccountType.PROSPECT })
  type!: AccountType;

  @Column({ type: 'enum', enum: AccountTier, nullable: true })
  tier!: AccountTier | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  annualRevenue!: number | null;

  @Column({ type: 'int', nullable: true })
  employeeCount!: number | null;

  @Index()
  @Column({ type: 'uuid' })
  ownerId!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  parentAccountId!: string | null;

  @ManyToOne(() => AccountEntity, { nullable: true })
  @JoinColumn({ name: 'parentAccountId' })
  parentAccount?: AccountEntity;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source!: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  tags!: string[];

  @Index({ spatial: false })
  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
