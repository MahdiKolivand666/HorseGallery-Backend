import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/horsegallery';

async function listCollections() {
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

    // لیست همه collection ها
    const collections = await db.listCollections().toArray();
    console.log('📋 لیست همه collection ها:');
    collections.forEach((col) => {
      console.log(`   - ${col.name}`);
    });

    console.log('\n🔍 بررسی collection های location...');

    // بررسی collection های مختلف
    const possibleNames = ['cities', 'city', 'provinces', 'province'];

    for (const name of possibleNames) {
      const collection = db.collection(name);
      const count = await collection.countDocuments({});
      if (count > 0) {
        console.log(`\n📊 Collection "${name}": ${count} document`);
        const sample = await collection.findOne({});
        if (sample) {
          console.log(`   نمونه: ${JSON.stringify(sample, null, 2)}`);
        }
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ اتصال به MongoDB قطع شد');
  } catch (error: any) {
    console.error('❌ خطا:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

listCollections();
