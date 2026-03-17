import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskActivityAndCreatedBy1773608400000 implements MigrationInterface {
  name = 'AddTaskActivityAndCreatedBy1773608400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add createdById to tasks
    await queryRunner.query(`ALTER TABLE "tasks" ADD COLUMN "createdById" uuid`);

    // Create task_activities audit log table
    await queryRunner.query(`
      CREATE TABLE "task_activities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "taskId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "activityType" varchar(50) NOT NULL,
        "field" varchar(100),
        "oldValue" text,
        "newValue" text,
        "comment" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_task_activities" PRIMARY KEY ("id"),
        CONSTRAINT "FK_task_activities_task" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE
      )
    `);

    // Add new notification types to the enum
    await queryRunner.query(`ALTER TYPE "notifications_type_enum" ADD VALUE IF NOT EXISTS 'TASK_OVERDUE'`);
    await queryRunner.query(`ALTER TYPE "notifications_type_enum" ADD VALUE IF NOT EXISTS 'TASK_COMMENT'`);

    // Indexes for performance
    await queryRunner.query(`CREATE INDEX "IDX_task_activities_taskId" ON "task_activities" ("taskId")`);
    await queryRunner.query(`CREATE INDEX "IDX_task_activities_createdAt" ON "task_activities" ("createdAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_tasks_assigneeId" ON "tasks" ("assigneeId")`);
    await queryRunner.query(`CREATE INDEX "IDX_tasks_dueDate" ON "tasks" ("dueDate")`);
    await queryRunner.query(`CREATE INDEX "IDX_tasks_status" ON "tasks" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_dueDate"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_assigneeId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_task_activities_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_task_activities_taskId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "task_activities"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN IF EXISTS "createdById"`);
  }
}
