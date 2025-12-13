# 🛒 راهنمای بهبودهای سبد خرید - Frontend

تاریخ: دسامبر 2024  
وضعیت: ✅ Backend آماده - Frontend نیاز به به‌روزرسانی دارد

---

## 📋 خلاصه تغییرات

دو بهبود مهم در Backend انجام شده است:

1. **محاسبه تعداد محصولات**: `totalItems` و `itemCount` در Backend محاسبه می‌شوند
2. **تایمر 10 دقیقه‌ای**: سبد خرید بعد از 10 دقیقه عدم فعالیت به صورت خودکار پاک می‌شود

---

## ✨ تغییر 1: محاسبه تعداد محصولات در Backend

### قبل:
Frontend باید خودش تعداد محصولات را محاسبه می‌کرد:
```typescript
// Frontend باید خودش محاسبه می‌کرد
const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
```

### بعد:
Backend به صورت خودکار محاسبه می‌کند و در response برمی‌گرداند.

---

## ✨ تغییر 2: تایمر 10 دقیقه‌ای

### نحوه کار:
- هر بار که کاربر عملیاتی روی سبد انجام می‌دهد (افزودن، حذف، تغییر تعداد)، زمان فعالیت به‌روزرسانی می‌شود
- اگر 10 دقیقه هیچ فعالیتی انجام نشود، سبد خرید به صورت خودکار پاک می‌شود
- Frontend می‌تواند تایمر را نمایش دهد تا کاربر بداند چقدر زمان باقی مانده

---

## 📊 ساختار Response جدید

### Endpoint: `GET /site/cart`

**Response:**

```json
{
  "cart": {
    "_id": "cart_123456",
    "user": "user_789",
    "sessionId": null,
    "subtotal": 0,
    "discount": 0,
    "total": 0,
    "lastActivityAt": "2024-12-15T10:30:00.000Z",
    "expiresAt": "2024-12-15T10:40:00.000Z",
    "createdAt": "2024-12-15T10:30:00.000Z",
    "updatedAt": "2024-12-15T10:35:00.000Z"
  },
  "items": [
    {
      "_id": "item_1",
      "product": {
        "_id": "product_123",
        "name": "دستبند طلا",
        "slug": "dastband-tala",
        "code": "PRD-001",
        "price": 5000000,
        "discountPrice": 4500000,
        "images": ["/images/products/product1.webp"],
        "stock": 10,
        "productType": "jewelry"
      },
      "quantity": 2,
      "size": "16",
      "price": 4500000,
      "createdAt": "2024-12-15T10:30:00.000Z",
      "updatedAt": "2024-12-15T10:35:00.000Z"
    }
  ],
  "itemCount": 1,
  "totalItems": 2,
  "totalPrice": 9000000,
  "expiresAt": "2024-12-15T10:40:00.000Z",
  "remainingSeconds": 300,
  "prices": {
    "totalWithoutDiscount": 10000000,
    "totalWithDiscount": 9000000,
    "totalSavings": 1000000,
    "savingsPercentage": 10
  }
}
```

### فیلدهای جدید:

| فیلد | نوع | توضیحات |
|------|-----|---------|
| `itemCount` | number | تعداد آیتم‌های مختلف در سبد (length of items) |
| `totalItems` | number | تعداد کل محصولات (مجموع quantity همه آیتم‌ها) |
| `totalPrice` | number | قیمت کل سبد خرید (با تخفیف) |
| `expiresAt` | Date | زمان انقضای سبد خرید |
| `remainingSeconds` | number | زمان باقی‌مانده تا انقضا (به ثانیه) |
| `cart.lastActivityAt` | Date | آخرین زمان فعالیت در سبد |
| `cart.expiresAt` | Date | زمان انقضای سبد |

---

## 💻 تغییرات مورد نیاز در Frontend

### 1️⃣ به‌روزرسانی Type Definitions

```typescript
// src/types/cart.ts

export interface Cart {
  _id: string;
  user?: string;
  sessionId?: string;
  subtotal: number;
  discount: number;
  total: number;
  lastActivityAt: string; // ✨ جدید
  expiresAt: string; // ✨ جدید
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    slug: string;
    code: string;
    price: number;
    discountPrice?: number;
    images: string[];
    stock: number;
    productType: 'jewelry' | 'coin' | 'melted_gold';
  };
  quantity: number;
  size?: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartResponse {
  cart: Cart;
  items: CartItem[];
  itemCount: number; // ✨ جدید - تعداد آیتم‌های مختلف
  totalItems: number; // ✨ جدید - تعداد کل محصولات
  totalPrice: number; // ✨ جدید - قیمت کل
  expiresAt: string; // ✨ جدید - زمان انقضا
  remainingSeconds: number; // ✨ جدید - زمان باقی‌مانده (ثانیه)
  prices: {
    totalWithoutDiscount: number;
    totalWithDiscount: number;
    totalSavings: number;
    savingsPercentage: number;
  };
}
```

