# 📋 راهنمای Frontend: سیستم تخفیف و قیمت‌گذاری

این document شامل تمام تغییرات لازم برای پیاده‌سازی سیستم تخفیف در frontend است.

---

## 🎯 خلاصه تغییرات

Backend حالا به صورت **خودکار** درصد تخفیف (`discount`) و وضعیت تخفیف (`onSale`) را محاسبه می‌کند. Frontend فقط باید:

1. ✅ از فیلدهای برگشتی از API استفاده کند
2. ✅ Validation در فرم Admin Panel داشته باشد
3. ✅ Sort option جدید `discount` را استفاده کند

---

## 🆕 فیلدهای جدید در Product Response

```typescript
interface Product {
  // ... فیلدهای موجود

  price: number; // قیمت اصلی (الزامی)
  discountPrice?: number | null; // قیمت با تخفیف (اختیاری)
  discount?: number; // درصد تخفیف (محاسبه شده خودکار) ✅
  onSale?: boolean; // آیا محصول تخفیف دارد؟ (محاسبه شده خودکار) ✅
}
```

---

## ⚠️ نکات مهم

### 1. محاسبه خودکار در Backend

**❌ اشتباه:** Frontend نباید درصد تخفیف را محاسبه کند:

```typescript
// ❌ این کار را نکنید
const discount = Math.round(
  ((product.price - product.discountPrice) / product.price) * 100,
);
```

**✅ درست:** همیشه از فیلد `discount` برگشتی از API استفاده کنید:

```typescript
// ✅ این کار را انجام دهید
const discount = product.discount || 0;
const isOnSale = product.onSale || false;
```

### 2. نمایش قیمت

```typescript
// نمایش قیمت با تخفیف
const finalPrice = product.discountPrice || product.price;
const hasDiscount = product.onSale && product.discountPrice;

// در UI
{hasDiscount ? (
  <>
    <span className="price-discounted">{finalPrice.toLocaleString('fa-IR')} تومان</span>
    <span className="price-original line-through">{product.price.toLocaleString('fa-IR')}</span>
    <span className="discount-badge">{product.discount}% تخفیف</span>
  </>
) : (
  <span className="price">{product.price.toLocaleString('fa-IR')} تومان</span>
)}
```

---

## 💻 مثال‌های کد

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
  discountPrice?: number | null; // ✅ می‌تواند null باشد
  discount?: number; // ✅ محاسبه شده خودکار
  onSale?: boolean; // ✅ محاسبه شده خودکار
  stock: number;
  images: string[];
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  // ... سایر فیلدها
}
```

---

### 2. ProductCard Component

```typescript
// components/ProductCard.tsx
import { Product } from '../types/product';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  // ✅ استفاده از فیلدهای محاسبه شده
  const hasDiscount = product.onSale && product.discountPrice;
  const finalPrice = product.discountPrice || product.price;
  const discountPercent = product.discount || 0;

  return (
    <div className="product-card">
      {/* Badge تخفیف */}
      {hasDiscount && (
        <span className="badge badge-sale">
          {discountPercent}% تخفیف
        </span>
      )}

      <img src={product.images[0]} alt={product.name} />

      <h3>{product.name}</h3>

      {/* نمایش قیمت */}
      <div className="price-section">
        {hasDiscount ? (
          <>
            <span className="price-final">
              {finalPrice.toLocaleString('fa-IR')} تومان
            </span>
            <span className="price-original line-through">
              {product.price.toLocaleString('fa-IR')}
            </span>
          </>
        ) : (
          <span className="price">
            {product.price.toLocaleString('fa-IR')} تومان
          </span>
        )}
      </div>
    </div>
  );
}
```

---

### 3. Admin Panel - فرم ایجاد/ویرایش محصول

```typescript
// pages/admin/ProductForm.tsx
import { useState, useEffect } from 'react';
import { Product } from '../../types/product';

interface ProductFormData {
  name: string;
  slug: string;
  code: string;
  description: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  // ... سایر فیلدها
}

