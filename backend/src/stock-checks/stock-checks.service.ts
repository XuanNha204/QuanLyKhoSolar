import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { Connection, Model, QueryFilter } from 'mongoose';
import {
  DocumentStatus,
  ReferenceType,
  TransactionType,
} from '../common/enums/domain.enum.js';
import {
  generateDocumentCode,
  paginationMeta,
} from '../common/utils/query.util.js';
import { withMongoTransaction } from '../common/utils/mongo-transaction.util.js';
import { InventoryTransactionsService } from '../inventory-transactions/inventory-transactions.service.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { ProductsService } from '../products/products.service.js';
import { WarehousesService } from '../warehouses/warehouses.service.js';
import {
  CreateStockCheckDto,
  QueryStockChecksDto,
} from './dto/stock-check.dto.js';
import { StockCheck } from './schemas/stock-check.schema.js';

@Injectable()
export class StockChecksService {
  constructor(
    @InjectModel(StockCheck.name) private readonly model: Model<StockCheck>,
    @InjectConnection() private readonly connection: Connection,
    private readonly products: ProductsService,
    private readonly warehouses: WarehousesService,
    private readonly inventory: InventoryService,
    private readonly transactions: InventoryTransactionsService,
  ) {}
  async list(q: QueryStockChecksDto) {
    const filter: QueryFilter<StockCheck> = {};
    if (q.warehouseId) filter.warehouseId = new Types.ObjectId(q.warehouseId);
    if (q.status) filter.status = q.status;
    if (q.search) filter.code = { $regex: q.search, $options: 'i' };
    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('warehouseId', 'code name')
        .populate('createdBy', 'fullName')
        .sort({ checkDate: q.sortOrder === 'asc' ? 1 : -1 })
        .skip((q.page - 1) * q.limit)
        .limit(q.limit)
        .lean()
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { data, meta: paginationMeta(q.page, q.limit, total) };
  }
  async findOne(id: string) {
    const doc = await this.model
      .findById(id)
      .populate('warehouseId', 'code name')
      .populate('items.productId', 'sku name unit')
      .populate('createdBy', 'fullName email')
      .lean()
      .exec();
    if (!doc)
      throw new NotFoundException({
        code: 'STOCK_CHECK_NOT_FOUND',
        message: 'Phiếu kiểm kê không tồn tại.',
      });
    return doc;
  }
  async create(dto: CreateStockCheckDto, actorId: string) {
    const ids = dto.items.map((x) => x.productId);
    if (new Set(ids).size !== ids.length)
      throw new ConflictException({
        code: 'DUPLICATE_CHECK_ITEM',
        message: 'Một sản phẩm không được lặp lại trong phiếu kiểm kê.',
      });
    await Promise.all([
      this.warehouses.assertActive(dto.warehouseId),
      this.products.assertActiveMany(ids),
    ]);
    const snapshots = await this.inventory.snapshots(dto.warehouseId, ids);
    const items = dto.items.map((item) => {
      const snapshot = snapshots.get(item.productId)!;
      return {
        inventoryId: snapshot._id,
        productId: new Types.ObjectId(item.productId),
        systemQuantity: snapshot.quantity,
        actualQuantity: item.actualQuantity,
        difference: item.actualQuantity - snapshot.quantity,
        inventoryVersion: snapshot.version,
      };
    });
    return this.model.create({
      code: generateDocumentCode('KK'),
      warehouseId: new Types.ObjectId(dto.warehouseId),
      checkDate: dto.checkDate,
      note: dto.note,
      items,
      status: DocumentStatus.DRAFT,
      createdBy: new Types.ObjectId(actorId),
    });
  }
  async confirm(id: string, actorId: string) {
    await withMongoTransaction(this.connection, async (session) => {
      const check = await this.model
        .findOne({ _id: id, status: DocumentStatus.DRAFT })
        .session(session)
        .exec();
      if (!check)
        throw new ConflictException({
          code: 'INVALID_CHECK_STATUS',
          message: 'Phiếu kiểm kê không tồn tại hoặc đã được xử lý.',
        });
      await this.warehouses.assertActive(String(check.warehouseId), session);
      for (const item of check.items) {
        const updated = await this.inventory.adjustWithVersion(
          item.inventoryId,
          item.inventoryVersion,
          item.actualQuantity,
          session,
        );
        if (item.difference !== 0)
          await this.transactions.create(
            {
              productId: item.productId,
              warehouseId: check.warehouseId,
              type: TransactionType.ADJUSTMENT,
              quantity: item.difference,
              previousQuantity: item.systemQuantity,
              newQuantity: updated.quantity,
              referenceType: ReferenceType.STOCK_CHECK,
              referenceId: check._id,
              note: check.note,
              createdBy: new Types.ObjectId(actorId),
            },
            session,
          );
      }
      check.status = DocumentStatus.CONFIRMED;
      check.confirmedAt = new Date();
      await check.save({ session });
    });
    return { id, status: DocumentStatus.CONFIRMED };
  }
  async cancel(id: string) {
    const doc = await this.model
      .findOneAndUpdate(
        { _id: id, status: DocumentStatus.DRAFT },
        { status: DocumentStatus.CANCELLED },
        { returnDocument: 'after' },
      )
      .exec();
    if (!doc)
      throw new ConflictException({
        code: 'INVALID_CHECK_STATUS',
        message: 'Chỉ có thể hủy phiếu kiểm kê nháp.',
      });
    return doc;
  }
}
