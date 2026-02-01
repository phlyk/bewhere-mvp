/**
 * INSEE Population Data Extractor
 *
 * Extracts population data from embedded dataset or external sources.
 * Uses INSEE official population estimates for French départements.
 */

import {
    BaseExtractor,
    ExtractionResult,
    ExtractorOptions,
} from '../../core/extractor';
import { logger } from '../../utils/logger';
import {
    EMBEDDED_POPULATION_DATA,
    EXPECTED_POPULATION_RECORDS,
    POPULATION_YEAR_RANGE,
    PopulationRawRecord,
} from './population.types';

/**
 * Département names for validation/display purposes
 */
const DEPARTEMENT_NAMES: Record<string, string> = {
  '01': 'Ain', '02': 'Aisne', '03': 'Allier', '04': 'Alpes-de-Haute-Provence',
  '05': 'Hautes-Alpes', '06': 'Alpes-Maritimes', '07': 'Ardèche', '08': 'Ardennes',
  '09': 'Ariège', '10': 'Aube', '11': 'Aude', '12': 'Aveyron',
  '13': 'Bouches-du-Rhône', '14': 'Calvados', '15': 'Cantal', '16': 'Charente',
  '17': 'Charente-Maritime', '18': 'Cher', '19': 'Corrèze', '21': 'Côte-d\'Or',
  '22': 'Côtes-d\'Armor', '23': 'Creuse', '24': 'Dordogne', '25': 'Doubs',
  '26': 'Drôme', '27': 'Eure', '28': 'Eure-et-Loir', '29': 'Finistère',
  '2A': 'Corse-du-Sud', '2B': 'Haute-Corse', '30': 'Gard', '31': 'Haute-Garonne',
  '32': 'Gers', '33': 'Gironde', '34': 'Hérault', '35': 'Ille-et-Vilaine',
  '36': 'Indre', '37': 'Indre-et-Loire', '38': 'Isère', '39': 'Jura',
  '40': 'Landes', '41': 'Loir-et-Cher', '42': 'Loire', '43': 'Haute-Loire',
  '44': 'Loire-Atlantique', '45': 'Loiret', '46': 'Lot', '47': 'Lot-et-Garonne',
  '48': 'Lozère', '49': 'Maine-et-Loire', '50': 'Manche', '51': 'Marne',
  '52': 'Haute-Marne', '53': 'Mayenne', '54': 'Meurthe-et-Moselle', '55': 'Meuse',
  '56': 'Morbihan', '57': 'Moselle', '58': 'Nièvre', '59': 'Nord',
  '60': 'Oise', '61': 'Orne', '62': 'Pas-de-Calais', '63': 'Puy-de-Dôme',
  '64': 'Pyrénées-Atlantiques', '65': 'Hautes-Pyrénées', '66': 'Pyrénées-Orientales',
  '67': 'Bas-Rhin', '68': 'Haut-Rhin', '69': 'Rhône', '70': 'Haute-Saône',
  '71': 'Saône-et-Loire', '72': 'Sarthe', '73': 'Savoie', '74': 'Haute-Savoie',
  '75': 'Paris', '76': 'Seine-Maritime', '77': 'Seine-et-Marne', '78': 'Yvelines',
  '79': 'Deux-Sèvres', '80': 'Somme', '81': 'Tarn', '82': 'Tarn-et-Garonne',
  '83': 'Var', '84': 'Vaucluse', '85': 'Vendée', '86': 'Vienne',
  '87': 'Haute-Vienne', '88': 'Vosges', '89': 'Yonne', '90': 'Territoire de Belfort',
  '91': 'Essonne', '92': 'Hauts-de-Seine', '93': 'Seine-Saint-Denis',
  '94': 'Val-de-Marne', '95': 'Val-d\'Oise',
  // Overseas
  '971': 'Guadeloupe', '972': 'Martinique', '973': 'Guyane',
  '974': 'La Réunion', '976': 'Mayotte',
};

/**
 * Extractor options specific to population data
 */
export interface PopulationExtractorOptions extends ExtractorOptions {
  /** Start year for data extraction */
  startYear?: number;
  /** End year for data extraction */
  endYear?: number;
  /** Include overseas départements (DOM) */
  includeOverseas?: boolean;
  /** Use embedded data (default: true for MVP) */
  useEmbedded?: boolean;
}

