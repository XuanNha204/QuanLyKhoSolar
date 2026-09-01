import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { EntityStatus } from '../../common/enums/domain.enum.js';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[A-Za-z0-9._/-]+$/)
  sku: string;
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(200) name: string;
  @ApiProperty() @IsMongoId() categoryId: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  model?: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(40) unit: string;
  @ApiProperty()
  @IsNumber()
  @IsInt()
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  @Transform(({ value }) => Number(value))
  costPrice: number;
  @ApiProperty()
  @IsNumber()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => Number(value))
  minStock: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(240)
  @Transform(({ value }) => Number(value))
  warrantyMonths?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(1000)
  imageUrl?: string;
  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class QueryProductsDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsMongoId() categoryId?: string;
  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}
