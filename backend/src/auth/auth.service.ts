import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UserStatus } from '../common/enums/domain.enum.js';
import { UsersService } from '../users/users.service.js';
import { ChangePasswordDto, LoginDto } from './dto/auth.dto.js';
import type { AuthUser } from './interfaces/auth-user.interface.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.users.findWithPassword(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email hoặc mật khẩu không đúng.',
      });
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException({
        code: 'ACCOUNT_INACTIVE',
        message: 'Tài khoản đã bị vô hiệu hóa.',
      });
    }
    await this.users.touchLogin(user._id);
    const principal: AuthUser = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
    return {
      accessToken: await this.jwt.signAsync({
        sub: principal.id,
        email: principal.email,
        role: principal.role,
      }),
      tokenType: 'Bearer',
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN') ?? '8h',
      user: principal,
    };
  }

  me(user: AuthUser) {
    return user;
  }

  async changePassword(user: AuthUser, dto: ChangePasswordDto) {
    const document = await this.users.findWithPassword(user.email);
    if (
      !document ||
      !(await bcrypt.compare(dto.currentPassword, document.passwordHash))
    ) {
      throw new UnauthorizedException({
        code: 'INVALID_CURRENT_PASSWORD',
        message: 'Mật khẩu hiện tại không đúng.',
      });
    }
    await this.users.resetPassword(user.id, { password: dto.newPassword });
    return { message: 'Đổi mật khẩu thành công.' };
  }
}
