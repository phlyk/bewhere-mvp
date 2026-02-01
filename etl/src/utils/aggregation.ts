/**
 * Monthly-to-Yearly Aggregation Utility
 *
 * Provides functions for aggregating monthly crime data to yearly totals.
 * Handles partial year data, data gaps, and various aggregation strategies.
 */

import { logger } from './logger';

/**
 * Monthly data record with required fields
 */
export interface MonthlyRecord {
  /** Year (e.g., 2024) */
  year: number;
  /** Month (1-12) */
  month: number;
  /** Numeric value (count, rate, etc.) */
  value: number;
}

/**
 * Aggregated yearly record
 */
export interface YearlyAggregate {
  /** Year */
  year: number;
  /** Aggregated value (total, average, etc.) */
  value: number;
  /** Number of months with data */
  monthsWithData: number;
  /** Whether all 12 months had data */
  isComplete: boolean;
  /** List of missing months (1-12) if any */
  missingMonths: number[];
}

/**
 * Aggregation strategy
 */
export enum AggregationStrategy {
  /** Sum all monthly values (for counts) */
  SUM = 'sum',
  /** Average of monthly values (for rates) */
  AVERAGE = 'average',
  /** Take the last value (for cumulative data) */
  LAST = 'last',
  /** Take the maximum value */
  MAX = 'max',
  /** Take the minimum value */
  MIN = 'min',
}

/**
 * Aggregation options
 */
export interface AggregationOptions {
  /** Aggregation strategy to use */
  strategy?: AggregationStrategy;
  /** Minimum months required for a valid yearly aggregate (default: 1) */
  minMonthsRequired?: number;
  /** Whether to extrapolate partial years (e.g., scale 6 months to 12) */
  extrapolatePartialYears?: boolean;
  /** Filter function to exclude certain records */
  filter?: (record: MonthlyRecord) => boolean;
}

/**
 * Aggregation result with statistics
 */
export interface AggregationResult {
  /** Yearly aggregates */
  data: YearlyAggregate[];
  /** Total months processed */
  totalMonthsProcessed: number;
  /** Number of complete years */
  completeYears: number;
  /** Number of partial years */
  partialYears: number;
  /** Years that were excluded due to insufficient data */
  excludedYears: number[];
  /** Any warnings generated during aggregation */
  warnings: string[];
}

/**
 * Aggregate monthly records to yearly totals
 *
 * @param records - Array of monthly records
 * @param options - Aggregation options
 * @returns Aggregation result with yearly aggregates
 */
