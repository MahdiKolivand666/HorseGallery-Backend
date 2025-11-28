import * as mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017/horsegallery';

// Mock Data
const categoriesData = [
  {
    name: 'زنانه',
    slug: 'women',
    heroImage: '/images/headerwallp/RTS.webp',
    subcategories: [
      { name: 'گردنبند', slug: 'necklace' },
      { name: 'دستبند', slug: 'bracelet' },
      { name: 'دستبند چرم و طلا', slug: 'leather-gold-bracelet' },
      { name: 'گوشواره', slug: 'earring' },
      { name: 'انگشتر', slug: 'ring' },
      { name: 'آویز گردنبند', slug: 'pendant' },
      { name: 'پیرسینگ', slug: 'piercing' },
      { name: 'پابند', slug: 'anklet' },
    ],
  },
  {
    name: 'مردانه',
    slug: 'men',
    heroImage: '/images/headerwallp/RTS.webp',
    subcategories: [
      { name: 'گردنبند مردانه', slug: 'necklace' },
      { name: 'دستبند چرم و طلا', slug: 'leather-gold-bracelet' },
      { name: 'دستبند مردانه', slug: 'bracelet' },
    ],
  },
  {
    name: 'کودکانه',
    slug: 'kids',
    heroImage: '/images/headerwallp/RTS.webp',
    subcategories: [
      { name: 'گوشواره', slug: 'earring' },
      { name: 'دستبند', slug: 'bracelet' },
      { name: 'آویز گردنبند', slug: 'pendant' },
      { name: 'دستبند چرم و طلا', slug: 'leather-gold-bracelet' },
    ],
  },
];

