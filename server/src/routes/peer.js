// پیام‌رسانیِ کاربر-به-کاربرِ نورا: کاربر می‌تواند به مخاطبی که کاربرِ نوراست پیام بدهد.
// حریمِ خصوصی: /resolve فقط برای شماره‌هایی که خودِ کاربر در مخاطبینش دارد، عضویتِ نورا را برمی‌گرداند؛
// و هر کاربر فقط پیام‌های گفتگویی را می‌بیند که خودش یک طرفِ آن است (convId شاملِ subِ اوست).
import express from 'express';
import { query } from '../db.js';
import { authRequired } from '../auth.js';

const router = express.Router();

// شکلِ کانونیِ شماره: ۱۰ رقمِ آخر (9xxxxxxxxx) تا فرمت‌های 0912../+98912../98912.. همه یکسان شوند.
function canonPhone(p) {
  let s = String(p || '').replace(/\D/g, '');
  if (s.startsWith('0098')) s = s.slice(4);
  if (s.startsWith('98') && s.length > 10) s = s.slice(2);
  if (s.startsWith('0')) s = s.slice(1);
  return s.length >= 10 ? s.slice(-10) : '';
}
function convId(a, b) { return 'pc_' + [String(a), String(b)].sort().join('_'); }

// کدام‌یک از شماره‌های مخاطبینِ کاربر، کاربرِ نورا هستند؟
router.post('/resolve', authRequired, async (req, res) => {
  const phones = Array.isArray(req.body?.phones) ? req.body.phones : [];
  const map = {};
  for (const p of phones) { const c = canonPhone(p); if (c) map[c] = String(p); }
  const cs = Object.keys(map);
  if (!cs.length) return res.json({ users: [] });
  let rows = [];
  try { rows = (await query('SELECT id, username, name, meta FROM app_users')).rows; } catch (_) { rows = []; }
  const users = [];
  for (const r of rows) {
    if (String(r.id) === String(req.user.sub)) continue;
    const uc = canonPhone(r.username || (r.meta && r.meta.phone) || '');
    if (uc && map[uc]) users.push({ sub: String(r.id), name: String(r.name || map[uc]), phone: map[uc] });
  }
  res.json({ users });
});

// ارسالِ پیام به کاربرِ دیگرِ نورا
router.post('/send', authRequired, async (req, res) => {
  const to = String(req.body?.to || '');
  const text = String(req.body?.text || '').slice(0, 4000);
  if (!to || !text.trim()) return res.status(400).json({ error: 'to_and_text_required' });
  const u = await query('SELECT id FROM app_users WHERE id = $1', [to]);
  if (!u.rows[0]) return res.status(404).json({ error: 'user_not_found' });
  const conv = convId(req.user.sub, to);
  const id = conv + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const data = { id, conv, from: String(req.user.sub), to, text, ts: Date.now() };
  await query(
    "INSERT INTO documents (collection, id, company, data) VALUES ('peer_msgs', $1, $2, $3::jsonb)",
    [id, conv, JSON.stringify(data)]
  );
  res.status(201).json({ ok: true, message: data });
});

// گفتگو با یک کاربرِ خاص (پیام‌های دوطرفه، مرتب بر اساسِ زمان)
router.get('/with', authRequired, async (req, res) => {
  const other = String(req.query.sub || '');
  if (!other) return res.json({ messages: [] });
  const conv = convId(req.user.sub, other);
  const { rows } = await query(
    "SELECT data FROM documents WHERE collection='peer_msgs' AND company=$1 ORDER BY (data->>'ts')::bigint",
    [conv]
  );
  const me = String(req.user.sub);
  const messages = rows.map((r) => r.data)
    .filter((m) => String(m.from) === me || String(m.to) === me)
    .map((m) => ({ ...m, mine: String(m.from) === me }));
  res.json({ messages });
});

// فهرستِ گفتگوهای کاربر-به-کاربرِ من (برای نمایش در لیستِ گفتگوها) — آخرین پیامِ هر گفتگو.
router.get('/conversations', authRequired, async (req, res) => {
  const me = String(req.user.sub);
  let rows = [];
  try {
    rows = (await query(
      "SELECT data FROM documents WHERE collection='peer_msgs' AND (data->>'from'=$1 OR data->>'to'=$1) ORDER BY (data->>'ts')::bigint",
      [me]
    )).rows;
  } catch (_) { rows = []; }
  const byConv = {};
  for (const r of rows) { const m = r.data; const other = String(m.from) === me ? String(m.to) : String(m.from); byConv[other] = { other, lastText: m.text, ts: m.ts }; }
  const others = Object.keys(byConv);
  const names = {};
  if (others.length) {
    try { const u = await query('SELECT id, name, username FROM app_users WHERE id::text = ANY($1::text[])', [others]); for (const row of u.rows) names[String(row.id)] = row.name || row.username; } catch (_) {}
  }
  const conversations = Object.values(byConv)
    .map((c) => ({ sub: c.other, name: names[c.other] || c.other, lastText: c.lastText, ts: c.ts }))
    .sort((a, b) => b.ts - a.ts);
  res.json({ conversations });
});

export default router;
