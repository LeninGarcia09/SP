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
import { ForecastCategory } from '@telnub/shared';
import { SalesPipelineEntity } from './sales-pipeline.entity';

@Entity('pipeline_stages')
@Index(['tenantId', 'pipelineId', 'sortOrder'], { unique: true })
export class PipelineStageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 36, nullable: true })
  tenantId!: string | null;

  @Index()
  @Column({ type: 'uuid' })
  pipelineId!: string;

  @ManyToOne(() => SalesPipelineEntity, (p) => p.stages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pipelineId' })
  pipeline?: SalesPipelineEntity;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'int' })
  sortOrder!: number;

  @Column({ type: 'int', default: 0 })
  defaultProbability!: number;

  @Column({ type: 'enum', enum: ForecastCategory, default: ForecastCategory.PIPELINE })
  forecastCategory!: ForecastCategory;

  @Column({ type: 'boolean', default: false })
  isClosed!: boolean;

  @Column({ type: 'boolean', default: false })
  isWon!: boolean;

  @Column({ type: 'text', array: true, default: '{}' })
  requiredFields!: string[];

  @Column({ type: 'jsonb', default: [] })
  checklist!: Record<string, unknown>[];

  @Column({ type: 'int', nullable: true })
  daysExpected!: number | null;

  @Column({ type: 'jsonb', default: [] })
  autoActions!: Record<string, unknown>[];

  @Column({ type: 'varchar', length: 7, nullable: true })
  color!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
