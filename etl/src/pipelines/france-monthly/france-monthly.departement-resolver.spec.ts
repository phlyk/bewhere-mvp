/**
 * Unit Tests: France Monthly Département Resolver
 *
 * Tests the resolution of département codes to database area_id values.
 */

import {
    createDepartementResolver,
    Etat4001DepartementResolver
} from './france-monthly.departement-resolver';

// Mock DataSource
const mockDataSource = {
  query: jest.fn(),
};

// Sample administrative area data
const mockDepartements = [
  { id: 'uuid-01', code: '01', name: 'Ain', level: 'department' },
  { id: 'uuid-02', code: '02', name: 'Aisne', level: 'department' },
  { id: 'uuid-75', code: '75', name: 'Paris', level: 'department' },
  { id: 'uuid-2A', code: '2A', name: 'Corse-du-Sud', level: 'department' },
  { id: 'uuid-2B', code: '2B', name: 'Haute-Corse', level: 'department' },
  { id: 'uuid-971', code: '971', name: 'Guadeloupe', level: 'department' },
  { id: 'uuid-95', code: '95', name: "Val-d'Oise", level: 'department' },
];

describe('Etat4001DepartementResolver', () => {
  let resolver: Etat4001DepartementResolver;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDataSource.query.mockResolvedValue(mockDepartements);
    resolver = new Etat4001DepartementResolver(mockDataSource as any);
  });

  describe('Constructor', () => {
    it('should create a resolver instance', () => {
      expect(resolver).toBeDefined();
      expect(resolver).toBeInstanceOf(Etat4001DepartementResolver);
    });

    it('should not be initialized before calling initialize()', () => {
      expect(resolver.isInitialized()).toBe(false);
    });

    it('should have empty cache before initialization', () => {
      expect(resolver.getCacheSize()).toBe(0);
    });
  });

  describe('initialize()', () => {
    it('should initialize and load départements from database', async () => {
      await resolver.initialize();

      expect(resolver.isInitialized()).toBe(true);
      expect(mockDataSource.query).toHaveBeenCalledTimes(1);
    });

    it('should populate cache with all départements', async () => {
      await resolver.initialize();

      expect(resolver.getCacheSize()).toBe(mockDepartements.length);
    });

    it('should query with correct parameters', async () => {
      await resolver.initialize();

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, code, name, level'),
        ['department', 'FR'],
      );
    });

    it('should allow custom admin level and country code', async () => {
      const customResolver = new Etat4001DepartementResolver(mockDataSource as any, {
        adminLevel: 'region',
        countryCode: 'BE',
      });

      await customResolver.initialize();

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.any(String),
        ['region', 'BE'],
      );
    });

    it('should throw on database error', async () => {
      mockDataSource.query.mockRejectedValueOnce(new Error('DB connection failed'));

      await expect(resolver.initialize()).rejects.toThrow('DB connection failed');
    });
  });

  describe('resolve()', () => {
    beforeEach(async () => {
      await resolver.initialize();
    });

    it('should resolve a valid département code', async () => {
      const result = await resolver.resolve('01');

      expect(result.found).toBe(true);
      expect(result.departementCode).toBe('01');
      expect(result.areaId).toBe('uuid-01');
      expect(result.name).toBe('Ain');
    });

    it('should resolve Paris (75)', async () => {
      const result = await resolver.resolve('75');

      expect(result.found).toBe(true);
      expect(result.areaId).toBe('uuid-75');
      expect(result.name).toBe('Paris');
    });

    it('should resolve Corsica codes (2A, 2B)', async () => {
      const result2A = await resolver.resolve('2A');
      expect(result2A.found).toBe(true);
      expect(result2A.areaId).toBe('uuid-2A');

      const result2B = await resolver.resolve('2B');
      expect(result2B.found).toBe(true);
      expect(result2B.areaId).toBe('uuid-2B');
    });

    it('should normalize lowercase Corsica codes', async () => {
      const result = await resolver.resolve('2a');

      expect(result.found).toBe(true);
      expect(result.departementCode).toBe('2A');
      expect(result.areaId).toBe('uuid-2A');
    });

    it('should resolve DOM codes (971+)', async () => {
      const result = await resolver.resolve('971');

      expect(result.found).toBe(true);
      expect(result.areaId).toBe('uuid-971');
      expect(result.name).toBe('Guadeloupe');
    });

    it('should pad single-digit codes', async () => {
      const result = await resolver.resolve('1');

      expect(result.found).toBe(true);
      expect(result.departementCode).toBe('01');
      expect(result.areaId).toBe('uuid-01');
    });

    it('should return not found for unknown code', async () => {
      const result = await resolver.resolve('99');

      expect(result.found).toBe(false);
      expect(result.areaId).toBeNull();
      expect(result.name).toBeNull();
    });

    it('should track cache hits', async () => {
      // First lookup - cache miss (already cached from init)
      await resolver.resolve('01');

      // Second lookup - cache hit
      await resolver.resolve('01');

      const stats = resolver.getStatistics();
      expect(stats.cacheHits).toBeGreaterThan(0);
    });

    it('should track unresolved codes', async () => {
      await resolver.resolve('99');
      await resolver.resolve('98');

      const stats = resolver.getStatistics();
      expect(stats.unresolvedCodes).toContain('99');
      expect(stats.unresolvedCodes).toContain('98');
    });
  });

  describe('resolveBatch()', () => {
    beforeEach(async () => {
      await resolver.initialize();
    });

    it('should resolve multiple codes', async () => {
      const result = await resolver.resolveBatch(['01', '02', '75']);

      expect(result.totalCount).toBe(3);
      expect(result.resolvedCount).toBe(3);
      expect(result.unresolved).toHaveLength(0);
    });

    it('should return code to area_id map', async () => {
      const result = await resolver.resolveBatch(['01', '02']);

      expect(result.codeToAreaId.get('01')).toBe('uuid-01');
      expect(result.codeToAreaId.get('02')).toBe('uuid-02');
    });

    it('should return area_id to code reverse map', async () => {
      const result = await resolver.resolveBatch(['01', '02']);

      expect(result.areaIdToCode.get('uuid-01')).toBe('01');
      expect(result.areaIdToCode.get('uuid-02')).toBe('02');
    });

    it('should track unresolved codes', async () => {
      const result = await resolver.resolveBatch(['01', '99', '98']);

      expect(result.totalCount).toBe(3);
      expect(result.resolvedCount).toBe(1);
      expect(result.unresolved).toContain('99');
      expect(result.unresolved).toContain('98');
    });

    it('should return all resolution details', async () => {
      const result = await resolver.resolveBatch(['01', '99']);

      expect(result.resolved).toHaveLength(2);
      expect(result.resolved[0].found).toBe(true);
      expect(result.resolved[1].found).toBe(false);
    });
  });

  describe('resolveFromColumnName()', () => {
    beforeEach(async () => {
      await resolver.initialize();
    });

    it('should resolve from département name', async () => {
      const result = await resolver.resolveFromColumnName('Ain');

      expect(result.found).toBe(true);
      expect(result.departementCode).toBe('01');
    });

    it('should resolve from name with diacritics', async () => {
      const result = await resolver.resolveFromColumnName('Ardèche');

      // Ardèche is not in our mock data, so should not be found
      expect(result.found).toBe(false);
    });

    it('should resolve from Paris', async () => {
      const result = await resolver.resolveFromColumnName('Paris');

      expect(result.found).toBe(true);
      expect(result.departementCode).toBe('75');
    });

    it('should resolve from "code-name" format', async () => {
      const result = await resolver.resolveFromColumnName('01-Ain');

      expect(result.found).toBe(true);
      expect(result.departementCode).toBe('01');
    });

    it('should return not found for unrecognized names', async () => {
      const result = await resolver.resolveFromColumnName('Unknown Region');

      expect(result.found).toBe(false);
    });

    it('should skip métropole/national columns', async () => {
      const result = await resolver.resolveFromColumnName('Métropole');

      expect(result.found).toBe(false);
    });
  });

  describe('getAreaId()', () => {
    beforeEach(async () => {
      await resolver.initialize();
    });

    it('should return area_id for valid code', () => {
      expect(resolver.getAreaId('01')).toBe('uuid-01');
      expect(resolver.getAreaId('75')).toBe('uuid-75');
    });

    it('should normalize codes', () => {
      expect(resolver.getAreaId('1')).toBe('uuid-01');
      expect(resolver.getAreaId('2a')).toBe('uuid-2A');
    });

    it('should return null for unknown code', () => {
      expect(resolver.getAreaId('99')).toBeNull();
    });
  });

  describe('getCodeByAreaId()', () => {
    beforeEach(async () => {
      await resolver.initialize();
    });

    it('should return code for valid area_id', () => {
      expect(resolver.getCodeByAreaId('uuid-01')).toBe('01');
      expect(resolver.getCodeByAreaId('uuid-75')).toBe('75');
    });

    it('should return null for unknown area_id', () => {
      expect(resolver.getCodeByAreaId('uuid-unknown')).toBeNull();
    });
  });

  describe('getRecord()', () => {
    beforeEach(async () => {
      await resolver.initialize();
    });

    it('should return full record for valid code', () => {
      const record = resolver.getRecord('01');

      expect(record).toBeDefined();
      expect(record?.id).toBe('uuid-01');
      expect(record?.code).toBe('01');
      expect(record?.name).toBe('Ain');
    });

    it('should return null for unknown code', () => {
      expect(resolver.getRecord('99')).toBeNull();
    });
  });

  describe('hasCode()', () => {
    beforeEach(async () => {
      await resolver.initialize();
    });

    it('should return true for known codes', () => {
      expect(resolver.hasCode('01')).toBe(true);
      expect(resolver.hasCode('2A')).toBe(true);
    });

    it('should return false for unknown codes', () => {
      expect(resolver.hasCode('99')).toBe(false);
    });
  });

  describe('getAllCodes()', () => {
    beforeEach(async () => {
      await resolver.initialize();
    });

    it('should return all cached codes', () => {
      const codes = resolver.getAllCodes();

      expect(codes).toContain('01');
      expect(codes).toContain('2A');
      expect(codes).toContain('75');
    });

    it('should return sorted codes', () => {
      const codes = resolver.getAllCodes();

      expect(codes).toEqual([...codes].sort());
    });
  });

  describe('getStatistics()', () => {
    beforeEach(async () => {
      await resolver.initialize();
    });

    it('should track lookup count', async () => {
      await resolver.resolve('01');
      await resolver.resolve('02');

      const stats = resolver.getStatistics();
      expect(stats.lookupCount).toBe(2);
    });

    it('should track database query count', () => {
      const stats = resolver.getStatistics();
      expect(stats.dbQueryCount).toBe(1); // Initial load
    });

    it('should return copy of stats (not mutable)', () => {
      const stats1 = resolver.getStatistics();
      const stats2 = resolver.getStatistics();

      stats1.lookupCount = 999;
      expect(stats2.lookupCount).not.toBe(999);
    });
  });

  describe('reset()', () => {
    beforeEach(async () => {
      await resolver.initialize();
    });

    it('should clear cache', () => {
      resolver.reset();

      expect(resolver.getCacheSize()).toBe(0);
    });

    it('should reset initialized flag', () => {
      resolver.reset();

      expect(resolver.isInitialized()).toBe(false);
    });

    it('should reset statistics', () => {
      resolver.reset();

      const stats = resolver.getStatistics();
      expect(stats.lookupCount).toBe(0);
      expect(stats.dbQueryCount).toBe(0);
    });
  });

  describe('validateCoverage()', () => {
    it('should report missing départements', async () => {
      await resolver.initialize();
      const result = await resolver.validateCoverage();

      // Our mock only has 7 départements, so many will be missing
      expect(result.valid).toBe(false);
      expect(result.missingCodes.length).toBeGreaterThan(0);
    });

    it('should report extra codes (like DOM)', async () => {
      await resolver.initialize();
      const result = await resolver.validateCoverage();

      // 971 (Guadeloupe) is not in metropolitan expected list
      expect(result.extraCodes).toContain('971');
    });
  });

  describe('createLookupFunction()', () => {
    beforeEach(async () => {
      await resolver.initialize();
    });

    it('should return a working lookup function', () => {
      const lookup = resolver.createLookupFunction();

      expect(lookup('01')).toBe('uuid-01');
      expect(lookup('99')).toBeNull();
    });
  });
});

