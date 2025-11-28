import { Module } from '@nestjs/common';
import { ProductController } from './controllers/product.controller';
import { ProductService } from './services/product.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductCategoryService } from './services/product-category.service';
import { ProductCategoryController } from './controllers/product-category.controller';
import { Product, productSchema } from './schemas/product.schema';
import {
  ProductCategory,
  productCategorySchema,
} from './schemas/product-category.schema';
import { SiteProductController } from './controllers/site-product.controller';
import { PublicProductController, PublicProductCategoryController } from './controllers/public-product.controller';
import {
  InventoryRecord,
  inventoryRecordSchema,
} from './schemas/inventory-record.schema';
import { InventoryRecordService } from './services/inventory-record.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  controllers: [
    // Public controllers must be registered FIRST to avoid route conflicts
    PublicProductController,
    PublicProductCategoryController,
    SiteProductController,
    ProductController,
    ProductCategoryController,
  ],
  exports: [ProductService],
  providers: [ProductService, ProductCategoryService, InventoryRecordService],
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
      {
        name: Product.name,
        schema: productSchema,
      },
      {
        name: ProductCategory.name,
        schema: productCategorySchema,
      },
      {
        name: InventoryRecord.name,
        schema: inventoryRecordSchema,
      },
    ]),
  ],
})
export class ProductModule {}
