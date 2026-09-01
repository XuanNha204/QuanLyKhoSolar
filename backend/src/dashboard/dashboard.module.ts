import { Module } from '@nestjs/common';
import { InventoryTransactionsModule } from '../inventory-transactions/inventory-transactions.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { ProductsModule } from '../products/products.module.js';
import { StockIssuesModule } from '../stock-issues/stock-issues.module.js';
import { StockReceiptsModule } from '../stock-receipts/stock-receipts.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  imports: [
    ProductsModule,
    InventoryModule,
    StockReceiptsModule,
    StockIssuesModule,
    InventoryTransactionsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
