import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/horsegallery';

// Define Product Schema for migration
const ProductSchema = new mongoose.Schema({}, { collection: 'products', strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function migrateProductTypes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // تمام محصولاتی که productType ندارند را به jewelry تبدیل کن
    const result = await Product.updateMany(
      { 
        $or: [
          { productType: { $exists: false } },
          { productType: null }
        ]
      },
      { 
        $set: { productType: 'jewelry' } 
      }
    );

    console.log(`✅ ${result.modifiedCount} محصول به‌روزرسانی شد`);
    console.log(`📊 ${result.matchedCount} محصول پیدا شد`);

    // نمایش آمار محصولات بر اساس نوع
    const stats = await Product.aggregate([
      {
        $group: {
          _id: '$productType',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📊 آمار محصولات بر اساس نوع:');
    stats.forEach(stat => {
      console.log(`  - ${stat._id || 'نامشخص'}: ${stat.count} محصول`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ خطا در migration:', error);
    process.exit(1);
  }
}

migrateProductTypes().catch(console.error);

