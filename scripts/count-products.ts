import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/horsegallery';

// Define Product Schema for script
const ProductSchema = new mongoose.Schema({}, { collection: 'products', strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function countProducts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // شمارش کل محصولات
    const totalCount = await Product.countDocuments({});
    console.log(`📊 تعداد کل محصولات: ${totalCount}`);

    // شمارش محصولات بر اساس نوع
    const statsByType = await Product.aggregate([
      {
        $group: {
          _id: '$productType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log('\n📦 آمار محصولات بر اساس نوع:');
    statsByType.forEach(stat => {
      const typeName = stat._id === 'jewelry' ? 'جواهرات' : 
                      stat._id === 'coin' ? 'سکه' : 
                      stat._id === 'melted_gold' ? 'شمش' : 
                      stat._id || 'نامشخص';
      console.log(`  - ${typeName}: ${stat.count} محصول`);
    });

    // شمارش محصولات موجود و ناموجود
    const availableCount = await Product.countDocuments({ isAvailable: true });
    const unavailableCount = await Product.countDocuments({ isAvailable: false });
    console.log('\n✅ محصولات موجود:', availableCount);
    console.log('❌ محصولات ناموجود:', unavailableCount);

    // شمارش محصولات تخفیف‌دار
    const onSaleCount = await Product.countDocuments({ onSale: true });
    console.log('🏷️  محصولات تخفیف‌دار:', onSaleCount);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ خطا:', error);
    process.exit(1);
  }
}

countProducts().catch(console.error);

