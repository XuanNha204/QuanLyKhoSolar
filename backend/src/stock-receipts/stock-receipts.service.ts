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
import { SuppliersService } from '../suppliers/suppliers.service.js';
import { WarehousesService } from '../warehouses/warehouses.service.js';
import {
  CreateStockReceiptDto,
  QueryStockReceiptsDto,
} from './dto/stock-receipt.dto.js';
import { StockReceipt } from './schemas/stock-receipt.schema.js';

@Injectable()
export class StockReceiptsService {
  constructor(
    @InjectModel(StockReceipt.name) private readonly model: Model<StockReceipt>,
    @InjectConnection() private readonly connection: Connection,
    private readonly products: ProductsService,
    private readonly suppliers: SuppliersService,
    private readonly warehouses: WarehousesService,
    private readonly inventory: InventoryService,
    private readonly transactions: InventoryTransactionsService,
  ) {}

  async list(q: QueryStockReceiptsDto) {
    const filter: QueryFilter<StockReceipt> = {};
    if (q.warehouseId) filter.warehouseId = new Types.ObjectId(q.warehouseId);
    if (q.supplierId) filter.supplierId = new Types.ObjectId(q.supplierId);
    if (q.status) filter.status = q.status;
    if (q.search) filter.code = { $regex: q.search, $options: 'i' };
    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('supplierId', 'code name')
        .populate('warehouseId', 'code name')
        .populate('createdBy', 'fullName')
        .sort({ receiptDate: q.sortOrder === 'asc' ? 1 : -1 })
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
      .populate('supplierId', 'code name')
      .populate('warehouseId', 'code name')
      .populate('items.productId', 'sku name unit')
      .populate('createdBy', 'fullName email')
      .lean()
      .exec();
    if (!doc)
      throw new NotFoundException({
        code: 'STOCK_RECEIPT_NOT_FOUND',
        message: 'Phiếu nhập không tồn tại.',
      });
    return doc;
  }

  async create(dto: CreateStockReceiptDto, actorId: string) {
    this.ensureUniqueProducts(dto.items.map((x) => x.productId));
    await Promise.all([
      this.suppliers.assertActive(dto.supplierId),
      this.warehouses.assertActive(dto.warehouseId),
      this.products.assertActiveMany(dto.items.map((x) => x.productId)),
    ]);
    const items = dto.items.map((item) => ({
      ...item,
      productId: new Types.ObjectId(item.productId),
      lineTotal: item.quantity * item.unitPrice,
    }));
    return this.model.create({
      code: generateDocumentCode('PN'),
      supplierId: new Types.ObjectId(dto.supplierId),
      warehouseId: new Types.ObjectId(dto.warehouseId),
      receiptDate: dto.receiptDate,
      note: dto.note,
      items,
      totalAmount: items.reduce((sum, item) => sum + item.lineTotal, 0),
      status: DocumentStatus.DRAFT,
      createdBy: new Types.ObjectId(actorId),
    });
  }

  async confirm(id: string, actorId: string) {
    await withMongoTransaction(this.connection, async (session) => {
      const receipt = await this.model
        .findOne({ _id: id, status: DocumentStatus.DRAFT })
        .session(session)
        .exec();
      if (!receipt)
        throw new ConflictException({
          code: 'INVALID_RECEIPT_STATUS',
          message: 'Phiếu nhập không tồn tại hoặc đã được xử lý.',
        });
      await Promise.all([
        this.suppliers.assertActive(String(receipt.supplierId), session),
        this.warehouses.assertActive(String(receipt.warehouseId), session),
        this.products.assertActiveMany(
          receipt.items.map((x) => String(x.productId)),
          session,
        ),
      ]);
      for (const item of receipt.items) {
        const updated = await this.inventory.increase(
          item.productId,
          receipt.warehouseId,
          item.quantity,
          session,
        );
        await this.transactions.create(
          {
            productId: item.productId,
            warehouseId: receipt.warehouseId,
            type: TransactionType.IMPORT,
            quantity: item.quantity,
            previousQuantity: updated.quantity - item.quantity,
            newQuantity: updated.quantity,
            referenceType: ReferenceType.STOCK_RECEIPT,
            referenceId: receipt._id,
            note: receipt.note,
            createdBy: new Types.ObjectId(actorId),
          },
          session,
        );
      }
      receipt.status = DocumentStatus.CONFIRMED;
      receipt.confirmedAt = new Date();
      await receipt.save({ session });
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
        code: 'INVALID_RECEIPT_STATUS',
        message: 'Chỉ có thể hủy phiếu nhập nháp.',
      });
    return doc;
  }

  private ensureUniqueProducts(ids: string[]) {
    if (new Set(ids).size !== ids.length)
      throw new ConflictException({
        code: 'DUPLICATE_RECEIPT_ITEM',
        message: 'Một sản phẩm không được lặp lại trong cùng phiếu nhập.',
      });
  }
}
