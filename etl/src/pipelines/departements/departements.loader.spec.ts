/**
 * Tests for French Département Geometry Loader
 */

import { DataSource, QueryRunner } from 'typeorm';
import {
    DepartementsLoader,
    createDepartementsLoader,
} from './departements.loader';
import { DepartementRecord } from './departements.types';

// Mock TypeORM
jest.mock('typeorm', () => {
  const actual = jest.requireActual('typeorm');
  return {
    ...actual,
    DataSource: jest.fn().mockImplementation(() => ({
      query: jest.fn(),
      createQueryRunner: jest.fn(),
    })),
  };
});

describe('DepartementsLoader', () => {
  let mockDataSource: jest.Mocked<DataSource>;
  let mockQueryRunner: jest.Mocked<QueryRunner>;

  const sampleRecords: DepartementRecord[] = [
    {
      code: '75',
      name: 'Paris',
      nameEn: null,
      level: 'department',
      parentCode: 'IDF',
      countryCode: 'FR',
      geometry: 'POLYGON((2.2 48.8, 2.4 48.8, 2.4 48.9, 2.2 48.9, 2.2 48.8))',
      geojson: {
        type: 'Polygon',
        coordinates: [[[2.2, 48.8], [2.4, 48.8], [2.4, 48.9], [2.2, 48.9], [2.2, 48.8]]],
      },
    },
    {
      code: '13',
      name: 'Bouches-du-Rhône',
      nameEn: null,
      level: 'department',
      parentCode: 'PAC',
      countryCode: 'FR',
      geometry: 'MULTIPOLYGON(((5 43.2, 5.5 43.2, 5.5 43.5, 5 43.5, 5 43.2)))',
      geojson: {
        type: 'MultiPolygon',
        coordinates: [[[[5.0, 43.2], [5.5, 43.2], [5.5, 43.5], [5.0, 43.5], [5.0, 43.2]]]],
      },
    },
  ];

  beforeEach(() => {
    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(),
    } as unknown as jest.Mocked<QueryRunner>;

    mockDataSource = {
      query: jest.fn(),
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as unknown as jest.Mocked<DataSource>;
  });

  describe('factory function', () => {
    it('should create loader with default options', () => {
      const loader = createDepartementsLoader(mockDataSource);
      expect(loader).toBeInstanceOf(DepartementsLoader);
    });

    it('should create loader with custom options', () => {
      const loader = createDepartementsLoader(mockDataSource, {
        srid: 2154, // Lambert-93
        batchSize: 100,
      });
      expect(loader).toBeInstanceOf(DepartementsLoader);
    });
  });

  describe('validate', () => {
    it('should return true when table and PostGIS exist', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([{ exists: true }])
        .mockResolvedValueOnce([{ postgis_version: '3.4' }]);

      const loader = createDepartementsLoader(mockDataSource);
      const isValid = await loader.validate();

      expect(isValid).toBe(true);
      expect(mockDataSource.query).toHaveBeenCalledTimes(2);
    });

    it('should return false when table does not exist', async () => {
      mockDataSource.query.mockResolvedValueOnce([{ exists: false }]);

      const loader = createDepartementsLoader(mockDataSource);
      const isValid = await loader.validate();

      expect(isValid).toBe(false);
    });

    it('should return false when PostGIS is not installed', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([{ exists: true }])
        .mockRejectedValueOnce(new Error('function postgis_version() does not exist'));

      const loader = createDepartementsLoader(mockDataSource);
      const isValid = await loader.validate();

      expect(isValid).toBe(false);
    });
  });

  describe('load', () => {
    beforeEach(() => {
      // Default: no existing records
      mockQueryRunner.query.mockImplementation((sql: string) => {
        if (sql.includes('SELECT id FROM administrative_areas')) {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });
    });

    it('should insert new records', async () => {
      const loader = createDepartementsLoader(mockDataSource);
      const result = await loader.load(sampleRecords);

      expect(result.insertedCount).toBe(2);
      expect(result.updatedCount).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should update existing records', async () => {
      mockQueryRunner.query.mockImplementation((sql: string) => {
        if (sql.includes('SELECT id FROM administrative_areas')) {
          return Promise.resolve([{ id: 'existing-id' }]);
        }
        return Promise.resolve([]);
      });

      const loader = createDepartementsLoader(mockDataSource);
      const result = await loader.load(sampleRecords);

      expect(result.updatedCount).toBe(2);
      expect(result.insertedCount).toBe(0);
    });

    it('should use correct SRID', async () => {
      const loader = createDepartementsLoader(mockDataSource, { srid: 2154 });
      await loader.load([sampleRecords[0]]);

      // Check that ST_GeomFromText was called with correct SRID
      const insertCall = mockQueryRunner.query.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO'),
      );
      expect(insertCall).toBeDefined();
      expect(insertCall![1]).toContain(2154);
    });

    it('should rollback on error', async () => {
      mockQueryRunner.query.mockRejectedValueOnce(new Error('Database error'));

      const loader = createDepartementsLoader(mockDataSource);

      await expect(loader.load(sampleRecords)).rejects.toThrow('Database error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should batch inserts according to batchSize', async () => {
      const manyRecords = Array(150)
        .fill(null)
        .map((_, i) => ({
          ...sampleRecords[0],
          code: String(i).padStart(2, '0'),
        }));

      const loader = createDepartementsLoader(mockDataSource, { batchSize: 50 });
      await loader.load(manyRecords);

      // Should process in batches
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCurrentCount', () => {
    it('should return count of départements', async () => {
      mockDataSource.query.mockResolvedValue([{ count: '96' }]);

      const loader = createDepartementsLoader(mockDataSource);
      const count = await loader.getCurrentCount();

      expect(count).toBe(96);
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining("level = 'department'"),
      );
    });
  });

  describe('deleteAll', () => {
    it('should delete all départements and return count', async () => {
      mockDataSource.query.mockResolvedValue([{ id: '1' }, { id: '2' }, { id: '3' }]);

      const loader = createDepartementsLoader(mockDataSource);
      const deleted = await loader.deleteAll();

      expect(deleted).toBe(3);
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM administrative_areas'),
      );
    });
  });
});
