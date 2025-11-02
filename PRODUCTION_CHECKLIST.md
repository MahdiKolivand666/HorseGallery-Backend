# 🚀 Production Deployment Checklist

این چک‌لیست شامل تمام کارهایی است که باید قبل از deploy به production انجام شود.

---

## ✅ 1. Environment Variables

### فایل `.env` را کامل کنید:

```env
# ============================================================================
# SERVER CONFIGURATION
# ============================================================================
PORT=4001
NODE_ENV=production

# ============================================================================
# DATABASE
# ============================================================================
MONGODB_URI=mongodb://localhost:27017/horsegallery

# ============================================================================
# JWT & AUTHENTICATION
# ============================================================================
JWT_SECRET=CHANGE-THIS-TO-STRONG-RANDOM-64-CHAR-STRING

# ============================================================================
# ENCRYPTION (CRITICAL!)
# ============================================================================
# Must be EXACTLY 32 characters for AES-256
ENCRYPTION_KEY=CHANGE-THIS-TO-32-CHARS-EXACTLY
# Any strong random string
ENCRYPTION_HASH_KEY=CHANGE-THIS-TO-STRONG-RANDOM-STRING

# ============================================================================
# BANK GATEWAY
# ============================================================================
MERCHANT_ID=your-zarinpal-merchant-id
SERVER_URL=https://api.yourdomain.com
BANK_URL=https://api.zarinpal.com/pg/v4/payment/request.json
BANK_VERIFY_URL=https://api.zarinpal.com/pg/v4/payment/verify.json

# ============================================================================
# FRONTEND
# ============================================================================
FRONTEND_URL=https://yourdomain.com
FRONTEND_SUCCESS_URL=https://yourdomain.com/order/success
FRONTEND_FAILED_URL=https://yourdomain.com/order/failed

# ============================================================================
# CORS
# ============================================================================
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# ============================================================================
# SMS SERVICE
# ============================================================================
SMS_ENABLED=true
SMS_API_KEY=your-kavenegar-api-key
SMS_SENDER=your-sender-number
SMS_TEMPLATE=your-template-name

# ============================================================================
# API KEYS
# ============================================================================
API_KEY=your-static-api-key-for-backward-compatibility

# ============================================================================
# REDIS (Optional - for distributed systems)
# ============================================================================
REDIS_URL=redis://localhost:6379
# REDIS_PASSWORD=your-redis-password
# REDIS_CLUSTER_NODES=host1:6379,host2:6379,host3:6379
```

### 🔑 چگونه کلیدهای قوی تولید کنیم:

```bash
# Generate JWT_SECRET (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate ENCRYPTION_KEY (EXACTLY 32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Generate ENCRYPTION_HASH_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ✅ 2. Data Migration (رمزنگاری داده‌ها)

### ⚠️ **CRITICAL:** قبل از production باید داده‌های موجود را رمزنگاری کنید!

### مراحل:

1. **Backup کامل از دیتابیس بگیرید:**
```bash
mongodump --db horsegallery --out ./backup-$(date +%Y%m%d)
```

2. **کلیدهای رمزنگاری را در `.env` تنظیم کنید**

3. **Migration را اجرا کنید:**
```bash
npm run migrate:encrypt
```

4. **نتیجه را بررسی کنید:**
   - تعداد رکوردهای رمزنگاری شده
   - خطاها (اگر وجود دارد)
   - تست login با شماره موبایل رمزنگاری شده

5. **در MongoDB Compass چک کنید:**
   - `users.mobile` باید base64 باشد (رمزنگاری شده)
   - `users.mobileHash` باید hex string باشد
   - `addresses.fullAddress` باید base64 باشد

### 🔄 Rollback (در صورت مشکل):
```bash
# Restore from backup
mongorestore --db horsegallery ./backup-YYYYMMDD/horsegallery
```

---

## ✅ 3. Redis Setup (برای Production)

### نصب Redis:

```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

### پیکربندی Redis:

1. **فایل کانفیگ Redis (`/etc/redis/redis.conf`):**
```conf
# Bind to localhost only (if single server)
bind 127.0.0.1

# Set password
requirepass your-strong-redis-password

# Enable persistence
save 900 1
save 300 10
save 60 10000

# Max memory
maxmemory 256mb
maxmemory-policy allkeys-lru
```

2. **Restart Redis:**
```bash
sudo systemctl restart redis
```

3. **Test connection:**
```bash
redis-cli ping
# Should return: PONG
```

### استفاده از Redis Rate Limiter:

1. **نصب کتابخانه:**
```bash
npm install ioredis
```

2. **کپی کردن guard:**
```bash
cp scripts/redis-rate-limiter.example.ts src/shared/guards/redis-throttle.guard.ts
```

3. **Update در `app.module.ts`:**
```typescript
// Replace IpThrottleGuard with RedisThrottleGuard
import { RedisThrottleGuard } from './shared/guards/redis-throttle.guard';

providers: [
  {
    provide: APP_GUARD,
    useClass: RedisThrottleGuard, // Use Redis-based guard
  },
]
```

---

## ✅ 4. Security Logs Monitoring

### دسترسی به Security Logs:

```bash
# Get recent security events
GET /admin/security-logs?limit=100&level=critical
Headers: Authorization: Bearer <admin-token>

# Get statistics
GET /admin/security-logs/statistics?days=7
Headers: Authorization: Bearer <admin-token>

# Check failed attempts for specific IP
GET /admin/security-logs/failed-attempts?ipOrMobile=1.2.3.4&minutes=15
Headers: Authorization: Bearer <admin-token>
```

### تنظیم Alerts (پیشنهادی):

