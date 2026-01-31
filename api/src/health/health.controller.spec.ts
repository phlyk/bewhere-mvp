import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckResponseDto } from './dto/health-check-response.dto';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  const mockHealthService = {
    check: jest.fn(),
    checkReady: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health status', async () => {
      const expectedResponse: HealthCheckResponseDto = {
        status: 'ok',
        timestamp: '2026-01-31T12:00:00.000Z',
        service: 'bewhere-api',
        version: '0.1.0',
      };

      mockHealthService.check.mockResolvedValue(expectedResponse);

      const result = await controller.check();

      expect(result).toEqual(expectedResponse);
      expect(service.check).toHaveBeenCalled();
    });
  });

  describe('ready', () => {
    it('should return ready status when all checks pass', async () => {
      const expectedResponse: HealthCheckResponseDto = {
        status: 'ok',
        timestamp: '2026-01-31T12:00:00.000Z',
        service: 'bewhere-api',
        version: '0.1.0',
        checks: {
          database: 'ok',
          postgis: 'ok',
        },
      };

      mockHealthService.checkReady.mockResolvedValue(expectedResponse);

      const result = await controller.ready();

      expect(result).toEqual(expectedResponse);
      expect(service.checkReady).toHaveBeenCalled();
    });
  });
});
