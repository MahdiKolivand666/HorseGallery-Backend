# 🔍 راهنمای Frontend: قابلیت جستجو

این document شامل تمام اطلاعات مورد نیاز برای پیاده‌سازی جستجو در frontend است.

---

## 🎯 خلاصه

Backend حالا endpoint جستجو را دارد. Frontend فقط باید:

1. ✅ درخواست به endpoint جستجو بزند
2. ✅ نتایج را نمایش دهد
3. ✅ Pagination و Sort را پیاده‌سازی کند

---

## 📡 API Endpoint

```
GET http://localhost:4001/product/public/search
```

---

## 🔧 Query Parameters

| Parameter | Type   | Required | Description                          | Default | Example        |
|-----------|--------|----------|--------------------------------------|---------|----------------|
| `q`       | string | ✅ **Yes**   | عبارت جستجو                          | -       | `گردنبند طلا`  |
| `page`    | number | ❌ No    | شماره صفحه                           | `1`     | `2`            |
| `limit`   | number | ❌ No    | تعداد نتایج در هر صفحه              | `20`    | `10`           |
| `sort`    | string | ❌ No    | مرتب‌سازی                            | `newest`| `price-asc`    |

### Sort Options:

- `newest` - جدیدترین محصولات (پیش‌فرض)
- `oldest` - قدیمی‌ترین محصولات
- `price-asc` - ارزان‌ترین
- `price-desc` - گران‌ترین
- `popular` - محبوب‌ترین (بر اساس salesCount)

---

## 📊 Response Format

### ✅ Success Response:

```typescript
{
  success: true;
  query: string;
  data: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}
```

### ❌ Error Response:

```typescript
{
  success: false;
  error: string;
  query: string;
  data: [];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}
```

---

## 💻 مثال‌های کد

### 1. TypeScript Types

```typescript
// types/search.ts
export interface SearchResponse {
  success: boolean;
  query: string;
  data: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  error?: string;
}

export interface SearchParams {
  q: string;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'popular';
}
```

---

### 2. API Service

```typescript
// services/searchApi.ts
const API_BASE = 'http://localhost:4001';

export const searchApi = {
  /**
   * جستجوی محصولات
   * @param query عبارت جستجو
   * @param page شماره صفحه
   * @param limit تعداد نتایج
   * @param sort نوع مرتب‌سازی
   */
  searchProducts: async (
    query: string,
    page: number = 1,
    limit: number = 20,
    sort: string = 'newest',
  ): Promise<SearchResponse> => {
    // Validation
    if (!query || query.trim() === '') {
      return {
        success: false,
        error: 'پارامتر جستجو الزامی است',
        query: '',
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit,
        },
      };
    }

    const params = new URLSearchParams({
      q: query.trim(),
      page: page.toString(),
      limit: limit.toString(),
      sort,
    });

    const response = await fetch(`${API_BASE}/product/public/search?${params}`);

    if (!response.ok) {
      throw new Error('خطا در جستجو');
    }

    return response.json();
  },
};
```

---

### 3. React Component - صفحه جستجو

```typescript
// pages/SearchPage.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchApi, SearchResponse } from '../services/searchApi';
import ProductCard from '../components/ProductCard';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const sort = searchParams.get('sort') || 'newest';

  useEffect(() => {
    async function performSearch() {
      if (!query || query.trim() === '') {
        setResults(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await searchApi.searchProducts(query, page, limit, sort);
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطا در جستجو');
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [query, page, limit, sort]);

  const handleSortChange = (newSort: string) => {
    setSearchParams({ q: query, page: '1', sort: newSort });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ q: query, page: newPage.toString(), sort });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">در حال جستجو...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">جستجو</h1>
        <p className="text-gray-500">لطفاً عبارت جستجو را وارد کنید</p>
      </div>
    );
  }

  if (!results || results.data.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">
          نتایج جستجو برای: "{results?.query || query}"
        </h1>
        <p className="text-gray-500">نتیجه‌ای یافت نشد</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          نتایج جستجو برای: "{results.query}"
        </h1>
        <p className="text-gray-500">
          {results.pagination.totalItems} نتیجه یافت شد
        </p>
      </div>

      {/* Sort Options */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm font-medium">مرتب‌سازی:</label>
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="border rounded px-3 py-1"
        >
          <option value="newest">جدیدترین</option>
          <option value="oldest">قدیمی‌ترین</option>
          <option value="price-asc">ارزان‌ترین</option>
          <option value="price-desc">گران‌ترین</option>
          <option value="popular">محبوب‌ترین</option>
        </select>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {results.data.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      {results.pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            قبلی
          </button>

          <span className="px-4 py-2">
            صفحه {results.pagination.currentPage} از{' '}
            {results.pagination.totalPages}
          </span>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= results.pagination.totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            بعدی
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### 4. Search Bar Component (Navbar)

```typescript
// components/SearchBar.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="جستجو..."
        className="px-4 py-2 border rounded-lg flex-1"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        جستجو
      </button>
    </form>
  );
}
```

---

### 5. استفاده با Axios (اختیاری)

```typescript
// services/searchApi.ts (با Axios)
import axios from 'axios';

