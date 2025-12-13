import mongoose from 'mongoose';
import { Product, productSchema } from '../src/product/schemas/product.schema';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/horsegallery';

async function fixProductStructure() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const ProductModel = mongoose.model<Product>('Product', productSchema);

    // همه محصولات را پیدا کن
    const products = await ProductModel.find({}).lean();
    console.log(`📦 Found ${products.length} products`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      const productId = product._id;
      const updates: any = {};
      let needsUpdate = false;

      // ============================================
      // فیلدهای با Default Values
      // ============================================

      // discount (default: 0)
      if ((product as any).discount === undefined || (product as any).discount === null) {
        updates.discount = 0;
        needsUpdate = true;
      }

      // onSale (default: false)
      if ((product as any).onSale === undefined || (product as any).onSale === null) {
        updates.onSale = false;
        needsUpdate = true;
      }

      // stock (default: 0)
      if ((product as any).stock === undefined || (product as any).stock === null) {
        updates.stock = 0;
        needsUpdate = true;
      }

      // version (default: 1)
      if ((product as any).version === undefined || (product as any).version === null) {
        updates.version = 1;
        needsUpdate = true;
      }

      // isAvailable (default: true)
      if ((product as any).isAvailable === undefined || (product as any).isAvailable === null) {
        updates.isAvailable = true;
        needsUpdate = true;
      }

      // isFeatured (default: false)
      if ((product as any).isFeatured === undefined || (product as any).isFeatured === null) {
        updates.isFeatured = false;
        needsUpdate = true;
      }

      // isBestSelling (default: false)
      if ((product as any).isBestSelling === undefined || (product as any).isBestSelling === null) {
        updates.isBestSelling = false;
        needsUpdate = true;
      }

      // isNewArrival (default: false)
      if ((product as any).isNewArrival === undefined || (product as any).isNewArrival === null) {
        updates.isNewArrival = false;
        needsUpdate = true;
      }

      // isGift (default: false)
      if ((product as any).isGift === undefined || (product as any).isGift === null) {
        updates.isGift = false;
        needsUpdate = true;
      }

      // rating (default: 0)
      if ((product as any).rating === undefined || (product as any).rating === null) {
        updates.rating = 0;
        needsUpdate = true;
      }

      // reviewsCount (default: 0)
      if ((product as any).reviewsCount === undefined || (product as any).reviewsCount === null) {
        updates.reviewsCount = 0;
        needsUpdate = true;
      }

      // views (default: 0)
      if ((product as any).views === undefined || (product as any).views === null) {
        updates.views = 0;
        needsUpdate = true;
      }

      // viewsCount (default: 0)
      if ((product as any).viewsCount === undefined || (product as any).viewsCount === null) {
        updates.viewsCount = 0;
        needsUpdate = true;
      }

      // sales (default: 0)
      if ((product as any).sales === undefined || (product as any).sales === null) {
        updates.sales = 0;
        needsUpdate = true;
      }

      // salesCount (default: 0)
      if ((product as any).salesCount === undefined || (product as any).salesCount === null) {
        updates.salesCount = 0;
        needsUpdate = true;
      }

      // popularityScore (default: 0)
      if ((product as any).popularityScore === undefined || (product as any).popularityScore === null) {
        updates.popularityScore = 0;
        needsUpdate = true;
      }

      // productType (default: 'jewelry')
      if ((product as any).productType === undefined || (product as any).productType === null) {
        updates.productType = 'jewelry';
        needsUpdate = true;
      }

      // lowCommission (default: false)
      if ((product as any).lowCommission === undefined || (product as any).lowCommission === null) {
        updates.lowCommission = false;
        needsUpdate = true;
      }

      // ============================================
      // محاسبه discount و onSale از discountPrice
      // ============================================
      const price = (product as any).price;
      const discountPrice = (product as any).discountPrice;
      const currentDiscount = (product as any).discount;
      const currentOnSale = (product as any).onSale;

      let calculatedDiscount = 0;
      let calculatedOnSale = false;
      let finalDiscountPrice: number | null = null;

      if (discountPrice !== null && discountPrice !== undefined && price) {
        if (discountPrice < price && discountPrice > 0) {
          calculatedDiscount = Math.round(((price - discountPrice) / price) * 100);
          calculatedOnSale = true;
          finalDiscountPrice = discountPrice;
        } else {
          // اگر discountPrice نامعتبر است، آن را null کن
          finalDiscountPrice = null;
          calculatedDiscount = 0;
          calculatedOnSale = false;
        }
      } else {
        finalDiscountPrice = null;
        calculatedDiscount = 0;
        calculatedOnSale = false;
      }

      // اگر discount یا onSale با محاسبه متفاوت است، به‌روزرسانی کن
      if (currentDiscount !== calculatedDiscount) {
        updates.discount = calculatedDiscount;
        needsUpdate = true;
      }

      if (currentOnSale !== calculatedOnSale) {
        updates.onSale = calculatedOnSale;
        needsUpdate = true;
      }

      // اگر discountPrice نامعتبر است، آن را null کن
      if (discountPrice !== null && discountPrice !== undefined && price && discountPrice >= price) {
        updates.discountPrice = null;
        needsUpdate = true;
      }

      // ============================================
      // همگام‌سازی views و viewsCount
      // ============================================
      const views = (product as any).views || 0;
      const viewsCount = (product as any).viewsCount || 0;
      if (views !== viewsCount) {
        updates.viewsCount = views;
        needsUpdate = true;
      }

      // ============================================
      // همگام‌سازی sales و salesCount
      // ============================================
      const sales = (product as any).sales || 0;
      const salesCount = (product as any).salesCount || 0;
      if (sales !== salesCount) {
        updates.salesCount = sales;
        needsUpdate = true;
      }

      // ============================================
      // اعمال به‌روزرسانی‌ها
      // ============================================
      if (needsUpdate) {
        await ProductModel.findByIdAndUpdate(
          productId,
          { $set: updates },
          { new: true },
        );

        updatedCount++;
        if (updatedCount % 10 === 0) {
          console.log(`✅ Updated ${updatedCount} products...`);
        }
      } else {
        skippedCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Updated: ${updatedCount} products`);
    console.log(`⚠️  Skipped: ${skippedCount} products (already correct)`);
    console.log(`📦 Total: ${products.length} products`);

    // نمایش آمار محصولات بر اساس productType
    const stats = await ProductModel.aggregate([
      {
        $group: {
          _id: '$productType',
          count: { $sum: 1 },
        },
      },
    ]);

    console.log('\n📊 آمار محصولات بر اساس نوع:');
    stats.forEach((stat) => {
      console.log(`  - ${stat._id || 'نامشخص'}: ${stat.count} محصول`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error in migration:', error);
    process.exit(1);
  }
}

fixProductStructure().catch(console.error);

