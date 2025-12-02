# 📊 راهنمای Frontend: دسته‌بندی سرمایه‌گذاری طلا

تاریخ: دسامبر 2024
وضعیت: ✅ پیاده‌سازی شده

---

## 📋 خلاصه تغییرات Backend

یک دسته‌بندی جدید **gender-neutral** برای سکه و شمش طلا ایجاد شده است:

✅ دسته‌بندی جدید: **"سرمایه‌گذاری طلا"** (`gold-investment`)
✅ همه سکه‌ها (5 محصول) به این دسته منتقل شدند
✅ همه شمش‌ها (5 محصول) به این دسته منتقل شدند
✅ این دسته‌بندی جنسیت ندارد (نه زنانه، نه مردانه، نه کودکانه)

---

## 🎯 چرا این تغییر انجام شد؟

### ❌ مشکل قبلی:
- سکه‌ها و شمش‌ها در دسته‌بندی **"زنانه"** قرار داشتند
- این منطقی نبود چون سکه و شمش جنسیت ندارند
- برای سرمایه‌گذاری هستند، نه زیور آلات

### ✅ راه حل:
- دسته‌بندی مخصوص **"سرمایه‌گذاری طلا"** ایجاد شد
- همه سکه‌ها و شمش‌ها به این دسته منتقل شدند
- حالا می‌توانید این دسته را جداگانه در navbar/menu نمایش دهید

---

## 📦 اطلاعات دسته‌بندی جدید

```json
{
  "_id": "692de8220a0685e48ac1da30",
  "name": "سرمایه‌گذاری طلا",
  "slug": "gold-investment",
  "description": "سکه و شمش طلا برای سرمایه‌گذاری",
  "heroImage": "/images/categories/investment.jpg",
  "order": 100,
  "isActive": true
}
```

---

## 🔌 تغییرات در API

### هیچ تغییری در endpoint ها لازم نیست! ✅

همه API ها همان‌طور که بودند کار می‌کنند. فقط `category` محصولات تغییر کرده است.

### مثال‌ها:

**1. دریافت لیست سکه‌ها:**
```bash
GET /product/public?productType=coin
```

**Response:**
```json
{
  "data": [
    {
      "name": "سکه تمام بهار آزادی",
      "productType": "coin",
      "category": {
        "name": "سرمایه‌گذاری طلا",
        "slug": "gold-investment"
      }
    }
  ]
}
```

**2. دریافت جزئیات سکه:**
```bash
GET /product/public/coin-bahar-azadi-full
```

**Response:**
```json
{
  "name": "سکه تمام بهار آزادی",
  "productType": "coin",
  "category": {
    "_id": "692de8220a0685e48ac1da30",
    "name": "سرمایه‌گذاری طلا",
    "slug": "gold-investment"
  },
  "goldInfo": { ... },
  "relatedProducts": [ ... ]
}
```

---

## 💻 تغییرات Frontend

### 1️⃣ نمایش دسته‌بندی در Navbar/Menu

اکنون می‌توانید دسته‌بندی "سرمایه‌گذاری طلا" را جداگانه نمایش دهید:

```typescript
// components/Navbar.tsx

const categories = [
  { name: 'زنانه', slug: 'women' },
  { name: 'مردانه', slug: 'men' },
  { name: 'کودکانه', slug: 'kids' },
  { name: 'سرمایه‌گذاری طلا', slug: 'gold-investment' }, // ✨ جدید
];

<nav>
  {categories.map(cat => (
    <Link 
      key={cat.slug} 
      href={`/category/${cat.slug}`}
    >
      {cat.name}
    </Link>
  ))}
  
  {/* یا لینک‌های مستقیم */}
  <Link href="/coin">سکه طلا</Link>
  <Link href="/melted-gold">شمش طلا</Link>
</nav>
```

### 2️⃣ نمایش برچسب دسته‌بندی در کارت محصول

```typescript
// components/ProductCard.tsx

export default function ProductCard({ product }) {
  return (
    <div className="product-card">
      <img src={product.images[0]} alt={product.name} />
      
      <h3>{product.name}</h3>
      
      {/* نمایش دسته‌بندی */}
      <span className="category-badge">
        {product.category?.name}
      </span>
      
      <p className="price">{product.price.toLocaleString('fa-IR')} تومان</p>
    </div>
  );
}
```

### 3️⃣ صفحه دسته‌بندی سرمایه‌گذاری (اختیاری)

