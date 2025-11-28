# 📊 گزارش مقایسه Schema های Backend با Mock Data

این گزارش تفاوت‌های بین schema های فعلی backend و داده‌های mock که می‌خواهید import کنید را نشان می‌دهد.

---

## 1️⃣ Categories Collection

### ✅ فیلدهای موجود در Backend:
```typescript
// ProductCategory Schema
{
  title: string;
  content: string;
  image: string;
  url: string;  // unique
}
```

### 📋 فیلدهای Mock Data:
```typescript
{
  name: string;           // ❌ در backend: title
  slug: string;           // ❌ در backend: url
  heroImage: string;      // ❌ در backend: image
  subcategories: Array<{
    name: string;
    slug: string;
  }>;                     // ❌ کاملاً جدید
}
```

### 🔴 تفاوت‌ها:
- ❌ **`name` vs `title`**: Mock data از `name` استفاده می‌کند، backend از `title`
- ❌ **`slug` vs `url`**: Mock data از `slug` استفاده می‌کند، backend از `url`
- ❌ **`heroImage` vs `image`**: نام فیلد متفاوت است
- ❌ **`subcategories`**: این فیلد در backend وجود ندارد و باید اضافه شود
- ❌ **`content`**: در mock data وجود ندارد

### ✅ پیشنهاد:
```typescript
@Schema({ timestamps: true })
export class ProductCategory extends Document {
  @Prop()
  name: string;  // یا title را نگه دارید و mapping کنید
  
  @Prop({ unique: true, required: true })
  slug: string;  // یا url را نگه دارید
  
  @Prop()
  heroImage: string;  // یا image را نگه دارید
  
  @Prop([{
    name: String,
    slug: String
  }])
  subcategories: Array<{
    name: string;
    slug: string;
  }>;
  
  // برای backward compatibility
  @Prop()
  title?: string;
  
  @Prop()
  url?: string;
  
  @Prop()
  image?: string;
  
  @Prop()
  content?: string;
}
```

---

## 2️⃣ Products Collection

### ✅ فیلدهای موجود در Backend:
```typescript
{
  title: string;
  url: string;
  price: number;
  discount: number;  // مقدار تخفیف
  stock: number;
  version: number;
  description: string;
  images: string[];
  category: ObjectId;  // ref to ProductCategory
  weight?: number;
  karat?: number;
  type?: ProductType;  // enum
  material?: MaterialType;  // enum
  dimensions?: string;
  hasCertificate?: boolean;
  certificateNumber?: string;
}
```

### 📋 فیلدهای Mock Data:
```typescript
{
  name: string;                    // ❌ در backend: title
  slug: string;                    // ❌ در backend: url
  code: string;                    // ❌ جدید
  description: string;             // ✅ موجود
  price: number;                    // ✅ موجود
  discountPrice?: number;          // ❌ در backend: discount (مقدار تخفیف)
  images: string[];                // ✅ موجود
  category: {                      // ❌ در backend: ObjectId ref
    name: string;
    slug: string;
  };
  subcategory: {                   // ❌ جدید
    name: string;
    slug: string;
  };
  specifications: {                // ❌ جدید (جایگزین فیلدهای پراکنده)
    weight: string;
    karat: string;
    material: string;
    dimensions?: string;
    coverage?: string;
    brand?: string;
  };
  stock: number;                   // ✅ موجود
  isAvailable: boolean;            // ❌ جدید
  isFeatured: boolean;             // ❌ جدید
  isBestSelling: boolean;          // ❌ جدید
  isNewArrival: boolean;           // ❌ جدید
  isGift: boolean;                 // ❌ جدید
  rating?: number;                 // ❌ جدید
  reviewsCount?: number;           // ❌ جدید
  views: number;                   // ❌ جدید
  sales: number;                   // ❌ جدید
}
```

