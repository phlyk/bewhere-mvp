/**
 * French Monthly Crime Category Mapper (État 4001)
 *
 * Maps 107 État 4001 crime indices to 20 canonical crime categories.
 * Based on the mapping defined in docs/CATEGORY_MAPPINGS.md
 *
 * @see docs/CATEGORY_MAPPINGS.md for full mapping rationale
 * @see docs/CRIME_TAXONOMY.md for canonical category definitions
 */

import { logger } from '../../utils/logger';

/**
 * Canonical crime category codes
 * Matches the 20 categories defined in CRIME_TAXONOMY.md
 */
export type CanonicalCategoryCode =
  | 'HOMICIDE'
  | 'ATTEMPTED_HOMICIDE'
  | 'ASSAULT'
  | 'SEXUAL_VIOLENCE'
  | 'HUMAN_TRAFFICKING'
  | 'KIDNAPPING'
  | 'ARMED_ROBBERY'
  | 'ROBBERY'
  | 'BURGLARY_RESIDENTIAL'
  | 'BURGLARY_COMMERCIAL'
  | 'VEHICLE_THEFT'
  | 'THEFT_OTHER'
  | 'DRUG_TRAFFICKING'
  | 'DRUG_USE'
  | 'ARSON'
  | 'VANDALISM'
  | 'FRAUD'
  | 'CHILD_ABUSE'
  | 'DOMESTIC_VIOLENCE'
  | 'OTHER';

/**
 * Mapping entry with metadata
 */
export interface CategoryMappingEntry {
  /** État 4001 index (1-107) */
  etat4001Index: number;
  /** French category name from État 4001 */
  frenchName: string;
  /** Canonical category code */
  canonicalCode: CanonicalCategoryCode;
  /** Notes about the mapping */
  notes?: string;
}

/**
 * Mapping lookup result
 */
export interface CategoryLookupResult {
  /** Whether a mapping was found */
  found: boolean;
  /** Canonical category code (null if not found or unused) */
  canonicalCode: CanonicalCategoryCode | null;
  /** Original French name */
  frenchName: string | null;
  /** Whether this is an unused/skipped index */
  isUnused: boolean;
  /** Mapping notes if any */
  notes?: string;
}

/**
 * Mapping statistics
 */
export interface MappingStatistics {
  /** Total indices in État 4001 */
  totalIndices: number;
  /** Number of active (mapped) indices */
  activeIndices: number;
  /** Number of unused indices */
  unusedIndices: number;
  /** Indices per canonical category */
  indicesPerCategory: Record<CanonicalCategoryCode, number>;
  /** Canonical categories with no mapped indices */
  emptyCategories: CanonicalCategoryCode[];
}

/**
 * Complete mapping from État 4001 index to canonical category
 * Based on docs/CATEGORY_MAPPINGS.md
 */
