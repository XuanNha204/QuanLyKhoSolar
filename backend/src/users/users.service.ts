import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import type { Model, QueryFilter } from 'mongoose';
import type { AuthUser } from '../auth/interfaces/auth-user.interface.js';
import { UserStatus } from '../common/enums/domain.enum.js';
import {
  escapeRegex,
  normalizeEmail,
  paginationMeta,
} from '../common/utils/query.util.js';
import {
  CreateUserDto,
  QueryUsersDto,
  ResetPasswordDto,
  UpdateUserDto,
} from './dto/user.dto.js';
import { User } from './schemas/user.schema.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly config: ConfigService,
  ) {}

  async list(query: QueryUsersDto) {
    const filter: QueryFilter<User> = {};
    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
      filter.$or = [{ email: regex }, { fullName: regex }];
    }
    if (query.role) filter.role = query.role;
    if (query.status) filter.status = query.status;
    const [data, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: query.sortOrder === 'asc' ? 1 : -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean()
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);
    return { data, meta: paginationMeta(query.page, query.limit, total) };
  }

  async create(dto: CreateUserDto) {
    const email = normalizeEmail(dto.email);
    if (await this.userModel.exists({ email })) {
      throw new ConflictException({
        code: 'DUPLICATE_EMAIL',
        message: 'Email đã tồn tại.',
      });
    }
    const { password, ...userData } = dto;
    const passwordHash = await this.hash(password);
    return this.userModel.create({ ...userData, email, passwordHash });
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).lean().exec();
    if (!user)
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Người dùng không tồn tại.',
      });
    return user;
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    const existing = await this.userModel.findById(id).exec();
    if (!existing)
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Người dùng không tồn tại.',
      });
    if (id === actorId && dto.status === UserStatus.INACTIVE) {
      throw new ConflictException({
        code: 'SELF_DEACTIVATION',
        message: 'Không thể vô hiệu hóa chính tài khoản đang đăng nhập.',
      });
    }
    if (dto.email) {
      const email = normalizeEmail(dto.email);
      if (await this.userModel.exists({ email, _id: { $ne: existing._id } })) {
        throw new ConflictException({
          code: 'DUPLICATE_EMAIL',
          message: 'Email đã tồn tại.',
        });
      }
      existing.email = email;
    }
    if (dto.fullName !== undefined) existing.fullName = dto.fullName.trim();
    if (dto.role !== undefined) existing.role = dto.role;
    if (dto.status !== undefined) existing.status = dto.status;
    if (dto.password) existing.passwordHash = await this.hash(dto.password);
    return existing.save();
  }

  async resetPassword(id: string, dto: ResetPasswordDto) {
    const result = await this.userModel
      .findByIdAndUpdate(
        id,
        { passwordHash: await this.hash(dto.password) },
        { returnDocument: 'after' },
      )
      .exec();
    if (!result)
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Người dùng không tồn tại.',
      });
    return result;
  }

  async findWithPassword(email: string) {
    return this.userModel
      .findOne({ email: normalizeEmail(email) })
      .select('+passwordHash')
      .exec();
  }

  async findActivePrincipal(id: string): Promise<AuthUser | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const user = await this.userModel
      .findOne({ _id: id, status: UserStatus.ACTIVE })
      .lean()
      .exec();
    return user
      ? {
          id: user._id.toString(),
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        }
      : null;
  }

  async touchLogin(id: Types.ObjectId) {
    await this.userModel
      .updateOne({ _id: id }, { lastLoginAt: new Date() })
      .exec();
  }

  private hash(password: string) {
    return bcrypt.hash(
      password,
      Number(this.config.get('BCRYPT_ROUNDS') ?? 10),
    );
  }
}
