import express from 'express';
import bcrypt from 'bcryptjs';
import { Agent } from 'undici';
import { query } from '../db.js';
import { signToken, authRequired } from '../auth.js';
import { shecanRequest } from '../shecan.js';
import { generateSecret, verifyTotp, otpauthUri, generateRecoveryCodes } from '../totp.js';
import { getIdentity, shahkarMatch, isValidNationalId, podConfigured, podMissing, to09 } from '../shahkar.js';

// اعدادِ فارسی (۰-۹ / U+06Fx) **و عربی-هندی (٠-٩ / U+066x)** را به لاتین تبدیل می‌کند.
// نکتهٔ مهم: کیبوردهای اندروید اغلب اعدادِ عربی-هندی می‌فرستند؛ اگر تبدیل نشوند، کدِ OTPِ درست هم
// «اشتباه» گرفته می‌شود و شمارهٔ موبایل خالی می‌شود (چون \D آن‌ها را حذف می‌کند).
const faDigits = (v) => String(v == null ? '' : v)
  .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
  .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

const router = express.Router();

// اتصال مستقیم (بدون پروکسی) و روی IPv4 — ippanel ایرانی است؛ undici گاهی روی IPv6 گیر می‌کند.
const directAgent = new Agent({ connect: { family: 4, timeout: 10000 } });

// --- گزارشِ رویدادهای امنیتی (ورود/تغییرِ رمز/۲FA) روی حسابِ کاربر (خواندنی، نه قابلِ جعل از کلاینت) ---
function clientIp(req) {
  const xf = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xf || req.ip || req.socket?.remoteAddress || '';
}
function deviceLabel(req) {
  const ua = String(req.headers['user-agent'] || '');
  const os = /Windows/.test(ua) ? 'Windows' : /iPhone|iPad|iOS/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android'
    : /Mac/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'نامشخص';
  const br = /Edg/.test(ua) ? 'Edge' : /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox'
    : /Safari/.test(ua) ? 'Safari' : 'مرورگر';
  return `${br} / ${os}`;
}
async function recordSecurityEvent(userId, type, req, success = true) {
  try {
    const { rows } = await query('SELECT meta FROM app_users WHERE id = $1', [userId]);
    if (!rows[0]) return;
    const meta = rows[0].meta || {};
    const log = Array.isArray(meta.securityLog) ? meta.securityLog : [];
    log.unshift({ id: Date.now() + Math.random().toString(36).slice(2, 5), type, date: new Date().toISOString(),
      ip: clientIp(req), device: deviceLabel(req), success });
    meta.securityLog = log.slice(0, 50);
    await query('UPDATE app_users SET meta = $2::jsonb WHERE id = $1', [userId, JSON.stringify(meta)]);
  } catch (_) { /* گزارش‌گیری نباید مسیرِ اصلی را بشکند */ }
}

