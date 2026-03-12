import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { UserEntity } from '../modules/users/user.entity';
import { ProjectEntity } from '../modules/projects/project.entity';
import { ProjectMemberEntity } from '../modules/projects/project-member.entity';
import { ProjectNoteEntity } from '../modules/projects/project-note.entity';
import { TaskEntity } from '../modules/tasks/task.entity';
import { ProjectHealthSnapshotEntity } from '../modules/health/health-snapshot.entity';
import { PersonEntity } from '../modules/personnel/person.entity';
import { ProjectAssignmentEntity } from '../modules/personnel/project-assignment.entity';
import { InventoryItemEntity } from '../modules/inventory/inventory-item.entity';
import { InventoryTransactionEntity } from '../modules/inventory/inventory-transaction.entity';

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
    ProjectHealthSnapshotEntity,
    PersonEntity,
    ProjectAssignmentEntity,
    InventoryItemEntity,
    InventoryTransactionEntity,
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: ['error'],
});
