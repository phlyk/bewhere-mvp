/**
 * French Monthly Crime Data Types (État 4001)
 *
 * Type definitions for the État 4001 monthly crime snapshots.
 * These CSV files contain département-level crime counts by category.
 */

/**
 * Raw row from the État 4001 CSV file
 * Each row represents one crime category with counts per département
 */
export interface Etat4001RawRow {
  /** Row index (01-107) */
  index: string;
  /** Crime category name in French */
  categoryName: string;
  /** National metropolitan total */
  metropole: string;
  /** Département counts keyed by code (01-95) or name */
  departements: Record<string, string>;
}

/**
 * Parsed and validated row ready for transformation
 */
export interface Etat4001ParsedRow {
  /** Numeric index (1-107) */
  index: number;
  /** Crime category name (French) */
  categoryName: string;
  /** Metropolitan France total */
  metropoleTotal: number;
  /** Département counts keyed by standardized code */
  departementCounts: Record<string, number>;
  /** Source file month and year (parsed from filename/header) */
  sourceDate?: {
    month: number;
    year: number;
  };
}

/**
 * Extracted data ready for transformation
 */
export interface FranceMonthlyExtractedData {
  /** All parsed crime category rows */
  rows: Etat4001ParsedRow[];
  /** Source metadata */
  metadata: FranceMonthlyMetadata;
}

/**
 * Source file metadata
 */
export interface FranceMonthlyMetadata {
  /** Source file path or URL */
  source: string;
  /** Detected file encoding */
  encoding: string;
  /** Month and year from filename/header */
  reportMonth?: number;
  reportYear?: number;
  /** Total départements found */
  departementCount: number;
  /** Total crime categories found */
  categoryCount: number;
  /** Header row départements in order */
  departementOrder: string[];
}

/**
 * Département column mapping
 * Maps column header text to standardized département code
 */
export interface DepartementColumnMapping {
  /** Column index (0-based) */
  columnIndex: number;
  /** Original column header text */
  headerText: string;
  /** Standardized département code (01-95, 2A, 2B, 971-976) */
  departementCode: string;
  /** Département name (normalized) */
  departementName: string;
}

/**
 * Column structure for État 4001 files
 * Column 0: N°Index
 * Column 1: Index de l'Etat 4001 (crime category name)
 * Column 2: Métropole (national total)
 * Columns 3-97: Département columns
 */
export const ETAT4001_COLUMN_STRUCTURE = {
  /** Index column (row number) */
  INDEX_COLUMN: 0,
  /** Category name column */
  CATEGORY_COLUMN: 1,
  /** Metropolitan total column */
  METROPOLE_COLUMN: 2,
  /** First département column */
  FIRST_DEPARTEMENT_COLUMN: 3,
} as const;

/**
 * Mapping from column header département names to codes
 * Handles various spellings and formats found in data files
 */
export const DEPARTEMENT_NAME_TO_CODE: Record<string, string> = {
  // Metropolitan départements (01-95)
  'ain': '01',
  'aisne': '02',
  'allier': '03',
  'alpes-de-haute-provence': '04',
  'hautes-alpes': '05',
  'alpes-maritimes': '06',
  'ardèche': '07',
  'ardeche': '07',
  'ardennes': '08',
  'ariège': '09',
  'ariege': '09',
  'aube': '10',
  'aude': '11',
  'aveyron': '12',
  'bouches-du-rhône': '13',
  'bouches-du-rhone': '13',
  'calvados': '14',
  'cantal': '15',
  'charente': '16',
  'charente-maritime': '17',
  'cher': '18',
  'corrèze': '19',
  'correze': '19',
  'corse-du-sud': '2A',
  'haute-corse': '2B',
  "côte-d'or": '21',
  "cote-d'or": '21',
  "côtes-d'armor": '22',
  "cotes-d'armor": '22',
  'creuse': '23',
  'dordogne': '24',
  'doubs': '25',
  'drôme': '26',
  'drome': '26',
  'eure': '27',
  'eure-et-loir': '28',
  'finistère': '29',
  'finistere': '29',
  'gard': '30',
  'haute-garonne': '31',
  'gers': '32',
  'gironde': '33',
  'hérault': '34',
  'herault': '34',
  'ille-et-vilaine': '35',
  'indre': '36',
  'indre-et-loire': '37',
  'isère': '38',
  'isere': '38',
  'jura': '39',
  'landes': '40',
  'loir-et-cher': '41',
  'loire': '42',
  'haute-loire': '43',
  'loire-atlantique': '44',
  'loiret': '45',
  'lot': '46',
  'lot-et-garonne': '47',
  'lozère': '48',
  'lozere': '48',
  'maine-et-loire': '49',
  'manche': '50',
  'marne': '51',
  'haute-marne': '52',
  'mayenne': '53',
  'meurthe-et-moselle': '54',
  'meuse': '55',
  'morbihan': '56',
  'moselle': '57',
  'nièvre': '58',
  'nievre': '58',
  'nord': '59',
  'oise': '60',
  'orne': '61',
  'pas-de-calais': '62',
  'puy-de-dôme': '63',
  'puy-de-dome': '63',
  'pyrénées-atlantiques': '64',
  'pyrenees-atlantiques': '64',
  'hautes-pyrénées': '65',
  'hautes-pyrenees': '65',
  'pyrénées-orientales': '66',
  'pyrenees-orientales': '66',
  'bas-rhin': '67',
  'haut-rhin': '68',
  'rhône': '69',
  'rhone': '69',
  'haute-saône': '70',
  'haute-saone': '70',
  'saône-et-loire': '71',
  'saone-et-loire': '71',
  'sarthe': '72',
  'savoie': '73',
  'haute-savoie': '74',
  'paris': '75',
  'seine-maritime': '76',
  'seine-et-marne': '77',
  'yvelines': '78',
  'deux-sèvres': '79',
  'deux-sevres': '79',
  'somme': '80',
  'tarn': '81',
  'tarn-et-garonne': '82',
  'var': '83',
  'vaucluse': '84',
  'vendée': '85',
  'vendee': '85',
  'vienne': '86',
  'haute-vienne': '87',
  'vosges': '88',
  'yonne': '89',
  'territoire de belfort': '90',
  'essonne': '91',
  'hauts-de-seine': '92',
  'seine-saint-denis': '93',
  'val-de-marne': '94',
  "val-d'oise": '95',
  
  // Overseas départements (DOM)
  'guadeloupe': '971',
  'martinique': '972',
  'guyane': '973',
  'la réunion': '974',
  'la reunion': '974',
  'réunion': '974',
  'reunion': '974',
  'mayotte': '976',
  
  // Special case: National total
  'métropole': 'METRO',
  'metropole': 'METRO',
  'france métropolitaine': 'METRO',
  'france metropolitaine': 'METRO',
};

/**
 * List of unused État 4001 indices to skip during ETL
 */
export const UNUSED_ETAT4001_INDICES = [96, 97, 99, 100];

/**
 * Check if an index should be skipped
 */
export function isUnusedIndex(index: number): boolean {
  return UNUSED_ETAT4001_INDICES.includes(index);
}
