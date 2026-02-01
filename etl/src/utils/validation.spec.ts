/**
 * Validation utility unit tests
 */

import {
    combineValidationResults,
    validateCrimeCount,
    validateDepartementCode,
    validateMonth,
    validateNumericRange,
    validateRatePer100k,
    validateRequiredFields,
    validateRowCount,
    validateYear,
} from './validation';

describe('Validation Utilities', () => {
  describe('validateRowCount', () => {
    it('should pass when count is within tolerance', () => {
      const result = validateRowCount(100, 100);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass when count is at lower tolerance', () => {
      const result = validateRowCount(90, 100, 0.1);
      expect(result.isValid).toBe(true);
    });

    it('should fail when count is below tolerance', () => {
      const result = validateRowCount(80, 100, 0.1);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should warn when count exceeds tolerance', () => {
      const result = validateRowCount(120, 100, 0.1);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('validateRequiredFields', () => {
    it('should pass when all fields present', () => {
      const row = { name: 'Test', value: 123 };
      const result = validateRequiredFields(row, ['name', 'value']);
      expect(result.isValid).toBe(true);
    });

    it('should fail when field is missing', () => {
      const row = { name: 'Test' };
      const result = validateRequiredFields(row as Record<string, unknown>, ['name', 'value']);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should fail when field is null', () => {
      const row = { name: 'Test', value: null };
      const result = validateRequiredFields(row, ['name', 'value']);
      expect(result.isValid).toBe(false);
    });

    it('should fail when field is empty string', () => {
      const row = { name: 'Test', value: '' };
      const result = validateRequiredFields(row, ['name', 'value']);
      expect(result.isValid).toBe(false);
    });

    it('should include row index in error message', () => {
      const row = { name: 'Test' };
      const result = validateRequiredFields(row as Record<string, unknown>, ['name', 'value'], 5);
      expect(result.errors[0]).toContain('Row 5');
    });
  });

  describe('validateNumericRange', () => {
    it('should pass when value is within range', () => {
      const result = validateNumericRange(50, 0, 100, 'testField');
      expect(result.isValid).toBe(true);
    });

    it('should pass at boundary values', () => {
      expect(validateNumericRange(0, 0, 100, 'test').isValid).toBe(true);
      expect(validateNumericRange(100, 0, 100, 'test').isValid).toBe(true);
    });

    it('should fail when value is below minimum', () => {
      const result = validateNumericRange(-1, 0, 100, 'testField');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('below minimum');
    });

    it('should fail when value exceeds maximum', () => {
      const result = validateNumericRange(101, 0, 100, 'testField');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('exceeds maximum');
    });

    it('should fail when value is NaN', () => {
      const result = validateNumericRange(NaN, 0, 100, 'testField');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('not a valid number');
    });
  });

  describe('validateYear', () => {
    it('should pass for current year', () => {
      const currentYear = new Date().getFullYear();
      const result = validateYear(currentYear);
      expect(result.isValid).toBe(true);
    });

    it('should pass for historical years', () => {
      expect(validateYear(2020).isValid).toBe(true);
      expect(validateYear(1990).isValid).toBe(true);
      expect(validateYear(1950).isValid).toBe(true);
    });

    it('should pass for next year', () => {
      const nextYear = new Date().getFullYear() + 1;
      expect(validateYear(nextYear).isValid).toBe(true);
    });

    it('should fail for ancient years', () => {
      expect(validateYear(1900).isValid).toBe(false);
    });

    it('should fail for far future years', () => {
      const farFuture = new Date().getFullYear() + 10;
      expect(validateYear(farFuture).isValid).toBe(false);
    });
  });

  describe('validateMonth', () => {
    it('should pass for valid months 1-12', () => {
      for (let month = 1; month <= 12; month++) {
        expect(validateMonth(month).isValid).toBe(true);
      }
    });

    it('should fail for month 0', () => {
      expect(validateMonth(0).isValid).toBe(false);
    });

    it('should fail for month 13', () => {
      expect(validateMonth(13).isValid).toBe(false);
    });
  });

  describe('validateDepartementCode', () => {
    it('should pass for metropolitan département codes 01-95', () => {
      expect(validateDepartementCode('01').isValid).toBe(true);
      expect(validateDepartementCode('75').isValid).toBe(true);
      expect(validateDepartementCode('95').isValid).toBe(true);
    });

    it('should pass for Corsica codes 2A and 2B', () => {
      expect(validateDepartementCode('2A').isValid).toBe(true);
      expect(validateDepartementCode('2B').isValid).toBe(true);
    });

    it('should pass for overseas département codes 971-976', () => {
      expect(validateDepartementCode('971').isValid).toBe(true);
      expect(validateDepartementCode('972').isValid).toBe(true);
      expect(validateDepartementCode('974').isValid).toBe(true);
      expect(validateDepartementCode('976').isValid).toBe(true);
    });

    it('should fail for invalid codes', () => {
      expect(validateDepartementCode('00').isValid).toBe(false);
      expect(validateDepartementCode('96').isValid).toBe(false);
      expect(validateDepartementCode('977').isValid).toBe(false);
      expect(validateDepartementCode('ABC').isValid).toBe(false);
      expect(validateDepartementCode('2C').isValid).toBe(false);
    });
  });

  describe('validateCrimeCount', () => {
    it('should pass for positive counts', () => {
      expect(validateCrimeCount(0).isValid).toBe(true);
      expect(validateCrimeCount(1000).isValid).toBe(true);
    });

    it('should fail for negative counts', () => {
      const result = validateCrimeCount(-1);
      expect(result.isValid).toBe(false);
    });

    it('should warn for suspiciously high counts', () => {
      const result = validateCrimeCount(20000000);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('validateRatePer100k', () => {
    it('should pass for normal rates', () => {
      expect(validateRatePer100k(0).isValid).toBe(true);
      expect(validateRatePer100k(500).isValid).toBe(true);
    });

    it('should fail for negative rates', () => {
      expect(validateRatePer100k(-1).isValid).toBe(false);
    });

    it('should warn for very high rates', () => {
      const result = validateRatePer100k(15000);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('combineValidationResults', () => {
    it('should combine multiple results', () => {
      const results = [
        { isValid: true, errors: [], warnings: ['warn1'] },
        { isValid: false, errors: ['error1'], warnings: [] },
        { isValid: true, errors: [], warnings: ['warn2'] },
      ];

      const combined = combineValidationResults(results);

      expect(combined.isValid).toBe(false);
      expect(combined.errors).toEqual(['error1']);
      expect(combined.warnings).toEqual(['warn1', 'warn2']);
    });

    it('should be valid when all are valid', () => {
      const results = [
        { isValid: true, errors: [], warnings: [] },
        { isValid: true, errors: [], warnings: [] },
      ];

      const combined = combineValidationResults(results);
      expect(combined.isValid).toBe(true);
    });
  });
});