### 🔴 تفاوت‌های مهم:
1. **نام فیلدها**: `name` vs `title`, `slug` vs `url`
2. **کد محصول**: `code` در mock data وجود دارد اما در backend نیست
3. **تخفیف**: Mock data از `discountPrice` (قیمت نهایی) استفاده می‌کند، backend از `discount` (مقدار تخفیف)
4. **Category Structure**: Mock data از embedded object استفاده می‌کند، backend از ObjectId ref
5. **Subcategory**: کاملاً جدید
6. **Specifications**: Mock data همه چیز را در یک object قرار داده
7. **Flag Fields**: `isAvailable`, `isFeatured`, `isBestSelling`, `isNewArrival`, `isGift` وجود ندارند
8. **Analytics**: `rating`, `reviewsCount`, `views`, `sales` وجود ندارند

### ✅ پیشنهاد Schema:
```typescript
@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true })
  name: string;  // یا title
  
  @Prop({ required: true, unique: true })
  slug: string;  // یا url
  
  @Prop({ required: true, unique: true })
  code: string;  // کد محصول مثل GN-001-18K
  
  @Prop({ required: true })
  description: string;
  
  @Prop({ required: true })
  price: number;
  
  @Prop()
  discountPrice?: number;  // قیمت نهایی بعد از تخفیف
  
  @Prop({ default: 0 })
  discount?: number;  // مقدار تخفیف (برای backward compatibility)
  
  @Prop([String])
  images: string[];
  
  // Category - می‌تواند ObjectId ref باشد یا embedded
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProductCategory' })
  category?: ProductCategory;
  
  @Prop({
    type: {
      name: String,
      slug: String
    }
  })
  categoryInfo?: {
    name: string;
    slug: string;
  };
  
  // Subcategory - جدید
  @Prop({
    type: {
      name: String,
      slug: String
    }
  })
  subcategory?: {
    name: string;
    slug: string;
  };
  
  // Specifications - جدید
  @Prop({
    type: {
      weight: String,
      karat: String,
      material: String,
      dimensions: String,
      coverage: String,
      brand: String
    }
  })
  specifications?: {
    weight: string;
    karat: string;
    material: string;
    dimensions?: string;
    coverage?: string;
    brand?: string;
  };
  
  // Legacy fields برای backward compatibility
  @Prop()
  weight?: number;
  
  @Prop()
  karat?: number;
  
  @Prop({ enum: ProductType })
  type?: ProductType;
  
  @Prop({ enum: MaterialType })
  material?: MaterialType;
  
  @Prop()
  dimensions?: string;
  
  // Flag fields - جدید
  @Prop({ default: true })
  isAvailable: boolean;
  
  @Prop({ default: false })
  isFeatured: boolean;
  
  @Prop({ default: false })
  isBestSelling: boolean;
  
  @Prop({ default: false })
  isNewArrival: boolean;
  
  @Prop({ default: false })
  isGift: boolean;
  
  // Analytics - جدید
  @Prop({ default: 0 })
  rating?: number;
  
  @Prop({ default: 0 })
  reviewsCount?: number;
  
  @Prop({ default: 0 })
  views: number;
  
  @Prop({ default: 0 })
  sales: number;
  
  @Prop({ default: 0 })
  stock: number;
  
  @Prop({ default: 1 })
  version: number;
  
  // Legacy
  @Prop()
  title?: string;
  
  @Prop()
  url?: string;
  
  @Prop({ default: false })
  hasCertificate?: boolean;
  
  @Prop()
  certificateNumber?: string;
}
```

---

## 3️⃣ Blog Posts Collection

### ✅ فیلدهای موجود در Backend:
```typescript
{
  title: string;
  content: string;
  image: string;
  url: string;  // unique
  category: ObjectId;  // ref to BlogCategory
  user: ObjectId;  // ref to User
}
```

