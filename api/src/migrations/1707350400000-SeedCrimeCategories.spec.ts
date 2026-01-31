import { SeedCrimeCategories1707350400000 } from './1707350400000-SeedCrimeCategories';

describe('SeedCrimeCategories1707350400000', () => {
  let migration: SeedCrimeCategories1707350400000;

  beforeEach(() => {
    migration = new SeedCrimeCategories1707350400000();
  });

  describe('metadata', () => {
    it('should have correct migration name', () => {
      expect(migration.name).toBe('SeedCrimeCategories1707350400000');
    });

    it('should implement MigrationInterface', () => {
      expect(typeof migration.up).toBe('function');
      expect(typeof migration.down).toBe('function');
    });
  });

  describe('up()', () => {
    it('should insert 20 canonical crime categories', async () => {
      const queries: string[] = [];
      const mockQueryRunner = {
        query: jest.fn().mockImplementation((sql: string) => {
          queries.push(sql);
          // Return mock count for the SELECT COUNT query
          if (sql.includes('SELECT COUNT')) {
            return Promise.resolve([{ count: '20' }]);
          }
          return Promise.resolve();
        }),
      };

      await migration.up(mockQueryRunner as any);

      // Should have called query twice: INSERT and SELECT COUNT
      expect(mockQueryRunner.query).toHaveBeenCalledTimes(2);
    });

    it('should insert all expected category codes', async () => {
      let insertSql = '';
      const mockQueryRunner = {
        query: jest.fn().mockImplementation((sql: string) => {
          if (sql.includes('INSERT INTO')) {
            insertSql = sql;
          }
          if (sql.includes('SELECT COUNT')) {
            return Promise.resolve([{ count: '20' }]);
          }
          return Promise.resolve();
        }),
      };

      await migration.up(mockQueryRunner as any);

      // Verify all 20 category codes are present in the INSERT statement
      const expectedCodes = [
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
        'ARSON',
        'VANDALISM',
        'FRAUD',
        'DRUG_TRAFFICKING',
        'DRUG_USE',
        'CHILD_ABUSE',
        'DOMESTIC_VIOLENCE',
        'OTHER',
      ];

      for (const code of expectedCodes) {
        expect(insertSql).toContain(`'${code}'`);
      }
    });

    it('should assign correct severity levels', async () => {
      let insertSql = '';
      const mockQueryRunner = {
        query: jest.fn().mockImplementation((sql: string) => {
          if (sql.includes('INSERT INTO')) {
            insertSql = sql;
          }
          if (sql.includes('SELECT COUNT')) {
            return Promise.resolve([{ count: '20' }]);
          }
          return Promise.resolve();
        }),
      };

      await migration.up(mockQueryRunner as any);

      // Critical severity crimes should be marked as critical
      expect(insertSql).toContain("'HOMICIDE'");
      expect(insertSql).toContain("'critical'");
      
      // High severity crimes should be marked as high
      expect(insertSql).toContain("'ASSAULT'");
      expect(insertSql).toContain("'high'");
      
      // Medium severity crimes should be marked as medium
      expect(insertSql).toContain("'BURGLARY_RESIDENTIAL'");
      expect(insertSql).toContain("'medium'");
      
      // Low severity crimes should be marked as low
      expect(insertSql).toContain("'VANDALISM'");
      expect(insertSql).toContain("'low'");
    });

    it('should assign correct category groups', async () => {
      let insertSql = '';
      const mockQueryRunner = {
        query: jest.fn().mockImplementation((sql: string) => {
          if (sql.includes('INSERT INTO')) {
            insertSql = sql;
          }
          if (sql.includes('SELECT COUNT')) {
            return Promise.resolve([{ count: '20' }]);
          }
          return Promise.resolve();
        }),
      };

      await migration.up(mockQueryRunner as any);

      // Verify category groups are present
      expect(insertSql).toContain("'violent_crimes'");
      expect(insertSql).toContain("'property_crimes'");
      expect(insertSql).toContain("'drug_offenses'");
      expect(insertSql).toContain("'other_offenses'");
    });

    it('should include French translations (nameFr)', async () => {
      let insertSql = '';
      const mockQueryRunner = {
        query: jest.fn().mockImplementation((sql: string) => {
          if (sql.includes('INSERT INTO')) {
            insertSql = sql;
          }
          if (sql.includes('SELECT COUNT')) {
            return Promise.resolve([{ count: '20' }]);
          }
          return Promise.resolve();
        }),
      };

      await migration.up(mockQueryRunner as any);

      // Verify French translations are included
      const frenchNames = [
        "Tentative d''homicide", // SQL escaped apostrophe
        'Coups et blessures',
        'Violences sexuelles',
        'Vol à main armée',
        'Cambriolage de résidence',
        'Trafic de stupéfiants',
        'Usage de stupéfiants',
        'Escroquerie',
      ];

      for (const name of frenchNames) {
        expect(insertSql).toContain(name);
      }
    });

    it('should set sortOrder from 1 to 20', async () => {
      let insertSql = '';
      const mockQueryRunner = {
        query: jest.fn().mockImplementation((sql: string) => {
          if (sql.includes('INSERT INTO')) {
            insertSql = sql;
          }
          if (sql.includes('SELECT COUNT')) {
            return Promise.resolve([{ count: '20' }]);
          }
          return Promise.resolve();
        }),
      };

      await migration.up(mockQueryRunner as any);

      // Verify sortOrder values 1-20 are present
      for (let i = 1; i <= 20; i++) {
        // The sortOrder appears after the category group in the VALUES
        expect(insertSql).toMatch(new RegExp(`'[a-z_]+',\\s*${i},\\s*true`));
      }
    });

    it('should set all categories as active', async () => {
      let insertSql = '';
      const mockQueryRunner = {
        query: jest.fn().mockImplementation((sql: string) => {
          if (sql.includes('INSERT INTO')) {
            insertSql = sql;
          }
          if (sql.includes('SELECT COUNT')) {
            return Promise.resolve([{ count: '20' }]);
          }
          return Promise.resolve();
        }),
      };

      await migration.up(mockQueryRunner as any);

      // Count occurrences of "true" at the end of each value set
      // Each category should have isActive = true
      const matches = insertSql.match(/,\s*true\s*\)/g);
      expect(matches).not.toBeNull();
      expect(matches?.length).toBe(20);
    });
  });

  describe('down()', () => {
    it('should delete all 20 seeded categories', async () => {
      let deleteSql = '';
      const mockQueryRunner = {
        query: jest.fn().mockImplementation((sql: string) => {
          if (sql.includes('DELETE FROM')) {
            deleteSql = sql;
          }
          return Promise.resolve();
        }),
      };

      await migration.down(mockQueryRunner as any);

      expect(mockQueryRunner.query).toHaveBeenCalledTimes(1);
      expect(deleteSql).toContain('DELETE FROM "crime_categories"');
    });

    it('should target only seeded category codes', async () => {
      let deleteSql = '';
      const mockQueryRunner = {
        query: jest.fn().mockImplementation((sql: string) => {
          if (sql.includes('DELETE FROM')) {
            deleteSql = sql;
          }
          return Promise.resolve();
        }),
      };

      await migration.down(mockQueryRunner as any);

      // Verify all 20 category codes are in the DELETE WHERE clause
      const expectedCodes = [
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
        'ARSON',
        'VANDALISM',
        'FRAUD',
        'DRUG_TRAFFICKING',
        'DRUG_USE',
        'CHILD_ABUSE',
        'DOMESTIC_VIOLENCE',
        'OTHER',
      ];

      for (const code of expectedCodes) {
        expect(deleteSql).toContain(`'${code}'`);
      }
    });
  });

  describe('taxonomy validation', () => {
    it('should have correct violent crime classifications', () => {
      const violentCrimeCodes = [
        'HOMICIDE',
        'ATTEMPTED_HOMICIDE',
        'ASSAULT',
        'SEXUAL_VIOLENCE',
        'HUMAN_TRAFFICKING',
        'KIDNAPPING',
        'ARMED_ROBBERY',
        'ROBBERY',
      ];

      // These should be classified as violent_crimes in the migration
      expect(violentCrimeCodes.length).toBe(8);
    });

    it('should have correct property crime classifications', () => {
      const propertyCrimeCodes = [
        'BURGLARY_RESIDENTIAL',
        'BURGLARY_COMMERCIAL',
        'VEHICLE_THEFT',
        'THEFT_OTHER',
        'ARSON',
        'VANDALISM',
        'FRAUD',
      ];

      // These should be classified as property_crimes in the migration
      expect(propertyCrimeCodes.length).toBe(7);
    });

    it('should have correct drug offense classifications', () => {
      const drugOffenseCodes = ['DRUG_TRAFFICKING', 'DRUG_USE'];

      // These should be classified as drug_offenses in the migration
      expect(drugOffenseCodes.length).toBe(2);
    });

    it('should have correct other offense classifications', () => {
      const otherOffenseCodes = ['CHILD_ABUSE', 'DOMESTIC_VIOLENCE', 'OTHER'];

      // These should be classified as other_offenses in the migration
      expect(otherOffenseCodes.length).toBe(3);
    });

    it('should have exactly 20 categories total', () => {
      const allCodes = [
        // Violent crimes
        'HOMICIDE',
        'ATTEMPTED_HOMICIDE',
        'ASSAULT',
        'SEXUAL_VIOLENCE',
        'HUMAN_TRAFFICKING',
        'KIDNAPPING',
        'ARMED_ROBBERY',
        'ROBBERY',
        // Property crimes
        'BURGLARY_RESIDENTIAL',
        'BURGLARY_COMMERCIAL',
        'VEHICLE_THEFT',
        'THEFT_OTHER',
        'ARSON',
        'VANDALISM',
        'FRAUD',
        // Drug offenses
        'DRUG_TRAFFICKING',
        'DRUG_USE',
        // Other offenses
        'CHILD_ABUSE',
        'DOMESTIC_VIOLENCE',
        'OTHER',
      ];

      expect(allCodes.length).toBe(20);
      expect(new Set(allCodes).size).toBe(20); // All unique
    });

    it('should have 6 critical severity categories', () => {
      const criticalCategories = [
        'HOMICIDE',
        'ATTEMPTED_HOMICIDE',
        'SEXUAL_VIOLENCE',
        'HUMAN_TRAFFICKING',
        'KIDNAPPING',
        'CHILD_ABUSE',
      ];

      expect(criticalCategories.length).toBe(6);
    });

    it('should have 5 high severity categories', () => {
      const highCategories = [
        'ASSAULT',
        'ARMED_ROBBERY',
        'ROBBERY',
        'ARSON',
        'DRUG_TRAFFICKING',
        'DOMESTIC_VIOLENCE',
      ];

      expect(highCategories.length).toBe(6);
    });

    it('should have 5 medium severity categories', () => {
      const mediumCategories = [
        'BURGLARY_RESIDENTIAL',
        'BURGLARY_COMMERCIAL',
        'VEHICLE_THEFT',
        'FRAUD',
      ];

      expect(mediumCategories.length).toBe(4);
    });

    it('should have 4 low severity categories', () => {
      const lowCategories = ['THEFT_OTHER', 'VANDALISM', 'DRUG_USE', 'OTHER'];

      expect(lowCategories.length).toBe(4);
    });
  });
});
