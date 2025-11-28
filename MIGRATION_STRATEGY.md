# 🎯 استراتژی Migration - پیشنهاد عملی

## ✅ استراتژی کلی: **Hybrid Approach**

**اصل کلی:** فیلدهای قدیمی را نگه دارید + فیلدهای جدید را اضافه کنید + یک mapping layer بسازید

---

## 📋 تصمیم‌گیری برای هر Collection

### 1️⃣ **ProductCategory** - تغییرات پیشنهادی

#### ✅ نگه دارید:
- `title` (فیلد اصلی)
- `url` (فیلد اصلی)
- `image` (فیلد اصلی)
- `content` (اختیاری)

#### ➕ اضافه کنید:
- `name` (alias برای `title` - برای سازگاری با mock data)
- `slug` (alias برای `url` - برای سازگاری با mock data)
- `heroImage` (alias برای `image` - برای سازگاری با mock data)
- `subcategories` (کاملاً جدید)

#### 🔧 نحوه پیاده‌سازی:
```typescript
@Schema({ timestamps: true })
export class ProductCategory extends Document {
  // فیلدهای اصلی (نگه دارید)
  @Prop()
  title: string;
  
  @Prop({ unique: true, required: true })
  url: string;
  
  @Prop()
  image: string;
  
  @Prop()
  content?: string;
  
  // فیلدهای جدید برای mock data
  @Prop()
  name?: string;  // alias برای title
  
  @Prop()
  slug?: string;  // alias برای url
  
  @Prop()
  heroImage?: string;  // alias برای image
  
  // کاملاً جدید
  @Prop([{
    name: String,
    slug: String
  }])
  subcategories?: Array<{
    name: string;
    slug: string;
  }>;
}

// Virtual برای backward compatibility
productCategorySchema.virtual('name').get(function() {
  return this.name || this.title;
});

productCategorySchema.virtual('slug').get(function() {
  return this.slug || this.url;
});
```

**✅ مزایا:**
- Backward compatibility کامل
- می‌توانید هم `title` و هم `name` را استفاده کنید
- در آینده می‌توانید به تدریج به `name` و `slug` migrate کنید

---

### 2️⃣ **Product** - تغییرات پیشنهادی

#### ✅ نگه دارید (همه فیلدهای فعلی):
- `title`, `url`, `price`, `discount`, `stock`, `description`, `images`
- `category` (ObjectId ref)
- `weight`, `karat`, `type`, `material`, `dimensions`
- `hasCertificate`, `certificateNumber`
- `version`

#### ➕ اضافه کنید:
- `name` (alias برای `title`)
- `slug` (alias برای `url`)
- `code` (کاملاً جدید - کد محصول)
- `discountPrice` (قیمت نهایی بعد از تخفیف)
- `subcategory` (کاملاً جدید)
- `specifications` (object جدید - می‌تواند جایگزین فیلدهای پراکنده شود)
- `isAvailable` (flag جدید)
- `isFeatured`, `isBestSelling`, `isNewArrival`, `isGift` (flags جدید)
- `rating`, `reviewsCount`, `views`, `sales` (analytics جدید)

