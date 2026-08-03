// یادآورهای زمان‌بندی‌شده — «حتی با برنامهٔ بسته» کار می‌کنند: در سرور ذخیره می‌شوند و یک زمان‌بند
// سرِ موعد پیامک می‌فرستد (ippanel، الگوی قابل‌تنظیم در سوپرادمین). ذخیره در documents(collection='reminder_jobs').
import express from 'express';
import { query } from '../db.js';
import { authRequired } from '../auth.js';
import { sendPatternSms } from '../sms.js';

const router = express.Router();
const COLL = 'reminder_jobs';

async function getSettings() {
  try { const { rows } = await query('SELECT data FROM settings WHERE id = 1'); return rows[0]?.data || {}; }
  catch { return {}; }
}
const nowMs = () => Date.now();

// ساختِ یادآور — { title, dueAt (epoch ms یا ISO), phone? }. phone پیش‌فرض = شمارهٔ خودِ کاربر.
router.post('/', authRequired, async (req, res) => {
  const sub = String(req.user.sub);
  const title = String(req.body?.title || '').trim();
  let dueAt = req.body?.dueAt;
  if (typeof dueAt === 'string') { const t = Date.parse(dueAt); dueAt = isNaN(t) ? Number(dueAt) : t; }
  dueAt = Number(dueAt);
  if (!title) return res.status(400).json({ error: 'title_required' });
  if (!dueAt || isNaN(dueAt)) return res.status(400).json({ error: 'due_required' });
  let phone = String(req.body?.phone || '').replace(/\D/g, '');
  if (!phone) {
    const ur = await query('SELECT meta FROM app_users WHERE id = $1', [sub]);
    phone = String(ur.rows[0]?.meta?.phone || '').replace(/\D/g, '');
  }
  const id = 'rem_' + sub + '_' + nowMs() + Math.random().toString(36).slice(2, 6);
  const data = { id, sub, title, dueAt, phone: phone || null, sent: false, createdAt: nowMs() };
  await query("INSERT INTO documents (collection, id, company, data) VALUES ($1, $2, $3, $4::jsonb)", [COLL, id, 'usr_' + sub, JSON.stringify(data)]);
  res.json({ ok: true, reminder: data });
});

// فهرستِ یادآورهای همین کاربر
router.get('/', authRequired, async (req, res) => {
  const sub = String(req.user.sub);
  const { rows } = await query("SELECT data FROM documents WHERE collection=$1 AND data->>'sub'=$2 ORDER BY (data->>'dueAt')::bigint DESC LIMIT 200", [COLL, sub]);
  res.json({ reminders: rows.map((r) => r.data) });
});

// حذفِ یادآور (فقط مالکِ خودش)
router.delete('/:id', authRequired, async (req, res) => {
  const sub = String(req.user.sub);
  const { rowCount } = await query("DELETE FROM documents WHERE collection=$1 AND id=$2 AND data->>'sub'=$3", [COLL, req.params.id, sub]);
  if (!rowCount) return res.status(404).json({ error: 'not_found' });
  res.json({ ok: true });
});

// ── زمان‌بند: سرِ موعد پیامک بفرست ─────────────────────────────────────────────
// در محیطِ cluster هر worker این را اجرا می‌کند؛ برای جلوگیری از ارسالِ تکراری، هر یادآورِ رسیده را
// «اتمیک» با UPDATE ... RETURNING claim (sent=true) می‌کنیم؛ فقط یک worker ردیف را می‌گیرد.
let _tickRunning = false;
export async function reminderTick() {
  if (_tickRunning) return; _tickRunning = true;
  try {
    const claimed = await query(
      `UPDATE documents SET data = jsonb_set(data, '{sent}', 'true'), updated_at = now()
         WHERE collection = $1 AND (data->>'sent')::boolean = false AND (data->>'dueAt')::bigint <= $2
         RETURNING data`,
      [COLL, nowMs()]
    );
    if (!claimed.rows.length) return;
    const s = await getSettings();
    const patternCode = s.reminderPatternCode || '';
    for (const row of claimed.rows) {
      const r = row.data || {};
      if (!r.phone || !patternCode) continue; // بدونِ شماره یا الگو → فقط علامتِ ارسال (کلاینت آلارم می‌زند)
      const when = new Date(Number(r.dueAt));
      let hhmm = '';
      try { hhmm = new Intl.DateTimeFormat('fa-IR-u-nu-latn', { hour: '2-digit', minute: '2-digit' }).format(when); } catch { hhmm = ''; }
      // متغیرهای الگو: title / time / name — الگوی ippanel باید همین‌ها را داشته باشد.
      await sendPatternSms(s, r.phone, patternCode, { title: r.title || 'یادآور', time: hhmm, name: r.name || '' });
    }
  } catch (e) {
    console.error('reminderTick error:', e?.message || e);
  } finally { _tickRunning = false; }
}

// هر ۳۰ ثانیه چک کن. unref تا مانعِ خروجِ پروسه نشود.
const _timer = setInterval(() => { reminderTick().catch(() => {}); }, 30000);
if (_timer.unref) _timer.unref();

export default router;
