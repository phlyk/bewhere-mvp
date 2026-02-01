/**
 * INSEE Population Data Loader
 *
 * Loads transformed population records into the population table.
 * Supports upsert to handle re-runs and updates.
 */

import { DataSource, QueryRunner } from 'typeorm';
import { BaseLoader, LoaderOptions } from '../../core/loader';
import { logger } from '../../utils/logger';
import { PopulationRecord } from './population.types';

/**
 * Loader options specific to population data
 */
export interface PopulationLoaderOptions extends Omit<LoaderOptions, 'tableName'> {
  /** Delete existing data for the same source before loading */
  deleteExistingSource?: boolean;
}

/**
 * Population Data Loader
 *
 * Inserts or updates population records in the population table.
 * Uses PostgreSQL's ON CONFLICT clause for upsert behavior.
 */
export class PopulationLoader extends BaseLoader<PopulationRecord> {
  protected populationOptions: PopulationLoaderOptions;

  constructor(dataSource: DataSource, options: PopulationLoaderOptions = {}) {
    super(dataSource, {
      tableName: 'population',
      batchSize: 500, // Population records are small, use larger batches
      upsert: true,
      conflictColumns: ['areaId', 'year'],
      useTransaction: true,
      ...options,
    });
    this.populationOptions = options;
  }

  /**
   * Load a batch of population records
   */
  protected async loadBatch(
    queryRunner: QueryRunner,
    batch: PopulationRecord[],
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
   * Upsert a single population record
   */
  private async upsertRecord(
    queryRunner: QueryRunner,
    record: PopulationRecord,
  ): Promise<'inserted' | 'updated' | 'skipped'> {
    // Check if record exists
    const existingCheck = await queryRunner.query(
      `SELECT id, "populationCount" FROM population 
       WHERE "areaId" = $1 AND year = $2`,
      [record.areaId, record.year],
    );

    if (existingCheck.length > 0) {
      const existing = existingCheck[0];

      // Only update if value changed
      if (Number(existing.populationCount) === record.populationCount) {
        return 'skipped';
      }

      // Update existing record
      await queryRunner.query(
        `UPDATE population 
         SET "populationCount" = $1, source = $2, notes = $3, "updatedAt" = NOW()
         WHERE "areaId" = $4 AND year = $5`,
        [
          record.populationCount,
          record.source,
          record.notes,
          record.areaId,
          record.year,
        ],
      );
      return 'updated';
    }

    // Insert new record
    await queryRunner.query(
      `INSERT INTO population 
       ("areaId", year, "populationCount", source, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        record.areaId,
        record.year,
        record.populationCount,
        record.source,
        record.notes,
      ],
    );

    return 'inserted';
  }

  /**
   * Build column values for INSERT (required by BaseLoader)
   */
  protected buildInsertValues(row: PopulationRecord): Record<string, unknown> {
    return {
      areaId: row.areaId,
      year: row.year,
      populationCount: row.populationCount,
      source: row.source,
      notes: row.notes,
    };
  }

  /**
   * Delete population records for a specific source
   */
  async deleteBySource(source: string): Promise<number> {
    const result = await this.dataSource.query(
      `DELETE FROM population WHERE source = $1`,
      [source],
    );
    return result.rowCount || 0;
  }

  /**
   * Validate loader configuration
   */
  async validate(): Promise<boolean> {
    // Check that population table exists
    try {
      const result = await this.dataSource.query(
        `SELECT EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_name = 'population'
         )`,
      );
      if (!result[0].exists) {
        logger.error('Population table does not exist');
        return false;
      }
    } catch (error) {
      logger.error('Cannot validate population table:', error);
      return false;
    }

    return true;
  }
}

/**
 * Factory function to create a PopulationLoader
 */
export function createPopulationLoader(
  dataSource: DataSource,
  options: Partial<PopulationLoaderOptions> = {},
): PopulationLoader {
  return new PopulationLoader(dataSource, options);
}
