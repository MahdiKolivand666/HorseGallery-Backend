import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FAQ, FAQSchema } from './schemas/faq.schema';
import { FAQService } from './services/faq.service';
import { FAQController } from './controllers/faq.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: FAQ.name, schema: FAQSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [FAQController],
  providers: [FAQService],
  exports: [FAQService],
})
export class FAQModule {}

