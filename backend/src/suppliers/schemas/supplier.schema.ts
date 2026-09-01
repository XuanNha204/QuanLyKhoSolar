import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { EntityStatus } from '../../common/enums/domain.enum.js';

export type SupplierDocument = HydratedDocument<Supplier>;
@Schema({ collection: 'suppliers', timestamps: true, versionKey: false })
export class Supplier {
  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 60,
  })
  code: string;
  @Prop({ required: true, trim: true, maxlength: 200, index: true })
  name: string;
  @Prop({ trim: true, maxlength: 120 }) contactName?: string;
  @Prop({ trim: true, maxlength: 40 }) phone?: string;
  @Prop({ trim: true, lowercase: true, maxlength: 160 }) email?: string;
  @Prop({ trim: true, maxlength: 500 }) address?: string;
  @Prop({ trim: true, maxlength: 40 }) taxCode?: string;
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
export const SupplierSchema = SchemaFactory.createForClass(Supplier);
