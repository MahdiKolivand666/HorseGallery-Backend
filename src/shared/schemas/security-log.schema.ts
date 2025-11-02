import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum SecurityEventType {
  LoginSuccess = 'login.success',
  LoginFailed = 'login.failed',
  LoginAttemptBlocked = 'login.attempt_blocked',
  LogoutSuccess = 'logout.success',
  PasswordChanged = 'password.changed',
  PasswordResetRequested = 'password.reset_requested',
  PasswordResetCompleted = 'password.reset_completed',
  UnauthorizedAccess = 'unauthorized.access',
  InvalidToken = 'token.invalid',
  ExpiredToken = 'token.expired',
  RateLimitExceeded = 'rate_limit.exceeded',
  SuspiciousActivity = 'suspicious.activity',
  ApiKeyUsed = 'api_key.used',
  ApiKeyInvalid = 'api_key.invalid',
  CsrfTokenMismatch = 'csrf.mismatch',
  IpBlocked = 'ip.blocked',
  AccountLocked = 'account.locked',
  TwoFactorSuccess = '2fa.success',
  TwoFactorFailed = '2fa.failed',
}

export enum SecurityLevel {
  Info = 'info',
  Warning = 'warning',
  Critical = 'critical',
}

@Schema({ timestamps: true })
export class SecurityLog extends Document {
  @Prop({ required: true, enum: SecurityEventType, index: true })
  eventType: SecurityEventType;

  @Prop({ required: true, enum: SecurityLevel, index: true })
  level: SecurityLevel;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  user?: Types.ObjectId;

  @Prop()
  mobile?: string; // For failed login attempts

  @Prop({ required: true, index: true })
  ipAddress: string;

  @Prop()
  userAgent?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>; // Additional context

  @Prop()
  description: string;

  @Prop()
  endpoint?: string; // API endpoint accessed

  @Prop()
  method?: string; // HTTP method
}

export const SecurityLogSchema = SchemaFactory.createForClass(SecurityLog);

// Indexes for fast querying
SecurityLogSchema.index({ eventType: 1, createdAt: -1 });
SecurityLogSchema.index({ user: 1, createdAt: -1 });
SecurityLogSchema.index({ ipAddress: 1, createdAt: -1 });
SecurityLogSchema.index({ level: 1, createdAt: -1 });
SecurityLogSchema.index({ createdAt: -1 }); // For TTL and cleanup
