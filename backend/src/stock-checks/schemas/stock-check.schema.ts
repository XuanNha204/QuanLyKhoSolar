import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import { DocumentStatus } from '../../common/enums/domain.enum.js';
import { Inventory } from '../../inventory/schemas/inventory.schema.js';
import { Product } from '../../products/schemas/product.schema.js';
import { User } from '../../users/schemas/user.schema.js';
import { Warehouse } from '../../warehouses/schemas/warehouse.schema.js';

@Schema({ _id: true, versionKey: false })
export class StockCheckItem {
  @Prop({ required: true, type: Types.ObjectId, ref: Inventory.name })
  inventoryId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: Product.name })
  productId: Types.ObjectId;
  @Prop({ required: true, min: 0 }) systemQuantity: number;
  @Prop({ required: true, min: 0 }) actualQuantity: number;
  @Prop({ required: true }) difference: number;
  @Prop({ required: true, min: 0 }) inventoryVersion: number;
}
const StockCheckItemSchema = SchemaFactory.createForClass(StockCheckItem);

export type StockCheckDocument = HydratedDocument<StockCheck>;
@Schema({ collection: 'stock_checks', timestamps: true, versionKey: false })
export class StockCheck {
  @Prop({ required: true, unique: true, uppercase: true }) code: string;
  @Prop({ required: true, type: Types.ObjectId, ref: Warehouse.name })
  warehouseId: Types.ObjectId;
  @Prop({ required: true }) checkDate: Date;
  @Prop({ required: true, type: Types.ObjectId, ref: User.name })
  createdBy: Types.ObjectId;
  @Prop({ trim: true, maxlength: 1000 }) note?: string;
  @Prop({ required: true, enum: DocumentStatus, default: DocumentStatus.DRAFT })
  status: DocumentStatus;
  @Prop({
    type: [StockCheckItemSchema],
    required: true,
    validate: [
      (v: StockCheckItem[]) => v.length > 0,
      'Phiếu phải có sản phẩm.',
    ],
  })
  items: StockCheckItem[];
  @Prop() confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
export const StockCheckSchema = SchemaFactory.createForClass(StockCheck);
StockCheckSchema.index({ warehouseId: 1, checkDate: -1 });
