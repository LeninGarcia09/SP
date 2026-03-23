import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProjectStatus } from '@bizops/shared';

@Entity('projects')
export class ProjectEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.PLANNING })
  status!: ProjectStatus;

  @Column({ type: 'date' })
  startDate!: string;

  @Column({ type: 'date' })
  endDate!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  budget!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  actualCost!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  costRate!: number;

  @Column({ type: 'uuid', nullable: true })
  programId!: string | null;

  @ManyToOne('ProgramEntity', 'projects', { nullable: true })
  @JoinColumn({ name: 'programId' })
  program?: import('../programs/program.entity').ProgramEntity;

  @Column({ type: 'uuid' })
  projectLeadId!: string;

  @Column({ type: 'uuid' })
  createdBy!: string;

  @Index({ spatial: false })
  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
