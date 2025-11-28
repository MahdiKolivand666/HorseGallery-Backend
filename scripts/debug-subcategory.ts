import * as mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

const MONGODB_URI = 'mongodb://localhost:27017/horsegallery';

async function debugSubcategory() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const ProductCategorySchema = new mongoose.Schema({}, { collection: 'productcategories', strict: false });
    const ProductCategory = mongoose.model('ProductCategory', ProductCategorySchema);

    const kids = await ProductCategory.findOne({ slug: 'kids' }).lean();
    console.log('\n📦 Kids category subcategories:');
    (kids as any).subcategories?.forEach((sub: any, index: number) => {
      console.log(`  ${index + 1}. ${sub.slug} (${sub._id})`);
    });

    const anklet = (kids as any).subcategories?.find((s: any) => s.slug === 'anklet');
    if (anklet) {
      console.log(`\n✅ Found anklet subcategory with _id: ${anklet._id}`);
    } else {
      console.log('\n❌ anklet subcategory not found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

debugSubcategory();

