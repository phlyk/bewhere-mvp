/**
 * INSEE Population Data Pipeline
 *
 * Complete ETL pipeline for loading French département population data.
 * This pipeline must run after the départements pipeline to resolve area IDs.
 */

import { DataSource } from 'typeorm';
import { BasePipeline, PipelineOptions } from '../../core/pipeline';
import { logger } from '../../utils/logger';
import { validateRowCount } from '../../utils/validation';
import {
    PopulationExtractorOptions,
    createPopulationExtractor
} from './population.extractor';
import {
    createPopulationLoader
} from './population.loader';
import {
    createPopulationTransformer
} from './population.transformer';
import {
    EXPECTED_POPULATION_RECORDS,
    POPULATION_YEAR_RANGE,
    PopulationRawRecord,
    PopulationRecord,
} from './population.types';

/**
 * Pipeline options specific to population loading
 */
export interface PopulationPipelineOptions extends PipelineOptions {
  /** Start year for population data */
  startYear?: number;
  /** End year for population data */
  endYear?: number;
  /** Include overseas départements (DOM) */
  includeOverseas?: boolean;
  /** Data source name */
  sourceName?: string;
}

/**
 * INSEE Population Data Pipeline
 *
 * Loads population data from INSEE (Institut National de la Statistique
 * et des Études Économiques) for French départements.
 *
 * Prerequisites:
 * - Départements pipeline must have run first (provides area_id references)
 *
 * Data source:
 * - INSEE Estimations de population (2016-2024)
 * - https://www.insee.fr/fr/statistiques/1893198
 *
 * @example
 * ```typescript
 * const pipeline = new PopulationPipeline(dataSource);
 * const result = await pipeline.run({ dryRun: false });
 * console.log(`Loaded ${result.stats.rowsLoaded} population records`);
 * ```
 */
export class PopulationPipeline extends BasePipeline<
  PopulationRawRecord,
  PopulationRecord
