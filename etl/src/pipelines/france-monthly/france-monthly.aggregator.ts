/**
 * France Monthly Crime Data Aggregator (État 4001)
 *
 * Aggregates monthly État 4001 crime data to yearly totals by:
 * - Département code
 * - Canonical crime category (mapping 107 indices → 20 categories)
 * - Year
 *
 * @see Task 4.1.4: Aggregate monthly data to yearly totals
 */

import { logger } from '../../utils/logger';
import {
    CanonicalCategoryCode,
    Etat4001CategoryMapper,
    getCategoryMapper,
} from './france-monthly.category-mapper';
import { Etat4001ParsedRow } from './france-monthly.types';

/**
 * Input: Monthly extracted data with source date
 */
export interface MonthlyExtractedData {
  /** Parsed crime category rows from a single monthly file */
  rows: Etat4001ParsedRow[];
  /** Year of the data */
  year: number;
  /** Month of the data (1-12) */
  month: number;
  /** Source file path or URL */
  source: string;
}

/**
 * Output: Yearly aggregated record ready for transformation
 */
export interface YearlyCrimeAggregate {
  /** Département code (01-95, 2A, 2B) */
  departementCode: string;
  /** Canonical crime category code */
  canonicalCategory: CanonicalCategoryCode;
  /** Year */
  year: number;
  /** Total crime count for the year */
  count: number;
  /** Number of months with data */
  monthsWithData: number;
  /** Whether all 12 months have data */
  isComplete: boolean;
  /** Missing months (1-12) if any */
  missingMonths: number[];
  /** Original État 4001 indices that contributed to this aggregate */
  sourceIndices: number[];
}

/**
 * Aggregation statistics
 */
export interface AggregationStatistics {
  /** Total monthly files processed */
  monthlyFilesProcessed: number;
  /** Total rows processed from all files */
  totalRowsProcessed: number;
  /** Rows skipped (unused indices, unmapped categories) */
  rowsSkipped: number;
  /** Unique years in output */
  uniqueYears: number[];
  /** Unique départements in output */
  uniqueDepartements: number;
  /** Unique canonical categories in output */
  uniqueCategories: number;
  /** Years with complete data (12 months) */
  completeYears: number[];
  /** Years with partial data */
  partialYears: { year: number; monthsPresent: number[] }[];
}

/**
 * Aggregation result
 */
export interface AggregationResult {
  /** Yearly aggregated records */
  data: YearlyCrimeAggregate[];
  /** Aggregation statistics */
  statistics: AggregationStatistics;
  /** Warnings generated during aggregation */
  warnings: string[];
}

/**
 * Aggregation options
 */
export interface AggregatorOptions {
  /** Minimum months required for a year to be included (default: 1) */
  minMonthsRequired?: number;
  /** Whether to extrapolate partial years to full year (default: false) */
  extrapolatePartialYears?: boolean;
  /** Category mapper instance (uses singleton if not provided) */
  categoryMapper?: Etat4001CategoryMapper;
}

/**
 * Internal key for aggregation map
 */
interface AggregationKey {
  departementCode: string;
  canonicalCategory: CanonicalCategoryCode;
  year: number;
}

/**
 * Internal value for aggregation map
 */
interface AggregationValue {
  count: number;
  monthsPresent: Set<number>;
  sourceIndices: Set<number>;
}

/**
 * Create a string key for the aggregation map
 */
function makeKey(departementCode: string, category: CanonicalCategoryCode, year: number): string {
  return `${departementCode}|${category}|${year}`;
}

/**
 * Parse the string key back to components
 */
function parseKey(key: string): AggregationKey {
  const [departementCode, canonicalCategory, yearStr] = key.split('|');
  return {
    departementCode,
    canonicalCategory: canonicalCategory as CanonicalCategoryCode,
    year: parseInt(yearStr, 10),
  };
}

/**
 * Aggregate monthly État 4001 data to yearly totals
 *
 * This function:
 * 1. Takes monthly extracted data from multiple files
 * 2. Maps each État 4001 index to its canonical category
 * 3. Aggregates counts by (département, canonical_category, year)
 * 4. Returns yearly totals ready for rate calculation and loading
 *
 * @param monthlyData - Array of monthly extracted data
 * @param options - Aggregation options
 * @returns Aggregation result with yearly totals
 *
 * @example
 * ```typescript
 * const juneData = await extractor.extract('juin-2020.csv');
 * const julyData = await extractor.extract('juillet-2020.csv');
 *
 * const result = aggregateToYearly([
 *   { rows: juneData.data, year: 2020, month: 6, source: 'juin-2020.csv' },
 *   { rows: julyData.data, year: 2020, month: 7, source: 'juillet-2020.csv' },
 * ]);
 *
 * // result.data contains aggregated yearly records
 * ```
 */