const ETAT4001_TO_CANONICAL: CategoryMappingEntry[] = [
  // ============================================
  // HOMICIDE (4 indices: 01, 02, 03, 51)
  // ============================================
  { etat4001Index: 1, frenchName: 'Règlements de compte entre malfaiteurs', canonicalCode: 'HOMICIDE', notes: 'Criminal settlements' },
  { etat4001Index: 2, frenchName: 'Homicides pour voler et à l\'occasion de vols', canonicalCode: 'HOMICIDE', notes: 'During robbery' },
  { etat4001Index: 3, frenchName: 'Homicides pour d\'autres motifs', canonicalCode: 'HOMICIDE', notes: 'Other motives' },
  { etat4001Index: 51, frenchName: 'Homicides commis contre enfants de moins de 15 ans', canonicalCode: 'HOMICIDE', notes: 'Child homicide' },

  // ============================================
  // ATTEMPTED_HOMICIDE (3 indices: 04, 05, 06)
  // ============================================
  { etat4001Index: 4, frenchName: 'Tentatives d\'homicides pour voler et à l\'occasion de vols', canonicalCode: 'ATTEMPTED_HOMICIDE', notes: 'During robbery' },
  { etat4001Index: 5, frenchName: 'Tentatives homicides pour d\'autres motifs', canonicalCode: 'ATTEMPTED_HOMICIDE', notes: 'Other motives' },
  { etat4001Index: 6, frenchName: 'Coups et blessures volontaires suivis de mort', canonicalCode: 'ATTEMPTED_HOMICIDE', notes: 'Assault resulting in death' },

  // ============================================
  // ASSAULT (5 indices: 07, 11, 12, 13, 73)
  // ============================================
  { etat4001Index: 7, frenchName: 'Autres coups et blessures volontaires criminels ou correctionnels', canonicalCode: 'ASSAULT', notes: 'General assault/battery' },
  { etat4001Index: 11, frenchName: 'Menaces ou chantages pour extorsion de fonds', canonicalCode: 'ASSAULT', notes: 'Threats/blackmail for money' },
  { etat4001Index: 12, frenchName: 'Menaces ou chantages dans un autre but', canonicalCode: 'ASSAULT', notes: 'Threats/blackmail other' },
  { etat4001Index: 13, frenchName: 'Atteintes à la dignité et à la personnalité', canonicalCode: 'ASSAULT', notes: 'Dignity offenses' },
  { etat4001Index: 73, frenchName: 'Violences à dépositaires de l\'autorité', canonicalCode: 'ASSAULT', notes: 'Violence to authority' },

  // ============================================
  // SEXUAL_VIOLENCE (5 indices: 46, 47, 48, 49, 50)
  // ============================================
  { etat4001Index: 46, frenchName: 'Viols sur des majeur(e)s', canonicalCode: 'SEXUAL_VIOLENCE', notes: 'Rape - adults' },
  { etat4001Index: 47, frenchName: 'Viols sur des mineur(e)s', canonicalCode: 'SEXUAL_VIOLENCE', notes: 'Rape - minors' },
  { etat4001Index: 48, frenchName: 'Harcèlements sexuels et autres agressions sexuelles contre des majeur(e)s', canonicalCode: 'SEXUAL_VIOLENCE', notes: 'Harassment - adults' },
  { etat4001Index: 49, frenchName: 'Harcèlements sexuels et autres agressions sexuelles contre des mineur(e)s', canonicalCode: 'SEXUAL_VIOLENCE', notes: 'Harassment - minors' },
  { etat4001Index: 50, frenchName: 'Atteintes sexuelles', canonicalCode: 'SEXUAL_VIOLENCE', notes: 'Sexual assault' },

  // ============================================
  // HUMAN_TRAFFICKING (1 index: 45)
  // ============================================
  { etat4001Index: 45, frenchName: 'Proxénétisme', canonicalCode: 'HUMAN_TRAFFICKING', notes: 'Pimping/procuring' },

  // ============================================
  // KIDNAPPING (3 indices: 08, 09, 10)
  // ============================================
  { etat4001Index: 8, frenchName: 'Prises d\'otages à l\'occasion de vols', canonicalCode: 'KIDNAPPING', notes: 'During robbery' },
  { etat4001Index: 9, frenchName: 'Prises d\'otages dans un autre but', canonicalCode: 'KIDNAPPING', notes: 'Other purposes' },
  { etat4001Index: 10, frenchName: 'Séquestrations', canonicalCode: 'KIDNAPPING', notes: 'Unlawful detention' },

  // ============================================
  // ARMED_ROBBERY (8 indices: 15-22)
  // ============================================
  { etat4001Index: 15, frenchName: 'Vols à main armée contre des établissements financiers', canonicalCode: 'ARMED_ROBBERY', notes: 'Banks/financial' },
  { etat4001Index: 16, frenchName: 'Vols à main armée contre des établissements industriels ou commerciaux', canonicalCode: 'ARMED_ROBBERY', notes: 'Commercial/industrial' },
  { etat4001Index: 17, frenchName: 'Vols à main armée contre des entreprises de transports de fonds', canonicalCode: 'ARMED_ROBBERY', notes: 'Cash transport' },
  { etat4001Index: 18, frenchName: 'Vols à main armée contre des particuliers à leur domicile', canonicalCode: 'ARMED_ROBBERY', notes: 'Private homes' },
  { etat4001Index: 19, frenchName: 'Autres vols à main armée', canonicalCode: 'ARMED_ROBBERY', notes: 'Other armed robbery' },
  { etat4001Index: 20, frenchName: 'Vols avec armes blanches contre des établissements financiers, commerciaux ou industriels', canonicalCode: 'ARMED_ROBBERY', notes: 'Knife - commercial' },
  { etat4001Index: 21, frenchName: 'Vols avec armes blanches contre des particuliers à leur domicile', canonicalCode: 'ARMED_ROBBERY', notes: 'Knife - homes' },
  { etat4001Index: 22, frenchName: 'Autres vols avec armes blanches', canonicalCode: 'ARMED_ROBBERY', notes: 'Knife - other' },

  // ============================================
  // ROBBERY (4 indices: 23, 24, 25, 26)
  // ============================================
  { etat4001Index: 23, frenchName: 'Vols violents sans arme contre des établissements financiers, commerciaux ou industriels', canonicalCode: 'ROBBERY', notes: 'Violent - commercial' },
  { etat4001Index: 24, frenchName: 'Vols violents sans arme contre des particuliers à leur domicile', canonicalCode: 'ROBBERY', notes: 'Violent - homes' },
  { etat4001Index: 25, frenchName: 'Vols violents sans arme contre des femmes sur voie publique ou autre lieu public', canonicalCode: 'ROBBERY', notes: 'Street robbery - women' },
  { etat4001Index: 26, frenchName: 'Vols violents sans arme contre d\'autres victimes', canonicalCode: 'ROBBERY', notes: 'Other violent theft' },

  // ============================================
  // BURGLARY_RESIDENTIAL (4 indices: 14, 27, 28, 31)
  // ============================================
  { etat4001Index: 14, frenchName: 'Violations de domicile', canonicalCode: 'BURGLARY_RESIDENTIAL', notes: 'Home invasion (no theft)' },
  { etat4001Index: 27, frenchName: 'Cambriolages de locaux d\'habitations principales', canonicalCode: 'BURGLARY_RESIDENTIAL', notes: 'Primary residence' },
  { etat4001Index: 28, frenchName: 'Cambriolages de résidences secondaires', canonicalCode: 'BURGLARY_RESIDENTIAL', notes: 'Secondary residence' },
  { etat4001Index: 31, frenchName: 'Vols avec entrée par ruse en tous lieux', canonicalCode: 'BURGLARY_RESIDENTIAL', notes: 'Entry by deception' },

  // ============================================
  // BURGLARY_COMMERCIAL (2 indices: 29, 30)
  // ============================================
  { etat4001Index: 29, frenchName: 'Cambriolages de locaux industriels, commerciaux ou financiers', canonicalCode: 'BURGLARY_COMMERCIAL', notes: 'Commercial/industrial' },
  { etat4001Index: 30, frenchName: 'Cambriolages d\'autres lieux', canonicalCode: 'BURGLARY_COMMERCIAL', notes: 'Other locations' },

  // ============================================
  // VEHICLE_THEFT (5 indices: 34, 35, 36, 37, 38)
  // ============================================
  { etat4001Index: 34, frenchName: 'Vols de véhicules de transport avec fret', canonicalCode: 'VEHICLE_THEFT', notes: 'Transport vehicles' },
  { etat4001Index: 35, frenchName: 'Vols d\'automobiles', canonicalCode: 'VEHICLE_THEFT', notes: 'Cars' },
  { etat4001Index: 36, frenchName: 'Vols de véhicules motorisés à 2 roues', canonicalCode: 'VEHICLE_THEFT', notes: 'Motorcycles' },
  { etat4001Index: 37, frenchName: 'Vols à la roulotte', canonicalCode: 'VEHICLE_THEFT', notes: 'Theft from vehicles' },
  { etat4001Index: 38, frenchName: 'Vols d\'accessoires sur véhicules à moteur immatriculés', canonicalCode: 'VEHICLE_THEFT', notes: 'Vehicle accessories' },

  // ============================================
  // THEFT_OTHER (8 indices: 32, 33, 39, 40, 41, 42, 43, 44)
  // ============================================
  { etat4001Index: 32, frenchName: 'Vols à la tire', canonicalCode: 'THEFT_OTHER', notes: 'Pickpocketing' },
  { etat4001Index: 33, frenchName: 'Vols à l\'étalage', canonicalCode: 'THEFT_OTHER', notes: 'Shoplifting' },
  { etat4001Index: 39, frenchName: 'Vols simples sur chantier', canonicalCode: 'THEFT_OTHER', notes: 'Construction sites' },
  { etat4001Index: 40, frenchName: 'Vols simples sur exploitation agricole', canonicalCode: 'THEFT_OTHER', notes: 'Agricultural' },
  { etat4001Index: 41, frenchName: 'Autres vols simples contre des établissements publics ou privés', canonicalCode: 'THEFT_OTHER', notes: 'Public/private premises' },
  { etat4001Index: 42, frenchName: 'Autres vols simples contre des particuliers dans des locaux privés', canonicalCode: 'THEFT_OTHER', notes: 'Private premises' },
  { etat4001Index: 43, frenchName: 'Autres vols simples contre des particuliers dans des locaux ou lieux publics', canonicalCode: 'THEFT_OTHER', notes: 'Public places' },
  { etat4001Index: 44, frenchName: 'Recels', canonicalCode: 'THEFT_OTHER', notes: 'Receiving stolen goods' },

  // ============================================
  // DRUG_TRAFFICKING (2 indices: 55, 56)
  // ============================================
  { etat4001Index: 55, frenchName: 'Trafic et revente sans usage de stupéfiants', canonicalCode: 'DRUG_TRAFFICKING', notes: 'Trafficking only' },
  { etat4001Index: 56, frenchName: 'Usage-revente de stupéfiants', canonicalCode: 'DRUG_TRAFFICKING', notes: 'Use + dealing' },

  // ============================================
  // DRUG_USE (2 indices: 57, 58)
  // ============================================
  { etat4001Index: 57, frenchName: 'Usage de stupéfiants', canonicalCode: 'DRUG_USE', notes: 'Personal use' },
  { etat4001Index: 58, frenchName: 'Autres infractions à la législation sur les stupéfiants', canonicalCode: 'DRUG_USE', notes: 'Other drug offenses' },

  // ============================================
  // ARSON (4 indices: 62, 63, 64, 65)
  // ============================================
  { etat4001Index: 62, frenchName: 'Incendies volontaires de biens publics', canonicalCode: 'ARSON', notes: 'Public property' },
  { etat4001Index: 63, frenchName: 'Incendies volontaires de biens privés', canonicalCode: 'ARSON', notes: 'Private property' },
  { etat4001Index: 64, frenchName: 'Attentats à l\'explosif contre des biens publics', canonicalCode: 'ARSON', notes: 'Bombings - public' },
  { etat4001Index: 65, frenchName: 'Attentats à l\'explosif contre des biens privés', canonicalCode: 'ARSON', notes: 'Bombings - private' },

  // ============================================
  // VANDALISM (3 indices: 66, 67, 68)
  // ============================================
  { etat4001Index: 66, frenchName: 'Autres destructions et dégradations de biens publics', canonicalCode: 'VANDALISM', notes: 'Public property' },
  { etat4001Index: 67, frenchName: 'Autres destructions et dégradations de biens privés', canonicalCode: 'VANDALISM', notes: 'Private property' },
  { etat4001Index: 68, frenchName: 'Destructions et dégradations de véhicules privés', canonicalCode: 'VANDALISM', notes: 'Vehicles' },

  // ============================================
  // FRAUD (16 indices: 81-92, 98, 101, 102, 106)
  // ============================================
  { etat4001Index: 81, frenchName: 'Faux documents d\'identité', canonicalCode: 'FRAUD', notes: 'Identity documents' },
  { etat4001Index: 82, frenchName: 'Faux documents concernant la circulation des véhicules', canonicalCode: 'FRAUD', notes: 'Vehicle documents' },
  { etat4001Index: 83, frenchName: 'Autres faux documents administratifs', canonicalCode: 'FRAUD', notes: 'Other admin docs' },
  { etat4001Index: 84, frenchName: 'Faux en écriture publique et authentique', canonicalCode: 'FRAUD', notes: 'Public document forgery' },
  { etat4001Index: 85, frenchName: 'Autres faux en écriture', canonicalCode: 'FRAUD', notes: 'Other forgery' },
  { etat4001Index: 86, frenchName: 'Fausse monnaie', canonicalCode: 'FRAUD', notes: 'Counterfeiting' },
  { etat4001Index: 87, frenchName: 'Contrefaçons et fraudes industrielles et commerciales', canonicalCode: 'FRAUD', notes: 'Commercial fraud' },
  { etat4001Index: 88, frenchName: 'Contrefaçons littéraires et artistiques', canonicalCode: 'FRAUD', notes: 'IP violations' },
  { etat4001Index: 89, frenchName: 'Falsifications et usages de chèques volés', canonicalCode: 'FRAUD', notes: 'Check fraud' },
  { etat4001Index: 90, frenchName: 'Falsifications et usages de cartes de crédit', canonicalCode: 'FRAUD', notes: 'Credit card fraud' },
  { etat4001Index: 91, frenchName: 'Escroqueries et abus de confiance', canonicalCode: 'FRAUD', notes: 'Swindling' },
  { etat4001Index: 92, frenchName: 'Infractions à la législation sur les chèques', canonicalCode: 'FRAUD', notes: 'Check violations' },
  { etat4001Index: 98, frenchName: 'Banqueroutes, abus de biens sociaux et autres délits de société', canonicalCode: 'FRAUD', notes: 'Corporate crimes' },
  { etat4001Index: 101, frenchName: 'Prix illicites, publicité fausse et infractions aux règles de la concurrence', canonicalCode: 'FRAUD', notes: 'Competition violations' },
  { etat4001Index: 102, frenchName: 'Achats et ventes sans factures', canonicalCode: 'FRAUD', notes: 'Invoice fraud' },
  { etat4001Index: 106, frenchName: 'Autres délits économiques et financiers', canonicalCode: 'FRAUD', notes: 'Other financial crimes' },

  // ============================================
  // CHILD_ABUSE (3 indices: 52, 53, 54)
  // ============================================
  { etat4001Index: 52, frenchName: 'Violences, mauvais traitements et abandons d\'enfants', canonicalCode: 'CHILD_ABUSE', notes: 'Abuse/neglect' },
  { etat4001Index: 53, frenchName: 'Délits au sujet de la garde des mineurs', canonicalCode: 'CHILD_ABUSE', notes: 'Custody violations' },
  { etat4001Index: 54, frenchName: 'Non versement de pension alimentaire', canonicalCode: 'CHILD_ABUSE', notes: 'Child support' },

  // ============================================
  // DOMESTIC_VIOLENCE - No direct État 4001 mapping
  // Historical data does not distinguish domestic violence
  // ============================================

  // ============================================
  // OTHER (21 indices: 59-61, 69-72, 74-80, 93-95, 103-105, 107)
  // ============================================
  { etat4001Index: 59, frenchName: 'Délits de débits de boissons et ivresse publique', canonicalCode: 'OTHER', notes: 'Alcohol offenses' },
  { etat4001Index: 60, frenchName: 'Fraudes alimentaires et infractions à l\'hygiène', canonicalCode: 'OTHER', notes: 'Food fraud/hygiene' },
  { etat4001Index: 61, frenchName: 'Autres délits contre santé publique et réglementation des professions médicales', canonicalCode: 'OTHER', notes: 'Health regulations' },
  { etat4001Index: 69, frenchName: 'Infractions aux conditions générales d\'entrée et de séjour des étrangers', canonicalCode: 'OTHER', notes: 'Immigration - entry' },
  { etat4001Index: 70, frenchName: 'Aide à l\'entrée, à la circulation et au séjour des étrangers', canonicalCode: 'OTHER', notes: 'Immigration - aiding' },
  { etat4001Index: 71, frenchName: 'Autres infractions à la police des étrangers', canonicalCode: 'OTHER', notes: 'Immigration - other' },
  { etat4001Index: 72, frenchName: 'Outrages à dépositaires de l\'autorité', canonicalCode: 'OTHER', notes: 'Insulting authority' },
  { etat4001Index: 74, frenchName: 'Port ou détention d\'armes prohibées', canonicalCode: 'OTHER', notes: 'Weapons possession' },
  { etat4001Index: 75, frenchName: 'Atteintes aux intérêts fondamentaux de la Nation', canonicalCode: 'OTHER', notes: 'Offenses vs. state' },
  { etat4001Index: 76, frenchName: 'Délits des courses et des jeux', canonicalCode: 'OTHER', notes: 'Gambling offenses' },
  { etat4001Index: 77, frenchName: 'Délits interdiction de séjour et de paraître', canonicalCode: 'OTHER', notes: 'Residency violations' },
  { etat4001Index: 78, frenchName: 'Destructions, cruautés et autres délits envers les animaux', canonicalCode: 'OTHER', notes: 'Animal cruelty' },
  { etat4001Index: 79, frenchName: 'Atteintes à l\'environnement', canonicalCode: 'OTHER', notes: 'Environmental' },
  { etat4001Index: 80, frenchName: 'Chasse et pêche', canonicalCode: 'OTHER', notes: 'Hunting/fishing' },
  { etat4001Index: 93, frenchName: 'Travail clandestin', canonicalCode: 'OTHER', notes: 'Illegal labor' },
  { etat4001Index: 94, frenchName: 'Emploi d\'étranger sans titre de travail', canonicalCode: 'OTHER', notes: 'Illegal employment' },
  { etat4001Index: 95, frenchName: 'Marchandage - prêt de main d\'œuvre', canonicalCode: 'OTHER', notes: 'Labor trafficking' },
  { etat4001Index: 103, frenchName: 'Infractions à l\'exercice d\'une profession réglementée', canonicalCode: 'OTHER', notes: 'Professional violations' },
  { etat4001Index: 104, frenchName: 'Infractions au droit de l\'urbanisme et de la construction', canonicalCode: 'OTHER', notes: 'Construction violations' },
  { etat4001Index: 105, frenchName: 'Pollution, infractions aux règles de sécurité', canonicalCode: 'OTHER', notes: 'Safety violations' },
  { etat4001Index: 107, frenchName: 'Autres délits', canonicalCode: 'OTHER', notes: 'Miscellaneous' },
];

