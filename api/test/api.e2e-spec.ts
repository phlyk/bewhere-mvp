import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { AdministrativeArea, AdminLevel } from '../src/areas/entities';
import {
    CrimeCategory,
    CrimeCategoryGroup,
    CrimeObservation,
    CrimeSeverity,
    TimeGranularity,
} from '../src/crimes/entities';
import { DataSource as DataSourceEntity, UpdateFrequency } from '../src/etl/entities';

/**
 * API Integration Tests
 *
 * Tests all read-only API endpoints for the BeWhere MVP.
 * Uses actual database connection with test data setup/teardown.
 */
describe('API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let areaRepository: Repository<AdministrativeArea>;
  let categoryRepository: Repository<CrimeCategory>;
  let dataSourceRepository: Repository<DataSourceEntity>;
  let observationRepository: Repository<CrimeObservation>;

  // Test data IDs for cleanup and assertions
  let testAreaParis: AdministrativeArea;
  let testAreaMarseille: AdministrativeArea;
  let testCategory: CrimeCategory;
  let testDataSource: DataSourceEntity;
  let testObservation: CrimeObservation;

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
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();

    // Get database connection and repositories
    dataSource = moduleFixture.get<DataSource>(DataSource);
    areaRepository = dataSource.getRepository(AdministrativeArea);
    categoryRepository = dataSource.getRepository(CrimeCategory);
    dataSourceRepository = dataSource.getRepository(DataSourceEntity);
    observationRepository = dataSource.getRepository(CrimeObservation);

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await app.close();
  });

  /**
   * Setup test data for integration tests.
   */
  async function setupTestData() {
    // Create test areas (départements)
    testAreaParis = await areaRepository.save({
      code: 'TEST-75',
      name: 'Paris (Test)',
      nameEn: 'Paris (Test)',
      level: AdminLevel.DEPARTMENT,
      parentCode: 'IDF',
      countryCode: 'FR',
      areaKm2: 105.4,
      geometry: {
        type: 'MultiPolygon',
        coordinates: [[[[2.22, 48.81], [2.47, 48.81], [2.47, 48.90], [2.22, 48.90], [2.22, 48.81]]]],
      },
    });

    testAreaMarseille = await areaRepository.save({
      code: 'TEST-13',
      name: 'Bouches-du-Rhône (Test)',
      nameEn: 'Bouches-du-Rhône (Test)',
      level: AdminLevel.DEPARTMENT,
      parentCode: 'PACA',
      countryCode: 'FR',
      areaKm2: 5087.0,
      geometry: null, // Test area without geometry
    });

    // Create test category
    testCategory = await categoryRepository.save({
      code: 'TEST_BURGLARY',
      name: 'Burglary (Test)',
      nameFr: 'Cambriolage (Test)',
      description: 'Test burglary category',
      severity: CrimeSeverity.MEDIUM,
      categoryGroup: CrimeCategoryGroup.PROPERTY_CRIMES,
      sortOrder: 999,
      isActive: true,
    });

    // Create test data source
    testDataSource = await dataSourceRepository.save({
      code: 'TEST_SOURCE',
      name: 'Test Data Source',
      nameFr: 'Source de Test',
      description: 'Test data source for e2e tests',
      url: 'https://example.com/test',
      provider: 'Test Provider',
      countryCode: 'FR',
      updateFrequency: UpdateFrequency.YEARLY,
      dataStartYear: 2020,
      dataEndYear: 2023,
      isActive: true,
    });

    // Create test observation
    testObservation = await observationRepository.save({
      area: testAreaParis,
      category: testCategory,
      dataSource: testDataSource,
      year: 2022,
      month: null,
      granularity: TimeGranularity.YEARLY,
      count: 5000,
      ratePer100k: 225.5,
      populationUsed: 2220000,
      isValidated: true,
    });
  }

  /**
   * Cleanup test data after all tests.
   */
  async function cleanupTestData() {
    // Delete in reverse order of dependencies
    if (testObservation?.id) {
      await observationRepository.delete({ id: testObservation.id });
    }
    if (testDataSource?.id) {
      await dataSourceRepository.delete({ id: testDataSource.id });
    }
    if (testCategory?.id) {
      await categoryRepository.delete({ id: testCategory.id });
    }
    if (testAreaParis?.id) {
      await areaRepository.delete({ id: testAreaParis.id });
    }
    if (testAreaMarseille?.id) {
      await areaRepository.delete({ id: testAreaMarseille.id });
    }
  }

  // ============================================================
  // AREAS CONTROLLER TESTS
  // ============================================================

  describe('AreasController', () => {
    describe('GET /areas', () => {
      it('should return list of areas', async () => {
        const response = await request(app.getHttpServer())
          .get('/areas')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('total');
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should filter by administrative level', async () => {
        const response = await request(app.getHttpServer())
          .get('/areas')
          .query({ level: 'department' })
          .expect(200);

        expect(response.body.data).toBeDefined();
        // All returned areas should be departments
        response.body.data.forEach((area: any) => {
          expect(area.level).toBe('department');
        });
      });

      it('should filter by country code', async () => {
        const response = await request(app.getHttpServer())
          .get('/areas')
          .query({ countryCode: 'FR' })
          .expect(200);

        expect(response.body.data).toBeDefined();
        response.body.data.forEach((area: any) => {
          expect(area.countryCode).toBe('FR');
        });
      });

      it('should reject invalid level enum value', async () => {
        await request(app.getHttpServer())
          .get('/areas')
          .query({ level: 'invalid_level' })
          .expect(400);
      });
    });

    describe('GET /areas/geojson', () => {
      it('should return GeoJSON FeatureCollection', async () => {
        const response = await request(app.getHttpServer())
          .get('/areas/geojson')
          .expect(200);

        expect(response.body).toHaveProperty('type', 'FeatureCollection');
        expect(response.body).toHaveProperty('features');
        expect(Array.isArray(response.body.features)).toBe(true);
      });

      it('should include geometry in features', async () => {
        const response = await request(app.getHttpServer())
          .get('/areas/geojson')
          .expect(200);

        // Features with geometry should have proper structure
        const featuresWithGeometry = response.body.features.filter(
          (f: any) => f.geometry !== null,
        );
        featuresWithGeometry.forEach((feature: any) => {
          expect(feature.type).toBe('Feature');
          expect(feature.geometry).toHaveProperty('type');
          expect(feature.geometry).toHaveProperty('coordinates');
          expect(feature.properties).toHaveProperty('code');
          expect(feature.properties).toHaveProperty('name');
        });
      });
    });

    describe('GET /areas/:id', () => {
      it('should return area by ID with geometry', async () => {
        const response = await request(app.getHttpServer())
          .get(`/areas/${testAreaParis.id}`)
          .expect(200);

        expect(response.body.id).toBe(testAreaParis.id);
        expect(response.body.code).toBe('TEST-75');
        expect(response.body.name).toBe('Paris (Test)');
        expect(response.body.geometry).toBeDefined();
        expect(response.body.geometry.type).toBe('MultiPolygon');
      });

      it('should return 404 for non-existent area', async () => {
        await request(app.getHttpServer())
          .get('/areas/00000000-0000-0000-0000-000000000000')
          .expect(404);
      });

      it('should return 400 for invalid UUID', async () => {
        await request(app.getHttpServer())
          .get('/areas/not-a-uuid')
          .expect(400);
      });
    });
  });

  // ============================================================
  // CATEGORIES CONTROLLER TESTS
  // ============================================================

  describe('CategoriesController', () => {
    describe('GET /categories', () => {
      it('should return list of categories', async () => {
        const response = await request(app.getHttpServer())
          .get('/categories')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('total');
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should filter by severity', async () => {
        const response = await request(app.getHttpServer())
          .get('/categories')
          .query({ severity: 'medium' })
          .expect(200);

        expect(response.body.data).toBeDefined();
        response.body.data.forEach((category: any) => {
          expect(category.severity).toBe('medium');
        });
      });

      it('should filter by category group', async () => {
        const response = await request(app.getHttpServer())
          .get('/categories')
          .query({ categoryGroup: 'property_crimes' })
          .expect(200);

        expect(response.body.data).toBeDefined();
        response.body.data.forEach((category: any) => {
          expect(category.categoryGroup).toBe('property_crimes');
        });
      });

      it('should filter by isActive', async () => {
        const response = await request(app.getHttpServer())
          .get('/categories')
          .query({ isActive: true })
          .expect(200);

        expect(response.body.data).toBeDefined();
        response.body.data.forEach((category: any) => {
          expect(category.isActive).toBe(true);
        });
      });

      it('should include French names in response', async () => {
        const response = await request(app.getHttpServer())
          .get('/categories')
          .expect(200);

        // At least the test category should have nameFr
        const testCat = response.body.data.find(
          (c: any) => c.code === 'TEST_BURGLARY',
        );
        if (testCat) {
          expect(testCat.nameFr).toBe('Cambriolage (Test)');
        }
      });
    });

    describe('GET /categories/:id', () => {
      it('should return category by ID', async () => {
        const response = await request(app.getHttpServer())
          .get(`/categories/${testCategory.id}`)
          .expect(200);

        expect(response.body.id).toBe(testCategory.id);
        expect(response.body.code).toBe('TEST_BURGLARY');
        expect(response.body.name).toBe('Burglary (Test)');
        expect(response.body.severity).toBe('medium');
        expect(response.body.categoryGroup).toBe('property_crimes');
      });

      it('should return 404 for non-existent category', async () => {
        await request(app.getHttpServer())
          .get('/categories/00000000-0000-0000-0000-000000000000')
          .expect(404);
      });

      it('should return 400 for invalid UUID', async () => {
        await request(app.getHttpServer())
          .get('/categories/not-a-uuid')
          .expect(400);
      });
    });
  });

  // ============================================================
  // OBSERVATIONS CONTROLLER TESTS
  // ============================================================

  describe('ObservationsController', () => {
    describe('GET /observations', () => {
      it('should return paginated list of observations', async () => {
        const response = await request(app.getHttpServer())
          .get('/observations')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('meta');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.meta).toHaveProperty('page');
        expect(response.body.meta).toHaveProperty('limit');
        expect(response.body.meta).toHaveProperty('total');
        expect(response.body.meta).toHaveProperty('totalPages');
        expect(response.body.meta).toHaveProperty('hasNextPage');
        expect(response.body.meta).toHaveProperty('hasPrevPage');
      });

      it('should filter by year', async () => {
        const response = await request(app.getHttpServer())
          .get('/observations')
          .query({ year: 2022 })
          .expect(200);

        expect(response.body.data).toBeDefined();
        response.body.data.forEach((obs: any) => {
          expect(obs.year).toBe(2022);
        });
      });

      it('should filter by year range', async () => {
        const response = await request(app.getHttpServer())
          .get('/observations')
          .query({ yearFrom: 2020, yearTo: 2023 })
          .expect(200);

        expect(response.body.data).toBeDefined();
        response.body.data.forEach((obs: any) => {
          expect(obs.year).toBeGreaterThanOrEqual(2020);
          expect(obs.year).toBeLessThanOrEqual(2023);
        });
      });

      it('should filter by areaId', async () => {
        const response = await request(app.getHttpServer())
          .get('/observations')
          .query({ areaId: testAreaParis.id })
          .expect(200);

        expect(response.body.data).toBeDefined();
        response.body.data.forEach((obs: any) => {
          expect(obs.area.id).toBe(testAreaParis.id);
        });
      });

      it('should filter by categoryId', async () => {
        const response = await request(app.getHttpServer())
          .get('/observations')
          .query({ categoryId: testCategory.id })
          .expect(200);

        expect(response.body.data).toBeDefined();
        response.body.data.forEach((obs: any) => {
          expect(obs.category.id).toBe(testCategory.id);
        });
      });

      it('should filter by dataSourceId', async () => {
        const response = await request(app.getHttpServer())
          .get('/observations')
          .query({ dataSourceId: testDataSource.id })
          .expect(200);

        expect(response.body.data).toBeDefined();
        response.body.data.forEach((obs: any) => {
          expect(obs.dataSource.id).toBe(testDataSource.id);
        });
      });

      it('should paginate results', async () => {
        const response = await request(app.getHttpServer())
          .get('/observations')
          .query({ page: 1, limit: 5 })
          .expect(200);

        expect(response.body.meta.page).toBe(1);
        expect(response.body.meta.limit).toBe(5);
        expect(response.body.data.length).toBeLessThanOrEqual(5);
      });

      it('should reject invalid year values', async () => {
        await request(app.getHttpServer())
          .get('/observations')
          .query({ year: 1800 }) // Below minimum
          .expect(400);
      });

      it('should include nested area, category, dataSource in response', async () => {
        const response = await request(app.getHttpServer())
          .get('/observations')
          .query({ areaId: testAreaParis.id })
          .expect(200);

        if (response.body.data.length > 0) {
          const obs = response.body.data[0];
          expect(obs.area).toHaveProperty('id');
          expect(obs.area).toHaveProperty('code');
          expect(obs.area).toHaveProperty('name');
          expect(obs.category).toHaveProperty('id');
          expect(obs.category).toHaveProperty('code');
          expect(obs.dataSource).toHaveProperty('id');
          expect(obs.dataSource).toHaveProperty('code');
        }
      });
    });

    describe('GET /observations/:id', () => {
      it('should return observation by ID', async () => {
        const response = await request(app.getHttpServer())
          .get(`/observations/${testObservation.id}`)
          .expect(200);

        expect(response.body.id).toBe(testObservation.id);
        expect(response.body.year).toBe(2022);
        expect(response.body.count).toBe(5000);
        expect(response.body.ratePer100k).toBe(225.5);
        expect(response.body.area.id).toBe(testAreaParis.id);
        expect(response.body.category.id).toBe(testCategory.id);
        expect(response.body.dataSource.id).toBe(testDataSource.id);
      });

      it('should return 404 for non-existent observation', async () => {
        await request(app.getHttpServer())
          .get('/observations/00000000-0000-0000-0000-000000000000')
          .expect(404);
      });

      it('should return 400 for invalid UUID', async () => {
        await request(app.getHttpServer())
          .get('/observations/not-a-uuid')
          .expect(400);
      });
    });
  });

  // ============================================================
  // COMPARISON CONTROLLER TESTS
  // ============================================================

  describe('ComparisonController', () => {
    describe('GET /compare/areas', () => {
      it('should compare two areas', async () => {
        const response = await request(app.getHttpServer())
          .get('/compare/areas')
          .query({
            areaCodeA: 'TEST-75',
            areaCodeB: 'TEST-13',
            year: 2022,
          })
          .expect(200);

        expect(response.body).toHaveProperty('areaA');
        expect(response.body).toHaveProperty('areaB');
        expect(response.body).toHaveProperty('year', 2022);
        expect(response.body).toHaveProperty('comparisons');
        expect(response.body.areaA.code).toBe('TEST-75');
        expect(response.body.areaB.code).toBe('TEST-13');
      });

      it('should require areaCodeA', async () => {
        await request(app.getHttpServer())
          .get('/compare/areas')
          .query({
            areaCodeB: 'TEST-13',
            year: 2022,
          })
          .expect(400);
      });

      it('should require areaCodeB', async () => {
        await request(app.getHttpServer())
          .get('/compare/areas')
          .query({
            areaCodeA: 'TEST-75',
            year: 2022,
          })
          .expect(400);
      });

      it('should require year', async () => {
        await request(app.getHttpServer())
          .get('/compare/areas')
          .query({
            areaCodeA: 'TEST-75',
            areaCodeB: 'TEST-13',
          })
          .expect(400);
      });

      it('should return 404 for non-existent area', async () => {
        await request(app.getHttpServer())
          .get('/compare/areas')
          .query({
            areaCodeA: 'NON-EXISTENT',
            areaCodeB: 'TEST-13',
            year: 2022,
          })
          .expect(404);
      });
    });

    describe('GET /compare/years', () => {
      it('should compare two years for an area', async () => {
        const response = await request(app.getHttpServer())
          .get('/compare/years')
          .query({
            areaCode: 'TEST-75',
            yearA: 2021,
            yearB: 2022,
          })
          .expect(200);

        expect(response.body).toHaveProperty('area');
        expect(response.body).toHaveProperty('yearA', 2021);
        expect(response.body).toHaveProperty('yearB', 2022);
        expect(response.body).toHaveProperty('comparisons');
        expect(response.body.area.code).toBe('TEST-75');
      });

      it('should require areaCode', async () => {
        await request(app.getHttpServer())
          .get('/compare/years')
          .query({
            yearA: 2021,
            yearB: 2022,
          })
          .expect(400);
      });

      it('should require yearA', async () => {
        await request(app.getHttpServer())
          .get('/compare/years')
          .query({
            areaCode: 'TEST-75',
            yearB: 2022,
          })
          .expect(400);
      });

      it('should require yearB', async () => {
        await request(app.getHttpServer())
          .get('/compare/years')
          .query({
            areaCode: 'TEST-75',
            yearA: 2021,
          })
          .expect(400);
      });
    });

    describe('GET /compare/sources', () => {
      it('should compare two data sources', async () => {
        // Create a second test data source for comparison
        const testDataSource2 = await dataSourceRepository.save({
          code: 'TEST_SOURCE_2',
          name: 'Test Data Source 2',
          nameFr: 'Source de Test 2',
          description: 'Second test data source for e2e tests',
          url: 'https://example.com/test2',
          provider: 'Test Provider 2',
          countryCode: 'FR',
          updateFrequency: UpdateFrequency.YEARLY,
          dataStartYear: 2020,
          dataEndYear: 2023,
          isActive: true,
        });

        try {
          const response = await request(app.getHttpServer())
            .get('/compare/sources')
            .query({
              sourceCodeA: 'TEST_SOURCE',
              sourceCodeB: 'TEST_SOURCE_2',
              areaCode: 'TEST-75',
              year: 2022,
            })
            .expect(200);

          expect(response.body).toHaveProperty('sourceA');
          expect(response.body).toHaveProperty('sourceB');
          expect(response.body).toHaveProperty('area');
          expect(response.body).toHaveProperty('year', 2022);
          expect(response.body).toHaveProperty('comparisons');
          expect(response.body.sourceA.code).toBe('TEST_SOURCE');
          expect(response.body.sourceB.code).toBe('TEST_SOURCE_2');
        } finally {
          // Cleanup the additional test data source
          await dataSourceRepository.delete({ id: testDataSource2.id });
        }
      });

      it('should require sourceCodeA', async () => {
        await request(app.getHttpServer())
          .get('/compare/sources')
          .query({
            sourceCodeB: 'TEST_SOURCE_2',
            areaCode: 'TEST-75',
            year: 2022,
          })
          .expect(400);
      });

      it('should require sourceCodeB', async () => {
        await request(app.getHttpServer())
          .get('/compare/sources')
          .query({
            sourceCodeA: 'TEST_SOURCE',
            areaCode: 'TEST-75',
            year: 2022,
          })
          .expect(400);
      });

      it('should require areaCode', async () => {
        await request(app.getHttpServer())
          .get('/compare/sources')
          .query({
            sourceCodeA: 'TEST_SOURCE',
            sourceCodeB: 'TEST_SOURCE_2',
            year: 2022,
          })
          .expect(400);
      });

      it('should require year', async () => {
        await request(app.getHttpServer())
          .get('/compare/sources')
          .query({
            sourceCodeA: 'TEST_SOURCE',
            sourceCodeB: 'TEST_SOURCE_2',
            areaCode: 'TEST-75',
          })
          .expect(400);
      });
    });
  });

  // ============================================================
  // VALIDATION TESTS
  // ============================================================

  describe('Request Validation', () => {
    it('should reject unknown query parameters (forbidNonWhitelisted)', async () => {
      await request(app.getHttpServer())
        .get('/areas')
        .query({ unknownParam: 'value' })
        .expect(400);
    });

    it('should transform query string numbers to integers', async () => {
      const response = await request(app.getHttpServer())
        .get('/observations')
        .query({ year: '2022', page: '1', limit: '10' })
        .expect(200);

      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(10);
    });

    it('should validate UUID format for path parameters', async () => {
      // Test various invalid UUID formats
      const invalidUuids = [
        'not-a-uuid',
        '12345',
        '550e8400-e29b-41d4-a716',
        'zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz',
      ];

      for (const invalidUuid of invalidUuids) {
        await request(app.getHttpServer())
          .get(`/areas/${invalidUuid}`)
          .expect(400);
      }
    });

    it('should validate year range in observations query', async () => {
      // Year below minimum (1990)
      await request(app.getHttpServer())
        .get('/observations')
        .query({ year: 1989 })
        .expect(400);

      // Year above maximum (2030)
      await request(app.getHttpServer())
        .get('/observations')
        .query({ year: 2031 })
        .expect(400);
    });
  });

  // ============================================================
  // ERROR HANDLING TESTS
  // ============================================================

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      await request(app.getHttpServer())
        .get('/non-existent-route')
        .expect(404);
    });

    it('should return structured error response for validation errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/observations')
        .query({ year: 'not-a-number' })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return structured error response for not found errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/areas/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');
    });
  });
});
