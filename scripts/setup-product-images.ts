import mongoose from 'mongoose';
import { Product, productSchema } from '../src/product/schemas/product.schema';
import * as fs from 'fs';
import * as path from 'path';

const MONGODB_URI = 'mongodb://localhost:27017/horsegallery';

// لیست تصاویر موجود
const availableImages = [
  { main: 'product1.webp', hover: 'product1-1.webp' },
  { main: 'product2.webp', hover: 'product2-2.webp' },
  { main: 'product3.webp', hover: 'product3-3.webp' },
  { main: 'product4.webp', hover: 'product4-4.webp' },
  { main: 'product5.webp', hover: 'product5-5.webp' },
  { main: 'product6.webp', hover: 'product6-6.webp' },
  { main: 'product7.webp', hover: 'product7-7.webp' },
  { main: 'product8.webp', hover: 'product8-8.webp' },
  { main: 'product9.webp', hover: 'product9-9.webp' },
];

async function setupProductImages() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const ProductModel = mongoose.model<Product>('Product', productSchema);

    // دریافت همه محصولات
    const products = await ProductModel.find({}).lean();
    console.log(`📦 Found ${products.length} products`);

    // ایجاد مسیر files/products اگر وجود ندارد
    const productsImagesDir = path.join(process.cwd(), 'files', 'products');
    if (!fs.existsSync(productsImagesDir)) {
      fs.mkdirSync(productsImagesDir, { recursive: true });
      console.log('✅ Created files/products directory');
    }

    // کپی یا symlink تصاویر موجود
    const sourceDir = path.join(process.cwd(), 'files', 'product', 'main');
    const targetDir = productsImagesDir;

    // استفاده از اولین فایل موجود به عنوان source
    const sourceFiles = fs.readdirSync(sourceDir);
    if (sourceFiles.length === 0) {
      console.log('❌ No source images found in files/product/main');
      await mongoose.disconnect();
      return;
    }

    const sourceFile = path.join(sourceDir, sourceFiles[0]);
    console.log(`📸 Using source image: ${sourceFiles[0]}`);

    // ایجاد symlink برای همه تصاویر
    for (const img of availableImages) {
      const mainPath = path.join(targetDir, img.main);
      const hoverPath = path.join(targetDir, img.hover);

      // Remove existing files/symlinks
      if (fs.existsSync(mainPath)) {
        fs.unlinkSync(mainPath);
      }
      if (fs.existsSync(hoverPath)) {
        fs.unlinkSync(hoverPath);
      }

      // Create symlinks
      try {
        fs.symlinkSync(sourceFile, mainPath);
        fs.symlinkSync(sourceFile, hoverPath);
        console.log(`✅ Created symlinks for ${img.main} and ${img.hover}`);
      } catch (error) {
        console.log(`⚠️  Failed to create symlinks for ${img.main}:`, error);
      }
    }

    // به‌روزرسانی مسیر تصاویر در database
    let updatedCount = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const imageIndex = i % availableImages.length; // Cycle through available images
      const images = availableImages[imageIndex];

      const newImages = [
        `/images/products/${images.main}`,
        `/images/products/${images.hover}`,
      ];

      await ProductModel.findByIdAndUpdate(
        product._id,
        { $set: { images: newImages } },
        { new: true },
      );

      updatedCount++;
      if (updatedCount % 10 === 0) {
        console.log(`✅ Updated ${updatedCount} products...`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Updated: ${updatedCount} products with images`);
    console.log(`✅ Created: ${availableImages.length * 2} image symlinks`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupProductImages().catch(console.error);

