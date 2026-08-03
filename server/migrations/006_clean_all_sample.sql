-- حذف کامل داده‌ی نمونه: همه‌چیز واقعی می‌شود (بدون دمو).
-- نگه‌داشته می‌شوند: agents (هسته)، ai_providers/ai_models، roles/agent_defs/languages/themes/config.
DELETE FROM documents WHERE collection IN (
  'personnel', 'deals', 'finance', 'orders', 'tasks', 'notifications'
);