const productsData = [
  {
    name: 'گردنبند طلای کلاسیک',
    slug: 'classic-gold-necklace-001',
    code: 'GN-001-18K',
    description: 'گردنبند زیبا با طراحی کلاسیک و ظریف، مناسب برای مهمانی‌ها و مجالس',
    price: 45000000,
    discountPrice: 43000000,
    images: ['/images/products/product1.webp', '/images/products/product1-1.webp'],
    category: null, // Will be set after categories are created
    subcategory: null,
    specifications: {
      weight: '12.5 گرم',
      karat: '18 عیار',
      material: 'طلای سرخ',
      dimensions: '45 سانتی‌متر',
      brand: 'گالری اسب',
    },
    stock: 12,
    isAvailable: true,
    isFeatured: true,
    isBestSelling: true,
    isNewArrival: false,
    isGift: true,
    rating: 4.5,
    reviewsCount: 128,
    views: 1250,
    sales: 45,
  },
  {
    name: 'دستبند طلا با نگین',
    slug: 'gold-bracelet-with-stone-002',
    code: 'BR-002-18K',
    description: 'دستبند زیبا با نگین‌های براق، طراحی مدرن و جذاب',
    price: 38000000,
    images: ['/images/products/product2.webp', '/images/products/product2-2.webp'],
    category: null,
    subcategory: null,
    specifications: {
      weight: '9.8 گرم',
      karat: '18 عیار',
      material: 'طلای سرخ',
      brand: 'گالری اسب',
    },
    stock: 8,
    isAvailable: true,
    isFeatured: false,
    isBestSelling: true,
    isNewArrival: true,
    isGift: false,
    rating: 4.8,
    reviewsCount: 96,
    views: 980,
    sales: 32,
  },
  {
    name: 'حلقه ازدواج طلا',
    slug: 'wedding-ring-003',
    code: 'RG-003-18K',
    description: 'حلقه ازدواج کلاسیک با کیفیت بالا و طراحی ماندگار',
    price: 25000000,
    images: ['/images/products/product3.webp', '/images/products/product3-3.webp'],
    category: null,
    subcategory: null,
    specifications: {
      weight: '5.2 گرم',
      karat: '18 عیار',
      material: 'طلای سرخ',
      brand: 'گالری اسب',
    },
    stock: 15,
    isAvailable: true,
    isFeatured: true,
    isBestSelling: false,
    isNewArrival: false,
    isGift: true,
    rating: 5.0,
    reviewsCount: 215,
    views: 2100,
    sales: 87,
  },
  {
    name: 'گوشواره طلا با مروارید',
    slug: 'gold-earring-pearl-004',
    code: 'ER-004-18K',
    description: 'گوشواره لوکس با مروارید طبیعی و طراحی شیک',
    price: 28000000,
    images: ['/images/products/product4.webp', '/images/products/product4-4.webp'],
    category: null,
    subcategory: null,
    specifications: {
      weight: '4.5 گرم',
      karat: '18 عیار',
      material: 'طلای سفید',
      brand: 'گالری اسب',
    },
    stock: 10,
    isAvailable: true,
    isFeatured: false,
    isBestSelling: true,
    isNewArrival: true,
    isGift: false,
    rating: 4.7,
    reviewsCount: 143,
    views: 1350,
    sales: 56,
  },
  {
    name: 'آویز گردنبند قلب',
    slug: 'heart-pendant-005',
    code: 'PD-005-18K',
    description: 'آویز گردنبند طرح قلب با طراحی عاشقانه',
    price: 18000000,
    images: ['/images/products/product5.webp', '/images/products/product5-5.webp'],
    category: null,
    subcategory: null,
    specifications: {
      weight: '3.2 گرم',
      karat: '18 عیار',
      material: 'طلای سرخ',
      brand: 'گالری اسب',
    },
    stock: 20,
    isAvailable: true,
    isFeatured: false,
    isBestSelling: false,
    isNewArrival: true,
    isGift: true,
    rating: 4.6,
    reviewsCount: 89,
    views: 756,
    sales: 34,
  },
  {
    name: 'گردنبند مردانه طرح دار',
    slug: 'mens-chain-necklace-006',
    code: 'MN-006-18K',
    description: 'گردنبند مردانه با طراحی قوی و مردانه',
    price: 52000000,
    images: ['/images/products/product6.webp', '/images/products/product6-6.webp'],
    category: null,
    subcategory: null,
    specifications: {
      weight: '18.5 گرم',
      karat: '18 عیار',
      material: 'طلای سرخ',
      brand: 'گالری اسب',
    },
    stock: 6,
    isAvailable: true,
    isFeatured: true,
    isBestSelling: true,
    isNewArrival: false,
    isGift: false,
    rating: 4.9,
    reviewsCount: 72,
    views: 890,
    sales: 28,
  },
  {
    name: 'دستبند چرم و طلا مردانه',
    slug: 'mens-leather-gold-bracelet-007',
    code: 'MB-007-18K',
    description: 'دستبند ترکیبی چرم و طلا با طراحی اسپرت',
    price: 32000000,
    images: ['/images/products/product7.webp', '/images/products/product7-7.webp'],
    category: null,
    subcategory: null,
    specifications: {
      weight: '8.5 گرم',
      karat: '18 عیار',
      material: 'طلا و چرم طبیعی',
      brand: 'گالری اسب',
    },
    stock: 14,
    isAvailable: true,
    isFeatured: false,
    isBestSelling: false,
    isNewArrival: true,
    isGift: true,
    rating: 4.4,
    reviewsCount: 58,
    views: 645,
    sales: 22,
  },
  {
    name: 'گوشواره کودک طرح پروانه',
    slug: 'kids-butterfly-earring-008',
    code: 'KE-008-18K',
    description: 'گوشواره کودکانه با طراحی شاد و رنگارنگ',
    price: 12000000,
    images: ['/images/products/product8.webp', '/images/products/product8-8.webp'],
    category: null,
    subcategory: null,
    specifications: {
      weight: '2.1 گرم',
      karat: '18 عیار',
      material: 'طلای سرخ',
      brand: 'گالری اسب',
    },
    stock: 25,
    isAvailable: true,
    isFeatured: false,
    isBestSelling: true,
    isNewArrival: false,
    isGift: true,
    rating: 4.8,
    reviewsCount: 134,
    views: 1120,
    sales: 67,
  },
  {
    name: 'دستبند کودک با زنگوله',
    slug: 'kids-bracelet-with-bell-009',
    code: 'KB-009-18K',
    description: 'دستبند بامزه با زنگوله‌های کوچک برای کودکان',
    price: 15000000,
    images: ['/images/products/product9.webp', '/images/products/product9-9.webp'],
    category: null,
    subcategory: null,
    specifications: {
      weight: '3.8 گرم',
      karat: '18 عیار',
      material: 'طلای سرخ',
      brand: 'گالری اسب',
    },
    stock: 18,
    isAvailable: true,
    isFeatured: false,
    isBestSelling: false,
    isNewArrival: true,
    isGift: true,
    rating: 4.7,
    reviewsCount: 92,
    views: 823,
    sales: 41,
  },
  {
    name: 'پابند طلا با آویز',
    slug: 'gold-anklet-with-charm-010',
    code: 'AN-010-18K',
    description: 'پابند ظریف با آویز قلب کوچک',
    price: 22000000,
    images: ['/images/products/product10.webp', '/images/products/product10-10.webp'],
    category: null,
    subcategory: null,
    specifications: {
      weight: '6.5 گرم',
      karat: '18 عیار',
      material: 'طلای سرخ',
      brand: 'گالری اسب',
    },
    stock: 9,
    isAvailable: true,
    isFeatured: false,
    isBestSelling: false,
    isNewArrival: false,
    isGift: false,
    rating: 4.3,
    reviewsCount: 67,
    views: 542,
    sales: 19,
  },
];

