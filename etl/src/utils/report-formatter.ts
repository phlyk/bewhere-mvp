/**
 * ETL Report Formatter
 *
 * Provides formatted output for ETL pipeline runs including:
 * - Console-friendly summaries with color coding
 * - Detailed text reports for logging
 * - JSON reports for programmatic consumption
 * - Duration and row count formatting
 */

import { EtlRunRecord, EtlRunStatus } from './etl-run-logger';

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Background
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
} as const;

/**
 * Pipeline result interface (from pipeline.ts)
 */
export interface PipelineResult {
  name: string;
  status: 'completed' | 'completed_with_warnings' | 'failed';
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  extraction?: {
    rowCount: number;
    warnings: string[];
  };
  transformation?: {
    transformedCount: number;
    skippedCount: number;
    errors: Array<{ row: number; message: string }>;
    warnings: string[];
  };
  load?: {
    insertedCount: number;
    updatedCount: number;
    skippedCount: number;
    errors: Array<{ message: string }>;
    warnings: string[];
  };
  error?: string;
  stats: {
    rowsExtracted: number;
    rowsTransformed: number;
    rowsLoaded: number;
    rowsSkipped: number;
    errorCount: number;
    warningCount: number;
  };
}

/**
 * Report format options
 */
export interface ReportOptions {
  /** Include ANSI color codes (default: true) */
  colors?: boolean;
  /** Include detailed error/warning messages (default: true) */
  includeDetails?: boolean;
  /** Maximum number of errors/warnings to show (default: 10) */
  maxMessages?: number;
  /** Include timestamps (default: true) */
  includeTimestamps?: boolean;
  /** Timezone for timestamps (default: system timezone) */
  timezone?: string;
}

/**
 * Multi-pipeline summary for batch runs
 */
export interface BatchSummary {
  pipelines: PipelineResult[];
  totalDurationMs: number;
  totalRowsExtracted: number;
  totalRowsTransformed: number;
  totalRowsLoaded: number;
  totalRowsSkipped: number;
  totalErrors: number;
  totalWarnings: number;
  successCount: number;
  warningCount: number;
  failedCount: number;
}

/**
 * Format a duration in milliseconds to a human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  }
  if (ms < 3600000) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

/**
 * Format a number with thousands separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format a date to ISO string or localized string
 */
export function formatTimestamp(
  date: Date,
  options?: { timezone?: string; format?: 'iso' | 'local' | 'time' },
): string {
  const format = options?.format || 'local';

  if (format === 'iso') {
    return date.toISOString();
  }

  if (format === 'time') {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: options?.timezone,
    });
  }

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: options?.timezone,
  });
}

/**
 * Get the status icon for a pipeline status
 */
export function getStatusIcon(
  status: PipelineResult['status'] | EtlRunStatus,
  useColor = true,
): string {
  const statusMap: Record<string, { icon: string; color: string }> = {
    [EtlRunStatus.COMPLETED]: { icon: '✓', color: colors.green },
    [EtlRunStatus.COMPLETED_WITH_WARNINGS]: { icon: '⚠', color: colors.yellow },
    [EtlRunStatus.FAILED]: { icon: '✗', color: colors.red },
    [EtlRunStatus.CANCELLED]: { icon: '○', color: colors.gray },
    [EtlRunStatus.RUNNING]: { icon: '●', color: colors.blue },
  };

  const info = statusMap[status] || { icon: '?', color: colors.white };

  if (useColor) {
    return `${info.color}${info.icon}${colors.reset}`;
  }
  return info.icon;
}

/**
 * Get the status label for a pipeline status
 */
