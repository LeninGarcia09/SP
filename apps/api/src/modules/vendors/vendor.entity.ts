import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { VendorStatus } from '@telnub/shared';

@Entity('vendors')
export class VendorEntity {
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

  @Column({ type: 'varchar', length: 500, nullable: true })
  website!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  contactPerson!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  addressLine1!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode!: string | null;

  @Index()
  @Column({ type: 'enum', enum: VendorStatus, default: VendorStatus.ACTIVE })
  status!: VendorStatus;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
