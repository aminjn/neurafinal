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
function isOwner(group, sub) { return group && String(group.owner) === String(sub); }
function isAdmin(group, sub) { return isOwner(group, sub) || (group && Array.isArray(group.admins) && group.admins.map(String).includes(String(sub))); }

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
  // مدلِ کاملِ گروه (همتراز با لیدرها): مدیران، توضیح، عکس/رنگ، لینکِ دعوت، سیاستِ ارسال، بی‌صداها، سنجاق.
  const data = { id: gid, name, owner: me, admins: [], members, desc: String(req.body?.desc || '').slice(0, 300),
    avatar: (req.body?.avatar && typeof req.body.avatar === 'object') ? { color: String(req.body.avatar.color || '#7B62FC').slice(0, 9), emoji: String(req.body.avatar.emoji || '').slice(0, 4) } : { color: '#7B62FC', emoji: '' },
    invite: 'inv_' + Math.random().toString(36).slice(2, 10), sendPolicy: 'all', mutes: [], pinned: null, ts: Date.now() };
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
  // سیاستِ ارسال: اگر «فقط ادمین‌ها» باشد، عضوِ عادی نمی‌تواند پیام بدهد (مثلِ کانال/گروهِ محدودِ تلگرام).
  if (group.sendPolicy === 'admins' && !isAdmin(group, me)) return res.status(403).json({ error: 'admins_only' });
  const id = gid + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const data = { id, conv: gid, from: me, fromName: String(req.user.name || ''), text, ts: Date.now(), group: true };
  await query("INSERT INTO documents (collection, id, company, data) VALUES ('peer_msgs', $1, $2, $3::jsonb)", [id, gid, JSON.stringify(data)]);
  // push به سایرِ اعضا — به‌جز کسانی که گروه را بی‌صدا کرده‌اند.
  const muted = new Set((group.mutes || []).map(String));
  for (const mSub of group.members) { if (String(mSub) !== me && !muted.has(String(mSub))) sendPush(mSub, { title: group.name, body: (req.user.name ? req.user.name + ': ' : '') + text.slice(0, 100), kind: 'message', tag: 'grp_' + gid, url: '/', data: { group: gid } }).catch(() => {}); }
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
  const admins = (group.admins || []).map(String);
  res.json({ group: {
    id: group.id, name: group.name, owner: group.owner, desc: group.desc || '', avatar: group.avatar || { color: '#7B62FC', emoji: '' },
    invite: group.invite || '', sendPolicy: group.sendPolicy || 'all', pinned: group.pinned || null,
    isOwner: isOwner(group, me), isAdmin: isAdmin(group, me), muted: (group.mutes || []).map(String).includes(me),
    members: (group.members || []).map((s) => ({ sub: String(s), name: names[String(s)] || String(s), isOwner: isOwner(group, s), isAdmin: admins.includes(String(s)), me: String(s) === me })),
  } });
});

// به‌روزرسانیِ نام/توضیح/عکسِ گروه (مالک یا ادمین). rename برای سازگاری هم می‌ماند.
async function updateGroupInfo(req, res) {
  const me = String(req.user.sub);
  const group = await loadGroup(String(req.body?.groupId || ''));
  if (!group) return res.status(404).json({ error: 'not_found' });
  if (!isAdmin(group, me)) return res.status(403).json({ error: 'admin_only' });
  if (req.body?.name != null) { const n = String(req.body.name).trim().slice(0, 80); if (n) group.name = n; }
  if (req.body?.desc != null) group.desc = String(req.body.desc).slice(0, 300);
  if (req.body?.avatar && typeof req.body.avatar === 'object') group.avatar = { color: String(req.body.avatar.color || group.avatar?.color || '#7B62FC').slice(0, 9), emoji: String(req.body.avatar.emoji || '').slice(0, 4) };
  await saveGroup(group.id, group);
  res.json({ ok: true, name: group.name, desc: group.desc, avatar: group.avatar });
}
router.post('/group/rename', authRequired, updateGroupInfo);
router.post('/group/update', authRequired, updateGroupInfo);

