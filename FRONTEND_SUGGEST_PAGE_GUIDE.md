# 📋 راهنمای Frontend: صفحه پیشنهادات ویژه (Suggest Page)

این document شامل تمام تغییرات و راهنمای پیاده‌سازی صفحه **پیشنهادات ویژه** (`/suggest`) است.

---

## 🎯 خلاصه تغییرات

برای صفحه پیشنهادات ویژه، سه نوع محصول نیاز دارید:

1. **محصولات تخفیف‌دار** (Sale Products)
2. **پیشنهادات ویژه با اجرت کم** (Special Offers - Low Commission)
3. **محصولات پرفروش** (Popular Products)

همه این درخواست‌ها از همان endpoint موجود استفاده می‌کنند، فقط با **فیلترها و پارامترهای متفاوت**.

---

## 📡 API Endpoint

```
GET http://localhost:4001/product/public
```

این همان endpoint موجود است که برای لیست محصولات استفاده می‌شود.

---

## 🔧 Query Parameters جدید

### 1. `onSale` (Boolean)

برای فیلتر کردن محصولاتی که در حال حاضر تخفیف دارند.

**Type:** `boolean`  
**Required:** No  
**Default:** `undefined` (همه محصولات)

**مثال:**
```
GET /product/public?onSale=true&limit=12
```

**نکته:** می‌توانید `?onSale=true` یا `?onSale=1` ارسال کنید.

---

### 2. `lowCommission` (Boolean)

برای فیلتر کردن محصولاتی که اجرت کم دارند (پیشنهادات ویژه).

**Type:** `boolean`  
**Required:** No  
**Default:** `undefined`

**مثال:**
```
GET /product/public?lowCommission=true&limit=12
```

**نکته:** می‌توانید `?lowCommission=true` یا `?lowCommission=1` ارسال کنید.

---

### 3. `sortBy=popular` (String)

برای مرتب‌سازی بر اساس محبوبیت (تعداد فروش، تعداد بازدید، امتیاز).

**Type:** `string`  
**Values:** `"popular"`, `"newest"`, `"oldest"`, `"price-asc"`, `"price-desc"`  
**Required:** No  
**Default:** `"newest"`

**مثال:**
```
GET /product/public?sortBy=popular&limit=8
```

---

## 📊 Response Format

```typescript
interface ProductResponse {
  data: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}
```

---

## 🆕 فیلدهای جدید در Product Schema

فیلدهای زیر به Product schema اضافه شده‌اند:

```typescript
interface Product {
  // ... فیلدهای موجود
  
  // فیلدهای جدید برای تخفیف ✅
  onSale?: boolean;        // آیا محصول در حال حاضر تخفیف دارد؟
  discount?: number;       // درصد تخفیف (0-100)
  
  // فیلدهای جدید برای اجرت ✅
  lowCommission?: boolean; // آیا محصول اجرت کم دارد؟
  commission?: number;     // درصد اجرت
  wage?: string;           // اجرت (کم، متوسط، زیاد)
  
  // فیلدهای جدید برای آمار ✅
  salesCount?: number;     // تعداد فروش
  viewsCount?: number;     // تعداد بازدید
  popularityScore?: number; // امتیاز محبوبیت (محاسبه شده)
}
```

---

## 💻 مثال‌های کد کامل

### 1. TypeScript Types

```typescript
// types/product.ts
export interface Product {
  _id: string;
  name: string;
  slug: string;
  code: string;
  description: string;
  price: number;
  discountPrice?: number;
  stock: number;
  images: string[];
  
  // فیلدهای جدید ✅
  onSale?: boolean;
  discount?: number;
  lowCommission?: boolean;
  commission?: number;
  wage?: string;
  salesCount?: number;
  viewsCount?: number;
  popularityScore?: number;
  
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  subcategory?: {
    _id: string;
    name: string;
    slug: string;
  };
  
  // سایر فیلدها
  isFeatured?: boolean;
  isBestSelling?: boolean;
  isNewArrival?: boolean;
  isGift?: boolean;
  rating?: number;
  reviewsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductResponse {
  data: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}
```

---

### 2. API Service

