// App Module - Main module that orchestrates the application
// Responsibilities:
// 1. Database connection (MongoDB)
// 2. JWT management
// 3. Logging and error handling
// 4. Rate limiting
// 5. Middleware configuration
// 6. Loading all feature modules

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlogModule } from './blog/blog.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LogFilter } from './shared/filters/log.filter';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { MongoExceptionFilter } from './shared/filters/mongo-exception.filter';
import { Log, LogSchema } from './shared/schemas/log.schema';
import { AuditLog, auditLogSchema } from './shared/schemas/audit-log.schema';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LogInterceptor } from './shared/interceptors/log.interceptor';
import { TimeMiddleware } from './shared/middleware/time.middleware';
import { CsrfMiddleware } from './shared/middleware/csrf.middleware';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { IpThrottleGuard } from './shared/guards/ip-throttle.guard';
import { SeoModule } from './seo/seo.module';
import { ProductModule } from './product/product.module';
import { TicketModule } from './ticket/ticket.module';
import { ShopModule } from './shop/shop.module';
import { SharedModule } from './shared/shared.module';
import { FAQModule } from './faq/faq.module';
import { GoldPriceModule } from './gold-price/gold-price.module';
import { AnnouncementModule } from './announcement/announcement.module';
import { MigrationModule } from './migrations/migration.module';
import { AuditLogService } from './shared/services/audit-log.service';
import { ApiKeyService } from './shared/services/api-key.service';
import { ApiKey, ApiKeySchema } from './shared/schemas/api-key.schema';
import { SecurityLogService } from './shared/services/security-log.service';
import {
  SecurityLog,
  SecurityLogSchema,
} from './shared/schemas/security-log.schema';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),

    // ScheduleModule for cron jobs
    ScheduleModule.forRoot(),

    // ThrottlerModule and ThrottlerGuard for rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),

    // JWT Module for user token management
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        global: true,
      }),
      inject: [ConfigService],
    }),
    BlogModule,
    // Mongoose connection to MongoDB database
    MongooseModule.forRoot('mongodb://localhost:27017/horsegallery'),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'files'),
      serveRoot: '/files',
    }),
    MongooseModule.forFeature([
      { name: Log.name, schema: LogSchema },
      { name: AuditLog.name, schema: auditLogSchema },
      { name: ApiKey.name, schema: ApiKeySchema },
      { name: SecurityLog.name, schema: SecurityLogSchema },
    ]),
    UserModule,
    SeoModule,
    ProductModule,
    TicketModule,
    ShopModule,
    SharedModule,
    FAQModule,
    GoldPriceModule,
    AnnouncementModule,
    MigrationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AuditLogService,
    ApiKeyService,
    SecurityLogService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: LogFilter,
    },
    {
      provide: APP_FILTER,
      useClass: MongoExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LogInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: IpThrottleGuard,
    },
  ],
  exports: [AuditLogService, SecurityLogService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TimeMiddleware).forRoutes('*');
    consumer.apply(CsrfMiddleware).forRoutes('*'); // Apply CSRF token generation to all routes
  }
}
