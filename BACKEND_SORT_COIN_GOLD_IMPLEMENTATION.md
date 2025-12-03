# ✅ پیاده‌سازی Backend: مرتب‌سازی سکه و شمش طلا

**تاریخ:** دسامبر 2024  
**وضعیت:** ✅ پیاده‌سازی شده

---

## 📋 خلاصه تغییرات

گزینه‌های مرتب‌سازی جدید برای صفحات **سکه** (`/coin`) و **شمش طلا** (`/melted-gold`) در Backend پیاده‌سازی شد.

### ✅ گزینه‌های جدید (برای سکه و شمش):
- `inStock` - موجود (فیلتر موجود + مرتب بر اساس وزن از بیشترین به کمترین)
- `outOfStock` - ناموجود (فیلتر ناموجود)
- `weight-desc` - از بیشترین وزن به کمترین
- `weight-asc` - از کمترین وزن به بیشترین

### ✅ گزینه‌های قبلی (برای جواهرات - بدون تغییر):
- `newest` - جدیدترین
- `oldest` - قدیمی‌ترین
- `price-asc` / `price-low` - ارزان‌ترین
- `price-desc` / `price-high` - گران‌ترین
- `popular` - محبوب‌ترین
- `discount` - بیشترین تخفیف

---

## 🔧 تغییرات در کد

### فایل: `src/product/services/product.service.ts`

#### 1️⃣ منطق مرتب‌سازی به‌روزرسانی شد

```typescript
// قبل: فقط گزینه‌های عمومی
const sortOptions: Record<string, any> = {
  newest: { createdAt: -1 },
  // ...
};
const sort = sortOptions[sortBy] || sortOptions.newest;

// بعد: منطق شرطی بر اساس productType
let sort: any;

if (productType === 'coin' || productType === 'melted_gold') {
  switch (sortBy) {
    case 'inStock':
      query.stock = { $gt: 0 };
      sort = { 'goldInfo.weight': -1, createdAt: -1 };
      break;
      
    case 'outOfStock':
      query.stock = { $lte: 0 };
      sort = { stock: 1, createdAt: -1 };
      break;
      
    case 'weight-desc':
      query['goldInfo.weight'] = { $exists: true, $ne: null };
      sort = { 'goldInfo.weight': -1, createdAt: -1 };
      break;
      
    case 'weight-asc':
      query['goldInfo.weight'] = { $exists: true, $ne: null };
      sort = { 'goldInfo.weight': 1, createdAt: -1 };
      break;
      
    default:
      // سایر گزینه‌ها (newest, price-asc, etc.)
      sort = sortOptions[sortBy] || sortOptions.newest;
  }
} else {
  // برای جواهرات از گزینه‌های قبلی استفاده کن
  sort = sortOptions[sortBy] || sortOptions.newest;
}
```

#### 2️⃣ فیلتر موجودی به‌روزرسانی شد

```typescript
// قبل:
if (inStock === true) {
  query.stock = { $gt: 0 };
}

// بعد: فقط اگر sortBy درStock/outOfStock نباشد
if (inStock === true && sortBy !== 'inStock' && sortBy !== 'outOfStock') {
  query.stock = { $gt: 0 };
}
```

---

## 🔌 API Endpoints

### Endpoint: `GET /product/public`

**Query Parameters:**

| پارامتر | نوع | مقادیر مجاز | توضیحات |
|---------|-----|------------|---------|
| `productType` | string | `coin`, `melted_gold`, `jewelry` | نوع محصول |
| `sortBy` | string | `inStock`, `outOfStock`, `weight-desc`, `weight-asc`, `newest`, `price-asc`, `price-desc`, `popular`, `discount` | نوع مرتب‌سازی |

**نکته:** گزینه‌های `inStock`, `outOfStock`, `weight-desc`, `weight-asc` فقط برای `productType=coin` و `productType=melted_gold` کار می‌کنند.

---

## 📊 مثال‌های API Request

### 1. دریافت سکه‌های موجود (مرتب بر اساس وزن)

```bash
GET /product/public?productType=coin&sortBy=inStock&limit=10
```

