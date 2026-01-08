import mongoose from 'mongoose';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/horsegallery';

const ShippingSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    price: Number,
    freeShippingThreshold: { type: Number, default: null },
    estimatedDays: Number,
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Shipping = mongoose.model('Shipping', ShippingSchema);

async function setupChaparShipping() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // غیرفعال کردن همه shipping methods موجود
    console.log('\n🚚 غیرفعال کردن همه shipping methods موجود...');
    const deactivateResult = await Shipping.updateMany(
      {},
      { $set: { isActive: false, isDefault: false } },
    );
    console.log(
      `✅ ${deactivateResult.modifiedCount} shipping method غیرفعال شد`,
    );

    // بررسی وجود shipping method چاپار
    let chaparShipping = await Shipping.findOne({ title: 'چاپار' });

    if (!chaparShipping) {
      // ایجاد shipping method جدید چاپار
      chaparShipping = await Shipping.create({
        title: 'چاپار',
        description: 'ارسال از طریق پست چاپار - تحویل در 2 تا 4 روز کاری',
        price: 40000, // قیمت ارسال (می‌توانید تغییر دهید)
        freeShippingThreshold: 5000000, // رایگان برای سفارشات بالای 5 میلیون تومان
        estimatedDays: 3, // میانگین 2-4 روز
        isActive: true,
        isDefault: true,
      });
      console.log('✅ shipping method "چاپار" ایجاد شد');
      console.log(`   ID: ${chaparShipping._id}`);
      console.log(`   Title: ${chaparShipping.title}`);
      console.log(`   Price: ${chaparShipping.price} تومان`);
      console.log(`   Estimated Days: ${chaparShipping.estimatedDays} روز`);
    } else {
      // به‌روزرسانی shipping method موجود
      const updatedShipping = await Shipping.findByIdAndUpdate(
        chaparShipping._id,
        {
          $set: {
            title: 'چاپار',
            description: 'ارسال از طریق پست چاپار - تحویل در 2 تا 4 روز کاری',
            price: 40000,
            freeShippingThreshold: 5000000,
            estimatedDays: 3,
            isActive: true,
            isDefault: true,
          },
        },
        { new: true },
      );
      if (updatedShipping) {
        chaparShipping = updatedShipping;
        console.log('✅ shipping method "چاپار" به‌روزرسانی شد');
        console.log(`   ID: ${chaparShipping._id}`);
        console.log(`   Title: ${chaparShipping.title}`);
        console.log(`   Price: ${chaparShipping.price} تومان`);
        console.log(`   Estimated Days: ${chaparShipping.estimatedDays} روز`);
      }
    }

    // بررسی نهایی
    if (!chaparShipping) {
      throw new Error('خطا در ایجاد یا به‌روزرسانی shipping method چاپار');
    }

    // نمایش خلاصه
    console.log('\n📊 خلاصه نهایی:');
    const activeCount = await Shipping.countDocuments({ isActive: true });
    const defaultCount = await Shipping.countDocuments({ isDefault: true });
    console.log(`   🚚 Shipping methods فعال: ${activeCount}`);
    console.log(`   ⭐ Shipping methods پیش‌فرض: ${defaultCount}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ خطا:', error);
    process.exit(1);
  }
}

setupChaparShipping().catch(console.error);
