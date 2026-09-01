import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { EntityStatus } from '../../common/enums/domain.enum.js';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ collection: 'categories', timestamps: true, versionKey: false })
export class Category {
  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 60,
  })
  code: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name: string;

  @Prop({ required: true, unique: true, select: false })
  normalizedName: string;

  @Prop({ trim: true, maxlength: 500 })
  description?: string;

  @Prop({
    required: true,
    enum: EntityStatus,
    default: EntityStatus.ACTIVE,
    index: true,
  })
  status: EntityStatus;

  createdAt: Date;
  updatedAt: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
