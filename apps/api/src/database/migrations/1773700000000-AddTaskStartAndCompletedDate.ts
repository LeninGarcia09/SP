import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskStartAndCompletedDate1773700000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD COLUMN "startDate" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD COLUMN "completedDate" date`,
    );

    // Set completedDate for already-DONE tasks (backfill from updatedAt)
    await queryRunner.query(
      `UPDATE "tasks" SET "completedDate" = "updatedAt"::date WHERE "status" = 'DONE' AND "completedDate" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP COLUMN "completedDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP COLUMN "startDate"`,
    );
  }
}