### 📋 فیلدهای Mock Data:
```typescript
{
  title: string;              // ✅ موجود
  slug: string;               // ❌ در backend: url
  excerpt: string;            // ❌ جدید
  content: string;            // ✅ موجود
  image: string;              // ✅ موجود
  author: {                   // ❌ در backend: user (ObjectId)
    name: string;
    avatar?: string;
  };
  category: string;           // ❌ در backend: ObjectId ref
  tags: string[];            // ❌ جدید
  views: number;             // ❌ جدید
  likes: number;             // ❌ جدید
  isFeatured: boolean;        // ❌ جدید
  publishedAt: Date;         // ❌ جدید
}
```

### 🔴 تفاوت‌ها:
- ❌ **`slug` vs `url`**: نام فیلد متفاوت
- ❌ **`excerpt`**: خلاصه مقاله وجود ندارد
- ❌ **`author`**: Mock data از embedded object استفاده می‌کند، backend از ObjectId ref
- ❌ **`category`**: Mock data از string استفاده می‌کند، backend از ObjectId ref
- ❌ **`tags`**: وجود ندارد
- ❌ **`views`, `likes`**: analytics fields وجود ندارند
- ❌ **`isFeatured`**: flag field وجود ندارد
- ❌ **`publishedAt`**: تاریخ انتشار وجود ندارد

### ✅ پیشنهاد:
```typescript
@Schema({ timestamps: true })
export class Blog extends Document {
  @Prop()
  title: string;
  
  @Prop({ unique: true, required: true })
  slug: string;  // یا url
  
  @Prop()
  excerpt: string;  // خلاصه مقاله
  
  @Prop()
  content: string;
  
  @Prop()
  image: string;
  
  // Author - می‌تواند ObjectId ref باشد یا embedded
  @Prop({ type: Types.ObjectId, ref: User.name })
  user?: User;
  
  @Prop({
    type: {
      name: String,
      avatar: String
    }
  })
  author?: {
    name: string;
    avatar?: string;
  };
  
  // Category
  @Prop({ type: Types.ObjectId, ref: BlogCategory.name })
  category?: BlogCategory;
  
  @Prop()
  categoryName?: string;  // برای embedded استفاده
  
  @Prop([String])
  tags: string[];
  
  @Prop({ default: 0 })
  views: number;
  
  @Prop({ default: 0 })
  likes: number;
  
  @Prop({ default: false })
  isFeatured: boolean;
  
  @Prop()
  publishedAt?: Date;
  
  // Legacy
  @Prop()
  url?: string;
}
```

---

## 4️⃣ FAQ Collection

### ✅ فیلدهای موجود در Backend:
**❌ این collection در backend وجود ندارد!**

### 📋 فیلدهای Mock Data:
```typescript
{
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  views: number;
  helpful: number;
}
```

### 🔴 باید ایجاد شود:
این collection کاملاً جدید است و باید schema و module آن را ایجاد کنید.

---

## 5️⃣ Gold Price Collection

### ✅ فیلدهای موجود در Backend:
**❌ این collection در backend وجود ندارد!**

### 📋 فیلدهای Mock Data:
```typescript
{
  karat: number;  // 18, 21, 24
  pricePerGram: number;
  date: Date;
  isActive: boolean;
  source?: string;
}
```

### 🔴 باید ایجاد شود:
این collection کاملاً جدید است.

---

## 6️⃣ Announcements Collection

### ✅ فیلدهای موجود در Backend:
**❌ این collection در backend وجود ندارد!**

### 📋 فیلدهای Mock Data:
```typescript
{
  title: string;
  message: string;
  link?: string;
  badge: {
    text: string;
    color: string;  // red, yellow, green, orange
  };
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  order: number;
}
```

### 🔴 باید ایجاد شود:
این collection کاملاً جدید است.

---

## 7️⃣ Users Collection

### ✅ فیلدهای موجود در Backend:
```typescript
{
  firstName: string;
  lastName: string;
  mobile: string;  // unique, required
  password: string;
  role: Role;  // enum: user, admin, copyWriter
  code?: string;
  codeExpiry?: Date;
  codeAttempts: number;
  lastCodeSentAt?: Date;
  codeSentCount: number;
  refreshToken?: string;
  refreshTokenExpiry?: Date;
}
```

