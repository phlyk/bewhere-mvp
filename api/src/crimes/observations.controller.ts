import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import {
    ObservationListQueryDto,
    ObservationListResponseDto,
    ObservationResponseDto,
} from './dto';
import { ObservationsService } from './observations.service';

/**
 * Controller for crime observations (statistics).
 * Provides read-only access to crime counts and rates.
 */
@ApiTags('crimes')
@Controller('observations')
export class ObservationsController {
  constructor(private readonly observationsService: ObservationsService) {}

  /**
   * Get a paginated list of crime observations.
   * Supports filtering by area, category, data source, and year range.
   */
  @Get()
  @ApiOperation({
    summary: 'List crime observations',
    description:
      'Get a paginated list of crime observations. ' +
      'Supports filtering by area (code or ID), category (code or ID), ' +
      'data source (code or ID), and year (exact or range). ' +
      'Returns both count and rate per 100k population.',
  })
  @ApiOkResponse({
    description: 'Paginated list of crime observations',
    type: ObservationListResponseDto,
  })
  async findAll(@Query() query: ObservationListQueryDto): Promise<ObservationListResponseDto> {
    return this.observationsService.findAll(query);
  }

  /**
   * Get a single crime observation by ID.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get observation by ID',
    description: 'Get detailed information about a specific crime observation.',
  })
  @ApiParam({
    name: 'id',
    description: 'Observation UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Crime observation details',
    type: ObservationResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Observation not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ObservationResponseDto> {
    return this.observationsService.findOne(id);
  }
}
