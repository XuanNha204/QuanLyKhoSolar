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
  CreateWarehouseDto,
  QueryWarehousesDto,
  UpdateWarehouseDto,
} from './dto/warehouse.dto.js';
import { Warehouse } from './schemas/warehouse.schema.js';
@Injectable()
export class WarehousesService {
  constructor(
    @InjectModel(Warehouse.name) private readonly model: Model<Warehouse>,
  ) {}
  async list(q: QueryWarehousesDto) {
    const f: QueryFilter<Warehouse> = {};
    if (q.status) f.status = q.status;
    if (q.search) {
      const r = new RegExp(escapeRegex(q.search.trim()), 'i');
      f.$or = [{ code: r }, { name: r }, { address: r }];
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
  async create(d: CreateWarehouseDto) {
    const code = normalizeCode(d.code);
    if (await this.model.exists({ code }))
      throw new ConflictException({
        code: 'DUPLICATE_WAREHOUSE',
        message: 'Mã kho đã tồn tại.',
      });
    return this.model.create({ ...d, code });
  }
  async findOne(id: string) {
    const x = await this.model.findById(id).lean().exec();
    if (!x)
      throw new NotFoundException({
        code: 'WAREHOUSE_NOT_FOUND',
        message: 'Kho không tồn tại.',
      });
    return x;
  }
  async update(id: string, d: UpdateWarehouseDto) {
    const x = await this.model.findById(id).exec();
    if (!x)
      throw new NotFoundException({
        code: 'WAREHOUSE_NOT_FOUND',
        message: 'Kho không tồn tại.',
      });
    Object.assign(x, {
      ...d,
      ...(d.code ? { code: normalizeCode(d.code) } : {}),
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
        code: 'WAREHOUSE_NOT_FOUND',
        message: 'Kho không tồn tại.',
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
        code: 'WAREHOUSE_NOT_FOUND',
        message: 'Kho không tồn tại hoặc đã ngừng hoạt động.',
      });
    return x;
  }
}