export function getStatusLabel(
  status: PipelineResult['status'] | EtlRunStatus,
  useColor = true,
): string {
  const statusMap: Record<string, { label: string; color: string }> = {
    [EtlRunStatus.COMPLETED]: { label: 'COMPLETED', color: colors.green },
    [EtlRunStatus.COMPLETED_WITH_WARNINGS]: {
      label: 'COMPLETED WITH WARNINGS',
      color: colors.yellow,
    },
    [EtlRunStatus.FAILED]: { label: 'FAILED', color: colors.red },
    [EtlRunStatus.CANCELLED]: { label: 'CANCELLED', color: colors.gray },
    [EtlRunStatus.RUNNING]: { label: 'RUNNING', color: colors.blue },
  };

  const info = statusMap[status] || { label: 'UNKNOWN', color: colors.white };

  if (useColor) {
    return `${info.color}${colors.bold}${info.label}${colors.reset}`;
  }
  return info.label;
}

/**
 * Create a horizontal divider line
 */
function divider(width = 60, char = '─', useColor = true): string {
  const line = char.repeat(width);
  return useColor ? `${colors.dim}${line}${colors.reset}` : line;
}

/**
 * Create a section header
 */
function sectionHeader(title: string, useColor = true): string {
  const prefix = useColor ? `${colors.bold}${colors.cyan}` : '';
  const suffix = useColor ? colors.reset : '';
  return `${prefix}${title}${suffix}`;
}

/**
 * Format a single pipeline result as a console-friendly summary
 */
export function formatPipelineSummary(
  result: PipelineResult,
  options: ReportOptions = {},
): string {
  const useColor = options.colors !== false;
  const includeDetails = options.includeDetails !== false;
  const maxMessages = options.maxMessages ?? 10;

  const lines: string[] = [];

  // Header
  lines.push(divider(60, '═', useColor));
  lines.push(
    `${sectionHeader('Pipeline:', useColor)} ${result.name}`,
  );
  lines.push(
    `${sectionHeader('Status:', useColor)} ${getStatusIcon(result.status, useColor)} ${getStatusLabel(result.status, useColor)}`,
  );
  lines.push(divider(60, '─', useColor));

  // Timing
  if (options.includeTimestamps !== false) {
    lines.push(`  Started:   ${formatTimestamp(result.startedAt)}`);
    lines.push(`  Completed: ${formatTimestamp(result.completedAt)}`);
  }
  lines.push(`  Duration:  ${formatDuration(result.durationMs)}`);
  lines.push('');

  // Statistics
  lines.push(sectionHeader('Statistics:', useColor));
  lines.push(`  Rows extracted:   ${formatNumber(result.stats.rowsExtracted)}`);
  lines.push(`  Rows transformed: ${formatNumber(result.stats.rowsTransformed)}`);
  lines.push(`  Rows loaded:      ${formatNumber(result.stats.rowsLoaded)}`);
  lines.push(`  Rows skipped:     ${formatNumber(result.stats.rowsSkipped)}`);
  lines.push('');

  // Load breakdown (if available)
  if (result.load) {
    lines.push(sectionHeader('Load Details:', useColor));
    lines.push(`  Inserted: ${formatNumber(result.load.insertedCount)}`);
    lines.push(`  Updated:  ${formatNumber(result.load.updatedCount)}`);
    lines.push(`  Skipped:  ${formatNumber(result.load.skippedCount)}`);
    lines.push('');
  }

  // Errors
  if (result.stats.errorCount > 0) {
    const errorColor = useColor ? colors.red : '';
    const reset = useColor ? colors.reset : '';
    lines.push(`${errorColor}${sectionHeader('Errors:', false)} ${result.stats.errorCount}${reset}`);

    if (includeDetails) {
      const errors = collectErrors(result);
      const displayErrors = errors.slice(0, maxMessages);
      displayErrors.forEach((err, idx) => {
        lines.push(`  ${idx + 1}. ${err}`);
      });
      if (errors.length > maxMessages) {
        lines.push(`  ... and ${errors.length - maxMessages} more errors`);
      }
    }
    lines.push('');
  }

  // Warnings
  if (result.stats.warningCount > 0) {
    const warnColor = useColor ? colors.yellow : '';
    const reset = useColor ? colors.reset : '';
    lines.push(`${warnColor}${sectionHeader('Warnings:', false)} ${result.stats.warningCount}${reset}`);

    if (includeDetails) {
      const warnings = collectWarnings(result);
      const displayWarnings = warnings.slice(0, maxMessages);
      displayWarnings.forEach((warn, idx) => {
        lines.push(`  ${idx + 1}. ${warn}`);
      });
      if (warnings.length > maxMessages) {
        lines.push(`  ... and ${warnings.length - maxMessages} more warnings`);
      }
    }
    lines.push('');
  }

  // Error message (if failed)
  if (result.error) {
    const errorColor = useColor ? colors.red : '';
    const reset = useColor ? colors.reset : '';
    lines.push(`${errorColor}Error: ${result.error}${reset}`);
    lines.push('');
  }

  lines.push(divider(60, '═', useColor));

  return lines.join('\n');
}

