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
  paginationMeta,
} from '../common/utils/query.util.js';
import {
  CreateSupplierDto,
  QuerySuppliersDto,
  UpdateSupplierDto,
} from './dto/supplier.dto.js';
import { Supplier } from './schemas/supplier.schema.js';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name) private readonly model: Model<Supplier>,
  ) {}
  async list(q: QuerySuppliersDto) {
    const f: QueryFilter<Supplier> = {};
    if (q.status) f.status = q.status;
    if (q.search) {
      const r = new RegExp(escapeRegex(q.search.trim()), 'i');
      f.$or = [
        { code: r },
        { name: r },
        { contactName: r },
        { phone: r },
        { taxCode: r },
      ];
    }
    const [data, total] = await Promise.all([
      this.model
        .find(f)
        .sort({ createdAt: q.sortOrder === 'asc' ? 1 : -1 })
        .skip((q.page - 1) * q.limit)
        .limit(q.limit)
        .lean()
        .exec(),
      this.model.countDocuments(f).exec(),
    ]);
    return { data, meta: paginationMeta(q.page, q.limit, total) };
  }
  async create(dto: CreateSupplierDto) {
    const code = normalizeCode(dto.code);
    if (await this.model.exists({ code }))
      throw new ConflictException({
        code: 'DUPLICATE_SUPPLIER',
        message: 'Mã nhà cung cấp đã tồn tại.',
      });
    return this.model.create({ ...dto, code });
  }
  async findOne(id: string) {
    const x = await this.model.findById(id).lean().exec();
    if (!x)
      throw new NotFoundException({
        code: 'SUPPLIER_NOT_FOUND',
        message: 'Nhà cung cấp không tồn tại.',
      });
    return x;
  }
  async update(id: string, dto: UpdateSupplierDto) {
    const x = await this.model.findById(id).exec();
    if (!x)
      throw new NotFoundException({
        code: 'SUPPLIER_NOT_FOUND',
        message: 'Nhà cung cấp không tồn tại.',
      });
    Object.assign(x, {
      ...dto,
      ...(dto.code ? { code: normalizeCode(dto.code) } : {}),
    });
    return x.save();
  }
  async deactivate(id: string) {
    const x = await this.model
      .findByIdAndUpdate(
        id,
        { status: EntityStatus.INACTIVE },
        { returnDocument: 'after' },
      )
      .exec();
    if (!x)
      throw new NotFoundException({
        code: 'SUPPLIER_NOT_FOUND',
        message: 'Nhà cung cấp không tồn tại.',
      });
    return x;
  }
  async assertActive(id: string, session?: import('mongoose').ClientSession) {
    const x = await this.model
      .findOne({ _id: id, status: EntityStatus.ACTIVE })
      .session(session ?? null)
      .lean()
      .exec();
    if (!x)
      throw new NotFoundException({
        code: 'SUPPLIER_NOT_FOUND',
        message: 'Nhà cung cấp không tồn tại hoặc đã ngừng hoạt động.',
      });
    return x;
  }
}
