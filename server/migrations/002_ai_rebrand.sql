-- ============================================================
-- Rebrand AI: حذف ارائه‌دهنده‌ی قدیمی و کاتالوگ نام‌گذاری‌شده
-- لیست مدل‌ها از این پس مستقیماً از API ارائه‌دهنده import می‌شود.
-- ============================================================
DELETE FROM documents WHERE collection = 'ai_providers' AND id = 'gapgpt';
DELETE FROM documents WHERE collection = 'ai_models';