/**
 * Format a compact one-line summary for a pipeline result
 */
export function formatPipelineOneLine(
  result: PipelineResult,
  options: ReportOptions = {},
): string {
  const useColor = options.colors !== false;
  const icon = getStatusIcon(result.status, useColor);
  const duration = formatDuration(result.durationMs);
  const loaded = formatNumber(result.stats.rowsLoaded);
  const errors = result.stats.errorCount;
  const warnings = result.stats.warningCount;

  let suffix = '';
  if (errors > 0 || warnings > 0) {
    const parts: string[] = [];
    if (errors > 0) {
      parts.push(`${useColor ? colors.red : ''}${errors} errors${useColor ? colors.reset : ''}`);
    }
    if (warnings > 0) {
      parts.push(
        `${useColor ? colors.yellow : ''}${warnings} warnings${useColor ? colors.reset : ''}`,
      );
    }
    suffix = ` (${parts.join(', ')})`;
  }

  return `${icon} ${result.name}: ${loaded} rows in ${duration}${suffix}`;
}

/**
 * Format a batch of pipeline results
 */
export function formatBatchSummary(
  results: PipelineResult[],
  options: ReportOptions = {},
): string {
  const useColor = options.colors !== false;
  const summary = createBatchSummary(results);

  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push(divider(70, '═', useColor));
  lines.push(sectionHeader('  ETL BATCH SUMMARY', useColor));
  lines.push(divider(70, '═', useColor));
  lines.push('');

  // Individual pipeline results
  lines.push(sectionHeader('Pipeline Results:', useColor));
  lines.push('');
  results.forEach((result) => {
    lines.push(`  ${formatPipelineOneLine(result, options)}`);
  });
  lines.push('');

  // Aggregate statistics
  lines.push(divider(70, '─', useColor));
  lines.push(sectionHeader('Aggregate Statistics:', useColor));
  lines.push('');
  lines.push(`  Total pipelines:    ${results.length}`);
  lines.push(
    `  Successful:         ${useColor ? colors.green : ''}${summary.successCount}${useColor ? colors.reset : ''}`,
  );
  lines.push(
    `  With warnings:      ${useColor ? colors.yellow : ''}${summary.warningCount}${useColor ? colors.reset : ''}`,
  );
  lines.push(
    `  Failed:             ${useColor ? colors.red : ''}${summary.failedCount}${useColor ? colors.reset : ''}`,
  );
  lines.push('');
  lines.push(`  Total duration:     ${formatDuration(summary.totalDurationMs)}`);
  lines.push(`  Total extracted:    ${formatNumber(summary.totalRowsExtracted)}`);
  lines.push(`  Total transformed:  ${formatNumber(summary.totalRowsTransformed)}`);
  lines.push(`  Total loaded:       ${formatNumber(summary.totalRowsLoaded)}`);
  lines.push(`  Total skipped:      ${formatNumber(summary.totalRowsSkipped)}`);
  lines.push(`  Total errors:       ${formatNumber(summary.totalErrors)}`);
  lines.push(`  Total warnings:     ${formatNumber(summary.totalWarnings)}`);
  lines.push('');
  lines.push(divider(70, '═', useColor));
  lines.push('');

  return lines.join('\n');
}

