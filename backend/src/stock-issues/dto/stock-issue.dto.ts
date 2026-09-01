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

export class StockIssueItemDto {
  @ApiProperty() @IsMongoId() productId: string;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) quantity: number;
}
export class CreateStockIssueDto {
  @ApiProperty() @IsMongoId() warehouseId: string;
  @ApiPropertyOptional() @IsOptional() @IsMongoId() projectId?: string;
  @ApiProperty() @Type(() => Date) @IsDate() issueDate: Date;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
  @ApiProperty({ type: [StockIssueItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => StockIssueItemDto)
  items: StockIssueItemDto[];
}
export class QueryStockIssuesDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsMongoId() warehouseId?: string;
  @ApiPropertyOptional() @IsOptional() @IsMongoId() projectId?: string;
  @ApiPropertyOptional({ enum: DocumentStatus })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;
}
