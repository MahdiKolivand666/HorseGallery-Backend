import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/horsegallery';
const EXTERNAL_API_BASE = 'https://iran-locations-api.ir/api/v1/fa';

async function debugCities() {
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

    // بررسی استان اصفهان
    console.log('🔍 بررسی استان اصفهان (externalId: 4)...\n');

    const esfahanProvince = await provincesCollection.findOne({
      externalId: 4,
    });
    if (!esfahanProvince) {
      console.log('❌ استان اصفهان یافت نشد!');
      await mongoose.disconnect();
      return;
    }

    console.log(
      `✅ استان اصفهان پیدا شد: ${esfahanProvince.name} (ID: ${esfahanProvince._id})\n`,
    );

    // دریافت شهرهای اصفهان از API
    console.log('📥 دریافت شهرهای اصفهان از API خارجی...');
    const citiesResponse = await axios.get(
      `${EXTERNAL_API_BASE}/cities?state_id=4`,
    );
    const apiCities = citiesResponse.data;
    console.log(`✅ ${apiCities.length} شهر از API دریافت شد\n`);

    // بررسی شهرهای موجود در database
    console.log('📊 بررسی شهرهای موجود در database...');
    const dbCitiesByExternalId = await citiesCollection
      .find({ provinceExternalId: 4, isActive: true })
      .toArray();
    console.log(
      `   شهرهای اصفهان (با provinceExternalId=4): ${dbCitiesByExternalId.length}`,
    );

    const dbCitiesByProvinceId = await citiesCollection
      .find({ province: esfahanProvince._id, isActive: true })
      .toArray();
    console.log(
      `   شهرهای اصفهان (با province._id): ${dbCitiesByProvinceId.length}\n`,
    );

    // بررسی externalId های تکراری
    console.log('🔍 بررسی externalId های تکراری...');
    const duplicateExternalIds = await citiesCollection
      .aggregate([
        {
          $group: {
            _id: '$externalId',
            count: { $sum: 1 },
            cities: {
              $push: {
                name: '$name',
                provinceExternalId: '$provinceExternalId',
              },
            },
          },
        },
        { $match: { count: { $gt: 1 } } },
      ])
      .toArray();

    if (duplicateExternalIds.length > 0) {
      console.log(
        `   ⚠️  ${duplicateExternalIds.length} externalId تکراری پیدا شد:`,
      );
      duplicateExternalIds.forEach((dup) => {
        console.log(`      externalId ${dup._id}: ${dup.count} شهر`);
        console.log(`      شهرها: ${JSON.stringify(dup.cities, null, 2)}`);
      });
    } else {
      console.log('   ✅ هیچ externalId تکراری وجود ندارد\n');
    }

    // بررسی نمونه شهرهای API
    if (apiCities.length > 0) {
      console.log('📝 نمونه شهرهای API:');
      apiCities.slice(0, 3).forEach((city: any) => {
        console.log(
          `   - ${city.name} (externalId: ${city.id}, state_id: ${city.state_id})`,
        );
      });
      console.log('');

      // بررسی اینکه آیا این شهرها در database وجود دارند
      console.log('🔍 بررسی وجود شهرهای API در database...');
      for (const apiCity of apiCities.slice(0, 5)) {
        const dbCity = await citiesCollection.findOne({
          externalId: apiCity.id,
        });
        if (dbCity) {
          console.log(
            `   ✅ ${apiCity.name} (externalId: ${apiCity.id}) - موجود در database`,
          );
          console.log(
            `      provinceExternalId در DB: ${dbCity.provinceExternalId}, در API: ${apiCity.state_id}`,
          );
        } else {
          console.log(
            `   ❌ ${apiCity.name} (externalId: ${apiCity.id}) - موجود نیست در database`,
          );
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

debugCities();
