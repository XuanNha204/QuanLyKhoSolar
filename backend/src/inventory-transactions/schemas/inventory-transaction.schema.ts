import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import {
  ReferenceType,
  TransactionType,
} from '../../common/enums/domain.enum.js';
import { Product } from '../../products/schemas/product.schema.js';
import { User } from '../../users/schemas/user.schema.js';
import { Warehouse } from '../../warehouses/schemas/warehouse.schema.js';

export type InventoryTransactionDocument =
  HydratedDocument<InventoryTransaction>;

@Schema({
  collection: 'inventory_transactions',
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
})
export class InventoryTransaction {
  @Prop({ required: true, type: Types.ObjectId, ref: Product.name })
  productId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: Warehouse.name })
  warehouseId: Types.ObjectId;
  @Prop({ required: true, enum: TransactionType }) type: TransactionType;
  @Prop({ required: true }) quantity: number;
  @Prop({ required: true, min: 0 }) previousQuantity: number;
  @Prop({ required: true, min: 0 }) newQuantity: number;
  @Prop({ required: true, enum: ReferenceType }) referenceType: ReferenceType;
  @Prop({ required: true, type: Types.ObjectId }) referenceId: Types.ObjectId;
  @Prop({ trim: true, maxlength: 1000 }) note?: string;
  @Prop({ required: true, type: Types.ObjectId, ref: User.name })
  createdBy: Types.ObjectId;
  createdAt: Date;
}

export const InventoryTransactionSchema =
  SchemaFactory.createForClass(InventoryTransaction);
InventoryTransactionSchema.index({
  productId: 1,
  warehouseId: 1,
  createdAt: -1,
});
InventoryTransactionSchema.index({ referenceType: 1, referenceId: 1 });