const blogPostsData = [
  {
    title: 'راهنمای خرید طلا برای مبتدیان',
    slug: 'gold-buying-guide-beginners',
    excerpt: 'همه چیزهایی که قبل از خرید طلا باید بدانید - از عیار طلا گرفته تا قیمت‌گذاری',
    content: 'محتوای کامل مقاله...',
    image: '/images/blogs/Blog_Square.webp',
    category: null,
    user: null,
    tags: ['خرید طلا', 'راهنما', 'مبتدی'],
    views: 1250,
    likes: 89,
    isFeatured: true,
    publishedAt: new Date('2024-01-15T10:00:00Z'),
  },
  {
    title: 'تفاوت طلای 18 عیار با 24 عیار',
    slug: 'difference-18k-24k-gold',
    excerpt: 'آشنایی با انواع عیار طلا و کاربرد هر کدام در جواهرسازی',
    content: 'محتوای کامل مقاله...',
    image: '/images/blogs/horoscopesArtboard_1_copy_19.webp',
    category: null,
    user: null,
    tags: ['عیار طلا', '18 عیار', '24 عیار'],
    views: 980,
    likes: 67,
    isFeatured: false,
    publishedAt: new Date('2024-01-20T14:30:00Z'),
  },
  {
    title: 'مراقبت و نگهداری از جواهرات طلا',
    slug: 'gold-jewelry-care-maintenance',
    excerpt: 'نکات طلایی برای حفظ درخشش و زیبایی طلاهای خود',
    content: 'محتوای کامل مقاله...',
    image: '/images/blogs/nautilus.webp',
    category: null,
    user: null,
    tags: ['نگهداری طلا', 'تمیز کردن', 'مراقبت'],
    views: 1450,
    likes: 112,
    isFeatured: true,
    publishedAt: new Date('2024-02-01T09:00:00Z'),
  },
  {
    title: 'ترندهای جواهرات در سال 2024',
    slug: 'jewelry-trends-2024',
    excerpt: 'آخرین مدهای جواهرات و طلا که امسال باید حتماً داشته باشید',
    content: 'محتوای کامل مقاله...',
    image: '/images/blogs/Facetune_06-05-2024-10-01-19.webp',
    category: null,
    user: null,
    tags: ['ترند', 'مد', '2024'],
    views: 2100,
    likes: 156,
    isFeatured: true,
    publishedAt: new Date('2024-02-10T11:00:00Z'),
  },
  {
    title: 'انتخاب حلقه ازدواج مناسب',
    slug: 'choosing-perfect-wedding-ring',
    excerpt: 'راهنمای جامع انتخاب حلقه ازدواج بر اساس سلیقه و بودجه',
    content: 'محتوای کامل مقاله...',
    image: '/images/blogs/Blog_Square_faa559f7-3684-4f89-bd02-32198ab6d259.webp',
    category: null,
    user: null,
    tags: ['حلقه ازدواج', 'ازدواج', 'انتخاب'],
    views: 1780,
    likes: 134,
    isFeatured: false,
    publishedAt: new Date('2024-02-15T13:00:00Z'),
  },
  {
    title: 'تاریخچه طلا در ایران',
    slug: 'history-of-gold-in-iran',
    excerpt: 'سفری در تاریخ صنعت طلا و جواهرسازی ایران',
    content: 'محتوای کامل مقاله...',
    image: '/images/blogs/Blog_Square.webp',
    category: null,
    user: null,
    tags: ['تاریخ', 'ایران', 'طلا'],
    views: 890,
    likes: 45,
    isFeatured: false,
    publishedAt: new Date('2024-02-20T10:30:00Z'),
  },
  {
    title: 'هدیه‌های طلا برای مناسبت‌های خاص',
    slug: 'gold-gifts-special-occasions',
    excerpt: 'بهترین پیشنهادات برای هدیه دادن طلا در مناسبت‌های مختلف',
    content: 'محتوای کامل مقاله...',
    image: '/images/blogs/horoscopesArtboard_1_copy_19_4b0ec817-d556-48f0-95df-5a0b892f9e8f.webp',
    category: null,
    user: null,
    tags: ['هدیه', 'مناسبت', 'پیشنهاد'],
    views: 1340,
    likes: 98,
    isFeatured: false,
    publishedAt: new Date('2024-02-25T15:00:00Z'),
  },
  {
    title: 'چگونه طلای اصل را از تقلبی تشخیص دهیم',
    slug: 'how-to-identify-real-gold',
    excerpt: 'روش‌های ساده و کاربردی برای تشخیص اصالت طلا',
    content: 'محتوای کامل مقاله...',
    image: '/images/blogs/nautilus.webp',
    category: null,
    user: null,
    tags: ['اصالت', 'تشخیص', 'طلای اصل'],
    views: 2450,
    likes: 187,
    isFeatured: true,
    publishedAt: new Date('2024-03-01T12:00:00Z'),
  },
  {
    title: 'طلا به عنوان سرمایه‌گذاری',
    slug: 'gold-as-investment',
    excerpt: 'آیا خرید طلا یک سرمایه‌گذاری خوب است؟',
    content: 'محتوای کامل مقاله...',
    image: '/images/blogs/Facetune_06-05-2024-10-01-19.webp',
    category: null,
    user: null,
    tags: ['سرمایه‌گذاری', 'اقتصاد', 'طلا'],
    views: 1690,
    likes: 123,
    isFeatured: false,
    publishedAt: new Date('2024-03-05T09:30:00Z'),
  },
  {
    title: 'استایل کردن با جواهرات طلا',
    slug: 'styling-with-gold-jewelry',
    excerpt: 'ترفندهایی برای ست کردن طلا با لباس‌های مختلف',
    content: 'محتوای کامل مقاله...',
    image: '/images/blogs/Blog_Square_faa559f7-3684-4f89-bd02-32198ab6d259.webp',
    category: null,
    user: null,
    tags: ['استایل', 'مد', 'ست کردن'],
    views: 1520,
    likes: 109,
    isFeatured: false,
    publishedAt: new Date('2024-03-10T14:00:00Z'),
  },
];