**Response:**
```json
{
  "data": [
    {
      "_id": "...",
      "name": "سکه تمام بهار آزادی",
      "productType": "coin",
      "stock": 10,
      "goldInfo": {
        "weight": 8.13,
        "purity": "900",
        "mintYear": 2024
      },
      "price": 50000000
    },
    {
      "_id": "...",
      "name": "سکه نیم بهار آزادی",
      "productType": "coin",
      "stock": 5,
      "goldInfo": {
        "weight": 4.06,
        "purity": "900",
        "mintYear": 2024
      },
      "price": 27000000
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### 2. دریافت شمش‌ها از بیشترین وزن به کمترین

```bash
GET /product/public?productType=melted_gold&sortBy=weight-desc&limit=10
```

**Response:**
```json
{
  "data": [
    {
      "_id": "...",
      "name": "شمش طلای 250 گرمی",
      "productType": "melted_gold",
      "goldInfo": {
        "weight": 250,
        "purity": "999.9"
      },
      "price": 375000000
    },
    {
      "_id": "...",
      "name": "شمش طلای 100 گرمی",
      "productType": "melted_gold",
      "goldInfo": {
        "weight": 100,
        "purity": "999.9"
      },
      "price": 150000000
    }
  ]
}
```

### 3. دریافت سکه‌های ناموجود

```bash
GET /product/public?productType=coin&sortBy=outOfStock&limit=10
```

**Response:**
```json
{
  "data": [
    {
      "_id": "...",
      "name": "سکه ربع بهار آزادی",
      "productType": "coin",
      "stock": 0,
      "goldInfo": {
        "weight": 2.03,
        "purity": "900"
      },
      "price": 14500000
    }
  ]
}
```

### 4. دریافت سکه‌ها از کمترین وزن به بیشترین

```bash
GET /product/public?productType=coin&sortBy=weight-asc&limit=10
```

**Response:**
```json
{
  "data": [
    {
      "_id": "...",
      "name": "سکه گرمی بهار آزادی",
      "productType": "coin",
      "goldInfo": {
        "weight": 1,
        "purity": "900"
      },
      "price": 8000000
    },
    {
      "_id": "...",
      "name": "سکه ربع بهار آزادی",
      "productType": "coin",
      "goldInfo": {
        "weight": 2.03,
        "purity": "900"
      },
      "price": 14500000
    }
  ]
}
```

### 5. جواهرات (بدون تغییر - همچنان از گزینه‌های قبلی استفاده می‌کنند)

```bash
GET /product/public?productType=jewelry&sortBy=newest&limit=10
```

**Response:** (همانند قبل - بدون تغییر)

---

## 🎯 منطق پیاده‌سازی

### 1. فیلتر موجودی (`inStock`)

```typescript
case 'inStock':
  // فقط محصولات موجود را نشان بده
  query.stock = { $gt: 0 };
  // مرتب بر اساس وزن (از بیشترین به کمترین)
  sort = { 'goldInfo.weight': -1, createdAt: -1 };
  break;
```

**نتیجه:**
- فقط محصولاتی که `stock > 0` دارند نمایش داده می‌شوند
- مرتب شده بر اساس `goldInfo.weight` از بیشترین به کمترین
- در صورت تساوی وزن، بر اساس تاریخ ایجاد (جدیدترین اول)

### 2. فیلتر ناموجود (`outOfStock`)

```typescript
case 'outOfStock':
  // فقط محصولات ناموجود را نشان بده
  query.stock = { $lte: 0 };
  // مرتب بر اساس stock (کمترین اول)
  sort = { stock: 1, createdAt: -1 };
  break;
```

**نتیجه:**
- فقط محصولاتی که `stock <= 0` دارند نمایش داده می‌شوند
- مرتب شده بر اساس `stock` (کمترین اول)
- در صورت تساوی stock، بر اساس تاریخ ایجاد

### 3. مرتب‌سازی وزن نزولی (`weight-desc`)

```typescript
case 'weight-desc':
  // فقط محصولاتی که goldInfo.weight دارند
  query['goldInfo.weight'] = { $exists: true, $ne: null };
  // مرتب بر اساس وزن از بیشترین به کمترین
  sort = { 'goldInfo.weight': -1, createdAt: -1 };
  break;
```

**نتیجه:**
- فقط محصولاتی که `goldInfo.weight` دارند نمایش داده می‌شوند
- مرتب شده بر اساس وزن از بیشترین به کمترین
- در صورت تساوی وزن، بر اساس تاریخ ایجاد

### 4. مرتب‌سازی وزن صعودی (`weight-asc`)

```typescript
case 'weight-asc':
  // فقط محصولاتی که goldInfo.weight دارند
  query['goldInfo.weight'] = { $exists: true, $ne: null };
  // مرتب بر اساس وزن از کمترین به بیشترین
  sort = { 'goldInfo.weight': 1, createdAt: -1 };
  break;