#### 🔧 نحوه پیاده‌سازی:
```typescript
@Schema({ timestamps: true })
export class Product extends Document {
  // ========== فیلدهای اصلی (نگه دارید) ==========
  @Prop({ required: true })
  title: string;
  
  @Prop({ required: true, unique: true })
  url: string;
  
  @Prop({ required: true })
  price: number;
  
  @Prop({ default: 0 })
  discount: number;  // مقدار تخفیف
  
  @Prop({ default: 0 })
  stock: number;
  
  @Prop({ required: true })
  description: string;
  
  @Prop([String])
  images: string[];
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProductCategory' })
  category: ProductCategory;
  
  // فیلدهای قدیمی (نگه دارید)
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
  
  @Prop({ default: false })
  hasCertificate?: boolean;
  
  @Prop()
  certificateNumber?: string;
  
  @Prop({ default: 1 })
  version: number;
  
  // ========== فیلدهای جدید ==========
  // Aliases برای سازگاری
  @Prop()
  name?: string;
  
  @Prop()
  slug?: string;
  
  // کاملاً جدید
  @Prop({ unique: true, sparse: true })
  code?: string;  // کد محصول مثل GN-001-18K
  
  @Prop()
  discountPrice?: number;  // قیمت نهایی بعد از تخفیف
  
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
  
  // Specifications - جدید (می‌تواند جایگزین فیلدهای پراکنده شود)
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
    weight?: string;
    karat?: string;
    material?: string;
    dimensions?: string;
    coverage?: string;
    brand?: string;
  };
  
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
}

// Indexes
productSchema.index({ slug: 1 }, { unique: true, sparse: true });
productSchema.index({ code: 1 }, { unique: true, sparse: true });
productSchema.index({ isAvailable: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isBestSelling: 1 });
productSchema.index({ isNewArrival: 1 });
productSchema.index({ views: -1 });
productSchema.index({ sales: -1 });
```

**✅ مزایا:**
- همه فیلدهای قدیمی حفظ می‌شوند
- فیلدهای جدید اضافه می‌شوند
- می‌توانید از هر دو استفاده کنید
- در آینده می‌توانید به تدریج migrate کنید

---

### 3️⃣ **Blog** - تغییرات پیشنهادی

#### ✅ نگه دارید:
- `title`, `content`, `image`, `url`
- `category` (ObjectId ref)
- `user` (ObjectId ref)

#### ➕ اضافه کنید:
- `slug` (alias برای `url`)
- `excerpt` (خلاصه مقاله)
- `tags` (array)
- `views`, `likes` (analytics)
- `isFeatured` (flag)
- `publishedAt` (تاریخ انتشار)
- `author` (embedded object - علاوه بر `user`)

#### 🔧 نحوه پیاده‌سازی:
```typescript
@Schema({ timestamps: true })
export class Blog extends Document {
  // فیلدهای اصلی (نگه دارید)
  @Prop()
  title: string;
  
  @Prop({ unique: true, required: true })
  url: string;
  
  @Prop()
  content: string;
  
  @Prop()
  image: string;
  
  @Prop({ type: Types.ObjectId, ref: BlogCategory.name, required: true })
  category: BlogCategory;
  
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  user: User;
  
  // فیلدهای جدید
  @Prop()
  slug?: string;
  
  @Prop()
  excerpt?: string;
  
  @Prop([String])
  tags?: string[];
  
  @Prop({ default: 0 })
  views: number;
  
  @Prop({ default: 0 })
  likes: number;
  
  @Prop({ default: false })
  isFeatured: boolean;
  
  @Prop()
  publishedAt?: Date;
  
  // Author info (embedded)
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
}
```

---

### 4️⃣ **User** - تغییرات پیشنهادی

#### ✅ نگه دارید (همه فیلدهای authentication):
- `firstName`, `lastName`, `mobile`
- `password`, `role`
- همه فیلدهای `code`, `refreshToken` و غیره

#### ➕ اضافه کنید:
- `email`
- `nationalCode`
- `avatar`
- `isActive` (default: true)
- `lastLogin`

#### 🔧 نحوه پیاده‌سازی:
```typescript
@Schema({ timestamps: true })
export class User extends Document {
  // فیلدهای اصلی (نگه دارید)
  @Prop()
  firstName: string;
  
  @Prop()
  lastName: string;
  
  @Prop({ unique: true, required: true })
  mobile: string;
  
  @Prop()
  password: string;
  
  @Prop({ enum: Role, default: Role.User })
  role: Role;
  
  // فیلدهای authentication (نگه دارید)
  @Prop()
  code?: string;
  
  @Prop()
  codeExpiry?: Date;
  
  @Prop({ default: 0 })
  codeAttempts: number;
  
  // ... سایر فیلدهای authentication
  
  // فیلدهای جدید
  @Prop()
  email?: string;
  
  @Prop()
  nationalCode?: string;
  
  @Prop()
  avatar?: string;
  
  @Prop({ default: true })
  isActive: boolean;
  
  @Prop()
  lastLogin?: Date;
}
```

