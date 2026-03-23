import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ProgramStatus } from '@bizops/shared';
import { ProjectEntity } from '../projects/project.entity';

@Entity('programs')
export class ProgramEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ type: 'enum', enum: ProgramStatus, default: ProgramStatus.PLANNING })
  status!: ProgramStatus;

  @Column({ type: 'date' })
  startDate!: string;

  @Column({ type: 'date', nullable: true })
  endDate!: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  budget!: number;

  @Column({ type: 'uuid' })
  managerId!: string;

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

  @OneToMany(() => ProjectEntity, (p) => p.program)
  projects!: ProjectEntity[];
}
