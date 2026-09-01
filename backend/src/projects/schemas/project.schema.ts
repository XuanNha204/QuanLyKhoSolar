import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { ProjectStatus } from '../../common/enums/domain.enum.js';
export type ProjectDocument = HydratedDocument<Project>;
@Schema({ collection: 'projects', timestamps: true, versionKey: false })
export class Project {
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
  @Prop({ required: true, trim: true, maxlength: 200 }) customerName: string;
  @Prop({ trim: true, maxlength: 500 }) address?: string;
  @Prop({ min: 0 }) capacity?: number;
  @Prop({
    required: true,
    enum: ProjectStatus,
    default: ProjectStatus.PLANNED,
    index: true,
  })
  status: ProjectStatus;
  @Prop() startDate?: Date;
  @Prop({ trim: true, maxlength: 1000 }) note?: string;
  createdAt: Date;
  updatedAt: Date;
}
export const ProjectSchema = SchemaFactory.createForClass(Project);
