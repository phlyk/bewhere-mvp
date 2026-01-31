import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create crime_observations table
 *
 * This creates the core crime_observations table that stores all crime statistics.
 * Each observation links an administrative area, crime category, and data source
 * to a specific time period (year, optionally month) with count and rate data.
 *
 * Features:
 * - Foreign keys to administrative_areas, crime_categories, and data_sources
 * - Time granularity enum (monthly, quarterly, yearly)
 * - Composite unique constraint to prevent duplicate observations
 * - Composite index for efficient querying by area+category+year+source
 * - Rate per 100,000 population for normalized comparisons
 * - Audit fields (populationUsed, isValidated, notes)
 *
 * This table is designed for:
 * - Time series analysis of crime trends
 * - Cross-département comparisons
 * - Category-specific crime pattern analysis
 * - Multi-source data comparison
 */
export class CreateCrimeObservations1707091200000 implements MigrationInterface {
  name = 'CreateCrimeObservations1707091200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create time granularity enum type
    await queryRunner.query(`
      CREATE TYPE "time_granularity_enum" AS ENUM (
        'monthly',
        'quarterly',
        'yearly'
      )
    `);

    // Create the crime_observations table
    await queryRunner.query(`
      CREATE TABLE "crime_observations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "areaId" uuid NOT NULL,
        "categoryId" uuid NOT NULL,
        "dataSourceId" uuid NOT NULL,
        "year" smallint NOT NULL,
        "month" smallint,
        "granularity" time_granularity_enum NOT NULL DEFAULT 'yearly',
        "count" integer NOT NULL,
        "ratePer100k" decimal(12, 4),
        "populationUsed" integer,
        "isValidated" boolean NOT NULL DEFAULT false,
        "notes" character varying(500),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_crime_observations" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "crime_observations" 
      ADD CONSTRAINT "FK_crime_observations_area" 
      FOREIGN KEY ("areaId") 
      REFERENCES "administrative_areas"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "crime_observations" 
      ADD CONSTRAINT "FK_crime_observations_category" 
      FOREIGN KEY ("categoryId") 
      REFERENCES "crime_categories"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "crime_observations" 
      ADD CONSTRAINT "FK_crime_observations_data_source" 
      FOREIGN KEY ("dataSourceId") 
      REFERENCES "data_sources"("id") 
      ON DELETE CASCADE
    `);

    // Create composite unique constraint to prevent duplicate observations
    // An observation is unique per area+category+source+year+month
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_crime_observations_unique" 
      ON "crime_observations" ("areaId", "categoryId", "dataSourceId", "year", COALESCE("month", 0))
    `);

    // Create individual indexes for common query patterns
    await queryRunner.query(`
      CREATE INDEX "IDX_crime_observations_area" 
      ON "crime_observations" ("areaId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_crime_observations_category" 
      ON "crime_observations" ("categoryId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_crime_observations_data_source" 
      ON "crime_observations" ("dataSourceId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_crime_observations_year" 
      ON "crime_observations" ("year")
    `);

    // Create composite index for common query patterns (area + category + year + source)
    // This is the primary index for API queries like "get burglaries in Paris 2020-2023"
    await queryRunner.query(`
      CREATE INDEX "IDX_crime_observations_composite" 
      ON "crime_observations" ("areaId", "categoryId", "year", "dataSourceId")
    `);

    // Create index for time series queries (year + month)
    await queryRunner.query(`
      CREATE INDEX "IDX_crime_observations_time_series" 
      ON "crime_observations" ("year", "month")
    `);

    // Create index for validation status (data quality monitoring)
    await queryRunner.query(`
      CREATE INDEX "IDX_crime_observations_validated" 
      ON "crime_observations" ("isValidated")
      WHERE "isValidated" = false
    `);

    // Add comment to table
    await queryRunner.query(`
      COMMENT ON TABLE "crime_observations" IS 
      'Core table storing crime statistics linked to areas, categories, and data sources'
    `);

    // Add column comments for documentation
    await queryRunner.query(`
      COMMENT ON COLUMN "crime_observations"."areaId" IS 
      'FK to administrative_areas (département, region, or country)'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "crime_observations"."categoryId" IS 
      'FK to crime_categories (canonical crime taxonomy)'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "crime_observations"."dataSourceId" IS 
      'FK to data_sources (provenance tracking)'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "crime_observations"."year" IS 
      'Year of the observation (2016-2025 for BeWhere MVP)'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "crime_observations"."month" IS 
      'Month of observation (1-12), null for yearly aggregates'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "crime_observations"."granularity" IS 
      'Time granularity: monthly, quarterly, or yearly'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "crime_observations"."count" IS 
      'Raw crime count from source data'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "crime_observations"."ratePer100k" IS 
      'Crime rate per 100,000 population: (count / population) * 100000'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "crime_observations"."populationUsed" IS 
      'Population value used for rate calculation (audit trail)'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "crime_observations"."isValidated" IS 
      'Whether observation has been validated during ETL'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "crime_observations"."notes" IS 
      'Data quality notes (e.g., estimated, revised, provisional)'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the table (this also drops all indexes and constraints)
    await queryRunner.query(`DROP TABLE "crime_observations"`);

    // Drop the enum type
    await queryRunner.query(`DROP TYPE "time_granularity_enum"`);
  }
}
