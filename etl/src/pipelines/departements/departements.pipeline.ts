/**
 * French Département Geometry Pipeline
 *
 * Complete ETL pipeline for loading French département boundaries into PostGIS.
 * This is the foundational pipeline - must run before population and crime data.
 */

import { DataSource } from 'typeorm';
import { BasePipeline, PipelineOptions, PipelineResult } from '../../core/pipeline';
import { logger } from '../../utils/logger';
import { validateRowCount } from '../../utils/validation';
import {
    DEPARTEMENTS_GEOJSON_SOURCES,
    createDepartementsExtractor
} from './departements.extractor';
import {
    DepartementsLoader,
    createDepartementsLoader,
} from './departements.loader';
import {
    createDepartementsTransformer
} from './departements.transformer';
import {
    DepartementGeoJsonFeature,
    DepartementRecord,
    EXPECTED_DEPARTEMENT_COUNT,
} from './departements.types';

/**
 * Pipeline options specific to département loading
 */
export interface DepartementsPipelineOptions extends PipelineOptions {
  /** GeoJSON source URL (defaults to geo.api.gouv.fr) */
  source?: string;
  /** Include overseas départements (DOM) */
  includeOverseas?: boolean;
  /** Delete existing départements before loading */
  deleteExisting?: boolean;
}

/**
 * French Département Geometry Pipeline
 *
 * Downloads GeoJSON from official French government sources,
 * transforms features to database format, and loads into PostGIS.
 *
 * @example
 * ```typescript
 * const pipeline = new DepartementsPipeline(dataSource);
 * const result = await pipeline.run({ dryRun: false });
 * console.log(`Loaded ${result.stats.rowsLoaded} départements`);
 * ```
 */
export class DepartementsPipeline extends BasePipeline<
  DepartementGeoJsonFeature,
  DepartementRecord
> {
  protected pipelineOptions: DepartementsPipelineOptions;
  /** Data source ID for département geometry data (to be set when data_sources table is seeded) */
  private dataSourceId?: string;

  constructor(dataSource: DataSource, options: DepartementsPipelineOptions = {}) {
    super('departements', dataSource);
    this.pipelineOptions = {
      source: DEPARTEMENTS_GEOJSON_SOURCES.geoApiGouv,
      includeOverseas: true,
      deleteExisting: false,
      ...options,
    };
  }

  /**
   * Get the data source ID for ETL run tracking
   * Returns undefined until data_sources table is seeded with département geometry source
   */
  protected getDataSourceId(): string | undefined {
    return this.dataSourceId;
  }

  /**
   * Set the data source ID for ETL run tracking
   * Call this after looking up the ID from the data_sources table
   */
  setDataSourceId(id: string): void {
    this.dataSourceId = id;
  }

  /**
   * Get the source URL being processed
   */
  protected getSourceUrl(): string {
    return this.pipelineOptions.source || DEPARTEMENTS_GEOJSON_SOURCES.geoApiGouv;
  }

  /**
   * Initialize pipeline components
   */
  protected async initialize(): Promise<void> {
    logger.info(`[${this.name}] Initializing pipeline components`);

    // Create extractor
    this.extractor = createDepartementsExtractor({
      source: this.pipelineOptions.source!,
      includeOverseas: this.pipelineOptions.includeOverseas,
      minFeatures: this.pipelineOptions.includeOverseas
        ? EXPECTED_DEPARTEMENT_COUNT.total
        : EXPECTED_DEPARTEMENT_COUNT.metropolitan,
    });

    // Create transformer
    this.transformer = createDepartementsTransformer({
      continueOnError: true,
      maxErrors: 10,
    });

    // Create loader
    this.loader = createDepartementsLoader(this.dataSource, {
      batchSize: 50,
      upsert: true,
    });

    // Handle deleteExisting option
    if (this.pipelineOptions.deleteExisting) {
      const loader = this.loader as DepartementsLoader;
      const deleted = await loader.deleteAll();
      if (deleted > 0) {
        logger.info(`[${this.name}] Deleted ${deleted} existing département records`);
      }
    }
  }

  /**
   * Run the complete pipeline
   */
  async run(options: DepartementsPipelineOptions = {}): Promise<PipelineResult> {
    // Merge options
    this.pipelineOptions = { ...this.pipelineOptions, ...options };

    // Run base pipeline
    const result = await super.run(options);

    // Post-run validation
    if (result.status !== 'failed') {
      await this.validateResults(result);
    }

    return result;
  }

  /**
   * Validate pipeline results
   */
  private async validateResults(result: PipelineResult): Promise<void> {
    const expected = this.pipelineOptions.includeOverseas
      ? EXPECTED_DEPARTEMENT_COUNT.total
      : EXPECTED_DEPARTEMENT_COUNT.metropolitan;

    // Validate row count
    const validation = validateRowCount(result.stats.rowsLoaded, expected, 0.05);

    if (!validation.isValid) {
      logger.warn(`[${this.name}] Row count validation warnings:`);
      validation.errors.forEach((e) => logger.warn(`  - ${e}`));
    }

    if (validation.warnings.length > 0) {
      validation.warnings.forEach((w) => logger.warn(`  - ${w}`));
    }

    // Verify data in database
    const loader = this.loader as DepartementsLoader;
    const dbCount = await loader.getCurrentCount();
    logger.info(`[${this.name}] Database now contains ${dbCount} départements`);
  }
}

/**
 * Factory function to create and optionally run the département pipeline
 */
export async function runDepartementsPipeline(
  dataSource: DataSource,
  options: DepartementsPipelineOptions = {},
): Promise<PipelineResult> {
  const pipeline = new DepartementsPipeline(dataSource, options);
  return pipeline.run(options);
}

/**
 * Check if départements are already loaded
 */
export async function areDepartementsLoaded(dataSource: DataSource): Promise<boolean> {
  try {
    const result = await dataSource.query(
      `SELECT COUNT(*) as count FROM administrative_areas WHERE level = 'department'`,
    );
    const count = parseInt(result[0].count, 10);
    return count >= EXPECTED_DEPARTEMENT_COUNT.metropolitan;
  } catch {
    return false;
  }
}
