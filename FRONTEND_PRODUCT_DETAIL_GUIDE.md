# 📄 راهنمای Frontend: صفحات جزئیات محصول (سکه، شمش، جواهر)

تاریخ: دسامبر 2024
وضعیت: ✅ آماده استفاده

---

## 📋 خلاصه تغییرات Backend

Backend با موفقیت بهینه‌سازی شده تا **محصولات مرتبط** (Related Products) بر اساس **نوع محصول** فیلتر شوند:

✅ محصولات مرتبط سکه → فقط سکه‌های دیگر
✅ محصولات مرتبط شمش → فقط شمش‌های دیگر
✅ محصولات مرتبط جواهر → فقط جواهرات دیگر
✅ همه فیلدهای لازم در response موجود است

---

## 🔌 API Endpoint

### دریافت جزئیات محصول

**Endpoint:**

```
GET /product/public/:slug
```

**پارامترها:**

- `slug`: اسلاگ محصول (مثال: `coin-bahar-azadi-full`, `gold-bar-10g`, `classic-gold-necklace-001`)

**ویژگی‌ها:**

- ✅ برای **همه نوع محصولات** کار می‌کند (jewelry, coin, melted_gold)
- ✅ `productType` در response موجود است
- ✅ `goldInfo` برای سکه و شمش موجود است
- ✅ `relatedProducts` فقط از **همان نوع** محصول هستند

---

## 📦 ساختار Response

### برای سکه (Coin)

```json
{
  "_id": "6758xxxxx",
  "name": "سکه نیم بهار آزادی",
  "slug": "coin-bahar-azadi-half",
  "code": "COIN-BA-002",
  "price": 27000000,
  "discountPrice": null,
  "discount": 0,
  "onSale": false,
  "stock": 15,
  "description": "سکه نیم بهار آزادی با وزن 4.06 گرم...",
  "images": ["/images/products/coin.png"],
  "category": { ... },

  "productType": "coin",
  "goldInfo": {
    "weight": 4.06,
    "purity": "900",
    "mintYear": 2024
  },

  "isAvailable": true,
  "isFeatured": false,
  "views": 15,
  "sales": 2,
  "createdAt": "2024-12-01T10:30:00.000Z",
  "updatedAt": "2024-12-01T10:30:00.000Z",

  "relatedProducts": [
    {
      "_id": "...",
      "name": "سکه تمام بهار آزادی",
      "slug": "coin-bahar-azadi-full",
      "images": ["/images/products/qadimtamam.png"],
      "price": 50000000,
      "discountPrice": null,
      "isAvailable": true,
      "productType": "coin"
    },
    {
      "name": "سکه ربع بهار آزادی",
      "slug": "coin-bahar-azadi-quarter",
      "productType": "coin",
      ...
    }
    // ... فقط سکه‌های دیگر (حداکثر 8 محصول)
  ]
}
```

### برای شمش (Melted Gold)

```json
{
  "_id": "6758xxxxx",
  "name": "شمش طلای 10 گرمی",
  "slug": "gold-bar-10g",
  "code": "BAR-10G-001",
  "price": 15000000,
  "productType": "melted_gold",
  "goldInfo": {
    "weight": 10,
    "purity": "999.9",
    "manufacturer": "بانک مرکزی جمهوری اسلامی ایران",
    "certificate": "CB-2024-001234"
  },
  "description": "شمش طلای 10 گرمی با خلوص 999.9...",
  "images": ["/images/products/shemsh.png"],
  "stock": 8,
  "isAvailable": true,

  "relatedProducts": [
    {
      "name": "شمش طلای 20 گرمی",
      "slug": "gold-bar-20g",
      "productType": "melted_gold",
      ...
    },
    {
      "name": "شمش طلای 50 گرمی",
      "productType": "melted_gold",
      ...
    }
    // ... فقط شمش‌های دیگر (حداکثر 8 محصول)
  ]
}
```