### 📋 فیلدهای Mock Data:
```typescript
{
  mobile: string;           // ✅ موجود
  firstName?: string;       // ✅ موجود
  lastName?: string;        // ✅ موجود
  email?: string;           // ❌ جدید
  nationalCode?: string;   // ❌ جدید
  avatar?: string;          // ❌ جدید
  role: 'user' | 'admin';  // ✅ موجود (اما enum متفاوت است)
  isActive: boolean;        // ❌ جدید
  lastLogin?: Date;         // ❌ جدید
}
```

### 🔴 تفاوت‌ها:
- ❌ **`email`**: وجود ندارد
- ❌ **`nationalCode`**: وجود ندارد
- ❌ **`avatar`**: وجود ندارد
- ❌ **`isActive`**: flag field وجود ندارد
- ❌ **`lastLogin`**: وجود ندارد
- ✅ Backend فیلدهای authentication بیشتری دارد که در mock data نیست

### ✅ پیشنهاد:
```typescript
@Schema({ timestamps: true })
export class User extends Document {
  @Prop()
  firstName: string;
  
  @Prop()
  lastName: string;
  
  @Prop({ unique: true, required: true })
  mobile: string;
  
  @Prop()
  email?: string;  // جدید
  
  @Prop()
  nationalCode?: string;  // جدید
  
  @Prop()
  avatar?: string;  // جدید
  
  @Prop({ enum: Role, default: Role.User })
  role: Role;
  
  @Prop({ default: true })
  isActive: boolean;  // جدید
  
  @Prop()
  lastLogin?: Date;  // جدید
  
  // Legacy authentication fields
  @Prop()
  password: string;
  
  @Prop()
  code?: string;
  
  // ... سایر فیلدهای authentication
}
```

---

## 8️⃣ Addresses Collection

### ✅ فیلدهای موجود در Backend:
```typescript
{
  province: string;
  city: string;
  address: string;
  postalCode: string;
  receiverName: string;
  receiverMobile: string;
  content?: string;  // legacy
  user: ObjectId;  // ref to User
}
```

### 📋 فیلدهای Mock Data:
```typescript
{
  userId: ObjectId;           // ✅ موجود (user)
  title: string;              // ❌ جدید (خانه، محل کار، ...)
  recipientName: string;      // ✅ موجود (receiverName)
  recipientMobile: string;    // ✅ موجود (receiverMobile)
  province: string;           // ✅ موجود
  city: string;               // ✅ موجود
  postalCode: string;         // ✅ موجود
  address: string;            // ✅ موجود
  isDefault: boolean;         // ❌ جدید
}
```

### 🔴 تفاوت‌ها:
- ❌ **`title`**: برای نامگذاری آدرس (خانه، محل کار) وجود ندارد
- ❌ **`isDefault`**: flag برای آدرس پیش‌فرض وجود ندارد
- ✅ نام فیلدها کمی متفاوت است (`recipientName` vs `receiverName`)

### ✅ پیشنهاد:
```typescript
@Schema({ timestamps: true })
export class Address extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  user: User;
  
  @Prop()
  title?: string;  // خانه، محل کار، ...
  
  @Prop()
  receiverName: string;  // یا recipientName
  
  @Prop()
  receiverMobile: string;  // یا recipientMobile
  
  @Prop()
  province: string;
  
  @Prop()
  city: string;
  
  @Prop()
  postalCode: string;
  
  @Prop()
  address: string;
  
  @Prop({ default: false })
  isDefault: boolean;  // جدید
  
  @Prop()
  content?: string;  // legacy
}
```

---

## 9️⃣ Cart Collection

### ✅ فیلدهای موجود در Backend:
```typescript
// Cart Schema
{
  user: ObjectId;  // ref to User
}

// CartItem Schema
{
  product: ObjectId;  // ref to Product
  quantity: number;
  cart: ObjectId;  // ref to Cart
}
```

