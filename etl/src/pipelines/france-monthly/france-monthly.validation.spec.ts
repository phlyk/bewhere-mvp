/**
 * France Monthly Dataset Validation Tests
 *
 * End-to-end validation tests for the État 4001 pipeline.
 * These tests verify:
 * 1. Data integrity across pipeline stages
 * 2. Canonical category mappings are complete and correct
 * 3. Département coverage matches expectations
 * 4. Rate calculations are mathematically valid
 * 5. Aggregation sums match source totals
 * 6. Loader output structure is database-ready
 *
 * @see Task 4.1.7: Create dataset validation tests
 */

import {
    combineValidationResults,
    validateCrimeCount,
    validateDepartementCode,
    validateMonth,
    validateRatePer100k,
    validateYear,
    ValidationResult,
} from '../../utils/validation';
import { EMBEDDED_POPULATION_DATA } from '../population/population.types';
import {
    aggregateToYearly,
    getCategorySummary,
    getDepartementSummary,
    getYearSummary,
    MonthlyExtractedData,
    YearlyCrimeAggregate,
} from './france-monthly.aggregator';
import {
    ALL_CANONICAL_CODES,
    CanonicalCategoryCode,
    Etat4001CategoryMapper,
    getCategoryMapper
} from './france-monthly.category-mapper';
import {
    FranceMonthlyRateEnricher
} from './france-monthly.rate-enricher';
import {
    DEPARTEMENT_NAME_TO_CODE,
    Etat4001ParsedRow,
    isUnusedIndex,
} from './france-monthly.types';

