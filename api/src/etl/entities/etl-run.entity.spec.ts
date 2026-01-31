import { EtlRun, EtlRunStatus } from './etl-run.entity';

describe('EtlRun Entity', () => {
  describe('EtlRunStatus enum', () => {
    it('should have correct values', () => {
      expect(EtlRunStatus.RUNNING).toBe('running');
      expect(EtlRunStatus.COMPLETED).toBe('completed');
      expect(EtlRunStatus.COMPLETED_WITH_WARNINGS).toBe(
        'completed_with_warnings',
      );
      expect(EtlRunStatus.FAILED).toBe('failed');
      expect(EtlRunStatus.CANCELLED).toBe('cancelled');
    });

    it('should have exactly 5 status values', () => {
      const statusValues = Object.values(EtlRunStatus);
      expect(statusValues).toHaveLength(5);
    });

    it('should contain expected common statuses', () => {
      const statusValues = Object.values(EtlRunStatus);
      expect(statusValues).toContain('running');
      expect(statusValues).toContain('completed');
      expect(statusValues).toContain('failed');
    });

    it('should have a warning status for partial failures', () => {
      expect(EtlRunStatus.COMPLETED_WITH_WARNINGS).toBeDefined();
      expect(EtlRunStatus.COMPLETED_WITH_WARNINGS).toBe(
        'completed_with_warnings',
      );
    });
  });

  describe('EtlRun class', () => {
    let etlRun: EtlRun;

    beforeEach(() => {
      etlRun = new EtlRun();
    });

    it('should create an instance', () => {
      expect(etlRun).toBeDefined();
      expect(etlRun).toBeInstanceOf(EtlRun);
    });

    describe('id property', () => {
      it('should allow setting UUID id', () => {
        const uuid = '550e8400-e29b-41d4-a716-446655440000';
        etlRun.id = uuid;
        expect(etlRun.id).toBe(uuid);
      });
    });

    describe('dataSourceId property', () => {
      it('should allow setting dataSourceId', () => {
        const dataSourceId = '123e4567-e89b-12d3-a456-426614174000';
        etlRun.dataSourceId = dataSourceId;
        expect(etlRun.dataSourceId).toBe(dataSourceId);
      });
    });

    describe('runName property', () => {
      it('should allow setting run name', () => {
        etlRun.runName = 'État 4001 June 2024';
        expect(etlRun.runName).toBe('État 4001 June 2024');
      });

      it('should allow null run name', () => {
        etlRun.runName = null;
        expect(etlRun.runName).toBeNull();
      });

      it('should handle descriptive names with special characters', () => {
        etlRun.runName = "Time Series Q2'24 – Full Import";
        expect(etlRun.runName).toBe("Time Series Q2'24 – Full Import");
      });
    });

    describe('sourceUrl property', () => {
      it('should allow setting source URL', () => {
        const url = 'https://data.gouv.fr/datasets/crimes/juin-2024.csv';
        etlRun.sourceUrl = url;
        expect(etlRun.sourceUrl).toBe(url);
      });

      it('should handle long URLs', () => {
        const longUrl =
          'https://data.gouv.fr/' +
          'path/'.repeat(100) +
          'file.csv?token=abc123';
        etlRun.sourceUrl = longUrl;
        expect(etlRun.sourceUrl).toBe(longUrl);
      });
    });

    describe('status property', () => {
      it('should allow setting status', () => {
        etlRun.status = EtlRunStatus.RUNNING;
        expect(etlRun.status).toBe(EtlRunStatus.RUNNING);
      });

      it('should accept all status enum values', () => {
        Object.values(EtlRunStatus).forEach((status) => {
          etlRun.status = status;
          expect(etlRun.status).toBe(status);
        });
      });

      it('should track success status', () => {
        etlRun.status = EtlRunStatus.COMPLETED;
        expect(etlRun.status).toBe('completed');
      });

      it('should track failure status', () => {
        etlRun.status = EtlRunStatus.FAILED;
        expect(etlRun.status).toBe('failed');
      });
    });

    describe('timestamp properties', () => {
      it('should allow setting startedAt', () => {
        const startTime = new Date('2024-07-01T00:00:00Z');
        etlRun.startedAt = startTime;
        expect(etlRun.startedAt).toBe(startTime);
      });

      it('should allow setting completedAt', () => {
        const endTime = new Date('2024-07-01T00:15:00Z');
        etlRun.completedAt = endTime;
        expect(etlRun.completedAt).toBe(endTime);
      });

      it('should allow null completedAt for running tasks', () => {
        etlRun.completedAt = null;
        expect(etlRun.completedAt).toBeNull();
      });

      it('should allow setting durationMs', () => {
        etlRun.durationMs = 900000; // 15 minutes
        expect(etlRun.durationMs).toBe(900000);
      });

      it('should allow null durationMs for running tasks', () => {
        etlRun.durationMs = null;
        expect(etlRun.durationMs).toBeNull();
      });
    });

    describe('row count properties', () => {
      it('should allow setting rowsExtracted', () => {
        etlRun.rowsExtracted = 111;
        expect(etlRun.rowsExtracted).toBe(111);
      });

      it('should allow setting rowsTransformed', () => {
        etlRun.rowsTransformed = 107;
        expect(etlRun.rowsTransformed).toBe(107);
      });

      it('should allow setting rowsLoaded', () => {
        etlRun.rowsLoaded = 10486;
        expect(etlRun.rowsLoaded).toBe(10486);
      });

      it('should allow setting rowsSkipped', () => {
        etlRun.rowsSkipped = 4;
        expect(etlRun.rowsSkipped).toBe(4);
      });

      it('should handle zero row counts', () => {
        etlRun.rowsExtracted = 0;
        etlRun.rowsTransformed = 0;
        etlRun.rowsLoaded = 0;
        expect(etlRun.rowsExtracted).toBe(0);
        expect(etlRun.rowsTransformed).toBe(0);
        expect(etlRun.rowsLoaded).toBe(0);
      });

      it('should handle large row counts', () => {
        etlRun.rowsLoaded = 1000000;
        expect(etlRun.rowsLoaded).toBe(1000000);
      });
    });

    describe('error/warning properties', () => {
      it('should allow setting errorCount', () => {
        etlRun.errorCount = 5;
        expect(etlRun.errorCount).toBe(5);
      });

      it('should allow setting warningCount', () => {
        etlRun.warningCount = 10;
        expect(etlRun.warningCount).toBe(10);
      });

      it('should allow zero error/warning counts', () => {
        etlRun.errorCount = 0;
        etlRun.warningCount = 0;
        expect(etlRun.errorCount).toBe(0);
        expect(etlRun.warningCount).toBe(0);
      });

      it('should allow setting errorMessages as array', () => {
        etlRun.errorMessages = [
          'Failed to parse row 42',
          'Invalid date format',
        ];
        expect(etlRun.errorMessages).toHaveLength(2);
        expect(etlRun.errorMessages).toContain('Failed to parse row 42');
      });

      it('should allow null errorMessages', () => {
        etlRun.errorMessages = null;
        expect(etlRun.errorMessages).toBeNull();
      });

      it('should allow setting warningMessages as array', () => {
        etlRun.warningMessages = [
          'Missing optional field: population',
          'Rate calculation skipped',
        ];
        expect(etlRun.warningMessages).toHaveLength(2);
      });

      it('should allow null warningMessages', () => {
        etlRun.warningMessages = null;
        expect(etlRun.warningMessages).toBeNull();
      });
    });

    describe('metadata property', () => {
      it('should allow setting metadata', () => {
        const metadata = {
          encoding: 'latin-1',
          fileSize: 1024000,
          checksum: 'sha256:abc123',
        };
        etlRun.metadata = metadata;
        expect(etlRun.metadata).toEqual(metadata);
      });

      it('should allow null metadata', () => {
        etlRun.metadata = null;
        expect(etlRun.metadata).toBeNull();
      });

      it('should handle nested metadata objects', () => {
        const metadata = {
          source: {
            encoding: 'latin-1',
            delimiter: ';',
          },
          validation: {
            checksumMatch: true,
            rowCountMatch: true,
          },
        };
        etlRun.metadata = metadata;
        expect(etlRun.metadata).toEqual(metadata);
      });
    });

    describe('audit timestamps', () => {
      it('should have createdAt property', () => {
        const now = new Date();
        etlRun.createdAt = now;
        expect(etlRun.createdAt).toBe(now);
      });

      it('should have updatedAt property', () => {
        const now = new Date();
        etlRun.updatedAt = now;
        expect(etlRun.updatedAt).toBe(now);
      });
    });
  });

  describe('EtlRun usage scenarios', () => {
    describe('successful import scenario', () => {
      it('should represent a successful ETL run', () => {
        const etlRun = new EtlRun();
        etlRun.id = '550e8400-e29b-41d4-a716-446655440000';
        etlRun.dataSourceId = '123e4567-e89b-12d3-a456-426614174000';
        etlRun.runName = 'État 4001 June 2024';
        etlRun.sourceUrl = 'https://data.gouv.fr/datasets/crimes/juin-2024.csv';
        etlRun.status = EtlRunStatus.COMPLETED;
        etlRun.startedAt = new Date('2024-07-01T00:00:00Z');
        etlRun.completedAt = new Date('2024-07-01T00:15:00Z');
        etlRun.durationMs = 900000;
        etlRun.rowsExtracted = 111;
        etlRun.rowsTransformed = 107;
        etlRun.rowsLoaded = 10486;
        etlRun.rowsSkipped = 4;
        etlRun.errorCount = 0;
        etlRun.warningCount = 0;

        expect(etlRun.status).toBe(EtlRunStatus.COMPLETED);
        expect(etlRun.errorCount).toBe(0);
        expect(etlRun.rowsLoaded).toBeGreaterThan(etlRun.rowsExtracted);
      });
    });

    describe('failed import scenario', () => {
      it('should represent a failed ETL run', () => {
        const etlRun = new EtlRun();
        etlRun.id = '550e8400-e29b-41d4-a716-446655440001';
        etlRun.dataSourceId = '123e4567-e89b-12d3-a456-426614174000';
        etlRun.sourceUrl = 'https://data.gouv.fr/datasets/crimes/series.csv';
        etlRun.status = EtlRunStatus.FAILED;
        etlRun.startedAt = new Date('2024-07-01T00:00:00Z');
        etlRun.completedAt = new Date('2024-07-01T00:01:00Z');
        etlRun.durationMs = 60000;
        etlRun.rowsExtracted = 0;
        etlRun.rowsTransformed = 0;
        etlRun.rowsLoaded = 0;
        etlRun.errorCount = 1;
        etlRun.errorMessages = ['Failed to download: 503 Service Unavailable'];

        expect(etlRun.status).toBe(EtlRunStatus.FAILED);
        expect(etlRun.errorCount).toBe(1);
        expect(etlRun.errorMessages).toHaveLength(1);
        expect(etlRun.rowsLoaded).toBe(0);
      });
    });

    describe('partial success scenario', () => {
      it('should represent a run with warnings', () => {
        const etlRun = new EtlRun();
        etlRun.status = EtlRunStatus.COMPLETED_WITH_WARNINGS;
        etlRun.rowsExtracted = 100;
        etlRun.rowsTransformed = 95;
        etlRun.rowsLoaded = 95;
        etlRun.rowsSkipped = 5;
        etlRun.warningCount = 5;
        etlRun.warningMessages = [
          'Skipped row 10: Invalid category code',
          'Skipped row 25: Missing required field',
          'Skipped row 42: Duplicate entry',
          'Skipped row 67: Invalid date',
          'Skipped row 89: Negative count value',
        ];

        expect(etlRun.status).toBe(EtlRunStatus.COMPLETED_WITH_WARNINGS);
        expect(etlRun.rowsSkipped).toBe(5);
        expect(etlRun.warningCount).toBe(5);
        expect(etlRun.rowsTransformed).toBeLessThan(etlRun.rowsExtracted);
      });
    });

    describe('running task scenario', () => {
      it('should represent an in-progress ETL run', () => {
        const etlRun = new EtlRun();
        etlRun.status = EtlRunStatus.RUNNING;
        etlRun.startedAt = new Date();
        etlRun.completedAt = null;
        etlRun.durationMs = null;
        etlRun.rowsExtracted = 50;
        etlRun.rowsTransformed = 45;
        etlRun.rowsLoaded = 40;

        expect(etlRun.status).toBe(EtlRunStatus.RUNNING);
        expect(etlRun.completedAt).toBeNull();
        expect(etlRun.durationMs).toBeNull();
      });
    });
  });

  describe('EtlRun data validation expectations', () => {
    it('should expect rowsTransformed <= rowsExtracted', () => {
      const etlRun = new EtlRun();
      etlRun.rowsExtracted = 100;
      etlRun.rowsTransformed = 95;
      etlRun.rowsSkipped = 5;

      expect(etlRun.rowsTransformed).toBeLessThanOrEqual(etlRun.rowsExtracted);
      expect(etlRun.rowsTransformed + etlRun.rowsSkipped).toBe(
        etlRun.rowsExtracted,
      );
    });

    it('should allow rowsLoaded > rowsExtracted for 1:N transforms', () => {
      const etlRun = new EtlRun();
      etlRun.rowsExtracted = 111; // 111 crime category rows
      etlRun.rowsTransformed = 107; // 107 active categories
      etlRun.rowsLoaded = 10486; // 107 categories × 98 départements

      expect(etlRun.rowsLoaded).toBeGreaterThan(etlRun.rowsExtracted);
    });

    it('should calculate duration correctly', () => {
      const startTime = new Date('2024-07-01T00:00:00Z');
      const endTime = new Date('2024-07-01T00:15:00Z');
      const expectedDuration = endTime.getTime() - startTime.getTime();

      expect(expectedDuration).toBe(900000); // 15 minutes in ms
    });
  });
});
