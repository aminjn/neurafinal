// پیام‌رسانیِ کاربر-به-کاربرِ نورا: کاربر می‌تواند به مخاطبی که کاربرِ نوراست پیام بدهد.
// حریمِ خصوصی: /resolve فقط برای شماره‌هایی که خودِ کاربر در مخاطبینش دارد، عضویتِ نورا را برمی‌گرداند؛
// و هر کاربر فقط پیام‌های گفتگویی را می‌بیند که خودش یک طرفِ آن است (convId شاملِ subِ اوست).
import express from 'express';
import { query } from '../db.js';
import { authRequired } from '../auth.js';
import { sendPush } from '../push.js';

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
  // نوتیفیکیشنِ push به گیرنده (حتی اگر اپش بسته باشد).
  sendPush(to, { title: String(req.user.name || 'پیام جدید'), body: text.slice(0, 120), kind: 'message', tag: 'peer_' + req.user.sub, url: '/', data: { peer: String(req.user.sub) } }).catch(() => {});
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

// ───────────────────────── گروه (چند نفره) ─────────────────────────
// گروه در documents (collection='peer_groups') ذخیره می‌شود؛ پیام‌های گروه در همان peer_msgs با conv=groupId.
async function loadGroup(gid) {
  try { const r = await query("SELECT data FROM documents WHERE collection='peer_groups' AND id=$1", [gid]); return r.rows[0] ? r.rows[0].data : null; } catch (_) { return null; }
}
function isMember(group, sub) { return group && Array.isArray(group.members) && group.members.map(String).includes(String(sub)); }

// ساختِ گروه با چند عضو (سازنده هم عضو می‌شود).
router.post('/group/create', authRequired, async (req, res) => {
  const me = String(req.user.sub);
  const name = String(req.body?.name || '').trim().slice(0, 80) || 'گروه';
  const raw = Array.isArray(req.body?.members) ? req.body.members.map(String) : [];
  // فقط کاربرانِ واقعیِ نورا عضو شوند + خودِ سازنده.
  const uniq = Array.from(new Set([me, ...raw])).filter(Boolean);
  let members = uniq;
  try { const r = await query('SELECT id FROM app_users WHERE id::text = ANY($1::text[])', [uniq]); const valid = new Set(r.rows.map((x) => String(x.id))); members = uniq.filter((s) => valid.has(String(s))); } catch (_) {}
  if (members.length < 2) return res.status(400).json({ error: 'need_members' });
  const gid = 'g_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const data = { id: gid, name, owner: me, members, ts: Date.now() };
  await query("INSERT INTO documents (collection, id, company, data) VALUES ('peer_groups', $1, $2, $3::jsonb)", [gid, gid, JSON.stringify(data)]);
  res.status(201).json({ group: data });
});

// گروه‌هایی که کاربر عضوشان است + آخرین پیامِ هرکدام.
router.get('/groups', authRequired, async (req, res) => {
  const me = String(req.user.sub);
  let groups = [];
  try { groups = (await query("SELECT data FROM documents WHERE collection='peer_groups' AND (data->'members') @> to_jsonb($1::text) ORDER BY (data->>'ts')::bigint DESC", [me])).rows.map((r) => r.data); } catch (_) { groups = []; }
  const out = [];
  for (const g of groups) {
    let last = null;
    try { last = (await query("SELECT data FROM documents WHERE collection='peer_msgs' AND company=$1 ORDER BY (data->>'ts')::bigint DESC LIMIT 1", [g.id])).rows[0]?.data || null; } catch (_) {}
    out.push({ id: g.id, name: g.name, members: g.members, memberCount: (g.members || []).length, lastText: last ? last.text : '', ts: last ? last.ts : g.ts });
  }
  res.json({ groups: out });
});

// ارسالِ پیام به گروه.
router.post('/group/send', authRequired, async (req, res) => {
  const me = String(req.user.sub);
  const gid = String(req.body?.groupId || '');
  const text = String(req.body?.text || '').slice(0, 4000);
  if (!gid || !text.trim()) return res.status(400).json({ error: 'group_and_text_required' });
  const group = await loadGroup(gid);
  if (!group || !isMember(group, me)) return res.status(403).json({ error: 'not_member' });
  const id = gid + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const data = { id, conv: gid, from: me, fromName: String(req.user.name || ''), text, ts: Date.now(), group: true };
  await query("INSERT INTO documents (collection, id, company, data) VALUES ('peer_msgs', $1, $2, $3::jsonb)", [id, gid, JSON.stringify(data)]);
  // push به سایرِ اعضا
  for (const mSub of group.members) { if (String(mSub) !== me) sendPush(mSub, { title: group.name, body: (req.user.name ? req.user.name + ': ' : '') + text.slice(0, 100), kind: 'message', tag: 'grp_' + gid, url: '/', data: { group: gid } }).catch(() => {}); }
  res.status(201).json({ ok: true, message: data });
});

