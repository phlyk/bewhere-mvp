import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create crime_categories table
 *
 * This creates the crime_categories table for storing canonical crime taxonomy.
 * The 20 canonical categories standardize crime data from various sources
 * (État 4001, Time Series, etc.) for consistent cross-dataset analysis.
 *
 * Features:
 * - Unique code constraint for programmatic access
 * - Severity levels (critical, high, medium, low) for visualization
 * - Category groups for logical organization
 * - Sort order for consistent UI display
 * - French localization support (nameFr)
 * - Soft-delete via isActive flag
 */
export class CreateCrimeCategories1706918400000 implements MigrationInterface {
  name = 'CreateCrimeCategories1706918400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create severity enum type
    await queryRunner.query(`
      CREATE TYPE "crime_severity_enum" AS ENUM (
        'critical',
        'high',
        'medium',
        'low'
      )
    `);

    // Create category group enum type
    await queryRunner.query(`
      CREATE TYPE "crime_category_group_enum" AS ENUM (
        'violent_crimes',
        'property_crimes',
        'drug_offenses',
        'other_offenses'
      )
    `);

    // Create the crime_categories table
    await queryRunner.query(`
      CREATE TABLE "crime_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(50) NOT NULL,
        "name" character varying(100) NOT NULL,
        "nameFr" character varying(100) NOT NULL,
        "description" text,
        "severity" crime_severity_enum NOT NULL DEFAULT 'medium',
        "categoryGroup" crime_category_group_enum NOT NULL DEFAULT 'other_offenses',
        "sortOrder" smallint NOT NULL DEFAULT 99,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_crime_categories" PRIMARY KEY ("id")
      )
    `);

    // Create unique index on code
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_crime_categories_code" 
      ON "crime_categories" ("code")
    `);

    // Create index on severity for filtering
    await queryRunner.query(`
      CREATE INDEX "IDX_crime_categories_severity" 
      ON "crime_categories" ("severity")
    `);

    // Create index on categoryGroup for filtering
    await queryRunner.query(`
      CREATE INDEX "IDX_crime_categories_category_group" 
      ON "crime_categories" ("categoryGroup")
    `);

    // Create index on sortOrder for ordering
    await queryRunner.query(`
      CREATE INDEX "IDX_crime_categories_sort_order" 
      ON "crime_categories" ("sortOrder")
    `);

    // Add comment to table
    await queryRunner.query(`
      COMMENT ON TABLE "crime_categories" IS 
      'Canonical crime categories for standardized cross-dataset analysis (20 categories)'
    `);

    // Add column comments
    await queryRunner.query(`
      COMMENT ON COLUMN "crime_categories"."code" IS 
      'Unique canonical code (SCREAMING_SNAKE_CASE)'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "crime_categories"."nameFr" IS 
      'French localized name for the category'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "crime_categories"."severity" IS 
      'Severity level for visualization (critical > high > medium > low)'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN "crime_categories"."categoryGroup" IS 
      'High-level grouping for related categories'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_crime_categories_sort_order"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_crime_categories_category_group"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_crime_categories_severity"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_crime_categories_code"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "crime_categories"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "crime_category_group_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "crime_severity_enum"`);
  }
}