describe('France Monthly Dataset Validation', () => {
  /**
   * Expected metropolitan département codes (01-95, 2A, 2B)
   * Excludes overseas territories (971-976) which are not in État 4001
   */
  const EXPECTED_METROPOLITAN_DEPTS = [
    '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
    '11', '12', '13', '14', '15', '16', '17', '18', '19', '21',
    '22', '23', '24', '25', '26', '27', '28', '29', '30', '31',
    '32', '33', '34', '35', '36', '37', '38', '39', '40', '41',
    '42', '43', '44', '45', '46', '47', '48', '49', '50', '51',
    '52', '53', '54', '55', '56', '57', '58', '59', '60', '61',
    '62', '63', '64', '65', '66', '67', '68', '69', '70', '71',
    '72', '73', '74', '75', '76', '77', '78', '79', '80', '81',
    '82', '83', '84', '85', '86', '87', '88', '89', '90', '91',
    '92', '93', '94', '95', '2A', '2B',
  ];

  /**
   * Active État 4001 indices (1-107 excluding unused: 96, 97, 99, 100)
   */
  const ACTIVE_INDICES = Array.from({ length: 107 }, (_, i) => i + 1)
    .filter((i) => !isUnusedIndex(i));

  /**
   * Expected category count per pipeline stage
   */
  const EXPECTED_ACTIVE_INDICES = 103; // 107 - 4 unused
  const EXPECTED_CANONICAL_CATEGORIES = 20;
  const EXPECTED_METROPOLITAN_DEPT_COUNT = 96;

  describe('Category Mapping Validation', () => {
    let mapper: Etat4001CategoryMapper;

    beforeAll(() => {
      mapper = getCategoryMapper();
    });

    it('should map all active État 4001 indices', () => {
      const mappedIndices: number[] = [];
      const unmappedIndices: number[] = [];

      for (const index of ACTIVE_INDICES) {
        const result = mapper.lookup(index);
        if (result.found) {
          mappedIndices.push(index);
        } else {
          unmappedIndices.push(index);
        }
      }

      expect(mappedIndices.length).toBe(EXPECTED_ACTIVE_INDICES);
      expect(unmappedIndices).toEqual([]);
    });

    it('should return null for unused indices (96, 97, 99, 100)', () => {
      const unusedIndices = [96, 97, 99, 100];
      for (const index of unusedIndices) {
        expect(mapper.getCanonicalCode(index)).toBeNull();
      }
    });

    it('should produce all 20 canonical categories', () => {
      const categoriesUsed = new Set<CanonicalCategoryCode>();

      for (const index of ACTIVE_INDICES) {
        const result = mapper.lookup(index);
        if (result.found && result.canonicalCode) {
          categoriesUsed.add(result.canonicalCode);
        }
      }

      // DOMESTIC_VIOLENCE has no direct mapping in historical data
      const expectedCategories = ALL_CANONICAL_CODES.filter(
        (c: CanonicalCategoryCode) => c !== 'DOMESTIC_VIOLENCE',
      );

      for (const category of expectedCategories) {
        expect(categoriesUsed.has(category)).toBe(true);
      }
    });

    it('should have consistent mapping for each index', () => {
      // Each index should always map to the same category
      for (const index of ACTIVE_INDICES) {
        const result1 = mapper.lookup(index);
        const result2 = mapper.lookup(index);
        expect(result1).toEqual(result2);
      }
    });

    it('should provide reverse lookup from canonical to source indices', () => {
      const burglaryIndices = mapper.getIndicesForCategory('BURGLARY_RESIDENTIAL');
      expect(burglaryIndices).toBeDefined();
      expect(burglaryIndices.length).toBeGreaterThan(0);

      // Each returned index should map back to BURGLARY_RESIDENTIAL
      for (const index of burglaryIndices) {
        const result = mapper.lookup(index);
        expect(result.canonicalCode).toBe('BURGLARY_RESIDENTIAL');
      }
    });

    it('should include mapping details for each index', () => {
      // Spot-check critical categories have proper mappings
      const entry = mapper.getMappingEntry(1); // Règlements de compte
      expect(entry).toBeDefined();
      expect(entry!.canonicalCode).toBe('HOMICIDE');
      expect(typeof entry!.frenchName).toBe('string');
      expect(entry!.frenchName.length).toBeGreaterThan(0);
    });
  });

  describe('Département Name-to-Code Validation', () => {
    it('should have all 96 metropolitan départements mapped', () => {
      const codeValues = Object.values(DEPARTEMENT_NAME_TO_CODE);
      const uniqueCodes = [...new Set(codeValues)];

      expect(uniqueCodes.length).toBeGreaterThanOrEqual(EXPECTED_METROPOLITAN_DEPT_COUNT);
    });

    it('should handle Corsica codes (2A, 2B)', () => {
      // Find entries mapping to Corsica
      const corsicaCodes = Object.entries(DEPARTEMENT_NAME_TO_CODE)
        .filter(([, code]) => code === '2A' || code === '2B');

      expect(corsicaCodes.length).toBeGreaterThanOrEqual(2);
    });

    it('should validate all mapped département codes', () => {
      const codeValues = Object.values(DEPARTEMENT_NAME_TO_CODE);

      // Filter out special codes like METRO (metropolitan total)
      const deptCodes = codeValues.filter((code) => code !== 'METRO');

      for (const code of deptCodes) {
        const result = validateDepartementCode(code);
        expect(result.isValid).toBe(true);
      }
    });

    it('should include common name variations', () => {
      // Common variations that should be handled
      const testNames = [
        'Paris',
        'Bouches-du-Rhône',
        'Nord',
        'Rhône',
        'Haute-Garonne',
      ];

      for (const name of testNames) {
        const found = Object.keys(DEPARTEMENT_NAME_TO_CODE).some(
          (key) => key.toLowerCase().includes(name.toLowerCase()),
        );
        expect(found).toBe(true);
      }
    });
  });

  describe('Aggregation Validation', () => {
    /**
     * Create mock extracted data for testing aggregation
     */
    function createMockMonthlyData(
      year: number,
      month: number,
      departements: string[],
      indices: number[],
      countValue: number = 100,
    ): MonthlyExtractedData {
      const rows: Etat4001ParsedRow[] = indices.map((index) => ({
        index,
        categoryName: `Category ${index}`,
        metropoleTotal: countValue * departements.length,
        departementCounts: Object.fromEntries(
          departements.map((dept) => [dept, countValue]),
        ),
        sourceDate: { year, month },
      }));

      return {
        rows,
        year,
        month,
        source: `mock-${year}-${month}.csv`,
      };
    }

    it('should aggregate monthly data to yearly totals', () => {
      const monthlyData: MonthlyExtractedData[] = [];
      const testDepts = ['75', '13', '69'];
      const testIndices = [1, 2, 3]; // First 3 active indices

      // Create 12 months of data
      for (let month = 1; month <= 12; month++) {
        monthlyData.push(createMockMonthlyData(2020, month, testDepts, testIndices, 100));
      }

      const result = aggregateToYearly(monthlyData);

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.statistics.uniqueYears).toContain(2020);
      expect(result.statistics.completeYears).toContain(2020);
    });

    it('should correctly sum counts across months', () => {
      const monthlyData: MonthlyExtractedData[] = [];
      const testDepts = ['75'];
      const testIndices = [1]; // Single category for easy verification

      // 12 months × 100 counts = 1200 total
      for (let month = 1; month <= 12; month++) {
        monthlyData.push(createMockMonthlyData(2020, month, testDepts, testIndices, 100));
      }

      const result = aggregateToYearly(monthlyData);

      // Find the aggregate for Paris (75), year 2020
      const parisAgg = result.data.find(
        (d) => d.departementCode === '75' && d.year === 2020,
      );

      expect(parisAgg).toBeDefined();
      expect(parisAgg!.count).toBe(1200); // 12 × 100
      expect(parisAgg!.monthsWithData).toBe(12);
      expect(parisAgg!.isComplete).toBe(true);
    });

    it('should handle partial years correctly', () => {
      const monthlyData: MonthlyExtractedData[] = [];
      const testDepts = ['75'];
      const testIndices = [1];

      // Only 6 months of data
      for (let month = 1; month <= 6; month++) {
        monthlyData.push(createMockMonthlyData(2020, month, testDepts, testIndices, 100));
      }

      const result = aggregateToYearly(monthlyData);

      const parisAgg = result.data.find(
        (d) => d.departementCode === '75' && d.year === 2020,
      );

      expect(parisAgg).toBeDefined();
      expect(parisAgg!.count).toBe(600); // 6 × 100
      expect(parisAgg!.monthsWithData).toBe(6);
      expect(parisAgg!.isComplete).toBe(false);
      expect(parisAgg!.missingMonths).toEqual([7, 8, 9, 10, 11, 12]);
    });

    it('should map multiple source indices to single canonical category', () => {
      const monthlyData: MonthlyExtractedData[] = [];
      const testDepts = ['75'];

      // Get all indices that map to BURGLARY_RESIDENTIAL
      const mapper = getCategoryMapper();
      const burglaryIndices = mapper.getIndicesForCategory('BURGLARY_RESIDENTIAL');
      expect(burglaryIndices).toBeDefined();
      expect(burglaryIndices.length).toBeGreaterThan(1);

      // Create data with multiple burglary indices
      for (let month = 1; month <= 12; month++) {
        monthlyData.push(
          createMockMonthlyData(2020, month, testDepts, burglaryIndices, 50),
        );
      }

      const result = aggregateToYearly(monthlyData);

      // Should produce single BURGLARY_RESIDENTIAL aggregate
      const burglaryAggs = result.data.filter(
        (d) =>
          d.departementCode === '75' &&
          d.year === 2020 &&
          d.canonicalCategory === 'BURGLARY_RESIDENTIAL',
      );

      expect(burglaryAggs.length).toBe(1);
      // Sum should be: indices * 12 months * 50 count
      const expectedSum = burglaryIndices.length * 12 * 50;
      expect(burglaryAggs[0].count).toBe(expectedSum);
      expect(burglaryAggs[0].sourceIndices.sort()).toEqual(burglaryIndices.sort());
    });

    it('should skip unused indices during aggregation', () => {
      const monthlyData: MonthlyExtractedData[] = [];
      const testDepts = ['75'];
      const unusedIndices = [96, 97, 99, 100];

      for (let month = 1; month <= 12; month++) {
        monthlyData.push(
          createMockMonthlyData(2020, month, testDepts, unusedIndices, 100),
        );
      }

      const result = aggregateToYearly(monthlyData);

      // Should produce no aggregates for unused indices
      expect(result.data.length).toBe(0);
      expect(result.statistics.rowsSkipped).toBeGreaterThan(0);
    });

    it('should track aggregation statistics correctly', () => {
      const monthlyData: MonthlyExtractedData[] = [];
      const testDepts = ['75', '13'];
      const testIndices = [1, 2, 3, 96]; // 3 active + 1 unused

      for (let month = 1; month <= 12; month++) {
        monthlyData.push(createMockMonthlyData(2020, month, testDepts, testIndices, 100));
      }

      const result = aggregateToYearly(monthlyData);

      expect(result.statistics.monthlyFilesProcessed).toBe(12);
      expect(result.statistics.uniqueYears).toContain(2020);
      expect(result.statistics.uniqueDepartements).toBe(2);
      expect(result.statistics.rowsSkipped).toBeGreaterThan(0); // Index 96 skipped
    });
  });

  describe('Rate Enrichment Validation', () => {
    /**
     * Create mock aggregate for rate testing
     */
    function createMockAggregate(
      departementCode: string,
      year: number,
      count: number,
    ): YearlyCrimeAggregate {
      return {
        departementCode,
        canonicalCategory: 'BURGLARY_RESIDENTIAL' as CanonicalCategoryCode,
        year,
        count,
        monthsWithData: 12,
        isComplete: true,
        missingMonths: [],
        sourceIndices: [27, 28],
      };
    }

    it('should calculate rate per 100k correctly', async () => {
      const enricher = new FranceMonthlyRateEnricher(null, {
        populationSource: 'embedded',
      });

      // Use Lozère (48) - small population for easy verification
      // 2020 population: 76 thousand = 76,000
      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate('48', 2020, 760),
      ];

      const result = await enricher.enrich(aggregates);

      expect(result.data.length).toBe(1);
      const enriched = result.data[0];

      // Rate = (760 / 76000) * 100000 = 1000 per 100k
      expect(enriched.ratePer100k).toBeCloseTo(1000, 1);
      expect(enriched.populationUsed).toBe(76000);
    });

    it('should return null rate for départements without population data', async () => {
      const enricher = new FranceMonthlyRateEnricher(null, {
        populationSource: 'embedded',
        skipMissingPopulation: false,
      });

      // Use a fake département code that won't have population
      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate('XX', 2020, 100),
      ];

      const result = await enricher.enrich(aggregates);

      expect(result.data.length).toBe(1);
      expect(result.data[0].ratePer100k).toBeNull();
      expect(result.data[0].populationUsed).toBeNull();
      expect(result.statistics.recordsWithoutPopulation).toBe(1);
    });

    it('should enrich all metropolitan départements with rates', async () => {
      const enricher = new FranceMonthlyRateEnricher(null, {
        populationSource: 'embedded',
      });

      // Create aggregates for all metropolitan départements
      const aggregates: YearlyCrimeAggregate[] = EXPECTED_METROPOLITAN_DEPTS
        .filter((code) => EMBEDDED_POPULATION_DATA[code]?.[2020]) // Only those with 2020 data
        .map((code) => createMockAggregate(code, 2020, 1000));

      const result = await enricher.enrich(aggregates);

      // All should have rates calculated
      const withRates = result.data.filter((d) => d.ratePer100k !== null);
      expect(withRates.length).toBe(result.data.length);
      expect(result.statistics.recordsWithoutPopulation).toBe(0);
    });

    it('should validate rate values are reasonable', async () => {
      const enricher = new FranceMonthlyRateEnricher(null, {
        populationSource: 'embedded',
      });

      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate('75', 2020, 50000), // Paris - high crime count
        createMockAggregate('48', 2020, 10), // Lozère - low crime count
      ];

      const result = await enricher.enrich(aggregates);

      for (const enriched of result.data) {
        if (enriched.ratePer100k !== null) {
          const validation = validateRatePer100k(enriched.ratePer100k);
          expect(validation.isValid).toBe(true);
        }
      }
    });

    it('should use fallback year when exact year not found', async () => {
      const enricher = new FranceMonthlyRateEnricher(null, {
        populationSource: 'embedded',
        fallbackYear: 2023,
      });

      // Use a future year that won't have population data
      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate('75', 2030, 1000),
      ];

      const result = await enricher.enrich(aggregates);

      // Should use fallback year's population
      expect(result.data.length).toBe(1);
      if (EMBEDDED_POPULATION_DATA['75']?.[2023]) {
        expect(result.data[0].populationUsed).toBe(
          EMBEDDED_POPULATION_DATA['75'][2023] * 1000,
        );
      }
    });

    it('should preserve all aggregate fields in enriched output', async () => {
      const enricher = new FranceMonthlyRateEnricher(null, {
        populationSource: 'embedded',
      });

      const aggregate = createMockAggregate('75', 2020, 5000);
      aggregate.sourceIndices = [27, 28, 29];
      aggregate.monthsWithData = 11;
      aggregate.isComplete = false;
      aggregate.missingMonths = [12];

      const result = await enricher.enrich([aggregate]);

      expect(result.data.length).toBe(1);
      const enriched = result.data[0];

      expect(enriched.departementCode).toBe('75');
      expect(enriched.canonicalCategory).toBe('BURGLARY_RESIDENTIAL');
      expect(enriched.year).toBe(2020);
      expect(enriched.count).toBe(5000);
      expect(enriched.monthsWithData).toBe(11);
      expect(enriched.isComplete).toBe(false);
      expect(enriched.sourceIndices).toEqual([27, 28, 29]);
    });
  });

  describe('Data Validation Utilities', () => {
    it('should validate département codes correctly', () => {
      // Valid codes
      expect(validateDepartementCode('01').isValid).toBe(true);
      expect(validateDepartementCode('75').isValid).toBe(true);
      expect(validateDepartementCode('2A').isValid).toBe(true);
      expect(validateDepartementCode('2B').isValid).toBe(true);
      expect(validateDepartementCode('95').isValid).toBe(true);
      expect(validateDepartementCode('971').isValid).toBe(true);
      expect(validateDepartementCode('976').isValid).toBe(true);

      // Invalid codes
      expect(validateDepartementCode('00').isValid).toBe(false);
      expect(validateDepartementCode('96').isValid).toBe(false);
      expect(validateDepartementCode('XX').isValid).toBe(false);
      expect(validateDepartementCode('').isValid).toBe(false);
    });

    it('should validate crime counts correctly', () => {
      expect(validateCrimeCount(0).isValid).toBe(true);
      expect(validateCrimeCount(100).isValid).toBe(true);
      expect(validateCrimeCount(1000000).isValid).toBe(true);

      // Negative counts are invalid
      expect(validateCrimeCount(-1).isValid).toBe(false);
      expect(validateCrimeCount(-100).isValid).toBe(false);
    });

    it('should warn on unusually high counts', () => {
      const result = validateCrimeCount(50000000);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should validate rates correctly', () => {
      expect(validateRatePer100k(0).isValid).toBe(true);
      expect(validateRatePer100k(100).isValid).toBe(true);
      expect(validateRatePer100k(5000).isValid).toBe(true);

      // Negative rates are invalid
      expect(validateRatePer100k(-1).isValid).toBe(false);
    });

    it('should warn on unusually high rates', () => {
      const result = validateRatePer100k(50000);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should validate years correctly', () => {
      expect(validateYear(2020).isValid).toBe(true);
      expect(validateYear(1990).isValid).toBe(true);
      expect(validateYear(2026).isValid).toBe(true);

      // Too old
      expect(validateYear(1900).isValid).toBe(false);
    });

    it('should validate months correctly', () => {
      for (let month = 1; month <= 12; month++) {
        expect(validateMonth(month).isValid).toBe(true);
      }

      expect(validateMonth(0).isValid).toBe(false);
      expect(validateMonth(13).isValid).toBe(false);
      expect(validateMonth(-1).isValid).toBe(false);
    });

    it('should combine multiple validation results', () => {
      const results: ValidationResult[] = [
        { isValid: true, errors: [], warnings: ['warn1'] },
        { isValid: false, errors: ['error1'], warnings: [] },
        { isValid: true, errors: [], warnings: ['warn2'] },
      ];

      const combined = combineValidationResults(results);

      expect(combined.isValid).toBe(false);
      expect(combined.errors).toContain('error1');
      expect(combined.warnings).toContain('warn1');
      expect(combined.warnings).toContain('warn2');
    });
  });

  describe('Population Data Coverage', () => {
    it('should have population data for all metropolitan départements', () => {
      const missingDepts: string[] = [];

      for (const dept of EXPECTED_METROPOLITAN_DEPTS) {
        if (!EMBEDDED_POPULATION_DATA[dept]) {
          missingDepts.push(dept);
        }
      }

      expect(missingDepts).toEqual([]);
    });

    it('should have population data for expected years (2016-2024)', () => {
      const expectedYears = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
      const yearsWithGaps: { dept: string; missingYears: number[] }[] = [];

      for (const dept of EXPECTED_METROPOLITAN_DEPTS) {
        const deptData = EMBEDDED_POPULATION_DATA[dept];
        if (deptData) {
          const missing = expectedYears.filter((year) => !deptData[year]);
          if (missing.length > 0) {
            yearsWithGaps.push({ dept, missingYears: missing });
          }
        }
      }

      // Allow some gaps but not too many
      expect(yearsWithGaps.length).toBeLessThan(10);
    });

    it('should have reasonable population values', () => {
      for (const dept of EXPECTED_METROPOLITAN_DEPTS) {
        const deptData = EMBEDDED_POPULATION_DATA[dept];
        if (deptData) {
          for (const [year, population] of Object.entries(deptData)) {
            // Population in thousands, so should be > 0 and < 15000 (Paris max ~2.1M = 2100)
            expect(population).toBeGreaterThan(0);
            expect(population).toBeLessThan(15000);
          }
        }
      }
    });
  });

  describe('Pipeline Output Structure Validation', () => {
    it('should produce EnrichedCrimeRecord with all required fields', async () => {
      const enricher = new FranceMonthlyRateEnricher(null, {
        populationSource: 'embedded',
      });

      const aggregate: YearlyCrimeAggregate = {
        departementCode: '75',
        canonicalCategory: 'ASSAULT' as CanonicalCategoryCode,
        year: 2020,
        count: 5000,
        monthsWithData: 12,
        isComplete: true,
        missingMonths: [],
        sourceIndices: [5, 6, 7],
      };

      const result = await enricher.enrich([aggregate]);
      const enriched = result.data[0];

      // Required fields for database loading
      expect(enriched).toHaveProperty('departementCode');
      expect(enriched).toHaveProperty('canonicalCategory');
      expect(enriched).toHaveProperty('year');
      expect(enriched).toHaveProperty('count');
      expect(enriched).toHaveProperty('ratePer100k');
      expect(enriched).toHaveProperty('populationUsed');
      expect(enriched).toHaveProperty('monthsWithData');
      expect(enriched).toHaveProperty('isComplete');
      expect(enriched).toHaveProperty('sourceIndices');

      // Type validation
      expect(typeof enriched.departementCode).toBe('string');
      expect(typeof enriched.canonicalCategory).toBe('string');
      expect(typeof enriched.year).toBe('number');
      expect(typeof enriched.count).toBe('number');
    });

    it('should produce valid EnrichedCrimeRecord for loader consumption', async () => {
      const enricher = new FranceMonthlyRateEnricher(null, {
        populationSource: 'embedded',
      });

      const aggregates: YearlyCrimeAggregate[] = ALL_CANONICAL_CODES
        .filter((c: CanonicalCategoryCode) => c !== 'DOMESTIC_VIOLENCE')
        .slice(0, 5)
        .map((category: CanonicalCategoryCode) => ({
          departementCode: '75',
          canonicalCategory: category,
          year: 2020,
          count: 1000,
          monthsWithData: 12,
          isComplete: true,
          missingMonths: [],
          sourceIndices: [1],
        }));

      const result = await enricher.enrich(aggregates);

      // All records should be valid
      for (const enriched of result.data) {
        // Département code is valid
        expect(validateDepartementCode(enriched.departementCode).isValid).toBe(true);

        // Category is a valid canonical code
        expect(ALL_CANONICAL_CODES).toContain(enriched.canonicalCategory);

        // Year is valid
        expect(validateYear(enriched.year).isValid).toBe(true);

        // Count is valid
        expect(validateCrimeCount(enriched.count).isValid).toBe(true);

        // Rate is valid (if present)
        if (enriched.ratePer100k !== null) {
          expect(validateRatePer100k(enriched.ratePer100k).isValid).toBe(true);
        }
      }
    });
  });

  describe('End-to-End Data Flow', () => {
    it('should maintain data integrity through full pipeline', async () => {
      // 1. Create mock extracted data
      const mapper = getCategoryMapper();
      const testIndices = [1, 2, 3, 27, 28]; // Mix of categories
      const testDepts = ['75', '13', '69'];
      const monthlyData: MonthlyExtractedData[] = [];

      for (let month = 1; month <= 12; month++) {
        const rows: Etat4001ParsedRow[] = testIndices.map((index) => ({
          index,
          categoryName: `Category ${index}`,
          metropoleTotal: 300,
          departementCounts: Object.fromEntries(
            testDepts.map((dept) => [dept, 100]),
          ),
          sourceDate: { year: 2020, month },
        }));

        monthlyData.push({
          rows,
          year: 2020,
          month,
          source: `test-2020-${month}.csv`,
        });
      }

      // 2. Aggregate
      const aggregateResult = aggregateToYearly(monthlyData);
      expect(aggregateResult.data.length).toBeGreaterThan(0);

      // 3. Enrich with rates
      const enricher = new FranceMonthlyRateEnricher(null, {
        populationSource: 'embedded',
      });
      const enrichResult = await enricher.enrich(aggregateResult.data);

      // 4. Validate final output
      expect(enrichResult.data.length).toBeGreaterThan(0);

      // Each département should have data
      for (const dept of testDepts) {
        const deptRecords = enrichResult.data.filter(
          (d) => d.departementCode === dept,
        );
        expect(deptRecords.length).toBeGreaterThan(0);
      }

      // All records should have year 2020
      for (const record of enrichResult.data) {
        expect(record.year).toBe(2020);
      }

      // Records with population should have valid rates
      const withRates = enrichResult.data.filter((d) => d.ratePer100k !== null);
      expect(withRates.length).toBe(enrichResult.data.length);

      // Counts should be 12 * 100 = 1200 per index per dept (before aggregation to categories)
      // After category aggregation, counts will be higher for categories with multiple indices
    });

    it('should produce consistent row counts across pipeline stages', async () => {
      const testDepts = ['75', '13'];
      const testIndices = [1, 5, 10, 27]; // 4 indices -> at least 4 categories
      const monthlyData: MonthlyExtractedData[] = [];

      for (let month = 1; month <= 6; month++) {
        const rows: Etat4001ParsedRow[] = testIndices.map((index) => ({
          index,
          categoryName: `Category ${index}`,
          metropoleTotal: 200,
          departementCounts: Object.fromEntries(
            testDepts.map((dept) => [dept, 100]),
          ),
          sourceDate: { year: 2020, month },
        }));

        monthlyData.push({
          rows,
          year: 2020,
          month,
          source: `test-2020-${month}.csv`,
        });
      }

      const aggregateResult = aggregateToYearly(monthlyData);

      // Get category summary
      const categorySummary = getCategorySummary(aggregateResult.data);
      const deptSummary = getDepartementSummary(aggregateResult.data);
      const yearSummary = getYearSummary(aggregateResult.data);

      // Validate summaries
      expect(deptSummary.size).toBe(testDepts.length);
      expect(yearSummary.size).toBe(1); // Only 2020

      // Each département should have the same categories
      const categories = new Set<string>();
      for (const record of aggregateResult.data) {
        categories.add(record.canonicalCategory);
      }

      for (const dept of testDepts) {
        const deptCategories = aggregateResult.data
          .filter((d) => d.departementCode === dept)
          .map((d) => d.canonicalCategory);

        expect(new Set(deptCategories).size).toBe(categories.size);
      }
    });
  });
});
