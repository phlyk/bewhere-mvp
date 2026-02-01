/**
 * France Monthly Crime Rate Enricher
 *
 * Enriches yearly crime aggregates with rate_per_100k calculations
 * using INSEE population data.
 *
 * This module:
 * 1. Takes yearly aggregated data from the aggregator
 * 2. Looks up population for each département and year
 * 3. Calculates crime rate per 100,000 population
 * 4. Returns enriched records ready for the loader
 *
 * @see Task 4.1.5: Calculate rate_per_100k using INSEE population
 */

import { DataSource } from 'typeorm';
import { logger } from '../../utils/logger';
import { calculateRatePer100k } from '../../utils/rate-calculator';
import { EMBEDDED_POPULATION_DATA } from '../population/population.types';
import { YearlyCrimeAggregate } from './france-monthly.aggregator';
import { CanonicalCategoryCode } from './france-monthly.category-mapper';

/**
 * Enriched crime record with rate calculation
 */
export interface EnrichedCrimeRecord {
  /** Département code (01-95, 2A, 2B, 971-976) */
  departementCode: string;
  /** Database area_id (UUID), null if département not resolved */
  areaId: string | null;
  /** Canonical crime category code */
  canonicalCategory: CanonicalCategoryCode;
  /** Database category_id (UUID), null if category not resolved */
  categoryId: string | null;
  /** Year */
  year: number;
  /** Raw crime count */
  count: number;
  /** Crime rate per 100,000 population */
  ratePer100k: number | null;
  /** Population used for rate calculation */
  populationUsed: number | null;
  /** Number of months with data (1-12) */
  monthsWithData: number;
  /** Whether all 12 months have data */
  isComplete: boolean;
  /** Original État 4001 indices that contributed */
  sourceIndices: number[];
  /** Notes about the calculation */
  notes: string | null;
}

/**
 * Rate enrichment statistics
 */
export interface RateEnrichmentStatistics {
  /** Total records processed */
  totalRecords: number;
  /** Records with rate calculated */
  recordsWithRate: number;
  /** Records without population data (rate is null) */
  recordsWithoutPopulation: number;
  /** Records skipped (e.g., invalid department codes) */
  recordsSkipped: number;
  /** Unique départements processed */
  uniqueDepartements: number;
  /** Unique years processed */
  uniqueYears: number[];
  /** Départements missing population data */
  missingPopulationDepts: string[];
  /** Year/dept combinations missing population */
  missingPopulationDetails: { departementCode: string; year: number }[];
}

/**
 * Rate enrichment result
 */
export interface RateEnrichmentResult {
  /** Enriched crime records */
  data: EnrichedCrimeRecord[];
  /** Enrichment statistics */
  statistics: RateEnrichmentStatistics;
  /** Warnings generated during enrichment */
  warnings: string[];
}

/**
 * Population lookup source
 */
export type PopulationSource = 'database' | 'embedded';

/**
 * Rate enricher options
 */
export interface RateEnricherOptions {
  /** Population data source (default: 'embedded') */
  populationSource?: PopulationSource;
  /** Whether to skip records without population (default: false, include with null rate) */
  skipMissingPopulation?: boolean;
  /** Fallback year for population if exact year not found (e.g., use 2024 for 2025) */
  fallbackYear?: number;
}

/**
 * Population lookup result
 */
interface PopulationLookup {
  population: number | null;
  source: string;
  isFallback: boolean;
  fallbackYear?: number;
}

/**
 * France Monthly Rate Enricher
 *
 * Enriches yearly crime aggregates with rate_per_100k calculations.
 */
export class FranceMonthlyRateEnricher {
  private dataSource: DataSource | null;
  private options: Required<RateEnricherOptions>;
  private populationCache: Map<string, PopulationLookup> = new Map();

  constructor(
    dataSource: DataSource | null = null,
    options: RateEnricherOptions = {},
  ) {
    this.dataSource = dataSource;
    this.options = {
      populationSource: options.populationSource ?? 'embedded',
      skipMissingPopulation: options.skipMissingPopulation ?? false,
      fallbackYear: options.fallbackYear ?? 2024,
    };
  }

