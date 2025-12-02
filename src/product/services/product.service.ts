import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductDto } from '../dtos/product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from '../schemas/product.schema';
import { Model } from 'mongoose';
import { ProductQueryDto } from '../dtos/product-query.dto';
import { PublicProductQueryDto } from '../dtos/public-product-query.dto';
import { sortFunction } from 'src/shared/utils/sort-utils';
import { deleteImages } from 'src/shared/utils/file-utils';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { InventoryRecordService } from './inventory-record.service';
import { Action, EditedBy } from '../schemas/inventory-record.schema';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    private readonly inventoryRecordService: InventoryRecordService,
  ) {}

  async findAll(
    queryParams: ProductQueryDto,
    selectObject: Record<string, 0 | 1> = { __v: 0 },
  ) {
    const {
      limit = 5,
      page = 1,
      title,
      sort,
      category,
      url,
      productType,
      exclude,
    } = queryParams;

    const query: any = {};

    // Support both old (title) and new (name) field names
    if (title) {
      query.$or = [
        { name: { $regex: title, $options: 'i' } },
        { title: { $regex: title, $options: 'i' } },
      ];
    }

    if (url) {
      query.slug = { $regex: url, $options: 'i' };
    }

    if (category) {
      query.category = category;
    }

    // Product Type filter
    if (productType) {
      query.productType = productType;
    }

    if (exclude?.length) {
      query._id = { $nin: exclude };
    }

    const sortObject = sortFunction(sort);

    const products = await this.productModel
      .find(query)
      .populate('category', { name: 1, title: 1 })
      .sort(sortObject)
      .select(selectObject)
      .skip(page - 1)
      .limit(limit)
      .exec();

    const count = await this.productModel.countDocuments(query);

    return { count, products };
  }

  async findPublicProducts(queryParams: PublicProductQueryDto) {
    const {
      limit = 18,
      page = 1,
      sortBy = 'newest',
      category,
      subcategory,
      productType,
      minPrice,
      maxPrice,
      colors,
      karats,
      brands,
      branches,
      wages,
      sizes,
      coatings,
      minWeight,
      maxWeight,
      inStock,
      onSale,
      lowCommission,
      isFeatured,
      isBestSelling,
      isNewArrival,
      isGift,
    } = queryParams;

    // Helper function to ensure array format
    const toArray = (param: any): string[] => {
      if (!param) return [];
      if (Array.isArray(param)) return param;
      return [param];
    };

    const query: any = {
      isAvailable: true, // Only show available products
    };

    // Product Type filter - پیش‌فرض: فقط jewelry
    if (productType) {
      query.productType = productType;
    } else {
      // اگر productType مشخص نشده، فقط محصولات jewelry را برگردان
      // (سکه و شمش باید صریحاً درخواست شوند)
      query.productType = 'jewelry';
    }

    // Category filter by slug
    if (category) {
      const categoryDoc = await this.productModel.db
        .collection('productcategories')
        .findOne({ slug: category });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      } else {
        // If category not found, return empty result
        return {
          data: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        };
      }
    }

    // Subcategory filter
    if (subcategory) {
      // If category is provided, use it to find subcategory
      if (category) {
        const categoryDoc = await this.productModel.db
          .collection('productcategories')
          .findOne({ slug: category });
        if (categoryDoc && categoryDoc.subcategories) {
          const subcat = categoryDoc.subcategories.find(
            (s: any) => s.slug === subcategory,
          );
          if (subcat && subcat._id) {
            query.subcategory = subcat._id;
          } else {
            return {
              data: [],
              pagination: {
                total: 0,
                page,
                limit,
                totalPages: 0,
              },
            };
          }
        }
      } else {
        // If no category, search all categories for subcategory
        const allCategories = await this.productModel.db
          .collection('productcategories')
          .find({ 'subcategories.slug': subcategory })
          .toArray();
        if (allCategories.length > 0) {
          const subcatIds = allCategories
            .flatMap((cat: any) => cat.subcategories || [])
            .filter((sub: any) => sub.slug === subcategory)
            .map((sub: any) => sub._id);
          if (subcatIds.length > 0) {
            query.subcategory = { $in: subcatIds };
          } else {
            return {
              data: [],
              pagination: {
                total: 0,
                page,
                limit,
                totalPages: 0,
              },
            };
          }
        }
      }
    }

    // Price Range
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined) {
        query.price.$lte = Number(maxPrice);
      }
    }

    // Colors filter (stored in material or separate field - adjust based on your schema)
    const colorsArray = toArray(colors);
    if (colorsArray.length > 0) {
      // Note: Adjust field name based on your schema
      // If you have a color field, use it; otherwise use material
      const colorConditions: any[] = [];
      colorsArray.forEach((color: string) => {
        colorConditions.push({ material: { $regex: color, $options: 'i' } });
      });
      if (colorConditions.length > 0) {
        query.$and = query.$and || [];
        query.$and.push({ $or: colorConditions });
      }
    }

    // Karats filter
    const karatsArray = toArray(karats);
    if (karatsArray.length > 0) {
      const karatConditions: any[] = [];
      karatsArray.forEach((karat: string) => {
        karatConditions.push({ karat: { $regex: karat, $options: 'i' } });
      });
      if (karatConditions.length > 0) {
        query.$and = query.$and || [];
        query.$and.push({ $or: karatConditions });
      }
    }

    // Brands filter
    const brandsArray = toArray(brands);
    if (brandsArray.length > 0) {
      query.brand = { $in: brandsArray };
    }

    // Branches filter (if you have a branch field)
    const branchesArray = toArray(branches);
    if (branchesArray.length > 0) {
      // Adjust field name based on your schema
      query.branch = { $in: branchesArray };
    }

    // Wages filter (if you have a wage field)
    const wagesArray = toArray(wages);
    if (wagesArray.length > 0) {
      query.wage = { $in: wagesArray };
    }

    // Sizes filter (if you have a size field)
    const sizesArray = toArray(sizes);
    if (sizesArray.length > 0) {
      query.size = { $in: sizesArray };
    }

    // Coatings filter (stored in coverage field)
    const coatingsArray = toArray(coatings);
    if (coatingsArray.length > 0) {
      query.coverage = { $in: coatingsArray };
    }

    // Weight Range (weight is stored as string like "12.5 گرم")
    if (minWeight !== undefined || maxWeight !== undefined) {
      // We need to extract numeric value from weight string
      query.$expr = query.$expr || { $and: [] };
      if (minWeight !== undefined) {
        query.$expr.$and.push({
          $gte: [
            {
              $toDouble: {
                $arrayElemAt: [
                  {
                    $split: [{ $ifNull: ['$weight', '0'] }, ' '],
                  },
                  0,
                ],
              },
            },
            Number(minWeight),
          ],
        });
      }
      if (maxWeight !== undefined) {
        query.$expr.$and.push({
          $lte: [
            {
              $toDouble: {
                $arrayElemAt: [
                  {
                    $split: [{ $ifNull: ['$weight', '0'] }, ' '],
                  },
                  0,
                ],
              },
            },
            Number(maxWeight),
          ],
        });
      }
    }

    // Stock filter
    if (inStock === true) {
      query.stock = { $gt: 0 };
    }

    // On Sale filter
    if (onSale === true) {
      // Check if product has onSale flag OR has discountPrice OR has discount
      const saleConditions: any[] = [
        { onSale: true },
        { discountPrice: { $exists: true, $ne: null, $gt: 0 } },
        { discount: { $exists: true, $gt: 0 } },
      ];

      if (query.$and) {
        query.$and.push({ $or: saleConditions });
      } else if (query.$or) {
        // If there are existing $or conditions, combine them
        query.$and = [{ $or: query.$or }, { $or: saleConditions }];
        delete query.$or;
      } else {
        query.$or = saleConditions;
      }
    }

    // Low Commission filter
    if (lowCommission === true) {
      // Check if product has lowCommission flag OR has low commission/wage
      const lowCommissionConditions: any[] = [
        { lowCommission: true },
        { wage: 'کم' },
      ];
      // If commission field exists and is less than 5%
      lowCommissionConditions.push({ commission: { $exists: true, $lte: 5 } });

      if (query.$and) {
        query.$and.push({ $or: lowCommissionConditions });
      } else if (query.$or) {
        // If there are existing $or conditions, combine them
        query.$and = [{ $or: query.$or }, { $or: lowCommissionConditions }];
        delete query.$or;
      } else {
        query.$or = lowCommissionConditions;
      }
    }

    // Feature filters
    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured;
    }
    if (isBestSelling !== undefined) {
      query.isBestSelling = isBestSelling;
    }
    if (isNewArrival !== undefined) {
      query.isNewArrival = isNewArrival;
    }
    if (isGift !== undefined) {
      query.isGift = isGift;
    }

    // Sort mapping
    const sortOptions: Record<string, any> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      'price-low': { price: 1 }, // Alias for price-asc
      'price-high': { price: -1 }, // Alias for price-desc
      popular: {
        popularityScore: -1,
        salesCount: -1,
        sales: -1,
        viewsCount: -1,
        views: -1,
        reviewsCount: -1,
        rating: -1,
      },
      discount: { discount: -1 }, // مرتب‌سازی بر اساس بیشترین تخفیف
    };
    const sort = sortOptions[sortBy] || sortOptions.newest;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const products = await this.productModel
      .find(query)
      .populate('category', { name: 1, slug: 1, _id: 1 })
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean()
      .exec();

    // Manually populate subcategory from category's subcategories array
    const productsWithSubcategory = await Promise.all(
      products.map(async (product: any) => {
        if (product.subcategory) {
          // Find the category that contains this subcategory
          const categoryDoc = await this.productModel.db
            .collection('productcategories')
            .findOne({ _id: product.category });

          if (categoryDoc && categoryDoc.subcategories) {
            const subcat = categoryDoc.subcategories.find(
              (s: any) => s._id.toString() === product.subcategory.toString(),
            );
            if (subcat) {
              product.subcategory = {
                _id: subcat._id,
                name: subcat.name,
                slug: subcat.slug,
              };
            }
          }
        }
        return product;
      }),
    );

    const total = await this.productModel.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    return {
      data: productsWithSubcategory,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
      },
    };
  }

  async findOne(id: string, selectObject: Record<string, 0 | 1> = { __v: 0 }) {
    const product = await this.productModel
      .findOne({ _id: id })
      .populate('category', { name: 1, title: 1 })
      .select(selectObject)
      .exec();
    if (product) {
      return product;
    } else {
      throw new NotFoundException();
    }
  }

  async findOneWithUrl(
    url: string,
    selectObject: Record<string, 0 | 1> = { __v: 0 },
  ) {
    const product = await this.productModel
      .findOne({ slug: url })
      .populate('category', { name: 1, title: 1 })
      .select(selectObject)
      .exec();
    if (product) {
      return product;
    } else {
      throw new NotFoundException();
    }
  }

  async create(body: ProductDto) {
    // Validation: بررسی قیمت تخفیف
    if (body.discountPrice !== null && body.discountPrice !== undefined) {
      if (body.discountPrice < 0) {
        throw new BadRequestException('قیمت تخفیف نمی‌تواند منفی باشد');
      }
      if (body.discountPrice >= body.price) {
        throw new BadRequestException('قیمت تخفیف باید کمتر از قیمت اصلی باشد');
      }
    }

    const newProduct = new this.productModel(body);
    await newProduct.save();
    return newProduct;
  }

  async update(id: string, body: UpdateProductDto) {
    const product = await this.findOne(id, { _id: 1, image: 1 });

    // Validation: بررسی قیمت تخفیف
    if (body.discountPrice !== undefined) {
      if (body.discountPrice !== null) {
        const price = body.price !== undefined ? body.price : product.price;
        if (body.discountPrice < 0) {
          throw new BadRequestException('قیمت تخفیف نمی‌تواند منفی باشد');
        }
        if (body.discountPrice >= price) {
          throw new BadRequestException(
            'قیمت تخفیف باید کمتر از قیمت اصلی باشد',
          );
        }
      }
    }

    if (body?.images?.length) {
      // eslint-disable-next-line no-unsafe-optional-chaining
      for (const image of product?.images) {
        if (!body.images.includes(image)) {
          await deleteImages(image, 'product');
        }
      }
    }
    return await this.productModel.findByIdAndUpdate(id, body, { new: true });
  }

  async addStock(
    id: string,
    quantity: number,
    editedBy: EditedBy,
    order: string | null = null,
  ) {
    const product = await this.findOne(id);
    const oldStock = product.stock || 0;
    product.stock = oldStock + quantity;
    await product.save();
    await this.inventoryRecordService.createRecord({
      action: Action.Add,
      quantity: quantity,
      editedBy: editedBy,
      product: id,
      order: order ?? undefined,
    });
    return product;
  }

  async removeStock(
    id: string,
    quantity: number,
    editedBy: EditedBy,
    order: string | null = null,
  ) {
    // Optimistic locking with retries
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const product = await this.productModel.findById(id);

        if (!product) {
          throw new NotFoundException('محصول یافت نشد');
        }

        const oldStock = product.stock || 0;
        const oldVersion = product.version || 1;

        if (oldStock === 0) {
          throw new BadRequestException(
            `تعداد محصول ${(product as any).name || (product as any).title || 'نامشخص'} کمتر از 0 است`,
          );
        }

        if (oldStock < quantity) {
          throw new BadRequestException(
            `موجودی کافی نیست. موجودی فعلی: ${oldStock}`,
          );
        }

        // Use findOneAndUpdate with version check for atomic operation
        const updatedProduct = await this.productModel.findOneAndUpdate(
          { _id: id, version: oldVersion },
          {
            $inc: { stock: -quantity, version: 1 },
          },
          { new: true },
        );

        if (!updatedProduct) {
          // Version mismatch - someone else updated the product
          retries++;
          if (retries >= maxRetries) {
            throw new BadRequestException(
              'خطا در به‌روزرسانی موجودی. لطفاً دوباره تلاش کنید',
            );
          }
          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 100 * retries));
          continue;
        }

        // Record the inventory change
        await this.inventoryRecordService.createRecord({
          action: Action.Remove,
          quantity: quantity,
          editedBy: editedBy,
          product: id,
          order: order ?? undefined,
        });

        return updatedProduct;
      } catch (error) {
        if (
          error instanceof BadRequestException ||
          error instanceof NotFoundException
        ) {
          throw error;
        }
        retries++;
        if (retries >= maxRetries) {
          throw error;
        }
      }
    }

    throw new BadRequestException(
      'خطا در به‌روزرسانی موجودی بعد از چندین تلاش',
    );
  }
  async delete(id: string) {
    const product = await this.findOne(id);

    // eslint-disable-next-line no-unsafe-optional-chaining
    for (const image of product?.images) {
      await deleteImages(image, 'product');
    }
    await product.deleteOne();

    return product;
  }

  async incrementViews(slug: string) {
    const product = await this.productModel.findOneAndUpdate(
      { slug },
      {
        $inc: {
          views: 1,
          viewsCount: 1,
        },
      },
      { new: true },
    );
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async incrementSales(productId: string, quantity: number = 1) {
    const product = await this.productModel.findByIdAndUpdate(
      productId,
      {
        $inc: {
          sales: quantity,
          salesCount: quantity,
        },
      },
      { new: true },
    );
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    // Update popularity score after sales increment
    await this.calculatePopularityScore(productId);
    return product;
  }

  async calculatePopularityScore(productId: string) {
    const product = await this.findOne(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Formula: (salesCount * 5) + (viewsCount * 1) + (rating * 10)
    const salesCount =
      (product as any).salesCount || (product as any).sales || 0;
    const viewsCount =
      (product as any).viewsCount || (product as any).views || 0;
    const rating = product.rating || 0;

    const popularityScore = salesCount * 5 + viewsCount * 1 + rating * 10;

    await this.productModel.findByIdAndUpdate(
      productId,
      { popularityScore },
      { new: true },
    );

    return popularityScore;
  }

  async searchProducts(
    query: string,
    page: number = 1,
    limit: number = 20,
    sort: string = 'newest',
  ) {
    // Validation: Check if query is provided
    if (!query || query.trim() === '') {
      return {
        success: false,
        error: 'پارامتر جستجو الزامی است',
        query: '',
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit,
        },
      };
    }

    const searchQuery = query.trim();
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build search filter
    // جستجو در چند فیلد: name, description, code
    const searchFilter: any = {
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } }, // نام محصول
        { description: { $regex: searchQuery, $options: 'i' } }, // توضیحات
        { code: { $regex: searchQuery, $options: 'i' } }, // کد محصول
      ],
      isAvailable: true, // فقط محصولات موجود
      stock: { $gt: 0 }, // فقط محصولاتی که موجودی دارند
    };

    // Build sort option
    const sortOptions: Record<string, any> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      popular: { salesCount: -1, sales: -1, popularityScore: -1 },
    };
    const sortOption = sortOptions[sort] || sortOptions.newest;

    // Execute search query
    const products = await this.productModel
      .find(searchFilter)
      .populate('category', { name: 1, slug: 1, _id: 1 })
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean()
      .exec();

    // Manually populate subcategory from category's subcategories array
    const productsWithSubcategory = await Promise.all(
      products.map(async (product: any) => {
        if (product.subcategory) {
          // Find the category that contains this subcategory
          const categoryDoc = await this.productModel.db
            .collection('productcategories')
            .findOne({ _id: product.category });

          if (categoryDoc && categoryDoc.subcategories) {
            const subcat = categoryDoc.subcategories.find(
              (s: any) => s._id.toString() === product.subcategory.toString(),
            );
            if (subcat) {
              product.subcategory = {
                _id: subcat._id,
                name: subcat.name,
                slug: subcat.slug,
              };
            }
          }
        }
        return product;
      }),
    );

    // Count total results
    const totalItems = await this.productModel.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalItems / limitNum);

    // Return results
    return {
      success: true,
      query: searchQuery,
      data: productsWithSubcategory,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        itemsPerPage: limitNum,
      },
    };
  }
}
