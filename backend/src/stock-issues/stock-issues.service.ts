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
import { ProjectsService } from '../projects/projects.service.js';
import { WarehousesService } from '../warehouses/warehouses.service.js';
import {
  CreateStockIssueDto,
  QueryStockIssuesDto,
} from './dto/stock-issue.dto.js';
import { StockIssue } from './schemas/stock-issue.schema.js';

@Injectable()
export class StockIssuesService {
  constructor(
    @InjectModel(StockIssue.name) private readonly model: Model<StockIssue>,
    @InjectConnection() private readonly connection: Connection,
    private readonly products: ProductsService,
    private readonly warehouses: WarehousesService,
    private readonly projects: ProjectsService,
    private readonly inventory: InventoryService,
    private readonly transactions: InventoryTransactionsService,
  ) {}
  async list(q: QueryStockIssuesDto) {
    const filter: QueryFilter<StockIssue> = {};
    if (q.warehouseId) filter.warehouseId = new Types.ObjectId(q.warehouseId);
    if (q.projectId) filter.projectId = new Types.ObjectId(q.projectId);
    if (q.status) filter.status = q.status;
    if (q.search) filter.code = { $regex: q.search, $options: 'i' };
    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('warehouseId', 'code name')
        .populate('projectId', 'code name')
        .populate('createdBy', 'fullName')
        .sort({ issueDate: q.sortOrder === 'asc' ? 1 : -1 })
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
      .populate('projectId', 'code name')
      .populate('items.productId', 'sku name unit')
      .populate('createdBy', 'fullName email')
      .lean()
      .exec();
    if (!doc)
      throw new NotFoundException({
        code: 'STOCK_ISSUE_NOT_FOUND',
        message: 'Phiếu xuất không tồn tại.',
      });
    return doc;
  }
  async create(dto: CreateStockIssueDto, actorId: string) {
    this.ensureUniqueProducts(dto.items.map((x) => x.productId));
    await Promise.all([
      this.warehouses.assertActive(dto.warehouseId),
      this.products.assertActiveMany(dto.items.map((x) => x.productId)),
      dto.projectId
        ? this.projects.assertUsable(dto.projectId)
        : Promise.resolve(),
    ]);
    return this.model.create({
      code: generateDocumentCode('PX'),
      warehouseId: new Types.ObjectId(dto.warehouseId),
      projectId: dto.projectId ? new Types.ObjectId(dto.projectId) : undefined,
      issueDate: dto.issueDate,
      note: dto.note,
      items: dto.items.map((x) => ({
        ...x,
        productId: new Types.ObjectId(x.productId),
      })),
      status: DocumentStatus.DRAFT,
      createdBy: new Types.ObjectId(actorId),
    });
  }
  async confirm(id: string, actorId: string) {
    await withMongoTransaction(this.connection, async (session) => {
      const issue = await this.model
        .findOne({ _id: id, status: DocumentStatus.DRAFT })
        .session(session)
        .exec();
      if (!issue)
        throw new ConflictException({
          code: 'INVALID_ISSUE_STATUS',
          message: 'Phiếu xuất không tồn tại hoặc đã được xử lý.',
        });
      await Promise.all([
        this.warehouses.assertActive(String(issue.warehouseId), session),
        this.products.assertActiveMany(
          issue.items.map((x) => String(x.productId)),
          session,
        ),
        issue.projectId
          ? this.projects.assertUsable(String(issue.projectId), session)
          : Promise.resolve(),
      ]);
      for (const item of issue.items) {
        const updated = await this.inventory.decrease(
          item.productId,
          issue.warehouseId,
          item.quantity,
          session,
        );
        await this.transactions.create(
          {
            productId: item.productId,
            warehouseId: issue.warehouseId,
            type: TransactionType.EXPORT,
            quantity: -item.quantity,
            previousQuantity: updated.quantity + item.quantity,
            newQuantity: updated.quantity,
            referenceType: ReferenceType.STOCK_ISSUE,
            referenceId: issue._id,
            note: issue.note,
            createdBy: new Types.ObjectId(actorId),
          },
          session,
        );
      }
      issue.status = DocumentStatus.CONFIRMED;
      issue.confirmedAt = new Date();
      await issue.save({ session });
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
        code: 'INVALID_ISSUE_STATUS',
        message: 'Chỉ có thể hủy phiếu xuất nháp.',
      });
    return doc;
  }
  private ensureUniqueProducts(ids: string[]) {
    if (new Set(ids).size !== ids.length)
      throw new ConflictException({
        code: 'DUPLICATE_ISSUE_ITEM',
        message: 'Một sản phẩm không được lặp lại trong cùng phiếu xuất.',
      });
  }
}
