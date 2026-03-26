import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProjectEntity } from '../projects/project.entity';

@Entity('project_health_snapshots')
export class ProjectHealthSnapshotEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: ProjectEntity;

  @Column({ type: 'date' })
  snapshotDate: string;

  @Column({ type: 'varchar', length: 20, default: 'GRAY' })
  overallRag: string; // GREEN | AMBER | RED | BLUE | GRAY

  @Column({ type: 'varchar', length: 20, default: 'GRAY' })
  scheduleRag: string;

  @Column({ type: 'varchar', length: 20, default: 'GRAY' })
  budgetRag: string;

  @Column({ type: 'boolean', default: true })
  autoCalculated: boolean;

  @Column({ type: 'text', nullable: true })
  overrideReason: string | null;

  @Column({ type: 'uuid', nullable: true })
  overrideBy: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @Index()
  @Column({ type: 'varchar', length: 36, nullable: true })
  tenantId: string | null;
}
