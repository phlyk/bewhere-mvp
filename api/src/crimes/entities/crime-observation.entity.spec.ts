import { AdministrativeArea, AdminLevel } from '../../areas/entities/administrative-area.entity';
import { DataSource, UpdateFrequency } from '../../etl/entities/data-source.entity';
import { CrimeCategory, CrimeCategoryGroup, CrimeSeverity } from './crime-category.entity';
import { CrimeObservation, TimeGranularity } from './crime-observation.entity';

describe('CrimeObservation Entity', () => {
  // Helper function to create test entities
  const createTestArea = (code: string = '75', name: string = 'Paris'): AdministrativeArea => {
    const area = new AdministrativeArea();
    area.id = `uuid-area-${code}`;
    area.code = code;
    area.name = name;
    area.level = AdminLevel.DEPARTMENT;
    area.countryCode = 'FR';
    return area;
  };

  const createTestCategory = (code: string = 'BURGLARY'): CrimeCategory => {
    const category = new CrimeCategory();
    category.id = `uuid-category-${code.toLowerCase()}`;
    category.code = code;
    category.name = 'Burglary';
    category.nameFr = 'Cambriolage';
    category.severity = CrimeSeverity.MEDIUM;
    category.categoryGroup = CrimeCategoryGroup.PROPERTY_CRIMES;
    category.sortOrder = 10;
    category.isActive = true;
    return category;
  };

  const createTestDataSource = (code: string = 'ETAT4001_MONTHLY'): DataSource => {
    const source = new DataSource();
    source.id = `uuid-source-${code.toLowerCase()}`;
    source.code = code;
    source.name = 'État 4001 Monthly Snapshots';
    source.url = 'https://data.gouv.fr/fr/datasets/etat-4001';
    source.updateFrequency = UpdateFrequency.MONTHLY;
    source.countryCode = 'FR';
    source.isActive = true;
    return source;
  };

  describe('entity structure', () => {
    it('should create a crime observation with all properties', () => {
      const area = createTestArea();
      const category = createTestCategory();
      const dataSource = createTestDataSource();

      const observation = new CrimeObservation();
      observation.id = 'uuid-observation-1';
      observation.areaId = area.id;
      observation.area = area;
      observation.categoryId = category.id;
      observation.category = category;
      observation.dataSourceId = dataSource.id;
      observation.dataSource = dataSource;
      observation.year = 2023;
      observation.month = null;
      observation.granularity = TimeGranularity.YEARLY;
      observation.count = 15234;
      observation.ratePer100k = 714.2;
      observation.populationUsed = 2133111;
      observation.isValidated = true;
      observation.notes = 'Final validated data';
      observation.createdAt = new Date('2024-01-01');
      observation.updatedAt = new Date('2024-01-01');

      expect(observation.id).toBe('uuid-observation-1');
      expect(observation.areaId).toBe(area.id);
      expect(observation.area).toBe(area);
      expect(observation.categoryId).toBe(category.id);
      expect(observation.category).toBe(category);
      expect(observation.dataSourceId).toBe(dataSource.id);
      expect(observation.dataSource).toBe(dataSource);
      expect(observation.year).toBe(2023);
      expect(observation.month).toBeNull();
      expect(observation.granularity).toBe(TimeGranularity.YEARLY);
      expect(observation.count).toBe(15234);
      expect(observation.ratePer100k).toBe(714.2);
      expect(observation.populationUsed).toBe(2133111);
      expect(observation.isValidated).toBe(true);
      expect(observation.notes).toBe('Final validated data');
    });

    it('should create a monthly observation', () => {
      const observation = new CrimeObservation();
      observation.year = 2023;
      observation.month = 6;
      observation.granularity = TimeGranularity.MONTHLY;
      observation.count = 1250;

      expect(observation.year).toBe(2023);
      expect(observation.month).toBe(6);
      expect(observation.granularity).toBe(TimeGranularity.MONTHLY);
    });

    it('should allow null values for optional fields', () => {
      const observation = new CrimeObservation();
      observation.id = 'uuid-observation-1';
      observation.areaId = 'uuid-area';
      observation.categoryId = 'uuid-category';
      observation.dataSourceId = 'uuid-source';
      observation.year = 2023;
      observation.count = 100;
      observation.month = null;
      observation.ratePer100k = null;
      observation.populationUsed = null;
      observation.notes = null;

      expect(observation.month).toBeNull();
      expect(observation.ratePer100k).toBeNull();
      expect(observation.populationUsed).toBeNull();
      expect(observation.notes).toBeNull();
    });
  });

  describe('TimeGranularity enum', () => {
    it('should have monthly granularity', () => {
      expect(TimeGranularity.MONTHLY).toBe('monthly');
    });

    it('should have quarterly granularity', () => {
      expect(TimeGranularity.QUARTERLY).toBe('quarterly');
    });

    it('should have yearly granularity', () => {
      expect(TimeGranularity.YEARLY).toBe('yearly');
    });
  });

  describe('rate calculations', () => {
    it('should calculate rate per 100k correctly', () => {
      const observation = new CrimeObservation();
      observation.count = 15234;
      observation.populationUsed = 2133111;
      // Rate = (15234 / 2133111) * 100000 = 714.14...
      observation.ratePer100k = (observation.count / observation.populationUsed) * 100000;

      expect(observation.ratePer100k).toBeCloseTo(714.14, 1);
    });

    it('should handle high crime rates in small départements', () => {
      const observation = new CrimeObservation();
      observation.count = 5000;
      observation.populationUsed = 76600; // Lozère, smallest département
      observation.ratePer100k = (observation.count / observation.populationUsed) * 100000;

      expect(observation.ratePer100k).toBeCloseTo(6527.4, 0);
    });

    it('should handle low crime rates', () => {
      const observation = new CrimeObservation();
      observation.count = 5;
      observation.populationUsed = 2000000;
      observation.ratePer100k = (observation.count / observation.populationUsed) * 100000;

      expect(observation.ratePer100k).toBe(0.25);
    });

    it('should handle national-level population', () => {
      const observation = new CrimeObservation();
      observation.count = 850000;
      observation.populationUsed = 67750000; // France population
      observation.ratePer100k = (observation.count / observation.populationUsed) * 100000;

      expect(observation.ratePer100k).toBeCloseTo(1254.61, 1);
    });
  });

  describe('temporal data scenarios', () => {
    it('should handle year range for French crime data (2016-2025)', () => {
      const years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

      years.forEach((year) => {
        const observation = new CrimeObservation();
        observation.year = year;
        expect(observation.year).toBe(year);
        expect(observation.year).toBeGreaterThanOrEqual(2016);
        expect(observation.year).toBeLessThanOrEqual(2025);
      });
    });

    it('should handle all months (1-12)', () => {
      for (let month = 1; month <= 12; month++) {
        const observation = new CrimeObservation();
        observation.month = month;
        expect(observation.month).toBe(month);
        expect(observation.month).toBeGreaterThanOrEqual(1);
        expect(observation.month).toBeLessThanOrEqual(12);
      }
    });

    it('should create time series for a single category across years', () => {
      const category = createTestCategory('HOMICIDE');
      const area = createTestArea('75', 'Paris');
      const source = createTestDataSource();
      const observations: CrimeObservation[] = [];

      for (let year = 2016; year <= 2023; year++) {
        const obs = new CrimeObservation();
        obs.areaId = area.id;
        obs.categoryId = category.id;
        obs.dataSourceId = source.id;
        obs.year = year;
        obs.granularity = TimeGranularity.YEARLY;
        obs.count = 50 + Math.floor(Math.random() * 20);
        observations.push(obs);
      }

      expect(observations).toHaveLength(8);
      observations.forEach((obs) => {
        expect(obs.areaId).toBe(area.id);
        expect(obs.categoryId).toBe(category.id);
      });
    });
  });

  describe('relationship with AdministrativeArea', () => {
    it('should reference département correctly', () => {
      const paris = createTestArea('75', 'Paris');
      const observation = new CrimeObservation();
      observation.area = paris;
      observation.areaId = paris.id;

      expect(observation.area.level).toBe(AdminLevel.DEPARTMENT);
      expect(observation.area.code).toBe('75');
    });

    it('should reference overseas département', () => {
      const guadeloupe = createTestArea('971', 'Guadeloupe');
      guadeloupe.level = AdminLevel.DEPARTMENT;

      const observation = new CrimeObservation();
      observation.area = guadeloupe;
      observation.areaId = guadeloupe.id;

      expect(observation.area.code).toBe('971');
    });

    it('should reference country-level aggregate', () => {
      const france = new AdministrativeArea();
      france.id = 'uuid-france';
      france.code = 'FR';
      france.name = 'France';
      france.level = AdminLevel.COUNTRY;

      const observation = new CrimeObservation();
      observation.area = france;
      observation.areaId = france.id;

      expect(observation.area.level).toBe(AdminLevel.COUNTRY);
    });
  });

  describe('relationship with CrimeCategory', () => {
    it('should reference violent crime category', () => {
      const category = new CrimeCategory();
      category.id = 'uuid-homicide';
      category.code = 'HOMICIDE';
      category.severity = CrimeSeverity.CRITICAL;
      category.categoryGroup = CrimeCategoryGroup.VIOLENT_CRIMES;

      const observation = new CrimeObservation();
      observation.category = category;
      observation.categoryId = category.id;

      expect(observation.category.severity).toBe(CrimeSeverity.CRITICAL);
      expect(observation.category.categoryGroup).toBe(CrimeCategoryGroup.VIOLENT_CRIMES);
    });

    it('should reference property crime category', () => {
      const category = createTestCategory('BURGLARY');

      const observation = new CrimeObservation();
      observation.category = category;
      observation.categoryId = category.id;

      expect(observation.category.categoryGroup).toBe(CrimeCategoryGroup.PROPERTY_CRIMES);
    });
  });

  describe('relationship with DataSource', () => {
    it('should reference État 4001 data source', () => {
      const source = createTestDataSource('ETAT4001_MONTHLY');

      const observation = new CrimeObservation();
      observation.dataSource = source;
      observation.dataSourceId = source.id;

      expect(observation.dataSource.code).toBe('ETAT4001_MONTHLY');
      expect(observation.dataSource.countryCode).toBe('FR');
    });

    it('should reference time series data source', () => {
      const source = new DataSource();
      source.id = 'uuid-timeseries';
      source.code = 'TIMESERIES';
      source.name = 'Time Series Crime Data';
      source.url = 'https://data.gouv.fr/fr/datasets/series-chronologiques';
      source.updateFrequency = UpdateFrequency.MONTHLY;

      const observation = new CrimeObservation();
      observation.dataSource = source;
      observation.dataSourceId = source.id;

      expect(observation.dataSource.code).toBe('TIMESERIES');
    });
  });

  describe('data quality tracking', () => {
    it('should track validation status', () => {
      const observation = new CrimeObservation();
      observation.isValidated = false;

      expect(observation.isValidated).toBe(false);

      observation.isValidated = true;
      expect(observation.isValidated).toBe(true);
    });

    it('should store data quality notes', () => {
      const notes = [
        'Provisional data, subject to revision',
        'Estimated based on partial year data',
        'Revised figure after data correction',
        'Includes reclassified offenses from previous period',
      ];

      notes.forEach((note) => {
        const observation = new CrimeObservation();
        observation.notes = note;
        expect(observation.notes).toBe(note);
      });
    });

    it('should track population used for audit trail', () => {
      const observation = new CrimeObservation();
      observation.populationUsed = 2133111;
      observation.ratePer100k = 714.2;

      // Population should be stored for potential recalculation
      expect(observation.populationUsed).toBe(2133111);
    });
  });

  describe('realistic data scenarios', () => {
    it('should handle Paris burglary statistics (high volume)', () => {
      const observation = new CrimeObservation();
      observation.areaId = 'uuid-paris';
      observation.categoryId = 'uuid-burglary';
      observation.year = 2023;
      observation.count = 45678;
      observation.populationUsed = 2133111;
      observation.ratePer100k = (45678 / 2133111) * 100000;

      expect(observation.count).toBeGreaterThan(0);
      expect(observation.ratePer100k).toBeCloseTo(2141.5, 0);
    });

    it('should handle Lozère homicide statistics (low volume)', () => {
      const observation = new CrimeObservation();
      observation.areaId = 'uuid-lozere';
      observation.categoryId = 'uuid-homicide';
      observation.year = 2023;
      observation.count = 1;
      observation.populationUsed = 76600;
      observation.ratePer100k = (1 / 76600) * 100000;

      expect(observation.count).toBe(1);
      expect(observation.ratePer100k).toBeCloseTo(1.31, 1);
    });

    it('should handle monthly time series data', () => {
      const monthlyObservations: CrimeObservation[] = [];

      for (let month = 1; month <= 12; month++) {
        const obs = new CrimeObservation();
        obs.year = 2023;
        obs.month = month;
        obs.granularity = TimeGranularity.MONTHLY;
        obs.count = 1000 + Math.floor(Math.random() * 500);
        monthlyObservations.push(obs);
      }

      expect(monthlyObservations).toHaveLength(12);
      monthlyObservations.forEach((obs) => {
        expect(obs.granularity).toBe(TimeGranularity.MONTHLY);
        expect(obs.month).toBeGreaterThanOrEqual(1);
        expect(obs.month).toBeLessThanOrEqual(12);
      });
    });

    it('should handle zero crime counts', () => {
      const observation = new CrimeObservation();
      observation.count = 0;
      observation.populationUsed = 100000;
      observation.ratePer100k = 0;

      expect(observation.count).toBe(0);
      expect(observation.ratePer100k).toBe(0);
    });
  });
});
