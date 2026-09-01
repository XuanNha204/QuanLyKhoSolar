import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { ClientSession, Model, PipelineStage } from 'mongoose';
import { ReferenceType, TransactionType } from '../common/enums/domain.enum.js';
import { paginationMeta } from '../common/utils/query.util.js';
import { QueryTransactionsDto } from './dto/transaction.dto.js';
import { InventoryTransaction } from './schemas/inventory-transaction.schema.js';

export interface CreateTransactionInput {
  productId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  type: TransactionType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  referenceType: ReferenceType;
  referenceId: Types.ObjectId;
  note?: string;
  createdBy: Types.ObjectId;
}

@Injectable()
export class InventoryTransactionsService {
  constructor(
    @InjectModel(InventoryTransaction.name)
    private readonly model: Model<InventoryTransaction>,
  ) {}
  create(input: CreateTransactionInput, session: ClientSession) {
    return this.model.create([input], { session }).then(([doc]) => doc);
  }
  async list(q: QueryTransactionsDto) {
    const match: Record<string, unknown> = {};
    if (q.productId) match.productId = new Types.ObjectId(q.productId);
    if (q.warehouseId) match.warehouseId = new Types.ObjectId(q.warehouseId);
    if (q.type) match.type = q.type;
    const pipeline: PipelineStage[] = [
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
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'creator',
        },
      },
      { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
    ];
    if (q.search)
      pipeline.push({
        $match: {
          $or: [
            { 'product.name': { $regex: q.search, $options: 'i' } },
            { 'product.sku': { $regex: q.search, $options: 'i' } },
          ],
        },
      });
    pipeline.push({ $sort: { createdAt: q.sortOrder === 'asc' ? 1 : -1 } });
    const count = [...pipeline, { $count: 'total' } as PipelineStage];
    pipeline.push({ $skip: (q.page - 1) * q.limit }, { $limit: q.limit });
    const [data, totals] = await Promise.all([
      this.model.aggregate(pipeline).exec(),
      this.model.aggregate(count).exec(),
    ]);
    return {
      data,
      meta: paginationMeta(q.page, q.limit, totals[0]?.total ?? 0),
    };
  }
}