  /**
   * Enrich yearly aggregates with rate calculations
   *
   * @param aggregates - Yearly crime aggregates from aggregator
   * @returns Enriched records with rates
   */
  async enrich(aggregates: YearlyCrimeAggregate[]): Promise<RateEnrichmentResult> {
    const warnings: string[] = [];
    const enrichedRecords: EnrichedCrimeRecord[] = [];

    // Statistics tracking
    let recordsWithRate = 0;
    let recordsWithoutPopulation = 0;
    let recordsSkipped = 0;
    const missingPopulationDepts = new Set<string>();
    const missingPopulationDetails: { departementCode: string; year: number }[] = [];

    logger.info(`Enriching ${aggregates.length} yearly aggregates with rate calculations`);

    // Preload population data if using database
    if (this.options.populationSource === 'database' && this.dataSource) {
      await this.preloadPopulationFromDatabase(aggregates);
    }

    for (const aggregate of aggregates) {
      const { departementCode, canonicalCategory, year, count } = aggregate;

      // Lookup population
      const populationLookup = await this.getPopulation(departementCode, year);

      // Create enriched record
      const enrichedRecord: EnrichedCrimeRecord = {
        departementCode,
        areaId: null, // To be resolved by loader
        canonicalCategory,
        categoryId: null, // To be resolved by loader
        year,
        count,
        ratePer100k: null,
        populationUsed: null,
        monthsWithData: aggregate.monthsWithData,
        isComplete: aggregate.isComplete,
        sourceIndices: aggregate.sourceIndices,
        notes: null,
      };

      if (populationLookup.population !== null && populationLookup.population > 0) {
        // Calculate rate
        try {
          enrichedRecord.ratePer100k = calculateRatePer100k(count, populationLookup.population);
          enrichedRecord.populationUsed = populationLookup.population;
          recordsWithRate++;

          // Add note if fallback was used
          if (populationLookup.isFallback) {
            enrichedRecord.notes = `Population from fallback year ${populationLookup.fallbackYear}`;
          }
        } catch (error) {
          warnings.push(
            `Failed to calculate rate for ${departementCode}/${canonicalCategory}/${year}: ${error}`,
          );
          recordsWithoutPopulation++;
        }
      } else {
        // No population data
        recordsWithoutPopulation++;
        missingPopulationDepts.add(departementCode);

        // Track detailed missing info (avoid duplicates)
        const exists = missingPopulationDetails.some(
          (d) => d.departementCode === departementCode && d.year === year,
        );
        if (!exists) {
          missingPopulationDetails.push({ departementCode, year });
        }

        if (this.options.skipMissingPopulation) {
          recordsSkipped++;
          continue;
        }

        enrichedRecord.notes = 'No population data available for rate calculation';
      }

      enrichedRecords.push(enrichedRecord);
    }

    // Collect unique départements and years for statistics
    const uniqueDepartements = new Set(aggregates.map((a) => a.departementCode)).size;
    const uniqueYears = [...new Set(aggregates.map((a) => a.year))].sort((a, b) => a - b);

    const statistics: RateEnrichmentStatistics = {
      totalRecords: aggregates.length,
      recordsWithRate,
      recordsWithoutPopulation,
      recordsSkipped,
      uniqueDepartements,
      uniqueYears,
      missingPopulationDepts: Array.from(missingPopulationDepts).sort(),
      missingPopulationDetails: missingPopulationDetails.sort((a, b) =>
        a.departementCode.localeCompare(b.departementCode) || a.year - b.year,
      ),
    };

    // Log summary
    logger.info(
      `Rate enrichment complete: ${recordsWithRate}/${aggregates.length} records have rates`,
    );

    if (recordsWithoutPopulation > 0) {
      logger.warn(
        `${recordsWithoutPopulation} records missing population data ` +
          `(${missingPopulationDepts.size} départements)`,
      );
    }

    if (missingPopulationDepts.size > 0) {
      warnings.push(
        `Missing population data for ${missingPopulationDepts.size} départements: ` +
          `${Array.from(missingPopulationDepts).slice(0, 5).join(', ')}${missingPopulationDepts.size > 5 ? '...' : ''}`,
      );
    }

    return {
      data: enrichedRecords,
      statistics,
      warnings,
    };
  }

  /**
   * Get population for a département and year
   */
  private async getPopulation(
    departementCode: string,
    year: number,
  ): Promise<PopulationLookup> {
    const cacheKey = `${departementCode}|${year}`;

    // Check cache first
    if (this.populationCache.has(cacheKey)) {
      return this.populationCache.get(cacheKey)!;
    }

    let lookup: PopulationLookup;

    if (this.options.populationSource === 'embedded') {
      lookup = this.getEmbeddedPopulation(departementCode, year);
    } else {
      lookup = await this.getDatabasePopulation(departementCode, year);
    }

    // Cache the result
    this.populationCache.set(cacheKey, lookup);

    return lookup;
  }

