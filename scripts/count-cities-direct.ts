import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/horsegallery';

async function countCitiesDirect() {
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

    // شمارش کل شهرها
    const totalCount = await citiesCollection.countDocuments({});
    console.log(`📊 تعداد کل شهرها: ${totalCount}`);

    // شمارش شهرهای فعال
    const activeCount = await citiesCollection.countDocuments({
      isActive: true,
    });
    console.log(`📊 تعداد شهرهای فعال: ${activeCount}`);

    // شمارش شهرهای غیرفعال
    const inactiveCount = await citiesCollection.countDocuments({
      isActive: false,
    });
    console.log(`📊 تعداد شهرهای غیرفعال: ${inactiveCount}\n`);

    // بررسی شهرهای اصفهان
    console.log('🔍 بررسی شهرهای اصفهان (provinceExternalId: 4)...');
    const esfahanCities = await citiesCollection
      .find({ provinceExternalId: 4 })
      .toArray();
    console.log(`   تعداد شهرهای اصفهان: ${esfahanCities.length}`);

    if (esfahanCities.length > 0) {
      console.log(`   نمونه شهرها:`);
      esfahanCities.slice(0, 3).forEach((city) => {
        console.log(
          `      - ${city.name} (externalId: ${city.externalId}, provinceExternalId: ${city.provinceExternalId})`,
        );
      });
    }

    // بررسی شهرهای تهران
    console.log('\n🔍 بررسی شهرهای تهران (provinceExternalId: 8)...');
    const tehranCities = await citiesCollection
      .find({ provinceExternalId: 8 })
      .toArray();
    console.log(`   تعداد شهرهای تهران: ${tehranCities.length}`);

    if (tehranCities.length > 0) {
      console.log(`   نمونه شهرها:`);
      tehranCities.slice(0, 3).forEach((city) => {
        console.log(
          `      - ${city.name} (externalId: ${city.externalId}, provinceExternalId: ${city.provinceExternalId})`,
        );
      });
    }

    // بررسی توزیع شهرها بر اساس provinceExternalId
    console.log('\n📊 توزیع شهرها بر اساس provinceExternalId:');
    const distribution = await citiesCollection
      .aggregate([
        {
          $group: {
            _id: '$provinceExternalId',
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    distribution.forEach((item) => {
      console.log(`   استان ${item._id}: ${item.count} شهر`);
    });

    await mongoose.disconnect();
    console.log('\n✅ اتصال به MongoDB قطع شد');
  } catch (error: any) {
    console.error('❌ خطا:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

countCitiesDirect();
