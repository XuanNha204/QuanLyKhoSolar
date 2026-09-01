import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { TransactionType } from '../../common/enums/domain.enum.js';

export class QueryTransactionsDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsMongoId() productId?: string;
  @ApiPropertyOptional() @IsOptional() @IsMongoId() warehouseId?: string;
  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;
}
