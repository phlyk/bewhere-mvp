/**
 * Tests for French Département Geometry Extractor
 */

import {
    createDepartementsExtractor,
    DEPARTEMENTS_GEOJSON_SOURCES,
    DepartementsExtractor,
} from './departements.extractor';
import { DepartementsGeoJson } from './departements.types';

// Mock the download utility
jest.mock('../../utils/download', () => ({
  downloadFile: jest.fn(),
}));

// Mock fs
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
}));

import * as fs from 'fs';
import { downloadFile } from '../../utils/download';

const mockDownloadFile = downloadFile as jest.MockedFunction<typeof downloadFile>;
const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;
const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;

describe('DepartementsExtractor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('factory function', () => {
    it('should create extractor with default source', () => {
      const extractor = createDepartementsExtractor();
      expect(extractor).toBeInstanceOf(DepartementsExtractor);
    });

    it('should create extractor with custom source', () => {
      const extractor = createDepartementsExtractor({
        source: 'https://example.com/custom.geojson',
      });
      expect(extractor).toBeInstanceOf(DepartementsExtractor);
    });
  });

  describe('validate', () => {
    it('should return true for valid URL source', async () => {
      const extractor = createDepartementsExtractor({
        source: DEPARTEMENTS_GEOJSON_SOURCES.geoApiGouv,
      });
      const isValid = await extractor.validate();
      expect(isValid).toBe(true);
    });

    it('should return false for empty source', async () => {
      const extractor = new DepartementsExtractor({ source: '' });
      const isValid = await extractor.validate();
      expect(isValid).toBe(false);
    });

    it('should return true for valid file path', async () => {
      mockExistsSync.mockReturnValue(true);
      const extractor = new DepartementsExtractor({
        source: '/path/to/local/file.geojson',
      });
      const isValid = await extractor.validate();
      expect(isValid).toBe(true);
    });
  });

  describe('extract', () => {
    const mockGeoJson: DepartementsGeoJson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { code: '75', nom: 'Paris' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[2.2, 48.8], [2.4, 48.8], [2.4, 48.9], [2.2, 48.9], [2.2, 48.8]]],
          },
        },
        {
          type: 'Feature',
          properties: { code: '13', nom: 'Bouches-du-Rhône' },
          geometry: {
            type: 'MultiPolygon',
            coordinates: [[[[5.0, 43.2], [5.5, 43.2], [5.5, 43.5], [5.0, 43.5], [5.0, 43.2]]]],
          },
        },
        {
          type: 'Feature',
          properties: { code: '971', nom: 'Guadeloupe' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[-61.8, 16.0], [-61.5, 16.0], [-61.5, 16.3], [-61.8, 16.3], [-61.8, 16.0]]],
          },
        },
      ],
    };

    beforeEach(() => {
      mockDownloadFile.mockResolvedValue({
        filePath: '/cache/test.geojson',
        fromCache: true,
        size: 1000,
        downloadMs: 0,
      });
      mockReadFileSync.mockReturnValue(JSON.stringify(mockGeoJson));
    });

    it('should extract all features from GeoJSON', async () => {
      const extractor = createDepartementsExtractor({
        source: 'https://example.com/test.geojson',
      });

      const result = await extractor.extract();

      expect(result.data).toHaveLength(3);
      expect(result.rowCount).toBe(3);
      expect(result.source).toBe('https://example.com/test.geojson');
    });

    it('should filter out overseas départements when includeOverseas is false', async () => {
      const extractor = createDepartementsExtractor({
        source: 'https://example.com/test.geojson',
        includeOverseas: false,
      });

      const result = await extractor.extract();

      expect(result.data).toHaveLength(2);
      expect(result.data.map((f) => f.properties.code)).toEqual(['75', '13']);
      expect(result.warnings).toContain('Filtered out 1 overseas département(s)');
    });

    it('should respect maxRows option', async () => {
      const extractor = createDepartementsExtractor({
        source: 'https://example.com/test.geojson',
        maxRows: 1,
      });

      const result = await extractor.extract();

      expect(result.data).toHaveLength(1);
      expect(result.warnings.some((w) => w.includes('maxRows'))).toBe(true);
    });

    it('should warn if feature count is below minimum', async () => {
      const extractor = createDepartementsExtractor({
        source: 'https://example.com/test.geojson',
        minFeatures: 96,
      });

      const result = await extractor.extract();

      expect(result.warnings.some((w) => w.includes('below expected minimum'))).toBe(true);
    });

    it('should filter out features without code', async () => {
      const badGeoJson: DepartementsGeoJson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { code: '75', nom: 'Paris' },
            geometry: {
              type: 'Polygon',
              coordinates: [[[2.2, 48.8], [2.4, 48.8], [2.4, 48.9], [2.2, 48.9], [2.2, 48.8]]],
            },
          },
          {
            type: 'Feature',
            properties: { code: '', nom: 'Unknown' },
            geometry: {
              type: 'Polygon',
              coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
            },
          },
        ],
      };
      mockReadFileSync.mockReturnValue(JSON.stringify(badGeoJson));

      const extractor = createDepartementsExtractor({
        source: 'https://example.com/test.geojson',
        minFeatures: 1,
      });

      const result = await extractor.extract();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].properties.code).toBe('75');
    });

    it('should throw error for invalid GeoJSON', async () => {
      mockReadFileSync.mockReturnValue('not valid json');

      const extractor = createDepartementsExtractor({
        source: 'https://example.com/test.geojson',
      });

      await expect(extractor.extract()).rejects.toThrow('Failed to parse GeoJSON');
    });

    it('should throw error for wrong GeoJSON type', async () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({ type: 'Feature' }));

      const extractor = createDepartementsExtractor({
        source: 'https://example.com/test.geojson',
      });

      await expect(extractor.extract()).rejects.toThrow('Invalid GeoJSON type');
    });
  });

  describe('DEPARTEMENTS_GEOJSON_SOURCES', () => {
    it('should have valid URLs', () => {
      expect(DEPARTEMENTS_GEOJSON_SOURCES.geoApiGouv).toMatch(/^https:\/\//);
      expect(DEPARTEMENTS_GEOJSON_SOURCES.etalabFull).toMatch(/^https:\/\//);
      expect(DEPARTEMENTS_GEOJSON_SOURCES.openDataSoft).toMatch(/^https:\/\//);
    });
  });
});
