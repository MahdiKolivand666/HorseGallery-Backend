# راهنمای تست سریع بدون Frontend

## 🎯 هدف

تست کردن API های backend بدون نیاز به ساخت frontend

---

## 1️⃣ Swagger UI (ساده‌ترین راه) ⭐

### دسترسی:

```
🔗 http://localhost:4001/documentation
```

### مزایا:

- ✅ رابط گرافیکی آماده
- ✅ تمام API ها لیست شده
- ✅ مستندات کامل
- ✅ تست مستقیم API
- ✅ نیازی به نصب چیزی نیست

### نحوه استفاده:

#### تست API های عمومی (بدون نیاز به login):

```
1. برو به: http://localhost:4001/documentation
2. Section "Site-Product" رو باز کن
3. GET /site-product رو انتخاب کن
4. روی "Try it out" کلیک کن
5. پارامترها رو تنظیم کن (مثلاً limit=10)
6. روی "Execute" بزن
7. Response رو ببین!
```

#### تست API های محافظت شده (نیاز به login):

```
مرحله 1: دریافت Token
  1. Section "Auth" رو باز کن
  2. POST /auth/login رو انتخاب کن
  3. "Try it out" بزن
  4. در Request body بنویس:
     {
       "mobile": "09123456789",
       "password": "yourpassword"
     }
  5. Execute بزن
  6. از Response، access_token رو کپی کن

مرحله 2: استفاده از Token
  1. بالای صفحه روی دکمه "Authorize" 🔒 کلیک کن
  2. در قسمت "Bearer" token رو paste کن
  3. "Authorize" بزن
  4. حالا می‌تونی API های admin رو تست کنی!
```

---

## 2️⃣ Thunder Client (VS Code Extension)

### نصب:

```
1. VS Code رو باز کن
2. Extensions (Ctrl+Shift+X)
3. جستجو کن: "Thunder Client"
4. Install کن
```

### استفاده:

#### ایجاد یک Request:

```
1. آیکون Thunder Client رو کلیک کن
2. "New Request" بزن
3. Method رو انتخاب کن (GET, POST, ...)
4. URL رو بنویس: http://localhost:4001/site-product
5. Send بزن!
```

#### نمونه Request ها:

**1. لیست محصولات (Public):**

```
GET http://localhost:4001/site-product?limit=10
```

**2. Login:**

```
POST http://localhost:4001/auth/login
Content-Type: application/json

{
  "mobile": "09123456789",
  "password": "yourpassword"
}
```

**3. لیست سفارشات (Admin - نیاز به token):**

```
GET http://localhost:4001/order
Authorization: Bearer YOUR_TOKEN_HERE
```

**4. ایجاد محصول (Admin):**

```
POST http://localhost:4001/product
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "title": "انگشتر طلا",
  "price": 5000000,
  "stock": 10,
  "category": "CATEGORY_ID"
}
```

---

## 3️⃣ Postman (قدرتمندترین)

### دانلود:

```
https://www.postman.com/downloads/
```

### نحوه استفاده:

#### Import Collection:

می‌تونی از Swagger یک Collection بسازی:

```
1. برو به: http://localhost:4001/documentation-json
2. فایل JSON رو ذخیره کن
3. در Postman: File → Import
4. فایل JSON رو انتخاب کن
5. تمام API ها import می‌شن!
```

#### Environment Variables:

```
1. در Postman: Environments → Create
2. متغیرها رو تعریف کن:
   - base_url: http://localhost:4001
   - token: (خالی بذار، بعد از login پر می‌شه)
```

---

## 4️⃣ cURL (برای Terminal)

### نمونه دستورات:

**لیست محصولات:**

```bash
curl http://localhost:4001/site-product?limit=5
```

**Login:**

```bash
curl -X POST http://localhost:4001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile":"09123456789","password":"yourpassword"}'
```

**با Token:**

