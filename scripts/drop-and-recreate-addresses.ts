import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/horsegallery';
const COLLECTION_NAME = 'addresses';

async function dropAndRecreateAddresses() {
  try {
    // اتصال به MongoDB
    console.log('🔌 در حال اتصال به MongoDB...');
    const connection = await mongoose.connect(MONGODB_URI);
    console.log('✅ اتصال به MongoDB برقرار شد\n');

    // استخراج نام database از URI
    const dbName =
      MONGODB_URI.split('/').pop()?.split('?')[0] || 'horsegallery';
    const db =
      connection.connection.db || connection.connection.getClient().db(dbName);

    if (!db) {
      throw new Error('Database connection failed');
    }

    // بررسی وجود collection
    const collections = await db
      .listCollections({ name: COLLECTION_NAME })
      .toArray();

    if (collections.length > 0) {
      console.log(`🗑️  در حال حذف collection "${COLLECTION_NAME}"...`);
      await db.collection(COLLECTION_NAME).drop();
      console.log(`✅ Collection "${COLLECTION_NAME}" با موفقیت حذف شد\n`);
    } else {
      console.log(`⚠️  Collection "${COLLECTION_NAME}" وجود نداشت\n`);
    }

    console.log(
      '✅ Collection حذف شد. حالا Mongoose با schema جدید آن را می‌سازد.',
    );
    console.log('📝 فیلدهای مورد نیاز:');
    console.log('   - بخش آدرس: title, province, city, postalCode, address');
    console.log(
      '   - بخش مشخصات سفارش‌دهنده: firstName, lastName, nationalId, mobile, email, notes',
    );
    console.log(
      '   - فیلدهای سیستم: userId, sessionId, user, isDefault, createdAt, updatedAt',
    );

    await mongoose.disconnect();
    console.log('\n✅ عملیات با موفقیت انجام شد');
    console.log(
      '💡 حالا می‌توانید یک آدرس جدید ایجاد کنید تا collection با schema جدید ساخته شود',
    );
  } catch (error) {
    console.error('❌ خطا:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

dropAndRecreateAddresses();
