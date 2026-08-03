import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { authRequired, roleRequired } from '../auth.js';

const router = express.Router();
const adminGuard = [authRequired, roleRequired('admin', 'superadmin')];

const PUBLIC_COLS = 'id, username, name, email, role, company, status, meta, created_at';

// لیست کاربران — صفحه‌بندی و جستجو (هرگز کل ۳M ردیف را نمی‌خوانیم)
router.get('/', ...adminGuard, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const q = (req.query.q || '').toString().trim();

  let where = '';
  const params = [];
  if (q) {
    params.push(`%${q}%`);
    where = `WHERE username ILIKE $1 OR email ILIKE $1 OR name ILIKE $1`;
  }
  params.push(limit, offset);
  const list = await query(
    `SELECT ${PUBLIC_COLS} FROM app_users ${where} ORDER BY id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  const count = await query(`SELECT count(*)::int AS total FROM app_users ${where}`, q ? [params[0]] : []);
  res.json({ items: list.rows, total: count.rows[0].total, limit, offset });
});

// جستجوی «کاربرِ شاهکاری» با شمارهٔ موبایل — برای افزودنِ پرسنل (فقط از افرادِ ثبت‌نام‌شده و تأییدشده با
// شاهکار). فقط نامِ کاربرِ تأییدشده برگردانده می‌شود (اطلاعاتِ حساس نه). برای هر کاربرِ واردشده در دسترس است.
router.get('/lookup', authRequired, async (req, res) => {
  const raw = String(req.query.phone || '').replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/\D/g, '');
  if (raw.length < 7) return res.json({ found: false });
  const last = raw.slice(-10);
  const { rows } = await query(
    `SELECT name, username, meta FROM app_users
       WHERE (right(regexp_replace(username, '\\D', '', 'g'), 10) = $1
              OR right(regexp_replace(coalesce(meta->>'phone',''), '\\D', '', 'g'), 10) = $1)
         AND meta->>'identityVerifiedAt' IS NOT NULL
       LIMIT 1`,
    [last]
  );
  if (!rows[0]) return res.json({ found: false });
  res.json({ found: true, name: rows[0].name || '', phone: last, verified: true });
});

// ساخت کاربر
router.post('/', ...adminGuard, async (req, res) => {
  const { username, password, name, email, role = 'user', company, meta } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username_password_required' });
  if (!['user', 'admin', 'superadmin'].includes(role)) return res.status(400).json({ error: 'bad_role' });
  // فقط سوپر‌ادمین می‌تواند سوپر‌ادمین/ادمین بسازد
  if (role !== 'user' && req.user.role !== 'superadmin') return res.status(403).json({ error: 'forbidden' });

  const hash = await bcrypt.hash(password, 10);
  try {
    const { rows } = await query(
      `INSERT INTO app_users (username, password_hash, name, email, role, company, meta)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb) RETURNING ${PUBLIC_COLS}`,
      [username.trim(), hash, name || null, email || null, role, company || null, JSON.stringify(meta || {})]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'duplicate' });
    throw e;
  }
});

// به‌روزرسانی کاربر
router.put('/:id', ...adminGuard, async (req, res) => {
  const { name, email, role, company, status, password, meta } = req.body || {};
  if (role && req.user.role !== 'superadmin') return res.status(403).json({ error: 'forbidden' });

  const sets = [];
  const params = [];
  const add = (col, val) => { params.push(val); sets.push(`${col} = $${params.length}`); };
  if (name !== undefined) add('name', name);
  if (email !== undefined) add('email', email);
  if (role !== undefined) add('role', role);
  if (company !== undefined) add('company', company);
  if (status !== undefined) add('status', status);
  if (password) add('password_hash', await bcrypt.hash(password, 10));
  if (meta !== undefined) {
    // دادهٔ هویتی (شاهکار/ثبت‌احوال) غیرقابلِ‌ویرایش است — بقیهٔ metaها قابلِ ویرایش‌اند.
    const safeMeta = { ...(meta || {}) };
    delete safeMeta.nationalId; delete safeMeta.identity; delete safeMeta.identityVerifiedAt;
    params.push(JSON.stringify(safeMeta)); sets.push(`meta = meta || $${params.length}::jsonb`);
  }
  if (!sets.length) return res.status(400).json({ error: 'nothing_to_update' });

  params.push(req.params.id);
  const { rows } = await query(
    `UPDATE app_users SET ${sets.join(', ')}, updated_at = now() WHERE id = $${params.length} RETURNING ${PUBLIC_COLS}`,
    params
  );
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  res.json(rows[0]);
});

// حذف — فقط سوپر‌ادمین
router.delete('/:id', authRequired, roleRequired('superadmin'), async (req, res) => {
  const { rowCount } = await query('DELETE FROM app_users WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'not_found' });
  res.json({ ok: true });
});

// لاگِ فعالیتِ واقعیِ یک کاربر — از تماس‌های واقعی (call_tasks) و گفتگوها (chats)
router.get('/:id/activity', ...adminGuard, async (req, res) => {
  const id = String(req.params.id);
  const events = [];

  // نامِ فعلیِ هر ایجنت را resolve می‌کنیم (نه نامِ کهنه‌ای که موقعِ تماس در رکورد ثبت شده):
  // اول تنظیماتِ شخصیِ همین کاربر (agent_prefs)، بعد سندِ پایهٔ ایجنت.
  async function currentAgentName(agentId) {
    if (!agentId) return null;
    try {
      const pr = await query("SELECT data FROM documents WHERE collection='agent_prefs' AND id=$1", ['pref_' + id + '_' + agentId]);
      if (pr.rows[0]?.data?.name) return pr.rows[0].data.name;
    } catch (_) {}
    try {
      const ar = await query("SELECT data FROM documents WHERE collection='agents' AND id=$1", [agentId]);
      if (ar.rows[0]?.data?.name) return ar.rows[0].data.name;
    } catch (_) {}
    return null;
  }

  // تماس‌هایی که به‌نمایندگی از این کاربر برقرار شده (requestedBySub = id)
  try {
    const cr = await query(
      "SELECT data FROM documents WHERE collection='call_tasks' AND data->>'requestedBySub'=$1 ORDER BY updated_at DESC LIMIT 200",
      [id]
    );
    const statusFa = { dialing: 'در حال شماره‌گیری', ringing: 'زنگ خورد', ended: 'پایان‌یافته', completed: 'موفق', failed: 'ناموفق', no_number: 'شماره نامعتبر' };
    const nameCache = {};
    for (const r of cr.rows) {
      const d = r.data || {};
      if (d.agentId && !(d.agentId in nameCache)) nameCache[d.agentId] = await currentAgentName(d.agentId);
      events.push({
        time: d.updatedAt || d.createdAt || null,
        action: 'تماس',
        target: d.targetName || d.targetNumber || '—',
        ip: nameCache[d.agentId] || d.agentId || '—',
        result: statusFa[d.status] || d.status || '—',
      });
    }
  } catch (_) {}

  // گفتگوهای واقعیِ این کاربر (chat_<id>_<agentId>)
  try {
    const ch = await query(
      "SELECT id, data, updated_at FROM documents WHERE collection='chats' AND id LIKE $1 ORDER BY updated_at DESC LIMIT 100",
      ['chat_' + id + '_%']
    );
    for (const r of ch.rows) {
      const d = r.data || {};
      // فرمتِ فعلیِ چت: { sessions: [{ messages: [...] }], ... } — شمارشِ واقعیِ پیام‌ها از همهٔ سشن‌ها.
      const sessions = Array.isArray(d.sessions) ? d.sessions : [];
      const msgCount = sessions.reduce((a, s) => a + (Array.isArray(s && s.messages) ? s.messages.length : 0), 0);
      const agentId = (r.id.split('_').slice(2).join('_')) || '';
      events.push({
        time: (r.updated_at ? new Date(r.updated_at).toISOString() : null),
        action: 'گفتگو',
        target: d.name || agentId || '—',
        ip: msgCount ? msgCount + ' پیام' : '—',
        result: 'فعال',
      });
    }
  } catch (_) {}

  events.sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')));
  res.json({ events: events.slice(0, 200) });
});

// ایجنت‌های خریداری‌شدهٔ یک کاربر + تاریخ انقضا و وضعیت (فعال/غیرفعال) — برای پنل سوپرادمین
router.get('/:id/agents', ...adminGuard, async (req, res) => {
  const u = await query('SELECT meta FROM app_users WHERE id = $1', [req.params.id]);
  if (!u.rows[0]) return res.status(404).json({ error: 'not_found' });
  const meta = u.rows[0].meta || {};
  const uid = String(req.params.id);
  const owned = Array.isArray(meta.ownedAgents) ? meta.ownedAgents : [];
  const grants = meta.agentGrants || {}; // { [bareAgentId]: { expiresAt, active } }
  if (!owned.length) return res.json({ agents: [] });
  // کلیدهای owned فرمت‌های مختلف دارند: baseId | company::baseId | company::baseId#N.
  // نرمال‌سازی: bare = بدونِ company::  ؛ base = بدونِ #N  ؛ num = شمارهٔ نمونه.
  const FA = '۰۱۲۳۴۵۶۷۸۹'; const faNum = (n) => String(n).replace(/[0-9]/g, (d) => FA[+d]);
  const bareOf = (k) => { const s = String(k); const ci = s.indexOf('::'); return ci >= 0 ? s.slice(ci + 2) : s; };
  const baseOf = (b) => { const hi = b.indexOf('#'); return hi >= 0 ? b.slice(0, hi) : b; };
  const numOf = (b) => { const hi = b.indexOf('#'); return hi >= 0 ? b.slice(hi + 1) : ''; };
  const baseIds = [...new Set(owned.map((k) => baseOf(bareOf(k))))];
  const ar = await query("SELECT id, data FROM documents WHERE collection='agents' AND id = ANY($1)", [baseIds]);
  const byId = {}; ar.rows.forEach((r) => { byId[r.id] = r.data || {}; });
  // نامِ شخصی‌شدهٔ همین کاربر (agent_prefs) اولویت دارد
  const prefRows = await query("SELECT id, data FROM documents WHERE collection='agent_prefs' AND id LIKE $1", ['pref_' + uid + '_%']);
  const prefBy = {}; for (const r of prefRows.rows) prefBy[String(r.id).slice(('pref_' + uid + '_').length)] = r.data || {};
  const now = Date.now();
  const seen = new Set();
  const list = [];
  for (const k of owned) {
    const bare = bareOf(k);       // secretary یا secretary#2 → کلیدِ ویرایش/حذف/گرنت
    if (seen.has(bare)) continue; // حذفِ تکراری‌ها (مثلِ finance و alpha::finance که هر دو → finance)
    seen.add(bare);
    const base = baseOf(bare);    // secretary
    const num = numOf(bare);
    const pf = prefBy[bare] || {};
    const b = byId[base] || {};
    const name = pf.name || (b.name ? (b.name + (num ? ' ' + faNum(num) : '')) : (base + (num ? ' ' + faNum(num) : '')));
    const role = pf.role || b.role || '';
    const g = grants[bare] || {};
    const expired = g.expiresAt ? (new Date(g.expiresAt).getTime() < now) : false;
    list.push({ id: bare, name, role, expiresAt: g.expiresAt || null, active: g.active !== false && !expired, expired });
  }
  res.json({ agents: list });
});

// فعال/غیرفعال‌سازی + تنظیمِ تاریخِ انقضای ایجنتِ یک کاربر — توسط سوپرادمین
router.post('/:id/agents/:agentId/set', ...adminGuard, async (req, res) => {
  const { active, expiresAt } = req.body || {};
  const u = await query('SELECT meta FROM app_users WHERE id = $1', [req.params.id]);
  if (!u.rows[0]) return res.status(404).json({ error: 'not_found' });
  const meta = u.rows[0].meta || {};
  const grants = meta.agentGrants || {};
  const g = grants[req.params.agentId] || {};
  if (active !== undefined) g.active = !!active;
  if (expiresAt !== undefined) g.expiresAt = expiresAt || null;
  grants[req.params.agentId] = g;
  await query("UPDATE app_users SET meta = meta || $2::jsonb, updated_at = now() WHERE id = $1", [req.params.id, JSON.stringify({ agentGrants: grants })]);
  res.json({ ok: true, grant: g });
});

// ویرایشِ ایجنتِ یک کاربر توسط سوپرادمین — روی agent_prefsِ همان کاربر می‌نویسد (نام/نقش/عکس/لحن/…)
// همان جایی که /ai/agents برای نمایشِ per-user می‌خواند. هویت اینجا دخالتی ندارد.
const AGENT_EDIT_FIELDS = ['name', 'role', 'tone', 'lang', 'age', 'gender', 'accent', 'voice', 'ttsVoice', 'welcomeMsg', 'avatar', 'init', 'handoff', 'instructions'];
router.put('/:id/agents/:agentId', ...adminGuard, async (req, res) => {
  const uid = String(req.params.id);
  const agentId = String(req.params.agentId);
  const patch = {};
  for (const k of AGENT_EDIT_FIELDS) if (k in (req.body || {})) patch[k] = req.body[k];
  if (!Object.keys(patch).length) return res.status(400).json({ error: 'nothing_to_update' });
  const prefId = 'pref_' + uid + '_' + agentId;
  await query(
    "INSERT INTO documents (collection, id, company, data) VALUES ('agent_prefs',$1,$2,$3::jsonb) ON CONFLICT (collection, id) DO UPDATE SET data = documents.data || $3::jsonb, updated_at = now()",
    [prefId, 'usr_' + uid, JSON.stringify(patch)]
  );
  res.json({ ok: true, prefs: patch });
});

// حذفِ کاملِ یک ایجنت از یک کاربر — از مالکیت (ownedAgents) + گرنت + شخصی‌سازیِ (agent_prefs) پاک می‌شود.
router.delete('/:id/agents/:agentId', ...adminGuard, async (req, res) => {
  const uid = String(req.params.id);
  const agentId = String(req.params.agentId);
  const u = await query('SELECT meta FROM app_users WHERE id = $1', [uid]);
  if (!u.rows[0]) return res.status(404).json({ error: 'not_found' });
  const meta = u.rows[0].meta || {};
  const owned = Array.isArray(meta.ownedAgents) ? meta.ownedAgents : [];
  // کلیدِ مالکیت می‌تواند id، company::id، یا نمونهٔ company::id#N باشد — همهٔ حالت‌ها (و همهٔ نمونه‌ها) حذف شوند.
  const bareOf = (k) => String(k).split('::').pop().split('#')[0];
  meta.ownedAgents = owned.filter((k) => k !== agentId && bareOf(k) !== agentId);
  if (meta.agentGrants && typeof meta.agentGrants === 'object') delete meta.agentGrants[agentId];
  await query('UPDATE app_users SET meta = $2::jsonb, updated_at = now() WHERE id = $1', [uid, JSON.stringify(meta)]);
  await query("DELETE FROM documents WHERE collection='agent_prefs' AND id=$1", ['pref_' + uid + '_' + agentId]);
  res.json({ ok: true, ownedAgents: meta.ownedAgents });
});

// مصرفِ توکنِ یک کاربر — برای پنل سوپرادمین
router.get('/:id/usage', ...adminGuard, async (req, res) => {
  const r = await query("SELECT data FROM documents WHERE collection='usage' AND id=$1", ['usr_' + req.params.id]);
  const d = r.rows[0]?.data || {};
  res.json({ used: Number(d.used) || 0, balance: Number(d.balance) || 0, byAgent: d.byAgent || {} });
});

export default router;
