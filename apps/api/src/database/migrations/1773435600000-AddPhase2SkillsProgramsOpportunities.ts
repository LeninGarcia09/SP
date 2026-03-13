import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhase2SkillsProgramsOpportunities1773435600000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enums ──
    await queryRunner.query(`
      CREATE TYPE "skill_category_enum" AS ENUM (
        'TECHNICAL', 'MANAGEMENT', 'DOMAIN', 'SOFT_SKILL', 'CERTIFICATION'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "proficiency_level_enum" AS ENUM (
        'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "program_status_enum" AS ENUM (
        'PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "opportunity_status_enum" AS ENUM (
        'IDENTIFIED', 'QUALIFYING', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST', 'CONVERTED'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "opportunity_stage_enum" AS ENUM (
        'SEED', 'EARLY', 'GROWTH', 'EXPANSION', 'MATURE'
      )
    `);

    // ── Skills table ──
    await queryRunner.query(`
      CREATE TABLE "skills" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(100) NOT NULL,
        "category" "skill_category_enum" NOT NULL,
        "description" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_skills" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_skills_name" UNIQUE ("name")
      )
    `);

    // ── Person-skills join table ──
    await queryRunner.query(`
      CREATE TABLE "person_skills" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "personId" uuid NOT NULL,
        "skillId" uuid NOT NULL,
        "proficiency" "proficiency_level_enum" NOT NULL DEFAULT 'BEGINNER',
        "yearsOfExperience" decimal(4,1),
        "notes" text,
        CONSTRAINT "PK_person_skills" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_person_skill" UNIQUE ("personId", "skillId"),
        CONSTRAINT "FK_person_skills_person" FOREIGN KEY ("personId")
          REFERENCES "persons"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_person_skills_skill" FOREIGN KEY ("skillId")
          REFERENCES "skills"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_person_skills_personId" ON "person_skills" ("personId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_person_skills_skillId" ON "person_skills" ("skillId")
    `);

    // ── Programs table ──
    await queryRunner.query(`
      CREATE TABLE "programs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" varchar NOT NULL,
        "name" varchar NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "status" "program_status_enum" NOT NULL DEFAULT 'PLANNING',
        "startDate" date NOT NULL,
        "endDate" date,
        "budget" decimal(15,2) NOT NULL DEFAULT 0,
        "managerId" uuid NOT NULL,
        "createdBy" uuid NOT NULL,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_programs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_programs_code" UNIQUE ("code")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_programs_metadata" ON "programs" USING GIN ("metadata")
    `);

    // ── Opportunities table ──
    await queryRunner.query(`
      CREATE TABLE "opportunities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" varchar NOT NULL,
        "name" varchar NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "status" "opportunity_status_enum" NOT NULL DEFAULT 'IDENTIFIED',
        "stage" "opportunity_stage_enum" NOT NULL DEFAULT 'SEED',
        "estimatedValue" decimal(15,2) NOT NULL DEFAULT 0,
        "probability" int NOT NULL DEFAULT 0,
        "expectedCloseDate" date,
        "clientName" varchar(200) NOT NULL,
        "clientContact" varchar(200),
        "ownerId" uuid NOT NULL,
        "convertedProjectId" uuid,
        "convertedAt" TIMESTAMP,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_opportunities" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_opportunities_code" UNIQUE ("code")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_opportunities_clientName" ON "opportunities" ("clientName")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_opportunities_metadata" ON "opportunities" USING GIN ("metadata")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "opportunities"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "programs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "person_skills"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "skills"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "opportunity_stage_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "opportunity_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "program_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "proficiency_level_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "skill_category_enum"`);
  }
}