const API_BASE = 'http://localhost:4001';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const searchApi = {
  searchProducts: async (
    query: string,
    page: number = 1,
    limit: number = 20,
    sort: string = 'newest',
  ): Promise<SearchResponse> => {
    if (!query || query.trim() === '') {
      return {
        success: false,
        error: 'پارامتر جستجو الزامی است',
        query: '',
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit,
        },
      };
    }

    const response = await api.get<SearchResponse>('/product/public/search', {
      params: {
        q: query.trim(),
        page,
        limit,
        sort,
      },
    });

    return response.data;
  },
};
```

---

## 🎨 مثال UI/UX

### Search Bar در Navbar:

```tsx
// components/Navbar.tsx
import SearchBar from './SearchBar';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="logo">Logo</div>
        <div className="flex-1 max-w-md mx-4">
          <SearchBar />
        </div>
        <div className="menu">Menu</div>
      </div>
    </nav>
  );
}
```

---

## ⚠️ نکات مهم

### 1. Validation

همیشه query را validate کنید:

```typescript
if (!query || query.trim() === '') {
  // نمایش پیام خطا یا return early
  return;
}
```

### 2. URL Encoding

برای query های فارسی، از `encodeURIComponent` استفاده کنید:

```typescript
const url = `/search?q=${encodeURIComponent(query)}`;
```

### 3. Debounce (اختیاری)

برای جستجوی real-time، از debounce استفاده کنید:

```typescript
import { useDebounce } from 'use-debounce';

const [query, setQuery] = useState('');
const [debouncedQuery] = useDebounce(query, 500);

useEffect(() => {
  if (debouncedQuery) {
    // perform search
  }
}, [debouncedQuery]);
```

### 4. Loading States

همیشه loading state را نمایش دهید:

```typescript
{loading && <div>در حال جستجو...</div>}
```

### 5. Empty States

برای حالت خالی، پیام مناسب نمایش دهید:

```typescript
{results && results.data.length === 0 && (
  <div>نتیجه‌ای یافت نشد</div>
)}
```

---

## 🧪 تست

### Test Cases:

1. ✅ جستجوی ساده: `?q=گردنبند`
2. ✅ جستجو با pagination: `?q=گردنبند&page=2`
3. ✅ جستجو با sort: `?q=گردنبند&sort=price-asc`
4. ✅ جستجوی خالی: `?q=` (باید error برگرداند)
5. ✅ جستجوی بدون نتیجه: `?q=xyz123`

---

## 📝 Checklist پیاده‌سازی Frontend

- [ ] اضافه کردن `SearchResponse` interface
- [ ] ایجاد API service function (`searchProducts`)
- [ ] ایجاد صفحه `/search`
- [ ] اضافه کردن SearchBar به Navbar
- [ ] پیاده‌سازی Pagination
- [ ] پیاده‌سازی Sort dropdown
- [ ] اضافه کردن Loading states
- [ ] اضافه کردن Error handling
- [ ] اضافه کردن Empty states
- [ ] تست با query های مختلف
- [ ] تست Pagination
- [ ] تست Sort options

---

## 🎯 مثال کامل Route

```typescript
// App.tsx یا router config
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SearchPage from './pages/SearchPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/search" element={<SearchPage />} />
        {/* سایر routes */}
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 📞 پشتیبانی

اگر سوال یا مشکلی دارید:

1. ابتدا این document را کامل مطالعه کنید
2. مثال‌های کد را بررسی کنید
3. Response از API را در console.log بررسی کنید
4. با تیم Backend هماهنگ کنید

**موفق باشید! 🚀**

