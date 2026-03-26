import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProficiencyLevel } from '@telnub/shared';
import { PersonEntity } from '../personnel/person.entity';
import { SkillEntity } from './skill.entity';

@Entity('person_skills')
@Index(['personId', 'skillId'], { unique: true })
export class PersonSkillEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  personId!: string;

  @Column({ type: 'uuid' })
  skillId!: string;

  @Column({ type: 'enum', enum: ProficiencyLevel, default: ProficiencyLevel.BEGINNER })
  proficiency!: ProficiencyLevel;

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  yearsOfExperience!: number | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @ManyToOne(() => PersonEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'personId' })
  person!: PersonEntity;

  @ManyToOne(() => SkillEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'skillId' })
  skill!: SkillEntity;

  @Index()
  @Column({ type: 'varchar', length: 36, nullable: true })
  tenantId!: string | null;
}
