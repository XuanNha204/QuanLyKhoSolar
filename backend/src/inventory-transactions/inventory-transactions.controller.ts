import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueryTransactionsDto } from './dto/transaction.dto.js';
import { InventoryTransactionsService } from './inventory-transactions.service.js';

@ApiTags('Inventory Transactions')
@ApiBearerAuth()
@Controller('inventory-transactions')
export class InventoryTransactionsController {
  constructor(private readonly service: InventoryTransactionsService) {}
  @Get() list(@Query() query: QueryTransactionsDto) {
    return this.service.list(query);
  }
}
