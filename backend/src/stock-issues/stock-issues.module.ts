import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryTransactionsModule } from '../inventory-transactions/inventory-transactions.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { ProductsModule } from '../products/products.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { WarehousesModule } from '../warehouses/warehouses.module.js';
import { StockIssue, StockIssueSchema } from './schemas/stock-issue.schema.js';
import { StockIssuesController } from './stock-issues.controller.js';
import { StockIssuesService } from './stock-issues.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StockIssue.name, schema: StockIssueSchema },
    ]),
    ProductsModule,
    ProjectsModule,
    WarehousesModule,
    InventoryModule,
    InventoryTransactionsModule,
  ],
  controllers: [StockIssuesController],
  providers: [StockIssuesService],
  exports: [StockIssuesService, MongooseModule],
})
export class StockIssuesModule {}
