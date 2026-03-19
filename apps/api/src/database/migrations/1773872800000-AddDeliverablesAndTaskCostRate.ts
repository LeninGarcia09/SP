import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeliverablesAndTaskCostRate1773872800000 implements MigrationInterface {
  name = 'AddDeliverablesAndTaskCostRate1773872800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create deliverables table
    await queryRunner.query(`
      CREATE TABLE "deliverables" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "projectId" uuid NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "status" varchar(50) NOT NULL DEFAULT 'PLANNED',
        "budget" decimal(15,2) NOT NULL DEFAULT 0,
        "startDate" date,
        "dueDate" date,
        "sortOrder" int NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_deliverables" PRIMARY KEY ("id"),
        CONSTRAINT "FK_deliverables_project" FOREIGN KEY ("projectId")
          REFERENCES "projects"("id") ON DELETE CASCADE
      )
    `);

    // Index for efficient project + sort queries
    await queryRunner.query(`
      CREATE INDEX "IDX_deliverables_project_sort" ON "deliverables" ("projectId", "sortOrder")
    `);

    // Add deliverableId to tasks
    await queryRunner.query(`
      ALTER TABLE "tasks" ADD COLUMN "deliverableId" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_deliverable"
        FOREIGN KEY ("deliverableId") REFERENCES "deliverables"("id")
        ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tasks_deliverable" ON "tasks" ("deliverableId")
    `);

    // Add costRate to tasks (per-task rate override, nullable = use project rate)
    await queryRunner.query(`
      ALTER TABLE "tasks" ADD COLUMN "costRate" decimal(10,2)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "costRate"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_deliverable"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "deliverableId"`);
    await queryRunner.query(`DROP INDEX "IDX_deliverables_project_sort"`);
    await queryRunner.query(`DROP TABLE "deliverables"`);
  }
}
