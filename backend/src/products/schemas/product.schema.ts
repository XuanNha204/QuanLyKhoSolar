import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import { Category } from '../../categories/schemas/category.schema.js';
import { EntityStatus } from '../../common/enums/domain.enum.js';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ collection: 'products', timestamps: true, versionKey: false })
export class Product {
  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 80,
  })
  sku: string;
  @Prop({ required: true, trim: true, maxlength: 200, index: true })
  name: string;
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: Category.name,
    index: true,
  })
  categoryId: Types.ObjectId;
  @Prop({ trim: true, maxlength: 120 }) brand?: string;
  @Prop({ trim: true, maxlength: 120 }) model?: string;
  @Prop({ required: true, trim: true, maxlength: 40 }) unit: string;
  @Prop({ required: true, min: 0, max: Number.MAX_SAFE_INTEGER })
  costPrice: number;
  @Prop({ required: true, min: 0, default: 0 }) minStock: number;
  @Prop({ required: true, min: 0, max: 240, default: 0 })
  warrantyMonths: number;
  @Prop({ trim: true, maxlength: 2000 }) description?: string;
  @Prop({ trim: true, maxlength: 1000 }) imageUrl?: string;
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

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ categoryId: 1, status: 1, name: 1 });
