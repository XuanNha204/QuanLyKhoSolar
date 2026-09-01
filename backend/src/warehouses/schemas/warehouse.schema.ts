import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { EntityStatus } from '../../common/enums/domain.enum.js';
export type WarehouseDocument = HydratedDocument<Warehouse>;
@Schema({ collection: 'warehouses', timestamps: true, versionKey: false })
export class Warehouse {
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
  @Prop({ trim: true, maxlength: 500 }) address?: string;
  @Prop({ trim: true, maxlength: 1000 }) description?: string;
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
export const WarehouseSchema = SchemaFactory.createForClass(Warehouse);
