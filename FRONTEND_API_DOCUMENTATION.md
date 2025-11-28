# 📚 مستندات کامل API برای Frontend

این document شامل تمام اطلاعات مورد نیاز برای اتصال Frontend به Backend است.

---

## 🔗 اطلاعات اتصال

- **Backend URL:** `http://localhost:4001`
- **Frontend URL:** `http://localhost:4000`
- **API Base:** `http://localhost:4001`
- **Swagger Docs:** `http://localhost:4001/documentation`

---

## 🔐 Authentication

### نحوه استفاده از Token

```typescript
// در همه درخواست‌های authenticated، header زیر را اضافه کنید:
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
}
```

### Flow احراز هویت

1. **ثبت‌نام:** `POST /auth/sign-up` → دریافت `userId`
2. **تایید کد:** `POST /auth/confirm` → دریافت `access_token`
3. **ورود:** `POST /auth/sign-in` → دریافت `access_token`
4. **استفاده:** ذخیره `access_token` در localStorage و ارسال در header

---

## 📋 Schema های کامل

### 1️⃣ Product Schema

```typescript
interface Product {
  _id: string;
  name: string; // نام محصول
  slug: string; // URL-friendly name (unique)
  code: string; // کد محصول (مثل GN-001-18K) (unique)
  description: string; // توضیحات
  price: number; // قیمت به تومان
  discountPrice?: number; // قیمت نهایی بعد از تخفیف
  stock: number; // موجودی
  images: string[]; // آرایه URL تصاویر
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  subcategory?: {
    _id: string;
    name: string;
    slug: string;
  };
  weight?: string; // مثال: "12.5 گرم"
  karat?: string; // مثال: "18 عیار"
  material?: string; // مثال: "طلای سرخ"
  dimensions?: string; // ابعاد
  brand?: string; // برند
  coverage?: string; // نوع پوشش
  isAvailable: boolean; // در دسترس است؟
  isFeatured: boolean; // محصول ویژه؟
  isBestSelling: boolean; // پرفروش؟
  isNewArrival: boolean; // تازه‌ها؟
  isGift: boolean; // هدیه پیشنهادی؟
  rating?: number; // امتیاز (0-5)
  reviewsCount?: number; // تعداد نظرات
  views: number; // تعداد بازدید
  sales: number; // تعداد فروش
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}
```

### 2️⃣ ProductCategory Schema

```typescript
interface ProductCategory {
  _id: string;
  name: string; // نام دسته‌بندی
  slug: string; // URL-friendly name (unique)
  heroImage: string; // تصویر هدر
  content?: string; // محتوای دسته‌بندی
  subcategories?: Array<{
    name: string;
    slug: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
```

### 3️⃣ Blog Schema

