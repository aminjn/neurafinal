-- لاگ عملکرد ادمین‌ها (حجم بالا → جدول رابطه‌ای با ایندکس و صفحه‌بندی)
CREATE TABLE IF NOT EXISTS admin_logs (
  id        BIGSERIAL PRIMARY KEY,
  admin     TEXT,
  role      TEXT,
  action    TEXT,
  resource  TEXT,
  target    TEXT,
  ip        TEXT,
  status    TEXT NOT NULL DEFAULT 'موفق',
  ts        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_logs_ts ON admin_logs (ts DESC);
