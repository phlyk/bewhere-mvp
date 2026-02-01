import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import { AreasService } from './areas.service';
import {
    AreaDetailResponseDto,
    AreaListQueryDto,
    AreaListResponseDto,
} from './dto';

/**
 * Controller for administrative areas (départements, regions, countries).
 * Provides read-only access to geographic boundaries and metadata.
 */
@ApiTags('areas')
@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  /**
   * Get a list of administrative areas.
   * By default returns all French départements.
   */
  @Get()
  @ApiOperation({
    summary: 'List administrative areas',
    description:
      'Get a list of administrative areas (départements, regions, or countries). ' +
      'By default, returns French départements sorted by code.',
  })
  @ApiOkResponse({
    description: 'List of administrative areas',
    type: AreaListResponseDto,
  })
  async findAll(@Query() query: AreaListQueryDto): Promise<AreaListResponseDto> {
    return this.areasService.findAll(query);
  }

  /**
   * Get all areas as GeoJSON FeatureCollection.
   * Optimized for map visualization (includes geometry).
   */
  @Get('geojson')
  @ApiOperation({
    summary: 'Get areas as GeoJSON',
    description:
      'Get all areas matching the query as a GeoJSON FeatureCollection. ' +
      'Includes geometry for each area. Useful for choropleth map visualization.',
  })
  @ApiOkResponse({
    description: 'GeoJSON FeatureCollection of areas',
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', example: 'FeatureCollection' },
        features: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'Feature' },
              id: { type: 'string' },
              geometry: {
                type: 'object',
                properties: {
                  type: { type: 'string', example: 'MultiPolygon' },
                  coordinates: { type: 'array' },
                },
              },
              properties: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  code: { type: 'string', example: '75' },
                  name: { type: 'string', example: 'Paris' },
                },
              },
            },
          },
        },
      },
    },
  })
  async findAllAsGeoJson(@Query() query: AreaListQueryDto): Promise<GeoJSON.FeatureCollection> {
    return this.areasService.findAllAsGeoJson(query);
  }

  /**
   * Get a single administrative area by ID.
   * Includes geometry for the area.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get area by ID',
    description:
      'Get detailed information about an administrative area, including its geometry.',
  })
  @ApiParam({
    name: 'id',
    description: 'Area UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Administrative area details with geometry',
    type: AreaDetailResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Area not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AreaDetailResponseDto> {
    return this.areasService.findOne(id);
  }
}