```bash
TOKEN="your_token_here"
curl http://localhost:4001/order \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5️⃣ یک صفحه HTML ساده (برای دیدن UI)

### فایل: `test-frontend.html`

```html
<!DOCTYPE html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>تست سریع API</title>
    <style>
      * {
        font-family: 'Segoe UI', Tahoma, sans-serif;
      }
      body {
        max-width: 1200px;
        margin: 50px auto;
        padding: 20px;
      }
      .card {
        border: 1px solid #ddd;
        padding: 20px;
        margin: 10px 0;
        border-radius: 8px;
      }
      button {
        padding: 10px 20px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }
      button:hover {
        background: #0056b3;
      }
      #results {
        background: #f5f5f5;
        padding: 15px;
        border-radius: 5px;
        white-space: pre-wrap;
        max-height: 400px;
        overflow-y: auto;
      }
    </style>
  </head>
  <body>
    <h1>🧪 تست سریع API</h1>

    <div class="card">
      <h2>محصولات</h2>
      <button onclick="getProducts()">دریافت لیست محصولات</button>
    </div>

    <div class="card">
      <h2>ورود به سیستم</h2>
      <input type="text" id="mobile" placeholder="موبایل" value="09123456789" />
      <input type="password" id="password" placeholder="رمز عبور" value="" />
      <button onclick="login()">ورود</button>
    </div>

    <div class="card">
      <h2>نتیجه:</h2>
      <div id="results">نتایج اینجا نمایش داده می‌شوند...</div>
    </div>

    <script>
      const API_BASE = 'http://localhost:4001';
      let token = null;

      async function getProducts() {
        try {
          const response = await fetch(`${API_BASE}/site-product?limit=10`);
          const data = await response.json();
          document.getElementById('results').textContent = JSON.stringify(
            data,
            null,
            2,
          );
        } catch (error) {
          document.getElementById('results').textContent =
            'خطا: ' + error.message;
        }
      }

      async function login() {
        const mobile = document.getElementById('mobile').value;
        const password = document.getElementById('password').value;

        try {
          const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile, password }),
          });
          const data = await response.json();

          if (data.access_token) {
            token = data.access_token;
            document.getElementById('results').textContent =
              '✅ ورود موفق!\nToken: ' +
              token.substring(0, 20) +
              '...\n\n' +
              JSON.stringify(data, null, 2);
          } else {
            document.getElementById('results').textContent =
              'خطا در ورود:\n' + JSON.stringify(data, null, 2);
          }
        } catch (error) {
          document.getElementById('results').textContent =
            'خطا: ' + error.message;
        }
      }
    </script>
  </body>
</html>
```

**نحوه استفاده:**

```bash
# فایل رو باز کن با مرورگر:
open test-frontend.html
```

---

## 6️⃣ سناریوهای تست کامل

### سناریو 1: تست جریان خرید

```
1. GET /site-product → دریافت لیست محصولات
2. POST /auth/signup → ثبت‌نام کاربر
3. POST /auth/confirm → تایید کد SMS
4. POST /cart → ایجاد سبد خرید
5. POST /cart/item → اضافه کردن محصول به سبد
6. POST /site-order → ایجاد سفارش
7. GET /order/:id → مشاهده جزئیات سفارش
```

### سناریو 2: تست پنل ادمین

```
1. POST /auth/login (با حساب admin)
2. GET /order → لیست سفارشات
3. GET /order/:id → جزئیات سفارش
4. PATCH /order/:id → تغییر وضعیت سفارش
5. GET /product → لیست محصولات
6. POST /product → ایجاد محصول جدید
```

---

## 7️⃣ نکات مهم

### CORS:

- Backend برای `localhost:4000` تنظیم شده
- اگر از port دیگه‌ای استفاده می‌کنی، در `.env` تغییرش بده:
  ```
  CORS_ORIGIN=http://localhost:YOUR_PORT
  ```

### Authentication:

- برای API های admin نیاز به token داری
- Token رو در header بفرست:
  ```
  Authorization: Bearer YOUR_TOKEN
  ```

### Test Users:

می‌تونی با Swagger یا Postman user های تستی بسازی:

```json
{
  "mobile": "09123456789",
  "password": "Test@1234",
  "firstName": "علی",
  "lastName": "محمدی"
}
```

---

## 📊 پیشنهاد ترتیب یادگیری:

```
1️⃣  شروع با Swagger (5 دقیقه)
    ↓
2️⃣  نصب Thunder Client در VS Code (10 دقیقه)
    ↓
3️⃣  ساخت یک صفحه HTML تستی (15 دقیقه)
    ↓
4️⃣  یادگیری Postman برای تست‌های پیچیده‌تر
    ↓
5️⃣  شروع توسعه Frontend واقعی
```

---

## 🎯 نتیجه:

**هیچ کدوم از این روش‌ها نیاز به ساخت Frontend کامل ندارن!**

می‌تونی:

- ✅ API ها رو تست کنی
- ✅ منطق backend رو بررسی کنی
- ✅ Bug ها رو پیدا کنی
- ✅ با داده‌های واقعی کار کنی

**بعد از مطمئن شدن از صحت backend، شروع به ساخت Frontend کن!**

---

**آماده شروع هستی؟** 🚀

برو به: http://localhost:4001/documentation
