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
  CreateStockCheckDto,
  QueryStockChecksDto,
} from './dto/stock-check.dto.js';
import { StockChecksService } from './stock-checks.service.js';

@ApiTags('Stock Checks')
@ApiBearerAuth()
@Controller('stock-checks')
export class StockChecksController {
  constructor(private readonly service: StockChecksService) {}
  @Get() list(@Query() query: QueryStockChecksDto) {
    return this.service.list(query);
  }
  @Get(':id') findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER) @Post() create(
    @Body() dto: CreateStockCheckDto,
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
