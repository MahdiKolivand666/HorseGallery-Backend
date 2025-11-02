import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum Role {
  User = 'user',
  Admin = 'admin',
  CopyWriter = 'copyWriter',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop()
  firstName: string;
  @Prop()
  lastName: string;
  @Prop({ unique: true, type: String, required: true })
  mobile: string;

  @Prop()
  password: string;

  @Prop()
  role: Role;

  @Prop({ required: false })
  code?: string;

  @Prop({ required: false })
  codeExpiry?: Date;

  @Prop({ default: 0 })
  codeAttempts: number;

  @Prop({ required: false })
  lastCodeSentAt?: Date;

  @Prop({ default: 0 })
  codeSentCount: number;

  // Refresh token fields
  @Prop({ required: false })
  refreshToken?: string;

  @Prop({ required: false })
  refreshTokenExpiry?: Date;
}

export const userSchema = SchemaFactory.createForClass(User);

// Indexes for better query performance
// Note: mobile already has unique index from @Prop({ unique: true })
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
