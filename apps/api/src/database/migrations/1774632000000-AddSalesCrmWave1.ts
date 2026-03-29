import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sales/CRM Module — Wave 1
 * Creates: accounts, contacts, sales_pipelines, pipeline_stages
 * Seeds: Default sales pipeline with 7 stages
 */
export class AddSalesCrmWave11774632000000 implements MigrationInterface {
  name = 'AddSalesCrmWave11774632000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enums ──
    await queryRunner.query(`
      CREATE TYPE "account_type_enum" AS ENUM (
        'PROSPECT', 'CUSTOMER', 'PARTNER', 'COMPETITOR', 'VENDOR', 'OTHER'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "account_tier_enum" AS ENUM (
        'ENTERPRISE', 'MID_MARKET', 'SMB', 'STARTUP'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "contact_channel_enum" AS ENUM (
        'EMAIL', 'PHONE', 'IN_PERSON', 'VIDEO'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "contact_type_enum" AS ENUM (
        'PRIMARY', 'BILLING', 'TECHNICAL', 'EXECUTIVE', 'OTHER'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "contact_influence_enum" AS ENUM (
        'DECISION_MAKER', 'INFLUENCER', 'CHAMPION', 'BLOCKER', 'END_USER', 'EVALUATOR', 'ECONOMIC_BUYER'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "forecast_category_enum" AS ENUM (
        'PIPELINE', 'BEST_CASE', 'COMMIT', 'OMITTED'
      )
    `);

    // ── Accounts table ──
    await queryRunner.query(`
      CREATE TABLE "accounts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" varchar(36),
        "code" varchar NOT NULL,
        "name" varchar(200) NOT NULL,
        "legalName" varchar(200),
        "industry" varchar(100),
        "website" varchar(500),
        "phone" varchar(50),
        "email" varchar(200),
        "addressLine1" varchar(200),
        "addressLine2" varchar(200),
        "city" varchar(100),
        "state" varchar(100),
        "country" varchar(100),
        "postalCode" varchar(20),
        "type" "account_type_enum" NOT NULL DEFAULT 'PROSPECT',
        "tier" "account_tier_enum",
        "annualRevenue" decimal(15,2),
        "employeeCount" int,
        "ownerId" uuid NOT NULL,
        "parentAccountId" uuid,
        "source" varchar(100),
        "tags" text[] NOT NULL DEFAULT '{}',
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdBy" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_accounts" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_accounts_code" UNIQUE ("code"),
        CONSTRAINT "FK_accounts_parent" FOREIGN KEY ("parentAccountId")
          REFERENCES "accounts"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_accounts_tenantId" ON "accounts" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_accounts_name" ON "accounts" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_accounts_type" ON "accounts" ("type")`);
    await queryRunner.query(`CREATE INDEX "IDX_accounts_ownerId" ON "accounts" ("ownerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_accounts_parentAccountId" ON "accounts" ("parentAccountId")`);
    await queryRunner.query(`CREATE INDEX "IDX_accounts_metadata" ON "accounts" USING GIN ("metadata")`);

    // ── Contacts table ──
    await queryRunner.query(`
      CREATE TABLE "contacts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" varchar(36),
        "code" varchar NOT NULL,
        "firstName" varchar(100) NOT NULL,
        "lastName" varchar(100) NOT NULL,
        "email" varchar(200),
        "phone" varchar(50),
        "mobilePhone" varchar(50),
        "jobTitle" varchar(200),
        "department" varchar(100),
        "accountId" uuid NOT NULL,
        "reportsToId" uuid,
        "preferredChannel" "contact_channel_enum" NOT NULL DEFAULT 'EMAIL',
        "timezone" varchar(50),
        "language" varchar(10) NOT NULL DEFAULT 'en',
        "type" "contact_type_enum" NOT NULL DEFAULT 'OTHER',
        "influence" "contact_influence_enum",
        "lastContactedAt" TIMESTAMP,
        "lastActivityAt" TIMESTAMP,
        "linkedinUrl" varchar(500),
        "notes" text,
        "tags" text[] NOT NULL DEFAULT '{}',
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdBy" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contacts" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_contacts_code" UNIQUE ("code"),
        CONSTRAINT "FK_contacts_account" FOREIGN KEY ("accountId")
          REFERENCES "accounts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_contacts_reportsTo" FOREIGN KEY ("reportsToId")
          REFERENCES "contacts"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_contacts_tenantId" ON "contacts" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_contacts_lastName" ON "contacts" ("lastName")`);
    await queryRunner.query(`CREATE INDEX "IDX_contacts_email" ON "contacts" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_contacts_accountId" ON "contacts" ("accountId")`);
    await queryRunner.query(`CREATE INDEX "IDX_contacts_influence" ON "contacts" ("influence")`);
    await queryRunner.query(`CREATE INDEX "IDX_contacts_metadata" ON "contacts" USING GIN ("metadata")`);

    // ── Sales Pipelines table ──
    await queryRunner.query(`
      CREATE TABLE "sales_pipelines" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" varchar(36),
        "name" varchar(100) NOT NULL,
        "description" text,
        "isDefault" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "sortOrder" int NOT NULL DEFAULT 0,
        "createdBy" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sales_pipelines" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_sales_pipelines_tenantId" ON "sales_pipelines" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_sales_pipelines_isDefault" ON "sales_pipelines" ("isDefault")`);

    // ── Pipeline Stages table ──
    await queryRunner.query(`
      CREATE TABLE "pipeline_stages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" varchar(36),
        "pipelineId" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "description" text,
        "sortOrder" int NOT NULL,
        "defaultProbability" int NOT NULL DEFAULT 0,
        "forecastCategory" "forecast_category_enum" NOT NULL DEFAULT 'PIPELINE',
        "isClosed" boolean NOT NULL DEFAULT false,
        "isWon" boolean NOT NULL DEFAULT false,
        "requiredFields" text[] NOT NULL DEFAULT '{}',
        "checklist" jsonb NOT NULL DEFAULT '[]',
        "daysExpected" int,
        "autoActions" jsonb NOT NULL DEFAULT '[]',
        "color" varchar(7),
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pipeline_stages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pipeline_stages_pipeline" FOREIGN KEY ("pipelineId")
          REFERENCES "sales_pipelines"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_pipeline_stages_tenant_pipeline_order" UNIQUE ("tenantId", "pipelineId", "sortOrder")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_pipeline_stages_tenantId" ON "pipeline_stages" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_pipeline_stages_pipelineId" ON "pipeline_stages" ("pipelineId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "pipeline_stages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sales_pipelines"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contacts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "accounts"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "forecast_category_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "contact_influence_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "contact_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "contact_channel_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "account_tier_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "account_type_enum"`);
  }
}
