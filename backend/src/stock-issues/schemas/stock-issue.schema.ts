import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import { DocumentStatus } from '../../common/enums/domain.enum.js';
import { Product } from '../../products/schemas/product.schema.js';
import { Project } from '../../projects/schemas/project.schema.js';
import { User } from '../../users/schemas/user.schema.js';
import { Warehouse } from '../../warehouses/schemas/warehouse.schema.js';

@Schema({ _id: true, versionKey: false })
export class StockIssueItem {
  @Prop({ required: true, type: Types.ObjectId, ref: Product.name })
  productId: Types.ObjectId;
  @Prop({ required: true, min: 1 }) quantity: number;
}
const StockIssueItemSchema = SchemaFactory.createForClass(StockIssueItem);

export type StockIssueDocument = HydratedDocument<StockIssue>;
@Schema({ collection: 'stock_issues', timestamps: true, versionKey: false })
export class StockIssue {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;
  @Prop({ required: true, type: Types.ObjectId, ref: Warehouse.name })
  warehouseId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: Project.name }) projectId?: Types.ObjectId;
  @Prop({ required: true }) issueDate: Date;
  @Prop({ required: true, type: Types.ObjectId, ref: User.name })
  createdBy: Types.ObjectId;
  @Prop({ trim: true, maxlength: 1000 }) note?: string;
  @Prop({ required: true, enum: DocumentStatus, default: DocumentStatus.DRAFT })
  status: DocumentStatus;
  @Prop({
    type: [StockIssueItemSchema],
    required: true,
    validate: [
      (v: StockIssueItem[]) => v.length > 0,
      'Phiếu phải có sản phẩm.',
    ],
  })
  items: StockIssueItem[];
  @Prop() confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
export const StockIssueSchema = SchemaFactory.createForClass(StockIssue);
StockIssueSchema.index({ warehouseId: 1, issueDate: -1 });
StockIssueSchema.index({ projectId: 1, issueDate: -1 });
