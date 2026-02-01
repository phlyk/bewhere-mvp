import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import {
    CategoryListQueryDto,
    CategoryListResponseDto,
    CategoryResponseDto,
} from './dto';

/**
 * Controller for crime categories (canonical taxonomy).
 * Provides read-only access to the standardized crime category list.
 */
@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Get a list of crime categories.
   * By default returns all active categories.
   */
  @Get()
  @ApiOperation({
    summary: 'List crime categories',
    description:
      'Get a list of canonical crime categories. ' +
      'By default, returns all active categories sorted by display order.',
  })
  @ApiOkResponse({
    description: 'List of crime categories',
    type: CategoryListResponseDto,
  })
  async findAll(@Query() query: CategoryListQueryDto): Promise<CategoryListResponseDto> {
    return this.categoriesService.findAll(query);
  }

  /**
   * Get a single crime category by ID.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get category by ID',
    description: 'Get detailed information about a specific crime category.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Crime category details',
    type: CategoryResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Category not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CategoryResponseDto> {
    return this.categoriesService.findOne(id);
  }
}
