// کیفِ‌پول و خریدها — «سمتِ سرور و اتمیک» (موجودی/مالکیت قابلِ جعل از کلاینت نیست).
// وضعیت در app_users.meta ذخیره می‌شود؛ هر عملیاتِ مالی داخلِ تراکنش با قفلِ ردیف (FOR UPDATE) است.
import express from 'express';
import { query, pool } from '../db.js';
import { authRequired, roleRequired } from '../auth.js';

const router = express.Router();
const ENV_INITIAL = Number(process.env.WALLET_INITIAL_BALANCE || 0);
// موجودیِ اولیه از تنظیماتِ سوپرادمین (walletInitialBalance) خوانده می‌شود؛ اگر ست نشده باشد → env → ۰.
// با کشِ کوتاه تا هر عملیاتِ کیف‌پول یک کوئریِ اضافه نزند.
let _initCache = { v: null, t: 0 };
export async function walletInitial() {
  const now = Date.now();
  if (_initCache.v !== null && now - _initCache.t < 30000) return _initCache.v;
  let v = ENV_INITIAL;
  try {
    const { rows } = await query("SELECT data->>'walletInitialBalance' AS b FROM settings WHERE id = 1");
    const b = rows[0]?.b;
    if (b != null && b !== '') { const n = Number(b); if (!isNaN(n)) v = n; }
  } catch (_) {}
  _initCache = { v, t: now };
  return v;
}

function ensureWallet(meta, initial = ENV_INITIAL) {
  if (!meta.wallet || typeof meta.wallet !== 'object') meta.wallet = { balance: initial, tx: [] };
  if (typeof meta.wallet.balance !== 'number') meta.wallet.balance = initial;
  if (!Array.isArray(meta.wallet.tx)) meta.wallet.tx = [];
  return meta.wallet;
}
const snapshot = (meta) => ({
  balance: meta.wallet.balance,
  tx: meta.wallet.tx,
  cashback: typeof meta.wallet.cashback === 'number' ? meta.wallet.cashback : 0,
  subscription: (meta.subscription && typeof meta.subscription === 'object') ? meta.subscription : null,
  ownedAgents: Array.isArray(meta.ownedAgents) ? meta.ownedAgents : [],
  ownedAvatars: Array.isArray(meta.ownedAvatars) ? meta.ownedAvatars : [],
  ownedThemes: Array.isArray(meta.ownedThemes) ? meta.ownedThemes : [],
});
function nowFa() {
  try { return new Intl.DateTimeFormat('fa-IR-u-nu-latn', { dateStyle: 'short', timeStyle: 'short' }).format(new Date()); }
  catch { return new Date().toISOString(); }
}
const txId = () => 'wt' + Date.now() + Math.random().toString(36).slice(2, 6);
const OWN_FIELD = { avatar: 'ownedAvatars', theme: 'ownedThemes', agent: 'ownedAgents' };

// لیستِ کیف‌پولِ همهٔ کاربران — برای پنلِ سوپرادمین (صفحهٔ «کیف پول‌ها»).
// موجودی/تراکنش‌ها در app_users.meta.wallet است (نه در کالکشنِ wallets)؛ این‌جا برای هر کاربر
// موجودی + مجموعِ شارژ (تراکنش‌های مثبت) + مجموعِ مصرف (منفی) + آخرین تراکنش محاسبه می‌شود.
router.get('/all', authRequired, roleRequired('admin', 'superadmin'), async (req, res) => {
  const { rows } = await query(
    "SELECT id, username, name, email, status, meta FROM app_users WHERE role <> 'superadmin' ORDER BY updated_at DESC NULLS LAST"
  );
  const out = rows.map((u) => {
    const w = (u.meta && u.meta.wallet) || {};
    const tx = Array.isArray(w.tx) ? w.tx : [];
    let charged = 0, spent = 0;
    for (const t of tx) {
      const amt = Number(t && t.amount) || 0;
      if (amt > 0) charged += amt; else spent += -amt;
    }
    const last = tx[0]; // tx با unshift ذخیره می‌شود (جدیدترین اول)
    return {
      id: u.id,
      user: u.name || u.username,
      email: u.email || u.username,
      balance: Number(w.balance) || 0,
      totalCharged: charged,
      totalSpent: spent,
      status: u.status === 'active' ? 'فعال' : (u.status === 'suspended' ? 'تعلیق' : (u.status || '—')),
      lastUpdate: last ? (last.date || '') : '',
    };
  });
  res.json(out);
});