// ورود
router.post('/login', async (req, res) => {
  const { username, password, otp } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username_password_required' });

  const { rows } = await query(
    'SELECT * FROM app_users WHERE username = $1 OR email = $1 LIMIT 1',
    [String(username).trim()]
  );
  const user = rows[0];
  if (!user || user.status !== 'active') return res.status(401).json({ error: 'invalid_credentials' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

  // احرازِ هویتِ دومرحله‌ای (در صورتِ فعال بودن): علاوه بر رمز، کدِ TOTP یا کدِ بازیابی لازم است.
  const twofa = (user.meta && user.meta.twofa) || null;
  if (twofa && twofa.enabled && twofa.secret) {
    const code = String(otp || '').trim();
    if (!code) return res.status(401).json({ error: 'twofa_required' });
    let pass2fa = verifyTotp(twofa.secret, code);
    if (!pass2fa && /^[A-Z0-9]{5}-[A-Z0-9]{5}$/i.test(code)) {
      // کدِ بازیابیِ یک‌بارمصرف
      const recovery = Array.isArray(twofa.recovery) ? twofa.recovery : [];
      for (let i = 0; i < recovery.length; i++) {
        if (await bcrypt.compare(code.toUpperCase(), recovery[i])) {
          pass2fa = true;
          recovery.splice(i, 1); // مصرف شد
          const meta = user.meta || {};
          meta.twofa = { ...twofa, recovery };
          await query('UPDATE app_users SET meta = $2::jsonb WHERE id = $1', [user.id, JSON.stringify(meta)]);
          break;
        }
      }
    }
    if (!pass2fa) { await recordSecurityEvent(user.id, 'login', req, false); return res.status(401).json({ error: 'invalid_otp' }); }
  }

  // احرازِ هویتِ اجباری (شاهکار): اگر پادِ شاهکار پیکربندی شده باشد، کاربرِ عادیِ احرازنشده — حتی
  // حساب‌های قدیمی — اجازهٔ ورود ندارد و باید در همان اولین ورود هویتش را تأیید کند. توکن صادر نمی‌شود؛
  // فرانت با دیدنِ needIdentity، جریانِ شاهکار (شماره/کدملی/تولد/OTP) را نشان می‌دهد.
  {
    const s = await getFullSettings();
    if (podConfigured(s) && user.role === 'user' && !(user.meta && user.meta.identityVerifiedAt)) {
      await recordSecurityEvent(user.id, 'login', req, false);
      return res.json({ needIdentity: true, phone: (user.meta && user.meta.phone) || null, username: user.username });
    }
  }

  await recordSecurityEvent(user.id, 'login', req, true);
  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role, company: user.company },
  });
});

// ثبت‌نامِ واقعی با نام کاربری/شماره + رمز عبور — حسابِ کاربرِ عادی می‌سازد و توکن می‌دهد.
// اگر ورودی شماره‌ی موبایل باشد، به همان قالبِ OTP نرمال می‌شود تا حسابِ تکراری ساخته نشود
// (کاربر بعداً می‌تواند با همان شماره از طریقِ رمزِ یکبارمصرف هم وارد شود).
router.post('/register', async (req, res) => {
  try {
    let username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!username || !password) return res.status(400).json({ error: 'username_password_required' });
    if (password.length < 4) return res.status(400).json({ error: 'weak_password' });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'invalid_email' });

    // اگر همه رقم بود (شماره موبایل)، نرمال کن تا با حسابِ OTP یکی شود
    const asDigits = faDigits(username).replace(/[\s\-()]/g, '');
    const isPhone = /^\+?[0-9]{10,15}$/.test(asDigits);
    if (isPhone) username = normalizePhone(username);

    const exists = await query('SELECT id FROM app_users WHERE username = $1 LIMIT 1', [username]);
    if (exists.rows[0]) return res.status(409).json({ error: 'username_taken' });
    if (email) {
      const eexists = await query('SELECT id FROM app_users WHERE email = $1 LIMIT 1', [email]);
      if (eexists.rows[0]) return res.status(409).json({ error: 'email_taken' });
    }

    const hash = await bcrypt.hash(password, 10);
    const meta = isPhone ? { phone: username } : {};
    const ins = await query(
      `INSERT INTO app_users (username, password_hash, name, email, role, status, meta)
         VALUES ($1, $2, $3, $4, 'user', 'active', $5::jsonb) RETURNING *`,
      [username, hash, name || username, email || null, JSON.stringify(meta)]
    );
    const user = ins.rows[0];
    // احرازِ هویتِ اجباری: با پیکربندیِ شاهکار، کاربرِ تازه‌ثبت‌نام هم پیش از کار باید هویتش تأیید شود.
    {
      const s = await getFullSettings();
      if (podConfigured(s)) {
        return res.json({ needIdentity: true, phone: isPhone ? username : null, username: user.username });
      }
    }
    const token = signToken(user);
    res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: 'server_error', detail: String(e?.message || e) });
  }
});

