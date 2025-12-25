import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum Role {
  User = 'user',
  Admin = 'admin',
  CopyWriter = 'copyWriter',
}

export enum RegistrationStatus {
  Pending = 'pending', // فقط شماره تلفن وارد شده
  Complete = 'complete', // اطلاعات کامل وارد شده
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

  @Prop({ required: false })
  otpVerifiedAt?: Date; // ✅ زمان verify شدن کد OTP

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

  // فیلدهای جدید
  @Prop()
  email?: string;

  @Prop()
  nationalCode?: string;

  @Prop()
  avatar?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLogin?: Date;

  @Prop({ default: RegistrationStatus.Pending, enum: RegistrationStatus })
  registrationStatus: RegistrationStatus;

  // Wallet balance
  @Prop({ type: Number, default: 0 })
  walletBalance: number;
}

export const userSchema = SchemaFactory.createForClass(User);

// Indexes for better query performance
// Note: mobile already has unique index from @Prop({ unique: true })
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ otpVerifiedAt: 1 }); // ✅ برای جستجوی سریع‌تر