// افزودنِ اعضا (مالک یا ادمین) — فقط کاربرانِ واقعیِ نورا.
router.post('/group/addMembers', authRequired, async (req, res) => {
  const me = String(req.user.sub);
  const group = await loadGroup(String(req.body?.groupId || ''));
  if (!group) return res.status(404).json({ error: 'not_found' });
  if (!isAdmin(group, me)) return res.status(403).json({ error: 'admin_only' });
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

// حذفِ عضو (مالک یا ادمین). مالک حذف نمی‌شود؛ ادمینِ دیگر را فقط مالک می‌تواند حذف کند.
router.post('/group/removeMember', authRequired, async (req, res) => {
  const me = String(req.user.sub);
  const group = await loadGroup(String(req.body?.groupId || ''));
  if (!group) return res.status(404).json({ error: 'not_found' });
  if (!isAdmin(group, me)) return res.status(403).json({ error: 'admin_only' });
  const sub = String(req.body?.sub || '');
  if (isOwner(group, sub)) return res.status(400).json({ error: 'cannot_remove_owner' });
  if (isAdmin(group, sub) && !isOwner(group, me)) return res.status(403).json({ error: 'only_owner_removes_admin' });
  group.members = (group.members || []).map(String).filter((s) => s !== sub);
  group.admins = (group.admins || []).map(String).filter((s) => s !== sub);
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

// ارتقا به ادمین (فقط مالک).
router.post('/group/promote', authRequired, async (req, res) => {
  const me = String(req.user.sub); const group = await loadGroup(String(req.body?.groupId || ''));
  if (!group) return res.status(404).json({ error: 'not_found' });
  if (!isOwner(group, me)) return res.status(403).json({ error: 'owner_only' });
  const sub = String(req.body?.sub || '');
  if (!isMember(group, sub)) return res.status(400).json({ error: 'not_member' });
  const admins = new Set((group.admins || []).map(String)); admins.add(sub); group.admins = Array.from(admins);
  await saveGroup(group.id, group); res.json({ ok: true });
});
// حذفِ ادمین (فقط مالک).
router.post('/group/demote', authRequired, async (req, res) => {
  const me = String(req.user.sub); const group = await loadGroup(String(req.body?.groupId || ''));
  if (!group) return res.status(404).json({ error: 'not_found' });
  if (!isOwner(group, me)) return res.status(403).json({ error: 'owner_only' });
  const sub = String(req.body?.sub || '');
  group.admins = (group.admins || []).map(String).filter((s) => s !== sub);
  await saveGroup(group.id, group); res.json({ ok: true });
});
// سیاستِ ارسال: all | admins (مالک/ادمین).
router.post('/group/sendPolicy', authRequired, async (req, res) => {
  const me = String(req.user.sub); const group = await loadGroup(String(req.body?.groupId || ''));
  if (!group) return res.status(404).json({ error: 'not_found' });
  if (!isAdmin(group, me)) return res.status(403).json({ error: 'admin_only' });
  group.sendPolicy = req.body?.policy === 'admins' ? 'admins' : 'all';
  await saveGroup(group.id, group); res.json({ ok: true, sendPolicy: group.sendPolicy });
});
// بی‌صداکردن/فعال‌کردنِ اعلانِ گروه (هر عضو برای خودش).
router.post('/group/mute', authRequired, async (req, res) => {
  const me = String(req.user.sub); const group = await loadGroup(String(req.body?.groupId || ''));
  if (!group || !isMember(group, me)) return res.status(403).json({ error: 'not_member' });
  const mutes = new Set((group.mutes || []).map(String));
  if (req.body?.muted) mutes.add(me); else mutes.delete(me);
  group.mutes = Array.from(mutes); await saveGroup(group.id, group);
  res.json({ ok: true, muted: mutes.has(me) });
});
// سنجاق‌کردنِ یک پیام (مالک/ادمین). null = برداشتنِ سنجاق.
router.post('/group/pin', authRequired, async (req, res) => {
  const me = String(req.user.sub); const group = await loadGroup(String(req.body?.groupId || ''));
  if (!group) return res.status(404).json({ error: 'not_found' });
  if (!isAdmin(group, me)) return res.status(403).json({ error: 'admin_only' });
  const text = req.body?.text != null ? String(req.body.text).slice(0, 300) : null;
  group.pinned = text ? { text, by: me, ts: Date.now() } : null;
  await saveGroup(group.id, group); res.json({ ok: true, pinned: group.pinned });
});
// لینکِ دعوت (مالک/ادمین) — بازتولید.
router.post('/group/invite', authRequired, async (req, res) => {
  const me = String(req.user.sub); const group = await loadGroup(String(req.body?.groupId || ''));
  if (!group) return res.status(404).json({ error: 'not_found' });
  if (!isAdmin(group, me)) return res.status(403).json({ error: 'admin_only' });
  if (!group.invite || req.body?.regen) { group.invite = 'inv_' + Math.random().toString(36).slice(2, 10); await saveGroup(group.id, group); }
  res.json({ ok: true, invite: group.invite });
});
// پیوستن به گروه با کدِ دعوت.
router.post('/group/join', authRequired, async (req, res) => {
  const me = String(req.user.sub);
  const code = String(req.body?.invite || '').trim();
  if (!code) return res.status(400).json({ error: 'code_required' });
  let g = null;
  try { g = (await query("SELECT data FROM documents WHERE collection='peer_groups' AND data->>'invite'=$1 LIMIT 1", [code])).rows[0]?.data || null; } catch (_) {}
  if (!g) return res.status(404).json({ error: 'invalid_invite' });
  if (!isMember(g, me)) { const m = new Set((g.members || []).map(String)); m.add(me); g.members = Array.from(m); await saveGroup(g.id, g); }
  res.json({ ok: true, group: { id: g.id, name: g.name } });
});
// حذفِ گروه (فقط مالک).
router.post('/group/delete', authRequired, async (req, res) => {
  const me = String(req.user.sub); const group = await loadGroup(String(req.body?.groupId || ''));
  if (!group) return res.status(404).json({ error: 'not_found' });
  if (!isOwner(group, me)) return res.status(403).json({ error: 'owner_only' });
  await query("DELETE FROM documents WHERE collection='peer_groups' AND id=$1", [group.id]);
  res.json({ ok: true, deleted: true });
});

export default router;
