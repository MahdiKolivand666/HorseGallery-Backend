import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TokenBlacklist } from '../schemas/token-blacklist.schema';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  constructor(
    @InjectModel(TokenBlacklist.name)
    private readonly tokenBlacklistModel: Model<TokenBlacklist>,
  ) {}

  /**
   * اضافه کردن token به blacklist
   */
  async addToBlacklist(
    tokenId: string,
    userId: string,
    expiresAt: Date,
  ): Promise<void> {
    try {
      await this.tokenBlacklistModel.create({
        tokenId,
        userId,
        expiresAt,
        blacklistedAt: new Date(),
      });

      this.logger.log(`Token blacklisted: ${tokenId.substring(0, 20)}...`);
    } catch (error) {
      // اگر token قبلاً blacklist شده باشد، ignore می‌کنیم
      if (error.code === 11000) {
        this.logger.debug(
          `Token already blacklisted: ${tokenId.substring(0, 20)}...`,
        );
        return;
      }
      throw error;
    }
  }

  /**
   * چک کردن اینکه آیا token در blacklist است یا نه
   */
  async isBlacklisted(tokenId: string): Promise<boolean> {
    const blacklistedToken = await this.tokenBlacklistModel.findOne({
      tokenId,
      expiresAt: { $gt: new Date() }, // هنوز expire نشده
    });

    return !!blacklistedToken;
  }

  /**
   * پاک کردن تمام token های یک کاربر (برای logout از همه devices)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    const result = await this.tokenBlacklistModel.deleteMany({
      userId,
      expiresAt: { $gt: new Date() },
    });

    this.logger.log(
      `Revoked all tokens for user: ${userId} (${result.deletedCount} tokens)`,
    );
  }

  /**
   * پاک کردن token های expire شده (cleanup)
   */
  async cleanupExpiredTokens(): Promise<void> {
    const result = await this.tokenBlacklistModel.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    if (result.deletedCount > 0) {
      this.logger.log(`Cleaned up ${result.deletedCount} expired tokens`);
    }
  }
}

