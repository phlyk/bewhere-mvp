import { CrimeCategory, CrimeCategoryGroup, CrimeSeverity } from '../../crimes/entities';
import { CategoryMapping } from './category-mapping.entity';
import { DataSource, UpdateFrequency } from './data-source.entity';

describe('CategoryMapping Entity', () => {
  describe('CategoryMapping class', () => {
    let categoryMapping: CategoryMapping;

    beforeEach(() => {
      categoryMapping = new CategoryMapping();
    });

    it('should create an instance', () => {
      expect(categoryMapping).toBeDefined();
      expect(categoryMapping).toBeInstanceOf(CategoryMapping);
    });

    describe('dataSourceId property', () => {
      it('should allow setting dataSourceId', () => {
        const uuid = '123e4567-e89b-12d3-a456-426614174000';
        categoryMapping.dataSourceId = uuid;
        expect(categoryMapping.dataSourceId).toBe(uuid);
      });
    });

    describe('dataSource relationship', () => {
      it('should allow setting dataSource reference', () => {
        const dataSource = new DataSource();
        dataSource.id = '123e4567-e89b-12d3-a456-426614174000';
        dataSource.code = 'ETAT4001';
        dataSource.name = 'État 4001';
        dataSource.updateFrequency = UpdateFrequency.MONTHLY;

        categoryMapping.dataSource = dataSource;
        expect(categoryMapping.dataSource).toBe(dataSource);
        expect(categoryMapping.dataSource.code).toBe('ETAT4001');
      });
    });

    describe('sourceCategory property', () => {
      it('should allow setting État 4001 index codes', () => {
        const indexCodes = ['01', '02', '55', '107'];
        indexCodes.forEach((code) => {
          categoryMapping.sourceCategory = code;
          expect(categoryMapping.sourceCategory).toBe(code);
        });
      });

      it('should allow setting Time Series indicator names', () => {
        categoryMapping.sourceCategory = 'Cambriolages de logement';
        expect(categoryMapping.sourceCategory).toBe('Cambriolages de logement');
      });

      it('should allow setting Eurostat ICCS codes', () => {
        categoryMapping.sourceCategory = 'ICCS0101';
        expect(categoryMapping.sourceCategory).toBe('ICCS0101');
      });

      it('should handle various source category formats', () => {
        const validCategories = [
          '01', // État 4001 index
          'Cambriolages de logement', // Time Series FR
          'ICCS0101', // Eurostat ICCS
          'burglary_dwelling', // English key
          'C01.01', // Hierarchical code
        ];
        validCategories.forEach((category) => {
          categoryMapping.sourceCategory = category;
          expect(categoryMapping.sourceCategory).toBe(category);
        });
      });
    });

    describe('sourceCategoryName property', () => {
      it('should allow setting French source category name', () => {
        categoryMapping.sourceCategoryName =
          'Règlements de compte entre malfaiteurs';
        expect(categoryMapping.sourceCategoryName).toBe(
          'Règlements de compte entre malfaiteurs',
        );
      });

      it('should allow null source category name', () => {
        categoryMapping.sourceCategoryName = null;
        expect(categoryMapping.sourceCategoryName).toBeNull();
      });

      it('should handle long category names', () => {
        const longName =
          'Vols à main armée contre des établissements industriels ou commerciaux avec armes à feu';
        categoryMapping.sourceCategoryName = longName;
        expect(categoryMapping.sourceCategoryName).toBe(longName);
      });

      it('should handle special characters in names', () => {
        categoryMapping.sourceCategoryName =
          "Atteintes à l'environnement & délits écologiques";
        expect(categoryMapping.sourceCategoryName).toBe(
          "Atteintes à l'environnement & délits écologiques",
        );
      });
    });

    describe('canonicalCategoryId property', () => {
      it('should allow setting canonicalCategoryId', () => {
        const uuid = '123e4567-e89b-12d3-a456-426614174001';
        categoryMapping.canonicalCategoryId = uuid;
        expect(categoryMapping.canonicalCategoryId).toBe(uuid);
      });
    });

    describe('canonicalCategory relationship', () => {
      it('should allow setting canonicalCategory reference', () => {
        const crimeCategory = new CrimeCategory();
        crimeCategory.id = '123e4567-e89b-12d3-a456-426614174001';
        crimeCategory.code = 'HOMICIDE';
        crimeCategory.name = 'Homicide';
        crimeCategory.severity = CrimeSeverity.CRITICAL;
        crimeCategory.categoryGroup = CrimeCategoryGroup.VIOLENT_CRIMES;

        categoryMapping.canonicalCategory = crimeCategory;
        expect(categoryMapping.canonicalCategory).toBe(crimeCategory);
        expect(categoryMapping.canonicalCategory.code).toBe('HOMICIDE');
      });
    });

    describe('notes property', () => {
      it('should allow setting notes', () => {
        const notes = 'Criminal settlements - mapped to HOMICIDE per ICCS guidelines';
        categoryMapping.notes = notes;
        expect(categoryMapping.notes).toBe(notes);
      });

      it('should allow null notes', () => {
        categoryMapping.notes = null;
        expect(categoryMapping.notes).toBeNull();
      });

      it('should handle long notes', () => {
        const longNotes =
          'This category aggregates multiple État 4001 indices (01, 02, 03, 51) ' +
          'into the canonical HOMICIDE category. Includes: intentional killings, ' +
          'criminal settlements, homicides during robbery, and child homicides. ' +
          'Mapping rationale aligned with UNODC ICCS Category 0101.';
        categoryMapping.notes = longNotes;
        expect(categoryMapping.notes).toBe(longNotes);
      });
    });

    describe('confidence property', () => {
      it('should allow setting confidence level', () => {
        categoryMapping.confidence = 0.95;
        expect(categoryMapping.confidence).toBe(0.95);
      });

      it('should handle exact match confidence (1.0)', () => {
        categoryMapping.confidence = 1.0;
        expect(categoryMapping.confidence).toBe(1.0);
      });

      it('should handle strong match confidence (0.8-0.99)', () => {
        categoryMapping.confidence = 0.85;
        expect(categoryMapping.confidence).toBe(0.85);
      });

      it('should handle reasonable match confidence (0.5-0.79)', () => {
        categoryMapping.confidence = 0.65;
        expect(categoryMapping.confidence).toBe(0.65);
      });

      it('should handle low confidence values', () => {
        categoryMapping.confidence = 0.4;
        expect(categoryMapping.confidence).toBe(0.4);
      });

      it('should handle zero confidence', () => {
        categoryMapping.confidence = 0;
        expect(categoryMapping.confidence).toBe(0);
      });
    });

    describe('isActive property', () => {
      it('should allow setting isActive to true', () => {
        categoryMapping.isActive = true;
        expect(categoryMapping.isActive).toBe(true);
      });

      it('should allow setting isActive to false', () => {
        categoryMapping.isActive = false;
        expect(categoryMapping.isActive).toBe(false);
      });
    });

    describe('timestamp properties', () => {
      it('should allow setting createdAt', () => {
        const date = new Date('2024-01-15T10:30:00Z');
        categoryMapping.createdAt = date;
        expect(categoryMapping.createdAt).toBe(date);
      });

      it('should allow setting updatedAt', () => {
        const date = new Date('2024-01-20T15:45:00Z');
        categoryMapping.updatedAt = date;
        expect(categoryMapping.updatedAt).toBe(date);
      });
    });
  });

  describe('CategoryMapping use cases', () => {
    describe('État 4001 mappings', () => {
      it('should model État 4001 index 01 → HOMICIDE mapping', () => {
        const dataSource = new DataSource();
        dataSource.id = 'ds-etat4001';
        dataSource.code = 'ETAT4001';

        const crimeCategory = new CrimeCategory();
        crimeCategory.id = 'cc-homicide';
        crimeCategory.code = 'HOMICIDE';

        const mapping = new CategoryMapping();
        mapping.id = 'mapping-01';
        mapping.dataSource = dataSource;
        mapping.dataSourceId = dataSource.id;
        mapping.sourceCategory = '01';
        mapping.sourceCategoryName = 'Règlements de compte entre malfaiteurs';
        mapping.canonicalCategory = crimeCategory;
        mapping.canonicalCategoryId = crimeCategory.id;
        mapping.notes = 'Criminal settlements';
        mapping.confidence = 1.0;
        mapping.isActive = true;

        expect(mapping.sourceCategory).toBe('01');
        expect(mapping.canonicalCategory.code).toBe('HOMICIDE');
        expect(mapping.confidence).toBe(1.0);
      });

      it('should model État 4001 index 55 → DRUG_TRAFFICKING mapping', () => {
        const dataSource = new DataSource();
        dataSource.code = 'ETAT4001';

        const crimeCategory = new CrimeCategory();
        crimeCategory.code = 'DRUG_TRAFFICKING';

        const mapping = new CategoryMapping();
        mapping.dataSource = dataSource;
        mapping.sourceCategory = '55';
        mapping.sourceCategoryName = 'Trafic et revente sans usage de stupéfiants';
        mapping.canonicalCategory = crimeCategory;
        mapping.confidence = 1.0;

        expect(mapping.sourceCategory).toBe('55');
        expect(mapping.canonicalCategory.code).toBe('DRUG_TRAFFICKING');
      });

      it('should model État 4001 index 27 → BURGLARY_RESIDENTIAL mapping', () => {
        const dataSource = new DataSource();
        dataSource.code = 'ETAT4001';

        const crimeCategory = new CrimeCategory();
        crimeCategory.code = 'BURGLARY_RESIDENTIAL';

        const mapping = new CategoryMapping();
        mapping.dataSource = dataSource;
        mapping.sourceCategory = '27';
        mapping.sourceCategoryName = 'Cambriolages de locaux d\'habitations principales';
        mapping.canonicalCategory = crimeCategory;
        mapping.confidence = 1.0;

        expect(mapping.sourceCategory).toBe('27');
        expect(mapping.canonicalCategory.code).toBe('BURGLARY_RESIDENTIAL');
      });
    });

    describe('Time Series mappings', () => {
      it('should model Time Series indicator → canonical category mapping', () => {
        const dataSource = new DataSource();
        dataSource.code = 'TIMESERIES';

        const crimeCategory = new CrimeCategory();
        crimeCategory.code = 'BURGLARY_RESIDENTIAL';

        const mapping = new CategoryMapping();
        mapping.dataSource = dataSource;
        mapping.sourceCategory = 'Cambriolages de logement';
        mapping.sourceCategoryName = 'Cambriolages de logement';
        mapping.canonicalCategory = crimeCategory;
        mapping.confidence = 0.95;
        mapping.notes = 'Time series residential burglary indicator';

        expect(mapping.sourceCategory).toBe('Cambriolages de logement');
        expect(mapping.canonicalCategory.code).toBe('BURGLARY_RESIDENTIAL');
      });
    });

    describe('Mapping confidence levels', () => {
      it('should distinguish exact matches from partial matches', () => {
        const exactMatch = new CategoryMapping();
        exactMatch.sourceCategory = '01';
        exactMatch.confidence = 1.0;

        const strongMatch = new CategoryMapping();
        strongMatch.sourceCategory = '11';
        strongMatch.confidence = 0.85;
        strongMatch.notes = 'Threats/blackmail - mapped to ASSAULT as includes violent intimidation';

        const reasonableMatch = new CategoryMapping();
        reasonableMatch.sourceCategory = '44';
        reasonableMatch.confidence = 0.7;
        reasonableMatch.notes = 'Receiving stolen goods - categorized under THEFT_OTHER';

        expect(exactMatch.confidence).toBeGreaterThan(strongMatch.confidence);
        expect(strongMatch.confidence).toBeGreaterThan(reasonableMatch.confidence);
      });
    });

    describe('Inactive mapping handling', () => {
      it('should allow deactivating deprecated mappings', () => {
        const mapping = new CategoryMapping();
        mapping.sourceCategory = '99';
        mapping.sourceCategoryName = 'Deprecated category';
        mapping.isActive = false;
        mapping.notes = 'Deprecated in État 4001 2020 revision';

        expect(mapping.isActive).toBe(false);
        expect(mapping.notes).toContain('Deprecated');
      });
    });
  });

  describe('CategoryMapping composite keys', () => {
    it('should support lookup by dataSourceId + sourceCategory', () => {
      const mapping = new CategoryMapping();
      mapping.dataSourceId = 'ds-etat4001-uuid';
      mapping.sourceCategory = '55';

      // This models the composite unique constraint lookup
      const lookupKey = `${mapping.dataSourceId}:${mapping.sourceCategory}`;
      expect(lookupKey).toBe('ds-etat4001-uuid:55');
    });

    it('should allow same sourceCategory in different data sources', () => {
      const etat4001Mapping = new CategoryMapping();
      etat4001Mapping.dataSourceId = 'ds-etat4001';
      etat4001Mapping.sourceCategory = 'burglary';

      const eurostatMapping = new CategoryMapping();
      eurostatMapping.dataSourceId = 'ds-eurostat';
      eurostatMapping.sourceCategory = 'burglary';

      // Same source category, different data sources = allowed
      expect(etat4001Mapping.sourceCategory).toBe(eurostatMapping.sourceCategory);
      expect(etat4001Mapping.dataSourceId).not.toBe(eurostatMapping.dataSourceId);
    });
  });
});
