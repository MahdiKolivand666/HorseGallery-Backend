# 🧮 همه محاسبات سایت - Backend

**تاریخ:** دسامبر 2024

**وضعیت:** ✅ **پیاده‌سازی کامل در Backend**

---

## 📋 خلاصه

**همه محاسبات مربوط به محصولات، سبد خرید، قیمت‌ها، تخفیف‌ها و تایمر در Backend انجام می‌شود.** Frontend فقط داده‌های محاسبه شده را از Backend دریافت می‌کند و نمایش می‌دهد.

**هیچ محاسبه‌ای نباید در Frontend انجام شود.**

---

## 🎯 اصل کلی

### ❌ Frontend نباید:

- محاسبه درصد تخفیف
- محاسبه قیمت با تخفیف
- محاسبه مجموع قیمت‌ها
- محاسبه تایمر (remainingSeconds)
- هرگونه محاسبه ریاضی

### ✅ Backend انجام می‌دهد:

- همه محاسبات را انجام می‌دهد
- مقادیر محاسبه شده را در response برگرداند
- Frontend فقط این مقادیر را نمایش می‌دهد

---

## 📝 تغییرات انجام شده در Backend

### 1️⃣ Product API Response

**Endpoint:** `GET /product/public`  
**Endpoint:** `GET /product/public/:slug`  
**Endpoint:** `GET /product/public/search`  
**Endpoint:** `GET /site/product`  
**Endpoint:** `GET /site/product/:url`

#### Response Structure:

```json
{
  "products": [
    {
      "_id": "product_123",
      "name": "دستبند طلا",
      "slug": "dastband-tala",
      "code": "PRD-001",
      "price": 6000000,           // ✅ قیمت اصلی
      "discountPrice": 5000000,   // ✅ قیمت با تخفیف (اختیاری)
      "discount": 16,              // ✅ درصد تخفیف (محاسبه شده) - اضافه شده
      "onSale": true,              // ✅ آیا تخفیف دارد؟ (محاسبه شده) - اضافه شده
      "images": [...],
      "stock": 10,
      "category": {...},
      ...
    }
  ]
}
```

---

## 🔢 منطق محاسبه در Backend

### برای هر Product:

```typescript
// 1. بررسی اینکه آیا محصول تخفیف دارد
const hasDiscount =
  discountPrice !== null &&
  discountPrice !== undefined &&
  discountPrice < price &&
  price > 0;

// 2. محاسبه درصد تخفیف
let discount = 0;
if (hasDiscount) {
  discount = Math.round(((price - discountPrice) / price) * 100);
}

// 3. تنظیم onSale
const onSale = hasDiscount && discount > 0;

// 4. ساخت Product Response
const productResponse = {
  _id: product._id,
  name: product.name,
  slug: product.slug,
  code: product.code,
  price: product.price,              // ✅ قیمت اصلی
  discountPrice: product.discountPrice, // ✅ قیمت با تخفیف
  discount: discount,                 // ✅ محاسبه شده
  onSale: onSale,                     // ✅ محاسبه شده
  images: product.images,
  stock: product.stock,
  category: product.category,
  ...
};
```

---

## 📍 تغییرات مورد نیاز در Frontend

### 1️⃣ صفحه جزئیات محصول (`/[category]/[slug]/page.tsx`)

**❌ محاسبه فعلی در Frontend (باید حذف شود):**

```typescript
// خط 338-343 - باید حذف شود
{
  productData.discount ||
    Math.round(
      ((productData.price - productData.discountPrice) / productData.price) *
        100,
    );
}

// خط 616-623 - باید حذف شود
{
  productData.discount ||
    Math.round(
      ((productData.price - productData.discountPrice) / productData.price) *
        100,
    );
}
```

**✅ باید از Backend استفاده شود:**

```typescript
// فقط نمایش - بدون محاسبه
{productData.discount}٪ تخفیف
```

**📍 محل:** `src/app/[category]/[slug]/page.tsx` خطوط 338-343 و 616-623

---

### 2️⃣ صفحه پرداخت (`/purchase/basket/[orderId]/page.tsx`)

**❌ محاسبات فعلی در Frontend (باید حذف شود):**

```typescript
// خط 109-120 - باید حذف شود
const subtotal = cartItems.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0,
);
const totalDiscount = cartItems.reduce(
  (sum, item) => sum + (item.discount || 0) * item.quantity,
  0,
);
const walletAmount: number = 0; // User's wallet balance
const shippingCost: number = 0; // Free shipping
const finalTotal = subtotal - totalDiscount - walletAmount + shippingCost;
const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
```

**✅ باید از Backend استفاده شود:**

```typescript
// استفاده از مقادیر از CartResponse
const subtotal = cart?.prices?.totalWithoutDiscount || 0;
const totalDiscount = cart?.prices?.totalSavings || 0;
const finalTotal =
  (cart?.prices?.totalWithDiscount || 0) - walletAmount + shippingCost;
const totalItems = cart?.totalItems || 0;
```

**📍 محل:** `src/app/purchase/basket/[orderId]/page.tsx` خطوط 108-120

**⚠️ نکته:** `walletAmount` و `shippingCost` ممکن است در frontend محاسبه شوند (بسته به منطق کسب‌وکار)

---

## 📊 مثال‌های مختلف

### مثال 1: محصول با تخفیف

