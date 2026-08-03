-- ============================================================
-- Neura — Initial schema (PostgreSQL)
-- ============================================================

-- کاربران واقعی پلتفرم (احراز هویت و نقش‌ها) — رابطه‌ای و مقیاس‌پذیر
CREATE TABLE IF NOT EXISTS app_users (
  id            BIGSERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin','superadmin')),
  company       TEXT,
  status        TEXT NOT NULL DEFAULT 'active',
  meta          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_app_users_role    ON app_users (role);
CREATE INDEX IF NOT EXISTS idx_app_users_company ON app_users (company);

-- تنظیمات سراسری سیستم (تک‌ردیفه) — سوپر‌ادمین
CREATE TABLE IF NOT EXISTS settings (
  id         INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data       JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- لایه‌ی Document-store برای موجودیت‌های کسب‌وکار (عامل‌ها، مشتری‌ها، سفارش‌ها، ...)
-- قابل گسترش به هر دامنه‌ی جدید بدون تغییر schema.
CREATE TABLE IF NOT EXISTS documents (
  collection TEXT NOT NULL,
  id         TEXT NOT NULL,
  company    TEXT,
  data       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collection, id)
);
CREATE INDEX IF NOT EXISTS idx_documents_collection         ON documents (collection);
CREATE INDEX IF NOT EXISTS idx_documents_collection_company ON documents (collection, company);
CREATE INDEX IF NOT EXISTS idx_documents_data_gin           ON documents USING GIN (data);
