import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { Model, QueryFilter } from 'mongoose';
import { CategoriesService } from '../categories/categories.service.js';
import { EntityStatus } from '../common/enums/domain.enum.js';
import {
  escapeRegex,
  normalizeCode,
  paginationMeta,
} from '../common/utils/query.util.js';
import {
  CreateProductDto,
  QueryProductsDto,
  UpdateProductDto,
} from './dto/product.dto.js';
import { Product } from './schemas/product.schema.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly model: Model<Product>,
    private readonly categories: CategoriesService,
  ) {}

  async list(query: QueryProductsDto) {
    const filter: QueryFilter<Product> = {};
    if (query.categoryId)
      filter.categoryId = new Types.ObjectId(query.categoryId);
    if (query.status) filter.status = query.status;
    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
      filter.$or = [
        { sku: regex },
        { name: regex },
        { brand: regex },
        { model: regex },
      ];
    }
    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('categoryId', 'code name status')
        .sort({ createdAt: query.sortOrder === 'asc' ? 1 : -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean()
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { data, meta: paginationMeta(query.page, query.limit, total) };
  }

  async create(dto: CreateProductDto) {
    await this.categories.assertActive(dto.categoryId);
    const sku = normalizeCode(dto.sku);
    if (await this.model.exists({ sku }))
      throw new ConflictException({
        code: 'DUPLICATE_SKU',
        message: 'SKU đã tồn tại.',
      });
    return this.model.create({
      ...dto,
      sku,
      categoryId: new Types.ObjectId(dto.categoryId),
    });
  }

  async findOne(id: string) {
    const item = await this.model
      .findById(id)
      .populate('categoryId', 'code name status')
      .lean()
      .exec();
    if (!item)
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Sản phẩm không tồn tại.',
      });
    return item;
  }

  async update(id: string, dto: UpdateProductDto) {
    const item = await this.model.findById(id).exec();
    if (!item)
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Sản phẩm không tồn tại.',
      });
    if (dto.categoryId) {
      await this.categories.assertActive(dto.categoryId);
      item.categoryId = new Types.ObjectId(dto.categoryId);
    }
    if (dto.sku) item.sku = normalizeCode(dto.sku);
    const fields: (keyof UpdateProductDto)[] = [
      'name',
      'brand',
      'model',
      'unit',
      'costPrice',
      'minStock',
      'warrantyMonths',
      'description',
      'imageUrl',
      'status',
    ];
    for (const field of fields) {
      const value = dto[field];
      if (value !== undefined)
        Object.assign(item, {
          [field]: typeof value === 'string' ? value.trim() : value,
        });
    }
    return item.save();
  }

  async deactivate(id: string) {
    const item = await this.model
      .findByIdAndUpdate(
        id,
        { status: EntityStatus.INACTIVE },
        { returnDocument: 'after' },
      )
      .exec();
    if (!item)
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Sản phẩm không tồn tại.',
      });
    return item;
  }

  async assertActiveMany(
    ids: string[],
    session?: import('mongoose').ClientSession,
  ) {
    const unique = [...new Set(ids)];
    if (!unique.every(Types.ObjectId.isValid))
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Sản phẩm không hợp lệ.',
      });
    const count = await this.model
      .countDocuments({ _id: { $in: unique }, status: EntityStatus.ACTIVE })
      .session(session ?? null)
      .exec();
    if (count !== unique.length)
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message:
          'Một hoặc nhiều sản phẩm không tồn tại hoặc đã ngừng hoạt động.',
      });
  }
}
