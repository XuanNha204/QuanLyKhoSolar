import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryTransactionsModule } from '../inventory-transactions/inventory-transactions.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { ProductsModule } from '../products/products.module.js';
import { WarehousesModule } from '../warehouses/warehouses.module.js';
import { StockCheck, StockCheckSchema } from './schemas/stock-check.schema.js';
import { StockChecksController } from './stock-checks.controller.js';
import { StockChecksService } from './stock-checks.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StockCheck.name, schema: StockCheckSchema },
    ]),
    ProductsModule,
    WarehousesModule,
    InventoryModule,
    InventoryTransactionsModule,
  ],
  controllers: [StockChecksController],
  providers: [StockChecksService],
  exports: [StockChecksService, MongooseModule],
})
export class StockChecksModule {}
