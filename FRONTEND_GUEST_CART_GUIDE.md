# 🛒 راهنمای سبد خرید مهمان (Guest Cart) - Frontend

تاریخ: دسامبر 2024  
وضعیت: ✅ Backend آماده - Frontend نیاز به پیاده‌سازی دارد

---

## 📋 خلاصه تغییرات

Backend حالا از **کاربران مهمان** (Guest Users) پشتیبانی می‌کند:

- ✅ کاربران می‌توانند **بدون لاگین** محصول به سبد اضافه کنند
- ✅ کاربران می‌توانند **بدون لاگین** سبد را مشاهده و ویرایش کنند
- ✅ فقط هنگام **پرداخت** نیاز به لاگین است
- ✅ وقتی کاربر لاگین می‌کند، سبد مهمان به حساب کاربری **merge** می‌شود

---

## 🎯 نحوه کار

### 1. کاربر مهمان (بدون لاگین)

```
1. کاربر وارد سایت می‌شود (بدون لاگین)
2. وقتی محصولی اضافه می‌کند (بدون sessionId در Cookie):
   - Backend به صورت خودکار یک sessionId ایجاد می‌کند
   - sessionId در response برگردانده می‌شود
   - Frontend باید sessionId را در Cookie ذخیره کند
3. Backend سبد خرید با sessionId ایجاد می‌کند:
   - user = null, sessionId = "session_123456_abc..."
4. سبد خرید موقت است و بعد از 10 دقیقه پاک می‌شود
```

**⚠️ نکته مهم:** Backend خودش `sessionId` ایجاد می‌کند. Frontend فقط باید آن را از response بگیرد و در Cookie ذخیره کند.

### 2. کاربر لاگین می‌کند

```
1. کاربر مهمان سبد خرید دارد (با sessionId)
2. کاربر لاگین می‌کند
3. Frontend باید endpoint merge را صدا بزند
4. Backend سبد مهمان را به حساب کاربری merge می‌کند:
   - آیتم‌های سبد مهمان را به سبد کاربر اضافه می‌کند
   - سبد مهمان را حذف می‌کند
```

---

## 🔌 API Endpoints

### Base URL

```
http://localhost:4001/site/cart
```

### تغییرات مهم:

- ✅ **JWT Token اختیاری است** - اگر ارسال نشود، به عنوان مهمان در نظر گرفته می‌شود
- ✅ **sessionId از Cookie خوانده می‌شود** - باید در Cookie با نام `sessionId` ذخیره شود
- ✅ **Backend خودش sessionId ایجاد می‌کند** - اگر sessionId در Cookie وجود نداشته باشد، Backend یک sessionId جدید ایجاد می‌کند و در response برمی‌گرداند
- ✅ **Frontend باید sessionId را از response بگیرد و در Cookie ذخیره کند**

---

## 📝 Endpoint ها

### 1️⃣ دریافت سبد خرید

**GET** `/site/cart`

#### Request Headers:

```http
# اگر لاگین باشد (اختیاری):
Authorization: Bearer <token>

# sessionId در Cookie (برای مهمان):
Cookie: sessionId=<sessionId>
```

#### Response (200 OK):

```json
{
  "cart": {
    "_id": "cart_123456",
    "user": "user_789", // null اگر مهمان باشد
    "sessionId": "session_abc", // null اگر لاگین باشد
    "expiresAt": "2024-12-15T10:40:00.000Z",
    "lastActivityAt": "2024-12-15T10:30:00.000Z"
  },
  "items": [...],
  "itemCount": 1,
  "totalItems": 2,
  "totalPrice": 9000000,
  "remainingSeconds": 300,
  "sessionId": "session_abc", // ✨ اگر Backend sessionId ایجاد کرده باشد (برای ذخیره در Cookie)
  "prices": {...}
}
```

**⚠️ نکته مهم:** اگر `sessionId` در Cookie وجود نداشته باشد، Backend به صورت خودکار یک `sessionId` ایجاد می‌کند و در response برمی‌گرداند. Frontend باید این `sessionId` را در Cookie ذخیره کند.

#### Response (سبد خالی):

```json
{
  "cart": null,
  "items": [],
  "itemCount": 0,
  "totalItems": 0,
  "totalPrice": 0,
  "expiresAt": null,
  "remainingSeconds": 0,
  "prices": {
    "totalWithoutDiscount": 0,
    "totalWithDiscount": 0,
    "totalSavings": 0,
    "savingsPercentage": 0
  }
}
```

---

### 2️⃣ افزودن محصول به سبد

**POST** `/site/cart`

#### Request Headers:

