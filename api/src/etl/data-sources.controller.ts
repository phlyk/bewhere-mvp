import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DataSourcesService } from './data-sources.service';
import { DataSourceListResponseDto } from './dto';

/**
 * Controller for data sources.
 * Provides read-only access to the list of data sources used in BeWhere.
 */
@ApiTags('data-sources')
@Controller('data-sources')
export class DataSourcesController {
  constructor(private readonly dataSourcesService: DataSourcesService) {}

  /**
   * Get a list of all active data sources.
   */
  @Get()
  @ApiOperation({
    summary: 'List data sources',
    description:
      'Get a list of all active data sources used by BeWhere. ' +
      'Includes metadata about each source such as provider, update frequency, and license.',
  })
  @ApiOkResponse({
    description: 'List of data sources',
    type: DataSourceListResponseDto,
  })
  async findAll(): Promise<DataSourceListResponseDto> {
    return this.dataSourcesService.findAll();
  }
}
