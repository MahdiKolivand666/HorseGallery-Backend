# 📚 راهنمای کامل استفاده از API محصولات - Frontend

تاریخ: دسامبر 2024  
وضعیت: ✅ آماده استفاده

---

## 🎯 خلاصه

این مستندات توضیح می‌دهد که چگونه از API محصولات برای دریافت **جواهرات**، **سکه** و **شمش طلا** استفاده کنید.

### ⚠️ نکته مهم: رفتار پیش‌فرض

**API یک endpoint مشترک دارد اما رفتار متفاوتی دارد:**

- **بدون `productType`**: فقط **جواهرات** (`jewelry`) برمی‌گرداند
- **با `productType=coin`**: فقط **سکه‌ها** برمی‌گرداند
- **با `productType=melted_gold`**: فقط **شمش‌ها** برمی‌گرداند

---

## 🔌 API Endpoint

### Endpoint اصلی

```
GET /product/public
```

**Base URL:** `http://localhost:4001` (در production تغییر می‌کند)

---

## 📋 پارامترهای Query

### پارامترهای مشترک (برای همه انواع محصولات)

| پارامتر         | نوع     | پیش‌فرض   | توضیحات                                     |
| --------------- | ------- | --------- | ------------------------------------------- |
| `productType`   | string  | `jewelry` | نوع محصول: `jewelry`, `coin`, `melted_gold` |
| `page`          | number  | `1`       | شماره صفحه                                  |
| `limit`         | number  | `18`      | تعداد محصولات در هر صفحه                    |
| `category`      | string  | -         | اسلاگ دسته‌بندی                             |
| `subcategory`   | string  | -         | اسلاگ زیردسته                               |
| `minPrice`      | number  | -         | حداقل قیمت                                  |
| `maxPrice`      | number  | -         | حداکثر قیمت                                 |
| `onSale`        | boolean | -         | فیلتر تخفیف‌دار (`true`/`false`)            |
| `lowCommission` | boolean | -         | فیلتر اجرت کم (`true`/`false`)              |
| `isFeatured`    | boolean | -         | فیلتر محصولات ویژه                          |
| `isBestSelling` | boolean | -         | فیلتر پرفروش‌ترین‌ها                        |
| `isNewArrival`  | boolean | -         | فیلتر محصولات جدید                          |
| `inStock`       | boolean | -         | فیلتر موجودی                                |

### پارامتر `sortBy` - تفاوت‌های مهم

#### برای جواهرات (`productType=jewelry` یا بدون `productType`):

| مقدار        | توضیحات                            |
| ------------ | ---------------------------------- |
| `newest`     | جدیدترین (پیش‌فرض)                 |
| `oldest`     | قدیمی‌ترین                         |
| `price-asc`  | از ارزان به گران                   |
| `price-desc` | از گران به ارزان                   |
| `popular`    | محبوب‌ترین (بر اساس views و sales) |
| `discount`   | بیشترین تخفیف                      |

#### برای سکه و شمش (`productType=coin` یا `productType=melted_gold`):

**گزینه‌های مشترک با جواهرات:**

- `newest`, `oldest`, `price-asc`, `price-desc`, `popular`, `discount`

**گزینه‌های اضافی (فقط برای سکه و شمش):**

- `weight-desc`: از بیشترین وزن به کمترین
- `weight-asc`: از کمترین وزن به بیشترین
- `inStock`: فقط موجودی (مرتب بر اساس وزن)
- `outOfStock`: فقط ناموجود

---

## 💻 نحوه استفاده در Frontend

### 1️⃣ به‌روزرسانی تابع API

در فایل `src/lib/api/products.ts`:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export interface GetProductsParams {
  // Pagination
  page?: number;
  limit?: number;

  // Product Type - مهم!
  productType?: 'jewelry' | 'coin' | 'melted_gold';

  // Filters
  category?: string;
  subcategory?: string;
  sortBy?: string;
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  lowCommission?: boolean;
  isFeatured?: boolean;
  isBestSelling?: boolean;
  isNewArrival?: boolean;
  inStock?: boolean;
}

