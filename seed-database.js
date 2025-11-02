/**
 * MongoDB Database Seeder
 * این اسکریپت داده‌های تستی استاندارد رو به database اضافه می‌کنه
 *
 * نحوه اجرا:
 * node seed-database.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// MongoDB Connection
const MONGODB_URI = 'mongodb://localhost:27017/horsegallery';

// Color codes for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// ============================================================================
// SCHEMAS
// ============================================================================

const userSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    mobile: { type: String, unique: true, required: true },
    password: String,
    role: {
      type: String,
      enum: ['user', 'admin', 'copyWriter'],
      default: 'user',
    },
  },
  { timestamps: true },
);

const productCategorySchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    image: String,
    url: { type: String, unique: true, required: true },
  },
  { timestamps: true },
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductCategory',
      required: true,
    },
    description: String,
    content: String,
    images: [String],
    // Gold/Jewelry specific fields
    weight: Number,
    karat: Number,
    type: String,
    material: String,
    dimensions: String,
    hasCertificate: { type: Boolean, default: false },
    certificateNumber: String,
    version: { type: Number, default: 1 },
  },
  { timestamps: true },
);

const blogCategorySchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    image: String,
    url: { type: String, unique: true, required: true },
  },
  { timestamps: true },
);

const blogSchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    image: String,
    url: { type: String, unique: true, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogCategory',
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

const seoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, unique: true },
    seoTitle: String,
    seoDescription: String,
    h1: String,
    content: String,
  },
  { timestamps: true },
);

const shippingSchema = new mongoose.Schema(
  {
    title: String,
    price: Number,
    freeShippingThreshold: { type: Number, default: null },
  },
  { timestamps: true },
);

const addressSchema = new mongoose.Schema(
  {
    content: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: { type: Number, default: 1 },
    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cart',
      required: true,
    },
  },
  { timestamps: true },
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shipping: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipping',
      required: true,
    },
    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      required: true,
    },
    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cart',
      required: true,
    },
    totalWithDiscount: { type: Number, required: true },
    totalWithoutDiscount: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },
    finalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ['paying', 'paid', 'sent', 'canceled'],
      default: 'paying',
    },
    refId: String,
    paymentAttempts: { type: Number, default: 0 },
    idempotencyKey: String,
    lastPaymentAttemptAt: Date,
  },
  { timestamps: true },
);

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: { type: Number, default: 1 },
    priceWithDiscount: Number,
    priceWithoutDiscount: Number,
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
  },
  { timestamps: true },
);

const ticketSchema = new mongoose.Schema(
  {
    title: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'responded', 'closed', 'Open'],
      default: 'Open',
    },
  },
  { timestamps: true },
);

const ticketMessageSchema = new mongoose.Schema(
  {
    content: String,
    image: String,
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

// Models
const User = mongoose.model('User', userSchema);
const ProductCategory = mongoose.model(
  'ProductCategory',
  productCategorySchema,
);
const Product = mongoose.model('Product', productSchema);
const BlogCategory = mongoose.model('BlogCategory', blogCategorySchema);
const Blog = mongoose.model('Blog', blogSchema);
const Seo = mongoose.model('Seo', seoSchema);
const Shipping = mongoose.model('Shipping', shippingSchema);
const Address = mongoose.model('Address', addressSchema);
const Cart = mongoose.model('Cart', cartSchema);
const CartItem = mongoose.model('CartItem', cartItemSchema);
const Order = mongoose.model('Order', orderSchema);
const OrderItem = mongoose.model('OrderItem', orderItemSchema);
const Ticket = mongoose.model('Ticket', ticketSchema);
const TicketMessage = mongoose.model('TicketMessage', ticketMessageSchema);

// ============================================================================
// MOCK DATA
// ============================================================================

const getMockData = async () => {
  const hashedPassword = await bcrypt.hash('Test@1234', 10);

  return {
    users: [
      {
        firstName: 'ادمین',
        lastName: 'سیستم',
        mobile: '09123456789',
        password: hashedPassword,
        role: 'admin',
      },
      {
        firstName: 'علی',
        lastName: 'محمدی',
        mobile: '09121111111',
        password: hashedPassword,
        role: 'user',
      },
      {
        firstName: 'سارا',
        lastName: 'احمدی',
        mobile: '09122222222',
        password: hashedPassword,
        role: 'user',
      },
      {
        firstName: 'نویسنده',
        lastName: 'محتوا',
        mobile: '09123333333',
        password: hashedPassword,
        role: 'copyWriter',
      },
    ],

    productCategories: [
      {
        title: 'انگشتر',
        url: 'ring',
        content: 'انواع انگشترهای طلا و جواهرات با طراحی‌های متنوع',
        image: null,
      },
      {
        title: 'گردنبند',
        url: 'necklace',
        content: 'انواع گردنبندهای طلا و جواهرات با سنگ‌های قیمتی',
        image: null,
      },
      {
        title: 'دستبند',
        url: 'bracelet',
        content: 'انواع دستبندهای طلا و جواهرات برای خانم‌ها و آقایان',
        image: null,
      },
      {
        title: 'گوشواره',
        url: 'earring',
        content: 'انواع گوشواره‌های طلا با طراحی مدرن و کلاسیک',
        image: null,
      },
      {
        title: 'سکه طلا',
        url: 'gold-coin',
        content: 'انواع سکه‌های طلا برای سرمایه‌گذاری',
        image: null,
      },
      {
        title: 'شمش طلا',
        url: 'gold-bar',
        content: 'انواع شمش‌های طلا با وزن‌های مختلف',
        image: null,
      },
    ],

    blogCategories: [
      {
        title: 'آموزش',
        url: 'tutorial',
        content: 'مقالات آموزشی درباره طلا و جواهرات',
        image: null,
      },
      {
        title: 'اخبار',
        url: 'news',
        content: 'آخرین اخبار بازار طلا و جواهرات',
        image: null,
      },
      {
        title: 'راهنمای خرید',
        url: 'buying-guide',
        content: 'راهنمای خرید و انتخاب طلا و جواهرات',
        image: null,
      },
    ],

    shippingMethods: [
      {
        title: 'پست پیشتاز',
        price: 50000,
        freeShippingThreshold: 5000000,
      },
      {
        title: 'پست سفارشی',
        price: 30000,
        freeShippingThreshold: 3000000,
      },
      {
        title: 'تحویل حضوری',
        price: 0,
        freeShippingThreshold: null,
      },
    ],
  };
};

// Product data generator
const generateProducts = (categories) => {
  const products = [];

  // انگشترها
  const ringCategory = categories.find((c) => c.url === 'ring');
  if (ringCategory) {
    products.push(
      {
        title: 'انگشتر طلای زنانه نگین‌دار',
        url: 'gold-ring-women-diamond',
        description: 'انگشتر طلای 18 عیار با نگین‌های زیرکونیا',
        content: `<p>این انگشتر زیبا از طلای 18 عیار ساخته شده و با نگین‌های درخشان زیرکونیا تزیین شده است.</p>
<p>مناسب برای مراسم‌های خاص و هدیه دادن.</p>`,
        images: [],
        price: 12500000,
        discount: 10,
        stock: 15,
        category: ringCategory._id,
        isAvailable: true,
        weight: 3.5,
        karat: 18,
        type: 'ring',
        material: 'gold',
        dimensions: 'سایز قابل تنظیم',
        hasCertificate: true,
        certificateNumber: 'CERT-2025-001',
      },
      {
        title: 'انگشتر طلای مردانه ساده',
        url: 'gold-ring-men-simple',
        description: 'انگشتر طلای 18 عیار مردانه با طراحی کلاسیک',
        content:
          '<p>انگشتر طلای مردانه با طراحی ساده و شیک، مناسب برای استفاده روزمره.</p>',
        images: [],
        price: 8500000,
        discount: 0,
        stock: 20,
        category: ringCategory._id,
        isAvailable: true,
        weight: 5.2,
        karat: 18,
        type: 'ring',
        material: 'gold',
        dimensions: 'سایز 19',
        hasCertificate: true,
        certificateNumber: 'CERT-2025-002',
      },
    );
  }

  // گردنبندها
  const necklaceCategory = categories.find((c) => c.url === 'necklace');
  if (necklaceCategory) {
    products.push(
      {
        title: 'گردنبند طلا با آویز قلب',
        url: 'gold-necklace-heart-pendant',
        description: 'گردنبند طلای 18 عیار با آویز قلب',
        content:
          '<p>گردنبند ظریف و زیبا با آویز قلب، هدیه‌ای عالی برای عزیزان.</p>',
        images: [],
        price: 15000000,
        discount: 15,
        stock: 10,
        category: necklaceCategory._id,
        isAvailable: true,
        weight: 4.8,
        karat: 18,
        type: 'necklace',
        material: 'gold',
        dimensions: 'طول زنجیر 45 سانتی‌متر',
        hasCertificate: true,
        certificateNumber: 'CERT-2025-003',
      },
      {
        title: 'گردنبند طلا با نگین‌های زیرکونیا',
        url: 'gold-necklace-zirconia',
        description: 'گردنبند طلای 18 عیار مرصع به نگین‌های زیرکونیا',
        content:
          '<p>گردنبند لوکس با نگین‌های براق، برای جلب توجه در مهمانی‌ها.</p>',
        images: [],
        price: 22000000,
        discount: 0,
        stock: 5,
        category: necklaceCategory._id,
        isAvailable: true,
        weight: 6.5,
        karat: 18,
        type: 'necklace',
        material: 'gold',
        dimensions: 'طول زنجیر 50 سانتی‌متر',
        hasCertificate: true,
        certificateNumber: 'CERT-2025-004',
      },
    );
  }

  // دستبندها
  const braceletCategory = categories.find((c) => c.url === 'bracelet');
  if (braceletCategory) {
    products.push({
      title: 'دستبند طلای زنانه کارتیه',
      url: 'gold-bracelet-women-cartier',
      description: 'دستبند طلای 18 عیار با طرح کارتیه',
      content: '<p>دستبند شیک و مدرن، برای خانم‌های با سلیقه.</p>',
      images: [],
      price: 18500000,
      discount: 5,
      stock: 8,
      category: braceletCategory._id,
      isAvailable: true,
      weight: 7.2,
      karat: 18,
      type: 'bracelet',
      material: 'gold',
      dimensions: 'طول 18 سانتی‌متر',
      hasCertificate: true,
      certificateNumber: 'CERT-2025-005',
    });
  }

  // گوشواره‌ها
  const earringCategory = categories.find((c) => c.url === 'earring');
  if (earringCategory) {
    products.push({
      title: 'گوشواره طلا حلقه‌ای',
      url: 'gold-earring-hoop',
      description: 'گوشواره طلای 18 عیار حلقه‌ای',
      content: '<p>گوشواره حلقه‌ای کلاسیک، مناسب برای هر استایلی.</p>',
      images: [],
      price: 9500000,
      discount: 10,
      stock: 12,
      category: earringCategory._id,
      isAvailable: true,
      weight: 3.2,
      karat: 18,
      type: 'earring',
      material: 'gold',
      dimensions: 'قطر 2.5 سانتی‌متر',
      hasCertificate: false,
    });
  }

  // سکه‌ها
  const coinCategory = categories.find((c) => c.url === 'gold-coin');
  if (coinCategory) {
    products.push(
      {
        title: 'سکه طلای یک گرمی',
        url: 'gold-coin-1gram',
        description: 'سکه طلای 24 عیار یک گرمی',
        content: '<p>سکه طلای خالص برای سرمایه‌گذاری.</p>',
        images: [],
        price: 7200000,
        discount: 0,
        stock: 50,
        category: coinCategory._id,
        isAvailable: true,
        weight: 1,
        karat: 24,
        type: 'coin',
        material: 'gold',
        dimensions: 'قطر 14 میلی‌متر',
        hasCertificate: true,
        certificateNumber: 'COIN-2025-001',
      },
      {
        title: 'سکه طلای نیم',
        url: 'gold-coin-half',
        description: 'سکه طلای 24 عیار نیم',
        content: '<p>سکه نیم، انتخابی عالی برای هدیه و سرمایه‌گذاری.</p>',
        images: [],
        price: 18500000,
        discount: 0,
        stock: 30,
        category: coinCategory._id,
        isAvailable: true,
        weight: 2.25,
        karat: 24,
        type: 'coin',
        material: 'gold',
        dimensions: 'قطر 22 میلی‌متر',
        hasCertificate: true,
        certificateNumber: 'COIN-2025-002',
      },
      {
        title: 'سکه طلای تمام بهار آزادی',
        url: 'gold-coin-full-bahar-azadi',
        description: 'سکه طلای 24 عیار تمام بهار آزادی',
        content: '<p>سکه تمام بهار آزادی، معتبرترین سکه برای سرمایه‌گذاری.</p>',
        images: [],
        price: 36000000,
        discount: 0,
        stock: 25,
        category: coinCategory._id,
        isAvailable: true,
        weight: 8.13,
        karat: 24,
        type: 'coin',
        material: 'gold',
        dimensions: 'قطر 32 میلی‌متر',
        hasCertificate: true,
        certificateNumber: 'COIN-2025-003',
      },
    );
  }

  // شمش‌ها
  const barCategory = categories.find((c) => c.url === 'gold-bar');
  if (barCategory) {
    products.push(
      {
        title: 'شمش طلای 10 گرمی',
        url: 'gold-bar-10gram',
        description: 'شمش طلای 24 عیار 10 گرمی',
        content:
          '<p>شمش طلای خالص با گواهی بین‌المللی، برای سرمایه‌گذاری بلندمدت.</p>',
        images: [],
        price: 72000000,
        discount: 0,
        stock: 15,
        category: barCategory._id,
        isAvailable: true,
        weight: 10,
        karat: 24,
        type: 'bar',
        material: 'gold',
        dimensions: '20×10×2 میلی‌متر',
        hasCertificate: true,
        certificateNumber: 'BAR-2025-001',
      },
      {
        title: 'شمش طلای 50 گرمی',
        url: 'gold-bar-50gram',
        description: 'شمش طلای 24 عیار 50 گرمی',
        content: '<p>شمش طلای بزرگ برای سرمایه‌گذاران جدی.</p>',
        images: [],
        price: 360000000,
        discount: 2,
        stock: 5,
        category: barCategory._id,
        isAvailable: true,
        weight: 50,
        karat: 24,
        type: 'bar',
        material: 'gold',
        dimensions: '40×20×4 میلی‌متر',
        hasCertificate: true,
        certificateNumber: 'BAR-2025-002',
      },
    );
  }

  return products;
};

// Blog data generator
const generateBlogs = (blogCategories, users) => {
  const blogs = [];
  const author = users.find((u) => u.role === 'copyWriter') || users[0];

  const tutorialCategory = blogCategories.find((c) => c.url === 'tutorial');
  const newsCategory = blogCategories.find((c) => c.url === 'news');
  const guideCategory = blogCategories.find((c) => c.url === 'buying-guide');

  if (tutorialCategory) {
    blogs.push(
      {
        title: 'آموزش تشخیص طلای اصل از تقلبی',
        content: `<h2>چگونه طلای اصل را تشخیص دهیم؟</h2>
<p>تشخیص طلای اصل از تقلبی یکی از مهم‌ترین مهارت‌های خریداران طلا است. در این مقاله به شما روش‌های ساده و کاربردی برای تشخیص طلای اصل را آموزش می‌دهیم.</p>
<h3>روش‌های تشخیص طلای اصل:</h3>
<ul>
<li>بررسی علامت عیار: طلای اصل حتماً علامت عیار دارد (18، 21، 24)</li>
<li>آزمایش آهنربا: طلای خالص به آهنربا نمی‌چسبد</li>
<li>بررسی رنگ: طلای اصل رنگ یکنواختی دارد</li>
<li>مراجعه به طلافروشی معتبر: مطمئن‌ترین راه</li>
</ul>`,
        image: null,
        url: 'how-to-detect-real-gold',
        category: tutorialCategory._id,
        user: author._id,
      },
      {
        title: 'روش‌های صحیح نگهداری از طلا',
        content: `<h2>چگونه از طلای خود مراقبت کنیم؟</h2>
<p>نگهداری صحیح از طلا می‌تواند عمر و زیبایی آن را چند برابر کند.</p>
<h3>نکات مهم:</h3>
<ul>
<li>از تماس با مواد شیمیایی پرهیز کنید</li>
<li>در محل خشک و بدون رطوبت نگهداری کنید</li>
<li>برای تمیز کردن از آب و صابون ملایم استفاده کنید</li>
</ul>`,
        image: null,
        url: 'how-to-care-for-gold',
        category: tutorialCategory._id,
        user: author._id,
      },
    );
  }

  if (newsCategory) {
    blogs.push(
      {
        title: 'آخرین قیمت طلا امروز',
        content: `<h2>قیمت طلا در بازار</h2>
<p>قیمت هر گرم طلای 18 عیار امروز به 7,200,000 تومان رسید.</p>
<p>بازار طلا امروز با روند صعودی همراه بود و قیمت سکه تمام بهار آزادی به 36,000,000 تومان رسید.</p>
<h3>قیمت‌ها:</h3>
<ul>
<li>طلای 18 عیار: 7,200,000 تومان</li>
<li>سکه تمام: 36,000,000 تومان</li>
<li>سکه نیم: 18,500,000 تومان</li>
</ul>`,
        image: null,
        url: 'gold-price-today',
        category: newsCategory._id,
        user: author._id,
      },
      {
        title: 'پیش‌بینی قیمت طلا برای هفته آینده',
        content: `<h2>روند بازار طلا</h2>
<p>کارشناسان پیش‌بینی می‌کنند قیمت طلا در هفته آینده روند صعودی داشته باشد.</p>`,
        image: null,
        url: 'gold-price-forecast',
        category: newsCategory._id,
        user: author._id,
      },
    );
  }

  if (guideCategory) {
    blogs.push(
      {
        title: 'راهنمای خرید انگشتر نامزدی',
        content: `<h2>نکات مهم در خرید انگشتر نامزدی</h2>
<p>انتخاب انگشتر نامزدی یکی از مهم‌ترین تصمیمات در زندگی شماست.</p>
<h3>نکات کلیدی:</h3>
<ul>
<li>بودجه خود را مشخص کنید</li>
<li>سلیقه خود و همسرتان را در نظر بگیرید</li>
<li>کیفیت و عیار طلا را بررسی کنید</li>
<li>از فروشگاه‌های معتبر خرید کنید</li>
</ul>`,
        image: null,
        url: 'engagement-ring-buying-guide',
        category: guideCategory._id,
        user: author._id,
      },
      {
        title: 'راهنمای انتخاب سکه برای سرمایه‌گذاری',
        content: `<h2>چگونه سکه مناسب را انتخاب کنیم؟</h2>
<p>سرمایه‌گذاری در سکه یکی از امن‌ترین روش‌های سرمایه‌گذاری است.</p>
<h3>انواع سکه:</h3>
<ul>
<li>سکه تمام بهار آزادی: محبوب‌ترین</li>
<li>سکه نیم: مناسب سرمایه متوسط</li>
<li>سکه ربع: برای سرمایه کم</li>
</ul>`,
        image: null,
        url: 'coin-investment-guide',
        category: guideCategory._id,
        user: author._id,
      },
      {
        title: 'تفاوت طلای 18 عیار و 24 عیار',
        content: `<h2>کدام طلا برای شما مناسب‌تر است؟</h2>
<p>طلای 18 عیار برای ساخت زیورآلات و طلای 24 عیار برای سرمایه‌گذاری مناسب است.</p>`,
        image: null,
        url: 'difference-18k-24k-gold',
        category: guideCategory._id,
        user: author._id,
      },
    );
  }

  return blogs;
};

// SEO data generator
const generateSeo = () => {
  return [
    {
      url: '/',
      seoTitle: 'فروشگاه طلا و جواهرات | خرید آنلاین طلا',
      seoDescription:
        'خرید آنلاین انواع طلا و جواهرات با بهترین قیمت و کیفیت. ارسال رایگان به سراسر کشور.',
      h1: 'فروشگاه طلا و جواهرات',
      content: '<p>بهترین محصولات طلا و جواهرات را از ما بخرید.</p>',
    },
    {
      url: '/products',
      seoTitle: 'لیست محصولات | فروشگاه طلا',
      seoDescription:
        'مشاهده و خرید انواع محصولات طلا شامل انگشتر، گردنبند، دستبند و گوشواره.',
      h1: 'محصولات طلا و جواهرات',
      content: null,
    },
    {
      url: '/blog',
      seoTitle: 'وبلاگ | مقالات آموزشی طلا و جواهرات',
      seoDescription:
        'مقالات و مطالب آموزشی درباره طلا، نحوه خرید، نگهداری و قیمت‌ها.',
      h1: 'وبلاگ طلا و جواهرات',
      content: null,
    },
    {
      url: '/about',
      seoTitle: 'درباره ما | فروشگاه طلا و جواهرات',
      seoDescription:
        'آشنایی با فروشگاه طلا و جواهرات ما، سابقه، خدمات و تیم متخصص.',
      h1: 'درباره فروشگاه ما',
      content: '<p>ما بیش از 20 سال سابقه در صنعت طلا و جواهرات داریم.</p>',
    },
    {
      url: '/contact',
      seoTitle: 'تماس با ما | فروشگاه طلا',
      seoDescription: 'راه‌های ارتباطی با فروشگاه طلا و جواهرات، آدرس و تلفن.',
      h1: 'تماس با ما',
      content: null,
    },
  ];
};

// Address data generator
const generateAddresses = (users) => {
  const addresses = [];

  // برای هر user یک آدرس اصلی
  users.forEach((user, index) => {
    if (user.role === 'user' || user.role === 'admin') {
      addresses.push({
        content: `تهران، خیابان ولیعصر، پلاک ${100 + index * 10}، واحد ${index + 1}`,
        user: user._id,
      });
    }
  });

  // آدرس‌های اضافی برای user اول
  const firstUser = users.find((u) => u.mobile === '09121111111');
  if (firstUser) {
    addresses.push(
      {
        content: 'تهران، خیابان آزادی، نبش کوچه 12، پلاک 45',
        user: firstUser._id,
      },
      {
        content: 'کرج، میدان آزادگان، برج سپهر، طبقه 8، واحد 12',
        user: firstUser._id,
      },
    );
  }

  return addresses;
};

// Cart and CartItem generator
const generateCartsAndItems = (users, products) => {
  const carts = [];
  const cartItems = [];

  // سبد خرید برای user اول (پر شده)
  const user1 = users.find((u) => u.mobile === '09121111111');
  if (user1 && products.length > 0) {
    const cart1 = {
      _id: new mongoose.Types.ObjectId(),
      user: user1._id,
    };
    carts.push(cart1);

    // اضافه کردن 3 محصول به سبد
    if (products[0]) {
      cartItems.push({
        product: products[0]._id,
        quantity: 2,
        cart: cart1._id,
      });
    }
    if (products[1]) {
      cartItems.push({
        product: products[1]._id,
        quantity: 1,
        cart: cart1._id,
      });
    }
    if (products[5]) {
      cartItems.push({
        product: products[5]._id,
        quantity: 1,
        cart: cart1._id,
      });
    }
  }

  // سبد خرید برای user دوم (خالی)
  const user2 = users.find((u) => u.mobile === '09122222222');
  if (user2) {
    carts.push({
      _id: new mongoose.Types.ObjectId(),
      user: user2._id,
    });
  }

  return { carts, cartItems };
};

// Order and OrderItem generator
const generateOrdersAndItems = (
  users,
  products,
  addresses,
  shippings,
  carts,
) => {
  const orders = [];
  const orderItems = [];

  const user1 = users.find((u) => u.mobile === '09121111111');
  const user2 = users.find((u) => u.mobile === '09122222222');

  if (
    user1 &&
    products.length > 0 &&
    addresses.length > 0 &&
    shippings.length > 0
  ) {
    // سفارش 1: پرداخت شده
    const order1 = {
      _id: new mongoose.Types.ObjectId(),
      user: user1._id,
      shipping: shippings[0]._id,
      address: addresses[0]._id,
      cart: carts[0]?._id || new mongoose.Types.ObjectId(),
      totalWithDiscount: 22500000,
      totalWithoutDiscount: 25000000,
      shippingPrice: 50000,
      finalPrice: 22550000,
      status: 'paid',
      refId: 'REF-2025-001',
      paymentAttempts: 1,
      idempotencyKey: `order_${user1._id}_${Date.now() - 86400000}`,
    };
    orders.push(order1);

    // آیتم‌های سفارش 1
    if (products[0]) {
      orderItems.push({
        product: products[0]._id,
        quantity: 2,
        priceWithDiscount: products[0].price * (1 - products[0].discount / 100),
        priceWithoutDiscount: products[0].price,
        order: order1._id,
      });
    }

    // سفارش 2: ارسال شده
    const order2 = {
      _id: new mongoose.Types.ObjectId(),
      user: user1._id,
      shipping: shippings[1]._id,
      address: addresses[1] ? addresses[1]._id : addresses[0]._id,
      cart: new mongoose.Types.ObjectId(),
      totalWithDiscount: 36000000,
      totalWithoutDiscount: 36000000,
      shippingPrice: 30000,
      finalPrice: 36030000,
      status: 'sent',
      refId: 'REF-2025-002',
      paymentAttempts: 1,
      idempotencyKey: `order_${user1._id}_${Date.now() - 172800000}`,
    };
    orders.push(order2);

    if (products[7]) {
      orderItems.push({
        product: products[7]._id,
        quantity: 1,
        priceWithDiscount: products[7].price,
        priceWithoutDiscount: products[7].price,
        order: order2._id,
      });
    }
  }

  if (
    user2 &&
    products.length > 2 &&
    addresses.length > 1 &&
    shippings.length > 0
  ) {
    // سفارش 3: در حال پرداخت
    const order3 = {
      _id: new mongoose.Types.ObjectId(),
      user: user2._id,
      shipping: shippings[0]._id,
      address: addresses[1]._id,
      cart: carts[1]?._id || new mongoose.Types.ObjectId(),
      totalWithDiscount: 15000000,
      totalWithoutDiscount: 17640000,
      shippingPrice: 50000,
      finalPrice: 15050000,
      status: 'paying',
      refId: null,
      paymentAttempts: 0,
      idempotencyKey: `order_${user2._id}_${Date.now()}`,
    };
    orders.push(order3);

    if (products[2]) {
      orderItems.push({
        product: products[2]._id,
        quantity: 1,
        priceWithDiscount: products[2].price * (1 - products[2].discount / 100),
        priceWithoutDiscount: products[2].price,
        order: order3._id,
      });
    }
  }

  return { orders, orderItems };
};

// Ticket and TicketMessage generator
const generateTicketsAndMessages = (users) => {
  const tickets = [];
  const ticketMessages = [];

  const user1 = users.find((u) => u.mobile === '09121111111');
  const admin = users.find((u) => u.role === 'admin');

  if (user1 && admin) {
    // تیکت 1: باز
    const ticket1 = {
      _id: new mongoose.Types.ObjectId(),
      title: 'سوال در مورد قیمت سکه',
      user: user1._id,
      status: 'Open',
    };
    tickets.push(ticket1);

    ticketMessages.push(
      {
        content: 'سلام، می‌خواستم بدونم قیمت سکه تمام امروز چنده؟',
        image: null,
        ticket: ticket1._id,
        user: user1._id,
      },
      {
        content: 'سلام، قیمت سکه تمام بهار آزادی امروز 36,000,000 تومان است.',
        image: null,
        ticket: ticket1._id,
        user: admin._id,
      },
    );

    // تیکت 2: پاسخ داده شده
    const ticket2 = {
      _id: new mongoose.Types.ObjectId(),
      title: 'زمان ارسال سفارش',
      user: user1._id,
      status: 'responded',
    };
    tickets.push(ticket2);

    ticketMessages.push(
      {
        content: 'سفارشم کی ارسال میشه؟',
        image: null,
        ticket: ticket2._id,
        user: user1._id,
      },
      {
        content: 'سفارش شما ظرف 2 روز کاری ارسال خواهد شد.',
        image: null,
        ticket: ticket2._id,
        user: admin._id,
      },
    );

    // تیکت 3: بسته شده
    const ticket3 = {
      _id: new mongoose.Types.ObjectId(),
      title: 'درخواست لغو سفارش',
      user: user1._id,
      status: 'closed',
    };
    tickets.push(ticket3);

    ticketMessages.push(
      {
        content: 'می‌خوام سفارشم رو کنسل کنم',
        image: null,
        ticket: ticket3._id,
        user: user1._id,
      },
      {
        content: 'سفارش شما لغو شد و مبلغ به حساب شما برگشت داده خواهد شد.',
        image: null,
        ticket: ticket3._id,
        user: admin._id,
      },
    );
  }

  return { tickets, ticketMessages };
};

// ============================================================================
// MAIN SEEDER FUNCTION
// ============================================================================

async function seedDatabase() {
  try {
    log('\n🚀 Starting database seeding...', 'blue');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    log('✅ Connected to MongoDB', 'green');

    // Clear existing data
    log('\n🗑️  Clearing existing data...', 'yellow');
    await User.deleteMany({});
    await ProductCategory.deleteMany({});
    await Product.deleteMany({});
    await BlogCategory.deleteMany({});
    await Blog.deleteMany({});
    await Seo.deleteMany({});
    await Shipping.deleteMany({});
    await Address.deleteMany({});
    await Cart.deleteMany({});
    await CartItem.deleteMany({});
    await Order.deleteMany({});
    await OrderItem.deleteMany({});
    await Ticket.deleteMany({});
    await TicketMessage.deleteMany({});
    log('✅ Cleared all collections', 'green');

    // Get mock data
    const mockData = await getMockData();

    // Insert Users
    log('\n👥 Inserting users...', 'blue');
    const users = await User.insertMany(mockData.users);
    log(`✅ Inserted ${users.length} users`, 'green');
    log(`   📱 Admin: 09123456789 / Test@1234`, 'yellow');
    log(`   📱 User1: 09121111111 / Test@1234`, 'yellow');
    log(`   📱 User2: 09122222222 / Test@1234`, 'yellow');

    // Insert Product Categories
    log('\n📂 Inserting product categories...', 'blue');
    const productCategories = await ProductCategory.insertMany(
      mockData.productCategories,
    );
    log(`✅ Inserted ${productCategories.length} product categories`, 'green');

    // Insert Products
    log('\n🛍️  Inserting products...', 'blue');
    const products = generateProducts(productCategories);
    const insertedProducts = await Product.insertMany(products);
    log(`✅ Inserted ${insertedProducts.length} products`, 'green');

    // Insert Blog Categories
    log('\n📁 Inserting blog categories...', 'blue');
    const blogCategories = await BlogCategory.insertMany(
      mockData.blogCategories,
    );
    log(`✅ Inserted ${blogCategories.length} blog categories`, 'green');

    // Insert Blogs
    log('\n📝 Inserting blogs...', 'blue');
    const blogs = generateBlogs(blogCategories, users);
    const insertedBlogs = await Blog.insertMany(blogs);
    log(`✅ Inserted ${insertedBlogs.length} blogs`, 'green');

    // Insert SEO
    log('\n🔍 Inserting SEO data...', 'blue');
    const seoData = generateSeo();
    const insertedSeo = await Seo.insertMany(seoData);
    log(`✅ Inserted ${insertedSeo.length} SEO entries`, 'green');

    // Insert Shipping Methods
    log('\n🚚 Inserting shipping methods...', 'blue');
    const shippingMethods = await Shipping.insertMany(mockData.shippingMethods);
    log(`✅ Inserted ${shippingMethods.length} shipping methods`, 'green');

    // Insert Addresses
    log('\n📍 Inserting addresses...', 'blue');
    const addresses = generateAddresses(users);
    const insertedAddresses = await Address.insertMany(addresses);
    log(`✅ Inserted ${insertedAddresses.length} addresses`, 'green');

    // Insert Carts and CartItems
    log('\n🛒 Inserting carts and cart items...', 'blue');
    const { carts, cartItems } = generateCartsAndItems(users, insertedProducts);
    const insertedCarts = await Cart.insertMany(carts);
    const insertedCartItems =
      cartItems.length > 0 ? await CartItem.insertMany(cartItems) : [];
    log(`✅ Inserted ${insertedCarts.length} carts`, 'green');
    log(`✅ Inserted ${insertedCartItems.length} cart items`, 'green');

    // Insert Orders and OrderItems
    log('\n📦 Inserting orders and order items...', 'blue');
    const { orders, orderItems } = generateOrdersAndItems(
      users,
      insertedProducts,
      insertedAddresses,
      shippingMethods,
      insertedCarts,
    );
    const insertedOrders = await Order.insertMany(orders);
    const insertedOrderItems = await OrderItem.insertMany(orderItems);
    log(`✅ Inserted ${insertedOrders.length} orders`, 'green');
    log(`✅ Inserted ${insertedOrderItems.length} order items`, 'green');

    // Insert Tickets and TicketMessages
    log('\n🎫 Inserting tickets and ticket messages...', 'blue');
    const { tickets, ticketMessages } = generateTicketsAndMessages(users);
    const insertedTickets = await Ticket.insertMany(tickets);
    const insertedTicketMessages =
      await TicketMessage.insertMany(ticketMessages);
    log(`✅ Inserted ${insertedTickets.length} tickets`, 'green');
    log(
      `✅ Inserted ${insertedTicketMessages.length} ticket messages`,
      'green',
    );

    // Summary
    log('\n' + '='.repeat(70), 'green');
    log('✅ Database seeding completed successfully!', 'green');
    log('='.repeat(70), 'green');
    log('\n📊 Summary:', 'blue');
    log(`   👥 Users: ${users.length}`, 'yellow');
    log(`   📂 Product Categories: ${productCategories.length}`, 'yellow');
    log(`   🛍️  Products: ${insertedProducts.length}`, 'yellow');
    log(`   📁 Blog Categories: ${blogCategories.length}`, 'yellow');
    log(`   📝 Blogs: ${insertedBlogs.length}`, 'yellow');
    log(`   🔍 SEO Entries: ${insertedSeo.length}`, 'yellow');
    log(`   🚚 Shipping Methods: ${shippingMethods.length}`, 'yellow');
    log(`   📍 Addresses: ${insertedAddresses.length}`, 'yellow');
    log(`   🛒 Carts: ${insertedCarts.length}`, 'yellow');
    log(`   📦 Orders: ${insertedOrders.length}`, 'yellow');
    log(`   🎫 Tickets: ${insertedTickets.length}`, 'yellow');
    log(`   💬 Ticket Messages: ${insertedTicketMessages.length}`, 'yellow');

    log('\n🎯 Next steps:', 'blue');
    log('   1. برو به: http://localhost:4001/documentation', 'yellow');
    log('   2. با موبایل 09123456789 و پسورد Test@1234 لاگین کن', 'yellow');
    log('   3. API های product رو تست کن', 'yellow');
    log('   4. از MongoDB Compass داده‌ها رو ببین', 'yellow');
    log('\n💾 Persisted Collections:', 'blue');
    log('   • users, productcategories, products', 'yellow');
    log('   • blogcategories, blogs, seos', 'yellow');
    log('   • shippings, addresses, carts, cartitems', 'yellow');
    log('   • orders, orderitems, tickets, ticketmessages', 'yellow');
  } catch (error) {
    log('\n❌ Error seeding database:', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    log('\n🔌 Disconnected from MongoDB', 'blue');
  }
}

// Run seeder
seedDatabase();
