/**
 * Unit Tests: France Monthly Crime Category Mapper
 *
 * Tests the mapping from 107 État 4001 indices to 20 canonical categories.
 */

import {
    ALL_CANONICAL_CODES,
    CanonicalCategoryCode,
    Etat4001CategoryMapper,
    getCategoryMapper,
    resetCategoryMapper,
    UNUSED_INDICES,
} from './france-monthly.category-mapper';

describe('Etat4001CategoryMapper', () => {
  let mapper: Etat4001CategoryMapper;

  beforeEach(() => {
    resetCategoryMapper();
    mapper = new Etat4001CategoryMapper();
  });

  describe('Constructor', () => {
    it('should create a mapper instance', () => {
      expect(mapper).toBeDefined();
      expect(mapper).toBeInstanceOf(Etat4001CategoryMapper);
    });

    it('should initialize lookup maps', () => {
      // Verify we can look up at least one mapping
      const result = mapper.lookup(1);
      expect(result.found).toBe(true);
    });
  });

  describe('lookup()', () => {
    it('should find mapping for valid index (01 - Règlements de compte)', () => {
      const result = mapper.lookup(1);
      expect(result.found).toBe(true);
      expect(result.canonicalCode).toBe('HOMICIDE');
      expect(result.frenchName).toContain('Règlements de compte');
      expect(result.isUnused).toBe(false);
    });

    it('should find mapping for mid-range index (46 - Viols)', () => {
      const result = mapper.lookup(46);
      expect(result.found).toBe(true);
      expect(result.canonicalCode).toBe('SEXUAL_VIOLENCE');
      expect(result.frenchName).toContain('Viols');
    });

    it('should find mapping for high index (107 - Autres délits)', () => {
      const result = mapper.lookup(107);
      expect(result.found).toBe(true);
      expect(result.canonicalCode).toBe('OTHER');
    });

    it('should return not found for unused index 96', () => {
      const result = mapper.lookup(96);
      expect(result.found).toBe(false);
      expect(result.canonicalCode).toBeNull();
      expect(result.isUnused).toBe(true);
    });

    it('should return not found for unused index 97', () => {
      const result = mapper.lookup(97);
      expect(result.found).toBe(false);
      expect(result.isUnused).toBe(true);
    });

    it('should return not found for unused index 99', () => {
      const result = mapper.lookup(99);
      expect(result.found).toBe(false);
      expect(result.isUnused).toBe(true);
    });

    it('should return not found for unused index 100', () => {
      const result = mapper.lookup(100);
      expect(result.found).toBe(false);
      expect(result.isUnused).toBe(true);
    });

    it('should return not found for out-of-range index (0)', () => {
      const result = mapper.lookup(0);
      expect(result.found).toBe(false);
      expect(result.isUnused).toBe(false);
    });

    it('should return not found for out-of-range index (108)', () => {
      const result = mapper.lookup(108);
      expect(result.found).toBe(false);
      expect(result.isUnused).toBe(false);
    });

    it('should include notes when available', () => {
      const result = mapper.lookup(1);
      expect(result.notes).toBeDefined();
      expect(result.notes).toBe('Criminal settlements');
    });
  });

  describe('getCanonicalCode()', () => {
    it('should return canonical code for valid index', () => {
      expect(mapper.getCanonicalCode(1)).toBe('HOMICIDE');
      expect(mapper.getCanonicalCode(7)).toBe('ASSAULT');
      expect(mapper.getCanonicalCode(35)).toBe('VEHICLE_THEFT');
    });

    it('should return null for unused index', () => {
      expect(mapper.getCanonicalCode(96)).toBeNull();
      expect(mapper.getCanonicalCode(97)).toBeNull();
    });

    it('should return null for out-of-range index', () => {
      expect(mapper.getCanonicalCode(0)).toBeNull();
      expect(mapper.getCanonicalCode(999)).toBeNull();
    });
  });

  describe('isUnused()', () => {
    it('should return true for unused indices', () => {
      expect(mapper.isUnused(96)).toBe(true);
      expect(mapper.isUnused(97)).toBe(true);
      expect(mapper.isUnused(99)).toBe(true);
      expect(mapper.isUnused(100)).toBe(true);
    });

    it('should return false for active indices', () => {
      expect(mapper.isUnused(1)).toBe(false);
      expect(mapper.isUnused(50)).toBe(false);
      expect(mapper.isUnused(107)).toBe(false);
    });
  });

  describe('hasMapping()', () => {
    it('should return true for mapped indices', () => {
      expect(mapper.hasMapping(1)).toBe(true);
      expect(mapper.hasMapping(107)).toBe(true);
    });

    it('should return false for unused indices', () => {
      expect(mapper.hasMapping(96)).toBe(false);
      expect(mapper.hasMapping(97)).toBe(false);
    });

    it('should return false for out-of-range indices', () => {
      expect(mapper.hasMapping(0)).toBe(false);
      expect(mapper.hasMapping(108)).toBe(false);
    });
  });

  describe('getIndicesForCategory()', () => {
    it('should return indices for HOMICIDE (4 indices)', () => {
      const indices = mapper.getIndicesForCategory('HOMICIDE');
      expect(indices).toContain(1);
      expect(indices).toContain(2);
      expect(indices).toContain(3);
      expect(indices).toContain(51);
      expect(indices.length).toBe(4);
    });

    it('should return indices for ARMED_ROBBERY (8 indices)', () => {
      const indices = mapper.getIndicesForCategory('ARMED_ROBBERY');
      expect(indices).toContain(15);
      expect(indices).toContain(22);
      expect(indices.length).toBe(8);
    });

    it('should return indices for FRAUD (16 indices)', () => {
      const indices = mapper.getIndicesForCategory('FRAUD');
      expect(indices).toContain(81);
      expect(indices).toContain(91);
      expect(indices).toContain(106);
      expect(indices.length).toBe(16);
    });

    it('should return empty array for DOMESTIC_VIOLENCE (no mappings)', () => {
      const indices = mapper.getIndicesForCategory('DOMESTIC_VIOLENCE');
      expect(indices).toEqual([]);
    });

    it('should return many indices for OTHER category', () => {
      const indices = mapper.getIndicesForCategory('OTHER');
      expect(indices.length).toBeGreaterThan(10);
    });
  });

  describe('getMappingEntry()', () => {
    it('should return full entry for valid index', () => {
      const entry = mapper.getMappingEntry(1);
      expect(entry).toBeDefined();
      expect(entry?.etat4001Index).toBe(1);
      expect(entry?.canonicalCode).toBe('HOMICIDE');
      expect(entry?.frenchName).toContain('Règlements de compte');
    });

    it('should return undefined for unused index', () => {
      const entry = mapper.getMappingEntry(96);
      expect(entry).toBeUndefined();
    });
  });

  describe('getMappingsForCategory()', () => {
    it('should return all mappings for KIDNAPPING', () => {
      const mappings = mapper.getMappingsForCategory('KIDNAPPING');
      expect(mappings.length).toBe(3);
      expect(mappings.map(m => m.etat4001Index)).toContain(8);
      expect(mappings.map(m => m.etat4001Index)).toContain(9);
      expect(mappings.map(m => m.etat4001Index)).toContain(10);
    });

    it('should return empty array for DOMESTIC_VIOLENCE', () => {
      const mappings = mapper.getMappingsForCategory('DOMESTIC_VIOLENCE');
      expect(mappings).toEqual([]);
    });
  });

  describe('getAllMappings()', () => {
    it('should return all mappings', () => {
      const mappings = mapper.getAllMappings();
      expect(mappings.length).toBeGreaterThan(90);
    });

    it('should not mutate internal state when modifying returned array', () => {
      const mappings1 = mapper.getAllMappings();
      const originalLength = mappings1.length;
      mappings1.pop();
      
      const mappings2 = mapper.getAllMappings();
      expect(mappings2.length).toBe(originalLength);
    });
  });

  describe('getStatistics()', () => {
    it('should return correct total indices', () => {
      const stats = mapper.getStatistics();
      expect(stats.totalIndices).toBe(107);
    });

    it('should return correct unused count', () => {
      const stats = mapper.getStatistics();
      expect(stats.unusedIndices).toBe(4);
    });

    it('should return active indices count', () => {
      const stats = mapper.getStatistics();
      // 107 total - 4 unused - some possibly unmapped = ~95 active
      expect(stats.activeIndices).toBeGreaterThan(90);
      expect(stats.activeIndices).toBeLessThanOrEqual(107);
    });

    it('should include DOMESTIC_VIOLENCE in empty categories', () => {
      const stats = mapper.getStatistics();
      expect(stats.emptyCategories).toContain('DOMESTIC_VIOLENCE');
    });

    it('should have indices per category for all categories', () => {
      const stats = mapper.getStatistics();
      for (const code of ALL_CANONICAL_CODES) {
        expect(stats.indicesPerCategory[code]).toBeDefined();
        expect(typeof stats.indicesPerCategory[code]).toBe('number');
      }
    });
  });

  describe('validate()', () => {
    it('should validate successfully', () => {
      const result = mapper.validate();
      expect(result.valid).toBe(true);
    });

    it('should include warning about DOMESTIC_VIOLENCE', () => {
      const result = mapper.validate();
      expect(result.warnings.some(w => w.includes('DOMESTIC_VIOLENCE'))).toBe(true);
    });

    it('should have no errors', () => {
      const result = mapper.validate();
      expect(result.errors.length).toBe(0);
    });
  });

  describe('getSummaryReport()', () => {
    it('should generate a non-empty report', () => {
      const report = mapper.getSummaryReport();
      expect(report).toBeDefined();
      expect(report.length).toBeGreaterThan(100);
    });

    it('should include header', () => {
      const report = mapper.getSummaryReport();
      expect(report).toContain('État 4001 Category Mapping Summary');
    });

    it('should include category counts', () => {
      const report = mapper.getSummaryReport();
      expect(report).toContain('HOMICIDE');
      expect(report).toContain('ASSAULT');
      expect(report).toContain('FRAUD');
    });
  });

  // ============================================
  // Mapping Coverage Tests
  // ============================================
  describe('Mapping Coverage', () => {
    describe('HOMICIDE mappings', () => {
      const homicideIndices = [1, 2, 3, 51];

      it.each(homicideIndices)('should map index %i to HOMICIDE', (index) => {
        expect(mapper.getCanonicalCode(index)).toBe('HOMICIDE');
      });
    });

    describe('ATTEMPTED_HOMICIDE mappings', () => {
      const attemptedHomicideIndices = [4, 5, 6];

      it.each(attemptedHomicideIndices)('should map index %i to ATTEMPTED_HOMICIDE', (index) => {
        expect(mapper.getCanonicalCode(index)).toBe('ATTEMPTED_HOMICIDE');
      });
    });

    describe('ASSAULT mappings', () => {
      const assaultIndices = [7, 11, 12, 13, 73];

      it.each(assaultIndices)('should map index %i to ASSAULT', (index) => {
        expect(mapper.getCanonicalCode(index)).toBe('ASSAULT');
      });
    });

    describe('SEXUAL_VIOLENCE mappings', () => {
      const sexualViolenceIndices = [46, 47, 48, 49, 50];

      it.each(sexualViolenceIndices)('should map index %i to SEXUAL_VIOLENCE', (index) => {
        expect(mapper.getCanonicalCode(index)).toBe('SEXUAL_VIOLENCE');
      });
    });

    describe('HUMAN_TRAFFICKING mappings', () => {
      it('should map index 45 to HUMAN_TRAFFICKING', () => {
        expect(mapper.getCanonicalCode(45)).toBe('HUMAN_TRAFFICKING');
      });
    });

    describe('KIDNAPPING mappings', () => {
      const kidnappingIndices = [8, 9, 10];

      it.each(kidnappingIndices)('should map index %i to KIDNAPPING', (index) => {
        expect(mapper.getCanonicalCode(index)).toBe('KIDNAPPING');
      });
    });

    describe('ARMED_ROBBERY mappings', () => {
      const armedRobberyIndices = [15, 16, 17, 18, 19, 20, 21, 22];

      it.each(armedRobberyIndices)('should map index %i to ARMED_ROBBERY', (index) => {
        expect(mapper.getCanonicalCode(index)).toBe('ARMED_ROBBERY');
      });
    });

    describe('ROBBERY mappings', () => {
      const robberyIndices = [23, 24, 25, 26];

      it.each(robberyIndices)('should map index %i to ROBBERY', (index) => {
        expect(mapper.getCanonicalCode(index)).toBe('ROBBERY');
      });
    });

    describe('BURGLARY_RESIDENTIAL mappings', () => {
      const burglaryResIndices = [14, 27, 28, 31];

      it.each(burglaryResIndices)('should map index %i to BURGLARY_RESIDENTIAL', (index) => {
        expect(mapper.getCanonicalCode(index)).toBe('BURGLARY_RESIDENTIAL');
      });
    });

    describe('BURGLARY_COMMERCIAL mappings', () => {
      const burglaryComIndices = [29, 30];

      it.each(burglaryComIndices)('should map index %i to BURGLARY_COMMERCIAL', (index) => {
        expect(mapper.getCanonicalCode(index)).toBe('BURGLARY_COMMERCIAL');
      });
    });

    describe('VEHICLE_THEFT mappings', () => {
      const vehicleTheftIndices = [34, 35, 36, 37, 38];

      it.each(vehicleTheftIndices)('should map index %i to VEHICLE_THEFT', (index) => {
        expect(mapper.getCanonicalCode(index)).toBe('VEHICLE_THEFT');
      });
    });

    describe('THEFT_OTHER mappings', () => {
      const theftOtherIndices = [32, 33, 39, 40, 41, 42, 43, 44];

      it.each(theftOtherIndices)('should map index %i to THEFT_OTHER', (index) => {
        expect(mapper.getCanonicalCode(index)).toBe('THEFT_OTHER');
      });
    });

    describe('DRUG_TRAFFICKING mappings', () => {
      const drugTraffickingIndices = [55, 56];

      it.each(drugTraffickingIndices)('should map index %i to DRUG_TRAFFICKING', (index) => {
        expect(mapper.getCanonicalCode(index)).toBe('DRUG_TRAFFICKING');
      });
    });

    describe('DRUG_USE mappings', () => {
      const drugUseIndices = [57, 58];

      it.each(drugUseIndices)('should map index %i to DRUG_USE', (index) => {
        expect(mapper.getCanonicalCode(index)).toBe('DRUG_USE');
      });
    });

    describe('ARSON mappings', () => {
      const arsonIndices = [62, 63, 64, 65];

      it.each(arsonIndices)('should map index %i to ARSON', (index) => {
        expect(mapper.getCanonicalCode(index)).toBe('ARSON');
      });
    });

    describe('VANDALISM mappings', () => {
      const vandalismIndices = [66, 67, 68];

      it.each(vandalismIndices)('should map index %i to VANDALISM', (index) => {
        expect(mapper.getCanonicalCode(index)).toBe('VANDALISM');
      });
    });

    describe('FRAUD mappings', () => {
      const fraudIndices = [81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 98, 101, 102, 106];

      it.each(fraudIndices)('should map index %i to FRAUD', (index) => {
        expect(mapper.getCanonicalCode(index)).toBe('FRAUD');
      });
    });

    describe('CHILD_ABUSE mappings', () => {
      const childAbuseIndices = [52, 53, 54];

      it.each(childAbuseIndices)('should map index %i to CHILD_ABUSE', (index) => {
        expect(mapper.getCanonicalCode(index)).toBe('CHILD_ABUSE');
      });
    });

    describe('OTHER mappings', () => {
      const otherIndices = [59, 60, 61, 69, 70, 71, 72, 74, 75, 76, 77, 78, 79, 80, 93, 94, 95, 103, 104, 105, 107];

      it.each(otherIndices)('should map index %i to OTHER', (index) => {
        expect(mapper.getCanonicalCode(index)).toBe('OTHER');
      });
    });

    describe('Unused indices', () => {
      it.each(UNUSED_INDICES)('should mark index %i as unused', (index) => {
        expect(mapper.isUnused(index)).toBe(true);
        expect(mapper.getCanonicalCode(index)).toBeNull();
      });
    });
  });
});

