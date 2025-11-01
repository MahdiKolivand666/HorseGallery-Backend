// app module b onvane setade markazi porozhe estefade mishe va karhayi az ghabile 

// 1-etesal b database
// 2-modiriyat Jwt
// 3-log giri va handle kardan khataha
// 4-mahdod kardane tedad request
// 5-ezafe kardan Middleware
// 6-bargozari hameye module haye asli

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlogModule } from './blog/blog.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, MiddlewareBuilder } from '@nestjs/core';
import { LogFilter } from './shared/filters/log.filter';
import { Log, LogSchema } from './shared/schemas/log.schema';
import { ConfigModule } from '@nestjs/config';
import { LogInterceptor } from './shared/interceptors/log.interceptor';
import { TimeMiddleware } from './shared/middleware/time.middleware';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SeoModule } from './seo/seo.module';
import { ProductModule } from './product/product.module';
import { TicketModule } from './ticket/ticket.module';
import { ShopModule } from './shop/shop.module';
import { request } from 'axios'

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),

    // throttlemodule va throttelgauard baraye rate limmiting estefade mishe

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),

    // jwt module baraye kar ba token karbar estefade mishe
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      global: true,
    }),
    BlogModule,
    MongooseModule.forRoot('mongodb://localhost:27017/nest-app'),

    //  moongoose baraye etesale nestjs b database estefade mishe//

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'files'),
      serveRoot: '/files',
    }),
    MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }]),
    UserModule,
    SeoModule,
    ProductModule,
    TicketModule,
    ShopModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: LogFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LogInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TimeMiddleware).forRoutes('*');
  }
}
