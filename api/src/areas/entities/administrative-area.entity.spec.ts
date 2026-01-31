import {
  AdministrativeArea,
  AdminLevel,
} from './administrative-area.entity';
import { MultiPolygon } from 'geojson';

describe('AdministrativeArea Entity', () => {
  describe('AdminLevel enum', () => {
    it('should have COUNTRY level', () => {
      expect(AdminLevel.COUNTRY).toBe('country');
    });

    it('should have REGION level', () => {
      expect(AdminLevel.REGION).toBe('region');
    });

    it('should have DEPARTMENT level', () => {
      expect(AdminLevel.DEPARTMENT).toBe('department');
    });
  });

  describe('entity instantiation', () => {
    let area: AdministrativeArea;

    beforeEach(() => {
      area = new AdministrativeArea();
    });

    it('should create an instance', () => {
      expect(area).toBeDefined();
      expect(area).toBeInstanceOf(AdministrativeArea);
    });

    it('should allow setting basic properties', () => {
      area.code = '75';
      area.name = 'Paris';
      area.nameEn = 'Paris';
      area.level = AdminLevel.DEPARTMENT;
      area.parentCode = 'IDF';
      area.countryCode = 'FR';

      expect(area.code).toBe('75');
      expect(area.name).toBe('Paris');
      expect(area.nameEn).toBe('Paris');
      expect(area.level).toBe(AdminLevel.DEPARTMENT);
      expect(area.parentCode).toBe('IDF');
      expect(area.countryCode).toBe('FR');
    });

    it('should allow null for optional fields', () => {
      area.code = 'FR';
      area.name = 'France';
      area.level = AdminLevel.COUNTRY;
      area.countryCode = 'FR';
      area.parentCode = null;
      area.nameEn = null;
      area.geometry = null;
      area.areaKm2 = null;

      expect(area.parentCode).toBeNull();
      expect(area.nameEn).toBeNull();
      expect(area.geometry).toBeNull();
      expect(area.areaKm2).toBeNull();
    });

    it('should accept valid MultiPolygon geometry', () => {
      const geometry: MultiPolygon = {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [2.2241, 48.8155],
              [2.4699, 48.8155],
              [2.4699, 48.9021],
              [2.2241, 48.9021],
              [2.2241, 48.8155],
            ],
          ],
        ],
      };

      area.geometry = geometry;

      expect(area.geometry).toBeDefined();
      expect(area.geometry?.type).toBe('MultiPolygon');
      expect(area.geometry?.coordinates).toHaveLength(1);
    });

    it('should accept numeric areaKm2', () => {
      area.areaKm2 = 105.4;
      expect(area.areaKm2).toBe(105.4);
    });
  });

  describe('French département examples', () => {
    it('should represent Paris correctly', () => {
      const paris = new AdministrativeArea();
      paris.code = '75';
      paris.name = 'Paris';
      paris.nameEn = 'Paris';
      paris.level = AdminLevel.DEPARTMENT;
      paris.parentCode = 'IDF';
      paris.countryCode = 'FR';
      paris.areaKm2 = 105.4;

      expect(paris.code).toBe('75');
      expect(paris.level).toBe(AdminLevel.DEPARTMENT);
    });

    it('should represent an overseas département correctly', () => {
      const guadeloupe = new AdministrativeArea();
      guadeloupe.code = '971';
      guadeloupe.name = 'Guadeloupe';
      guadeloupe.nameEn = 'Guadeloupe';
      guadeloupe.level = AdminLevel.DEPARTMENT;
      guadeloupe.parentCode = null; // Overseas departments don't have region parents in same hierarchy
      guadeloupe.countryCode = 'FR';
      guadeloupe.areaKm2 = 1628;

      expect(guadeloupe.code).toBe('971');
      expect(guadeloupe.areaKm2).toBe(1628);
    });

    it('should represent a region correctly', () => {
      const idf = new AdministrativeArea();
      idf.code = 'IDF';
      idf.name = 'Île-de-France';
      idf.nameEn = 'Île-de-France';
      idf.level = AdminLevel.REGION;
      idf.parentCode = 'FR';
      idf.countryCode = 'FR';
      idf.areaKm2 = 12012;

      expect(idf.code).toBe('IDF');
      expect(idf.level).toBe(AdminLevel.REGION);
    });

    it('should represent France as a country correctly', () => {
      const france = new AdministrativeArea();
      france.code = 'FR';
      france.name = 'France';
      france.nameEn = 'France';
      france.level = AdminLevel.COUNTRY;
      france.parentCode = null;
      france.countryCode = 'FR';
      france.areaKm2 = 643801;

      expect(france.code).toBe('FR');
      expect(france.level).toBe(AdminLevel.COUNTRY);
      expect(france.parentCode).toBeNull();
    });
  });

  describe('hierarchical relationships', () => {
    it('should support département → region → country hierarchy', () => {
      const france = new AdministrativeArea();
      france.code = 'FR';
      france.level = AdminLevel.COUNTRY;
      france.parentCode = null;

      const idf = new AdministrativeArea();
      idf.code = 'IDF';
      idf.level = AdminLevel.REGION;
      idf.parentCode = 'FR';

      const paris = new AdministrativeArea();
      paris.code = '75';
      paris.level = AdminLevel.DEPARTMENT;
      paris.parentCode = 'IDF';

      // Verify hierarchy
      expect(paris.parentCode).toBe(idf.code);
      expect(idf.parentCode).toBe(france.code);
      expect(france.parentCode).toBeNull();
    });
  });
});