> {
  protected pipelineOptions: PopulationPipelineOptions;
  /** Data source ID for population data (to be set when data_sources table is seeded) */
  private dataSourceId?: string;

  constructor(dataSource: DataSource, options: PopulationPipelineOptions = {}) {
    super('population', dataSource);
    this.pipelineOptions = {
      startYear: POPULATION_YEAR_RANGE.start,
      endYear: POPULATION_YEAR_RANGE.end,
      includeOverseas: true,
      sourceName: 'INSEE',
      ...options,
    };
  }

  /**
   * Get the data source ID for ETL run tracking
   * Returns undefined until data_sources table is seeded
   */
  protected getDataSourceId(): string | undefined {
    return this.dataSourceId;
  }

  /**
   * Set the data source ID for ETL run tracking
   */
  setDataSourceId(id: string): void {
    this.dataSourceId = id;
  }

  /**
   * Get the source URL being processed
   */
  protected getSourceUrl(): string {
    return 'https://www.insee.fr/fr/statistiques/1893198';
  }

  /**
   * Initialize pipeline components
   */
  protected async initialize(): Promise<void> {
    logger.debug('[population] Initializing pipeline components');

    // Create extractor with year range options
    const extractorOptions: PopulationExtractorOptions = {
      source: 'embedded://population-data',
      startYear: this.pipelineOptions.startYear,
      endYear: this.pipelineOptions.endYear,
      includeOverseas: this.pipelineOptions.includeOverseas,
      useEmbedded: true,
    };
    this.extractor = createPopulationExtractor(extractorOptions);

    // Create transformer
    this.transformer = createPopulationTransformer(this.dataSource, {
      source: this.pipelineOptions.sourceName,
      continueOnError: true,
      maxErrors: 50,
    });

    // Create loader
    this.loader = createPopulationLoader(this.dataSource, {
      batchSize: 500,
      upsert: true,
    });

    logger.debug('[population] Pipeline components initialized');
  }

  /**
   * Validate pipeline configuration and prerequisites
   */
  async validate(): Promise<boolean> {
    logger.debug('[population] Validating pipeline configuration');

    // Check year range
    const { startYear, endYear } = this.pipelineOptions;
    if (startYear && endYear && startYear > endYear) {
      logger.error(`Invalid year range: ${startYear} > ${endYear}`);
      return false;
    }

    // Validate extractor
    const extractorValid = await this.extractor.validate();
    if (!extractorValid) {
      logger.error('[population] Extractor validation failed');
      return false;
    }

    // Validate transformer
    const transformerValid = await this.transformer.validate();
    if (!transformerValid) {
      logger.error('[population] Transformer validation failed');
      return false;
    }

    // Validate loader
    const loaderValid = await this.loader.validate();
    if (!loaderValid) {
      logger.error('[population] Loader validation failed');
      return false;
    }

    // Check that départements have been loaded
    const deptCount = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM administrative_areas WHERE level = 'department'`,
    );
    const count = parseInt(deptCount[0].count, 10);

    if (count === 0) {
      logger.error(
        '[population] No départements found in database. Run départements pipeline first.',
      );
      return false;
    }

    logger.debug(`[population] Found ${count} départements in database`);

    // Warn if count doesn't match expected
    if (count < EXPECTED_POPULATION_RECORDS.metropolitan) {
      logger.warn(
        `[population] Only ${count} départements found, expected at least ${EXPECTED_POPULATION_RECORDS.metropolitan}`,
      );
    }

    logger.debug('[population] Pipeline validation passed');
    return true;
  }

  /**
   * Perform post-load validation
   */
  async postValidate(): Promise<{ valid: boolean; warnings: string[] }> {
    const warnings: string[] = [];

    // Check total record count
    const result = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM population`,
    );
    const totalCount = parseInt(result[0].count, 10);

    const { startYear, endYear, includeOverseas } = this.pipelineOptions;
    const yearCount = (endYear || POPULATION_YEAR_RANGE.end) - (startYear || POPULATION_YEAR_RANGE.start) + 1;
    const deptCount = includeOverseas
      ? EXPECTED_POPULATION_RECORDS.totalDepartements
      : EXPECTED_POPULATION_RECORDS.metropolitan;
    const expectedCount = yearCount * deptCount;

    const validation = validateRowCount(totalCount, expectedCount, 0.05);
    if (!validation.isValid) {
      warnings.push(...validation.errors);
    }
    warnings.push(...validation.warnings);

    // Check for missing years
    const yearResult = await this.dataSource.query(
      `SELECT DISTINCT year FROM population ORDER BY year`,
    );
    const loadedYears = yearResult.map((r: { year: number }) => r.year);
    
    for (let year = startYear || POPULATION_YEAR_RANGE.start; year <= (endYear || POPULATION_YEAR_RANGE.end); year++) {
      if (!loadedYears.includes(year)) {
        warnings.push(`Missing population data for year ${year}`);
      }
    }

    // Sample check: verify Paris 2020 population is reasonable
    const parisCheck = await this.dataSource.query(
      `SELECT p."populationCount" 
       FROM population p
       JOIN administrative_areas a ON p."areaId" = a.id
       WHERE a.code = '75' AND p.year = 2020`,
    );
    if (parisCheck.length > 0) {
      const parisPop = parseInt(parisCheck[0].populationCount, 10);
      // Paris should have ~2.1 million people
      if (parisPop < 1_800_000 || parisPop > 2_500_000) {
        warnings.push(
          `Paris 2020 population looks suspicious: ${parisPop} (expected ~2.1M)`,
        );
      }
    }

    return {
      valid: warnings.filter(w => w.includes('below expected')).length === 0,
      warnings,
    };
  }
}

/**
 * Factory function to create a PopulationPipeline with default options
 */
export function createPopulationPipeline(
  dataSource: DataSource,
  options: Partial<PopulationPipelineOptions> = {},
): PopulationPipeline {
  return new PopulationPipeline(dataSource, options);
}