export function aggregateMonthlyToYearly(
  records: MonthlyRecord[],
  options: AggregationOptions = {},
): AggregationResult {
  const {
    strategy = AggregationStrategy.SUM,
    minMonthsRequired = 1,
    extrapolatePartialYears = false,
    filter,
  } = options;

  const warnings: string[] = [];
  const excludedYears: number[] = [];

  // Filter records if filter function provided
  const filteredRecords = filter ? records.filter(filter) : records;

  // Group records by year
  const yearlyGroups = new Map<number, MonthlyRecord[]>();
  for (const record of filteredRecords) {
    // Validate month is 1-12
    if (record.month < 1 || record.month > 12) {
      warnings.push(`Invalid month ${record.month} for year ${record.year}, skipping`);
      continue;
    }

    if (!yearlyGroups.has(record.year)) {
      yearlyGroups.set(record.year, []);
    }
    yearlyGroups.get(record.year)!.push(record);
  }

  // Process each year
  const yearlyAggregates: YearlyAggregate[] = [];
  let totalMonthsProcessed = 0;
  let completeYears = 0;
  let partialYears = 0;

  // Sort years for consistent output
  const sortedYears = Array.from(yearlyGroups.keys()).sort((a, b) => a - b);

  for (const year of sortedYears) {
    const monthlyRecords = yearlyGroups.get(year)!;

    // Find which months have data
    const monthsPresent = new Set(monthlyRecords.map((r) => r.month));
    const missingMonths: number[] = [];
    for (let m = 1; m <= 12; m++) {
      if (!monthsPresent.has(m)) {
        missingMonths.push(m);
      }
    }

    const monthsWithData = monthsPresent.size;
    totalMonthsProcessed += monthsWithData;

    // Check minimum months requirement
    if (monthsWithData < minMonthsRequired) {
      warnings.push(
        `Year ${year} has only ${monthsWithData} months of data ` +
          `(minimum ${minMonthsRequired} required), excluding`,
      );
      excludedYears.push(year);
      continue;
    }

    // Handle duplicate months (take last value if duplicates exist)
    const monthValueMap = new Map<number, number>();
    for (const record of monthlyRecords) {
      if (monthValueMap.has(record.month)) {
        warnings.push(`Duplicate data for ${year}-${record.month.toString().padStart(2, '0')}, using last value`);
      }
      monthValueMap.set(record.month, record.value);
    }

    // Get values for aggregation
    const values = Array.from(monthValueMap.values());

    // Apply aggregation strategy
    let aggregatedValue: number;
    switch (strategy) {
      case AggregationStrategy.SUM:
        aggregatedValue = values.reduce((sum, v) => sum + v, 0);
        break;
      case AggregationStrategy.AVERAGE:
        aggregatedValue = values.reduce((sum, v) => sum + v, 0) / values.length;
        break;
      case AggregationStrategy.LAST:
        // Sort by month and take last
        const sortedRecords = [...monthlyRecords].sort((a, b) => a.month - b.month);
        aggregatedValue = sortedRecords[sortedRecords.length - 1].value;
        break;
      case AggregationStrategy.MAX:
        aggregatedValue = Math.max(...values);
        break;
      case AggregationStrategy.MIN:
        aggregatedValue = Math.min(...values);
        break;
      default:
        throw new Error(`Unknown aggregation strategy: ${strategy}`);
    }

    // Extrapolate partial years if requested (for SUM strategy only)
    const isComplete = monthsWithData === 12;
    if (!isComplete && extrapolatePartialYears && strategy === AggregationStrategy.SUM) {
      const scaleFactor = 12 / monthsWithData;
      aggregatedValue = aggregatedValue * scaleFactor;
      warnings.push(
        `Year ${year} extrapolated from ${monthsWithData} to 12 months ` +
          `(scale factor: ${scaleFactor.toFixed(2)})`,
      );
    }

    // Round to reasonable precision
    aggregatedValue = Math.round(aggregatedValue * 10000) / 10000;

    if (isComplete) {
      completeYears++;
    } else {
      partialYears++;
    }

    yearlyAggregates.push({
      year,
      value: aggregatedValue,
      monthsWithData,
      isComplete,
      missingMonths,
    });
  }

  return {
    data: yearlyAggregates,
    totalMonthsProcessed,
    completeYears,
    partialYears,
    excludedYears,
    warnings,
  };
}

/**
 * Group records by a key function and aggregate each group
 *
 * @param records - Array of records with monthly data
 * @param keyFn - Function to extract grouping key from record
 * @param valueFn - Function to extract monthly record from source record
 * @param options - Aggregation options
 * @returns Map of grouped yearly aggregates
 */
export function aggregateMonthlyToYearlyByGroup<T>(
  records: T[],
  keyFn: (record: T) => string,
  valueFn: (record: T) => MonthlyRecord,
  options: AggregationOptions = {},
): Map<string, AggregationResult> {
  // Group records by key
  const groups = new Map<string, MonthlyRecord[]>();

  for (const record of records) {
    const key = keyFn(record);
    const monthlyRecord = valueFn(record);

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(monthlyRecord);
  }

  // Aggregate each group
  const results = new Map<string, AggregationResult>();
  for (const [key, monthlyRecords] of groups) {
    results.set(key, aggregateMonthlyToYearly(monthlyRecords, options));
  }

  return results;
}

/**
 * Parse a time period string to year and month
 * Handles formats like "2024M01", "2024", "2024-01", etc.
 *
 * @param timePeriod - Time period string
 * @returns Object with year and optional month
 */
