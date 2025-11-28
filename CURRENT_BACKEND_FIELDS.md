# 📋 فهرست کامل فیلدهای فعلی Backend

این document شامل همه فیلدهایی است که **الان** در کد backend شما وجود دارد.

---

## 1️⃣ Product Schema

**فایل:** `src/product/schemas/product.schema.ts`

```typescript
{
  // فیلدهای اصلی
  _id: ObjectId;                    // MongoDB auto-generated
  title: string;                    // ✅ required
  url: string;                       // ✅ required, unique
  price: number;                    // ✅ required
  discount: number;                 // default: 0
  stock: number;                    // default: 0
  version: number;                  // default: 1 (برای optimistic locking)
  description: string;             // ✅ required
  images: string[];                // array of strings
  
  // References
  category: ObjectId;               // ref to ProductCategory
  
  // Gold/Jewelry specific fields
  weight?: number;                  // optional
  karat?: number;                  // optional
  type?: ProductType;              // enum: 'ring', 'necklace', 'bracelet', 'earring', 'coin', 'bar', 'other'
  material?: MaterialType;         // enum: 'gold', 'silver', 'platinum', 'diamond', 'gemstone', 'mixed'
  dimensions?: string;              // optional
  hasCertificate?: boolean;        // default: false
  certificateNumber?: string;      // optional
  
  // Timestamps (auto)
  createdAt: Date;
  updatedAt: Date;
}
```

**Enums:**
- `ProductType`: Ring, Necklace, Bracelet, Earring, Coin, Bar, Other
- `MaterialType`: Gold, Silver, Platinum, Diamond, Gemstone, Mixed

**Indexes:**
- `slug` (unique) - ⚠️ اما در schema `url` است!
- `category`
- `isAvailable` - ⚠️ اما در schema نیست!
- `stock`
- `createdAt` (descending)
- Compound: `category` + `isAvailable`
- Compound: `slug` + `isAvailable`

**⚠️ مشکلات:**
- Index روی `slug` و `isAvailable` وجود دارد اما فیلدها در schema نیستند!

---

## 2️⃣ ProductCategory Schema

**فایل:** `src/product/schemas/product-category.schema.ts`