/**
 * Unused État 4001 indices to skip during ETL
 */
export const UNUSED_INDICES = [96, 97, 99, 100];

/**
 * All canonical category codes
 */
export const ALL_CANONICAL_CODES: CanonicalCategoryCode[] = [
  'HOMICIDE',
  'ATTEMPTED_HOMICIDE',
  'ASSAULT',
  'SEXUAL_VIOLENCE',
  'HUMAN_TRAFFICKING',
  'KIDNAPPING',
  'ARMED_ROBBERY',
  'ROBBERY',
  'BURGLARY_RESIDENTIAL',
  'BURGLARY_COMMERCIAL',
  'VEHICLE_THEFT',
  'THEFT_OTHER',
  'DRUG_TRAFFICKING',
  'DRUG_USE',
  'ARSON',
  'VANDALISM',
  'FRAUD',
  'CHILD_ABUSE',
  'DOMESTIC_VIOLENCE',
  'OTHER',
];

/**
 * Category Mapper for État 4001 data
 *
 * Provides efficient lookup and validation of category mappings.
 */
export class Etat4001CategoryMapper {
  /** Index-based lookup map for O(1) access */
  private indexToMapping: Map<number, CategoryMappingEntry>;
  /** Canonical code to indices reverse lookup */
  private codeToIndices: Map<CanonicalCategoryCode, number[]>;
  /** Set of unused indices for fast lookup */
  private unusedIndices: Set<number>;

