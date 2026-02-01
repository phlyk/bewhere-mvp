import { CreateCategoryMappings1707177600000 } from './1707177600000-CreateCategoryMappings';

describe('CreateCategoryMappings1707177600000', () => {
  let migration: CreateCategoryMappings1707177600000;
  let mockQueryRunner: any;
  let executedQueries: string[];

  beforeEach(() => {
    migration = new CreateCategoryMappings1707177600000();
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
      expect(migration.name).toBe('CreateCategoryMappings1707177600000');
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

    it('should create category_mappings table with all required columns', () => {
      const createTableQuery = executedQueries.find((q) =>
        q.includes('CREATE TABLE "category_mappings"'),
      );
      expect(createTableQuery).toBeDefined();

      // Check for primary key
      expect(createTableQuery).toContain('"id" uuid NOT NULL');
      expect(createTableQuery).toContain('uuid_generate_v4()');

      // Check for foreign key columns
      expect(createTableQuery).toContain('"dataSourceId" uuid NOT NULL');
      expect(createTableQuery).toContain('"canonicalCategoryId" uuid NOT NULL');

      // Check for mapping columns
      expect(createTableQuery).toContain('"sourceCategory" character varying(200) NOT NULL');
      expect(createTableQuery).toContain('"sourceCategoryName" character varying(500)');
      expect(createTableQuery).toContain('"notes" text');

      // Check for confidence column with default
      expect(createTableQuery).toContain('"confidence" decimal(3, 2) NOT NULL DEFAULT 1.0');

      // Check for audit columns
      expect(createTableQuery).toContain('"isActive" boolean NOT NULL DEFAULT true');
      expect(createTableQuery).toContain('"createdAt" TIMESTAMP NOT NULL DEFAULT now()');
      expect(createTableQuery).toContain('"updatedAt" TIMESTAMP NOT NULL DEFAULT now()');
    });

    it('should create unique constraint on (dataSourceId, sourceCategory)', () => {
      const uniqueConstraintQuery = executedQueries.find((q) =>
        q.includes('ADD CONSTRAINT "UQ_category_mappings_source"'),
      );
      expect(uniqueConstraintQuery).toBeDefined();
      expect(uniqueConstraintQuery).toContain('UNIQUE ("dataSourceId", "sourceCategory")');
    });

    it('should create unique index for source lookup', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE UNIQUE INDEX "IDX_category_mappings_source_lookup"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('("dataSourceId", "sourceCategory")');
    });

    it('should create index on canonicalCategoryId for reverse lookups', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_category_mappings_canonical"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('("canonicalCategoryId")');
    });

    it('should create index on sourceCategory for pattern matching', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_category_mappings_source_category"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('("sourceCategory")');
    });

    it('should create partial index on isActive=true', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_category_mappings_active"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('WHERE "isActive" = true');
    });

    it('should create foreign key to data_sources with CASCADE', () => {
      const fkQuery = executedQueries.find((q) =>
        q.includes('CONSTRAINT "FK_category_mappings_data_source"'),
      );
      expect(fkQuery).toBeDefined();
      expect(fkQuery).toContain('FOREIGN KEY ("dataSourceId")');
      expect(fkQuery).toContain('REFERENCES "data_sources" ("id")');
      expect(fkQuery).toContain('ON DELETE CASCADE');
    });

    it('should create foreign key to crime_categories with CASCADE', () => {
      const fkQuery = executedQueries.find((q) =>
        q.includes('CONSTRAINT "FK_category_mappings_crime_category"'),
      );
      expect(fkQuery).toBeDefined();
      expect(fkQuery).toContain('FOREIGN KEY ("canonicalCategoryId")');
      expect(fkQuery).toContain('REFERENCES "crime_categories" ("id")');
      expect(fkQuery).toContain('ON DELETE CASCADE');
    });

    it('should add table and column comments for documentation', () => {
      const tableComment = executedQueries.find((q) =>
        q.includes('COMMENT ON TABLE "category_mappings"'),
      );
      expect(tableComment).toBeDefined();
      expect(tableComment).toContain('canonical 20-category taxonomy');

      const sourceCategoryComment = executedQueries.find((q) =>
        q.includes('COMMENT ON COLUMN "category_mappings"."sourceCategory"'),
      );
      expect(sourceCategoryComment).toBeDefined();

      const confidenceComment = executedQueries.find((q) =>
        q.includes('COMMENT ON COLUMN "category_mappings"."confidence"'),
      );
      expect(confidenceComment).toBeDefined();
    });
  });

  describe('down()', () => {
    beforeEach(async () => {
      await migration.down(mockQueryRunner);
    });

    it('should drop foreign key constraints', () => {
      const dropCategoryFk = executedQueries.find((q) =>
        q.includes('DROP CONSTRAINT IF EXISTS "FK_category_mappings_crime_category"'),
      );
      const dropDataSourceFk = executedQueries.find((q) =>
        q.includes('DROP CONSTRAINT IF EXISTS "FK_category_mappings_data_source"'),
      );

      expect(dropCategoryFk).toBeDefined();
      expect(dropDataSourceFk).toBeDefined();
    });

    it('should drop unique constraint', () => {
      const dropUniqueConstraint = executedQueries.find((q) =>
        q.includes('DROP CONSTRAINT IF EXISTS "UQ_category_mappings_source"'),
      );
      expect(dropUniqueConstraint).toBeDefined();
    });

    it('should drop all indexes', () => {
      const expectedIndexes = [
        'IDX_category_mappings_active',
        'IDX_category_mappings_source_category',
        'IDX_category_mappings_canonical',
        'IDX_category_mappings_source_lookup',
      ];

      for (const indexName of expectedIndexes) {
        const dropIndexQuery = executedQueries.find((q) =>
          q.includes(`DROP INDEX IF EXISTS "${indexName}"`),
        );
        expect(dropIndexQuery).toBeDefined();
      }
    });

    it('should drop table', () => {
      const dropTableQuery = executedQueries.find((q) =>
        q.includes('DROP TABLE IF EXISTS "category_mappings"'),
      );
      expect(dropTableQuery).toBeDefined();
    });

    it('should drop constraints before table (dependency order)', () => {
      const dropFkIndex = executedQueries.findIndex((q) =>
        q.includes('DROP CONSTRAINT'),
      );
      const dropTableIndex = executedQueries.findIndex((q) =>
        q.includes('DROP TABLE'),
      );
      expect(dropFkIndex).toBeLessThan(dropTableIndex);
    });
  });

  describe('mapping quality tracking', () => {
    it('should use decimal(3,2) for confidence scores (0.00 to 1.00)', async () => {
      await migration.up(mockQueryRunner);
      const createTableQuery = executedQueries.find((q) =>
        q.includes('CREATE TABLE "category_mappings"'),
      );
      expect(createTableQuery).toContain('"confidence" decimal(3, 2)');
    });

    it('should default confidence to 1.0 (exact match)', async () => {
      await migration.up(mockQueryRunner);
      const createTableQuery = executedQueries.find((q) =>
        q.includes('CREATE TABLE "category_mappings"'),
      );
      expect(createTableQuery).toContain('DEFAULT 1.0');
    });
  });

  describe('source category uniqueness', () => {
    it('should enforce unique mapping per source category per data source', async () => {
      await migration.up(mockQueryRunner);

      // Both unique constraint and unique index exist for redundancy
      const uniqueConstraint = executedQueries.find((q) =>
        q.includes('UQ_category_mappings_source'),
      );
      const uniqueIndex = executedQueries.find((q) =>
        q.includes('IDX_category_mappings_source_lookup'),
      );

      expect(uniqueConstraint).toBeDefined();
      expect(uniqueIndex).toBeDefined();
    });
  });
});
