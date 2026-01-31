import {
    CrimeCategory,
    CrimeCategoryGroup,
    CrimeSeverity,
} from './crime-category.entity';

describe('CrimeCategory Entity', () => {
  describe('CrimeSeverity enum', () => {
    it('should have correct values', () => {
      expect(CrimeSeverity.CRITICAL).toBe('critical');
      expect(CrimeSeverity.HIGH).toBe('high');
      expect(CrimeSeverity.MEDIUM).toBe('medium');
      expect(CrimeSeverity.LOW).toBe('low');
    });

    it('should have exactly 4 severity levels', () => {
      const severityValues = Object.values(CrimeSeverity);
      expect(severityValues).toHaveLength(4);
    });
  });

  describe('CrimeCategoryGroup enum', () => {
    it('should have correct values', () => {
      expect(CrimeCategoryGroup.VIOLENT_CRIMES).toBe('violent_crimes');
      expect(CrimeCategoryGroup.PROPERTY_CRIMES).toBe('property_crimes');
      expect(CrimeCategoryGroup.DRUG_OFFENSES).toBe('drug_offenses');
      expect(CrimeCategoryGroup.OTHER_OFFENSES).toBe('other_offenses');
    });

    it('should have exactly 4 category groups', () => {
      const groupValues = Object.values(CrimeCategoryGroup);
      expect(groupValues).toHaveLength(4);
    });
  });

  describe('CrimeCategory class', () => {
    let crimeCategory: CrimeCategory;

    beforeEach(() => {
      crimeCategory = new CrimeCategory();
    });

    it('should create an instance', () => {
      expect(crimeCategory).toBeDefined();
      expect(crimeCategory).toBeInstanceOf(CrimeCategory);
    });

    it('should allow setting code property', () => {
      crimeCategory.code = 'HOMICIDE';
      expect(crimeCategory.code).toBe('HOMICIDE');
    });

    it('should allow setting name property', () => {
      crimeCategory.name = 'Homicide';
      expect(crimeCategory.name).toBe('Homicide');
    });

    it('should allow setting nameFr property', () => {
      crimeCategory.nameFr = 'Homicide';
      expect(crimeCategory.nameFr).toBe('Homicide');
    });

    it('should allow setting description property', () => {
      crimeCategory.description =
        'Intentional killing including criminal settlements';
      expect(crimeCategory.description).toBe(
        'Intentional killing including criminal settlements',
      );
    });

    it('should allow null description', () => {
      crimeCategory.description = null;
      expect(crimeCategory.description).toBeNull();
    });

    it('should allow setting severity property', () => {
      crimeCategory.severity = CrimeSeverity.CRITICAL;
      expect(crimeCategory.severity).toBe(CrimeSeverity.CRITICAL);
    });

    it('should allow setting categoryGroup property', () => {
      crimeCategory.categoryGroup = CrimeCategoryGroup.VIOLENT_CRIMES;
      expect(crimeCategory.categoryGroup).toBe(
        CrimeCategoryGroup.VIOLENT_CRIMES,
      );
    });

    it('should allow setting sortOrder property', () => {
      crimeCategory.sortOrder = 1;
      expect(crimeCategory.sortOrder).toBe(1);
    });

    it('should allow setting isActive property', () => {
      crimeCategory.isActive = true;
      expect(crimeCategory.isActive).toBe(true);

      crimeCategory.isActive = false;
      expect(crimeCategory.isActive).toBe(false);
    });
  });

  describe('CrimeCategory canonical examples', () => {
    it('should correctly represent HOMICIDE category', () => {
      const homicide = new CrimeCategory();
      homicide.id = '550e8400-e29b-41d4-a716-446655440001';
      homicide.code = 'HOMICIDE';
      homicide.name = 'Homicide';
      homicide.nameFr = 'Homicide';
      homicide.description =
        'Intentional killing including criminal settlements';
      homicide.severity = CrimeSeverity.CRITICAL;
      homicide.categoryGroup = CrimeCategoryGroup.VIOLENT_CRIMES;
      homicide.sortOrder = 1;
      homicide.isActive = true;

      expect(homicide.code).toBe('HOMICIDE');
      expect(homicide.severity).toBe(CrimeSeverity.CRITICAL);
      expect(homicide.categoryGroup).toBe(CrimeCategoryGroup.VIOLENT_CRIMES);
      expect(homicide.sortOrder).toBe(1);
    });

    it('should correctly represent BURGLARY_RESIDENTIAL category', () => {
      const burglary = new CrimeCategory();
      burglary.code = 'BURGLARY_RESIDENTIAL';
      burglary.name = 'Residential Burglary';
      burglary.nameFr = 'Cambriolage de résidence';
      burglary.description =
        'Break-ins at homes (primary + secondary residences)';
      burglary.severity = CrimeSeverity.MEDIUM;
      burglary.categoryGroup = CrimeCategoryGroup.PROPERTY_CRIMES;
      burglary.sortOrder = 9;
      burglary.isActive = true;

      expect(burglary.code).toBe('BURGLARY_RESIDENTIAL');
      expect(burglary.severity).toBe(CrimeSeverity.MEDIUM);
      expect(burglary.categoryGroup).toBe(CrimeCategoryGroup.PROPERTY_CRIMES);
    });

    it('should correctly represent DRUG_TRAFFICKING category', () => {
      const drugTrafficking = new CrimeCategory();
      drugTrafficking.code = 'DRUG_TRAFFICKING';
      drugTrafficking.name = 'Drug Trafficking';
      drugTrafficking.nameFr = 'Trafic de stupéfiants';
      drugTrafficking.description = 'Drug dealing, trafficking, supply offenses';
      drugTrafficking.severity = CrimeSeverity.HIGH;
      drugTrafficking.categoryGroup = CrimeCategoryGroup.DRUG_OFFENSES;
      drugTrafficking.sortOrder = 13;
      drugTrafficking.isActive = true;

      expect(drugTrafficking.code).toBe('DRUG_TRAFFICKING');
      expect(drugTrafficking.severity).toBe(CrimeSeverity.HIGH);
      expect(drugTrafficking.categoryGroup).toBe(
        CrimeCategoryGroup.DRUG_OFFENSES,
      );
    });

    it('should correctly represent OTHER category', () => {
      const other = new CrimeCategory();
      other.code = 'OTHER';
      other.name = 'Other';
      other.nameFr = 'Autres';
      other.description = 'Miscellaneous offenses not fitting other categories';
      other.severity = CrimeSeverity.LOW;
      other.categoryGroup = CrimeCategoryGroup.OTHER_OFFENSES;
      other.sortOrder = 20;
      other.isActive = true;

      expect(other.code).toBe('OTHER');
      expect(other.severity).toBe(CrimeSeverity.LOW);
      expect(other.categoryGroup).toBe(CrimeCategoryGroup.OTHER_OFFENSES);
      expect(other.sortOrder).toBe(20);
    });
  });

  describe('CrimeCategory severity ordering', () => {
    it('should support severity comparison for sorting', () => {
      const severityOrder: Record<CrimeSeverity, number> = {
        [CrimeSeverity.CRITICAL]: 0,
        [CrimeSeverity.HIGH]: 1,
        [CrimeSeverity.MEDIUM]: 2,
        [CrimeSeverity.LOW]: 3,
      };

      expect(severityOrder[CrimeSeverity.CRITICAL]).toBeLessThan(
        severityOrder[CrimeSeverity.HIGH],
      );
      expect(severityOrder[CrimeSeverity.HIGH]).toBeLessThan(
        severityOrder[CrimeSeverity.MEDIUM],
      );
      expect(severityOrder[CrimeSeverity.MEDIUM]).toBeLessThan(
        severityOrder[CrimeSeverity.LOW],
      );
    });
  });
});