  constructor() {
    this.indexToMapping = new Map();
    this.codeToIndices = new Map();
    this.unusedIndices = new Set(UNUSED_INDICES);

    // Initialize code to indices map
    for (const code of ALL_CANONICAL_CODES) {
      this.codeToIndices.set(code, []);
    }

    // Build lookup maps from mapping array
    for (const entry of ETAT4001_TO_CANONICAL) {
      this.indexToMapping.set(entry.etat4001Index, entry);
      const indices = this.codeToIndices.get(entry.canonicalCode) || [];
      indices.push(entry.etat4001Index);
      this.codeToIndices.set(entry.canonicalCode, indices);
    }

    logger.debug(`Initialized category mapper with ${this.indexToMapping.size} mappings`);
  }

  /**
   * Look up the canonical category for an État 4001 index
   */
  lookup(etat4001Index: number): CategoryLookupResult {
    // Check if unused
    if (this.unusedIndices.has(etat4001Index)) {
      return {
        found: false,
        canonicalCode: null,
        frenchName: null,
        isUnused: true,
      };
    }

    // Look up mapping
    const entry = this.indexToMapping.get(etat4001Index);
    if (!entry) {
      return {
        found: false,
        canonicalCode: null,
        frenchName: null,
        isUnused: false,
      };
    }

    return {
      found: true,
      canonicalCode: entry.canonicalCode,
      frenchName: entry.frenchName,
      isUnused: false,
      notes: entry.notes,
    };
  }

