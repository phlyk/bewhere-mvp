import { Controller, Get, Query } from '@nestjs/common';
import {
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { ComparisonService } from './comparison.service';
import {
    CompareAreasQueryDto,
    CompareAreasResponseDto,
    CompareSourcesQueryDto,
    CompareSourcesResponseDto,
    CompareYearsQueryDto,
    CompareYearsResponseDto,
} from './dto';

/**
 * Controller for comparing crime statistics.
 * Provides endpoints for area-to-area, year-to-year, and source-to-source comparisons.
 */
@ApiTags('crimes')
@Controller('compare')
export class ComparisonController {
  constructor(private readonly comparisonService: ComparisonService) {}

  /**
   * Compare crime statistics between two areas.
   */
  @Get('areas')
  @ApiOperation({
    summary: 'Compare two areas',
    description:
      'Compare crime statistics between two administrative areas for a given year. ' +
      'Returns counts, rates, absolute differences, and percentage changes for each category.',
  })
  @ApiOkResponse({
    description: 'Area comparison results',
    type: CompareAreasResponseDto,
  })
  async compareAreas(@Query() query: CompareAreasQueryDto): Promise<CompareAreasResponseDto> {
    return this.comparisonService.compareAreas(query);
  }

  /**
   * Compare crime statistics between two years.
   */
  @Get('years')
  @ApiOperation({
    summary: 'Compare two years',
    description:
      'Compare crime statistics between two years for a given area. ' +
      'Returns counts, rates, absolute differences, and percentage changes for each category. ' +
      'Useful for year-over-year analysis.',
  })
  @ApiOkResponse({
    description: 'Year comparison results',
    type: CompareYearsResponseDto,
  })
  async compareYears(@Query() query: CompareYearsQueryDto): Promise<CompareYearsResponseDto> {
    return this.comparisonService.compareYears(query);
  }

  /**
   * Compare crime statistics between two data sources.
   */
  @Get('sources')
  @ApiOperation({
    summary: 'Compare two data sources',
    description:
      'Compare crime statistics from two different data sources for the same area and year. ' +
      'Useful for identifying discrepancies between datasets.',
  })
  @ApiOkResponse({
    description: 'Data source comparison results',
    type: CompareSourcesResponseDto,
  })
  async compareSources(@Query() query: CompareSourcesQueryDto): Promise<CompareSourcesResponseDto> {
    return this.comparisonService.compareSources(query);
  }
}
