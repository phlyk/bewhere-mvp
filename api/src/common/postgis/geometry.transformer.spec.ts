import type { Geometry, Point, Polygon } from 'geojson';
import {
    GeometryTransformer,
    createMultiPolygon,
    createPoint,
    createPolygon,
} from './geometry.transformer';

describe('GeometryTransformer', () => {
  describe('to', () => {
    it('should return null for null input', () => {
      expect(GeometryTransformer.to(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(GeometryTransformer.to(undefined)).toBeNull();
    });

    it('should pass through valid geometry', () => {
      const point: Point = { type: 'Point', coordinates: [2.3522, 48.8566] };
      expect(GeometryTransformer.to(point)).toEqual(point);
    });

    it('should throw for invalid geometry', () => {
      const invalid = { type: 'Invalid', coordinates: [] } as unknown as Geometry;
      expect(() => GeometryTransformer.to(invalid)).toThrow('Invalid geometry value');
    });
  });

  describe('from', () => {
    it('should return null for null input', () => {
      expect(GeometryTransformer.from(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(GeometryTransformer.from(undefined)).toBeNull();
    });

    it('should pass through valid geometry object', () => {
      const point: Point = { type: 'Point', coordinates: [2.3522, 48.8566] };
      expect(GeometryTransformer.from(point)).toEqual(point);
    });

    it('should parse JSON string geometry', () => {
      const point: Point = { type: 'Point', coordinates: [2.3522, 48.8566] };
      const jsonString = JSON.stringify(point);
      expect(GeometryTransformer.from(jsonString)).toEqual(point);
    });

    it('should throw for invalid JSON string', () => {
      expect(() => GeometryTransformer.from('not valid json')).toThrow(
        'Failed to parse geometry string',
      );
    });

    it('should throw for invalid geometry object', () => {
      expect(() => GeometryTransformer.from({ type: 'Invalid' })).toThrow(
        'Invalid geometry value from database',
      );
    });
  });
});

describe('createPoint', () => {
  it('should create a valid GeoJSON Point', () => {
    const result = createPoint(2.3522, 48.8566);
    expect(result).toEqual({
      type: 'Point',
      coordinates: [2.3522, 48.8566],
    });
  });

  it('should use longitude, latitude order', () => {
    // Paris: longitude 2.3522, latitude 48.8566
    const paris = createPoint(2.3522, 48.8566);
    expect(paris.type).toBe('Point');
    expect((paris as Point).coordinates[0]).toBe(2.3522); // longitude first
    expect((paris as Point).coordinates[1]).toBe(48.8566); // latitude second
  });
});

describe('createPolygon', () => {
  it('should create a valid GeoJSON Polygon', () => {
    const coordinates: [number, number][][] = [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0], // closed ring
      ],
    ];
    const result = createPolygon(coordinates);
    expect(result).toEqual({
      type: 'Polygon',
      coordinates,
    });
  });

  it('should support polygons with holes', () => {
    const exterior: [number, number][] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ];
    const hole: [number, number][] = [
      [2, 2],
      [8, 2],
      [8, 8],
      [2, 8],
      [2, 2],
    ];
    const result = createPolygon([exterior, hole]) as Polygon;
    expect(result.type).toBe('Polygon');
    expect(result.coordinates).toHaveLength(2);
  });
});

describe('createMultiPolygon', () => {
  it('should create a valid GeoJSON MultiPolygon', () => {
    const polygon1: [number, number][][] = [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ];
    const polygon2: [number, number][][] = [
      [
        [2, 2],
        [3, 2],
        [3, 3],
        [2, 3],
        [2, 2],
      ],
    ];
    const result = createMultiPolygon([polygon1, polygon2]);
    expect(result).toEqual({
      type: 'MultiPolygon',
      coordinates: [polygon1, polygon2],
    });
  });
});
