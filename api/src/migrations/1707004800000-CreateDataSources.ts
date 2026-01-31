import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create data_sources table
 *
 * This creates the data_sources table for tracking external data sources
 * used in BeWhere. Each data source represents an external dataset that
 * provides crime statistics, population data, or geographic boundaries.
 *
 * Features:
 * - Unique code constraint for programmatic access
 * - Update frequency enum for ETL scheduling
 * - Provider and license tracking for attribution
 * - Date range tracking for data coverage validation
 * - JSONB metadata for source-specific configuration
 * - Soft-delete via isActive flag
 *
 * Initial data sources:
 * - ETAT4001_MONTHLY: État 4001 monthly crime snapshots
 * - TIMESERIES: Time series crime data (2016+)
 * - INSEE_POPULATION: Population estimates by département
 */
export class CreateDataSources1707004800000 implements MigrationInterface {
  name = 'CreateDataSources1707004800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create update frequency enum type
    await queryRunner.query(`
      CREATE TYPE "update_frequency_enum" AS ENUM (
        'realtime',
        'daily',
        'weekly',
        'monthly',
        'quarterly',
        'yearly',
        'irregular',
        'historical'
      )
    `);

    // Create the data_sources table
    await queryRunner.query(`
      CREATE TABLE "data_sources" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(50) NOT NULL,
        "name" character varying(255) NOT NULL,
        "nameFr" character varying(255),
        "description" text,
        "url" character varying(2048) NOT NULL,
        "apiEndpoint" character varying(2048),
        "updateFrequency" update_frequency_enum NOT NULL DEFAULT 'irregular',
        "provider" character varying(255),
        "license" character varying(255),
        "attribution" text,
        "countryCode" char(2),
        "dataStartYear" smallint,
        "dataEndYear" smallint,
        "isActive" boolean NOT NULL DEFAULT true,
        "lastImportedAt" TIMESTAMP,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_data_sources" PRIMARY KEY ("id")
      )
    `);

    // Create unique index on code
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_data_sources_code" 
      ON "data_sources" ("code")
    `);

    // Create index on updateFrequency for filtering
    await queryRunner.query(`
      CREATE INDEX "IDX_data_sources_update_frequency" 
      ON "data_sources" ("updateFrequency")
    `);

    // Create index on countryCode for filtering
    await queryRunner.query(`
      CREATE INDEX "IDX_data_sources_country_code" 
      ON "data_sources" ("countryCode")
    `);

    // Create index on isActive for filtering active sources
    await queryRunner.query(`
      CREATE INDEX "IDX_data_sources_is_active" 
      ON "data_sources" ("isActive")
    `);

    // Add comment to table
    await queryRunner.query(`
      COMMENT ON TABLE "data_sources" IS 'External data sources used for BeWhere crime and population data'
    `);

    // Add column comments for documentation
    await queryRunner.query(`
      COMMENT ON COLUMN "data_sources"."code" IS 'Unique identifier code for programmatic access (e.g., ETAT4001_MONTHLY)'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "data_sources"."url" IS 'Primary URL for data access and attribution'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "data_sources"."apiEndpoint" IS 'Direct download or API URL for ETL automation'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "data_sources"."updateFrequency" IS 'Expected update frequency for ETL scheduling'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "data_sources"."metadata" IS 'Source-specific config: encoding, delimiter, skip rows, etc.'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the table
    await queryRunner.query(`DROP TABLE "data_sources"`);

    // Drop the enum type
    await queryRunner.query(`DROP TYPE "update_frequency_enum"`);
  }
}