// --- ورود با گوگل (Google Identity) — واقعی، گِیت‌شده با سوپرادمین ---
// کلاینت credential (Google ID token از GSI) می‌فرستد؛ سرور آن را نزدِ گوگل راستی‌آزمایی می‌کند،
// aud را با googleClientId چک می‌کند، و کاربر را با ایمیل پیدا/می‌سازد و JWT می‌دهد.
// اگر سوپرادمین فعال/تنظیم نکرده باشد → google_disabled (نه ورودِ الکی).
router.post('/google', async (req, res) => {
  try {
    const s = await getFullSettings();
    if (!s.googleAuthEnabled || !s.googleClientId) return res.status(400).json({ error: 'google_disabled' });
    const credential = String(req.body?.credential || '');
    if (!credential) return res.status(400).json({ error: 'missing_credential' });
    const r = await fetchRetry('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential), {}, 15000, 2);
    if (!r.ok) return res.status(401).json({ error: 'invalid_google_token' });
    const info = await r.json();
    if (String(info.aud) !== String(s.googleClientId)) return res.status(401).json({ error: 'aud_mismatch' });
    if (info.email_verified !== 'true' && info.email_verified !== true) return res.status(401).json({ error: 'email_unverified' });
    const email = String(info.email || '').toLowerCase();
    if (!email) return res.status(401).json({ error: 'no_email' });
    const name = info.name || email.split('@')[0];
    // ثبت‌نام فقط با شاهکار است؛ گوگل حسابِ جدید نمی‌سازد — فقط حسابی که ایمیلش قبلاً وصل شده وارد می‌شود.
    const ur = await query('SELECT * FROM app_users WHERE email = $1 LIMIT 1', [email]);
    const user = ur.rows[0];
    if (!user) return res.status(403).json({ error: 'google_not_linked' });
    const token = signToken(user);
    res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: 'server_error', detail: String(e?.message || e) });
  }
});

// --- ورود با OTP پیامکی (ippanel) ---
function normalizePhone(p) {
  if (!p) return '';
  let s = faDigits(p).replace(/\D/g, '');
  if (s.startsWith('0')) s = '98' + s.slice(1);
  else if (s.startsWith('9') && s.length === 10) s = '98' + s;
  return s;
}
async function getFullSettings() {
  const { rows } = await query('SELECT data FROM settings WHERE id = 1');
  return rows[0]?.data || {};
}

// fetch با timeout و retry (برای پایداری ارسال پیامک)
async function fetchRetry(url, opts = {}, ms = 15000, retries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const r = await fetch(url, { ...opts, signal: ctrl.signal });
      clearTimeout(t);
      if (r.status >= 502 && r.status <= 504 && attempt < retries) {
        await new Promise((s) => setTimeout(s, 600 * (attempt + 1)));
        continue;
      }
      return r;
    } catch (e) {
      clearTimeout(t);
      lastErr = e;
      if (attempt < retries) { await new Promise((s) => setTimeout(s, 600 * (attempt + 1))); continue; }
      throw e;
    }
  }
  throw lastErr;
}

