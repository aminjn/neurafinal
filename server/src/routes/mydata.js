// انبارِ داده‌ی per-user: هر کاربرِ واردشده (نه فقط admin) می‌تواند دادهٔ «خودش» را ذخیره کند
// (وظایف/تقویم/یادداشت‌ها ...). ایزوله‌سازیِ سه‌لایه تا داده‌ی کاربران هرگز مخلوط/نشت نشود:
//   ۱) collection با پیشوندِ u_ (جدا از داده‌های شرکتیِ /api/data)
//   ۲) company = 'user:<sub>' (فیلترِ منطقی)
//   ۳) کلیدِ اصلی id = '<sub>__<clientId>' (جلوگیری از تصادمِ PK بینِ کاربران)
// در پاسخ، id اصلیِ کلاینت برگردانده می‌شود (پیشوند فقط داخلِ DB است).
import express from 'express';
import { query, pool } from '../db.js';
import { authRequired } from '../auth.js';

const router = express.Router();

const ALLOWED = new Set([
  'tasks', 'calendar', 'events', 'appointments', 'notes', 'reminders',
  'goals', 'habits', 'bookmarks', 'lists', 'tickets', 'feedback',
  'payment_methods',
  'admin_todos', 'admin_planner', 'sec_followups', 'sec_referrals', 'notif_prefs', 'wishlist',
  // per-userهایی که فرانت به آن‌ها می‌نویسد (وگرنه myCreate/myBulkSave بی‌صدا ۴۰۴ می‌شد = فیک)
  'group_chats', 'user_profile', 'support_tickets', 'admin_events', 'reports', 'meetings',
  // دسته‌بندیِ گفتگوهای دستیار (per-user) — قبلاً localStorage بود (با رفرش/دستگاهِ دیگر می‌پرید).
  'chat_categories',
  'sec_tasks', 'sec_events', 'sec_meetings', 'sec_reminders',
  // منشیِ شخصی (per-user)
  'sec_tasks', 'sec_events', 'sec_meetings', 'sec_reminders',
  'sec_contacts', 'sec_leads', 'sec_receipts', 'sec_payments', 'sec_todos', 'sec_activities', 'dine_favorites', 'asst_msgs', 'asst_sessions', 'support_msgs', 'support_sessions', 'eu_chats',
  // ایجنتِ بازاریاب (per-user) — لید/کمپین/سگمنت/پرسونا/تقویم/تأییدها/گفتگوها
  'mkt_leads', 'mkt_campaigns', 'mkt_segments', 'mkt_personas', 'mkt_calendar', 'mkt_approvals', 'mkt_conversations',
  // ایجنتِ خرید و تدارکات (per-user) — انبار/کاتالوگِ کالاها + تأمین‌کننده‌ها
  'proc_goods', 'proc_suppliers', 'proc_inventory',
  // شرکت‌های خودِ کاربر (per-user) — قبلاً در /api/data بود که فقط ادمین اجازه داشت (کاربرِ عادی ۴۰۳
  // می‌گرفت → تنظیماتِ شرکت با رفرش می‌پرید). حالا per-user ذخیره می‌شود و پایدار می‌ماند.
  'businesses',
  // اعلان‌های per-userِ فروشنده (نوتیفِ «فروش جدید» هنگام خرید از فروشگاهش) + سفارش‌های فروش.
  'notifications', 'orders',
  // آدرس‌های ارسالِ کاربر (نام/آدرسِ متنی/لوکیشنِ lat,lng از نقشه).
  'addresses',
  // ایجنتِ رستوران‌داری (داین) — کلِ بک‌آفیسِ رستوران/کافه per-user است (مالکِ رستوران).
  // منو/دسته، رسپی (BOM روی proc_inventory)، میز+QR، سفارشِ آشپزخانه (KDS)، پرسنل/شیفت،
  // رزرو، و تنظیماتِ رستوران. (dine_modifiers هنوز ساخته نشده؛ وقتی UI/POSِ مادیفایر آمد اضافه می‌شود.)
  'menu_categories', 'menu_items', 'recipes', 'dine_tables',
  'dine_orders', 'dine_staff', 'dine_shifts', 'reservations', 'dine_settings', 'dine_competitors',
]);
const collName = (c) => 'u_' + c;
const scope = (req) => 'user:' + req.user.sub;
const dbId = (req, clientId) => String(req.user.sub) + '__' + String(clientId);
const genId = (c) => `${c}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

function checkCollection(req, res, next) {
  if (!ALLOWED.has(req.params.collection)) return res.status(404).json({ error: 'unknown_collection' });
  next();
}

// لیستِ دادهٔ خودِ کاربر
router.get('/:collection', authRequired, checkCollection, async (req, res) => {
  const { rows } = await query(
    'SELECT data FROM documents WHERE collection = $1 AND company = $2 ORDER BY created_at',
    [collName(req.params.collection), scope(req)]
  );
  res.json(rows.map((r) => r.data));
});

// ایجاد/به‌روزرسانیِ یک سند
router.post('/:collection', authRequired, checkCollection, async (req, res) => {
  const body = req.body || {};
  // نوعِ اصلیِ id حفظ می‌شود (مثلاً عددی)؛ فقط کلیدِ PK رشته‌ای است.
  const rawId = (body.id != null && body.id !== '') ? body.id : genId(req.params.collection);
  const data = { ...body, id: rawId };
  const { rows } = await query(
    `INSERT INTO documents (collection, id, company, data) VALUES ($1, $2, $3, $4::jsonb)
     ON CONFLICT (collection, id) DO UPDATE SET data = $4::jsonb, updated_at = now()
     RETURNING data`,
    [collName(req.params.collection), dbId(req, rawId), scope(req), JSON.stringify(data)]
  );
  res.status(201).json(rows[0].data);
});

// جایگزینیِ کاملِ یک مجموعه (فقط برای خودِ کاربر)
router.post('/:collection/bulk', authRequired, checkCollection, async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const coll = collName(req.params.collection);
  const company = scope(req);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM documents WHERE collection = $1 AND company = $2', [coll, company]);
    for (const it of items) {
      const rawId = (it && it.id != null && it.id !== '') ? it.id : genId(req.params.collection);
      const data = { ...(it || {}), id: rawId };
      await client.query(
        `INSERT INTO documents (collection, id, company, data) VALUES ($1, $2, $3, $4::jsonb)
         ON CONFLICT (collection, id) DO UPDATE SET data = $4::jsonb, updated_at = now()`,
        [coll, dbId(req, rawId), company, JSON.stringify(data)]
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

// به‌روزرسانیِ merge یک سند
router.put('/:collection/:id', authRequired, checkCollection, async (req, res) => {
  const patch = { ...(req.body || {}) };
  delete patch.id;
  const { rows } = await query(
    `UPDATE documents SET data = data || $3::jsonb, updated_at = now()
      WHERE collection = $1 AND id = $2 AND company = $4 RETURNING data`,
    [collName(req.params.collection), dbId(req, req.params.id), JSON.stringify(patch), scope(req)]
  );
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  res.json(rows[0].data);
});

// حذفِ یک سند
router.delete('/:collection/:id', authRequired, checkCollection, async (req, res) => {
  const { rowCount } = await query(
    'DELETE FROM documents WHERE collection = $1 AND id = $2 AND company = $3',
    [collName(req.params.collection), dbId(req, req.params.id), scope(req)]
  );
  if (!rowCount) return res.status(404).json({ error: 'not_found' });
  res.json({ ok: true });
});

export default router;
