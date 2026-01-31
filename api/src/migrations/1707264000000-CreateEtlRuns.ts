import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create etl_runs table
 *
 * This creates the etl_runs table for tracking ETL (Extract, Transform, Load)
 * operations. Each row represents a single import run for a data source.
 *
 * Features:
 * - Foreign key to data_sources (CASCADE delete)
 * - Status enum for lifecycle tracking
 * - Timestamps for duration calculation
 * - Row counters for each ETL stage (extract, transform, load)
 * - Error/warning tracking with JSONB message arrays
 * - JSONB metadata for extensibility
 *
 * Use cases:
 * - Audit trail for data provenance
 * - Debugging failed imports
 * - Monitoring import health and performance
 * - Preventing duplicate imports
 * - Data freshness tracking
 */
export class CreateEtlRuns1707264000000 implements MigrationInterface {
  name = 'CreateEtlRuns1707264000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ETL run status enum type
    await queryRunner.query(`
      CREATE TYPE "etl_run_status_enum" AS ENUM (
        'running',
        'completed',
        'completed_with_warnings',
        'failed',
        'cancelled'
      )
    `);

    // Create the etl_runs table
    await queryRunner.query(`
      CREATE TABLE "etl_runs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "dataSourceId" uuid NOT NULL,
        "runName" character varying(255),
        "sourceUrl" character varying(2048) NOT NULL,
        "status" etl_run_status_enum NOT NULL DEFAULT 'running',
        "startedAt" TIMESTAMP NOT NULL,
        "completedAt" TIMESTAMP,
        "durationMs" integer,
        "rowsExtracted" integer NOT NULL DEFAULT 0,
        "rowsTransformed" integer NOT NULL DEFAULT 0,
        "rowsLoaded" integer NOT NULL DEFAULT 0,
        "rowsSkipped" integer NOT NULL DEFAULT 0,
        "errorCount" integer NOT NULL DEFAULT 0,
        "warningCount" integer NOT NULL DEFAULT 0,
        "errorMessages" jsonb,
        "warningMessages" jsonb,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_etl_runs" PRIMARY KEY ("id")
      )
    `);

    // Create composite index on (dataSourceId, startedAt) for querying runs by source
    await queryRunner.query(`
      CREATE INDEX "IDX_etl_runs_source_started" 
      ON "etl_runs" ("dataSourceId", "startedAt" DESC)
    `);

    // Create index on status for filtering by run state
    await queryRunner.query(`
      CREATE INDEX "IDX_etl_runs_status" 
      ON "etl_runs" ("status")
    `);

    // Create index on startedAt for time-based queries
    await queryRunner.query(`
      CREATE INDEX "IDX_etl_runs_started" 
      ON "etl_runs" ("startedAt" DESC)
    `);

    // Create partial index on running runs for quick "in progress" checks
    await queryRunner.query(`
      CREATE INDEX "IDX_etl_runs_running" 
      ON "etl_runs" ("dataSourceId")
      WHERE "status" = 'running'
    `);

    // Create partial index on failed runs for monitoring
    await queryRunner.query(`
      CREATE INDEX "IDX_etl_runs_failed" 
      ON "etl_runs" ("startedAt" DESC)
      WHERE "status" = 'failed'
    `);

    // Add foreign key constraint to data_sources table
    await queryRunner.query(`
      ALTER TABLE "etl_runs"
      ADD CONSTRAINT "FK_etl_runs_data_source"
      FOREIGN KEY ("dataSourceId")
      REFERENCES "data_sources"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // Add comment explaining the table purpose
    await queryRunner.query(`
      COMMENT ON TABLE "etl_runs" IS 
      'Audit log for ETL operations. Tracks each data import run with timestamps, row counts, and error details.'
    `);

    // Add column comments
    await queryRunner.query(`
      COMMENT ON COLUMN "etl_runs"."rowsExtracted" IS 
      'Number of rows extracted from source file/API'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "etl_runs"."rowsTransformed" IS 
      'Number of rows successfully transformed (may be less than extracted if validation fails)'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "etl_runs"."rowsLoaded" IS 
      'Number of rows inserted/updated in database (may be higher than extracted for 1:N transforms)'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "etl_runs"."durationMs" IS 
      'ETL run duration in milliseconds (computed from completedAt - startedAt)'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "etl_runs" 
      DROP CONSTRAINT "FK_etl_runs_data_source"
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_etl_runs_failed"`);
    await queryRunner.query(`DROP INDEX "IDX_etl_runs_running"`);
    await queryRunner.query(`DROP INDEX "IDX_etl_runs_started"`);
    await queryRunner.query(`DROP INDEX "IDX_etl_runs_status"`);
    await queryRunner.query(`DROP INDEX "IDX_etl_runs_source_started"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "etl_runs"`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE "etl_run_status_enum"`);
  }
}
