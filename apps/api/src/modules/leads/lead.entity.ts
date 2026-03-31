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
import { LeadStatus, LeadSource, LeadRating } from '@telnub/shared';
import { AccountEntity } from '../accounts/account.entity';
import { ContactEntity } from '../contacts/contact.entity';
import { OpportunityEntity } from '../opportunities/opportunity.entity';

export { LeadStatus, LeadSource, LeadRating };

@Entity('leads')
export class LeadEntity {
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

  @Column({ type: 'varchar', length: 200, nullable: true })
  jobTitle!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 200 })
  companyName!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  companySize!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website!: string | null;

  @Index()
  @Column({ type: 'enum', enum: LeadStatus, default: LeadStatus.NEW })
  status!: LeadStatus;

  @Index()
  @Column({ type: 'enum', enum: LeadSource, default: LeadSource.OTHER })
  source!: LeadSource;

  @Column({ type: 'enum', enum: LeadRating, default: LeadRating.WARM })
  rating!: LeadRating;

  @Index()
  @Column({ type: 'int', default: 0 })
  score!: number;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  ownerId!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  assignedAt!: Date | null;

  // BANT Qualification
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  budget!: number | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  authority!: string | null;

  @Column({ type: 'text', nullable: true })
  need!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  timeline!: string | null;

  // Conversion
  @Column({ type: 'timestamptz', nullable: true })
  convertedAt!: Date | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  convertedAccountId!: string | null;

  @ManyToOne(() => AccountEntity, { nullable: true })
  @JoinColumn({ name: 'convertedAccountId' })
  convertedAccount?: AccountEntity;

  @Column({ type: 'uuid', nullable: true })
  convertedContactId!: string | null;

  @ManyToOne(() => ContactEntity, { nullable: true })
  @JoinColumn({ name: 'convertedContactId' })
  convertedContact?: ContactEntity;

  @Column({ type: 'uuid', nullable: true })
  convertedOpportunityId!: string | null;

  @ManyToOne(() => OpportunityEntity, { nullable: true })
  @JoinColumn({ name: 'convertedOpportunityId' })
  convertedOpportunity?: OpportunityEntity;

  @Column({ type: 'uuid', nullable: true })
  convertedBy!: string | null;

  // Tracking
  @Column({ type: 'timestamptz', nullable: true })
  lastContactedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  nextFollowUpAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  tags!: string[];

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