می‌توانید یک صفحه برای نمایش همه محصولات سرمایه‌گذاری ایجاد کنید:

```typescript
// src/app/category/gold-investment/page.tsx

import { getProducts } from "@/lib/api/products";

export default async function GoldInvestmentPage() {
  // دریافت همه محصولات دسته‌بندی سرمایه‌گذاری
  const products = await getProducts({ 
    category: 'gold-investment',
    limit: 20 
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">سرمایه‌گذاری طلا</h1>
      
      <p className="text-gray-600 mb-8">
        سکه و شمش طلا برای سرمایه‌گذاری
      </p>

      {/* تب‌ها برای سکه و شمش */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">همه</TabsTrigger>
          <TabsTrigger value="coin">سکه طلا</TabsTrigger>
          <TabsTrigger value="melted_gold">شمش طلا</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <ProductGrid products={products} />
        </TabsContent>
        
        <TabsContent value="coin">
          <ProductGrid 
            products={products.filter(p => p.productType === 'coin')} 
          />
        </TabsContent>
        
        <TabsContent value="melted_gold">
          <ProductGrid 
            products={products.filter(p => p.productType === 'melted_gold')} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 4️⃣ یا به صورت جداگانه

```typescript
// src/app/coin/page.tsx

import { getProducts } from "@/lib/api/products";

