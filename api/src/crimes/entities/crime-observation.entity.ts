import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from 'typeorm';
import { AdministrativeArea } from '../../areas/entities/administrative-area.entity';
import { DataSource } from '../../etl/entities/data-source.entity';
import { CrimeCategory } from './crime-category.entity';

/**
 * Time granularity for crime observations.
 * Determines the temporal resolution of the observation.
 */
export enum TimeGranularity {
  /** Monthly observation (e.g., January 2023) */
  MONTHLY = 'monthly',
  /** Quarterly observation (e.g., Q1 2023) */
  QUARTERLY = 'quarterly',
  /** Annual observation (e.g., 2023) */
  YEARLY = 'yearly',
}

/**
 * Crime observation entity representing recorded crime statistics.
 *
 * This is the core data table for BeWhere, storing crime counts and rates
 * for specific areas, categories, time periods, and data sources.
 *
 * Key features:
 * - Links crime data to administrative areas (départements)
 * - Links to canonical crime categories for standardized analysis
 * - Tracks data provenance via data source reference
 * - Supports multiple time granularities (monthly, quarterly, yearly)
 * - Stores both raw counts and calculated rates per 100,000 population
 * - Composite unique constraint prevents duplicate observations
 *
 * Data sources:
 * - État 4001 monthly snapshots (aggregated to yearly)
 * - Time series data (monthly national, yearly département)
 *
 * @example
 * // Burglary in Paris, 2023
 * {
 *   areaId: 'uuid-for-paris',
 *   categoryId: 'uuid-for-burglary',
 *   dataSourceId: 'uuid-for-etat4001',
 *   year: 2023,
 *   count: 15234,
 *   ratePer100k: 714.2,
 *   granularity: TimeGranularity.YEARLY
 * }
 */
@Entity('crime_observations')
@Unique(['areaId', 'categoryId', 'dataSourceId', 'year', 'month'])
@Index(['areaId'])
@Index(['categoryId'])
@Index(['dataSourceId'])
@Index(['year'])
@Index(['areaId', 'categoryId', 'year', 'dataSourceId']) // Composite index for common queries
export class CrimeObservation {
  /**
   * Auto-generated primary key.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Foreign key to the administrative area.
   */
  @Column({ type: 'uuid' })
  areaId: string;

  /**
   * Reference to the administrative area entity.
   * Links observation to a specific département or region.
   */
  @ManyToOne(() => AdministrativeArea, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'areaId' })
  area: AdministrativeArea;

  /**
   * Foreign key to the crime category.
   */
  @Column({ type: 'uuid' })
  categoryId: string;

  /**
   * Reference to the crime category entity.
   * Links observation to a canonical crime category.
   */
  @ManyToOne(() => CrimeCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: CrimeCategory;

  /**
   * Foreign key to the data source.
   */
  @Column({ type: 'uuid' })
  dataSourceId: string;

  /**
   * Reference to the data source entity.
   * Tracks provenance of this observation.
   */
  @ManyToOne(() => DataSource, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dataSourceId' })
  dataSource: DataSource;

  /**
   * Year of the observation.
   * Primary temporal dimension for all crime data.
   */
  @Column({ type: 'smallint' })
  year: number;

  /**
   * Month of the observation (1-12).
   * Null for yearly aggregated data.
   * Required for monthly granularity data.
   */
  @Column({ type: 'smallint', nullable: true })
  month: number | null;

  /**
   * Time granularity of this observation.
   * Indicates whether data is monthly, quarterly, or yearly.
   */
  @Column({
    type: 'enum',
    enum: TimeGranularity,
    default: TimeGranularity.YEARLY,
  })
  granularity: TimeGranularity;

  /**
   * Raw count of crimes for this observation.
   * Integer count from the source data.
   */
  @Column({ type: 'integer' })
  count: number;

  /**
   * Crime rate per 100,000 population.
   * Calculated from count and area population for the year.
   * Nullable if population data is not available.
   *
   * Formula: (count / population) * 100000
   */
  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  ratePer100k: number | null;

  /**
   * Population used for rate calculation.
   * Stored for audit trail and recalculation purposes.
   * Nullable if population data is not available.
   */
  @Column({ type: 'integer', nullable: true })
  populationUsed: number | null;

  /**
   * Whether this observation has been validated/verified.
   * Used for data quality tracking during ETL.
   */
  @Column({ type: 'boolean', default: false })
  isValidated: boolean;

  /**
   * Notes or flags about this observation.
   * Used for data quality notes (e.g., "estimated", "revised").
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string | null;

  /**
   * Timestamp when the record was created.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp when the record was last updated.
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
