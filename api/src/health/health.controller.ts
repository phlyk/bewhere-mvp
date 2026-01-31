import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheckResponseDto } from './dto/health-check-response.dto';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    type: HealthCheckResponseDto,
  })
  async check(): Promise<HealthCheckResponseDto> {
    return this.healthService.check();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check (includes database)' })
  @ApiResponse({
    status: 200,
    description: 'Service is ready',
    type: HealthCheckResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Service is not ready',
  })
  async ready(): Promise<HealthCheckResponseDto> {
    return this.healthService.checkReady();
  }
}
