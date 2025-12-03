import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/horsegallery';

// Define Schemas for script
const ProductSchema = new mongoose.Schema(
  {},
  { collection: 'products', strict: false },
);
const Product = mongoose.model('Product', ProductSchema);

// تابع برای تعیین material بر اساس نوع محصول
function determineMaterial(productType: string, productName: string): string {
  const nameLower = productName.toLowerCase();

  // برای سکه و شمش: همیشه طلا
  if (productType === 'coin' || productType === 'melted_gold') {
    return 'طلا';
  }

  // برای جواهرات: بر اساس نام یا پیش‌فرض طلا
  if (
    nameLower.includes('طلا') ||
    nameLower.includes('طلای') ||
    nameLower.includes('gold')
  ) {
    return 'طلا';
  }

  if (
    nameLower.includes('نقره') ||
    nameLower.includes('silver')
  ) {
    return 'نقره';
  }

  if (
    nameLower.includes('پلاتین') ||
    nameLower.includes('platinum')
  ) {
    return 'پلاتین';
  }

  // پیش‌فرض: طلا
  return 'طلا';
}

// تابع برای استخراج وزن از رشته (مثال: "12.5 گرم" -> 12.5)
function extractWeightFromString(
  weightStr: string | undefined | null,
): number | null {
  if (!weightStr) return null;

  const cleaned = weightStr.trim().toLowerCase();
  const match = cleaned.match(/(\d+\.?\d*)/);
  if (match) {
    return parseFloat(match[1]);
  }

  return null;
}

// تابع برای تولید وزن تصادفی برای جواهرات (بین 2 تا 50 گرم)
function generateRandomWeightForJewelry(): string {
  const weights = [
    '2 گرم',
    '2.5 گرم',
    '3 گرم',
    '3.5 گرم',
    '4 گرم',
    '4.5 گرم',
    '5 گرم',
    '5.5 گرم',
    '6 گرم',
    '6.5 گرم',
    '7 گرم',
    '7.5 گرم',
    '8 گرم',
    '8.5 گرم',
    '9 گرم',
    '9.5 گرم',
    '10 گرم',
    '10.5 گرم',
    '11 گرم',
    '11.5 گرم',
    '12 گرم',
    '12.5 گرم',
    '13 گرم',
    '13.5 گرم',
    '14 گرم',
    '14.5 گرم',
    '15 گرم',
    '15.5 گرم',
    '16 گرم',
    '16.5 گرم',
    '17 گرم',
    '17.5 گرم',
    '18 گرم',
    '18.5 گرم',
    '19 گرم',
    '19.5 گرم',
    '20 گرم',
    '21 گرم',
    '22 گرم',
    '23 گرم',
    '24 گرم',
    '25 گرم',
    '26 گرم',
    '27 گرم',
    '28 گرم',
    '29 گرم',
    '30 گرم',
    '35 گرم',
    '40 گرم',
    '45 گرم',
    '50 گرم',
  ];

  return weights[Math.floor(Math.random() * weights.length)];
}

