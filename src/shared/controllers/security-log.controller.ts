import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SecurityLogService } from '../services/security-log.service';
import { JwtGuard } from '../guards/jwt.guard';
import { RoleGuard } from '../guards/role.guard';
import { Role } from 'src/user/schemas/user.schema';
import { SecurityLevel } from '../schemas/security-log.schema';

/**
 * Admin-only controller for viewing security logs
 */
@ApiTags('Security Logs (Admin)')
@ApiBearerAuth()
@UseGuards(JwtGuard, new RoleGuard([Role.Admin]))
@Controller('admin/security-logs')
export class SecurityLogController {
  constructor(private readonly securityLogService: SecurityLogService) {}

  /**
   * Get recent security events
   */
  @Get()
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 100 })
  @ApiQuery({
    name: 'level',
    required: false,
    enum: SecurityLevel,
    example: SecurityLevel.Critical,
  })
  async getRecentEvents(
    @Query('limit') limit?: number,
    @Query('level') level?: SecurityLevel,
  ) {
    return await this.securityLogService.getRecentEvents(
      limit ? parseInt(limit.toString()) : 100,
      level,
    );
  }

  /**
   * Get security statistics
   */
  @Get('statistics')
  @ApiQuery({ name: 'days', required: false, type: Number, example: 7 })
  async getStatistics(@Query('days') days?: number) {
    const daysNum = days ? parseInt(days.toString()) : 7;
    const since = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

    return await this.securityLogService.getStatistics(since);
  }

  /**
   * Get failed login attempts for a specific IP or mobile
   */
  @Get('failed-attempts')
  @ApiQuery({ name: 'ipOrMobile', required: true, type: String })
  @ApiQuery({ name: 'minutes', required: false, type: Number, example: 15 })
  async getFailedAttempts(
    @Query('ipOrMobile') ipOrMobile: string,
    @Query('minutes') minutes?: number,
  ) {
    const minutesNum = minutes ? parseInt(minutes.toString()) : 15;
    const since = new Date(Date.now() - minutesNum * 60 * 1000);

    const count = await this.securityLogService.getFailedLoginAttempts(
      ipOrMobile,
      since,
    );

    const shouldBlock = await this.securityLogService.shouldBlock(ipOrMobile);

    return {
      ipOrMobile,
      failedAttempts: count,
      shouldBlock,
      period: `${minutesNum} minutes`,
    };
  }
}
