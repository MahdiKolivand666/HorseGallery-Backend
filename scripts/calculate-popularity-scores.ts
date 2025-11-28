import mongoose from 'mongoose';
import { Product, productSchema } from '../src/product/schemas/product.schema';

async function calculatePopularityScores() {
  await mongoose.connect('mongodb://localhost:27017/horsegallery');
  console.log('✅ Connected to MongoDB');

  const ProductModel = mongoose.model<Product>('Product', productSchema);

  const products = await ProductModel.find({}).lean();
  console.log(`📦 Found ${products.length} products`);

  let updatedCount = 0;

  for (const product of products) {
    // Formula: (salesCount * 5) + (viewsCount * 1) + (rating * 10)
    const salesCount = (product as any).salesCount || (product as any).sales || 0;
    const viewsCount = (product as any).viewsCount || (product as any).views || 0;
    const rating = (product as any).rating || 0;

    const popularityScore = (salesCount * 5) + (viewsCount * 1) + (rating * 10);

    await ProductModel.findByIdAndUpdate(
      product._id,
      { popularityScore },
      { new: true }
    );

    updatedCount++;
    if (updatedCount % 10 === 0) {
      console.log(`✅ Updated ${updatedCount} products...`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Updated: ${updatedCount} products`);

  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

calculatePopularityScores().catch(console.error);

