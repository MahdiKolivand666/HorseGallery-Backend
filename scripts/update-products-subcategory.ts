import * as mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

// Connect to MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/horsegallery';

// Product Schema
const ProductSchema = new mongoose.Schema({}, { collection: 'products', strict: false });
const Product = mongoose.model('Product', ProductSchema);

// ProductCategory Schema
const ProductCategorySchema = new mongoose.Schema({}, { collection: 'productcategories', strict: false });
const ProductCategory = mongoose.model('ProductCategory', ProductCategorySchema);

// Mapping: product slug -> subcategory slug
const productSubcategoryMap: Record<string, string> = {
  // Women products
  'classic-gold-necklace-001': 'necklace',
  'gold-bracelet-with-stone-002': 'bracelet',
  'wedding-ring-003': 'ring',
  'gold-earring-pearl-004': 'earring',
  'heart-pendant-005': 'pendant',
  
  // Men products
  'mens-chain-necklace-006': 'necklace',
  'mens-leather-gold-bracelet-007': 'leather-gold-bracelet',
  
  // Kids products
  'kids-butterfly-earring-008': 'earring',
  'kids-bracelet-with-bell-009': 'bracelet',
  'gold-anklet-with-charm-010': 'anklet',
};

async function updateProductsSubcategory() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // First, ensure anklet subcategory exists in kids category
    const kids = await ProductCategory.findOne({ slug: 'kids' });
    if (kids) {
      const hasAnklet = (kids as any).subcategories?.some((s: any) => s.slug === 'anklet');
      if (!hasAnklet) {
        const ankletId = new ObjectId();
        await ProductCategory.updateOne(
          { slug: 'kids' },
          { $push: { subcategories: { name: 'پابند', slug: 'anklet', _id: ankletId } } }
        );
        console.log('✅ Added anklet subcategory to kids category');
      }
    }

    // Get all categories with their subcategories (after potential update)
    // Re-fetch to ensure we have the latest data
    let categories = await ProductCategory.find({}).lean();
    console.log(`📦 Found ${categories.length} categories`);
    
    // If anklet was just added, refresh categories
    const kidsCategory = categories.find((cat: any) => cat.slug === 'kids');
    if (kidsCategory && !(kidsCategory as any).subcategories?.some((s: any) => s.slug === 'anklet')) {
      categories = await ProductCategory.find({}).lean();
    }

    // Create a map of category slug -> category data
    const categoryMap = new Map();
    categories.forEach((cat: any) => {
      categoryMap.set(cat.slug, cat);
    });

    // Get all products
    const products = await Product.find({}).lean();
    console.log(`📦 Found ${products.length} products`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of products) {
      const productSlug = (product as any).slug;
      const subcategorySlug = productSubcategoryMap[productSlug];

      if (!subcategorySlug) {
        console.log(`⚠️  No subcategory mapping found for product: ${productSlug}`);
        skipped++;
        continue;
      }

      // Find the category of this product
      const categoryId = (product as any).category;
      const category: any = categories.find((cat: any) => 
        cat._id.toString() === categoryId?.toString()
      );

      if (!category) {
        console.log(`❌ Category not found for product: ${productSlug}`);
        errors++;
        continue;
      }

      // Find the subcategory in the category's subcategories array
      const subcategory: any = category.subcategories?.find(
        (sub: any) => sub.slug === subcategorySlug
      );

      if (!subcategory || !subcategory._id) {
        console.log(`❌ Subcategory "${subcategorySlug}" not found in category "${category.slug}" for product: ${productSlug}`);
        errors++;
        continue;
      }

      // Update the product with subcategory ObjectId
      await Product.updateOne(
        { _id: (product as any)._id },
        { $set: { subcategory: subcategory._id } }
      );

      console.log(`✅ Updated ${productSlug} with subcategory ${subcategorySlug} (${subcategory._id})`);
      updated++;
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Updated: ${updated}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the migration
updateProductsSubcategory();

