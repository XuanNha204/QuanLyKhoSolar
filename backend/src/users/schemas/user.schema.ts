import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { Role, UserStatus } from '../../common/enums/domain.enum.js';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users', timestamps: true, versionKey: false })
export class User {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 160,
  })
  email: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 120 })
  fullName: string;

  @Prop({ required: true, enum: Role, index: true })
  role: Role;

  @Prop({
    required: true,
    enum: UserStatus,
    default: UserStatus.ACTIVE,
    index: true,
  })
  status: UserStatus;

  @Prop()
  lastLoginAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
