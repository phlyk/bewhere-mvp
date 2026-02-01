/**
 * French Département Geometry Loader
 *
 * Loads transformed département records into the administrative_areas table.
 * Supports upsert to handle re-runs and updates.
 */

import { DataSource, QueryRunner } from 'typeorm';
import { BaseLoader, LoaderOptions } from '../../core/loader';
import { logger } from '../../utils/logger';
import { DepartementRecord } from './departements.types';

/**
 * Loader options specific to département data
 */
export interface DepartementsLoaderOptions extends Omit<LoaderOptions, 'tableName'> {
  /** SRID for geometry (default: 4326 = WGS84) */
  srid?: number;
}

/**
 * Département Geometry Loader
 *
 * Inserts or updates département records in the administrative_areas table.
 * Uses PostgreSQL's ON CONFLICT clause for upsert behavior.
 */
export class DepartementsLoader extends BaseLoader<DepartementRecord> {
  protected departementOptions: DepartementsLoaderOptions;
  protected srid: number;

  constructor(dataSource: DataSource, options: DepartementsLoaderOptions = {}) {
    super(dataSource, {
      tableName: 'administrative_areas',
      batchSize: 50, // Départements have large geometries, use smaller batches
      upsert: true,
      conflictColumns: ['code', 'level'],
      useTransaction: true,
      ...options,
    });
    this.departementOptions = options;
    this.srid = options.srid || 4326;
  }

  /**
   * Load a batch of département records
   */
  protected async loadBatch(
    queryRunner: QueryRunner,
    batch: DepartementRecord[],
    startIndex: number,
  ): Promise<{ inserted: number; updated: number; skipped: number }> {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < batch.length; i++) {
      const record = batch[i];
      const rowIndex = startIndex + i;

      try {
        const result = await this.upsertRecord(queryRunner, record);
        if (result === 'inserted') {
          inserted++;
        } else if (result === 'updated') {
          updated++;
        } else {
          skipped++;
        }
      } catch (error) {
        logger.error(`Failed to load record at index ${rowIndex}:`, error);
        throw error;
      }
    }

    return { inserted, updated, skipped };
  }

  /**
   * Upsert a single département record
   */
  private async upsertRecord(
    queryRunner: QueryRunner,
    record: DepartementRecord,
  ): Promise<'inserted' | 'updated' | 'skipped'> {
    // Check if record exists
    const existing = await queryRunner.query(
      `SELECT id FROM administrative_areas WHERE code = $1 AND level = $2`,
      [record.code, record.level],
    );

    if (existing.length > 0) {
      // Update existing record
      await queryRunner.query(
        `UPDATE administrative_areas SET
          name = $1,
          name_en = $2,
          parent_code = $3,
          country_code = $4,
          geometry = ST_GeomFromText($5, $6),
          updated_at = NOW()
        WHERE code = $7 AND level = $8`,
        [
          record.name,
          record.nameEn,
          record.parentCode,
          record.countryCode,
          record.geometry,
          this.srid,
          record.code,
          record.level,
        ],
      );
      return 'updated';
    } else {
      // Insert new record
      await queryRunner.query(
        `INSERT INTO administrative_areas (
          code, name, name_en, level, parent_code, country_code, geometry
        ) VALUES ($1, $2, $3, $4, $5, $6, ST_GeomFromText($7, $8))`,
        [
          record.code,
          record.name,
          record.nameEn,
          record.level,
          record.parentCode,
          record.countryCode,
          record.geometry,
          this.srid,
        ],
      );
      return 'inserted';
    }
  }

  /**
   * Build column values for INSERT (used by base class if needed)
   */
  protected buildInsertValues(record: DepartementRecord): Record<string, unknown> {
    return {
      code: record.code,
      name: record.name,
      name_en: record.nameEn,
      level: record.level,
      parent_code: record.parentCode,
      country_code: record.countryCode,
      // Note: geometry requires special handling with ST_GeomFromText
    };
  }

  /**
   * Validate loader configuration
   */
  async validate(): Promise<boolean> {
    try {
      // Check if table exists
      const result = await this.dataSource.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'administrative_areas'
        )`,
      );

      if (!result[0].exists) {
        logger.error('Table administrative_areas does not exist');
        return false;
      }

      // Check if PostGIS is installed
      const postgis = await this.dataSource.query(
        `SELECT PostGIS_Version()`,
      );

      if (!postgis[0].postgis_version) {
        logger.error('PostGIS extension is not installed');
        return false;
      }

      logger.debug(`PostGIS version: ${postgis[0].postgis_version}`);

      return true;
    } catch (error) {
      logger.error('Loader validation failed:', error);
      return false;
    }
  }

  /**
   * Get count of départements currently in database
   */
  async getCurrentCount(): Promise<number> {
    const result = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM administrative_areas WHERE level = 'department'`,
    );
    return parseInt(result[0].count, 10);
  }

  /**
   * Delete all départements (for fresh reload)
   */
  async deleteAll(): Promise<number> {
    const result = await this.dataSource.query(
      `DELETE FROM administrative_areas WHERE level = 'department' RETURNING id`,
    );
    return result.length;
  }
}

/**
 * Factory function to create a département loader
 */
export function createDepartementsLoader(
  dataSource: DataSource,
  options: DepartementsLoaderOptions = {},
): DepartementsLoader {
  return new DepartementsLoader(dataSource, options);
}
