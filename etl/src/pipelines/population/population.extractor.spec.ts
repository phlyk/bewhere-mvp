/**
 * Tests for Population Extractor
 */

import {
    PopulationExtractor,
    createPopulationExtractor,
} from './population.extractor';
import {
    EMBEDDED_POPULATION_DATA,
    EXPECTED_POPULATION_RECORDS,
    POPULATION_YEAR_RANGE,
} from './population.types';

describe('PopulationExtractor', () => {
  describe('createPopulationExtractor', () => {
    it('should create extractor with default options', () => {
      const extractor = createPopulationExtractor();
      expect(extractor).toBeInstanceOf(PopulationExtractor);
    });

    it('should create extractor with custom options', () => {
      const extractor = createPopulationExtractor({
        startYear: 2020,
        endYear: 2022,
        includeOverseas: false,
      });
      expect(extractor).toBeInstanceOf(PopulationExtractor);
    });
  });

  describe('extract', () => {
    it('should extract all population records with default options', async () => {
      const extractor = createPopulationExtractor();
      const result = await extractor.extract();

      expect(result.data).toHaveLength(EXPECTED_POPULATION_RECORDS.totalRecords);
      expect(result.source).toBe('INSEE Embedded Data');
      expect(result.rowCount).toBe(EXPECTED_POPULATION_RECORDS.totalRecords);
      expect(result.extractedAt).toBeInstanceOf(Date);
    });

    it('should extract records for specified year range', async () => {
      const extractor = createPopulationExtractor({
        startYear: 2020,
        endYear: 2022,
      });
      const result = await extractor.extract();

      // 101 départements × 3 years = 303 records
      const expectedCount = EXPECTED_POPULATION_RECORDS.totalDepartements * 3;
      expect(result.data).toHaveLength(expectedCount);
    });

    it('should extract only metropolitan départements when overseas excluded', async () => {
      const extractor = createPopulationExtractor({
        startYear: 2020,
        endYear: 2020,
        includeOverseas: false,
      });
      const result = await extractor.extract();

      // 96 metropolitan départements × 1 year = 96 records
      expect(result.data).toHaveLength(EXPECTED_POPULATION_RECORDS.metropolitan);
    });

    it('should include overseas départements by default', async () => {
      const extractor = createPopulationExtractor({
        startYear: 2020,
        endYear: 2020,
      });
      const result = await extractor.extract();

      // Check for overseas département codes
      const codes = result.data.map(r => r.departementCode);
      expect(codes).toContain('971'); // Guadeloupe
      expect(codes).toContain('972'); // Martinique
      expect(codes).toContain('973'); // Guyane
      expect(codes).toContain('974'); // La Réunion
      expect(codes).toContain('976'); // Mayotte
    });

    it('should return sorted records', async () => {
      const extractor = createPopulationExtractor({
        startYear: 2020,
        endYear: 2022,
      });
      const result = await extractor.extract();

      // Check that records are sorted by code, then year
      for (let i = 1; i < result.data.length; i++) {
        const prev = result.data[i - 1];
        const curr = result.data[i];

        if (prev.departementCode === curr.departementCode) {
          expect(curr.year).toBeGreaterThanOrEqual(prev.year);
        } else {
          expect(curr.departementCode.localeCompare(prev.departementCode)).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should include département names', async () => {
      const extractor = createPopulationExtractor({
        startYear: 2020,
        endYear: 2020,
      });
      const result = await extractor.extract();

      const paris = result.data.find(r => r.departementCode === '75');
      expect(paris?.departementName).toBe('Paris');

      const guadeloupe = result.data.find(r => r.departementCode === '971');
      expect(guadeloupe?.departementName).toBe('Guadeloupe');
    });

    it('should convert population from thousands to actual values', async () => {
      const extractor = createPopulationExtractor({
        startYear: 2020,
        endYear: 2020,
      });
      const result = await extractor.extract();

      // Paris 2020: stored as 2130 (thousands), should be 2,130,000
      const paris = result.data.find(r => r.departementCode === '75');
      expect(paris?.population).toBe(2130 * 1000);

      // Lozère 2020: stored as 76 (thousands), should be 76,000
      const lozere = result.data.find(r => r.departementCode === '48');
      expect(lozere?.population).toBe(76 * 1000);
    });
  });

  describe('validate', () => {
    it('should pass validation with valid options', async () => {
      const extractor = createPopulationExtractor({
        startYear: 2016,
        endYear: 2024,
      });
      const isValid = await extractor.validate();
      expect(isValid).toBe(true);
    });

    it('should fail validation when start year > end year', async () => {
      const extractor = createPopulationExtractor({
        startYear: 2024,
        endYear: 2016,
      });
      const isValid = await extractor.validate();
      expect(isValid).toBe(false);
    });
  });

  describe('embedded data integrity', () => {
    it('should have all 101 départements', () => {
      const deptCodes = Object.keys(EMBEDDED_POPULATION_DATA);
      expect(deptCodes).toHaveLength(EXPECTED_POPULATION_RECORDS.totalDepartements);
    });

    it('should have data for all years in range', () => {
      for (const [code, yearData] of Object.entries(EMBEDDED_POPULATION_DATA)) {
        for (let year = POPULATION_YEAR_RANGE.start; year <= POPULATION_YEAR_RANGE.end; year++) {
          expect(yearData[year]).toBeDefined();
          expect(yearData[year]).toBeGreaterThan(0);
        }
      }
    });

    it('should have reasonable population values', () => {
      for (const [code, yearData] of Object.entries(EMBEDDED_POPULATION_DATA)) {
        for (const [year, pop] of Object.entries(yearData)) {
          // All values should be positive
          expect(pop).toBeGreaterThan(0);
          // No département should exceed 3 million (even Nord is ~2.6M)
          expect(pop).toBeLessThan(3000); // In thousands
          // Smallest département (Lozère) has ~76k people
          expect(pop).toBeGreaterThanOrEqual(70); // In thousands
        }
      }
    });

    it('should have Corsican départements with correct codes', () => {
      expect(EMBEDDED_POPULATION_DATA['2A']).toBeDefined();
      expect(EMBEDDED_POPULATION_DATA['2B']).toBeDefined();
    });
  });
});