// پیام‌های گروه (فقط برای اعضا).
router.get('/group/with', authRequired, async (req, res) => {
  const me = String(req.user.sub);
  const gid = String(req.query.groupId || '');
  const group = await loadGroup(gid);
  if (!group || !isMember(group, me)) return res.status(403).json({ error: 'not_member', messages: [] });
  const { rows } = await query("SELECT data FROM documents WHERE collection='peer_msgs' AND company=$1 ORDER BY (data->>'ts')::bigint", [gid]);
  const messages = rows.map((r) => r.data).map((m) => ({ ...m, mine: String(m.from) === me }));
  res.json({ group: { id: group.id, name: group.name, members: group.members, memberCount: (group.members || []).length }, messages });
});

// ── مدیریتِ گروه (تنظیمات) ──
async function saveGroup(gid, data) { await query("UPDATE documents SET data=$2::jsonb WHERE collection='peer_groups' AND id=$1", [gid, JSON.stringify(data)]); }
async function resolveNames(subs) {
  const names = {};
  if (!subs.length) return names;
  try { const u = await query('SELECT id, name, username FROM app_users WHERE id::text = ANY($1::text[])', [subs.map(String)]); for (const r of u.rows) names[String(r.id)] = r.name || r.username; } catch (_) {}
  return names;
}

// اطلاعاتِ گروه با نامِ اعضا (برای صفحهٔ تنظیمات).
router.get('/group/info', authRequired, async (req, res) => {
  const me = String(req.user.sub);
  const group = await loadGroup(String(req.query.groupId || ''));
  if (!group || !isMember(group, me)) return res.status(403).json({ error: 'not_member' });
  const names = await resolveNames(group.members || []);
  res.json({ group: { id: group.id, name: group.name, owner: group.owner, isOwner: String(group.owner) === me,
    members: (group.members || []).map((s) => ({ sub: String(s), name: names[String(s)] || String(s), isOwner: String(group.owner) === String(s), me: String(s) === me })) } });
});

// تغییرِ نامِ گروه (فقط مالک).
router.post('/group/rename', authRequired, async (req, res) => {
  const me = String(req.user.sub);
  const group = await loadGroup(String(req.body?.groupId || ''));
  if (!group) return res.status(404).json({ error: 'not_found' });
  if (String(group.owner) !== me) return res.status(403).json({ error: 'owner_only' });
  const name = String(req.body?.name || '').trim().slice(0, 80);
  if (!name) return res.status(400).json({ error: 'name_required' });
  group.name = name; await saveGroup(group.id, group);
  res.json({ ok: true, name });
});

// افزودنِ اعضا (فقط مالک) — فقط کاربرانِ واقعیِ نورا.
router.post('/group/addMembers', authRequired, async (req, res) => {
  const me = String(req.user.sub);
  const group = await loadGroup(String(req.body?.groupId || ''));
  if (!group) return res.status(404).json({ error: 'not_found' });
  if (String(group.owner) !== me) return res.status(403).json({ error: 'owner_only' });
  const add = Array.isArray(req.body?.members) ? req.body.members.map(String) : [];
  let valid = [];
  try { const r = await query('SELECT id FROM app_users WHERE id::text = ANY($1::text[])', [add]); valid = r.rows.map((x) => String(x.id)); } catch (_) {}
  const before = new Set((group.members || []).map(String));
  for (const s of valid) before.add(s);
  group.members = Array.from(before);
  await saveGroup(group.id, group);
  for (const s of valid) sendPush(s, { title: group.name, body: 'به گروه اضافه شدید', kind: 'message', tag: 'grp_' + group.id, url: '/', data: { group: group.id } }).catch(() => {});
  res.json({ ok: true, memberCount: group.members.length });
});

// حذفِ عضو (فقط مالک؛ مالک خودش را حذف نکند).
router.post('/group/removeMember', authRequired, async (req, res) => {
  const me = String(req.user.sub);
  const group = await loadGroup(String(req.body?.groupId || ''));
  if (!group) return res.status(404).json({ error: 'not_found' });
  if (String(group.owner) !== me) return res.status(403).json({ error: 'owner_only' });
  const sub = String(req.body?.sub || '');
  if (sub === String(group.owner)) return res.status(400).json({ error: 'cannot_remove_owner' });
  group.members = (group.members || []).map(String).filter((s) => s !== sub);
  await saveGroup(group.id, group);
  res.json({ ok: true, memberCount: group.members.length });
});

// خروج از گروه (هر عضو). اگر مالک خارج شود، مالکیت به عضوِ بعدی می‌رسد؛ اگر کسی نماند، گروه حذف می‌شود.
router.post('/group/leave', authRequired, async (req, res) => {
  const me = String(req.user.sub);
  const group = await loadGroup(String(req.body?.groupId || ''));
  if (!group || !isMember(group, me)) return res.status(403).json({ error: 'not_member' });
  group.members = (group.members || []).map(String).filter((s) => s !== me);
  if (group.members.length === 0) { await query("DELETE FROM documents WHERE collection='peer_groups' AND id=$1", [group.id]); return res.json({ ok: true, deleted: true }); }
  if (String(group.owner) === me) group.owner = group.members[0]; // انتقالِ مالکیت
  await saveGroup(group.id, group);
  res.json({ ok: true });
});

export default router;
