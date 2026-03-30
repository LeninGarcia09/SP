import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVendorsAndProductVendor1774804800000 implements MigrationInterface {
  name = 'AddVendorsAndProductVendor1774804800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create vendor_status enum
    await queryRunner.query(`
      CREATE TYPE "vendor_status_enum" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED')
    `);

    // Create vendors table
    await queryRunner.query(`
      CREATE TABLE "vendors" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" varchar(36),
        "code" varchar NOT NULL,
        "name" varchar(200) NOT NULL,
        "legalName" varchar(200),
        "website" varchar(500),
        "phone" varchar(50),
        "email" varchar(200),
        "contactPerson" varchar(200),
        "addressLine1" varchar(200),
        "city" varchar(100),
        "state" varchar(100),
        "country" varchar(100),
        "postalCode" varchar(20),
        "status" "vendor_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "notes" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vendors" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_vendors_code" UNIQUE ("code")
      )
    `);

    // Add indexes on vendors
    await queryRunner.query(`CREATE INDEX "IDX_vendors_tenantId" ON "vendors" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_vendors_name" ON "vendors" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_vendors_status" ON "vendors" ("status")`);

    // Add vendorId column to products
    await queryRunner.query(`ALTER TABLE "products" ADD "vendorId" uuid`);
    await queryRunner.query(`CREATE INDEX "IDX_products_vendorId" ON "products" ("vendorId")`);

    // Add FK constraint
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD CONSTRAINT "FK_products_vendorId"
      FOREIGN KEY ("vendorId") REFERENCES "vendors"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop FK
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_vendorId"`);
    await queryRunner.query(`DROP INDEX "IDX_products_vendorId"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "vendorId"`);

    // Drop vendors
    await queryRunner.query(`DROP INDEX "IDX_vendors_status"`);
    await queryRunner.query(`DROP INDEX "IDX_vendors_name"`);
    await queryRunner.query(`DROP INDEX "IDX_vendors_tenantId"`);
    await queryRunner.query(`DROP TABLE "vendors"`);
    await queryRunner.query(`DROP TYPE "vendor_status_enum"`);
  }
}
