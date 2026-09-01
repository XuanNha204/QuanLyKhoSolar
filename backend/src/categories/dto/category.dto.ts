import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { EntityStatus } from '../../common/enums/domain.enum.js';

export class CreateCategoryDto {
  @ApiProperty({ example: 'SOLAR_PANEL' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(/^[A-Za-z0-9_-]+$/)
  code: string;

  @ApiProperty({ example: 'Tấm pin năng lượng mặt trời' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class QueryCategoriesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}
