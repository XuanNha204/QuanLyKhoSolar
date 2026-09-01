import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class QueryInventoryDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsMongoId() productId?: string;
  @ApiPropertyOptional() @IsOptional() @IsMongoId() warehouseId?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  lowStock?: boolean;
}
