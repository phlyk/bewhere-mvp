import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create administrative_areas table
 *
 * This creates the foundational spatial table for storing French
 * administrative boundaries (départements, regions, country).
 *
 * Features:
 * - PostGIS MultiPolygon geometry column (SRID 4326)
 * - Spatial index for efficient geographic queries
 * - Hierarchical structure via parentCode
 * - Unique constraint on (code, level)
 */
export class CreateAdministrativeAreas1706745600000 implements MigrationInterface {
  name = 'CreateAdministrativeAreas1706745600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for admin levels
    await queryRunner.query(`
      CREATE TYPE "administrative_area_level_enum" AS ENUM ('country', 'region', 'department')
    `);

    // Create the administrative_areas table
    await queryRunner.query(`
      CREATE TABLE "administrative_areas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(10) NOT NULL,
        "name" character varying(255) NOT NULL,
        "nameEn" character varying(255),
        "level" "administrative_area_level_enum" NOT NULL,
        "parentCode" character varying(10),
        "countryCode" character(2) NOT NULL,
        "geometry" geometry(MultiPolygon, 4326),
        "areaKm2" numeric(12,2),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_administrative_areas" PRIMARY KEY ("id")
      )
    `);

    // Create unique index on (code, level)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_administrative_areas_code_level" 
      ON "administrative_areas" ("code", "level")
    `);

    // Create index on level for filtering
    await queryRunner.query(`
      CREATE INDEX "IDX_administrative_areas_level" 
      ON "administrative_areas" ("level")
    `);

    // Create index on parentCode for hierarchical queries
    await queryRunner.query(`
      CREATE INDEX "IDX_administrative_areas_parent_code" 
      ON "administrative_areas" ("parentCode")
    `);

    // Create index on countryCode for country-level filtering
    await queryRunner.query(`
      CREATE INDEX "IDX_administrative_areas_country_code" 
      ON "administrative_areas" ("countryCode")
    `);

    // Create spatial index on geometry column for geographic queries
    await queryRunner.query(`
      CREATE INDEX "IDX_administrative_areas_geometry" 
      ON "administrative_areas" USING GIST ("geometry")
    `);

    // Add comment to table
    await queryRunner.query(`
      COMMENT ON TABLE "administrative_areas" IS 
      'Administrative boundaries (départements, regions, countries) with PostGIS geometries'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_administrative_areas_geometry"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_administrative_areas_country_code"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_administrative_areas_parent_code"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_administrative_areas_level"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_administrative_areas_code_level"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "administrative_areas"`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "administrative_area_level_enum"`);
  }
}
