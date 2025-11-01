# راهنمای راه‌اندازی پروژه

## نیازمندی‌ها

1. **Node.js** (نسخه 22 یا بالاتر) ✅ نصب شده
2. **MongoDB** (باید روی `localhost:27017` در حال اجرا باشد)
3. **npm** یا **yarn**

## مراحل نصب و راه‌اندازی

### 1. نصب وابستگی‌ها

```bash
npm install
```

### 2. راه‌اندازی MongoDB

قبل از اجرای پروژه، باید MongoDB را شروع کنید:

```bash
# اگر MongoDB به صورت سرویس نصب شده:
brew services start mongodb-community
# یا
mongod --dbpath /path/to/your/data/directory
```

### 3. بررسی فایل `.env`

مطمئن شوید که فایل `.env` موجود است و شامل متغیرهای زیر است:

```env
JWT_SECRET=your-secret-key-here
MERCHANT_ID=your-merchant-id (برای پرداخت)
BANK_VERIFY_URL=your-bank-verify-url (برای پرداخت)
BANK_URL=your-bank-url (برای پرداخت)
SERVER_URL=http://localhost:3002 (برای پرداخت)
API_KEY=your-api-key (اختیاری)
```

### 4. اجرای پروژه

```bash
# حالت توسعه (با watch mode)
npm run start:dev

# یا حالت عادی
npm run start
```

پروژه روی **پورت 3002** اجرا می‌شود.

## مشاهده APIها با Swagger

بعد از اجرای پروژه، برای مشاهده تمام APIها:

1. پروژه را اجرا کنید
2. مرورگر را باز کنید و به آدرس زیر بروید:
   ```
   http://localhost:3002/documentation
   ```

در صفحه Swagger می‌توانید:
- تمام APIهای موجود را ببینید
- مستندات کامل هر API را مشاهده کنید
- APIها را مستقیماً تست کنید
- نمونه درخواست و پاسخ را ببینید

## لیست APIهای موجود

### 🔐 Authentication (عمومی - بدون نیاز به token)
- `POST /auth/sign-in` - ورود کاربر
- `POST /auth/sign-up` - ثبت‌نام کاربر
- `POST /auth/confirm` - تایید کد
- `POST /auth/resend` - ارسال مجدد کد

### 👤 User (نیاز به JWT + نقش Admin)
- `GET /user` - لیست کاربران
- `POST /user` - ایجاد کاربر جدید
- `GET /user/:id` - جزئیات یک کاربر
- `PATCH /user/:id` - ویرایش کاربر
- `DELETE /user/:id` - حذف کاربر

### 📝 Panel (نیاز به JWT)
- `GET /panel/address` - لیست آدرس‌های کاربر
- `POST /panel/address` - افزودن آدرس
- `GET /panel/address/:id` - جزئیات آدرس
- `PATCH /panel/address/:id` - ویرایش آدرس
- `DELETE /panel/address/:id` - حذف آدرس
- `GET /panel/user/:id` - جزئیات کاربر
- `PATCH /panel/change-password` - تغییر رمز عبور

### 📰 Blog (نیاز به JWT + نقش Admin/CopyWriter)
- `GET /blog` - لیست مقالات
- `POST /blog` - ایجاد مقاله جدید
- `GET /blog/:id` - جزئیات مقاله
- `PATCH /blog/:id` - ویرایش مقاله
- `DELETE /blog/:id` - حذف مقاله

### 📂 Blog Category (نیاز به JWT + نقش Admin/CopyWriter)
- `GET /blog-category` - لیست دسته‌بندی‌های مقاله
- `POST /blog-category` - ایجاد دسته‌بندی جدید
- `GET /blog-category/:id` - جزئیات دسته‌بندی
- `PATCH /blog-category/:id` - ویرایش دسته‌بندی
- `DELETE /blog-category/:id` - حذف دسته‌بندی

### 🌐 Public Blog (عمومی - بدون نیاز به token)
- `GET /site/blog/categories` - لیست دسته‌بندی‌ها
- `GET /site/blog/categories/:url` - مقالات یک دسته‌بندی
- `GET /site/blog/:url` - نمایش مقاله با URL

### 🛍️ Product (نیاز به JWT + نقش Admin/CopyWriter)
- `GET /product` - لیست محصولات
- `POST /product` - ایجاد محصول جدید
- `GET /product/:id` - جزئیات محصول
- `PATCH /product/:id` - ویرایش محصول
- `DELETE /product/:id` - حذف محصول
- `PATCH /product/add-stock` - افزودن موجودی
- `PATCH /product/remove-stock` - کاهش موجودی
- `GET /product/inventory-record` - لیست رکوردهای موجودی

