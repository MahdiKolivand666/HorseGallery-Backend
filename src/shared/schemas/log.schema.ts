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

  // ✅ بهبود: اضافه کردن فیلدهای بیشتر برای tracking بهتر
  @Prop()
  statusCode?: number; // HTTP status code

  @Prop()
  method?: string; // HTTP method (GET, POST, etc.)

  @Prop()
  requestId?: string; // Request ID برای tracking

  @Prop()
  errorCode?: string; // Error code (ErrorCode enum)

  @Prop()
  ipAddress?: string; // IP address برای security tracking

  @Prop()
  userAgent?: string; // User agent برای debugging
}

export const LogSchema = SchemaFactory.createForClass(Log);