const faqData = [
  {
    question: 'چگونه می‌توانم سفارش دهم؟',
    answer: 'برای ثبت سفارش، ابتدا محصول مورد نظر خود را به سبد خرید اضافه کنید. سپس با کلیک بر روی آیکون سبد خرید، به صفحه پرداخت منتقل شوید و مراحل ثبت سفارش را تکمیل نمایید.',
    category: 'خرید و سفارش',
    order: 1,
    isActive: true,
    views: 450,
    helpful: 389,
  },
  {
    question: 'مدت زمان ارسال محصولات چقدر است؟',
    answer: 'معمولاً محصولات ظرف 2 تا 3 روز کاری به دست شما می‌رسد. برای شهرستان‌ها این مدت 3 تا 5 روز کاری است.',
    category: 'ارسال',
    order: 2,
    isActive: true,
    views: 523,
    helpful: 478,
  },
  {
    question: 'آیا امکان مرجوع کردن محصول وجود دارد؟',
    answer: 'بله، شما می‌توانید تا 7 روز پس از دریافت محصول، آن را مرجوع کنید. محصول باید در شرایط اولیه و با بسته‌بندی دست‌نخورده باشد.',
    category: 'بازگشت کالا',
    order: 3,
    isActive: true,
    views: 389,
    helpful: 312,
  },
  {
    question: 'گارانتی محصولات شما چگونه است؟',
    answer: 'تمامی محصولات دارای گارانتی اصالت و 18 ماه گارانتی ساخت هستند. این گارانتی شامل هرگونه نقص ساخت می‌شود.',
    category: 'گارانتی',
    order: 4,
    isActive: true,
    views: 678,
    helpful: 601,
  },
  {
    question: 'روش‌های پرداخت چیست؟',
    answer: 'شما می‌توانید از طریق درگاه‌های پرداخت آنلاین (بانک سامان، ملت، زرین‌پال) یا استفاده از کیف پول خود پرداخت کنید.',
    category: 'پرداخت',
    order: 5,
    isActive: true,
    views: 412,
    helpful: 367,
  },
  {
    question: 'هزینه ارسال چقدر است؟',
    answer: 'برای خریدهای بالای 5 میلیون تومان، ارسال رایگان است. برای خریدهای زیر این مبلغ، هزینه ارسال 50,000 تومان محاسبه می‌شود.',
    category: 'ارسال',
    order: 6,
    isActive: true,
    views: 356,
    helpful: 298,
  },
  {
    question: 'چطور می‌توانم سفارشم را پیگیری کنم؟',
    answer: 'پس از ثبت سفارش، کد پیگیری برای شما ارسال می‌شود. می‌توانید با این کد در قسمت پیگیری سفارش، وضعیت بسته خود را مشاهده کنید.',
    category: 'پیگیری سفارش',
    order: 7,
    isActive: true,
    views: 289,
    helpful: 245,
  },
  {
    question: 'آیا محصولات شما اصل هستند؟',
    answer: 'بله، تمامی محصولات ما اصل و دارای گارانتی اصالت از سازمان صنعت، معدن و تجارت هستند. همچنین هر محصول با برگه گارانتی همراه است.',
    category: 'اصالت محصول',
    order: 8,
    isActive: true,
    views: 567,
    helpful: 534,
  },
];

