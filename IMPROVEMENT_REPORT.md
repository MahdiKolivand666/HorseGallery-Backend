# گزارش بررسی و بهبود پروژه Gold Gallery Backend

**تاریخ:** 2025-02-11  
**نسخه پروژه:** NestJS Backend  
**هدف:** سفارشی‌سازی برای سایت Gold Gallery

---

## 📋 فهرست مطالب

1. [نقاط قوت پروژه](#نقاط-قوت-پروژه)
2. [مشکلات و نیاز به بهبود](#مشکلات-و-نیاز-به-بهبود)
3. [پیشنهادات بهبود](#پیشنهادات-بهبود)
4. [چک‌لیست سفارشی‌سازی](#چک‌لیست-سفارشی‌سازی)
5. [راهنمای پیاده‌سازی](#راهنمای-پیاده‌سازی)

---

## ✅ نقاط قوت پروژه

### 1. ساختار منظم

- ✅ ماژول‌های جداگانه و منظم
- ✅ جداسازی Controller, Service, DTO, Schema
- ✅ استفاده از NestJS Best Practices

### 2. مستندسازی

- ✅ Swagger Integration برای API Documentation
- ✅ کامنت‌های فارسی در کد
- ✅ فایل SETUP.md برای راه‌اندازی

### 3. امنیت

- ✅ JWT Authentication
- ✅ Role-based Authorization
- ✅ Helmet برای امنیت HTTP Headers
- ✅ Rate Limiting با Throttler

### 4. قابلیت‌ها

- ✅ سیستم پرداخت بانکی پیاده‌سازی شده
- ✅ مدیریت محصولات و دسته‌بندی
- ✅ سبد خرید و سفارش
- ✅ سیستم تیکت پشتیبانی
- ✅ SEO Management
- ✅ مدیریت کاربران و احراز هویت

---

## ⚠️ مشکلات و نیاز به بهبود

### 🔴 مشکلات امنیتی (اولویت بالا)

#### 1. JWT Guard - عدم پرتاب خطای مناسب

**فایل:** `src/shared/guards/jwt.guard.ts`

**مشکل:**

```typescript
catch (error) {
  return false; // ❌ باید خطا پرتاب کند
}
```

**راه حل:**

```typescript
catch (error) {
  throw new UnauthorizedException('Invalid or expired token');
}
```

**چرا مهم است؟**

- Frontend نمی‌تواند تفاوت بین "token ندارم" و "token معتبر نیست" را تشخیص دهد
- تجربه کاربری بهتر با پیام خطای واضح

---

#### 2. Callback URL خالی در Payment

**فایل:** `src/shop/controllers/site-order.controller.ts`

**مشکل:**

```typescript
// خط 48 و 50
return response.redirect(''); // ❌ URL خالی است!
```

**راه حل:**

```typescript
// بعد از پرداخت موفق
if (bankResponse.status === 101) {
  // ...
  await order.save();
  return response.redirect(
    `${process.env.FRONTEND_URL}/order/success?id=${order._id}`,
  );
} else {
  // ...
  return response.redirect(
    `${process.env.FRONTEND_URL}/order/failed?id=${order._id}`,
  );
}
```

**چرا مهم است؟**

- کاربر بعد از پرداخت باید به صفحه مناسب redirect شود
- تجربه کاربری ضعیف با redirect خالی

---

#### 3. عدم مدیریت خطا در درخواست‌های بانکی

**فایل:** `src/shop/services/order.service.ts`

**مشکل:**

```typescript
// خط 111 و 123
const response = await axios.post(process.env.BANK_VERIFY_URL!, bankData);
// ❌ اگر درخواست fail بشه، خطای unhandled می‌دهد
```

**راه حل:**

```typescript
async checkOrder(id: string) {
  try {
    const order = await this.findOneOrder(id);
    const bankData = {
      merchant_id: process.env.MERCHANT_ID,
      amount: order.finalPrice * 10,
      authority: order.refId,
    };

    const response = await axios.post(process.env.BANK_VERIFY_URL!, bankData);
    return response?.data?.data;
  } catch (error) {
    throw new BadRequestException('خطا در ارتباط با درگاه بانکی');
  }
}
```

**چرا مهم است؟**

- خطاهای شبکه یا timeout باید handle شوند
- بدون try-catch، کل اپلیکیشن crash می‌کند

---

#### 4. استفاده از `any` در TypeScript

**فایل‌های مشکل‌دار:**

- `src/shop/controllers/site-order.controller.ts` (خط 31)
- `src/blog/services/blog.service.ts`
- `src/product/services/product.service.ts`
- `src/user/services/address.service.ts`

**مشکل:**

```typescript
async callback(@Query() query: any, @Res() response: Response) {
  // ❌ استفاده از any
}
```

**راه حل:**

```typescript
class PaymentCallbackDto {
  @IsString()
  @IsOptional()
  authority?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

async callback(@Query() query: PaymentCallbackDto, @Res() response: Response) {
  // ✅ type-safe
}
```

**چرا مهم است؟**

- Type Safety کمتر = احتمال bug بیشتر
- IDE autocomplete بهتر می‌شود
- Refactoring راحت‌تر می‌شود

---

### 🟡 مشکلات کیفیت کد

#### 5. Typo در متغیر

**فایل:** `src/shared/pipes/farsi.pipe.ts`

**مشکل:**

```typescript
const errrors: string[] = []; // ❌ سه تا r
```

**راه حل:**

```typescript
const errors: string[] = []; // ✅
```

---

#### 6. Import استفاده نشده

**فایل:** `src/app.module.ts`

**مشکل:**

```typescript
import { request } from 'axios'; // ❌ استفاده نشده
```

**راه حل:**

```typescript
// حذف این import
```

---

#### 7. Console.log در Production Code

**فایل‌های مشکل‌دار:**

- `src/shared/utils/file-utils.ts` (خط 46)
- `src/seo/services/seo.service.ts` (خط 52)
- `src/user/services/user.service.ts` (خط 127)
- `src/shared/guards/api-key.guard.ts` (خط 11-12)

**مشکل:**

```typescript
console.log('Error deleting images:', error); // ❌ در production نباید باشد
```

**راه حل:**

```typescript
// استفاده از Logger NestJS
import { Logger } from '@nestjs/common';

private readonly logger = new Logger(FileUtils.name);

this.logger.error('Error deleting images:', error);
```

**چرا مهم است؟**

- Console.log در production performance را کاهش می‌دهد
- Logger NestJS قابلیت log level دارد
- می‌توان در production فقط error log کرد

---

#### 8. کدهای کامنت شده

**فایل‌های مشکل‌دار:**

- `src/app.controller.ts` (خط 95-129)
- `src/main.ts` (خط 7-8, 18, 33)

**راه حل:**

- اگر کد لازم نیست: **حذف کن**
- اگر ممکنه بعدا لازم باشه: **حفظ در git history** و حذف از کد

**بهتر است:**

```typescript
// ❌ این کد کامنت شده رو حذف کن
// @Delete('delete-image')
// ...

// ✅ یا اگر واقعا لازمه، توی TODO comment بذار
// TODO: Implement delete-image endpoint if needed
```

---

### 🟢 بهبودهای پیشنهادی

#### 9. نام‌گذاری و Branding

**Swagger Title:**
**فایل:** `src/main.ts`

**مشکل:**

```typescript
.setTitle('Nest App') // ❌ generic است
```

**راه حل:**

```typescript
.setTitle('Gold Gallery API')
.setDescription('Backend API for Gold Gallery E-commerce Platform')
.setVersion('1.0')
```

---

**CORS Configuration:**
**فایل:** `src/main.ts`

**مشکل:**

```typescript
app.enableCors(); // ❌ خیلی open است
```

**راه حل:**

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4000',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

**چرا مهم است؟**

- امنیت بیشتر
- فقط frontend مجاز می‌تواند به API دسترسی داشته باشد

---

#### 10. Environment Variables

**بهتر است از ConfigService استفاده شود:**

```typescript
// به جای مستقیم process.env
const bankData = {
  merchant_id: process.env.MERCHANT_ID,
  // ...
};

// بهتر است:
constructor(
  private readonly configService: ConfigService,
) {}

const bankData = {
  merchant_id: this.configService.get<string>('MERCHANT_ID'),
  // ...
};
```

**مزایا:**

- Type-safe
- Validation در startup
- Default values

---

#### 11. فیلدهای اضافی برای محصولات طلا

**فایل:** `src/product/schemas/product.schema.ts`

**فیلدهای پیشنهادی:**

```typescript
@Schema({ timestamps: true })
export class Product extends Document {
  // ... فیلدهای موجود

  @Prop({ required: false })
  weight: number; // وزن به گرم

  @Prop({ required: false })
  karat: number; // عیار (18, 21, 24)

  @Prop({
    required: false,
    enum: ['دستبند', 'گردنبند', 'انگشتر', 'گوشواره', 'پابند', 'سایر'],
  })
  type: string; // نوع جواهر

  @Prop({
    required: false,
    enum: ['طلای زرد', 'طلای سفید', 'طلای رزگلد'],
  })
  material: string; // جنس طلا

  @Prop({ required: false })
  dimensions: string; // ابعاد

  @Prop({ default: false })
  hasCertificate: boolean; // گواهی اصالت

  @Prop({ required: false })
  certificateNumber: string; // شماره گواهی
}
```

**همچنین در DTO:**

**فایل:** `src/product/dtos/product.dto.ts`

```typescript
export class ProductDto {
  // ... فیلدهای موجود

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsNumber()
  @IsOptional()
  karat?: number;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  material?: string;

  @IsString()
  @IsOptional()
  dimensions?: string;

  @IsBoolean()
  @IsOptional()
  hasCertificate?: boolean;

  @IsString()
  @IsOptional()
  certificateNumber?: string;
}
```

---

#### 12. Error Handling بهتر

**ساخت یک Custom Exception Filter:**

```typescript
// src/shared/filters/http-exception.filter.ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}
```

---

#### 13. Validation Messages بهتر

**استفاده از پیام‌های فارسی در Validation:**

```typescript
// در DTOها
export class ProductDto {
  @IsString({ message: 'عنوان محصول الزامی است' })
  @IsNotEmpty({ message: 'عنوان محصول نمی‌تواند خالی باشد' })
  title: string;

  @IsNumber({}, { message: 'قیمت باید عدد باشد' })
  @Min(0, { message: 'قیمت نمی‌تواند منفی باشد' })
  price: number;
}
```

---

## 📝 چک‌لیست سفارشی‌سازی برای Gold Gallery

### 🔴 اولویت بالا (باید فورا انجام شود)

- [ ] **اصلاح Callback URL در Payment**
  - فایل: `src/shop/controllers/site-order.controller.ts`
  - اضافه کردن URL صحیح برای redirect بعد از پرداخت
- [ ] **مدیریت خطا در درخواست‌های بانکی**
  - فایل: `src/shop/services/order.service.ts`
  - اضافه کردن try-catch برای axios requests
- [ ] **Type Safety برای Callback Query**
  - فایل: `src/shop/controllers/site-order.controller.ts`
  - ایجاد DTO برای callback parameters

- [ ] **حذف Console.log از Production Code**
  - فایل‌ها: `file-utils.ts`, `seo.service.ts`, `user.service.ts`, `api-key.guard.ts`
  - جایگزینی با NestJS Logger

### 🟡 اولویت متوسط (باید در اسرع وقت انجام شود)

- [ ] **اصلاح Typo "errrors"**
  - فایل: `src/shared/pipes/farsi.pipe.ts`
- [ ] **حذف Import استفاده نشده**
  - فایل: `src/app.module.ts`
- [ ] **حذف کدهای کامنت شده**
  - فایل‌ها: `app.controller.ts`, `main.ts`
- [ ] **تغییر Swagger Title**
  - فایل: `src/main.ts`
  - تغییر به "Gold Gallery API"
- [ ] **تنظیم CORS**
  - فایل: `src/main.ts`
  - محدود کردن به frontend URL

### 🟢 اولویت پایین (می‌تواند بعدا انجام شود)

- [ ] **استفاده از ConfigService**
  - جایگزین کردن process.env مستقیم
- [ ] **افزودن فیلدهای محصول طلا**
  - وزن، عیار، نوع، جنس، ابعاد، گواهی
  - فایل‌ها: `product.schema.ts`, `product.dto.ts`
- [ ] **بهبود Error Handling**
  - ایجاد Custom Exception Filter
  - پیام‌های خطای یکپارچه
- [ ] **بهبود Validation Messages**
  - پیام‌های فارسی در DTOها
- [ ] **Refactoring استفاده از `any`**
  - جایگزینی با تایپ‌های دقیق در همه serviceها

---

## 🛠️ راهنمای پیاده‌سازی

### مرحله 1: مشکلات امنیتی

#### 1.1 اصلاح Callback URL

```typescript
// src/shop/controllers/site-order.controller.ts
async callback(@Query() query: PaymentCallbackDto, @Res() response: Response) {
  if (query.authority) {
    const order = await this.orderService.findOrderByRefId(query.authority);
    const bankResponse = await this.orderService.checkOrder(
      (order._id as Types.ObjectId).toString(),
    );

    if (bankResponse.status === 101) {
      order.status = OrderStatus.Paid;
      await this.cartService.removeCartAndItems(order.cart.toString());
      await order.save();
      return response.redirect(
        `${process.env.FRONTEND_URL}/order/success?id=${order._id}`
      );
    } else {
      order.status = OrderStatus.Canceled;
      await order.save();
      return response.redirect(
        `${process.env.FRONTEND_URL}/order/failed?id=${order._id}`
      );
    }
  } else {
    return response.redirect(`${process.env.FRONTEND_URL}/order/failed`);
  }
}
```

#### 1.2 ایجاد DTO برای Callback

```typescript
// src/shop/dtos/payment-callback.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class PaymentCallbackDto {
  @IsString()
  @IsOptional()
  authority?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
```

#### 1.3 مدیریت خطا در Payment Service

```typescript
// src/shop/services/order.service.ts
async checkOrder(id: string) {
  try {
    const order = await this.findOneOrder(id);
    const bankData = {
      merchant_id: process.env.MERCHANT_ID,
      amount: order.finalPrice * 10,
      authority: order.refId,
    };

    const response = await axios.post(process.env.BANK_VERIFY_URL!, bankData);
    return response?.data?.data;
  } catch (error) {
    throw new BadRequestException('خطا در ارتباط با درگاه بانکی');
  }
}

async createPaymentRequest(finalPrice: number) {
  try {
    const bankData = {
      merchant_id: process.env.MERCHANT_ID,
      amount: finalPrice * 10,
      description: 'سفارش از Gold Gallery',
      callback_url: `${process.env.SERVER_URL}/site/order/callback`,
    };

    const response = await axios.post(process.env.BANK_URL!, bankData);
    return response?.data?.data;
  } catch (error) {
    throw new BadRequestException('خطا در ایجاد درخواست پرداخت');
  }
}
```

---

### مرحله 2: بهبود کیفیت کد

#### 2.1 استفاده از Logger

```typescript
// src/shared/utils/file-utils.ts
import { Logger } from '@nestjs/common';

const logger = new Logger('FileUtils');

export const deleteImages = async (fileName: string, folder: string) => {
  // ...
  try {
    await fs.promises.unlink(`${imagePath}/main/${fileName}`);
    await fs.promises.unlink(`${imagePath}/resized/${fileName}`);
    return { success: true, message: 'Images deleted successfully' };
  } catch (error) {
    logger.error(`Error deleting images: ${error.message}`, error.stack);
    throw new Error(`Failed to delete images: ${error.message}`);
  }
};
```

#### 2.2 تنظیم Swagger و CORS

```typescript
// src/main.ts
const config = new DocumentBuilder()
  .setTitle('Gold Gallery API')
  .setDescription('Backend API for Gold Gallery E-commerce Platform')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4000',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

---

### مرحله 3: افزودن فیلدهای محصول طلا

#### 3.1 به‌روزرسانی Schema

```typescript
// src/product/schemas/product.schema.ts
@Prop({ required: false })
weight: number;

@Prop({ required: false })
karat: number;

@Prop({
  required: false,
  enum: ['دستبند', 'گردنبند', 'انگشتر', 'گوشواره', 'پابند', 'سایر']
})
type: string;

@Prop({
  required: false,
  enum: ['طلای زرد', 'طلای سفید', 'طلای رزگلد']
})
material: string;

@Prop({ required: false })
dimensions: string;

@Prop({ default: false })
hasCertificate: boolean;

@Prop({ required: false })
certificateNumber: string;
```

#### 3.2 به‌روزرسانی DTO

```typescript
// src/product/dtos/product.dto.ts
@IsNumber()
@IsOptional()
@Min(0)
weight?: number;

@IsNumber()
@IsOptional()
@IsIn([18, 21, 24])
karat?: number;

@IsString()
@IsOptional()
@IsIn(['دستبند', 'گردنبند', 'انگشتر', 'گوشواره', 'پابند', 'سایر'])
type?: string;

@IsString()
@IsOptional()
@IsIn(['طلای زرد', 'طلای سفید', 'طلای رزگلد'])
material?: string;

@IsString()
@IsOptional()
dimensions?: string;

@IsBoolean()
@IsOptional()
hasCertificate?: boolean;

@IsString()
@IsOptional()
certificateNumber?: string;
```

---

## 📋 Environment Variables مورد نیاز

```env
# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Database
MONGODB_URI=mongodb://localhost:27017/horsegallery

# Server
PORT=4001
SERVER_URL=http://localhost:4001
FRONTEND_URL=http://localhost:4000

# Payment Gateway
MERCHANT_ID=your-merchant-id
BANK_URL=https://bank-gateway-url.com/api/payment/request
BANK_VERIFY_URL=https://bank-gateway-url.com/api/payment/verify

# Optional
API_KEY=your-api-key-if-needed
```

---

## 🔍 تست کردن تغییرات

### 1. تست Authentication

```bash
# Test invalid token
curl -X GET http://localhost:4001/user \
  -H "Authorization: Bearer invalid-token"
# باید 401 برگرداند
```

### 2. تست Payment Callback

```bash
# Test callback با authority
curl -X GET "http://localhost:4001/site/order/callback?authority=test123"
# باید به frontend redirect کند
```

### 3. تست Product با فیلدهای جدید

```bash
# Test create product با فیلدهای طلا
curl -X POST http://localhost:4001/product \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "دستبند طلا",
    "weight": 25.5,
    "karat": 18,
    "type": "دستبند",
    "material": "طلای زرد",
    "hasCertificate": true
  }'
```

---

## 📚 منابع مفید

- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/authentication)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [MongoDB Best Practices](https://docs.mongodb.com/manual/administration/production-notes/)

---

## ✅ نتیجه‌گیری

پروژه شما ساختار خوبی دارد و برای Gold Gallery قابل استفاده است. با انجام تغییرات پیشنهادی:

1. **امنیت** بهتر می‌شود
2. **کیفیت کد** بالا می‌رود
3. **قابلیت نگهداری** افزایش می‌یابد
4. **تجربه کاربری** بهتر می‌شود

**توصیه:** تغییرات را به صورت مرحله‌ای انجام دهید:

- هفته 1: مشکلات امنیتی
- هفته 2: بهبود کیفیت کد
- هفته 3: افزودن فیلدهای محصول طلا
- هفته 4: تست و بهینه‌سازی

---

**تهیه شده در:** 2025-02-11  
**نسخه:** 1.0
