import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryTransactionsModule } from '../inventory-transactions/inventory-transactions.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { ProductsModule } from '../products/products.module.js';
import { SuppliersModule } from '../suppliers/suppliers.module.js';
import { WarehousesModule } from '../warehouses/warehouses.module.js';
import {
  StockReceipt,
  StockReceiptSchema,
} from './schemas/stock-receipt.schema.js';
import { StockReceiptsController } from './stock-receipts.controller.js';
import { StockReceiptsService } from './stock-receipts.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StockReceipt.name, schema: StockReceiptSchema },
    ]),
    ProductsModule,
    SuppliersModule,
    WarehousesModule,
    InventoryModule,
    InventoryTransactionsModule,
  ],
  controllers: [StockReceiptsController],
  providers: [StockReceiptsService],
  exports: [StockReceiptsService, MongooseModule],
})
export class StockReceiptsModule {}
