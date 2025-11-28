import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../user/schemas/user.schema';

export enum AuditAction {
  // Order actions
  OrderCreated = 'order_created',
  OrderStatusChanged = 'order_status_changed',
  OrderCanceled = 'order_canceled',

  // Product actions
  ProductCreated = 'product_created',
  ProductUpdated = 'product_updated',
  ProductDeleted = 'product_deleted',
  ProductStockAdded = 'product_stock_added',
  ProductStockRemoved = 'product_stock_removed',

  // User actions
  UserCreated = 'user_created',
  UserUpdated = 'user_updated',
  UserDeleted = 'user_deleted',
  UserRoleChanged = 'user_role_changed',

  // Payment actions
  PaymentRequested = 'payment_requested',
  PaymentVerified = 'payment_verified',
  PaymentFailed = 'payment_failed',

  // Admin actions
  SettingsChanged = 'settings_changed',
  BulkOperation = 'bulk_operation',
}

@Schema({ timestamps: true })
export class AuditLog extends Document {
  @Prop({ required: true, enum: AuditAction })
  action: AuditAction;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  performedBy?: User;

  @Prop()
  entityType: string; // 'Order', 'Product', 'User', etc.

  @Prop()
  entityId: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  oldValue?: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  newValue?: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: any;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;
}

export const auditLogSchema = SchemaFactory.createForClass(AuditLog);

// Indexes for efficient querying
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
