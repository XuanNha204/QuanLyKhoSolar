import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import { Product } from '../../products/schemas/product.schema.js';
import { Warehouse } from '../../warehouses/schemas/warehouse.schema.js';

export type InventoryDocument = HydratedDocument<Inventory>;

@Schema({ collection: 'inventories', timestamps: true, versionKey: false })
export class Inventory {
  @Prop({ required: true, type: Types.ObjectId, ref: Product.name })
  productId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: Warehouse.name })
  warehouseId: Types.ObjectId;
  @Prop({ required: true, min: 0, default: 0 }) quantity: number;
  @Prop({ required: true, min: 0, default: 0 }) version: number;
  createdAt: Date;
  updatedAt: Date;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);
InventorySchema.index({ productId: 1, warehouseId: 1 }, { unique: true });
InventorySchema.index({ warehouseId: 1, quantity: 1 });
