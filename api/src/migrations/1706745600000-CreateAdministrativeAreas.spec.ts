import { CreateAdministrativeAreas1706745600000 } from './1706745600000-CreateAdministrativeAreas';

describe('CreateAdministrativeAreas1706745600000', () => {
  let migration: CreateAdministrativeAreas1706745600000;
  let mockQueryRunner: any;
  let executedQueries: string[];

  beforeEach(() => {
    migration = new CreateAdministrativeAreas1706745600000();
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
      expect(migration.name).toBe('CreateAdministrativeAreas1706745600000');
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

    it('should create administrative_area_level_enum type', () => {
      const enumQuery = executedQueries.find((q) =>
        q.includes('CREATE TYPE "administrative_area_level_enum"'),
      );
      expect(enumQuery).toBeDefined();
      expect(enumQuery).toContain("'country'");
      expect(enumQuery).toContain("'region'");
      expect(enumQuery).toContain("'department'");
    });

    it('should create administrative_areas table with all required columns', () => {
      const createTableQuery = executedQueries.find((q) =>
        q.includes('CREATE TABLE "administrative_areas"'),
      );
      expect(createTableQuery).toBeDefined();

      // Check for primary key
      expect(createTableQuery).toContain('"id" uuid NOT NULL');
      expect(createTableQuery).toContain('uuid_generate_v4()');

      // Check for required columns
      expect(createTableQuery).toContain('"code" character varying(10) NOT NULL');
      expect(createTableQuery).toContain('"name" character varying(255) NOT NULL');
      expect(createTableQuery).toContain('"nameEn" character varying(255)');
      expect(createTableQuery).toContain('"level" "administrative_area_level_enum" NOT NULL');
      expect(createTableQuery).toContain('"parentCode" character varying(10)');
      expect(createTableQuery).toContain('"countryCode" character(2) NOT NULL');
      expect(createTableQuery).toContain('"areaKm2" numeric(12,2)');

      // Check for timestamps
      expect(createTableQuery).toContain('"createdAt" TIMESTAMP NOT NULL DEFAULT now()');
      expect(createTableQuery).toContain('"updatedAt" TIMESTAMP NOT NULL DEFAULT now()');

      // Check for primary key constraint
      expect(createTableQuery).toContain('CONSTRAINT "PK_administrative_areas" PRIMARY KEY ("id")');
    });

    it('should create PostGIS geometry column with correct SRID', () => {
      const createTableQuery = executedQueries.find((q) =>
        q.includes('CREATE TABLE "administrative_areas"'),
      );
      expect(createTableQuery).toContain('"geometry" geometry(MultiPolygon, 4326)');
    });

    it('should create unique index on (code, level)', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE UNIQUE INDEX "IDX_administrative_areas_code_level"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('("code", "level")');
    });

    it('should create index on level for filtering', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_administrative_areas_level"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('("level")');
    });

    it('should create index on parentCode for hierarchical queries', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_administrative_areas_parent_code"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('("parentCode")');
    });

    it('should create index on countryCode for country-level filtering', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_administrative_areas_country_code"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('("countryCode")');
    });

    it('should create spatial GIST index on geometry column', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_administrative_areas_geometry"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('USING GIST ("geometry")');
    });

    it('should add table comment for documentation', () => {
      const commentQuery = executedQueries.find((q) =>
        q.includes('COMMENT ON TABLE "administrative_areas"'),
      );
      expect(commentQuery).toBeDefined();
      expect(commentQuery).toContain('départements');
    });
  });

  describe('down()', () => {
    beforeEach(async () => {
      await migration.down(mockQueryRunner);
    });

    it('should drop all indexes in correct order', () => {
      const geometryDropIndex = executedQueries.find((q) =>
        q.includes('DROP INDEX IF EXISTS "IDX_administrative_areas_geometry"'),
      );
      const countryCodeDropIndex = executedQueries.find((q) =>
        q.includes('DROP INDEX IF EXISTS "IDX_administrative_areas_country_code"'),
      );
      const parentCodeDropIndex = executedQueries.find((q) =>
        q.includes('DROP INDEX IF EXISTS "IDX_administrative_areas_parent_code"'),
      );
      const levelDropIndex = executedQueries.find((q) =>
        q.includes('DROP INDEX IF EXISTS "IDX_administrative_areas_level"'),
      );
      const codeLevelDropIndex = executedQueries.find((q) =>
        q.includes('DROP INDEX IF EXISTS "IDX_administrative_areas_code_level"'),
      );

      expect(geometryDropIndex).toBeDefined();
      expect(countryCodeDropIndex).toBeDefined();
      expect(parentCodeDropIndex).toBeDefined();
      expect(levelDropIndex).toBeDefined();
      expect(codeLevelDropIndex).toBeDefined();
    });

    it('should drop table', () => {
      const dropTableQuery = executedQueries.find((q) =>
        q.includes('DROP TABLE IF EXISTS "administrative_areas"'),
      );
      expect(dropTableQuery).toBeDefined();
    });

    it('should drop enum type', () => {
      const dropEnumQuery = executedQueries.find((q) =>
        q.includes('DROP TYPE IF EXISTS "administrative_area_level_enum"'),
      );
      expect(dropEnumQuery).toBeDefined();
    });

    it('should drop table before dropping enum (dependency order)', () => {
      const dropTableIndex = executedQueries.findIndex((q) =>
        q.includes('DROP TABLE'),
      );
      const dropEnumIndex = executedQueries.findIndex((q) =>
        q.includes('DROP TYPE'),
      );
      expect(dropTableIndex).toBeLessThan(dropEnumIndex);
    });
  });

  describe('reversibility', () => {
    it('should be fully reversible (down undoes up)', async () => {
      // up() creates: enum, table, 5 indexes, 1 comment = 8 operations
      await migration.up(mockQueryRunner);
      const upQueryCount = executedQueries.length;
      expect(upQueryCount).toBe(8);

      // Reset for down
      executedQueries = [];
      await migration.down(mockQueryRunner);
      const downQueryCount = executedQueries.length;

      // down() drops: 5 indexes, table, enum = 7 operations
      expect(downQueryCount).toBe(7);
    });
  });
});
