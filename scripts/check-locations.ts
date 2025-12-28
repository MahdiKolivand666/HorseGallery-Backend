import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/horsegallery';

async function checkLocations() {
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

    const provincesCollection = db.collection('provinces');
    const citiesCollection = db.collection('cities');

    // بررسی استان‌ها
    console.log('📊 بررسی استان‌ها...');
    const provincesCount = await provincesCollection.countDocuments({});
    console.log(`   ✅ تعداد استان‌ها: ${provincesCount}`);

    if (provincesCount === 0) {
      console.log('   ⚠️  هیچ استانی در database وجود ندارد!');
      console.log('   💡 راه حل: npm run sync:locations را اجرا کنید\n');
    } else {
      const sampleProvince = await provincesCollection.findOne({});
      console.log(
        `   📝 نمونه استان: ${JSON.stringify(sampleProvince, null, 2)}\n`,
      );
    }

    // بررسی شهرها
    console.log('📊 بررسی شهرها...');
    const citiesCount = await citiesCollection.countDocuments({});
    console.log(`   ✅ تعداد شهرها: ${citiesCount}`);

    if (citiesCount === 0) {
      console.log('   ⚠️  هیچ شهری در database وجود ندارد!');
      console.log('   💡 راه حل: npm run sync:locations را اجرا کنید\n');
    } else {
      const sampleCity = await citiesCollection.findOne({});
      console.log(`   📝 نمونه شهر: ${JSON.stringify(sampleCity, null, 2)}\n`);
    }

    // بررسی استان اصفهان (مثال از log)
    console.log('🔍 بررسی استان اصفهان (externalId: 4)...');
    const esfahanProvince = await provincesCollection.findOne({
      externalId: 4,
    });

    if (!esfahanProvince) {
      console.log('   ❌ استان اصفهان یافت نشد!\n');
    } else {
      console.log(
        `   ✅ استان اصفهان پیدا شد: ${JSON.stringify(esfahanProvince, null, 2)}`,
      );

      // بررسی شهرهای اصفهان با provinceExternalId
      const citiesByExternalId = await citiesCollection.countDocuments({
        provinceExternalId: 4,
        isActive: true,
      });
      console.log(
        `   📊 شهرهای اصفهان (با provinceExternalId): ${citiesByExternalId}`,
      );

      // بررسی شهرهای اصفهان با province (ObjectId)
      const citiesByProvinceId = await citiesCollection.countDocuments({
        province: esfahanProvince._id,
        isActive: true,
      });
      console.log(
        `   📊 شهرهای اصفهان (با province._id): ${citiesByProvinceId}`,
      );

      if (citiesByExternalId === 0 && citiesByProvinceId === 0) {
        console.log('   ⚠️  هیچ شهری برای اصفهان پیدا نشد!');
        console.log('   💡 راه حل: npm run sync:locations را اجرا کنید\n');
      } else {
        const sampleCity = await citiesCollection.findOne({
          $or: [
            { provinceExternalId: 4, isActive: true },
            { province: esfahanProvince._id, isActive: true },
          ],
        });
        console.log(
          `   📝 نمونه شهر اصفهان: ${JSON.stringify(sampleCity, null, 2)}\n`,
        );
      }
    }

    // بررسی استان تهران (مثال دیگر)
    console.log('🔍 بررسی استان تهران (externalId: 8)...');
    const tehranProvince = await provincesCollection.findOne({
      externalId: 8,
    });

    if (!tehranProvince) {
      console.log('   ❌ استان تهران یافت نشد!\n');
    } else {
      console.log(
        `   ✅ استان تهران پیدا شد: ${JSON.stringify(tehranProvince, null, 2)}`,
      );

      const citiesByExternalId = await citiesCollection.countDocuments({
        provinceExternalId: 8,
        isActive: true,
      });
      console.log(
        `   📊 شهرهای تهران (با provinceExternalId): ${citiesByExternalId}`,
      );

      const citiesByProvinceId = await citiesCollection.countDocuments({
        province: tehranProvince._id,
        isActive: true,
      });
      console.log(
        `   📊 شهرهای تهران (با province._id): ${citiesByProvinceId}`,
      );

      if (citiesByExternalId > 0 || citiesByProvinceId > 0) {
        const sampleCity = await citiesCollection.findOne({
          $or: [
            { provinceExternalId: 8, isActive: true },
            { province: tehranProvince._id, isActive: true },
          ],
        });
        console.log(
          `   📝 نمونه شهر تهران: ${JSON.stringify(sampleCity, null, 2)}\n`,
        );
      }
    }

    // خلاصه
    console.log('📋 خلاصه:');
    console.log(`   ✅ استان‌ها: ${provincesCount}`);
    console.log(`   ✅ شهرها: ${citiesCount}`);

    if (provincesCount === 0 || citiesCount === 0) {
      console.log('\n⚠️  مشکل: داده‌ها در database وجود ندارند!');
      console.log('💡 راه حل: npm run sync:locations را اجرا کنید');
    } else {
      console.log('\n✅ داده‌ها در database موجود هستند');
    }

    await mongoose.disconnect();
    console.log('\n✅ اتصال به MongoDB قطع شد');
  } catch (error: any) {
    console.error('❌ خطا:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkLocations();