### 2️⃣ استفاده از فیلدهای جدید

```typescript
// قبل: Frontend باید خودش محاسبه می‌کرد
const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
const totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

// بعد: از Backend استفاده کنید
const totalItems = cartResponse.totalItems; // ✅
const totalPrice = cartResponse.totalPrice; // ✅
const itemCount = cartResponse.itemCount; // ✅
```

### 3️⃣ نمایش تایمر

```typescript
// components/CartTimer.tsx
import { useEffect, useState } from 'react';

interface CartTimerProps {
  remainingSeconds: number;
  onExpired?: () => void;
}

export default function CartTimer({ remainingSeconds, onExpired }: CartTimerProps) {
  const [seconds, setSeconds] = useState(remainingSeconds);

  useEffect(() => {
    setSeconds(remainingSeconds);
  }, [remainingSeconds]);

  useEffect(() => {
    if (seconds <= 0) {
      onExpired?.();
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          onExpired?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onExpired]);

  const minutes = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;

  return (
    <div className="cart-timer">
      <span className="text-warning">
        ⏱️ زمان باقی‌مانده: {String(minutes).padStart(2, '0')}:
        {String(remainingSecs).padStart(2, '0')}
      </span>
      {seconds < 60 && (
        <span className="text-danger"> - سبد خرید به زودی پاک می‌شود!</span>
      )}
    </div>
  );
}
```

### 4️⃣ استفاده در صفحه سبد خرید

```typescript
// pages/cart.tsx یا components/CartPage.tsx
import { useEffect, useState } from 'react';
import CartTimer from '@/components/CartTimer';
import { getCart } from '@/lib/api/cart';

export default function CartPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const response = await getCart();
      setCart(response);
    } catch (error) {
      console.error('خطا در دریافت سبد خرید:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCartExpired = () => {
    // وقتی سبد منقضی شد
    setCart(null);
    alert('سبد خرید شما منقضی شده است. لطفاً دوباره محصولات را اضافه کنید.');
  };

  if (loading) {
    return <div>در حال بارگذاری...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return <div>سبد خرید شما خالی است</div>;
  }

  return (
    <div className="cart-page">
      {/* نمایش تایمر */}
      <CartTimer
        remainingSeconds={cart.remainingSeconds}
        onExpired={handleCartExpired}
      />

      {/* نمایش تعداد محصولات */}
      <div className="cart-summary">
        <p>تعداد آیتم‌ها: {cart.itemCount}</p>
        <p>تعداد کل محصولات: {cart.totalItems}</p>
        <p>قیمت کل: {cart.totalPrice.toLocaleString('fa-IR')} تومان</p>
      </div>

      {/* لیست محصولات */}
      <div className="cart-items">
        {cart.items.map((item) => (
          <CartItemCard key={item._id} item={item} />
        ))}
      </div>

      {/* خلاصه قیمت */}
      <div className="cart-totals">
        <p>قیمت بدون تخفیف: {cart.prices.totalWithoutDiscount.toLocaleString('fa-IR')} تومان</p>
        <p>تخفیف: {cart.prices.totalSavings.toLocaleString('fa-IR')} تومان ({cart.prices.savingsPercentage}%)</p>
        <p className="total-price">
          قیمت نهایی: {cart.totalPrice.toLocaleString('fa-IR')} تومان
        </p>
      </div>
    </div>
  );
}
```

### 5️⃣ به‌روزرسانی Header/Navbar (نمایش تعداد محصولات)

```typescript
// components/Header.tsx
import { useCart } from '@/hooks/useCart';

export default function Header() {
  const { cart, loading } = useCart();

  return (
    <header>
      <nav>
        {/* سایر منوها */}
        
        {/* آیکون سبد خرید با تعداد */}
        <Link href="/cart">
          <div className="cart-icon">
            🛒
            {cart && cart.totalItems > 0 && (
              <span className="cart-badge">{cart.totalItems}</span>
            )}
          </div>
        </Link>
      </nav>
    </header>
  );
}
```

