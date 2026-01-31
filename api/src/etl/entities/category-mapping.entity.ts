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

import { CrimeCategory } from '../../crimes/entities';
import { DataSource } from './data-source.entity';

/**
 * Category mapping entity for mapping source-specific crime categories
 * to BeWhere's canonical 20-category taxonomy.
 *
 * Each data source (État 4001, Time Series, Eurostat) has its own
 * category system that must be mapped to our canonical categories
 * for cross-dataset comparison and analysis.
 *
 * Key design decisions:
 * - Composite unique constraint on (dataSource, sourceCategory) ensures
 *   each source category maps to exactly one canonical category
 * - Many-to-one relationships enable efficient lookups in both directions
 * - Source metadata preserved for documentation and debugging
 *
 * @example
 * // État 4001 index 01 → HOMICIDE
 * {
 *   dataSource: { code: 'ETAT4001' },
 *   sourceCategory: '01',
 *   sourceCategoryName: 'Règlements de compte entre malfaiteurs',
 *   canonicalCategory: { code: 'HOMICIDE' },
 *   notes: 'Criminal settlements between criminals'
 * }
 *
 * @example
 * // Time Series indicator → BURGLARY_RESIDENTIAL
 * {
 *   dataSource: { code: 'TIMESERIES' },
 *   sourceCategory: 'Cambriolages de logement',
 *   sourceCategoryName: 'Cambriolages de logement',
 *   canonicalCategory: { code: 'BURGLARY_RESIDENTIAL' },
 *   notes: 'Residential burglaries from time series'
 * }
 */
@Entity('category_mappings')
@Index(['dataSourceId', 'sourceCategory'], { unique: true })
@Index(['canonicalCategoryId'])
@Index(['sourceCategory'])
@Unique(['dataSourceId', 'sourceCategory'])
export class CategoryMapping {
  /**
   * Auto-generated primary key.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Reference to the data source this mapping belongs to.
   * Each data source has its own set of category mappings.
   */
  @ManyToOne(() => DataSource, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dataSourceId' })
  dataSource: DataSource;

  /**
   * Foreign key to data_sources table.
   */
  @Column({ type: 'uuid' })
  dataSourceId: string;

  /**
   * The category code/identifier as it appears in the source data.
   * 
   * For État 4001: Two-digit index (e.g., '01', '02', '55')
   * For Time Series: Indicator name (e.g., 'Cambriolages de logement')
   * For Eurostat: ICCS code (e.g., 'ICCS0101')
   *
   * @example '01', '55', 'Cambriolages de logement'
   */
  @Column({ type: 'varchar', length: 200 })
  sourceCategory: string;

  /**
   * Human-readable name of the source category.
   * Preserved from the source data for reference.
   *
   * @example 'Règlements de compte entre malfaiteurs'
   * @example 'Trafic et revente sans usage de stupéfiants'
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  sourceCategoryName: string | null;

  /**
   * Reference to the canonical crime category this maps to.
   * Links to our 20-category taxonomy.
   */
  @ManyToOne(() => CrimeCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'canonicalCategoryId' })
  canonicalCategory: CrimeCategory;

  /**
   * Foreign key to crime_categories table.
   */
  @Column({ type: 'uuid' })
  canonicalCategoryId: string;

  /**
   * Optional notes about the mapping.
   * Used to document mapping rationale or edge cases.
   *
   * @example 'Criminal settlements - mapped to HOMICIDE per ICCS guidelines'
   * @example 'Includes both completed and attempted offenses'
   */
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  /**
   * Confidence level of the mapping (0.0 to 1.0).
   * - 1.0: Exact match, no ambiguity
   * - 0.8-0.99: Strong match, minor category scope differences
   * - 0.5-0.79: Reasonable match, some interpretation required
   * - < 0.5: Weak match, significant category differences
   *
   * Used for data quality indicators in the UI.
   * @default 1.0
   */
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  confidence: number;

  /**
   * Whether this mapping is currently active.
   * Inactive mappings are skipped during ETL but preserved for history.
   * @default true
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

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
