# 🔧 رفع مشکل افزودن محصول دوم به سبد خرید - Frontend

تاریخ: دسامبر 2024  
وضعیت: ✅ Backend اصلاح شده - Frontend نیاز به بررسی دارد

---

## 📋 مشکل

وقتی کاربر:

1. محصول اول را به سبد اضافه می‌کند ✅
2. از صفحه سبد خارج می‌شود
3. محصول دوم را اضافه می‌کند ❌

**مشکل:** محصول دوم به سبد موجود اضافه نمی‌شود و سبد جدید ایجاد می‌شود.

---

## 🔍 علت مشکل

مشکل از **Frontend** است: `sessionId` در Cookie ذخیره نمی‌شود یا به درستی ارسال نمی‌شود.

### نحوه کار Backend:

```
1. کاربر محصول اول را اضافه می‌کند
   → Backend یک sessionId ایجاد می‌کند
   → sessionId در response برمی‌گردد: { ..., sessionId: "session_123" }

2. Frontend باید sessionId را در Cookie ذخیره کند
   → Cookies.set('sessionId', 'session_123')

3. وقتی کاربر محصول دوم را اضافه می‌کند
   → Frontend باید sessionId را از Cookie بخواند
   → sessionId را در Cookie ارسال کند
   → Backend سبد موجود را پیدا می‌کند ✅
```

---

## ✅ راه‌حل

### 1️⃣ بررسی: آیا sessionId در Cookie ذخیره می‌شود؟

**❌ اگر این کار را نمی‌کنید:**

```typescript
// ❌ غلط - sessionId را ذخیره نمی‌کند
const response = await addToCart(productId);
// sessionId از دست می‌رود!
```

**✅ باید این کار را انجام دهید:**

```typescript
// ✅ درست - sessionId را ذخیره می‌کند
const response = await addToCart(productId);
if (response.sessionId) {
  Cookies.set('sessionId', response.sessionId, {
    expires: 30,
    sameSite: 'lax',
  });
}
```

---

## 💻 تغییرات مورد نیاز در Frontend

### 1️⃣ به‌روزرسانی API Functions

