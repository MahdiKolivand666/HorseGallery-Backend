# 🧹 تصمیم‌گیری: چه چیزهایی را نگه داریم و چه چیزهایی را حذف کنیم؟

## 📊 تحلیل دقیق فیلدها

---

## 1️⃣ ProductCategory

### ✅ **نگه دارید:**
- `title` ✅ (استفاده در queries و populate)
- `url` ✅ (استفاده در queries، unique)
- `image` ✅ (استفاده در deleteImages)

### ❌ **حذف کنید:**
- `content` ❌ (در mock data نیست و احتمالاً استفاده نمی‌شود)

### ➕ **اضافه کنید:**
- `name` (جایگزین `title` - از mock data)
- `slug` (جایگزین `url` - از mock data)
- `heroImage` (جایگزین `image` - از mock data)
- `subcategories` (کاملاً جدید - از mock data)

### 🔄 **تغییر نام:**
```typescript
// قبل:
title → name
url → slug
image → heroImage

// بعد از تغییر:
name: string;
slug: string;
heroImage: string;
subcategories: Array<{ name: string; slug: string }>;
```

**⚠️ توجه:** باید همه جا که `title`, `url`, `image` استفاده شده را به `name`, `slug`, `heroImage` تغییر دهید.

---

## 2️⃣ Product

### ✅ **نگه دارید:**
- `title` ✅ (استفاده در queries)
- `url` ✅ (استفاده در queries و findOneWithUrl)
- `price` ✅
- `stock` ✅ (استفاده در addStock/removeStock)
- `description` ✅
- `images` ✅ (استفاده در deleteImages)
- `category` ✅ (ObjectId ref - استفاده در populate)
- `version` ✅ (استفاده در optimistic locking)

### ❌ **حذف کنید:**
- `discount` ❌ (در mock data نیست - به `discountPrice` تبدیل می‌شود)
- `weight` ❌ (به `specifications.weight` منتقل می‌شود)
- `karat` ❌ (به `specifications.karat` منتقل می‌شود)
- `type` ❌ (به `subcategory` منتقل می‌شود)
- `material` ❌ (به `specifications.material` منتقل می‌شود)
- `dimensions` ❌ (به `specifications.dimensions` منتقل می‌شود)
- `hasCertificate` ❌ (در mock data نیست)
- `certificateNumber` ❌ (در mock data نیست)

**⚠️ توجه:** فیلدهای `content` و `thumbnail` در DTO هستند اما در schema نیستند - آنها را هم حذف کنید از DTO.

### ➕ **اضافه کنید:**
- `name` (جایگزین `title`)
- `slug` (جایگزین `url`)
- `code` (کد محصول - جدید)
- `discountPrice` (قیمت نهایی - جایگزین `discount`)
- `subcategory` (جایگزین `type`)
- `specifications` (جایگزین `weight`, `karat`, `material`, `dimensions`)
- `isAvailable` (جدید)
- `isFeatured` (جدید)
- `isBestSelling` (جدید)
- `isNewArrival` (جدید)
- `isGift` (جدید)
- `rating` (جدید)
- `reviewsCount` (جدید)
- `views` (جدید)
- `sales` (جدید)

### 🔄 **تغییر نام:**
```typescript
// قبل:
title → name
url → slug
discount → discountPrice
weight, karat, material, dimensions → specifications
type → subcategory

// بعد از تغییر:
name: string;
slug: string;
code: string;
price: number;
discountPrice?: number;
subcategory: { name: string; slug: string };
specifications: {
  weight: string;
  karat: string;
  material: string;
  dimensions?: string;
  coverage?: string;
  brand?: string;
};
isAvailable: boolean;
isFeatured: boolean;
isBestSelling: boolean;
isNewArrival: boolean;
isGift: boolean;
rating?: number;
reviewsCount?: number;
views: number;
sales: number;
```

---

## 3️⃣ Blog

### ✅ **نگه دارید:**
- `title` ✅ (استفاده در queries)
- `url` ✅ (استفاده در queries)
- `content` ✅
- `image` ✅
- `category` ✅ (ObjectId ref)
- `user` ✅ (ObjectId ref)

### ❌ **حذف کنید:**
- هیچ فیلدی حذف نمی‌شود (همه استفاده می‌شوند)

### ➕ **اضافه کنید:**
- `slug` (جایگزین `url`)
- `excerpt` (جدید)
- `tags` (جدید)
- `views` (جدید)
- `likes` (جدید)
- `isFeatured` (جدید)
- `publishedAt` (جدید)
- `author` (embedded object - علاوه بر `user`)

### 🔄 **تغییر نام:**
```typescript
// قبل:
url → slug

// بعد از تغییر:
title: string;
slug: string;  // جایگزین url
content: string;
image: string;
category: ObjectId;
user: ObjectId;
excerpt?: string;
tags?: string[];
views: number;
likes: number;
isFeatured: boolean;
publishedAt?: Date;
author?: { name: string; avatar?: string };
```

---

## 4️⃣ User

### ✅ **نگه دارید:**
- `firstName` ✅
- `lastName` ✅
- `mobile` ✅ (unique, required)
- `password` ✅ (برای authentication)
- `role` ✅
- همه فیلدهای authentication (`code`, `codeExpiry`, `codeAttempts`, `refreshToken`, و غیره) ✅

### ❌ **حذف کنید:**
- هیچ فیلدی حذف نمی‌شود (همه برای authentication لازم هستند)

