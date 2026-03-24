import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameUserRoles1774132000000 implements MigrationInterface {
  name = 'RenameUserRoles1774132000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename existing enum values
    await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME VALUE 'GLOBAL_LEAD' TO 'ADMIN'`);
    await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME VALUE 'BIZ_OPS_MANAGER' TO 'OPERATIONS_DIRECTOR'`);
    await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME VALUE 'RESOURCE_MANAGER' TO 'DEPARTMENT_MANAGER'`);
    await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME VALUE 'PROJECT_LEAD' TO 'PROJECT_MANAGER'`);
    await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME VALUE 'PROJECT_PERSONNEL' TO 'TEAM_MEMBER'`);
    await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME VALUE 'HR_ADMIN' TO 'HR_MANAGER'`);

    // Add new SALES_EXECUTIVE role
    await queryRunner.query(`ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'SALES_EXECUTIVE'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Update any SALES_EXECUTIVE users back to TEAM_MEMBER before removing the value
    await queryRunner.query(`UPDATE "users" SET "role" = 'TEAM_MEMBER' WHERE "role" = 'SALES_EXECUTIVE'`);

    // Reverse the renames
    await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME VALUE 'ADMIN' TO 'GLOBAL_LEAD'`);
    await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME VALUE 'OPERATIONS_DIRECTOR' TO 'BIZ_OPS_MANAGER'`);
    await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME VALUE 'DEPARTMENT_MANAGER' TO 'RESOURCE_MANAGER'`);
    await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME VALUE 'PROJECT_MANAGER' TO 'PROJECT_LEAD'`);
    await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME VALUE 'TEAM_MEMBER' TO 'PROJECT_PERSONNEL'`);
    await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME VALUE 'HR_MANAGER' TO 'HR_ADMIN'`);

    // Note: Cannot remove enum value in PostgreSQL without recreating the type.
    // SALES_EXECUTIVE will remain in the enum but all users have been migrated away.
  }
}
