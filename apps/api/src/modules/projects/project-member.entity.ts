import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
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
}
