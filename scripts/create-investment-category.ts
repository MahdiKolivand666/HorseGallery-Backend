import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/horsegallery';

const ProductCategorySchema = new mongoose.Schema({}, { collection: 'productcategories', strict: false });
const ProductCategory = mongoose.model('ProductCategory', ProductCategorySchema);

const ProductSchema = new mongoose.Schema({}, { collection: 'products', strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function createInvestmentCategory() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // بررسی وجود دسته‌بندی
    let category = await ProductCategory.findOne({ slug: 'gold-investment' });
    
    if (!category) {
      // ایجاد دسته‌بندی جدید
      category = await ProductCategory.create({
        name: 'سرمایه‌گذاری طلا',
        slug: 'gold-investment',
        description: 'سکه و شمش طلا برای سرمایه‌گذاری',
        heroImage: '/images/categories/investment.jpg',
        order: 100,
        isActive: true
      });
      console.log('✅ دسته‌بندی "سرمایه‌گذاری طلا" ایجاد شد');
      console.log(`   ID: ${category._id}`);
      console.log(`   Name: ${(category as any).name}`);
      console.log(`   Slug: ${(category as any).slug}`);
    } else {
      console.log('⚠️  دسته‌بندی قبلاً وجود دارد');
      console.log(`   ID: ${category._id}`);
      console.log(`   Name: ${(category as any).name}`);
    }

    // به‌روزرسانی category سکه‌ها
    console.log('\n📦 به‌روزرسانی دسته‌بندی سکه‌ها...');
    const coinResult = await Product.updateMany(
      { productType: 'coin' },
      { $set: { category: category._id } }
    );
    console.log(`✅ ${coinResult.modifiedCount} سکه به دسته‌بندی "سرمایه‌گذاری طلا" منتقل شد`);
    
    // به‌روزرسانی category شمش‌ها
    console.log('\n📦 به‌روزرسانی دسته‌بندی شمش‌ها...');
    const barResult = await Product.updateMany(
      { productType: 'melted_gold' },
      { $set: { category: category._id } }
    );
    console.log(`✅ ${barResult.modifiedCount} شمش به دسته‌بندی "سرمایه‌گذاری طلا" منتقل شد`);

    // نمایش خلاصه محصولات در هر دسته‌بندی
    console.log('\n📊 خلاصه نهایی:');
    
    const coinCount = await Product.countDocuments({ 
      productType: 'coin',
      category: category._id 
    });
    console.log(`   🪙 سکه: ${coinCount} محصول`);
    
    const barCount = await Product.countDocuments({ 
      productType: 'melted_gold',
      category: category._id 
    });
    console.log(`   📊 شمش: ${barCount} محصول`);
    
    console.log(`   📁 دسته‌بندی: ${(category as any).name}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ خطا:', error);
    process.exit(1);
  }
}

createInvestmentCategory().catch(console.error);

