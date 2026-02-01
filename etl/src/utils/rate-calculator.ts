/**
 * Rate calculation utilities
 *
 * Provides functions for calculating crime rates per 100,000 population.
 */

/**
 * Calculate rate per 100,000 population
 *
 * @param count - Raw crime count
 * @param population - Population for the area/period
 * @returns Rate per 100,000 population (4 decimal places)
 */
export function calculateRatePer100k(count: number, population: number): number {
  if (population <= 0) {
    throw new Error('Population must be greater than 0');
  }
  if (count < 0) {
    throw new Error('Count cannot be negative');
  }

  const rate = (count / population) * 100000;
  return Math.round(rate * 10000) / 10000; // 4 decimal places
}

/**
 * Convert rate per 1,000 to rate per 100,000
 *
 * Some data sources provide rates per 1,000 (e.g., French data)
 *
 * @param ratePer1k - Rate per 1,000 population
 * @returns Rate per 100,000 population
 */
export function convertPer1kTo100k(ratePer1k: number): number {
  return Math.round(ratePer1k * 100 * 10000) / 10000;
}

/**
 * Calculate percentage change between two values
 *
 * @param oldValue - Previous value
 * @param newValue - Current value
 * @returns Percentage change (positive = increase, negative = decrease)
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) {
    return newValue === 0 ? 0 : 100; // Treat as 100% increase from 0
  }
  const change = ((newValue - oldValue) / oldValue) * 100;
  return Math.round(change * 100) / 100; // 2 decimal places
}

/**
 * Sum monthly counts to yearly total
 *
 * @param monthlyCounts - Array of monthly counts (12 months)
 * @returns Yearly total
 */
export function sumMonthlyToYearly(monthlyCounts: number[]): number {
  if (monthlyCounts.length === 0) {
    return 0;
  }
  return monthlyCounts.reduce((sum, count) => sum + count, 0);
}

/**
 * Calculate average monthly rate from yearly total
 *
 * @param yearlyTotal - Total for the year
 * @param monthsAvailable - Number of months with data (default 12)
 * @returns Average monthly count
 */
export function calculateMonthlyAverage(
  yearlyTotal: number,
  monthsAvailable = 12,
): number {
  if (monthsAvailable <= 0) {
    throw new Error('Months available must be greater than 0');
  }
  return Math.round((yearlyTotal / monthsAvailable) * 100) / 100;
}
