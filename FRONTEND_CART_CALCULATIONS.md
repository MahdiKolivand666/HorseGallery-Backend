# 🧮 محاسبات سبد خرید - Backend

**تاریخ:** دسامبر 2024

**وضعیت:** ✅ **پیاده‌سازی کامل در Backend**

---

## 📋 خلاصه

**همه محاسبات مربوط به سبد خرید در Backend انجام می‌شود.** Frontend فقط داده‌های محاسبه شده را از Backend دریافت می‌کند و نمایش می‌دهد.

**هیچ محاسبه‌ای نباید در Frontend انجام شود.**

---

## 🎯 اصل کلی

### ❌ Frontend نباید:

- محاسبه قیمت نهایی (`price * quantity`)
- محاسبه قیمت اصلی (`originalPrice * quantity`)
- محاسبه درصد تخفیف
- محاسبه مجموع قیمت‌ها
- محاسبه تایمر (remainingSeconds)
- هرگونه محاسبه ریاضی

### ✅ Backend انجام می‌دهد:

- همه محاسبات را انجام می‌دهد
- مقادیر محاسبه شده را در response برگرداند
- Frontend فقط این مقادیر را نمایش می‌دهد

---

## 📝 فیلدهای موجود در Response

### 1️⃣ CartItem (برای هر آیتم)

```typescript
interface CartItem {
  _id: string;
  product: CartItemProduct;
  quantity: number;
  size?: string;

  // ✅ همه این فیلدها از Backend محاسبه و ارسال می‌شوند:
  price: number; // قیمت کل (با تخفیف) برای quantity فعلی
  originalPrice: number; // قیمت کل اصلی (بدون تخفیف) برای quantity فعلی
  unitPrice: number; // ✅ قیمت واحد (با تخفیف) - برای نمایش
  unitOriginalPrice: number; // ✅ قیمت واحد اصلی (بدون تخفیف) - برای نمایش
  discount: number; // درصد تخفیف (محاسبه شده)

  createdAt: string;
  updatedAt: string;
}
```

### 2️⃣ CartResponse (برای کل سبد)

```typescript
interface CartResponse {
  cart: Cart | null;
  items: CartItem[];

  // ✅ همه این فیلدها از Backend محاسبه و ارسال می‌شوند:
  itemCount: number; // تعداد آیتم‌های مختلف
  totalItems: number; // مجموع quantity همه آیتم‌ها
  totalPrice: number; // مجموع قیمت نهایی همه آیتم‌ها
  expiresAt: string | null; // تاریخ انقضا سبد
  remainingSeconds: number; // تعداد ثانیه‌های باقیمانده (محاسبه شده)

  prices: {
    totalWithoutDiscount: number; // مجموع قیمت اصلی (بدون تخفیف)
    totalWithDiscount: number; // مجموع قیمت نهایی (با تخفیف)
    totalSavings: number; // مجموع صرفه‌جویی
    savingsPercentage: number; // درصد صرفه‌جویی کل
  };
}
```

---

## 🔢 منطق محاسبه در Backend

### برای هر CartItem:

```typescript
// 1. محاسبه قیمت اصلی محصول (بدون تخفیف)
const productOriginalPrice = product?.price || 0;
const unitOriginalPrice = productOriginalPrice;

// 2. محاسبه قیمت واحد (با تخفیف)
const productDiscountPrice = product?.discountPrice ?? productOriginalPrice;
const savedPrice = item?.price; // قیمت واحد ذخیره شده در CartItem
const unitPrice =
  savedPrice && savedPrice > 0 ? savedPrice : productDiscountPrice;

// 3. محاسبه قیمت کل (با تخفیف) برای quantity فعلی
const finalPrice = unitPrice * quantity;

// 4. محاسبه قیمت کل اصلی (بدون تخفیف) برای quantity فعلی
const originalPrice = productOriginalPrice * quantity;

// 5. محاسبه درصد تخفیف
let discount = 0;
if (
  productDiscountPrice &&
  productOriginalPrice > 0 &&
  productDiscountPrice < productOriginalPrice
) {
  discount = Math.round(
    ((productOriginalPrice - productDiscountPrice) / productOriginalPrice) *
      100,
  );
} else if (product?.discount) {
  discount = product.discount;
}

// 6. ساخت CartItem
const cartItem = {
  _id: item._id,
  product: product,
  quantity: quantity,
  size: item.size,
  price: finalPrice, // ✅ برای quantity فعلی محاسبه شده
  originalPrice: originalPrice, // ✅ برای quantity فعلی محاسبه شده
  unitPrice: unitPrice, // ✅ قیمت واحد (با تخفیف)
  unitOriginalPrice: unitOriginalPrice, // ✅ قیمت واحد اصلی (بدون تخفیف)
  discount: discount, // ✅ محاسبه شده
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
};
```