### 6️⃣ Hook برای مدیریت سبد خرید

```typescript
// hooks/useCart.ts
import { useState, useEffect } from 'react';
import { getCart, addToCart, updateCartItem, removeFromCart } from '@/lib/api/cart';
import { CartResponse } from '@/types/cart';

export function useCart() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCart();
      setCart(response);
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت سبد خرید');
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (productId: string, quantity: number = 1, size?: string) => {
    try {
      const response = await addToCart(productId, quantity, size);
      setCart(response);
      return response;
    } catch (err: any) {
      setError(err.message || 'خطا در افزودن محصول');
      throw err;
    }
  };

  const updateItem = async (itemId: string, quantity: number) => {
    try {
      const response = await updateCartItem(itemId, quantity);
      setCart(response);
      return response;
    } catch (err: any) {
      setError(err.message || 'خطا در به‌روزرسانی محصول');
      throw err;
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const response = await removeFromCart(itemId);
      setCart(response);
      return response;
    } catch (err: any) {
      setError(err.message || 'خطا در حذف محصول');
      throw err;
    }
  };

  return {
    cart,
    loading,
    error,
    reload: loadCart,
    addItem,
    updateItem,
    removeItem,
    // Helper functions
    totalItems: cart?.totalItems || 0,
    itemCount: cart?.itemCount || 0,
    totalPrice: cart?.totalPrice || 0,
    remainingSeconds: cart?.remainingSeconds || 0,
  };
}
```

### 7️⃣ به‌روزرسانی API Functions

```typescript
// lib/api/cart.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export interface CartResponse {
  cart: Cart;
  items: CartItem[];
  itemCount: number; // ✨ جدید
  totalItems: number; // ✨ جدید
  totalPrice: number; // ✨ جدید
  expiresAt: string; // ✨ جدید
  remainingSeconds: number; // ✨ جدید
  prices: {
    totalWithoutDiscount: number;
    totalWithDiscount: number;
    totalSavings: number;
    savingsPercentage: number;
  };
}

export async function getCart(): Promise<CartResponse> {
  const response = await fetch(`${API_BASE_URL}/site/cart`, {
    credentials: 'include', // برای ارسال Cookie
    headers: {
      'Authorization': `Bearer ${getToken()}`, // اگر لاگین باشد
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      // سبد خرید وجود ندارد یا منقضی شده
      return {
        cart: null,
        items: [],
        itemCount: 0,
        totalItems: 0,
        totalPrice: 0,
        expiresAt: null,
        remainingSeconds: 0,
        prices: {
          totalWithoutDiscount: 0,
          totalWithDiscount: 0,
          totalSavings: 0,
          savingsPercentage: 0,
        },
      };
    }
    throw new Error('خطا در دریافت سبد خرید');
  }

  return response.json();
}

export async function addToCart(
  productId: string,
  quantity: number = 1,
  size?: string,
): Promise<CartResponse> {
  const response = await fetch(`${API_BASE_URL}/site/cart/add-to-cart/:cartId`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify({
      productId,
      quantity,
      size,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'خطا در افزودن محصول');
  }

  return response.json();
}
```

---

## ⚠️ نکات مهم

### 1. به‌روزرسانی خودکار تایمر

هر بار که کاربر عملیاتی انجام می‌دهد (افزودن، حذف، تغییر تعداد)، Backend به صورت خودکار `remainingSeconds` را به‌روزرسانی می‌کند. شما باید تایمر را دوباره از response بگیرید:

```typescript
const handleAddToCart = async () => {
  const updatedCart = await addToCart(productId);
  // تایمر به صورت خودکار به‌روزرسانی می‌شود
  setCart(updatedCart);
};
```

### 2. مدیریت انقضای سبد

اگر سبد منقضی شود، Backend خطای 404 برمی‌گرداند:

```typescript
try {
  const cart = await getCart();
} catch (error) {
  if (error.status === 404) {
    // سبد منقضی شده یا وجود ندارد
    setCart(null);
    showMessage('سبد خرید شما منقضی شده است');
  }
}
```

### 3. نمایش هشدار

وقتی زمان باقی‌مانده کمتر از 1 دقیقه است، هشدار نمایش دهید:

```typescript
{remainingSeconds < 60 && (
  <div className="alert alert-warning">
    ⚠️ سبد خرید شما به زودی پاک می‌شود!
  </div>
)}
```