```typescript
// lib/api/cart.ts
import Cookies from 'js-cookie';

export async function addToCart(
  productId: string,
  quantity: number = 1,
  size?: string,
): Promise<CartResponse> {
  const token = getToken();
  const sessionId = Cookies.get('sessionId'); // ✅ از Cookie بخوان

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/site/cart`, {
    method: 'POST',
    credentials: 'include', // ✅ مهم: برای ارسال Cookie
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

  // ✅ اگر Backend sessionId ایجاد کرده باشد، آن را در Cookie ذخیره کن
  if (data.sessionId) {
    Cookies.set('sessionId', data.sessionId, {
      expires: 30, // 30 روز
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return data;
}
```

### 2️⃣ به‌روزرسانی Hook useCart

```typescript
// hooks/useCart.ts
import { useState, useEffect } from 'react';
import { getCart, addToCart } from '@/lib/api/cart';
import { CartResponse } from '@/types/cart';
import Cookies from 'js-cookie';

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

      // ✅ اگر sessionId در response بود، ذخیره کن
      if (response.sessionId) {
        Cookies.set('sessionId', response.sessionId, {
          expires: 30,
          sameSite: 'lax',
        });
      }

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

      // ✅ اگر sessionId در response بود، ذخیره کن
      if (response.sessionId) {
        Cookies.set('sessionId', response.sessionId, {
          expires: 30,
          sameSite: 'lax',
        });
      }

      setCart(response);
      return response;
    } catch (err: any) {
      setError(err.message || 'خطا در افزودن محصول');
      throw err;
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
  };
}
```

### 3️⃣ به‌روزرسانی getCart Function

```typescript
// lib/api/cart.ts
export async function getCart(): Promise<CartResponse> {
  const token = getToken();
  const sessionId = Cookies.get('sessionId'); // ✅ از Cookie بخوان

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/site/cart`, {
    method: 'GET',
    credentials: 'include', // ✅ مهم: برای ارسال Cookie
    headers,
  });

  if (!response.ok) {
    if (response.status === 404) {
      return getEmptyCartResponse();
    }
    throw new Error('خطا در دریافت سبد خرید');
  }

  const data = await response.json();

  // ✅ اگر Backend sessionId ایجاد کرده باشد، آن را در Cookie ذخیره کن
  if (data.sessionId) {
    Cookies.set('sessionId', data.sessionId, {
      expires: 30,
      sameSite: 'lax',
    });
  }

  return data;
}
```

---

## 🔍 تشخیص مشکل

### تست 1: بررسی Cookie

```typescript
// در Console مرورگر اجرا کنید
console.log(document.cookie);
// باید sessionId را ببینید: sessionId=session_123456_abc...
```

### تست 2: بررسی Network Tab

1. Developer Tools را باز کنید (F12)
2. به تب Network بروید
3. محصول را اضافه کنید
4. درخواست `POST /site/cart` را بررسی کنید
5. در Headers → Request Headers → Cookie باید `sessionId=...` را ببینید

**❌ اگر sessionId در Cookie نیست:**

- Frontend sessionId را ذخیره نمی‌کند
- باید کد را به‌روزرسانی کنید

**✅ اگر sessionId در Cookie است اما مشکل دارید:**

- ممکن است `credentials: 'include'` را استفاده نکرده باشید
- یا مشکل از Backend باشد (که الان اصلاح شده)

---

## ⚠️ نکات مهم

### 1. استفاده از `credentials: 'include'`

**❌ غلط:**

```typescript
fetch(url, {
  method: 'POST',
  // credentials وجود ندارد ❌
});
```

**✅ درست:**

```typescript
fetch(url, {
  method: 'POST',
  credentials: 'include', // ✅ برای ارسال Cookie
});
```

### 2. ذخیره sessionId بعد از هر Response

```typescript
// ✅ همیشه بعد از دریافت response، sessionId را چک کن
const response = await addToCart(productId);
if (response.sessionId) {
  Cookies.set('sessionId', response.sessionId);
}
```

### 3. خواندن sessionId از Cookie

```typescript
// ✅ همیشه قبل از درخواست، sessionId را از Cookie بخوان
const sessionId = Cookies.get('sessionId');
// Backend خودش sessionId را از Cookie می‌خواند
```

---

## 📝 چک‌لیست

- [ ] بررسی کنید که `sessionId` را از response می‌گیرید
- [ ] بررسی کنید که `sessionId` را در Cookie ذخیره می‌کنید
- [ ] بررسی کنید که `credentials: 'include'` را استفاده می‌کنید
- [ ] بررسی کنید که `sessionId` در Cookie ارسال می‌شود (Network Tab)
- [ ] تست کنید که محصول دوم به سبد موجود اضافه می‌شود

---

## 🧪 تست

### تست کامل Flow:

```typescript
// 1. محصول اول را اضافه کن
const response1 = await addToCart('product_1');
console.log('Response 1:', response1);
console.log('SessionId:', response1.sessionId);
console.log('Cookie:', Cookies.get('sessionId'));

// 2. از صفحه خارج شو (یا reload کن)
// 3. محصول دوم را اضافه کن
const response2 = await addToCart('product_2');
console.log('Response 2:', response2);
console.log('Items:', response2.items.length); // باید 2 باشد ✅
```

---

## 🐛 رفع مشکلات

### مشکل 1: sessionId در Cookie ذخیره نمی‌شود

**راه‌حل:**

```typescript
// مطمئن شوید که بعد از هر response، sessionId را ذخیره می‌کنید
if (response.sessionId) {
  Cookies.set('sessionId', response.sessionId, {
    expires: 30,
    sameSite: 'lax',
  });
}
```

### مشکل 2: sessionId در Cookie ارسال نمی‌شود

**راه‌حل:**

```typescript
// مطمئن شوید که credentials: 'include' را استفاده می‌کنید
fetch(url, {
  credentials: 'include', // ✅ مهم!
});
```

### مشکل 3: محصول دوم به سبد جدید اضافه می‌شود

**علت:** Backend نمی‌تواند سبد موجود را پیدا کند چون sessionId ارسال نمی‌شود.

**راه‌حل:**

1. بررسی کنید که sessionId در Cookie ذخیره می‌شود
2. بررسی کنید که sessionId در Cookie ارسال می‌شود (Network Tab)
3. بررسی کنید که `credentials: 'include'` را استفاده می‌کنید

---

## 📞 پشتیبانی

اگر بعد از این تغییرات هنوز مشکل دارید:

1. ✅ بررسی کنید که sessionId در Cookie ذخیره می‌شود
2. ✅ بررسی کنید که sessionId در Cookie ارسال می‌شود (Network Tab)
3. ✅ بررسی کنید که `credentials: 'include'` را استفاده می‌کنید
4. ✅ Response را در Console/Network tab بررسی کنید

---

## 🎯 خلاصه

### مشکل:

- محصول دوم به سبد موجود اضافه نمی‌شود

### علت:

- Frontend `sessionId` را در Cookie ذخیره نمی‌کند یا ارسال نمی‌کند

### راه‌حل:

- ✅ `sessionId` را از response بگیرید
- ✅ `sessionId` را در Cookie ذخیره کنید
- ✅ `credentials: 'include'` را استفاده کنید
- ✅ `sessionId` را در هر درخواست ارسال کنید (از طریق Cookie)

---

**موفق باشید! 🎉**
