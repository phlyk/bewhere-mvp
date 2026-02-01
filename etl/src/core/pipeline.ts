/**
 * Base Pipeline Class
 *
 * Orchestrates the ETL process by coordinating Extractor, Transformer, and Loader.
 * Handles logging, error handling, and run tracking.
 */

import { DataSource } from 'typeorm';
import { createEtlRunLogger, EtlRunLogger, EtlRunStatus } from '../utils/etl-run-logger';
import { logger } from '../utils/logger';
import { BaseExtractor, ExtractionResult } from './extractor';
import { BaseLoader, LoadResult } from './loader';
import { BaseTransformer, TransformationResult } from './transformer';

/**
 * Pipeline run options
 */
export interface PipelineOptions {
  /** Dry run mode (extract and transform only) */
  dryRun?: boolean;
  /** Force re-run even if data exists */
  force?: boolean;
  /** Maximum rows to process (for testing) */
  maxRows?: number;
  /** Data source ID for ETL run tracking */
  dataSourceId?: string;
  /** Source URL being processed */
  sourceUrl?: string;
}

/**
 * Pipeline run result
 */
export interface PipelineResult {
  /** Pipeline name */
  name: string;
  /** Overall status */
  status: 'completed' | 'completed_with_warnings' | 'failed';
  /** Start timestamp */
  startedAt: Date;
  /** End timestamp */
  completedAt: Date;
  /** Duration in milliseconds */
  durationMs: number;
  /** Extraction result */
  extraction?: ExtractionResult<unknown>;
  /** Transformation result */
  transformation?: TransformationResult<unknown>;
  /** Load result */
  load?: LoadResult;
  /** Error message if failed */
  error?: string;
  /** Summary statistics */
  stats: {
    rowsExtracted: number;
    rowsTransformed: number;
    rowsLoaded: number;
    rowsSkipped: number;
    errorCount: number;
    warningCount: number;
  };
}

/**
 * Abstract base class for ETL pipelines
 *
 * @template TRaw - Type of raw extracted data
 * @template TTransformed - Type of transformed data
 */
export abstract class BasePipeline<TRaw, TTransformed> {
  protected name: string;
  protected dataSource: DataSource;
  protected extractor!: BaseExtractor<TRaw>;
  protected transformer!: BaseTransformer<TRaw, TTransformed>;
  protected loader!: BaseLoader<TTransformed>;
  protected runLogger: EtlRunLogger;

  constructor(name: string, dataSource: DataSource) {
    this.name = name;
    this.dataSource = dataSource;
    this.runLogger = createEtlRunLogger(dataSource);
  }

  /**
   * Initialize the pipeline components (extractor, transformer, loader)
   */
  protected abstract initialize(): Promise<void>;

  /**
   * Get the data source ID for this pipeline (for run tracking)
   * Override in subclass to provide the actual data source ID
   */
  protected abstract getDataSourceId(): string | undefined;

  /**
   * Get the source URL being processed (for run tracking)
   * Override in subclass to provide the actual source URL
   */
  protected abstract getSourceUrl(): string;

