import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { UserEntity } from '../modules/users/user.entity';
import { ProjectEntity } from '../modules/projects/project.entity';
import { ProjectMemberEntity } from '../modules/projects/project-member.entity';
import { ProjectNoteEntity } from '../modules/projects/project-note.entity';
import { TaskEntity } from '../modules/tasks/task.entity';
import { TaskActivityEntity } from '../modules/tasks/task-activity.entity';
import { ProjectHealthSnapshotEntity } from '../modules/health/health-snapshot.entity';
import { PersonEntity } from '../modules/personnel/person.entity';
import { ProjectAssignmentEntity } from '../modules/personnel/project-assignment.entity';
import { InventoryItemEntity } from '../modules/inventory/inventory-item.entity';
import { InventoryTransactionEntity } from '../modules/inventory/inventory-transaction.entity';
import { NotificationEntity } from '../modules/notifications/notification.entity';
import { SkillEntity } from '../modules/skills/skill.entity';
import { PersonSkillEntity } from '../modules/skills/person-skill.entity';
import { ProgramEntity } from '../modules/programs/program.entity';
import { OpportunityEntity } from '../modules/opportunities/opportunity.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [
    UserEntity,
    ProjectEntity,
    ProjectMemberEntity,
    ProjectNoteEntity,
    TaskEntity,
    TaskActivityEntity,
    ProjectHealthSnapshotEntity,
    PersonEntity,
    ProjectAssignmentEntity,
    InventoryItemEntity,
    InventoryTransactionEntity,
    NotificationEntity,
    SkillEntity,
    PersonSkillEntity,
    ProgramEntity,
    OpportunityEntity,
  ],
  migrations: [path.join(__dirname, 'migrations', '*{.ts,.js}')],
  synchronize: process.env.TYPEORM_SYNC === 'true',
  logging: ['error'],
});