  /**
   * Get population from embedded data
   */
  private getEmbeddedPopulation(
    departementCode: string,
    year: number,
  ): PopulationLookup {
    const deptData = EMBEDDED_POPULATION_DATA[departementCode];

    if (!deptData) {
      return {
        population: null,
        source: 'embedded',
        isFallback: false,
      };
    }

    // Try exact year first
    if (deptData[year] !== undefined) {
      // Population data is in thousands, convert to actual population
      return {
        population: deptData[year] * 1000,
        source: 'embedded',
        isFallback: false,
      };
    }

    // Try fallback year
    if (this.options.fallbackYear && deptData[this.options.fallbackYear] !== undefined) {
      return {
        population: deptData[this.options.fallbackYear] * 1000,
        source: 'embedded',
        isFallback: true,
        fallbackYear: this.options.fallbackYear,
      };
    }

    // Try finding closest available year
    const availableYears = Object.keys(deptData)
      .map(Number)
      .sort((a, b) => b - a);

    if (availableYears.length > 0) {
      // Use most recent available year
      const closestYear = availableYears[0];
      return {
        population: deptData[closestYear] * 1000,
        source: 'embedded',
        isFallback: true,
        fallbackYear: closestYear,
      };
    }

    return {
      population: null,
      source: 'embedded',
      isFallback: false,
    };
  }

  /**
   * Get population from database
   */
  private async getDatabasePopulation(
    departementCode: string,
    year: number,
  ): Promise<PopulationLookup> {
    if (!this.dataSource) {
      // Fall back to embedded data
      return this.getEmbeddedPopulation(departementCode, year);
    }

    // Check cache (might have been preloaded)
    const cacheKey = `${departementCode}|${year}`;
    if (this.populationCache.has(cacheKey)) {
      return this.populationCache.get(cacheKey)!;
    }

    try {
      // Query database
      const query = `
        SELECT p."populationCount"
        FROM population p
        JOIN administrative_areas a ON p."areaId" = a.id
        WHERE a.code = $1 AND p.year = $2
        LIMIT 1
      `;

      const result = await this.dataSource.query(query, [departementCode, year]);

      if (result.length > 0) {
        return {
          population: Number(result[0].populationCount),
          source: 'database',
          isFallback: false,
        };
      }

      // Try fallback year
      if (this.options.fallbackYear) {
        const fallbackResult = await this.dataSource.query(query, [
          departementCode,
          this.options.fallbackYear,
        ]);

        if (fallbackResult.length > 0) {
          return {
            population: Number(fallbackResult[0].populationCount),
            source: 'database',
            isFallback: true,
            fallbackYear: this.options.fallbackYear,
          };
        }
      }

      return {
        population: null,
        source: 'database',
        isFallback: false,
      };
    } catch (error) {
      logger.warn(`Failed to query population from database: ${error}`);
      // Fall back to embedded data
      return this.getEmbeddedPopulation(departementCode, year);
    }
  }

  /**
   * Preload population data from database for efficiency
   */
  private async preloadPopulationFromDatabase(
    aggregates: YearlyCrimeAggregate[],
  ): Promise<void> {
    if (!this.dataSource) {
      return;
    }

    // Get unique département/year combinations
    const combinations = new Set<string>();
    for (const aggregate of aggregates) {
      combinations.add(`${aggregate.departementCode}|${aggregate.year}`);
    }

    const deptCodes = [...new Set(aggregates.map((a) => a.departementCode))];
    const years = [...new Set(aggregates.map((a) => a.year))];

    try {
      // Batch query all population data
      const query = `
        SELECT a.code as "departementCode", p.year, p."populationCount"
        FROM population p
        JOIN administrative_areas a ON p."areaId" = a.id
        WHERE a.code = ANY($1) AND p.year = ANY($2)
      `;

      const results = await this.dataSource.query(query, [deptCodes, years]);

      // Cache results
      for (const row of results) {
        const cacheKey = `${row.departementCode}|${row.year}`;
        this.populationCache.set(cacheKey, {
          population: Number(row.populationCount),
          source: 'database',
          isFallback: false,
        });
      }

      logger.debug(`Preloaded ${results.length} population records from database`);
    } catch (error) {
      logger.warn(`Failed to preload population data: ${error}`);
    }
  }

  /**
   * Clear the population cache
   */
  clearCache(): void {
    this.populationCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.populationCache.size,
      entries: Array.from(this.populationCache.keys()),
    };
  }
}

/**
 * Create a rate enricher with default options
 *
 * @param dataSource - Optional TypeORM data source
 * @param options - Enricher options
 * @returns Configured rate enricher
 */
export function createRateEnricher(
  dataSource: DataSource | null = null,
  options: RateEnricherOptions = {},
): FranceMonthlyRateEnricher {
  return new FranceMonthlyRateEnricher(dataSource, options);
}

/**
 * Enrich aggregates with rates using embedded population data
 *
 * Convenience function for simple use cases.
 *
 * @param aggregates - Yearly crime aggregates
 * @param options - Optional enricher options
 * @returns Enriched records with rates
 */
export async function enrichWithRates(
  aggregates: YearlyCrimeAggregate[],
  options: RateEnricherOptions = {},
): Promise<RateEnrichmentResult> {
  const enricher = new FranceMonthlyRateEnricher(null, {
    populationSource: 'embedded',
    ...options,
  });
  return enricher.enrich(aggregates);
}
