# 🧹 خلاصه تصمیم‌گیری - فارسی

## ✅ چه چیزهایی را نگه داریم؟

### فیلدهای اصلی که استفاده می‌شوند:
- `title` / `url` / `price` / `stock` / `description` / `images` / `category` / `version`
- همه فیلدهای authentication در User
- ساختار Cart و Order (separate collections)

---

## ❌ چه چیزهایی را حذف کنیم؟

### 1. ProductCategory:
- ❌ `content` (در mock data نیست)

### 2. Product:
- ❌ `discount` (به `discountPrice` تبدیل می‌شود)
- ❌ `weight` (به `specifications.weight` منتقل می‌شود)
- ❌ `karat` (به `specifications.karat` منتقل می‌شود)
- ❌ `type` (به `subcategory` منتقل می‌شود)
- ❌ `material` (به `specifications.material` منتقل می‌شود)
- ❌ `dimensions` (به `specifications.dimensions` منتقل می‌شود)
- ❌ `hasCertificate` (در mock data نیست)
- ❌ `certificateNumber` (در mock data نیست)

### 3. ProductDto:
- ❌ `content` (در schema نیست)
- ❌ `thumbnail` (در schema نیست)

### 4. Address:
- ❌ `content` (legacy field)

---

## 🔄 چه چیزهایی را تغییر نام دهیم؟

### ProductCategory:
- `title` → `name`
- `url` → `slug`
- `image` → `heroImage`

### Product:
- `title` → `name`
- `url` → `slug`
- `discount` → `discountPrice`

### Blog:
- `url` → `slug`

---

## ➕ چه چیزهایی را اضافه کنیم؟

### ProductCategory:
- `subcategories` (array)

### Product:
- `code`, `subcategory`, `specifications`, `isAvailable`, `isFeatured`, `isBestSelling`, `isNewArrival`, `isGift`, `rating`, `reviewsCount`, `views`, `sales`

### Blog:
- `excerpt`, `tags`, `views`, `likes`, `isFeatured`, `publishedAt`, `author`

### User:
- `email`, `nationalCode`, `avatar`, `isActive`, `lastLogin`

### Address:
- `title`, `isDefault`

### CartItem:
- `size`, `price`

### Cart:
- `subtotal`, `discount`, `total`

### Order:
- `orderId`, `paymentMethod`, `paymentGateway`, `paymentStatus`, `transactionId`, `trackingCode`, `notes`

### Collections جدید:
- FAQ
- GoldPrice
- Announcement

---

## 📊 جدول مقایسه

| Collection | حذف | تغییر نام | اضافه |
|------------|-----|-----------|-------|
| ProductCategory | `content` | `title`→`name`, `url`→`slug`, `image`→`heroImage` | `subcategories` |
| Product | `discount`, `weight`, `karat`, `type`, `material`, `dimensions`, `hasCertificate`, `certificateNumber` | `title`→`name`, `url`→`slug`, `discount`→`discountPrice` | `code`, `subcategory`, `specifications`, flags, analytics |
| Blog | - | `url`→`slug` | `excerpt`, `tags`, `views`, `likes`, `isFeatured`, `publishedAt`, `author` |
| User | - | - | `email`, `nationalCode`, `avatar`, `isActive`, `lastLogin` |
| Address | `content` | - | `title`, `isDefault` |
| CartItem | - | - | `size`, `price` |
| Cart | - | - | `subtotal`, `discount`, `total` |
| Order | - | - | `orderId`, payment fields, `trackingCode`, `notes` |

---

## ⚠️ نکات مهم

1. **قبل از حذف:** داده‌های موجود را migrate کنید
2. **بعد از تغییر نام:** همه Services, Controllers, DTOs را به‌روزرسانی کنید
3. **Indexes:** بعد از تغییر نام، indexes را به‌روزرسانی کنید

---

## 🎯 نتیجه

- ✅ فیلدهای استفاده نشده حذف می‌شوند
- ✅ فیلدها به نام‌های mock data تغییر می‌کنند
- ✅ فیلدهای جدید از mock data اضافه می‌شوند
- ✅ کد تمیز و بدون فیلدهای اضافی می‌شود

