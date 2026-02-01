/**
 * Tests for Population Pipeline
 */

import { DataSource } from 'typeorm';
import {
    PopulationPipeline,
    createPopulationPipeline,
} from './population.pipeline';
import { EXPECTED_POPULATION_RECORDS, POPULATION_YEAR_RANGE } from './population.types';

// Mock DataSource
const createMockDataSource = (
  departementCount = 101,
  existingPopulation: Array<{ areaId: string; year: number; populationCount: number }> = [],
) => {
  const mockAreas = Array.from({ length: departementCount }, (_, i) => ({
    id: `uuid-${String(i).padStart(2, '0')}`,
    code: i < 96 ? String(i + 1).padStart(2, '0') : String(970 + (i - 95)),
  }));

  // Handle Corsica codes
  if (departementCount >= 96) {
    mockAreas[19] = { id: 'uuid-2A', code: '2A' }; // Corse-du-Sud (index 19, no dept 20)
    mockAreas[20] = { id: 'uuid-2B', code: '2B' }; // Haute-Corse
  }

  const mockQueryRunner = {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockImplementation((sql: string, params?: unknown[]) => {
      if (sql.includes('SELECT id')) {
        return Promise.resolve([]);
      }
      if (sql.includes('UPDATE') || sql.includes('INSERT')) {
        return Promise.resolve({ rowCount: 1 });
      }
      return Promise.resolve([]);
    }),
  };

  return {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    query: jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('SELECT id, code')) {
        return Promise.resolve(mockAreas);
      }
      if (sql.includes('SELECT 1')) {
        return Promise.resolve([{ '?column?': 1 }]);
      }
      if (sql.includes('information_schema.tables')) {
        return Promise.resolve([{ exists: true }]);
      }
      if (sql.includes('COUNT(*) as count FROM administrative_areas')) {
        return Promise.resolve([{ count: String(departementCount) }]);
      }
      if (sql.includes('COUNT(*) as count FROM population')) {
        return Promise.resolve([{ count: String(existingPopulation.length) }]);
      }
      if (sql.includes('SELECT DISTINCT year')) {
        const years = [...new Set(existingPopulation.map(p => p.year))];
        return Promise.resolve(years.map(y => ({ year: y })));
      }
      if (sql.includes('a.code = \'75\'')) {
        const paris = existingPopulation.find(p => p.areaId.includes('75') && p.year === 2020);
        return Promise.resolve(paris ? [{ populationCount: paris.populationCount }] : []);
      }
      return Promise.resolve([]);
    }),
  } as unknown as DataSource;
};

describe('PopulationPipeline', () => {
  describe('createPopulationPipeline', () => {
    it('should create pipeline with default options', () => {
      const mockDataSource = createMockDataSource();
      const pipeline = createPopulationPipeline(mockDataSource);
      expect(pipeline).toBeInstanceOf(PopulationPipeline);
    });

    it('should create pipeline with custom options', () => {
      const mockDataSource = createMockDataSource();
      const pipeline = createPopulationPipeline(mockDataSource, {
        startYear: 2020,
        endYear: 2022,
        includeOverseas: false,
      });
      expect(pipeline).toBeInstanceOf(PopulationPipeline);
    });
  });

  describe('validate', () => {
    it('should pass validation when départements exist', async () => {
      const mockDataSource = createMockDataSource(101);
      const pipeline = createPopulationPipeline(mockDataSource);

      // Need to call initialize first
      await (pipeline as any).initialize();
      const isValid = await pipeline.validate();

      expect(isValid).toBe(true);
    });

    it('should fail validation when no départements exist', async () => {
      const mockDataSource = createMockDataSource(0);
      const pipeline = createPopulationPipeline(mockDataSource);

      await (pipeline as any).initialize();
      const isValid = await pipeline.validate();

      expect(isValid).toBe(false);
    });

    it('should fail validation when start year > end year', async () => {
      const mockDataSource = createMockDataSource(101);
      const pipeline = createPopulationPipeline(mockDataSource, {
        startYear: 2024,
        endYear: 2016,
      });

      await (pipeline as any).initialize();
      const isValid = await pipeline.validate();

      expect(isValid).toBe(false);
    });

    it('should warn when fewer départements than expected', async () => {
      const mockDataSource = createMockDataSource(50); // Less than expected
      const pipeline = createPopulationPipeline(mockDataSource);

      await (pipeline as any).initialize();
      
      // Should still be valid but with warning logged
      const isValid = await pipeline.validate();
      expect(isValid).toBe(true);
    });
  });

  describe('getSourceUrl', () => {
    it('should return INSEE URL', () => {
      const mockDataSource = createMockDataSource();
      const pipeline = createPopulationPipeline(mockDataSource);

      const sourceUrl = (pipeline as any).getSourceUrl();
      expect(sourceUrl).toContain('insee.fr');
    });
  });

  describe('setDataSourceId', () => {
    it('should set and get data source ID', () => {
      const mockDataSource = createMockDataSource();
      const pipeline = createPopulationPipeline(mockDataSource);

      pipeline.setDataSourceId('test-uuid');
      expect((pipeline as any).getDataSourceId()).toBe('test-uuid');
    });

    it('should return undefined when not set', () => {
      const mockDataSource = createMockDataSource();
      const pipeline = createPopulationPipeline(mockDataSource);

      expect((pipeline as any).getDataSourceId()).toBeUndefined();
    });
  });

  describe('postValidate', () => {
    it('should validate loaded data', async () => {
      const existingData = Array.from({ length: EXPECTED_POPULATION_RECORDS.totalRecords }, (_, i) => ({
        areaId: `uuid-${i}`,
        year: POPULATION_YEAR_RANGE.start + Math.floor(i / 101),
        populationCount: 1000000,
      }));

      const mockDataSource = createMockDataSource(101, existingData);
      const pipeline = createPopulationPipeline(mockDataSource);

      const result = await pipeline.postValidate();

      expect(result.valid).toBe(true);
    });

    it('should warn about missing years', async () => {
      // Only 2020 data
      const existingData = Array.from({ length: 101 }, (_, i) => ({
        areaId: `uuid-${i}`,
        year: 2020,
        populationCount: 1000000,
      }));

      const mockDataSource = createMockDataSource(101, existingData);
      const pipeline = createPopulationPipeline(mockDataSource);

      const result = await pipeline.postValidate();

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('Missing population data for year'))).toBe(true);
    });
  });

  describe('pipeline metadata', () => {
    it('should have correct name', () => {
      const mockDataSource = createMockDataSource();
      const pipeline = createPopulationPipeline(mockDataSource);

      expect((pipeline as any).name).toBe('population');
    });

    it('should use default year range from constants', () => {
      const mockDataSource = createMockDataSource();
      const pipeline = createPopulationPipeline(mockDataSource);

      const options = (pipeline as any).pipelineOptions;
      expect(options.startYear).toBe(POPULATION_YEAR_RANGE.start);
      expect(options.endYear).toBe(POPULATION_YEAR_RANGE.end);
    });

    it('should include overseas by default', () => {
      const mockDataSource = createMockDataSource();
      const pipeline = createPopulationPipeline(mockDataSource);

      const options = (pipeline as any).pipelineOptions;
      expect(options.includeOverseas).toBe(true);
    });
  });
});
