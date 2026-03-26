import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ProjectMemberRole } from '@telnub/shared';

@Entity('project_members')
export class ProjectMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  projectId!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: ProjectMemberRole, default: ProjectMemberRole.MEMBER })
  role!: ProjectMemberRole;

  @CreateDateColumn()
  joinedAt!: Date;

  @Index()
  @Column({ type: 'varchar', length: 36, nullable: true })
  tenantId!: string | null;
}
