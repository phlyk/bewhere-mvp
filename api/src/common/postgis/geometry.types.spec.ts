import type { MultiPolygon, Point, Polygon } from 'geojson';
import {
    DEFAULT_SRID,
    isGeometry,
    isMultiPolygon,
    isPoint,
    isPolygon,
    SRID,
} from './geometry.types';

describe('geometry.types', () => {
  describe('SRID constants', () => {
    it('should define WGS84 as 4326', () => {
      expect(SRID.WGS84).toBe(4326);
    });

    it('should define WEB_MERCATOR as 3857', () => {
      expect(SRID.WEB_MERCATOR).toBe(3857);
    });

    it('should use WGS84 as the default SRID', () => {
      expect(DEFAULT_SRID).toBe(4326);
    });
  });

  describe('isGeometry', () => {
    it('should return true for valid Point geometry', () => {
      const point: Point = { type: 'Point', coordinates: [2.3522, 48.8566] };
      expect(isGeometry(point)).toBe(true);
    });

    it('should return true for valid Polygon geometry', () => {
      const polygon: Polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      };
      expect(isGeometry(polygon)).toBe(true);
    });

    it('should return true for valid MultiPolygon geometry', () => {
      const multiPolygon: MultiPolygon = {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        ],
      };
      expect(isGeometry(multiPolygon)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isGeometry(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isGeometry(undefined)).toBe(false);
    });

    it('should return false for invalid geometry type', () => {
      expect(isGeometry({ type: 'InvalidType', coordinates: [] })).toBe(false);
    });

    it('should return false for non-object values', () => {
      expect(isGeometry('string')).toBe(false);
      expect(isGeometry(123)).toBe(false);
      expect(isGeometry([])).toBe(false);
    });
  });

  describe('isPoint', () => {
    it('should return true for valid Point', () => {
      const point: Point = { type: 'Point', coordinates: [2.3522, 48.8566] };
      expect(isPoint(point)).toBe(true);
    });

    it('should return false for Polygon', () => {
      const polygon: Polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      };
      expect(isPoint(polygon)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isPoint(null)).toBe(false);
    });
  });

  describe('isPolygon', () => {
    it('should return true for valid Polygon', () => {
      const polygon: Polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      };
      expect(isPolygon(polygon)).toBe(true);
    });

    it('should return false for Point', () => {
      const point: Point = { type: 'Point', coordinates: [0, 0] };
      expect(isPolygon(point)).toBe(false);
    });
  });

  describe('isMultiPolygon', () => {
    it('should return true for valid MultiPolygon', () => {
      const multiPolygon: MultiPolygon = {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        ],
      };
      expect(isMultiPolygon(multiPolygon)).toBe(true);
    });

    it('should return false for Polygon', () => {
      const polygon: Polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      };
      expect(isMultiPolygon(polygon)).toBe(false);
    });
  });
});
