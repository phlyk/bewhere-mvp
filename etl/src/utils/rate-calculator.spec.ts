/**
 * Rate calculator unit tests
 */

import {
  calculateMonthlyAverage,
  calculatePercentageChange,
  calculateRatePer100k,
  convertPer1kTo100k,
  sumMonthlyToYearly,
} from './rate-calculator';

describe('Rate Calculator', () => {
  describe('calculateRatePer100k', () => {
    it('should calculate correct rate per 100k', () => {
      // 1000 crimes per 1,000,000 population = 100 per 100k
      expect(calculateRatePer100k(1000, 1000000)).toBe(100);
    });

    it('should handle small populations', () => {
      // 10 crimes per 10,000 population = 100 per 100k
      expect(calculateRatePer100k(10, 10000)).toBe(100);
    });

    it('should return 4 decimal places', () => {
      const rate = calculateRatePer100k(333, 1000000);
      expect(rate).toBe(33.3);
    });

    it('should handle zero count', () => {
      expect(calculateRatePer100k(0, 1000000)).toBe(0);
    });

    it('should throw for zero population', () => {
      expect(() => calculateRatePer100k(100, 0)).toThrow('Population must be greater than 0');
    });

    it('should throw for negative population', () => {
      expect(() => calculateRatePer100k(100, -1000)).toThrow('Population must be greater than 0');
    });

    it('should throw for negative count', () => {
      expect(() => calculateRatePer100k(-100, 1000000)).toThrow('Count cannot be negative');
    });

    it('should handle real-world French département data', () => {
      // Approximate Paris (75) data: ~200k crimes, 2.1M population
      const rate = calculateRatePer100k(200000, 2100000);
      expect(rate).toBeCloseTo(9523.81, 1);
    });
  });

  describe('convertPer1kTo100k', () => {
    it('should convert rate per 1k to rate per 100k', () => {
      expect(convertPer1kTo100k(1)).toBe(100);
    });

    it('should handle decimal values', () => {
      expect(convertPer1kTo100k(0.5)).toBe(50);
    });

    it('should handle French data format (per 1000 habitants)', () => {
      // French data often uses per 1000 inhabitants
      expect(convertPer1kTo100k(5.25)).toBe(525);
    });
  });

  describe('calculatePercentageChange', () => {
    it('should calculate positive change', () => {
      expect(calculatePercentageChange(100, 120)).toBe(20);
    });

    it('should calculate negative change', () => {
      expect(calculatePercentageChange(100, 80)).toBe(-20);
    });

    it('should handle no change', () => {
      expect(calculatePercentageChange(100, 100)).toBe(0);
    });

    it('should handle from zero', () => {
      expect(calculatePercentageChange(0, 100)).toBe(100);
    });

    it('should handle both zero', () => {
      expect(calculatePercentageChange(0, 0)).toBe(0);
    });

    it('should return 2 decimal places', () => {
      const change = calculatePercentageChange(100, 133);
      expect(change).toBe(33);
    });
  });

  describe('sumMonthlyToYearly', () => {
    it('should sum 12 months', () => {
      const months = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210];
      expect(sumMonthlyToYearly(months)).toBe(1860);
    });

    it('should handle empty array', () => {
      expect(sumMonthlyToYearly([])).toBe(0);
    });

    it('should handle partial year', () => {
      const months = [100, 100, 100]; // Only 3 months
      expect(sumMonthlyToYearly(months)).toBe(300);
    });
  });

  describe('calculateMonthlyAverage', () => {
    it('should calculate average for full year', () => {
      expect(calculateMonthlyAverage(1200, 12)).toBe(100);
    });

    it('should handle partial year', () => {
      expect(calculateMonthlyAverage(600, 6)).toBe(100);
    });

    it('should return 2 decimal places', () => {
      const avg = calculateMonthlyAverage(1000, 12);
      expect(avg).toBe(83.33);
    });

    it('should throw for zero months', () => {
      expect(() => calculateMonthlyAverage(1000, 0)).toThrow(
        'Months available must be greater than 0',
      );
    });
  });
});
