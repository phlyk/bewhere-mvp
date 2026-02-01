import { CreateEtlRuns1707264000000 } from './1707264000000-CreateEtlRuns';

describe('CreateEtlRuns1707264000000', () => {
  let migration: CreateEtlRuns1707264000000;
  let mockQueryRunner: any;
  let executedQueries: string[];

  beforeEach(() => {
    migration = new CreateEtlRuns1707264000000();
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
      expect(migration.name).toBe('CreateEtlRuns1707264000000');
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

    it('should create etl_run_status_enum with all lifecycle states', () => {
      const enumQuery = executedQueries.find((q) =>
        q.includes('CREATE TYPE "etl_run_status_enum"'),
      );
      expect(enumQuery).toBeDefined();

      const expectedStatuses = [
        'running',
        'completed',
        'completed_with_warnings',
        'failed',
        'cancelled',
      ];
      for (const status of expectedStatuses) {
        expect(enumQuery).toContain(`'${status}'`);
      }
    });

    it('should create etl_runs table with all required columns', () => {
      const createTableQuery = executedQueries.find((q) =>
        q.includes('CREATE TABLE "etl_runs"'),
      );
      expect(createTableQuery).toBeDefined();

      // Check for primary key
      expect(createTableQuery).toContain('"id" uuid NOT NULL');
      expect(createTableQuery).toContain('uuid_generate_v4()');

      // Check for foreign key column
      expect(createTableQuery).toContain('"dataSourceId" uuid NOT NULL');

      // Check for run identification
      expect(createTableQuery).toContain('"runName" character varying(255)');
      expect(createTableQuery).toContain('"sourceUrl" character varying(2048) NOT NULL');

      // Check for status and timing
      expect(createTableQuery).toContain('"status" etl_run_status_enum NOT NULL DEFAULT \'running\'');
      expect(createTableQuery).toContain('"startedAt" TIMESTAMP NOT NULL');
      expect(createTableQuery).toContain('"completedAt" TIMESTAMP');
      expect(createTableQuery).toContain('"durationMs" integer');

      // Check for row counters
      expect(createTableQuery).toContain('"rowsExtracted" integer NOT NULL DEFAULT 0');
      expect(createTableQuery).toContain('"rowsTransformed" integer NOT NULL DEFAULT 0');
      expect(createTableQuery).toContain('"rowsLoaded" integer NOT NULL DEFAULT 0');
      expect(createTableQuery).toContain('"rowsSkipped" integer NOT NULL DEFAULT 0');

      // Check for error/warning tracking
      expect(createTableQuery).toContain('"errorCount" integer NOT NULL DEFAULT 0');
      expect(createTableQuery).toContain('"warningCount" integer NOT NULL DEFAULT 0');
      expect(createTableQuery).toContain('"errorMessages" jsonb');
      expect(createTableQuery).toContain('"warningMessages" jsonb');

      // Check for JSONB metadata
      expect(createTableQuery).toContain('"metadata" jsonb');

      // Check for timestamps
      expect(createTableQuery).toContain('"createdAt" TIMESTAMP NOT NULL DEFAULT now()');
      expect(createTableQuery).toContain('"updatedAt" TIMESTAMP NOT NULL DEFAULT now()');
    });

    it('should create composite index on (dataSourceId, startedAt) for querying runs by source', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_etl_runs_source_started"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('("dataSourceId", "startedAt" DESC)');
    });

    it('should create index on status for filtering by run state', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_etl_runs_status"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('("status")');
    });

    it('should create index on startedAt for time-based queries', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_etl_runs_started"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('("startedAt" DESC)');
    });

    it('should create partial index on running runs for quick "in progress" checks', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_etl_runs_running"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('WHERE "status" = \'running\'');
    });

    it('should create partial index on failed runs for monitoring', () => {
      const indexQuery = executedQueries.find((q) =>
        q.includes('CREATE INDEX "IDX_etl_runs_failed"'),
      );
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('WHERE "status" = \'failed\'');
    });

    it('should create foreign key to data_sources with CASCADE', () => {
      const fkQuery = executedQueries.find((q) =>
        q.includes('CONSTRAINT "FK_etl_runs_data_source"'),
      );
      expect(fkQuery).toBeDefined();
      expect(fkQuery).toContain('FOREIGN KEY ("dataSourceId")');
      expect(fkQuery).toContain('REFERENCES "data_sources"("id")');
      expect(fkQuery).toContain('ON DELETE CASCADE');
    });

    it('should add table and column comments for documentation', () => {
      const tableComment = executedQueries.find((q) =>
        q.includes('COMMENT ON TABLE "etl_runs"'),
      );
      expect(tableComment).toBeDefined();
      expect(tableComment).toContain('Audit log for ETL operations');

      const rowsExtractedComment = executedQueries.find((q) =>
        q.includes('COMMENT ON COLUMN "etl_runs"."rowsExtracted"'),
      );
      const rowsTransformedComment = executedQueries.find((q) =>
        q.includes('COMMENT ON COLUMN "etl_runs"."rowsTransformed"'),
      );
      const rowsLoadedComment = executedQueries.find((q) =>
        q.includes('COMMENT ON COLUMN "etl_runs"."rowsLoaded"'),
      );

      expect(rowsExtractedComment).toBeDefined();
      expect(rowsTransformedComment).toBeDefined();
      expect(rowsLoadedComment).toBeDefined();
    });
  });

  describe('down()', () => {
    beforeEach(async () => {
      await migration.down(mockQueryRunner);
    });

    it('should drop foreign key constraint', () => {
      const dropFk = executedQueries.find((q) =>
        q.includes('DROP CONSTRAINT "FK_etl_runs_data_source"'),
      );
      expect(dropFk).toBeDefined();
    });

    it('should drop all indexes', () => {
      const expectedIndexes = [
        'IDX_etl_runs_failed',
        'IDX_etl_runs_running',
        'IDX_etl_runs_started',
        'IDX_etl_runs_status',
        'IDX_etl_runs_source_started',
      ];

      for (const indexName of expectedIndexes) {
        const dropIndexQuery = executedQueries.find((q) =>
          q.includes(`DROP INDEX "${indexName}"`),
        );
        expect(dropIndexQuery).toBeDefined();
      }
    });

    it('should drop table', () => {
      const dropTableQuery = executedQueries.find((q) =>
        q.includes('DROP TABLE "etl_runs"'),
      );
      expect(dropTableQuery).toBeDefined();
    });

    it('should drop enum type', () => {
      const dropEnumQuery = executedQueries.find((q) =>
        q.includes('DROP TYPE "etl_run_status_enum"'),
      );
      expect(dropEnumQuery).toBeDefined();
    });

    it('should drop constraint before table (dependency order)', () => {
      const dropFkIndex = executedQueries.findIndex((q) =>
        q.includes('DROP CONSTRAINT'),
      );
      const dropTableIndex = executedQueries.findIndex((q) =>
        q.includes('DROP TABLE'),
      );
      expect(dropFkIndex).toBeLessThan(dropTableIndex);
    });
  });

  describe('ETL lifecycle support', () => {
    it('should support all ETL run states', async () => {
      await migration.up(mockQueryRunner);
      const enumQuery = executedQueries.find((q) =>
        q.includes('CREATE TYPE "etl_run_status_enum"'),
      );

      // Verify all lifecycle states
      expect(enumQuery).toContain("'running'"); // Currently executing
      expect(enumQuery).toContain("'completed'"); // Finished successfully
      expect(enumQuery).toContain("'completed_with_warnings'"); // Finished with non-fatal issues
      expect(enumQuery).toContain("'failed'"); // Fatal error occurred
      expect(enumQuery).toContain("'cancelled'"); // Manually stopped
    });

    it('should default new runs to running status', async () => {
      await migration.up(mockQueryRunner);
      const createTableQuery = executedQueries.find((q) =>
        q.includes('CREATE TABLE "etl_runs"'),
      );
      expect(createTableQuery).toContain("DEFAULT 'running'");
    });
  });

  describe('JSONB support for extensibility', () => {
    it('should use JSONB for error and warning messages', async () => {
      await migration.up(mockQueryRunner);
      const createTableQuery = executedQueries.find((q) =>
        q.includes('CREATE TABLE "etl_runs"'),
      );
      expect(createTableQuery).toContain('"errorMessages" jsonb');
      expect(createTableQuery).toContain('"warningMessages" jsonb');
    });

    it('should use JSONB for extensible metadata', async () => {
      await migration.up(mockQueryRunner);
      const createTableQuery = executedQueries.find((q) =>
        q.includes('CREATE TABLE "etl_runs"'),
      );
      expect(createTableQuery).toContain('"metadata" jsonb');
    });
  });

  describe('ETL metrics tracking', () => {
    it('should track all ETL stage row counts', async () => {
      await migration.up(mockQueryRunner);
      const createTableQuery = executedQueries.find((q) =>
        q.includes('CREATE TABLE "etl_runs"'),
      );

      expect(createTableQuery).toContain('"rowsExtracted"');
      expect(createTableQuery).toContain('"rowsTransformed"');
      expect(createTableQuery).toContain('"rowsLoaded"');
      expect(createTableQuery).toContain('"rowsSkipped"');
    });

    it('should track duration in milliseconds', async () => {
      await migration.up(mockQueryRunner);
      const createTableQuery = executedQueries.find((q) =>
        q.includes('CREATE TABLE "etl_runs"'),
      );
      expect(createTableQuery).toContain('"durationMs" integer');
    });
  });
});