export function aggregateToYearly(
  monthlyData: MonthlyExtractedData[],
  options: AggregatorOptions = {},
): AggregationResult {
  const {
    minMonthsRequired = 1,
    extrapolatePartialYears = false,
    categoryMapper = getCategoryMapper(),
  } = options;

  const warnings: string[] = [];
  let totalRowsProcessed = 0;
  let rowsSkipped = 0;

  // Aggregation map: key → accumulated values
  const aggregationMap = new Map<string, AggregationValue>();

  // Track which months we have for each year
  const yearMonthTracker = new Map<number, Set<number>>();

  logger.info(`Aggregating ${monthlyData.length} monthly files to yearly totals`);

  // Process each monthly file
  for (const monthly of monthlyData) {
    const { rows, year, month, source } = monthly;

    // Validate month
    if (month < 1 || month > 12) {
      warnings.push(`Invalid month ${month} in source ${source}, skipping file`);
      continue;
    }

    // Track that this year has this month
    if (!yearMonthTracker.has(year)) {
      yearMonthTracker.set(year, new Set());
    }
    yearMonthTracker.get(year)!.add(month);

    logger.debug(`Processing ${rows.length} rows from ${source} (${year}-${month.toString().padStart(2, '0')})`);

    // Process each row (crime category)
    for (const row of rows) {
      totalRowsProcessed++;

      // Skip unused indices
      if (categoryMapper.isUnused(row.index)) {
        rowsSkipped++;
        continue;
      }

      // Get canonical category
      const canonicalCategory = categoryMapper.getCanonicalCode(row.index);
      if (!canonicalCategory) {
        warnings.push(`No mapping for État 4001 index ${row.index} (${row.categoryName}), skipping`);
        rowsSkipped++;
        continue;
      }

      // Aggregate by département
      for (const [deptCode, count] of Object.entries(row.departementCounts)) {
        // Skip if count is 0 or negative
        if (count <= 0) {
          continue;
        }

        const key = makeKey(deptCode, canonicalCategory, year);

        if (!aggregationMap.has(key)) {
          aggregationMap.set(key, {
            count: 0,
            monthsPresent: new Set(),
            sourceIndices: new Set(),
          });
        }

        const value = aggregationMap.get(key)!;
        value.count += count;
        value.monthsPresent.add(month);
        value.sourceIndices.add(row.index);
      }
    }
  }

  // Convert aggregation map to output records
  const data: YearlyCrimeAggregate[] = [];
  const excludedKeys: string[] = [];

  for (const [key, value] of aggregationMap) {
    const { departementCode, canonicalCategory, year } = parseKey(key);
    const monthsWithData = value.monthsPresent.size;

    // Check minimum months requirement
    if (monthsWithData < minMonthsRequired) {
      warnings.push(
        `${departementCode}/${canonicalCategory}/${year} has only ${monthsWithData} months, ` +
          `minimum ${minMonthsRequired} required, excluding`,
      );
      excludedKeys.push(key);
      continue;
    }

    // Calculate missing months
    const missingMonths: number[] = [];
    for (let m = 1; m <= 12; m++) {
      if (!value.monthsPresent.has(m)) {
        missingMonths.push(m);
      }
    }

    const isComplete = monthsWithData === 12;
    let finalCount = value.count;

    // Extrapolate if requested and data is partial
    if (!isComplete && extrapolatePartialYears) {
      const scaleFactor = 12 / monthsWithData;
      finalCount = Math.round(value.count * scaleFactor);
      warnings.push(
        `${departementCode}/${canonicalCategory}/${year}: Extrapolated from ${monthsWithData} months ` +
          `(${value.count} → ${finalCount})`,
      );
    }

    data.push({
      departementCode,
      canonicalCategory,
      year,
      count: finalCount,
      monthsWithData,
      isComplete,
      missingMonths,
      sourceIndices: Array.from(value.sourceIndices).sort((a, b) => a - b),
    });
  }

  // Sort output by year, département, category for consistent ordering
  data.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    if (a.departementCode !== b.departementCode) return a.departementCode.localeCompare(b.departementCode);
    return a.canonicalCategory.localeCompare(b.canonicalCategory);
  });

  // Build statistics
  const uniqueYears = Array.from(yearMonthTracker.keys()).sort((a, b) => a - b);
  const uniqueDepartements = new Set(data.map((d) => d.departementCode)).size;
  const uniqueCategories = new Set(data.map((d) => d.canonicalCategory)).size;

  const completeYears: number[] = [];
  const partialYears: { year: number; monthsPresent: number[] }[] = [];

  for (const [year, months] of yearMonthTracker) {
    if (months.size === 12) {
      completeYears.push(year);
    } else {
      partialYears.push({
        year,
        monthsPresent: Array.from(months).sort((a, b) => a - b),
      });
    }
  }

  const statistics: AggregationStatistics = {
    monthlyFilesProcessed: monthlyData.length,
    totalRowsProcessed,
    rowsSkipped,
    uniqueYears,
    uniqueDepartements,
    uniqueCategories,
    completeYears: completeYears.sort((a, b) => a - b),
    partialYears: partialYears.sort((a, b) => a.year - b.year),
  };

  logger.info(
    `Aggregation complete: ${data.length} yearly records from ${totalRowsProcessed} monthly rows`,
  );
  logger.info(
    `Years: ${uniqueYears.join(', ')} | Départements: ${uniqueDepartements} | Categories: ${uniqueCategories}`,
  );

  if (partialYears.length > 0) {
    for (const partial of partialYears) {
      logger.warn(
        `Year ${partial.year} has partial data: months ${partial.monthsPresent.join(', ')}`,
      );
    }
  }

  return {
    data,
    statistics,
    warnings,
  };
}

