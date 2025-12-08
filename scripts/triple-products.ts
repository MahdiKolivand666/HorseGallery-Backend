import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/horsegallery';

// Define Product Schema for script
const ProductSchema = new mongoose.Schema({}, { collection: 'products', strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function tripleProducts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // دریافت تمام محصولات
    const products = await Product.find({}).lean();
    const totalProducts = products.length;
    console.log(`📊 تعداد محصولات فعلی: ${totalProducts}`);

    if (totalProducts === 0) {
      console.log('❌ هیچ محصولی یافت نشد!');
      await mongoose.disconnect();
      return;
    }

    console.log(`\n🔄 شروع تکثیر محصولات (3 برابر کردن)...\n`);

    let createdCount = 0;
    let errorCount = 0;

    // برای هر محصول 2 کپی دیگر ایجاد می‌کنیم
    for (let i = 0; i < products.length; i++) {
      const product: any = products[i];
      
      try {
        // ایجاد کپی اول (v2)
        const copy1: any = { ...product };
        delete copy1._id;
        delete copy1.__v;
        if (copy1.createdAt) delete copy1.createdAt;
        if (copy1.updatedAt) delete copy1.updatedAt;
        
        // تغییر slug و code برای یکتایی
        copy1.slug = `${product.slug}-v2-${Date.now()}-${i}`;
        copy1.code = `${product.code}-V2-${i}`;
        
        // تغییر نام برای تمایز
        copy1.name = `${product.name} (نسخه 2)`;
        
        // ریست کردن آمار
        copy1.views = 0;
        copy1.viewsCount = 0;
        copy1.sales = 0;
        copy1.salesCount = 0;
        copy1.popularityScore = 0;
        copy1.reviewsCount = 0;
        copy1.rating = 0;
        copy1.version = 1;

        await Product.create(copy1);
        createdCount++;
        
        if ((createdCount + i + 1) % 10 === 0) {
          console.log(`  ✅ ${createdCount + i + 1} محصول پردازش شد...`);
        }

        // ایجاد کپی دوم (v3)
        const copy2: any = { ...product };
        delete copy2._id;
        delete copy2.__v;
        if (copy2.createdAt) delete copy2.createdAt;
        if (copy2.updatedAt) delete copy2.updatedAt;
        
        // تغییر slug و code برای یکتایی
        copy2.slug = `${product.slug}-v3-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`;
        copy2.code = `${product.code}-V3-${i}`;
        
        // تغییر نام برای تمایز
        copy2.name = `${product.name} (نسخه 3)`;
        
        // ریست کردن آمار
        copy2.views = 0;
        copy2.viewsCount = 0;
        copy2.sales = 0;
        copy2.salesCount = 0;
        copy2.popularityScore = 0;
        copy2.reviewsCount = 0;
        copy2.rating = 0;
        copy2.version = 1;

        await Product.create(copy2);
        createdCount++;
        
        if ((createdCount + i + 1) % 10 === 0) {
          console.log(`  ✅ ${createdCount + i + 1} محصول پردازش شد...`);
        }

      } catch (error: any) {
        errorCount++;
        console.error(`  ❌ خطا در تکثیر محصول ${(product as any).name}:`, error.message);
      }
    }

    // شمارش نهایی
    const finalCount = await Product.countDocuments({});
    
    console.log(`\n📊 خلاصه:`);
    console.log(`  ✅ تعداد محصولات اولیه: ${totalProducts}`);
    console.log(`  ✅ تعداد محصولات جدید ایجاد شده: ${createdCount}`);
    console.log(`  ✅ تعداد کل محصولات بعد از تکثیر: ${finalCount}`);
    console.log(`  ❌ تعداد خطاها: ${errorCount}`);

    // نمایش آمار بر اساس نوع
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

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ خطا:', error);
    process.exit(1);
  }
}

tripleProducts().catch(console.error);

