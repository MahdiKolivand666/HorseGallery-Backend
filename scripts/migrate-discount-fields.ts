import mongoose from 'mongoose';
import { Product, productSchema } from '../src/product/schemas/product.schema';

async function migrateDiscountFields() {
  try {
    await mongoose.connect('mongodb://localhost:27017/horsegallery');
    console.log('✅ Connected to MongoDB');

    const ProductModel = mongoose.model<Product>('Product', productSchema);

    // همه محصولات را پیدا کن
    const products = await ProductModel.find({}).lean();
    console.log(`📦 Found ${products.length} products`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      const productId = product._id;
      const price = (product as any).price;
      const discountPrice = (product as any).discountPrice;

      // محاسبه discount و onSale
      let discount = 0;
      let onSale = false;
      let finalDiscountPrice: number | null = null;

      if (discountPrice !== null && discountPrice !== undefined && price) {
        if (discountPrice < price) {
          discount = Math.round(((price - discountPrice) / price) * 100);
          onSale = true;
          finalDiscountPrice = discountPrice;
        } else {
          // اگر discountPrice بزرگتر یا مساوی price باشد، آن را null کن
          finalDiscountPrice = null;
          discount = 0;
          onSale = false;
        }
      } else {
        finalDiscountPrice = null;
        discount = 0;
        onSale = false;
      }

      // بررسی اینکه آیا نیاز به update دارد
      const currentDiscount = (product as any).discount || 0;
      const currentOnSale = (product as any).onSale || false;
      const currentDiscountPrice = (product as any).discountPrice;

      if (
        currentDiscount !== discount ||
        currentOnSale !== onSale ||
        currentDiscountPrice !== finalDiscountPrice
      ) {
        await ProductModel.findByIdAndUpdate(
          productId,
          {
            $set: {
              discountPrice: finalDiscountPrice,
              discount,
              onSale,
            },
          },
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

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error in migration:', error);
    process.exit(1);
  }
}

migrateDiscountFields().catch(console.error);