const goldPriceData = [
  {
    karat: 18,
    pricePerGram: 2450000,
    date: new Date('2024-03-15T08:00:00Z'),
    isActive: true,
    source: 'بانک مرکزی',
  },
  {
    karat: 21,
    pricePerGram: 2850000,
    date: new Date('2024-03-15T08:00:00Z'),
    isActive: true,
    source: 'بانک مرکزی',
  },
  {
    karat: 24,
    pricePerGram: 3300000,
    date: new Date('2024-03-15T08:00:00Z'),
    isActive: true,
    source: 'بانک مرکزی',
  },
];

const announcementsData = [
  {
    title: 'جشنواره بلک فرایدی',
    message: '🎉 جشنواره بلک فرایدی - تا ۵۰٪ تخفیف!',
    link: '/offers/black-friday',
    badge: {
      text: 'جدید',
      color: 'red',
    },
    isActive: true,
    startDate: new Date('2024-03-01T00:00:00Z'),
    endDate: new Date('2024-03-31T23:59:59Z'),
    order: 1,
  },
  {
    title: 'ارسال رایگان',
    message: '⭐ ارسال رایگان برای خریدهای بالای ۵ میلیون تومان',
    link: '/offers/special',
    badge: {
      text: 'ویژه',
      color: 'yellow',
    },
    isActive: true,
    startDate: new Date('2024-03-01T00:00:00Z'),
    order: 2,
  },
  {
    title: 'کالکشن پاییزه',
    message: '✨ کالکشن پاییزه الان موجوده!',
    link: '/products/new',
    badge: {
      text: 'محصول جدید',
      color: 'green',
    },
    isActive: true,
    startDate: new Date('2024-03-01T00:00:00Z'),
    order: 3,
  },
  {
    title: 'تخفیف ویژه طلا',
    message: '💰 تخفیف ویژه محصولات طلا - فقط امروز!',
    link: '/offers/gold-discount',
    badge: {
      text: 'تخفیف',
      color: 'orange',
    },
    isActive: true,
    startDate: new Date('2024-03-15T00:00:00Z'),
    endDate: new Date('2024-03-15T23:59:59Z'),
    order: 4,
  },
];

