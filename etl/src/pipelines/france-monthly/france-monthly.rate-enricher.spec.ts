/**
 * France Monthly Rate Enricher Tests
 *
 * Unit tests for the rate calculation enrichment module.
 */

import { EMBEDDED_POPULATION_DATA } from '../population/population.types';
import { YearlyCrimeAggregate } from './france-monthly.aggregator';
import { CanonicalCategoryCode } from './france-monthly.category-mapper';
import {
    FranceMonthlyRateEnricher,
    createRateEnricher,
    enrichWithRates
} from './france-monthly.rate-enricher';

describe('FranceMonthlyRateEnricher', () => {
  /**
   * Create mock aggregate data for testing
   */
  function createMockAggregate(
    overrides: Partial<YearlyCrimeAggregate> = {},
  ): YearlyCrimeAggregate {
    return {
      departementCode: '75', // Paris
      canonicalCategory: 'BURGLARY_RESIDENTIAL' as CanonicalCategoryCode,
      year: 2020,
      count: 10000,
      monthsWithData: 12,
      isComplete: true,
      missingMonths: [],
      sourceIndices: [27, 28],
      ...overrides,
    };
  }

  describe('constructor and options', () => {
    it('should create enricher with default options', () => {
      const enricher = new FranceMonthlyRateEnricher();
      expect(enricher).toBeDefined();
    });

    it('should create enricher with custom options', () => {
      const enricher = new FranceMonthlyRateEnricher(null, {
        populationSource: 'embedded',
        skipMissingPopulation: true,
        fallbackYear: 2023,
      });
      expect(enricher).toBeDefined();
    });

    it('should use createRateEnricher factory function', () => {
      const enricher = createRateEnricher(null, { skipMissingPopulation: true });
      expect(enricher).toBeInstanceOf(FranceMonthlyRateEnricher);
    });
  });

  describe('enrich with embedded population data', () => {
    it('should calculate rate for département with population data', async () => {
      const enricher = new FranceMonthlyRateEnricher(null, {
        populationSource: 'embedded',
      });

      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate({
          departementCode: '75', // Paris
          year: 2020,
          count: 10000,
        }),
      ];

      const result = await enricher.enrich(aggregates);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].ratePer100k).toBeDefined();
      expect(result.data[0].ratePer100k).toBeGreaterThan(0);
      expect(result.data[0].populationUsed).toBeDefined();
      expect(result.data[0].populationUsed).toBeGreaterThan(0);

      // Paris 2020 population: 2130 thousand = 2,130,000
      // Rate = (10000 / 2130000) * 100000 = ~469.48
      const expectedPopulation = EMBEDDED_POPULATION_DATA['75'][2020] * 1000;
      expect(result.data[0].populationUsed).toBe(expectedPopulation);
    });

    it('should calculate correct rate per 100k', async () => {
      const enricher = new FranceMonthlyRateEnricher(null, {
        populationSource: 'embedded',
      });

      // Use Lozère (48) - small population for easier calculation
      // 2020 population: 76 thousand = 76,000
      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate({
          departementCode: '48',
          year: 2020,
          count: 760, // 760 crimes with 76,000 population = 1000 per 100k
        }),
      ];

      const result = await enricher.enrich(aggregates);

      expect(result.data[0].ratePer100k).toBe(1000);
      expect(result.data[0].populationUsed).toBe(76000);
    });

    it('should handle multiple départements and years', async () => {
      const enricher = new FranceMonthlyRateEnricher();

      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate({ departementCode: '75', year: 2018, count: 5000 }),
        createMockAggregate({ departementCode: '75', year: 2019, count: 5500 }),
        createMockAggregate({ departementCode: '13', year: 2018, count: 8000 }), // Bouches-du-Rhône
        createMockAggregate({ departementCode: '13', year: 2019, count: 8500 }),
      ];

      const result = await enricher.enrich(aggregates);

      expect(result.data).toHaveLength(4);
      expect(result.statistics.recordsWithRate).toBe(4);
      expect(result.statistics.uniqueDepartements).toBe(2);
      expect(result.statistics.uniqueYears).toEqual([2018, 2019]);

      // All should have rates calculated
      result.data.forEach((record) => {
        expect(record.ratePer100k).toBeDefined();
        expect(record.ratePer100k).toBeGreaterThan(0);
      });
    });

    it('should handle Corsica départements (2A, 2B)', async () => {
      const enricher = new FranceMonthlyRateEnricher();

      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate({ departementCode: '2A', year: 2020, count: 1000 }),
        createMockAggregate({ departementCode: '2B', year: 2020, count: 1200 }),
      ];

      const result = await enricher.enrich(aggregates);

      expect(result.data).toHaveLength(2);
      expect(result.statistics.recordsWithRate).toBe(2);

      // 2A (Corse-du-Sud) 2020: 164 thousand = 164,000
      expect(result.data[0].populationUsed).toBe(164000);
      // 2B (Haute-Corse) 2020: 190 thousand = 190,000
      expect(result.data[1].populationUsed).toBe(190000);
    });

    it('should handle overseas départements (DOM)', async () => {
      const enricher = new FranceMonthlyRateEnricher();

      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate({ departementCode: '971', year: 2020, count: 3000 }), // Guadeloupe
        createMockAggregate({ departementCode: '974', year: 2020, count: 5000 }), // Réunion
      ];

      const result = await enricher.enrich(aggregates);

      expect(result.data).toHaveLength(2);
      expect(result.statistics.recordsWithRate).toBe(2);

      // 971 (Guadeloupe) 2020: 379 thousand
      expect(result.data[0].populationUsed).toBe(379000);
      // 974 (Réunion) 2020: 884 thousand
      expect(result.data[1].populationUsed).toBe(884000);
    });
  });

  describe('missing population data handling', () => {
    it('should handle unknown département code', async () => {
      const enricher = new FranceMonthlyRateEnricher(null, {
        skipMissingPopulation: false,
      });

      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate({ departementCode: 'XX', year: 2020 }), // Invalid code
      ];

      const result = await enricher.enrich(aggregates);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].ratePer100k).toBeNull();
      expect(result.data[0].populationUsed).toBeNull();
      expect(result.data[0].notes).toContain('No population data');
      expect(result.statistics.recordsWithoutPopulation).toBe(1);
      expect(result.statistics.missingPopulationDepts).toContain('XX');
    });

    it('should skip records when skipMissingPopulation is true', async () => {
      const enricher = new FranceMonthlyRateEnricher(null, {
        skipMissingPopulation: true,
      });

      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate({ departementCode: '75', year: 2020 }), // Valid
        createMockAggregate({ departementCode: 'XX', year: 2020 }), // Invalid
      ];

      const result = await enricher.enrich(aggregates);

      expect(result.data).toHaveLength(1); // Only valid record
      expect(result.data[0].departementCode).toBe('75');
      expect(result.statistics.recordsSkipped).toBe(1);
    });

    it('should include records with null rate when skipMissingPopulation is false', async () => {
      const enricher = new FranceMonthlyRateEnricher(null, {
        skipMissingPopulation: false,
      });

      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate({ departementCode: 'ZZ', year: 2020 }),
      ];

      const result = await enricher.enrich(aggregates);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].ratePer100k).toBeNull();
      expect(result.statistics.recordsSkipped).toBe(0);
    });

    it('should track missing population details', async () => {
      const enricher = new FranceMonthlyRateEnricher();

      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate({ departementCode: 'AA', year: 2018 }),
        createMockAggregate({ departementCode: 'AA', year: 2019 }),
        createMockAggregate({ departementCode: 'BB', year: 2020 }),
      ];

      const result = await enricher.enrich(aggregates);

      expect(result.statistics.missingPopulationDepts).toContain('AA');
      expect(result.statistics.missingPopulationDepts).toContain('BB');
      expect(result.statistics.missingPopulationDetails).toHaveLength(3);
    });
  });

  describe('fallback year handling', () => {
    it('should use fallback year when exact year not available', async () => {
      const enricher = new FranceMonthlyRateEnricher(null, {
        fallbackYear: 2024,
      });

      // Year 2025 is not in embedded data, should fallback to 2024
      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate({ departementCode: '75', year: 2025, count: 10000 }),
      ];

      const result = await enricher.enrich(aggregates);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].ratePer100k).toBeDefined();
      expect(result.data[0].populationUsed).toBe(EMBEDDED_POPULATION_DATA['75'][2024] * 1000);
      expect(result.data[0].notes).toContain('fallback year 2024');
    });

    it('should use most recent year when fallback year also not available', async () => {
      const enricher = new FranceMonthlyRateEnricher(null, {
        fallbackYear: 2030, // Not available
      });

      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate({ departementCode: '75', year: 2030, count: 10000 }),
      ];

      const result = await enricher.enrich(aggregates);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].ratePer100k).toBeDefined();
      expect(result.data[0].notes).toContain('fallback');
    });
  });

  describe('statistics tracking', () => {
    it('should track correct statistics', async () => {
      const enricher = new FranceMonthlyRateEnricher();

      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate({ departementCode: '75', year: 2018 }),
        createMockAggregate({ departementCode: '75', year: 2019 }),
        createMockAggregate({ departementCode: '13', year: 2018 }),
        createMockAggregate({ departementCode: 'XX', year: 2018 }), // Invalid
      ];

      const result = await enricher.enrich(aggregates);

      expect(result.statistics.totalRecords).toBe(4);
      expect(result.statistics.recordsWithRate).toBe(3);
      expect(result.statistics.recordsWithoutPopulation).toBe(1);
      expect(result.statistics.uniqueDepartements).toBe(3);
      expect(result.statistics.uniqueYears).toEqual([2018, 2019]);
    });

    it('should generate warnings for missing data', async () => {
      const enricher = new FranceMonthlyRateEnricher();

      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate({ departementCode: 'YY', year: 2020 }),
        createMockAggregate({ departementCode: 'ZZ', year: 2020 }),
      ];

      const result = await enricher.enrich(aggregates);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes('Missing population data'))).toBe(true);
    });
  });

  describe('enriched record structure', () => {
    it('should include all required fields', async () => {
      const enricher = new FranceMonthlyRateEnricher();

      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate({
          departementCode: '75',
          year: 2020,
          count: 5000,
          monthsWithData: 11,
          isComplete: false,
          sourceIndices: [1, 2, 3],
        }),
      ];

      const result = await enricher.enrich(aggregates);
      const record = result.data[0];

      expect(record.departementCode).toBe('75');
      expect(record.areaId).toBeNull(); // To be resolved by loader
      expect(record.canonicalCategory).toBe('BURGLARY_RESIDENTIAL');
      expect(record.categoryId).toBeNull(); // To be resolved by loader
      expect(record.year).toBe(2020);
      expect(record.count).toBe(5000);
      expect(record.ratePer100k).toBeDefined();
      expect(record.populationUsed).toBeDefined();
      expect(record.monthsWithData).toBe(11);
      expect(record.isComplete).toBe(false);
      expect(record.sourceIndices).toEqual([1, 2, 3]);
    });

    it('should preserve canonical category from aggregate', async () => {
      const enricher = new FranceMonthlyRateEnricher();

      const categories: CanonicalCategoryCode[] = ['HOMICIDE', 'ROBBERY', 'THEFT_OTHER'];
      const aggregates = categories.map((cat) =>
        createMockAggregate({ canonicalCategory: cat }),
      );

      const result = await enricher.enrich(aggregates);

      expect(result.data.map((r) => r.canonicalCategory)).toEqual(categories);
    });
  });

  describe('cache management', () => {
    it('should cache population lookups', async () => {
      const enricher = new FranceMonthlyRateEnricher();

      // Multiple records for same département/year
      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate({
          departementCode: '75',
          year: 2020,
          canonicalCategory: 'BURGLARY_RESIDENTIAL' as CanonicalCategoryCode,
        }),
        createMockAggregate({
          departementCode: '75',
          year: 2020,
          canonicalCategory: 'ROBBERY' as CanonicalCategoryCode,
        }),
        createMockAggregate({
          departementCode: '75',
          year: 2020,
          canonicalCategory: 'THEFT_OTHER' as CanonicalCategoryCode,
        }),
      ];

      await enricher.enrich(aggregates);

      const stats = enricher.getCacheStats();
      expect(stats.size).toBe(1); // Only one département/year combination
      expect(stats.entries).toContain('75|2020');
    });

    it('should clear cache when requested', async () => {
      const enricher = new FranceMonthlyRateEnricher();

      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate({ departementCode: '75', year: 2020 }),
      ];

      await enricher.enrich(aggregates);
      expect(enricher.getCacheStats().size).toBe(1);

      enricher.clearCache();
      expect(enricher.getCacheStats().size).toBe(0);
    });
  });

  describe('enrichWithRates convenience function', () => {
    it('should enrich aggregates with default options', async () => {
      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate({ departementCode: '75', year: 2020, count: 5000 }),
      ];

      const result = await enrichWithRates(aggregates);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].ratePer100k).toBeDefined();
    });

    it('should accept custom options', async () => {
      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate({ departementCode: 'XX', year: 2020 }),
      ];

      const result = await enrichWithRates(aggregates, { skipMissingPopulation: true });

      expect(result.data).toHaveLength(0);
      expect(result.statistics.recordsSkipped).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty input', async () => {
      const enricher = new FranceMonthlyRateEnricher();

      const result = await enricher.enrich([]);

      expect(result.data).toHaveLength(0);
      expect(result.statistics.totalRecords).toBe(0);
    });

    it('should handle zero crime count', async () => {
      const enricher = new FranceMonthlyRateEnricher();

      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate({ departementCode: '75', year: 2020, count: 0 }),
      ];

      const result = await enricher.enrich(aggregates);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].ratePer100k).toBe(0);
    });

    it('should handle very large crime counts', async () => {
      const enricher = new FranceMonthlyRateEnricher();

      const aggregates: YearlyCrimeAggregate[] = [
        createMockAggregate({
          departementCode: '75',
          year: 2020,
          count: 1000000, // 1 million crimes
        }),
      ];

      const result = await enricher.enrich(aggregates);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].ratePer100k).toBeDefined();
      expect(result.data[0].ratePer100k).toBeGreaterThan(0);
    });
  });
});