### برای کل سبد (CartResponse):

```typescript
// 1. محاسبه تعداد آیتم‌های مختلف
const itemCount = items.length;

// 2. محاسبه مجموع quantity
const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

// 3. محاسبه مجموع قیمت نهایی (با تخفیف)
const totalPrice = prices.totalWithDiscount;

// 4. محاسبه تایمر (remainingSeconds)
const now = new Date();
const expiresAt = cart.expiresAt || new Date();
const remainingSeconds = Math.max(
  0,
  Math.floor((expiresAt.getTime() - now.getTime()) / 1000)
);

// 5. محاسبه prices (در متد getPrices)
const prices = {
  totalWithoutDiscount: ..., // مجموع قیمت اصلی (بدون تخفیف)
  totalWithDiscount: ...,    // مجموع قیمت نهایی (با تخفیف)
  totalSavings: ...,         // مجموع صرفه‌جویی
  savingsPercentage: ...,    // درصد صرفه‌جویی کل
};

// 6. ساخت CartResponse
const cartResponse = {
  cart: cart,
  items: itemsWithDiscount,
  itemCount: itemCount,           // ✅ محاسبه شده
  totalItems: totalItems,         // ✅ محاسبه شده
  totalPrice: totalPrice,         // ✅ محاسبه شده
  expiresAt: expiresAt,
  remainingSeconds: remainingSeconds, // ✅ محاسبه شده
  prices: prices,                 // ✅ محاسبه شده
};
```

---

## 📊 مثال کامل Response

### مثال: سبد با 2 محصول (یکی با تخفیف، یکی بدون تخفیف)

```json
{
  "cart": {
    "_id": "cart_123456",
    "user": "user_789",
    "sessionId": null,
    "expiresAt": "2024-12-15T17:00:00.000Z",
    "createdAt": "2024-12-15T16:50:00.000Z",
    "updatedAt": "2024-12-15T16:55:00.000Z"
  },
  "items": [
    {
      "_id": "item_1",
      "product": {
        "_id": "product_123",
        "name": "دستبند طلا",
        "price": 6000000,
        "discountPrice": 5000000
      },
      "quantity": 2,
      "size": "16",
      "price": 10000000, // ✅ 5000000 * 2 (محاسبه شده در Backend)
      "originalPrice": 12000000, // ✅ 6000000 * 2 (محاسبه شده در Backend)
      "unitPrice": 5000000, // ✅ قیمت واحد (با تخفیف)
      "unitOriginalPrice": 6000000, // ✅ قیمت واحد اصلی (بدون تخفیف)
      "discount": 16, // ✅ محاسبه شده در Backend
      "createdAt": "2024-12-15T16:50:00.000Z",
      "updatedAt": "2024-12-15T16:55:00.000Z"
    },
    {
      "_id": "item_2",
      "product": {
        "_id": "product_456",
        "name": "گردنبند طلا",
        "price": 8000000,
        "discountPrice": null
      },
      "quantity": 1,
      "size": "18",
      "price": 8000000, // ✅ 8000000 * 1 (محاسبه شده در Backend)
      "originalPrice": 8000000, // ✅ 8000000 * 1 (محاسبه شده در Backend)
      "unitPrice": 8000000, // ✅ قیمت واحد (بدون تخفیف)
      "unitOriginalPrice": 8000000, // ✅ قیمت واحد اصلی
      "discount": 0, // ✅ محاسبه شده در Backend
      "createdAt": "2024-12-15T16:52:00.000Z",
      "updatedAt": "2024-12-15T16:52:00.000Z"
    }
  ],
  "itemCount": 2, // ✅ محاسبه شده در Backend
  "totalItems": 3, // ✅ 2 + 1 (محاسبه شده در Backend)
  "totalPrice": 18000000, // ✅ 10000000 + 8000000 (محاسبه شده در Backend)
  "expiresAt": "2024-12-15T17:00:00.000Z",
  "remainingSeconds": 300, // ✅ محاسبه شده در Backend (5 دقیقه باقیمانده)
  "prices": {
    "totalWithoutDiscount": 20000000, // ✅ 12000000 + 8000000 (محاسبه شده)
    "totalWithDiscount": 18000000, // ✅ 10000000 + 8000000 (محاسبه شده)
    "totalSavings": 2000000, // ✅ 20000000 - 18000000 (محاسبه شده)
    "savingsPercentage": 10 // ✅ (2000000 / 20000000) * 100 (محاسبه شده)
  }
}
```

