import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import { DocumentStatus } from '../../common/enums/domain.enum.js';
import { Product } from '../../products/schemas/product.schema.js';
import { Supplier } from '../../suppliers/schemas/supplier.schema.js';
import { User } from '../../users/schemas/user.schema.js';
import { Warehouse } from '../../warehouses/schemas/warehouse.schema.js';

@Schema({ _id: true, versionKey: false })
export class StockReceiptItem {
  @Prop({ required: true, type: Types.ObjectId, ref: Product.name })
  productId: Types.ObjectId;
  @Prop({ required: true, min: 1 }) quantity: number;
  @Prop({ required: true, min: 0 }) unitPrice: number;
  @Prop({ required: true, min: 0 }) lineTotal: number;
}
const StockReceiptItemSchema = SchemaFactory.createForClass(StockReceiptItem);

export type StockReceiptDocument = HydratedDocument<StockReceipt>;
@Schema({ collection: 'stock_receipts', timestamps: true, versionKey: false })
export class StockReceipt {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;
  @Prop({ required: true, type: Types.ObjectId, ref: Supplier.name })
  supplierId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: Warehouse.name })
  warehouseId: Types.ObjectId;
  @Prop({ required: true }) receiptDate: Date;
  @Prop({ required: true, type: Types.ObjectId, ref: User.name })
  createdBy: Types.ObjectId;
  @Prop({ trim: true, maxlength: 1000 }) note?: string;
  @Prop({ required: true, enum: DocumentStatus, default: DocumentStatus.DRAFT })
  status: DocumentStatus;
  @Prop({
    type: [StockReceiptItemSchema],
    required: true,
    validate: [
      (v: StockReceiptItem[]) => v.length > 0,
      'Phiếu phải có sản phẩm.',
    ],
  })
  items: StockReceiptItem[];
  @Prop({ required: true, min: 0 }) totalAmount: number;
  @Prop() confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
export const StockReceiptSchema = SchemaFactory.createForClass(StockReceipt);
StockReceiptSchema.index({ warehouseId: 1, receiptDate: -1 });
StockReceiptSchema.index({ supplierId: 1, receiptDate: -1 });
