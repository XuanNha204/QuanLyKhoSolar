import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, QueryFilter } from 'mongoose';
import { EntityStatus } from '../common/enums/domain.enum.js';
import {
  escapeRegex,
  normalizeCode,
  normalizeName,
  paginationMeta,
} from '../common/utils/query.util.js';
import {
  CreateCategoryDto,
  QueryCategoriesDto,
  UpdateCategoryDto,
} from './dto/category.dto.js';
import { Category } from './schemas/category.schema.js';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private readonly model: Model<Category>,
  ) {}

  async list(query: QueryCategoriesDto) {
    const filter: QueryFilter<Category> = {};
    if (query.status) filter.status = query.status;
    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
      filter.$or = [{ code: regex }, { name: regex }];
    }
    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: query.sortOrder === 'asc' ? 1 : -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean()
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { data, meta: paginationMeta(query.page, query.limit, total) };
  }

  async create(dto: CreateCategoryDto) {
    const code = normalizeCode(dto.code);
    const normalizedName = normalizeName(dto.name);
    if (await this.model.exists({ $or: [{ code }, { normalizedName }] })) {
      throw new ConflictException({
        code: 'DUPLICATE_CATEGORY',
        message: 'Mã hoặc tên danh mục đã tồn tại.',
      });
    }
    return this.model.create({
      ...dto,
      code,
      name: dto.name.trim(),
      normalizedName,
    });
  }

  async findOne(id: string) {
    const item = await this.model.findById(id).lean().exec();
    if (!item)
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Danh mục không tồn tại.',
      });
    return item;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const item = await this.model.findById(id).select('+normalizedName').exec();
    if (!item)
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Danh mục không tồn tại.',
      });
    if (dto.code) item.code = normalizeCode(dto.code);
    if (dto.name) {
      item.name = dto.name.trim();
      item.normalizedName = normalizeName(dto.name);
    }
    if (dto.description !== undefined)
      item.description = dto.description?.trim();
    if (dto.status) item.status = dto.status;
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
        code: 'CATEGORY_NOT_FOUND',
        message: 'Danh mục không tồn tại.',
      });
    return item;
  }

  async assertActive(id: string) {
    const item = await this.model
      .findOne({ _id: id, status: EntityStatus.ACTIVE })
      .lean()
      .exec();
    if (!item)
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Danh mục không tồn tại hoặc đã ngừng hoạt động.',
      });
    return item;
  }
}