/**
 * Population Data Extractor
 *
 * Extracts population records from embedded data or external sources.
 * For MVP, uses embedded INSEE data (2016-2024).
 */
export class PopulationExtractor extends BaseExtractor<PopulationRawRecord> {
  protected populationOptions: PopulationExtractorOptions;

  constructor(options: PopulationExtractorOptions) {
    super(options);
    this.populationOptions = {
      startYear: POPULATION_YEAR_RANGE.start,
      endYear: POPULATION_YEAR_RANGE.end,
      includeOverseas: true,
      useEmbedded: true,
      ...options,
    };
  }

  /**
   * Extract population records
   */
  async extract(): Promise<ExtractionResult<PopulationRawRecord>> {
    const warnings: string[] = [];
    const { startYear, endYear, includeOverseas, useEmbedded } = this.populationOptions;

    logger.info(`Extracting population data (${startYear}-${endYear})`);

    if (!useEmbedded) {
      // Future: implement external source extraction
      throw new Error('External source extraction not yet implemented. Use embedded data.');
    }

    const records = this.extractEmbeddedData(startYear!, endYear!, includeOverseas!);

    // Validate record count
    const expectedDepartements = includeOverseas
      ? EXPECTED_POPULATION_RECORDS.totalDepartements
      : EXPECTED_POPULATION_RECORDS.metropolitan;
    const expectedYears = endYear! - startYear! + 1;
    const expectedTotal = expectedDepartements * expectedYears;

    if (records.length !== expectedTotal) {
      warnings.push(
        `Expected ${expectedTotal} records (${expectedDepartements} départements × ${expectedYears} years), ` +
        `got ${records.length}`
      );
    }

    logger.info(`Extracted ${records.length} population records`);

    return {
      data: records,
      source: 'INSEE Embedded Data',
      rowCount: records.length,
      extractedAt: new Date(),
      warnings,
    };
  }

  /**
   * Extract data from embedded population dataset
   */
  private extractEmbeddedData(
    startYear: number,
    endYear: number,
    includeOverseas: boolean,
  ): PopulationRawRecord[] {
    const records: PopulationRawRecord[] = [];

    for (const [code, yearData] of Object.entries(EMBEDDED_POPULATION_DATA)) {
      // Skip overseas départements if not requested
      const isOverseas = code.length === 3; // 971, 972, etc.
      if (!includeOverseas && isOverseas) {
        continue;
      }

      for (let year = startYear; year <= endYear; year++) {
        const populationInThousands = yearData[year];
        if (populationInThousands === undefined) {
          logger.warn(`Missing population data for ${code} in ${year}`);
          continue;
        }

        records.push({
          departementCode: code,
          departementName: DEPARTEMENT_NAMES[code],
          year,
          // Convert from thousands to actual population
          population: populationInThousands * 1000,
        });
      }
    }

    // Sort by département code, then year
    records.sort((a, b) => {
      const codeCompare = a.departementCode.localeCompare(b.departementCode);
      if (codeCompare !== 0) return codeCompare;
      return a.year - b.year;
    });

    return records;
  }

  /**
   * Validate extractor configuration
   */
  async validate(): Promise<boolean> {
    const { startYear, endYear } = this.populationOptions;

    if (!startYear || !endYear) {
      logger.error('Start year and end year are required');
      return false;
    }

    if (startYear > endYear) {
      logger.error(`Invalid year range: ${startYear} > ${endYear}`);
      return false;
    }

    if (startYear < POPULATION_YEAR_RANGE.start || endYear > POPULATION_YEAR_RANGE.end) {
      logger.warn(
        `Requested year range (${startYear}-${endYear}) exceeds available data ` +
        `(${POPULATION_YEAR_RANGE.start}-${POPULATION_YEAR_RANGE.end})`
      );
    }

    return true;
  }
}

/**
 * Factory function to create a PopulationExtractor with default options
 */
export function createPopulationExtractor(
  options: Partial<PopulationExtractorOptions> = {},
): PopulationExtractor {
  return new PopulationExtractor({
    source: 'embedded://population-data',
    ...options,
  });
}