export interface ProductResponse {
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getProducts(
  params?: GetProductsParams,
): Promise<ProductResponse> {
  const queryParams = new URLSearchParams();

  // Pagination
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  // ⚠️ مهم: productType
  // اگر ارسال نشود، پیش‌فرض jewelry است
  if (params?.productType) {
    queryParams.append('productType', params.productType);
  }

  // Filters
  if (params?.category) queryParams.append('category', params.category);
  if (params?.subcategory)
    queryParams.append('subcategory', params.subcategory);
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params?.minPrice)
    queryParams.append('minPrice', params.minPrice.toString());
  if (params?.maxPrice)
    queryParams.append('maxPrice', params.maxPrice.toString());

  // Boolean filters
  if (params?.onSale !== undefined)
    queryParams.append('onSale', params.onSale.toString());
  if (params?.lowCommission !== undefined)
    queryParams.append('lowCommission', params.lowCommission.toString());
  if (params?.isFeatured !== undefined)
    queryParams.append('isFeatured', params.isFeatured.toString());
  if (params?.isBestSelling !== undefined)
    queryParams.append('isBestSelling', params.isBestSelling.toString());
  if (params?.isNewArrival !== undefined)
    queryParams.append('isNewArrival', params.isNewArrival.toString());
  if (params?.inStock !== undefined)
    queryParams.append('inStock', params.inStock.toString());

