import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { ProductCategoryService } from '../services/product-category.service';
import { PublicProductQueryDto } from '../dtos/public-product-query.dto';
import { SearchProductQueryDto } from '../dtos/search-product-query.dto';
import { Public } from 'src/shared/decorators/public.decorator';

@ApiTags('Public Product')
@Controller('product/public')
@Public() // Mark entire controller as public
export class PublicProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly productCategoryService: ProductCategoryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get public products list' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async findAll(@Query() queryParams: any) {
    // Helper function to convert query params to array
    const toArray = (param: any): string[] | undefined => {
      if (!param) return undefined;
      if (Array.isArray(param)) return param;
      if (typeof param === 'string') {
        // Handle comma-separated values
        if (param.includes(',')) {
          return param.split(',').map(s => s.trim());
        }
        return [param];
      }
      return undefined;
    };

    // Helper function to convert string to boolean
    const toBoolean = (param: any): boolean | undefined => {
      if (param === undefined || param === null) return undefined;
      if (typeof param === 'boolean') return param;
      if (typeof param === 'string') {
        return param === 'true' || param === '1';
      }
      return undefined;
    };

    // Helper function to convert string to number
    const toNumber = (param: any): number | undefined => {
      if (param === undefined || param === null) return undefined;
      const num = Number(param);
      return isNaN(num) ? undefined : num;
    };

    // Build DTO from query params
    const dto: PublicProductQueryDto = {
      page: toNumber(queryParams.page),
      limit: toNumber(queryParams.limit),
      sortBy: queryParams.sortBy,
      category: queryParams.category,
      subcategory: queryParams.subcategory,
      productType: queryParams.productType,
      minPrice: toNumber(queryParams.minPrice),
      maxPrice: toNumber(queryParams.maxPrice),
      colors: toArray(queryParams.colors),
      karats: toArray(queryParams.karats),
      brands: toArray(queryParams.brands),
      branches: toArray(queryParams.branches),
      wages: toArray(queryParams.wages),
      sizes: toArray(queryParams.sizes),
      coatings: toArray(queryParams.coatings),
      minWeight: toNumber(queryParams.minWeight),
      maxWeight: toNumber(queryParams.maxWeight),
      inStock: toBoolean(queryParams.inStock),
      onSale: toBoolean(queryParams.onSale),
      lowCommission: toBoolean(queryParams.lowCommission),
      isFeatured: toBoolean(queryParams.isFeatured),
      isBestSelling: toBoolean(queryParams.isBestSelling),
      isNewArrival: toBoolean(queryParams.isNewArrival),
      isGift: toBoolean(queryParams.isGift),
    };

    // Remove undefined values
    Object.keys(dto).forEach(key => {
      if (dto[key] === undefined) {
        delete dto[key];
      }
    });

    return this.productService.findPublicProducts(dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products by query' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, enum: ['newest', 'oldest', 'price-asc', 'price-desc', 'popular'] })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Query parameter is required' })
  async search(@Query() queryParams: SearchProductQueryDto) {
    const { q, page = 1, limit = 20, sort = 'newest' } = queryParams;
    return this.productService.searchProducts(q, page, limit, sort);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get single product by slug' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('slug') slug: string) {
    // Increment views count when product is viewed
    await this.productService.incrementViews(slug);

    const product = await this.productService.findOneWithUrl(slug, {
      __v: 0,
    });

    // Get related products from same category
    const categoryId =
      typeof product.category === 'object' && product.category !== null
        ? (product.category as any)._id?.toString() ||
          (product.category as any).toString()
        : typeof product.category === 'string'
          ? product.category
          : undefined;

    const productId =
      typeof product._id === 'object' && product._id !== null
        ? (product._id as any).toString()
        : typeof product._id === 'string'
          ? product._id
          : undefined;

    // Get current product type to filter related products
    const currentProductType = (product as any).productType || 'jewelry';

    // Get related products from same category AND same productType (up to 8 products)
    let relatedProducts = await this.productService.findAll(
      {
        category: categoryId,
        exclude: productId ? [productId] : [],
        limit: 8,
        productType: currentProductType, // فیلتر بر اساس نوع محصول
      },
      {
        name: 1,
        slug: 1,
        images: 1,
        price: 1,
        discountPrice: 1,
        isAvailable: 1,
        productType: 1, // اضافه کردن productType به response
      },
    );

    // Collect IDs of already included products
    const excludeIds = productId ? [productId] : [];
    relatedProducts.products.forEach((p: any) => {
      const id = typeof p._id === 'object' ? p._id.toString() : p._id;
      if (id && !excludeIds.includes(id)) {
        excludeIds.push(id);
      }
    });

    // If not enough products in same category, get more from other categories (same productType)
    if (relatedProducts.products.length < 8) {
      const needed = 8 - relatedProducts.products.length;
      const additionalProducts = await this.productService.findAll(
        {
          exclude: excludeIds,
          limit: needed,
          productType: currentProductType, // همان نوع محصول
        },
        {
          name: 1,
          slug: 1,
          images: 1,
          price: 1,
          discountPrice: 1,
          isAvailable: 1,
          productType: 1,
        },
      );

      // Combine and remove duplicates
      const existingIds = new Set(
        relatedProducts.products.map((p: any) => {
          const id = typeof p._id === 'object' ? p._id.toString() : p._id;
          return id;
        }),
      );
      
      const newProducts = additionalProducts.products.filter((p: any) => {
        const id = typeof p._id === 'object' ? p._id.toString() : p._id;
        return id && !existingIds.has(id);
      });
      
      relatedProducts.products = [...relatedProducts.products, ...newProducts].slice(0, 8);
    }

    // Ensure at least one related product (if there are other products in database)
    if (relatedProducts.products.length === 0 && productId) {
      const fallbackProducts = await this.productService.findAll(
        {
          exclude: [productId],
          limit: 1,
          productType: currentProductType, // همان نوع محصول
        },
        {
          name: 1,
          slug: 1,
          images: 1,
          price: 1,
          discountPrice: 1,
          isAvailable: 1,
          productType: 1,
        },
      );
      relatedProducts.products = fallbackProducts.products;
    }

    return {
      ...product.toObject(),
      relatedProducts: relatedProducts.products,
    };
  }
}

@ApiTags('Public Product Category')
@Controller('product-category/public')
@Public() // Mark entire controller as public
export class PublicProductCategoryController {
  constructor(
    private readonly productCategoryService: ProductCategoryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get public product categories' })
  @ApiQuery({
    name: 'includeSubcategories',
    required: false,
    type: Boolean,
    description: 'Include subcategories in response',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  async findAll(
    @Query('includeSubcategories') includeSubcategories?: string,
  ) {
    const include = includeSubcategories === 'true' || includeSubcategories === undefined;
    return this.productCategoryService.findPublicCategories(include);
  }
}