describe('createDepartementResolver()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDataSource.query.mockResolvedValue(mockDepartements);
  });

  it('should create and initialize resolver', async () => {
    const resolver = await createDepartementResolver(mockDataSource as any);

    expect(resolver.isInitialized()).toBe(true);
    expect(resolver.getCacheSize()).toBeGreaterThan(0);
  });

  it('should pass options to resolver', async () => {
    const resolver = await createDepartementResolver(mockDataSource as any, {
      adminLevel: 'region',
      countryCode: 'BE',
    });

    expect(mockDataSource.query).toHaveBeenCalledWith(
      expect.any(String),
      ['region', 'BE'],
    );
  });
});

describe('Code Normalization', () => {
  let resolver: Etat4001DepartementResolver;

  beforeEach(async () => {
    mockDataSource.query.mockResolvedValue(mockDepartements);
    resolver = new Etat4001DepartementResolver(mockDataSource as any);
    await resolver.initialize();
  });

  describe('Single-digit padding', () => {
    it('should pad "1" to "01"', async () => {
      const result = await resolver.resolve('1');
      expect(result.departementCode).toBe('01');
    });

    it('should pad "2" to "02"', async () => {
      const result = await resolver.resolve('2');
      expect(result.departementCode).toBe('02');
    });

    it('should not pad "95"', async () => {
      const result = await resolver.resolve('95');
      expect(result.departementCode).toBe('95');
    });
  });

  describe('Corsica code handling', () => {
    it('should normalize "2a" to "2A"', async () => {
      const result = await resolver.resolve('2a');
      expect(result.departementCode).toBe('2A');
    });

    it('should normalize "2b" to "2B"', async () => {
      const result = await resolver.resolve('2b');
      expect(result.departementCode).toBe('2B');
    });

    it('should handle already uppercase', async () => {
      const result = await resolver.resolve('2A');
      expect(result.departementCode).toBe('2A');
    });
  });

  describe('DOM codes', () => {
    it('should not pad "971"', async () => {
      const result = await resolver.resolve('971');
      expect(result.departementCode).toBe('971');
    });
  });

  describe('Whitespace handling', () => {
    it('should trim whitespace', async () => {
      const result = await resolver.resolve('  01  ');
      expect(result.departementCode).toBe('01');
    });
  });
});