  /**
   * Get the canonical category code for an index
   * Returns null if not found or unused
   */
  getCanonicalCode(etat4001Index: number): CanonicalCategoryCode | null {
    const result = this.lookup(etat4001Index);
    return result.canonicalCode;
  }

  /**
   * Check if an index should be skipped (unused)
   */
  isUnused(etat4001Index: number): boolean {
    return this.unusedIndices.has(etat4001Index);
  }

  /**
   * Check if an index has a valid mapping
   */
  hasMapping(etat4001Index: number): boolean {
    return this.indexToMapping.has(etat4001Index);
  }

  /**
   * Get all État 4001 indices that map to a canonical category
   */
  getIndicesForCategory(canonicalCode: CanonicalCategoryCode): number[] {
    return this.codeToIndices.get(canonicalCode) || [];
  }

  /**
   * Get the full mapping entry for an index
   */
  getMappingEntry(etat4001Index: number): CategoryMappingEntry | undefined {
    return this.indexToMapping.get(etat4001Index);
  }

  /**
   * Get all mappings for a canonical category
   */
  getMappingsForCategory(canonicalCode: CanonicalCategoryCode): CategoryMappingEntry[] {
    const indices = this.getIndicesForCategory(canonicalCode);
    return indices
      .map(idx => this.indexToMapping.get(idx))
      .filter((entry): entry is CategoryMappingEntry => entry !== undefined);
  }

