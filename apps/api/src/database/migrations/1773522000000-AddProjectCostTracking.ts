import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectCostTracking1773522000000 implements MigrationInterface {
  name = 'AddProjectCostTracking1773522000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "projects" ADD "actualCost" numeric(15,2) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD "costRate" numeric(10,2) NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "costRate"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "actualCost"`);
  }
}
