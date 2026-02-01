/**
 * Report Formatter Tests
 *
 * Unit tests for ETL logging/reporting formatter utilities.
 */

import type { EtlRunRecord } from './etl-run-logger';
import { EtlRunStatus } from './etl-run-logger';
import {
    createBatchSummary,
    createProgressBar,
    formatBatchSummary,
    formatDuration,
    formatEtlRunRecord,
    formatLogEntry,
    formatNumber,
    formatPipelineOneLine,
    formatPipelineSummary,
    formatRunHistoryTable,
    formatTimestamp,
    generateBatchJsonReport,
    generateJsonReport,
    getStatusIcon,
    getStatusLabel,
    PipelineResult,
    stripColors,
} from './report-formatter';

describe('Report Formatter', () => {
  // Sample pipeline result for testing
  const createSampleResult = (overrides: Partial<PipelineResult> = {}): PipelineResult => ({
    name: 'test-pipeline',
    status: 'completed',
    startedAt: new Date('2026-02-01T10:00:00Z'),
    completedAt: new Date('2026-02-01T10:05:30Z'),
    durationMs: 330000,
    extraction: {
      rowCount: 1000,
      warnings: [],
    },
    transformation: {
      transformedCount: 950,
      skippedCount: 50,
      errors: [],
      warnings: [],
    },
    load: {
      insertedCount: 800,
      updatedCount: 150,
      skippedCount: 0,
      errors: [],
      warnings: [],
    },
    stats: {
      rowsExtracted: 1000,
      rowsTransformed: 950,
      rowsLoaded: 800,
      rowsSkipped: 50,
      errorCount: 0,
      warningCount: 0,
    },
    ...overrides,
  });

  // Sample ETL run record for testing
  const createSampleRunRecord = (overrides: Partial<EtlRunRecord> = {}): EtlRunRecord => ({
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    dataSourceId: 'ds-123',
    runName: 'État 4001 Import',
    sourceUrl: 'https://data.gouv.fr/datasets/etat-4001.csv',
    status: EtlRunStatus.COMPLETED,
    startedAt: new Date('2026-02-01T10:00:00Z'),
    completedAt: new Date('2026-02-01T10:05:30Z'),
    durationMs: 330000,
    rowsExtracted: 1000,
    rowsTransformed: 950,
    rowsLoaded: 800,
    rowsSkipped: 50,
    errorCount: 0,
    warningCount: 0,
    errorMessages: null,
    warningMessages: null,
    metadata: null,
    ...overrides,
  });

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(0)).toBe('0ms');
      expect(formatDuration(999)).toBe('999ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(1000)).toBe('1.0s');
      expect(formatDuration(1500)).toBe('1.5s');
      expect(formatDuration(59999)).toBe('60.0s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(60000)).toBe('1m 0s');
      expect(formatDuration(90000)).toBe('1m 30s');
      expect(formatDuration(3599999)).toBe('59m 59s');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(3600000)).toBe('1h 0m');
      expect(formatDuration(5400000)).toBe('1h 30m');
      expect(formatDuration(7200000)).toBe('2h 0m');
    });
  });

  describe('formatNumber', () => {
    it('should format small numbers', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(999)).toBe('999');
    });

    it('should format numbers with thousands separators', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1234567)).toBe('1,234,567');
      expect(formatNumber(1000000000)).toBe('1,000,000,000');
    });
  });

  describe('formatTimestamp', () => {
    const testDate = new Date('2026-02-01T10:30:45.000Z');

    it('should format as ISO string', () => {
      expect(formatTimestamp(testDate, { format: 'iso' })).toBe('2026-02-01T10:30:45.000Z');
    });

    it('should format as time only', () => {
      const result = formatTimestamp(testDate, { format: 'time', timezone: 'UTC' });
      expect(result).toBe('10:30:45');
    });

    it('should format as local string', () => {
      const result = formatTimestamp(testDate, { format: 'local', timezone: 'UTC' });
      expect(result).toContain('2026');
      expect(result).toContain('Feb');
      expect(result).toContain('01');
    });
  });

  describe('getStatusIcon', () => {
    it('should return correct icon for each status', () => {
      expect(stripColors(getStatusIcon('completed'))).toBe('✓');
      expect(stripColors(getStatusIcon('completed_with_warnings'))).toBe('⚠');
      expect(stripColors(getStatusIcon('failed'))).toBe('✗');
      expect(stripColors(getStatusIcon(EtlRunStatus.RUNNING))).toBe('●');
      expect(stripColors(getStatusIcon(EtlRunStatus.CANCELLED))).toBe('○');
    });

    it('should include color codes when enabled', () => {
      const result = getStatusIcon('completed', true);
      expect(result).toContain('\x1b[');
    });

    it('should not include color codes when disabled', () => {
      const result = getStatusIcon('completed', false);
      expect(result).not.toContain('\x1b[');
    });
  });

  describe('getStatusLabel', () => {
    it('should return correct label for each status', () => {
      expect(stripColors(getStatusLabel('completed'))).toBe('COMPLETED');
      expect(stripColors(getStatusLabel('completed_with_warnings'))).toBe('COMPLETED WITH WARNINGS');
      expect(stripColors(getStatusLabel('failed'))).toBe('FAILED');
      expect(stripColors(getStatusLabel(EtlRunStatus.RUNNING))).toBe('RUNNING');
      expect(stripColors(getStatusLabel(EtlRunStatus.CANCELLED))).toBe('CANCELLED');
    });
  });

  describe('formatPipelineSummary', () => {
    it('should format a successful pipeline result', () => {
      const result = createSampleResult();
      const output = formatPipelineSummary(result, { colors: false });

      expect(output).toContain('Pipeline:');
      expect(output).toContain('test-pipeline');
      expect(output).toContain('COMPLETED');
      expect(output).toContain('Duration:');
      expect(output).toContain('5m 30s');
      expect(output).toContain('Rows extracted:');
      expect(output).toContain('1,000');
      expect(output).toContain('Rows loaded:');
      expect(output).toContain('800');
    });

    it('should format a pipeline with errors', () => {
      const result = createSampleResult({
        status: 'completed_with_warnings',
        transformation: {
          transformedCount: 950,
          skippedCount: 50,
          errors: [
            { row: 10, message: 'Invalid data format' },
            { row: 25, message: 'Missing required field' },
          ],
          warnings: [],
        },
        stats: {
          rowsExtracted: 1000,
          rowsTransformed: 950,
          rowsLoaded: 800,
          rowsSkipped: 50,
          errorCount: 2,
          warningCount: 0,
        },
      });

      const output = formatPipelineSummary(result, { colors: false });

      expect(output).toContain('COMPLETED WITH WARNINGS');
      expect(output).toContain('Errors:');
      expect(output).toContain('2');
      expect(output).toContain('Invalid data format');
      expect(output).toContain('Missing required field');
    });

    it('should format a pipeline with warnings', () => {
      const result = createSampleResult({
        status: 'completed_with_warnings',
        extraction: {
          rowCount: 1000,
          warnings: ['Using cached data (file not modified)'],
        },
        stats: {
          rowsExtracted: 1000,
          rowsTransformed: 950,
          rowsLoaded: 800,
          rowsSkipped: 50,
          errorCount: 0,
          warningCount: 1,
        },
      });

      const output = formatPipelineSummary(result, { colors: false });

      expect(output).toContain('Warnings:');
      expect(output).toContain('Using cached data');
    });

    it('should format a failed pipeline', () => {
      const result = createSampleResult({
        status: 'failed',
        error: 'Connection timeout',
        load: undefined,
        stats: {
          rowsExtracted: 500,
          rowsTransformed: 500,
          rowsLoaded: 0,
          rowsSkipped: 0,
          errorCount: 1,
          warningCount: 0,
        },
      });

      const output = formatPipelineSummary(result, { colors: false });

      expect(output).toContain('FAILED');
      expect(output).toContain('Error: Connection timeout');
    });

    it('should respect maxMessages option', () => {
      const result = createSampleResult({
        status: 'completed_with_warnings',
        extraction: {
          rowCount: 1000,
          warnings: Array.from({ length: 20 }, (_, i) => `Warning ${i + 1}`),
        },
        stats: {
          rowsExtracted: 1000,
          rowsTransformed: 950,
          rowsLoaded: 800,
          rowsSkipped: 50,
          errorCount: 0,
          warningCount: 20,
        },
      });

      const output = formatPipelineSummary(result, { colors: false, maxMessages: 5 });

      expect(output).toContain('Warning 1');
      expect(output).toContain('Warning 5');
      expect(output).not.toContain('Warning 6');
      expect(output).toContain('... and 15 more warnings');
    });

    it('should hide details when includeDetails is false', () => {
      const result = createSampleResult({
        status: 'completed_with_warnings',
        extraction: {
          rowCount: 1000,
          warnings: ['Some warning'],
        },
        stats: {
          rowsExtracted: 1000,
          rowsTransformed: 950,
          rowsLoaded: 800,
          rowsSkipped: 50,
          errorCount: 0,
          warningCount: 1,
        },
      });

      const output = formatPipelineSummary(result, { colors: false, includeDetails: false });

      expect(output).toContain('Warnings:');
      expect(output).not.toContain('Some warning');
    });
  });

  describe('formatPipelineOneLine', () => {
    it('should format a successful pipeline as one line', () => {
      const result = createSampleResult();
      const output = formatPipelineOneLine(result, { colors: false });

      expect(output).toContain('✓');
      expect(output).toContain('test-pipeline');
      expect(output).toContain('800');
      expect(output).toContain('5m 30s');
    });

    it('should include error count for pipelines with errors', () => {
      const result = createSampleResult({
        status: 'completed_with_warnings',
        stats: {
          ...createSampleResult().stats,
          errorCount: 5,
          warningCount: 3,
        },
      });

      const output = formatPipelineOneLine(result, { colors: false });

      expect(output).toContain('5 errors');
      expect(output).toContain('3 warnings');
    });
  });

  describe('createBatchSummary', () => {
    it('should create summary from multiple pipeline results', () => {
      const results = [
        createSampleResult({ name: 'pipeline-1' }),
        createSampleResult({ name: 'pipeline-2', status: 'completed_with_warnings' }),
        createSampleResult({ name: 'pipeline-3', status: 'failed', durationMs: 10000 }),
      ];

      const summary = createBatchSummary(results);

      expect(summary.pipelines).toHaveLength(3);
      expect(summary.successCount).toBe(1);
      expect(summary.warningCount).toBe(1);
      expect(summary.failedCount).toBe(1);
      expect(summary.totalDurationMs).toBe(330000 + 330000 + 10000);
      expect(summary.totalRowsExtracted).toBe(3000);
      expect(summary.totalRowsLoaded).toBe(2400);
    });

    it('should handle empty results array', () => {
      const summary = createBatchSummary([]);

      expect(summary.pipelines).toHaveLength(0);
      expect(summary.successCount).toBe(0);
      expect(summary.warningCount).toBe(0);
      expect(summary.failedCount).toBe(0);
      expect(summary.totalDurationMs).toBe(0);
    });
  });

  describe('formatBatchSummary', () => {
    it('should format batch summary with multiple pipelines', () => {
      const results = [
        createSampleResult({ name: 'pipeline-1' }),
        createSampleResult({ name: 'pipeline-2', status: 'completed_with_warnings' }),
      ];

      const output = formatBatchSummary(results, { colors: false });

      expect(output).toContain('ETL BATCH SUMMARY');
      expect(output).toContain('Pipeline Results:');
      expect(output).toContain('pipeline-1');
      expect(output).toContain('pipeline-2');
      expect(output).toContain('Aggregate Statistics:');
      expect(output).toContain('Total pipelines:');
      expect(output).toContain('2');
      expect(output).toContain('Successful:');
      expect(output).toContain('1');
      expect(output).toContain('With warnings:');
    });
  });

  describe('formatEtlRunRecord', () => {
    it('should format an ETL run record', () => {
      const record = createSampleRunRecord();
      const output = formatEtlRunRecord(record, { colors: false });

      expect(output).toContain('ETL Run:');
      expect(output).toContain('État 4001 Import');
      expect(output).toContain('COMPLETED');
      expect(output).toContain('Run ID:');
      expect(output).toContain('a1b2c3d4');
      expect(output).toContain('Source:');
      expect(output).toContain('data.gouv.fr');
      expect(output).toContain('Statistics:');
      expect(output).toContain('1,000');
    });

    it('should format record with errors', () => {
      const record = createSampleRunRecord({
        status: EtlRunStatus.COMPLETED_WITH_WARNINGS,
        errorCount: 2,
        errorMessages: ['Error 1', 'Error 2'],
      });

      const output = formatEtlRunRecord(record, { colors: false });

      expect(output).toContain('COMPLETED WITH WARNINGS');
      expect(output).toContain('Errors:');
      expect(output).toContain('Error 1');
      expect(output).toContain('Error 2');
    });

    it('should format record with metadata', () => {
      const record = createSampleRunRecord({
        metadata: {
          dryRun: false,
          force: true,
          sourceFile: 'data.csv',
        },
      });

      const output = formatEtlRunRecord(record, { colors: false });

      expect(output).toContain('Metadata:');
      expect(output).toContain('dryRun');
      expect(output).toContain('force');
      expect(output).toContain('sourceFile');
    });
  });

  describe('formatRunHistoryTable', () => {
    it('should format empty history', () => {
      const output = formatRunHistoryTable([], { colors: false });
      expect(output).toBe('No run history available.');
    });

    it('should format run history as table', () => {
      const records = [
        createSampleRunRecord(),
        createSampleRunRecord({
          id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
          runName: 'Time Series Import',
          status: EtlRunStatus.FAILED,
          errorCount: 3,
        }),
      ];

      const output = formatRunHistoryTable(records, { colors: false });

      expect(output).toContain('Status');
      expect(output).toContain('Started');
      expect(output).toContain('Duration');
      expect(output).toContain('Loaded');
      expect(output).toContain('Errors');
      expect(output).toContain('Run Name');
      expect(output).toContain('OK');
      expect(output).toContain('FAIL');
      expect(output).toContain('État 4001');
      expect(output).toContain('Time Series');
      expect(output).toContain('Total: 2 runs');
    });
  });

  describe('generateJsonReport', () => {
    it('should generate valid JSON report', () => {
      const result = createSampleResult();
      const jsonStr = generateJsonReport(result);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.name).toBe('test-pipeline');
      expect(parsed.status).toBe('completed');
      expect(parsed.timing.durationMs).toBe(330000);
      expect(parsed.timing.durationFormatted).toBe('5m 30s');
      expect(parsed.statistics.rowsExtracted).toBe(1000);
      expect(parsed.statistics.rowsLoaded).toBe(800);
    });

    it('should include extraction details', () => {
      const result = createSampleResult();
      const parsed = JSON.parse(generateJsonReport(result));

      expect(parsed.extraction).not.toBeNull();
      expect(parsed.extraction.rowCount).toBe(1000);
    });

    it('should include transformation details', () => {
      const result = createSampleResult();
      const parsed = JSON.parse(generateJsonReport(result));

      expect(parsed.transformation).not.toBeNull();
      expect(parsed.transformation.transformedCount).toBe(950);
      expect(parsed.transformation.skippedCount).toBe(50);
    });

    it('should include error in failed pipeline', () => {
      const result = createSampleResult({
        status: 'failed',
        error: 'Connection failed',
      });
      const parsed = JSON.parse(generateJsonReport(result));

      expect(parsed.error).toBe('Connection failed');
    });
  });

  describe('generateBatchJsonReport', () => {
    it('should generate valid batch JSON report', () => {
      const results = [
        createSampleResult({ name: 'pipeline-1' }),
        createSampleResult({ name: 'pipeline-2' }),
      ];

      const jsonStr = generateBatchJsonReport(results);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.summary).toBeDefined();
      expect(parsed.summary.pipelineCount).toBe(2);
      expect(parsed.summary.successCount).toBe(2);
      expect(parsed.pipelines).toHaveLength(2);
      expect(parsed.pipelines[0].name).toBe('pipeline-1');
      expect(parsed.pipelines[1].name).toBe('pipeline-2');
    });
  });

  describe('createProgressBar', () => {
    it('should create progress bar at 0%', () => {
      const bar = createProgressBar(0, 100, 10, { useColor: false });
      expect(bar).toContain('░░░░░░░░░░');
      expect(bar).toContain('0%');
    });

    it('should create progress bar at 50%', () => {
      const bar = createProgressBar(50, 100, 10, { useColor: false });
      expect(bar).toContain('█████░░░░░');
      expect(bar).toContain('50%');
    });

    it('should create progress bar at 100%', () => {
      const bar = createProgressBar(100, 100, 10, { useColor: false });
      expect(bar).toContain('██████████');
      expect(bar).toContain('100%');
    });

    it('should handle edge case of total = 0', () => {
      const bar = createProgressBar(0, 0, 10, { useColor: false });
      expect(bar).toContain('0%');
    });

    it('should hide percentage when showPercentage is false', () => {
      const bar = createProgressBar(50, 100, 10, { useColor: false, showPercentage: false });
      expect(bar).not.toContain('%');
    });
  });

  describe('formatLogEntry', () => {
    it('should format info log entry', () => {
      const entry = formatLogEntry('info', 'Test message');
      expect(entry).toContain('[INFO]');
      expect(entry).toContain('Test message');
      expect(entry).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should format error log entry', () => {
      const entry = formatLogEntry('error', 'Error occurred');
      expect(entry).toContain('[ERROR]');
      expect(entry).toContain('Error occurred');
    });

    it('should include context when provided', () => {
      const entry = formatLogEntry('warn', 'Warning message', 'TestContext');
      expect(entry).toContain('[WARN]');
      expect(entry).toContain('[TestContext]');
      expect(entry).toContain('Warning message');
    });
  });

  describe('stripColors', () => {
    it('should remove ANSI color codes', () => {
      const colored = '\x1b[32m✓\x1b[0m COMPLETED';
      const stripped = stripColors(colored);
      expect(stripped).toBe('✓ COMPLETED');
    });

    it('should handle strings without colors', () => {
      const plain = 'No colors here';
      expect(stripColors(plain)).toBe(plain);
    });

    it('should handle multiple color codes', () => {
      const colored = '\x1b[1m\x1b[31mBOLD RED\x1b[0m and \x1b[32mGREEN\x1b[0m';
      const stripped = stripColors(colored);
      expect(stripped).toBe('BOLD RED and GREEN');
    });
  });
});
