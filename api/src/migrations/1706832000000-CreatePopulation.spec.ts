import { CreatePopulation1706832000000 } from './1706832000000-CreatePopulation';

describe('CreatePopulation1706832000000', () => {
  let migration: CreatePopulation1706832000000;
  let mockQueryRunner: any;
  let executedQueries: string[];

  beforeEach(() => {
    migration = new CreatePopulation1706832000000();
    executedQueries = [];
    mockQueryRunner = {
      query: jest.fn().mockImplementation((sql: string) => {
        executedQueries.push(sql);
        return Promise.resolve();
      }),
    };
  });

  describe('metadata', () => {
    it('should have correct migration name', () => {
      expect(migration.name).toBe('CreatePopulation1706832000000');
    });

    it('should implement MigrationInterface', () => {
      expect(typeof migration.up).toBe('function');
      expect(typeof migration.down).toBe('function');
    });
  });

  describe('up()', () => {
    beforeEach(async () => {
      await migration.up(mockQueryRunner);
    });

    it('should create population table with all required columns', () => {
      const createTableQuery = executedQueries.find((q) =>
        q.includes('CREATE TABLE "population"'),
      );
      expect(createTableQuery).toBeDefined();

      // Check for primary key
      expect(createTableQuery).toContain('"id" uuid NOT NULL');
      expect(createTableQuery).toContain('uuid_generate_v4()');

      // Check for required columns
      expect(createTableQuery).toContain('"areaId" uuid NOT NULL');
      expect(createTableQuery).toContain('"year" smallint NOT NULL');
      expect(createTableQuery).toContain('"populationCount" bigint NOT NULL');

      // Check for optional columns
      expect(createTableQuery).toContain('"source" character varying(100)');
      expect(createTableQuery).toContain('"notes" text');

      // Check for timestamps
      expect(createTableQuery).toContain('"createdAt" TIMESTAMP NOT NULL DEFAULT now()');
      expect(createTableQuery).toContain('"updatedAt" TIMESTAMP NOT NULL DEFAULT now()');

      // Check for primary key constraint
      expect(createTableQuery).toContain('CONSTRAINT "PK_population" PRIMARY KEY ("id")');
    });

    it('should use bigint for population count to support large values', () => {
      const createTableQuery = executedQueries.find((q) =>
        q.includes('CREATE TABLE "population"'),
      );
      expect(createTableQuery).toContain('"populationCount" bigint NOT NULL');
    });

    it('should create unique index on (areaId, year) to prevent duplicates', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE UNIQUE INDEX "IDX_population_area_year"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('("areaId", "year")');
    });

    it('should create index on year for time-based filtering', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_population_year"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('("year")');
    });

    it('should create index on areaId for area-based filtering', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_population_area_id"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('("areaId")');
    });

    it('should create foreign key constraint to administrative_areas with CASCADE delete', () => {
      const fkQuery = executedQueries.find((q) =>
        q.includes('ADD CONSTRAINT "FK_population_area"'),
      );
      expect(fkQuery).toBeDefined();
      expect(fkQuery).toContain('FOREIGN KEY ("areaId")');
      expect(fkQuery).toContain('REFERENCES "administrative_areas"("id")');
      expect(fkQuery).toContain('ON DELETE CASCADE');
    });

    it('should add table comment for documentation', () => {
      const commentQuery = executedQueries.find((q) =>
        q.includes('COMMENT ON TABLE "population"'),
      );
      expect(commentQuery).toBeDefined();
      expect(commentQuery).toContain('crime rate calculations');
    });
  });

  describe('down()', () => {
    beforeEach(async () => {
      await migration.down(mockQueryRunner);
    });

    it('should drop foreign key constraint first', () => {
      const dropFkQuery = executedQueries.find((q) =>
        q.includes('DROP CONSTRAINT IF EXISTS "FK_population_area"'),
      );
      expect(dropFkQuery).toBeDefined();
    });

    it('should drop all indexes', () => {
      const dropAreaIdIndex = executedQueries.find((q) =>
        q.includes('DROP INDEX IF EXISTS "IDX_population_area_id"'),
      );
      const dropYearIndex = executedQueries.find((q) =>
        q.includes('DROP INDEX IF EXISTS "IDX_population_year"'),
      );
      const dropAreaYearIndex = executedQueries.find((q) =>
        q.includes('DROP INDEX IF EXISTS "IDX_population_area_year"'),
      );

      expect(dropAreaIdIndex).toBeDefined();
      expect(dropYearIndex).toBeDefined();
      expect(dropAreaYearIndex).toBeDefined();
    });

    it('should drop table', () => {
      const dropTableQuery = executedQueries.find((q) =>
        q.includes('DROP TABLE IF EXISTS "population"'),
      );
      expect(dropTableQuery).toBeDefined();
    });

    it('should drop foreign key before table (dependency order)', () => {
      const dropFkIndex = executedQueries.findIndex((q) =>
        q.includes('DROP CONSTRAINT'),
      );
      const dropTableIndex = executedQueries.findIndex((q) =>
        q.includes('DROP TABLE'),
      );
      expect(dropFkIndex).toBeLessThan(dropTableIndex);
    });
  });

  describe('reversibility', () => {
    it('should be fully reversible (down undoes up)', async () => {
      // up() creates: table, 3 indexes, 1 FK, 1 comment = 6 operations
      await migration.up(mockQueryRunner);
      const upQueryCount = executedQueries.length;
      expect(upQueryCount).toBe(6);

      // Reset for down
      executedQueries = [];
      await migration.down(mockQueryRunner);
      const downQueryCount = executedQueries.length;

      // down() drops: FK, 3 indexes, table = 5 operations
      expect(downQueryCount).toBe(5);
    });
  });

  describe('data integrity', () => {
    beforeEach(async () => {
      await migration.up(mockQueryRunner);
    });

    it('should enforce foreign key relationship to administrative_areas', () => {
      const fkQuery = executedQueries.find((q) =>
        q.includes('FOREIGN KEY'),
      );
      expect(fkQuery).toContain('REFERENCES "administrative_areas"');
    });

    it('should prevent duplicate population records for same area and year', () => {
      const uniqueIndexQuery = executedQueries.find((q) =>
        q.includes('CREATE UNIQUE INDEX'),
      );
      expect(uniqueIndexQuery).toContain('"areaId", "year"');
    });
  });
});
