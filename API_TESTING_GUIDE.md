# 🧪 راهنمای تست API ها از Swagger

## 📋 فهرست مطالب
1. [شروع کار](#شروع-کار)
2. [ترتیب تست API ها](#ترتیب-تست-api-ها)
3. [راهنمای هر بخش](#راهنمای-هر-بخش)

---

## 🚀 شروع کار

### مرحله 1: اجرای Backend
```bash
npm run start:dev
```

### مرحله 2: باز کردن Swagger
بعد از اجرای سرور، در مرورگر برو به:
```
http://localhost:4001/documentation
```

### مرحله 3: فعال کردن Authentication
در بالای صفحه Swagger، روی دکمه **"Authorize"** کلیک کن و:
- در فیلد `Value` بنویس: `Bearer YOUR_TOKEN_HERE`
- بعد از دریافت token از API های Authentication، اینجا paste کن

---

## 📚 ترتیب تست API ها

### ✅ مرحله 1: Authentication (بدون نیاز به Token)
### ✅ مرحله 2: User APIs (با Token)
### ✅ مرحله 3: Product APIs
### ✅ مرحله 4: Blog APIs
### ✅ مرحله 5: Shop APIs
### ✅ مرحله 6: SEO APIs
### ✅ مرحله 7: Admin APIs (با Admin Token)
### ✅ مرحله 8: File Upload APIs

---

## 🔐 مرحله 1: Authentication APIs

### 1.1 Signup (ثبت نام)
**Endpoint:** `POST /auth/signup`

**Request Body:**
```json
{
  "mobile": "09123456789"
}
```

**نکات:**
- ✅ اولین بار باید این endpoint رو تست کنی
- ✅ بعد از اجرا، کد تایید به موبایل ارسال میشه (اگر SMS_ENABLED=true باشه)
- ✅ در حالت development، کد در console لاگ میشه

---

### 1.2 Confirm Code (تایید کد)
**Endpoint:** `POST /auth/confirm-code`

**Request Body:**
```json
{
  "mobile": "09123456789",
  "code": "123456"
}
```

**نکات:**
- ✅ کد رو از console لاگ بگیر (یا از SMS)
- ✅ بعد از تایید، **access_token** و **refresh_token** برمی‌گردونه
- ⚠️ **این token رو کپی کن** برای مراحل بعد!

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc..."
}
```

---

### 1.3 Signin (ورود)
**Endpoint:** `POST /auth/signin`

**Request Body:**
```json
{
  "mobile": "09123456789"
}
```

**نکات:**
- ✅ برای کاربرانی که قبلاً ثبت نام شدن
- ✅ دوباره کد تایید ارسال میشه

---

### 1.4 Refresh Token (تجدید Token)
**Endpoint:** `POST /auth/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**نکات:**
- ✅ وقتی access_token منقضی شد، از این استفاده کن
- ✅ access_token جدید برمی‌گردونه

---

### 1.5 Logout (خروج)
**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**نکات:**
- ✅ refresh_token رو از دیتابیس حذف میکنه
- ✅ نیاز به authentication داره

---

## 👤 مرحله 2: User APIs (با Token)

### قبل از شروع: Token رو در Swagger Set کن
1. روی دکمه **"Authorize"** کلیک کن
2. در فیلد `Value` بنویس: `Bearer YOUR_ACCESS_TOKEN`
3. روی **"Authorize"** کلیک کن
4. روی **"Close"** کلیک کن

---

### 2.1 Get Profile (مشخصات کاربر)
**Endpoint:** `GET /panel/profile`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**نکات:**
- ✅ مشخصات کاربر فعلی رو برمی‌گردونه
- ✅ نیاز به authentication داره

---

### 2.2 Update Profile (به‌روزرسانی مشخصات)
**Endpoint:** `PATCH /panel/profile`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request Body:**
```json
{
  "firstName": "محمد",
  "lastName": "احمدی",
  "email": "mohammad@example.com"
}
```

---

### 2.3 Get Addresses (لیست آدرس‌ها)
**Endpoint:** `GET /panel/addresses`

**Query Parameters (اختیاری):**
- `page`: شماره صفحه (پیش‌فرض: 1)
- `limit`: تعداد در هر صفحه (پیش‌فرض: 10)

---

### 2.4 Create Address (ایجاد آدرس)
**Endpoint:** `POST /panel/addresses`

**Request Body:**
```json
{
  "fullAddress": "تهران، خیابان ولیعصر، پلاک 123",
  "postalCode": "1234567890",
  "province": "تهران",
  "city": "تهران",
  "isDefault": true
}
```

---

## 📦 مرحله 3: Product APIs

### 3.1 Site Product APIs (بدون نیاز به Auth)

#### لیست محصولات
**Endpoint:** `GET /site-product`

**Query Parameters:**
- `page`: شماره صفحه
- `limit`: تعداد در هر صفحه
- `category`: فیلتر بر اساس دسته‌بندی
- `search`: جستجو
- `sort`: مرتب‌سازی (مثلاً: `price:asc`, `createdAt:desc`)

#### مشاهده محصول
**Endpoint:** `GET /site-product/{id}`

**Path Parameter:**
- `id`: شناسه محصول (MongoDB ObjectId)

---

### 3.2 Admin Product APIs (با Admin Token)

#### ایجاد محصول
**Endpoint:** `POST /product`

**Request Body:**
```json
{
  "title": "محصول تستی",
  "slug": "product-test",
  "description": "توضیحات محصول",
  "price": 1000000,
  "discount": 10,
  "stock": 100,
  "category": "CATEGORY_ID_HERE",
  "thumbnail": "image.webp",
  "images": ["image1.webp", "image2.webp"],
  "isActive": true
}
```

**نکات:**
- ✅ نیاز به Admin role داره
- ✅ `category` باید ObjectId دسته‌بندی باشه
- ✅ `thumbnail` و `images` باید قبلاً upload شده باشن

---

#### لیست محصولات (Admin)
**Endpoint:** `GET /product`

**Query Parameters:**
- `page`, `limit`, `search`, `category`, `sort`

---

#### مشاهده محصول (Admin)
**Endpoint:** `GET /product/{id}`

---

#### به‌روزرسانی محصول
**Endpoint:** `PATCH /product/{id}`

**Request Body:**
```json
{
  "title": "عنوان جدید",
  "price": 1500000,
  "stock": 50
}
```

---

#### حذف محصول
**Endpoint:** `DELETE /product/{id}`

---

### 3.3 Product Category APIs

#### لیست دسته‌بندی‌ها (Site)
**Endpoint:** `GET /site-product-category`

#### لیست دسته‌بندی‌ها (Admin)
**Endpoint:** `GET /product-category`

#### ایجاد دسته‌بندی (Admin)
**Endpoint:** `POST /product-category`

**Request Body:**
```json
{
  "title": "دسته‌بندی تستی",
  "slug": "category-test",
  "description": "توضیحات",
  "image": "category-image.webp",
  "isActive": true
}
```

---

## 📝 مرحله 4: Blog APIs

### 4.1 Site Blog APIs (بدون Auth)

#### لیست مقالات
**Endpoint:** `GET /site-blog`

**Query Parameters:**
- `page`, `limit`, `category`, `search`, `sort`

#### مشاهده مقاله
**Endpoint:** `GET /site-blog/{id}`

---

### 4.2 Admin Blog APIs (با Admin Token)

#### ایجاد مقاله
**Endpoint:** `POST /blog`

**Request Body:**
```json
{
  "title": "مقاله تستی",
  "slug": "blog-post-test",
  "content": "محتوای مقاله...",
  "excerpt": "خلاصه مقاله",
  "category": "CATEGORY_ID_HERE",
  "image": "blog-image.webp",
  "isPublished": true,
  "tags": ["tag1", "tag2"]
}
```

---

### 4.3 Blog Category APIs

#### لیست دسته‌بندی‌ها
**Endpoint:** `GET /blog-category`

#### ایجاد دسته‌بندی
**Endpoint:** `POST /blog-category`

**Request Body:**
```json
{
  "title": "دسته‌بندی بلاگ",
  "slug": "blog-category",
  "description": "توضیحات"
}
```

---

## 🛒 مرحله 5: Shop APIs

### 5.1 Cart APIs (با User Token)

#### مشاهده سبد خرید
**Endpoint:** `GET /cart`

**نکات:**
- ✅ محصولات موجود در سبد رو برمی‌گردونه
- ✅ قیمت کل و تخفیف رو محاسبه میکنه

---

#### افزودن به سبد
**Endpoint:** `POST /cart`

**Request Body:**
```json
{
  "product": "PRODUCT_ID_HERE",
  "quantity": 2
}
```

---

#### به‌روزرسانی سبد
**Endpoint:** `PATCH /cart/{id}`

**Request Body:**
```json
{
  "quantity": 5
}
```

---

#### حذف از سبد
**Endpoint:** `DELETE /cart/{id}`

---

### 5.2 Order APIs

#### ایجاد سفارش (Site)
**Endpoint:** `POST /site-order`

**Request Body:**
```json
{
  "address": "ADDRESS_ID_HERE",
  "shipping": "SHIPPING_ID_HERE"
}
```

**نکات:**
- ✅ سفارش از سبد خرید ایجاد میشه
- ✅ لینک پرداخت برمی‌گردونه

---

#### مشاهده سفارشات (Panel)
**Endpoint:** `GET /panel/order`

---

#### لیست سفارشات (Admin)
**Endpoint:** `GET /order`

**Query Parameters:**
- `page`, `limit`, `status`, `user`

---

#### به‌روزرسانی وضعیت سفارش (Admin)
**Endpoint:** `PATCH /order/{id}`

**Request Body:**
```json
{
  "status": "processing"
}
```

**Status های ممکن:**
- `pending`: در انتظار پرداخت
- `processing`: در حال پردازش
- `shipped`: ارسال شده
- `delivered`: تحویل داده شده
- `cancelled`: لغو شده

---

### 5.3 Shipping APIs

#### لیست روش‌های ارسال (Site)
**Endpoint:** `GET /site-shipping`

#### لیست روش‌های ارسال (Admin)
**Endpoint:** `GET /shipping`

#### ایجاد روش ارسال (Admin)
**Endpoint:** `POST /shipping`

**Request Body:**
```json
{
  "title": "پست پیشتاز",
  "cost": 50000,
  "estimatedDays": 3,
  "isActive": true
}
```

---

## 🔍 مرحله 6: SEO APIs

### 6.1 Site SEO (بدون Auth)

#### دریافت SEO صفحه
**Endpoint:** `GET /site-seo/{slug}`

**Path Parameter:**
- `slug`: شناسه صفحه (مثلاً: `home`, `about`, `contact`)

---

### 6.2 Admin SEO (با Admin Token)

#### ایجاد/به‌روزرسانی SEO
**Endpoint:** `POST /seo`

**Request Body:**
```json
{
  "slug": "home",
  "title": "صفحه اصلی",
  "description": "توضیحات SEO",
  "keywords": "کلمه کلیدی 1, کلمه کلیدی 2",
  "ogTitle": "عنوان Open Graph",
  "ogDescription": "توضیحات Open Graph",
  "ogImage": "og-image.webp"
}
```

---

## 👨‍💼 مرحله 7: Admin APIs (با Admin Token)

### برای دسترسی به Admin APIs:
1. باید کاربری با role `Admin` داشته باشی
2. Token اون کاربر رو در Swagger Set کن

---

### 7.1 User Management

#### لیست کاربران
**Endpoint:** `GET /user`

**Query Parameters:**
- `page`, `limit`, `search`, `role`

#### مشاهده کاربر
**Endpoint:** `GET /user/{id}`

#### به‌روزرسانی کاربر
**Endpoint:** `PATCH /user/{id}`

**Request Body:**
```json
{
  "role": "Admin",
  "firstName": "نام",
  "lastName": "نام خانوادگی"
}
```

**Role های ممکن:**
- `User`: کاربر عادی
- `Admin`: مدیر
- `CopyWriter`: نویسنده

---

### 7.2 Security Logs (لاگ‌های امنیتی)

#### لیست لاگ‌ها
**Endpoint:** `GET /admin/security-logs`

**Query Parameters:**
- `page`, `limit`, `eventType`, `user`, `mobile`, `ipAddress`

#### آمار لاگ‌ها
**Endpoint:** `GET /admin/security-logs/statistics`

**Query Parameters:**
- `days`: تعداد روز (پیش‌فرض: 7)

---

## 📁 مرحله 8: File Upload APIs

### 8.1 Upload Single File
**Endpoint:** `POST /upload/file`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: فایل عکس (JPG, PNG, WEBP)
- `folder`: نام پوشه (مثلاً: `product`, `blog`, `category`)
- `width`: عرض تصویر resized (اختیاری، پیش‌فرض: 200)
- `height`: ارتفاع تصویر resized (اختیاری، پیش‌فرض: 200)

**نکات:**
- ✅ حداکثر حجم: 10MB
- ✅ فرمت‌های مجاز: JPG, JPEG, PNG, WEBP
- ✅ فایل اصلی در `/main/` و resized در `/resized/` ذخیره میشه
- ✅ نام فایل برگشتی رو برای استفاده در Product/Blog ذخیره کن

---

### 8.2 Upload Multiple Files
**Endpoint:** `POST /upload/files`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `files`: چند فایل عکس (array)
- `folder`: نام پوشه
- `width`, `height`: ابعاد resized

**نکات:**
- ✅ حداکثر 10 فایل در یک درخواست

---

## 🧪 نکات مهم برای تست

### 1. Authentication
- ✅ همیشه token رو در Swagger Set کن قبل از تست API های محافظت شده
- ✅ اگر token منقضی شد، از `/auth/refresh-token` استفاده کن

### 2. Error Handling
- ✅ اگر خطای 401 دیدی → token رو دوباره set کن
- ✅ اگر خطای 403 دیدی → نقش کاربر کافیه نیست (Admin نیاز داره)
- ✅ اگر خطای 400 دیدی → Request body رو چک کن (validation)

### 3. ObjectId
- ✅ تمام ID ها باید MongoDB ObjectId معتبر باشن
- ✅ فرمت: 24 کاراکتر hexadecimal (مثلاً: `507f1f77bcf86cd799439011`)

### 4. Pagination
- ✅ برای لیست‌ها، از `page` و `limit` استفاده کن
- ✅ Response شامل `count` (تعداد کل) و داده‌هاست

### 5. Response Format
```json
{
  "count": 100,
  "data": [...]
}
```

---

## 📝 ترتیب پیشنهادی تست

### روز اول (Basic):
1. ✅ Authentication (signup, confirm, signin)
2. ✅ User Profile (get, update)
3. ✅ Site Product (list, get)
4. ✅ Site Blog (list, get)

### روز دوم (Admin):
1. ✅ Admin Product (CRUD)
2. ✅ Admin Blog (CRUD)
3. ✅ File Upload
4. ✅ User Management

### روز سوم (Shop):
1. ✅ Cart (add, update, delete)
2. ✅ Order (create, list)
3. ✅ Shipping
4. ✅ Payment callback

---

## 🎯 تست End-to-End (سناریوی کامل)

### سناریو: خرید محصول

1. **ثبت نام کاربر:**
   ```
   POST /auth/signup → mobile
   POST /auth/confirm-code → token
   ```

2. **مشاهده محصولات:**
   ```
   GET /site-product
   GET /site-product/{id}
   ```

3. **افزودن به سبد:**
   ```
   POST /cart → {product: ID, quantity: 2}
   GET /cart
   ```

4. **ایجاد آدرس:**
   ```
   POST /panel/addresses → address
   ```

5. **انتخاب روش ارسال:**
   ```
   GET /site-shipping
   ```

6. **ایجاد سفارش:**
   ```
   POST /site-order → {address, shipping}
   → paymentUrl
   ```

7. **پرداخت:**
   - لینک پرداخت رو باز کن
   - بعد از پرداخت، به callback redirect میشه

---

## ✅ چک‌لیست نهایی

- [ ] Authentication APIs کار می‌کنند
- [ ] User APIs با token کار می‌کنند
- [ ] Product APIs (Site + Admin) کار می‌کنند
- [ ] Blog APIs (Site + Admin) کار می‌کنند
- [ ] Shop APIs (Cart + Order) کار می‌کنند
- [ ] File Upload کار می‌کنه
- [ ] Admin APIs با Admin token کار می‌کنند
- [ ] Error handling درست کار می‌کنه
- [ ] Validation پیام‌های فارسی داره

---

**موفق باشید! 🚀**
