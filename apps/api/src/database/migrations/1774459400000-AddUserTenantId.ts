import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserTenantId1774459400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "tenantId" varchar(36) NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_tenantId" ON "users" ("tenantId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_users_tenantId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "tenantId"`);
  }
}
