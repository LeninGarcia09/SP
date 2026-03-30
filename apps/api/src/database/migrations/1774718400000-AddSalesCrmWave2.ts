import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sales/CRM Module — Wave 2
 * Creates: products, opportunity_stakeholders, opportunity_team_members,
 *          opportunity_line_items, opportunity_competitors
 * Alters:  opportunities (add pipeline/stage/account links, deal health, tracking columns)
 * Updates: forecast_category_enum (add CLOSED value)
 */
export class AddSalesCrmWave21774718400000 implements MigrationInterface {
  name = 'AddSalesCrmWave21774718400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── New enums ──
    await queryRunner.query(`
      CREATE TYPE "product_category_enum" AS ENUM (
        'SERVICE', 'PRODUCT', 'SUBSCRIPTION', 'LICENSE', 'CONSULTING', 'TRAINING', 'SUPPORT', 'OTHER'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "recurring_interval_enum" AS ENUM (
        'MONTHLY', 'QUARTERLY', 'ANNUALLY'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "opportunity_type_enum" AS ENUM (
        'NEW_BUSINESS', 'EXISTING_BUSINESS', 'RENEWAL', 'EXPANSION', 'UPSELL'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "deal_health_enum" AS ENUM (
        'HEALTHY', 'AT_RISK', 'STALLED', 'CRITICAL'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "stakeholder_role_enum" AS ENUM (
        'DECISION_MAKER', 'INFLUENCER', 'CHAMPION', 'BLOCKER', 'EVALUATOR',
        'ECONOMIC_BUYER', 'TECHNICAL_BUYER', 'END_USER', 'LEGAL', 'PROCUREMENT'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "stakeholder_influence_enum" AS ENUM (
        'HIGH', 'MEDIUM', 'LOW'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "stakeholder_sentiment_enum" AS ENUM (
        'POSITIVE', 'NEUTRAL', 'NEGATIVE', 'UNKNOWN'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "team_member_role_enum" AS ENUM (
        'OWNER', 'CO_OWNER', 'SALES_ENGINEER', 'SOLUTION_ARCHITECT',
        'ACCOUNT_MANAGER', 'EXECUTIVE_SPONSOR', 'SUBJECT_MATTER_EXPERT'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "threat_level_enum" AS ENUM (
        'LOW', 'MEDIUM', 'HIGH'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "competitor_status_enum" AS ENUM (
        'ACTIVE', 'WON_AGAINST', 'LOST_TO', 'WITHDRAWN'
      )
    `);

    // ── Add CLOSED to forecast_category_enum ──
    await queryRunner.query(`
      ALTER TYPE "forecast_category_enum" ADD VALUE IF NOT EXISTS 'CLOSED'
    `);

    // ── Products table ──
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" varchar(36),
        "code" varchar NOT NULL,
        "name" varchar(200) NOT NULL,
        "description" text,
        "category" "product_category_enum" NOT NULL DEFAULT 'SERVICE',
        "family" varchar(100),
        "unitPrice" decimal(15,2) NOT NULL DEFAULT 0,
        "currency" varchar(3) NOT NULL DEFAULT 'USD',
        "unit" varchar(50) NOT NULL DEFAULT 'unit',
        "isRecurring" boolean NOT NULL DEFAULT false,
        "recurringInterval" "recurring_interval_enum",
        "minQuantity" int NOT NULL DEFAULT 1,
        "maxDiscount" decimal(5,2) NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_products_code" UNIQUE ("code")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_products_tenantId" ON "products" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_category" ON "products" ("category")`);

    // ── Alter opportunities table — add Wave 2 columns ──
    await queryRunner.query(`
      ALTER TABLE "opportunities"
        ADD COLUMN "pipelineId" uuid,
        ADD COLUMN "stageId" uuid,
        ADD COLUMN "accountId" uuid,
        ADD COLUMN "primaryContactId" uuid,
        ADD COLUMN "type" "opportunity_type_enum",
        ADD COLUMN "priority" varchar(50),
        ADD COLUMN "weightedValue" decimal(15,2) NOT NULL DEFAULT 0,
        ADD COLUMN "actualCloseDate" date,
        ADD COLUMN "forecastCategory" "forecast_category_enum",
        ADD COLUMN "healthScore" int NOT NULL DEFAULT 0,
        ADD COLUMN "healthStatus" "deal_health_enum",
        ADD COLUMN "nextStep" varchar(500),
        ADD COLUMN "nextStepDueDate" date,
        ADD COLUMN "lostReason" varchar(500),
        ADD COLUMN "leadSource" varchar(100),
        ADD COLUMN "sourceLeadId" uuid,
        ADD COLUMN "pushCount" int NOT NULL DEFAULT 0,
        ADD COLUMN "stageChangedAt" TIMESTAMP,
        ADD COLUMN "daysInCurrentStage" int NOT NULL DEFAULT 0,
        ADD COLUMN "lastActivityAt" TIMESTAMP,
        ADD COLUMN "daysSinceLastActivity" int NOT NULL DEFAULT 0,
        ADD COLUMN "tags" text
    `);

