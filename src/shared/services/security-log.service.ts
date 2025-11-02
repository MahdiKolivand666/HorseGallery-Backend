import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SecurityLog,
  SecurityEventType,
  SecurityLevel,
} from '../schemas/security-log.schema';

@Injectable()
export class SecurityLogService {
  private readonly logger = new Logger(SecurityLogService.name);

  constructor(
    @InjectModel(SecurityLog.name)
    private readonly securityLogModel: Model<SecurityLog>,
  ) {}

  /**
   * Log a security event
   */
  async logEvent(
    eventType: SecurityEventType,
    level: SecurityLevel,
    ipAddress: string,
    description: string,
    metadata?: {
      userId?: string;
      mobile?: string;
      userAgent?: string;
      endpoint?: string;
      method?: string;
      [key: string]: any;
    },
  ): Promise<void> {
    try {
      const log = new this.securityLogModel({
        eventType,
        level,
        ipAddress,
        description,
        user: metadata?.userId,
        mobile: metadata?.mobile,
        userAgent: metadata?.userAgent,
        endpoint: metadata?.endpoint,
        method: metadata?.method,
        metadata: metadata,
      });

      await log.save();

      // Also log to console for immediate visibility
      if (level === SecurityLevel.Critical) {
        this.logger.error(`[SECURITY] ${description}`, metadata);
      } else if (level === SecurityLevel.Warning) {
        this.logger.warn(`[SECURITY] ${description}`, metadata);
      } else {
        this.logger.log(`[SECURITY] ${description}`);
      }
    } catch (error) {
      // Don't throw error in logging to avoid breaking the main flow
      this.logger.error(`Failed to log security event: ${error.message}`);
    }
  }

  /**
   * Log successful login
   */
  async logLoginSuccess(
    userId: string,
    mobile: string,
    ipAddress: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logEvent(
      SecurityEventType.LoginSuccess,
      SecurityLevel.Info,
      ipAddress,
      `Successful login for user ${mobile}`,
      { userId, mobile, userAgent },
    );
  }

  /**
   * Log failed login attempt
   */
  async logLoginFailed(
    mobile: string,
    ipAddress: string,
    reason: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logEvent(
      SecurityEventType.LoginFailed,
      SecurityLevel.Warning,
      ipAddress,
      `Failed login attempt for ${mobile}: ${reason}`,
      { mobile, userAgent, reason },
    );
  }

  /**
   * Log unauthorized access attempt
   */
  async logUnauthorizedAccess(
    ipAddress: string,
    endpoint: string,
    method: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logEvent(
      SecurityEventType.UnauthorizedAccess,
      SecurityLevel.Warning,
      ipAddress,
      `Unauthorized access attempt to ${method} ${endpoint}`,
      { endpoint, method, userAgent },
    );
  }

  /**
   * Log rate limit exceeded
   */
  async logRateLimitExceeded(
    ipAddress: string,
    endpoint?: string,
    userId?: string,
  ): Promise<void> {
    await this.logEvent(
      SecurityEventType.RateLimitExceeded,
      SecurityLevel.Warning,
      ipAddress,
      `Rate limit exceeded from ${ipAddress}`,
      { userId, endpoint },
    );
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    ipAddress: string,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logEvent(
      SecurityEventType.SuspiciousActivity,
      SecurityLevel.Critical,
      ipAddress,
      description,
      metadata,
    );
  }

  /**
   * Get recent security events
   */
  async getRecentEvents(
    limit = 100,
    level?: SecurityLevel,
  ): Promise<SecurityLog[]> {
    const query = level ? { level } : {};
    return await this.securityLogModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'mobile firstName lastName')
      .exec();
  }

  /**
   * Get failed login attempts for a specific IP or mobile
   */
  async getFailedLoginAttempts(
    ipOrMobile: string,
    since: Date,
  ): Promise<number> {
    const count = await this.securityLogModel.countDocuments({
      eventType: SecurityEventType.LoginFailed,
      $or: [{ ipAddress: ipOrMobile }, { mobile: ipOrMobile }],
      createdAt: { $gte: since },
    });

    return count;
  }

  /**
   * Check if IP or mobile should be blocked due to excessive failed attempts
   */
  async shouldBlock(ipOrMobile: string, maxAttempts = 5): Promise<boolean> {
    const since = new Date(Date.now() - 15 * 60 * 1000); // Last 15 minutes
    const attempts = await this.getFailedLoginAttempts(ipOrMobile, since);
    return attempts >= maxAttempts;
  }

  /**
   * Clean up old security logs (for GDPR compliance)
   */
  async cleanupOldLogs(olderThanDays = 90): Promise<number> {
    const cutoffDate = new Date(
      Date.now() - olderThanDays * 24 * 60 * 60 * 1000,
    );

    const result = await this.securityLogModel.deleteMany({
      createdAt: { $lt: cutoffDate },
      level: { $ne: SecurityLevel.Critical }, // Keep critical logs longer
    });

    if (result.deletedCount > 0) {
      this.logger.log(`Cleaned up ${result.deletedCount} old security logs`);
    }

    return result.deletedCount;
  }

  /**
   * Get security statistics
   */
  async getStatistics(since: Date): Promise<any> {
    const stats = await this.securityLogModel.aggregate([
      {
        $match: {
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return stats;
  }
}
