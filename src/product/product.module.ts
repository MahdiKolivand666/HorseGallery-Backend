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
import {
  InventoryRecord,
  inventoryRecordSchema,
} from './schemas/inventory-record.schema';
import { InventoryRecordService } from './services/inventory-record.service';

@Module({
  controllers: [
    ProductController,
    ProductCategoryController,
    SiteProductController,
  ],
  exports: [ProductService],
  providers: [ProductService, ProductCategoryService, InventoryRecordService],
  imports: [
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
