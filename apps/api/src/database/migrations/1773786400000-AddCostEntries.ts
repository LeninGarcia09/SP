import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCostEntries1773786400000 implements MigrationInterface {
  name = 'AddCostEntries1773786400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extend notifications type enum with new cost-related types
    await queryRunner.query(`ALTER TYPE "notifications_type_enum" ADD VALUE IF NOT EXISTS 'COST_SUBMITTED'`);
    await queryRunner.query(`ALTER TYPE "notifications_type_enum" ADD VALUE IF NOT EXISTS 'COST_APPROVED'`);
    await queryRunner.query(`ALTER TYPE "notifications_type_enum" ADD VALUE IF NOT EXISTS 'COST_REJECTED'`);
    await queryRunner.query(`ALTER TYPE "notifications_type_enum" ADD VALUE IF NOT EXISTS 'BUDGET_THRESHOLD'`);

    await queryRunner.query(`
      CREATE TABLE "cost_entries" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "projectId" UUID NOT NULL,
        "taskId" UUID,
        "category" VARCHAR(30) NOT NULL,
        "description" VARCHAR(500) NOT NULL,
        "vendor" VARCHAR(200),
        "amount" DECIMAL(15,2) NOT NULL,
        "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
        "date" DATE NOT NULL,
        "invoiceRef" VARCHAR(200),
        "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
        "submittedById" UUID NOT NULL,
        "approvedById" UUID,
        "approvedAt" TIMESTAMP,
        "notes" TEXT,
        "metadata" JSONB NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cost_entries" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cost_entries_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cost_entries_task" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_cost_entries_submitter" FOREIGN KEY ("submittedById") REFERENCES "users"("id"),
        CONSTRAINT "FK_cost_entries_approver" FOREIGN KEY ("approvedById") REFERENCES "users"("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_cost_entries_project" ON "cost_entries" ("projectId")`);
    await queryRunner.query(`CREATE INDEX "IDX_cost_entries_project_status" ON "cost_entries" ("projectId", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_cost_entries_category" ON "cost_entries" ("category")`);
    await queryRunner.query(`CREATE INDEX "IDX_cost_entries_date" ON "cost_entries" ("date")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_cost_entries_date"`);
    await queryRunner.query(`DROP INDEX "IDX_cost_entries_category"`);
    await queryRunner.query(`DROP INDEX "IDX_cost_entries_project_status"`);
    await queryRunner.query(`DROP INDEX "IDX_cost_entries_project"`);
    await queryRunner.query(`DROP TABLE "cost_entries"`);
  }
}
