# 🪙 مستندات API برای صفحات سکه و شمش طلا - Frontend

تاریخ: دسامبر 2024
وضعیت: ✅ آماده استفاده

---

## 📋 خلاصه تغییرات Backend

Backend با موفقیت برای پشتیبانی از دو صفحه جدید **سکه طلا** و **شمش طلا** آماده شده است:

✅ فیلد `productType` به Product Schema اضافه شد
✅ فیلد `goldInfo` برای اطلاعات تخصصی اضافه شد
✅ API فیلترینگ بر اساس `productType` پشتیبانی می‌کند
✅ 5 محصول سکه و 5 محصول شمش طلا به دیتابیس اضافه شد
✅ همه محصولات قدیمی به `productType: "jewelry"` تبدیل شدند

---

## 🔌 API Endpoints

### 1️⃣ دریافت لیست محصولات با فیلتر نوع محصول

**Endpoint:**

```
GET /product/public
```

**⚠️ رفتار پیش‌فرض:** اگر `productType` ارسال نشود، به صورت پیش‌فرض فقط **محصولات jewelry** برگردانده می‌شوند. برای دریافت سکه یا شمش، باید صریحاً `productType` را مشخص کنید.

**پارامترهای جدید:**
| پارامتر | نوع | مقادیر مجاز | توضیحات |
|---------|-----|------------|---------|
| `productType` | string | `jewelry`, `coin`, `melted_gold` | نوع محصول (پیش‌فرض: `jewelry`) |

**پارامترهای قبلی (همچنان کار می‌کنند):**

- `page`: شماره صفحه (پیش‌فرض: 1)
- `limit`: تعداد محصولات در هر صفحه (پیش‌فرض: 18)
- `sortBy`: مرتب‌سازی - `newest`, `price-asc`, `price-desc`, `popular`
- `category`: اسلاگ دسته‌بندی
- `subcategory`: اسلاگ زیردسته
- `onSale`: فیلتر تخفیف‌دار - `true` یا `false`
- `lowCommission`: فیلتر اجرت کم - `true` یا `false`
- و سایر فیلترها...

**مثال‌های استفاده:**

```bash
# دریافت جواهرات (پیش‌فرض - بدون نیاز به productType)
GET /product/public?limit=20

# دریافت جواهرات (صریح)
GET /product/public?productType=jewelry&limit=20

# دریافت سکه‌های طلا (نیاز به productType)
GET /product/public?productType=coin&limit=20

# دریافت شمش‌های طلا (نیاز به productType)
GET /product/public?productType=melted_gold&limit=20

# ترکیب با فیلترهای دیگر
GET /product/public?productType=coin&sortBy=price-asc&limit=10
```

---

## 📦 ساختار داده‌های جدید

### فیلد `productType`

همه محصولات حالا دارای فیلد `productType` هستند:

```typescript
type ProductType = 'jewelry' | 'coin' | 'melted_gold';
```

- `jewelry`: جواهرات و محصولات عادی طلا
- `coin`: سکه‌های طلا
- `melted_gold`: شمش طلا (طلای آب شده)

### فیلد `goldInfo` (اختیاری)

برای محصولات از نوع `coin` و `melted_gold`:

```typescript
interface GoldInfo {
  weight?: number; // وزن به گرم (مثال: 8.13)
  purity?: string; // خلوص (مثال: "900" یا "999.9")
  certificate?: string; // شماره گواهی (مثال: "CB-2024-001234")
  mintYear?: number; // سال ضرب - فقط برای سکه (مثال: 2024)
  manufacturer?: string; // تولید کننده - فقط برای شمش (مثال: "بانک مرکزی")
}
```

---

## 💻 نحوه استفاده در Frontend

### 1️⃣ به‌روزرسانی تابع `getProducts`

در فایل `src/lib/api/products.ts`:

```typescript
export async function getProducts(params?: {
  category?: string;
  subcategory?: string;
  onSale?: boolean;
  lowCommission?: boolean;
  sortBy?: string;
  limit?: number;
  page?: number;
  productType?: 'jewelry' | 'coin' | 'melted_gold'; // ✨ جدید
}): Promise<Product[]> {
  const queryParams = new URLSearchParams();

  if (params?.category) queryParams.append('category', params.category);
  if (params?.subcategory)
    queryParams.append('subcategory', params.subcategory);
  if (params?.onSale) queryParams.append('onSale', 'true');
  if (params?.lowCommission) queryParams.append('lowCommission', 'true');
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.page) queryParams.append('page', params.page.toString());

  // ✨ جدید
  if (params?.productType)
    queryParams.append('productType', params.productType);

  const response = await fetch(
    `${API_BASE_URL}/product/public?${queryParams.toString()}`,
  );

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  const data = await response.json();
  return data.data || [];
}
```

