/**
 * Unit tests for monthly-to-yearly aggregation utility
 */

import {
    aggregateMonthlyToYearly,
    aggregateMonthlyToYearlyByGroup,
    AggregationStrategy,
    calculateDataCoverage,
    generateMonthRange,
    isMonthlyPeriod,
    MonthlyRecord,
    parseTimePeriod,
} from './aggregation';

describe('aggregateMonthlyToYearly', () => {
  describe('basic aggregation', () => {
    it('should aggregate 12 months of data to yearly total', () => {
      const records: MonthlyRecord[] = [];
      for (let month = 1; month <= 12; month++) {
        records.push({ year: 2024, month, value: 100 });
      }

      const result = aggregateMonthlyToYearly(records);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        year: 2024,
        value: 1200,
        monthsWithData: 12,
        isComplete: true,
        missingMonths: [],
      });
      expect(result.completeYears).toBe(1);
      expect(result.partialYears).toBe(0);
    });

    it('should handle partial year data', () => {
      const records: MonthlyRecord[] = [
        { year: 2024, month: 1, value: 100 },
        { year: 2024, month: 2, value: 200 },
        { year: 2024, month: 3, value: 300 },
      ];

      const result = aggregateMonthlyToYearly(records);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        year: 2024,
        value: 600,
        monthsWithData: 3,
        isComplete: false,
        missingMonths: [4, 5, 6, 7, 8, 9, 10, 11, 12],
      });
      expect(result.completeYears).toBe(0);
      expect(result.partialYears).toBe(1);
    });

    it('should aggregate multiple years', () => {
      const records: MonthlyRecord[] = [];
      for (let year = 2022; year <= 2024; year++) {
        for (let month = 1; month <= 12; month++) {
          records.push({ year, month, value: year - 2020 }); // 2, 3, 4
        }
      }

      const result = aggregateMonthlyToYearly(records);

      expect(result.data).toHaveLength(3);
      expect(result.data[0]).toEqual({
        year: 2022,
        value: 24, // 2 * 12
        monthsWithData: 12,
        isComplete: true,
        missingMonths: [],
      });
      expect(result.data[1].value).toBe(36); // 3 * 12
      expect(result.data[2].value).toBe(48); // 4 * 12
      expect(result.completeYears).toBe(3);
    });

    it('should handle empty input', () => {
      const result = aggregateMonthlyToYearly([]);

      expect(result.data).toHaveLength(0);
      expect(result.totalMonthsProcessed).toBe(0);
      expect(result.completeYears).toBe(0);
      expect(result.partialYears).toBe(0);
    });
  });

  describe('aggregation strategies', () => {
    const records: MonthlyRecord[] = [
      { year: 2024, month: 1, value: 10 },
      { year: 2024, month: 2, value: 20 },
      { year: 2024, month: 3, value: 30 },
      { year: 2024, month: 4, value: 40 },
    ];

    it('should sum values with SUM strategy', () => {
      const result = aggregateMonthlyToYearly(records, {
        strategy: AggregationStrategy.SUM,
      });

      expect(result.data[0].value).toBe(100); // 10 + 20 + 30 + 40
    });

    it('should average values with AVERAGE strategy', () => {
      const result = aggregateMonthlyToYearly(records, {
        strategy: AggregationStrategy.AVERAGE,
      });

      expect(result.data[0].value).toBe(25); // (10 + 20 + 30 + 40) / 4
    });

    it('should take last value with LAST strategy', () => {
      const result = aggregateMonthlyToYearly(records, {
        strategy: AggregationStrategy.LAST,
      });

      expect(result.data[0].value).toBe(40);
    });

    it('should take maximum with MAX strategy', () => {
      const result = aggregateMonthlyToYearly(records, {
        strategy: AggregationStrategy.MAX,
      });

      expect(result.data[0].value).toBe(40);
    });

    it('should take minimum with MIN strategy', () => {
      const result = aggregateMonthlyToYearly(records, {
        strategy: AggregationStrategy.MIN,
      });

      expect(result.data[0].value).toBe(10);
    });
  });

  describe('minMonthsRequired option', () => {
    it('should exclude years with insufficient data', () => {
      const records: MonthlyRecord[] = [
        { year: 2023, month: 1, value: 100 },
        { year: 2023, month: 2, value: 100 },
        // 2024 has full year
        ...Array.from({ length: 12 }, (_, i) => ({
          year: 2024,
          month: i + 1,
          value: 100,
        })),
      ];

      const result = aggregateMonthlyToYearly(records, {
        minMonthsRequired: 6,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].year).toBe(2024);
      expect(result.excludedYears).toContain(2023);
      expect(result.warnings.some((w) => w.includes('Year 2023'))).toBe(true);
    });

    it('should include years meeting minimum requirement', () => {
      const records: MonthlyRecord[] = Array.from({ length: 6 }, (_, i) => ({
        year: 2024,
        month: i + 1,
        value: 100,
      }));

      const result = aggregateMonthlyToYearly(records, {
        minMonthsRequired: 6,
      });

      expect(result.data).toHaveLength(1);
      expect(result.excludedYears).toHaveLength(0);
    });
  });

  describe('extrapolatePartialYears option', () => {
    it('should extrapolate partial year to full year', () => {
      const records: MonthlyRecord[] = Array.from({ length: 6 }, (_, i) => ({
        year: 2024,
        month: i + 1,
        value: 100,
      }));

      const result = aggregateMonthlyToYearly(records, {
        strategy: AggregationStrategy.SUM,
        extrapolatePartialYears: true,
      });

      expect(result.data[0].value).toBe(1200); // 600 * 2
      expect(result.warnings.some((w) => w.includes('extrapolated'))).toBe(true);
    });

    it('should not extrapolate complete years', () => {
      const records: MonthlyRecord[] = Array.from({ length: 12 }, (_, i) => ({
        year: 2024,
        month: i + 1,
        value: 100,
      }));

      const result = aggregateMonthlyToYearly(records, {
        strategy: AggregationStrategy.SUM,
        extrapolatePartialYears: true,
      });

      expect(result.data[0].value).toBe(1200);
      expect(result.warnings.filter((w) => w.includes('extrapolated'))).toHaveLength(0);
    });

    it('should not extrapolate for non-SUM strategies', () => {
      const records: MonthlyRecord[] = Array.from({ length: 6 }, (_, i) => ({
        year: 2024,
        month: i + 1,
        value: 100,
      }));

      const result = aggregateMonthlyToYearly(records, {
        strategy: AggregationStrategy.AVERAGE,
        extrapolatePartialYears: true,
      });

      expect(result.data[0].value).toBe(100); // Average, not extrapolated
    });
  });

  describe('filter option', () => {
    it('should filter records before aggregation', () => {
      const records: MonthlyRecord[] = [
        { year: 2024, month: 1, value: 100 },
        { year: 2024, month: 2, value: -50 }, // Negative value
        { year: 2024, month: 3, value: 200 },
      ];

      const result = aggregateMonthlyToYearly(records, {
        filter: (r) => r.value >= 0,
      });

      expect(result.data[0].value).toBe(300); // 100 + 200
      expect(result.data[0].monthsWithData).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle duplicate months by using last value', () => {
      const records: MonthlyRecord[] = [
        { year: 2024, month: 1, value: 100 },
        { year: 2024, month: 1, value: 150 }, // Duplicate
        { year: 2024, month: 2, value: 200 },
      ];

      const result = aggregateMonthlyToYearly(records);

      expect(result.data[0].value).toBe(350); // 150 + 200
      expect(result.data[0].monthsWithData).toBe(2);
      expect(result.warnings.some((w) => w.includes('Duplicate'))).toBe(true);
    });

    it('should warn for invalid month values', () => {
      const records: MonthlyRecord[] = [
        { year: 2024, month: 1, value: 100 },
        { year: 2024, month: 13, value: 200 }, // Invalid
        { year: 2024, month: 0, value: 300 }, // Invalid
      ];

      const result = aggregateMonthlyToYearly(records);

      expect(result.data[0].value).toBe(100);
      expect(result.warnings.filter((w) => w.includes('Invalid month'))).toHaveLength(2);
    });

    it('should handle decimal values', () => {
      const records: MonthlyRecord[] = [
        { year: 2024, month: 1, value: 0.1 },
        { year: 2024, month: 2, value: 0.2 },
        { year: 2024, month: 3, value: 0.3 },
      ];

      const result = aggregateMonthlyToYearly(records);

      expect(result.data[0].value).toBe(0.6);
    });

    it('should handle zero values', () => {
      const records: MonthlyRecord[] = [
        { year: 2024, month: 1, value: 0 },
        { year: 2024, month: 2, value: 0 },
        { year: 2024, month: 3, value: 100 },
      ];

      const result = aggregateMonthlyToYearly(records);

      expect(result.data[0].value).toBe(100);
      expect(result.data[0].monthsWithData).toBe(3);
    });
  });
});

