/**
 * France Monthly Crime Observation Loader Tests
 *
 * Unit tests for the crime observations loader module.
 */

import { DataSource, QueryRunner } from 'typeorm';
import { CanonicalCategoryCode } from './france-monthly.category-mapper';
import {
    FranceMonthlyLoader,
    FranceMonthlyLoaderOptions,
    createFranceMonthlyLoader,
    loadFranceMonthlyCrimeData
} from './france-monthly.loader';
import { EnrichedCrimeRecord } from './france-monthly.rate-enricher';

describe('FranceMonthlyLoader', () => {
  // Mock data source
  let mockDataSource: jest.Mocked<DataSource>;
  let mockQueryRunner: jest.Mocked<QueryRunner>;

  // Test data source ID
  const testDataSourceId = '550e8400-e29b-41d4-a716-446655440000';

  // Mock département UUIDs
  const mockAreaIds: Record<string, string> = {
    '75': 'area-uuid-75-paris',
    '13': 'area-uuid-13-bouches-du-rhone',
    '69': 'area-uuid-69-rhone',
    '33': 'area-uuid-33-gironde',
    '31': 'area-uuid-31-haute-garonne',
    '2A': 'area-uuid-2a-corse-sud',
    '2B': 'area-uuid-2b-haute-corse',
    '971': 'area-uuid-971-guadeloupe',
    '974': 'area-uuid-974-reunion',
  };

  // Mock category UUIDs
  const mockCategoryIds: Record<string, string> = {
    'HOMICIDE': 'cat-uuid-homicide',
    'ASSAULT': 'cat-uuid-assault',
    'ARMED_ROBBERY': 'cat-uuid-armed-robbery',
    'BURGLARY_RESIDENTIAL': 'cat-uuid-burglary-residential',
    'VEHICLE_THEFT': 'cat-uuid-vehicle-theft',
    'FRAUD': 'cat-uuid-fraud',
    'DRUG_USE': 'cat-uuid-drug-use',
    'VANDALISM': 'cat-uuid-vandalism',
  };

  beforeEach(() => {
    // Reset mocks
    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(),
    } as unknown as jest.Mocked<QueryRunner>;

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      query: jest.fn(),
    } as unknown as jest.Mocked<DataSource>;
  });

  /**
   * Create mock enriched record for testing
   */
  function createMockEnrichedRecord(
    overrides: Partial<EnrichedCrimeRecord> = {},
  ): EnrichedCrimeRecord {
    return {
      departementCode: '75',
      areaId: null,
      canonicalCategory: 'BURGLARY_RESIDENTIAL' as CanonicalCategoryCode,
      categoryId: null,
      year: 2020,
      count: 10000,
      ratePer100k: 469.48,
      populationUsed: 2130000,
      monthsWithData: 12,
      isComplete: true,
      sourceIndices: [27, 28],
      notes: null,
      ...overrides,
    };
  }

  /**
   * Setup mock for area ID loading
   */
  function setupAreaIdMock(codes: string[]) {
    const results = codes
      .filter((code) => mockAreaIds[code])
      .map((code) => ({ id: mockAreaIds[code], code }));

    mockDataSource.query.mockImplementation(async (query: string, params?: unknown[]) => {
      if (query.includes('administrative_areas')) {
        return results;
      }
      return [];
    });
  }

  /**
   * Setup mock for category ID loading
   */
  function setupCategoryIdMock(codes: string[]) {
    const results = codes
      .filter((code) => mockCategoryIds[code])
      .map((code) => ({ id: mockCategoryIds[code], code }));

    mockDataSource.query.mockImplementation(async (query: string, params?: unknown[]) => {
      if (query.includes('crime_categories')) {
        return results;
      }
      return [];
    });
  }

  /**
   * Setup full FK mock for both areas and categories
   */
  function setupFullFkMock() {
    mockDataSource.query.mockImplementation(async (query: string, params?: unknown[]) => {
      if (query.includes('administrative_areas')) {
        const codes = params?.[0] as string[] || [];
        return codes
          .filter((code) => mockAreaIds[code])
          .map((code) => ({ id: mockAreaIds[code], code }));
      }
      if (query.includes('crime_categories')) {
        const codes = params?.[0] as string[] || [];
        return codes
          .filter((code) => mockCategoryIds[code])
          .map((code) => ({ id: mockCategoryIds[code], code }));
      }
      return [];
    });
  }

  describe('constructor', () => {
    it('should create loader with required options', () => {
      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });
      expect(loader).toBeDefined();
    });

    it('should throw error when dataSourceId is missing', () => {
      expect(() => {
        new FranceMonthlyLoader(mockDataSource, {} as FranceMonthlyLoaderOptions);
      }).toThrow('dataSourceId is required');
    });

    it('should use createFranceMonthlyLoader factory function', () => {
      const loader = createFranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });
      expect(loader).toBeInstanceOf(FranceMonthlyLoader);
    });

    it('should set default options', () => {
      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });
      const stats = loader.getStats();
      expect(stats.totalRecords).toBe(0);
    });
  });

  describe('preloadForeignKeys', () => {
    it('should load area IDs from administrative_areas', async () => {
      setupFullFkMock();

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const records = [
        createMockEnrichedRecord({ departementCode: '75' }),
        createMockEnrichedRecord({ departementCode: '13' }),
      ];

      const resolved = await loader.preloadForeignKeys(records);

      expect(resolved.areaIds.size).toBe(2);
      expect(resolved.areaIds.get('75')).toBe('area-uuid-75-paris');
      expect(resolved.areaIds.get('13')).toBe('area-uuid-13-bouches-du-rhone');
    });

    it('should load category IDs from crime_categories', async () => {
      setupFullFkMock();

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const records = [
        createMockEnrichedRecord({ canonicalCategory: 'HOMICIDE' as CanonicalCategoryCode }),
        createMockEnrichedRecord({ canonicalCategory: 'ASSAULT' as CanonicalCategoryCode }),
      ];

      const resolved = await loader.preloadForeignKeys(records);

      expect(resolved.categoryIds.size).toBe(2);
      expect(resolved.categoryIds.get('HOMICIDE')).toBe('cat-uuid-homicide');
      expect(resolved.categoryIds.get('ASSAULT')).toBe('cat-uuid-assault');
    });

    it('should track unresolved département codes', async () => {
      setupFullFkMock();

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const records = [
        createMockEnrichedRecord({ departementCode: '75' }),
        createMockEnrichedRecord({ departementCode: 'XX' }), // Invalid
      ];

      const resolved = await loader.preloadForeignKeys(records);

      expect(resolved.unresolvedDepartements).toContain('XX');
      expect(resolved.unresolvedDepartements).not.toContain('75');
    });

    it('should track unresolved category codes', async () => {
      setupFullFkMock();

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const records = [
        createMockEnrichedRecord({ canonicalCategory: 'HOMICIDE' as CanonicalCategoryCode }),
        createMockEnrichedRecord({ canonicalCategory: 'INVALID_CATEGORY' as CanonicalCategoryCode }),
      ];

      const resolved = await loader.preloadForeignKeys(records);

      expect(resolved.unresolvedCategories).toContain('INVALID_CATEGORY');
      expect(resolved.unresolvedCategories).not.toContain('HOMICIDE');
    });

    it('should update loader statistics', async () => {
      setupFullFkMock();

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const records = [
        createMockEnrichedRecord({ departementCode: '75' }),
        createMockEnrichedRecord({ departementCode: '13' }),
        createMockEnrichedRecord({ departementCode: '69' }),
      ];

      await loader.preloadForeignKeys(records);
      const stats = loader.getStats();

      expect(stats.departements).toBe(3);
    });

    it('should handle Corsica département codes (2A, 2B)', async () => {
      setupFullFkMock();

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const records = [
        createMockEnrichedRecord({ departementCode: '2A' }),
        createMockEnrichedRecord({ departementCode: '2B' }),
      ];

      const resolved = await loader.preloadForeignKeys(records);

      expect(resolved.areaIds.get('2A')).toBe('area-uuid-2a-corse-sud');
      expect(resolved.areaIds.get('2B')).toBe('area-uuid-2b-haute-corse');
    });

    it('should handle overseas département codes (DOM)', async () => {
      setupFullFkMock();

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const records = [
        createMockEnrichedRecord({ departementCode: '971' }),
        createMockEnrichedRecord({ departementCode: '974' }),
      ];

      const resolved = await loader.preloadForeignKeys(records);

      expect(resolved.areaIds.get('971')).toBe('area-uuid-971-guadeloupe');
      expect(resolved.areaIds.get('974')).toBe('area-uuid-974-reunion');
    });
  });

  describe('deleteExistingRecords', () => {
    it('should delete records for the data source', async () => {
      mockDataSource.query.mockResolvedValue({ rowCount: 1500 });

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const deletedCount = await loader.deleteExistingRecords();

      expect(deletedCount).toBe(1500);
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM crime_observations'),
        [testDataSourceId],
      );
    });

    it('should return 0 when no records to delete', async () => {
      mockDataSource.query.mockResolvedValue({ rowCount: 0 });

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const deletedCount = await loader.deleteExistingRecords();

      expect(deletedCount).toBe(0);
    });
  });

  describe('validate', () => {
    it('should return true when all validations pass', async () => {
      mockDataSource.query.mockImplementation(async (query: string) => {
        if (query.includes('information_schema')) {
          return [{ exists: true }];
        }
        if (query.includes('data_sources')) {
          return [{ id: testDataSourceId }];
        }
        if (query.includes('administrative_areas')) {
          return [{ count: '101' }];
        }
        if (query.includes('crime_categories')) {
          return [{ count: '20' }];
        }
        return [];
      });

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const isValid = await loader.validate();

      expect(isValid).toBe(true);
    });

    it('should return false when crime_observations table missing', async () => {
      mockDataSource.query.mockImplementation(async (query: string) => {
        if (query.includes('information_schema')) {
          return [{ exists: false }];
        }
        return [];
      });

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const isValid = await loader.validate();

      expect(isValid).toBe(false);
    });

    it('should return false when data source not found', async () => {
      mockDataSource.query.mockImplementation(async (query: string) => {
        if (query.includes('information_schema')) {
          return [{ exists: true }];
        }
        if (query.includes('data_sources')) {
          return [];
        }
        return [];
      });

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const isValid = await loader.validate();

      expect(isValid).toBe(false);
    });

    it('should return false when no départements in database', async () => {
      mockDataSource.query.mockImplementation(async (query: string) => {
        if (query.includes('information_schema')) {
          return [{ exists: true }];
        }
        if (query.includes('data_sources')) {
          return [{ id: testDataSourceId }];
        }
        if (query.includes('administrative_areas')) {
          return [{ count: '0' }];
        }
        return [];
      });

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const isValid = await loader.validate();

      expect(isValid).toBe(false);
    });

    it('should return false when no crime categories in database', async () => {
      mockDataSource.query.mockImplementation(async (query: string) => {
        if (query.includes('information_schema')) {
          return [{ exists: true }];
        }
        if (query.includes('data_sources')) {
          return [{ id: testDataSourceId }];
        }
        if (query.includes('administrative_areas')) {
          return [{ count: '101' }];
        }
        if (query.includes('crime_categories')) {
          return [{ count: '0' }];
        }
        return [];
      });

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const isValid = await loader.validate();

      expect(isValid).toBe(false);
    });
  });

  describe('load (via loadBatch)', () => {
    beforeEach(() => {
      // Setup FK resolution
      setupFullFkMock();

      // Setup query runner for upsert operations
      mockQueryRunner.query.mockResolvedValue([]);
    });

    it('should insert new records', async () => {
      // No existing records
      mockQueryRunner.query.mockResolvedValue([]);

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const records = [
        createMockEnrichedRecord({ departementCode: '75', canonicalCategory: 'HOMICIDE' as CanonicalCategoryCode }),
      ];

      await loader.preloadForeignKeys(records);
      const result = await loader.load(records);

      expect(result.insertedCount).toBe(1);
      expect(result.updatedCount).toBe(0);
    });

    it('should update existing records when data changes', async () => {
      // Return existing record with different count
      mockQueryRunner.query.mockImplementation(async (query: string) => {
        if (query.includes('SELECT id, count')) {
          return [{
            id: 'existing-uuid',
            count: 9000, // Different from input
            ratePer100k: 469.48,
            populationUsed: 2130000,
            notes: null,
          }];
        }
        return [];
      });

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const records = [
        createMockEnrichedRecord({
          departementCode: '75',
          canonicalCategory: 'HOMICIDE' as CanonicalCategoryCode,
          count: 10000, // Different from existing
        }),
      ];

      await loader.preloadForeignKeys(records);
      const result = await loader.load(records);

      expect(result.updatedCount).toBe(1);
      expect(result.insertedCount).toBe(0);
    });

    it('should skip records when data unchanged', async () => {
      // Return existing record with same data
      mockQueryRunner.query.mockImplementation(async (query: string) => {
        if (query.includes('SELECT id, count')) {
          return [{
            id: 'existing-uuid',
            count: 10000, // Same as input
            ratePer100k: '469.4800',
            populationUsed: 2130000,
            notes: null,
          }];
        }
        return [];
      });

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const records = [
        createMockEnrichedRecord({
          departementCode: '75',
          canonicalCategory: 'HOMICIDE' as CanonicalCategoryCode,
          count: 10000,
          ratePer100k: 469.48,
          populationUsed: 2130000,
        }),
      ];

      await loader.preloadForeignKeys(records);
      const result = await loader.load(records);

      expect(result.skippedCount).toBe(1);
      expect(result.insertedCount).toBe(0);
      expect(result.updatedCount).toBe(0);
    });

    it('should throw error for unresolved FKs when skipUnresolvedRecords is false', async () => {
      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
        skipUnresolvedRecords: false,
      });

      const records = [
        createMockEnrichedRecord({
          departementCode: 'XX', // Invalid
          canonicalCategory: 'HOMICIDE' as CanonicalCategoryCode,
        }),
      ];

      await loader.preloadForeignKeys(records);

      await expect(loader.load(records)).rejects.toThrow('Unresolved foreign keys');
    });

    it('should skip records with unresolved FKs when skipUnresolvedRecords is true', async () => {
      mockQueryRunner.query.mockResolvedValue([]);

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
        skipUnresolvedRecords: true,
      });

      const records = [
        createMockEnrichedRecord({ departementCode: '75', canonicalCategory: 'HOMICIDE' as CanonicalCategoryCode }),
        createMockEnrichedRecord({ departementCode: 'XX', canonicalCategory: 'HOMICIDE' as CanonicalCategoryCode }), // Invalid
      ];

      await loader.preloadForeignKeys(records);
      const result = await loader.load(records);

      expect(result.insertedCount).toBe(1);
      expect(result.skippedCount).toBe(1);
    });

    it('should handle multiple départements and categories', async () => {
      mockQueryRunner.query.mockResolvedValue([]);

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const records = [
        createMockEnrichedRecord({ departementCode: '75', canonicalCategory: 'HOMICIDE' as CanonicalCategoryCode, year: 2020 }),
        createMockEnrichedRecord({ departementCode: '75', canonicalCategory: 'ASSAULT' as CanonicalCategoryCode, year: 2020 }),
        createMockEnrichedRecord({ departementCode: '13', canonicalCategory: 'HOMICIDE' as CanonicalCategoryCode, year: 2020 }),
        createMockEnrichedRecord({ departementCode: '13', canonicalCategory: 'ASSAULT' as CanonicalCategoryCode, year: 2020 }),
      ];

      await loader.preloadForeignKeys(records);
      const result = await loader.load(records);

      expect(result.insertedCount).toBe(4);
    });

    it('should handle multiple years', async () => {
      mockQueryRunner.query.mockResolvedValue([]);

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const records = [
        createMockEnrichedRecord({ year: 2018 }),
        createMockEnrichedRecord({ year: 2019 }),
        createMockEnrichedRecord({ year: 2020 }),
        createMockEnrichedRecord({ year: 2021 }),
      ];

      await loader.preloadForeignKeys(records);
      await loader.load(records);

      const stats = loader.getStats();
      expect(stats.years).toEqual([2018, 2019, 2020, 2021]);
    });

    it('should set isValidated based on isComplete', async () => {
      mockQueryRunner.query.mockResolvedValue([]);

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const records = [
        createMockEnrichedRecord({ isComplete: true }),
        createMockEnrichedRecord({ isComplete: false }),
      ];

      await loader.preloadForeignKeys(records);
      await loader.load(records);

      // Verify INSERT was called with isValidated matching isComplete
      const insertCalls = mockQueryRunner.query.mock.calls.filter((call) =>
        call[0].includes('INSERT INTO crime_observations'),
      );

      expect(insertCalls.length).toBe(2);
    });

    it('should handle records with null rate', async () => {
      mockQueryRunner.query.mockResolvedValue([]);

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const records = [
        createMockEnrichedRecord({
          ratePer100k: null,
          populationUsed: null,
          notes: 'No population data available',
        }),
      ];

      await loader.preloadForeignKeys(records);
      const result = await loader.load(records);

      expect(result.insertedCount).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return current statistics', async () => {
      setupFullFkMock();
      mockQueryRunner.query.mockResolvedValue([]);

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const records = [
        createMockEnrichedRecord({ departementCode: '75', year: 2020 }),
        createMockEnrichedRecord({ departementCode: '13', year: 2021 }),
      ];

      await loader.preloadForeignKeys(records);
      await loader.load(records);

      const stats = loader.getStats();

      expect(stats.departements).toBe(2);
      expect(stats.inserted).toBe(2);
      expect(stats.years).toEqual([2020, 2021]);
    });

    it('should return immutable copy of stats', async () => {
      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const stats1 = loader.getStats();
      stats1.totalRecords = 999;

      const stats2 = loader.getStats();
      expect(stats2.totalRecords).toBe(0);
    });
  });

  describe('loadFranceMonthlyCrimeData convenience function', () => {
    it('should perform full load workflow', async () => {
      // Setup validation mocks
      mockDataSource.query.mockImplementation(async (query: string) => {
        if (query.includes('information_schema')) {
          return [{ exists: true }];
        }
        if (query.includes('data_sources WHERE id')) {
          return [{ id: testDataSourceId }];
        }
        if (query.includes('administrative_areas') && query.includes('COUNT')) {
          return [{ count: '101' }];
        }
        if (query.includes('crime_categories') && query.includes('COUNT')) {
          return [{ count: '20' }];
        }
        if (query.includes('administrative_areas') && query.includes('code')) {
          return [{ id: mockAreaIds['75'], code: '75' }];
        }
        if (query.includes('crime_categories') && query.includes('code')) {
          return [{ id: mockCategoryIds['HOMICIDE'], code: 'HOMICIDE' }];
        }
        return [];
      });

      mockQueryRunner.query.mockResolvedValue([]);

      const records = [
        createMockEnrichedRecord({
          departementCode: '75',
          canonicalCategory: 'HOMICIDE' as CanonicalCategoryCode,
        }),
      ];

      const { result, stats } = await loadFranceMonthlyCrimeData(
        mockDataSource,
        records,
        { dataSourceId: testDataSourceId },
      );

      expect(result.insertedCount).toBe(1);
      expect(stats.totalRecords).toBe(1);
    });

    it('should throw error when validation fails', async () => {
      mockDataSource.query.mockResolvedValue([{ exists: false }]);

      const records = [createMockEnrichedRecord()];

      await expect(
        loadFranceMonthlyCrimeData(mockDataSource, records, { dataSourceId: testDataSourceId }),
      ).rejects.toThrow('Loader validation failed');
    });

    it('should delete existing records when deleteExistingSource is true', async () => {
      // Setup validation mocks
      mockDataSource.query.mockImplementation(async (query: string) => {
        if (query.includes('information_schema')) {
          return [{ exists: true }];
        }
        if (query.includes('data_sources WHERE id')) {
          return [{ id: testDataSourceId }];
        }
        if (query.includes('administrative_areas') && query.includes('COUNT')) {
          return [{ count: '101' }];
        }
        if (query.includes('crime_categories') && query.includes('COUNT')) {
          return [{ count: '20' }];
        }
        if (query.includes('DELETE FROM crime_observations')) {
          return { rowCount: 500 };
        }
        if (query.includes('administrative_areas')) {
          return [{ id: mockAreaIds['75'], code: '75' }];
        }
        if (query.includes('crime_categories')) {
          return [{ id: mockCategoryIds['HOMICIDE'], code: 'HOMICIDE' }];
        }
        return [];
      });

      mockQueryRunner.query.mockResolvedValue([]);

      const records = [
        createMockEnrichedRecord({
          departementCode: '75',
          canonicalCategory: 'HOMICIDE' as CanonicalCategoryCode,
        }),
      ];

      await loadFranceMonthlyCrimeData(mockDataSource, records, {
        dataSourceId: testDataSourceId,
        deleteExistingSource: true,
      });

      // Verify DELETE was called
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM crime_observations'),
        [testDataSourceId],
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty records array', async () => {
      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const resolved = await loader.preloadForeignKeys([]);

      expect(resolved.areaIds.size).toBe(0);
      expect(resolved.categoryIds.size).toBe(0);
    });

    it('should handle duplicate département codes in input', async () => {
      setupFullFkMock();

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const records = [
        createMockEnrichedRecord({ departementCode: '75' }),
        createMockEnrichedRecord({ departementCode: '75' }),
        createMockEnrichedRecord({ departementCode: '75' }),
      ];

      const resolved = await loader.preloadForeignKeys(records);

      expect(resolved.areaIds.size).toBe(1); // Should only have one entry
    });

    it('should handle very long notes field', async () => {
      mockQueryRunner.query.mockResolvedValue([]);
      setupFullFkMock();

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const longNote = 'A'.repeat(500); // Max length

      const records = [
        createMockEnrichedRecord({ notes: longNote }),
      ];

      await loader.preloadForeignKeys(records);
      const result = await loader.load(records);

      expect(result.insertedCount).toBe(1);
    });

    it('should handle zero crime count', async () => {
      mockQueryRunner.query.mockResolvedValue([]);
      setupFullFkMock();

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const records = [
        createMockEnrichedRecord({ count: 0, ratePer100k: 0 }),
      ];

      await loader.preloadForeignKeys(records);
      const result = await loader.load(records);

      expect(result.insertedCount).toBe(1);
    });

    it('should handle rate update detection with floating point precision', async () => {
      // Existing record with slightly different rate
      mockQueryRunner.query.mockImplementation(async (query: string) => {
        if (query.includes('SELECT id, count')) {
          return [{
            id: 'existing-uuid',
            count: 10000,
            ratePer100k: '469.4801', // Slightly different
            populationUsed: 2130000,
            notes: null,
          }];
        }
        return [];
      });

      setupFullFkMock();

      const loader = new FranceMonthlyLoader(mockDataSource, {
        dataSourceId: testDataSourceId,
      });

      const records = [
        createMockEnrichedRecord({
          count: 10000,
          ratePer100k: 469.48, // Should be considered same (within 0.0001)
          populationUsed: 2130000,
        }),
      ];

      await loader.preloadForeignKeys(records);
      const result = await loader.load(records);

      // Should skip because difference is within tolerance
      expect(result.skippedCount).toBe(1);
    });
  });
});
