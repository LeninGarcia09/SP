import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1773349169386 implements MigrationInterface {
    name = 'InitialSchema1773349169386'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('GLOBAL_LEAD', 'BIZ_OPS_MANAGER', 'RESOURCE_MANAGER', 'PROGRAM_MANAGER', 'PROJECT_LEAD', 'PROJECT_PERSONNEL', 'INVENTORY_MANAGER', 'HR_ADMIN')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "azureAdOid" character varying NOT NULL, "email" character varying NOT NULL, "displayName" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'PROJECT_PERSONNEL', "departmentId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f9b2e5259bf9ce6eb83ab47ca7e" UNIQUE ("azureAdOid"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."projects_status_enum" AS ENUM('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "name" character varying NOT NULL, "description" text NOT NULL DEFAULT '', "status" "public"."projects_status_enum" NOT NULL DEFAULT 'PLANNING', "startDate" date NOT NULL, "endDate" date NOT NULL, "budget" numeric(15,2) NOT NULL DEFAULT '0', "programId" uuid, "projectLeadId" uuid NOT NULL, "createdBy" uuid NOT NULL, "metadata" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d95a87318392465ab663a32cc4f" UNIQUE ("code"), CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6760b45e12d7adf169195241a0" ON "projects" ("metadata") `);
        await queryRunner.query(`CREATE TYPE "public"."project_members_role_enum" AS ENUM('LEAD', 'MEMBER', 'OBSERVER')`);
        await queryRunner.query(`CREATE TABLE "project_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "projectId" uuid NOT NULL, "userId" uuid NOT NULL, "role" "public"."project_members_role_enum" NOT NULL DEFAULT 'MEMBER', "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0b2f46f804be4aea9234c78bcc9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "project_notes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "projectId" uuid NOT NULL, "authorId" uuid NOT NULL, "content" text NOT NULL, "metadata" jsonb NOT NULL DEFAULT '{}', "isPinned" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2d41dc22b10c9ef4955026c4865" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "projectId" uuid NOT NULL, "title" character varying(255) NOT NULL, "description" text, "status" character varying(50) NOT NULL DEFAULT 'TODO', "priority" character varying(50) NOT NULL DEFAULT 'MEDIUM', "assigneeId" uuid, "dueDate" date, "estimatedHours" numeric(6,2), "actualHours" numeric(6,2), "parentTaskId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "project_health_snapshots" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "projectId" uuid NOT NULL, "snapshotDate" date NOT NULL, "overallRag" character varying(20) NOT NULL DEFAULT 'GRAY', "scheduleRag" character varying(20) NOT NULL DEFAULT 'GRAY', "budgetRag" character varying(20) NOT NULL DEFAULT 'GRAY', "autoCalculated" boolean NOT NULL DEFAULT true, "overrideReason" text, "overrideBy" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d136224c5be95df5540113993d6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "persons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid, "employeeId" character varying(100), "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "jobTitle" character varying(200) NOT NULL, "departmentId" uuid, "assignmentStatus" character varying(50) NOT NULL DEFAULT 'ON_BENCH', "startDate" date NOT NULL, "skills" text array NOT NULL DEFAULT '{}', "availabilityNotes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7de8b6e4eb0336e6ddf36c7a216" UNIQUE ("employeeId"), CONSTRAINT "UQ_928155276ca8852f3c440cc2b2c" UNIQUE ("email"), CONSTRAINT "PK_74278d8812a049233ce41440ac7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "project_assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "personId" uuid NOT NULL, "projectId" uuid NOT NULL, "role" character varying(100) NOT NULL, "allocationPercent" integer NOT NULL DEFAULT '100', "startDate" date, "endDate" date, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_045df8f32ae1d54810b39b9c7bd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "inventory_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sku" character varying(100) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "category" character varying(50) NOT NULL, "status" character varying(50) NOT NULL DEFAULT 'AVAILABLE', "serialNumber" character varying(200), "location" character varying(200), "purchaseDate" date, "purchaseCost" numeric(12,2), "assignedToPersonId" uuid, "assignedToProjectId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_395ec8d9e0cad6e3890b989fc1c" UNIQUE ("sku"), CONSTRAINT "PK_cf2f451407242e132547ac19169" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "inventory_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "itemId" uuid NOT NULL, "transactionType" character varying(50) NOT NULL, "fromPersonId" uuid, "toPersonId" uuid, "fromProjectId" uuid, "toProjectId" uuid, "performedById" uuid NOT NULL, "notes" text, "transactionDate" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9b7144851f08f9eededde7edd42" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_34701b0b8d466af308ba202e4ef" FOREIGN KEY ("parentTaskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_health_snapshots" ADD CONSTRAINT "FK_152b7cde8ce000f195b404d8950" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_assignments" ADD CONSTRAINT "FK_e6dfc65ab07f87992a401453b57" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_assignments" ADD CONSTRAINT "FK_9c5f0cbd89c4d1e858a4b4a4e4f" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_transactions" ADD CONSTRAINT "FK_d027ed40e39e81b95d21a3e8c98" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_transactions" DROP CONSTRAINT "FK_d027ed40e39e81b95d21a3e8c98"`);
        await queryRunner.query(`ALTER TABLE "project_assignments" DROP CONSTRAINT "FK_9c5f0cbd89c4d1e858a4b4a4e4f"`);
        await queryRunner.query(`ALTER TABLE "project_assignments" DROP CONSTRAINT "FK_e6dfc65ab07f87992a401453b57"`);
        await queryRunner.query(`ALTER TABLE "project_health_snapshots" DROP CONSTRAINT "FK_152b7cde8ce000f195b404d8950"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_34701b0b8d466af308ba202e4ef"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956"`);
        await queryRunner.query(`DROP TABLE "inventory_transactions"`);
        await queryRunner.query(`DROP TABLE "inventory_items"`);
        await queryRunner.query(`DROP TABLE "project_assignments"`);
        await queryRunner.query(`DROP TABLE "persons"`);
        await queryRunner.query(`DROP TABLE "project_health_snapshots"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP TABLE "project_notes"`);
        await queryRunner.query(`DROP TABLE "project_members"`);
        await queryRunner.query(`DROP TYPE "public"."project_members_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6760b45e12d7adf169195241a0"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`DROP TYPE "public"."projects_status_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
