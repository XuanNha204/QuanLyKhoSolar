import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { DocumentStatus } from '../../common/enums/domain.enum.js';

export class StockCheckItemDto {
  @ApiProperty() @IsMongoId() productId: string;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(0) actualQuantity: number;
}
export class CreateStockCheckDto {
  @ApiProperty() @IsMongoId() warehouseId: string;
  @ApiProperty() @Type(() => Date) @IsDate() checkDate: Date;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
  @ApiProperty({ type: [StockCheckItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => StockCheckItemDto)
  items: StockCheckItemDto[];
}
export class QueryStockChecksDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsMongoId() warehouseId?: string;
  @ApiPropertyOptional({ enum: DocumentStatus })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;
}
