import mongoose from 'mongoose';
import { Product, productSchema } from '../src/product/schemas/product.schema';

async function updateLowCommission() {
  try {
    await mongoose.connect('mongodb://localhost:27017/horsegallery');
    console.log('✅ Connected to MongoDB');

    const ProductModel = mongoose.model<Product>('Product', productSchema);

    // پیدا کردن محصولی که lowCommission: true دارد
    const currentLowCommissionProduct = await ProductModel.findOne({ lowCommission: true }).lean();
    
    if (currentLowCommissionProduct) {
      // Set to false
      await ProductModel.findByIdAndUpdate(
        currentLowCommissionProduct._id,
        {
          $set: {
            lowCommission: false,
            wage: 'متوسط',
            commission: 10, // متوسط commission
          },
        },
        { new: true },
      );
      console.log(`✅ Set lowCommission to false for: ${(currentLowCommissionProduct as any).name}`);
    } else {
      console.log('⚠️  No product with lowCommission: true found');
    }

    // پیدا کردن محصولی که lowCommission: false یا undefined دارد (غیر از محصول قبلی)
    const excludeId = currentLowCommissionProduct?._id;
    const otherProduct = await ProductModel.findOne(
      excludeId ? { _id: { $ne: excludeId } } : {}
    ).lean();
    
    if (otherProduct) {
      // Set to true
      await ProductModel.findByIdAndUpdate(
        otherProduct._id,
        {
          $set: {
            lowCommission: true,
            wage: 'کم',
            commission: 3, // 3% commission
          },
        },
        { new: true },
      );
      console.log(`✅ Set lowCommission to true for: ${(otherProduct as any).name}`);
      console.log(`   - lowCommission: true`);
      console.log(`   - wage: کم`);
      console.log(`   - commission: 3%`);
    } else {
      console.log('❌ No other product found');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateLowCommission().catch(console.error);

