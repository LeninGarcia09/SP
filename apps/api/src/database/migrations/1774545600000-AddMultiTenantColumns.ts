import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds tenantId column to ALL business entities for multi-tenant data isolation.
 * Backfills existing data with the first ADMIN user's tenantId.
 *
 * Tables affected (17):
 *   projects, project_members, project_notes, tasks, task_activities,
 *   project_health_snapshots, persons, project_assignments,
 *   inventory_items, inventory_transactions, notifications,
 *   skills, person_skills, programs, opportunities, deliverables, cost_entries
 */
export class AddMultiTenantColumns1774545600000 implements MigrationInterface {
  name = 'AddMultiTenantColumns1774545600000';

  private readonly tables = [
    'projects',
    'project_members',
    'project_notes',
    'tasks',
    'task_activities',
    'project_health_snapshots',
    'persons',
    'project_assignments',
    'inventory_items',
    'inventory_transactions',
    'notifications',
    'skills',
    'person_skills',
    'programs',
    'opportunities',
    'deliverables',
    'cost_entries',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add tenantId column + index to each table
    for (const table of this.tables) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "tenantId" varchar(36)`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_${table}_tenantId" ON "${table}" ("tenantId")`,
      );
    }

    // 2. Backfill existing data: set tenantId from the first ADMIN user's tenantId
    //    This ensures all pre-existing data belongs to the platform owner's tenant.
    await queryRunner.query(`
      DO $$
      DECLARE
        admin_tenant varchar(36);
      BEGIN
        SELECT "tenantId" INTO admin_tenant
        FROM users
        WHERE role = 'ADMIN' AND "tenantId" IS NOT NULL
        LIMIT 1;

        IF admin_tenant IS NOT NULL THEN
          ${this.tables.map((t) => `UPDATE "${t}" SET "tenantId" = admin_tenant WHERE "tenantId" IS NULL;`).join('\n          ')}
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_${table}_tenantId"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "tenantId"`,
      );
    }
  }
}
