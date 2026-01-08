import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductCategoryService } from '../services/product-category.service';
import { ProductCategoryQueryDto } from '../dtos/product-category-query.dto';
import { ApiTags } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { ProductQueryDto } from '../dtos/product-query.dto';

@ApiTags('Public Product')
@Controller('site/product')
export class SiteProductController {
  constructor(
    private readonly productCategoryService: ProductCategoryService,
    private readonly productService: ProductService,
  ) {}

  @Get()
  findAll(@Query() queryParams: ProductQueryDto) {
    return this.productService.findAll(queryParams, {
      __v: 0,
    });
  }

  @Get('categories')
  findCategories(@Query() queryParams: ProductCategoryQueryDto) {
    return this.productCategoryService.findAll(queryParams, {
      name: 1,
      slug: 1,
      heroImage: 1,
    });
  }

  @Get('category/:url')
  async findCategory(
    @Param('url') url: string,
    @Query() queryParams: ProductQueryDto,
  ) {
    const category = await this.productCategoryService.findOneWithUrl(url);

    const { products, count } = await this.productService.findAll(
      { ...queryParams, category: (category._id as string).toString() },
      {
        name: 1,
        slug: 1,
        images: 1,
      },
    );

    return { category, products, count };
  }

  @Get(':url')
  async findProduct(@Param('url') url: string) {
    const product = await this.productService.findOneWithUrl(url);

    // Get current product type to filter related products
    // ⚠️ مهم: فقط محصولات با همان productType نمایش داده می‌شوند
    const currentProductType = product.productType || 'jewelry';

    const relatedProducts = await this.productService.findAll(
      {
        category: product.category._id.toString(),
        exclude: [(product._id as string).toString()],
        productType: currentProductType, // فیلتر بر اساس نوع محصول - اجباری!
      },
      {
        name: 1,
        slug: 1,
        images: 1,
        productType: 1, // اضافه کردن productType به response
      },
    );

    return { product, relatedProducts };
  }
}
