/**
 * Tests for Population Transformer
 */

import { DataSource } from 'typeorm';
import {
    PopulationTransformer,
    createPopulationTransformer,
} from './population.transformer';
import { PopulationRawRecord } from './population.types';

// Mock DataSource
const createMockDataSource = (areaData: Array<{ id: string; code: string }> = []) => {
  return {
    query: jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('SELECT id, code')) {
        return Promise.resolve(areaData);
      }
      if (sql.includes('SELECT 1')) {
        return Promise.resolve([{ '?column?': 1 }]);
      }
      return Promise.resolve([]);
    }),
  } as unknown as DataSource;
};

describe('PopulationTransformer', () => {
  describe('createPopulationTransformer', () => {
    it('should create transformer with default options', () => {
      const mockDataSource = createMockDataSource();
      const transformer = createPopulationTransformer(mockDataSource);
      expect(transformer).toBeInstanceOf(PopulationTransformer);
    });

    it('should create transformer with custom options', () => {
      const mockDataSource = createMockDataSource();
      const transformer = createPopulationTransformer(mockDataSource, {
        source: 'Custom Source',
        continueOnError: false,
      });
      expect(transformer).toBeInstanceOf(PopulationTransformer);
    });
  });

  describe('transform', () => {
    const mockAreas = [
      { id: 'uuid-75', code: '75' },
      { id: 'uuid-13', code: '13' },
      { id: 'uuid-971', code: '971' },
    ];

    it('should transform valid records', async () => {
      const mockDataSource = createMockDataSource(mockAreas);
      const transformer = createPopulationTransformer(mockDataSource);

      const rawData: PopulationRawRecord[] = [
        { departementCode: '75', year: 2020, population: 2130000 },
        { departementCode: '13', year: 2020, population: 2051000 },
      ];

      const result = await transformer.transform(rawData);

      expect(result.transformedCount).toBe(2);
      expect(result.skippedCount).toBe(0);
      expect(result.errors).toHaveLength(0);

      expect(result.data[0]).toMatchObject({
        areaId: 'uuid-75',
        code: '75',
        year: 2020,
        populationCount: 2130000,
        source: 'INSEE',
      });
    });

    it('should skip records with unknown département codes', async () => {
      const mockDataSource = createMockDataSource(mockAreas);
      const transformer = createPopulationTransformer(mockDataSource);

      const rawData: PopulationRawRecord[] = [
        { departementCode: '75', year: 2020, population: 2130000 },
        { departementCode: '99', year: 2020, population: 100000 }, // Unknown
      ];

      const result = await transformer.transform(rawData);

      expect(result.transformedCount).toBe(1);
      expect(result.skippedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Unknown département code');
    });

    it('should skip records with invalid population values', async () => {
      const mockDataSource = createMockDataSource(mockAreas);
      const transformer = createPopulationTransformer(mockDataSource);

      const rawData: PopulationRawRecord[] = [
        { departementCode: '75', year: 2020, population: 2130000 },
        { departementCode: '13', year: 2020, population: 0 }, // Invalid
        { departementCode: '971', year: 2020, population: -1000 }, // Invalid
      ];

      const result = await transformer.transform(rawData);

      expect(result.transformedCount).toBe(1);
      expect(result.skippedCount).toBe(2);
      expect(result.errors).toHaveLength(2);
    });

    it('should skip records with invalid years', async () => {
      const mockDataSource = createMockDataSource(mockAreas);
      const transformer = createPopulationTransformer(mockDataSource);

      const rawData: PopulationRawRecord[] = [
        { departementCode: '75', year: 2020, population: 2130000 },
        { departementCode: '13', year: 1800, population: 100000 }, // Invalid year
      ];

      const result = await transformer.transform(rawData);

      expect(result.transformedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Invalid year');
    });

    it('should throw error when no areas found in database', async () => {
      const mockDataSource = createMockDataSource([]); // Empty areas
      const transformer = createPopulationTransformer(mockDataSource);

      const rawData: PopulationRawRecord[] = [
        { departementCode: '75', year: 2020, population: 2130000 },
      ];

      await expect(transformer.transform(rawData)).rejects.toThrow(
        'No administrative areas found',
      );
    });

    it('should add notes with legal population text', async () => {
      const mockDataSource = createMockDataSource(mockAreas);
      const transformer = createPopulationTransformer(mockDataSource);

      const rawData: PopulationRawRecord[] = [
        { departementCode: '75', year: 2020, population: 2130000 },
      ];

      const result = await transformer.transform(rawData);

      expect(result.data[0].notes).toBe('Legal population as of January 1, 2020');
    });

    it('should use custom source name', async () => {
      const mockDataSource = createMockDataSource(mockAreas);
      const transformer = createPopulationTransformer(mockDataSource, {
        source: 'Custom INSEE API',
      });

      const rawData: PopulationRawRecord[] = [
        { departementCode: '75', year: 2020, population: 2130000 },
      ];

      const result = await transformer.transform(rawData);

      expect(result.data[0].source).toBe('Custom INSEE API');
    });

    it('should warn about unusually large population values', async () => {
      const mockDataSource = createMockDataSource(mockAreas);
      const transformer = createPopulationTransformer(mockDataSource);

      const rawData: PopulationRawRecord[] = [
        { departementCode: '75', year: 2020, population: 150000000 }, // Way too large
      ];

      const result = await transformer.transform(rawData);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Unusually large population');
    });
  });

  describe('validate', () => {
    it('should pass validation when database is accessible', async () => {
      const mockDataSource = createMockDataSource();
      const transformer = createPopulationTransformer(mockDataSource);

      const isValid = await transformer.validate();
      expect(isValid).toBe(true);
    });

    it('should fail validation when database query fails', async () => {
      const mockDataSource = {
        query: jest.fn().mockRejectedValue(new Error('Connection failed')),
      } as unknown as DataSource;

      const transformer = createPopulationTransformer(mockDataSource);

      const isValid = await transformer.validate();
      expect(isValid).toBe(false);
    });
  });
});