async function addMaterialWeightToAllProducts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // دریافت همه محصولات
    const products = await Product.find({}).lean();
    console.log(`📦 تعداد کل محصولات: ${products.length}\n`);

    let materialUpdated = 0;
    let weightUpdated = 0;
    let materialSkipped = 0;
    let weightSkipped = 0;
    let coinBarCount = 0;
    let jewelryCount = 0;

    for (const product of products) {
      const productType = (product as any).productType || 'jewelry';
      const productId = (product as any)._id;
      const productName =
        (product as any).name || (product as any).title || 'نامشخص';

      const update: any = {};

      // بررسی و اضافه کردن material
      const existingMaterial = (product as any).material;
      if (!existingMaterial || existingMaterial.trim() === '') {
        const material = determineMaterial(productType, productName);
        update.material = material;
        materialUpdated++;
        console.log(`✅ Material: ${productName} -> ${material}`);
      } else {
        materialSkipped++;
        console.log(
          `⏭️  Material: ${productName} -> قبلاً دارد: ${existingMaterial}`,
        );
      }

      // بررسی و اضافه کردن weight
      if (productType === 'coin' || productType === 'melted_gold') {
        coinBarCount++;
        const goldInfo = (product as any).goldInfo || {};

        // اگر goldInfo.weight وجود ندارد
        if (!goldInfo.weight) {
          // اگر weight (string) وجود دارد، از آن استفاده کن
          const existingWeight = (product as any).weight;
          let weightValue: number | null = null;

          if (existingWeight) {
            weightValue = extractWeightFromString(existingWeight);
          }

          // اگر هنوز وزن نداریم، بر اساس نام محصول وزن تعیین کن
          if (!weightValue) {
            if (productType === 'coin') {
              if (
                productName.includes('تمام') ||
                productName.includes('امامی')
              ) {
                weightValue = 8.13;
              } else if (productName.includes('نیم')) {
                weightValue = 4.06;
              } else if (productName.includes('ربع')) {
                weightValue = 2.03;
              } else if (productName.includes('گرمی')) {
                weightValue = 1;
              } else {
                weightValue = 8.13;
              }
            } else if (productType === 'melted_gold') {
              const weightMatch = productName.match(/(\d+)\s*گرم/);
              if (weightMatch) {
                weightValue = parseFloat(weightMatch[1]);
              } else {
                weightValue = 10;
              }
            }
          }

          if (!update.$set) {
            update.$set = {};
          }
          update.$set['goldInfo.weight'] = weightValue;
          update.$set['goldInfo.purity'] =
            goldInfo.purity || (productType === 'coin' ? '900' : '999.9');

          console.log(
            `✅ Weight: ${productType === 'coin' ? 'سکه' : 'شمش'} ${productName} -> ${weightValue} گرم`,
          );
          weightUpdated++;
        } else {
          weightSkipped++;
          console.log(
            `⏭️  Weight: ${productType === 'coin' ? 'سکه' : 'شمش'} ${productName} -> قبلاً دارد: ${goldInfo.weight} گرم`,
          );
        }
      } else {
        jewelryCount++;
        const existingWeight = (product as any).weight;

        // اگر وزن ندارد، وزن تصادفی اضافه کن
        if (!existingWeight || existingWeight.trim() === '') {
          const randomWeight = generateRandomWeightForJewelry();
          update.weight = randomWeight;
          console.log(`✅ Weight: جواهر ${productName} -> ${randomWeight}`);
          weightUpdated++;
        } else {
          weightSkipped++;
          console.log(
            `⏭️  Weight: جواهر ${productName} -> قبلاً دارد: ${existingWeight}`,
          );
        }
      }

      // به‌روزرسانی محصول
      if (Object.keys(update).length > 0) {
        await Product.updateOne({ _id: productId }, { $set: update });
      }
    }

    console.log(`\n📊 خلاصه:`);
    console.log(`  ✅ ${materialUpdated} محصول material دریافت کرد`);
    console.log(`  ⏭️  ${materialSkipped} محصول قبلاً material داشت`);
    console.log(`  ✅ ${weightUpdated} محصول weight دریافت کرد`);
    console.log(`  ⏭️  ${weightSkipped} محصول قبلاً weight داشت`);
    console.log(`  🪙 سکه/شمش: ${coinBarCount} محصول`);
    console.log(`  💍 جواهرات: ${jewelryCount} محصول`);

    // بررسی نهایی
    console.log(`\n🔍 بررسی نهایی:`);

    // بررسی material
    const productsWithoutMaterial = await Product.find({
      $or: [
        { material: { $exists: false } },
        { material: null },
        { material: '' },
      ],
    }).countDocuments();

    if (productsWithoutMaterial === 0) {
      console.log(`  ✅ همه محصولات material دارند!`);
    } else {
      console.log(`  ⚠️  ${productsWithoutMaterial} محصول هنوز material ندارند`);
    }

    // بررسی weight
    const productsWithoutWeight = await Product.find({
      $or: [
        {
          productType: { $in: ['coin', 'melted_gold'] },
          'goldInfo.weight': { $exists: false },
        },
        {
          productType: { $in: ['coin', 'melted_gold'] },
          'goldInfo.weight': null,
        },
        { productType: 'jewelry', weight: { $exists: false } },
        { productType: 'jewelry', weight: null },
        { productType: { $exists: false }, weight: { $exists: false } },
      ],
    }).countDocuments();

    if (productsWithoutWeight === 0) {
      console.log(`  ✅ همه محصولات weight دارند!`);
    } else {
      console.log(`  ⚠️  ${productsWithoutWeight} محصول هنوز weight ندارند`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ خطا:', error);
    process.exit(1);
  }
}

addMaterialWeightToAllProducts().catch(console.error);

