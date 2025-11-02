import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ApiKey extends Document {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  name: string; // Descriptive name for the key

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  expiresAt?: Date;

  @Prop()
  lastUsedAt?: Date;

  @Prop({ default: 0 })
  usageCount: number;

  @Prop()
  createdBy?: string; // Admin who created the key

  @Prop()
  revokedAt?: Date;

  @Prop()
  revokedBy?: string; // Admin who revoked the key
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);

// Index for fast lookup
ApiKeySchema.index({ key: 1, isActive: 1 });
ApiKeySchema.index({ expiresAt: 1 });
