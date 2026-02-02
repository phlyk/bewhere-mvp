import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

/**
 * Update frequency for data sources.
 * Indicates how often the source dataset is expected to be updated.
 */
export enum UpdateFrequency {
  /** Real-time or near real-time updates */
  REALTIME = 'realtime',
  /** Updated daily */
  DAILY = 'daily',
  /** Updated weekly */
  WEEKLY = 'weekly',
  /** Updated monthly */
  MONTHLY = 'monthly',
  /** Updated quarterly */
  QUARTERLY = 'quarterly',
  /** Updated yearly */
  YEARLY = 'yearly',
  /** Updated on an irregular or unknown schedule */
  IRREGULAR = 'irregular',
  /** Historical data, no longer updated */
  HISTORICAL = 'historical',
}

/**
 * Data source entity representing external datasets used in BeWhere.
 *
 * This table tracks metadata about data sources for:
 * - Provenance tracking (where data comes from)
 * - ETL configuration (how to fetch and process data)
 * - Update scheduling (when to check for new data)
 * - Attribution and licensing
 *
 * Initial data sources for BeWhere MVP:
 * - data.gouv.fr État 4001 monthly snapshots
 * - data.gouv.fr Time Series (séries chronologiques)
 * - INSEE population estimates
 *
 * @example
 * // Example: État 4001 monthly data
 * {
 *   code: 'ETAT4001_MONTHLY',
 *   name: 'État 4001 Monthly Snapshots',
 *   nameFr: 'État 4001 - Données mensuelles',
 *   description: 'Monthly crime statistics from French Interior Ministry',
 *   url: 'https://data.gouv.fr/fr/datasets/...',
 *   updateFrequency: UpdateFrequency.MONTHLY,
 *   provider: 'Ministère de l'Intérieur',
 *   license: 'Licence Ouverte v2.0',
 *   countryCode: 'FR'
 * }
 */
@Entity('data_sources')
@Index(['code'], { unique: true })
@Index(['updateFrequency'])
@Index(['countryCode'])
@Index(['isActive'])
export class DataSourceEntity {
  /**
   * Auto-generated primary key.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Unique identifier code for programmatic access.
   * Convention: UPPERCASE_WITH_UNDERSCORES
   * Examples: 'ETAT4001_MONTHLY', 'TIMESERIES', 'INSEE_POPULATION'
   */
  @Column({ type: 'varchar', length: 50 })
  code: string;

  /**
   * Human-readable name of the data source (English).
   */
  @Column({ type: 'varchar', length: 255 })
  name: string;

  /**
   * French name of the data source (for localized display).
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  nameFr: string | null;

  /**
   * Detailed description of the data source, its contents, and coverage.
   */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  /**
   * Primary URL where the data can be accessed or downloaded.
   * This is the canonical source URL for attribution.
   */
  @Column({ type: 'varchar', length: 2048 })
  url: string;

  /**
   * API endpoint or download URL for automated ETL.
   * May differ from the public-facing `url` (e.g., direct CSV link vs landing page).
   */
  @Column({ type: 'varchar', length: 2048, nullable: true })
  apiEndpoint: string | null;

  /**
   * Expected update frequency of the source dataset.
   * Used for ETL scheduling and freshness monitoring.
   */
  @Column({
    type: 'enum',
    enum: UpdateFrequency,
    default: UpdateFrequency.IRREGULAR,
  })
  updateFrequency: UpdateFrequency;

  /**
   * Organization or entity providing the data.
   * Examples: 'Ministère de l'Intérieur', 'INSEE', 'Eurostat'
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  provider: string | null;

  /**
   * License under which the data is published.
   * Examples: 'Licence Ouverte v2.0', 'CC BY 4.0', 'Public Domain'
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  license: string | null;

  /**
   * Attribution text to display when using this data.
   */
  @Column({ type: 'text', nullable: true })
  attribution: string | null;

  /**
   * ISO 3166-1 alpha-2 country code for the data's geographic scope.
   * 'FR' for French data sources, null for international sources.
   */
  @Column({ type: 'char', length: 2, nullable: true })
  countryCode: string | null;

  /**
   * First year of data available from this source.
   * Used for filtering and time range validation.
   */
  @Column({ type: 'smallint', nullable: true })
  dataStartYear: number | null;

  /**
   * Last year of data available from this source.
   * Null if data is still being updated.
   */
  @Column({ type: 'smallint', nullable: true })
  dataEndYear: number | null;

  /**
   * Whether this data source is currently active for ETL.
   * Inactive sources are preserved for historical data but not refreshed.
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Timestamp of the last successful ETL run for this source.
   * Null if never successfully imported.
   */
  @Column({ type: 'timestamp', nullable: true })
  lastImportedAt: Date | null;

  /**
   * Additional metadata stored as JSON.
   * May include: file encoding, delimiter, row skip counts, etc.
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  /**
   * Timestamp when this record was created.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp when this record was last updated.
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