```json
{
  "product": {
    "price": 6000000,
    "discountPrice": 5000000
  },
  "discount": 16, // ✅ ((6000000 - 5000000) / 6000000) * 100 = 16.67 ≈ 16
  "onSale": true // ✅ چون discountPrice < price
}
```

### مثال 2: محصول بدون تخفیف

```json
{
  "product": {
    "price": 6000000,
    "discountPrice": null
  },
  "discount": 0, // ✅ چون discountPrice === null
  "onSale": false // ✅ چون تخفیف ندارد
}
```

---

## ⚠️ نکات مهم

### 1. محاسبه `discount` در Backend

- ✅ **در Backend محاسبه می‌شود**
- ✅ **در همه Product API responses برگردانده می‌شود**
- ❌ **Frontend نباید این محاسبه را انجام دهد**

```typescript
// ✅ درست (Backend):
const discount = Math.round(
  ((product.price - product.discountPrice) / product.price) * 100,
);

// ❌ غلط (Frontend):
// Frontend نباید این محاسبه را انجام دهد!
```

---

### 2. محاسبه `onSale` در Backend

- ✅ **در Backend محاسبه می‌شود**
- ✅ **در همه Product API responses برگردانده می‌شود**
- ❌ **Frontend نباید این محاسبه را انجام دهد**

```typescript
// ✅ درست (Backend):
const onSale =
  product.discountPrice !== null && product.discountPrice < product.price;

// ❌ غلط (Frontend):
// Frontend نباید این محاسبه را انجام دهد!
```

---

### 3. محاسبه مجموع در صفحه پرداخت

- ✅ **باید از CartResponse استفاده شود**
- ✅ **همه محاسبات در Backend انجام شده است**
- ❌ **Frontend نباید این محاسبات را انجام دهد**

```typescript
// ✅ درست (Frontend):
const subtotal = cart?.prices?.totalWithoutDiscount || 0;
const finalTotal = cart?.prices?.totalWithDiscount || 0;
const totalItems = cart?.totalItems || 0;

// ❌ غلط (Frontend):
const subtotal = cartItems.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0,
);
```

---

## 📝 چک‌لیست پیاده‌سازی Frontend

### صفحه جزئیات محصول:

- [ ] حذف محاسبه `discount` (خطوط 338-343)
- [ ] حذف محاسبه `discount` (خطوط 616-623)
- [ ] استفاده از `productData.discount` از Backend

### صفحه پرداخت:

- [ ] حذف محاسبه `subtotal` (خط 109-112)
- [ ] حذف محاسبه `totalDiscount` (خط 113-116)
- [ ] حذف محاسبه `finalTotal` (خط 119)
- [ ] حذف محاسبه `totalItems` (خط 120)
- [ ] استفاده از `cart?.prices?.totalWithoutDiscount`
- [ ] استفاده از `cart?.prices?.totalSavings`
- [ ] استفاده از `cart?.prices?.totalWithDiscount`
- [ ] استفاده از `cart?.totalItems`

---

## 🧪 تست

### تست 1: محصول با تخفیف

```bash
GET /product/public/product-with-discount
```

**بررسی Response:**

```json
{
  "product": {
    "price": 6000000,
    "discountPrice": 5000000,
    "discount": 16, // ✅ باید محاسبه شده باشد
    "onSale": true // ✅ باید true باشد
  }
}
```

---

### تست 2: محصول بدون تخفیف

```bash
GET /product/public/product-without-discount
```

**بررسی Response:**

```json
{
  "product": {
    "price": 6000000,
    "discountPrice": null,
    "discount": 0, // ✅ باید 0 باشد
    "onSale": false // ✅ باید false باشد
  }
}
```

---

### تست 3: لیست محصولات

```bash
GET /product/public?category=women
```

**بررسی Response:**

```json
{
  "data": [
    {
      "price": 6000000,
      "discountPrice": 5000000,
      "discount": 16, // ✅ باید محاسبه شده باشد
      "onSale": true // ✅ باید true باشد
    },
    {
      "price": 8000000,
      "discountPrice": null,
      "discount": 0, // ✅ باید 0 باشد
      "onSale": false // ✅ باید false باشد
    }
  ]
}
```

---

## 🎯 خلاصه

### ✅ Backend انجام می‌دهد:

1. **`discount` را برای هر محصول محاسبه می‌کند**
2. **`onSale` را برای هر محصول محاسبه می‌کند**
3. **این فیلدها را در همه Product API responses برگرداند**
4. **همه محاسبات Cart را انجام می‌دهد** (قبلاً انجام شده ✅)

### ❌ Frontend نباید:

1. **`discount` را محاسبه کند**
2. **`onSale` را محاسبه کند**
3. **مجموع قیمت‌ها را در صفحه پرداخت محاسبه کند**
4. **هرگونه محاسبه ریاضی انجام دهد**

### ✅ Frontend باید:

1. **فقط `discount` و `onSale` را از Backend نمایش دهد**
2. **از `cart.prices` برای مجموع استفاده کند**
3. **از `cart.totalItems` برای تعداد کل استفاده کند**
4. **فقط داده‌های محاسبه شده را نمایش دهد**

---

## 📞 پشتیبانی

اگر مشکلی داشتید:

1. ✅ بررسی کنید که `discount` و `onSale` در Product API response وجود دارند
2. ✅ بررسی کنید که محاسبات درست انجام می‌شود
3. ✅ Response را در Console/Network tab بررسی کنید

---

**موفق باشید! 🎉**