### 2️⃣ به‌روزرسانی Type های Product

در فایل `src/types/product.ts` (یا فایل مربوطه):

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
  subcategory?: Subcategory;

  // ✨ جدید
  productType: 'jewelry' | 'coin' | 'melted_gold';
  goldInfo?: GoldInfo;

  // سایر فیلدها...
  isAvailable: boolean;
  isFeatured: boolean;
  isBestSelling: boolean;
  isNewArrival: boolean;
  views: number;
  sales: number;
  createdAt: string;
  updatedAt: string;
}
```

### 3️⃣ استفاده در صفحه سکه (`/coin`)

در فایل `src/app/coin/page.tsx`:

```typescript
import { getProducts } from "@/lib/api/products";
import ProductGrid from "@/components/ProductGrid";

export default async function CoinPage() {
  // دریافت سکه‌های طلا
  const coins = await getProducts({
    productType: 'coin',
    limit: 20,
    sortBy: 'newest'
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">سکه طلا</h1>

      <ProductGrid products={coins} />

      {/* نمایش اطلاعات تخصصی سکه */}
      {coins.map(coin => (
        <div key={coin._id} className="product-card">
          <h3>{coin.name}</h3>
          <p>قیمت: {coin.price.toLocaleString('fa-IR')} تومان</p>

          {/* ✨ اطلاعات تخصصی سکه */}
          {coin.goldInfo && (
            <div className="gold-info">
              <p>وزن: {coin.goldInfo.weight} گرم</p>
              <p>خلوص: {coin.goldInfo.purity}</p>
              {coin.goldInfo.mintYear && (
                <p>سال ضرب: {coin.goldInfo.mintYear}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 4️⃣ استفاده در صفحه شمش (`/melted-gold`)

در فایل `src/app/melted-gold/page.tsx`:

```typescript
import { getProducts } from "@/lib/api/products";
import ProductGrid from "@/components/ProductGrid";

export default async function MeltedGoldPage() {
  // دریافت شمش‌های طلا
  const goldBars = await getProducts({
    productType: 'melted_gold',
    limit: 20,
    sortBy: 'price-asc' // از ارزان به گران
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">شمش طلا (طلای آب شده)</h1>

      <ProductGrid products={goldBars} />

      {/* نمایش اطلاعات تخصصی شمش */}
      {goldBars.map(bar => (
        <div key={bar._id} className="product-card">
          <h3>{bar.name}</h3>
          <p>قیمت: {bar.price.toLocaleString('fa-IR')} تومان</p>

          {/* ✨ اطلاعات تخصصی شمش */}
          {bar.goldInfo && (
            <div className="gold-info">
              <p>وزن: {bar.goldInfo.weight} گرم</p>
              <p>خلوص: {bar.goldInfo.purity}</p>
              {bar.goldInfo.manufacturer && (
                <p>تولید کننده: {bar.goldInfo.manufacturer}</p>
              )}
              {bar.goldInfo.certificate && (
                <p>شماره گواهی: {bar.goldInfo.certificate}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 📊 نمونه Response ها

### دریافت سکه‌ها

**Request:**

```bash
GET /product/public?productType=coin&limit=3
```

**Response:**

```json
{
  "data": [
    {
      "_id": "6758xxxxx",
      "name": "سکه تمام بهار آزادی",
      "slug": "coin-bahar-azadi-full",
      "code": "COIN-BA-001",
      "price": 50000000,
      "discountPrice": null,
      "discount": 0,
      "onSale": false,
      "stock": 10,
      "productType": "coin",
      "goldInfo": {
        "weight": 8.13,
        "purity": "900",
        "mintYear": 2024
      },
      "description": "سکه تمام بهار آزادی با خلوص 900، یکی از معتبرترین سکه‌های طلای ایران است...",
      "images": ["/images/products/qadimtamam.png"],
      "isAvailable": true,
      "isFeatured": true,
      "views": 0,
      "sales": 0
    },
    {
      "_id": "6758xxxxx",
      "name": "سکه نیم بهار آزادی",
      "slug": "coin-bahar-azadi-half",
      "code": "COIN-BA-002",
      "price": 27000000,
      "productType": "coin",
      "goldInfo": {
        "weight": 4.06,
        "purity": "900",
        "mintYear": 2024
      },
      "description": "سکه نیم بهار آزادی با وزن 4.06 گرم...",
      "images": ["/images/products/coin.png"],
      "isAvailable": true,
      "isFeatured": false
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 3,
    "totalPages": 2
  }
}
```

### دریافت شمش‌ها

**Request:**

```bash
GET /product/public?productType=melted_gold&limit=2
```

**Response:**

```json
{
  "data": [
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
      "isAvailable": true,
      "isFeatured": true,
      "stock": 8
    },
    {
      "_id": "6758xxxxx",
      "name": "شمش طلای 20 گرمی",
      "slug": "gold-bar-20g",
      "code": "BAR-20G-001",
      "price": 30000000,
      "productType": "melted_gold",
      "goldInfo": {
        "weight": 20,
        "purity": "999.9",
        "manufacturer": "بانک مرکزی جمهوری اسلامی ایران",
        "certificate": "CB-2024-002345"
      },
      "description": "شمش طلای 20 گرمی با خلوص 999.9...",
      "images": ["/images/products/shemsh.png"],
      "isAvailable": true,
      "stock": 6
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 2,
    "totalPages": 3
  }
}
```

### دریافت یک محصول خاص

**Request:**

```bash
GET /product/public/coin-bahar-azadi-full
```

**Response:**

```json
{
  "_id": "6758xxxxx",
  "name": "سکه تمام بهار آزادی",
  "slug": "coin-bahar-azadi-full",
  "code": "COIN-BA-001",
  "price": 50000000,
  "discountPrice": null,
  "discount": 0,
  "onSale": false,
  "stock": 10,
  "productType": "coin",
  "goldInfo": {
    "weight": 8.13,
    "purity": "900",
    "mintYear": 2024
  },
  "description": "سکه تمام بهار آزادی با خلوص 900، یکی از معتبرترین سکه‌های طلای ایران است.\nاین سکه با وزن 8.13 گرم و عیار 22 کارات، گزینه‌ای مناسب برای سرمایه‌گذاری است.\n...",
  "images": ["/images/products/qadimtamam.png"],
  "category": { ... },
  "isAvailable": true,
  "isFeatured": true,
  "isBestSelling": false,
  "isNewArrival": false,
  "views": 15,
  "sales": 2,
  "createdAt": "2024-12-01T10:30:00.000Z",
  "updatedAt": "2024-12-01T10:30:00.000Z",
  "relatedProducts": [ ... ]
}
```

---

## 🎨 کامپوننت پیشنهادی برای نمایش اطلاعات تخصصی

```typescript
// components/GoldInfoCard.tsx

import { GoldInfo } from "@/types/product";

interface GoldInfoCardProps {
  goldInfo: GoldInfo;
  productType: 'coin' | 'melted_gold';
}

export default function GoldInfoCard({ goldInfo, productType }: GoldInfoCardProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
      <h3 className="text-lg font-semibold text-amber-900 mb-3">
        {productType === 'coin' ? '🪙 مشخصات سکه' : '📊 مشخصات شمش'}
      </h3>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {goldInfo.weight && (
          <div>
            <span className="text-gray-600">وزن:</span>
            <span className="font-medium mr-2">{goldInfo.weight} گرم</span>
          </div>
        )}

        {goldInfo.purity && (
          <div>
            <span className="text-gray-600">خلوص:</span>
            <span className="font-medium mr-2">{goldInfo.purity}</span>
          </div>
        )}

        {goldInfo.mintYear && (
          <div>
            <span className="text-gray-600">سال ضرب:</span>
            <span className="font-medium mr-2">{goldInfo.mintYear}</span>
          </div>
        )}

        {goldInfo.manufacturer && (
          <div className="col-span-2">
            <span className="text-gray-600">تولید کننده:</span>
            <span className="font-medium mr-2">{goldInfo.manufacturer}</span>
          </div>
        )}

        {goldInfo.certificate && (
          <div className="col-span-2">
            <span className="text-gray-600">شماره گواهی:</span>
            <span className="font-medium mr-2 font-mono">{goldInfo.certificate}</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

**استفاده:**

```typescript
import GoldInfoCard from "@/components/GoldInfoCard";

{product.goldInfo && (
  <GoldInfoCard
    goldInfo={product.goldInfo}
    productType={product.productType as 'coin' | 'melted_gold'}
  />
)}
```

---

## 📋 لیست محصولات موجود

### سکه‌های طلا (5 عدد)

| نام                 | اسلاگ                      | وزن   | خلوص | قیمت  |
| ------------------- | -------------------------- | ----- | ---- | ----- |
| سکه تمام بهار آزادی | `coin-bahar-azadi-full`    | 8.13g | 900  | 50M   |
| سکه نیم بهار آزادی  | `coin-bahar-azadi-half`    | 4.06g | 900  | 27M   |
| سکه ربع بهار آزادی  | `coin-bahar-azadi-quarter` | 2.03g | 900  | 14.5M |
| سکه گرمی بهار آزادی | `coin-bahar-azadi-gerami`  | 1g    | 900  | 8M    |
| سکه امامی (پهلوی)   | `coin-emami-pahlavi`       | 8.13g | 900  | 48M   |

### شمش‌های طلا (5 عدد)

| نام               | اسلاگ           | وزن  | خلوص  | قیمت |
| ----------------- | --------------- | ---- | ----- | ---- |
| شمش طلای 10 گرمی  | `gold-bar-10g`  | 10g  | 999.9 | 15M  |
| شمش طلای 20 گرمی  | `gold-bar-20g`  | 20g  | 999.9 | 30M  |
| شمش طلای 50 گرمی  | `gold-bar-50g`  | 50g  | 999.9 | 75M  |
| شمش طلای 100 گرمی | `gold-bar-100g` | 100g | 999.9 | 150M |
| شمش طلای 250 گرمی | `gold-bar-250g` | 250g | 999.9 | 375M |

---

## ✅ چک‌لیست پیاده‌سازی Frontend

- [ ] به‌روزرسانی تابع `getProducts` در `src/lib/api/products.ts`
- [ ] افزودن `productType` و `goldInfo` به type های Product
- [ ] ایجاد صفحه `/coin` - `src/app/coin/page.tsx`
- [ ] ایجاد صفحه `/melted-gold` - `src/app/melted-gold/page.tsx`
- [ ] ایجاد کامپوننت `GoldInfoCard` برای نمایش اطلاعات تخصصی
- [ ] افزودن لینک به صفحات جدید در Navbar
- [ ] تست صفحه سکه
- [ ] تست صفحه شمش
- [ ] بررسی نمایش صحیح در موبایل

---

## 🚀 نکات مهم

1. **⚠️ رفتار پیش‌فرض تغییر کرده:** بدون ارسال `productType`, فقط محصولات `jewelry` برگردانده می‌شوند. این تضمین می‌کند که سکه و شمش فقط در صفحات مخصوص خود نمایش داده شوند.

2. **همه API های قبلی بدون تغییر کار می‌کنند** - چون پیش‌فرض `jewelry` است، صفحات محصولات عادی تغییری نمی‌کنند

3. **محصولات قدیمی** به صورت خودکار `productType: "jewelry"` دارند

4. **فیلد `goldInfo`** فقط برای `coin` و `melted_gold` پر شده است و برای `jewelry` مقدار `null` دارد

5. **تصاویر** در مسیرهای زیر قرار دارند:
   - `/images/products/coin.png` - آیکون سکه
   - `/images/products/qadimtamam.png` - Hero سکه
   - `/images/products/shemsh.png` - تصویر شمش

6. **Pagination** همچنان کار می‌کند - می‌توانید `page` و `limit` را ترکیب کنید با `productType`

7. **⚠️ مهم: جداسازی محصولات**
   - برای صفحات محصولات عادی (صفحه اصلی، دسته‌بندی‌ها و...) **حتماً** `productType: 'jewelry'` را اضافه کنید
   - در غیر این صورت سکه و شمش هم در لیست محصولات عادی نمایش داده می‌شوند
   - هر صفحه فقط باید محصولات مربوط به خودش را نمایش دهد

---

## 🐛 رفع مشکلات احتمالی

### مشکل: محصولات برگردانده نمی‌شوند

```typescript
// ✅ درست
const coins = await getProducts({ productType: 'coin' });

// ❌ غلط - املای اشتباه
const coins = await getProducts({ productType: 'coins' });
```

### مشکل: `goldInfo` undefined است

```typescript
// همیشه چک کنید که goldInfo وجود دارد
{product.goldInfo?.weight && (
  <p>وزن: {product.goldInfo.weight} گرم</p>
)}
```

### مشکل: Type Error در TypeScript

```typescript
// مطمئن شوید که interface Product به‌روزرسانی شده:
export interface Product {
  // ... سایر فیلدها
  productType: 'jewelry' | 'coin' | 'melted_gold'; // ✨ جدید
  goldInfo?: GoldInfo; // ✨ جدید
}
```

---

## 📞 پشتیبانی

اگر مشکلی در استفاده از API داشتید:

1. بررسی کنید که Backend در حال اجرا است (`http://localhost:4001`)
2. بررسی کنید که `productType` به درستی ارسال می‌شود
3. Response را در Console/Network tab بررسی کنید
4. مطمئن شوید که Type های TypeScript به‌روزرسانی شده‌اند

---

**موفق باشید! 🎉**