```http
# اگر لاگین باشد (اختیاری):
Authorization: Bearer <token>

# sessionId در Cookie (برای مهمان):
Cookie: sessionId=<sessionId>
```

#### Request Body:

```json
{
  "productId": "product_123",
  "quantity": 1,
  "size": "16" // اختیاری (برای جواهرات)
}
```

#### Response (200 OK):

```json
{
  "cart": {...},
  "items": [...],
  "itemCount": 1,
  "totalItems": 1,
  "totalPrice": 5000000,
  "remainingSeconds": 600,
  "sessionId": "session_abc", // ✨ اگر Backend sessionId ایجاد کرده باشد
  "prices": {...}
}
```

**⚠️ نکته مهم:** اگر `sessionId` در Cookie وجود نداشته باشد، Backend به صورت خودکار یک `sessionId` ایجاد می‌کند. Frontend باید این `sessionId` را در Cookie ذخیره کند.

---

### 3️⃣ Merge کردن سبد مهمان به حساب کاربری

**POST** `/site/cart/merge`

**⚠️ مهم:** این endpoint باید **بعد از لاگین** صدا زده شود.

#### Request Headers:

```http
Authorization: Bearer <token>  # اجباری - باید لاگین باشد
Cookie: sessionId=<sessionId>  # sessionId مهمان
```

#### Response (200 OK):

```json
{
  "cart": {
    "_id": "cart_789",
    "user": "user_789", // حالا به کاربر متصل است
    "sessionId": null,  // دیگر sessionId ندارد
    ...
  },
  "items": [...], // آیتم‌های merge شده
  "itemCount": 2,
  "totalItems": 3,
  "totalPrice": 15000000,
  ...
}
```

---

## 💻 پیاده‌سازی در Frontend

### 1️⃣ مدیریت SessionId

```typescript
// utils/session.ts
import Cookies from 'js-cookie'; // یا هر کتابخانه Cookie دیگر

const SESSION_ID_KEY = 'sessionId';
const SESSION_ID_EXPIRY_DAYS = 30; // 30 روز

/**
 * دریافت sessionId از Cookie
 * ⚠️ مهم: اگر sessionId وجود نداشت، null برگردان
 * Backend خودش sessionId ایجاد می‌کند و در response برمی‌گرداند
 */
export function getSessionId(): string | null {
  return Cookies.get(SESSION_ID_KEY) || null;
}

/**
 * ذخیره sessionId در Cookie
 * این متد باید بعد از دریافت response از Backend صدا زده شود
 */
export function setSessionId(sessionId: string): void {
  Cookies.set(SESSION_ID_KEY, sessionId, {
    expires: SESSION_ID_EXPIRY_DAYS,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

/**
 * حذف sessionId (بعد از merge)
 */
export function removeSessionId(): void {
  Cookies.remove(SESSION_ID_KEY);
}
```

### 2️⃣ به‌روزرسانی API Functions

```typescript
// lib/api/cart.ts
import { getSessionId, setSessionId, removeSessionId } from '@/utils/session';
import { getToken } from '@/utils/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export interface CartResponse {
  cart: Cart | null;
  items: CartItem[];
  itemCount: number;
  totalItems: number;
  totalPrice: number;
  expiresAt: string | null;
  remainingSeconds: number;
  sessionId?: string; // ✨ اگر Backend sessionId ایجاد کرده باشد
  prices: {
    totalWithoutDiscount: number;
    totalWithDiscount: number;
    totalSavings: number;
    savingsPercentage: number;
  };
}

/**
 * دریافت سبد خرید
 */
export async function getCart(): Promise<CartResponse> {
  const token = getToken(); // اگر لاگین باشد
  const sessionId = getSessionId(); // برای مهمان (از Cookie)

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // اگر لاگین باشد، JWT Token را اضافه کن
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/site/cart`, {
    method: 'GET',
    credentials: 'include', // برای ارسال Cookie
    headers,
  });

  if (!response.ok) {
    if (response.status === 404) {
      // سبد خرید وجود ندارد یا منقضی شده
      return getEmptyCartResponse();
    }
    throw new Error('خطا در دریافت سبد خرید');
  }

  const data = await response.json();

  // ✨ اگر Backend sessionId ایجاد کرده باشد، آن را در Cookie ذخیره کن
  if (data.sessionId) {
    setSessionId(data.sessionId);
  }

  return data;
}

/**
 * افزودن محصول به سبد
 */