### ➕ **اضافه کنید:**
- `email` (جدید)
- `nationalCode` (جدید)
- `avatar` (جدید)
- `isActive` (جدید)
- `lastLogin` (جدید)

---

## 5️⃣ Address

### ✅ **نگه دارید:**
- همه فیلدهای فعلی ✅

### ❌ **حذف کنید:**
- `content` ❌ (legacy field - در mock data نیست)

### ➕ **اضافه کنید:**
- `title` (جدید - خانه، محل کار)
- `isDefault` (جدید)

---

## 6️⃣ Cart & CartItem

### ✅ **نگه دارید:**
- ساختار فعلی (Cart + CartItem separate) ✅
- `user` در Cart ✅
- `product` در CartItem ✅
- `quantity` در CartItem ✅
- `cart` در CartItem ✅

### ❌ **حذف کنید:**
- هیچ فیلدی حذف نمی‌شود

### ➕ **اضافه کنید:**
- در CartItem: `size`, `price` (snapshot)
- در Cart: `subtotal`, `discount`, `total` (محاسبه شده)

---

## 7️⃣ Order & OrderItem

### ✅ **نگه دارید:**
- ساختار فعلی (Order + OrderItem separate) ✅
- همه فیلدهای فعلی ✅ (همه استفاده می‌شوند)

### ❌ **حذف کنید:**
- هیچ فیلدی حذف نمی‌شود

### ➕ **اضافه کنید:**
- `orderId` (شماره سفارش unique)
- `paymentMethod` (default: 'online')
- `paymentGateway` (saman, mellat, zarinpal)
- `paymentStatus` (pending, paid, failed)
- `transactionId`
- `trackingCode`
- `notes`

---

## 8️⃣ BlogCategory

### ✅ **نگه دارید:**
- `title` ✅
- `url` ✅
- `image` ✅

### ❌ **حذف کنید:**
- `content` ❌ (در mock data نیست)

### ➕ **اضافه کنید:**
- هیچ فیلد جدیدی لازم نیست (BlogCategory در mock data نیست)

---

## 📋 خلاصه تغییرات

### 🔴 **فیلدهایی که باید حذف شوند:**

1. **ProductCategory:**
   - `content` ❌

2. **Product:**
   - `discount` ❌ (به `discountPrice` تبدیل می‌شود)
   - `weight` ❌ (به `specifications.weight` منتقل می‌شود)
   - `karat` ❌ (به `specifications.karat` منتقل می‌شود)
   - `type` ❌ (به `subcategory` منتقل می‌شود)
   - `material` ❌ (به `specifications.material` منتقل می‌شود)
   - `dimensions` ❌ (به `specifications.dimensions` منتقل می‌شود)
   - `hasCertificate` ❌
   - `certificateNumber` ❌

3. **ProductDto:**
   - `content` ❌ (در schema نیست)
   - `thumbnail` ❌ (در schema نیست)

4. **Address:**
   - `content` ❌ (legacy field)

### 🔵 **فیلدهایی که باید تغییر نام دهند:**

1. **ProductCategory:**
   - `title` → `name`
   - `url` → `slug`
   - `image` → `heroImage`

2. **Product:**
   - `title` → `name`
   - `url` → `slug`
   - `discount` → `discountPrice`

3. **Blog:**
   - `url` → `slug`

### 🟢 **فیلدهایی که باید اضافه شوند:**

1. **ProductCategory:**
   - `subcategories` (array)

2. **Product:**
   - `code`, `subcategory`, `specifications`, `isAvailable`, `isFeatured`, `isBestSelling`, `isNewArrival`, `isGift`, `rating`, `reviewsCount`, `views`, `sales`

3. **Blog:**
   - `excerpt`, `tags`, `views`, `likes`, `isFeatured`, `publishedAt`, `author`

4. **User:**
   - `email`, `nationalCode`, `avatar`, `isActive`, `lastLogin`

5. **Address:**
   - `title`, `isDefault`

6. **CartItem:**
   - `size`, `price`

7. **Cart:**
   - `subtotal`, `discount`, `total`

8. **Order:**
   - `orderId`, `paymentMethod`, `paymentGateway`, `paymentStatus`, `transactionId`, `trackingCode`, `notes`

### 🆕 **Collections جدید:**
- FAQ
- GoldPrice
- Announcement

---

## ⚠️ نکات مهم

1. **تغییر نام فیلدها:** باید همه جا که استفاده شده‌اند را به‌روزرسانی کنید:
   - Services
   - Controllers
   - DTOs
   - Queries
   - Populate statements

2. **Migration:** قبل از حذف فیلدها، داده‌های موجود را migrate کنید:
   - `title` → `name`
   - `url` → `slug`
   - `discount` → `discountPrice`
   - `weight`, `karat`, `material`, `dimensions` → `specifications`

3. **Indexes:** بعد از تغییر نام فیلدها، indexes را به‌روزرسانی کنید.

4. **DTOs:** DTOs را هم به‌روزرسانی کنید تا با schema جدید match کنند.

---

## 🚀 مراحل اجرا

1. ✅ ایجاد schema های جدید (FAQ, GoldPrice, Announcement)
2. ✅ به‌روزرسانی schema های موجود (تغییر نام + اضافه کردن فیلدها)
3. ✅ Migration script برای تبدیل داده‌های قدیمی
4. ✅ به‌روزرسانی Services و Controllers
5. ✅ به‌روزرسانی DTOs
6. ✅ به‌روزرسانی Indexes
7. ✅ تست کردن