    await queryRunner.query(`CREATE INDEX "IDX_opportunities_pipelineId" ON "opportunities" ("pipelineId")`);
    await queryRunner.query(`CREATE INDEX "IDX_opportunities_stageId" ON "opportunities" ("stageId")`);
    await queryRunner.query(`CREATE INDEX "IDX_opportunities_accountId" ON "opportunities" ("accountId")`);

    // FK constraints for opportunities
    await queryRunner.query(`
      ALTER TABLE "opportunities"
        ADD CONSTRAINT "FK_opportunities_pipeline" FOREIGN KEY ("pipelineId")
          REFERENCES "sales_pipelines"("id") ON DELETE SET NULL,
        ADD CONSTRAINT "FK_opportunities_stage" FOREIGN KEY ("stageId")
          REFERENCES "pipeline_stages"("id") ON DELETE SET NULL,
        ADD CONSTRAINT "FK_opportunities_account" FOREIGN KEY ("accountId")
          REFERENCES "accounts"("id") ON DELETE SET NULL,
        ADD CONSTRAINT "FK_opportunities_primaryContact" FOREIGN KEY ("primaryContactId")
          REFERENCES "contacts"("id") ON DELETE SET NULL
    `);

    // ── Opportunity Stakeholders table ──
    await queryRunner.query(`
      CREATE TABLE "opportunity_stakeholders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "opportunityId" uuid NOT NULL,
        "contactId" uuid NOT NULL,
        "role" "stakeholder_role_enum" NOT NULL DEFAULT 'INFLUENCER',
        "influence" "stakeholder_influence_enum" NOT NULL DEFAULT 'MEDIUM',
        "sentiment" "stakeholder_sentiment_enum" NOT NULL DEFAULT 'UNKNOWN',
        "isPrimary" boolean NOT NULL DEFAULT false,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_opportunity_stakeholders" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_opportunity_stakeholders_opp_contact" UNIQUE ("opportunityId", "contactId"),
        CONSTRAINT "FK_opportunity_stakeholders_opp" FOREIGN KEY ("opportunityId")
          REFERENCES "opportunities"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_opportunity_stakeholders_contact" FOREIGN KEY ("contactId")
          REFERENCES "contacts"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_opportunity_stakeholders_opportunityId" ON "opportunity_stakeholders" ("opportunityId")`);
    await queryRunner.query(`CREATE INDEX "IDX_opportunity_stakeholders_contactId" ON "opportunity_stakeholders" ("contactId")`);

    // ── Opportunity Team Members table ──
    await queryRunner.query(`
      CREATE TABLE "opportunity_team_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "opportunityId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "role" "team_member_role_enum" NOT NULL DEFAULT 'OWNER',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_opportunity_team_members" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_opportunity_team_members_opp_user" UNIQUE ("opportunityId", "userId"),
        CONSTRAINT "FK_opportunity_team_members_opp" FOREIGN KEY ("opportunityId")
          REFERENCES "opportunities"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_opportunity_team_members_opportunityId" ON "opportunity_team_members" ("opportunityId")`);
    await queryRunner.query(`CREATE INDEX "IDX_opportunity_team_members_userId" ON "opportunity_team_members" ("userId")`);

