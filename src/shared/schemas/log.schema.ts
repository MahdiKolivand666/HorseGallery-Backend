import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/schemas/user.schema';

export enum LogType {
  ERROR = 'error',
  POST = 'Post',
  PUT = 'Put',
  DELETE = 'Delete',
  PATCH = 'patch',
}

@Schema({ timestamps: true })
export class Log extends Document {
  @Prop()
  content: string;
  @Prop()
  url: string;
  @Prop()
  type: LogType;
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: false,
  })
  user: User;
}

export const LogSchema = SchemaFactory.createForClass(Log);