### 4. استفاده از فیلدهای محاسبه شده

**❌ غلط:**
```typescript
// محاسبه در Frontend
const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
```

**✅ درست:**
```typescript
// استفاده از مقدار Backend
const totalItems = cart.totalItems;
```

---

## 📝 چک‌لیست پیاده‌سازی

- [ ] به‌روزرسانی Type Definitions (`CartResponse`)
- [ ] حذف محاسبات دستی `totalItems` و `totalPrice` از Frontend
- [ ] استفاده از `cart.totalItems` و `cart.totalPrice` از Backend
- [ ] ایجاد کامپوننت `CartTimer` برای نمایش تایمر
- [ ] اضافه کردن تایمر به صفحه سبد خرید
- [ ] مدیریت خطای 404 (سبد منقضی شده)
- [ ] به‌روزرسانی Header برای نمایش `totalItems`
- [ ] تست تایمر و به‌روزرسانی خودکار
- [ ] تست پاک شدن خودکار بعد از 10 دقیقه

---

## 🎨 مثال کامل کامپوننت سبد خرید

```typescript
// components/Cart.tsx
'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/hooks/useCart';
import CartTimer from './CartTimer';
import CartItemCard from './CartItemCard';

export default function Cart() {
  const {
    cart,
    loading,
    error,
    totalItems,
    totalPrice,
    remainingSeconds,
    updateItem,
    removeItem,
  } = useCart();

  const handleExpired = () => {
    alert('سبد خرید شما منقضی شده است');
    window.location.reload();
  };

  if (loading) {
    return <div>در حال بارگذاری...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-cart">
        <p>سبد خرید شما خالی است</p>
        <a href="/products">مشاهده محصولات</a>
      </div>
    );
  }

  return (
    <div className="cart-container">
      {/* تایمر */}
      <CartTimer
        remainingSeconds={remainingSeconds}
        onExpired={handleExpired}
      />

      {/* خلاصه */}
      <div className="cart-summary">
        <h2>سبد خرید شما</h2>
        <p>تعداد آیتم‌ها: {cart.itemCount}</p>
        <p>تعداد کل: {totalItems}</p>
      </div>

      {/* لیست محصولات */}
      <div className="cart-items">
        {cart.items.map((item) => (
          <CartItemCard
            key={item._id}
            item={item}
            onUpdate={(quantity) => updateItem(item._id, quantity)}
            onRemove={() => removeItem(item._id)}
          />
        ))}
      </div>

      {/* خلاصه قیمت */}
      <div className="cart-totals">
        <div className="total-row">
          <span>قیمت بدون تخفیف:</span>
          <span>{cart.prices.totalWithoutDiscount.toLocaleString('fa-IR')} تومان</span>
        </div>
        <div className="total-row discount">
          <span>تخفیف:</span>
          <span>
            -{cart.prices.totalSavings.toLocaleString('fa-IR')} تومان (
            {cart.prices.savingsPercentage}%)
          </span>
        </div>
        <div className="total-row final">
          <span>قیمت نهایی:</span>
          <span>{totalPrice.toLocaleString('fa-IR')} تومان</span>
        </div>
      </div>

      {/* دکمه پرداخت */}
      <button className="checkout-btn">ادامه به پرداخت</button>
    </div>
  );
}
```

---

## 🚀 تست

### تست 1: نمایش تعداد محصولات

```typescript
// باید از Backend استفاده شود
expect(cart.totalItems).toBe(5); // نه محاسبه دستی
expect(cart.itemCount).toBe(3); // 3 محصول مختلف
```

### تست 2: نمایش تایمر

```typescript
// تایمر باید از remainingSeconds استفاده کند
expect(cart.remainingSeconds).toBeGreaterThan(0);
expect(cart.remainingSeconds).toBeLessThanOrEqual(600); // حداکثر 10 دقیقه
```

### تست 3: انقضای سبد

```typescript
// بعد از 10 دقیقه، سبد باید پاک شود
// Backend به صورت خودکار این کار را انجام می‌دهد
```

---

## 📞 پشتیبانی

اگر مشکلی داشتید:

1. ✅ بررسی کنید که Backend در حال اجرا است (`http://localhost:4001`)
2. ✅ بررسی کنید که Type definitions به‌روزرسانی شده‌اند
3. ✅ Response را در Console/Network tab بررسی کنید
4. ✅ مطمئن شوید که `remainingSeconds` به درستی نمایش داده می‌شود

---

**موفق باشید! 🎉**

