import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductMigrationService } from './product-migration.service';
import { MigrationController } from './migration.controller';
import { Product, productSchema } from '../product/schemas/product.schema';
import {
  ProductCategory,
  productCategorySchema,
} from '../product/schemas/product-category.schema';
import { Blog, BlogSchema } from '../blog/schemas/blog.schema';
import { Address, addressSchema } from '../user/schemas/address.schema';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [
    SharedModule, // ✅ برای استفاده از TokenBlacklistService در JwtGuard
    MongooseModule.forFeature([
      { name: Product.name, schema: productSchema },
      { name: ProductCategory.name, schema: productCategorySchema },
      { name: Blog.name, schema: BlogSchema },
      { name: Address.name, schema: addressSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [MigrationController],
  providers: [ProductMigrationService],
  exports: [ProductMigrationService],
})
export class MigrationModule {}