---

## ⚠️ نکات مهم

### 1. محاسبه `price` و `originalPrice`

- ✅ **برای quantity فعلی محاسبه می‌شود**
- ❌ **برای 1 عدد نیست**

```typescript
// ✅ درست (Backend):
price: 10000000,        // برای quantity = 2
originalPrice: 12000000 // برای quantity = 2

// ❌ غلط:
price: 5000000,         // برای quantity = 1 (اشتباه!)
originalPrice: 6000000  // برای quantity = 1 (اشتباه!)
```

### 2. استفاده از `unitPrice` و `unitOriginalPrice`

- ✅ **برای نمایش قیمت واحد در Frontend استفاده کنید**
- ✅ **برای محاسبه قیمت کل استفاده نکنید (از `price` استفاده کنید)**

```typescript
// ✅ درست (Frontend):
// نمایش قیمت واحد:
<div>{formatPrice(item.unitPrice)}</div>

// نمایش قیمت کل:
<div>{formatPrice(item.price)}</div>

// ❌ غلط (Frontend):
// محاسبه قیمت کل:
const total = item.unitPrice * item.quantity; // ❌ اشتباه! از item.price استفاده کنید
```

### 3. محاسبه `remainingSeconds`

- ✅ **در Backend محاسبه می‌شود**
- ✅ **بر اساس `expiresAt` و زمان فعلی است**
- ❌ **Frontend نباید تایمر را محاسبه کند**

```typescript
// ✅ درست (Backend):
const now = new Date();
const expiresAt = cart.expiresAt;
const remainingSeconds = Math.max(
  0,
  Math.floor((new Date(expiresAt) - now) / 1000),
);

// ❌ غلط (Frontend):
// Frontend نباید این محاسبه را انجام دهد!
// فقط از remainingSeconds استفاده کنید و هر ثانیه یک بار API را refresh کنید
```

### 4. محاسبه `totalPrice`

- ✅ **مجموع `item.price` همه آیتم‌ها است**
- ✅ **در Backend محاسبه می‌شود**

```typescript
// ✅ درست (Backend):
const totalPrice = prices.totalWithDiscount;

// ❌ غلط (Frontend):
// Frontend نباید این محاسبه را انجام دهد!
// فقط از totalPrice استفاده کنید
```

### 5. محاسبه `totalItems`

- ✅ **مجموع `item.quantity` همه آیتم‌ها است**
- ✅ **در Backend محاسبه می‌شود**

```typescript
// ✅ درست (Backend):
const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

// ❌ غلط (Frontend):
// Frontend نباید این محاسبه را انجام دهد!
// فقط از totalItems استفاده کنید
```

---

## 💻 استفاده در Frontend

### 1️⃣ Type Definitions

```typescript
// src/types/cart.ts

export interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    slug: string;
    code: string;
    price: number;
    discountPrice?: number | null;
    images: string[];
    stock: number;
    productType: 'jewelry' | 'coin' | 'melted_gold';
  };
  quantity: number;
  size?: string;
  price: number; // ✅ قیمت کل (با تخفیف) - برای quantity فعلی
  originalPrice: number; // ✅ قیمت کل اصلی (بدون تخفیف) - برای quantity فعلی
  unitPrice: number; // ✅ قیمت واحد (با تخفیف) - برای نمایش
  unitOriginalPrice: number; // ✅ قیمت واحد اصلی (بدون تخفیف) - برای نمایش
  discount: number; // ✅ درصد تخفیف
  createdAt: string;
  updatedAt: string;
}

export interface CartResponse {
  cart: Cart | null;
  items: CartItem[];
  itemCount: number; // ✅ تعداد آیتم‌های مختلف
  totalItems: number; // ✅ مجموع quantity
  totalPrice: number; // ✅ مجموع قیمت نهایی
  expiresAt: string | null; // ✅ تاریخ انقضا
  remainingSeconds: number; // ✅ زمان باقیمانده (ثانیه)
  prices: {
    totalWithoutDiscount: number; // ✅ مجموع قیمت اصلی
    totalWithDiscount: number; // ✅ مجموع قیمت نهایی
    totalSavings: number; // ✅ مجموع صرفه‌جویی
    savingsPercentage: number; // ✅ درصد صرفه‌جویی
  };
}
```

