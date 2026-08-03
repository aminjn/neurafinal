import express from 'express';
import { query, pool } from '../db.js';
import { authRequired, roleRequired } from '../auth.js';

const router = express.Router();

// مجموعه‌های مجاز (Document collections). برای افزودن دامنه‌ی جدید فقط اینجا اضافه کن.
const ALLOWED = new Set([
  'agents', 'personnel', 'customers', 'deals', 'finance',
  'orders', 'tasks', 'notifications', 'campaigns', 'conversations', 'messages',
  'ai_providers', 'ai_models',
  'transactions', 'invoices', 'wallets', 'tickets', 'businesses',
  'roles', 'agent_defs', 'config', 'languages', 'themes', 'contact_requests', 'newsletter', 'chats', 'qc',
  'call_tasks', 'plans',
  // ماژول بازاریابی/فروش/تدارکات/منشی
  'leads', 'audiences', 'segments', 'approvals', 'calendar', 'performance',
  'meetings', 'products', 'inventory', 'purchase_requests', 'purchase_orders', 'shifts', 'reports',
  'deliveries', 'purchase_invoices',
  'personas',
  // اکشن‌های واقعیِ فروش/باشگاه مشتریان (به‌جای toastِ فیک واقعاً در انبار ذخیره می‌شوند)
  'discount_codes', 'loyalty_rewards', 'sales_suggestions',
]);

function checkCollection(req, res, next) {
  if (!ALLOWED.has(req.params.collection)) return res.status(404).json({ error: 'unknown_collection' });
  next();
}

// خواندن و نوشتنِ داده‌های تجاری فقط برای admin/superadmin است؛ کاربرِ نهایی داده‌ی خود را از
// /api/me/data می‌گیرد. (قبلاً GET فقط authRequired بود → هر کاربری می‌توانست مشتریان/معاملاتِ
// کسب‌وکار را بخواند = رخنهٔ حریمِ خصوصی.)
const adminGuard = [authRequired, roleRequired('admin', 'superadmin')];
const writeGuard = adminGuard;

// لیست — با فیلتر اختیاری company
router.get('/:collection', ...adminGuard, checkCollection, async (req, res) => {
  const { collection } = req.params;
  const { company } = req.query;
  const sql = company
    ? 'SELECT data FROM documents WHERE collection = $1 AND company = $2 ORDER BY created_at'
    : 'SELECT data FROM documents WHERE collection = $1 ORDER BY created_at';
  const params = company ? [collection, company] : [collection];
  const { rows } = await query(sql, params);
  res.json(rows.map((r) => r.data));
});

// یک سند
router.get('/:collection/:id', ...adminGuard, checkCollection, async (req, res) => {
  const { rows } = await query(
    'SELECT data FROM documents WHERE collection = $1 AND id = $2',
    [req.params.collection, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  res.json(rows[0].data);
});

// ساخت
router.post('/:collection', ...writeGuard, checkCollection, async (req, res) => {
  const { collection } = req.params;
  const body = req.body || {};
  const id = String(body.id || `${collection}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const data = { ...body, id };
  const { rows } = await query(
    `INSERT INTO documents (collection, id, company, data)
       VALUES ($1, $2, $3, $4::jsonb)
     ON CONFLICT (collection, id) DO UPDATE SET data = $4::jsonb, updated_at = now()
     RETURNING data`,
    [collection, id, data.company || null, JSON.stringify(data)]
  );
  res.status(201).json(rows[0].data);
});

// جایگزینیِ کاملِ یک مجموعه برای یک شرکت (برای صفحه‌هایی که کلِ آرایه را همگام می‌کنند).
// ترتیبِ اتمی: در یک تراکنش، اسنادِ همان collection+company پاک و اسنادِ جدید درج می‌شوند.
router.post('/:collection/bulk', ...writeGuard, checkCollection, async (req, res) => {
  const { collection } = req.params;
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const company = req.body?.company ?? null;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'DELETE FROM documents WHERE collection = $1 AND company IS NOT DISTINCT FROM $2',
      [collection, company]
    );
    for (const it of items) {
      const id = String((it && it.id) || `${collection}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
      const data = { ...(it || {}), id };
      await client.query(
        `INSERT INTO documents (collection, id, company, data) VALUES ($1, $2, $3, $4::jsonb)
         ON CONFLICT (collection, id) DO UPDATE SET data = $4::jsonb, updated_at = now()`,
        [collection, id, company, JSON.stringify(data)]
      );
    }
    await client.query('COMMIT');
    res.json({ ok: true, count: items.length });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    res.status(500).json({ error: 'bulk_failed', detail: String(e?.message || e) });
  } finally {
    client.release();
  }
});

// به‌روزرسانی (merge)
router.put('/:collection/:id', ...writeGuard, checkCollection, async (req, res) => {
  const { collection, id } = req.params;
  const patch = { ...(req.body || {}) };
  delete patch.id;
  const { rows } = await query(
    `UPDATE documents
        SET data = data || $3::jsonb,
            company = COALESCE($4, company),
            updated_at = now()
      WHERE collection = $1 AND id = $2
      RETURNING data`,
    [collection, id, JSON.stringify(patch), patch.company || null]
  );
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  res.json(rows[0].data);
});

// حذف
router.delete('/:collection/:id', ...writeGuard, checkCollection, async (req, res) => {
  const { rowCount } = await query(
    'DELETE FROM documents WHERE collection = $1 AND id = $2',
    [req.params.collection, req.params.id]
  );
  if (!rowCount) return res.status(404).json({ error: 'not_found' });
  res.json({ ok: true });
});

export default router;