### برای جواهر (Jewelry)

```json
{
  "_id": "6758xxxxx",
  "name": "گردنبند طلای کلاسیک",
  "slug": "classic-gold-necklace-001",
  "productType": "jewelry",
  "goldInfo": null,
  "price": 12000000,
  "description": "گردنبند طلای زیبا و با کیفیت...",
  "images": [...],

  "relatedProducts": [
    {
      "name": "دستبند طلا با نگین",
      "productType": "jewelry",
      ...
    }
    // ... فقط جواهرات دیگر (حداکثر 8 محصول)
  ]
}
```

---

## 💻 نحوه استفاده در Frontend

### 1️⃣ تابع دریافت جزئیات محصول

در فایل `src/lib/api/products.ts`:

```typescript
export async function getProductBySlug(slug: string): Promise<ProductDetail> {
  const response = await fetch(`${API_BASE_URL}/product/public/${slug}`);

  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }

  const data = await response.json();
  return data;
}
```

### 2️⃣ Type های TypeScript

در فایل `src/types/product.ts`:

```typescript
export interface GoldInfo {
  weight?: number;
  purity?: string;
  certificate?: string;
  mintYear?: number;
  manufacturer?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  code: string;
  price: number;
  discountPrice?: number | null;
  discount?: number;
  onSale?: boolean;
  stock: number;
  description: string;
  images: string[];
  category: Category;

  productType: 'jewelry' | 'coin' | 'melted_gold';
  goldInfo?: GoldInfo | null;

  isAvailable: boolean;
  isFeatured: boolean;
  views: number;
  sales: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetail extends Product {
  relatedProducts: Product[];
}
```

### 3️⃣ صفحه جزئیات محصول - Conditional Rendering

```typescript
// src/app/product/[slug]/page.tsx

import { getProductBySlug } from "@/lib/api/products";
import CoinDetailView from "@/components/product/CoinDetailView";
import MeltedGoldDetailView from "@/components/product/MeltedGoldDetailView";
import JewelryDetailView from "@/components/product/JewelryDetailView";

interface PageProps {
  params: { slug: string };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const product = await getProductBySlug(params.slug);

  // نمایش بر اساس نوع محصول
  switch (product.productType) {
    case 'coin':
      return <CoinDetailView product={product} />;

    case 'melted_gold':
      return <MeltedGoldDetailView product={product} />;

    case 'jewelry':
    default:
      return <JewelryDetailView product={product} />;
  }
}
```

---

## 🎨 کامپوننت‌های پیشنهادی

### کامپوننت نمایش جزئیات سکه

```typescript
// components/product/CoinDetailView.tsx

import { ProductDetail } from "@/types/product";
import GoldInfoCard from "@/components/GoldInfoCard";
import RelatedProducts from "@/components/RelatedProducts";

interface Props {
  product: ProductDetail;
}

export default function CoinDetailView({ product }: Props) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* تصاویر سکه */}
        <div className="product-images">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full rounded-lg shadow-lg"
          />
        </div>

        {/* اطلاعات سکه */}
        <div className="product-info">
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

          <div className="price-section mb-6">
            <p className="text-2xl font-bold text-amber-600">
              {product.price.toLocaleString('fa-IR')} تومان
            </p>
          </div>

          {/* اطلاعات تخصصی سکه */}
          {product.goldInfo && (
            <GoldInfoCard
              goldInfo={product.goldInfo}
              productType="coin"
            />
          )}

          {/* دکمه خرید */}
          <button className="btn-primary w-full mt-6">
            افزودن به سبد خرید
          </button>
        </div>
      </div>

      {/* توضیحات */}
      <div className="description mt-12">
        <h2 className="text-2xl font-bold mb-4">توضیحات</h2>
        <div className="prose max-w-none whitespace-pre-line">
          {product.description}
        </div>
      </div>

      {/* سکه‌های مرتبط */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">سکه‌های مشابه</h2>
        <RelatedProducts products={product.relatedProducts} />
      </div>
    </div>
  );
}
```