const usersData = [
  {
    mobile: '09123456789',
    firstName: 'محمد',
    lastName: 'احمدی',
    email: 'mohammad@example.com',
    nationalCode: '0123456789',
    role: 'user',
    isActive: true,
    lastLogin: new Date('2024-03-15T10:30:00Z'),
    password: 'hashed_password_here', // باید hash شود
  },
  {
    mobile: '09187654321',
    firstName: 'مدیر',
    lastName: 'سیستم',
    email: 'admin@horsegallery.com',
    role: 'admin',
    isActive: true,
    lastLogin: new Date('2024-03-15T09:00:00Z'),
    password: 'hashed_password_here', // باید hash شود
  },
];

// Schema definitions
const categorySchema = new mongoose.Schema(
  {
    name: String,
    slug: { type: String, unique: true },
    heroImage: String,
    content: String,
    subcategories: [{ name: String, slug: String }],
  },
  { timestamps: true },
);

const productSchema = new mongoose.Schema(
  {
    name: String,
    slug: { type: String, unique: true },
    code: { type: String, unique: true },
    description: String,
    price: Number,
    discountPrice: Number,
    stock: Number,
    version: { type: Number, default: 1 },
    images: [String],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory' },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory' },
    weight: String,
    karat: String,
    material: String,
    dimensions: String,
    brand: String,
    coverage: String,
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isBestSelling: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isGift: { type: Boolean, default: false },
    rating: Number,
    reviewsCount: Number,
    views: { type: Number, default: 0 },
    sales: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const blogCategorySchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    image: String,
    slug: { type: String, unique: true }, // قبلاً url بود
  },
  { timestamps: true },
);

const blogSchema = new mongoose.Schema(
  {
    title: String,
    slug: { type: String, unique: true },
    excerpt: String,
    content: String,
    image: String,
    tags: [String],
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    publishedAt: Date,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogCategory' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const userSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    mobile: { type: String, unique: true, required: true },
    password: String,
    role: { type: String, enum: ['user', 'admin', 'copyWriter'], default: 'user' },
    email: String,
    nationalCode: String,
    avatar: String,
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
    code: String,
    codeExpiry: Date,
    codeAttempts: { type: Number, default: 0 },
    lastCodeSentAt: Date,
    codeSentCount: { type: Number, default: 0 },
    refreshToken: String,
    refreshTokenExpiry: Date,
  },
  { timestamps: true },
);