### 2️⃣ نمایش قیمت‌ها

```typescript
// components/CartItem.tsx

function CartItem({ item }: { item: CartItem }) {
  return (
    <div>
      {/* نمایش قیمت واحد */}
      <div>
        {item.unitOriginalPrice > item.unitPrice && (
          <span className="line-through">
            {formatPrice(item.unitOriginalPrice)}
          </span>
        )}
        <span>{formatPrice(item.unitPrice)}</span>
      </div>

      {/* نمایش قیمت کل */}
      <div>
        {item.originalPrice > item.price && (
          <span className="line-through">
            {formatPrice(item.originalPrice)}
          </span>
        )}
        <span>{formatPrice(item.price)}</span>
      </div>

      {/* نمایش درصد تخفیف */}
      {item.discount > 0 && (
        <span>{item.discount}% تخفیف</span>
      )}
    </div>
  );
}
```

### 3️⃣ نمایش مجموع سبد

```typescript
// components/CartSummary.tsx

function CartSummary({ cartResponse }: { cartResponse: CartResponse }) {
  return (
    <div>
      {/* تعداد کل محصولات */}
      <div>
        تعداد کل: {cartResponse.totalItems} عدد
      </div>

      {/* مجموع قیمت */}
      <div>
        {cartResponse.prices.totalWithoutDiscount > cartResponse.prices.totalWithDiscount && (
          <span className="line-through">
            {formatPrice(cartResponse.prices.totalWithoutDiscount)}
          </span>
        )}
        <span>{formatPrice(cartResponse.prices.totalWithDiscount)}</span>
      </div>

      {/* صرفه‌جویی */}
      {cartResponse.prices.totalSavings > 0 && (
        <div>
          صرفه‌جویی: {formatPrice(cartResponse.prices.totalSavings)}
          ({cartResponse.prices.savingsPercentage}%)
        </div>
      )}

      {/* تایمر */}
      <div>
        زمان باقیمانده: {formatTime(cartResponse.remainingSeconds)}
      </div>
    </div>
  );
}
```

### 4️⃣ ❌ کارهایی که نباید انجام دهید

```typescript
// ❌ محاسبه قیمت کل در Frontend
const total = item.unitPrice * item.quantity; // ❌ اشتباه!
// ✅ استفاده از item.price

// ❌ محاسبه مجموع در Frontend
const totalPrice = items.reduce(
  (sum, item) => sum + item.unitPrice * item.quantity,
  0,
); // ❌ اشتباه!
// ✅ استفاده از cartResponse.totalPrice

// ❌ محاسبه تعداد کل در Frontend
const totalItems = items.reduce((sum, item) => sum + item.quantity, 0); // ❌ اشتباه!
// ✅ استفاده از cartResponse.totalItems

// ❌ محاسبه تایمر در Frontend
const remainingSeconds = Math.floor(
  (new Date(cart.expiresAt) - new Date()) / 1000,
); // ❌ اشتباه!
// ✅ استفاده از cartResponse.remainingSeconds
```

---

## 🧪 تست

### تست 1: محاسبه قیمت برای quantity = 2

```bash
# افزودن محصول با quantity = 2
POST /site/cart
{
  "productId": "product_123",
  "quantity": 2
}

# بررسی Response
{
  "items": [{
    "quantity": 2,
    "price": 10000000,        // ✅ باید 5000000 * 2 باشد
    "originalPrice": 12000000, // ✅ باید 6000000 * 2 باشد
    "unitPrice": 5000000,      // ✅ قیمت واحد
    "unitOriginalPrice": 6000000 // ✅ قیمت واحد اصلی
  }]
}
```