describe('aggregateMonthlyToYearlyByGroup', () => {
  interface CrimeRecord {
    areaCode: string;
    category: string;
    year: number;
    month: number;
    count: number;
  }

  it('should aggregate by group key', () => {
    const records: CrimeRecord[] = [
      { areaCode: '75', category: 'THEFT', year: 2024, month: 1, count: 100 },
      { areaCode: '75', category: 'THEFT', year: 2024, month: 2, count: 150 },
      { areaCode: '13', category: 'THEFT', year: 2024, month: 1, count: 50 },
      { areaCode: '13', category: 'THEFT', year: 2024, month: 2, count: 75 },
    ];

    const results = aggregateMonthlyToYearlyByGroup(
      records,
      (r) => `${r.areaCode}-${r.category}`,
      (r) => ({ year: r.year, month: r.month, value: r.count }),
    );

    expect(results.size).toBe(2);
    expect(results.get('75-THEFT')?.data[0].value).toBe(250);
    expect(results.get('13-THEFT')?.data[0].value).toBe(125);
  });

  it('should pass options to underlying aggregation', () => {
    const records: CrimeRecord[] = [
      { areaCode: '75', category: 'THEFT', year: 2024, month: 1, count: 100 },
      { areaCode: '75', category: 'THEFT', year: 2024, month: 2, count: 200 },
    ];

    const results = aggregateMonthlyToYearlyByGroup(
      records,
      (r) => r.areaCode,
      (r) => ({ year: r.year, month: r.month, value: r.count }),
      { strategy: AggregationStrategy.AVERAGE },
    );

    expect(results.get('75')?.data[0].value).toBe(150);
  });
});

