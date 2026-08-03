-- شروع تمیز: حذف داده‌ی نمونه‌ی کسب‌وکار از document-store.
-- نگه‌داشته می‌شوند: agents (هسته)، ai_providers/ai_models، roles/agent_defs/languages/themes/config.
DELETE FROM documents WHERE collection IN (
  'businesses', 'transactions', 'invoices', 'wallets', 'tickets',
  'customers', 'chats', 'qc', 'newsletter', 'contact_requests'
);
