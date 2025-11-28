# 📋 خلاصه تفاوت‌های Schema - فارسی

## 🔴 تفاوت‌های اصلی

### 1. **ProductCategory** 
- ❌ `name` → backend: `title`
- ❌ `slug` → backend: `url`  
- ❌ `heroImage` → backend: `image`
- ❌ **`subcategories`** → کاملاً جدید، باید اضافه شود

### 2. **Product**
- ❌ `name` → backend: `title`
- ❌ `slug` → backend: `url`
- ❌ **`code`** → جدید (مثل GN-001-18K)
- ❌ `discountPrice` → backend: `discount` (مقدار تخفیف)
- ❌ **`subcategory`** → کاملاً جدید
- ❌ **`specifications`** → جدید (جایگزین فیلدهای پراکنده)
- ❌ **`isAvailable`, `isFeatured`, `isBestSelling`, `isNewArrival`, `isGift`** → همه جدید
- ❌ **`rating`, `reviewsCount`, `views`, `sales`** → analytics جدید

### 3. **Blog**
- ❌ `slug` → backend: `url`
- ❌ **`excerpt`** → جدید
- ❌ **`tags`** → جدید
- ❌ **`views`, `likes`** → جدید
- ❌ **`isFeatured`** → جدید
- ❌ **`publishedAt`** → جدید
- ❌ `author` (object) → backend: `user` (ObjectId)

### 4. **User**
- ❌ **`email`** → جدید
- ❌ **`nationalCode`** → جدید
- ❌ **`avatar`** → جدید
- ❌ **`isActive`** → جدید
- ❌ **`lastLogin`** → جدید

### 5. **Address**
- ❌ **`title`** → جدید (خانه، محل کار)
- ❌ **`isDefault`** → جدید
- ✅ `recipientName` → backend: `receiverName` (نام متفاوت)

### 6. **Cart**
- ❌ Backend از **separate CartItem collection** استفاده می‌کند
- ❌ Mock data از **embedded items array** استفاده می‌کند
- ❌ **`size`** در CartItem وجود ندارد
- ❌ **`price`** در CartItem وجود ندارد
- ❌ **`subtotal`, `discount`, `total`** در Cart وجود ندارند

### 7. **Order**
- ❌ **`orderId`** → جدید (شماره سفارش unique)
- ❌ **`paymentMethod`, `paymentGateway`, `paymentStatus`, `transactionId`** → همه جدید
- ❌ **`trackingCode`** → جدید
- ❌ **`notes`** → جدید
- ❌ `status` enum متفاوت است
- ❌ Mock data از embedded items استفاده می‌کند

### 8. **Collections جدید**
- ❌ **FAQ** → باید ایجاد شود
- ❌ **GoldPrice** → باید ایجاد شود  
- ❌ **Announcement** → باید ایجاد شود

---

## ✅ راهکار پیشنهادی

### Option 1: به‌روزرسانی Schema ها (پیشنهادی)
- فیلدهای جدید را اضافه کنید
- فیلدهای قدیمی را نگه دارید (backward compatibility)
- در زمان import، mapping انجام دهید

### Option 2: فقط Mapping در Import
- Schema ها را تغییر ندهید
- در زمان import، فیلدها را map کنید:
  - `name` → `title`
  - `slug` → `url`
  - و غیره

---

## 📝 فایل‌های مورد نیاز

1. ✅ `SCHEMA_COMPARISON_REPORT.md` - گزارش کامل (انگلیسی)
2. ✅ `SCHEMA_DIFFERENCES_SUMMARY.md` - این فایل (فارسی)
3. ⏳ Migration script برای import
4. ⏳ Schema updates (اختیاری)

