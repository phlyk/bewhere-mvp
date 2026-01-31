import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create category_mappings table
 *
 * This creates the category_mappings table for mapping source-specific
 * crime categories to BeWhere's canonical 20-category taxonomy.
 *
 * Features:
 * - Foreign keys to data_sources and crime_categories (CASCADE delete)
 * - Composite unique constraint on (data_source_id, source_category)
 * - Confidence level for mapping quality tracking
 * - Source category metadata preservation
 * - Soft-delete via isActive flag
 *
 * Use cases:
 * - État 4001 index → canonical category (107 mappings)
 * - Time Series indicator → canonical category (7 mappings)
 * - Future: Eurostat ICCS → canonical category
 */
export class CreateCategoryMappings1707177600000 implements MigrationInterface {
  name = 'CreateCategoryMappings1707177600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the category_mappings table
    await queryRunner.query(`
      CREATE TABLE "category_mappings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "dataSourceId" uuid NOT NULL,
        "sourceCategory" character varying(200) NOT NULL,
        "sourceCategoryName" character varying(500),
        "canonicalCategoryId" uuid NOT NULL,
        "notes" text,
        "confidence" decimal(3, 2) NOT NULL DEFAULT 1.0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_category_mappings" PRIMARY KEY ("id")
      )
    `);

    // Create unique constraint on (dataSourceId, sourceCategory)
    // Each source category can only map to one canonical category per data source
    await queryRunner.query(`
      ALTER TABLE "category_mappings"
      ADD CONSTRAINT "UQ_category_mappings_source" 
      UNIQUE ("dataSourceId", "sourceCategory")
    `);

    // Create composite index on (dataSourceId, sourceCategory) for fast lookups
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_category_mappings_source_lookup" 
      ON "category_mappings" ("dataSourceId", "sourceCategory")
    `);

    // Create index on canonicalCategoryId for reverse lookups
    // (find all source categories mapped to a canonical category)
    await queryRunner.query(`
      CREATE INDEX "IDX_category_mappings_canonical" 
      ON "category_mappings" ("canonicalCategoryId")
    `);

    // Create index on sourceCategory for pattern matching searches
    await queryRunner.query(`
      CREATE INDEX "IDX_category_mappings_source_category" 
      ON "category_mappings" ("sourceCategory")
    `);

    // Create index on isActive for filtering active mappings
    await queryRunner.query(`
      CREATE INDEX "IDX_category_mappings_active" 
      ON "category_mappings" ("isActive")
      WHERE "isActive" = true
    `);

    // Add foreign key constraint to data_sources table
    await queryRunner.query(`
      ALTER TABLE "category_mappings"
      ADD CONSTRAINT "FK_category_mappings_data_source"
      FOREIGN KEY ("dataSourceId")
      REFERENCES "data_sources" ("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // Add foreign key constraint to crime_categories table
    await queryRunner.query(`
      ALTER TABLE "category_mappings"
      ADD CONSTRAINT "FK_category_mappings_crime_category"
      FOREIGN KEY ("canonicalCategoryId")
      REFERENCES "crime_categories" ("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // Add comments for documentation
    await queryRunner.query(`
      COMMENT ON TABLE "category_mappings" IS 
      'Maps source-specific crime categories to BeWhere canonical 20-category taxonomy'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "category_mappings"."sourceCategory" IS 
      'Category code/identifier as it appears in source data (e.g., État 4001 index, Time Series indicator name)'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "category_mappings"."confidence" IS 
      'Mapping confidence level: 1.0 = exact match, 0.8-0.99 = strong match, 0.5-0.79 = reasonable match'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints first
    await queryRunner.query(`
      ALTER TABLE "category_mappings"
      DROP CONSTRAINT IF EXISTS "FK_category_mappings_crime_category"
    `);

    await queryRunner.query(`
      ALTER TABLE "category_mappings"
      DROP CONSTRAINT IF EXISTS "FK_category_mappings_data_source"
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_category_mappings_active"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_category_mappings_source_category"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_category_mappings_canonical"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_category_mappings_source_lookup"
    `);

    // Drop unique constraint
    await queryRunner.query(`
      ALTER TABLE "category_mappings"
      DROP CONSTRAINT IF EXISTS "UQ_category_mappings_source"
    `);

    // Drop the table
    await queryRunner.query(`DROP TABLE IF EXISTS "category_mappings"`);
  }
}