export function parseTimePeriod(timePeriod: string): { year: number; month?: number } {
  // Format: 2024M01 (French time series format)
  const monthlyMatch = timePeriod.match(/^(\d{4})M(\d{2})$/);
  if (monthlyMatch) {
    return {
      year: parseInt(monthlyMatch[1], 10),
      month: parseInt(monthlyMatch[2], 10),
    };
  }

  // Format: 2024-01 (ISO format)
  const isoMonthlyMatch = timePeriod.match(/^(\d{4})-(\d{2})$/);
  if (isoMonthlyMatch) {
    return {
      year: parseInt(isoMonthlyMatch[1], 10),
      month: parseInt(isoMonthlyMatch[2], 10),
    };
  }

  // Format: 2024 (yearly)
  const yearlyMatch = timePeriod.match(/^(\d{4})$/);
  if (yearlyMatch) {
    return {
      year: parseInt(yearlyMatch[1], 10),
    };
  }

  throw new Error(`Unable to parse time period: ${timePeriod}`);
}

/**
 * Check if a time period is monthly
 *
 * @param timePeriod - Time period string
 * @returns True if monthly, false if yearly
 */
export function isMonthlyPeriod(timePeriod: string): boolean {
  return /^\d{4}(M|-)\d{2}$/.test(timePeriod);
}

/**
 * Generate all months between two dates
 *
 * @param startYear - Start year
 * @param startMonth - Start month (1-12)
 * @param endYear - End year
 * @param endMonth - End month (1-12)
 * @returns Array of { year, month } objects
 */
export function generateMonthRange(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
): Array<{ year: number; month: number }> {
  const months: Array<{ year: number; month: number }> = [];

  let currentYear = startYear;
  let currentMonth = startMonth;

  while (
    currentYear < endYear ||
    (currentYear === endYear && currentMonth <= endMonth)
  ) {
    months.push({ year: currentYear, month: currentMonth });

    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }

  return months;
}

/**
 * Calculate data coverage statistics for a set of monthly records
 *
 * @param records - Array of monthly records
 * @param expectedStartYear - Expected start year
 * @param expectedEndYear - Expected end year
 * @returns Coverage statistics
 */
export function calculateDataCoverage(
  records: MonthlyRecord[],
  expectedStartYear: number,
  expectedEndYear: number,
): {
  totalExpectedMonths: number;
  totalActualMonths: number;
  coveragePercent: number;
  yearlyBreakdown: Map<number, { expected: number; actual: number; percent: number }>;
} {
  // Generate expected months
  const expectedMonths = generateMonthRange(
    expectedStartYear,
    1,
    expectedEndYear,
    12,
  );
  const totalExpectedMonths = expectedMonths.length;

  // Count actual months
  const actualMonthSet = new Set(records.map((r) => `${r.year}-${r.month}`));
  const totalActualMonths = actualMonthSet.size;

  // Calculate yearly breakdown
  const yearlyBreakdown = new Map<number, { expected: number; actual: number; percent: number }>();
  for (let year = expectedStartYear; year <= expectedEndYear; year++) {
    const yearRecords = records.filter((r) => r.year === year);
    const actualMonths = new Set(yearRecords.map((r) => r.month)).size;
    yearlyBreakdown.set(year, {
      expected: 12,
      actual: actualMonths,
      percent: Math.round((actualMonths / 12) * 100),
    });
  }

  return {
    totalExpectedMonths,
    totalActualMonths,
    coveragePercent: Math.round((totalActualMonths / totalExpectedMonths) * 100),
    yearlyBreakdown,
  };
}

/**
 * Log aggregation statistics
 */
export function logAggregationStats(result: AggregationResult, contextName?: string): void {
  const prefix = contextName ? `[${contextName}] ` : '';

  logger.info(`${prefix}Aggregation complete:`);
  logger.info(`  - Total months processed: ${result.totalMonthsProcessed}`);
  logger.info(`  - Complete years: ${result.completeYears}`);
  logger.info(`  - Partial years: ${result.partialYears}`);

  if (result.excludedYears.length > 0) {
    logger.warn(`  - Excluded years: ${result.excludedYears.join(', ')}`);
  }

  if (result.warnings.length > 0) {
    logger.warn(`  - Warnings: ${result.warnings.length}`);
    for (const warning of result.warnings) {
      logger.warn(`    • ${warning}`);
    }
  }
}
