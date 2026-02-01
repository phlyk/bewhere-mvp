/**
 * Tests for French Département Geometry Pipeline
 */

import { DataSource } from 'typeorm';
import {
    areDepartementsLoaded,
    DepartementsPipeline,
    runDepartementsPipeline,
} from './departements.pipeline';
import { EXPECTED_DEPARTEMENT_COUNT } from './departements.types';

// Mock dependencies
jest.mock('../../utils/download', () => ({
  downloadFile: jest.fn().mockResolvedValue({
    filePath: '/cache/test.geojson',
    fromCache: true,
    size: 1000,
    downloadMs: 0,
  }),
}));

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn().mockReturnValue(
    JSON.stringify({
      type: 'FeatureCollection',
      features: Array(101)
        .fill(null)
        .map((_, i) => ({
          type: 'Feature',
          properties: {
            code: i < 96 ? String(i + 1).padStart(2, '0') : `97${i - 95}`,
            nom: `Département ${i + 1}`,
            region: '11',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
          },
        })),
    }),
  ),
  existsSync: jest.fn().mockReturnValue(true),
}));

describe('DepartementsPipeline', () => {
  let mockDataSource: jest.Mocked<DataSource>;
  let mockQueryRunner: any;

  beforeEach(() => {
    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([]),
    };

    mockDataSource = {
      query: jest.fn().mockImplementation((sql: string) => {
        if (sql.includes('information_schema.tables')) {
          return Promise.resolve([{ exists: true }]);
        }
        if (sql.includes('PostGIS_Version')) {
          return Promise.resolve([{ postgis_version: '3.4' }]);
        }
        if (sql.includes('COUNT(*)')) {
          return Promise.resolve([{ count: '101' }]);
        }
        return Promise.resolve([]);
      }),
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as unknown as jest.Mocked<DataSource>;
  });

  describe('constructor', () => {
    it('should create pipeline with default options', () => {
      const pipeline = new DepartementsPipeline(mockDataSource);
      expect(pipeline).toBeInstanceOf(DepartementsPipeline);
    });

    it('should create pipeline with custom options', () => {
      const pipeline = new DepartementsPipeline(mockDataSource, {
        source: 'https://example.com/custom.geojson',
        includeOverseas: false,
      });
      expect(pipeline).toBeInstanceOf(DepartementsPipeline);
    });
  });

  describe('run', () => {
    it('should complete successfully with valid data', async () => {
      const pipeline = new DepartementsPipeline(mockDataSource);
      const result = await pipeline.run({ dryRun: true });

      expect(result.status).toBe('completed');
      expect(result.name).toBe('departements');
      expect(result.stats.rowsExtracted).toBe(101);
      expect(result.stats.rowsTransformed).toBe(101);
    });

    it('should run in dry run mode (no loading)', async () => {
      const pipeline = new DepartementsPipeline(mockDataSource);
      const result = await pipeline.run({ dryRun: true });

      expect(result.stats.rowsLoaded).toBe(0);
      expect(mockQueryRunner.query).not.toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO'),
        expect.anything(),
      );
    });

    it('should load data when not in dry run mode', async () => {
      const pipeline = new DepartementsPipeline(mockDataSource);
      const result = await pipeline.run({ dryRun: false });

      expect(result.stats.rowsLoaded).toBeGreaterThan(0);
    });

    it('should handle deleteExisting option', async () => {
      mockDataSource.query.mockImplementation((sql: string) => {
        if (sql.includes('DELETE FROM')) {
          return Promise.resolve([{ id: '1' }, { id: '2' }]);
        }
        if (sql.includes('information_schema.tables')) {
          return Promise.resolve([{ exists: true }]);
        }
        if (sql.includes('PostGIS_Version')) {
          return Promise.resolve([{ postgis_version: '3.4' }]);
        }
        if (sql.includes('COUNT(*)')) {
          return Promise.resolve([{ count: '101' }]);
        }
        return Promise.resolve([]);
      });

      const pipeline = new DepartementsPipeline(mockDataSource, {
        deleteExisting: true,
      });
      await pipeline.run({ dryRun: true });

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM administrative_areas'),
      );
    });

    it('should return timing information', async () => {
      const pipeline = new DepartementsPipeline(mockDataSource);
      const result = await pipeline.run({ dryRun: true });

      expect(result.startedAt).toBeInstanceOf(Date);
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('runDepartementsPipeline factory', () => {
    it('should create and run pipeline', async () => {
      const result = await runDepartementsPipeline(mockDataSource, { dryRun: true });

      expect(result.status).toBe('completed');
      expect(result.name).toBe('departements');
    });
  });

  describe('areDepartementsLoaded', () => {
    it('should return true when enough départements exist', async () => {
      mockDataSource.query.mockResolvedValue([{ count: '96' }]);

      const loaded = await areDepartementsLoaded(mockDataSource);

      expect(loaded).toBe(true);
    });

    it('should return false when not enough départements exist', async () => {
      mockDataSource.query.mockResolvedValue([{ count: '50' }]);

      const loaded = await areDepartementsLoaded(mockDataSource);

      expect(loaded).toBe(false);
    });

    it('should return false on database error', async () => {
      mockDataSource.query.mockRejectedValue(new Error('DB error'));

      const loaded = await areDepartementsLoaded(mockDataSource);

      expect(loaded).toBe(false);
    });
  });

  describe('EXPECTED_DEPARTEMENT_COUNT', () => {
    it('should have correct values', () => {
      expect(EXPECTED_DEPARTEMENT_COUNT.metropolitan).toBe(96);
      expect(EXPECTED_DEPARTEMENT_COUNT.overseas).toBe(5);
      expect(EXPECTED_DEPARTEMENT_COUNT.total).toBe(101);
    });
  });
});
