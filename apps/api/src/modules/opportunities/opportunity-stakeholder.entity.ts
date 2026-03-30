import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { StakeholderRole, StakeholderInfluence, StakeholderSentiment } from '@telnub/shared';
import { OpportunityEntity } from './opportunity.entity';
import { ContactEntity } from '../contacts/contact.entity';

@Entity('opportunity_stakeholders')
@Unique(['opportunityId', 'contactId'])
export class OpportunityStakeholderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  opportunityId!: string;

  @ManyToOne(() => OpportunityEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opportunityId' })
  opportunity?: OpportunityEntity;

  @Index()
  @Column({ type: 'uuid' })
  contactId!: string;

  @ManyToOne(() => ContactEntity, { eager: true })
  @JoinColumn({ name: 'contactId' })
  contact?: ContactEntity;

  @Column({ type: 'enum', enum: StakeholderRole, default: StakeholderRole.INFLUENCER })
  role!: StakeholderRole;

  @Column({ type: 'enum', enum: StakeholderInfluence, default: StakeholderInfluence.MEDIUM })
  influence!: StakeholderInfluence;

  @Column({ type: 'enum', enum: StakeholderSentiment, default: StakeholderSentiment.UNKNOWN })
  sentiment!: StakeholderSentiment;

  @Column({ type: 'boolean', default: false })
  isPrimary!: boolean;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