---

### 5️⃣ **Address** - تغییرات پیشنهادی

#### ✅ نگه دارید:
- همه فیلدهای فعلی

#### ➕ اضافه کنید:
- `title` (خانه، محل کار، ...)
- `isDefault` (default: false)

#### 🔧 نحوه پیاده‌سازی:
```typescript
@Schema({ timestamps: true })
export class Address extends Document {
  // فیلدهای اصلی (نگه دارید)
  @Prop()
  province: string;
  
  @Prop()
  city: string;
  
  @Prop()
  address: string;
  
  @Prop()
  postalCode: string;
  
  @Prop()
  receiverName: string;
  
  @Prop()
  receiverMobile: string;
  
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  user: User;
  
  // فیلدهای جدید
  @Prop()
  title?: string;  // خانه، محل کار، ...
  
  @Prop({ default: false })
  isDefault: boolean;
  
  // Legacy
  @Prop()
  content?: string;
}
```

---

### 6️⃣ **Cart & CartItem** - تغییرات پیشنهادی

#### ⚠️ تصمیم مهم:
**پیشنهاد:** ساختار فعلی را نگه دارید (separate CartItem collection) اما فیلدهای جدید اضافه کنید.

#### ✅ نگه دارید:
- ساختار فعلی (Cart + CartItem separate)

#### ➕ اضافه کنید به CartItem:
- `size` (optional)
- `price` (قیمت در زمان افزودن - برای snapshot)

#### ➕ اضافه کنید به Cart:
- `subtotal` (محاسبه شده)
- `discount` (محاسبه شده)
- `total` (محاسبه شده)

#### 🔧 نحوه پیاده‌سازی:
```typescript
// CartItem
@Schema({ timestamps: true })
export class CartItem extends Document {
  @Prop({ required: true, ref: Product.name, type: Types.ObjectId })
  product: Product;
  
  @Prop({ default: 1 })
  quantity: number;
  
  @Prop({ required: true, ref: Cart.name, type: Types.ObjectId })
  cart: Cart;
  
  // فیلدهای جدید
  @Prop()
  size?: string;
  
  @Prop()
  price?: number;  // snapshot قیمت در زمان افزودن
}

// Cart
@Schema({ timestamps: true })
export class Cart extends Document {
  @Prop({ required: true, ref: User.name, type: Types.ObjectId })
  user: string;
  
  // فیلدهای جدید (محاسبه شده)
  @Prop({ default: 0 })
  subtotal: number;
  
  @Prop({ default: 0 })
  discount: number;
  
  @Prop({ default: 0 })
  total: number;
}
```

---

### 7️⃣ **Order** - تغییرات پیشنهادی

#### ✅ نگه دارید:
- ساختار فعلی (Order + OrderItem separate)
- همه فیلدهای payment و status

#### ➕ اضافه کنید:
- `orderId` (شماره سفارش unique - مثل ORD-53500)
- `paymentMethod` (default: 'online')
- `paymentGateway` (saman, mellat, zarinpal)
- `paymentStatus` (pending, paid, failed)
- `transactionId`
- `trackingCode`
- `notes`