/**
 * Create a batch summary from multiple pipeline results
 */
export function createBatchSummary(results: PipelineResult[]): BatchSummary {
  let successCount = 0;
  let warningCount = 0;
  let failedCount = 0;

  const summary: BatchSummary = {
    pipelines: results,
    totalDurationMs: 0,
    totalRowsExtracted: 0,
    totalRowsTransformed: 0,
    totalRowsLoaded: 0,
    totalRowsSkipped: 0,
    totalErrors: 0,
    totalWarnings: 0,
    successCount: 0,
    warningCount: 0,
    failedCount: 0,
  };

  for (const result of results) {
    summary.totalDurationMs += result.durationMs;
    summary.totalRowsExtracted += result.stats.rowsExtracted;
    summary.totalRowsTransformed += result.stats.rowsTransformed;
    summary.totalRowsLoaded += result.stats.rowsLoaded;
    summary.totalRowsSkipped += result.stats.rowsSkipped;
    summary.totalErrors += result.stats.errorCount;
    summary.totalWarnings += result.stats.warningCount;

    if (result.status === 'completed') {
      successCount++;
    } else if (result.status === 'completed_with_warnings') {
      warningCount++;
    } else {
      failedCount++;
    }
  }

  summary.successCount = successCount;
  summary.warningCount = warningCount;
  summary.failedCount = failedCount;

  return summary;
}

/**
 * Format an ETL run record (from database) as a console-friendly summary
 */
export function formatEtlRunRecord(
  record: EtlRunRecord,
  options: ReportOptions = {},
): string {
  const useColor = options.colors !== false;
  const includeDetails = options.includeDetails !== false;
  const maxMessages = options.maxMessages ?? 10;

  const lines: string[] = [];

  // Header
  lines.push(divider(60, '═', useColor));
  lines.push(`${sectionHeader('ETL Run:', useColor)} ${record.runName || record.id}`);
  lines.push(
    `${sectionHeader('Status:', useColor)} ${getStatusIcon(record.status, useColor)} ${getStatusLabel(record.status, useColor)}`,
  );
  lines.push(divider(60, '─', useColor));

  // Metadata
  lines.push(`  Run ID:      ${record.id}`);
  lines.push(`  Source:      ${record.sourceUrl}`);
  lines.push('');

  // Timing
  if (options.includeTimestamps !== false) {
    lines.push(`  Started:     ${formatTimestamp(record.startedAt)}`);
    if (record.completedAt) {
      lines.push(`  Completed:   ${formatTimestamp(record.completedAt)}`);
    }
  }
  if (record.durationMs) {
    lines.push(`  Duration:    ${formatDuration(record.durationMs)}`);
  }
  lines.push('');

  // Statistics
  lines.push(sectionHeader('Statistics:', useColor));
  lines.push(`  Rows extracted:   ${formatNumber(record.rowsExtracted)}`);
  lines.push(`  Rows transformed: ${formatNumber(record.rowsTransformed)}`);
  lines.push(`  Rows loaded:      ${formatNumber(record.rowsLoaded)}`);
  lines.push(`  Rows skipped:     ${formatNumber(record.rowsSkipped)}`);
  lines.push('');

  // Errors
  if (record.errorCount > 0) {
    const errorColor = useColor ? colors.red : '';
    const reset = useColor ? colors.reset : '';
    lines.push(`${errorColor}${sectionHeader('Errors:', false)} ${record.errorCount}${reset}`);

    if (includeDetails && record.errorMessages) {
      const displayErrors = record.errorMessages.slice(0, maxMessages);
      displayErrors.forEach((err, idx) => {
        lines.push(`  ${idx + 1}. ${err}`);
      });
      if (record.errorMessages.length > maxMessages) {
        lines.push(`  ... and ${record.errorMessages.length - maxMessages} more errors`);
      }
    }
    lines.push('');
  }

  // Warnings
  if (record.warningCount > 0) {
    const warnColor = useColor ? colors.yellow : '';
    const reset = useColor ? colors.reset : '';
    lines.push(`${warnColor}${sectionHeader('Warnings:', false)} ${record.warningCount}${reset}`);

    if (includeDetails && record.warningMessages) {
      const displayWarnings = record.warningMessages.slice(0, maxMessages);
      displayWarnings.forEach((warn, idx) => {
        lines.push(`  ${idx + 1}. ${warn}`);
      });
      if (record.warningMessages.length > maxMessages) {
        lines.push(`  ... and ${record.warningMessages.length - maxMessages} more warnings`);
      }
    }
    lines.push('');
  }

  // Metadata
  if (record.metadata && Object.keys(record.metadata).length > 0) {
    lines.push(sectionHeader('Metadata:', useColor));
    Object.entries(record.metadata).forEach(([key, value]) => {
      lines.push(`  ${key}: ${JSON.stringify(value)}`);
    });
    lines.push('');
  }

  lines.push(divider(60, '═', useColor));

  return lines.join('\n');
}

