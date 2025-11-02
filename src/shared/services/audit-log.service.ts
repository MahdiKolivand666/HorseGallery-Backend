import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditAction } from '../schemas/audit-log.schema';

export interface CreateAuditLogDto {
  action: AuditAction;
  performedBy?: string;
  entityType: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLog>,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = new this.auditLogModel(dto);
    return await auditLog.save();
  }

  async findByEntity(
    entityType: string,
    entityId: string,
    limit = 50,
  ): Promise<AuditLog[]> {
    return await this.auditLogModel
      .find({ entityType, entityId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('performedBy', { firstName: 1, lastName: 1 })
      .exec();
  }

  async findByUser(userId: string, limit = 100): Promise<AuditLog[]> {
    return await this.auditLogModel
      .find({ performedBy: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async findByAction(action: AuditAction, limit = 100): Promise<AuditLog[]> {
    return await this.auditLogModel
      .find({ action })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('performedBy', { firstName: 1, lastName: 1 })
      .exec();
  }

  async getRecentLogs(limit = 100): Promise<AuditLog[]> {
    return await this.auditLogModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('performedBy', { firstName: 1, lastName: 1 })
      .exec();
  }
}
