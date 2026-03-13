import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotifications1773349200000 implements MigrationInterface {
    name = 'AddNotifications1773349200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('TASK_ASSIGNED', 'TASK_STATUS_CHANGED', 'PROJECT_STATUS_CHANGED', 'RAG_STATUS_CHANGED', 'MEMBER_ADDED', 'NOTE_ADDED', 'GENERAL')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL DEFAULT 'GENERAL', "title" character varying NOT NULL, "message" text NOT NULL, "isRead" boolean NOT NULL DEFAULT false, "relatedEntityType" character varying, "relatedEntityId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_userId" ON "notifications" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_isRead" ON "notifications" ("isRead")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_isRead"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_userId"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    }
}
