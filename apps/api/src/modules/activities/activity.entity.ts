import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ActivityType, ActivityStatus, Priority } from '@telnub/shared';

export { ActivityType, ActivityStatus };

@Entity('activities')
export class ActivityEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 36, nullable: true })
  tenantId!: string | null;

  @Index()
  @Column({ type: 'enum', enum: ActivityType })
  type!: ActivityType;

  @Column({ type: 'varchar', length: 50, nullable: true })
  subtype!: string | null;

  @Column({ type: 'varchar', length: 500 })
  subject!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  opportunityId!: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  accountId!: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  contactId!: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  leadId!: string | null;

  @Column({ type: 'enum', enum: ActivityStatus, nullable: true })
  status!: ActivityStatus | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  priority!: Priority | null;

  @Index()
  @Column({ type: 'timestamptz', nullable: true })
  dueDate!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  startTime!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endTime!: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  location!: string | null;

  @Column({ type: 'int', nullable: true })
  duration!: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  outcome!: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  assignedToId!: string | null;

  @Column({ type: 'boolean', default: false })
  isAutomated!: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @Column({ type: 'uuid' })
  createdBy!: string;

  @Index()
  @CreateDateColumn()
  createdAt!: Date;

  // Activities are APPEND-ONLY — no updatedAt, no deletedAt
}
