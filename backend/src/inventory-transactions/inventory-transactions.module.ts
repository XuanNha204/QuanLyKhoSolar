import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryTransactionsController } from './inventory-transactions.controller.js';
import { InventoryTransactionsService } from './inventory-transactions.service.js';
import {
  InventoryTransaction,
  InventoryTransactionSchema,
} from './schemas/inventory-transaction.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InventoryTransaction.name, schema: InventoryTransactionSchema },
    ]),
  ],
  controllers: [InventoryTransactionsController],
  providers: [InventoryTransactionsService],
  exports: [InventoryTransactionsService, MongooseModule],
})
export class InventoryTransactionsModule {}
