import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { SkillCategory } from '@telnub/shared';

@Entity('skills')
export class SkillEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'enum', enum: SkillCategory })
  category!: SkillCategory;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @Index()
  @Column({ type: 'varchar', length: 36, nullable: true })
  tenantId!: string | null;
}
