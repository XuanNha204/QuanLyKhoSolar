import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../common/enums/domain.enum.js';
import { ReportQueryDto } from './dto/report-query.dto.js';
import { ReportsService } from './reports.service.js';

@ApiTags('Reports')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}
  @Get('inventory-valuation') inventoryValuation(
    @Query() query: ReportQueryDto,
  ) {
    return this.service.inventoryValuation(query);
  }
  @Get('stock-movements') stockMovements(@Query() query: ReportQueryDto) {
    return this.service.stockMovements(query);
  }
}