// جزئیاتِ کیف‌پولِ یک کاربر (موجودی + تراکنش‌های واقعی) — برای صفحهٔ جزئیاتِ سوپرادمین.
router.get('/user/:id', authRequired, roleRequired('admin', 'superadmin'), async (req, res) => {
  const { rows } = await query('SELECT id, name, username, email, meta FROM app_users WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  const u = rows[0];
  const w = (u.meta && u.meta.wallet) || {};
  res.json({
    id: u.id,
    user: u.name || u.username,
    email: u.email || u.username,
    balance: Number(w.balance) || 0,
    tx: Array.isArray(w.tx) ? w.tx : [],
  });
});

// افزایش/کاهشِ دستیِ موجودی توسط سوپرادمین (اتمیک، با ثبتِ تراکنش). amount مثبت=افزایش، منفی=کاهش.
router.post('/admin-adjust', authRequired, roleRequired('admin', 'superadmin'), async (req, res) => {
  const userId = req.body?.userId;
  const amount = Math.trunc(Number(req.body?.amount || 0));
  const note = String(req.body?.note || '').slice(0, 120);
  if (userId == null || userId === '') return res.status(400).json({ error: 'bad_user' });
  if (!amount) return res.status(400).json({ error: 'bad_amount' });
  await mutate(userId, (meta) => {
    if (amount < 0 && meta.wallet.balance + amount < 0) return { error: 'insufficient_funds', status: 402 };
    meta.wallet.balance += amount;
    meta.wallet.tx.unshift({
      id: txId(),
      type: amount > 0 ? 'admin_credit' : 'admin_debit',
      title: note || (amount > 0 ? 'افزایش موجودی توسط مدیر' : 'کاهش موجودی توسط مدیر'),
      date: nowFa(),
      amount,
    });
  }, res);
});

router.get('/', authRequired, async (req, res) => {
  const { rows } = await query('SELECT meta FROM app_users WHERE id = $1', [req.user.sub]);
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  const meta = rows[0].meta || {};
  const had = !!meta.wallet;
  ensureWallet(meta, await walletInitial());
  if (!had) await query('UPDATE app_users SET meta = $2::jsonb WHERE id = $1', [req.user.sub, JSON.stringify(meta)]);
  res.json(snapshot(meta));
});

// اجرای اتمیکِ یک تغییرِ کیفِ‌پول با قفلِ ردیف
async function mutate(sub, fn, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT meta FROM app_users WHERE id = $1 FOR UPDATE', [sub]);
    if (!rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'not_found' }); }
    const meta = rows[0].meta || {};
    ensureWallet(meta, await walletInitial());
    const out = fn(meta); // ممکن است {error, status} برگرداند
    if (out && out.error) { await client.query('ROLLBACK'); return res.status(out.status || 400).json({ error: out.error, balance: meta.wallet.balance }); }
    meta.wallet.tx = meta.wallet.tx.slice(0, 300);
    await client.query('UPDATE app_users SET meta = $2::jsonb WHERE id = $1', [sub, JSON.stringify(meta)]);
    await client.query('COMMIT');
    res.json(snapshot(meta));
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    res.status(500).json({ error: 'server_error', detail: String(e?.message || e) });
  } finally {
    client.release();
  }
}

router.post('/deposit', authRequired, async (req, res) => {
  const amount = Math.floor(Number(req.body?.amount || 0));
  if (!(amount > 0)) return res.status(400).json({ error: 'bad_amount' });
  await mutate(req.user.sub, (meta) => {
    meta.wallet.balance += amount;
    meta.wallet.tx.unshift({ id: txId(), type: 'deposit', title: 'واریز به کیف پول', date: nowFa(), amount });
  }, res);
});

router.post('/withdraw', authRequired, async (req, res) => {
  const amount = Math.floor(Number(req.body?.amount || 0));
  if (!(amount > 0)) return res.status(400).json({ error: 'bad_amount' });
  await mutate(req.user.sub, (meta) => {
    if (meta.wallet.balance < amount) return { error: 'insufficient_funds', status: 402 };
    meta.wallet.balance -= amount;
    meta.wallet.tx.unshift({ id: txId(), type: 'withdraw', title: 'برداشت از کیف پول', date: nowFa(), amount: -amount });
  }, res);
});

// خرید (عامل/آواتار/تم) — بررسیِ موجودی + کسر + افزودن به مالکیت، همه اتمیک
router.post('/purchase', authRequired, async (req, res) => {
  const kind = String(req.body?.kind || '');
  const id = req.body?.id != null ? String(req.body.id) : '';
  const price = Math.floor(Number(req.body?.price || 0));
  const title = String(req.body?.title || 'خرید');
  const field = OWN_FIELD[kind];
  if (!field) return res.status(400).json({ error: 'bad_kind' });
  if (!id) return res.status(400).json({ error: 'id_required' });
  await mutate(req.user.sub, (meta) => {
    const owned = Array.isArray(meta[field]) ? meta[field] : [];
    if (owned.includes(id)) return; // قبلاً خریده — بدونِ کسرِ دوباره
    if (price > 0 && meta.wallet.balance < price) return { error: 'insufficient_funds', status: 402 };
    if (price > 0) {
      meta.wallet.balance -= price;
      meta.wallet.tx.unshift({ id: txId(), type: 'purchase', title, date: nowFa(), amount: -price });
    }
    meta[field] = [...owned, id];
  }, res);
});

// اشتراک/پلن — خریدِ واقعی: کسرِ اتمیکِ کیف‌پول + ثبتِ اشتراک با تاریخِ انقضا.
router.post('/subscribe', authRequired, async (req, res) => {
  const plan = String(req.body?.plan || '').slice(0, 60);
  const planId = String(req.body?.planId || plan).slice(0, 40);
  const price = Math.floor(Number(req.body?.price || 0));
  const months = Math.max(1, Math.min(24, Math.floor(Number(req.body?.months || 1))));
  if (!plan) return res.status(400).json({ error: 'plan_required' });
  await mutate(req.user.sub, (meta) => {
    if (price > 0 && meta.wallet.balance < price) return { error: 'insufficient_funds', status: 402 };
    const now = Date.now();
    const expiresAt = new Date(now + months * 30 * 24 * 3600 * 1000).toISOString();
    if (price > 0) {
      meta.wallet.balance -= price;
      meta.wallet.tx.unshift({ id: txId(), type: 'purchase', title: 'اشتراک ' + plan, date: nowFa(), amount: -price });
    }
    meta.subscription = { plan, planId, price, months, startedAt: new Date(now).toISOString(), expiresAt, autoRenew: true };
  }, res);
});

// لغوِ تمدیدِ خودکارِ اشتراک
router.post('/subscribe/cancel', authRequired, async (req, res) => {
  await mutate(req.user.sub, (meta) => {
    if (meta.subscription && typeof meta.subscription === 'object') meta.subscription.autoRenew = false;
  }, res);
});

export default router;