describe('getCategoryMapper() singleton', () => {
  beforeEach(() => {
    resetCategoryMapper();
  });

  it('should return same instance on multiple calls', () => {
    const mapper1 = getCategoryMapper();
    const mapper2 = getCategoryMapper();
    expect(mapper1).toBe(mapper2);
  });

  it('should return new instance after reset', () => {
    const mapper1 = getCategoryMapper();
    resetCategoryMapper();
    const mapper2 = getCategoryMapper();
    expect(mapper1).not.toBe(mapper2);
  });
});

describe('UNUSED_INDICES constant', () => {
  it('should have exactly 4 unused indices', () => {
    expect(UNUSED_INDICES.length).toBe(4);
  });

  it('should contain indices 96, 97, 99, 100', () => {
    expect(UNUSED_INDICES).toContain(96);
    expect(UNUSED_INDICES).toContain(97);
    expect(UNUSED_INDICES).toContain(99);
    expect(UNUSED_INDICES).toContain(100);
  });
});

describe('ALL_CANONICAL_CODES constant', () => {
  it('should have exactly 20 categories', () => {
    expect(ALL_CANONICAL_CODES.length).toBe(20);
  });

  it('should contain all expected categories', () => {
    const expectedCategories: CanonicalCategoryCode[] = [
      'HOMICIDE',
      'ATTEMPTED_HOMICIDE',
      'ASSAULT',
      'SEXUAL_VIOLENCE',
      'HUMAN_TRAFFICKING',
      'KIDNAPPING',
      'ARMED_ROBBERY',
      'ROBBERY',
      'BURGLARY_RESIDENTIAL',
      'BURGLARY_COMMERCIAL',
      'VEHICLE_THEFT',
      'THEFT_OTHER',
      'DRUG_TRAFFICKING',
      'DRUG_USE',
      'ARSON',
      'VANDALISM',
      'FRAUD',
      'CHILD_ABUSE',
      'DOMESTIC_VIOLENCE',
      'OTHER',
    ];

    for (const category of expectedCategories) {
      expect(ALL_CANONICAL_CODES).toContain(category);
    }
  });
});