export default async function CoinPage() {
  const coins = await getProducts({ 
    productType: 'coin',
    // category: 'gold-investment', // اختیاری - همیشه gold-investment است
    limit: 20 
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">سکه طلا</h1>
      <p className="text-gray-600 mb-8">
        دسته‌بندی: سرمایه‌گذاری طلا
      </p>
      
      <ProductGrid products={coins} />
    </div>
  );
}
```

---

## 🎨 استایل‌های پیشنهادی

### برچسب دسته‌بندی

```css
/* برچسب سرمایه‌گذاری */
.category-badge.investment {
  @apply bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm;
}

/* برچسب عمومی */
.category-badge {
  @apply inline-flex items-center px-3 py-1 rounded-full text-sm font-medium;
}
```

**استفاده:**

```typescript
<span 
  className={`category-badge ${
    product.category?.slug === 'gold-investment' 
      ? 'investment' 
      : ''
  }`}
>
  {product.category?.name}
</span>
```

---

## 🗂️ ساختار منوی پیشنهادی

```typescript
// Navbar یا Sidebar

const menuStructure = {
  categories: [
    {
      name: 'جواهرات',
      children: [
        { name: 'زنانه', slug: 'women' },
        { name: 'مردانه', slug: 'men' },
        { name: 'کودکانه', slug: 'kids' },
      ]
    },
    {
      name: 'سرمایه‌گذاری',
      icon: '💰',
      children: [
        { name: 'سکه طلا', href: '/coin', icon: '🪙' },
        { name: 'شمش طلا', href: '/melted-gold', icon: '📊' },
      ]
    }
  ]
};
```

**Render:**

```typescript
<nav>
  {menuStructure.categories.map(category => (
    <div key={category.name} className="menu-section">
      <h3>{category.icon} {category.name}</h3>
      <ul>
        {category.children.map(item => (
          <li key={item.slug || item.href}>
            <Link href={item.href || `/category/${item.slug}`}>
              {item.icon} {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  ))}
</nav>
```

---

## 📊 Breadcrumb پیشنهادی

```typescript
// components/Breadcrumb.tsx

export default function Breadcrumb({ product }) {
  return (
    <nav className="breadcrumb">
      <Link href="/">خانه</Link>
      <span>/</span>
      
      {product.category && (
        <>
          <Link href={`/category/${product.category.slug}`}>
            {product.category.name}
          </Link>
          <span>/</span>
        </>
      )}
      
      {/* نمایش نوع محصول */}
      {product.productType === 'coin' && (
        <>
          <Link href="/coin">سکه طلا</Link>
          <span>/</span>
        </>
      )}
      
      {product.productType === 'melted_gold' && (
        <>
          <Link href="/melted-gold">شمش طلا</Link>
          <span>/</span>
        </>
      )}
      
      <span className="current">{product.name}</span>
    </nav>
  );
}
```

**مثال خروجی:**

```
خانه / سرمایه‌گذاری طلا / سکه طلا / سکه تمام بهار آزادی
```

---

## 🖼️ تصویر Hero دسته‌بندی (اختیاری)

دسته‌بندی جدید از تصویر `/images/categories/investment.jpg` استفاده می‌کند.

اگر این تصویر وجود ندارد، می‌توانید:

1. **یک تصویر مناسب اضافه کنید:**
   - تصویری از سکه‌ها و شمش‌های طلا
   - ابعاد پیشنهادی: 1920x600 پیکسل

2. **یا از تصویر پیش‌فرض استفاده کنید:**

```typescript
<img 
  src={category.heroImage || '/images/default-category.jpg'} 
  alt={category.name}
/>
```

---

## ✅ چک‌لیست پیاده‌سازی Frontend

- [ ] اضافه کردن "سرمایه‌گذاری طلا" به navbar/menu
- [ ] نمایش برچسب دسته‌بندی در کارت محصولات
- [ ] ایجاد صفحه `/category/gold-investment` (اختیاری)
- [ ] به‌روزرسانی breadcrumb برای نمایش دسته‌بندی
- [ ] اضافه کردن آیکون‌های مناسب (🪙 💰 📊)
- [ ] اضافه کردن تصویر hero برای دسته‌بندی
- [ ] تست نمایش در موبایل
- [ ] بررسی SEO (meta tags, structured data)

---

## 📱 نمایش در موبایل

برای منوی موبایل، می‌توانید:

```typescript
// Mobile Menu

<MobileMenu>
  <MenuItem href="/">خانه</MenuItem>
  
  <MenuSection title="جواهرات">
    <MenuItem href="/category/women">زنانه</MenuItem>
    <MenuItem href="/category/men">مردانه</MenuItem>
    <MenuItem href="/category/kids">کودکانه</MenuItem>
  </MenuSection>
  
  <MenuSection title="💰 سرمایه‌گذاری" highlighted>
    <MenuItem href="/coin" icon="🪙">سکه طلا</MenuItem>
    <MenuItem href="/melted-gold" icon="📊">شمش طلا</MenuItem>
  </MenuSection>
</MobileMenu>
```

---

## 🎯 نکات مهم

### 1. دسته‌بندی همیشه موجود است

```typescript
// همه سکه‌ها و شمش‌ها category دارند
{product.category && (
  <span>{product.category.name}</span>
)}
```

### 2. فیلتر بر اساس دسته‌بندی

```typescript
// دریافت همه محصولات سرمایه‌گذاری (سکه + شمش)
const products = await getProducts({ 
  category: 'gold-investment' 
});

// دریافت فقط سکه‌ها
const coins = await getProducts({ 
  category: 'gold-investment',
  productType: 'coin'
});
```

### 3. Related Products همچنان فیلتر می‌شوند

محصولات مرتبط بر اساس `productType` فیلتر می‌شوند، نه `category`:
- برای سکه → فقط سکه‌های دیگر
- برای شمش → فقط شمش‌های دیگر

---

## 🔍 SEO

برای بهبود SEO:

```typescript
// src/app/category/gold-investment/page.tsx

export const metadata = {
  title: 'سرمایه‌گذاری طلا - سکه و شمش طلا',
  description: 'خرید سکه و شمش طلا برای سرمایه‌گذاری. قیمت روز سکه بهار آزادی، سکه امامی و شمش طلا',
  keywords: 'سکه طلا, شمش طلا, سرمایه گذاری طلا, قیمت سکه',
};
```

---

## 🐛 رفع مشکلات احتمالی

### مشکل: category.slug null است

```typescript
// ✅ درست - همیشه چک کنید
<Link href={`/category/${product.category?.slug || 'gold-investment'}`}>
  {product.category?.name}
</Link>

// یا
{product.category?.slug && (
  <Link href={`/category/${product.category.slug}`}>
    {product.category.name}
  </Link>
)}
```

---

## 📊 خلاصه تغییرات

| قبل | بعد |
|-----|-----|
| سکه‌ها در دسته "زنانه" ❌ | سکه‌ها در دسته "سرمایه‌گذاری طلا" ✅ |
| شمش‌ها در دسته "زنانه" ❌ | شمش‌ها در دسته "سرمایه‌گذاری طلا" ✅ |
| جنسیت نامناسب ❌ | Gender-neutral ✅ |
| نمایش در منوی زنانه ❌ | منوی جداگانه سرمایه‌گذاری ✅ |

---

**موفق باشید! 🎉**

همه تغییرات Backend انجام شده و آماده نمایش در Frontend است.

