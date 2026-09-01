import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthUser } from '../auth/interfaces/auth-user.interface.js';
import { Role } from '../common/enums/domain.enum.js';
import {
  CreateStockReceiptDto,
  QueryStockReceiptsDto,
} from './dto/stock-receipt.dto.js';
import { StockReceiptsService } from './stock-receipts.service.js';

@ApiTags('Stock Receipts')
@ApiBearerAuth()
@Controller('stock-receipts')
export class StockReceiptsController {
  constructor(private readonly service: StockReceiptsService) {}
  @Get() list(@Query() query: QueryStockReceiptsDto) {
    return this.service.list(query);
  }
  @Get(':id') findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER) @Post() create(
    @Body() dto: CreateStockReceiptDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create(dto, user.id);
  }
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER) @Patch(':id/confirm') confirm(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.confirm(id, user.id);
  }
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER) @Patch(':id/cancel') cancel(
    @Param('id') id: string,
  ) {
    return this.service.cancel(id);
  }
}
