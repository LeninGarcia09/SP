import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ActivityType } from '@telnub/shared';

@Entity('activity_templates')
export class ActivityTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 36, nullable: true })
  tenantId!: string | null;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'enum', enum: ActivityType })
  type!: ActivityType;

  @Column({ type: 'varchar', length: 500 })
  subjectTemplate!: string;

  @Column({ type: 'text', nullable: true })
  descriptionTemplate!: string | null;

  @Column({ type: 'int', nullable: true })
  defaultDuration!: number | null;

  @Column({ type: 'jsonb', default: {} })
  defaultMetadata!: Record<string, unknown>;

  @Column({ type: 'int', default: 1 })
  defaultDaysFromNow!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
