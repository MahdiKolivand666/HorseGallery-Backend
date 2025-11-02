import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiKey } from '../schemas/api-key.schema';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);

  constructor(
    @InjectModel(ApiKey.name)
    private readonly apiKeyModel: Model<ApiKey>,
  ) {}

  /**
   * Generate a new API key
   */
  async generateApiKey(
    name: string,
    createdBy: string,
    expiresInDays?: number,
  ): Promise<{ key: string; id: string }> {
    // Generate a secure random key
    const rawKey = this.generateSecureKey();

    // Hash the key before storing (similar to passwords)
    const hashedKey = await bcrypt.hash(rawKey, 10);

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const apiKey = new this.apiKeyModel({
      key: hashedKey,
      name,
      createdBy,
      expiresAt,
      isActive: true,
    });

    await apiKey.save();

    this.logger.log(`New API key generated: ${name} by ${createdBy}`);

    // Return raw key only once (won't be stored)
    return {
      key: rawKey,
      id: (apiKey._id as any).toString(),
    };
  }

  /**
   * Validate an API key
   */
  async validateApiKey(key: string): Promise<boolean> {
    try {
      // Find all active keys
      const activeKeys = await this.apiKeyModel.find({
        isActive: true,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } },
        ],
      });

      // Check each key (bcrypt compare)
      for (const apiKey of activeKeys) {
        const isValid = await bcrypt.compare(key, apiKey.key);
        if (isValid) {
          // Update usage stats
          apiKey.lastUsedAt = new Date();
          apiKey.usageCount++;
          await apiKey.save();

          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error(`Error validating API key: ${error.message}`);
      return false;
    }
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(keyId: string, revokedBy: string): Promise<void> {
    const apiKey = await this.apiKeyModel.findById(keyId);

    if (!apiKey) {
      throw new Error('API key not found');
    }

    apiKey.isActive = false;
    apiKey.revokedAt = new Date();
    apiKey.revokedBy = revokedBy;
    await apiKey.save();

    this.logger.log(`API key revoked: ${apiKey.name} by ${revokedBy}`);
  }

  /**
   * List all API keys (without revealing actual keys)
   */
  async listApiKeys(): Promise<any[]> {
    const keys = await this.apiKeyModel
      .find()
      .select('-key') // Don't return the actual key
      .sort({ createdAt: -1 });

    return keys;
  }

  /**
   * Rotate API key (revoke old, generate new)
   */
  async rotateApiKey(
    oldKeyId: string,
    rotatedBy: string,
  ): Promise<{ key: string; id: string }> {
    const oldKey = await this.apiKeyModel.findById(oldKeyId);

    if (!oldKey) {
      throw new Error('API key not found');
    }

    // Revoke old key
    await this.revokeApiKey(oldKeyId, rotatedBy);

    // Generate new key with same name
    const newKey = await this.generateApiKey(
      `${oldKey.name} (Rotated)`,
      rotatedBy,
      oldKey.expiresAt
        ? Math.ceil(
            (oldKey.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
          )
        : undefined,
    );

    this.logger.log(`API key rotated: ${oldKey.name} by ${rotatedBy}`);

    return newKey;
  }

  /**
   * Clean up expired keys
   */
  async cleanupExpiredKeys(): Promise<number> {
    const result = await this.apiKeyModel.updateMany(
      {
        isActive: true,
        expiresAt: { $lt: new Date() },
      },
      {
        $set: { isActive: false },
      },
    );

    if (result.modifiedCount > 0) {
      this.logger.log(`Cleaned up ${result.modifiedCount} expired API keys`);
    }

    return result.modifiedCount;
  }

  /**
   * Generate a secure random API key
   */
  private generateSecureKey(): string {
    // Format: hg_live_[32 random hex characters]
    const randomPart = randomBytes(32).toString('hex');
    return `hg_live_${randomPart}`;
  }
}
