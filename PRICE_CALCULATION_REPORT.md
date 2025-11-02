# 💰 گزارش محاسبات قیمت و تخفیف در Backend

## ✅ خلاصه: بله، تمام محاسبات در Backend انجام می‌شود!

همه محاسبات مربوط به قیمت، تخفیف، و مجموع در **backend** انجام می‌شوند و **frontend** نمی‌تواند این مقادیر را دستکاری کند.

---

## 📊 مراحل محاسبات

### 1️⃣ محاسبه قیمت سبد خرید (Cart)

**فایل:** `src/shop/services/cart.service.ts`  
**متد:** `getPrices(id: string)`

```typescript
async getPrices(id: string) {
  const items = await this.findCartItem(id);
  let totalWithoutDiscount = 0;
  let totalWithDiscount = 0;

  for (const item of items) {
    const price = item?.product?.price;           // قیمت اصلی محصول
    const discount = item?.product?.discount;     // درصد تخفیف
    const quantity = item?.quantity;              // تعداد

    // محاسبه قیمت با تخفیف
    const discountedPrice = price - price * (discount / 100);
    const itemPriceWithDiscount = discountedPrice * quantity;
    const itemPriceWithoutDiscount = price * quantity;

    totalWithoutDiscount += itemPriceWithoutDiscount;
    totalWithDiscount += itemPriceWithDiscount;
  }

  return { totalWithoutDiscount, totalWithDiscount };
}
```

**مثال محاسبه:**
```
محصول: انگشتر طلا
قیمت اصلی: 10,000,000 تومان
تخفیف: 10%
تعداد: 2

محاسبه:
discountedPrice = 10,000,000 - (10,000,000 × 0.10) = 9,000,000
itemPriceWithDiscount = 9,000,000 × 2 = 18,000,000
itemPriceWithoutDiscount = 10,000,000 × 2 = 20,000,000
```

---

### 2️⃣ ایجاد سفارش (Order Creation)

**فایل:** `src/shop/services/order.service.ts`  
**متد:** `createOrder(body: CreateOrderDto, user: string)`

```typescript
async createOrder(body: CreateOrderDto, user: string) {
  // 1. دریافت جزئیات سبد خرید (شامل محاسبات قیمت)
  const cart = await this.cartService.getCartDetails(cartId);
  
  // 2. دریافت هزینه ارسال
  const shipping = await this.shippingService.findOne(shippingId);
  const shippingPrice = 
    cart.prices.totalWithDiscount >= shipping.freeShippingThreshold
      ? 0  // ارسال رایگان
      : shipping.price;

  // 3. ایجاد سفارش با محاسبات backend
  const order = new this.orderModel({
    user: user,
    shipping: shippingId,
    address: addressId,
    cart: cartId,
    totalWithDiscount: cart.prices.totalWithDiscount,      // از backend
    totalWithoutDiscount: cart.prices.totalWithoutDiscount,// از backend
    shippingPrice: shippingPrice,                          // محاسبه شده
    finalPrice: cart.prices.totalWithDiscount + shippingPrice, // مجموع نهایی
  });

  // 4. ایجاد OrderItems با محاسبات مجدد (Double Check)
  for (const item of cart.items) {
    const price = item?.product?.price;
    const discount = item?.product?.discount;
    const quantity = item?.quantity;

    const discountedPrice = price - price * (discount / 100);
    const itemPriceWithDiscount = discountedPrice * quantity;
    const itemPriceWithoutDiscount = price * quantity;

    const orderItem = new this.orderItemModel({
      order: order._id,
      product: item.product._id,
      quantity: item.quantity,
      priceWithDiscount: itemPriceWithDiscount,
      priceWithoutDiscount: itemPriceWithoutDiscount,
    });
    await orderItem.save();
  }
}
```

**مثال کامل:**
```
محصولات سبد:
1. انگشتر: 10,000,000 × 2 = 20,000,000 (تخفیف 10%)
2. گردنبند: 15,000,000 × 1 = 15,000,000 (تخفیف 15%)

محاسبات:
totalWithoutDiscount = 20,000,000 + 15,000,000 = 35,000,000
totalWithDiscount = 18,000,000 + 12,750,000 = 30,750,000
shippingPrice = 50,000 (پست پیشتاز)
finalPrice = 30,750,000 + 50,000 = 30,800,000 ✅
```