### 📋 فیلدهای Mock Data:
```typescript
{
  userId: ObjectId;
  items: Array<{
    productId: ObjectId;
    quantity: number;
    size?: string;      // ❌ جدید
    price: number;      // ❌ جدید (قیمت در زمان افزودن)
  }>;
  subtotal: number;    // ❌ جدید
  discount: number;    // ❌ جدید
  total: number;       // ❌ جدید
}
```

### 🔴 تفاوت‌ها:
- ❌ Backend از **separate CartItem collection** استفاده می‌کند
- ❌ Mock data از **embedded items array** استفاده می‌کند
- ❌ **`size`**: در CartItem وجود ندارد
- ❌ **`price`**: در CartItem وجود ندارد (قیمت باید از Product گرفته شود)
- ❌ **`subtotal`, `discount`, `total`**: در Cart وجود ندارند

### ✅ پیشنهاد:
می‌توانید هر دو approach را support کنید:
1. **Separate CartItem collection** (برای scalability)
2. **Embedded items** (برای performance)

یا فقط embedded را استفاده کنید اگر تعداد آیتم‌ها زیاد نمی‌شود.

---

## 🔟 Orders Collection

### ✅ فیلدهای موجود در Backend:
```typescript
{
  user: ObjectId;  // ref to User
  shipping: ObjectId;  // ref to Shipping
  address: ObjectId;  // ref to Address
  cart: ObjectId;  // ref to Cart
  totalWithDiscount: number;
  totalWithoutDiscount: number;
  shippingPrice: number;
  finalPrice: number;
  status: OrderStatus;  // enum: paying, paid, sent, canceled
  refId: string;
  paymentAttempts: number;
  idempotencyKey: string;
  lastPaymentAttemptAt: Date;
}

// OrderItem (separate collection)
{
  product: ObjectId;  // ref to Product
  quantity: number;
  priceWithoutDiscount: number;
  priceWithDiscount: number;
  order: ObjectId;  // ref to Order
}
```

### 📋 فیلدهای Mock Data:
```typescript
{
  orderId: string;              // ❌ جدید (شماره سفارش unique)
  userId: ObjectId;             // ✅ موجود (user)
  items: Array<{                // ❌ در backend: separate OrderItem collection
    productId: ObjectId;
    productName: string;
    productCode: string;
    quantity: number;
    size?: string;
    price: number;
    image: string;
  }>;
  shippingAddress: {            // ❌ در backend: ObjectId ref to Address
    recipientName: string;
    recipientMobile: string;
    province: string;
    city: string;
    postalCode: string;
    address: string;
  };
  paymentMethod: 'online';      // ❌ جدید
  paymentGateway: 'saman' | 'mellat' | 'zarinpal';  // ❌ جدید
  paymentStatus: 'pending' | 'paid' | 'failed';  // ❌ جدید
  transactionId?: string;       // ❌ جدید
  subtotal: number;             // ✅ موجود (totalWithoutDiscount)
  discount: number;             // ✅ موجود (در finalPrice محاسبه می‌شود)
  shippingCost: number;         // ✅ موجود (shippingPrice)
  total: number;                // ✅ موجود (finalPrice)
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';  // ❌ enum متفاوت
  trackingCode?: string;        // ❌ جدید
  notes?: string;               // ❌ جدید
}
```

### 🔴 تفاوت‌های مهم:
1. **`orderId`**: شماره سفارش unique وجود ندارد
2. **Items Structure**: Mock data از embedded array استفاده می‌کند
3. **Shipping Address**: Mock data از embedded object استفاده می‌کند
4. **Payment Fields**: `paymentMethod`, `paymentGateway`, `paymentStatus`, `transactionId` وجود ندارند
5. **Status Enum**: متفاوت است
6. **`trackingCode`**: وجود ندارد
7. **`notes`**: وجود ندارد

