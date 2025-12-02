# 📦 راهنمای محصولات مرتبط (Related Products) برای Frontend

## 📋 خلاصه

این document توضیح می‌دهد که چطور محصولات مرتبط را از API دریافت کنید و در frontend نمایش دهید.

---

## 🔗 API Endpoint

### دریافت محصول با محصولات مرتبط

```
GET /product/public/:slug
```

**مثال:**

```
GET http://localhost:4001/product/public/kids-flower-pendant-030
```

---

## 📥 Response Format

### Success Response (200 OK)

```json
{
  "_id": "692c5eecffbcf636db303389",
  "name": "آویز کودک طرح گل",
  "slug": "kids-flower-pendant-030",
  "code": "KID-001-18K",
  "price": 2500000,
  "discountPrice": 2250000,
  "discount": 10,
  "onSale": true,
  "stock": 15,
  "description": "آویز طلای 18 عیار با طرح گل برای کودکان",
  "images": [
    "/images/products/product1.webp",
    "/images/products/product1-1.webp"
  ],
  "category": {
    "_id": "...",
    "name": "کودکانه",
    "slug": "kids"
  },
  "subcategory": {
    "_id": "...",
    "name": "آویز",
    "slug": "pendant"
  },
  "relatedProducts": [
    {
      "_id": "692c5eecffbcf636db30338a",
      "name": "آویز کودک طرح خرس",
      "slug": "kids-bear-pendant-029",
      "images": [
        "/images/products/product2.webp",
        "/images/products/product2-2.webp"
      ],
      "price": 2800000,
      "discountPrice": null,
      "isAvailable": true
    },
    {
      "_id": "692c5eecffbcf636db30338b",
      "name": "دستبند کودک طلا ساده",
      "slug": "kids-simple-gold-bracelet-028",
      "images": [
        "/images/products/product3.webp",
        "/images/products/product3-3.webp"
      ],
      "price": 3200000,
      "discountPrice": 2880000,
      "isAvailable": true
    }
    // ... تا 8 محصول مرتبط
  ]
}
```

### ویژگی‌های محصولات مرتبط:

- **تعداد:** حداکثر 8 محصول مرتبط
- **اولویت:** ابتدا از همان category، سپس از category های دیگر
- **اطمینان:** همه محصولات حداقل یک محصول مرتبط دارند (اگر محصولات دیگر وجود داشته باشند)

---

## 💻 مثال‌های کد

### React/Next.js Component