export async function addToCart(
  productId: string,
  quantity: number = 1,
  size?: string,
): Promise<CartResponse> {
  const token = getToken();
  const sessionId = getSessionId(); // از Cookie

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/site/cart`, {
    method: 'POST',
    credentials: 'include',
    headers,
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

  const data = await response.json();

  // ✨ اگر Backend sessionId ایجاد کرده باشد، آن را در Cookie ذخیره کن
  if (data.sessionId) {
    setSessionId(data.sessionId);
  }

  return data;
}

/**
 * Merge کردن سبد مهمان به حساب کاربری
 * ⚠️ باید بعد از لاگین صدا زده شود
 */
export async function mergeCart(): Promise<CartResponse> {
  const token = getToken();

  if (!token) {
    throw new Error('برای merge کردن سبد، باید لاگین باشید');
  }

  const sessionId = getOrCreateSessionId();

  const response = await fetch(`${API_BASE_URL}/site/cart/merge`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('خطا در merge کردن سبد');
  }

  const result = await response.json();

  // بعد از merge موفق، sessionId را حذف کن
  removeSessionId();

  return result;
}

/**
 * Response خالی برای سبد
 */
function getEmptyCartResponse(): CartResponse {
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
```

### 3️⃣ Hook برای مدیریت سبد خرید

```typescript
// hooks/useCart.ts
import { useState, useEffect } from 'react';
import { getCart, addToCart, mergeCart } from '@/lib/api/cart';
import { CartResponse } from '@/types/cart';
import { useAuth } from '@/hooks/useAuth';

export function useCart() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    loadCart();
  }, []);

  // وقتی کاربر لاگین می‌کند، سبد را merge کن
  useEffect(() => {
    if (isAuthenticated && cart?.cart?.sessionId) {
      handleMergeCart();
    }
  }, [isAuthenticated]);

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

  const addItem = async (
    productId: string,
    quantity: number = 1,
    size?: string,
  ) => {
    try {
      const response = await addToCart(productId, quantity, size);
      setCart(response);
      return response;
    } catch (err: any) {
      setError(err.message || 'خطا در افزودن محصول');
      throw err;
    }
  };

  const handleMergeCart = async () => {
    try {
      const response = await mergeCart();
      setCart(response);
    } catch (err: any) {
      console.error('خطا در merge کردن سبد:', err);
      // اگر merge خطا داد، فقط سبد را reload کن
      loadCart();
    }
  };

  return {
    cart,
    loading,
    error,
    reload: loadCart,
    addItem,
    totalItems: cart?.totalItems || 0,
    itemCount: cart?.itemCount || 0,
    totalPrice: cart?.totalPrice || 0,
    remainingSeconds: cart?.remainingSeconds || 0,
    isGuest: !cart?.cart?.user && !!cart?.cart?.sessionId,
  };
}
```

### 4️⃣ استفاده در کامپوننت

```typescript
// components/AddToCartButton.tsx
'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';

interface AddToCartButtonProps {
  productId: string;
  size?: string;
}

export default function AddToCartButton({
  productId,
  size,
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const { addItem } = useCart();

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      await addItem(productId, 1, size);
      alert('محصول به سبد خرید اضافه شد');
    } catch (error: any) {
      alert(error.message || 'خطا در افزودن محصول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading}
      className="add-to-cart-btn"
    >
      {loading ? 'در حال افزودن...' : 'افزودن به سبد خرید'}
    </button>
  );
}
```

### 5️⃣ مدیریت لاگین و Merge

```typescript
// hooks/useAuth.ts یا در صفحه لاگین
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { mergeCart } from '@/lib/api/cart';

export function LoginPage() {
  const { login } = useAuth();
  const { cart, reload } = useCart();

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      // لاگین کردن
      await login(credentials);

      // اگر سبد مهمان وجود داشت، merge کن
      if (cart?.cart?.sessionId) {
        await mergeCart();
        await reload(); // reload سبد بعد از merge
      }
    } catch (error) {
      console.error('خطا در لاگین:', error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {/* فرم لاگین */}
    </form>
  );
}
```

### 6️⃣ صفحه پرداخت (نیاز به لاگین)

```typescript
// pages/checkout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { cart, loading } = useCart();

  useEffect(() => {
    // اگر لاگین نیست، به صفحه لاگین redirect کن
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/checkout');
    }
  }, [isAuthenticated, loading]);

  if (!isAuthenticated) {
    return <div>در حال انتقال به صفحه لاگین...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return <div>سبد خرید شما خالی است</div>;
  }

  return (
    <div className="checkout-page">
      <h1>پرداخت</h1>
      {/* فرم پرداخت */}
    </div>
  );
}
```

---

## ⚠️ نکات مهم

### 1. مدیریت SessionId

- ✅ **Backend خودش sessionId ایجاد می‌کند** - اگر sessionId در Cookie وجود نداشته باشد
- ✅ **Frontend باید sessionId را از response بگیرد و در Cookie ذخیره کند**
- ✅ **بعد از merge موفق، sessionId را حذف کنید**
- ✅ **نیازی به ایجاد sessionId در Frontend نیست** - Backend این کار را انجام می‌دهد

### 2. Merge Cart

- ✅ **بعد از لاگین موفق، حتماً merge را صدا بزنید**
- ✅ **اگر merge خطا داد، فقط سبد را reload کنید** (Backend خودش مدیریت می‌کند)

### 3. JWT Token

- ✅ **JWT Token اختیاری است** - اگر ارسال نشود، به عنوان مهمان در نظر گرفته می‌شود
- ✅ **اگر Token وجود داشت، از userId استفاده می‌شود**
- ✅ **اگر Token وجود نداشت، از sessionId استفاده می‌شود**

### 4. Cookie Settings

```typescript
// تنظیمات Cookie باید این‌گونه باشد:
Cookies.set('sessionId', sessionId, {
  expires: 30, // 30 روز
  sameSite: 'lax', // برای CORS
  secure: process.env.NODE_ENV === 'production', // فقط در production
});
```

---

## 📝 چک‌لیست پیاده‌سازی

- [ ] ایجاد utility برای مدیریت sessionId
- [ ] به‌روزرسانی API functions برای ارسال sessionId در Cookie
- [ ] به‌روزرسانی Hook useCart برای مدیریت مهمان
- [ ] اضافه کردن منطق merge بعد از لاگین
- [ ] تست افزودن محصول بدون لاگین
- [ ] تست مشاهده سبد بدون لاگین
- [ ] تست merge بعد از لاگین
- [ ] تست پرداخت (باید لاگین باشد)
- [ ] تست تایمر 10 دقیقه‌ای

---

## 🎨 مثال کامل Flow

### سناریو 1: کاربر مهمان

```typescript
// 1. کاربر وارد سایت می‌شود
const sessionId = getOrCreateSessionId(); // ایجاد sessionId

// 2. محصول اضافه می‌کند (بدون لاگین)
await addToCart('product_123', 1); // sessionId در Cookie ارسال می‌شود

// 3. سبد را می‌بیند
const cart = await getCart(); // sessionId در Cookie ارسال می‌شود
// cart.cart.sessionId = "abc123"
// cart.cart.user = null
```

### سناریو 2: کاربر لاگین می‌کند

```typescript
// 1. کاربر لاگین می‌کند
await login(credentials);

// 2. Merge سبد مهمان
if (cart?.cart?.sessionId) {
  await mergeCart(); // سبد مهمان به حساب کاربری merge می‌شود
  removeSessionId(); // sessionId حذف می‌شود
}

// 3. حالا سبد به حساب کاربری متصل است
const cart = await getCart(); // JWT Token ارسال می‌شود
// cart.cart.user = "user_789"
// cart.cart.sessionId = null
```

### سناریو 3: پرداخت

```typescript
// 1. کاربر به صفحه پرداخت می‌رود
// 2. بررسی می‌شود که لاگین است یا نه
if (!isAuthenticated) {
  redirect('/login?redirect=/checkout');
}

// 3. اگر لاگین است، پرداخت انجام می‌شود
await createOrder(cartId);
```

---

## 🐛 رفع مشکلات

### مشکل 1: sessionId در Cookie ذخیره نمی‌شود

**راه‌حل:**

```typescript
// مطمئن شوید که credentials: 'include' را استفاده می‌کنید
fetch(url, {
  credentials: 'include', // ✅ مهم!
});
```

### مشکل 2: Merge انجام نمی‌شود

**راه‌حل:**

```typescript
// مطمئن شوید که بعد از لاگین، merge را صدا می‌زنید
useEffect(() => {
  if (isAuthenticated && cart?.cart?.sessionId) {
    mergeCart();
  }
}, [isAuthenticated]);
```

### مشکل 3: سبد بعد از لاگین خالی می‌شود

**راه‌حل:**

```typescript
// بعد از merge، سبد را reload کنید
await mergeCart();
await reload(); // ✅ مهم!
```

---

## 📞 پشتیبانی

اگر مشکلی داشتید:

1. ✅ بررسی کنید که sessionId در Cookie ذخیره می‌شود
2. ✅ بررسی کنید که `credentials: 'include'` را استفاده می‌کنید
3. ✅ بررسی کنید که بعد از لاگین، merge را صدا می‌زنید
4. ✅ Response را در Console/Network tab بررسی کنید

---

**موفق باشید! 🎉**