/**
 * Format run history as a table
 */
export function formatRunHistoryTable(
  records: EtlRunRecord[],
  options: ReportOptions = {},
): string {
  const useColor = options.colors !== false;

  if (records.length === 0) {
    return 'No run history available.';
  }

  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push(divider(100, '─', useColor));
  lines.push(
    `${padEnd('Status', 8)} | ${padEnd('Started', 20)} | ${padEnd('Duration', 10)} | ` +
      `${padEnd('Loaded', 10)} | ${padEnd('Errors', 8)} | Run Name`,
  );
  lines.push(divider(100, '─', useColor));

  // Rows
  for (const record of records) {
    const status = getStatusIcon(record.status, useColor);
    const started = formatTimestamp(record.startedAt, { format: 'local' });
    const duration = record.durationMs ? formatDuration(record.durationMs) : '-';
    const loaded = formatNumber(record.rowsLoaded);
    const errors =
      record.errorCount > 0
        ? `${useColor ? colors.red : ''}${record.errorCount}${useColor ? colors.reset : ''}`
        : '0';
    const name = record.runName || record.id.slice(0, 8);

    lines.push(
      `${status} ${padEnd(getStatusShortLabel(record.status), 6)} | ${padEnd(started, 20)} | ` +
        `${padEnd(duration, 10)} | ${padEnd(loaded, 10)} | ${padEnd(String(errors), 8)} | ${name}`,
    );
  }

  lines.push(divider(100, '─', useColor));
  lines.push(`Total: ${records.length} runs`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate a JSON report for a pipeline result
 */
export function generateJsonReport(result: PipelineResult): string {
  return JSON.stringify(
    {
      name: result.name,
      status: result.status,
      timing: {
        startedAt: result.startedAt.toISOString(),
        completedAt: result.completedAt.toISOString(),
        durationMs: result.durationMs,
        durationFormatted: formatDuration(result.durationMs),
      },
      statistics: result.stats,
      extraction: result.extraction
        ? {
            rowCount: result.extraction.rowCount,
            warnings: result.extraction.warnings,
          }
        : null,
      transformation: result.transformation
        ? {
            transformedCount: result.transformation.transformedCount,
            skippedCount: result.transformation.skippedCount,
            errorCount: result.transformation.errors.length,
            warningCount: result.transformation.warnings.length,
            errors: result.transformation.errors,
            warnings: result.transformation.warnings,
          }
        : null,
      load: result.load
        ? {
            insertedCount: result.load.insertedCount,
            updatedCount: result.load.updatedCount,
            skippedCount: result.load.skippedCount,
            errorCount: result.load.errors.length,
            warningCount: result.load.warnings.length,
            errors: result.load.errors,
            warnings: result.load.warnings,
          }
        : null,
      error: result.error || null,
    },
    null,
    2,
  );
}

/**
 * Generate a JSON report for a batch of pipeline results
 */
export function generateBatchJsonReport(results: PipelineResult[]): string {
  const summary = createBatchSummary(results);

  return JSON.stringify(
    {
      summary: {
        pipelineCount: results.length,
        successCount: summary.successCount,
        warningCount: summary.warningCount,
        failedCount: summary.failedCount,
        totalDurationMs: summary.totalDurationMs,
        totalDurationFormatted: formatDuration(summary.totalDurationMs),
        totalRowsExtracted: summary.totalRowsExtracted,
        totalRowsTransformed: summary.totalRowsTransformed,
        totalRowsLoaded: summary.totalRowsLoaded,
        totalRowsSkipped: summary.totalRowsSkipped,
        totalErrors: summary.totalErrors,
        totalWarnings: summary.totalWarnings,
      },
      pipelines: results.map((r) => ({
        name: r.name,
        status: r.status,
        durationMs: r.durationMs,
        stats: r.stats,
        error: r.error || null,
      })),
    },
    null,
    2,
  );
}

/**
 * Create a progress bar string
 */
export function createProgressBar(
  current: number,
  total: number,
  width = 30,
  options: { useColor?: boolean; showPercentage?: boolean } = {},
): string {
  const useColor = options.useColor !== false;
  const showPercentage = options.showPercentage !== false;

  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;

  const filledChar = '█';
  const emptyChar = '░';

  let bar = filledChar.repeat(filled) + emptyChar.repeat(empty);

  if (useColor) {
    const color = percentage < 50 ? colors.yellow : percentage < 100 ? colors.blue : colors.green;
    bar = `${color}${filledChar.repeat(filled)}${colors.dim}${emptyChar.repeat(empty)}${colors.reset}`;
  }

  if (showPercentage) {
    return `[${bar}] ${percentage}%`;
  }

  return `[${bar}]`;
}

/**
 * Format a log entry for file output (no colors)
 */
export function formatLogEntry(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  context?: string,
): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}]` : '';
  return `${timestamp} [${level.toUpperCase()}]${contextStr} ${message}`;
}

// Helper functions

/**
 * Collect all errors from a pipeline result
 */
function collectErrors(result: PipelineResult): string[] {
  const errors: string[] = [];

  if (result.transformation?.errors) {
    errors.push(
      ...result.transformation.errors.map((e) => `Row ${e.row}: ${e.message}`),
    );
  }

  if (result.load?.errors) {
    errors.push(...result.load.errors.map((e) => e.message));
  }

  return errors;
}

/**
 * Collect all warnings from a pipeline result
 */
function collectWarnings(result: PipelineResult): string[] {
  const warnings: string[] = [];

  if (result.extraction?.warnings) {
    warnings.push(...result.extraction.warnings);
  }

  if (result.transformation?.warnings) {
    warnings.push(...result.transformation.warnings);
  }

  if (result.load?.warnings) {
    warnings.push(...result.load.warnings);
  }

  return warnings;
}

/**
 * Pad a string to a fixed width
 */
function padEnd(str: string, width: number): string {
  if (str.length >= width) {
    return str.slice(0, width);
  }
  return str + ' '.repeat(width - str.length);
}

/**
 * Get a short status label
 */
function getStatusShortLabel(status: EtlRunStatus): string {
  const labels: Record<EtlRunStatus, string> = {
    [EtlRunStatus.RUNNING]: 'RUN',
    [EtlRunStatus.COMPLETED]: 'OK',
    [EtlRunStatus.COMPLETED_WITH_WARNINGS]: 'WARN',
    [EtlRunStatus.FAILED]: 'FAIL',
    [EtlRunStatus.CANCELLED]: 'CNCL',
  };
  return labels[status] || '???';
}

/**
 * Strip ANSI color codes from a string
 */
export function stripColors(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}
