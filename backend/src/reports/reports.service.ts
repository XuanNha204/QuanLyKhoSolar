import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import { InventoryTransaction } from '../inventory-transactions/schemas/inventory-transaction.schema.js';
import { Inventory } from '../inventory/schemas/inventory.schema.js';
import { ReportQueryDto } from './dto/report-query.dto.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Inventory.name) private readonly inventory: Model<Inventory>,
    @InjectModel(InventoryTransaction.name)
    private readonly transactions: Model<InventoryTransaction>,
  ) {}
  inventoryValuation(q: ReportQueryDto) {
    const match = q.warehouseId
      ? { warehouseId: new Types.ObjectId(q.warehouseId) }
      : {};
    return this.inventory
      .aggregate([
        { $match: match },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
        {
          $lookup: {
            from: 'warehouses',
            localField: 'warehouseId',
            foreignField: '_id',
            as: 'warehouse',
          },
        },
        { $unwind: '$warehouse' },
        {
          $project: {
            quantity: 1,
            value: { $multiply: ['$quantity', '$product.costPrice'] },
            product: {
              sku: '$product.sku',
              name: '$product.name',
              unit: '$product.unit',
              costPrice: '$product.costPrice',
            },
            warehouse: { code: '$warehouse.code', name: '$warehouse.name' },
          },
        },
        { $sort: { 'warehouse.name': 1, 'product.name': 1 } },
      ])
      .exec();
  }
  stockMovements(q: ReportQueryDto) {
    const match: Record<string, unknown> = {};
    if (q.warehouseId) match.warehouseId = new Types.ObjectId(q.warehouseId);
    if (q.from || q.to)
      match.createdAt = {
        ...(q.from ? { $gte: q.from } : {}),
        ...(q.to ? { $lte: q.to } : {}),
      };
    return this.transactions
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: '$type',
            transactionCount: { $sum: 1 },
            quantity: { $sum: '$quantity' },
            absoluteQuantity: { $sum: { $abs: '$quantity' } },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();
  }
}
