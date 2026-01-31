import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create population table
 *
 * This creates the population table for storing yearly population counts
 * per administrative area. Population data is essential for:
 * - Calculating crime rates per 100,000 population
 * - Normalizing crime statistics across areas of different sizes
 * - Year-over-year trend analysis
 *
 * Features:
 * - Foreign key to administrative_areas table
 * - Unique constraint on (area_id, year) to prevent duplicates
 * - Indexes for efficient queries by year and area
 */
export class CreatePopulation1706832000000 implements MigrationInterface {
  name = 'CreatePopulation1706832000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the population table
    await queryRunner.query(`
      CREATE TABLE "population" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "areaId" uuid NOT NULL,
        "year" smallint NOT NULL,
        "populationCount" bigint NOT NULL,
        "source" character varying(100),
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_population" PRIMARY KEY ("id")
      )
    `);

    // Create unique index on (areaId, year) to prevent duplicate entries
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_population_area_year" 
      ON "population" ("areaId", "year")
    `);

    // Create index on year for filtering by time period
    await queryRunner.query(`
      CREATE INDEX "IDX_population_year" 
      ON "population" ("year")
    `);

    // Create index on areaId for filtering by area
    await queryRunner.query(`
      CREATE INDEX "IDX_population_area_id" 
      ON "population" ("areaId")
    `);

    // Add foreign key constraint to administrative_areas
    await queryRunner.query(`
      ALTER TABLE "population" 
      ADD CONSTRAINT "FK_population_area" 
      FOREIGN KEY ("areaId") 
      REFERENCES "administrative_areas"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    // Add comment to table
    await queryRunner.query(`
      COMMENT ON TABLE "population" IS 
      'Yearly population counts per administrative area for crime rate calculations'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "population" DROP CONSTRAINT IF EXISTS "FK_population_area"
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_population_area_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_population_year"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_population_area_year"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "population"`);
  }
}
