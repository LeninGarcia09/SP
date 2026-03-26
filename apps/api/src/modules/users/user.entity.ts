import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '@telnub/shared';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  azureAdOid!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  displayName!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.TEAM_MEMBER })
  role!: UserRole;

  @Column({ type: 'uuid', nullable: true })
  departmentId!: string | null;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  jobTitle!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  tenantId!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  m365SyncedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
