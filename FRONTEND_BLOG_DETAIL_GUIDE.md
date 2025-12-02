# 📝 راهنمای Frontend: API جزئیات بلاگ (Blog Detail)

این document شامل تمام اطلاعات مورد نیاز برای پیاده‌سازی صفحه جزئیات بلاگ در frontend است.

---

## 🎯 خلاصه

برای نمایش صفحه جزئیات بلاگ، از endpoint زیر استفاده کنید:

```
GET /blog/public/:slug
```

این endpoint:

- ✅ جزئیات کامل یک مقاله را بر اساس **slug** برمی‌گرداند
- ✅ تعداد بازدید را به صورت خودکار افزایش می‌دهد
- ✅ تمام اطلاعات مورد نیاز frontend را فراهم می‌کند

---

## 📡 API Endpoint

### دریافت جزئیات بلاگ

```
GET /blog/public/:slug
```

**مثال:**

```
GET http://localhost:4001/blog/public/styling-with-gold-jewelry
```

---

## 📥 Response Format

### Success Response (200 OK)

```json
{
  "_id": "6925bd9b0f9ef8a36b595abd",
  "title": "استایل کردن با جواهرات طلا",
  "slug": "styling-with-gold-jewelry",
  "content": "<p>محتوای کامل مقاله با HTML...</p><p>پاراگراف دوم...</p>",
  "excerpt": "ترفندهایی برای ست کردن طلا با لباس‌های مختلف",
  "image": "/images/blogs/Blog_Square_faa559f7-3684-4f89-bd02-32198ab6d259.webp",
  "category": {
    "_id": "6925bd9a0f9ef8a36b595a8b",
    "name": "آموزش",
    "slug": "guides"
  },
  "author": {
    "_id": "6925bd9b0f9ef8a36b595a90",
    "firstName": "مدیر",
    "lastName": "سیستم",
    "avatar": null
  },
  "tags": ["استایل", "مد", "ست کردن"],
  "views": 1522,
  "likes": 109,
  "isFeatured": false,
  "publishedAt": "2024-03-10T14:00:00.000Z",
  "createdAt": "2025-11-25T14:30:51.219Z",
  "updatedAt": "2025-11-30T16:26:52.325Z"
}
```

### Error Response (404 Not Found)

```json
{
  "statusCode": 404,
  "message": "مقاله یافت نشد",
  "error": "Not Found"
}
```

---

## 💻 مثال‌های کد

### React/Next.js Component