describe('parseTimePeriod', () => {
  it('should parse French monthly format (2024M01)', () => {
    expect(parseTimePeriod('2024M01')).toEqual({ year: 2024, month: 1 });
    expect(parseTimePeriod('2023M12')).toEqual({ year: 2023, month: 12 });
    expect(parseTimePeriod('2016M06')).toEqual({ year: 2016, month: 6 });
  });

  it('should parse ISO monthly format (2024-01)', () => {
    expect(parseTimePeriod('2024-01')).toEqual({ year: 2024, month: 1 });
    expect(parseTimePeriod('2023-12')).toEqual({ year: 2023, month: 12 });
  });

  it('should parse yearly format (2024)', () => {
    expect(parseTimePeriod('2024')).toEqual({ year: 2024 });
    expect(parseTimePeriod('2016')).toEqual({ year: 2016 });
  });

  it('should throw for invalid formats', () => {
    expect(() => parseTimePeriod('invalid')).toThrow();
    expect(() => parseTimePeriod('2024/01')).toThrow();
    expect(() => parseTimePeriod('24M01')).toThrow();
    expect(() => parseTimePeriod('')).toThrow();
  });
});

describe('isMonthlyPeriod', () => {
  it('should return true for monthly periods', () => {
    expect(isMonthlyPeriod('2024M01')).toBe(true);
    expect(isMonthlyPeriod('2024-01')).toBe(true);
    expect(isMonthlyPeriod('2023M12')).toBe(true);
  });

  it('should return false for yearly periods', () => {
    expect(isMonthlyPeriod('2024')).toBe(false);
    expect(isMonthlyPeriod('2023')).toBe(false);
  });
});

