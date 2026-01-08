import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ProductMigrationService {
  constructor(
    @InjectModel('Product') private productModel: Model<any>,
    @InjectModel('ProductCategory') private categoryModel: Model<any>,
    @InjectModel('Blog') private blogModel: Model<any>,
    @InjectModel('Address') private addressModel: Model<any>,
  ) {}

  async migrateProducts() {
    console.log('🚀 Starting Product migration...');

    // 1. Rename fields
    await this.productModel.updateMany(
      {},
      {
        $rename: {
          title: 'name',
          url: 'slug',
        },
      },
    );

    // 2. Rename discount to discountPrice
    await this.productModel.updateMany(
      {},
      {
        $rename: {
          discount: 'discountPrice',
        },
      },
    );

    // 3. Set default values for new fields
    await this.productModel.updateMany(
      {},
      {
        $set: {
          isAvailable: true,
          isFeatured: false,
          isBestSelling: false,
          isNewArrival: false,
          isGift: false,
          views: 0,
          sales: 0,
          rating: 0,
          reviewsCount: 0,
        },
      },
    );

    // 4. Convert weight, karat, material to string if they exist as numbers
    const products = await this.productModel.find({
      $or: [{ weight: { $type: 'number' } }, { karat: { $type: 'number' } }],
    });

    for (const product of products) {
      const update: any = {};
      if (typeof product.weight === 'number') {
        update.weight = `${product.weight} گرم`;
      }
      if (typeof product.karat === 'number') {
        update.karat = `${product.karat} عیار`;
      }
      if (update.weight || update.karat) {
        await this.productModel.updateOne(
          { _id: product._id },
          { $set: update },
        );
      }
    }

    // 5. Generate codes for existing products
    const productsWithoutCode = await this.productModel.find({
      code: { $exists: false },
    });
    for (const product of productsWithoutCode) {
      const code = this.generateProductCode(product);
      await this.productModel.updateOne(
        { _id: product._id },
        { $set: { code } },
      );
    }

    console.log('✅ Product migration completed!');
  }

  async migrateCategories() {
    console.log('🚀 Starting Category migration...');

    await this.categoryModel.updateMany(
      {},
      {
        $rename: {
          title: 'name',
          url: 'slug',
          image: 'heroImage',
        },
      },
    );

    console.log('✅ Category migration completed!');
  }

  async migrateBlogs() {
    console.log('🚀 Starting Blog migration...');

    await this.blogModel.updateMany(
      {},
      {
        $rename: {
          url: 'slug',
        },
      },
    );

    // Add default values
    const blogs = await this.blogModel.find();
    for (const blog of blogs) {
      const excerpt = blog.content
        ? blog.content.substring(0, 200) + '...'
        : '';
      await this.blogModel.updateOne(
        { _id: blog._id },
        {
          $set: {
            excerpt,
            tags: [],
            views: 0,
            likes: 0,
            isFeatured: false,
            publishedAt: blog.createdAt || new Date(),
          },
        },
      );
    }

    console.log('✅ Blog migration completed!');
  }

  async migrateAddresses() {
    console.log('🚀 Starting Address migration...');

    await this.addressModel.updateMany(
      {},
      {
        $rename: {
          receiverName: 'recipientName',
          receiverMobile: 'recipientMobile',
        },
        $unset: {
          content: '', // حذف legacy field
        },
      },
    );

    // Set default values
    await this.addressModel.updateMany(
      { title: { $exists: false } },
      {
        $set: {
          title: 'خانه',
          isDefault: false,
        },
      },
    );

    console.log('✅ Address migration completed!');
  }

  async runAllMigrations() {
    try {
      await this.migrateProducts();
      await this.migrateCategories();
      await this.migrateBlogs();
      await this.migrateAddresses();
      console.log('🎉 All migrations completed successfully!');
      return {
        success: true,
        message: 'All migrations completed successfully!',
      };
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  private generateProductCode(product: any): string {
    const categoryPrefix = this.getCategoryPrefix(product.category);
    const number = String(product._id).slice(-3).toUpperCase();
    return `${categoryPrefix}-${number}`;
  }

  private getCategoryPrefix(categoryId: string): string {
    // این رو بر اساس category ID تنظیم کن
    return 'PRD';
  }
}
