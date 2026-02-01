/**
 * Base Loader Class
 *
 * Abstract base class for loading transformed data into the database.
 * Handles batch inserts, upserts, and transaction management.
 */

import { DataSource, QueryRunner } from 'typeorm';
import { logger } from '../utils/logger';

/**
 * Load result metadata
 */
export interface LoadResult {
  /** Number of rows inserted */
  insertedCount: number;
  /** Number of rows updated */
  updatedCount: number;
  /** Number of rows skipped (duplicates, etc.) */
  skippedCount: number;
  /** Load errors */
  errors: LoadError[];
  /** Any warnings during load */
  warnings: string[];
  /** Duration in milliseconds */
  durationMs: number;
}

/**
 * Load error details
 */
export interface LoadError {
  /** Row index in transformed data */
  rowIndex: number;
  /** Error message */
  message: string;
  /** SQL error code (if applicable) */
  sqlCode?: string;
}

/**
 * Loader options
 */
export interface LoaderOptions {
  /** Table name to load into */
  tableName: string;
  /** Batch size for inserts */
  batchSize?: number;
  /** Use upsert (ON CONFLICT UPDATE) */
  upsert?: boolean;
  /** Columns for conflict detection (for upsert) */
  conflictColumns?: string[];
  /** Wrap in transaction */
  useTransaction?: boolean;
  /** Truncate table before loading */
  truncateFirst?: boolean;
  /** Data source ID for filtering */
  dataSourceId?: string;
}

/**
 * Abstract base class for data loaders
 *
 * @template T - Type of data to load
 */
export abstract class BaseLoader<T> {
  protected dataSource: DataSource;
  protected options: LoaderOptions;

  constructor(dataSource: DataSource, options: LoaderOptions) {
    this.dataSource = dataSource;
    this.options = {
      batchSize: 1000,
      upsert: true,
      useTransaction: true,
      truncateFirst: false,
      ...options,
    };
  }

  /**
   * Load data into the database
   */
  async load(data: T[]): Promise<LoadResult> {
    const startTime = Date.now();
    const errors: LoadError[] = [];
    const warnings: string[] = [];
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      if (this.options.useTransaction) {
        await queryRunner.startTransaction();
      }

      // Truncate if requested
      if (this.options.truncateFirst) {
        await this.truncateTable(queryRunner);
      }

      // Process in batches
      const batchSize = this.options.batchSize || 1000;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        logger.debug(`Loading batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.length / batchSize)}`);

        try {
          const batchResult = await this.loadBatch(queryRunner, batch, i);
          insertedCount += batchResult.inserted;
          updatedCount += batchResult.updated;
          skippedCount += batchResult.skipped;
        } catch (error) {
          errors.push({
            rowIndex: i,
            message: String(error),
            sqlCode: (error as { code?: string }).code,
          });

          if (!this.options.useTransaction) {
            // Continue with next batch if not in transaction
            continue;
          }
          throw error; // Rollback transaction on error
        }
      }

      if (this.options.useTransaction) {
        await queryRunner.commitTransaction();
      }

      logger.info(
        `Loaded ${insertedCount} inserted, ${updatedCount} updated, ${skippedCount} skipped`,
      );
    } catch (error) {
      if (this.options.useTransaction) {
        await queryRunner.rollbackTransaction();
      }
      logger.error('Load failed, transaction rolled back:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }

    return {
      insertedCount,
      updatedCount,
      skippedCount,
      errors,
      warnings,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Load a batch of data
   */
  protected abstract loadBatch(
    queryRunner: QueryRunner,
    batch: T[],
    startIndex: number,
  ): Promise<{ inserted: number; updated: number; skipped: number }>;

  /**
   * Build column values for INSERT
   */
  protected abstract buildInsertValues(row: T): Record<string, unknown>;

  /**
   * Truncate the target table
   */
  protected async truncateTable(queryRunner: QueryRunner): Promise<void> {
    logger.warn(`Truncating table: ${this.options.tableName}`);

    if (this.options.dataSourceId) {
      // Delete only records from this data source
      await queryRunner.query(
        `DELETE FROM ${this.options.tableName} WHERE data_source_id = $1`,
        [this.options.dataSourceId],
      );
    } else {
      await queryRunner.query(`TRUNCATE TABLE ${this.options.tableName} CASCADE`);
    }
  }

  /**
   * Validate loader configuration
   */
  abstract validate(): Promise<boolean>;
}
