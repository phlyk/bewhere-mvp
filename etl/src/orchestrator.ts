/**
 * ETL Orchestrator
 *
 * Coordinates the execution of multiple ETL pipelines,
 * handles dependencies between pipelines, and provides status reporting.
 */

import { AppDataSource } from './config/database';
import { PipelineResult } from './core/pipeline';
import {
    DepartementsPipeline,
    areDepartementsLoaded,
} from './pipelines/departements';
import { logger } from './utils/logger';

/**
 * Run options
 */
export interface RunOptions {
  /** Dry run mode (extract and transform only) */
  dryRun?: boolean;
  /** Force re-run even if data exists */
  force?: boolean;
}

/**
 * Status options
 */
export interface StatusOptions {
  /** Filter by dataset name */
  dataset?: string;
  /** Maximum number of runs to show */
  limit?: number;
}

/**
 * Available dataset names
 */
export type DatasetName =
  | 'departements'
  | 'population'
  | 'france-monthly'
  | 'france-timeseries';

/**
 * Pipeline execution order
 * Dependencies: geometry → population → crime data
 */
const PIPELINE_ORDER: DatasetName[] = [
  'departements', // Must be first (provides area_id references)
  'population', // Must be before crime data (provides population for rate calculation)
  'france-monthly', // Crime data from État 4001
  'france-timeseries', // Crime data from time series
];

/**
 * ETL Orchestrator class
 *
 * Manages the execution of ETL pipelines in the correct order.
 */
export class EtlOrchestrator {
  /**
   * Run all ETL pipelines in order
   */
  async runAll(options: RunOptions = {}): Promise<PipelineResult[]> {
    const results: PipelineResult[] = [];

    logger.info('Starting full ETL pipeline run...');
    logger.info(`Pipeline order: ${PIPELINE_ORDER.join(' → ')}`);

    for (const dataset of PIPELINE_ORDER) {
      try {
        const result = await this.runDataset(dataset, options);
        results.push(result);

        if (result.status === 'failed') {
          logger.error(`Pipeline ${dataset} failed, stopping execution`);
          break;
        }
      } catch (error) {
        logger.error(`Failed to run pipeline ${dataset}:`, error);
        break;
      }
    }

    // Print summary
    this.printSummary(results);

    return results;
  }

  /**
   * Run a specific dataset pipeline
   */
  async runDataset(
    dataset: DatasetName,
    options: RunOptions = {},
  ): Promise<PipelineResult> {
    logger.info(`Running dataset: ${dataset}`);

    // TODO: Implement actual pipelines in Phase 3/4
    // For now, return a placeholder result
    const pipeline = await this.getPipeline(dataset);

    if (!pipeline) {
      throw new Error(`Unknown dataset: ${dataset}`);
    }

    return pipeline.run(options);
  }

