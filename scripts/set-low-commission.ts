import mongoose from 'mongoose';
import { Product, productSchema } from '../src/product/schemas/product.schema';

async function setLowCommission() {
  try {
    await mongoose.connect('mongodb://localhost:27017/horsegallery');
    console.log('✅ Connected to MongoDB');

    const ProductModel = mongoose.model<Product>('Product', productSchema);

    // پیدا کردن اولین محصول
    const product = await ProductModel.findOne({}).lean();
    
    if (!product) {
      console.log('❌ No products found');
      await mongoose.disconnect();
      return;
    }

    console.log(`📦 Found product: ${(product as any).name}`);

    // Update کردن محصول
    await ProductModel.findByIdAndUpdate(
      product._id,
      {
        $set: {
          lowCommission: true,
          wage: 'کم',
          commission: 3, // 3% commission
        },
      },
      { new: true },
    );

    console.log(`✅ Updated product: ${(product as any).name}`);
    console.log(`   - lowCommission: true`);
    console.log(`   - wage: کم`);
    console.log(`   - commission: 3%`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setLowCommission().catch(console.error);

