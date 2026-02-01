/**
 * Tests for France Monthly Crime Data Aggregator
 *
 * @see france-monthly.aggregator.ts
 */

import {
    aggregateSingleMonth,
    aggregateToYearly,
    filterAggregatedData,
    getCategorySummary,
    getDepartementSummary,
    getYearSummary,
    MonthlyExtractedData,
    YearlyCrimeAggregate
} from './france-monthly.aggregator';
import { CanonicalCategoryCode, Etat4001CategoryMapper } from './france-monthly.category-mapper';
import { Etat4001ParsedRow } from './france-monthly.types';

/**
 * Create a mock parsed row for testing
 */
function createMockRow(
  index: number,
  categoryName: string,
  departementCounts: Record<string, number>,
): Etat4001ParsedRow {
  const metropoleTotal = Object.values(departementCounts).reduce((sum, v) => sum + v, 0);
  return {
    index,
    categoryName,
    metropoleTotal,
    departementCounts,
  };
}

/**
 * Create mock monthly data for testing
 */
function createMockMonthlyData(
  year: number,
  month: number,
  rows: Etat4001ParsedRow[],
  source = `test-${year}-${month.toString().padStart(2, '0')}.csv`,
): MonthlyExtractedData {
  return { rows, year, month, source };
}

describe('france-monthly.aggregator', () => {
  describe('aggregateToYearly', () => {
    it('should aggregate a single month with single category and département', () => {
      const rows = [
        // Index 1 = HOMICIDE
        createMockRow(1, 'Règlements de compte entre malfaiteurs', { '75': 10 }),
      ];
      const monthlyData = [createMockMonthlyData(2020, 6, rows)];

      const result = aggregateToYearly(monthlyData);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        departementCode: '75',
        canonicalCategory: 'HOMICIDE',
        year: 2020,
        count: 10,
        monthsWithData: 1,
        isComplete: false,
        missingMonths: [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12],
      });
    });

    it('should aggregate multiple months for the same year', () => {
      const juneRows = [createMockRow(1, 'Homicide', { '75': 10 })];
      const julyRows = [createMockRow(1, 'Homicide', { '75': 15 })];
      const monthlyData = [
        createMockMonthlyData(2020, 6, juneRows),
        createMockMonthlyData(2020, 7, julyRows),
      ];

      const result = aggregateToYearly(monthlyData);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        departementCode: '75',
        canonicalCategory: 'HOMICIDE',
        year: 2020,
        count: 25, // 10 + 15
        monthsWithData: 2,
        isComplete: false,
        missingMonths: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12],
      });
    });

    it('should mark complete years correctly', () => {
      const rows = [createMockRow(1, 'Homicide', { '75': 10 })];
      const monthlyData = [];
      for (let month = 1; month <= 12; month++) {
        monthlyData.push(createMockMonthlyData(2020, month, rows));
      }

      const result = aggregateToYearly(monthlyData);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        year: 2020,
        count: 120, // 10 * 12
        monthsWithData: 12,
        isComplete: true,
        missingMonths: [],
      });
      expect(result.statistics.completeYears).toContain(2020);
    });

    it('should aggregate multiple départements separately', () => {
      const rows = [
        createMockRow(1, 'Homicide', { '75': 10, '13': 20, '69': 15 }),
      ];
      const monthlyData = [createMockMonthlyData(2020, 6, rows)];

      const result = aggregateToYearly(monthlyData);

      expect(result.data).toHaveLength(3);
      expect(result.data.find((d) => d.departementCode === '75')?.count).toBe(10);
      expect(result.data.find((d) => d.departementCode === '13')?.count).toBe(20);
      expect(result.data.find((d) => d.departementCode === '69')?.count).toBe(15);
    });

    it('should aggregate multiple categories separately', () => {
      const rows = [
        // Index 1 = HOMICIDE
        createMockRow(1, 'Homicide', { '75': 10 }),
        // Index 7 = ASSAULT
        createMockRow(7, 'Assault', { '75': 50 }),
        // Index 46 = SEXUAL_VIOLENCE
        createMockRow(46, 'Viols', { '75': 25 }),
      ];
      const monthlyData = [createMockMonthlyData(2020, 6, rows)];

      const result = aggregateToYearly(monthlyData);

      expect(result.data).toHaveLength(3);
      expect(result.data.find((d) => d.canonicalCategory === 'HOMICIDE')?.count).toBe(10);
      expect(result.data.find((d) => d.canonicalCategory === 'ASSAULT')?.count).toBe(50);
      expect(result.data.find((d) => d.canonicalCategory === 'SEXUAL_VIOLENCE')?.count).toBe(25);
    });

    it('should combine multiple État 4001 indices into same canonical category', () => {
      const rows = [
        // Indices 1, 2, 3, 51 all map to HOMICIDE
        createMockRow(1, 'Règlements de compte', { '75': 5 }),
        createMockRow(2, 'Homicides pour voler', { '75': 3 }),
        createMockRow(3, 'Homicides autres motifs', { '75': 7 }),
        createMockRow(51, 'Homicides contre enfants', { '75': 2 }),
      ];
      const monthlyData = [createMockMonthlyData(2020, 6, rows)];

      const result = aggregateToYearly(monthlyData);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        canonicalCategory: 'HOMICIDE',
        count: 17, // 5 + 3 + 7 + 2
        sourceIndices: [1, 2, 3, 51],
      });
    });

    it('should aggregate multiple years separately', () => {
      const rows = [createMockRow(1, 'Homicide', { '75': 10 })];
      const monthlyData = [
        createMockMonthlyData(2019, 6, rows),
        createMockMonthlyData(2020, 6, rows),
        createMockMonthlyData(2021, 6, rows),
      ];

      const result = aggregateToYearly(monthlyData);

      expect(result.data).toHaveLength(3);
      expect(result.data.filter((d) => d.year === 2019)).toHaveLength(1);
      expect(result.data.filter((d) => d.year === 2020)).toHaveLength(1);
      expect(result.data.filter((d) => d.year === 2021)).toHaveLength(1);
      expect(result.statistics.uniqueYears).toEqual([2019, 2020, 2021]);
    });

    it('should skip unused indices (96, 97, 99, 100)', () => {
      const rows = [
        createMockRow(1, 'Homicide', { '75': 10 }),
        createMockRow(96, 'Unused', { '75': 999 }),
        createMockRow(97, 'Unused', { '75': 999 }),
        createMockRow(99, 'Unused', { '75': 999 }),
        createMockRow(100, 'Unused', { '75': 999 }),
      ];
      const monthlyData = [createMockMonthlyData(2020, 6, rows)];

      const result = aggregateToYearly(monthlyData);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].count).toBe(10);
      expect(result.statistics.rowsSkipped).toBe(4);
    });

    it('should skip zero and negative counts', () => {
      const rows = [
        createMockRow(1, 'Homicide', { '75': 10, '13': 0, '69': -5 }),
      ];
      const monthlyData = [createMockMonthlyData(2020, 6, rows)];

      const result = aggregateToYearly(monthlyData);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].departementCode).toBe('75');
    });

    it('should generate warning for invalid months', () => {
      const rows = [createMockRow(1, 'Homicide', { '75': 10 })];
      const monthlyData = [createMockMonthlyData(2020, 13, rows)];

      const result = aggregateToYearly(monthlyData);

      expect(result.data).toHaveLength(0);
      expect(result.warnings.some((w) => w.includes('Invalid month 13'))).toBe(true);
    });

    it('should respect minMonthsRequired option', () => {
      const rows = [createMockRow(1, 'Homicide', { '75': 10 })];
      const monthlyData = [
        createMockMonthlyData(2020, 6, rows),
        createMockMonthlyData(2020, 7, rows),
      ];

      const result = aggregateToYearly(monthlyData, { minMonthsRequired: 6 });

      expect(result.data).toHaveLength(0);
      expect(result.warnings.some((w) => w.includes('minimum 6 required'))).toBe(true);
    });

    it('should extrapolate partial years when option is enabled', () => {
      const rows = [createMockRow(1, 'Homicide', { '75': 100 })];
      const monthlyData = [
        createMockMonthlyData(2020, 1, rows),
        createMockMonthlyData(2020, 2, rows),
        createMockMonthlyData(2020, 3, rows),
        createMockMonthlyData(2020, 4, rows),
        createMockMonthlyData(2020, 5, rows),
        createMockMonthlyData(2020, 6, rows),
      ];

      const result = aggregateToYearly(monthlyData, { extrapolatePartialYears: true });

      expect(result.data).toHaveLength(1);
      // 600 raw count * (12/6) = 1200 extrapolated
      expect(result.data[0].count).toBe(1200);
      expect(result.warnings.some((w) => w.includes('Extrapolated'))).toBe(true);
    });

    it('should not extrapolate complete years', () => {
      const rows = [createMockRow(1, 'Homicide', { '75': 100 })];
      const monthlyData = [];
      for (let month = 1; month <= 12; month++) {
        monthlyData.push(createMockMonthlyData(2020, month, rows));
      }

      const result = aggregateToYearly(monthlyData, { extrapolatePartialYears: true });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].count).toBe(1200); // No extrapolation needed
    });

    it('should sort output by year, département, category', () => {
      const rows = [
        createMockRow(1, 'Homicide', { '75': 10, '13': 20 }),
        createMockRow(7, 'Assault', { '75': 30, '13': 40 }),
      ];
      const monthlyData = [
        createMockMonthlyData(2021, 6, rows),
        createMockMonthlyData(2020, 6, rows),
      ];

      const result = aggregateToYearly(monthlyData);

      // Should be sorted: 2020 first, then by département, then by category
      expect(result.data[0]).toMatchObject({ year: 2020, departementCode: '13' });
      expect(result.data[1]).toMatchObject({ year: 2020, departementCode: '13' });
      expect(result.data[result.data.length - 1]).toMatchObject({ year: 2021, departementCode: '75' });
    });

    it('should track statistics correctly', () => {
      const rows = [
        createMockRow(1, 'Homicide', { '75': 10, '13': 20 }),
        createMockRow(7, 'Assault', { '75': 30 }),
      ];
      const monthlyData = [];
      // Complete year 2020
      for (let month = 1; month <= 12; month++) {
        monthlyData.push(createMockMonthlyData(2020, month, rows));
      }
      // Partial year 2021 (only 6 months)
      for (let month = 1; month <= 6; month++) {
        monthlyData.push(createMockMonthlyData(2021, month, rows));
      }

      const result = aggregateToYearly(monthlyData);

      expect(result.statistics.monthlyFilesProcessed).toBe(18);
      expect(result.statistics.uniqueYears).toEqual([2020, 2021]);
      expect(result.statistics.uniqueDepartements).toBe(2);
      expect(result.statistics.uniqueCategories).toBe(2);
      expect(result.statistics.completeYears).toEqual([2020]);
      expect(result.statistics.partialYears).toEqual([
        { year: 2021, monthsPresent: [1, 2, 3, 4, 5, 6] },
      ]);
    });

    it('should handle empty input', () => {
      const result = aggregateToYearly([]);

      expect(result.data).toHaveLength(0);
      expect(result.statistics.monthlyFilesProcessed).toBe(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle empty rows in a month', () => {
      const monthlyData = [createMockMonthlyData(2020, 6, [])];

      const result = aggregateToYearly(monthlyData);

      expect(result.data).toHaveLength(0);
      expect(result.statistics.totalRowsProcessed).toBe(0);
    });
  });

  describe('aggregateSingleMonth', () => {
    it('should aggregate a single month without year tracking', () => {
      const rows = [
        createMockRow(1, 'Homicide', { '75': 10, '13': 20 }),
        createMockRow(2, 'Homicide pour voler', { '75': 5, '13': 8 }),
      ];

      const result = aggregateSingleMonth(rows, 2020, 6);

      expect(result.size).toBe(2); // Two départements
      expect(result.get('75|HOMICIDE')?.count).toBe(15); // 10 + 5
      expect(result.get('13|HOMICIDE')?.count).toBe(28); // 20 + 8
    });

    it('should skip unused indices', () => {
      const rows = [
        createMockRow(1, 'Homicide', { '75': 10 }),
        createMockRow(96, 'Unused', { '75': 999 }),
      ];

      const result = aggregateSingleMonth(rows, 2020, 6);

      expect(result.size).toBe(1);
      expect(result.get('75|HOMICIDE')?.count).toBe(10);
    });

    it('should use custom category mapper', () => {
      const mockMapper = {
        isUnused: () => false,
        getCanonicalCode: () => 'ASSAULT' as CanonicalCategoryCode,
      } as unknown as Etat4001CategoryMapper;

      const rows = [createMockRow(1, 'Test', { '75': 100 })];

      const result = aggregateSingleMonth(rows, 2020, 6, mockMapper);

      expect(result.get('75|ASSAULT')?.count).toBe(100);
    });
  });

  describe('getCategorySummary', () => {
    it('should sum counts by category', () => {
      const data: YearlyCrimeAggregate[] = [
        {
          departementCode: '75',
          canonicalCategory: 'HOMICIDE',
          year: 2020,
          count: 100,
          monthsWithData: 12,
          isComplete: true,
          missingMonths: [],
          sourceIndices: [1],
        },
        {
          departementCode: '13',
          canonicalCategory: 'HOMICIDE',
          year: 2020,
          count: 50,
          monthsWithData: 12,
          isComplete: true,
          missingMonths: [],
          sourceIndices: [1],
        },
        {
          departementCode: '75',
          canonicalCategory: 'ASSAULT',
          year: 2020,
          count: 200,
          monthsWithData: 12,
          isComplete: true,
          missingMonths: [],
          sourceIndices: [7],
        },
      ];

      const summary = getCategorySummary(data);

      expect(summary.get('HOMICIDE')).toBe(150);
      expect(summary.get('ASSAULT')).toBe(200);
    });
  });

  describe('getDepartementSummary', () => {
    it('should sum counts by département', () => {
      const data: YearlyCrimeAggregate[] = [
        {
          departementCode: '75',
          canonicalCategory: 'HOMICIDE',
          year: 2020,
          count: 100,
          monthsWithData: 12,
          isComplete: true,
          missingMonths: [],
          sourceIndices: [1],
        },
        {
          departementCode: '75',
          canonicalCategory: 'ASSAULT',
          year: 2020,
          count: 200,
          monthsWithData: 12,
          isComplete: true,
          missingMonths: [],
          sourceIndices: [7],
        },
        {
          departementCode: '13',
          canonicalCategory: 'HOMICIDE',
          year: 2020,
          count: 50,
          monthsWithData: 12,
          isComplete: true,
          missingMonths: [],
          sourceIndices: [1],
        },
      ];

      const summary = getDepartementSummary(data);

      expect(summary.get('75')).toBe(300);
      expect(summary.get('13')).toBe(50);
    });
  });

  describe('getYearSummary', () => {
    it('should sum counts by year', () => {
      const data: YearlyCrimeAggregate[] = [
        {
          departementCode: '75',
          canonicalCategory: 'HOMICIDE',
          year: 2020,
          count: 100,
          monthsWithData: 12,
          isComplete: true,
          missingMonths: [],
          sourceIndices: [1],
        },
        {
          departementCode: '75',
          canonicalCategory: 'HOMICIDE',
          year: 2021,
          count: 110,
          monthsWithData: 12,
          isComplete: true,
          missingMonths: [],
          sourceIndices: [1],
        },
        {
          departementCode: '13',
          canonicalCategory: 'HOMICIDE',
          year: 2020,
          count: 50,
          monthsWithData: 12,
          isComplete: true,
          missingMonths: [],
          sourceIndices: [1],
        },
      ];

      const summary = getYearSummary(data);

      expect(summary.get(2020)).toBe(150);
      expect(summary.get(2021)).toBe(110);
    });
  });

  describe('filterAggregatedData', () => {
    const testData: YearlyCrimeAggregate[] = [
      {
        departementCode: '75',
        canonicalCategory: 'HOMICIDE',
        year: 2020,
        count: 100,
        monthsWithData: 12,
        isComplete: true,
        missingMonths: [],
        sourceIndices: [1],
      },
      {
        departementCode: '13',
        canonicalCategory: 'ASSAULT',
        year: 2020,
        count: 200,
        monthsWithData: 6,
        isComplete: false,
        missingMonths: [7, 8, 9, 10, 11, 12],
        sourceIndices: [7],
      },
      {
        departementCode: '75',
        canonicalCategory: 'HOMICIDE',
        year: 2021,
        count: 110,
        monthsWithData: 12,
        isComplete: true,
        missingMonths: [],
        sourceIndices: [1],
      },
    ];

    it('should filter by years', () => {
      const filtered = filterAggregatedData(testData, { years: [2020] });
      expect(filtered).toHaveLength(2);
      expect(filtered.every((d) => d.year === 2020)).toBe(true);
    });

    it('should filter by départements', () => {
      const filtered = filterAggregatedData(testData, { departementCodes: ['75'] });
      expect(filtered).toHaveLength(2);
      expect(filtered.every((d) => d.departementCode === '75')).toBe(true);
    });

    it('should filter by categories', () => {
      const filtered = filterAggregatedData(testData, { categories: ['HOMICIDE'] });
      expect(filtered).toHaveLength(2);
      expect(filtered.every((d) => d.canonicalCategory === 'HOMICIDE')).toBe(true);
    });

    it('should filter by minimum count', () => {
      const filtered = filterAggregatedData(testData, { minCount: 150 });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].count).toBe(200);
    });

    it('should filter by complete years only', () => {
      const filtered = filterAggregatedData(testData, { completeOnly: true });
      expect(filtered).toHaveLength(2);
      expect(filtered.every((d) => d.isComplete)).toBe(true);
    });

    it('should combine multiple filters', () => {
      const filtered = filterAggregatedData(testData, {
        years: [2020],
        departementCodes: ['75'],
        categories: ['HOMICIDE'],
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toMatchObject({
        year: 2020,
        departementCode: '75',
        canonicalCategory: 'HOMICIDE',
      });
    });

    it('should return empty array if no matches', () => {
      const filtered = filterAggregatedData(testData, { years: [2025] });
      expect(filtered).toHaveLength(0);
    });

    it('should return all data if no filters provided', () => {
      const filtered = filterAggregatedData(testData, {});
      expect(filtered).toHaveLength(testData.length);
    });
  });
});
