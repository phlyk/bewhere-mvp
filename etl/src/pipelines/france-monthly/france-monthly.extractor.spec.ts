/**
 * France Monthly Crime Extractor Tests
 *
 * Unit tests for the État 4001 CSV extractor.
 */

import * as fs from 'fs';
import * as iconv from 'iconv-lite';
import * as path from 'path';
import {
    FranceMonthlyExtractor,
} from './france-monthly.extractor';
import {
    DEPARTEMENT_NAME_TO_CODE,
    isUnusedIndex,
    UNUSED_ETAT4001_INDICES,
} from './france-monthly.types';

// Create test fixtures directory path
const FIXTURES_DIR = path.join(__dirname, '__fixtures__');

// Sample CSV content (Latin-1 encoded with French characters)
const SAMPLE_CSV_CONTENT = `;Tableau 6. Faits constatés par la police et la gendarmerie, par département de France métropolitaine, en juin 2012.;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
N°Index;Index de l'Etat 4001;Métropole;Ain;Aisne;Allier;Alpes-de-Haute-Provence;Hautes-Alpes;Alpes-Maritimes;Ardèche;Ardennes;Ariège;Aube;Aude;Aveyron;Bouches-du-Rhône;Calvados;Cantal;Charente;Charente-Maritime;Cher;Corrèze;Côte-d'Or;Côtes-d'Armor;Creuse;Dordogne;Doubs;Drôme;Eure;Eure-et-Loir;Finistère;Corse-du-Sud;Haute-Corse;Gard;Haute-Garonne;Gers;Gironde;Hérault;Ille-et-Vilaine;Indre;Indre-et-Loire;Isère;Jura;Landes;Loir-et-Cher;Loire;Haute-Loire;Loire-Atlantique;Loiret;Lot;Lot-et-Garonne;Lozère;Maine-et-Loire;Manche;Marne;Haute-Marne;Mayenne;Meurthe-et-Moselle;Meuse;Morbihan;Moselle;Nièvre;Nord;Oise;Orne;Pas-de-Calais;Puy-de-Dôme;Pyrénées-Atlantiques;Hautes-Pyrénées;Pyrénées-Orientales;Bas-Rhin;Haut-Rhin;Rhône;Haute-Saône;Saône-et-Loire;Sarthe;Savoie;Haute-Savoie;Paris;Seine-Maritime;Seine-et-Marne;Yvelines;Deux-Sèvres;Somme;Tarn;Tarn-et-Garonne;Var;Vaucluse;Vendée;Vienne;Haute-Vienne;Vosges;Yonne;Territoire de Belfort;Essonne;Hauts-de-Seine;Seine-Saint-Denis;Val-de-Marne;Val-d'Oise
01;Règlements de compte entre malfaiteurs;2;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;1;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;1;0;0
02;Homicides pour voler et à l'occasion de vols;3;0;0;0;0;0;0;1;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;1;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;1;0;0
03;Homicides pour d'autres motifs;42;1;0;1;0;0;3;0;0;1;0;0;0;1;0;0;1;0;0;0;0;0;0;1;0;1;0;0;2;0;0;0;1;0;1;0;1;0;0;1;1;0;0;0;0;0;0;0;0;0;1;0;0;0;0;0;0;0;1;0;5;3;0;2;0;0;0;0;0;0;1;0;2;1;0;0;4;2;1;0;0;0;1;0;0;0;0;0;0;0;0;0;0;0;0;0;1
07;Autres coups et blessures volontaires;17 369;107;199;80;38;23;389;69;88;32;88;105;34;733;147;10;59;131;74;46;114;97;19;75;142;123;173;93;195;36;28;213;267;32;464;324;197;45;114;268;47;80;87;177;31;362;195;22;53;14;141;77;179;68;48;222;35;135;208;40;928;201;51;706;142;98;43;133;279;179;527;62;74;130;108;175;784;370;387;332;62;149;62;55;364;164;108;103;88;82;107;34;347;408;872;465;498`;

// Sample content with different encoding issues
const SAMPLE_MINIMAL_CSV = `N°Index;Index de l'Etat 4001;Métropole;Ain;Paris
01;Test Category 1;100;10;90
02;Test Category 2;200;20;180`;

