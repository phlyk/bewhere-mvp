import { CreateDataSources1707004800000 } from './1707004800000-CreateDataSources';

describe('CreateDataSources1707004800000', () => {
  let migration: CreateDataSources1707004800000;
  let mockQueryRunner: any;
  let executedQueries: string[];

  beforeEach(() => {
    migration = new CreateDataSources1707004800000();
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
      expect(migration.name).toBe('CreateDataSources1707004800000');
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

    it('should create update_frequency_enum type with all values', () => {
      const enumQuery = executedQueries.find((q) =>
        q.includes('CREATE TYPE "update_frequency_enum"'),
      );
      expect(enumQuery).toBeDefined();

      const expectedFrequencies = [
        'realtime',
        'daily',
        'weekly',
        'monthly',
        'quarterly',
        'yearly',
        'irregular',
        'historical',
      ];
      for (const freq of expectedFrequencies) {
        expect(enumQuery).toContain(`'${freq}'`);
      }
    });

    it('should create data_sources table with all required columns', () => {
      const createTableQuery = executedQueries.find((q) =>
        q.includes('CREATE TABLE "data_sources"'),
      );
      expect(createTableQuery).toBeDefined();

      // Check for primary key
      expect(createTableQuery).toContain('"id" uuid NOT NULL');
      expect(createTableQuery).toContain('uuid_generate_v4()');

      // Check for required columns
      expect(createTableQuery).toContain('"code" character varying(50) NOT NULL');
      expect(createTableQuery).toContain('"name" character varying(255) NOT NULL');
      expect(createTableQuery).toContain('"url" character varying(2048) NOT NULL');

      // Check for optional columns
      expect(createTableQuery).toContain('"nameFr" character varying(255)');
      expect(createTableQuery).toContain('"description" text');
      expect(createTableQuery).toContain('"apiEndpoint" character varying(2048)');
      expect(createTableQuery).toContain('"provider" character varying(255)');
      expect(createTableQuery).toContain('"license" character varying(255)');
      expect(createTableQuery).toContain('"attribution" text');
      expect(createTableQuery).toContain('"countryCode" char(2)');
      expect(createTableQuery).toContain('"dataStartYear" smallint');
      expect(createTableQuery).toContain('"dataEndYear" smallint');

      // Check for JSONB metadata column
      expect(createTableQuery).toContain('"metadata" jsonb');

      // Check for timestamps and audit fields
      expect(createTableQuery).toContain('"isActive" boolean NOT NULL DEFAULT true');
      expect(createTableQuery).toContain('"lastImportedAt" TIMESTAMP');
      expect(createTableQuery).toContain('"createdAt" TIMESTAMP NOT NULL DEFAULT now()');
      expect(createTableQuery).toContain('"updatedAt" TIMESTAMP NOT NULL DEFAULT now()');

      // Check for enum column with default
      expect(createTableQuery).toContain('"updateFrequency" update_frequency_enum NOT NULL DEFAULT \'irregular\'');
    });

    it('should create unique index on code', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE UNIQUE INDEX "IDX_data_sources_code"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('("code")');
    });

    it('should create index on updateFrequency', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_data_sources_update_frequency"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('("updateFrequency")');
    });

    it('should create index on countryCode', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_data_sources_country_code"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('("countryCode")');
    });

    it('should create index on isActive', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_data_sources_is_active"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('("isActive")');
    });

    it('should add table comment for documentation', () => {
      const commentQuery = executedQueries.find((q) =>
        q.includes('COMMENT ON TABLE "data_sources"'),
      );
      expect(commentQuery).toBeDefined();
      expect(commentQuery).toContain('External data sources');
    });

    it('should add column comment for code', () => {
      const codeComment = executedQueries.find((q) =>
        q.includes('COMMENT ON COLUMN "data_sources"."code"'),
      );
      expect(codeComment).toBeDefined();
      expect(codeComment).toContain('ETAT4001_MONTHLY');
    });
  });

  describe('down()', () => {
    beforeEach(async () => {
      await migration.down(mockQueryRunner);
    });

    it('should drop table', () => {
      const dropTableQuery = executedQueries.find((q) =>
        q.includes('DROP TABLE "data_sources"'),
      );
      expect(dropTableQuery).toBeDefined();
    });

    it('should drop enum type', () => {
      const dropEnumQuery = executedQueries.find((q) =>
        q.includes('DROP TYPE "update_frequency_enum"'),
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

  describe('JSONB support', () => {
    it('should support JSONB metadata for extensibility', async () => {
      await migration.up(mockQueryRunner);
      const createTableQuery = executedQueries.find((q) =>
        q.includes('CREATE TABLE "data_sources"'),
      );
      expect(createTableQuery).toContain('"metadata" jsonb');
    });
  });

  describe('update frequency enum', () => {
    it('should include all expected update frequencies', async () => {
      await migration.up(mockQueryRunner);
      const enumQuery = executedQueries.find((q) =>
        q.includes('CREATE TYPE "update_frequency_enum"'),
      );

      // All expected frequencies for BeWhere data sources
      expect(enumQuery).toContain("'realtime'"); // Future real-time feeds
      expect(enumQuery).toContain("'daily'"); // Daily updates
      expect(enumQuery).toContain("'weekly'"); // Weekly snapshots
      expect(enumQuery).toContain("'monthly'"); // Monthly État 4001
      expect(enumQuery).toContain("'quarterly'"); // Quarterly reports
      expect(enumQuery).toContain("'yearly'"); // Annual data
      expect(enumQuery).toContain("'irregular'"); // Ad-hoc updates
      expect(enumQuery).toContain("'historical'"); // Historical datasets
    });
  });
});