describe('generateMonthRange', () => {
  it('should generate months within same year', () => {
    const months = generateMonthRange(2024, 3, 2024, 6);

    expect(months).toHaveLength(4);
    expect(months[0]).toEqual({ year: 2024, month: 3 });
    expect(months[3]).toEqual({ year: 2024, month: 6 });
  });

  it('should generate months across years', () => {
    const months = generateMonthRange(2023, 11, 2024, 2);

    expect(months).toHaveLength(4);
    expect(months[0]).toEqual({ year: 2023, month: 11 });
    expect(months[1]).toEqual({ year: 2023, month: 12 });
    expect(months[2]).toEqual({ year: 2024, month: 1 });
    expect(months[3]).toEqual({ year: 2024, month: 2 });
  });

  it('should generate full year', () => {
    const months = generateMonthRange(2024, 1, 2024, 12);

    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({ year: 2024, month: 1 });
    expect(months[11]).toEqual({ year: 2024, month: 12 });
  });

  it('should generate multiple years', () => {
    const months = generateMonthRange(2022, 1, 2024, 12);

    expect(months).toHaveLength(36); // 3 years * 12 months
  });

  it('should handle single month', () => {
    const months = generateMonthRange(2024, 6, 2024, 6);

    expect(months).toHaveLength(1);
    expect(months[0]).toEqual({ year: 2024, month: 6 });
  });
});

describe('calculateDataCoverage', () => {
  it('should calculate full coverage', () => {
    const records: MonthlyRecord[] = [];
    for (let year = 2022; year <= 2024; year++) {
      for (let month = 1; month <= 12; month++) {
        records.push({ year, month, value: 100 });
      }
    }

    const coverage = calculateDataCoverage(records, 2022, 2024);

    expect(coverage.totalExpectedMonths).toBe(36);
    expect(coverage.totalActualMonths).toBe(36);
    expect(coverage.coveragePercent).toBe(100);

    const yearBreakdown = coverage.yearlyBreakdown.get(2024);
    expect(yearBreakdown?.expected).toBe(12);
    expect(yearBreakdown?.actual).toBe(12);
    expect(yearBreakdown?.percent).toBe(100);
  });

  it('should calculate partial coverage', () => {
    const records: MonthlyRecord[] = [
      { year: 2024, month: 1, value: 100 },
      { year: 2024, month: 2, value: 100 },
      { year: 2024, month: 3, value: 100 },
    ];

    const coverage = calculateDataCoverage(records, 2024, 2024);

    expect(coverage.totalExpectedMonths).toBe(12);
    expect(coverage.totalActualMonths).toBe(3);
    expect(coverage.coveragePercent).toBe(25);

    const yearBreakdown = coverage.yearlyBreakdown.get(2024);
    expect(yearBreakdown?.actual).toBe(3);
    expect(yearBreakdown?.percent).toBe(25);
  });

  it('should handle missing years', () => {
    const records: MonthlyRecord[] = [];
    for (let month = 1; month <= 12; month++) {
      records.push({ year: 2024, month, value: 100 });
    }

    const coverage = calculateDataCoverage(records, 2022, 2024);

    expect(coverage.yearlyBreakdown.get(2022)?.actual).toBe(0);
    expect(coverage.yearlyBreakdown.get(2023)?.actual).toBe(0);
    expect(coverage.yearlyBreakdown.get(2024)?.actual).toBe(12);
  });

  it('should handle duplicate months correctly', () => {
    const records: MonthlyRecord[] = [
      { year: 2024, month: 1, value: 100 },
      { year: 2024, month: 1, value: 200 }, // Duplicate
      { year: 2024, month: 2, value: 100 },
    ];

    const coverage = calculateDataCoverage(records, 2024, 2024);

    // Duplicates should count as 1 month
    expect(coverage.totalActualMonths).toBe(2);
  });
});