#### 🔧 نحوه پیاده‌سازی:
```typescript
@Schema({ timestamps: true })
export class Order extends Document {
  // فیلد جدید
  @Prop({ unique: true, sparse: true })
  orderId?: string;  // شماره سفارش
  
  // فیلدهای اصلی (نگه دارید)
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Shipping', required: true })
  shipping: Shipping;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Address', required: true })
  address: Address;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Cart', required: true })
  cart: Cart;
  
  @Prop({ required: true })
  totalWithDiscount: number;
  
  @Prop({ required: true })
  totalWithoutDiscount: number;
  
  @Prop({ required: true })
  shippingPrice: number;
  
  @Prop({ required: true })
  finalPrice: number;
  
  @Prop({ default: OrderStatus.Paying })
  status: OrderStatus;
  
  // فیلدهای جدید
  @Prop({ default: 'online' })
  paymentMethod: string;
  
  @Prop({ enum: ['saman', 'mellat', 'zarinpal'] })
  paymentGateway?: string;
  
  @Prop({ enum: ['pending', 'paid', 'failed'], default: 'pending' })
  paymentStatus: string;
  
  @Prop()
  transactionId?: string;
  
  @Prop()
  trackingCode?: string;
  
  @Prop()
  notes?: string;
  
  // Legacy fields (نگه دارید)
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

### 8️⃣ **Collections جدید** - باید ایجاد شوند

#### FAQ Schema:
```typescript
@Schema({ timestamps: true })
export class FAQ extends Document {
  @Prop({ required: true })
  question: string;
  
  @Prop({ required: true })
  answer: string;
  
  @Prop()
  category: string;
  
  @Prop({ default: 0 })
  order: number;
  
  @Prop({ default: true })
  isActive: boolean;
  
  @Prop({ default: 0 })
  views: number;
  
  @Prop({ default: 0 })
  helpful: number;
}
```

#### GoldPrice Schema:
```typescript
@Schema({ timestamps: true })
export class GoldPrice extends Document {
  @Prop({ required: true, enum: [18, 21, 24] })
  karat: number;
  
  @Prop({ required: true })
  pricePerGram: number;
  
  @Prop({ required: true })
  date: Date;
  
  @Prop({ default: true })
  isActive: boolean;
  
  @Prop()
  source?: string;
}
```

#### Announcement Schema:
```typescript
@Schema({ timestamps: true })
export class Announcement extends Document {
  @Prop({ required: true })
  title: string;
  
  @Prop({ required: true })
  message: string;
  
  @Prop()
  link?: string;
  
  @Prop({
    type: {
      text: String,
      color: String
    }
  })
  badge: {
    text: string;
    color: string;  // red, yellow, green, orange
  };
  
  @Prop({ default: true })
  isActive: boolean;
  
  @Prop({ required: true })
  startDate: Date;
  
  @Prop()
  endDate?: Date;
  
  @Prop({ default: 0 })
  order: number;
}
```

---

## 🎯 خلاصه تصمیم‌گیری

### ✅ نگه دارید:
1. **همه فیلدهای فعلی** در همه schema ها
2. **ساختار فعلی** Cart و Order (separate collections)
3. **ObjectId refs** برای category و user

### ➕ اضافه کنید:
1. **Alias fields** (`name`/`title`, `slug`/`url`) برای سازگاری
2. **فیلدهای جدید** از mock data
3. **3 collection جدید** (FAQ, GoldPrice, Announcement)

### 🔄 Mapping Strategy:
در زمان import، می‌توانید:
- `name` → هم `name` و هم `title` را set کنید
- `slug` → هم `slug` و هم `url` را set کنید
- یا فقط alias fields را set کنید و از virtuals استفاده کنید

---

## 📝 مراحل بعدی

1. ✅ به‌روزرسانی schema ها (اضافه کردن فیلدهای جدید)
2. ✅ ایجاد schema های جدید (FAQ, GoldPrice, Announcement)
3. ✅ به‌روزرسانی DTOs
4. ✅ ایجاد migration script برای import
5. ✅ تست کردن

---

## ⚠️ نکات مهم

1. **Backward Compatibility**: همه فیلدهای قدیمی حفظ می‌شوند
2. **Gradual Migration**: می‌توانید به تدریج از فیلدهای جدید استفاده کنید
3. **Indexes**: بعد از اضافه کردن فیلدها، indexes مناسب را اضافه کنید
4. **Validation**: DTOs را به‌روزرسانی کنید تا فیلدهای جدید را support کنند

