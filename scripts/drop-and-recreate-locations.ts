import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/horsegallery';

async function dropAndRecreateLocations() {
  try {
    console.log('🔌 در حال اتصال به MongoDB...');
    const connection = await mongoose.connect(MONGODB_URI);
    console.log('✅ اتصال به MongoDB برقرار شد\n');

    const dbName =
      MONGODB_URI.split('/').pop()?.split('?')[0] || 'horsegallery';
    const db =
      connection.connection.db || connection.connection.getClient().db(dbName);

    if (!db) {
      throw new Error('Database connection failed');
    }

    const citiesCollection = db.collection('cities');
    const provincesCollection = db.collection('provinces');

    // بررسی وجود collection ها
    const collections = await db.listCollections().toArray();
    const hasCities = collections.some((c) => c.name === 'cities');
    const hasProvinces = collections.some((c) => c.name === 'provinces');

    if (hasCities) {
      console.log('🗑️  در حال حذف collection cities...');
      await citiesCollection.drop();
      console.log('✅ Collection cities حذف شد\n');
    }

    if (hasProvinces) {
      console.log('🗑️  در حال حذف collection provinces...');
      await provincesCollection.drop();
      console.log('✅ Collection provinces حذف شد\n');
    }

    console.log(
      '✅ Collection ها حذف شدند. حالا می‌توانید npm run sync:locations را اجرا کنید\n',
    );

    await mongoose.disconnect();
    console.log('✅ اتصال به MongoDB قطع شد');
  } catch (error: any) {
    console.error('❌ خطا:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

dropAndRecreateLocations();
