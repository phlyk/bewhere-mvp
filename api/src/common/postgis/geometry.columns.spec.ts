import {
    geometryColumn,
    multiPolygonColumn,
    pointColumn,
    polygonColumn,
} from './geometry.columns';
import { GeometryTransformer } from './geometry.transformer';
import { DEFAULT_SRID } from './geometry.types';

describe('geometry.columns', () => {
  describe('pointColumn', () => {
    it('should return correct column options with defaults', () => {
      const options = pointColumn();
      expect(options.type).toBe('geometry');
      expect(options.spatialFeatureType).toBe('Point');
      expect(options.srid).toBe(DEFAULT_SRID);
      expect(options.nullable).toBe(false);
      expect(options.transformer).toBe(GeometryTransformer);
    });

    it('should allow custom SRID', () => {
      const options = pointColumn({ srid: 3857 });
      expect(options.srid).toBe(3857);
    });

    it('should allow nullable option', () => {
      const options = pointColumn({ nullable: true });
      expect(options.nullable).toBe(true);
    });
  });

  describe('polygonColumn', () => {
    it('should return correct column options with defaults', () => {
      const options = polygonColumn();
      expect(options.type).toBe('geometry');
      expect(options.spatialFeatureType).toBe('Polygon');
      expect(options.srid).toBe(DEFAULT_SRID);
      expect(options.nullable).toBe(false);
      expect(options.transformer).toBe(GeometryTransformer);
    });
  });

  describe('multiPolygonColumn', () => {
    it('should return correct column options with defaults', () => {
      const options = multiPolygonColumn();
      expect(options.type).toBe('geometry');
      expect(options.spatialFeatureType).toBe('MultiPolygon');
      expect(options.srid).toBe(DEFAULT_SRID);
      expect(options.nullable).toBe(false);
      expect(options.transformer).toBe(GeometryTransformer);
    });
  });

  describe('geometryColumn', () => {
    it('should return correct column options with defaults', () => {
      const options = geometryColumn();
      expect(options.type).toBe('geometry');
      expect(options.spatialFeatureType).toBe('Geometry');
      expect(options.srid).toBe(DEFAULT_SRID);
      expect(options.nullable).toBe(false);
      expect(options.transformer).toBe(GeometryTransformer);
    });
  });
});
