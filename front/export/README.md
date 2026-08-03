# Neura UI

نسخهٔ کامل و آفلاین اپلیکیشن Neura — یک فایل `index.html` کاملاً self-contained (تمام فونت‌ها، آیکون‌ها، کتابخانه‌ها و سورس داخلش inline شده). هیچ build step یا نصب پکیجی لازم نیست.

## اجرای محلی

کافی است `index.html` را در مرورگر باز کنید، یا یک سرور استاتیک ساده اجرا کنید:

```bash
npx serve .
```

## استقرار روی Vercel

این یک سایت استاتیک است؛ Vercel آن را بدون تنظیمات اضافه می‌شناسد.

- **از طریق داشبورد:** ریپو را وارد (import) کنید. Framework Preset را روی **Other** بگذارید، Build Command خالی، Output Directory برابر `.` (ریشه).
- **از طریق CLI:**

```bash
npm i -g vercel
vercel
```

فایل `vercel.json` همراه پروژه، همهٔ مسیرها را به `index.html` هدایت می‌کند (SPA rewrite).

## استقرار روی GitHub Pages

فایل `index.html` را در ریشهٔ برنچ `main` (یا پوشهٔ `/docs`) قرار دهید و در Settings → Pages منبع را روی همان برنچ/پوشه تنظیم کنید.

## ساختار

```
index.html     اپ کامل (self-contained)
vercel.json    تنظیمات استقرار استاتیک / SPA rewrite
README.md      همین فایل
```
