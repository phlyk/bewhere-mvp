import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    CategoryListQueryDto,
    CategoryListResponseDto,
    CategoryResponseDto,
} from './dto';
import { CrimeCategory } from './entities';

/**
 * Service for managing crime categories.
 * Provides read-only access to the canonical crime taxonomy.
 */
@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CrimeCategory)
    private readonly categoryRepository: Repository<CrimeCategory>,
  ) {}

  /**
   * Get a list of crime categories with optional filtering.
   * By default, returns all active categories sorted by sortOrder.
   */
  async findAll(query: CategoryListQueryDto): Promise<CategoryListResponseDto> {
    const { severity, categoryGroup, isActive = true } = query;

    const qb = this.categoryRepository.createQueryBuilder('category');

    // Apply filters
    qb.where('category.isActive = :isActive', { isActive });

    if (severity) {
      qb.andWhere('category.severity = :severity', { severity });
    }

    if (categoryGroup) {
      qb.andWhere('category.categoryGroup = :categoryGroup', { categoryGroup });
    }

    // Order by sortOrder for consistent display
    qb.orderBy('category.sortOrder', 'ASC');

    const [categories, total] = await qb.getManyAndCount();

    const data: CategoryResponseDto[] = categories.map((cat) => ({
      id: cat.id,
      code: cat.code,
      name: cat.name,
      nameFr: cat.nameFr,
      description: cat.description,
      severity: cat.severity,
      categoryGroup: cat.categoryGroup,
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
    }));

    return { data, total };
  }

  /**
   * Get a single crime category by ID.
   */
  async findOne(id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Crime category with ID "${id}" not found`);
    }

    return {
      id: category.id,
      code: category.code,
      name: category.name,
      nameFr: category.nameFr,
      description: category.description,
      severity: category.severity,
      categoryGroup: category.categoryGroup,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    };
  }

  /**
   * Get a crime category by code.
   * Useful for looking up categories by canonical code (e.g., 'HOMICIDE').
   */
  async findByCode(code: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { code },
    });

    if (!category) {
      throw new NotFoundException(`Crime category with code "${code}" not found`);
    }

    return {
      id: category.id,
      code: category.code,
      name: category.name,
      nameFr: category.nameFr,
      description: category.description,
      severity: category.severity,
      categoryGroup: category.categoryGroup,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    };
  }
}
