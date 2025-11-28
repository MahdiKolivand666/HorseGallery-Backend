# 📌 خلاصه تصمیم‌گیری - چه چیزهایی را نگه داریم و چه چیزهایی را تغییر دهیم؟

## 🎯 استراتژی کلی: **نگه دارید + اضافه کنید**

**اصل:** همه چیزهای فعلی را نگه دارید + فیلدهای جدید را اضافه کنید

---

## ✅ چیزهایی که باید **نگه دارید** (بدون تغییر):

### 1. همه فیلدهای فعلی در Schema ها
- ❌ **هیچ فیلدی را حذف نکنید**
- ✅ همه فیلدهای موجود را نگه دارید
- ✅ ساختار فعلی را حفظ کنید

### 2. نام فیلدهای اصلی
- ✅ `title` (در Product و Category)
- ✅ `url` (در Product و Category و Blog)
- ✅ `image` (در Category)
- ✅ `category` (ObjectId ref)
- ✅ `user` (ObjectId ref در Blog)

### 3. ساختار Cart و Order
- ✅ **Cart + CartItem** (separate collections) - نگه دارید
- ✅ **Order + OrderItem** (separate collections) - نگه دارید
- ✅ ساختار embedded را استفاده نکنید

### 4. فیلدهای Authentication در User
- ✅ همه فیلدهای `code`, `password`, `refreshToken` و غیره

---

## ➕ چیزهایی که باید **اضافه کنید**:

### 1. Alias Fields (برای سازگاری با Mock Data)

در **ProductCategory**:
```typescript
name?: string;        // alias برای title
slug?: string;        // alias برای url  
heroImage?: string;   // alias برای image
subcategories?: Array<{ name: string; slug: string }>;  // جدید
```

در **Product**:
```typescript
name?: string;        // alias برای title
slug?: string;        // alias برای url
code?: string;        // کد محصول (جدید)
discountPrice?: number;  // قیمت نهایی (جدید)
subcategory?: { name: string; slug: string };  // جدید
specifications?: { ... };  // جدید
isAvailable: boolean;  // جدید (default: true)
isFeatured: boolean;   // جدید
isBestSelling: boolean;  // جدید
isNewArrival: boolean;   // جدید
isGift: boolean;        // جدید
rating?: number;       // جدید
reviewsCount?: number;  // جدید
views: number;         // جدید
sales: number;         // جدید
```

در **Blog**:
```typescript
slug?: string;        // alias برای url
excerpt?: string;     // جدید
tags?: string[];      // جدید
views: number;        // جدید
likes: number;        // جدید
isFeatured: boolean;  // جدید
publishedAt?: Date;   // جدید
author?: { name: string; avatar?: string };  // جدید
```

در **User**:
```typescript
email?: string;       // جدید
nationalCode?: string;  // جدید
avatar?: string;      // جدید
isActive: boolean;    // جدید (default: true)
lastLogin?: Date;     // جدید
```

در **Address**:
```typescript
title?: string;       // جدید (خانه، محل کار)
isDefault: boolean;   // جدید (default: false)
```

در **CartItem**:
```typescript
size?: string;        // جدید
price?: number;       // جدید (snapshot قیمت)
```

در **Cart**:
```typescript
subtotal: number;     // جدید (محاسبه شده)
discount: number;     // جدید (محاسبه شده)
total: number;        // جدید (محاسبه شده)
```

در **Order**:
```typescript
orderId?: string;           // جدید (شماره سفارش)
paymentMethod: string;      // جدید (default: 'online')
paymentGateway?: string;    // جدید
paymentStatus: string;      // جدید
transactionId?: string;     // جدید
trackingCode?: string;      // جدید
notes?: string;             // جدید
```

### 2. Collections کاملاً جدید

#### FAQ:
```typescript
question: string;
answer: string;
category: string;
order: number;
isActive: boolean;
views: number;
helpful: number;
```

#### GoldPrice:
```typescript
karat: number;  // 18, 21, 24
pricePerGram: number;
date: Date;
isActive: boolean;
source?: string;
```

#### Announcement:
```typescript
title: string;
message: string;
link?: string;
badge: { text: string; color: string };
isActive: boolean;
startDate: Date;
endDate?: Date;
order: number;
```

---

## 🔄 Mapping Strategy (در زمان Import)

### Option 1: Set هر دو (پیشنهادی)
```javascript
// در زمان import
product.name = mockData.name;
product.title = mockData.name;  // هم title و هم name
product.slug = mockData.slug;
product.url = mockData.slug;    // هم url و هم slug
```

### Option 2: فقط Alias Fields
```javascript
// فقط alias fields را set کنید
product.name = mockData.name;
product.slug = mockData.slug;
// title و url از قبل وجود دارند
```

---

## 📋 چک‌لیست تغییرات

### ✅ Schema Updates:
- [ ] ProductCategory: اضافه کردن `name`, `slug`, `heroImage`, `subcategories`
- [ ] Product: اضافه کردن همه فیلدهای جدید
- [ ] Blog: اضافه کردن `slug`, `excerpt`, `tags`, `views`, `likes`, `isFeatured`, `publishedAt`, `author`
- [ ] User: اضافه کردن `email`, `nationalCode`, `avatar`, `isActive`, `lastLogin`
- [ ] Address: اضافه کردن `title`, `isDefault`
- [ ] CartItem: اضافه کردن `size`, `price`
- [ ] Cart: اضافه کردن `subtotal`, `discount`, `total`
- [ ] Order: اضافه کردن `orderId`, `paymentMethod`, `paymentGateway`, `paymentStatus`, `transactionId`, `trackingCode`, `notes`

### ✅ New Schemas:
- [ ] FAQ schema
- [ ] GoldPrice schema
- [ ] Announcement schema

### ✅ Indexes:
- [ ] اضافه کردن indexes برای فیلدهای جدید (`code`, `slug`, `isAvailable`, و غیره)

### ✅ DTOs:
- [ ] به‌روزرسانی ProductDto
- [ ] به‌روزرسانی BlogDto
- [ ] ایجاد FAQDto, GoldPriceDto, AnnouncementDto

---

## ⚠️ نکات مهم

1. **هیچ فیلدی را حذف نکنید** - همه چیز backward compatible می‌ماند
2. **فیلدهای جدید optional هستند** - می‌توانید به تدریج استفاده کنید
3. **Alias fields** - برای سازگاری با mock data
4. **ساختار فعلی** - Cart و Order را به embedded تبدیل نکنید

---

## 🚀 نتیجه

- ✅ **Backward Compatibility**: 100% حفظ می‌شود
- ✅ **Mock Data Support**: همه فیلدهای mock data پشتیبانی می‌شوند
- ✅ **Gradual Migration**: می‌توانید به تدریج از فیلدهای جدید استفاده کنید
- ✅ **No Breaking Changes**: هیچ کدی شکسته نمی‌شود

