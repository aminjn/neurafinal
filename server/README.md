# Neura Backend (API)

بک‌اند واقعی Neura: **Node.js + Express + PostgreSQL + JWT**.

## معماری
- **`app_users`** (رابطه‌ای): کاربران واقعی پلتفرم با نقش `user|admin|superadmin`، هش پسورد (bcrypt) و ایندکس‌ها — مناسب مقیاس بالا.
- **`settings`** (تک‌ردیفه، JSONB): تنظیمات سراسری سیستم که سوپر‌ادمین ویرایش می‌کند.
- **`documents`** (Document-store روی JSONB): همه‌ی موجودیت‌های کسب‌وکار (عامل‌ها، مشتری‌ها، سفارش‌ها، تسک‌ها، ...) — قابل گسترش به هر دامنه بدون تغییر schema.

## مسیرهای API
| متد | مسیر | دسترسی |
|---|---|---|
| POST | `/api/auth/login` | عمومی |
| GET | `/api/auth/me` | کاربر واردشده |
| GET | `/api/settings` | عمومی |
| PUT | `/api/settings` | سوپر‌ادمین |
| GET | `/api/data/:collection` | کاربر واردشده |
| POST/PUT/DELETE | `/api/data/:collection[/:id]` | ادمین/سوپر‌ادمین |
| GET | `/api/users?q=&limit=&offset=` | ادمین/سوپر‌ادمین (صفحه‌بندی) |
| POST/PUT/DELETE | `/api/users[/:id]` | ادمین/سوپر‌ادمین |

## اجرای محلی
```bash
cp .env.example .env       # مقادیر را تنظیم کن (DATABASE_URL, JWT_SECRET, ...)
npm install
node src/migrate.js        # ساخت جداول
node src/seed.js           # داده اولیه + حساب سوپر‌ادمین
npm start                  # http://localhost:4000
```

## مقیاس‌پذیری (۳M+ کاربر)
کد **بدون حالت (stateless)** است (JWT) و از connection pool استفاده می‌کند، پس افقی مقیاس می‌گیرد. برای بار واقعی:
- PostgreSQL مدیریت‌شده‌ی آروان (به‌جای نصب لوکال) + read replica.
- چند نمونه‌ی API پشت لودبالانسر (سرویس systemd یا PM2/cluster).
- کش با Redis برای `settings` و نشست‌ها.
- صفحه‌بندی همه‌جا اجباری است (هرگز کل جدول کاربران خوانده نمی‌شود).
