import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueryInventoryDto } from './dto/inventory.dto.js';
import { InventoryService } from './inventory.service.js';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}
  @Get() list(@Query() query: QueryInventoryDto) {
    return this.service.list(query);
  }
  @Get(':warehouseId/:productId') findOne(
    @Param('productId') productId: string,
    @Param('warehouseId') warehouseId: string,
  ) {
    return this.service.findOne(productId, warehouseId);
  }
}
