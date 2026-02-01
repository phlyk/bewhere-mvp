import { CreateCrimeCategories1706918400000 } from './1706918400000-CreateCrimeCategories';

describe('CreateCrimeCategories1706918400000', () => {
  let migration: CreateCrimeCategories1706918400000;
  let mockQueryRunner: any;
  let executedQueries: string[];

  beforeEach(() => {
    migration = new CreateCrimeCategories1706918400000();
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
      expect(migration.name).toBe('CreateCrimeCategories1706918400000');
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

    it('should create crime_severity_enum type with correct values', () => {
      const enumQuery = executedQueries.find((q) =>
        q.includes('CREATE TYPE "crime_severity_enum"'),
      );
      expect(enumQuery).toBeDefined();
      expect(enumQuery).toContain("'critical'");
      expect(enumQuery).toContain("'high'");
      expect(enumQuery).toContain("'medium'");
      expect(enumQuery).toContain("'low'");
    });

    it('should create crime_category_group_enum type with correct values', () => {
      const enumQuery = executedQueries.find((q) =>
        q.includes('CREATE TYPE "crime_category_group_enum"'),
      );
      expect(enumQuery).toBeDefined();
      expect(enumQuery).toContain("'violent_crimes'");
      expect(enumQuery).toContain("'property_crimes'");
      expect(enumQuery).toContain("'drug_offenses'");
      expect(enumQuery).toContain("'other_offenses'");
    });

    it('should create crime_categories table with all required columns', () => {
      const createTableQuery = executedQueries.find((q) =>
        q.includes('CREATE TABLE "crime_categories"'),
      );
      expect(createTableQuery).toBeDefined();

      // Check for primary key
      expect(createTableQuery).toContain('"id" uuid NOT NULL');
      expect(createTableQuery).toContain('uuid_generate_v4()');

      // Check for required columns
      expect(createTableQuery).toContain('"code" character varying(50) NOT NULL');
      expect(createTableQuery).toContain('"name" character varying(100) NOT NULL');
      expect(createTableQuery).toContain('"nameFr" character varying(100) NOT NULL');
      expect(createTableQuery).toContain('"description" text');

      // Check for enum columns with defaults
      expect(createTableQuery).toContain('"severity" crime_severity_enum NOT NULL DEFAULT \'medium\'');
      expect(createTableQuery).toContain('"categoryGroup" crime_category_group_enum NOT NULL DEFAULT \'other_offenses\'');

      // Check for other columns
      expect(createTableQuery).toContain('"sortOrder" smallint NOT NULL DEFAULT 99');
      expect(createTableQuery).toContain('"isActive" boolean NOT NULL DEFAULT true');

      // Check for timestamps
      expect(createTableQuery).toContain('"createdAt" TIMESTAMP NOT NULL DEFAULT now()');
      expect(createTableQuery).toContain('"updatedAt" TIMESTAMP NOT NULL DEFAULT now()');

      // Check for primary key constraint
      expect(createTableQuery).toContain('CONSTRAINT "PK_crime_categories" PRIMARY KEY ("id")');
    });

    it('should create unique index on code', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE UNIQUE INDEX "IDX_crime_categories_code"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('("code")');
    });

    it('should create index on severity for filtering', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_crime_categories_severity"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('("severity")');
    });

    it('should create index on categoryGroup for filtering', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_crime_categories_category_group"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('("categoryGroup")');
    });

    it('should create index on sortOrder for ordering', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_crime_categories_sort_order"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('("sortOrder")');
    });

    it('should add table comment for documentation', () => {
      const commentQuery = executedQueries.find((q) =>
        q.includes('COMMENT ON TABLE "crime_categories"'),
      );
      expect(commentQuery).toBeDefined();
      expect(commentQuery).toContain('20 categories');
    });

    it('should add column comments for documentation', () => {
      const codeComment = executedQueries.find((q) =>
        q.includes('COMMENT ON COLUMN "crime_categories"."code"'),
      );
      const nameFrComment = executedQueries.find((q) =>
        q.includes('COMMENT ON COLUMN "crime_categories"."nameFr"'),
      );
      const severityComment = executedQueries.find((q) =>
        q.includes('COMMENT ON COLUMN "crime_categories"."severity"'),
      );

      expect(codeComment).toBeDefined();
      expect(nameFrComment).toBeDefined();
      expect(severityComment).toBeDefined();
    });
  });

  describe('down()', () => {
    beforeEach(async () => {
      await migration.down(mockQueryRunner);
    });

    it('should drop all indexes', () => {
      const dropSortOrderIndex = executedQueries.find((q) =>
        q.includes('DROP INDEX IF EXISTS "IDX_crime_categories_sort_order"'),
      );
      const dropCategoryGroupIndex = executedQueries.find((q) =>
        q.includes('DROP INDEX IF EXISTS "IDX_crime_categories_category_group"'),
      );
      const dropSeverityIndex = executedQueries.find((q) =>
        q.includes('DROP INDEX IF EXISTS "IDX_crime_categories_severity"'),
      );
      const dropCodeIndex = executedQueries.find((q) =>
        q.includes('DROP INDEX IF EXISTS "IDX_crime_categories_code"'),
      );

      expect(dropSortOrderIndex).toBeDefined();
      expect(dropCategoryGroupIndex).toBeDefined();
      expect(dropSeverityIndex).toBeDefined();
      expect(dropCodeIndex).toBeDefined();
    });

    it('should drop table', () => {
      const dropTableQuery = executedQueries.find((q) =>
        q.includes('DROP TABLE IF EXISTS "crime_categories"'),
      );
      expect(dropTableQuery).toBeDefined();
    });

    it('should drop enum types', () => {
      const dropCategoryGroupEnum = executedQueries.find((q) =>
        q.includes('DROP TYPE IF EXISTS "crime_category_group_enum"'),
      );
      const dropSeverityEnum = executedQueries.find((q) =>
        q.includes('DROP TYPE IF EXISTS "crime_severity_enum"'),
      );

      expect(dropCategoryGroupEnum).toBeDefined();
      expect(dropSeverityEnum).toBeDefined();
    });

    it('should drop table before dropping enums (dependency order)', () => {
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
    it('should create all expected structures in up()', async () => {
      await migration.up(mockQueryRunner);

      // Verify key structures were created
      const hasEnums = executedQueries.some((q) => q.includes('CREATE TYPE'));
      const hasTable = executedQueries.some((q) => q.includes('CREATE TABLE'));
      const hasIndexes = executedQueries.some((q) => q.includes('CREATE INDEX'));
      const hasComments = executedQueries.some((q) => q.includes('COMMENT ON'));

      expect(hasEnums).toBe(true);
      expect(hasTable).toBe(true);
      expect(hasIndexes).toBe(true);
      expect(hasComments).toBe(true);
    });
  });

  describe('enum definitions', () => {
    beforeEach(async () => {
      await migration.up(mockQueryRunner);
    });

    it('should define severity levels matching taxonomy', () => {
      const severityEnum = executedQueries.find((q) =>
        q.includes('CREATE TYPE "crime_severity_enum"'),
      );
      // Verify all 4 severity levels are defined
      const severityLevels = ['critical', 'high', 'medium', 'low'];
      for (const level of severityLevels) {
        expect(severityEnum).toContain(`'${level}'`);
      }
    });

    it('should define category groups matching taxonomy', () => {
      const categoryGroupEnum = executedQueries.find((q) =>
        q.includes('CREATE TYPE "crime_category_group_enum"'),
      );
      // Verify all 4 category groups are defined
      const groups = ['violent_crimes', 'property_crimes', 'drug_offenses', 'other_offenses'];
      for (const group of groups) {
        expect(categoryGroupEnum).toContain(`'${group}'`);
      }
    });
  });
});