  /**
   * Get a pipeline instance by dataset name
   */
  private async getPipeline(dataset: DatasetName): Promise<{
    run: (options: RunOptions) => Promise<PipelineResult>;
  } | null> {
    // Ensure database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    switch (dataset) {
      case 'departements':
        return new DepartementsPipeline(AppDataSource);

      case 'population':
        // TODO: Implement in Task 3.4
        logger.warn(`Pipeline '${dataset}' not yet implemented (Task 3.4)`);
        return this.createPlaceholderPipeline(dataset);

      case 'france-monthly':
        // TODO: Implement in Phase 4
        logger.warn(`Pipeline '${dataset}' not yet implemented (Phase 4)`);
        return this.createPlaceholderPipeline(dataset);

      case 'france-timeseries':
        // TODO: Implement in Phase 4
        logger.warn(`Pipeline '${dataset}' not yet implemented (Phase 4)`);
        return this.createPlaceholderPipeline(dataset);

      default:
        logger.error(`Unknown dataset: ${dataset}`);
        return null;
    }
  }

  /**
   * Create a placeholder pipeline for unimplemented datasets
   */
  private createPlaceholderPipeline(dataset: DatasetName): {
    run: (options: RunOptions) => Promise<PipelineResult>;
  } {
    return {
      run: async () => ({
        name: dataset,
        status: 'completed_with_warnings' as const,
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 0,
        stats: {
          rowsExtracted: 0,
          rowsTransformed: 0,
          rowsLoaded: 0,
          rowsSkipped: 0,
          errorCount: 0,
          warningCount: 1, // Warning that pipeline is not implemented
        },
      }),
    };
  }

  /**
   * Check if prerequisite data is loaded
   */
  async checkPrerequisites(dataset: DatasetName): Promise<boolean> {
    // Ensure database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    switch (dataset) {
      case 'departements':
        // No prerequisites for département geometries
        return true;

      case 'population':
      case 'france-monthly':
      case 'france-timeseries':
        // Crime data requires département geometries
        const loaded = await areDepartementsLoaded(AppDataSource);
        if (!loaded) {
          logger.error(
            `Prerequisites not met for ${dataset}: ` +
              'Département geometries must be loaded first. ' +
              'Run: npm run etl:departements',
          );
        }
        return loaded;

      default:
        return false;
    }
  }

  /**
   * Validate a specific dataset
   */
  async validateDataset(dataset: string): Promise<boolean> {
    logger.info(`Validating dataset: ${dataset}`);
    // TODO: Implement in Phase 3
    logger.warn('Validation not yet implemented');
    return true;
  }

  /**
   * Validate all datasets
   */
  async validateAll(): Promise<boolean> {
    logger.info('Validating all datasets...');
    let allValid = true;

    for (const dataset of PIPELINE_ORDER) {
      const isValid = await this.validateDataset(dataset);
      if (!isValid) {
        allValid = false;
      }
    }

    return allValid;
  }

  /**
   * Show ETL run history
   */
  async showStatus(options: StatusOptions = {}): Promise<void> {
    const limit = options.limit || 10;

    try {
      let query = `
        SELECT
          id, run_name, status, started_at, completed_at, duration_ms,
          rows_extracted, rows_transformed, rows_loaded, rows_skipped,
          error_count, warning_count
        FROM etl_runs
      `;

      const params: unknown[] = [];

      if (options.dataset) {
        query += ' WHERE run_name = $1';
        params.push(options.dataset);
      }

      query += ' ORDER BY started_at DESC LIMIT $' + (params.length + 1);
      params.push(limit);

      const runs = await AppDataSource.query(query, params);

      if (runs.length === 0) {
        logger.info('No ETL runs found');
        return;
      }

      logger.info(`\n=== ETL Run History (last ${runs.length} runs) ===\n`);

      for (const run of runs) {
        const status = run.status.toUpperCase();
        const statusIcon =
          status === 'COMPLETED'
            ? '✅'
            : status === 'COMPLETED_WITH_WARNINGS'
              ? '⚠️'
              : status === 'FAILED'
                ? '❌'
                : '🔄';

        logger.info(
          `${statusIcon} ${run.run_name} - ${status} ` +
            `(${run.rows_loaded} loaded, ${run.duration_ms}ms)`,
        );
        logger.info(
          `   Started: ${run.started_at} | ` +
            `Errors: ${run.error_count} | Warnings: ${run.warning_count}`,
        );
      }
    } catch (error) {
      logger.error('Failed to fetch ETL run history:', error);
    }
  }

  /**
   * Print summary of pipeline results
   */
  private printSummary(results: PipelineResult[]): void {
    logger.info('\n=== ETL Run Summary ===\n');

    let totalExtracted = 0;
    let totalLoaded = 0;
    let totalErrors = 0;
    let totalDurationMs = 0;

    for (const result of results) {
      const statusIcon =
        result.status === 'completed'
          ? '✅'
          : result.status === 'completed_with_warnings'
            ? '⚠️'
            : '❌';

      logger.info(
        `${statusIcon} ${result.name}: ${result.status} ` +
          `(${result.stats.rowsLoaded} loaded, ${result.durationMs}ms)`,
      );

      totalExtracted += result.stats.rowsExtracted;
      totalLoaded += result.stats.rowsLoaded;
      totalErrors += result.stats.errorCount;
      totalDurationMs += result.durationMs;
    }

    logger.info('\n---');
    logger.info(`Total: ${totalExtracted} extracted, ${totalLoaded} loaded`);
    logger.info(`Errors: ${totalErrors}, Duration: ${totalDurationMs}ms`);
  }
}