```typescript
interface Blog {
  _id: string;
  title: string;
  slug: string; // URL-friendly name (unique)
  excerpt: string; // خلاصه مقاله
  content: string; // محتوای کامل
  image: string;
  tags?: string[]; // تگ‌ها
  views: number; // تعداد بازدید
  likes: number; // تعداد لایک
  isFeatured: boolean; // مقاله ویژه؟
  publishedAt?: string; // تاریخ انتشار (ISO date)
  category: {
    _id: string;
    title: string;
    url: string;
  };
  user: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### 4️⃣ User Schema

```typescript
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  mobile: string; // unique, required
  email?: string;
  nationalCode?: string;
  avatar?: string;
  role: 'user' | 'admin' | 'copyWriter';
  isActive: boolean;
  lastLogin?: string; // ISO date
  createdAt: string;
  updatedAt: string;
}
```

### 5️⃣ Address Schema

```typescript
interface Address {
  _id: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  recipientName: string; // نام گیرنده
  recipientMobile: string; // موبایل گیرنده
  title?: string; // خانه، محل کار، ...
  isDefault: boolean; // آدرس پیش‌فرض؟
  user: string; // ObjectId of User
  createdAt: string;
  updatedAt: string;
}
```

### 6️⃣ Cart Schema

```typescript
interface Cart {
  _id: string;
  user: string; // ObjectId of User
  subtotal: number; // جمع کل
  discount: number; // تخفیف
  total: number; // مبلغ نهایی
  createdAt: string;
  updatedAt: string;
}
```

### 7️⃣ CartItem Schema

```typescript
interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    discountPrice?: number;
    images: string[];
    // ... سایر فیلدهای Product
  };
  quantity: number;
  size?: string; // سایز (اختیاری)
  price: number; // قیمت در زمان افزودن (snapshot)
  cart: string; // ObjectId of Cart
  createdAt: string;
  updatedAt: string;
}
```

### 8️⃣ Order Schema

```typescript
interface Order {
  _id: string;
  orderId: string; // شماره سفارش (unique) مثل ORD-53500
  user: string; // ObjectId of User
  items: Array<{
    productId: string;
    productName: string;
    productCode: string;
    quantity: number;
    size?: string;
    price: number;
    image: string;
  }>;
  shippingAddress: {
    recipientName: string;
    recipientMobile: string;
    province: string;
    city: string;
    postalCode: string;
    address: string;
  };
  paymentMethod: string; // 'online'
  paymentGateway?: string; // 'saman' | 'mellat' | 'zarinpal'
  paymentStatus: string; // 'pending' | 'paid' | 'failed'
  transactionId?: string;
  totalWithDiscount: number;
  totalWithoutDiscount: number;
  shippingPrice: number;
  finalPrice: number;
  status: 'paying' | 'paid' | 'sent' | 'canceled';
  trackingCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 9️⃣ FAQ Schema

```typescript
interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  order: number;
  isActive: boolean;
  views: number;
  helpful: number;
  createdAt: string;
  updatedAt: string;
}
```

### 🔟 GoldPrice Schema

```typescript
interface GoldPrice {
  _id: string;
  karat: number; // 18, 21, 24
  pricePerGram: number; // قیمت به تومان
  date: string; // ISO date
  isActive: boolean;
  source?: string;
  createdAt: string;
}
```

### 1️⃣1️⃣ Announcement Schema

```typescript
interface Announcement {
  _id: string;
  title: string;
  message: string;
  link?: string;
  badge: {
    text: string;
    color: string; // 'red' | 'yellow' | 'green' | 'orange'
  };
  isActive: boolean;
  startDate: string; // ISO date
  endDate?: string; // ISO date
  order: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🌐 API Endpoints

### 🔓 Public APIs (بدون نیاز به Authentication)

#### 1. Products

**GET `/site/product`** - لیست محصولات

Query Parameters:

```typescript
{
  page?: number;           // پیش‌فرض: 1
  limit?: number;          // پیش‌فرض: 10
  name?: string;           // جستجو در نام
  slug?: string;           // جستجو در slug
  category?: string;       // ObjectId دسته‌بندی
  minPrice?: number;      // حداقل قیمت
  maxPrice?: number;      // حداکثر قیمت
  sort?: string;          // 'createdAt' | 'cheap' | 'expensive'
  isAvailable?: boolean;   // فیلتر موجودی
  isFeatured?: boolean;   // فقط محصولات ویژه
  isBestSelling?: boolean; // فقط پرفروش‌ها
  isNewArrival?: boolean; // فقط تازه‌ها
  exclude?: string[];     // Array of ObjectIds to exclude
}
```

Response:

```typescript
{
  count: number;
  products: Product[];
}
```

**GET `/site/product/:slug`** - جزئیات محصول

Response: `Product`

---

#### 2. Categories

**GET `/site/product-category`** - لیست دسته‌بندی‌ها

Query Parameters:

```typescript
{
  page?: number;
  limit?: number;
  name?: string;
  slug?: string;
}
```

Response:

```typescript
{
  count: number;
  categories: ProductCategory[];
}
```

**GET `/site/product-category/:slug`** - جزئیات دسته‌بندی

Response: `ProductCategory`

---

#### 3. Blogs

**GET `/site/blog`** - لیست مقالات

Query Parameters:

```typescript
{
  page?: number;
  limit?: number;
  title?: string;
  slug?: string;
  category?: string;       // ObjectId
  isFeatured?: boolean;
}
```

Response:

```typescript
{
  count: number;
  blogs: Blog[];
}
```

**GET `/site/blog/:slug`** - جزئیات مقاله

Response: `Blog`

**GET `/site/blog-category`** - لیست دسته‌بندی‌های مقالات

Response:

```typescript
{
  count: number;
  categories: BlogCategory[];
}
```

---

#### 4. FAQ

**GET `/faq`** - لیست سوالات متداول

Query Parameters:

```typescript
{
  isActive?: boolean;     // فقط فعال‌ها
}
```

Response: `FAQ[]`

**GET `/faq/:id`** - جزئیات یک FAQ

**POST `/faq/:id/view`** - افزایش تعداد بازدید

**POST `/faq/:id/helpful`** - افزایش تعداد مفید بودن

---

#### 5. Gold Price

**GET `/gold-price`** - لیست قیمت‌های طلا

Query Parameters:

```typescript
{
  isActive?: boolean;
}
```

Response: `GoldPrice[]`

**GET `/gold-price/latest`** - آخرین قیمت طلا

Query Parameters:

```typescript
{
  karat?: number;         // 18, 21, 24
}
```

Response: `GoldPrice`

---

#### 6. Announcements

**GET `/announcement`** - لیست اعلان‌ها

Query Parameters:

```typescript
{
  isActive?: boolean;     // فقط فعال‌ها (با تاریخ معتبر)
}
```

Response: `Announcement[]`

---

#### 7. Shipping

**GET `/site-shipping`** - لیست روش‌های ارسال

Response:

```typescript
{
  count: number;
  shippings: Shipping[];
}
```

---

#### 8. SEO

**GET `/site-seo`** - اطلاعات SEO

Query Parameters:

```typescript
{
  url: string; // آدرس صفحه
}
```

Response:

```typescript
{
  url: string;
  seoTitle?: string;
  seoDescription?: string;
  h1?: string;
  content?: string;
}
```

---

### 🔐 Authentication APIs

#### POST `/auth/sign-up` - ثبت‌نام

Request Body:

```typescript
{
  firstName: string;
  lastName: string;
  mobile: string; // فرمت: 09xxxxxxxxx
  password: string; // حداقل 8 کاراکتر
}
```

Response:

```typescript
{
  message: string;
  userId: string;
}
```

#### POST `/auth/confirm` - تایید کد

Request Body:

```typescript
{
  mobile: string;
  code: string; // کد 4-6 رقمی
}
```

Response:

```typescript
{
  access_token: string;
  user: User;
}
```

#### POST `/auth/sign-in` - ورود

Request Body:

```typescript
{
  mobile: string;
  password: string;
}
```

Response:

```typescript
{
  access_token: string;
  user: User;
}
```

#### POST `/auth/resend` - ارسال مجدد کد

Request Body:

```typescript
{
  mobile: string;
}
```

Response:

```typescript
{
  message: string;
}
```

---

### 👤 User APIs (نیاز به JWT)

#### GET `/panel/user/:id` - اطلاعات کاربر

Headers:

```
Authorization: Bearer {token}
```

Response: `User`

#### PATCH `/panel/change-password` - تغییر رمز عبور

Request Body:

```typescript
{
  id: string; // ObjectId کاربر
  oldPassword: string;
  newPassword: string;
}
```

---

### 📍 Address APIs (نیاز به JWT)

#### GET `/panel/address` - لیست آدرس‌های کاربر

Query Parameters:

```typescript
{
  page?: number;
  limit?: number;
}
```

Response:

```typescript
{
  count: number;
  addresses: Address[];
}
```

#### POST `/panel/address` - افزودن آدرس

Request Body:

```typescript
{
  province: string;
  city: string;
  address: string;
  postalCode: string;
  recipientName: string;
  recipientMobile: string;
  title?: string;        // خانه، محل کار، ...
  isDefault?: boolean;
}
```

Response: `Address`

#### GET `/panel/address/:id` - جزئیات آدرس

Response: `Address`

#### PATCH `/panel/address/:id` - ویرایش آدرس

Request Body: (همان ساختار POST، همه فیلدها optional)

#### DELETE `/panel/address/:id` - حذف آدرس

---

### 🛒 Cart APIs (نیاز به JWT)

#### GET `/site/cart` - دریافت سبد خرید کاربر

Response: `Cart` با populated `items`

#### POST `/site/cart/item` - افزودن محصول به سبد

Request Body:

```typescript
{
  product: string;        // ObjectId محصول
  quantity?: number;      // پیش‌فرض: 1
  size?: string;          // سایز (اختیاری)
}
```

Response: `CartItem`

#### PATCH `/site/cart/item/:id` - ویرایش آیتم سبد

Request Body:

```typescript
{
  quantity?: number;
  size?: string;
}
```

#### DELETE `/site/cart/item/:id` - حذف آیتم از سبد

#### DELETE `/site/cart` - پاک کردن کل سبد

---

### 📦 Order APIs (نیاز به JWT)

#### POST `/site/order` - ایجاد سفارش

Request Body:

```typescript
{
  cartId: string; // ObjectId سبد خرید
  shippingId: string; // ObjectId روش ارسال
  addressId: string; // ObjectId آدرس
}
```

Response:

```typescript
{
  order: Order;
  paymentUrl: string; // URL درگاه پرداخت
  authority: string; // کد authority برای پیگیری
}
```

#### GET `/site/order` - لیست سفارشات کاربر

Query Parameters:

```typescript
{
  page?: number;
  limit?: number;
  status?: 'paying' | 'paid' | 'sent' | 'canceled';
}
```

Response:

```typescript
{
  count: number;
  orders: Order[];
}
```

#### GET `/site/order/:id` - جزئیات سفارش

Response: `Order`

#### GET `/site/order/callback` - Callback پرداخت (خودکار)

این endpoint توسط درگاه پرداخت فراخوانی می‌شود و کاربر را به frontend redirect می‌کند:

- موفق: `/order/success?id={orderId}`
- ناموفق: `/order/failed?id={orderId}`

---

### 🎫 Ticket APIs (نیاز به JWT)

#### GET `/panel/ticket` - لیست تیکت‌های کاربر

Query Parameters:

```typescript
{
  page?: number;
  limit?: number;
  status?: 'pending' | 'responded' | 'closed' | 'Open';
}
```

Response:

```typescript
{
  count: number;
  tickets: Ticket[];
}
```

#### POST `/panel/ticket` - ایجاد تیکت جدید

Request Body:

```typescript
{
  title: string;
}
```

Response: `Ticket`

#### GET `/panel/ticket/:id` - جزئیات تیکت

Response: `Ticket` با messages

#### POST `/panel/ticket/:id/message` - ارسال پیام

Request Body:

```typescript
{
  content: string;
  image?: string;         // URL تصویر (اختیاری)
}
```

Response: `TicketMessage`

---

## 🔧 مثال‌های استفاده در Frontend

### 1. Setup Axios

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
  withCredentials: true, // برای CSRF token
});

// Interceptor برای اضافه کردن token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // دریافت CSRF token از cookie
  const csrfToken = getCookie('XSRF-TOKEN');
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  return config;
});

// Interceptor برای مدیریت خطاها
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token منقضی شده
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export default api;
```

### 2. Authentication Service

```typescript
// services/auth.service.ts
import api from './api';

export const authService = {
  // ثبت‌نام
  async signUp(data: {
    firstName: string;
    lastName: string;
    mobile: string;
    password: string;
  }) {
    const response = await api.post('/auth/sign-up', data);
    return response.data;
  },

  // تایید کد
  async confirm(mobile: string, code: string) {
    const response = await api.post('/auth/confirm', { mobile, code });
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },

  // ورود
  async signIn(mobile: string, password: string) {
    const response = await api.post('/auth/sign-in', { mobile, password });
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },

  // ارسال مجدد کد
  async resend(mobile: string) {
    const response = await api.post('/auth/resend', { mobile });
    return response.data;
  },

  // خروج
  logout() {
    localStorage.removeItem('access_token');
  },
};
```

### 3. Product Service

```typescript
// services/product.service.ts
import api from './api';

export const productService = {
  // لیست محصولات
  async getProducts(params?: {
    page?: number;
    limit?: number;
    name?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    isFeatured?: boolean;
    isBestSelling?: boolean;
    isNewArrival?: boolean;
  }) {
    const response = await api.get('/site/product', { params });
    return response.data;
  },

  // جزئیات محصول
  async getProductBySlug(slug: string) {
    const response = await api.get(`/site/product/${slug}`);
    return response.data;
  },

  // لیست دسته‌بندی‌ها
  async getCategories() {
    const response = await api.get('/site/product-category');
    return response.data;
  },
};
```

### 4. Cart Service

```typescript
// services/cart.service.ts
import api from './api';

export const cartService = {
  // دریافت سبد خرید
  async getCart() {
    const response = await api.get('/site/cart');
    return response.data;
  },

  // افزودن به سبد
  async addItem(productId: string, quantity: number = 1, size?: string) {
    const response = await api.post('/site/cart/item', {
      product: productId,
      quantity,
      size,
    });
    return response.data;
  },

  // ویرایش آیتم
  async updateItem(itemId: string, quantity?: number, size?: string) {
    const response = await api.patch(`/site/cart/item/${itemId}`, {
      quantity,
      size,
    });
    return response.data;
  },

  // حذف آیتم
  async removeItem(itemId: string) {
    const response = await api.delete(`/site/cart/item/${itemId}`);
    return response.data;
  },

  // پاک کردن سبد
  async clearCart() {
    const response = await api.delete('/site/cart');
    return response.data;
  },
};
```

### 5. Order Service

```typescript
// services/order.service.ts
import api from './api';

export const orderService = {
  // ایجاد سفارش
  async createOrder(cartId: string, shippingId: string, addressId: string) {
    const response = await api.post('/site/order', {
      cartId,
      shippingId,
      addressId,
    });
    return response.data;
  },

  // لیست سفارشات
  async getOrders(params?: { page?: number; limit?: number; status?: string }) {
    const response = await api.get('/site/order', { params });
    return response.data;
  },

  // جزئیات سفارش
  async getOrder(orderId: string) {
    const response = await api.get(`/site/order/${orderId}`);
    return response.data;
  },
};
```

### 6. Address Service

```typescript
// services/address.service.ts
import api from './api';

export const addressService = {
  // لیست آدرس‌ها
  async getAddresses() {
    const response = await api.get('/panel/address');
    return response.data;
  },

  // افزودن آدرس
  async addAddress(data: {
    province: string;
    city: string;
    address: string;
    postalCode: string;
    recipientName: string;
    recipientMobile: string;
    title?: string;
    isDefault?: boolean;
  }) {
    const response = await api.post('/panel/address', data);
    return response.data;
  },

  // ویرایش آدرس
  async updateAddress(addressId: string, data: Partial<Address>) {
    const response = await api.patch(`/panel/address/${addressId}`, data);
    return response.data;
  },

  // حذف آدرس
  async deleteAddress(addressId: string) {
    const response = await api.delete(`/panel/address/${addressId}`);
    return response.data;
  },
};
```

---

## ⚠️ Error Handling

### ساختار خطا

```typescript
interface ApiError {
  statusCode: number;
  message: string | string[]; // می‌تواند array باشد (validation errors)
  error: string;
}
```

### مثال مدیریت خطا

```typescript
try {
  const data = await productService.getProducts();
} catch (error) {
  if (error.response) {
    // سرور پاسخ با خطا داد
    const status = error.response.status;
    const message = error.response.data.message;

    switch (status) {
      case 400:
        // Bad Request - validation error
        console.error('خطا در اعتبارسنجی:', message);
        break;
      case 401:
        // Unauthorized - token منقضی شده
        authService.logout();
        window.location.href = '/login';
        break;
      case 404:
        // Not Found
        console.error('یافت نشد:', message);
        break;
      case 500:
        // Server Error
        console.error('خطای سرور:', message);
        break;
    }
  } else if (error.request) {
    // درخواست ارسال شد اما پاسخی نیامد
    console.error('خطا در اتصال به سرور');
  } else {
    // خطای دیگر
    console.error('خطا:', error.message);
  }
}
```

---

## 🔒 CSRF Protection

Backend از CSRF protection استفاده می‌کند. برای درخواست‌های POST/PATCH/DELETE:

1. ابتدا یک GET request بزنید تا CSRF token دریافت کنید
2. Token در cookie با نام `XSRF-TOKEN` ذخیره می‌شود
3. در header درخواست‌های بعدی، `X-CSRF-Token` را اضافه کنید

```typescript
// دریافت CSRF token
await api.get('/any-endpoint');

// استفاده در درخواست‌های بعدی (به صورت خودکار در interceptor)
```

---

## 📝 نکات مهم

### 1. Pagination

تمام endpoint های لیست از pagination استفاده می‌کنند:

```typescript
{
  page: 1,        // پیش‌فرض: 1
  limit: 10,      // پیش‌فرض: 10
}
```

### 2. Sorting

برای محصولات:

- `createdAt` - جدیدترین
- `cheap` - ارزان‌ترین
- `expensive` - گران‌ترین

### 3. File Upload

برای آپلود تصویر:

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('folder', 'product'); // یا 'blog', 'productCategory'

const response = await api.post('/upload-file', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Response: { url: string }
```

### 4. Image URLs

تصاویر از این آدرس قابل دسترسی هستند:

```
http://localhost:4001/files/{folder}/main/{filename}
http://localhost:4001/files/{folder}/resized/{filename}
```

### 5. Payment Flow

1. کاربر سفارش می‌دهد → `POST /site/order`
2. دریافت `paymentUrl` و `authority`
3. Redirect کاربر به `paymentUrl`
4. کاربر پرداخت می‌کند
5. درگاه به `/site/order/callback` redirect می‌کند
6. Backend کاربر را به frontend redirect می‌کند:
   - موفق: `/order/success?id={orderId}`
   - ناموفق: `/order/failed?id={orderId}`

---

## 🎯 Checklist برای Frontend

- [ ] Setup Axios با base URL و interceptors
- [ ] Authentication service (sign-up, sign-in, confirm)
- [ ] Product service (list, detail, categories)
- [ ] Cart service (add, update, remove, clear)
- [ ] Order service (create, list, detail)
- [ ] Address service (CRUD)
- [ ] Blog service (list, detail, categories)
- [ ] FAQ service
- [ ] Gold Price service
- [ ] Announcement service
- [ ] Error handling
- [ ] CSRF token management
- [ ] Token storage و refresh
- [ ] Loading states
- [ ] Form validation

---

## 📌 Environment Variables برای Frontend

```env
# .env در frontend
VITE_API_BASE_URL=http://localhost:4001
# یا
NEXT_PUBLIC_API_BASE_URL=http://localhost:4001
# یا
REACT_APP_API_BASE_URL=http://localhost:4001
```

---

**آماده برای استفاده در Frontend! 🚀**
