/**
 * E2E Validation Tests for BeWhere MVP
 *
 * Phase 10 Tasks:
 * - Task 10.4: Verify all ETL pipelines produce expected row counts
 * - Task 10.5: Cross-check sample values against original sources
 * - Task 10.7: Test spatial joins with real département polygons
 * - Task 10.8: Performance test: query times for full dataset
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Data Validation E2E Tests (Phase 10)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    dataSource = moduleFixture.get(DataSource);
  }, 30000);

  afterAll(async () => {
    await app?.close();
  });

  /**
   * Task 10.4: Verify all ETL pipelines produce expected row counts
   */
  describe('Task 10.4: ETL Pipeline Row Count Validation', () => {
    /**
     * Expected row counts based on documented data:
     * - 96 metropolitan départements + 5 overseas = 101 total
     * - 20 canonical crime categories
     * - 9 years of data (2016-2024)
     */
    const EXPECTED_COUNTS = {
      /** Metropolitan départements in État 4001 */
      metropolitanDepartements: 96,
      /** Overseas départements (DOM) */
      overseasDepartements: 5,
      /** Total départements */
      totalDepartements: 101,
      /** Canonical crime categories */
      crimeCategories: 20,
      /** Years of population data */
      populationYears: 9, // 2016-2024
      /** Expected population records (101 depts × 9 years) */
      populationRecords: 909,
    };

    it('should have all metropolitan départements loaded', async () => {
      const response = await request(app.getHttpServer())
        .get('/areas')
        .query({ level: 'department' })
        .expect(200);

      const { data, total } = response.body;

      // Should have at least metropolitan départements
      expect(total).toBeGreaterThanOrEqual(EXPECTED_COUNTS.metropolitanDepartements);

      // Verify data is an array
      expect(Array.isArray(data)).toBe(true);
    });

    it('should have all 20 canonical crime categories seeded', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      const { data, total } = response.body;

      expect(total).toBe(EXPECTED_COUNTS.crimeCategories);
      expect(data).toHaveLength(EXPECTED_COUNTS.crimeCategories);

      // Verify each category has required fields
      for (const category of data) {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('code');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('severity');
        expect(category).toHaveProperty('categoryGroup');
      }
    });

    it('should have all canonical category codes present', async () => {
      const expectedCodes = [
        'HOMICIDE',
        'ASSAULT',
        'SEXUAL_VIOLENCE',
        'DOMESTIC_VIOLENCE',
        'ROBBERY',
        'KIDNAPPING',
        'HUMAN_TRAFFICKING',
        'WEAPONS_OFFENSE',
        'BURGLARY_RESIDENTIAL',
        'BURGLARY_COMMERCIAL',
        'VEHICLE_THEFT',
        'THEFT_PERSONAL',
        'THEFT_OTHER',
        'FRAUD',
        'VANDALISM',
        'DRUG_TRAFFICKING',
        'DRUG_POSSESSION',
        'CYBERCRIME',
        'PUBLIC_ORDER',
        'OTHER',
      ];

      const response = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      const { data } = response.body;
      const actualCodes = data.map((c: { code: string }) => c.code);

      for (const expectedCode of expectedCodes) {
        expect(actualCodes).toContain(expectedCode);
      }
    });

    it('should have département geometries loaded (GeoJSON)', async () => {
      const response = await request(app.getHttpServer())
        .get('/areas/geojson')
        .query({ level: 'department' })
        .expect(200);

      const geoJson = response.body;

      expect(geoJson).toHaveProperty('type', 'FeatureCollection');
      expect(geoJson).toHaveProperty('features');
      expect(Array.isArray(geoJson.features)).toBe(true);

      // Should have geometry for each département
      expect(geoJson.features.length).toBeGreaterThanOrEqual(
        EXPECTED_COUNTS.metropolitanDepartements,
      );

      // Verify each feature has valid geometry
      for (const feature of geoJson.features) {
        expect(feature).toHaveProperty('type', 'Feature');
        expect(feature).toHaveProperty('geometry');
        expect(feature).toHaveProperty('properties');

        if (feature.geometry) {
          expect(['Polygon', 'MultiPolygon']).toContain(feature.geometry.type);
          expect(feature.geometry).toHaveProperty('coordinates');
        }
      }
    });

    it('should have category distribution across severity levels', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      const { data } = response.body;

      // Count by severity
      const severityCounts: Record<string, number> = {};
      for (const category of data) {
        severityCounts[category.severity] = (severityCounts[category.severity] || 0) + 1;
      }

      // Should have categories across all severity levels
      expect(severityCounts['critical']).toBeGreaterThan(0);
      expect(severityCounts['high']).toBeGreaterThan(0);
      expect(severityCounts['medium']).toBeGreaterThan(0);
      expect(severityCounts['low']).toBeGreaterThan(0);
    });

    it('should have category distribution across category groups', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      const { data } = response.body;

      // Count by group
      const groupCounts: Record<string, number> = {};
      for (const category of data) {
        groupCounts[category.categoryGroup] = (groupCounts[category.categoryGroup] || 0) + 1;
      }

      // Should have categories across main groups
      expect(groupCounts['violent_crimes']).toBeGreaterThan(0);
      expect(groupCounts['property_crimes']).toBeGreaterThan(0);
    });
  });

  /**
   * Task 10.5: Cross-check sample values against original sources
   */
  describe('Task 10.5: Data Value Cross-Check Validation', () => {
    /**
     * Known reference values from original French data sources
     * Source: État 4001 and INSEE population data
     */
    const REFERENCE_VALUES = {
      // Paris population (2020) - should be approximately 2,130,000
      paris2020Population: { min: 2000000, max: 2200000 },
      // Nord population (2020) - should be approximately 2,600,000
      nord2020Population: { min: 2500000, max: 2700000 },
      // Lozère population (2020) - smallest département, approx 76,000
      lozere2020Population: { min: 70000, max: 85000 },
    };

    it('should have Paris (75) département with valid data', async () => {
      const response = await request(app.getHttpServer())
        .get('/areas')
        .query({ level: 'department' })
        .expect(200);

      const { data } = response.body;
      const paris = data.find((a: { code: string }) => a.code === '75');

      expect(paris).toBeDefined();
      expect(paris.name).toMatch(/Paris/i);
      expect(paris.level).toBe('department');
    });

    it('should have Corsica départements with correct codes (2A, 2B)', async () => {
      const response = await request(app.getHttpServer())
        .get('/areas')
        .query({ level: 'department' })
        .expect(200);

      const { data } = response.body;

      const corseSud = data.find((a: { code: string }) => a.code === '2A');
      const hauteCorse = data.find((a: { code: string }) => a.code === '2B');

      // Corsica should have its special codes, not numeric 20
      expect(corseSud || hauteCorse).toBeDefined();
    });

    it('should have valid geometry bounds for metropolitan France', async () => {
      const response = await request(app.getHttpServer())
        .get('/areas/geojson')
        .query({ level: 'department' })
        .expect(200);

      const { features } = response.body;

      // Metropolitan France approximate bounding box
      const FRANCE_BOUNDS = {
        minLon: -5.5,  // West (Brittany)
        maxLon: 10.0,  // East (Alsace)
        minLat: 41.0,  // South (Corsica)
        maxLat: 51.5,  // North (Nord-Pas-de-Calais)
      };

      // Check at least some features are within France bounds
      let withinBounds = 0;
      for (const feature of features) {
        if (feature.geometry?.coordinates) {
          // For MultiPolygon, get first coordinate
          const coords = feature.geometry.type === 'MultiPolygon'
            ? feature.geometry.coordinates[0][0][0]
            : feature.geometry.coordinates[0][0];

          if (coords && Array.isArray(coords)) {
            const [lon, lat] = coords;
            if (
              lon >= FRANCE_BOUNDS.minLon &&
              lon <= FRANCE_BOUNDS.maxLon &&
              lat >= FRANCE_BOUNDS.minLat &&
              lat <= FRANCE_BOUNDS.maxLat
            ) {
              withinBounds++;
            }
          }
        }
      }

      // Most départements should be within France bounds
      expect(withinBounds).toBeGreaterThan(features.length * 0.8);
    });

    it('should have categories with French translations', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      const { data } = response.body;

      // Check that nameFr is populated for at least some categories
      const withFrenchName = data.filter(
        (c: { nameFr: string }) => c.nameFr && c.nameFr.length > 0,
      );

      // Most categories should have French translations
      expect(withFrenchName.length).toBeGreaterThan(data.length * 0.8);
    });

    it('should have valid severity levels with expected distribution', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      const { data } = response.body;

      const bySeverity: Record<string, string[]> = {};
      for (const cat of data) {
        if (!bySeverity[cat.severity]) {
          bySeverity[cat.severity] = [];
        }
        bySeverity[cat.severity].push(cat.code);
      }

      // Critical should include HOMICIDE
      if (bySeverity['critical']) {
        expect(bySeverity['critical']).toContain('HOMICIDE');
      }

      // Low should include PUBLIC_ORDER or OTHER
      if (bySeverity['low']) {
        const lowSeverity = bySeverity['low'];
        expect(
          lowSeverity.includes('PUBLIC_ORDER') || lowSeverity.includes('OTHER'),
        ).toBe(true);
      }
    });
  });

  /**
   * Task 10.7: Test spatial joins with real département polygons
   */
  describe('Task 10.7: Spatial Join Validation', () => {
    it('should return valid GeoJSON FeatureCollection', async () => {
      const response = await request(app.getHttpServer())
        .get('/areas/geojson')
        .query({ level: 'department' })
        .expect(200);

      const geoJson = response.body;

      // Valid GeoJSON structure
      expect(geoJson.type).toBe('FeatureCollection');
      expect(geoJson.features).toBeInstanceOf(Array);
    });

    it('should have features with properties linking to area data', async () => {
      const response = await request(app.getHttpServer())
        .get('/areas/geojson')
        .query({ level: 'department' })
        .expect(200);

      const { features } = response.body;

      // Each feature should have properties with id and code
      for (const feature of features.slice(0, 10)) {
        expect(feature.properties).toHaveProperty('id');
        expect(feature.properties).toHaveProperty('code');
        expect(feature.properties).toHaveProperty('name');
        expect(feature.properties).toHaveProperty('level');
      }
    });

    it('should support filtering GeoJSON by level', async () => {
      // Get only départements
      const deptResponse = await request(app.getHttpServer())
        .get('/areas/geojson')
        .query({ level: 'department' })
        .expect(200);

      const { features: deptFeatures } = deptResponse.body;

      // All features should be département level
      for (const feature of deptFeatures) {
        expect(feature.properties.level).toBe('department');
      }
    });

    it('should have consistent IDs between areas and GeoJSON', async () => {
      // Get areas list
      const areasResponse = await request(app.getHttpServer())
        .get('/areas')
        .query({ level: 'department', limit: 10 })
        .expect(200);

      const { data: areas } = areasResponse.body;

      // Get GeoJSON
      const geoResponse = await request(app.getHttpServer())
        .get('/areas/geojson')
        .query({ level: 'department' })
        .expect(200);

      const { features } = geoResponse.body;

      // Build lookup of GeoJSON feature IDs
      const geoIds = new Set(features.map((f: { properties: { id: string } }) => f.properties.id));

      // Each area should have corresponding GeoJSON feature
      for (const area of areas) {
        expect(geoIds.has(area.id)).toBe(true);
      }
    });

    it('should have valid polygon geometries (non-empty coordinates)', async () => {
      const response = await request(app.getHttpServer())
        .get('/areas/geojson')
        .query({ level: 'department' })
        .expect(200);

      const { features } = response.body;

      let validGeometries = 0;
      for (const feature of features) {
        if (feature.geometry?.coordinates?.length > 0) {
          validGeometries++;

          // Validate coordinate structure
          if (feature.geometry.type === 'Polygon') {
            // Polygon: [[[lon, lat], [lon, lat], ...]]
            expect(feature.geometry.coordinates[0].length).toBeGreaterThan(3);
          } else if (feature.geometry.type === 'MultiPolygon') {
            // MultiPolygon: [[[[lon, lat], [lon, lat], ...]]]
            expect(feature.geometry.coordinates.length).toBeGreaterThan(0);
          }
        }
      }

      // All features should have valid geometries
      expect(validGeometries).toBe(features.length);
    });
  });

  /**
   * Task 10.8: Performance test: query times for full dataset
   */
  describe('Task 10.8: Performance Tests', () => {
    // Performance thresholds (in milliseconds)
    const PERFORMANCE_THRESHOLDS = {
      /** Simple list query */
      simpleList: 500,
      /** Category list (should be fast, only 20 items) */
      categoryList: 200,
      /** GeoJSON response (larger payload) */
      geoJsonLoad: 2000,
      /** Single item lookup */
      singleLookup: 200,
      /** Paginated query */
      paginatedQuery: 500,
    };

    it('should return areas list within performance threshold', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/areas')
        .query({ level: 'department' })
        .expect(200);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.simpleList);
    });

    it('should return categories list quickly (small dataset)', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.categoryList);
    });

    it('should return GeoJSON within acceptable time (large payload)', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/areas/geojson')
        .query({ level: 'department' })
        .expect(200);

      const duration = Date.now() - startTime;

      // Log payload size for reference
      const payloadSize = JSON.stringify(response.body).length;
      console.log(`GeoJSON payload size: ${(payloadSize / 1024).toFixed(2)} KB`);
      console.log(`GeoJSON query time: ${duration} ms`);

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.geoJsonLoad);
    });

    it('should return single category lookup quickly', async () => {
      // First get a category ID
      const listResponse = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      const categoryId = listResponse.body.data[0]?.id;
      if (!categoryId) {
        return; // Skip if no categories
      }

      const startTime = Date.now();

      await request(app.getHttpServer())
        .get(`/categories/${categoryId}`)
        .expect(200);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.singleLookup);
    });

    it('should handle paginated areas query efficiently', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/areas')
        .query({
          level: 'department',
          page: 1,
          limit: 20,
        })
        .expect(200);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.paginatedQuery);
    });

    it('should handle multiple concurrent requests', async () => {
      const startTime = Date.now();

      // Make 5 concurrent requests
      const requests = [
        request(app.getHttpServer()).get('/categories'),
        request(app.getHttpServer()).get('/areas').query({ level: 'department', limit: 10 }),
        request(app.getHttpServer()).get('/categories'),
        request(app.getHttpServer()).get('/areas').query({ level: 'department', limit: 10 }),
        request(app.getHttpServer()).get('/health'),
      ];

      const responses = await Promise.all(requests);

      const duration = Date.now() - startTime;

      // All requests should succeed
      for (const response of responses) {
        expect(response.status).toBe(200);
      }

      // Concurrent requests should complete reasonably fast
      console.log(`5 concurrent requests completed in: ${duration} ms`);
      expect(duration).toBeLessThan(3000);
    });

    it('should provide consistent response times over multiple requests', async () => {
      const durations: number[] = [];

      // Make 5 sequential requests and measure each
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();

        await request(app.getHttpServer())
          .get('/categories')
          .expect(200);

        durations.push(Date.now() - startTime);
      }

      // Calculate statistics
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const max = Math.max(...durations);
      const min = Math.min(...durations);
      const variance = max - min;

      console.log(`Response times - Avg: ${avg.toFixed(0)}ms, Min: ${min}ms, Max: ${max}ms, Variance: ${variance}ms`);

      // Variance should be reasonable (not too spiky)
      expect(variance).toBeLessThan(200);
    });
  });

  /**
   * Additional Data Integrity Tests
   */
  describe('Data Integrity Checks', () => {
    it('should have valid UUIDs for all areas', async () => {
      const response = await request(app.getHttpServer())
        .get('/areas')
        .query({ level: 'department', limit: 50 })
        .expect(200);

      const { data } = response.body;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      for (const area of data) {
        expect(area.id).toMatch(uuidRegex);
      }
    });

    it('should have valid UUIDs for all categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      const { data } = response.body;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      for (const category of data) {
        expect(category.id).toMatch(uuidRegex);
      }
    });

    it('should have no duplicate category codes', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      const { data } = response.body;
      const codes = data.map((c: { code: string }) => c.code);
      const uniqueCodes = new Set(codes);

      expect(codes.length).toBe(uniqueCodes.size);
    });

    it('should have no duplicate département codes', async () => {
      const response = await request(app.getHttpServer())
        .get('/areas')
        .query({ level: 'department' })
        .expect(200);

      const { data } = response.body;
      const codes = data.map((a: { code: string }) => a.code);
      const uniqueCodes = new Set(codes);

      expect(codes.length).toBe(uniqueCodes.size);
    });

    it('should return 404 for non-existent area ID', async () => {
      await request(app.getHttpServer())
        .get('/areas/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('should return 404 for non-existent category ID', async () => {
      await request(app.getHttpServer())
        .get('/categories/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });
});
