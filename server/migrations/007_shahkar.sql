-- احرازِ هویتِ شاهکار: هر «کد ملیِ» ایرانی باید در کلِ سیستم یکتا باشد.
-- ایندکسِ یکتای جزئی روی meta->>'nationalId' — فقط برای رکوردهایی که کد ملی دارند.
-- (تلاش برای ذخیرهٔ کد ملیِ تکراری روی کاربرِ دیگر با خطای unique رد می‌شود.)
CREATE UNIQUE INDEX IF NOT EXISTS ux_app_users_national_id
  ON app_users ((meta->>'nationalId'))
  WHERE (meta->>'nationalId') IS NOT NULL;
