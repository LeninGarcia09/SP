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
import { ContactChannel, ContactType, ContactInfluence } from '@telnub/shared';
import { AccountEntity } from '../accounts/account.entity';

@Entity('contacts')
export class ContactEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 36, nullable: true })
  tenantId!: string | null;

  @Column({ unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Index()
  @Column({ type: 'varchar', length: 200, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mobilePhone!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  jobTitle!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department!: string | null;

  @Index()
  @Column({ type: 'uuid' })
  accountId!: string;

  @ManyToOne(() => AccountEntity)
  @JoinColumn({ name: 'accountId' })
  account?: AccountEntity;

  @Column({ type: 'uuid', nullable: true })
  reportsToId!: string | null;

  @ManyToOne(() => ContactEntity, { nullable: true })
  @JoinColumn({ name: 'reportsToId' })
  reportsTo?: ContactEntity;

  @Column({ type: 'enum', enum: ContactChannel, default: ContactChannel.EMAIL })
  preferredChannel!: ContactChannel;

  @Column({ type: 'varchar', length: 50, nullable: true })
  timezone!: string | null;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  language!: string;

  @Column({ type: 'enum', enum: ContactType, default: ContactType.OTHER })
  type!: ContactType;

  @Index()
  @Column({ type: 'enum', enum: ContactInfluence, nullable: true })
  influence!: ContactInfluence | null;

  @Column({ type: 'timestamp', nullable: true })
  lastContactedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt!: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  linkedinUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

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