```tsx
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface BlogAuthor {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
}

interface BlogCategory {
  _id: string;
  name: string;
  slug: string;
}

interface BlogDetail {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image: string;
  category: BlogCategory;
  author: BlogAuthor;
  tags: string[];
  views: number;
  likes: number;
  isFeatured: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export default function BlogDetailPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlog() {
      if (!slug) return;

      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:4001/blog/public/${slug}`,
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('مقاله یافت نشد');
          }
          throw new Error('خطا در دریافت مقاله');
        }

        const data = await response.json();
        setBlog(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطا در دریافت مقاله');
      } finally {
        setLoading(false);
      }
    }

    fetchBlog();
  }, [slug]);

  if (loading) return <div>در حال بارگذاری...</div>;
  if (error) return <div>خطا: {error}</div>;
  if (!blog) return <div>مقاله یافت نشد</div>;

  const authorName = `${blog.author.firstName} ${blog.author.lastName}`;
  const publishDate = new Date(blog.publishedAt).toLocaleDateString('fa-IR');

  return (
    <div className="blog-detail-page">
      {/* Header */}
      <header className="blog-header">
        <div className="blog-image">
          <Image
            src={`http://localhost:4001${blog.image}`}
            alt={blog.title}
            width={1200}
            height={600}
            className="header-image"
          />
        </div>
        <div className="blog-meta">
          <Link href={`/blog/category/${blog.category.slug}`}>
            <span className="category-badge">{blog.category.name}</span>
          </Link>
          {blog.isFeatured && <span className="featured-badge">ویژه</span>}
        </div>
        <h1 className="blog-title">{blog.title}</h1>
        <div className="blog-info">
          <div className="author-info">
            {blog.author.avatar && (
              <Image
                src={`http://localhost:4001${blog.author.avatar}`}
                alt={authorName}
                width={40}
                height={40}
                className="author-avatar"
              />
            )}
            <span className="author-name">{authorName}</span>
          </div>
          <span className="publish-date">{publishDate}</span>
          <div className="stats">
            <span className="views">
              👁️ {blog.views.toLocaleString('fa-IR')}
            </span>
            <span className="likes">
              ❤️ {blog.likes.toLocaleString('fa-IR')}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <article className="blog-content">
        <div
          className="content-html"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </article>

      {/* Tags */}
      {blog.tags && blog.tags.length > 0 && (
        <div className="blog-tags">
          <h3>برچسب‌ها:</h3>
          <div className="tags-list">
            {blog.tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Share Buttons */}
      <div className="share-section">
        <h3>اشتراک‌گذاری:</h3>
        <div className="share-buttons">
          <button onClick={() => shareOnTwitter(blog)}>Twitter</button>
          <button onClick={() => shareOnFacebook(blog)}>Facebook</button>
          <button onClick={() => copyLink(blog)}>کپی لینک</button>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function shareOnTwitter(blog: BlogDetail) {
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    blog.title,
  )}&url=${encodeURIComponent(window.location.href)}`;
  window.open(url, '_blank');
}

function shareOnFacebook(blog: BlogDetail) {
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    window.location.href,
  )}`;
  window.open(url, '_blank');
}

function copyLink(blog: BlogDetail) {
  navigator.clipboard.writeText(window.location.href);
  alert('لینک کپی شد!');
}
```

---

## 🎨 CSS Styling Example

```css
.blog-detail-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.blog-header {
  margin-bottom: 3rem;
}

.blog-image {
  width: 100%;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.header-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.blog-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.category-badge {
  background: #f0f0f0;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.3s;
}

.category-badge:hover {
  background: #e0e0e0;
}

.featured-badge {
  background: #ffd700;
  color: #000;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: bold;
}

.blog-title {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.blog-info {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1rem 0;
  border-top: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  font-weight: 500;
}

.publish-date {
  color: #666;
  font-size: 0.875rem;
}

.stats {
  display: flex;
  gap: 1.5rem;
  margin-right: auto;
}

.stats span {
  font-size: 0.875rem;
  color: #666;
}

.blog-content {
  margin: 3rem 0;
  line-height: 1.8;
  font-size: 1.125rem;
}

.content-html {
  color: #333;
}

.content-html h1,
.content-html h2,
.content-html h3 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-weight: bold;
}

.content-html h1 {
  font-size: 2rem;
}

.content-html h2 {
  font-size: 1.75rem;
}

.content-html h3 {
  font-size: 1.5rem;
}

.content-html p {
  margin-bottom: 1.5rem;
}

.content-html img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 2rem 0;
}

.content-html ul,
.content-html ol {
  margin: 1.5rem 0;
  padding-right: 2rem;
}

.content-html li {
  margin-bottom: 0.5rem;
}

.content-html a {
  color: #0066cc;
  text-decoration: underline;
}

.content-html a:hover {
  color: #0052a3;
}

.blog-tags {
  margin: 3rem 0;
  padding: 2rem;
  background: #f9f9f9;
  border-radius: 8px;
}

.blog-tags h3 {
  margin-bottom: 1rem;
  font-size: 1.25rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.tag {
  background: #e0e0e0;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
}

.share-section {
  margin: 3rem 0;
  padding: 2rem;
  background: #f9f9f9;
  border-radius: 8px;
}

.share-section h3 {
  margin-bottom: 1rem;
  font-size: 1.25rem;
}

.share-buttons {
  display: flex;
  gap: 1rem;
}

.share-buttons button {
  padding: 0.75rem 1.5rem;
  background: #0066cc;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
}

.share-buttons button:hover {
  background: #0052a3;
}

@media (max-width: 768px) {
  .blog-detail-page {
    padding: 1rem;
  }

  .blog-title {
    font-size: 1.75rem;
  }

  .blog-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .stats {
    margin-right: 0;
  }
}
```

---

## 🔄 استفاده با SWR یا React Query

### با SWR:

```tsx
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BlogDetailPage({ slug }: { slug: string }) {
  const { data, error, isLoading } = useSWR(
    `http://localhost:4001/blog/public/${slug}`,
    fetcher,
  );

  if (isLoading) return <div>در حال بارگذاری...</div>;
  if (error) return <div>خطا در دریافت مقاله</div>;
  if (!data) return <div>مقاله یافت نشد</div>;

  return (
    <div>
      <h1>{data.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: data.content }} />
    </div>
  );
}
```

### با React Query:

```tsx
import { useQuery } from '@tanstack/react-query';

export default function BlogDetailPage({ slug }: { slug: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['blog', slug],
    queryFn: async () => {
      const response = await fetch(`http://localhost:4001/blog/public/${slug}`);
      if (!response.ok) throw new Error('مقاله یافت نشد');
      return response.json();
    },
  });

  if (isLoading) return <div>در حال بارگذاری...</div>;
  if (error) return <div>خطا در دریافت مقاله</div>;

  return (
    <div>
      <h1>{data.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: data.content }} />
    </div>
  );
}
```

---

## 📝 نکات مهم

### 1. **افزایش خودکار Views**

✅ تعداد بازدید به صورت خودکار توسط backend افزایش می‌یابد. نیازی به درخواست جداگانه نیست.

### 2. **HTML Content**

محتوای بلاگ (`content`) به صورت HTML است. برای نمایش از `dangerouslySetInnerHTML` استفاده کنید:

```tsx
<div dangerouslySetInnerHTML={{ __html: blog.content }} />
```

⚠️ **نکته امنیتی:** اگر محتوا از کاربر می‌آید، باید sanitize شود. اما چون از backend می‌آید و backend آن را sanitize می‌کند، مشکلی نیست.

### 3. **فرمت تاریخ**

```tsx
const publishDate = new Date(blog.publishedAt).toLocaleDateString('fa-IR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
```

### 4. **تصویر بلاگ**

```tsx
<Image
  src={`http://localhost:4001${blog.image}`}
  alt={blog.title}
  width={1200}
  height={600}
/>
```

### 5. **لینک به Category**

```tsx
<Link href={`/blog/category/${blog.category.slug}`}>{blog.category.name}</Link>
```

### 6. **نمایش Author**

```tsx
const authorName = `${blog.author.firstName} ${blog.author.lastName}`;
```

### 7. **Tags**

```tsx
{
  blog.tags && blog.tags.length > 0 && (
    <div className="tags">
      {blog.tags.map((tag, index) => (
        <span key={index}>{tag}</span>
      ))}
    </div>
  );
}
```

---

## 🧪 تست API

### با curl:

```bash
curl http://localhost:4001/blog/public/styling-with-gold-jewelry | jq '.'
```

### با JavaScript:

```javascript
const response = await fetch(
  'http://localhost:4001/blog/public/styling-with-gold-jewelry',
);
const data = await response.json();
console.log('مقاله:', data.title);
console.log('تعداد بازدید:', data.views);
```

---

## ✅ Checklist برای Frontend

- [ ] API endpoint را در component اضافه کنید
- [ ] State management برای blog data
- [ ] Loading state نمایش دهید
- [ ] Error handling اضافه کنید
- [ ] نمایش تصویر بلاگ
- [ ] نمایش عنوان و metadata
- [ ] نمایش محتوای HTML
- [ ] نمایش tags
- [ ] نمایش author و category
- [ ] نمایش تعداد views و likes
- [ ] Share buttons
- [ ] Responsive design برای mobile
- [ ] SEO meta tags (title, description, og:image)

---

## 🔗 لینک‌های مرتبط

- [Blog List API](./FRONTEND_API_DOCUMENTATION.md#blog-list)
- [Blog Category API](./FRONTEND_API_DOCUMENTATION.md#blog-category)

---

## 📞 پشتیبانی

اگر مشکلی در دریافت یا نمایش بلاگ دارید، لطفاً بررسی کنید:

1. ✅ API endpoint درست است: `GET /blog/public/:slug`
2. ✅ Slug درست است
3. ✅ Response شامل تمام فیلدهای مورد نیاز است
4. ✅ تصاویر از مسیر `/images/blogs/` لود می‌شوند
5. ✅ CORS برای frontend تنظیم شده است

---

**تاریخ به‌روزرسانی:** 2025-11-30  
**نسخه API:** 1.0
