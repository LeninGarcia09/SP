import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProgramSoftDelete1774045600000 implements MigrationInterface {
  name = 'AddProgramSoftDelete1774045600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "programs" ADD "deletedAt" TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "programs" DROP COLUMN "deletedAt"
    `);
  }
}