const faqSchema = new mongoose.Schema(
  {
    question: String,
    answer: String,
    category: String,
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
    helpful: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const goldPriceSchema = new mongoose.Schema(
  {
    karat: Number,
    pricePerGram: Number,
    date: Date,
    isActive: { type: Boolean, default: true },
    source: String,
  },
  { timestamps: true },
);

const announcementSchema = new mongoose.Schema(
  {
    title: String,
    message: String,
    link: String,
    badge: {
      text: String,
      color: String,
    },
    isActive: { type: Boolean, default: true },
    startDate: Date,
    endDate: Date,
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

async function importData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Connect to MongoDB
    const connection = await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get database instance from connection
    const db = connection.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Delete all existing data and drop collections to remove old indexes
    console.log('🗑️  Deleting existing data...');
    
    try {
      await db.collection('productcategories').drop();
    } catch (e) {
      // Collection might not exist
    }
    try {
      await db.collection('products').drop();
    } catch (e) {
      // Collection might not exist
    }
    try {
      await db.collection('blogcategories').drop();
    } catch (e) {
      // Collection might not exist
    }
    try {
      await db.collection('blogs').drop();
    } catch (e) {
      // Collection might not exist
    }
    try {
      await db.collection('users').drop();
    } catch (e) {
      // Collection might not exist
    }
    try {
      await db.collection('faqs').drop();
    } catch (e) {
      // Collection might not exist
    }
    try {
      await db.collection('goldprices').drop();
    } catch (e) {
      // Collection might not exist
    }
    try {
      await db.collection('announcements').drop();
    } catch (e) {
      // Collection might not exist
    }
    
    console.log('✅ All existing data deleted');

    // Get models (after dropping collections)
    const ProductCategory = mongoose.model('ProductCategory', categorySchema);
    const Product = mongoose.model('Product', productSchema);
    const BlogCategory = mongoose.model('BlogCategory', blogCategorySchema);
    const Blog = mongoose.model('Blog', blogSchema);
    const User = mongoose.model('User', userSchema);
    const FAQ = mongoose.model('FAQ', faqSchema);
    const GoldPrice = mongoose.model('GoldPrice', goldPriceSchema);
    const Announcement = mongoose.model('Announcement', announcementSchema);

    // Create Blog Category first (for blogs)
    console.log('📝 Creating Blog Category...');
    const blogCategory = await BlogCategory.create({
      title: 'آموزش',
      content: 'مقالات آموزشی',
      image: '/images/blogs/category.webp',
      slug: 'education', // قبلاً url بود
    });

    // Create Users first (for blogs)
    console.log('👤 Creating Users...');
    const createdUsers = await User.insertMany(usersData);
    const adminUser = createdUsers.find((u) => u.role === 'admin');

    // Create Categories
    console.log('📁 Creating Categories...');
    const createdCategories = await ProductCategory.insertMany(categoriesData);
    const womenCategory = createdCategories.find((c) => c.slug === 'women');
    const menCategory = createdCategories.find((c) => c.slug === 'men');
    const kidsCategory = createdCategories.find((c) => c.slug === 'kids');

    // Create Products with category references
    console.log('🛍️  Creating Products...');
    const productsWithCategory = productsData.map((product, index) => {
      let category: mongoose.Types.ObjectId | null = null;
      let subcategory: mongoose.Types.ObjectId | null = null;

      // Assign category based on product index
      if (index < 5) {
        category = womenCategory?._id || null;
        // Find subcategory
        const subcat = womenCategory?.subcategories?.find(
          (s) => s.slug === getSubcategorySlug(index),
        );
        if (subcat) {
          // For now, we'll just use the category as subcategory
          // In real implementation, you might want to create separate subcategory collection
        }
      } else if (index < 7) {
        category = menCategory?._id || null;
      } else {
        category = kidsCategory?._id || null;
      }

      return {
        ...product,
        category,
        subcategory,
      };
    });

    await Product.insertMany(productsWithCategory);

    // Create Blogs
    console.log('📰 Creating Blogs...');
    const blogsWithRefs = blogPostsData.map((blog) => ({
      ...blog,
      category: blogCategory._id,
      user: adminUser?._id,
    }));
    await Blog.insertMany(blogsWithRefs);

    // Create FAQ
    console.log('❓ Creating FAQs...');
    await FAQ.insertMany(faqData);

    // Create Gold Prices
    console.log('💰 Creating Gold Prices...');
    await GoldPrice.insertMany(goldPriceData);

    // Create Announcements
    console.log('📢 Creating Announcements...');
    await Announcement.insertMany(announcementsData);

    console.log('🎉 All data imported successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Categories: ${createdCategories.length}`);
    console.log(`- Products: ${productsData.length}`);
    console.log(`- Blogs: ${blogPostsData.length}`);
    console.log(`- Users: ${createdUsers.length}`);
    console.log(`- FAQs: ${faqData.length}`);
    console.log(`- Gold Prices: ${goldPriceData.length}`);
    console.log(`- Announcements: ${announcementsData.length}`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing data:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

function getSubcategorySlug(index: number): string {
  const slugs = ['necklace', 'bracelet', 'ring', 'earring', 'pendant'];
  return slugs[index % slugs.length];
}

// Run import
importData();

