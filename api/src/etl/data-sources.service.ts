import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSourceListResponseDto, DataSourceResponseDto } from './dto';
import { DataSource } from './entities';

/**
 * Service for managing data sources.
 */
@Injectable()
export class DataSourcesService {
  constructor(
    @InjectRepository(DataSource)
    private readonly dataSourceRepository: Repository<DataSource>,
  ) {}

  /**
   * Get all active data sources.
   */
  async findAll(): Promise<DataSourceListResponseDto> {
    const [dataSources, total] = await this.dataSourceRepository.findAndCount({
      where: { isActive: true },
      order: { code: 'ASC' },
    });

    return {
      data: dataSources.map((ds) => this.toDto(ds)),
      total,
    };
  }

  /**
   * Convert entity to response DTO.
   */
  private toDto(entity: DataSource): DataSourceResponseDto {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      nameFr: entity.nameFr,
      description: entity.description,
      url: entity.url,
      updateFrequency: entity.updateFrequency,
      provider: entity.provider,
      license: entity.license,
      countryCode: entity.countryCode,
      isActive: entity.isActive,
    };
  }
}