### تست 2: محاسبه تایمر

```bash
# دریافت سبد
GET /site/cart

# بررسی Response
{
  "expiresAt": "2024-12-15T17:00:00.000Z",
  "remainingSeconds": 300  // ✅ باید محاسبه شده باشد (5 دقیقه)
}
```

### تست 3: محاسبه مجموع

```bash
# دریافت سبد با چند آیتم
GET /site/cart

# بررسی Response
{
  "items": [
    { "price": 10000000, "quantity": 2 },
    { "price": 8000000, "quantity": 1 }
  ],
  "totalItems": 3,      // ✅ باید 2 + 1 باشد
  "totalPrice": 18000000 // ✅ باید 10000000 + 8000000 باشد
}
```

---

## 📝 چک‌لیست پیاده‌سازی Frontend

### برای هر CartItem:

- [ ] استفاده از `item.price` برای نمایش قیمت کل (نه محاسبه)
- [ ] استفاده از `item.originalPrice` برای نمایش قیمت اصلی (نه محاسبه)
- [ ] استفاده از `item.unitPrice` برای نمایش قیمت واحد
- [ ] استفاده از `item.unitOriginalPrice` برای نمایش قیمت واحد اصلی
- [ ] استفاده از `item.discount` برای نمایش درصد تخفیف (نه محاسبه)

### برای CartResponse:

- [ ] استفاده از `cartResponse.itemCount` (نه محاسبه)
- [ ] استفاده از `cartResponse.totalItems` (نه محاسبه)
- [ ] استفاده از `cartResponse.totalPrice` (نه محاسبه)
- [ ] استفاده از `cartResponse.remainingSeconds` (نه محاسبه)
- [ ] استفاده از `cartResponse.prices.totalWithoutDiscount` (نه محاسبه)
- [ ] استفاده از `cartResponse.prices.totalWithDiscount` (نه محاسبه)
- [ ] استفاده از `cartResponse.prices.totalSavings` (نه محاسبه)
- [ ] استفاده از `cartResponse.prices.savingsPercentage` (نه محاسبه)

### تست:

- [ ] تست با quantity = 1
- [ ] تست با quantity = 2
- [ ] تست با quantity = 5
- [ ] تست با محصولات با تخفیف
- [ ] تست با محصولات بدون تخفیف
- [ ] تست تایمر (remainingSeconds)
- [ ] تست مجموع قیمت‌ها
- [ ] تست نمایش قیمت واحد و قیمت کل

---

## 🎯 خلاصه

### ✅ Backend انجام می‌دهد:

1. **همه محاسبات را انجام می‌دهد**
2. **مقادیر محاسبه شده را در response برگرداند**
3. **`price` و `originalPrice` را برای quantity فعلی محاسبه می‌کند**
4. **`unitPrice` و `unitOriginalPrice` را برای نمایش محاسبه می‌کند**
5. **`remainingSeconds` را محاسبه می‌کند**
6. **`totalPrice` و `totalItems` را محاسبه می‌کند**

### ❌ Frontend نباید:

1. **هیچ محاسبه‌ای انجام دهد**
2. **`price * quantity` محاسبه کند**
3. **`remainingSeconds` محاسبه کند**
4. **`totalPrice` محاسبه کند**
5. **`totalItems` محاسبه کند**
6. **هرگونه محاسبه ریاضی انجام دهد**

### ✅ Frontend باید:

1. **فقط داده‌های محاسبه شده را از Backend دریافت کند**
2. **فقط این داده‌ها را نمایش دهد**
3. **از `unitPrice` و `unitOriginalPrice` برای نمایش قیمت واحد استفاده کند**
4. **از `price` و `originalPrice` برای نمایش قیمت کل استفاده کند**

---

## 📞 پشتیبانی

اگر مشکلی داشتید:

1. ✅ بررسی کنید که همه فیلدها در response وجود دارند
2. ✅ بررسی کنید که محاسبات درست انجام می‌شود
3. ✅ بررسی کنید که `price` برای quantity فعلی است (نه برای 1 عدد)
4. ✅ Response را در Console/Network tab بررسی کنید
5. ✅ از `unitPrice` برای نمایش قیمت واحد استفاده کنید
6. ✅ از `price` برای نمایش قیمت کل استفاده کنید

---

**موفق باشید! 🎉**