```typescript
// services/productApi.ts
const API_BASE = 'http://localhost:4001';

export const productApi = {
  /**
   * دریافت محصولات تخفیف‌دار
   * @param limit تعداد محصولات (پیش‌فرض: 12)
   */
  getSaleProducts: async (limit = 12): Promise<ProductResponse> => {
    const response = await fetch(
      `${API_BASE}/product/public?onSale=true&limit=${limit}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch sale products');
    }
    return response.json();
  },

  /**
   * دریافت پیشنهادات ویژه (اجرت کم)
   * @param limit تعداد محصولات (پیش‌فرض: 12)
   */
  getSpecialProducts: async (limit = 12): Promise<ProductResponse> => {
    const response = await fetch(
      `${API_BASE}/product/public?lowCommission=true&limit=${limit}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch special products');
    }
    return response.json();
  },

  /**
   * دریافت محصولات پرفروش
   * @param limit تعداد محصولات (پیش‌فرض: 8)
   */
  getPopularProducts: async (limit = 8): Promise<ProductResponse> => {
    const response = await fetch(
      `${API_BASE}/product/public?sortBy=popular&limit=${limit}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch popular products');
    }
    return response.json();
  },
};
```

---

### 3. React Component - صفحه Suggest

```typescript
// pages/SuggestPage.tsx
import { useEffect, useState } from 'react';
import { productApi, Product } from '../services/productApi';
import ProductCard from '../components/ProductCard';

