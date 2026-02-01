/**
 * INSEE Population Data Transformer
 *
 * Transforms raw population records to database format.
 * Resolves département codes to administrative area IDs.
 */

import { DataSource } from 'typeorm';
import {
    BaseTransformer,
    TransformationResult,
    TransformerOptions,
} from '../../core/transformer';
import { logger } from '../../utils/logger';
import { PopulationRawRecord, PopulationRecord } from './population.types';

/**
 * Transformer options specific to population data
 */
export interface PopulationTransformerOptions extends TransformerOptions {
  /** Data source identifier for the population records */
  source?: string;
}

/**
 * Population Data Transformer
 *
 * Transforms raw population records by:
 * 1. Resolving département codes to administrative_areas UUIDs
 * 2. Validating population values
 * 3. Adding source metadata
 */
export class PopulationTransformer extends BaseTransformer<
  PopulationRawRecord,
  PopulationRecord
> {
  private dataSource: DataSource;
  private transformerOptions: PopulationTransformerOptions;
  /** Cache of département code → area ID mappings */
  private areaIdCache: Map<string, string> = new Map();

  constructor(
    dataSource: DataSource,
    options: PopulationTransformerOptions = {},
  ) {
    super(options);
    this.dataSource = dataSource;
    this.transformerOptions = {
      source: 'INSEE',
      ...options,
    };
  }

  /**
   * Override transform to pre-load area mappings
   */
  async transform(
    rawData: PopulationRawRecord[],
  ): Promise<TransformationResult<PopulationRecord>> {
    // Pre-load département → area_id mappings
    await this.loadAreaMappings();

    if (this.areaIdCache.size === 0) {
      throw new Error(
        'No administrative areas found in database. Run départements pipeline first.',
      );
    }

    logger.info(
      `Loaded ${this.areaIdCache.size} département → area_id mappings`,
    );

    // Call parent transform
    return super.transform(rawData);
  }

  /**
   * Load département code → area_id mappings from database
   */
  private async loadAreaMappings(): Promise<void> {
    const query = `
      SELECT id, code
      FROM administrative_areas
      WHERE level = 'department'
    `;

    const results = await this.dataSource.query(query);

    for (const row of results) {
      this.areaIdCache.set(row.code, row.id);
    }
  }

  /**
   * Transform a single population record
   */
  protected async transformRow(
    row: PopulationRawRecord,
    index: number,
  ): Promise<PopulationRecord | null> {
    const { departementCode, year, population } = row;

    // Resolve département code to area ID
    const areaId = this.areaIdCache.get(departementCode);
    if (!areaId) {
      this.addError(
        index,
        `Unknown département code: ${departementCode}`,
        'departementCode',
        departementCode,
      );
      return null;
    }

    // Validate population value
    if (population <= 0) {
      this.addError(
        index,
        `Invalid population value: ${population}`,
        'population',
        population,
      );
      return null;
    }

    if (population > 100_000_000) {
      this.addWarning(
        `Unusually large population for ${departementCode} in ${year}: ${population}`,
      );
    }

    // Validate year
    if (year < 1900 || year > 2100) {
      this.addError(index, `Invalid year: ${year}`, 'year', year);
      return null;
    }

    return {
      areaId,
      code: departementCode,
      year,
      populationCount: population,
      source: this.transformerOptions.source || 'INSEE',
      notes: `Legal population as of January 1, ${year}`,
    };
  }

  /**
   * Validate transformer configuration
   */
  async validate(): Promise<boolean> {
    // Check database connection
    try {
      const result = await this.dataSource.query('SELECT 1');
      if (!result) {
        logger.error('Database connection check failed');
        return false;
      }
    } catch (error) {
      logger.error('Cannot connect to database:', error);
      return false;
    }

    return true;
  }
}

/**
 * Factory function to create a PopulationTransformer
 */
export function createPopulationTransformer(
  dataSource: DataSource,
  options: Partial<PopulationTransformerOptions> = {},
): PopulationTransformer {
  return new PopulationTransformer(dataSource, options);
}