```typescript
{
  _id: ObjectId;
  title: string;
  content: string;
  image: string;
  url: string;                      // ✅ required, unique
  
  // Timestamps (auto)
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3️⃣ Blog Schema

**فایل:** `src/blog/schemas/blog.schema.ts`

```typescript
{
  _id: ObjectId;
  title: string;
  content: string;
  image: string;
  url: string;                      // ✅ required, unique
  
  // References
  category: ObjectId;               // ref to BlogCategory, required
  user: ObjectId;                    // ref to User, required
  
  // Timestamps (auto)
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `url` (unique)
- `category`
- `createdAt` (descending)
- Compound: `category` + `createdAt`

---

## 4️⃣ BlogCategory Schema

**فایل:** `src/blog/schemas/blog-category.schema.ts`

```typescript
{
  _id: ObjectId;
  title: string;
  content: string;
  image: string;
  url: string;                      // ✅ required, unique
  
  // Timestamps (auto)
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 5️⃣ User Schema

**فایل:** `src/user/schemas/user.schema.ts`

```typescript
{
  _id: ObjectId;
  firstName: string;
  lastName: string;
  mobile: string;                    // ✅ required, unique
  password: string;
  role: Role;                       // enum: 'user', 'admin', 'copyWriter'
  
  // OTP/SMS fields
  code?: string;                     // optional
  codeExpiry?: Date;                // optional
  codeAttempts: number;            // default: 0
  lastCodeSentAt?: Date;            // optional
  codeSentCount: number;            // default: 0
  
  // Refresh token fields
  refreshToken?: string;            // optional
  refreshTokenExpiry?: Date;        // optional
  
  // Timestamps (auto)
  createdAt: Date;
  updatedAt: Date;
}
```

**Enums:**
- `Role`: User, Admin, CopyWriter

**Indexes:**
- `mobile` (unique) - از @Prop
- `role`
- `createdAt` (descending)

---

## 6️⃣ Address Schema

**فایل:** `src/user/schemas/address.schema.ts`

```typescript
{
  _id: ObjectId;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  receiverName: string;
  receiverMobile: string;
  
  // Legacy field
  content?: string;                  // optional (legacy - kept for backward compatibility)
  
  // Reference
  user: ObjectId;                    // ref to User, required
  
  // Timestamps (auto)
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 7️⃣ Cart Schema

**فایل:** `src/shop/schemas/cart.schema.ts`

```typescript
{
  _id: ObjectId;
  user: ObjectId;                    // ref to User, required
  
  // Timestamps (auto)
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 8️⃣ CartItem Schema

**فایل:** `src/shop/schemas/cart-item.schema.ts`

```typescript
{
  _id: ObjectId;
  product: ObjectId;                 // ref to Product, required
  quantity: number;                  // default: 1
  cart: ObjectId;                    // ref to Cart, required
  
  // Timestamps (auto)
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 9️⃣ Order Schema

**فایل:** `src/shop/schemas/order.schema.ts`

```typescript
{
  _id: ObjectId;
  
  // References
  user: ObjectId;                    // ref to User, required
  shipping: ObjectId;                // ref to Shipping, required
  address: ObjectId;                 // ref to Address, required
  cart: ObjectId;                   // ref to Cart, required
  
  // Pricing
  totalWithDiscount: number;        // ✅ required
  totalWithoutDiscount: number;     // ✅ required
  shippingPrice: number;             // ✅ required
  finalPrice: number;                // ✅ required
  
  // Status
  status: OrderStatus;               // enum: 'paying', 'paid', 'sent', 'canceled', default: 'paying'
  
  // Payment
  refId?: string;                    // optional
  paymentAttempts: number;          // default: 0
  idempotencyKey?: string;          // optional
  lastPaymentAttemptAt?: Date;      // optional
  
  // Timestamps (auto)
  createdAt: Date;
  updatedAt: Date;
}
```

**Enums:**
- `OrderStatus`: Paying, Paid, Sent, Canceled

**Indexes:**
- `idempotencyKey` (unique, sparse)
- `refId`
- `user`
- `status`
- `createdAt` (descending)
- Compound: `user` + `status`
- Compound: `user` + `createdAt`

---

## 🔟 OrderItem Schema

**فایل:** `src/shop/schemas/order-item.schema.ts`

```typescript
{
  _id: ObjectId;
  product: ObjectId;                 // ref to Product, required
  quantity: number;                  // default: 1
  order: ObjectId;                   // ref to Order, required
  priceWithoutDiscount: number;
  priceWithDiscount: number;         // ✅ required
  
  // Timestamps (auto)
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 1️⃣1️⃣ Shipping Schema

**فایل:** `src/shop/schemas/shipping.schema.ts`

```typescript
{
  _id: ObjectId;
  title: string;
  price: number;
  freeShippingThreshold?: number;   // optional, default: null
  
  // Timestamps (auto)
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 1️⃣2️⃣ InventoryRecord Schema

**فایل:** `src/product/schemas/inventory-record.schema.ts`

```typescript
{
  _id: ObjectId;
  quantity: number;
  action: Action;                    // enum: 'add', 'remove'
  editedBy: EditedBy;               // enum: 'admin', 'order'
  order?: ObjectId;                  // ref to Order, optional
  product: ObjectId;                 // ref to Product, required
  
  // Timestamps (auto)
  createdAt: Date;
  updatedAt: Date;
}
```

**Enums:**
- `Action`: Add, Remove
- `EditedBy`: Admin, Order

---

## 1️⃣3️⃣ SEO Schema

**فایل:** `src/seo/schemas/seo.schema.ts`

```typescript
{
  _id: ObjectId;
  url: string;                       // ✅ required, unique
  seoTitle?: string;                 // optional
  seoDescription?: string;          // optional
  h1?: string;                       // optional, default: null
  content?: string;                  // optional, default: null
  
  // Timestamps (auto)
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `url` (unique)

---

## 1️⃣4️⃣ Ticket Schema

**فایل:** `src/ticket/schemas/ticket.schema.ts`

```typescript
{
  _id: ObjectId;
  title: string;
  user: ObjectId;                    // ref to User, required
  status: TicketStatus;              // enum: 'pending', 'responded', 'closed', 'Open'
  
  // Timestamps (auto)
  createdAt: Date;
  updatedAt: Date;
}
```

**Enums:**
- `TicketStatus`: Pending, Responded, Closed, Open

---

## 1️⃣5️⃣ TicketMessage Schema

**فایل:** `src/ticket/schemas/ticket-message.schema.ts`

```typescript
{
  _id: ObjectId;
  content?: string;                  // optional, default: null
  image?: string;                    // optional, default: null
  ticket: ObjectId;                  // ref to Ticket, required
  user: ObjectId;                     // ref to User, required
  
  // Timestamps (auto)
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 📝 ProductDto (DTO - نه Schema)

**فایل:** `src/product/dtos/product.dto.ts`

⚠️ **توجه:** این DTO است نه Schema. بعضی فیلدها در DTO هستند اما در Schema نیستند:

```typescript
{
  title: string;                     // ✅ در schema هم هست
  content: string;                  // ❌ در schema نیست!
  thumbnail: string;                 // ❌ در schema نیست!
  price: number;                     // ✅ در schema هم هست
  discount: number;                 // ✅ در schema هم هست
  category: string;                  // ✅ در schema هم هست (ObjectId)
  images: string[];                 // ✅ در schema هم هست
  url: string;                       // ✅ در schema هم هست
  weight?: number;                   // ✅ در schema هم هست
  karat?: number;                    // ✅ در schema هم هست
  type?: string;                     // ✅ در schema هم هست (enum)
  material?: string;                 // ✅ در schema هم هست (enum)
  dimensions?: string;               // ✅ در schema هم هست
  hasCertificate?: boolean;         // ✅ در schema هم هست
  certificateNumber?: string;        // ✅ در schema هم هست
}
```

**⚠️ مشکلات:**
- `content` در DTO است اما در Product schema نیست
- `thumbnail` در DTO است اما در Product schema نیست

---

## 📊 خلاصه فیلدها

### ✅ فیلدهای اصلی که استفاده می‌شوند:
- Product: `title`, `url`, `price`, `discount`, `stock`, `version`, `description`, `images`, `category`
- ProductCategory: `title`, `url`, `image`, `content`
- Blog: `title`, `url`, `content`, `image`, `category`, `user`
- User: همه فیلدهای authentication
- Cart/Order: ساختار separate collections

### ❌ فیلدهایی که در DTO هستند اما در Schema نیستند:
- `content` در ProductDto (اما در Product schema نیست)
- `thumbnail` در ProductDto (اما در Product schema نیست)

### ⚠️ Indexes که روی فیلدهای غیرموجود هستند:
- Product schema: index روی `slug` و `isAvailable` اما این فیلدها در schema نیستند!

---

## 🔍 Collections که در Backend وجود دارند:

1. ✅ Product
2. ✅ ProductCategory
3. ✅ Blog
4. ✅ BlogCategory
5. ✅ User
6. ✅ Address
7. ✅ Cart
8. ✅ CartItem
9. ✅ Order
10. ✅ OrderItem
11. ✅ Shipping
12. ✅ InventoryRecord
13. ✅ SEO
14. ✅ Ticket
15. ✅ TicketMessage

---

## ❌ Collections که در Backend وجود ندارند (اما در Mock Data هستند):

1. ❌ FAQ
2. ❌ GoldPrice
3. ❌ Announcement

---

## 📌 نکات مهم

1. **Timestamps:** همه schema ها `timestamps: true` دارند که `createdAt` و `updatedAt` را auto-generate می‌کند
2. **References:** از `ObjectId` refs استفاده می‌شود نه embedded objects
3. **Enums:** برای `ProductType`, `MaterialType`, `Role`, `OrderStatus`, `TicketStatus`, `Action`, `EditedBy`
4. **Indexes:** بعضی indexes روی فیلدهایی هستند که در schema نیستند (مشکل!)

---

**تاریخ ایجاد:** 2024
**آخرین به‌روزرسانی:** بر اساس کد فعلی backend