describe('FranceMonthlyExtractor', () => {
  let tempDir: string;

  beforeAll(() => {
    // Create temp directory for test files
    tempDir = path.join(__dirname, '__temp_test__');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('Type definitions', () => {
    it('should have correct DEPARTEMENT_NAME_TO_CODE mappings', () => {
      // Test some key département mappings
      expect(DEPARTEMENT_NAME_TO_CODE['ain']).toBe('01');
      expect(DEPARTEMENT_NAME_TO_CODE['paris']).toBe('75');
      expect(DEPARTEMENT_NAME_TO_CODE['corse-du-sud']).toBe('2A');
      expect(DEPARTEMENT_NAME_TO_CODE['haute-corse']).toBe('2B');
      expect(DEPARTEMENT_NAME_TO_CODE['rhône']).toBe('69');
      expect(DEPARTEMENT_NAME_TO_CODE['rhone']).toBe('69'); // Without accent
      expect(DEPARTEMENT_NAME_TO_CODE['seine-saint-denis']).toBe('93');
    });

    it('should have overseas département mappings', () => {
      expect(DEPARTEMENT_NAME_TO_CODE['guadeloupe']).toBe('971');
      expect(DEPARTEMENT_NAME_TO_CODE['martinique']).toBe('972');
      expect(DEPARTEMENT_NAME_TO_CODE['guyane']).toBe('973');
      expect(DEPARTEMENT_NAME_TO_CODE['la réunion']).toBe('974');
      expect(DEPARTEMENT_NAME_TO_CODE['mayotte']).toBe('976');
    });

    it('should identify unused indices correctly', () => {
      expect(UNUSED_ETAT4001_INDICES).toEqual([96, 97, 99, 100]);
      expect(isUnusedIndex(96)).toBe(true);
      expect(isUnusedIndex(97)).toBe(true);
      expect(isUnusedIndex(99)).toBe(true);
      expect(isUnusedIndex(100)).toBe(true);
      expect(isUnusedIndex(1)).toBe(false);
      expect(isUnusedIndex(98)).toBe(false);
      expect(isUnusedIndex(107)).toBe(false);
    });
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      const extractor = new FranceMonthlyExtractor({
        source: '/path/to/file.csv',
      });

      expect(extractor).toBeDefined();
      expect(extractor['monthlyOptions'].encoding).toBe('latin1');
      expect(extractor['monthlyOptions'].delimiter).toBe(';');
      expect(extractor['monthlyOptions'].headerRowsToSkip).toBe(2);
    });

    it('should allow custom options', () => {
      const extractor = new FranceMonthlyExtractor({
        source: '/path/to/file.csv',
        encoding: 'utf-8',
        delimiter: ',',
        headerRowsToSkip: 1,
        year: 2020,
        month: 6,
      });

      expect(extractor['monthlyOptions'].encoding).toBe('utf-8');
      expect(extractor['monthlyOptions'].delimiter).toBe(',');
      expect(extractor['monthlyOptions'].headerRowsToSkip).toBe(1);
      expect(extractor['monthlyOptions'].year).toBe(2020);
      expect(extractor['monthlyOptions'].month).toBe(6);
    });
  });

  describe('validate()', () => {
    it('should return true for existing local files', async () => {
      // Create a temp file
      const testFile = path.join(tempDir, 'test.csv');
      fs.writeFileSync(testFile, SAMPLE_MINIMAL_CSV);

      const extractor = new FranceMonthlyExtractor({ source: testFile });
      const result = await extractor.validate();

      expect(result).toBe(true);
    });

    it('should return false for non-existent files', async () => {
      const extractor = new FranceMonthlyExtractor({
        source: '/non/existent/file.csv',
      });
      const result = await extractor.validate();

      expect(result).toBe(false);
    });

    it('should return true for HTTP URLs', async () => {
      const extractor = new FranceMonthlyExtractor({
        source: 'https://example.com/data.csv',
      });
      const result = await extractor.validate();

      expect(result).toBe(true);
    });

    it('should return false for empty files', async () => {
      const testFile = path.join(tempDir, 'empty.csv');
      fs.writeFileSync(testFile, '');

      const extractor = new FranceMonthlyExtractor({ source: testFile });
      const result = await extractor.validate();

      expect(result).toBe(false);
    });
  });

  describe('extract()', () => {
    it('should extract data from UTF-8 CSV', async () => {
      const testFile = path.join(tempDir, 'utf8.csv');
      fs.writeFileSync(testFile, SAMPLE_MINIMAL_CSV, 'utf-8');

      const extractor = new FranceMonthlyExtractor({
        source: testFile,
        encoding: 'utf-8',
        headerRowsToSkip: 0,
        minRows: 1,
        minDepartements: 1,
      });

      const result = await extractor.extract();

      expect(result.data.length).toBe(2);
      expect(result.rowCount).toBe(2);
      expect(result.source).toBe(testFile);
    });

    it('should extract data from Latin-1 encoded CSV', async () => {
      const testFile = path.join(tempDir, 'latin1.csv');
      // Encode content as Latin-1
      const buffer = iconv.encode(SAMPLE_CSV_CONTENT, 'iso-8859-1');
      fs.writeFileSync(testFile, buffer);

      const extractor = new FranceMonthlyExtractor({
        source: testFile,
        encoding: 'latin1',
        minRows: 1,
        minDepartements: 10,
      });

      const result = await extractor.extract();

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.encoding).toBe('latin1');
    });

    it('should correctly parse département column headers', async () => {
      const testFile = path.join(tempDir, 'headers.csv');
      const buffer = iconv.encode(SAMPLE_CSV_CONTENT, 'iso-8859-1');
      fs.writeFileSync(testFile, buffer);

      const extractor = new FranceMonthlyExtractor({
        source: testFile,
        minRows: 1,
        minDepartements: 10,
      });

      await extractor.extract();
      const mappings = extractor.getDepartementMappings();

      expect(mappings.length).toBeGreaterThanOrEqual(90);

      // Check specific département mappings
      const ainMapping = mappings.find((m) => m.departementCode === '01');
      expect(ainMapping).toBeDefined();
      expect(ainMapping?.departementName).toMatch(/ain/i);

      const parisMapping = mappings.find((m) => m.departementCode === '75');
      expect(parisMapping).toBeDefined();

      const corseMapping = mappings.find((m) => m.departementCode === '2A');
      expect(corseMapping).toBeDefined();
    });

    it('should correctly parse crime category data', async () => {
      const testFile = path.join(tempDir, 'crime.csv');
      const buffer = iconv.encode(SAMPLE_CSV_CONTENT, 'iso-8859-1');
      fs.writeFileSync(testFile, buffer);

      const extractor = new FranceMonthlyExtractor({
        source: testFile,
        minRows: 1,
        minDepartements: 10,
      });

      const result = await extractor.extract();

      // Check first crime category
      const firstRow = result.data.find((r) => r.index === 1);
      expect(firstRow).toBeDefined();
      expect(firstRow?.categoryName).toMatch(/règlements de compte/i);
      expect(firstRow?.metropoleTotal).toBe(2);
    });

    it('should handle French number format with spaces', async () => {
      const testFile = path.join(tempDir, 'numbers.csv');
      const buffer = iconv.encode(SAMPLE_CSV_CONTENT, 'iso-8859-1');
      fs.writeFileSync(testFile, buffer);

      const extractor = new FranceMonthlyExtractor({
        source: testFile,
        minRows: 1,
        minDepartements: 10,
      });

      const result = await extractor.extract();

      // Find row with large number (17 369 in original)
      const largeRow = result.data.find((r) => r.index === 7);
      expect(largeRow).toBeDefined();
      expect(largeRow?.metropoleTotal).toBe(17369); // Space removed
    });

    it('should skip unused indices', async () => {
      // Create CSV with unused index
      const csvWithUnused = `N°Index;Category;Métropole;Ain
96;Unused Category;100;10
01;Valid Category;200;20`;

      const testFile = path.join(tempDir, 'unused.csv');
      fs.writeFileSync(testFile, csvWithUnused, 'utf-8');

      const extractor = new FranceMonthlyExtractor({
        source: testFile,
        encoding: 'utf-8',
        headerRowsToSkip: 0,
        minRows: 1,
        minDepartements: 1,
      });

      const result = await extractor.extract();

      // Should only have index 1, not 96
      expect(result.data.length).toBe(1);
      expect(result.data[0].index).toBe(1);
    });

    it('should provide extraction metadata', async () => {
      const testFile = path.join(tempDir, 'meta.csv');
      const buffer = iconv.encode(SAMPLE_CSV_CONTENT, 'iso-8859-1');
      fs.writeFileSync(testFile, buffer);

      const extractor = new FranceMonthlyExtractor({
        source: testFile,
        minRows: 1,
        minDepartements: 10,
      });

      await extractor.extract();
      const metadata = extractor.getMetadata();

      expect(metadata).toBeDefined();
      expect(metadata?.encoding).toBe('latin1');
      expect(metadata?.departementCount).toBeGreaterThan(0);
      expect(metadata?.categoryCount).toBeGreaterThan(0);
      expect(metadata?.departementOrder).toBeInstanceOf(Array);
    });
  });

  describe('Date extraction from filename', () => {
    it('should extract date from French month name in filename', async () => {
      const testFile = path.join(tempDir, 'crime-juin-2012.csv');
      fs.writeFileSync(testFile, SAMPLE_MINIMAL_CSV, 'utf-8');

      const extractor = new FranceMonthlyExtractor({
        source: testFile,
        encoding: 'utf-8',
        headerRowsToSkip: 0,
        minRows: 1,
        minDepartements: 1,
      });

      const result = await extractor.extract();
      const metadata = extractor.getMetadata();

      expect(metadata?.reportMonth).toBe(6);
      expect(metadata?.reportYear).toBe(2012);
      expect(result.data[0].sourceDate?.month).toBe(6);
      expect(result.data[0].sourceDate?.year).toBe(2012);
    });

    it('should use explicit year/month options over filename', async () => {
      const testFile = path.join(tempDir, 'crime-juin-2012.csv');
      fs.writeFileSync(testFile, SAMPLE_MINIMAL_CSV, 'utf-8');

      const extractor = new FranceMonthlyExtractor({
        source: testFile,
        encoding: 'utf-8',
        headerRowsToSkip: 0,
        minRows: 1,
        minDepartements: 1,
        year: 2020,
        month: 12,
      });

      const result = await extractor.extract();

      expect(result.data[0].sourceDate?.month).toBe(12);
      expect(result.data[0].sourceDate?.year).toBe(2020);
    });

    it('should handle various French month names', async () => {
      const months = [
        { name: 'janvier', expected: 1 },
        { name: 'février', expected: 2 },
        { name: 'mars', expected: 3 },
        { name: 'avril', expected: 4 },
        { name: 'mai', expected: 5 },
        { name: 'juin', expected: 6 },
        { name: 'juillet', expected: 7 },
        { name: 'août', expected: 8 },
        { name: 'septembre', expected: 9 },
        { name: 'octobre', expected: 10 },
        { name: 'novembre', expected: 11 },
        { name: 'décembre', expected: 12 },
      ];

      for (const { name, expected } of months) {
        const testFile = path.join(tempDir, `data-${name}-2020.csv`);
        fs.writeFileSync(testFile, SAMPLE_MINIMAL_CSV, 'utf-8');

        const extractor = new FranceMonthlyExtractor({
          source: testFile,
          encoding: 'utf-8',
          headerRowsToSkip: 0,
          minRows: 1,
          minDepartements: 1,
        });

        await extractor.extract();
        const metadata = extractor.getMetadata();

        expect(metadata?.reportMonth).toBe(expected);
        expect(metadata?.reportYear).toBe(2020);
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle empty cells', async () => {
      const csvWithEmpty = `N°Index;Category;Métropole;Ain;Paris
01;Test;;10;90`;

      const testFile = path.join(tempDir, 'empty-cells.csv');
      fs.writeFileSync(testFile, csvWithEmpty, 'utf-8');

      const extractor = new FranceMonthlyExtractor({
        source: testFile,
        encoding: 'utf-8',
        headerRowsToSkip: 0,
        minRows: 1,
        minDepartements: 1,
      });

      const result = await extractor.extract();

      expect(result.data.length).toBe(1);
      expect(result.data[0].metropoleTotal).toBe(0); // Empty = 0
    });

    it('should skip rows without valid index', async () => {
      const csvWithBadIndex = `N°Index;Category;Métropole;Ain
;Empty Index;100;10
abc;Non-numeric;100;10
01;Valid;200;20`;

      const testFile = path.join(tempDir, 'bad-index.csv');
      fs.writeFileSync(testFile, csvWithBadIndex, 'utf-8');

      const extractor = new FranceMonthlyExtractor({
        source: testFile,
        encoding: 'utf-8',
        headerRowsToSkip: 0,
        minRows: 1,
        minDepartements: 1,
      });

      const result = await extractor.extract();

      expect(result.data.length).toBe(1);
      expect(result.data[0].index).toBe(1);
    });

    it('should handle rows with missing département columns', async () => {
      const csvShort = `N°Index;Category;Métropole;Ain;Paris
01;Test;100;10`;  // Missing Paris value

      const testFile = path.join(tempDir, 'short-row.csv');
      fs.writeFileSync(testFile, csvShort, 'utf-8');

      const extractor = new FranceMonthlyExtractor({
        source: testFile,
        encoding: 'utf-8',
        headerRowsToSkip: 0,
        minRows: 1,
        minDepartements: 1,
      });

      const result = await extractor.extract();

      expect(result.data.length).toBe(1);
      // Should handle missing value gracefully (as 0)
      expect(result.data[0].departementCounts['75']).toBe(0);
    });
  });
});