    // ── Opportunity Line Items table ──
    await queryRunner.query(`
      CREATE TABLE "opportunity_line_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "opportunityId" uuid NOT NULL,
        "productId" uuid,
        "name" varchar(200) NOT NULL,
        "description" text,
        "quantity" decimal(15,2) NOT NULL DEFAULT 1,
        "unitPrice" decimal(15,2) NOT NULL DEFAULT 0,
        "discount" decimal(5,2) NOT NULL DEFAULT 0,
        "totalPrice" decimal(15,2) NOT NULL DEFAULT 0,
        "serviceStartDate" date,
        "serviceEndDate" date,
        "sortOrder" int NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_opportunity_line_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_opportunity_line_items_opp" FOREIGN KEY ("opportunityId")
          REFERENCES "opportunities"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_opportunity_line_items_product" FOREIGN KEY ("productId")
          REFERENCES "products"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_opportunity_line_items_opportunityId" ON "opportunity_line_items" ("opportunityId")`);

    // ── Opportunity Competitors table ──
    await queryRunner.query(`
      CREATE TABLE "opportunity_competitors" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "opportunityId" uuid NOT NULL,
        "competitorName" varchar(200) NOT NULL,
        "competitorAccountId" uuid,
        "strengths" text,
        "weaknesses" text,
        "threatLevel" "threat_level_enum" NOT NULL DEFAULT 'MEDIUM',
        "status" "competitor_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_opportunity_competitors" PRIMARY KEY ("id"),
        CONSTRAINT "FK_opportunity_competitors_opp" FOREIGN KEY ("opportunityId")
          REFERENCES "opportunities"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_opportunity_competitors_opportunityId" ON "opportunity_competitors" ("opportunityId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ── Drop tables ──
    await queryRunner.query(`DROP TABLE IF EXISTS "opportunity_competitors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "opportunity_line_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "opportunity_team_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "opportunity_stakeholders"`);

    // ── Drop FK constraints on opportunities ──
    await queryRunner.query(`ALTER TABLE "opportunities" DROP CONSTRAINT IF EXISTS "FK_opportunities_primaryContact"`);
    await queryRunner.query(`ALTER TABLE "opportunities" DROP CONSTRAINT IF EXISTS "FK_opportunities_account"`);
    await queryRunner.query(`ALTER TABLE "opportunities" DROP CONSTRAINT IF EXISTS "FK_opportunities_stage"`);
    await queryRunner.query(`ALTER TABLE "opportunities" DROP CONSTRAINT IF EXISTS "FK_opportunities_pipeline"`);

    // ── Drop indexes ──
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_opportunities_accountId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_opportunities_stageId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_opportunities_pipelineId"`);

    // ── Drop Wave 2 columns from opportunities ──
    await queryRunner.query(`
      ALTER TABLE "opportunities"
        DROP COLUMN IF EXISTS "tags",
        DROP COLUMN IF EXISTS "daysSinceLastActivity",
        DROP COLUMN IF EXISTS "lastActivityAt",
        DROP COLUMN IF EXISTS "daysInCurrentStage",
        DROP COLUMN IF EXISTS "stageChangedAt",
        DROP COLUMN IF EXISTS "pushCount",
        DROP COLUMN IF EXISTS "sourceLeadId",
        DROP COLUMN IF EXISTS "leadSource",
        DROP COLUMN IF EXISTS "lostReason",
        DROP COLUMN IF EXISTS "nextStepDueDate",
        DROP COLUMN IF EXISTS "nextStep",
        DROP COLUMN IF EXISTS "healthStatus",
        DROP COLUMN IF EXISTS "healthScore",
        DROP COLUMN IF EXISTS "forecastCategory",
        DROP COLUMN IF EXISTS "actualCloseDate",
        DROP COLUMN IF EXISTS "weightedValue",
        DROP COLUMN IF EXISTS "priority",
        DROP COLUMN IF EXISTS "type",
        DROP COLUMN IF EXISTS "primaryContactId",
        DROP COLUMN IF EXISTS "accountId",
        DROP COLUMN IF EXISTS "stageId",
        DROP COLUMN IF EXISTS "pipelineId"
    `);

    // ── Drop products table ──
    await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_tenantId"`);

    // ── Drop enums (cannot remove enum values in PostgreSQL, only drop types) ──
    await queryRunner.query(`DROP TYPE IF EXISTS "competitor_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "threat_level_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "team_member_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "stakeholder_sentiment_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "stakeholder_influence_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "stakeholder_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "deal_health_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "opportunity_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "recurring_interval_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "product_category_enum"`);
    // Note: CLOSED cannot be removed from forecast_category_enum — PostgreSQL limitation
  }
}
