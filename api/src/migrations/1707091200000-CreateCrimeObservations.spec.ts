import { CreateCrimeObservations1707091200000 } from './1707091200000-CreateCrimeObservations';

describe('CreateCrimeObservations1707091200000', () => {
  let migration: CreateCrimeObservations1707091200000;
  let mockQueryRunner: any;
  let executedQueries: string[];

  beforeEach(() => {
    migration = new CreateCrimeObservations1707091200000();
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
      expect(migration.name).toBe('CreateCrimeObservations1707091200000');
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

    it('should create time_granularity_enum type', () => {
      const enumQuery = executedQueries.find((q) =>
        q.includes('CREATE TYPE "time_granularity_enum"'),
      );
      expect(enumQuery).toBeDefined();
      expect(enumQuery).toContain("'monthly'");
      expect(enumQuery).toContain("'quarterly'");
      expect(enumQuery).toContain("'yearly'");
    });

    it('should create crime_observations table with all required columns', () => {
      const createTableQuery = executedQueries.find((q) =>
        q.includes('CREATE TABLE "crime_observations"'),
      );
      expect(createTableQuery).toBeDefined();

      // Check for primary key
      expect(createTableQuery).toContain('"id" uuid NOT NULL');
      expect(createTableQuery).toContain('uuid_generate_v4()');

      // Check for foreign key columns
      expect(createTableQuery).toContain('"areaId" uuid NOT NULL');
      expect(createTableQuery).toContain('"categoryId" uuid NOT NULL');
      expect(createTableQuery).toContain('"dataSourceId" uuid NOT NULL');

      // Check for time columns
      expect(createTableQuery).toContain('"year" smallint NOT NULL');
      expect(createTableQuery).toContain('"month" smallint');
      expect(createTableQuery).toContain('"granularity" time_granularity_enum NOT NULL DEFAULT \'yearly\'');

      // Check for data columns
      expect(createTableQuery).toContain('"count" integer NOT NULL');
      expect(createTableQuery).toContain('"ratePer100k" decimal(12, 4)');
      expect(createTableQuery).toContain('"populationUsed" integer');

      // Check for audit columns
      expect(createTableQuery).toContain('"isValidated" boolean NOT NULL DEFAULT false');
      expect(createTableQuery).toContain('"notes" character varying(500)');
      expect(createTableQuery).toContain('"createdAt" TIMESTAMP NOT NULL DEFAULT now()');
      expect(createTableQuery).toContain('"updatedAt" TIMESTAMP NOT NULL DEFAULT now()');
    });

    it('should create foreign key to administrative_areas with CASCADE', () => {
      const fkQuery = executedQueries.find((q) =>
        q.includes('CONSTRAINT "FK_crime_observations_area"'),
      );
      expect(fkQuery).toBeDefined();
      expect(fkQuery).toContain('FOREIGN KEY ("areaId")');
      expect(fkQuery).toContain('REFERENCES "administrative_areas"("id")');
      expect(fkQuery).toContain('ON DELETE CASCADE');
    });

    it('should create foreign key to crime_categories with CASCADE', () => {
      const fkQuery = executedQueries.find((q) =>
        q.includes('CONSTRAINT "FK_crime_observations_category"'),
      );
      expect(fkQuery).toBeDefined();
      expect(fkQuery).toContain('FOREIGN KEY ("categoryId")');
      expect(fkQuery).toContain('REFERENCES "crime_categories"("id")');
      expect(fkQuery).toContain('ON DELETE CASCADE');
    });

    it('should create foreign key to data_sources with CASCADE', () => {
      const fkQuery = executedQueries.find((q) =>
        q.includes('CONSTRAINT "FK_crime_observations_data_source"'),
      );
      expect(fkQuery).toBeDefined();
      expect(fkQuery).toContain('FOREIGN KEY ("dataSourceId")');
      expect(fkQuery).toContain('REFERENCES "data_sources"("id")');
      expect(fkQuery).toContain('ON DELETE CASCADE');
    });

    it('should create composite unique index to prevent duplicates', () => {
      const uniqueIndexQuery = executedQueries.find((q) =>
        q.includes('CREATE UNIQUE INDEX "IDX_crime_observations_unique"'),
      );
      expect(uniqueIndexQuery).toBeDefined();
      expect(uniqueIndexQuery).toContain('"areaId"');
      expect(uniqueIndexQuery).toContain('"categoryId"');
      expect(uniqueIndexQuery).toContain('"dataSourceId"');
      expect(uniqueIndexQuery).toContain('"year"');
      expect(uniqueIndexQuery).toContain('COALESCE("month", 0)');
    });

    it('should create individual indexes for common query patterns', () => {
      const areaIndex = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_crime_observations_area"'),
      );
      const categoryIndex = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_crime_observations_category"'),
      );
      const dataSourceIndex = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_crime_observations_data_source"'),
      );
      const yearIndex = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_crime_observations_year"'),
      );

      expect(areaIndex).toBeDefined();
      expect(categoryIndex).toBeDefined();
      expect(dataSourceIndex).toBeDefined();
      expect(yearIndex).toBeDefined();
    });

    it('should create composite index for common API query patterns', () => {
      const compositeIndex = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_crime_observations_composite"'),
      );
      expect(compositeIndex).toBeDefined();
      expect(compositeIndex).toContain('"areaId", "categoryId", "year", "dataSourceId"');
    });

    it('should create time series index for year+month queries', () => {
      const timeSeriesIndex = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_crime_observations_time_series"'),
      );
      expect(timeSeriesIndex).toBeDefined();
      expect(timeSeriesIndex).toContain('"year", "month"');
    });

    it('should create partial index on validation status', () => {
      const validatedIndex = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_crime_observations_validated"'),
      );
      expect(validatedIndex).toBeDefined();
      expect(validatedIndex).toContain('WHERE "isValidated" = false');
    });

    it('should add table and column comments for documentation', () => {
      const tableComment = executedQueries.find((q) =>
        q.includes('COMMENT ON TABLE "crime_observations"'),
      );
      expect(tableComment).toBeDefined();

      const areaIdComment = executedQueries.find((q) =>
        q.includes('COMMENT ON COLUMN "crime_observations"."areaId"'),
      );
      const categoryIdComment = executedQueries.find((q) =>
        q.includes('COMMENT ON COLUMN "crime_observations"."categoryId"'),
      );
      const dataSourceIdComment = executedQueries.find((q) =>
        q.includes('COMMENT ON COLUMN "crime_observations"."dataSourceId"'),
      );

      expect(areaIdComment).toBeDefined();
      expect(categoryIdComment).toBeDefined();
      expect(dataSourceIdComment).toBeDefined();
    });
  });

  describe('down()', () => {
    beforeEach(async () => {
      await migration.down(mockQueryRunner);
    });

    it('should drop table (which cascades to indexes and constraints)', () => {
      const dropTableQuery = executedQueries.find((q) =>
        q.includes('DROP TABLE "crime_observations"'),
      );
      expect(dropTableQuery).toBeDefined();
    });

    it('should drop enum type', () => {
      const dropEnumQuery = executedQueries.find((q) =>
        q.includes('DROP TYPE "time_granularity_enum"'),
      );
      expect(dropEnumQuery).toBeDefined();
    });

    it('should drop table before enum (dependency order)', () => {
      const dropTableIndex = executedQueries.findIndex((q) =>
        q.includes('DROP TABLE'),
      );
      const dropEnumIndex = executedQueries.findIndex((q) =>
        q.includes('DROP TYPE'),
      );
      expect(dropTableIndex).toBeLessThan(dropEnumIndex);
    });
  });

  describe('data integrity', () => {
    it('should use COALESCE in unique constraint to handle NULL months', async () => {
      await migration.up(mockQueryRunner);
      const uniqueIndex = executedQueries.find((q) =>
        q.includes('IDX_crime_observations_unique'),
      );
      // Uses COALESCE to treat NULL month as 0 for uniqueness
      expect(uniqueIndex).toContain('COALESCE("month", 0)');
    });

    it('should have precise decimal for ratePer100k (12,4)', async () => {
      await migration.up(mockQueryRunner);
      const createTableQuery = executedQueries.find((q) =>
        q.includes('CREATE TABLE "crime_observations"'),
      );
      expect(createTableQuery).toContain('decimal(12, 4)');
    });
  });
});