export default function SuggestPage() {
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [specialProducts, setSpecialProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // همه درخواست‌ها به صورت موازی برای performance بهتر
        const [sale, special, popular] = await Promise.all([
          productApi.getSaleProducts(12),
          productApi.getSpecialProducts(12),
          productApi.getPopularProducts(8),
        ]);

        setSaleProducts(sale.data);
        setSpecialProducts(special.data);
        setPopularProducts(popular.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطا در دریافت محصولات');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">در حال بارگذاری...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="suggest-page container mx-auto px-4 py-8">
      {/* بخش محصولات تخفیف‌دار */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">محصولات تخفیف‌دار</h2>
        {saleProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {saleProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">محصولی یافت نشد</p>
        )}
      </section>

      {/* بخش پیشنهادات ویژه */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">پیشنهادات ویژه با اجرت کم</h2>
        {specialProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {specialProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">محصولی یافت نشد</p>
        )}
      </section>

      {/* بخش محصولات پرفروش */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">محصولات پرفروش</h2>
        {popularProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">محصولی یافت نشد</p>
        )}
      </section>
    </div>
  );
}
```

---

### 4. ProductCard Component با Badge های جدید

```typescript
// components/ProductCard.tsx
import { Product } from '../services/productApi';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const finalPrice = product.discountPrice || product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount && product.discount
    ? product.discount
    : hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

  return (
    <div className="product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/product/${product.slug}`}>
        <div className="relative">
          {/* Badge های جدید ✅ */}
          <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
            {product.onSale && discountPercent > 0 && (
              <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                {discountPercent}% تخفیف
              </span>
            )}
            {product.lowCommission && (
              <span className="bg-green-500 text-white px-2 py-1 rounded text-sm font-bold">
                اجرت کم
              </span>
            )}
          </div>

          {/* تصویر محصول */}
          <img
            src={product.images[0] || '/placeholder.jpg'}
            alt={product.name}
            className="w-full h-64 object-cover"
          />
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2 line-clamp-2">
            {product.name}
          </h3>

          {/* قیمت */}
          <div className="flex items-center gap-2 mb-2">
            {hasDiscount ? (
              <>
                <span className="text-xl font-bold text-red-600">
                  {finalPrice.toLocaleString('fa-IR')} تومان
                </span>
                <span className="text-sm text-gray-500 line-through">
                  {product.price.toLocaleString('fa-IR')}
                </span>
              </>
            ) : (
              <span className="text-xl font-bold">
                {product.price.toLocaleString('fa-IR')} تومان
              </span>
            )}
          </div>

          {/* آمار (اختیاری) */}
          {(product.salesCount || product.viewsCount) && (
            <div className="flex gap-4 text-xs text-gray-500 mt-2">
              {product.salesCount && (
                <span>فروش: {product.salesCount.toLocaleString('fa-IR')}</span>
              )}
              {product.viewsCount && (
                <span>بازدید: {product.viewsCount.toLocaleString('fa-IR')}</span>
              )}
            </div>
          )}

          {/* امتیاز */}
          {product.rating && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-yellow-500">★</span>
              <span className="text-sm">{product.rating.toFixed(1)}</span>
              {product.reviewsCount && (
                <span className="text-xs text-gray-500">
                  ({product.reviewsCount} نظر)
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
```

---

### 5. استفاده با Axios (اختیاری)

```typescript
// services/productApi.ts (با Axios)
import axios from 'axios';

const API_BASE = 'http://localhost:4001';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const productApi = {
  getSaleProducts: async (limit = 12): Promise<ProductResponse> => {
    const response = await api.get<ProductResponse>(
      '/product/public',
      {
        params: {
          onSale: true,
          limit,
        },
      }
    );
    return response.data;
  },

  getSpecialProducts: async (limit = 12): Promise<ProductResponse> => {
    const response = await api.get<ProductResponse>(
      '/product/public',
      {
        params: {
          lowCommission: true,
          limit,
        },
      }
    );
    return response.data;
  },

  getPopularProducts: async (limit = 8): Promise<ProductResponse> => {
    const response = await api.get<ProductResponse>(
      '/product/public',
      {
        params: {
          sortBy: 'popular',
          limit,
        },
      }
    );
    return response.data;
  },
};
```

---

## ⚠️ نکات مهم

### 1. Boolean Parameters

می‌توانید boolean parameters را به صورت زیر ارسال کنید:
- `?onSale=true` ✅
- `?onSale=1` ✅
- `?onSale=false` ✅
- `?onSale=0` ✅

### 2. افزایش خودکار Views

هنگام مشاهده جزئیات محصول (`GET /product/public/:slug`)، تعداد بازدید به صورت **خودکار** افزایش می‌یابد. نیازی به درخواست جداگانه نیست.

### 3. افزایش خودکار Sales

بعد از پرداخت موفق سفارش، تعداد فروش به صورت **خودکار** افزایش می‌یابد. نیازی به درخواست جداگانه نیست.

### 4. محاسبه Popularity Score

امتیاز محبوبیت به صورت **خودکار** بعد از هر افزایش sales محاسبه می‌شود. فرمول:

```
popularityScore = (salesCount * 5) + (viewsCount * 1) + (rating * 10)
```

### 5. Error Handling

همیشه error handling را در نظر بگیرید:

```typescript
try {
  const products = await productApi.getSaleProducts(12);
  // استفاده از products
} catch (error) {
  console.error('Error:', error);
  // نمایش پیام خطا به کاربر
}
```

### 6. Loading States

برای UX بهتر، loading states را نمایش دهید:

```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchData() {
    setLoading(true);
    try {
      // fetch data
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, []);
```

---

## 🧪 تست API ها

### با curl:

```bash
# محصولات تخفیف‌دار
curl "http://localhost:4001/product/public?onSale=true&limit=12"

# پیشنهادات ویژه
curl "http://localhost:4001/product/public?lowCommission=true&limit=12"

# محصولات پرفروش
curl "http://localhost:4001/product/public?sortBy=popular&limit=8"
```

### با Postman/Insomnia:

1. **Method:** GET
2. **URL:** `http://localhost:4001/product/public`
3. **Query Params:**
   - `onSale`: `true`
   - `limit`: `12`

---

## 📝 Checklist پیاده‌سازی

- [ ] اضافه کردن فیلدهای جدید به `Product` interface
- [ ] ایجاد API service functions (`getSaleProducts`, `getSpecialProducts`, `getPopularProducts`)
- [ ] ایجاد صفحه `/suggest`
- [ ] ایجاد `ProductCard` component با badge های جدید
- [ ] اضافه کردن error handling
- [ ] اضافه کردن loading states
- [ ] تست API calls
- [ ] تست UI در حالت‌های مختلف (loading, error, empty, success)

---

## 🎨 مثال UI/UX

### Badge ها:

```css
/* Badge تخفیف */
.sale-badge {
  background-color: #ef4444; /* red-500 */
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

/* Badge اجرت کم */
.commission-badge {
  background-color: #10b981; /* green-500 */
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}
```

---

## 📞 پشتیبانی

اگر سوال یا مشکلی دارید، با تیم Backend تماس بگیرید.

**موفق باشید! 🚀**

