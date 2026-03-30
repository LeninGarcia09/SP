import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {
  OpportunityStatus,
  OpportunityStage,
  OpportunityType,
  DealHealth,
  Priority,
  ForecastCategory,
} from '@telnub/shared';
import { OpportunityStakeholderEntity } from './opportunity-stakeholder.entity';
import { OpportunityTeamMemberEntity } from './opportunity-team-member.entity';
import { OpportunityLineItemEntity } from './opportunity-line-item.entity';
import { OpportunityCompetitorEntity } from './opportunity-competitor.entity';
import { PipelineStageEntity } from '../pipelines/pipeline-stage.entity';

@Entity('opportunities')
export class OpportunityEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  // ─── Legacy fields (kept for backward compat) ───

  @Column({ type: 'enum', enum: OpportunityStatus, default: OpportunityStatus.IDENTIFIED })
  status!: OpportunityStatus;

  @Column({ type: 'enum', enum: OpportunityStage, default: OpportunityStage.SEED })
  stage!: OpportunityStage;

  @Index()
  @Column({ type: 'varchar', length: 200 })
  clientName!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  clientContact!: string | null;

  // ─── Wave 2 — Pipeline & Stage ───

  @Index()
  @Column({ type: 'uuid', nullable: true })
  pipelineId!: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  stageId!: string | null;

  @ManyToOne(() => PipelineStageEntity, { eager: true, nullable: true })
  @JoinColumn({ name: 'stageId' })
  currentStage?: PipelineStageEntity | null;

  // ─── Wave 2 — Account & Contact links ───

  @Index()
  @Column({ type: 'uuid', nullable: true })
  accountId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  primaryContactId!: string | null;

  // ─── Wave 2 — Enhanced fields ───

  @Column({ type: 'enum', enum: OpportunityType, nullable: true })
  type!: OpportunityType | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  priority!: Priority | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  estimatedValue!: number;

  @Column({ type: 'int', default: 0 })
  probability!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  weightedValue!: number;

  @Column({ type: 'date', nullable: true })
  expectedCloseDate!: string | null;

  @Column({ type: 'date', nullable: true })
  actualCloseDate!: string | null;

  @Column({ type: 'enum', enum: ForecastCategory, nullable: true })
  forecastCategory!: ForecastCategory | null;

  // ─── Wave 2 — Deal Health ───

  @Column({ type: 'int', default: 0 })
  healthScore!: number;

  @Column({ type: 'enum', enum: DealHealth, nullable: true })
  healthStatus!: DealHealth | null;

  // ─── Wave 2 — Next step / activity tracking ───

  @Column({ type: 'varchar', length: 500, nullable: true })
  nextStep!: string | null;

  @Column({ type: 'date', nullable: true })
  nextStepDueDate!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  lostReason!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  leadSource!: string | null;

  @Column({ type: 'uuid', nullable: true })
  sourceLeadId!: string | null;

  @Column({ type: 'int', default: 0 })
  pushCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  stageChangedAt!: Date | null;

  @Column({ type: 'int', default: 0 })
  daysInCurrentStage!: number;

  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt!: Date | null;

  @Column({ type: 'int', default: 0 })
  daysSinceLastActivity!: number;

  @Column({ type: 'simple-array', nullable: true })
  tags!: string[] | null;

  // ─── Core fields ───

  @Column({ type: 'uuid' })
  ownerId!: string;

  @Column({ type: 'uuid', nullable: true })
  convertedProjectId!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  convertedAt!: Date | null;

  @Index({ spatial: false })
  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Index()
  @Column({ type: 'varchar', length: 36, nullable: true })
  tenantId!: string | null;

  // ─── Relations ───

  @OneToMany(() => OpportunityStakeholderEntity, (s) => s.opportunity, { cascade: true })
  stakeholders?: OpportunityStakeholderEntity[];

  @OneToMany(() => OpportunityTeamMemberEntity, (t) => t.opportunity, { cascade: true })
  teamMembers?: OpportunityTeamMemberEntity[];

  @OneToMany(() => OpportunityLineItemEntity, (li) => li.opportunity, { cascade: true })
  lineItems?: OpportunityLineItemEntity[];

  @OneToMany(() => OpportunityCompetitorEntity, (c) => c.opportunity, { cascade: true })
  competitors?: OpportunityCompetitorEntity[];
}
