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
import { ThreatLevel, CompetitorStatus } from '@telnub/shared';
import { OpportunityEntity } from './opportunity.entity';

@Entity('opportunity_competitors')
export class OpportunityCompetitorEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  opportunityId!: string;

  @ManyToOne(() => OpportunityEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opportunityId' })
  opportunity?: OpportunityEntity;

  @Column({ type: 'varchar', length: 200 })
  competitorName!: string;

  @Column({ type: 'uuid', nullable: true })
  competitorAccountId!: string | null;

  @Column({ type: 'text', nullable: true })
  strengths!: string | null;

  @Column({ type: 'text', nullable: true })
  weaknesses!: string | null;

  @Column({ type: 'enum', enum: ThreatLevel, default: ThreatLevel.MEDIUM })
  threatLevel!: ThreatLevel;

  @Column({ type: 'enum', enum: CompetitorStatus, default: CompetitorStatus.ACTIVE })
  status!: CompetitorStatus;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