```

**نتیجه:**
- فقط محصولاتی که `goldInfo.weight` دارند نمایش داده می‌شوند
- مرتب شده بر اساس وزن از کمترین به بیشترین
- در صورت تساوی وزن، بر اساس تاریخ ایجاد

---

## ✅ تست‌ها

### تست دستی:

```bash
# تست 1: سکه‌های موجود
curl "http://localhost:4001/product/public?productType=coin&sortBy=inStock&limit=5"

# تست 2: سکه‌ها از بیشترین وزن به کمترین
curl "http://localhost:4001/product/public?productType=coin&sortBy=weight-desc&limit=5"

# تست 3: سکه‌ها از کمترین وزن به بیشترین
curl "http://localhost:4001/product/public?productType=coin&sortBy=weight-asc&limit=5"

# تست 4: شمش‌ها از بیشترین وزن به کمترین
curl "http://localhost:4001/product/public?productType=melted_gold&sortBy=weight-desc&limit=5"

# تست 5: جواهرات (باید همچنان کار کند)
curl "http://localhost:4001/product/public?productType=jewelry&sortBy=newest&limit=5"
```

---

## 🔍 نکات مهم

### 1. فیلتر موجودی

- `inStock`: فقط محصولات با `stock > 0`
- `outOfStock`: فقط محصولات با `stock <= 0`
- اگر `sortBy` برابر `inStock` یا `outOfStock` باشد، فیلتر `inStock` در query params نادیده گرفته می‌شود

### 2. مرتب‌سازی وزن

- برای `weight-desc` و `weight-asc`، فقط محصولاتی که `goldInfo.weight` دارند نمایش داده می‌شوند
- اگر محصولی `goldInfo.weight` نداشته باشد، در نتایج نمایش داده نمی‌شود

### 3. Tie-breaker

- در همه حالات، اگر دو محصول مقدار یکسانی داشته باشند (مثلاً وزن یکسان)، بر اساس `createdAt` (جدیدترین اول) مرتب می‌شوند

### 4. سازگاری با Frontend

- Frontend در `src/app/coin/page.tsx` از این گزینه‌ها استفاده می‌کند:
  - `inStock`
  - `outOfStock`
  - `weight-desc`
  - `weight-asc`

### 5. سازگاری با جواهرات

- برای `productType=jewelry` یا بدون `productType` (پیش‌فرض)، گزینه‌های جدید (`inStock`, `outOfStock`, `weight-desc`, `weight-asc`) نادیده گرفته می‌شوند و از گزینه‌های قبلی استفاده می‌شود

---

## 🐛 رفع مشکلات احتمالی

### مشکل 1: `goldInfo.weight` null است

**راه حل:** در کد ما، برای `weight-desc` و `weight-asc`، فقط محصولاتی که `goldInfo.weight` دارند نمایش داده می‌شوند:

```typescript
query['goldInfo.weight'] = { $exists: true, $ne: null };
```

### مشکل 2: Performance کند است

**راه حل:** برای بهبود performance، می‌توانید index اضافه کنید:

```typescript
// در Schema
@Prop({ index: true })
'goldInfo.weight': number;

// یا در migration
ProductSchema.index({ 'goldInfo.weight': 1 });
ProductSchema.index({ stock: 1 });
ProductSchema.index({ productType: 1, stock: 1, 'goldInfo.weight': 1 });
```

---

## 📊 خلاصه تغییرات

| قبل | بعد |
|-----|-----|
| فقط گزینه‌های عمومی (newest, price-asc, etc.) | گزینه‌های مخصوص سکه/شمش + گزینه‌های عمومی |
| بدون فیلتر موجودی در مرتب‌سازی | فیلتر موجود/ناموجود در مرتب‌سازی |
| بدون مرتب‌سازی بر اساس وزن | مرتب‌سازی بر اساس `goldInfo.weight` |
| یکسان برای همه productType | منطق شرطی بر اساس productType |

---

## ✅ چک‌لیست پیاده‌سازی

- [x] اضافه کردن گزینه‌های `inStock`, `outOfStock`, `weight-desc`, `weight-asc` به sort options
- [x] پیاده‌سازی منطق فیلتر موجودی (`stock > 0` برای موجود، `stock <= 0` برای ناموجود)
- [x] پیاده‌سازی مرتب‌سازی بر اساس `goldInfo.weight`
- [x] منطق شرطی بر اساس `productType`
- [x] سازگاری با گزینه‌های قبلی برای جواهرات
- [x] Build موفق
- [x] مستندسازی

---

**موفق باشید! 🎉**

همه تغییرات Backend انجام شده و آماده استفاده با Frontend است.

