/**
 * Data validation utilities
 *
 * Provides functions for validating ETL data integrity.
 */

import { logger } from './logger';

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate row count is within expected range
 */
export function validateRowCount(
  actual: number,
  expected: number,
  tolerance = 0.1,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const lowerBound = expected * (1 - tolerance);
  const upperBound = expected * (1 + tolerance);

  if (actual < lowerBound) {
    errors.push(
      `Row count ${actual} is below expected minimum ${Math.round(lowerBound)} (expected ~${expected})`,
    );
  } else if (actual > upperBound) {
    warnings.push(
      `Row count ${actual} exceeds expected maximum ${Math.round(upperBound)} (expected ~${expected})`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate required fields are present
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  row: T,
  requiredFields: (keyof T)[],
  rowIndex?: number,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const prefix = rowIndex !== undefined ? `Row ${rowIndex}: ` : '';

  for (const field of requiredFields) {
    const value = row[field];
    if (value === undefined || value === null || value === '') {
      errors.push(`${prefix}Missing required field: ${String(field)}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate numeric value is within range
 */
export function validateNumericRange(
  value: number,
  min: number,
  max: number,
  fieldName: string,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isNaN(value)) {
    errors.push(`${fieldName} is not a valid number`);
  } else if (value < min) {
    errors.push(`${fieldName} (${value}) is below minimum (${min})`);
  } else if (value > max) {
    errors.push(`${fieldName} (${value}) exceeds maximum (${max})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate year is reasonable (1950-current+1)
 */
export function validateYear(year: number): ValidationResult {
  const currentYear = new Date().getFullYear();
  return validateNumericRange(year, 1950, currentYear + 1, 'Year');
}

/**
 * Validate month is 1-12
 */
export function validateMonth(month: number): ValidationResult {
  return validateNumericRange(month, 1, 12, 'Month');
}

/**
 * Validate French département code (01-95, 2A, 2B, 971-976)
 */
export function validateDepartementCode(code: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Valid patterns: 01-95, 2A, 2B, 971-976
  const validPattern = /^(0[1-9]|[1-8][0-9]|9[0-5]|2[AB]|97[1-6])$/;

  if (!validPattern.test(code)) {
    errors.push(`Invalid département code: ${code}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate crime count is non-negative
 */
export function validateCrimeCount(count: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (count < 0) {
    errors.push(`Crime count cannot be negative: ${count}`);
  }

  // Warn about suspiciously high counts
  if (count > 10000000) {
    warnings.push(`Unusually high crime count: ${count}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate rate per 100k is reasonable
 */
export function validateRatePer100k(rate: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (rate < 0) {
    errors.push(`Rate cannot be negative: ${rate}`);
  }

  // Warn about suspiciously high rates (>10% of population)
  if (rate > 10000) {
    warnings.push(`Unusually high rate per 100k: ${rate}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Combine multiple validation results
 */
export function combineValidationResults(
  results: ValidationResult[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const result of results) {
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Log validation results
 */
export function logValidationResult(
  context: string,
  result: ValidationResult,
): void {
  if (result.isValid && result.warnings.length === 0) {
    logger.debug(`[${context}] Validation passed`);
    return;
  }

  for (const error of result.errors) {
    logger.error(`[${context}] ${error}`);
  }

  for (const warning of result.warnings) {
    logger.warn(`[${context}] ${warning}`);
  }
}
