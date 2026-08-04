// ماژولِ خریدِ متمرکز — «یک‌جا برای همهٔ خریدها». هر خرید (اشتراک، نمونهٔ ایجنت، آواتار، …) از این عبور کند
// تا وقتی «درگاهِ پرداخت» اضافه شد، فقط همین‌جا عوض شود، نه همه‌جای برنامه.
//   purchase(sub, { amount, method, txType, txLabel, apply })
//   - method='wallet' (فعلاً): اتمیک از کیف‌پول کم می‌کند (با قفلِ ردیف) و تراکنش ثبت می‌کند.
//   - method='gateway' (بعداً): همین‌جا payment-intent ساخته می‌شود؛ الان 501 برمی‌گرداند.
//   - apply(meta): سایدافکتِ خرید را روی meta اعمال می‌کند (مثلاً افزودنِ owned key) — داخلِ همان تراکنش.
import { pool } from './db.js';
import { walletInitial } from './routes/wallet.js';

function ensureWallet(meta, initial) {
  if (!meta.wallet || typeof meta.wallet !== 'object') meta.wallet = { balance: initial, tx: [] };
  if (typeof meta.wallet.balance !== 'number') meta.wallet.balance = initial;
  if (!Array.isArray(meta.wallet.tx)) meta.wallet.tx = [];
  return meta.wallet;
}

export async function purchase(sub, { amount = 0, method = 'wallet', txType = 'purchase', txLabel = '', apply } = {}) {
  if (method !== 'wallet') return { error: 'gateway_not_available', status: 501 }; // درگاه بعداً اینجا اضافه می‌شود
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT meta FROM app_users WHERE id = $1 FOR UPDATE', [sub]);
    if (!rows[0]) { await client.query('ROLLBACK'); return { error: 'not_found', status: 404 }; }
    const meta = rows[0].meta || {};
    ensureWallet(meta, await walletInitial());
    const price = Math.max(0, Number(amount) || 0);
    if (price > 0) {
      if (meta.wallet.balance < price) { await client.query('ROLLBACK'); return { error: 'insufficient_funds', status: 402, balance: meta.wallet.balance }; }
      meta.wallet.balance -= price;
      meta.wallet.tx.unshift({ id: 'tx_' + Date.now().toString(36), type: txType, amount: -price, label: txLabel, date: new Date().toISOString() });
      meta.wallet.tx = meta.wallet.tx.slice(0, 300);
    }
    let extra = {};
    if (typeof apply === 'function') { extra = (await apply(meta)) || {}; }
    await client.query('UPDATE app_users SET meta = $2::jsonb WHERE id = $1', [sub, JSON.stringify(meta)]);
    await client.query('COMMIT');
    return { ok: true, balance: meta.wallet.balance, ownedAgents: Array.isArray(meta.ownedAgents) ? meta.ownedAgents : [], ...extra };
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    return { error: 'server_error', status: 500, detail: String(e?.message || e) };
  } finally { client.release(); }
}
