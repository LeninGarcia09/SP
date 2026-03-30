import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { TeamMemberRole } from '@telnub/shared';
import { OpportunityEntity } from './opportunity.entity';

@Entity('opportunity_team_members')
@Unique(['opportunityId', 'userId'])
export class OpportunityTeamMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  opportunityId!: string;

  @ManyToOne(() => OpportunityEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opportunityId' })
  opportunity?: OpportunityEntity;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: TeamMemberRole, default: TeamMemberRole.OWNER })
  role!: TeamMemberRole;

  @CreateDateColumn()
  createdAt!: Date;
}
