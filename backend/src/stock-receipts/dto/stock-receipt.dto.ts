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
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { DocumentStatus } from '../../common/enums/domain.enum.js';

export class StockReceiptItemDto {
  @ApiProperty() @IsMongoId() productId: string;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) quantity: number;
  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;
}
export class CreateStockReceiptDto {
  @ApiProperty() @IsMongoId() supplierId: string;
  @ApiProperty() @IsMongoId() warehouseId: string;
  @ApiProperty() @Type(() => Date) @IsDate() receiptDate: Date;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
  @ApiProperty({ type: [StockReceiptItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => StockReceiptItemDto)
  items: StockReceiptItemDto[];
}
export class QueryStockReceiptsDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsMongoId() warehouseId?: string;
  @ApiPropertyOptional() @IsOptional() @IsMongoId() supplierId?: string;
  @ApiPropertyOptional({ enum: DocumentStatus })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;
}
