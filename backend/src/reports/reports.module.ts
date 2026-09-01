import { Module } from '@nestjs/common';
import { InventoryTransactionsModule } from '../inventory-transactions/inventory-transactions.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';

@Module({
  imports: [InventoryModule, InventoryTransactionsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
