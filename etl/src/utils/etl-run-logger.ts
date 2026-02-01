/**
 * ETL Run Logger
 *
 * Service for recording ETL pipeline executions to the `etl_runs` table.
 * Provides methods to start, update, and complete ETL runs with full
 * metadata tracking for auditing and debugging.
 */

import { DataSource } from 'typeorm';
import { logger } from './logger';

/**
 * Status of an ETL run (mirrors EtlRunStatus enum from API)
 */
export enum EtlRunStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  COMPLETED_WITH_WARNINGS = 'completed_with_warnings',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Options for starting an ETL run
 */
export interface StartRunOptions {
  /** Data source ID (UUID) */
  dataSourceId: string;
  /** Source URL being processed */
  sourceUrl: string;
  /** Human-readable run name */
  runName?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Options for updating an ETL run
 */
export interface UpdateRunOptions {
  /** Number of rows extracted */
  rowsExtracted?: number;
  /** Number of rows transformed */
  rowsTransformed?: number;
  /** Number of rows loaded */
  rowsLoaded?: number;
  /** Number of rows skipped */
  rowsSkipped?: number;
  /** Error messages to append */
  errors?: string[];
  /** Warning messages to append */
  warnings?: string[];
  /** Additional metadata to merge */
  metadata?: Record<string, unknown>;
}

/**
 * Options for completing an ETL run
 */
export interface CompleteRunOptions {
  /** Final status */
  status: EtlRunStatus.COMPLETED | EtlRunStatus.COMPLETED_WITH_WARNINGS | EtlRunStatus.FAILED | EtlRunStatus.CANCELLED;
  /** Number of rows extracted */
  rowsExtracted?: number;
  /** Number of rows transformed */
  rowsTransformed?: number;
  /** Number of rows loaded */
  rowsLoaded?: number;
  /** Number of rows skipped */
  rowsSkipped?: number;
  /** Error messages */
  errors?: string[];
  /** Warning messages */
  warnings?: string[];
  /** Additional metadata to merge */
  metadata?: Record<string, unknown>;
}

/**
 * ETL run record for reading back run data
 */
export interface EtlRunRecord {
  id: string;
  dataSourceId: string;
  runName: string | null;
  sourceUrl: string;
  status: EtlRunStatus;
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
  rowsExtracted: number;
  rowsTransformed: number;
  rowsLoaded: number;
  rowsSkipped: number;
  errorCount: number;
  warningCount: number;
  errorMessages: string[] | null;
  warningMessages: string[] | null;
  metadata: Record<string, unknown> | null;
}

/**
 * Maximum number of error/warning messages to store
 */
const MAX_MESSAGES = 100;

/**
 * ETL Run Logger class for tracking pipeline executions
 */
export class EtlRunLogger {
  private dataSource: DataSource;
  private runId: string | null = null;
  private startedAt: Date | null = null;
  private accumulatedErrors: string[] = [];
  private accumulatedWarnings: string[] = [];
  private currentMetadata: Record<string, unknown> = {};

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Start a new ETL run and record it to the database
   *
   * @param options - Run options including dataSourceId and sourceUrl
   * @returns The created run ID
   */
  async startRun(options: StartRunOptions): Promise<string> {
    this.startedAt = new Date();
    this.accumulatedErrors = [];
    this.accumulatedWarnings = [];
    this.currentMetadata = options.metadata || {};

    try {
      const result = await this.dataSource.query(
        `INSERT INTO etl_runs (
          data_source_id,
          source_url,
          run_name,
          status,
          started_at,
          rows_extracted,
          rows_transformed,
          rows_loaded,
          rows_skipped,
          error_count,
          warning_count,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id`,
        [
          options.dataSourceId,
          options.sourceUrl,
          options.runName || null,
          EtlRunStatus.RUNNING,
          this.startedAt,
          0,
          0,
          0,
          0,
          0,
          0,
          options.metadata ? JSON.stringify(options.metadata) : null,
        ],
      );

      const runId: string = result[0].id;
      this.runId = runId;
      logger.info(`ETL run started: ${runId} (${options.runName || 'unnamed'})`);
      return runId;
    } catch (error) {
      logger.error('Failed to start ETL run:', error);
      throw new Error(`Failed to start ETL run: ${error}`);
    }
  }