```tsx
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface RelatedProduct {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  discountPrice: number | null;
  isAvailable: boolean;
}

interface ProductDetail {
  _id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  discount: number;
  onSale: boolean;
  images: string[];
  description: string;
  category: {
    name: string;
    slug: string;
  };
  relatedProducts: RelatedProduct[];
}

export default function ProductDetailPage({ slug }: { slug: string }) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:4001/product/public/${slug}`,
        );

        if (!response.ok) {
          throw new Error('محصول یافت نشد');
        }

        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطا در دریافت محصول');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [slug]);

  if (loading) return <div>در حال بارگذاری...</div>;
  if (error) return <div>خطا: {error}</div>;
  if (!product) return <div>محصول یافت نشد</div>;

  return (
    <div className="product-detail-page">
      {/* Product Main Info */}
      <div className="product-main">
        <div className="product-images">
          {product.images.map((image, index) => (
            <Image
              key={index}
              src={`http://localhost:4001${image}`}
              alt={product.name}
              width={500}
              height={500}
            />
          ))}
        </div>

        <div className="product-info">
          <h1>{product.name}</h1>
          <div className="price">
            {product.onSale ? (
              <>
                <span className="original-price">
                  {product.price.toLocaleString()} تومان
                </span>
                <span className="discount-price">
                  {product.discountPrice?.toLocaleString()} تومان
                </span>
                <span className="discount-badge">
                  {product.discount}% تخفیف
                </span>
              </>
            ) : (
              <span className="price">
                {product.price.toLocaleString()} تومان
              </span>
            )}
          </div>
          <p>{product.description}</p>
        </div>
      </div>

      {/* Related Products Section */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <section className="related-products">
          <h2>محصولات مرتبط</h2>
          <div className="related-products-grid">
            {product.relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct._id}
                href={`/products/${relatedProduct.slug}`}
              >
                <div className="related-product-card">
                  <div className="product-image">
                    <Image
                      src={`http://localhost:4001${relatedProduct.images[0]}`}
                      alt={relatedProduct.name}
                      width={300}
                      height={300}
                    />
                    {relatedProduct.discountPrice && (
                      <span className="sale-badge">تخفیف</span>
                    )}
                  </div>
                  <h3>{relatedProduct.name}</h3>
                  <div className="price">
                    {relatedProduct.discountPrice ? (
                      <>
                        <span className="original-price">
                          {relatedProduct.price.toLocaleString()} تومان
                        </span>
                        <span className="discount-price">
                          {relatedProduct.discountPrice.toLocaleString()} تومان
                        </span>
                      </>
                    ) : (
                      <span className="price">
                        {relatedProduct.price.toLocaleString()} تومان
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

---

## 🎨 CSS Styling Example

```css
.related-products {
  margin-top: 4rem;
  padding: 2rem 0;
}

.related-products h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.related-products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.related-product-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  transition:
    transform 0.3s,
    box-shadow 0.3s;
  cursor: pointer;
}

.related-product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.related-product-card .product-image {
  position: relative;
  width: 100%;
  height: 250px;
  overflow: hidden;
}

.related-product-card .product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sale-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff4444;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
}

.related-product-card h3 {
  padding: 1rem;
  font-size: 1rem;
  margin: 0;
}

.related-product-card .price {
  padding: 0 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.related-product-card .original-price {
  text-decoration: line-through;
  color: #999;
  font-size: 0.875rem;
}

.related-product-card .discount-price {
  color: #ff4444;
  font-weight: bold;
  font-size: 1.125rem;
}
```

---

## 🔄 استفاده با SWR یا React Query

### با SWR:

```tsx
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProductDetailPage({ slug }: { slug: string }) {
  const { data, error, isLoading } = useSWR(
    `http://localhost:4001/product/public/${slug}`,
    fetcher,
  );

  if (isLoading) return <div>در حال بارگذاری...</div>;
  if (error) return <div>خطا در دریافت محصول</div>;
  if (!data) return <div>محصول یافت نشد</div>;

  return (
    <div>
      {/* Product Info */}
      <h1>{data.name}</h1>

      {/* Related Products */}
      {data.relatedProducts && data.relatedProducts.length > 0 && (
        <section className="related-products">
          <h2>محصولات مرتبط</h2>
          <div className="related-products-grid">
            {data.relatedProducts.map((product: RelatedProduct) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

### با React Query:

```tsx
import { useQuery } from '@tanstack/react-query';

export default function ProductDetailPage({ slug }: { slug: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:4001/product/public/${slug}`,
      );
      if (!response.ok) throw new Error('محصول یافت نشد');
      return response.json();
    },
  });

  if (isLoading) return <div>در حال بارگذاری...</div>;
  if (error) return <div>خطا در دریافت محصول</div>;

  return (
    <div>
      {/* Product Info */}
      <h1>{data.name}</h1>

      {/* Related Products */}
      {data.relatedProducts && data.relatedProducts.length > 0 && (
        <section className="related-products">
          <h2>محصولات مرتبط</h2>
          <div className="related-products-grid">
            {data.relatedProducts.map((product: RelatedProduct) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

---

## 📝 نکات مهم

### 1. **بررسی وجود محصولات مرتبط:**

```tsx
{product.relatedProducts && product.relatedProducts.length > 0 && (
  // نمایش محصولات مرتبط
)}
```

### 2. **استفاده از تصویر اول:**

```tsx
const imageUrl = relatedProduct.images[0] || '/images/placeholder.webp';
```

### 3. **فرمت قیمت:**

```tsx
const formatPrice = (price: number) => {
  return price.toLocaleString('fa-IR') + ' تومان';
};
```

### 4. **لینک به صفحه محصول:**

```tsx
<Link href={`/products/${relatedProduct.slug}`}>{/* Product Card */}</Link>
```

### 5. **نمایش تخفیف:**

```tsx
{
  relatedProduct.discountPrice && (
    <div className="discount-info">
      <span className="original-price">{relatedProduct.price}</span>
      <span className="discount-price">{relatedProduct.discountPrice}</span>
    </div>
  );
}
```

---

## 🧪 تست API

### با curl:

```bash
curl http://localhost:4001/product/public/kids-flower-pendant-030 | jq '.relatedProducts | length'
```

### با JavaScript:

```javascript
const response = await fetch(
  'http://localhost:4001/product/public/kids-flower-pendant-030',
);
const data = await response.json();
console.log('تعداد محصولات مرتبط:', data.relatedProducts.length);
console.log('محصولات مرتبط:', data.relatedProducts);
```

---

## ✅ Checklist برای Frontend

- [ ] API endpoint را در component اضافه کنید
- [ ] State management برای محصول و محصولات مرتبط
- [ ] Loading state نمایش دهید
- [ ] Error handling اضافه کنید
- [ ] Component برای نمایش محصولات مرتبط بسازید
- [ ] Styling برای grid layout
- [ ] لینک به صفحه محصول مرتبط
- [ ] نمایش تصویر محصول
- [ ] نمایش قیمت و تخفیف
- [ ] Responsive design برای mobile

---

## 🎯 مثال کامل Component

```tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface RelatedProduct {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  discountPrice: number | null;
  isAvailable: boolean;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  discount: number;
  onSale: boolean;
  images: string[];
  description: string;
  relatedProducts: RelatedProduct[];
}

export default function RelatedProductsSection({
  products,
}: {
  products: RelatedProduct[];
}) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="related-products-section">
      <h2 className="section-title">محصولات مرتبط</h2>
      <div className="products-grid">
        {products.map((product) => (
          <Link
            key={product._id}
            href={`/products/${product.slug}`}
            className="product-card"
          >
            <div className="image-container">
              <Image
                src={`http://localhost:4001${product.images[0]}`}
                alt={product.name}
                width={300}
                height={300}
                className="product-image"
              />
              {product.discountPrice && (
                <span className="sale-badge">تخفیف</span>
              )}
            </div>
            <div className="product-info">
              <h3 className="product-name">{product.name}</h3>
              <div className="price-container">
                {product.discountPrice ? (
                  <>
                    <span className="original-price">
                      {product.price.toLocaleString('fa-IR')} تومان
                    </span>
                    <span className="discount-price">
                      {product.discountPrice.toLocaleString('fa-IR')} تومان
                    </span>
                  </>
                ) : (
                  <span className="price">
                    {product.price.toLocaleString('fa-IR')} تومان
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

---

## 📞 پشتیبانی

اگر مشکلی در دریافت یا نمایش محصولات مرتبط دارید، لطفاً بررسی کنید:

1. ✅ API endpoint درست است: `GET /product/public/:slug`
2. ✅ Response شامل `relatedProducts` array است
3. ✅ تصاویر از مسیر `/images/products/` لود می‌شوند
4. ✅ CORS برای frontend تنظیم شده است

---

**تاریخ به‌روزرسانی:** 2025-11-30  
**نسخه API:** 1.0
