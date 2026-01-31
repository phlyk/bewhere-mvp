import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Severity level for crime categories.
 * Used for visualization (color coding) and prioritization in analysis.
 *
 * - CRITICAL: Most severe crimes (homicide, sexual violence, trafficking)
 * - HIGH: Serious crimes (assault, armed robbery, drug trafficking)
 * - MEDIUM: Moderate crimes (burglary, vehicle theft, fraud)
 * - LOW: Less severe crimes (vandalism, drug use, simple theft)
 */
export enum CrimeSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * High-level crime category groups for organizing the taxonomy.
 * Used for grouping related categories in the UI and reports.
 */
export enum CrimeCategoryGroup {
  VIOLENT_CRIMES = 'violent_crimes',
  PROPERTY_CRIMES = 'property_crimes',
  DRUG_OFFENSES = 'drug_offenses',
  OTHER_OFFENSES = 'other_offenses',
}

/**
 * Crime category entity representing canonical crime types.
 *
 * This table defines the standardized crime taxonomy used throughout BeWhere.
 * Source data from various datasets (État 4001, Time Series) is mapped to
 * these canonical categories for consistent cross-dataset analysis.
 *
 * The 20 canonical categories are designed to:
 * - Aggregate granular source categories into analyst-friendly groups
 * - Enable meaningful cross-dataset comparisons
 * - Balance specificity with usability
 * - Align with international standards (UNODC ICCS, Eurostat)
 *
 * @example
 * // Example: Homicide category
 * {
 *   code: 'HOMICIDE',
 *   name: 'Homicide',
 *   nameFr: 'Homicide',
 *   description: 'Intentional killing including criminal settlements',
 *   severity: CrimeSeverity.CRITICAL,
 *   categoryGroup: CrimeCategoryGroup.VIOLENT_CRIMES,
 *   sortOrder: 1
 * }
 */
@Entity('crime_categories')
@Index(['code'], { unique: true })
@Index(['severity'])
@Index(['categoryGroup'])
@Index(['sortOrder'])
export class CrimeCategory {
  /**
   * Auto-generated primary key.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Unique canonical code for the crime category.
   * Uses SCREAMING_SNAKE_CASE convention for programmatic access.
   *
   * @example 'HOMICIDE', 'ARMED_ROBBERY', 'BURGLARY_RESIDENTIAL'
   */
  @Column({ type: 'varchar', length: 50 })
  code: string;

  /**
   * Human-readable English name for the category.
   *
   * @example 'Homicide', 'Armed Robbery', 'Residential Burglary'
   */
  @Column({ type: 'varchar', length: 100 })
  name: string;

  /**
   * French name for the category (for localization).
   *
   * @example 'Homicide', 'Vol à main armée', 'Cambriolage de résidence'
   */
  @Column({ type: 'varchar', length: 100 })
  nameFr: string;

  /**
   * Detailed description of what this category includes.
   * Used for documentation and tooltips in the UI.
   */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  /**
   * Severity level for visualization and prioritization.
   */
  @Column({
    type: 'enum',
    enum: CrimeSeverity,
    default: CrimeSeverity.MEDIUM,
  })
  severity: CrimeSeverity;

  /**
   * High-level category group for organizing related categories.
   */
  @Column({
    type: 'enum',
    enum: CrimeCategoryGroup,
    default: CrimeCategoryGroup.OTHER_OFFENSES,
  })
  categoryGroup: CrimeCategoryGroup;

  /**
   * Sort order for consistent display in UI and reports.
   * Lower numbers appear first (1 = Homicide, 20 = Other).
   */
  @Column({ type: 'smallint', default: 99 })
  sortOrder: number;

  /**
   * Whether this category is active and should be displayed.
   * Allows soft-deprecation of categories without data loss.
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

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
