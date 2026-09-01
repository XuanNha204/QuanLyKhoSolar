import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { ClientSession, Model, PipelineStage } from 'mongoose';
import { paginationMeta } from '../common/utils/query.util.js';
import { QueryInventoryDto } from './dto/inventory.dto.js';
import { Inventory } from './schemas/inventory.schema.js';

export interface InventorySnapshot {
  id: string;
  quantity: number;
  version: number;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Inventory.name) private readonly model: Model<Inventory>,
  ) {}

  async list(query: QueryInventoryDto) {
    const match: Record<string, unknown> = {};
    if (query.productId) match.productId = new Types.ObjectId(query.productId);
    if (query.warehouseId)
      match.warehouseId = new Types.ObjectId(query.warehouseId);
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
    ];
    if (query.search)
      pipeline.push({
        $match: {
          $or: [
            { 'product.name': { $regex: query.search, $options: 'i' } },
            { 'product.sku': { $regex: query.search, $options: 'i' } },
            { 'warehouse.name': { $regex: query.search, $options: 'i' } },
          ],
        },
      });
    if (query.lowStock)
      pipeline.push({
        $match: { $expr: { $lte: ['$quantity', '$product.minStock'] } },
      });
    pipeline.push({ $sort: { updatedAt: query.sortOrder === 'asc' ? 1 : -1 } });
    const countPipeline = [...pipeline, { $count: 'total' } as PipelineStage];
    pipeline.push(
      { $skip: (query.page - 1) * query.limit },
      { $limit: query.limit },
    );
    const [data, count] = await Promise.all([
      this.model.aggregate(pipeline).exec(),
      this.model.aggregate(countPipeline).exec(),
    ]);
    return {
      data,
      meta: paginationMeta(query.page, query.limit, count[0]?.total ?? 0),
    };
  }

  async findOne(
    productId: string,
    warehouseId: string,
  ): Promise<InventorySnapshot> {
    const item = await this.model
      .findOne({
        productId: new Types.ObjectId(productId),
        warehouseId: new Types.ObjectId(warehouseId),
      })
      .lean()
      .exec();
    if (!item)
      throw new NotFoundException({
        code: 'INVENTORY_NOT_FOUND',
        message: 'Không tìm thấy tồn kho của sản phẩm tại kho này.',
      });
    return {
      id: String(item._id),
      quantity: item.quantity,
      version: item.version,
    };
  }

  async increase(
    productId: Types.ObjectId,
    warehouseId: Types.ObjectId,
    quantity: number,
    session: ClientSession,
  ) {
    return this.model
      .findOneAndUpdate(
        { productId, warehouseId },
        {
          $inc: { quantity, version: 1 },
          $setOnInsert: { productId, warehouseId },
        },
        {
          upsert: true,
          returnDocument: 'after',
          session,
          setDefaultsOnInsert: true,
        },
      )
      .exec();
  }

  async decrease(
    productId: Types.ObjectId,
    warehouseId: Types.ObjectId,
    quantity: number,
    session: ClientSession,
  ) {
    const updated = await this.model
      .findOneAndUpdate(
        { productId, warehouseId, quantity: { $gte: quantity } },
        { $inc: { quantity: -quantity, version: 1 } },
        { returnDocument: 'after', session },
      )
      .exec();
    if (!updated) {
      throw new BadRequestException({
        code: 'INSUFFICIENT_INVENTORY',
        message: 'Số lượng tồn kho không đủ.',
      });
    }
    return updated;
  }

  async adjustWithVersion(
    inventoryId: Types.ObjectId,
    expectedVersion: number,
    actualQuantity: number,
    session: ClientSession,
  ) {
    const updated = await this.model
      .findOneAndUpdate(
        { _id: inventoryId, version: expectedVersion },
        { $set: { quantity: actualQuantity }, $inc: { version: 1 } },
        { returnDocument: 'after', session },
      )
      .exec();
    if (!updated) {
      throw new ConflictException({
        code: 'STALE_STOCK_CHECK',
        message:
          'Tồn kho đã thay đổi sau khi lập phiếu kiểm kê. Vui lòng lập lại phiếu.',
      });
    }
    return updated;
  }

  async snapshots(warehouseId: string, productIds: string[]) {
    const docs = await this.model
      .find({
        warehouseId: new Types.ObjectId(warehouseId),
        productId: { $in: productIds.map((id) => new Types.ObjectId(id)) },
      })
      .lean()
      .exec();
    const map = new Map(docs.map((doc) => [String(doc.productId), doc]));
    const missing = productIds.filter((id) => !map.has(id));
    if (missing.length)
      throw new NotFoundException({
        code: 'INVENTORY_NOT_FOUND',
        message: 'Có sản phẩm chưa tồn tại trong kho được kiểm kê.',
      });
    return map;
  }
}
