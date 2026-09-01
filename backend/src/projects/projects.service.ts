import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, QueryFilter } from 'mongoose';
import { ProjectStatus } from '../common/enums/domain.enum.js';
import {
  escapeRegex,
  normalizeCode,
  paginationMeta,
} from '../common/utils/query.util.js';
import {
  CreateProjectDto,
  QueryProjectsDto,
  UpdateProjectDto,
} from './dto/project.dto.js';
import { Project } from './schemas/project.schema.js';
@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private readonly model: Model<Project>,
  ) {}
  async list(q: QueryProjectsDto) {
    const f: QueryFilter<Project> = {};
    if (q.status) f.status = q.status;
    if (q.search) {
      const r = new RegExp(escapeRegex(q.search.trim()), 'i');
      f.$or = [{ code: r }, { name: r }, { customerName: r }];
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
  async create(d: CreateProjectDto) {
    const code = normalizeCode(d.code);
    if (await this.model.exists({ code }))
      throw new ConflictException({
        code: 'DUPLICATE_PROJECT',
        message: 'Mã công trình đã tồn tại.',
      });
    return this.model.create({ ...d, code });
  }
  async findOne(id: string) {
    const x = await this.model.findById(id).lean().exec();
    if (!x)
      throw new NotFoundException({
        code: 'PROJECT_NOT_FOUND',
        message: 'Công trình không tồn tại.',
      });
    return x;
  }
  async update(id: string, d: UpdateProjectDto) {
    const x = await this.model.findById(id).exec();
    if (!x)
      throw new NotFoundException({
        code: 'PROJECT_NOT_FOUND',
        message: 'Công trình không tồn tại.',
      });
    if (d.status && d.status !== x.status) {
      const allowed: Record<ProjectStatus, ProjectStatus[]> = {
        [ProjectStatus.PLANNED]: [
          ProjectStatus.IN_PROGRESS,
          ProjectStatus.CANCELLED,
        ],
        [ProjectStatus.IN_PROGRESS]: [
          ProjectStatus.COMPLETED,
          ProjectStatus.CANCELLED,
        ],
        [ProjectStatus.COMPLETED]: [],
        [ProjectStatus.CANCELLED]: [],
      };
      if (!allowed[x.status].includes(d.status))
        throw new ConflictException({
          code: 'INVALID_PROJECT_STATUS',
          message: 'Chuyển trạng thái công trình không hợp lệ.',
        });
    }
    Object.assign(x, {
      ...d,
      ...(d.code ? { code: normalizeCode(d.code) } : {}),
    });
    return x.save();
  }
  async deactivate(id: string) {
    return this.update(id, { status: ProjectStatus.CANCELLED });
  }
  async assertUsable(id: string, session?: import('mongoose').ClientSession) {
    const x = await this.model
      .findOne({
        _id: id,
        status: { $in: [ProjectStatus.PLANNED, ProjectStatus.IN_PROGRESS] },
      })
      .session(session ?? null)
      .lean()
      .exec();
    if (!x)
      throw new NotFoundException({
        code: 'PROJECT_NOT_FOUND',
        message: 'Công trình không tồn tại hoặc không còn nhận thiết bị.',
      });
    return x;
  }
}
