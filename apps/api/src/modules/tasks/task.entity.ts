import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProjectEntity } from '../projects/project.entity';
import { DeliverableEntity } from '../deliverables/deliverable.entity';

@Entity('tasks')
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: ProjectEntity;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50, default: 'TODO' })
  status: string; // TODO | IN_PROGRESS | BLOCKED | DONE

  @Column({ type: 'varchar', length: 50, default: 'MEDIUM' })
  priority: string; // LOW | MEDIUM | HIGH | CRITICAL

  @Column({ type: 'uuid', nullable: true })
  assigneeId: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdById: string | null;

  @Column({ type: 'date', nullable: true })
  startDate: string | null;

  @Column({ type: 'date', nullable: true })
  dueDate: string | null;

  @Column({ type: 'date', nullable: true })
  completedDate: string | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  estimatedHours: number | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  actualHours: number | null;

  @Column({ type: 'uuid', nullable: true })
  parentTaskId: string | null;

  @ManyToOne(() => TaskEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentTaskId' })
  parentTask: TaskEntity | null;

  @Column({ type: 'uuid', nullable: true })
  deliverableId: string | null;

  @ManyToOne(() => DeliverableEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'deliverableId' })
  deliverable: DeliverableEntity | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costRate: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
