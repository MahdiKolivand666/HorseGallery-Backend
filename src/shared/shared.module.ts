import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SecurityLog, SecurityLogSchema } from './schemas/security-log.schema';
import { SecurityLogService } from './services/security-log.service';
import { SecurityLogController } from './controllers/security-log.controller';

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
    ]),
  ],
  controllers: [SecurityLogController],
  providers: [SecurityLogService],
  exports: [SecurityLogService],
})
export class SharedModule {}
