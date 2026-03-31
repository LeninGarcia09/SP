import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddLeadsWave41774987200000 implements MigrationInterface {
  name = 'AddLeadsWave41774987200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create lead_status enum
    await queryRunner.query(`
      CREATE TYPE "lead_status" AS ENUM ('NEW', 'CONTACTED', 'ENGAGED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED')
    `);

    // Create lead_source enum
    await queryRunner.query(`
      CREATE TYPE "lead_source" AS ENUM ('WEB_FORM', 'REFERRAL', 'EVENT', 'COLD_OUTREACH', 'PARTNER', 'SOCIAL', 'AD_CAMPAIGN', 'INBOUND_CALL', 'OTHER')
    `);

    // Create lead_rating enum
    await queryRunner.query(`
      CREATE TYPE "lead_rating" AS ENUM ('HOT', 'WARM', 'COLD')
    `);

    // Create leads table
    await queryRunner.createTable(
      new Table({
        name: 'leads',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'tenantId', type: 'varchar', length: '36', isNullable: true },
          { name: 'code', type: 'varchar', isUnique: true },
          { name: 'firstName', type: 'varchar', length: '100' },
          { name: 'lastName', type: 'varchar', length: '100' },
          { name: 'email', type: 'varchar', length: '200', isNullable: true },
          { name: 'phone', type: 'varchar', length: '50', isNullable: true },
          { name: 'jobTitle', type: 'varchar', length: '200', isNullable: true },
          { name: 'companyName', type: 'varchar', length: '200' },
          { name: 'industry', type: 'varchar', length: '100', isNullable: true },
          { name: 'companySize', type: 'varchar', length: '50', isNullable: true },
          { name: 'website', type: 'varchar', length: '500', isNullable: true },
          { name: 'status', type: 'lead_status', default: `'NEW'` },
          { name: 'source', type: 'lead_source', default: `'OTHER'` },
          { name: 'rating', type: 'lead_rating', default: `'WARM'` },
          { name: 'score', type: 'int', default: 0 },
          { name: 'ownerId', type: 'uuid', isNullable: true },
          { name: 'assignedAt', type: 'timestamptz', isNullable: true },
          { name: 'budget', type: 'decimal', precision: 15, scale: 2, isNullable: true },
          { name: 'authority', type: 'varchar', length: '200', isNullable: true },
          { name: 'need', type: 'text', isNullable: true },
          { name: 'timeline', type: 'varchar', length: '100', isNullable: true },
          { name: 'convertedAt', type: 'timestamptz', isNullable: true },
          { name: 'convertedAccountId', type: 'uuid', isNullable: true },
          { name: 'convertedContactId', type: 'uuid', isNullable: true },
          { name: 'convertedOpportunityId', type: 'uuid', isNullable: true },
          { name: 'convertedBy', type: 'uuid', isNullable: true },
          { name: 'lastContactedAt', type: 'timestamptz', isNullable: true },
          { name: 'nextFollowUpAt', type: 'timestamptz', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'tags', type: 'text', isArray: true, default: `'{}'` },
          { name: 'metadata', type: 'jsonb', default: `'{}'` },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'createdBy', type: 'uuid' },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
          { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );

    // Indexes
    await queryRunner.createIndex('leads', new TableIndex({ name: 'IDX_leads_tenantId', columnNames: ['tenantId'] }));
    await queryRunner.createIndex('leads', new TableIndex({ name: 'IDX_leads_status', columnNames: ['status'] }));
    await queryRunner.createIndex('leads', new TableIndex({ name: 'IDX_leads_source', columnNames: ['source'] }));
    await queryRunner.createIndex('leads', new TableIndex({ name: 'IDX_leads_rating', columnNames: ['rating'] }));
    await queryRunner.createIndex('leads', new TableIndex({ name: 'IDX_leads_score', columnNames: ['score'] }));
    await queryRunner.createIndex('leads', new TableIndex({ name: 'IDX_leads_ownerId', columnNames: ['ownerId'] }));
    await queryRunner.createIndex('leads', new TableIndex({ name: 'IDX_leads_companyName', columnNames: ['companyName'] }));
    await queryRunner.createIndex('leads', new TableIndex({ name: 'IDX_leads_lastName', columnNames: ['lastName'] }));
    await queryRunner.createIndex('leads', new TableIndex({ name: 'IDX_leads_email', columnNames: ['email'] }));
    await queryRunner.createIndex('leads', new TableIndex({ name: 'IDX_leads_convertedAccountId', columnNames: ['convertedAccountId'] }));

    // Foreign keys
    await queryRunner.createForeignKey(
      'leads',
      new TableForeignKey({
        name: 'FK_leads_convertedAccountId',
        columnNames: ['convertedAccountId'],
        referencedTableName: 'accounts',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'leads',
      new TableForeignKey({
        name: 'FK_leads_convertedContactId',
        columnNames: ['convertedContactId'],
        referencedTableName: 'contacts',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'leads',
      new TableForeignKey({
        name: 'FK_leads_convertedOpportunityId',
        columnNames: ['convertedOpportunityId'],
        referencedTableName: 'opportunities',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Add leadId column to activities table
    await queryRunner.query(`ALTER TABLE "activities" ADD COLUMN "leadId" uuid`);
    await queryRunner.createIndex('activities', new TableIndex({ name: 'IDX_activities_leadId', columnNames: ['leadId'] }));
    await queryRunner.createForeignKey(
      'activities',
      new TableForeignKey({
        name: 'FK_activities_leadId',
        columnNames: ['leadId'],
        referencedTableName: 'leads',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove activities.leadId
    await queryRunner.dropForeignKey('activities', 'FK_activities_leadId');
    await queryRunner.dropIndex('activities', 'IDX_activities_leadId');
    await queryRunner.query(`ALTER TABLE "activities" DROP COLUMN "leadId"`);

    // Drop leads table + FKs
    await queryRunner.dropForeignKey('leads', 'FK_leads_convertedOpportunityId');
    await queryRunner.dropForeignKey('leads', 'FK_leads_convertedContactId');
    await queryRunner.dropForeignKey('leads', 'FK_leads_convertedAccountId');
    await queryRunner.dropTable('leads');

    // Drop enums
    await queryRunner.query(`DROP TYPE "lead_rating"`);
    await queryRunner.query(`DROP TYPE "lead_source"`);
    await queryRunner.query(`DROP TYPE "lead_status"`);
  }
}