### 📁 Product Category (نیاز به JWT + نقش Admin/CopyWriter)
- `GET /product-category` - لیست دسته‌بندی‌های محصول
- `POST /product-category` - ایجاد دسته‌بندی جدید
- `GET /product-category/:id` - جزئیات دسته‌بندی
- `PATCH /product-category/:id` - ویرایش دسته‌بندی
- `DELETE /product-category/:id` - حذف دسته‌بندی

### 🌐 Public Product (عمومی)
- `GET /site/product` - لیست محصولات
- `GET /site/product/:url` - جزئیات محصول

### 🎫 Ticket (نیاز به JWT + نقش Admin)
- `GET /ticket` - لیست تیکت‌ها
- `POST /ticket` - ایجاد تیکت جدید
- `GET /ticket/:id` - جزئیات تیکت
- `PATCH /ticket/:id` - ویرایش تیکت
- `DELETE /ticket/:id` - حذف تیکت

### 🎫 Panel Ticket (نیاز به JWT)
- `GET /panel/ticket` - تیکت‌های کاربر
- `POST /panel/ticket` - ایجاد تیکت
- `GET /panel/ticket/:id` - جزئیات تیکت
- `PATCH /panel/ticket/:id` - پاسخ به تیکت

### 🛒 Cart (نیاز به JWT)
- `GET /cart` - مشاهده سبد خرید
- `POST /cart` - افزودن به سبد خرید
- `PATCH /cart` - به‌روزرسانی سبد خرید
- `DELETE /cart` - حذف از سبد خرید

### 📦 Order (نیاز به JWT)
- `GET /order` - لیست سفارش‌ها
- `POST /order` - ایجاد سفارش
- `GET /order/:id` - جزئیات سفارش

### 🌐 Public Order (عمومی)
- `POST /site/order` - ایجاد سفارش
- `GET /site/order/callback` - کال‌بک پرداخت

### 🚚 Shipping (نیاز به JWT + نقش Admin)
- `GET /shipping` - لیست روش‌های ارسال
- `POST /shipping` - ایجاد روش ارسال
- `GET /shipping/:id` - جزئیات روش ارسال
- `PATCH /shipping/:id` - ویرایش روش ارسال
- `DELETE /shipping/:id` - حذف روش ارسال

### 🌐 Public Shipping (عمومی)
- `GET /site/shipping` - لیست روش‌های ارسال

### 🔍 SEO (نیاز به JWT + نقش Admin/CopyWriter)
- `GET /seo` - لیست تنظیمات SEO
- `POST /seo` - ایجاد تنظیمات SEO
- `GET /seo/:id` - جزئیات SEO
- `PATCH /seo/:id` - ویرایش SEO
- `DELETE /seo/:id` - حذف SEO

### 🌐 Public SEO (عمومی)
- `GET /site/seo/:url` - دریافت SEO با URL

### 📤 Shared (نیاز به JWT)
- `POST /upload-file` - آپلود یک فایل
- `POST /upload-files` - آپلود چند فایل
- `DELETE /delete-file` - حذف فایل

## دسترسی به فایل‌های استاتیک

فایل‌های آپلود شده از طریق آدرس زیر قابل دسترسی هستند:
```
http://localhost:3002/files/[folder]/[filename]
```

مثال:
```
http://localhost:3002/files/blog/main/image.webp
http://localhost:3002/files/product/resized/product.webp
```

## نکات مهم

1. **Rate Limiting**: سیستم محدودیت درخواست دارد (10 درخواست در دقیقه)
2. **JWT Authentication**: اکثر APIها نیاز به Bearer Token دارند
3. **Role-based Access**: برخی APIها فقط برای Admin یا CopyWriter قابل دسترسی است
4. **Validation**: تمام درخواست‌ها اعتبارسنجی می‌شوند
5. **Database**: MongoDB باید روی `localhost:27017` و دیتابیس `nest-app` باشد

## عیب‌یابی

### خطای اتصال به MongoDB
```bash
# بررسی اینکه MongoDB در حال اجرا است:
pgrep mongod

# شروع MongoDB:
brew services start mongodb-community
# یا
mongod
```

### خطای پورت در حال استفاده
اگر پورت 3002 اشغال است:
- فایل `src/main.ts` را باز کنید
- شماره پورت را تغییر دهید (خط 43)

### خطای JWT_SECRET
مطمئن شوید که متغیر `JWT_SECRET` در فایل `.env` تنظیم شده است.

