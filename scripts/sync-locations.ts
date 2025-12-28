import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/horsegallery';
const EXTERNAL_API_BASE = 'https://iran-locations-api.ir/api/v1/fa';

interface ExternalState {
  id: number;
  name: string;
}

interface ExternalCity {
  id: number;
  name: string;
  state_id: number;
}

async function syncLocations() {
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

    // Step 1: دریافت استان‌ها
    console.log('📥 در حال دریافت لیست استان‌ها از API خارجی...');
    const statesResponse = await axios.get<ExternalState[]>(
      `${EXTERNAL_API_BASE}/states`,
    );

    const states = statesResponse.data;

    if (!Array.isArray(states) || states.length === 0) {
      console.log('⚠️  هیچ استانی از API دریافت نشد');
      await mongoose.disconnect();
      return;
    }

    console.log(`✅ ${states.length} استان دریافت شد\n`);

    // Step 2: ذخیره استان‌ها
    console.log('💾 در حال ذخیره استان‌ها در database...');
    for (const state of states) {
      await provincesCollection.findOneAndUpdate(
        { externalId: state.id },
        {
          $set: {
            externalId: state.id,
            name: state.name,
            isActive: true,
          },
        },
        { upsert: true },
      );
    }
    console.log('✅ استان‌ها با موفقیت ذخیره شدند\n');

    // Step 3: دریافت و ذخیره شهرها برای هر استان
    console.log('📥 در حال دریافت و ذخیره شهرها...');
    let totalCities = 0;

    for (let i = 0; i < states.length; i++) {
      const state = states[i];
      console.log(
        `[${i + 1}/${states.length}] در حال دریافت شهرهای استان "${state.name}"...`,
      );

      try {
        const citiesResponse = await axios.get<ExternalCity[]>(
          `${EXTERNAL_API_BASE}/cities?state_id=${state.id}`,
        );

        const cities = citiesResponse.data;

        if (Array.isArray(cities) && cities.length > 0) {
          // پیدا کردن استان در database
          const province = await provincesCollection.findOne({
            externalId: state.id,
          });

          if (province) {
            for (const city of cities) {
              try {
                const result = await citiesCollection.findOneAndUpdate(
                  { externalId: city.id, provinceExternalId: state.id }, // ✅ استفاده از compound key
                  {
                    $set: {
                      externalId: city.id,
                      name: city.name,
                      province: province._id,
                      provinceExternalId: state.id,
                      isActive: true,
                    },
                  },
                  { upsert: true },
                );
              } catch (error: any) {
                // اگر خطای duplicate key رخ داد، ignore کن (شهر قبلاً وجود دارد)
                if (error.code !== 11000) {
                  console.error(
                    `   ⚠️  خطا در ذخیره شهر "${city.name}": ${error.message}`,
                  );
                }
              }
            }

            totalCities += cities.length;
            console.log(
              `   ✅ ${cities.length} شهر برای استان "${state.name}" ذخیره شد`,
            );
          } else {
            console.log(`   ⚠️  استان "${state.name}" در database یافت نشد`);
          }
        } else {
          console.log(`   ⚠️  هیچ شهری برای استان "${state.name}" دریافت نشد`);
        }

        // کمی delay برای جلوگیری از rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(
          `   ❌ خطا در دریافت شهرهای استان "${state.name}": ${error.message}`,
        );
      }
    }

    console.log(`\n✅ Sync کامل شد!`);
    console.log(`   📊 تعداد استان‌ها: ${states.length}`);
    console.log(`   📊 تعداد شهرها: ${totalCities}`);

    await mongoose.disconnect();
    console.log('\n✅ اتصال به MongoDB قطع شد');
  } catch (error: any) {
    console.error('❌ خطا:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

syncLocations();