  /**
   * Run the complete ETL pipeline
   */
  async run(options: PipelineOptions = {}): Promise<PipelineResult> {
    const startedAt = new Date();
    let status: PipelineResult['status'] = 'completed';
    let extraction: ExtractionResult<TRaw> | undefined;
    let transformation: TransformationResult<TTransformed> | undefined;
    let load: LoadResult | undefined;
    let error: string | undefined;

    logger.info(`Starting pipeline: ${this.name}`);

    // Determine data source ID and source URL for run tracking
    const dataSourceId = options.dataSourceId || this.getDataSourceId();
    const sourceUrl = options.sourceUrl || this.getSourceUrl();

    // Start ETL run tracking (only if we have a dataSourceId)
    if (dataSourceId) {
      try {
        await this.runLogger.startRun({
          dataSourceId,
          sourceUrl,
          runName: this.name,
          metadata: {
            dryRun: options.dryRun || false,
            force: options.force || false,
            maxRows: options.maxRows,
          },
        });
      } catch (err) {
        logger.warn(`[${this.name}] Could not start run tracking:`, err);
      }
    }

    try {
      // Initialize components
      await this.initialize();

      // Validate configuration
      const isValid = await this.validate();
      if (!isValid) {
        throw new Error('Pipeline validation failed');
      }

      // Extract
      logger.info(`[${this.name}] Extracting data...`);
      extraction = await this.extractor.extract();
      logger.info(`[${this.name}] Extracted ${extraction.rowCount} rows`);

      // Update run with extraction results
      if (this.runLogger.isRunning()) {
        await this.runLogger.updateRun({
          rowsExtracted: extraction.rowCount,
          warnings: extraction.warnings,
        });
      }

      if (extraction.warnings.length > 0) {
        status = 'completed_with_warnings';
      }

      // Transform
      logger.info(`[${this.name}] Transforming data...`);
      transformation = await this.transformer.transform(extraction.data);
      logger.info(
        `[${this.name}] Transformed ${transformation.transformedCount} rows, ` +
          `skipped ${transformation.skippedCount}`,
      );

      // Update run with transformation results
      if (this.runLogger.isRunning()) {
        await this.runLogger.updateRun({
          rowsTransformed: transformation.transformedCount,
          rowsSkipped: transformation.skippedCount,
          errors: transformation.errors.map((e) => e.message),
          warnings: transformation.warnings,
        });
      }

      if (transformation.errors.length > 0 || transformation.warnings.length > 0) {
        status = 'completed_with_warnings';
      }

      // Load (unless dry run)
      if (!options.dryRun) {
        logger.info(`[${this.name}] Loading data...`);
        load = await this.loader.load(transformation.data);
        logger.info(
          `[${this.name}] Loaded ${load.insertedCount} inserted, ` +
            `${load.updatedCount} updated, ${load.skippedCount} skipped`,
        );

        if (load.errors.length > 0 || load.warnings.length > 0) {
          status = 'completed_with_warnings';
        }
      } else {
        logger.info(`[${this.name}] Dry run - skipping load phase`);
      }

      // Complete ETL run tracking
      if (this.runLogger.isRunning()) {
        const etlStatus = status === 'completed'
          ? EtlRunStatus.COMPLETED
          : EtlRunStatus.COMPLETED_WITH_WARNINGS;
        
        await this.runLogger.completeRun({
          status: etlStatus,
          rowsExtracted: extraction?.rowCount || 0,
          rowsTransformed: transformation?.transformedCount || 0,
          rowsLoaded: load?.insertedCount || 0,
          rowsSkipped: (transformation?.skippedCount || 0) + (load?.skippedCount || 0),
          errors: load?.errors.map((e) => e.message) || [],
          warnings: load?.warnings || [],
        });
      }
    } catch (err) {
      status = 'failed';
      error = String(err);
      logger.error(`[${this.name}] Pipeline failed:`, err);

      // Record failure
      if (this.runLogger.isRunning()) {
        await this.runLogger.failRun(err instanceof Error ? err : String(err), {
          rowsExtracted: extraction?.rowCount,
          rowsTransformed: transformation?.transformedCount,
          rowsLoaded: load?.insertedCount,
          rowsSkipped: (transformation?.skippedCount || 0) + (load?.skippedCount || 0),
        });
      }
    }

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    return {
      name: this.name,
      status,
      startedAt,
      completedAt,
      durationMs,
      extraction: extraction as ExtractionResult<unknown>,
      transformation: transformation as TransformationResult<unknown>,
      load,
      error,
      stats: {
        rowsExtracted: extraction?.rowCount || 0,
        rowsTransformed: transformation?.transformedCount || 0,
        rowsLoaded: load?.insertedCount || 0,
        rowsSkipped: (transformation?.skippedCount || 0) + (load?.skippedCount || 0),
        errorCount: (transformation?.errors.length || 0) + (load?.errors.length || 0),
        warningCount:
          (extraction?.warnings.length || 0) +
          (transformation?.warnings.length || 0) +
          (load?.warnings.length || 0),
      },
    };
  }

  /**
   * Validate the pipeline configuration
   */
  async validate(): Promise<boolean> {
    try {
      const extractorValid = await this.extractor.validate();
      const transformerValid = await this.transformer.validate();
      const loaderValid = await this.loader.validate();
      return extractorValid && transformerValid && loaderValid;
    } catch (err) {
      logger.error(`[${this.name}] Validation error:`, err);
      return false;
    }
  }

  /**
   * Get the ETL run logger for external access (e.g., for adding custom messages)
   */
  getRunLogger(): EtlRunLogger {
    return this.runLogger;
  }
}
