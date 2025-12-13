import mongoose from 'mongoose';
import { Product, productSchema } from '../src/product/schemas/product.schema';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/horsegallery';

// فیلدهای required که باید همیشه وجود داشته باشند
const REQUIRED_FIELDS = [
  'name',
  'slug',
  'code',
  'price',
  'description',
  'category',
];

// فیلدهای با default که باید همیشه وجود داشته باشند
const DEFAULT_FIELDS = {
  discount: 0,
  onSale: false,
  stock: 0,
  version: 1,
  isAvailable: true,
  isFeatured: false,
  isBestSelling: false,
  isNewArrival: false,
  isGift: false,
  rating: 0,
  reviewsCount: 0,
  views: 0,
  viewsCount: 0,
  sales: 0,
  salesCount: 0,
  popularityScore: 0,
  productType: 'jewelry',
  lowCommission: false,
};

async function verifyProductStructure() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const ProductModel = mongoose.model<Product>('Product', productSchema);

    // همه محصولات را پیدا کن
    const products = await ProductModel.find({}).lean();
    console.log(`📦 Found ${products.length} products\n`);

    let validCount = 0;
    let invalidCount = 0;
    const issues: Array<{ id: string; name: string; missingFields: string[] }> = [];

    for (const product of products) {
      const productId = (product._id as any).toString();
      const productName = (product as any).name || 'نامشخص';
      const missingFields: string[] = [];

      // بررسی فیلدهای required
      for (const field of REQUIRED_FIELDS) {
        if ((product as any)[field] === undefined || (product as any)[field] === null) {
          missingFields.push(field);
        }
      }

      // بررسی فیلدهای با default
      for (const [field, defaultValue] of Object.entries(DEFAULT_FIELDS)) {
        if ((product as any)[field] === undefined || (product as any)[field] === null) {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        invalidCount++;
        issues.push({
          id: productId,
          name: productName,
          missingFields,
        });
      } else {
        validCount++;
      }
    }

    console.log(`📊 Summary:`);
    console.log(`✅ Valid products: ${validCount}`);
    console.log(`❌ Invalid products: ${invalidCount}`);

    if (issues.length > 0) {
      console.log(`\n⚠️  Products with missing fields:`);
      issues.slice(0, 10).forEach((issue) => {
        console.log(`  - ${issue.name} (${issue.id}):`);
        console.log(`    Missing: ${issue.missingFields.join(', ')}`);
      });
      if (issues.length > 10) {
        console.log(`  ... and ${issues.length - 10} more`);
      }
    } else {
      console.log(`\n✅ All products have correct structure!`);
    }

    // نمایش آمار فیلدها
    console.log(`\n📊 Field Statistics:`);
    const fieldStats: Record<string, { exists: number; missing: number }> = {};

    for (const field of [...REQUIRED_FIELDS, ...Object.keys(DEFAULT_FIELDS)]) {
      fieldStats[field] = { exists: 0, missing: 0 };
    }

    for (const product of products) {
      for (const field of [...REQUIRED_FIELDS, ...Object.keys(DEFAULT_FIELDS)]) {
        if ((product as any)[field] !== undefined && (product as any)[field] !== null) {
          fieldStats[field].exists++;
        } else {
          fieldStats[field].missing++;
        }
      }
    }

    for (const [field, stats] of Object.entries(fieldStats)) {
      const percentage = ((stats.exists / products.length) * 100).toFixed(1);
      console.log(
        `  ${field}: ${stats.exists}/${products.length} (${percentage}%) ${
          stats.missing > 0 ? `⚠️  ${stats.missing} missing` : '✅'
        }`,
      );
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error in verification:', error);
    process.exit(1);
  }
}

verifyProductStructure().catch(console.error);