  /**
   * Update the current ETL run with progress information
   *
   * @param options - Update options with row counts and messages
   */
  async updateRun(options: UpdateRunOptions): Promise<void> {
    if (!this.runId) {
      logger.warn('Cannot update run: no run in progress');
      return;
    }

    // Accumulate errors and warnings
    if (options.errors) {
      this.accumulatedErrors.push(...options.errors);
    }
    if (options.warnings) {
      this.accumulatedWarnings.push(...options.warnings);
    }

    // Merge metadata
    if (options.metadata) {
      this.currentMetadata = { ...this.currentMetadata, ...options.metadata };
    }

    try {
      const setClauses: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (options.rowsExtracted !== undefined) {
        setClauses.push(`rows_extracted = $${paramIndex++}`);
        values.push(options.rowsExtracted);
      }
      if (options.rowsTransformed !== undefined) {
        setClauses.push(`rows_transformed = $${paramIndex++}`);
        values.push(options.rowsTransformed);
      }
      if (options.rowsLoaded !== undefined) {
        setClauses.push(`rows_loaded = $${paramIndex++}`);
        values.push(options.rowsLoaded);
      }
      if (options.rowsSkipped !== undefined) {
        setClauses.push(`rows_skipped = $${paramIndex++}`);
        values.push(options.rowsSkipped);
      }

      // Update error/warning counts and messages
      setClauses.push(`error_count = $${paramIndex++}`);
      values.push(this.accumulatedErrors.length);

      setClauses.push(`warning_count = $${paramIndex++}`);
      values.push(this.accumulatedWarnings.length);

      setClauses.push(`error_messages = $${paramIndex++}`);
      values.push(JSON.stringify(this.accumulatedErrors.slice(-MAX_MESSAGES)));

      setClauses.push(`warning_messages = $${paramIndex++}`);
      values.push(JSON.stringify(this.accumulatedWarnings.slice(-MAX_MESSAGES)));

      // Update metadata
      setClauses.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(this.currentMetadata));

      // Add run ID
      values.push(this.runId);

      if (setClauses.length > 0) {
        await this.dataSource.query(
          `UPDATE etl_runs SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
          values,
        );
      }
    } catch (error) {
      logger.error('Failed to update ETL run:', error);
      // Don't throw - we don't want to fail the pipeline due to logging issues
    }
  }

  /**
   * Complete the current ETL run
   *
   * @param options - Completion options with final status and stats
   */
  async completeRun(options: CompleteRunOptions): Promise<void> {
    if (!this.runId) {
      logger.warn('Cannot complete run: no run in progress');
      return;
    }

    const completedAt = new Date();
    const durationMs = this.startedAt
      ? completedAt.getTime() - this.startedAt.getTime()
      : null;

    // Final accumulation of errors and warnings
    if (options.errors) {
      this.accumulatedErrors.push(...options.errors);
    }
    if (options.warnings) {
      this.accumulatedWarnings.push(...options.warnings);
    }

    // Merge final metadata
    if (options.metadata) {
      this.currentMetadata = { ...this.currentMetadata, ...options.metadata };
    }

    try {
      await this.dataSource.query(
        `UPDATE etl_runs SET
          status = $1,
          completed_at = $2,
          duration_ms = $3,
          rows_extracted = COALESCE($4, rows_extracted),
          rows_transformed = COALESCE($5, rows_transformed),
          rows_loaded = COALESCE($6, rows_loaded),
          rows_skipped = COALESCE($7, rows_skipped),
          error_count = $8,
          warning_count = $9,
          error_messages = $10,
          warning_messages = $11,
          metadata = $12,
          updated_at = NOW()
        WHERE id = $13`,
        [
          options.status,
          completedAt,
          durationMs,
          options.rowsExtracted ?? null,
          options.rowsTransformed ?? null,
          options.rowsLoaded ?? null,
          options.rowsSkipped ?? null,
          this.accumulatedErrors.length,
          this.accumulatedWarnings.length,
          JSON.stringify(this.accumulatedErrors.slice(-MAX_MESSAGES)),
          JSON.stringify(this.accumulatedWarnings.slice(-MAX_MESSAGES)),
          Object.keys(this.currentMetadata).length > 0
            ? JSON.stringify(this.currentMetadata)
            : null,
          this.runId,
        ],
      );

      const statusIcon = options.status === EtlRunStatus.COMPLETED ? '✓' : 
        options.status === EtlRunStatus.COMPLETED_WITH_WARNINGS ? '⚠' : '✗';
      logger.info(
        `ETL run completed: ${this.runId} [${statusIcon} ${options.status}] ` +
        `(${durationMs}ms, ${options.rowsLoaded || 0} loaded, ` +
        `${this.accumulatedErrors.length} errors, ${this.accumulatedWarnings.length} warnings)`,
      );
    } catch (error) {
      logger.error('Failed to complete ETL run:', error);
    } finally {
      // Reset state
      this.runId = null;
      this.startedAt = null;
      this.accumulatedErrors = [];
      this.accumulatedWarnings = [];
      this.currentMetadata = {};
    }
  }

  /**
   * Mark the current run as failed with an error message
   *
   * @param error - Error that caused the failure
   * @param options - Optional final stats
   */
  async failRun(
    error: Error | string,
    options: Omit<CompleteRunOptions, 'status'> = {},
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : error;
    await this.completeRun({
      ...options,
      status: EtlRunStatus.FAILED,
      errors: [...(options.errors || []), errorMessage],
    });
  }

  /**
   * Mark the current run as cancelled
   *
   * @param reason - Optional cancellation reason
   */
  async cancelRun(reason?: string): Promise<void> {
    if (reason) {
      this.accumulatedWarnings.push(`Run cancelled: ${reason}`);
    }
    await this.completeRun({
      status: EtlRunStatus.CANCELLED,
    });
  }

  /**
   * Get the current run ID
   */
  getRunId(): string | null {
    return this.runId;
  }

  /**
   * Check if a run is currently in progress
   */
  isRunning(): boolean {
    return this.runId !== null;
  }

  /**
   * Add an error message to the current run
   *
   * @param message - Error message
   */
  addError(message: string): void {
    this.accumulatedErrors.push(message);
    logger.error(`[ETL Run ${this.runId}] ${message}`);
  }

  /**
   * Add a warning message to the current run
   *
   * @param message - Warning message
   */
  addWarning(message: string): void {
    this.accumulatedWarnings.push(message);
    logger.warn(`[ETL Run ${this.runId}] ${message}`);
  }

  /**
   * Get the last N runs for a data source
   *
   * @param dataSourceId - Data source ID
   * @param limit - Maximum number of runs to return
   * @returns Array of run records
   */
  async getRunHistory(
    dataSourceId: string,
    limit = 10,
  ): Promise<EtlRunRecord[]> {
    try {
      const rows = await this.dataSource.query(
        `SELECT 
          id,
          data_source_id as "dataSourceId",
          run_name as "runName",
          source_url as "sourceUrl",
          status,
          started_at as "startedAt",
          completed_at as "completedAt",
          duration_ms as "durationMs",
          rows_extracted as "rowsExtracted",
          rows_transformed as "rowsTransformed",
          rows_loaded as "rowsLoaded",
          rows_skipped as "rowsSkipped",
          error_count as "errorCount",
          warning_count as "warningCount",
          error_messages as "errorMessages",
          warning_messages as "warningMessages",
          metadata
        FROM etl_runs
        WHERE data_source_id = $1
        ORDER BY started_at DESC
        LIMIT $2`,
        [dataSourceId, limit],
      );
      return rows;
    } catch (error) {
      logger.error('Failed to get run history:', error);
      return [];
    }
  }

  /**
   * Get the last successful run for a data source
   *
   * @param dataSourceId - Data source ID
   * @returns The last successful run, or null
   */
  async getLastSuccessfulRun(
    dataSourceId: string,
  ): Promise<EtlRunRecord | null> {
    try {
      const rows = await this.dataSource.query(
        `SELECT 
          id,
          data_source_id as "dataSourceId",
          run_name as "runName",
          source_url as "sourceUrl",
          status,
          started_at as "startedAt",
          completed_at as "completedAt",
          duration_ms as "durationMs",
          rows_extracted as "rowsExtracted",
          rows_transformed as "rowsTransformed",
          rows_loaded as "rowsLoaded",
          rows_skipped as "rowsSkipped",
          error_count as "errorCount",
          warning_count as "warningCount",
          error_messages as "errorMessages",
          warning_messages as "warningMessages",
          metadata
        FROM etl_runs
        WHERE data_source_id = $1
          AND status IN ($2, $3)
        ORDER BY completed_at DESC
        LIMIT 1`,
        [dataSourceId, EtlRunStatus.COMPLETED, EtlRunStatus.COMPLETED_WITH_WARNINGS],
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Failed to get last successful run:', error);
      return null;
    }
  }

  /**
   * Check if there's a run currently in progress for a data source
   *
   * @param dataSourceId - Data source ID
   * @returns True if a run is in progress
   */
  async hasRunningRun(dataSourceId: string): Promise<boolean> {
    try {
      const rows = await this.dataSource.query(
        `SELECT id FROM etl_runs
        WHERE data_source_id = $1 AND status = $2
        LIMIT 1`,
        [dataSourceId, EtlRunStatus.RUNNING],
      );
      return rows.length > 0;
    } catch (error) {
      logger.error('Failed to check for running run:', error);
      return false;
    }
  }

  /**
   * Clean up stale running runs (mark as failed)
   * Useful after system crashes or restarts
   *
   * @param maxAge - Maximum age in milliseconds (default: 1 hour)
   * @returns Number of runs cleaned up
   */
  async cleanupStaleRuns(maxAge = 3600000): Promise<number> {
    try {
      const cutoff = new Date(Date.now() - maxAge);
      const result = await this.dataSource.query(
        `UPDATE etl_runs SET
          status = $1,
          completed_at = NOW(),
          duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000,
          error_count = error_count + 1,
          error_messages = COALESCE(error_messages, '[]'::jsonb) || '["Run timed out or system restarted"]'::jsonb,
          updated_at = NOW()
        WHERE status = $2 AND started_at < $3`,
        [EtlRunStatus.FAILED, EtlRunStatus.RUNNING, cutoff],
      );
      const count = result[1] || 0;
      if (count > 0) {
        logger.info(`Cleaned up ${count} stale ETL runs`);
      }
      return count;
    } catch (error) {
      logger.error('Failed to cleanup stale runs:', error);
      return 0;
    }
  }
}

/**
 * Create an ETL run logger instance
 */
export function createEtlRunLogger(dataSource: DataSource): EtlRunLogger {
  return new EtlRunLogger(dataSource);
}