---

## 🔒 امنیت محاسبات

### ✅ نقاط قوت:

1. **محاسبه در Backend:**
   - تمام محاسبات در سرور انجام می‌شود
   - Frontend فقط نمایش دهنده است

2. **دریافت قیمت از Database:**
   - قیمت و تخفیف مستقیماً از `Product` collection خوانده می‌شود
   - کاربر نمی‌تواند قیمت را دستکاری کند

3. **Double Check در OrderItem:**
   - محاسبات برای هر آیتم مجدداً انجام می‌شود
   - اطمینان از صحت قیمت‌ها

4. **Validation:**
   - `CreateOrderDto` ورودی‌ها را اعتبارسنجی می‌کند
   - فقط `cartId`, `addressId`, `shippingId` از frontend می‌آید

---

## ⚠️ نکات قابل بهبود

### 1. ذخیره قیمت در زمان سفارش

**مشکل فعلی:**
- اگر قیمت محصول بعد از ثبت سفارش تغییر کند، `OrderItem` همان قیمت قدیمی را نگه می‌دارد ✅

**پیشنهاد:**
این مورد قبلاً درست پیاده‌سازی شده است! در `OrderItem` قیمت‌ها ذخیره می‌شوند:
```typescript
priceWithDiscount: itemPriceWithDiscount,
priceWithoutDiscount: itemPriceWithoutDiscount,
```

### 2. Round کردن اعداد اعشاری

**پیشنهاد:**
برای جلوگیری از خطاهای محاسباتی، از `Math.round()` استفاده کنید:

```typescript
const discountedPrice = Math.round(price - price * (discount / 100));
```

### 3. بررسی مقادیر منفی

**پیشنهاد:**
اضافه کردن validation برای اطمینان از مثبت بودن قیمت‌ها:

```typescript
if (price <= 0 || quantity <= 0) {
  throw new BadRequestException('قیمت یا تعداد نامعتبر است');
}
```

### 4. محاسبه حداکثر تخفیف

**پیشنهاد:**
محدود کردن تخفیف به بازه معقول:

```typescript
if (discount < 0 || discount > 100) {
  throw new BadRequestException('درصد تخفیف باید بین 0 تا 100 باشد');
}
```

---

## 📝 فلوچارت محاسبات

```
Frontend درخواست ثبت سفارش می‌کند
         ↓
cartId, addressId, shippingId → Backend
         ↓
Backend: دریافت Cart از Database
         ↓
Backend: محاسبه totalWithDiscount از روی Products
         ↓
Backend: محاسبه shippingPrice
         ↓
Backend: finalPrice = totalWithDiscount + shippingPrice
         ↓
Backend: ذخیره Order با قیمت‌های محاسبه شده
         ↓
Backend: ایجاد OrderItems با قیمت‌های ثابت شده
         ↓
Response: refId (Authority) برای پرداخت
```

---

## 🧪 تست محاسبات

برای تست کردن محاسبات:

```bash
# 1. اضافه کردن محصول به سبد
POST /site/cart-item
{
  "productId": "...",
  "quantity": 2
}

# 2. دریافت قیمت سبد
GET /site/cart

# 3. ایجاد سفارش
POST /site/order
{
  "cartId": "...",
  "addressId": "...",
  "shippingId": "..."
}

# Backend محاسبات را انجام می‌دهد و قیمت نهایی را برمی‌گرداند
```

---

## ✅ نتیجه‌گیری

### محاسبات فعلی:
✅ در Backend انجام می‌شود  
✅ از Database قیمت می‌خواند  
✅ Frontend نمی‌تواند دستکاری کند  
✅ قیمت‌ها در Order ذخیره می‌شوند  
✅ برای هر OrderItem محاسبات مجدد انجام می‌شود  

### پیشنهادات بهبود:
🔹 اضافه کردن `Math.round()` برای دقت بیشتر  
🔹 Validation برای مقادیر منفی  
🔹 محدودیت برای درصد تخفیف  
🔹 Unit Tests برای محاسبات  

---

**🎉 سیستم محاسبات قیمت شما امن و درست پیاده‌سازی شده است!**

