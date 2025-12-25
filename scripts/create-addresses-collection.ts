import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/horsegallery';
const COLLECTION_NAME = 'addresses';

async function createAddressesCollection() {
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
      console.log(`⚠️  Collection "${COLLECTION_NAME}" از قبل وجود دارد`);
      console.log(`🗑️  در حال حذف collection "${COLLECTION_NAME}"...`);
      await db.collection(COLLECTION_NAME).drop();
      console.log(`✅ Collection "${COLLECTION_NAME}" حذف شد\n`);
    }

    // ایجاد collection با ساختار درست
    console.log(
      `📝 در حال ایجاد collection "${COLLECTION_NAME}" با فیلدهای مورد نیاز...\n`,
    );

    // ایجاد یک document نمونه با همه فیلدها برای ساخت collection
    const sampleDocument = {
      // فیلدهای شناسایی کاربر
      userId: null,
      sessionId: null,
      user: null,

      // بخش آدرس
      title: 'sample',
      province: 'sample',
      city: 'sample',
      postalCode: '1234567890',
      address: 'sample address',

      // بخش مشخصات سفارش‌دهنده
      firstName: 'sample',
      lastName: 'sample',
      nationalId: '1234567890',
      mobile: '09123456789',
      email: null,
      notes: null,

      // فیلدهای سیستم
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // ایجاد collection با insertOne
    await db.collection(COLLECTION_NAME).insertOne(sampleDocument);
    console.log('✅ Document نمونه ایجاد شد');

    // حذف document نمونه
    await db.collection(COLLECTION_NAME).deleteOne({ title: 'sample' });
    console.log('✅ Document نمونه حذف شد');

    // ایجاد indexes
    console.log('\n📊 در حال ایجاد indexes...');
    const collection = db.collection(COLLECTION_NAME);

    // Index برای userId و isDefault
    await collection.createIndex({ userId: 1, isDefault: 1 });
    console.log('   ✅ Index: { userId: 1, isDefault: 1 }');

    // Index برای sessionId
    await collection.createIndex({ sessionId: 1 });
    console.log('   ✅ Index: { sessionId: 1 }');

    // Index برای userId
    await collection.createIndex({ userId: 1 });
    console.log('   ✅ Index: { userId: 1 }');

    // Index برای sessionId و isDefault
    await collection.createIndex({ sessionId: 1, isDefault: 1 });
    console.log('   ✅ Index: { sessionId: 1, isDefault: 1 }');

    console.log('\n📋 فیلدهای تعریف شده در collection:');
    console.log('═'.repeat(50));
    console.log('فیلدهای شناسایی کاربر:');
    console.log('  - userId (ObjectId, indexed)');
    console.log('  - sessionId (String, indexed)');
    console.log('  - user (ObjectId, legacy)');
    console.log('\nبخش آدرس:');
    console.log('  - title (String, required)');
    console.log('  - province (String, required)');
    console.log('  - city (String, required)');
    console.log('  - postalCode (String, required, 10 digits)');
    console.log('  - address (String, required)');
    console.log('\nبخش مشخصات سفارش‌دهنده:');
    console.log('  - firstName (String, required)');
    console.log('  - lastName (String, required)');
    console.log('  - nationalId (String, required, 10 digits)');
    console.log('  - mobile (String, required, Iranian format)');
    console.log('  - email (String, optional)');
    console.log('  - notes (String, optional)');
    console.log('\nفیلدهای سیستم:');
    console.log('  - isDefault (Boolean, default: false)');
    console.log('  - createdAt (Date, auto)');
    console.log('  - updatedAt (Date, auto)');

    await mongoose.disconnect();
    console.log('\n✅ Collection با موفقیت ایجاد شد و آماده استفاده است');
  } catch (error) {
    console.error('❌ خطا:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createAddressesCollection();
