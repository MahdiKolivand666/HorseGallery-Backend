# 📚 مستندات کامل Backend - Gold Gallery

## 📋 فهرست مطالب

1. [معرفی پروژه](#معرفی-پروژه)
2. [معماری و تکنولوژی](#معماری-و-تکنولوژی)
3. [ساختار پروژه](#ساختار-پروژه)
4. [نقش‌های کاربری](#نقش‌های-کاربری)
5. [APIهای عمومی (بدون احراز هویت)](#apiهای-عمومی)
6. [APIهای کاربر (User Panel)](#apiهای-کاربر)
7. [APIهای مدیر (Admin Panel)](#apiهای-مدیر)
8. [Authentication & Authorization](#authentication--authorization)
9. [مدیریت فایل‌ها و تصاویر](#مدیریت-فایل‌ها-و-تصاویر)
10. [درگاه پرداخت](#درگاه-پرداخت)
11. [راهنمای استفاده Frontend](#راهنمای-استفاده-frontend)
12. [مثال‌های کد](#مثال‌های-کد)

---

## 🎯 معرفی پروژه

**Gold Gallery Backend** یک API کامل و حرفه‌ای برای فروشگاه آنلاین طلا و جواهرات است که با استفاده از NestJS توسعه داده شده است.

### ویژگی‌های کلیدی:

- ✅ مدیریت کامل محصولات طلا و جواهرات
- ✅ سیستم احراز هویت و مجوزدهی (JWT)
- ✅ پنل مدیریت کامل
- ✅ سیستم سبد خرید
- ✅ پردازش سفارشات و پرداخت آنلاین
- ✅ مدیریت محتوا (Blog)
- ✅ سیستم تیکتینگ
- ✅ مدیریت SEO
- ✅ آپلود و پردازش تصاویر
- ✅ محدودیت نرخ درخواست (Rate Limiting)
- ✅ لاگ و گزارش‌گیری

---

## 🏗️ معماری و تکنولوژی

### Stack فنی:

- **Framework**: NestJS (Node.js)
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Token)
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **File Upload**: Multer
- **Image Processing**: Sharp
- **Security**: Helmet, CORS
- **Rate Limiting**: @nestjs/throttler

### معماری:

```
┌─────────────────────────────────────────────┐
│           Client (Frontend)                 │
│   (React/Next.js/Vue + Admin Panel)         │
└─────────────────┬───────────────────────────┘
                  │
                  │ HTTP/HTTPS
                  ▼
┌─────────────────────────────────────────────┐
│        NestJS Backend (Port 4001)           │
│  ┌─────────────────────────────────────┐   │
│  │  Controllers (API Endpoints)        │   │
│  └──────────────┬──────────────────────┘   │
│                 │                            │
│  ┌──────────────▼──────────────────────┐   │
│  │  Guards & Middleware               │   │
│  │  (JWT, Roles, Rate Limit)          │   │
│  └──────────────┬──────────────────────┘   │
│                 │                            │
│  ┌──────────────▼──────────────────────┐   │
│  │  Services (Business Logic)          │   │
│  └──────────────┬──────────────────────┘   │
│                 │                            │
│  ┌──────────────▼──────────────────────┐   │
│  │  DTOs & Validation                  │   │
│  └──────────────┬──────────────────────┘   │
└─────────────────┼───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         MongoDB Database                    │
│         (horsegallery)                      │
└─────────────────────────────────────────────┘
```

---

## 📁 ساختار پروژه

```
horse-gallery-backend/
├── src/
│   ├── main.ts                    # Entry point
│   ├── app.module.ts              # Root module
│   ├── app.controller.ts          # File upload/delete
│   │
│   ├── user/                      # ماژول کاربران
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts      # احراز هویت
│   │   │   ├── user.controller.ts      # مدیریت کاربران (Admin)
│   │   │   └── panel.controller.ts     # پنل کاربر
│   │   ├── services/
│   │   │   ├── user.service.ts
│   │   │   └── address.service.ts
│   │   ├── schemas/
│   │   │   ├── user.schema.ts
│   │   │   └── address.schema.ts
│   │   └── dtos/
│   │
│   ├── product/                   # ماژول محصولات
│   │   ├── controllers/
│   │   │   ├── product.controller.ts           # مدیریت محصولات (Admin)
│   │   │   ├── product-category.controller.ts  # مدیریت دسته‌بندی
│   │   │   └── site-product.controller.ts      # نمایش عمومی
│   │   ├── services/
│   │   │   ├── product.service.ts
│   │   │   ├── product-category.service.ts
│   │   │   └── inventory-record.service.ts
│   │   ├── schemas/
│   │   │   ├── product.schema.ts               # شامل فیلدهای طلا
│   │   │   ├── product-category.schema.ts
│   │   │   └── inventory-record.schema.ts
│   │   └── dtos/
│   │
│   ├── shop/                      # ماژول فروشگاه
│   │   ├── controllers/
│   │   │   ├── cart.controller.ts              # سبد خرید
│   │   │   ├── order.controller.ts             # مدیریت سفارشات (Admin)
│   │   │   ├── site-order.controller.ts        # ثبت سفارش کاربر
│   │   │   ├── shipping.controller.ts          # مدیریت ارسال (Admin)
│   │   │   └── site-shipping.controller.ts     # نمایش روش‌های ارسال
│   │   ├── services/
│   │   │   ├── cart.service.ts
│   │   │   ├── order.service.ts
│   │   │   └── shipping.service.ts
│   │   ├── schemas/
│   │   │   ├── cart.schema.ts
│   │   │   ├── cart-item.schema.ts
│   │   │   ├── order.schema.ts
│   │   │   ├── order-item.schema.ts
│   │   │   └── shipping.schema.ts
│   │   └── dtos/
│   │
│   ├── blog/                      # ماژول مقالات
│   │   ├── controllers/
│   │   │   ├── blog.controller.ts              # مدیریت مقالات (Admin)
│   │   │   ├── blog-category.controller.ts     # مدیریت دسته‌بندی
│   │   │   └── site-blog.controller.ts         # نمایش عمومی
│   │   ├── services/
│   │   ├── schemas/
│   │   └── dtos/
│   │
│   ├── seo/                       # ماژول SEO
│   │   ├── controllers/
│   │   │   ├── seo.controller.ts               # مدیریت SEO (Admin)
│   │   │   └── site-seo.controller.ts          # دریافت SEO
│   │   ├── services/
│   │   ├── schemas/
│   │   └── dtos/
│   │
│   ├── ticket/                    # ماژول تیکتینگ
│   │   ├── controllers/
│   │   │   ├── ticket.controller.ts            # مدیریت تیکت (Admin)
│   │   │   └── panel-ticket.controller.ts      # تیکت کاربر
│   │   ├── services/
│   │   ├── schemas/
│   │   └── dtos/
│   │
│   └── shared/                    # ماژول مشترک
│       ├── guards/
│       │   ├── jwt.guard.ts                    # احراز هویت JWT
│       │   ├── role.guard.ts                   # بررسی نقش
│       │   └── api-key.guard.ts
│       ├── pipes/                              # Validation pipes
│       ├── filters/                            # Exception filters
│       ├── interceptors/                       # Interceptors
│       ├── decorators/                         # Custom decorators
│       └── utils/                              # توابع کمکی
│
├── files/                         # فایل‌های آپلود شده
│   ├── blog/
│   ├── product/
│   ├── productCategory/
│   └── string/
│
├── .env                           # Environment variables
├── package.json
└── tsconfig.json
```

---

## 👥 نقش‌های کاربری

### 1. **User** (کاربر عادی)

- ثبت‌نام و ورود
- مشاهده محصولات و مقالات
- مدیریت سبد خرید
- ثبت سفارش و پرداخت
- مدیریت آدرس‌ها
- ارسال تیکت پشتیبانی

### 2. **CopyWriter** (تولید کننده محتوا)

- مدیریت مقالات (Blog)
- مدیریت محصولات
- مدیریت دسته‌بندی‌ها
- مدیریت SEO

### 3. **Admin** (مدیر)

- تمام دسترسی‌های CopyWriter
- مدیریت کاربران
- مدیریت سفارشات
- مدیریت روش‌های ارسال
- مدیریت تیکت‌ها
- مدیریت موجودی انبار
- دسترسی کامل به تمام بخش‌ها

---

## 🌐 APIهای عمومی

> این APIها بدون نیاز به احراز هویت قابل دسترسی هستند

### 1. محصولات عمومی

#### `GET /site/product`

دریافت لیست محصولات با فیلتر و جستجو

**Query Parameters:**

```typescript
{
  page?: number;           // شماره صفحه (پیش‌فرض: 1)
  limit?: number;          // تعداد در هر صفحه (پیش‌فرض: 10)
  title?: string;          // جستجو در عنوان
  category?: string;       // فیلتر بر اساس دسته‌بندی
  minPrice?: number;       // حداقل قیمت
  maxPrice?: number;       // حداکثر قیمت
  sort?: string;           // مرتب‌سازی (cheap, expensive, createdAt)
  weight?: number;         // وزن (گرم)
  karat?: number;          // عیار (18, 21, 24)
  type?: string;           // نوع (دستبند، گردنبند، انگشتر، ...)
  material?: string;       // جنس (طلای زرد، سفید، رزگلد)
}
```

**Response:**

```json
{
  "count": 45,
  "products": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "دستبند طلای زرد 18 عیار",
      "url": "gold-bracelet-18k",
      "description": "دستبند ظریف طلای زرد",
      "price": 12500000,
      "discount": 10,
      "stock": 5,
      "images": ["image1.webp", "image2.webp"],
      "category": {
        "_id": "...",
        "name": "دستبند",
        "url": "bracelets"
      },
      "weight": 15.5,
      "karat": 18,
      "type": "دستبند",
      "material": "طلای زرد",
      "dimensions": "20cm",
      "hasCertificate": true,
      "certificateNumber": "CERT-2024-001",
      "createdAt": "2024-11-01T10:00:00.000Z"
    }
  ]
}
```

#### `GET /site/product/:url`

دریافت جزئیات یک محصول

**Response:** همان ساختار بالا برای یک محصول

---

### 2. مقالات عمومی

#### `GET /site/blog/categories`

دریافت لیست دسته‌بندی‌های مقالات

**Response:**

```json
{
  "count": 5,
  "categories": [
    {
      "_id": "...",
      "name": "راهنمای خرید",
      "url": "buying-guide",
      "description": "راهنمای خرید طلا و جواهر"
    }
  ]
}
```

#### `GET /site/blog/categories/:url`

دریافت مقالات یک دسته‌بندی

#### `GET /site/blog/:url`

دریافت یک مقاله کامل

---

### 3. SEO

#### `GET /site-seo?url=...`

دریافت اطلاعات SEO یک صفحه

**Query Parameters:**

- `url`: آدرس صفحه (مثلاً `about-us`)

**Response:**

```json
{
  "_id": "...",
  "url": "about-us",
  "title": "درباره ما - فروشگاه طلا",
  "description": "فروشگاه طلا و جواهرات با بهترین قیمت",
  "keywords": ["طلا", "جواهرات", "خرید طلا"],
  "ogImage": "og-image.jpg"
}
```

---

### 4. روش‌های ارسال

#### `GET /site-shipping`

دریافت لیست روش‌های ارسال

**Response:**

```json
{
  "count": 3,
  "shippings": [
    {
      "_id": "...",
      "name": "پست پیشتاز",
      "price": 50000,
      "freeShippingThreshold": 5000000,
      "description": "ارسال 2-3 روزه"
    }
  ]
}
```

---

## 🔐 Authentication & Authorization

### 1. ثبت‌نام و ورود

#### `POST /auth/sign-up`

ثبت‌نام کاربر جدید

**Request Body:**

```json
{
  "mobile": "09123456789",
  "password": "MySecurePass123",
  "firstName": "علی",
  "lastName": "احمدی"
}
```

**Response:**

```json
{
  "message": "کد تایید به شماره موبایل ارسال شد",
  "userId": "507f1f77bcf86cd799439011"
}
```

#### `POST /auth/confirm`

تایید کد ارسال شده

**Request Body:**

```json
{
  "mobile": "09123456789",
  "code": "1234"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "mobile": "09123456789",
    "firstName": "علی",
    "lastName": "احمدی",
    "role": "user"
  }
}
```

#### `POST /auth/sign-in`

ورود با موبایل و رمز عبور

**Request Body:**

```json
{
  "mobile": "09123456789",
  "password": "MySecurePass123"
}
```

**Response:** مشابه `/auth/confirm`

#### `POST /auth/resend`

ارسال مجدد کد تایید

---

## 👤 APIهای کاربر

> نیاز به JWT Token در header دارند:
>
> ```
> Authorization: Bearer YOUR_JWT_TOKEN
> ```

### 1. مدیریت پروفایل

#### `GET /panel/user/:id`

دریافت اطلاعات کاربر

#### `PATCH /panel/change-password`

تغییر رمز عبور

**Request Body:**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "oldPassword": "OldPass123",
  "newPassword": "NewPass123"
}
```

---

### 2. مدیریت آدرس‌ها

#### `GET /panel/address`

لیست آدرس‌های کاربر

#### `POST /panel/address`

افزودن آدرس جدید

**Request Body:**

```json
{
  "province": "تهران",
  "city": "تهران",
  "address": "خیابان ولیعصر، پلاک 123",
  "postalCode": "1234567890",
  "receiverName": "علی احمدی",
  "receiverMobile": "09123456789"
}
```

#### `PATCH /panel/address/:id`

ویرایش آدرس

#### `DELETE /panel/address/:id`

حذف آدرس

---

### 3. سبد خرید

#### `POST /cart`

ایجاد سبد خرید جدید یا افزودن محصول

**Request Body:**

```json
{
  "product": "507f1f77bcf86cd799439011",
  "quantity": 2
}
```

**Response:**

```json
{
  "_id": "...",
  "user": "...",
  "items": [
    {
      "product": {
        "_id": "...",
        "title": "دستبند طلا",
        "price": 12500000,
        "discount": 10,
        "images": ["..."]
      },
      "quantity": 2
    }
  ],
  "prices": {
    "totalWithoutDiscount": 25000000,
    "totalWithDiscount": 22500000,
    "totalDiscount": 2500000
  }
}
```

#### `GET /cart/:id`

دریافت جزئیات سبد خرید

#### `PATCH /cart/edit-cart-item/:id`

تغییر تعداد محصول در سبد

**Request Body:**

```json
{
  "cartItem": "cartItemId",
  "quantity": 3
}
```

#### `DELETE /cart/remove-from-cart/:id`

حذف محصول از سبد

---

### 4. ثبت سفارش و پرداخت

#### `POST /site-order`

ثبت سفارش و درخواست پرداخت

**Request Body:**

```json
{
  "cartId": "507f1f77bcf86cd799439011",
  "addressId": "507f1f77bcf86cd799439012",
  "shippingId": "507f1f77bcf86cd799439013"
}
```

**Response:**

```json
{
  "refId": "A00000000000000000000000001",
  "message": "به درگاه پرداخت منتقل شوید"
}
```

> بعد از دریافت refId، کاربر را به درگاه بانک هدایت کنید:
>
> ```
> https://bank-gateway.com/payment?authority={refId}
> ```

#### `GET /site-order/callback`

کال‌بک از درگاه پرداخت (توسط بانک فراخوانی می‌شود)

---

### 5. تیکت‌های پشتیبانی

#### `GET /panel/ticket`

لیست تیکت‌های کاربر

#### `POST /panel/ticket`

ایجاد تیکت جدید

**Request Body:**

```json
{
  "title": "مشکل در پرداخت",
  "priority": "high",
  "department": "فروش"
}
```

#### `GET /panel/ticket/:id`

مشاهده یک تیکت

#### `PATCH /panel/ticket/:id`

پاسخ به تیکت (ارسال پیام)

**Request Body:**

```json
{
  "ticket": "ticketId",
  "message": "سلام، مشکلم حل شد"
}
```

---

## 👨‍💼 APIهای مدیر

> نیاز به JWT Token + نقش Admin یا CopyWriter دارند

### 1. مدیریت کاربران (Admin فقط)

#### `GET /user`

لیست کاربران

**Query Parameters:**

```typescript
{
  page?: number;
  limit?: number;
  sort?: string;
  lastName?: string;    // جستجو در نام خانوادگی
  mobile?: string;      // جستجو در موبایل
}
```

#### `POST /user`

ایجاد کاربر جدید

**Request Body:**

```json
{
  "mobile": "09123456789",
  "password": "Pass123",
  "firstName": "رضا",
  "lastName": "محمدی",
  "role": "user" // user | copyWriter | admin
}
```

#### `GET /user/:id`

جزئیات یک کاربر

#### `PATCH /user/:id`

ویرایش کاربر

#### `DELETE /user/:id`

حذف کاربر

---

### 2. مدیریت محصولات (Admin/CopyWriter)

#### `GET /product`

لیست محصولات

**Query Parameters:**

```typescript
{
  page?: number;
  limit?: number;
  title?: string;
  category?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
}
```

#### `POST /product`

ایجاد محصول جدید

**Request Body:**

```json
{
  "title": "گردنبند طلای سفید",
  "url": "white-gold-necklace",
  "description": "گردنبند زیبا و ظریف",
  "price": 15000000,
  "discount": 5,
  "stock": 10,
  "images": ["image1.webp", "image2.webp"],
  "category": "categoryId",
  "weight": 12.5,
  "karat": 18,
  "type": "گردنبند",
  "material": "طلای سفید",
  "dimensions": "45cm",
  "hasCertificate": true,
  "certificateNumber": "CERT-2024-100"
}
```

#### `GET /product/:id`

جزئیات محصول

#### `PATCH /product/:id`

ویرایش محصول

#### `DELETE /product/:id`

حذف محصول

---

### 3. مدیریت موجودی (Admin/CopyWriter)

#### `PATCH /product/add-stock`

افزودن موجودی

**Request Body:**

```json
{
  "id": "productId",
  "quantity": 5
}
```

#### `PATCH /product/remove-stock`

کاهش موجودی

#### `GET /product/inventory-record`

تاریخچه تغییرات موجودی

**Query Parameters:**

```typescript
{
  page?: number;
  limit?: number;
  product?: string;   // فیلتر بر اساس محصول
  sort?: string;
}
```

**Response:**

```json
{
  "count": 20,
  "InventoryRecord": [
    {
      "_id": "...",
      "product": {
        "_id": "...",
        "title": "دستبند طلا"
      },
      "quantity": 5,
      "type": "increase",
      "editedBy": "admin",
      "order": null,
      "createdAt": "2024-11-01T10:00:00.000Z"
    }
  ]
}
```

---

### 4. مدیریت دسته‌بندی محصولات (Admin/CopyWriter)

#### `GET /product-category`

لیست دسته‌بندی‌ها

#### `POST /product-category`

ایجاد دسته‌بندی

**Request Body:**

```json
{
  "name": "انگشتر",
  "url": "rings",
  "image": "category-rings.webp",
  "description": "انواع انگشتر طلا"
}
```

#### `PATCH /product-category/:id`

ویرایش دسته‌بندی

#### `DELETE /product-category/:id`

حذف دسته‌بندی

---

### 5. مدیریت سفارشات (Admin فقط)

#### `GET /order`

لیست تمام سفارشات

**Query Parameters:**

```typescript
{
  page?: number;
  limit?: number;
  status?: 'paying' | 'paid' | 'sent' | 'canceled';
  userId?: string;      // فیلتر بر اساس کاربر
  mobile?: string;      // جستجو با موبایل
  sort?: string;
}
```

**Response:**

```json
{
  "count": 150,
  "orders": [
    {
      "_id": "...",
      "user": {
        "_id": "...",
        "firstName": "علی",
        "lastName": "احمدی",
        "mobile": "09123456789"
      },
      "status": "paid",
      "finalPrice": 23500000,
      "shippingPrice": 50000,
      "totalWithDiscount": 23450000,
      "totalWithoutDiscount": 25000000,
      "refId": "A00000000000000000001",
      "shipping": {
        "_id": "...",
        "name": "پست پیشتاز",
        "price": 50000
      },
      "address": {
        "province": "تهران",
        "city": "تهران",
        "address": "...",
        "postalCode": "...",
        "receiverName": "علی احمدی",
        "receiverMobile": "09123456789"
      },
      "createdAt": "2024-11-01T10:00:00.000Z"
    }
  ]
}
```

#### `GET /order/:id`

جزئیات کامل یک سفارش

**Response:**

```json
{
  "_id": "...",
  "user": { ... },
  "status": "paid",
  "finalPrice": 23500000,
  "shipping": { ... },
  "address": { ... },
  "items": [
    {
      "_id": "...",
      "product": {
        "_id": "...",
        "title": "دستبند طلا",
        "images": ["..."],
        "price": 12500000,
        "discount": 10
      },
      "quantity": 2,
      "priceWithDiscount": 22500000,
      "priceWithoutDiscount": 25000000
    }
  ],
  "createdAt": "2024-11-01T10:00:00.000Z"
}
```

#### `PATCH /order/:id`

تغییر وضعیت سفارش

**Request Body:**

```json
{
  "status": "sent" // paying | paid | sent | canceled
}
```

---

### 6. مدیریت روش‌های ارسال (Admin فقط)

#### `GET /shipping`

لیست روش‌های ارسال

#### `POST /shipping`

ایجاد روش ارسال

**Request Body:**

```json
{
  "name": "پست پیشتاز",
  "price": 50000,
  "freeShippingThreshold": 5000000,
  "description": "ارسال 2-3 روزه"
}
```

#### `PATCH /shipping/:id`

ویرایش روش ارسال

#### `DELETE /shipping/:id`

حذف روش ارسال

---

### 7. مدیریت مقالات (Admin/CopyWriter)

#### `GET /blog`

لیست مقالات

#### `POST /blog`

ایجاد مقاله

**Request Body:**

```json
{
  "title": "راهنمای خرید طلا",
  "url": "gold-buying-guide",
  "description": "چطور طلا خریداری کنیم",
  "image": "blog-image.webp",
  "category": "categoryId",
  "content": "محتوای کامل مقاله..."
}
```

#### `PATCH /blog/:id`

ویرایش مقاله

#### `DELETE /blog/:id`

حذف مقاله

---

### 8. مدیریت SEO (Admin/CopyWriter)

#### `GET /seo`

لیست تنظیمات SEO

#### `POST /seo`

ایجاد تنظیمات SEO

**Request Body:**

```json
{
  "url": "about-us",
  "title": "درباره ما - فروشگاه طلا",
  "description": "بهترین فروشگاه طلا و جواهرات",
  "keywords": ["طلا", "جواهرات"],
  "ogImage": "og-image.jpg"
}
```

#### `PATCH /seo/:id`

ویرایش SEO

#### `DELETE /seo/:id`

حذف SEO

---

### 9. مدیریت تیکت‌ها (Admin فقط)

#### `GET /ticket`

لیست تمام تیکت‌ها

**Query Parameters:**

```typescript
{
  page?: number;
  limit?: number;
  status?: 'open' | 'pending' | 'responded' | 'closed';
  priority?: 'low' | 'medium' | 'high';
  department?: string;
}
```

#### `GET /ticket/:id`

جزئیات یک تیکت

#### `POST /ticket/message`

پاسخ به تیکت

**Request Body:**

```json
{
  "ticket": "ticketId",
  "message": "پاسخ ادمین به تیکت"
}
```

#### `PATCH /ticket/:id`

تغییر وضعیت تیکت

**Request Body:**

```json
{
  "status": "closed" // open | pending | responded | closed
}
```

---

## 📁 مدیریت فایل‌ها و تصاویر

### 1. آپلود فایل

#### `POST /upload-file`

آپلود یک فایل

**Request (multipart/form-data):**

- `file`: فایل تصویر (max 2MB)
- `folder`: نام پوشه (`blog`, `product`, `productCategory`, `string`)

**Response:**

```json
{
  "fileName": "generated-filename.webp",
  "folder": "product",
  "mainPath": "/files/product/main/generated-filename.webp",
  "resizedPath": "/files/product/resized/generated-filename.webp"
}
```

> تصویر به صورت خودکار در دو اندازه (اصلی و کوچک‌شده) ذخیره می‌شود

#### `POST /upload-files`

آپلود چند فایل

**Request (multipart/form-data):**

- `files`: آرایه‌ای از فایل‌ها
- `folder`: نام پوشه

**Response:**

```json
{
  "files": [
    {
      "fileName": "file1.webp",
      "folder": "product"
    },
    {
      "fileName": "file2.webp",
      "folder": "product"
    }
  ]
}
```

#### `DELETE /delete-file`

حذف فایل

**Request Body:**

```json
{
  "fileName": "generated-filename.webp",
  "folder": "product"
}
```

---

## 💳 درگاه پرداخت

### فرآیند پرداخت:

```
1. کاربر سبد خرید را تکمیل می‌کند
   ↓
2. POST /site-order (دریافت refId)
   ↓
3. هدایت به درگاه بانک
   https://bank-gateway.com/payment?authority={refId}
   ↓
4. کاربر پرداخت را انجام می‌دهد
   ↓
5. بانک به callback برمی‌گردد
   GET /site-order/callback?authority=...&status=...
   ↓
6. Backend وضعیت پرداخت را چک می‌کند
   ↓
7. در صورت موفقیت:
   - وضعیت سفارش: paid
   - سبد خرید پاک می‌شود
   - موجودی کم می‌شود
   - Redirect به: /order/success?id=orderId

   در صورت ناموفق:
   - وضعیت سفارش: canceled
   - Redirect به: /order/failed?id=orderId
```

### Environment Variables مورد نیاز:

```env
# درگاه پرداخت
MERCHANT_ID=your-merchant-id
BANK_URL=https://api.zarinpal.com/pg/v4/payment/request.json
BANK_VERIFY_URL=https://api.zarinpal.com/pg/v4/payment/verify.json
SERVER_URL=http://localhost:4001

# Frontend
FRONTEND_URL=http://localhost:4000
```

---

## 🚀 راهنمای استفاده Frontend

### 1. نصب و راه‌اندازی

```bash
# در هر فریم‌ورک فرانت‌اند (React/Next.js/Vue)

# نصب axios
npm install axios

# ایجاد فایل API service
```

### 2. تنظیمات اولیه

```typescript
// services/api.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor برای اضافه کردن token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor برای مدیریت خطاها
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token منقضی شده - به صفحه لاگین هدایت کنید
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
```

---

### 3. مثال: Authentication

```typescript
// services/auth.service.ts
import api from './api';

export const authService = {
  // ثبت‌نام
  async signUp(data: {
    mobile: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const response = await api.post('/auth/sign-up', data);
    return response.data;
  },

  // تایید کد
  async confirm(mobile: string, code: string) {
    const response = await api.post('/auth/confirm', { mobile, code });

    // ذخیره token
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  // ورود
  async signIn(mobile: string, password: string) {
    const response = await api.post('/auth/sign-in', { mobile, password });

    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  // خروج
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/';
  },

  // دریافت کاربر فعلی
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // چک کردن لاگین بودن
  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },

  // چک کردن نقش
  hasRole(role: 'user' | 'copyWriter' | 'admin') {
    const user = this.getCurrentUser();
    return user?.role === role || user?.role === 'admin';
  },
};
```

---

### 4. مثال: محصولات

```typescript
// services/product.service.ts
import api from './api';

export const productService = {
  // دریافت لیست محصولات
  async getProducts(params: {
    page?: number;
    limit?: number;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  }) {
    const response = await api.get('/site/product', { params });
    return response.data;
  },

  // دریافت جزئیات محصول
  async getProductByUrl(url: string) {
    const response = await api.get(`/site/product/${url}`);
    return response.data;
  },

  // مدیریت محصولات (Admin)
  async createProduct(data: any) {
    const response = await api.post('/product', data);
    return response.data;
  },

  async updateProduct(id: string, data: any) {
    const response = await api.patch(`/product/${id}`, data);
    return response.data;
  },

  async deleteProduct(id: string) {
    const response = await api.delete(`/product/${id}`);
    return response.data;
  },
};
```

---

### 5. مثال: سبد خرید

```typescript
// services/cart.service.ts
import api from './api';

export const cartService = {
  // افزودن به سبد
  async addToCart(productId: string, quantity: number) {
    const response = await api.post('/cart', {
      product: productId,
      quantity,
    });
    return response.data;
  },

  // دریافت سبد خرید
  async getCart(cartId: string) {
    const response = await api.get(`/cart/${cartId}`);
    return response.data;
  },

  // تغییر تعداد
  async updateQuantity(cartId: string, cartItemId: string, quantity: number) {
    const response = await api.patch(`/cart/edit-cart-item/${cartId}`, {
      cartItem: cartItemId,
      quantity,
    });
    return response.data;
  },

  // حذف از سبد
  async removeFromCart(cartId: string, cartItemId: string) {
    const response = await api.delete(`/cart/remove-from-cart/${cartId}`, {
      data: { cartItem: cartItemId },
    });
    return response.data;
  },
};
```

---

### 6. مثال: ثبت سفارش

```typescript
// services/order.service.ts
import api from './api';

export const orderService = {
  // ثبت سفارش
  async createOrder(data: {
    cartId: string;
    addressId: string;
    shippingId: string;
  }) {
    const response = await api.post('/site-order', data);
    return response.data;
  },

  // هدایت به درگاه
  redirectToGateway(refId: string) {
    // URL درگاه بانک (مثال زرین‌پال)
    window.location.href = `https://www.zarinpal.com/pg/StartPay/${refId}`;
  },

  // مدیریت سفارشات (Admin)
  async getOrders(params: {
    page?: number;
    limit?: number;
    status?: string;
    mobile?: string;
  }) {
    const response = await api.get('/order', { params });
    return response.data;
  },

  async getOrderDetails(orderId: string) {
    const response = await api.get(`/order/${orderId}`);
    return response.data;
  },

  async updateOrderStatus(orderId: string, status: string) {
    const response = await api.patch(`/order/${orderId}`, { status });
    return response.data;
  },
};
```

---

### 7. مثال: آپلود تصویر

```typescript
// services/upload.service.ts
import api from './api';

export const uploadService = {
  // آپلود یک تصویر
  async uploadImage(file: File, folder: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await api.post('/upload-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // آپلود چند تصویر
  async uploadImages(files: File[], folder: string) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('folder', folder);

    const response = await api.post('/upload-files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // حذف تصویر
  async deleteImage(fileName: string, folder: string) {
    const response = await api.delete('/delete-file', {
      data: { fileName, folder },
    });
    return response.data;
  },

  // دریافت URL تصویر
  getImageUrl(folder: string, fileName: string, resized = false) {
    const size = resized ? 'resized' : 'main';
    return `http://localhost:4001/files/${folder}/${size}/${fileName}`;
  },
};
```

---

### 8. مثال Component React

```tsx
// components/ProductList.tsx
import { useState, useEffect } from 'react';
import { productService } from '../services/product.service';
import { uploadService } from '../services/upload.service';

interface Product {
  _id: string;
  title: string;
  price: number;
  discount: number;
  images: string[];
  weight: number;
  karat: number;
  type: string;
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadProducts();
  }, [page]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts({
        page,
        limit: 12,
        sort: 'createdAt',
      });
      setProducts(data.products);
      setTotal(data.count);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string) => {
    try {
      await cartService.addToCart(productId, 1);
      alert('محصول به سبد خرید اضافه شد');
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  if (loading) return <div>در حال بارگذاری...</div>;

  return (
    <div className="product-grid">
      {products.map((product) => (
        <div key={product._id} className="product-card">
          <img
            src={uploadService.getImageUrl('product', product.images[0], true)}
            alt={product.title}
          />
          <h3>{product.title}</h3>
          <p>
            وزن: {product.weight} گرم | عیار: {product.karat}
          </p>
          <p>نوع: {product.type}</p>

          {product.discount > 0 ? (
            <>
              <span className="old-price">
                {product.price.toLocaleString('fa-IR')} تومان
              </span>
              <span className="price">
                {(product.price * (1 - product.discount / 100)).toLocaleString(
                  'fa-IR',
                )}{' '}
                تومان
              </span>
              <span className="discount">{product.discount}% تخفیف</span>
            </>
          ) : (
            <span className="price">
              {product.price.toLocaleString('fa-IR')} تومان
            </span>
          )}

          <button onClick={() => addToCart(product._id)}>
            افزودن به سبد خرید
          </button>
        </div>
      ))}

      {/* Pagination */}
      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          قبلی
        </button>
        <span>صفحه {page}</span>
        <button disabled={page * 12 >= total} onClick={() => setPage(page + 1)}>
          بعدی
        </button>
      </div>
    </div>
  );
}
```

---

### 9. مثال Admin Panel

```tsx
// pages/admin/orders.tsx
import { useState, useEffect } from 'react';
import { orderService } from '../../services/order.service';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    mobile: '',
    page: 1,
  });

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    const data = await orderService.getOrders(filters);
    setOrders(data.orders);
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await orderService.updateOrderStatus(orderId, status);
      alert('وضعیت سفارش به‌روزرسانی شد');
      loadOrders();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="admin-orders">
      <h1>مدیریت سفارشات</h1>

      {/* Filters */}
      <div className="filters">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">همه</option>
          <option value="paying">در حال پرداخت</option>
          <option value="paid">پرداخت شده</option>
          <option value="sent">ارسال شده</option>
          <option value="canceled">لغو شده</option>
        </select>

        <input
          type="text"
          placeholder="جستجو با موبایل"
          value={filters.mobile}
          onChange={(e) => setFilters({ ...filters, mobile: e.target.value })}
        />
      </div>

      {/* Orders Table */}
      <table>
        <thead>
          <tr>
            <th>شماره سفارش</th>
            <th>مشتری</th>
            <th>موبایل</th>
            <th>مبلغ</th>
            <th>وضعیت</th>
            <th>تاریخ</th>
            <th>عملیات</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id}>
              <td>{order.refId}</td>
              <td>
                {order.user.firstName} {order.user.lastName}
              </td>
              <td>{order.user.mobile}</td>
              <td>{order.finalPrice.toLocaleString('fa-IR')} تومان</td>
              <td>
                <span className={`status-${order.status}`}>
                  {getStatusLabel(order.status)}
                </span>
              </td>
              <td>{new Date(order.createdAt).toLocaleDateString('fa-IR')}</td>
              <td>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order._id, e.target.value)}
                >
                  <option value="paid">پرداخت شده</option>
                  <option value="sent">ارسال شده</option>
                  <option value="canceled">لغو شده</option>
                </select>
                <button onClick={() => viewDetails(order._id)}>جزئیات</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getStatusLabel(status: string) {
  const labels = {
    paying: 'در حال پرداخت',
    paid: 'پرداخت شده',
    sent: 'ارسال شده',
    canceled: 'لغو شده',
  };
  return labels[status] || status;
}
```

---

## 🔒 امنیت و Best Practices

### 1. احراز هویت

- همیشه token را در localStorage ذخیره کنید
- Token را در header با فرمت `Bearer {token}` ارسال کنید
- در صورت انقضای token، کاربر را به صفحه لاگین هدایت کنید

### 2. مدیریت خطا

```typescript
// مثال مدیریت خطا
try {
  const data = await api.get('/products');
  // موفق
} catch (error) {
  if (error.response) {
    // سرور پاسخ با خطا داد
    console.error('Server error:', error.response.data);
    alert(error.response.data.message);
  } else if (error.request) {
    // درخواست ارسال شد اما پاسخی نیامد
    console.error('Network error');
    alert('خطا در اتصال به سرور');
  } else {
    // خطای دیگر
    console.error('Error:', error.message);
  }
}
```

### 3. Validation سمت کلاینت

قبل از ارسال داده، اعتبارسنجی کنید:

```typescript
function validateMobile(mobile: string) {
  return /^09\d{9}$/.test(mobile);
}

function validatePassword(password: string) {
  return password.length >= 8;
}
```

### 4. Loading States

همیشه حالت loading را نمایش دهید:

```tsx
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await api.post('/...');
  } finally {
    setLoading(false);
  }
};
```

---

## 📊 Environment Variables

فایل `.env` در root پروژه:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/horsegallery

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# درگاه پرداخت (زرین‌پال)
MERCHANT_ID=your-zarinpal-merchant-id
BANK_URL=https://api.zarinpal.com/pg/v4/payment/request.json
BANK_VERIFY_URL=https://api.zarinpal.com/pg/v4/payment/verify.json

# URLs
SERVER_URL=http://localhost:4001
FRONTEND_URL=http://localhost:4000

# API Key (اختیاری)
API_KEY=your-api-key
```

---

## 🚀 راه‌اندازی پروژه

### 1. نصب Dependencies

```bash
npm install
```

### 2. راه‌اندازی MongoDB

```bash
# اگر MongoDB از قبل نصب است:
mongod --dbpath /path/to/data

# یا با Homebrew (macOS):
brew services start mongodb-community

# یا مستقیم:
mongod --dbpath /opt/homebrew/var/mongodb --fork --logpath /opt/homebrew/var/log/mongodb/mongo.log
```

### 3. تنظیم Environment Variables

```bash
# کپی فایل نمونه
cp .env.example .env

# ویرایش .env و مقادیر را وارد کنید
nano .env
```

### 4. اجرای پروژه

```bash
# Development
npm start

# Production Build
npm run build
npm run start:prod
```

سرور روی پورت 4001 اجرا می‌شود:

- API Base: `http://localhost:4001`
- Swagger Docs: `http://localhost:4001/documentation`
- Static Files: `http://localhost:4001/files/...`

---

## 📝 نکات مهم

### 1. Rate Limiting

سیستم محدودیت نرخ درخواست دارد:

- **10 درخواست در دقیقه** برای هر IP
- در صورت بیشتر بودن، خطای 429 دریافت می‌کنید

### 2. فرمت تاریخ

تمام تاریخ‌ها در فرمت ISO 8601 هستند:

```
2024-11-01T10:00:00.000Z
```

### 3. Pagination

پیش‌فرض pagination:

- `page`: 1
- `limit`: 10

### 4. مرتب‌سازی (Sort)

مقادیر ممکن:

- `createdAt`: تاریخ ایجاد
- `updatedAt`: تاریخ به‌روزرسانی
- `title`: عنوان (الفبایی)
- `cheap`: ارزان‌ترین
- `expensive`: گران‌ترین

### 5. تصاویر

- حداکثر حجم: 2MB
- فرمت‌های مجاز: JPG, PNG, WEBP, SVG
- خروجی: WEBP (برای بهینه‌سازی)
- دو نسخه: اصلی (`main`) و کوچک‌شده (`resized`)

### 6. وضعیت‌های سفارش

```typescript
enum OrderStatus {
  Paying = 'paying', // در حال پرداخت
  Paid = 'paid', // پرداخت شده
  Sent = 'sent', // ارسال شده
  Canceled = 'canceled', // لغو شده
}
```

---

## 🎓 خلاصه برای توسعه Frontend

### APIهای ضروری برای سایت عمومی:

1. ✅ `/site/product` - لیست محصولات
2. ✅ `/site/product/:url` - جزئیات محصول
3. ✅ `/auth/*` - احراز هویت
4. ✅ `/cart/*` - سبد خرید
5. ✅ `/site-order` - ثبت سفارش
6. ✅ `/site/blog/*` - مقالات
7. ✅ `/site-seo` - SEO
8. ✅ `/site-shipping` - روش‌های ارسال

### APIهای ضروری برای پنل کاربر:

1. ✅ `/panel/address/*` - مدیریت آدرس
2. ✅ `/panel/user/:id` - پروفایل
3. ✅ `/panel/change-password` - تغییر رمز
4. ✅ `/panel/ticket/*` - تیکت‌ها

### APIهای ضروری برای پنل مدیر:

1. ✅ `/user/*` - مدیریت کاربران
2. ✅ `/product/*` - مدیریت محصولات
3. ✅ `/product-category/*` - دسته‌بندی محصولات
4. ✅ `/order/*` - **مدیریت سفارشات (جدید)**
5. ✅ `/blog/*` - مدیریت مقالات
6. ✅ `/blog-category/*` - دسته‌بندی مقالات
7. ✅ `/seo/*` - مدیریت SEO
8. ✅ `/shipping/*` - روش‌های ارسال
9. ✅ `/ticket/*` - مدیریت تیکت‌ها
10. ✅ `/upload-file` - آپلود فایل

---

## 🎉 تمام!

این backend کامل و آماده برای اتصال به Frontend است. تمام APIهای لازم برای یک فروشگاه طلا و جواهرات حرفه‌ای موجود است.

**دسترسی به مستندات Swagger:**

```
http://localhost:4001/documentation
```

در Swagger می‌توانید تمام endpoint ها را مشاهده کنید، تست کنید و نمونه‌های request/response ببینید.

---

**تاریخ آخرین به‌روزرسانی:** 2 نوامبر 2025  
**نسخه Backend:** 1.0.0  
**توسعه‌دهنده:** Gold Gallery Team
