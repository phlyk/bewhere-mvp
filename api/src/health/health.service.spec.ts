import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let dataSource: DataSource;

  const mockDataSource = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('check', () => {
    it('should return ok status', async () => {
      const result = await service.check();

      expect(result.status).toBe('ok');
      expect(result.service).toBe('bewhere-api');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('checkReady', () => {
    it('should return ok when database and PostGIS are available', async () => {
      mockDataSource.query.mockResolvedValueOnce([{ '?column?': 1 }]); // SELECT 1
      mockDataSource.query.mockResolvedValueOnce([{ postgis_version: '3.4' }]); // PostGIS_Version

      const result = await service.checkReady();

      expect(result.status).toBe('ok');
      expect(result.checks?.database).toBe('ok');
      expect(result.checks?.postgis).toBe('ok');
    });

    it('should throw ServiceUnavailableException when database is unavailable', async () => {
      mockDataSource.query.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(service.checkReady()).rejects.toThrow(ServiceUnavailableException);
    });

    it('should throw ServiceUnavailableException when PostGIS is not installed', async () => {
      mockDataSource.query.mockResolvedValueOnce([{ '?column?': 1 }]); // SELECT 1 succeeds
      mockDataSource.query.mockRejectedValueOnce(new Error('function postgis_version() does not exist'));

      await expect(service.checkReady()).rejects.toThrow(ServiceUnavailableException);
    });
  });
});