### کامپوننت نمایش جزئیات شمش

```typescript
// components/product/MeltedGoldDetailView.tsx

import { ProductDetail } from "@/types/product";
import GoldInfoCard from "@/components/GoldInfoCard";

export default function MeltedGoldDetailView({ product }: Props) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* تصویر شمش */}
        <div className="product-images">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full rounded-lg shadow-lg"
          />
        </div>

        {/* اطلاعات شمش */}
        <div className="product-info">
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

          <div className="price-section mb-6">
            <p className="text-2xl font-bold text-amber-600">
              {product.price.toLocaleString('fa-IR')} تومان
            </p>
          </div>

          {/* اطلاعات تخصصی شمش */}
          {product.goldInfo && (
            <GoldInfoCard
              goldInfo={product.goldInfo}
              productType="melted_gold"
            />
          )}

          {/* نمایش گواهی */}
          {product.goldInfo?.certificate && (
            <div className="certificate bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-gray-600">شماره گواهی:</p>
              <p className="font-mono font-bold text-green-700">
                {product.goldInfo.certificate}
              </p>
            </div>
          )}

          {/* دکمه خرید */}
          <button className="btn-primary w-full mt-6">
            افزودن به سبد خرید
          </button>
        </div>
      </div>

      {/* توضیحات */}
      <div className="description mt-12">
        <h2 className="text-2xl font-bold mb-4">توضیحات</h2>
        <div className="prose max-w-none whitespace-pre-line">
          {product.description}
        </div>
      </div>

      {/* شمش‌های مرتبط */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">شمش‌های مشابه</h2>
        <RelatedProducts products={product.relatedProducts} />
      </div>
    </div>
  );
}
```

### کامپوننت نمایش جزئیات جواهر (پیش‌فرض)

```typescript
// components/product/JewelryDetailView.tsx

export default function JewelryDetailView({ product }: Props) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Layout استاندارد محصولات جواهر */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* تصاویر */}
        <div className="product-images">
          <img src={product.images[0]} alt={product.name} />
        </div>

        {/* اطلاعات محصول */}
        <div className="product-info">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-2xl text-amber-600 mt-4">
            {product.price.toLocaleString('fa-IR')} تومان
          </p>

          {/* مشخصات جواهر */}
          <div className="specs mt-6">
            {/* وزن، عیار، جنس و... */}
          </div>

          <button className="btn-primary w-full mt-6">
            افزودن به سبد خرید
          </button>
        </div>
      </div>

      {/* محصولات مرتبط */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">محصولات مشابه</h2>
        <RelatedProducts products={product.relatedProducts} />
      </div>
    </div>
  );
}
```

### کامپوننت نمایش محصولات مرتبط

```typescript
// components/RelatedProducts.tsx

import { Product } from "@/types/product";
import Link from "next/link";

interface Props {
  products: Product[];
}

export default function RelatedProducts({ products }: Props) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products.map((product) => (
        <Link
          key={product._id}
          href={`/product/${product.slug}`}
          className="product-card"
        >
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full aspect-square object-cover rounded-lg"
          />
          <h3 className="mt-2 font-medium text-sm">{product.name}</h3>
          <p className="text-amber-600 font-bold">
            {product.price.toLocaleString('fa-IR')} تومان
          </p>
        </Link>
      ))}
    </div>
  );
}
```

---

## 🎯 نکات مهم

### 1. همه محصولات از یک endpoint استفاده می‌کنند

✅ **مزایا:**

- URL های ساده: `/product/coin-bahar-azadi-full`
- کد Backend ساده‌تر و کمتر تکراری
- SEO بهتر - همه در یک مسیر `/product/`

### 2. محصولات مرتبط خودکار فیلتر می‌شوند

