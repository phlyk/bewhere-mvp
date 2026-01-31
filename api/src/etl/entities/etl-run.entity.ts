import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { DataSource } from './data-source.entity';

/**
 * Status of an ETL run.
 * Tracks the lifecycle of a data import operation.
 */
export enum EtlRunStatus {
  /** ETL run is currently in progress */
  RUNNING = 'running',
  /** ETL run completed successfully */
  COMPLETED = 'completed',
  /** ETL run completed with some warnings/partial failures */
  COMPLETED_WITH_WARNINGS = 'completed_with_warnings',
  /** ETL run failed */
  FAILED = 'failed',
  /** ETL run was cancelled by user or system */
  CANCELLED = 'cancelled',
}

/**
 * ETL run entity for tracking data import operations.
 *
 * This table provides an audit trail for all ETL operations, enabling:
 * - Data provenance tracking (when was data imported, from where)
 * - Debugging failed imports (error messages, partial progress)
 * - Monitoring import health (row counts, duration)
 * - Preventing duplicate imports (check last import for source)
 * - Identifying data freshness (when was source last imported)
 *
 * Each run is associated with a DataSource and tracks:
 * - Start/end timestamps for duration calculation
 * - Row counts (extracted, transformed, loaded)
 * - Error/warning counts and messages
 * - Source URL used (may differ from DataSource.url for versioned datasets)
 *
 * @example
 * // Successful import
 * {
 *   dataSource: { code: 'ETAT4001_MONTHLY' },
 *   sourceUrl: 'https://data.gouv.fr/.../juin-2024.csv',
 *   status: EtlRunStatus.COMPLETED,
 *   startedAt: '2024-07-01T00:00:00Z',
 *   completedAt: '2024-07-01T00:15:00Z',
 *   rowsExtracted: 111,
 *   rowsTransformed: 107,
 *   rowsLoaded: 10486,
 *   errorCount: 0
 * }
 *
 * @example
 * // Failed import
 * {
 *   dataSource: { code: 'TIMESERIES' },
 *   sourceUrl: 'https://data.gouv.fr/.../series.csv',
 *   status: EtlRunStatus.FAILED,
 *   startedAt: '2024-07-01T00:00:00Z',
 *   completedAt: '2024-07-01T00:01:00Z',
 *   rowsExtracted: 0,
 *   errorCount: 1,
 *   errorMessages: ['Failed to download: 503 Service Unavailable']
 * }
 */
@Entity('etl_runs')
@Index(['dataSourceId', 'startedAt'])
@Index(['status'])
@Index(['startedAt'])
export class EtlRun {
  /**
   * Auto-generated primary key.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Reference to the data source being imported.
   * Cascades delete: if a data source is removed, its run history is also removed.
   */
  @Column({ type: 'uuid' })
  dataSourceId: string;

  @ManyToOne(() => DataSource, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dataSourceId' })
  dataSource: DataSource;

  /**
   * Human-readable name for this ETL run.
   * Can describe the specific dataset version or time period.
   * Example: "État 4001 June 2024" or "Time Series 2024Q2 Update"
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  runName: string | null;

  /**
   * Actual source URL used for this import.
   * May differ from DataSource.url for versioned or dated datasets.
   * Stored for debugging and potential re-runs.
   */
  @Column({ type: 'varchar', length: 2048 })
  sourceUrl: string;

  /**
   * Current status of the ETL run.
   */
  @Column({
    type: 'enum',
    enum: EtlRunStatus,
    default: EtlRunStatus.RUNNING,
  })
  status: EtlRunStatus;

  /**
   * Timestamp when the ETL run started.
   */
  @Column({ type: 'timestamp' })
  startedAt: Date;

  /**
   * Timestamp when the ETL run completed (success or failure).
   * Null while run is in progress.
   */
  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  /**
   * Duration of the ETL run in milliseconds.
   * Computed from completedAt - startedAt.
   * Null while run is in progress.
   */
  @Column({ type: 'integer', nullable: true })
  durationMs: number | null;

  /**
   * Number of rows extracted from source.
   * First stage of ETL pipeline.
   */
  @Column({ type: 'integer', default: 0 })
  rowsExtracted: number;

  /**
   * Number of rows successfully transformed.
   * May be less than extracted if validation fails for some rows.
   */
  @Column({ type: 'integer', default: 0 })
  rowsTransformed: number;

  /**
   * Number of rows loaded into the database.
   * May be higher than extracted for one-to-many transformations
   * (e.g., one source row → multiple observations).
   */
  @Column({ type: 'integer', default: 0 })
  rowsLoaded: number;

  /**
   * Number of rows skipped during transformation.
   * Includes rows that failed validation or were filtered out.
   */
  @Column({ type: 'integer', default: 0 })
  rowsSkipped: number;

  /**
   * Number of errors encountered during the run.
   */
  @Column({ type: 'integer', default: 0 })
  errorCount: number;

  /**
   * Number of warnings encountered during the run.
   * Warnings don't stop execution but indicate potential issues.
   */
  @Column({ type: 'integer', default: 0 })
  warningCount: number;

  /**
   * Error messages collected during the run.
   * Stored as JSONB array for structured access.
   * Limited to most recent errors to prevent unbounded growth.
   */
  @Column({ type: 'jsonb', nullable: true })
  errorMessages: string[] | null;

  /**
   * Warning messages collected during the run.
   * Stored as JSONB array for structured access.
   */
  @Column({ type: 'jsonb', nullable: true })
  warningMessages: string[] | null;

  /**
   * Additional metadata about the ETL run.
   * Can include file checksums, encoding detected, etc.
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  /**
   * Record creation timestamp.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Record last update timestamp.
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
