/**
 * Tests for French Département Geometry Transformer
 */

import {
    DepartementsTransformer,
    createDepartementsTransformer,
} from './departements.transformer';
import { DepartementGeoJsonFeature } from './departements.types';

describe('DepartementsTransformer', () => {
  describe('factory function', () => {
    it('should create transformer with default options', () => {
      const transformer = createDepartementsTransformer();
      expect(transformer).toBeInstanceOf(DepartementsTransformer);
    });

    it('should create transformer with custom options', () => {
      const transformer = createDepartementsTransformer({
        continueOnError: false,
        maxErrors: 5,
      });
      expect(transformer).toBeInstanceOf(DepartementsTransformer);
    });
  });

  describe('validate', () => {
    it('should return true (no special validation needed)', async () => {
      const transformer = createDepartementsTransformer();
      const isValid = await transformer.validate();
      expect(isValid).toBe(true);
    });
  });

  describe('transform', () => {
    const validFeatures: DepartementGeoJsonFeature[] = [
      {
        type: 'Feature',
        properties: { code: '75', nom: 'Paris', region: '11' },
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
    ];

    it('should transform all valid features', async () => {
      const transformer = createDepartementsTransformer();
      const result = await transformer.transform(validFeatures);

      expect(result.transformedCount).toBe(2);
      expect(result.skippedCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should set correct record fields', async () => {
      const transformer = createDepartementsTransformer();
      const result = await transformer.transform([validFeatures[0]]);

      const record = result.data[0];
      expect(record.code).toBe('75');
      expect(record.name).toBe('Paris');
      expect(record.level).toBe('department');
      expect(record.countryCode).toBe('FR');
      expect(record.parentCode).toBe('IDF'); // Île-de-France
    });

    it('should convert Polygon to WKT', async () => {
      const transformer = createDepartementsTransformer();
      const result = await transformer.transform([validFeatures[0]]);

      const record = result.data[0];
      expect(record.geometry).toMatch(/^POLYGON\(/);
      expect(record.geometry).toContain('2.2 48.8');
    });

    it('should convert MultiPolygon to WKT', async () => {
      const transformer = createDepartementsTransformer();
      const result = await transformer.transform([validFeatures[1]]);

      const record = result.data[0];
      expect(record.geometry).toMatch(/^MULTIPOLYGON\(/);
      expect(record.geometry).toContain('5 43.2');
    });

    it('should preserve original GeoJSON geometry', async () => {
      const transformer = createDepartementsTransformer();
      const result = await transformer.transform([validFeatures[0]]);

      const record = result.data[0];
      expect(record.geojson).toEqual(validFeatures[0].geometry);
    });

    it('should handle missing code with error', async () => {
      const badFeature: DepartementGeoJsonFeature = {
        type: 'Feature',
        properties: { code: '', nom: 'Unknown' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        },
      };

      const transformer = createDepartementsTransformer({ continueOnError: true });
      const result = await transformer.transform([badFeature]);

      expect(result.transformedCount).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      // First error should be about the code field
      expect(result.errors[0].field).toBe('code');
    });

    it('should handle missing nom with error', async () => {
      const badFeature: DepartementGeoJsonFeature = {
        type: 'Feature',
        properties: { code: '99', nom: '' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        },
      };

      const transformer = createDepartementsTransformer({ continueOnError: true });
      const result = await transformer.transform([badFeature]);

      expect(result.errors.length).toBeGreaterThan(0);
      // First error should be about the nom field
      expect(result.errors[0].field).toBe('nom');
    });

    it('should throw error without continueOnError', async () => {
      const badFeature: DepartementGeoJsonFeature = {
        type: 'Feature',
        properties: { code: '', nom: 'Unknown' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        },
      };

      const transformer = createDepartementsTransformer({ continueOnError: false });
      await expect(transformer.transform([badFeature])).rejects.toThrow();
    });

    it('should resolve parent region from GeoJSON region property', async () => {
      const featureWithRegion: DepartementGeoJsonFeature = {
        type: 'Feature',
        properties: { code: '75', nom: 'Paris', region: '11' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[2.2, 48.8], [2.4, 48.8], [2.4, 48.9], [2.2, 48.9], [2.2, 48.8]]],
        },
      };

      const transformer = createDepartementsTransformer();
      const result = await transformer.transform([featureWithRegion]);

      expect(result.data[0].parentCode).toBe('IDF');
    });

    it('should fall back to static mapping when region not in GeoJSON', async () => {
      const featureWithoutRegion: DepartementGeoJsonFeature = {
        type: 'Feature',
        properties: { code: '75', nom: 'Paris' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[2.2, 48.8], [2.4, 48.8], [2.4, 48.9], [2.2, 48.9], [2.2, 48.8]]],
        },
      };

      const transformer = createDepartementsTransformer();
      const result = await transformer.transform([featureWithoutRegion]);

      expect(result.data[0].parentCode).toBe('IDF');
    });

    it('should handle overseas départements', async () => {
      const overseasFeature: DepartementGeoJsonFeature = {
        type: 'Feature',
        properties: { code: '971', nom: 'Guadeloupe' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[-61.8, 16.0], [-61.5, 16.0], [-61.5, 16.3], [-61.8, 16.3], [-61.8, 16.0]]],
        },
      };

      const transformer = createDepartementsTransformer();
      const result = await transformer.transform([overseasFeature]);

      expect(result.data[0].code).toBe('971');
      expect(result.data[0].parentCode).toBe('GUA');
    });

    it('should handle complex MultiPolygon geometry', async () => {
      const complexFeature: DepartementGeoJsonFeature = {
        type: 'Feature',
        properties: { code: '2A', nom: 'Corse-du-Sud' },
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [[[8.5, 41.5], [9.0, 41.5], [9.0, 42.0], [8.5, 42.0], [8.5, 41.5]]],
            [[[9.1, 41.3], [9.3, 41.3], [9.3, 41.5], [9.1, 41.5], [9.1, 41.3]]],
          ],
        },
      };

      const transformer = createDepartementsTransformer();
      const result = await transformer.transform([complexFeature]);

      expect(result.data[0].geometry).toMatch(/^MULTIPOLYGON\(/);
      // Should have two polygon groups
      expect((result.data[0].geometry.match(/\(\(/g) || []).length).toBe(2);
    });

    it('should skip geometry validation when skipGeometryValidation is true', async () => {
      const transformer = createDepartementsTransformer({
        skipGeometryValidation: true,
      });

      // Feature with potentially problematic geometry still passes
      const result = await transformer.transform(validFeatures);
      expect(result.transformedCount).toBe(2);
    });
  });
});