### ✅ پیشنهاد:
```typescript
@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ unique: true, required: true })
  orderId: string;  // شماره سفارش مثل ORD-53500
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;
  
  // Embedded items (یا می‌توانید separate collection نگه دارید)
  @Prop([{
    productId: { type: MongooseSchema.Types.ObjectId, ref: 'Product' },
    productName: String,
    productCode: String,
    quantity: Number,
    size: String,
    price: Number,
    image: String
  }])
  items: Array<{
    productId: ObjectId;
    productName: string;
    productCode: string;
    quantity: number;
    size?: string;
    price: number;
    image: string;
  }>;
  
  // Embedded shipping address
  @Prop({
    type: {
      recipientName: String,
      recipientMobile: String,
      province: String,
      city: String,
      postalCode: String,
      address: String
    }
  })
  shippingAddress?: {
    recipientName: string;
    recipientMobile: string;
    province: string;
    city: string;
    postalCode: string;
    address: string;
  };
  
  // Payment fields - جدید
  @Prop({ default: 'online' })
  paymentMethod: string;
  
  @Prop({ enum: ['saman', 'mellat', 'zarinpal'] })
  paymentGateway?: string;
  
  @Prop({ enum: ['pending', 'paid', 'failed'], default: 'pending' })
  paymentStatus: string;
  
  @Prop()
  transactionId?: string;
  
  // Pricing
  @Prop({ required: true })
  subtotal: number;  // یا totalWithoutDiscount
  
  @Prop({ default: 0 })
  discount: number;
  
  @Prop({ required: true })
  shippingCost: number;  // یا shippingPrice
  
  @Prop({ required: true })
  total: number;  // یا finalPrice
  
  // Status
  @Prop({ 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  })
  status: string;
  
  @Prop()
  trackingCode?: string;
  
  @Prop()
  notes?: string;
  
  // Legacy fields برای backward compatibility
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Shipping' })
  shipping?: Shipping;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Address' })
  address?: Address;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Cart' })
  cart?: Cart;
  
  @Prop()
  refId?: string;
  
  @Prop({ default: 0 })
  paymentAttempts: number;
  
  @Prop()
  idempotencyKey?: string;
  
  @Prop()
  lastPaymentAttemptAt?: Date;
}
```

---

## 📌 خلاصه تغییرات مورد نیاز

### ✅ Collections که باید ایجاد شوند:
1. **FAQ** - کاملاً جدید
2. **GoldPrice** - کاملاً جدید
3. **Announcement** - کاملاً جدید

### 🔄 Collections که باید به‌روزرسانی شوند:
1. **ProductCategory** - اضافه کردن `subcategories`
2. **Product** - اضافه کردن فیلدهای زیاد (code, specifications, flags, analytics)
3. **Blog** - اضافه کردن excerpt, tags, views, likes, isFeatured, publishedAt
4. **User** - اضافه کردن email, nationalCode, avatar, isActive, lastLogin
5. **Address** - اضافه کردن title, isDefault
6. **Cart** - اضافه کردن embedded items یا تغییر structure
7. **Order** - اضافه کردن orderId, payment fields, trackingCode, notes

### ⚠️ نکات مهم:
1. **Backward Compatibility**: بهتر است فیلدهای قدیمی را نگه دارید و فیلدهای جدید را اضافه کنید
2. **Mapping**: در زمان import، باید mapping بین نام فیلدها انجام دهید:
   - `name` ↔ `title`
   - `slug` ↔ `url`
   - `heroImage` ↔ `image`
3. **References vs Embedded**: تصمیم بگیرید که از ObjectId ref استفاده کنید یا embedded objects
4. **Indexes**: بعد از تغییر schema ها، indexes مناسب را اضافه کنید

---

## 🚀 مراحل بعدی

1. ✅ ایجاد schema های جدید (FAQ, GoldPrice, Announcement)
2. ✅ به‌روزرسانی schema های موجود
3. ✅ ایجاد migration script برای import داده‌ها
4. ✅ به‌روزرسانی DTOs و Services
5. ✅ تست کردن import داده‌ها

