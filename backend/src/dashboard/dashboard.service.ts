import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { DocumentStatus, EntityStatus } from '../common/enums/domain.enum.js';
import { InventoryTransaction } from '../inventory-transactions/schemas/inventory-transaction.schema.js';
import { Inventory } from '../inventory/schemas/inventory.schema.js';
import { Product } from '../products/schemas/product.schema.js';
import { StockIssue } from '../stock-issues/schemas/stock-issue.schema.js';
import { StockReceipt } from '../stock-receipts/schemas/stock-receipt.schema.js';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Product.name) private readonly products: Model<Product>,
    @InjectModel(Inventory.name) private readonly inventory: Model<Inventory>,
    @InjectModel(StockReceipt.name)
    private readonly receipts: Model<StockReceipt>,
    @InjectModel(StockIssue.name) private readonly issues: Model<StockIssue>,
    @InjectModel(InventoryTransaction.name)
    private readonly transactions: Model<InventoryTransaction>,
  ) {}

  async overview() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [
      productCount,
      inventoryTotals,
      lowStock,
      receiptCount,
      issueCount,
      monthlyChart,
      categoryDistribution,
      recentTransactions,
    ] = await Promise.all([
      this.products.countDocuments({ status: EntityStatus.ACTIVE }).exec(),
      this.inventory
        .aggregate([
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
            $group: {
              _id: null,
              totalQuantity: { $sum: '$quantity' },
              totalValue: {
                $sum: { $multiply: ['$quantity', '$product.costPrice'] },
              },
            },
          },
        ])
        .exec(),
      this.lowStockPipeline(10),
      this.receipts
        .countDocuments({
          status: DocumentStatus.CONFIRMED,
          receiptDate: { $gte: monthStart },
        })
        .exec(),
      this.issues
        .countDocuments({
          status: DocumentStatus.CONFIRMED,
          issueDate: { $gte: monthStart },
        })
        .exec(),
      this.monthlyMovement(now),
      this.categoryDistribution(),
      this.transactions
        .find()
        .populate('productId', 'sku name unit')
        .populate('warehouseId', 'code name')
        .populate('createdBy', 'fullName')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
        .exec(),
    ]);
    return {
      summary: {
        totalProducts: productCount,
        totalQuantity: inventoryTotals[0]?.totalQuantity ?? 0,
        totalInventoryValue: inventoryTotals[0]?.totalValue ?? 0,
        lowStockProducts: lowStock.total,
        receiptsThisMonth: receiptCount,
        issuesThisMonth: issueCount,
      },
      monthlyMovement: monthlyChart,
      categoryDistribution,
      lowStock: lowStock.data,
      recentTransactions,
    };
  }

  async lowStock(limit = 50) {
    return (await this.lowStockPipeline(limit)).data;
  }

  private async lowStockPipeline(limit: number) {
    const rows = await this.products
      .aggregate([
        { $match: { status: EntityStatus.ACTIVE } },
        {
          $lookup: {
            from: 'inventories',
            localField: '_id',
            foreignField: 'productId',
            as: 'inventoryRows',
          },
        },
        { $addFields: { totalStock: { $sum: '$inventoryRows.quantity' } } },
        { $match: { $expr: { $lte: ['$totalStock', '$minStock'] } } },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        { $sort: { totalStock: 1, name: 1 } },
        {
          $facet: {
            data: [
              { $limit: limit },
              {
                $project: {
                  sku: 1,
                  name: 1,
                  unit: 1,
                  minStock: 1,
                  totalStock: 1,
                  category: { code: '$category.code', name: '$category.name' },
                },
              },
            ],
            total: [{ $count: 'value' }],
          },
        },
      ])
      .exec();
    return { data: rows[0]?.data ?? [], total: rows[0]?.total[0]?.value ?? 0 };
  }

  private async monthlyMovement(now: Date) {
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const rows = await this.transactions
      .aggregate([
        {
          $match: {
            createdAt: { $gte: start },
            type: { $in: ['IMPORT', 'EXPORT'] },
          },
        },
        {
          $group: {
            _id: {
              month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
              type: '$type',
            },
            quantity: { $sum: { $abs: '$quantity' } },
          },
        },
      ])
      .exec();
    const map = new Map(
      rows.map((row) => [`${row._id.month}-${row._id.type}`, row.quantity]),
    );
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return {
        month,
        imports: map.get(`${month}-IMPORT`) ?? 0,
        exports: map.get(`${month}-EXPORT`) ?? 0,
      };
    });
  }

  private categoryDistribution() {
    return this.inventory
      .aggregate([
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
            from: 'categories',
            localField: 'product.categoryId',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: '$category' },
        {
          $group: {
            _id: '$category._id',
            name: { $first: '$category.name' },
            quantity: { $sum: '$quantity' },
          },
        },
        { $sort: { quantity: -1 } },
      ])
      .exec();
  }
}
