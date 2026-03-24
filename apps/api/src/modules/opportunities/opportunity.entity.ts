import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { OpportunityStatus, OpportunityStage } from '@telnub/shared';

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

  @Column({ type: 'enum', enum: OpportunityStatus, default: OpportunityStatus.IDENTIFIED })
  status!: OpportunityStatus;

  @Column({ type: 'enum', enum: OpportunityStage, default: OpportunityStage.SEED })
  stage!: OpportunityStage;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  estimatedValue!: number;

  @Column({ type: 'int', default: 0 })
  probability!: number;

  @Column({ type: 'date', nullable: true })
  expectedCloseDate!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 200 })
  clientName!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  clientContact!: string | null;

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
}