  const response = await fetch(
    `${API_BASE_URL}/product/public?${queryParams.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }

  return response.json();
}
```

### 2️⃣ به‌روزرسانی Type های Product

در فایل `src/types/product.ts`:

```typescript
export type ProductType = 'jewelry' | 'coin' | 'melted_gold';

export interface GoldInfo {
  weight?: number; // وزن به گرم (مثال: 8.13)
  purity?: string; // خلوص (مثال: "900" یا "999.9")
  certificate?: string; // شماره گواهی
  mintYear?: number; // سال ضرب (فقط برای سکه)
  manufacturer?: string; // تولید کننده (فقط برای شمش)
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

  // ✨ جدید - مهم!
  productType: ProductType;
  goldInfo?: GoldInfo; // فقط برای coin و melted_gold

  // Flags
  isAvailable: boolean;
  isFeatured: boolean;
  isBestSelling: boolean;
  isNewArrival: boolean;
  isGift?: boolean;

  // Stats
  views: number;
  sales: number;
  rating?: number;
  reviewsCount?: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}
```

---

## 📄 مثال‌های استفاده

### مثال 1: دریافت جواهرات (صفحه اصلی)

```typescript
// ✅ درست - بدون productType (پیش‌فرض jewelry)
const jewelry = await getProducts({
  page: 1,
  limit: 20,
  sortBy: 'newest',
});

// ✅ درست - با productType صریح
const jewelry = await getProducts({
  productType: 'jewelry',
  page: 1,
  limit: 20,
  sortBy: 'newest',
});
```

### مثال 2: دریافت سکه‌ها

```typescript
// ✅ درست - حتماً productType را مشخص کنید
const coins = await getProducts({
  productType: 'coin',
  page: 1,
  limit: 20,
  sortBy: 'newest',
});

// ✅ مرتب‌سازی بر اساس وزن (فقط برای سکه)
const coinsByWeight = await getProducts({
  productType: 'coin',
  sortBy: 'weight-desc', // از بیشترین وزن
  limit: 10,
});

// ✅ فقط سکه‌های موجود (مرتب بر اساس وزن)
const availableCoins = await getProducts({
  productType: 'coin',
  sortBy: 'inStock',
  limit: 10,
});
```

### مثال 3: دریافت شمش‌ها

```typescript
// ✅ درست - حتماً productType را مشخص کنید
const goldBars = await getProducts({
  productType: 'melted_gold',
  page: 1,
  limit: 20,
  sortBy: 'price-asc',
});

// ✅ مرتب‌سازی بر اساس وزن
const barsByWeight = await getProducts({
  productType: 'melted_gold',
  sortBy: 'weight-asc', // از کمترین وزن
  limit: 10,
});
```

### مثال 4: فیلترهای ترکیبی

```typescript
// جواهرات تخفیف‌دار
const saleJewelry = await getProducts({
  productType: 'jewelry',
  onSale: true,
  sortBy: 'discount',
  limit: 12,
});

// سکه‌های موجود با قیمت مشخص
const coinsInRange = await getProducts({
  productType: 'coin',
  minPrice: 10000000,
  maxPrice: 50000000,
  inStock: true,
  sortBy: 'price-asc',
});

// شمش‌های ویژه
const featuredBars = await getProducts({
  productType: 'melted_gold',
  isFeatured: true,
  sortBy: 'weight-desc',
  limit: 6,
});
```

---

## 🎨 مثال‌های کامپوننت React/Next.js

### صفحه جواهرات (`/products` یا صفحه اصلی)

```typescript
// app/products/page.tsx
import { getProducts } from '@/lib/api/products';
import ProductGrid from '@/components/ProductGrid';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { page?: string; category?: string };
}) {
  const page = parseInt(searchParams.page || '1');
  const category = searchParams.category;

  // ⚠️ مهم: productType را مشخص کنید یا نکنید (پیش‌فرض jewelry)
  const response = await getProducts({
    productType: 'jewelry',  // یا نگذارید (پیش‌فرض است)
    page,
    limit: 20,
    category,
    sortBy: 'newest',
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">جواهرات طلا</h1>
      <ProductGrid products={response.data} />
      {/* Pagination component */}
    </div>
  );
}
```

### صفحه سکه (`/coin`)

```typescript
// app/coin/page.tsx
import { getProducts } from '@/lib/api/products';
import ProductGrid from '@/components/ProductGrid';
import GoldInfoCard from '@/components/GoldInfoCard';

export default async function CoinPage({
  searchParams,
}: {
  searchParams: {
    page?: string;
    sortBy?: string;
  };
}) {
  const page = parseInt(searchParams.page || '1');
  const sortBy = searchParams.sortBy || 'newest';

  // ⚠️ مهم: حتماً productType را مشخص کنید
  const response = await getProducts({
    productType: 'coin',  // ⚠️ اجباری!
    page,
    limit: 20,
    sortBy,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">سکه طلا</h1>

      {/* Sort options - شامل گزینه‌های مخصوص سکه */}
      <div className="mb-6">
        <select defaultValue={sortBy}>
          <option value="newest">جدیدترین</option>
          <option value="price-asc">ارزان‌ترین</option>
          <option value="price-desc">گران‌ترین</option>
          <option value="weight-desc">بیشترین وزن</option>
          <option value="weight-asc">کمترین وزن</option>
          <option value="inStock">موجود</option>
        </select>
      </div>

      <ProductGrid products={response.data} />

      {/* نمایش اطلاعات تخصصی */}
      {response.data.map((coin) => (
        coin.goldInfo && (
          <GoldInfoCard
            key={coin._id}
            goldInfo={coin.goldInfo}
            productType="coin"
          />
        )
      ))}
    </div>
  );
}
```

### صفحه شمش (`/melted-gold`)

```typescript
// app/melted-gold/page.tsx
import { getProducts } from '@/lib/api/products';
import ProductGrid from '@/components/ProductGrid';
import GoldInfoCard from '@/components/GoldInfoCard';

export default async function MeltedGoldPage({
  searchParams,
}: {
  searchParams: {
    page?: string;
    sortBy?: string;
  };
}) {
  const page = parseInt(searchParams.page || '1');
  const sortBy = searchParams.sortBy || 'newest';

  // ⚠️ مهم: حتماً productType را مشخص کنید
  const response = await getProducts({
    productType: 'melted_gold',  // ⚠️ اجباری!
    page,
    limit: 20,
    sortBy,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">شمش طلا</h1>

      {/* Sort options - شامل گزینه‌های مخصوص شمش */}
      <div className="mb-6">
        <select defaultValue={sortBy}>
          <option value="newest">جدیدترین</option>
          <option value="price-asc">ارزان‌ترین</option>
          <option value="price-desc">گران‌ترین</option>
          <option value="weight-desc">بیشترین وزن</option>
          <option value="weight-asc">کمترین وزن</option>
          <option value="inStock">موجود</option>
        </select>
      </div>

      <ProductGrid products={response.data} />

      {/* نمایش اطلاعات تخصصی */}
      {response.data.map((bar) => (
        bar.goldInfo && (
          <GoldInfoCard
            key={bar._id}
            goldInfo={bar.goldInfo}
            productType="melted_gold"
          />
        )
      ))}
    </div>
  );
}
```

### کامپوننت نمایش اطلاعات تخصصی

```typescript
// components/GoldInfoCard.tsx
import { GoldInfo } from '@/types/product';

interface GoldInfoCardProps {
  goldInfo: GoldInfo;
  productType: 'coin' | 'melted_gold';
}

export default function GoldInfoCard({
  goldInfo,
  productType
}: GoldInfoCardProps) {
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

        {/* فقط برای سکه */}
        {productType === 'coin' && goldInfo.mintYear && (
          <div>
            <span className="text-gray-600">سال ضرب:</span>
            <span className="font-medium mr-2">{goldInfo.mintYear}</span>
          </div>
        )}

        {/* فقط برای شمش */}
        {productType === 'melted_gold' && goldInfo.manufacturer && (
          <div className="col-span-2">
            <span className="text-gray-600">تولید کننده:</span>
            <span className="font-medium mr-2">{goldInfo.manufacturer}</span>
          </div>
        )}

        {goldInfo.certificate && (
          <div className="col-span-2">
            <span className="text-gray-600">شماره گواهی:</span>
            <span className="font-medium mr-2 font-mono">
              {goldInfo.certificate}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## ⚠️ نکات مهم و هشدارها

### 1. رفتار پیش‌فرض

```typescript
// ❌ غلط - اگر productType را نگذارید، فقط jewelry برمی‌گرداند
// حتی اگر سکه یا شمش در دیتابیس باشد!
const products = await getProducts(); // فقط jewelry

// ✅ درست - برای سکه و شمش حتماً productType را مشخص کنید
const coins = await getProducts({ productType: 'coin' });
const bars = await getProducts({ productType: 'melted_gold' });
```

### 2. جداسازی صفحات

```typescript
// ✅ درست - هر صفحه فقط محصولات مربوط به خودش را نمایش دهد
// صفحه جواهرات
const jewelry = await getProducts({ productType: 'jewelry' });

// صفحه سکه
const coins = await getProducts({ productType: 'coin' });

// صفحه شمش
const bars = await getProducts({ productType: 'melted_gold' });
```

### 3. مرتب‌سازی متفاوت

```typescript
// ✅ درست - گزینه‌های مرتب‌سازی برای سکه و شمش
const coins = await getProducts({
  productType: 'coin',
  sortBy: 'weight-desc', // فقط برای coin و melted_gold
});

// ❌ غلط - این گزینه برای jewelry کار نمی‌کند
const jewelry = await getProducts({
  productType: 'jewelry',
  sortBy: 'weight-desc', // ❌ خطا یا نتیجه نامعتبر
});
```

### 4. فیلد `goldInfo`

```typescript
// ✅ همیشه چک کنید که goldInfo وجود دارد
{product.goldInfo?.weight && (
  <p>وزن: {product.goldInfo.weight} گرم</p>
)}

// ❌ غلط - ممکن است undefined باشد
<p>وزن: {product.goldInfo.weight} گرم</p>  // ❌ خطا
```

### 5. Type Safety

```typescript
// ✅ درست - از type guard استفاده کنید
if (product.productType === 'coin' && product.goldInfo) {
  // حالا می‌دانیم که goldInfo وجود دارد
  console.log(product.goldInfo.mintYear);
}

// ✅ یا از optional chaining
const mintYear = product.goldInfo?.mintYear;
```

---

## 📊 ساختار Response

### Response موفق

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
      "description": "...",
      "images": ["/images/products/coin.png"],
      "category": { ... },
      "isAvailable": true,
      "isFeatured": true,
      "views": 15,
      "sales": 2
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

## 🐛 رفع مشکلات رایج

### مشکل 1: محصولات برگردانده نمی‌شوند

**علت:** `productType` اشتباه یا ارسال نشده

```typescript
// ✅ درست
const coins = await getProducts({ productType: 'coin' });

// ❌ غلط - املای اشتباه
const coins = await getProducts({ productType: 'coins' });

// ❌ غلط - فراموش شده
const coins = await getProducts(); // فقط jewelry برمی‌گرداند!
```

### مشکل 2: `goldInfo` undefined است

**علت:** فقط برای `coin` و `melted_gold` وجود دارد

```typescript
// ✅ درست - همیشه چک کنید
{product.goldInfo?.weight && (
  <p>وزن: {product.goldInfo.weight} گرم</p>
)}

// ❌ غلط
<p>وزن: {product.goldInfo.weight} گرم</p>
```

### مشکل 3: Type Error در TypeScript

**راه حل:** مطمئن شوید که interface ها به‌روزرسانی شده‌اند

```typescript
export interface Product {
  // ... سایر فیلدها
  productType: 'jewelry' | 'coin' | 'melted_gold'; // ✨
  goldInfo?: GoldInfo; // ✨
}
```

### مشکل 4: مرتب‌سازی کار نمی‌کند

**علت:** گزینه مرتب‌سازی برای نوع محصول مناسب نیست

```typescript
// ✅ درست - فقط برای coin و melted_gold
const coins = await getProducts({
  productType: 'coin',
  sortBy: 'weight-desc',
});

// ❌ غلط - برای jewelry کار نمی‌کند
const jewelry = await getProducts({
  productType: 'jewelry',
  sortBy: 'weight-desc', // ❌
});
```

---

## ✅ چک‌لیست پیاده‌سازی

- [ ] به‌روزرسانی تابع `getProducts` در `src/lib/api/products.ts`
- [ ] افزودن `productType` و `goldInfo` به type های Product
- [ ] ایجاد صفحه `/products` با `productType: 'jewelry'`
- [ ] ایجاد صفحه `/coin` با `productType: 'coin'`
- [ ] ایجاد صفحه `/melted-gold` با `productType: 'melted_gold'`
- [ ] ایجاد کامپوننت `GoldInfoCard` برای نمایش اطلاعات تخصصی
- [ ] افزودن گزینه‌های مرتب‌سازی مخصوص سکه و شمش
- [ ] تست جداسازی محصولات در صفحات مختلف
- [ ] تست مرتب‌سازی برای هر نوع محصول
- [ ] بررسی نمایش صحیح در موبایل

---

## 📞 پشتیبانی

اگر مشکلی در استفاده از API داشتید:

1. ✅ بررسی کنید که Backend در حال اجرا است (`http://localhost:4001`)
2. ✅ بررسی کنید که `productType` به درستی ارسال می‌شود
3. ✅ Response را در Console/Network tab بررسی کنید
4. ✅ مطمئن شوید که Type های TypeScript به‌روزرسانی شده‌اند
5. ✅ بررسی کنید که گزینه `sortBy` برای نوع محصول مناسب است

---

**موفق باشید! 🎉**
