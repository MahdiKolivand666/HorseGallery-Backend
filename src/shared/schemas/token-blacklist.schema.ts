import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class TokenBlacklist extends Document {
  @Prop({ required: true, unique: true, index: true })
  tokenId: string; // JWT ID (jti)

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  expiresAt: Date; // زمان expire شدن token

  @Prop({ default: Date.now })
  blacklistedAt: Date;
}

export const TokenBlacklistSchema =
  SchemaFactory.createForClass(TokenBlacklist);

// ✅ Index برای پاک کردن خودکار token های expire شده
TokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