// تولید+ذخیره+ارسالِ کدِ OTP (بینِ /otp/request و /shahkar/verify مشترک است).
async function issueOtp(phone, s) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const hash = await bcrypt.hash(code, 8);
  await query(
    `INSERT INTO otp_codes (phone, code_hash, expires_at, attempts)
       VALUES ($1, $2, now() + interval '3 minutes', 0)
     ON CONFLICT (phone) DO UPDATE SET code_hash = $2, expires_at = now() + interval '3 minutes', attempts = 0, created_at = now()`,
    [phone, hash],
  );
  const baseUrl = (s.ippanelBaseUrl || 'https://api2.ippanel.com/api/v1').replace(/\/$/, '');
  const sendPath = s.ippanelSendPath || '/sms/pattern/normal/send';
  const sender = s.ippanelSender || '+983000505';
  const variable = s.ippanelVariable || 'code';
  (async () => {
    try {
      const r = await shecanRequest(`${baseUrl}${sendPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: s.ippanelApiKey, accept: 'application/json' },
        body: JSON.stringify({ code: s.ippanelPatternCode, sender, recipient: '+' + phone, variable: { [variable]: code } }),
        timeout: 15000,
      });
      let j = {}; try { j = JSON.parse(r.body); } catch { /* non-json */ }
      const good = r.status >= 200 && r.status < 300 && !(j && j.meta && j.meta.status === false) && !(j && j.status && j.status !== 'OK');
      if (!good) console.error('ippanel send failed:', r.status, String(r.body).slice(0, 200));
      else console.log('ippanel send ok:', String(r.body).slice(0, 200));
    } catch (e) {
      console.error('ippanel send error:', e?.message || e);
    }
  })();
  return { ok: true };
}

router.post('/otp/request', async (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  if (!phone || phone.length < 11) return res.status(400).json({ error: 'bad_phone' });
  const s = await getFullSettings();
  if (!s.otpEnabled) return res.status(400).json({ error: 'otp_disabled' });
  if (!s.ippanelApiKey || !s.ippanelPatternCode) return res.status(400).json({ error: 'ippanel_not_configured' });
  // اگر شاهکار روشن است و این شماره «کاربرِ تأییدشده» نیست، **قبل از ارسالِ OTP** باید احرازِ هویت شود.
  // یعنی کاربرِ اولین‌بار به‌جای اینکه اول کد بگیرد، به فرمِ شاهکار (کد ملی/تاریخ تولد) هدایت می‌شود.
  // (کاربرِ قبلاً‌تأییدشده یا کسی که pendingِ شاهکارِ موفق دارد، مستقیم OTP می‌گیرد.)
  if (podConfigured(s)) {
    const u = (await query('SELECT meta FROM app_users WHERE username = $1 LIMIT 1', [phone])).rows[0];
    const verified = u && u.meta && u.meta.identityVerifiedAt;
    const pend = (await query("SELECT 1 FROM documents WHERE collection = 'shahkar_pending' AND id = $1 LIMIT 1", [phone])).rows[0];
    if (!verified && !pend) return res.status(400).json({ error: 'shahkar_required' });
  }
  await issueOtp(phone, s);
  res.json({ ok: true });
});

// --- احرازِ هویتِ رسمی با شاهکار (قبل از OTPِ ثبت‌نام) ---
// ورودی: { phone, nationalCode, jBirthDate(شمسیِ ۸ رقمی YYYYMMDD) }
// جریان: اعتبارسنجیِ آفلاینِ کد ملی → یکتاییِ کد ملی → استعلامِ ثبت‌احوال → تطبیقِ شاهکار
// (موبایل↔کدملی) → ذخیرهٔ pending هویتی → ارسالِ OTP. تأییدِ نهایی در /otp/verify است.
// مهم: تماس‌های پاد چند ثانیه طول می‌کشند و CDNِ آروان اتصالِ طولانی را می‌بندد؛ پس مثلِ چت،
// POST فوراً jobId می‌دهد و کارِ کندِ پاد در پس‌زمینه اجرا و با /shahkar/poll خوانده می‌شود.
const _skSet = (id, val) =>
  query("INSERT INTO documents (collection,id,data) VALUES ('shahkar_jobs',$1,$2::jsonb) ON CONFLICT (collection,id) DO UPDATE SET data=$2::jsonb, updated_at=now()", [id, JSON.stringify(val)]);
const _skGet = async (id) => {
  const r = await query("SELECT data FROM documents WHERE collection='shahkar_jobs' AND id=$1", [id]);
  return r.rows[0]?.data || null;
};
const _skDel = (id) => query("DELETE FROM documents WHERE collection='shahkar_jobs' AND id=$1", [id]);
{ const gc = setInterval(() => { query("DELETE FROM documents WHERE collection='shahkar_jobs' AND updated_at < now() - interval '5 minutes'").catch(() => {}); }, 60000); if (gc.unref) gc.unref(); }

router.post('/shahkar/verify', async (req, res) => {
  try {
    const s = await getFullSettings();
    const phone98 = normalizePhone(req.body?.phone);
    const phone09 = to09(req.body?.phone);
    // ── اعتبارسنجیِ سریع (همگام) — خطاها فوراً برمی‌گردند ──
    if (!/^09\d{9}$/.test(phone09)) return res.status(400).json({ error: 'bad_phone' });
    const nid = faDigits(req.body?.nationalCode).replace(/\D/g, '');
    if (nid.length !== 10 || !isValidNationalId(nid)) return res.status(400).json({ error: 'bad_national_id' });
    const jbd = faDigits(req.body?.jBirthDate).replace(/\D/g, '');
    if (jbd.length !== 8) return res.status(400).json({ error: 'bad_birthdate' });
    const acct = (await query('SELECT id, meta FROM app_users WHERE username = $1 LIMIT 1', [phone98])).rows[0];
    if (acct && acct.meta && acct.meta.identityVerifiedAt) return res.status(400).json({ error: 'already_verified' });
    const dup = (await query("SELECT username FROM app_users WHERE meta->>'nationalId' = $1 LIMIT 1", [nid])).rows[0];
    if (dup && dup.username !== phone98) return res.status(409).json({ error: 'national_id_taken' });
    if (!podConfigured(s)) return res.status(400).json({ error: 'shahkar_not_configured', missing: podMissing(s) });

    // ── کارِ کندِ پاد را به پس‌زمینه ببر؛ فوراً jobId بده ──
    const id = 'sk_' + Date.now() + Math.random().toString(36).slice(2, 8);
    await _skSet(id, { done: false, ts: Date.now() });
    res.json({ ok: true, jobId: id });

    (async () => {
      try {
        const idn = await getIdentity(s, nid, jbd);
        if (!idn.ok || !idn.identity) return _skSet(id, { done: true, result: { ok: false, error: 'identity_failed', detail: idn.error } });
        const m = await shahkarMatch(s, nid, phone09);
        if (!m.ok) return _skSet(id, { done: true, result: { ok: false, error: 'shahkar_failed', detail: m.error } });
        if (!m.matched) return _skSet(id, { done: true, result: { ok: false, error: 'shahkar_not_matched' } });
        const identity = idn.identity;
        await query(
          `INSERT INTO documents (collection, id, data) VALUES ('shahkar_pending', $1, $2::jsonb)
           ON CONFLICT (collection, id) DO UPDATE SET data = $2::jsonb, updated_at = now()`,
          [phone98, JSON.stringify({ phone: phone98, nationalId: nid, identity, matched: true, createdAt: Date.now() })]
        );
        let otpSent = false;
        if (s.otpEnabled && s.ippanelApiKey && s.ippanelPatternCode) { try { await issueOtp(phone98, s); otpSent = true; } catch (_) {} }
        const name = `${identity.firstName || ''} ${identity.lastName || ''}`.trim();
        await _skSet(id, { done: true, result: { ok: true, name, otpSent } });
      } catch (e) {
        await _skSet(id, { done: true, result: { ok: false, error: 'server_error', detail: String(e?.message || e) } }).catch(() => {});
      }
    })();
  } catch (e) {
    res.status(500).json({ error: 'server_error', detail: String(e?.message || e) });
  }
});

// نتیجهٔ احرازِ شاهکار (poll) — سبک و سریع، پس CDN اتصال را نمی‌بندد.
router.get('/shahkar/poll', async (req, res) => {
  const id = String(req.query.id || '');
  let j; try { j = await _skGet(id); } catch (_) { j = null; }
  res.set('Cache-Control', 'no-store, private');
  if (!j) return res.json({ done: false });
  if (j.done) { _skDel(id).catch(() => {}); return res.json({ done: true, result: j.result }); }
  res.json({ done: false });
});

router.post('/otp/verify', async (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  const code = faDigits(req.body?.code).replace(/\D/g, '').trim();
  const { rows } = await query('SELECT * FROM otp_codes WHERE phone = $1', [phone]);
  const rec = rows[0];
  if (!rec || new Date(rec.expires_at) < new Date()) return res.status(400).json({ error: 'expired' });
  if (rec.attempts >= 5) return res.status(429).json({ error: 'too_many_attempts' });
  const ok = await bcrypt.compare(code, rec.code_hash);
  if (!ok) {
    await query('UPDATE otp_codes SET attempts = attempts + 1 WHERE phone = $1', [phone]);
    return res.status(401).json({ error: 'invalid_code' });
  }
  await query('DELETE FROM otp_codes WHERE phone = $1', [phone]);

  const s = await getFullSettings();
  const shahkarOn = podConfigured(s);
  const pending = (await query("SELECT data FROM documents WHERE collection = 'shahkar_pending' AND id = $1", [phone])).rows[0]?.data;
  let user = (await query('SELECT * FROM app_users WHERE username = $1', [phone])).rows[0];

  try {
    if (pending && pending.matched) {
      // هویتِ شاهکار تأیید شده → حساب را می‌سازد/به‌روزرسانی می‌کند و «مشخصاتِ هویتی» را ذخیره می‌کند
      const id = pending.identity || {};
      const fullName = (id.fullName || `${id.firstName || ''} ${id.lastName || ''}`.trim()) || phone;
      if (user) {
        const meta = { ...(user.meta || {}), phone, nationalId: pending.nationalId, identity: id, identityVerifiedAt: new Date().toISOString() };
        await query('UPDATE app_users SET name = COALESCE(NULLIF($2,\'\'), name), meta = $3::jsonb, updated_at = now() WHERE id = $1', [user.id, fullName, JSON.stringify(meta)]);
        user = (await query('SELECT * FROM app_users WHERE id = $1', [user.id])).rows[0];
      } else {
        const ph = await bcrypt.hash(Math.random().toString(36).slice(2), 8);
        const meta = { phone, nationalId: pending.nationalId, identity: id, identityVerifiedAt: new Date().toISOString() };
        user = (await query(
          `INSERT INTO app_users (username, password_hash, name, role, meta)
             VALUES ($1, $2, $3, 'user', $4::jsonb) RETURNING *`,
          [phone, ph, fullName, JSON.stringify(meta)],
        )).rows[0];
      }
      await query("DELETE FROM documents WHERE collection = 'shahkar_pending' AND id = $1", [phone]);
    } else if (user) {
      // بدونِ pending: فقط حسابِ «قبلاً با شاهکار تأییدشده» (یا وقتی شاهکار خاموش است) می‌تواند وارد شود
      if (!user.meta?.identityVerifiedAt && shahkarOn) return res.status(400).json({ error: 'shahkar_required' });
    } else if (!shahkarOn) {
      // شاهکار پیکربندی نشده → رفتارِ قبلی (ساختِ حسابِ سادهٔ مبتنی بر شماره)
      const ph = await bcrypt.hash(Math.random().toString(36).slice(2), 8);
      user = (await query(
        `INSERT INTO app_users (username, password_hash, name, role, meta)
           VALUES ($1, $2, $1, 'user', $3::jsonb) RETURNING *`,
        [phone, ph, JSON.stringify({ phone })],
      )).rows[0];
    } else {
      // شاهکار روشن، حساب/pending نیست → باید اول احراز شود
      return res.status(400).json({ error: 'shahkar_required' });
    }
  } catch (e) {
    if (e && e.code === '23505') return res.status(409).json({ error: 'national_id_taken' }); // نقضِ یکتاییِ کد ملی
    throw e;
  }

  await recordSecurityEvent(user.id, 'login', req, true);
  const token = signToken(user);
  res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
});

// کاربر فعلی
router.get('/me', authRequired, async (req, res) => {
  const { rows } = await query(
    'SELECT id, username, name, email, role, company, status, meta FROM app_users WHERE id = $1',
    [req.user.sub]
  );
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  const u = rows[0];
  const meta = u.meta || {};
  const allOwned = Array.isArray(meta.ownedAgents) ? meta.ownedAgents : [];
  // ایجنت‌هایی که سوپرادمین غیرفعال یا منقضی کرده، از فهرستِ مؤثر حذف شوند (در اپ قفل می‌شوند).
  const grants = meta.agentGrants || {};
  const now = Date.now();
  const ownedAgents = allOwned.filter((id) => {
    const g = grants[id];
    if (!g) return true;
    if (g.active === false) return false;
    if (g.expiresAt && new Date(g.expiresAt).getTime() < now) return false;
    return true;
  });
  const phone = meta.phone || u.username || '';
  const address = meta.address || '';
  const prefs = (meta.prefs && typeof meta.prefs === 'object') ? meta.prefs : {};
  const twofa = { enabled: !!(meta.twofa && meta.twofa.enabled), method: (meta.twofa && meta.twofa.method) || 'app' };
  const identityVerified = !!meta.identityVerifiedAt;
  const nationalId = meta.nationalId || '';
  delete u.meta;
  res.json({ user: { ...u, ownedAgents, phone, address, prefs, twofa, identityVerified, nationalId } });
});

// --- تغییرِ رمزِ عبورِ کاربرِ واردشده (واقعی) ---
router.post('/change-password', authRequired, async (req, res) => {
  try {
    const oldPassword = String(req.body?.oldPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if (newPassword.length < 6) return res.status(400).json({ error: 'weak_password' });
    const { rows } = await query('SELECT password_hash FROM app_users WHERE id = $1', [req.user.sub]);
    if (!rows[0]) return res.status(404).json({ error: 'not_found' });
    const ok = await bcrypt.compare(oldPassword, rows[0].password_hash);
    if (!ok) { await recordSecurityEvent(req.user.sub, 'pwd', req, false); return res.status(401).json({ error: 'wrong_password' }); }
    const hash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE app_users SET password_hash = $2, updated_at = now() WHERE id = $1', [req.user.sub, hash]);
    await recordSecurityEvent(req.user.sub, 'pwd', req, true);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'server_error', detail: String(e?.message || e) });
  }
});

// --- گزارشِ رویدادهای امنیتیِ خودِ کاربر (خواندنی) ---
router.get('/security-log', authRequired, async (req, res) => {
  const { rows } = await query('SELECT meta FROM app_users WHERE id = $1', [req.user.sub]);
  const log = Array.isArray(rows[0]?.meta?.securityLog) ? rows[0].meta.securityLog : [];
  res.json(log);
});

// --- احرازِ هویتِ دومرحله‌ای (TOTP) ---
// ۱) شروعِ ثبت‌نام: رازِ جدید تولید و به‌صورتِ pending ذخیره می‌شود (هنوز فعال نیست).
router.post('/2fa/setup', authRequired, async (req, res) => {
  try {
    const { rows } = await query('SELECT username, meta FROM app_users WHERE id = $1', [req.user.sub]);
    if (!rows[0]) return res.status(404).json({ error: 'not_found' });
    const meta = rows[0].meta || {};
    const secret = generateSecret();
    meta.twofa = { ...(meta.twofa || {}), pendingSecret: secret, enabled: !!(meta.twofa && meta.twofa.enabled) };
    await query('UPDATE app_users SET meta = $2::jsonb WHERE id = $1', [req.user.sub, JSON.stringify(meta)]);
    res.json({ secret, otpauth: otpauthUri(secret, rows[0].username || 'user') });
  } catch (e) {
    res.status(500).json({ error: 'server_error', detail: String(e?.message || e) });
  }
});

// ۲) فعال‌سازی: کاربر کدِ اپِ Authenticator را می‌فرستد؛ اگر درست بود، ۲FA فعال و کدهای بازیابی صادر می‌شود.
router.post('/2fa/enable', authRequired, async (req, res) => {
  try {
    const method = ['app', 'sms', 'email'].includes(req.body?.method) ? req.body.method : 'app';
    const code = String(req.body?.code || '').trim();
    const { rows } = await query('SELECT meta FROM app_users WHERE id = $1', [req.user.sub]);
    if (!rows[0]) return res.status(404).json({ error: 'not_found' });
    const meta = rows[0].meta || {};
    const pending = meta.twofa && meta.twofa.pendingSecret;
    if (!pending) return res.status(400).json({ error: 'no_setup' });
    if (!verifyTotp(pending, code)) return res.status(401).json({ error: 'invalid_otp' });
    const recovery = generateRecoveryCodes();
    const recoveryHashes = await Promise.all(recovery.map((c) => bcrypt.hash(c, 8)));
    meta.twofa = { enabled: true, method, secret: pending, recovery: recoveryHashes };
    await query('UPDATE app_users SET meta = $2::jsonb WHERE id = $1', [req.user.sub, JSON.stringify(meta)]);
    await recordSecurityEvent(req.user.sub, '2fa', req, true);
    res.json({ ok: true, enabled: true, method, recoveryCodes: recovery });
  } catch (e) {
    res.status(500).json({ error: 'server_error', detail: String(e?.message || e) });
  }
});

// ۳) غیرفعال‌سازی: نیازمندِ رمزِ عبورِ فعلی (تا کسی با نشستِ باز نتواند بی‌اجازه خاموش کند).
router.post('/2fa/disable', authRequired, async (req, res) => {
  try {
    const password = String(req.body?.password || '');
    const { rows } = await query('SELECT password_hash, meta FROM app_users WHERE id = $1', [req.user.sub]);
    if (!rows[0]) return res.status(404).json({ error: 'not_found' });
    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: 'wrong_password' });
    const meta = rows[0].meta || {};
    meta.twofa = { enabled: false, method: (meta.twofa && meta.twofa.method) || 'app' };
    await query('UPDATE app_users SET meta = $2::jsonb WHERE id = $1', [req.user.sub, JSON.stringify(meta)]);
    await recordSecurityEvent(req.user.sub, '2fa', req, true);
    res.json({ ok: true, enabled: false });
  } catch (e) {
    res.status(500).json({ error: 'server_error', detail: String(e?.message || e) });
  }
});

// به‌روزرسانیِ پروفایلِ خودِ کاربرِ واردشده (نام/ایمیل/تلفن/آدرس + ترجیحاتِ اپ)
router.put('/me', authRequired, async (req, res) => {
  try {
    const { name, email, phone, address, prefs } = req.body || {};
    const { rows } = await query('SELECT meta FROM app_users WHERE id = $1', [req.user.sub]);
    if (!rows[0]) return res.status(404).json({ error: 'not_found' });
    const meta = rows[0].meta || {};
    if (phone != null) meta.phone = String(phone).slice(0, 40);
    if (address != null) meta.address = String(address).slice(0, 500);
    if (prefs && typeof prefs === 'object') meta.prefs = { ...(meta.prefs || {}), ...prefs };
    const sets = ['meta = $2::jsonb'];
    const params = [req.user.sub, JSON.stringify(meta)];
    if (name != null) { params.push(String(name).slice(0, 120)); sets.push(`name = $${params.length}`); }
    if (email != null) { params.push(String(email).slice(0, 160)); sets.push(`email = $${params.length}`); }
    await query(`UPDATE app_users SET ${sets.join(', ')}, updated_at = now() WHERE id = $1`, params);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'server_error', detail: String(e?.message || e) });
  }
});

// خرید/فعال‌سازی یک ایجنت برای کاربرِ واردشده (در حسابش ذخیره می‌شود)
router.post('/owned-agents/:id', authRequired, async (req, res) => {
  const agentId = String(req.params.id);
  const { rows } = await query('SELECT meta FROM app_users WHERE id = $1', [req.user.sub]);
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  const meta = rows[0].meta || {};
  const owned = Array.isArray(meta.ownedAgents) ? meta.ownedAgents : [];
  if (!owned.includes(agentId)) owned.push(agentId);
  meta.ownedAgents = owned;
  await query('UPDATE app_users SET meta = $2::jsonb WHERE id = $1', [req.user.sub, JSON.stringify(meta)]);
  res.json({ ok: true, ownedAgents: owned });
});

// حذفِ ایجنت از مالکیتِ کاربرِ خودش — تا واقعاً از لیست برود و با رفرش/همگام‌سازی برنگردد.
// همهٔ کلیدها (id، company::id، نمونهٔ company::id#N) و گرنتِ مربوطه حذف می‌شوند.
router.delete('/owned-agents/:id', authRequired, async (req, res) => {
  const agentId = String(req.params.id);
  const bareOf = (k) => String(k).split('::').pop().split('#')[0];
  const { rows } = await query('SELECT meta FROM app_users WHERE id = $1', [req.user.sub]);
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  const meta = rows[0].meta || {};
  const owned = Array.isArray(meta.ownedAgents) ? meta.ownedAgents : [];
  meta.ownedAgents = owned.filter((k) => k !== agentId && bareOf(k) !== agentId);
  if (meta.agentGrants && typeof meta.agentGrants === 'object') delete meta.agentGrants[agentId];
  await query('UPDATE app_users SET meta = $2::jsonb, updated_at = now() WHERE id = $1', [req.user.sub, JSON.stringify(meta)]);
  await query("DELETE FROM documents WHERE collection='agent_prefs' AND id=$1", ['pref_' + req.user.sub + '_' + agentId]);
  res.json({ ok: true, ownedAgents: meta.ownedAgents });
});

export default router;