/**
 * Aggregate a single month's data for quick processing
 *
 * Useful for incremental aggregation or testing.
 * Returns non-aggregated per-month records.
 *
 * @param rows - Parsed rows from a single monthly file
 * @param year - Year of the data
 * @param month - Month of the data
 * @param categoryMapper - Optional category mapper instance
 * @returns Map of (dept|category) → count for this month
 */
export function aggregateSingleMonth(
  rows: Etat4001ParsedRow[],
  year: number,
  month: number,
  categoryMapper: Etat4001CategoryMapper = getCategoryMapper(),
): Map<string, { departementCode: string; canonicalCategory: CanonicalCategoryCode; count: number }> {
  const result = new Map<
    string,
    { departementCode: string; canonicalCategory: CanonicalCategoryCode; count: number }
  >();

  for (const row of rows) {
    // Skip unused indices
    if (categoryMapper.isUnused(row.index)) {
      continue;
    }

    // Get canonical category
    const canonicalCategory = categoryMapper.getCanonicalCode(row.index);
    if (!canonicalCategory) {
      continue;
    }

    // Aggregate by département
    for (const [deptCode, count] of Object.entries(row.departementCounts)) {
      if (count <= 0) {
        continue;
      }

      const key = `${deptCode}|${canonicalCategory}`;

      if (!result.has(key)) {
        result.set(key, {
          departementCode: deptCode,
          canonicalCategory,
          count: 0,
        });
      }

      result.get(key)!.count += count;
    }
  }

  return result;
}

/**
 * Get summary of canonical category counts from aggregated data
 *
 * @param data - Yearly aggregated records
 * @returns Map of canonical category → total count across all years/départements
 */
export function getCategorySummary(
  data: YearlyCrimeAggregate[],
): Map<CanonicalCategoryCode, number> {
  const summary = new Map<CanonicalCategoryCode, number>();

  for (const record of data) {
    const current = summary.get(record.canonicalCategory) || 0;
    summary.set(record.canonicalCategory, current + record.count);
  }

  return summary;
}

/**
 * Get summary by département from aggregated data
 *
 * @param data - Yearly aggregated records
 * @returns Map of département code → total count across all years/categories
 */
export function getDepartementSummary(
  data: YearlyCrimeAggregate[],
): Map<string, number> {
  const summary = new Map<string, number>();

  for (const record of data) {
    const current = summary.get(record.departementCode) || 0;
    summary.set(record.departementCode, current + record.count);
  }

  return summary;
}

/**
 * Get summary by year from aggregated data
 *
 * @param data - Yearly aggregated records
 * @returns Map of year → total count across all départements/categories
 */
export function getYearSummary(
  data: YearlyCrimeAggregate[],
): Map<number, number> {
  const summary = new Map<number, number>();

  for (const record of data) {
    const current = summary.get(record.year) || 0;
    summary.set(record.year, current + record.count);
  }

  return summary;
}

/**
 * Filter aggregated data by criteria
 *
 * @param data - Yearly aggregated records
 * @param filter - Filter criteria
 * @returns Filtered records
 */
export function filterAggregatedData(
  data: YearlyCrimeAggregate[],
  filter: {
    years?: number[];
    departementCodes?: string[];
    categories?: CanonicalCategoryCode[];
    minCount?: number;
    completeOnly?: boolean;
  },
): YearlyCrimeAggregate[] {
  return data.filter((record) => {
    if (filter.years && !filter.years.includes(record.year)) {
      return false;
    }
    if (filter.departementCodes && !filter.departementCodes.includes(record.departementCode)) {
      return false;
    }
    if (filter.categories && !filter.categories.includes(record.canonicalCategory)) {
      return false;
    }
    if (filter.minCount !== undefined && record.count < filter.minCount) {
      return false;
    }
    if (filter.completeOnly && !record.isComplete) {
      return false;
    }
    return true;
  });
}
