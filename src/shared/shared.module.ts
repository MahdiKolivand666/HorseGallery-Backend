import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SecurityLog, SecurityLogSchema } from './schemas/security-log.schema';
import { SecurityLogService } from './services/security-log.service';
import { SecurityLogController } from './controllers/security-log.controller';
import { ImagesController } from './controllers/images.controller';
import {
  TokenBlacklist,
  TokenBlacklistSchema,
} from './schemas/token-blacklist.schema';
import { TokenBlacklistService } from './services/token-blacklist.service';

/**
 * Shared module for common services and controllers
 */
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: SecurityLog.name, schema: SecurityLogSchema },
      { name: TokenBlacklist.name, schema: TokenBlacklistSchema },
    ]),
  ],
  controllers: [SecurityLogController, ImagesController],
  providers: [SecurityLogService, TokenBlacklistService],
  exports: [SecurityLogService, TokenBlacklistService],
})
export class SharedModule {}