**Option 1: ایمیل Alert**
```typescript
// در SecurityLogService
if (level === SecurityLevel.Critical) {
  await this.emailService.sendAlert({
    to: 'admin@yourdomain.com',
    subject: 'Security Alert',
    body: description,
  });
}
```

**Option 2: Slack/Discord Webhook**
```typescript
// ارسال به Slack
await axios.post(process.env.SLACK_WEBHOOK_URL, {
  text: `🚨 Security Alert: ${description}`,
});
```

**Option 3: SMS به ادمین**
```typescript
await this.smsService.sendSms(
  process.env.ADMIN_MOBILE,
  `Security Alert: ${description}`
);
```

### لاگ‌های مهم که باید monitor شوند:

- ✅ `login.failed` - بیش از 5 بار در 15 دقیقه
- ✅ `unauthorized.access` - تلاش برای دسترسی غیرمجاز
- ✅ `rate_limit.exceeded` - تلاش برای DDoS
- ✅ `suspicious.activity` - فعالیت مشکوک
- ✅ `csrf.mismatch` - تلاش برای CSRF attack

---

## ✅ 5. Database Indexes

### بررسی وجود indexها:

```javascript
// در MongoDB Compass یا mongo shell
db.users.getIndexes()
db.orders.getIndexes()
db.products.getIndexes()
db.securitylogs.getIndexes()
```

### اگر index وجود ندارد، ایجاد کنید:

```javascript
// Users
db.users.createIndex({ mobile: 1 }, { unique: true })
db.users.createIndex({ mobileHash: 1 }, { unique: true })
db.users.createIndex({ role: 1 })

// Orders
db.orders.createIndex({ refId: 1 })
db.orders.createIndex({ user: 1, status: 1 })
db.orders.createIndex({ createdAt: -1 })

// Products
db.products.createIndex({ slug: 1, isAvailable: 1 })
db.products.createIndex({ category: 1, isAvailable: 1 })

// Security Logs
db.securitylogs.createIndex({ eventType: 1, createdAt: -1 })
db.securitylogs.createIndex({ ipAddress: 1, createdAt: -1 })
db.securitylogs.createIndex({ level: 1, createdAt: -1 })
```

---

## ✅ 6. Testing Checklist

### قبل از deploy، تست کنید:

- [ ] **Authentication:**
  - [ ] Login با password
  - [ ] Login با SMS code
  - [ ] Refresh token
  - [ ] Logout
  
- [ ] **Security:**
  - [ ] Rate limiting (101 requests → blocked)
  - [ ] CSRF protection
  - [ ] File upload (10MB limit)
  - [ ] Invalid file types blocked
  
- [ ] **Payment:**
  - [ ] Create order
  - [ ] Payment callback (success)
  - [ ] Payment callback (failed)
  - [ ] Stock reduction
  
- [ ] **Admin:**
  - [ ] View orders
  - [ ] Update order status
  - [ ] View security logs
  
- [ ] **Performance:**
  - [ ] Response time < 200ms (cached)
  - [ ] Response time < 500ms (uncached)
  - [ ] Database queries optimized

---

## ✅ 7. Build & Deploy

### Build:

```bash
npm run build
npm run lint
npm test
```

### Deploy Steps:

1. **Server setup:**
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2
```

2. **Clone & Install:**
```bash
git clone <your-repo>
cd horse-gallery-backend
npm install --production
```

3. **Configure:**
```bash
cp .env.example .env
nano .env  # Edit with production values
```

4. **Run migration:**
```bash
npm run migrate:encrypt
```

5. **Start with PM2:**
```bash
pm2 start dist/main.js --name "horse-backend"
pm2 save
pm2 startup
```

6. **Nginx reverse proxy:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

7. **SSL Certificate (Let's Encrypt):**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## ✅ 8. Monitoring & Maintenance

### Health Checks:

```bash
# Check server status
curl https://api.yourdomain.com/health

# Should return: {"status":"ok","timestamp":"..."}
```

### PM2 Monitoring:

```bash
pm2 status
pm2 logs horse-backend
pm2 monit
```

### Database Backup (Daily):

```bash
# Add to crontab
0 2 * * * mongodump --db horsegallery --out /backup/mongo/$(date +\%Y\%m\%d)
```

### Log Rotation:

```bash
# PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

---

## 🎯 Final Checklist

قبل از production، این موارد را چک کنید:

- [ ] ✅ Environment variables همه تنظیم شده‌اند
- [ ] ✅ ENCRYPTION_KEY دقیقاً 32 کاراکتر است
- [ ] ✅ JWT_SECRET قوی و random است
- [ ] ✅ Migration اجرا شده و موفق بوده
- [ ] ✅ Backup از دیتابیس گرفته شده
- [ ] ✅ Redis نصب و پیکربندی شده (اختیاری)
- [ ] ✅ Security logs controller فعال است
- [ ] ✅ Database indexes ایجاد شده‌اند
- [ ] ✅ همه تست‌ها pass می‌کنند
- [ ] ✅ SSL certificate نصب شده
- [ ] ✅ Nginx reverse proxy تنظیم شده
- [ ] ✅ PM2 برای auto-restart تنظیم شده
- [ ] ✅ Daily backup کانفیگ شده
- [ ] ✅ Monitoring و alerts فعال است

---

## 📞 Support

در صورت بروز مشکل:

1. لاگ‌های PM2 را چک کنید: `pm2 logs`
2. Security logs را بررسی کنید: `GET /admin/security-logs`
3. Database backup را restore کنید اگر لازم است
4. با تیم فنی تماس بگیرید

---

**آخرین بروزرسانی:** 2 نوامبر 2025  
**نسخه:** 1.0  
**وضعیت:** Production-Ready ✅

