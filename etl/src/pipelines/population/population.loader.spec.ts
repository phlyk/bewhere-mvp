/**
 * Tests for Population Loader
 */

import { DataSource, QueryRunner } from 'typeorm';
import {
    PopulationLoader,
    createPopulationLoader,
} from './population.loader';
import { PopulationRecord } from './population.types';

// Mock QueryRunner
const createMockQueryRunner = (existingRecords: Array<{ id: string; populationCount: number }> = []) => {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockImplementation((sql: string, params?: unknown[]) => {
      if (sql.includes('SELECT id')) {
        // Check if record exists (for upsert logic)
        const areaId = params?.[0];
        const year = params?.[1];
        const existing = existingRecords.find(
          r => r.id === `${areaId}-${year}`
        );
        return Promise.resolve(existing ? [existing] : []);
      }
      if (sql.includes('UPDATE') || sql.includes('INSERT')) {
        return Promise.resolve({ rowCount: 1 });
      }
      if (sql.includes('DELETE')) {
        return Promise.resolve({ rowCount: existingRecords.length });
      }
      return Promise.resolve([]);
    }),
  } as unknown as QueryRunner;
};

// Mock DataSource
const createMockDataSource = (queryRunner?: QueryRunner) => {
  const mockQr = queryRunner || createMockQueryRunner();
  return {
    createQueryRunner: jest.fn().mockReturnValue(mockQr),
    query: jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('information_schema.tables')) {
        return Promise.resolve([{ exists: true }]);
      }
      return Promise.resolve([]);
    }),
  } as unknown as DataSource;
};

describe('PopulationLoader', () => {
  describe('createPopulationLoader', () => {
    it('should create loader with default options', () => {
      const mockDataSource = createMockDataSource();
      const loader = createPopulationLoader(mockDataSource);
      expect(loader).toBeInstanceOf(PopulationLoader);
    });

    it('should create loader with custom options', () => {
      const mockDataSource = createMockDataSource();
      const loader = createPopulationLoader(mockDataSource, {
        batchSize: 100,
        upsert: false,
      });
      expect(loader).toBeInstanceOf(PopulationLoader);
    });
  });

  describe('load', () => {
    it('should insert new records', async () => {
      const mockDataSource = createMockDataSource();
      const loader = createPopulationLoader(mockDataSource);

      const data: PopulationRecord[] = [
        {
          areaId: 'uuid-75',
          code: '75',
          year: 2020,
          populationCount: 2130000,
          source: 'INSEE',
          notes: 'Test',
        },
        {
          areaId: 'uuid-13',
          code: '13',
          year: 2020,
          populationCount: 2051000,
          source: 'INSEE',
          notes: 'Test',
        },
      ];

      const result = await loader.load(data);

      expect(result.insertedCount).toBe(2);
      expect(result.updatedCount).toBe(0);
      expect(result.skippedCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should update existing records with different values', async () => {
      const existingRecords = [
        { id: 'uuid-75-2020', populationCount: 2100000 }, // Different value
      ];
      const mockQr = createMockQueryRunner(existingRecords);
      const mockDataSource = createMockDataSource(mockQr);
      const loader = createPopulationLoader(mockDataSource);

      const data: PopulationRecord[] = [
        {
          areaId: 'uuid-75',
          code: '75',
          year: 2020,
          populationCount: 2130000, // Updated value
          source: 'INSEE',
          notes: 'Test',
        },
      ];

      const result = await loader.load(data);

      expect(result.updatedCount).toBe(1);
      expect(result.insertedCount).toBe(0);
    });

    it('should skip existing records with same values', async () => {
      const existingRecords = [
        { id: 'uuid-75-2020', populationCount: 2130000 }, // Same value
      ];
      const mockQr = createMockQueryRunner(existingRecords);
      const mockDataSource = createMockDataSource(mockQr);
      const loader = createPopulationLoader(mockDataSource);

      const data: PopulationRecord[] = [
        {
          areaId: 'uuid-75',
          code: '75',
          year: 2020,
          populationCount: 2130000, // Same value
          source: 'INSEE',
          notes: 'Test',
        },
      ];

      const result = await loader.load(data);

      expect(result.skippedCount).toBe(1);
      expect(result.insertedCount).toBe(0);
      expect(result.updatedCount).toBe(0);
    });

    it('should use transactions by default', async () => {
      const mockQr = createMockQueryRunner();
      const mockDataSource = createMockDataSource(mockQr);
      const loader = createPopulationLoader(mockDataSource);

      const data: PopulationRecord[] = [
        {
          areaId: 'uuid-75',
          code: '75',
          year: 2020,
          populationCount: 2130000,
          source: 'INSEE',
          notes: 'Test',
        },
      ];

      await loader.load(data);

      expect(mockQr.startTransaction).toHaveBeenCalled();
      expect(mockQr.commitTransaction).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const mockQr = createMockQueryRunner();
      (mockQr.query as jest.Mock).mockRejectedValueOnce(new Error('DB Error'));
      const mockDataSource = createMockDataSource(mockQr);
      const loader = createPopulationLoader(mockDataSource);

      const data: PopulationRecord[] = [
        {
          areaId: 'uuid-75',
          code: '75',
          year: 2020,
          populationCount: 2130000,
          source: 'INSEE',
          notes: 'Test',
        },
      ];

      await expect(loader.load(data)).rejects.toThrow('DB Error');
      expect(mockQr.rollbackTransaction).toHaveBeenCalled();
    });

    it('should process records in batches', async () => {
      const mockDataSource = createMockDataSource();
      const loader = createPopulationLoader(mockDataSource, { batchSize: 2 });

      // Create 5 records to test batching (2 + 2 + 1)
      const data: PopulationRecord[] = Array.from({ length: 5 }, (_, i) => ({
        areaId: `uuid-${i}`,
        code: String(i).padStart(2, '0'),
        year: 2020,
        populationCount: 1000000 + i * 10000,
        source: 'INSEE',
        notes: 'Test',
      }));

      const result = await loader.load(data);

      expect(result.insertedCount).toBe(5);
    });

    it('should calculate duration', async () => {
      const mockDataSource = createMockDataSource();
      const loader = createPopulationLoader(mockDataSource);

      const data: PopulationRecord[] = [
        {
          areaId: 'uuid-75',
          code: '75',
          year: 2020,
          populationCount: 2130000,
          source: 'INSEE',
          notes: 'Test',
        },
      ];

      const result = await loader.load(data);

      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('deleteBySource', () => {
    it('should delete records by source', async () => {
      const existingRecords = [
        { id: '1', populationCount: 1000000 },
        { id: '2', populationCount: 2000000 },
      ];
      const mockDataSource = createMockDataSource(createMockQueryRunner(existingRecords));
      const loader = createPopulationLoader(mockDataSource);

      const deletedCount = await loader.deleteBySource('INSEE');

      expect(deletedCount).toBe(existingRecords.length);
    });
  });

  describe('validate', () => {
    it('should pass validation when population table exists', async () => {
      const mockDataSource = createMockDataSource();
      const loader = createPopulationLoader(mockDataSource);

      const isValid = await loader.validate();
      expect(isValid).toBe(true);
    });

    it('should fail validation when population table does not exist', async () => {
      const mockDataSource = {
        createQueryRunner: jest.fn(),
        query: jest.fn().mockResolvedValue([{ exists: false }]),
      } as unknown as DataSource;

      const loader = createPopulationLoader(mockDataSource);

      const isValid = await loader.validate();
      expect(isValid).toBe(false);
    });
  });
});
