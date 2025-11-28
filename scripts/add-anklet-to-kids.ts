import * as mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

const MONGODB_URI = 'mongodb://localhost:27017/horsegallery';

async function addAnkletToKids() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const ProductCategorySchema = new mongoose.Schema({}, { collection: 'productcategories', strict: false });
    const ProductCategory = mongoose.model('ProductCategory', ProductCategorySchema);

    const kids = await ProductCategory.findOne({ slug: 'kids' });

    if (!kids) {
      console.log('❌ Kids category not found');
      await mongoose.disconnect();
      return;
    }

    const hasAnklet = (kids as any).subcategories?.some((s: any) => s.slug === 'anklet');

    if (!hasAnklet) {
      (kids as any).subcategories.push({
        name: 'پابند',
        slug: 'anklet',
        _id: new ObjectId(),
      });
      await kids.save();
      console.log('✅ Added anklet subcategory to kids category');
    } else {
      console.log('⚠️  anklet subcategory already exists in kids category');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

addAnkletToKids();