- برای سکه → فقط سکه‌های دیگر
- برای شمش → فقط شمش‌های دیگر
- برای جواهر → فقط جواهرات دیگر

### 3. نمایش بر اساس `productType`

Frontend با بررسی `product.productType` تصمیم می‌گیرد:

- چه Layout ای استفاده کند
- چه اطلاعاتی نمایش دهد
- چه کامپوننت‌هایی render کند

### 4. فیلد `goldInfo` اختیاری است

```typescript
// همیشه چک کنید که goldInfo موجود است
{product.goldInfo && (
  <GoldInfoCard goldInfo={product.goldInfo} />
)}
```

---

## 📊 مثال‌های Request/Response

### دریافت جزئیات سکه

**Request:**

```bash
GET /product/public/coin-bahar-azadi-full
```

**Response:**

```json
{
  "name": "سکه تمام بهار آزادی",
  "productType": "coin",
  "goldInfo": {
    "weight": 8.13,
    "purity": "900",
    "mintYear": 2024
  },
  "relatedProducts": [
    {
      "name": "سکه نیم بهار آزادی",
      "productType": "coin",
      ...
    }
  ]
}
```

### دریافت جزئیات شمش

**Request:**

```bash
GET /product/public/gold-bar-10g
```

**Response:**

```json
{
  "name": "شمش طلای 10 گرمی",
  "productType": "melted_gold",
  "goldInfo": {
    "weight": 10,
    "purity": "999.9",
    "manufacturer": "بانک مرکزی",
    "certificate": "CB-2024-001234"
  },
  "relatedProducts": [
    {
      "name": "شمش طلای 20 گرمی",
      "productType": "melted_gold",
      ...
    }
  ]
}
```

---

## ✅ چک‌لیست پیاده‌سازی Frontend

- [ ] به‌روزرسانی `getProductBySlug` در `src/lib/api/products.ts`
- [ ] افزودن `ProductDetail` interface به type ها
- [ ] ایجاد `CoinDetailView` component
- [ ] ایجاد `MeltedGoldDetailView` component
- [ ] ایجاد `JewelryDetailView` component
- [ ] ایجاد `RelatedProducts` component
- [ ] پیاده‌سازی conditional rendering در صفحه `/product/[slug]`
- [ ] تست نمایش سکه
- [ ] تست نمایش شمش
- [ ] تست نمایش جواهر
- [ ] بررسی محصولات مرتبط
- [ ] تست responsive در موبایل

---

## 🐛 رفع مشکلات احتمالی

### مشکل: goldInfo وجود ندارد

```typescript
// ✅ درست - همیشه چک کنید
{product.goldInfo?.weight && (
  <p>وزن: {product.goldInfo.weight} گرم</p>
)}

// ❌ غلط - ممکن است error دهد
<p>وزن: {product.goldInfo.weight} گرم</p>
```

### مشکل: relatedProducts خالی است

```typescript
// چک کنید که آرایه خالی نیست
{product.relatedProducts?.length > 0 && (
  <RelatedProducts products={product.relatedProducts} />
)}
```

### مشکل: Type Error در productType

```typescript
// مطمئن شوید که type درست تعریف شده:
productType: 'jewelry' | 'coin' | 'melted_gold';

// نه:
productType: string; // ❌
```

---

## 🎨 استایل‌های پیشنهادی

```css
/* محصولات مرتبط */
.related-products {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}

/* کارت محصول */
.product-card {
  @apply bg-white rounded-lg shadow hover:shadow-lg transition;
  @apply p-4;
}

/* اطلاعات طلا */
.gold-info {
  @apply bg-amber-50 border border-amber-200 rounded-lg p-4;
}

/* گواهی */
.certificate {
  @apply bg-green-50 border border-green-200 rounded-lg p-4;
  @apply font-mono;
}
```

---

**موفق باشید! 🎉**

تمام تغییرات Backend انجام شده و آماده استفاده در Frontend است.
