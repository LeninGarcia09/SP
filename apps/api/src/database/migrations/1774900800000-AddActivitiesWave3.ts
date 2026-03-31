import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActivitiesWave31774900800000 implements MigrationInterface {
  name = '1774900800000-AddActivitiesWave3';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enums
    await queryRunner.query(`
      CREATE TYPE "activity_type_enum" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK', 'STAGE_CHANGE', 'STATUS_CHANGE', 'SYSTEM')
    `);
    await queryRunner.query(`
      CREATE TYPE "activity_status_enum" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
    `);

    // Activities table (APPEND-ONLY — no updatedAt, no deletedAt)
    await queryRunner.query(`
      CREATE TABLE "activities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" varchar(36),
        "type" "activity_type_enum" NOT NULL,
        "subtype" varchar(50),
        "subject" varchar(500) NOT NULL,
        "description" text,
        "opportunityId" uuid,
        "accountId" uuid,
        "contactId" uuid,
        "status" "activity_status_enum",
        "priority" varchar(50),
        "dueDate" timestamptz,
        "completedAt" timestamptz,
        "startTime" timestamptz,
        "endTime" timestamptz,
        "location" varchar(500),
        "duration" integer,
        "outcome" varchar(100),
        "assignedToId" uuid,
        "isAutomated" boolean NOT NULL DEFAULT false,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdBy" uuid NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activities" PRIMARY KEY ("id")
      )
    `);

    // Indexes on activities
    await queryRunner.query(`CREATE INDEX "IDX_activities_tenantId" ON "activities" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_activities_type" ON "activities" ("type")`);
    await queryRunner.query(`CREATE INDEX "IDX_activities_opportunityId" ON "activities" ("opportunityId")`);
    await queryRunner.query(`CREATE INDEX "IDX_activities_accountId" ON "activities" ("accountId")`);
    await queryRunner.query(`CREATE INDEX "IDX_activities_contactId" ON "activities" ("contactId")`);
    await queryRunner.query(`CREATE INDEX "IDX_activities_assignedToId" ON "activities" ("assignedToId")`);
    await queryRunner.query(`CREATE INDEX "IDX_activities_dueDate" ON "activities" ("dueDate")`);
    await queryRunner.query(`CREATE INDEX "IDX_activities_createdAt" ON "activities" ("createdAt")`);

    // FK constraints
    await queryRunner.query(`
      ALTER TABLE "activities" ADD CONSTRAINT "FK_activities_opportunity"
      FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "activities" ADD CONSTRAINT "FK_activities_account"
      FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "activities" ADD CONSTRAINT "FK_activities_contact"
      FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL
    `);

    // Activity Templates table
    await queryRunner.query(`
      CREATE TABLE "activity_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" varchar(36),
        "name" varchar(100) NOT NULL,
        "type" "activity_type_enum" NOT NULL,
        "subjectTemplate" varchar(500) NOT NULL,
        "descriptionTemplate" text,
        "defaultDuration" integer,
        "defaultMetadata" jsonb NOT NULL DEFAULT '{}',
        "defaultDaysFromNow" integer NOT NULL DEFAULT 1,
        "category" varchar(50),
        "isActive" boolean NOT NULL DEFAULT true,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "createdBy" uuid NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activity_templates" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_activity_templates_tenantId" ON "activity_templates" ("tenantId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "activity_templates"`);
    await queryRunner.query(`ALTER TABLE "activities" DROP CONSTRAINT IF EXISTS "FK_activities_contact"`);
    await queryRunner.query(`ALTER TABLE "activities" DROP CONSTRAINT IF EXISTS "FK_activities_account"`);
    await queryRunner.query(`ALTER TABLE "activities" DROP CONSTRAINT IF EXISTS "FK_activities_opportunity"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "activities"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "activity_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "activity_type_enum"`);
  }
}