export default function ProductForm({ product, onSubmit }: { product?: Product; onSubmit: (data: ProductFormData) => void }) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || '',
    slug: product?.slug || '',
    code: product?.code || '',
    description: product?.description || '',
    price: product?.price || 0,
    discountPrice: product?.discountPrice || null,
    stock: product?.stock || 0,
  });

  const [hasDiscount, setHasDiscount] = useState(!!product?.onSale);
  const [validationError, setValidationError] = useState<string | null>(null);

  // محاسبه درصد تخفیف برای نمایش (فقط برای نمایش، نه ارسال)
  const calculatedDiscount = formData.discountPrice && formData.price > 0
    ? Math.round(((formData.price - formData.discountPrice) / formData.price) * 100)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // ✅ Validation در Frontend
    if (hasDiscount && formData.discountPrice) {
      if (formData.discountPrice < 0) {
        setValidationError('قیمت تخفیف نمی‌تواند منفی باشد');
        return;
      }
      if (formData.discountPrice >= formData.price) {
        setValidationError('قیمت تخفیف باید کمتر از قیمت اصلی باشد');
        return;
      }
    }

    // ✅ ارسال به backend (discount و onSale ارسال نمی‌شوند)
    const payload = {
      ...formData,
      discountPrice: hasDiscount ? formData.discountPrice : null,
      // ❌ discount و onSale را ارسال نکنید - backend خودش محاسبه می‌کند
    };

    try {
      const response = await fetch(`/api/products${product ? `/${product._id}` : ''}`, {
        method: product ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        // ✅ استفاده از فیلدهای محاسبه شده از backend
        console.log('Discount (from backend):', data.data.discount);
        console.log('On Sale (from backend):', data.data.onSale);
        onSubmit(data.data);
      } else {
        setValidationError(data.message || 'خطا در ذخیره محصول');
      }
    } catch (error) {
      setValidationError('خطا در ارتباط با سرور');
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      {/* ... سایر فیلدها */}

      {/* قیمت اصلی */}
      <div className="form-group">
        <label>قیمت اصلی (تومان) *</label>
        <input
          type="number"
          min="0"
          value={formData.price}
          onChange={(e) => {
            const newPrice = Number(e.target.value);
            setFormData({ ...formData, price: newPrice });
            // اگر discountPrice بیشتر از price جدید شد، آن را reset کن
            if (formData.discountPrice && formData.discountPrice >= newPrice) {
              setFormData({ ...formData, price: newPrice, discountPrice: null });
              setHasDiscount(false);
            }
          }}
          required
        />
      </div>

      {/* چک‌باکس تخفیف */}
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={hasDiscount}
            onChange={(e) => {
              setHasDiscount(e.target.checked);
              if (!e.target.checked) {
                setFormData({ ...formData, discountPrice: null });
              }
            }}
          />
          این محصول تخفیف دارد
        </label>
      </div>

      {/* قیمت با تخفیف */}
      {hasDiscount && (
        <div className="form-group">
          <label>قیمت با تخفیف (تومان)</label>
          <input
            type="number"
            min="0"
            max={formData.price - 1}
            value={formData.discountPrice || ''}
            onChange={(e) => {
              const newDiscountPrice = Number(e.target.value);
              setFormData({ ...formData, discountPrice: newDiscountPrice });

              // Validation در Frontend
              if (newDiscountPrice >= formData.price) {
                setValidationError('قیمت تخفیف باید کمتر از قیمت اصلی باشد');
              } else {
                setValidationError(null);
              }
            }}
          />

          {/* نمایش درصد تخفیف (فقط برای نمایش) */}
          {formData.discountPrice && formData.price > 0 && (
            <p className="text-sm text-gray-600">
              درصد تخفیف: {calculatedDiscount}%
              <span className="text-xs text-gray-400 ml-2">
                (این مقدار توسط backend محاسبه و ذخیره می‌شود)
              </span>
            </p>
          )}
        </div>
      )}

      {/* نمایش خطای validation */}
      {validationError && (
        <div className="error-message text-red-500">
          {validationError}
        </div>
      )}

      <button type="submit">ذخیره محصول</button>
    </form>
  );
}
```

---

### 4. استفاده از Sort Option جدید

```typescript
// services/productApi.ts
export const productApi = {
  /**
   * دریافت محصولات تخفیف‌دار مرتب شده بر اساس بیشترین تخفیف
   */
  getSaleProductsSortedByDiscount: async (
    limit = 12,
  ): Promise<ProductResponse> => {
    const response = await fetch(
      `${API_BASE}/product/public?onSale=true&sortBy=discount&limit=${limit}`,
    );
    if (!response.ok) {
      throw new Error('Failed to fetch sale products');
    }
    return response.json();
  },
};
```

---

### 5. صفحه لیست محصولات با فیلتر تخفیف

```typescript
// pages/ProductsPage.tsx
import { useState, useEffect } from 'react';
import { productApi, Product } from '../services/productApi';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showOnlySale, setShowOnlySale] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    async function fetchProducts() {
      try {
        const params = new URLSearchParams({
          limit: '12',
          sortBy,
        });

        if (showOnlySale) {
          params.append('onSale', 'true');
        }

        const response = await productApi.getProducts(params.toString());
        setProducts(response.data);
      } catch (error) {
        console.error('Error:', error);
      }
    }

    fetchProducts();
  }, [showOnlySale, sortBy]);

  return (
    <div className="products-page">
      {/* فیلترها */}
      <div className="filters">
        <label>
          <input
            type="checkbox"
            checked={showOnlySale}
            onChange={(e) => setShowOnlySale(e.target.checked)}
          />
          فقط محصولات تخفیف‌دار
        </label>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">جدیدترین</option>
          <option value="price-asc">ارزان‌ترین</option>
          <option value="price-desc">گران‌ترین</option>
          <option value="popular">محبوب‌ترین</option>
          <option value="discount">بیشترین تخفیف</option> {/* ✅ جدید */}
        </select>
      </div>

      {/* لیست محصولات */}
      <div className="products-grid">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

---

## 🎨 CSS برای Badge و قیمت

```css
/* Badge تخفیف */
.badge-sale {
  background-color: #ef4444; /* red-500 */
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  display: inline-block;
}

/* قیمت نهایی */
.price-final {
  color: #ef4444; /* red-500 */
  font-size: 18px;
  font-weight: bold;
}

/* قیمت اصلی (خط‌خورده) */
.price-original {
  color: #9ca3af; /* gray-400 */
  font-size: 14px;
  text-decoration: line-through;
  margin-right: 8px;
}

/* قیمت عادی */
.price {
  font-size: 18px;
  font-weight: bold;
  color: #1f2937; /* gray-800 */
}
```

---

## 📝 Checklist پیاده‌سازی Frontend

- [ ] به‌روزرسانی `Product` interface برای اضافه کردن `discount` و `onSale`
- [ ] حذف محاسبه دستی `discount` از frontend
- [ ] استفاده از فیلد `discount` برگشتی از API
- [ ] استفاده از فیلد `onSale` برگشتی از API
- [ ] اضافه کردن validation در فرم Admin Panel
- [ ] اضافه کردن sort option `discount` در dropdown
- [ ] به‌روزرسانی `ProductCard` برای نمایش صحیح تخفیف
- [ ] تست فرم Admin Panel (ایجاد و ویرایش محصول با تخفیف)
- [ ] تست نمایش محصولات تخفیف‌دار در لیست
- [ ] تست sort بر اساس `discount`

---

## ⚠️ نکات مهم

### 1. ارسال فیلدها به Backend

**❌ اشتباه:** ارسال `discount` و `onSale` در request:

```typescript
// ❌ این کار را نکنید
const payload = {
  price: 5000000,
  discountPrice: 4000000,
  discount: 20, // ❌ ارسال نکنید
  onSale: true, // ❌ ارسال نکنید
};
```

**✅ درست:** فقط `price` و `discountPrice` را ارسال کنید:

```typescript
// ✅ این کار را انجام دهید
const payload = {
  price: 5000000,
  discountPrice: 4000000,
  // discount و onSale را ارسال نکنید - backend خودش محاسبه می‌کند
};
```

### 2. استفاده از Response

**✅ همیشه از فیلدهای برگشتی استفاده کنید:**

```typescript
const response = await fetch('/api/products', { ... });
const product = await response.json();

// ✅ استفاده از فیلدهای محاسبه شده
const discount = product.discount || 0;
const isOnSale = product.onSale || false;
```

### 3. Validation در Frontend

Frontend باید validation داشته باشد تا UX بهتری ارائه دهد، اما **validation اصلی در backend انجام می‌شود**.

---

## 🧪 تست

### تست 1: ایجاد محصول با تخفیف

```typescript
// Request
POST /api/products
{
  "name": "گردنبند طلا",
  "price": 5000000,
  "discountPrice": 4000000,
  // ...
}

// Response (بررسی کنید)
{
  "discount": 20,      // ✅ باید 20 باشد
  "onSale": true,     // ✅ باید true باشد
  "discountPrice": 4000000
}
```

### تست 2: Update کردن قیمت

```typescript
// Request
PUT /api/products/:id
{
  "price": 6000000,
  "discountPrice": 4500000
}

// Response (بررسی کنید)
{
  "discount": 25,      // ✅ باید 25 باشد (محاسبه مجدد)
  "onSale": true,      // ✅ باید true باشد
}
```

### تست 3: حذف تخفیف

```typescript
// Request
PUT /api/products/:id
{
  "discountPrice": null
}

// Response (بررسی کنید)
{
  "discount": 0,       // ✅ باید 0 باشد
  "onSale": false,    // ✅ باید false باشد
  "discountPrice": null
}
```

---

## 📞 پشتیبانی

اگر سوال یا مشکلی دارید:

1. ابتدا این document را کامل مطالعه کنید
2. مثال‌های کد را بررسی کنید
3. Response از API را در console.log بررسی کنید
4. با تیم Backend هماهنگ کنید

**موفق باشید! 🚀**
