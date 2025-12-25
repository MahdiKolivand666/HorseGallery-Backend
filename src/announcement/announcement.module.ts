import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  Announcement,
  AnnouncementSchema,
} from './schemas/announcement.schema';
import { AnnouncementService } from './services/announcement.service';
import { AnnouncementController } from './controllers/announcement.controller';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [
    SharedModule, // ✅ برای استفاده از TokenBlacklistService در JwtGuard
    MongooseModule.forFeature([
      { name: Announcement.name, schema: AnnouncementSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AnnouncementController],
  providers: [AnnouncementService],
  exports: [AnnouncementService],
})
export class AnnouncementModule {}
