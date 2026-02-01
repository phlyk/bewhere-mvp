/**
 * Unit tests for ETL Run Logger
 */

import { DataSource } from 'typeorm';
import {
    createEtlRunLogger,
    EtlRunLogger,
    EtlRunStatus,
    StartRunOptions,
} from './etl-run-logger';

// Mock logger
jest.mock('./logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('EtlRunLogger', () => {
  let mockDataSource: jest.Mocked<DataSource>;
  let etlRunLogger: EtlRunLogger;
  const mockRunId = '123e4567-e89b-12d3-a456-426614174000';
  const mockDataSourceId = '987fcdeb-51a2-3bc4-d567-890123456789';

  beforeEach(() => {
    mockDataSource = {
      query: jest.fn(),
    } as unknown as jest.Mocked<DataSource>;
    etlRunLogger = new EtlRunLogger(mockDataSource);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create an instance with the provided data source', () => {
      expect(etlRunLogger).toBeInstanceOf(EtlRunLogger);
    });

    it('should initialize with no run in progress', () => {
      expect(etlRunLogger.isRunning()).toBe(false);
      expect(etlRunLogger.getRunId()).toBeNull();
    });
  });

  describe('createEtlRunLogger', () => {
    it('should create an EtlRunLogger instance', () => {
      const logger = createEtlRunLogger(mockDataSource);
      expect(logger).toBeInstanceOf(EtlRunLogger);
    });
  });

  describe('startRun', () => {
    const startOptions: StartRunOptions = {
      dataSourceId: mockDataSourceId,
      sourceUrl: 'https://data.gouv.fr/test.csv',
      runName: 'Test Run',
      metadata: { version: '1.0' },
    };

    beforeEach(() => {
      mockDataSource.query.mockResolvedValue([{ id: mockRunId }]);
    });

    it('should insert a new run record and return the ID', async () => {
      const runId = await etlRunLogger.startRun(startOptions);

      expect(runId).toBe(mockRunId);
      expect(mockDataSource.query).toHaveBeenCalledTimes(1);
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO etl_runs'),
        expect.arrayContaining([
          mockDataSourceId,
          'https://data.gouv.fr/test.csv',
          'Test Run',
          EtlRunStatus.RUNNING,
        ]),
      );
    });

    it('should set status to RUNNING', async () => {
      await etlRunLogger.startRun(startOptions);

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([EtlRunStatus.RUNNING]),
      );
    });

    it('should initialize row counts to 0', async () => {
      await etlRunLogger.startRun(startOptions);

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([0, 0, 0, 0, 0, 0]),
      );
    });

    it('should mark the logger as running after start', async () => {
      await etlRunLogger.startRun(startOptions);

      expect(etlRunLogger.isRunning()).toBe(true);
      expect(etlRunLogger.getRunId()).toBe(mockRunId);
    });

    it('should handle null runName', async () => {
      await etlRunLogger.startRun({
        dataSourceId: mockDataSourceId,
        sourceUrl: 'https://example.com/data.csv',
      });

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([null]),
      );
    });

    it('should store metadata as JSON', async () => {
      await etlRunLogger.startRun(startOptions);

      const queryCall = mockDataSource.query.mock.calls[0];
      expect(queryCall[1]).toContainEqual(JSON.stringify({ version: '1.0' }));
    });

    it('should throw an error if database insert fails', async () => {
      mockDataSource.query.mockRejectedValue(new Error('Connection error'));

      await expect(etlRunLogger.startRun(startOptions)).rejects.toThrow(
        'Failed to start ETL run: Error: Connection error',
      );
    });
  });

  describe('updateRun', () => {
    beforeEach(async () => {
      mockDataSource.query.mockResolvedValue([{ id: mockRunId }]);
      await etlRunLogger.startRun({
        dataSourceId: mockDataSourceId,
        sourceUrl: 'https://example.com/data.csv',
      });
      mockDataSource.query.mockClear();
      mockDataSource.query.mockResolvedValue([]);
    });

    it('should update row counts', async () => {
      await etlRunLogger.updateRun({
        rowsExtracted: 100,
        rowsTransformed: 95,
        rowsLoaded: 90,
        rowsSkipped: 5,
      });

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE etl_runs'),
        expect.arrayContaining([100, 95, 90, 5]),
      );
    });

    it('should accumulate error messages', async () => {
      await etlRunLogger.updateRun({
        errors: ['Error 1', 'Error 2'],
      });

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('error_count'),
        expect.arrayContaining([2, JSON.stringify(['Error 1', 'Error 2'])]),
      );
    });

    it('should accumulate warning messages across updates', async () => {
      await etlRunLogger.updateRun({ warnings: ['Warning 1'] });
      mockDataSource.query.mockClear();
      mockDataSource.query.mockResolvedValue([]);

      await etlRunLogger.updateRun({ warnings: ['Warning 2'] });

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('warning_count'),
        expect.arrayContaining([
          2,
          JSON.stringify(['Warning 1', 'Warning 2']),
        ]),
      );
    });

    it('should merge metadata across updates', async () => {
      await etlRunLogger.updateRun({ metadata: { key1: 'value1' } });
      mockDataSource.query.mockClear();
      mockDataSource.query.mockResolvedValue([]);

      await etlRunLogger.updateRun({ metadata: { key2: 'value2' } });

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('metadata'),
        expect.arrayContaining([
          JSON.stringify({ key1: 'value1', key2: 'value2' }),
        ]),
      );
    });

    it('should not throw if no run is in progress', async () => {
      const newLogger = new EtlRunLogger(mockDataSource);
      await expect(newLogger.updateRun({ rowsExtracted: 10 })).resolves.not.toThrow();
    });

    it('should not throw if database update fails', async () => {
      mockDataSource.query.mockRejectedValue(new Error('Update failed'));

      await expect(
        etlRunLogger.updateRun({ rowsExtracted: 10 }),
      ).resolves.not.toThrow();
    });
  });

  describe('completeRun', () => {
    beforeEach(async () => {
      mockDataSource.query.mockResolvedValue([{ id: mockRunId }]);
      await etlRunLogger.startRun({
        dataSourceId: mockDataSourceId,
        sourceUrl: 'https://example.com/data.csv',
      });
      mockDataSource.query.mockClear();
      mockDataSource.query.mockResolvedValue([]);
    });

    it('should update status to COMPLETED', async () => {
      await etlRunLogger.completeRun({
        status: EtlRunStatus.COMPLETED,
        rowsExtracted: 100,
        rowsTransformed: 95,
        rowsLoaded: 95,
      });

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE etl_runs'),
        expect.arrayContaining([EtlRunStatus.COMPLETED]),
      );
    });

    it('should set completed_at and duration_ms', async () => {
      await etlRunLogger.completeRun({ status: EtlRunStatus.COMPLETED });

      const queryCall = mockDataSource.query.mock.calls[0];
      expect(queryCall[0]).toContain('completed_at');
      expect(queryCall[0]).toContain('duration_ms');
    });

    it('should reset logger state after completion', async () => {
      await etlRunLogger.completeRun({ status: EtlRunStatus.COMPLETED });

      expect(etlRunLogger.isRunning()).toBe(false);
      expect(etlRunLogger.getRunId()).toBeNull();
    });

    it('should handle COMPLETED_WITH_WARNINGS status', async () => {
      await etlRunLogger.completeRun({
        status: EtlRunStatus.COMPLETED_WITH_WARNINGS,
        warnings: ['Some data was skipped'],
      });

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([EtlRunStatus.COMPLETED_WITH_WARNINGS]),
      );
    });

    it('should handle FAILED status', async () => {
      await etlRunLogger.completeRun({
        status: EtlRunStatus.FAILED,
        errors: ['Critical error occurred'],
      });

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([EtlRunStatus.FAILED]),
      );
    });

    it('should not throw if no run is in progress', async () => {
      const newLogger = new EtlRunLogger(mockDataSource);
      await expect(
        newLogger.completeRun({ status: EtlRunStatus.COMPLETED }),
      ).resolves.not.toThrow();
    });
  });

  describe('failRun', () => {
    beforeEach(async () => {
      mockDataSource.query.mockResolvedValue([{ id: mockRunId }]);
      await etlRunLogger.startRun({
        dataSourceId: mockDataSourceId,
        sourceUrl: 'https://example.com/data.csv',
      });
      mockDataSource.query.mockClear();
      mockDataSource.query.mockResolvedValue([]);
    });

    it('should complete run with FAILED status', async () => {
      await etlRunLogger.failRun(new Error('Something went wrong'));

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([EtlRunStatus.FAILED]),
      );
    });

    it('should add error message from Error object', async () => {
      await etlRunLogger.failRun(new Error('Specific error message'));

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([
          JSON.stringify(['Specific error message']),
        ]),
      );
    });

    it('should add error message from string', async () => {
      await etlRunLogger.failRun('String error message');

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([
          JSON.stringify(['String error message']),
        ]),
      );
    });

    it('should include additional options', async () => {
      await etlRunLogger.failRun(new Error('Error'), {
        rowsExtracted: 50,
        rowsTransformed: 25,
      });

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([50, 25]),
      );
    });
  });

  describe('cancelRun', () => {
    beforeEach(async () => {
      mockDataSource.query.mockResolvedValue([{ id: mockRunId }]);
      await etlRunLogger.startRun({
        dataSourceId: mockDataSourceId,
        sourceUrl: 'https://example.com/data.csv',
      });
      mockDataSource.query.mockClear();
      mockDataSource.query.mockResolvedValue([]);
    });

    it('should complete run with CANCELLED status', async () => {
      await etlRunLogger.cancelRun();

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([EtlRunStatus.CANCELLED]),
      );
    });

    it('should add cancellation reason as warning', async () => {
      await etlRunLogger.cancelRun('User requested cancellation');

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([
          1, // warning count
          JSON.stringify(['Run cancelled: User requested cancellation']),
        ]),
      );
    });
  });

  describe('addError and addWarning', () => {
    beforeEach(async () => {
      mockDataSource.query.mockResolvedValue([{ id: mockRunId }]);
      await etlRunLogger.startRun({
        dataSourceId: mockDataSourceId,
        sourceUrl: 'https://example.com/data.csv',
      });
      mockDataSource.query.mockClear();
      mockDataSource.query.mockResolvedValue([]);
    });

    it('should accumulate errors from addError', async () => {
      etlRunLogger.addError('Error 1');
      etlRunLogger.addError('Error 2');

      await etlRunLogger.completeRun({ status: EtlRunStatus.FAILED });

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([
          2,
          JSON.stringify(['Error 1', 'Error 2']),
        ]),
      );
    });

    it('should accumulate warnings from addWarning', async () => {
      etlRunLogger.addWarning('Warning 1');
      etlRunLogger.addWarning('Warning 2');

      await etlRunLogger.completeRun({
        status: EtlRunStatus.COMPLETED_WITH_WARNINGS,
      });

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([
          2,
          JSON.stringify(['Warning 1', 'Warning 2']),
        ]),
      );
    });
  });

  describe('getRunHistory', () => {
    it('should query run history for a data source', async () => {
      const mockRuns = [
        {
          id: mockRunId,
          dataSourceId: mockDataSourceId,
          status: EtlRunStatus.COMPLETED,
        },
      ];
      mockDataSource.query.mockResolvedValue(mockRuns);

      const history = await etlRunLogger.getRunHistory(mockDataSourceId, 5);

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [mockDataSourceId, 5],
      );
      expect(history).toEqual(mockRuns);
    });

    it('should return empty array on error', async () => {
      mockDataSource.query.mockRejectedValue(new Error('Query failed'));

      const history = await etlRunLogger.getRunHistory(mockDataSourceId);

      expect(history).toEqual([]);
    });

    it('should default to 10 records', async () => {
      mockDataSource.query.mockResolvedValue([]);

      await etlRunLogger.getRunHistory(mockDataSourceId);

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.anything(),
        [mockDataSourceId, 10],
      );
    });
  });

  describe('getLastSuccessfulRun', () => {
    it('should query for last successful run', async () => {
      const mockRun = {
        id: mockRunId,
        status: EtlRunStatus.COMPLETED,
      };
      mockDataSource.query.mockResolvedValue([mockRun]);

      const lastRun = await etlRunLogger.getLastSuccessfulRun(mockDataSourceId);

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY completed_at DESC'),
        expect.arrayContaining([
          mockDataSourceId,
          EtlRunStatus.COMPLETED,
          EtlRunStatus.COMPLETED_WITH_WARNINGS,
        ]),
      );
      expect(lastRun).toEqual(mockRun);
    });

    it('should return null if no successful run exists', async () => {
      mockDataSource.query.mockResolvedValue([]);

      const lastRun = await etlRunLogger.getLastSuccessfulRun(mockDataSourceId);

      expect(lastRun).toBeNull();
    });

    it('should return null on error', async () => {
      mockDataSource.query.mockRejectedValue(new Error('Query failed'));

      const lastRun = await etlRunLogger.getLastSuccessfulRun(mockDataSourceId);

      expect(lastRun).toBeNull();
    });
  });

  describe('hasRunningRun', () => {
    it('should return true if a run is in progress', async () => {
      mockDataSource.query.mockResolvedValue([{ id: 'some-id' }]);

      const hasRunning = await etlRunLogger.hasRunningRun(mockDataSourceId);

      expect(hasRunning).toBe(true);
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('status = $2'),
        [mockDataSourceId, EtlRunStatus.RUNNING],
      );
    });

    it('should return false if no run is in progress', async () => {
      mockDataSource.query.mockResolvedValue([]);

      const hasRunning = await etlRunLogger.hasRunningRun(mockDataSourceId);

      expect(hasRunning).toBe(false);
    });

    it('should return false on error', async () => {
      mockDataSource.query.mockRejectedValue(new Error('Query failed'));

      const hasRunning = await etlRunLogger.hasRunningRun(mockDataSourceId);

      expect(hasRunning).toBe(false);
    });
  });

  describe('cleanupStaleRuns', () => {
    it('should update stale runs to FAILED status', async () => {
      mockDataSource.query.mockResolvedValue([null, 3]);

      const cleaned = await etlRunLogger.cleanupStaleRuns(3600000);

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE etl_runs SET'),
        expect.arrayContaining([EtlRunStatus.FAILED, EtlRunStatus.RUNNING]),
      );
      expect(cleaned).toBe(3);
    });

    it('should use custom maxAge', async () => {
      mockDataSource.query.mockResolvedValue([null, 0]);

      await etlRunLogger.cleanupStaleRuns(1800000); // 30 minutes

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([EtlRunStatus.FAILED, EtlRunStatus.RUNNING]),
      );
    });

    it('should return 0 on error', async () => {
      mockDataSource.query.mockRejectedValue(new Error('Query failed'));

      const cleaned = await etlRunLogger.cleanupStaleRuns();

      expect(cleaned).toBe(0);
    });
  });

  describe('message truncation', () => {
    beforeEach(async () => {
      mockDataSource.query.mockResolvedValue([{ id: mockRunId }]);
      await etlRunLogger.startRun({
        dataSourceId: mockDataSourceId,
        sourceUrl: 'https://example.com/data.csv',
      });
      mockDataSource.query.mockClear();
      mockDataSource.query.mockResolvedValue([]);
    });

    it('should limit error messages to MAX_MESSAGES (100)', async () => {
      const manyErrors = Array.from({ length: 150 }, (_, i) => `Error ${i + 1}`);

      await etlRunLogger.updateRun({ errors: manyErrors });

      const queryCall = mockDataSource.query.mock.calls[0];
      const queryArgs = queryCall[1] ?? [];
      const errorMessagesJson = queryArgs.find(
        (arg: unknown) => typeof arg === 'string' && arg.includes('Error 51'),
      );
      const errorMessages = JSON.parse(errorMessagesJson as string);

      // Should keep last 100 messages (51-150)
      expect(errorMessages.length).toBe(100);
      expect(errorMessages[0]).toBe('Error 51');
      expect(errorMessages[99]).toBe('Error 150');
    });
  });
});
