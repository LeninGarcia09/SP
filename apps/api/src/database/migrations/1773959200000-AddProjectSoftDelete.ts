import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectSoftDelete1773959200000 implements MigrationInterface {
  name = 'AddProjectSoftDelete1773959200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "projects" ADD "deletedAt" TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "projects" DROP COLUMN "deletedAt"
    `);
  }
}
