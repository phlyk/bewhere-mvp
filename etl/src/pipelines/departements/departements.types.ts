/**
 * Types for French département geometry pipeline
 */

import { MultiPolygon, Polygon } from 'geojson';

/**
 * Raw GeoJSON feature properties from French government data
 * (data.gouv.fr / IGN)
 */
export interface DepartementGeoJsonProperties {
  /** Département code (e.g., '75', '971') */
  code: string;
  /** Département name in French (e.g., 'Paris', 'Guadeloupe') */
  nom: string;
  /** Region code this département belongs to */
  region?: string;
  /** Region name (if included) */
  regionNom?: string;
  /** Surface area in km² (if included) */
  surface?: number;
  /** Population (if included - usually not, we use separate INSEE data) */
  population?: number;
}

/**
 * GeoJSON Feature for a French département
 */
export interface DepartementGeoJsonFeature {
  type: 'Feature';
  properties: DepartementGeoJsonProperties;
  geometry: Polygon | MultiPolygon;
}

/**
 * Full GeoJSON FeatureCollection for French départements
 */
export interface DepartementsGeoJson {
  type: 'FeatureCollection';
  features: DepartementGeoJsonFeature[];
}

/**
 * Transformed département record ready for database insertion
 */
export interface DepartementRecord {
  /** Département code (e.g., '75', '971') */
  code: string;
  /** Département name in French */
  name: string;
  /** English name (usually same as French for départements) */
  nameEn: string | null;
  /** Administrative level: 'department' */
  level: 'department';
  /** Parent region code */
  parentCode: string | null;
  /** Country code: 'FR' */
  countryCode: 'FR';
  /** PostGIS geometry (WKT format) */
  geometry: string;
  /** GeoJSON geometry object (for validation/debugging) */
  geojson: Polygon | MultiPolygon;
}

/**
 * Known French regions with codes
 * Source: INSEE Code Officiel Géographique
 */
export const FRENCH_REGIONS: Record<string, string> = {
  '84': 'ARA', // Auvergne-Rhône-Alpes
  '27': 'BFC', // Bourgogne-Franche-Comté
  '53': 'BRE', // Bretagne
  '24': 'CVL', // Centre-Val de Loire
  '94': 'COR', // Corse
  '44': 'GES', // Grand Est
  '32': 'HDF', // Hauts-de-France
  '11': 'IDF', // Île-de-France
  '28': 'NOR', // Normandie
  '75': 'NAQ', // Nouvelle-Aquitaine
  '76': 'OCC', // Occitanie
  '52': 'PDL', // Pays de la Loire
  '93': 'PAC', // Provence-Alpes-Côte d'Azur
  // Overseas
  '01': 'GUA', // Guadeloupe
  '02': 'MQ', // Martinique
  '03': 'GUF', // Guyane
  '04': 'REU', // La Réunion
  '06': 'MAY', // Mayotte
};

/**
 * Mapping of département codes to region codes
 * This is a subset of key mappings - the full mapping is built from GeoJSON data
 */
export const DEPARTEMENT_TO_REGION: Record<string, string> = {
  // Île-de-France
  '75': '11', // Paris
  '77': '11', // Seine-et-Marne
  '78': '11', // Yvelines
  '91': '11', // Essonne
  '92': '11', // Hauts-de-Seine
  '93': '11', // Seine-Saint-Denis
  '94': '11', // Val-de-Marne
  '95': '11', // Val-d'Oise
  // Overseas départements
  '971': '01', // Guadeloupe
  '972': '02', // Martinique
  '973': '03', // Guyane
  '974': '04', // La Réunion
  '976': '06', // Mayotte
};

/**
 * Expected number of French départements
 * - 96 metropolitan départements
 * - 5 overseas départements (DOM)
 */
export const EXPECTED_DEPARTEMENT_COUNT = {
  metropolitan: 96,
  overseas: 5,
  total: 101,
};