  /**
   * Get all mapping entries
   */
  getAllMappings(): CategoryMappingEntry[] {
    return [...ETAT4001_TO_CANONICAL];
  }

  /**
   * Get mapping statistics
   */
  getStatistics(): MappingStatistics {
    const indicesPerCategory: Record<CanonicalCategoryCode, number> = {} as Record<CanonicalCategoryCode, number>;
    const emptyCategories: CanonicalCategoryCode[] = [];

    for (const code of ALL_CANONICAL_CODES) {
      const count = this.codeToIndices.get(code)?.length || 0;
      indicesPerCategory[code] = count;
      if (count === 0) {
        emptyCategories.push(code);
      }
    }

    return {
      totalIndices: 107,
      activeIndices: this.indexToMapping.size,
      unusedIndices: UNUSED_INDICES.length,
      indicesPerCategory,
      emptyCategories,
    };
  }

  /**
   * Validate the mapper configuration
   * Checks for gaps and inconsistencies
   */
  validate(): { valid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check for expected coverage
    const stats = this.getStatistics();
    
    // Warn about empty categories
    for (const category of stats.emptyCategories) {
      if (category === 'DOMESTIC_VIOLENCE') {
        // This is expected - historical data doesn't have domestic violence category
        warnings.push(
          `DOMESTIC_VIOLENCE has no État 4001 mappings (expected - historical data limitation)`
        );
      } else {
        errors.push(`Canonical category ${category} has no État 4001 mappings`);
      }
    }

    // Check for expected active indices count
    const expectedActive = 95; // État 4001 has 95 active categories
    if (stats.activeIndices !== expectedActive) {
      warnings.push(
        `Expected ${expectedActive} active mappings, found ${stats.activeIndices}`
      );
    }

    // Check all indices 1-107 are either mapped or unused
    for (let i = 1; i <= 107; i++) {
      if (!this.hasMapping(i) && !this.isUnused(i)) {
        errors.push(`Index ${i} is neither mapped nor marked as unused`);
      }
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  }

  /**
   * Create a summary report of the mappings
   */
  getSummaryReport(): string {
    const stats = this.getStatistics();
    const lines: string[] = [
      '=== État 4001 Category Mapping Summary ===',
      '',
      `Total Indices: ${stats.totalIndices}`,
      `Active (Mapped): ${stats.activeIndices}`,
      `Unused: ${stats.unusedIndices}`,
      '',
      '--- Indices per Canonical Category ---',
    ];

    for (const code of ALL_CANONICAL_CODES) {
      const count = stats.indicesPerCategory[code];
      const countStr = count === 0 ? '(none)' : count.toString();
      lines.push(`  ${code}: ${countStr}`);
    }

    if (stats.emptyCategories.length > 0) {
      lines.push('');
      lines.push('--- Categories with No Mappings ---');
      for (const category of stats.emptyCategories) {
        lines.push(`  ${category}`);
      }
    }

    return lines.join('\n');
  }
}

/**
 * Singleton instance of the category mapper
 */
let mapperInstance: Etat4001CategoryMapper | null = null;

/**
 * Get the singleton category mapper instance
 */
export function getCategoryMapper(): Etat4001CategoryMapper {
  if (!mapperInstance) {
    mapperInstance = new Etat4001CategoryMapper();
  }
  return mapperInstance;
}

/**
 * Reset the singleton (useful for testing)
 */
export function resetCategoryMapper(): void {
  mapperInstance = null;
}
