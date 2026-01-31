import { AdministrativeArea, AdminLevel } from './administrative-area.entity';
import { Population } from './population.entity';

describe('Population Entity', () => {
  describe('entity structure', () => {
    it('should create a population instance with all properties', () => {
      const area = new AdministrativeArea();
      area.id = '123e4567-e89b-12d3-a456-426614174000';
      area.code = '75';
      area.name = 'Paris';
      area.level = AdminLevel.DEPARTMENT;
      area.countryCode = 'FR';

      const population = new Population();
      population.id = '123e4567-e89b-12d3-a456-426614174001';
      population.areaId = area.id;
      population.area = area;
      population.year = 2023;
      population.populationCount = 2133111;
      population.source = 'INSEE';
      population.notes = 'Legal population as of January 1, 2023';
      population.createdAt = new Date('2024-01-01');
      population.updatedAt = new Date('2024-01-01');

      expect(population.id).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(population.areaId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(population.area).toBe(area);
      expect(population.year).toBe(2023);
      expect(population.populationCount).toBe(2133111);
      expect(population.source).toBe('INSEE');
      expect(population.notes).toBe('Legal population as of January 1, 2023');
    });

    it('should allow null values for optional fields', () => {
      const population = new Population();
      population.id = '123e4567-e89b-12d3-a456-426614174001';
      population.areaId = '123e4567-e89b-12d3-a456-426614174000';
      population.year = 2023;
      population.populationCount = 2133111;
      population.source = null;
      population.notes = null;

      expect(population.source).toBeNull();
      expect(population.notes).toBeNull();
    });
  });

  describe('data validation scenarios', () => {
    it('should handle large population values (national level)', () => {
      const population = new Population();
      population.populationCount = 67750000; // France population ~67.75M

      expect(population.populationCount).toBe(67750000);
    });

    it('should handle small population values (small départements)', () => {
      const population = new Population();
      population.populationCount = 76600; // Lozère, smallest département

      expect(population.populationCount).toBe(76600);
    });

    it('should handle overseas département population', () => {
      const population = new Population();
      population.populationCount = 394000; // Guadeloupe population

      expect(population.populationCount).toBe(394000);
    });

    it('should handle year range for French crime data (2016-2025)', () => {
      const years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

      years.forEach((year) => {
        const population = new Population();
        population.year = year;
        expect(population.year).toBe(year);
        expect(population.year).toBeGreaterThanOrEqual(2016);
        expect(population.year).toBeLessThanOrEqual(2025);
      });
    });
  });

  describe('relationship with AdministrativeArea', () => {
    it('should reference département correctly', () => {
      const paris = new AdministrativeArea();
      paris.id = 'uuid-paris';
      paris.code = '75';
      paris.name = 'Paris';
      paris.level = AdminLevel.DEPARTMENT;

      const population = new Population();
      population.area = paris;
      population.areaId = paris.id;

      expect(population.area.level).toBe(AdminLevel.DEPARTMENT);
      expect(population.area.code).toBe('75');
    });

    it('should reference region correctly', () => {
      const idf = new AdministrativeArea();
      idf.id = 'uuid-idf';
      idf.code = 'IDF';
      idf.name = 'Île-de-France';
      idf.level = AdminLevel.REGION;

      const population = new Population();
      population.area = idf;
      population.areaId = idf.id;

      expect(population.area.level).toBe(AdminLevel.REGION);
      expect(population.area.code).toBe('IDF');
    });

    it('should reference country correctly', () => {
      const france = new AdministrativeArea();
      france.id = 'uuid-france';
      france.code = 'FR';
      france.name = 'France';
      france.level = AdminLevel.COUNTRY;

      const population = new Population();
      population.area = france;
      population.areaId = france.id;

      expect(population.area.level).toBe(AdminLevel.COUNTRY);
      expect(population.area.code).toBe('FR');
    });
  });

  describe('source tracking', () => {
    it('should track INSEE as primary source', () => {
      const population = new Population();
      population.source = 'INSEE';

      expect(population.source).toBe('INSEE');
    });

    it('should support alternative sources', () => {
      const sources = ['Eurostat', 'Census 2021', 'INSEE RP 2020'];

      sources.forEach((source) => {
        const population = new Population();
        population.source = source;
        expect(population.source).toBe(source);
      });
    });

    it('should allow notes for data quality documentation', () => {
      const population = new Population();
      population.notes = 'Provisional estimate pending census results';

      expect(population.notes).toContain('Provisional');
    });
  });
});
