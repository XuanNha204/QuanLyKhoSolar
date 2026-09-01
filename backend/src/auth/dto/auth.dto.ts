import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export class LoginDto {
  @ApiProperty({ example: 'admin@solar.local' })
  @IsEmail()
  @MaxLength(160)
  email: string;

  @ApiProperty({ example: 'Admin@123' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(PASSWORD_PATTERN, {
    message: 'Mật khẩu phải có chữ hoa, chữ thường và chữ số.',
  })
  newPassword: string;
}
