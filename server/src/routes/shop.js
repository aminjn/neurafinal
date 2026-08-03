// فروشگاه (غذا/مارکت) واقعی: کاتالوگ‌ها (رستوران/منو/محصول/فروشگاه/پیشنهاد) توسط سرور نگهداری
// می‌شوند و برای هر کاربرِ واردشده خواندنی‌اند (ویترین). ثبتِ سفارش «اتمیک» است: کیف‌پول کسر و
// سفارش در انبارِ شخصیِ کاربر (u_orders) ثبت می‌شود.
import express from 'express';
import { query, pool } from '../db.js';
import { authRequired, roleRequired } from '../auth.js';
import { walletInitial } from './wallet.js'; // موجودیِ اولیه از تنظیماتِ سوپرادمین
import { computeDineInsights, computeDineCustomers, computeDineForecast, computeDinePricing, computeDineCompetitors, computeDineReviews } from '../dine-insights.js'; // مغزِ داین — تحلیلِ واقعیِ رستوران

const router = express.Router();
const CATALOGS = new Set(['restaurants', 'menu', 'products', 'shops', 'offers', 'reviews']);

// کاتالوگِ ویترین (خواندنی برای همه کاربرانِ واردشده)
router.get('/catalog/:name', authRequired, async (req, res) => {
  if (!CATALOGS.has(req.params.name)) return res.status(404).json({ error: 'unknown_catalog' });
  const { rows } = await query("SELECT data FROM documents WHERE collection = $1 ORDER BY created_at", ['sf_' + req.params.name]);
  res.json(rows.map((r) => r.data));
});

// مدیریتِ کاتالوگ (فقط admin/superadmin) — افزودن/به‌روزرسانیِ آیتم
router.post('/catalog/:name', authRequired, roleRequired('admin', 'superadmin'), async (req, res) => {
  if (!CATALOGS.has(req.params.name)) return res.status(404).json({ error: 'unknown_catalog' });
  const body = req.body || {};
  const id = String(body.id || `${req.params.name}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  const data = { ...body, id };
  await query(
    `INSERT INTO documents (collection, id, data) VALUES ($1, $2, $3::jsonb)
     ON CONFLICT (collection, id) DO UPDATE SET data = $3::jsonb, updated_at = now()`,
    ['sf_' + req.params.name, id, JSON.stringify(data)]
  );
  res.status(201).json(data);
});

// نامِ فروشگاهِ یک کاربر: اولویت با نامِ «شرکتِ» تعریف‌شدهٔ خودِ کاربر است (نه نامِ شخص)، طبقِ قانون:
// «وقتی شرکت داره باید بنام شرکت بیاد نه بنام خود شخص». ترتیب: شرکتِ per-user (u_businesses) →
// company در app_users → در نهایت نامِ شخص. dataShopName فقط اگر واقعاً نامِ شرکت باشد استفاده می‌شود
// (تگِ ذخیره‌شده هنگامِ افزودنِ کالا از نامِ شرکتِ فعال ساخته می‌شود).
async function resolveShopName(sub, dataShopName) {
  try {
    const b = await query(
      "SELECT data FROM documents WHERE collection = 'u_businesses' AND company = $1 ORDER BY created_at LIMIT 1",
      ['user:' + String(sub)]
    );
    const coName = b.rows[0] && b.rows[0].data && b.rows[0].data.name;
    if (coName && String(coName).trim()) return String(coName).trim();
  } catch (_) {}
  if (dataShopName && String(dataShopName).trim()) return String(dataShopName).trim();
  try {
    const u = await query("SELECT name, company FROM app_users WHERE id = $1", [sub]);
    const row = u.rows[0] || {};
    return (row.company && String(row.company).trim()) || (row.name && String(row.name).trim()) || ('فروشگاه ' + sub);
  } catch (_) { return 'فروشگاه ' + sub; }
}

// قانونِ فروشگاه: فقط کاربری که «ایجنتِ فروشنده/صندوقدار» را خریده «فروشگاه» دارد و محصولاتش برای
// دیگران در بازار دیده می‌شود. کاربری که فقط «خرید تدارکات» دارد کسب‌وکار دارد ولی فروشگاهِ عمومی ندارد.
const SELLER_AGENTS = new Set(['sales', 'sales_beta', 'cashier']);
async function userHasShop(sub, cache) {
  if (cache && sub in cache) return cache[sub];
  let ok = false;
  try {
    const r = await query('SELECT meta FROM app_users WHERE id = $1', [sub]);
    const owned = (r.rows[0] && r.rows[0].meta && Array.isArray(r.rows[0].meta.ownedAgents)) ? r.rows[0].meta.ownedAgents : [];
    ok = owned.some((e) => SELLER_AGENTS.has(String(e).split('::').pop().split('#')[0]));
  } catch (_) { ok = false; }
  if (cache) cache[sub] = ok;
  return ok;
}

// بازارِ چندفروشگاهی: هر کاربر که «ایجنتِ فروشنده/صندوقدار» دارد و حداقل یک «محصولِ موجود» در انبارِ
// مشترک (proc_inventory) دارد = یک فروشگاه.
router.get('/market', authRequired, async (req, res) => {
  const { rows } = await query("SELECT company AS scope, data FROM documents WHERE collection = 'u_proc_inventory'");
  const byScope = {};
  for (const r of rows) {
    const q = Number(r.data && r.data.quantity) || 0;
    if (q <= 0) continue; // فقط محصولِ موجود
    const sub = String(r.scope || '').replace(/^user:/, '');
    if (!byScope[sub]) byScope[sub] = { count: 0, shopName: '' };
    byScope[sub].count++;
    if (!byScope[sub].shopName && r.data && r.data.shopName) byScope[sub].shopName = r.data.shopName;
  }
  const shops = [];
  const _cache = {};
  for (const sub of Object.keys(byScope)) {
    if (!(await userHasShop(sub, _cache))) continue; // فقط دارندهٔ ایجنتِ فروشنده/صندوقدار فروشگاه دارد
    const name = await resolveShopName(sub, byScope[sub].shopName);
    shops.push({ id: sub, name, type: 'فروشگاه', products: byScope[sub].count, isOpen: true });
  }
  res.json(shops);
});

// همهٔ محصولاتِ موجودِ همهٔ فروشگاه‌ها (تبِ «محصول» در بازار) — هر محصول با نامِ فروشگاه/شرکتش تگ می‌شود.
router.get('/market/products', authRequired, async (req, res) => {
  const { rows } = await query("SELECT company AS scope, data FROM documents WHERE collection = 'u_proc_inventory' ORDER BY created_at");
  const nameCache = {};
  const shopCache = {};
  const out = [];
  for (const r of rows) {
    const p = r.data || {};
    if ((Number(p.quantity) || 0) <= 0) continue; // فقط محصولِ موجود
    const sub = String(r.scope || '').replace(/^user:/, '');
    if (!(await userHasShop(sub, shopCache))) continue; // فقط فروشگاه‌دار (ایجنتِ فروشنده)
    if (!(sub in nameCache)) nameCache[sub] = await resolveShopName(sub, p.shopName);
    out.push({ ...p, shopName: nameCache[sub], _shopId: sub });
  }
  res.json(out);
});

// محصولاتِ موجودِ یک فروشگاه (کاربر) در بازار
router.get('/market/:userId/products', authRequired, async (req, res) => {
  const sub = String(req.params.userId);
  const { rows } = await query(
    "SELECT data FROM documents WHERE collection = 'u_proc_inventory' AND company = $1 ORDER BY created_at",
    ['user:' + sub]
  );
  const inStock = rows.map((r) => r.data).filter((p) => (Number(p && p.quantity) || 0) > 0);
  const shopName = await resolveShopName(sub, inStock[0] && inStock[0].shopName);
  res.json(inStock.map((p) => ({ ...p, shopName })));
});

// ————————————————————————— داین (رستوران/کافه) —————————————————————————
// قانون: فقط کاربری که «ایجنتِ داین» را دارد و رستورانش را «منتشر» کرده و ≥۱ آیتمِ موجود دارد، در
// «سفارشِ غذا»ی مشتری‌ها دیده می‌شود. نامِ نمایشی = dine_settings.venueName (اسمِ رستوران، نه فروشگاه/شرکت).
const DINE_AGENTS = new Set(['dine']);
// گرنتِ فعال؟ null = بدونِ گرنت (دائمی)، true = فعال، false = غیرفعال/منقضی (اشتراکِ داین که تمام شده).
function grantOk(meta, bare) {
  const g = (meta && meta.agentGrants) ? meta.agentGrants[bare] : null;
  if (!g) return null;
  if (g.active === false) return false;
  if (g.expiresAt && new Date(g.expiresAt).getTime() < Date.now()) return false;
  return true;
}
async function userHasDine(sub, cache) {
  if (cache && sub in cache) return cache[sub];
  let ok = false;
  try {
    const r = await query('SELECT meta FROM app_users WHERE id = $1', [sub]);
    const meta = (r.rows[0] && r.rows[0].meta) || {};
    const owned = Array.isArray(meta.ownedAgents) ? meta.ownedAgents : [];
    // مالکیت + گرنتِ منقضی‌نشده (اشتراکِ داین که تمام شده باشد، رستوران را عمومی نمی‌کند).
    ok = owned.some((e) => {
      const bare = String(e).split('::').pop().split('#')[0];
      return DINE_AGENTS.has(bare) && grantOk(meta, bare) !== false;
    });
  } catch (_) { ok = false; }
  if (cache) cache[sub] = ok;
  return ok;
}
function venuePublic(sub, st, itemsCount) {
  return {
    id: sub, name: (st.venueName && String(st.venueName).trim()) || ('رستوران ' + sub), type: st.venueType || 'رستوران',
    cuisine: st.venueType || '', lat: st.lat != null ? st.lat : null, lng: st.lng != null ? st.lng : null,
    address: st.address || '', tagline: st.tagline || '', theme: st.menuTheme || 'modern',
    primaryColor: st.primaryColor || '', logo: st.logo || '', cover: st.cover || '',
    taxPct: Number(st.taxPct) || 0, serviceChargePct: Number(st.serviceChargePct) || 0,
    orderTypes: st.orderTypes || { dinein: true, takeout: true, delivery: false }, isOpen: true, itemsCount,
  };
}

// رستوران‌های منتشرشده (برای تبِ «سفارشِ غذا»ی مشتری)
router.get('/dine/venues', authRequired, async (req, res) => {
  const { rows } = await query("SELECT company AS scope, data FROM documents WHERE collection = 'u_dine_settings'");
  const cache = {};
  const out = [];
  for (const r of rows) {
    const st = r.data || {};
    if (st.published !== true) continue;
    const sub = String(r.scope || '').replace(/^user:/, '');
    if (!(await userHasDine(sub, cache))) continue;
    const mi = await query("SELECT data FROM documents WHERE collection = 'u_menu_items' AND company = $1", ['user:' + sub]);
    const items = mi.rows.map((x) => x.data).filter((p) => p && p.available !== false);
    if (!items.length) continue;
    out.push(venuePublic(sub, st, items.length));
  }
  res.json(out);
});

// منوی کاملِ یک رستوران (دسته‌ها + آیتم‌های موجود) + تمِ منو
router.get('/dine/venues/:userId/menu', authRequired, async (req, res) => {
  const sub = String(req.params.userId);
  const [cat, mi, st] = await Promise.all([
    query("SELECT data FROM documents WHERE collection = 'u_menu_categories' AND company = $1 ORDER BY created_at", ['user:' + sub]),
    query("SELECT data FROM documents WHERE collection = 'u_menu_items' AND company = $1 ORDER BY created_at", ['user:' + sub]),
    query("SELECT data FROM documents WHERE collection = 'u_dine_settings' AND company = $1 LIMIT 1", ['user:' + sub]),
  ]);
  const s = (st.rows[0] && st.rows[0].data) || {};
  // گیت: فقط رستورانِ منتشرشده که اشتراکش فعال است، منویش برای مشتری خواندنی است (مثل /dine/venues).
  if (s.published !== true || !(await userHasDine(sub, {}))) return res.status(404).json({ error: 'venue_not_found' });
  res.json({
    venue: venuePublic(sub, s, 0),
    categories: cat.rows.map((x) => x.data).sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)),
    items: mi.rows.map((x) => x.data).filter((p) => p && p.available !== false),
  });
});

// رمزگشاییِ QRِ روی میز → رستوران + میز (برای سفارشِ حضوری)
router.get('/dine/table/:token', authRequired, async (req, res) => {
  const token = String(req.params.token || '');
  if (!token) return res.status(400).json({ error: 'token_required' });
  const { rows } = await query("SELECT company AS scope, data FROM documents WHERE collection = 'u_dine_tables'");
  for (const r of rows) {
    if (r.data && String(r.data.qrToken) === token) {
      const sub = String(r.scope || '').replace(/^user:/, '');
      // گیتِ اشتراک: QRِ رستورانی که اشتراکش منقضی/غیرفعال است، به هیچ رستورانی resolve نمی‌شود.
      if (!(await userHasDine(sub, {}))) return res.status(404).json({ error: 'table_not_found' });
      const st = await query("SELECT data FROM documents WHERE collection = 'u_dine_settings' AND company = $1 LIMIT 1", ['user:' + sub]);
      const s = (st.rows[0] && st.rows[0].data) || {};
      return res.json({ venueId: sub, venueName: s.venueName || '', tableId: r.data.id, tableLabel: r.data.label });
    }
  }
  res.status(404).json({ error: 'table_not_found' });
});

// ————————————————————————— درآمدزاییِ داین: اشتراکِ ماهانه —————————————————————————
// خریدِ اشتراکِ داین: کسرِ اتمیکِ کیف‌پول (قیمت از تنظیماتِ سوپرادمین) + مالکیتِ ایجنت (ownedAgents)
// + گرنتِ زمان‌دار (agentGrants.dine.expiresAt). تمدید، از تاریخِ انقضای فعلی ادامه می‌یابد.
// با انقضا، رستوران خودبه‌خود غیرعمومی می‌شود (userHasDine گرنت را چک می‌کند).
router.post('/dine/subscribe', authRequired, async (req, res) => {
  const months = Math.max(1, Math.min(24, Math.floor(Number(req.body?.months || 1))));
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cs = await client.query('SELECT data FROM settings WHERE id = 1');
    const monthly = Math.max(0, Math.floor(Number((cs.rows[0]?.data || {}).dineSubscriptionPrice) || 0));
    const price = monthly * months;
    const { rows } = await client.query('SELECT meta FROM app_users WHERE id=$1 FOR UPDATE', [req.user.sub]);
    if (!rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'not_found' }); }
    const meta = rows[0].meta || {};
    if (!meta.wallet || typeof meta.wallet !== 'object') meta.wallet = { balance: 0, tx: [] };
    if (typeof meta.wallet.balance !== 'number') meta.wallet.balance = 0;
    if (!Array.isArray(meta.wallet.tx)) meta.wallet.tx = [];
    if (price > 0 && meta.wallet.balance < price) {
      await client.query('ROLLBACK');
      return res.status(402).json({ error: 'insufficient_funds', balance: meta.wallet.balance, price });
    }
    if (price > 0) {
      meta.wallet.balance -= price;
      meta.wallet.tx.unshift({ id: 'sub' + Date.now(), type: 'purchase', title: 'اشتراکِ داین (' + months + ' ماه)', date: '', amount: -price });
      meta.wallet.tx = meta.wallet.tx.slice(0, 300);
    }
    // مالکیت (bare 'dine') + گرنتِ زمان‌دار
    const owned = Array.isArray(meta.ownedAgents) ? meta.ownedAgents : [];
    if (!owned.some((e) => String(e).split('::').pop().split('#')[0] === 'dine')) owned.push('dine');
    meta.ownedAgents = owned;
    meta.agentGrants = (meta.agentGrants && typeof meta.agentGrants === 'object') ? meta.agentGrants : {};
    const cur = meta.agentGrants.dine;
    const base = (cur && cur.expiresAt && new Date(cur.expiresAt).getTime() > Date.now()) ? new Date(cur.expiresAt).getTime() : Date.now();
    const expiresAt = new Date(base + months * 30 * 24 * 3600 * 1000).toISOString();
    meta.agentGrants.dine = { active: true, expiresAt, startedAt: (cur && cur.startedAt) || new Date().toISOString(), price: monthly, autoRenew: true };
    await client.query('UPDATE app_users SET meta=$2::jsonb WHERE id=$1', [req.user.sub, JSON.stringify(meta)]);
    const rvId = 'rev_' + Date.now() + Math.random().toString(36).slice(2, 6);
    await client.query("INSERT INTO documents (collection, id, data) VALUES ('platform_revenue', $1, $2::jsonb)",
      [rvId, JSON.stringify({ type: 'dine_subscription', userId: String(req.user.sub), amount: price, months, date: new Date().toISOString() })]);
    await client.query('COMMIT');
    res.json({ ok: true, balance: meta.wallet.balance, expiresAt, months, price });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    res.status(500).json({ error: 'subscribe_failed', detail: String(e?.message || e) });
  } finally {
    client.release();
  }
});

// وضعیتِ اشتراکِ داینِ کاربر (فعال/تاریخِ انقضا/روزِ باقی‌مانده + قیمتِ ماهانه)
router.get('/dine/subscription', authRequired, async (req, res) => {
  const [ur, cs] = await Promise.all([
    query('SELECT meta FROM app_users WHERE id=$1', [req.user.sub]),
    query('SELECT data FROM settings WHERE id = 1'),
  ]);
  const meta = (ur.rows[0] && ur.rows[0].meta) || {};
  const monthly = Math.max(0, Math.floor(Number((cs.rows[0]?.data || {}).dineSubscriptionPrice) || 0));
  const owned = (Array.isArray(meta.ownedAgents) ? meta.ownedAgents : []).some((e) => String(e).split('::').pop().split('#')[0] === 'dine');
  const g = (meta.agentGrants || {}).dine;
  let expiresAt = null, daysLeft = null, active = owned;
  if (g) {
    expiresAt = g.expiresAt || null;
    const exp = g.expiresAt ? new Date(g.expiresAt).getTime() : Infinity;
    active = owned && g.active !== false && exp >= Date.now();
    daysLeft = g.expiresAt ? Math.max(0, Math.ceil((exp - Date.now()) / 86400000)) : null;
  }
  res.json({ owned, active, expiresAt, daysLeft, monthlyPrice: monthly, autoRenew: !!(g && g.autoRenew) });
});

// بینشِ مدیر (مغزِ داین) — تحلیلِ «واقعیِ» رستوران برای صاحبِ همان رستوران:
// مهندسیِ منو، فودکاست، فروشِ امروز، هزینهٔ نیرو، کمبودِ انبار. هیچ عددِ فیک نیست.
router.get('/dine/insights', authRequired, async (req, res) => {
  try {
    const ins = await computeDineInsights(req.user.sub);
    res.json(ins);
  } catch (e) {
    res.status(500).json({ error: 'insights_failed', detail: String(e?.message || e) });
  }
});

// باشگاهِ مشتریان + مشتریانِ در معرضِ ریزش (win-back) — فقط برای صاحبِ رستوران.
router.get('/dine/customers', authRequired, async (req, res) => {
  try {
    res.json(await computeDineCustomers(req.user.sub));
  } catch (e) {
    res.status(500).json({ error: 'customers_failed', detail: String(e?.message || e) });
  }
});

// پیش‌بینیِ فروش (۷ روزِ آینده + میانگینِ روزهای هفته + ساعتِ اوج) — از تاریخچهٔ واقعیِ سفارش‌ها.
router.get('/dine/forecast', authRequired, async (req, res) => {
  try {
    res.json(await computeDineForecast(req.user.sub));
  } catch (e) {
    res.status(500).json({ error: 'forecast_failed', detail: String(e?.message || e) });
  }
});

// پیشنهادِ داینامیکِ قیمتِ منو — هدفِ فودکاست از تنظیماتِ سوپرادمین (dineTargetFoodCostPct).
router.get('/dine/pricing', authRequired, async (req, res) => {
  try {
    let target = 30;
    try { const cs = await query('SELECT data FROM settings WHERE id = 1'); target = Number((cs.rows[0]?.data || {}).dineTargetFoodCostPct) || 30; } catch (_) {}
    res.json(await computeDinePricing(req.user.sub, target));
  } catch (e) {
    res.status(500).json({ error: 'pricing_failed', detail: String(e?.message || e) });
  }
});

// تحلیلِ رقبا — مقایسهٔ قیمتِ منوی خودِ رستوران با قیمتِ رقبایی که صاحب وارد کرده.
router.get('/dine/competitors', authRequired, async (req, res) => {
  try {
    res.json(await computeDineCompetitors(req.user.sub));
  } catch (e) {
    res.status(500).json({ error: 'competitors_failed', detail: String(e?.message || e) });
  }
});

// ثبتِ نظرِ «واقعیِ» مشتری برای یک رستوران (فقط رستورانِ فعال). در انبارِ رستوران ذخیره می‌شود.
router.post('/dine/review', authRequired, async (req, res) => {
  const venueId = String(req.body?.venueId || '');
  const rating = Math.max(1, Math.min(5, Math.floor(Number(req.body?.rating) || 0)));
  const text = String(req.body?.text || '').slice(0, 1000);
  if (!venueId || !rating) return res.status(400).json({ error: 'bad_review' });
  if (!(await userHasDine(venueId, {}))) return res.status(404).json({ error: 'venue_not_found' });
  let name = 'کاربر';
  try { const ur = await query('SELECT name, username FROM app_users WHERE id=$1', [req.user.sub]); name = (ur.rows[0] && (ur.rows[0].name || ur.rows[0].username)) || 'کاربر'; } catch (_) {}
  const id = 'rev_' + Date.now() + Math.random().toString(36).slice(2, 5);
  const review = { id, restaurant: venueId, user: name, userId: String(req.user.sub), rating, text, date: new Date().toISOString() };
  await query("INSERT INTO documents (collection, id, company, data) VALUES ('u_dine_reviews', $1, $2, $3::jsonb)", [venueId + '__' + id, 'user:' + venueId, JSON.stringify(review)]);
  res.json({ ok: true, review });
});

// نظرهای عمومیِ یک رستوران (برای نمایش به مشتری‌ها) — فقط رستورانِ فعال.
router.get('/dine/venues/:userId/reviews', authRequired, async (req, res) => {
  const sub = String(req.params.userId);
  if (!(await userHasDine(sub, {}))) return res.status(404).json({ error: 'venue_not_found' });
  const { rows } = await query("SELECT data FROM documents WHERE collection='u_dine_reviews' AND company=$1 ORDER BY created_at DESC LIMIT 100", ['user:' + sub]);
  res.json(rows.map((r) => ({ user: r.data.user || 'کاربر', rating: Math.round(Number(r.data.rating) || 0), text: r.data.text || '', date: r.data.date || '' })));
});

// تحلیلِ نظرات و رضایت (احساسات) — فقط برای صاحبِ رستوران.
router.get('/dine/reviews', authRequired, async (req, res) => {
  try {
    res.json(await computeDineReviews(req.user.sub));
  } catch (e) {
    res.status(500).json({ error: 'reviews_failed', detail: String(e?.message || e) });
  }
});

// برگرداندنِ مشتری (win-back) — رستوران به مشتریِ خودش پیامِ دعوتِ بازگشت می‌فرستد. پیام در
// نوتیفِ درون‌برنامه‌ایِ «واقعیِ» مشتری (u_notifications) می‌نشیند. فقط برای مشتریِ واقعیِ همین رستوران.
router.post('/dine/winback', authRequired, async (req, res) => {
  const customerId = String(req.body?.customerId || '');
  const custom = String(req.body?.message || '').slice(0, 300);
  if (!customerId) return res.status(400).json({ error: 'customer_required' });
  if (!(await userHasDine(req.user.sub, {}))) return res.status(403).json({ error: 'not_a_venue' });
  // مشتری باید واقعاً از همین رستوران سفارش داده باشد (جلوگیری از پیامِ ناخواسته به غریبه‌ها)
  const chk = await query("SELECT 1 FROM documents WHERE collection='u_dine_orders' AND company=$1 AND data->>'customerId'=$2 LIMIT 1", ['user:' + req.user.sub, customerId]);
  if (!chk.rows.length) return res.status(404).json({ error: 'not_your_customer' });
  let venueName = '';
  try { const vs = await query("SELECT data FROM documents WHERE collection='u_dine_settings' AND company=$1 LIMIT 1", ['user:' + req.user.sub]); venueName = (vs.rows[0] && vs.rows[0].data && vs.rows[0].data.venueName) || ''; } catch (_) {}
  const msg = custom || ('دلمان برایتان تنگ شده! به ' + (venueName || 'رستورانِ ما') + ' برگردید — منتظرِ شماییم.');
  const ntfId = 'ntf_' + Date.now() + Math.random().toString(36).slice(2, 5);
  const notif = { id: ntfId, type: 'dine_winback', title: 'پیام از ' + (venueName || 'رستوران'), message: msg, body: msg, date: new Date().toISOString(), read: false, venueId: String(req.user.sub) };
  await query("INSERT INTO documents (collection, id, company, data) VALUES ('u_notifications', $1, $2, $3::jsonb)", [customerId + '__' + ntfId, 'user:' + customerId, JSON.stringify(notif)]);
  res.json({ ok: true, notified: true });
});

// درآمدِ پلتفرم از داین (فقط سوپرادمین/ادمین): اشتراک‌ها + کمیسیون‌ها
router.get('/dine/revenue', authRequired, roleRequired('admin', 'superadmin'), async (req, res) => {
  const { rows } = await query("SELECT data FROM documents WHERE collection='platform_revenue' ORDER BY created_at DESC LIMIT 2000");
  const items = rows.map((r) => r.data).filter(Boolean);
  const sum = (t) => items.filter((x) => x.type === t).reduce((a, x) => a + (Number(x.amount) || 0), 0);
  const subscriptions = sum('dine_subscription'), commissions = sum('dine_commission');
  res.json({ subscriptions, commissions, total: subscriptions + commissions, count: items.length, recent: items.slice(0, 50) });
});

// وضعیتِ زندهٔ یک سفارشِ داین (مشتری پیگیری می‌کند): received → cooking → ready → served → paid.
// فقط مشتریِ ثبت‌کننده یا خودِ رستوران می‌تواند بخواند.
router.get('/dine/order/:venueId/:ticketId/status', authRequired, async (req, res) => {
  const vid = String(req.params.venueId), tid = String(req.params.ticketId);
  const { rows } = await query("SELECT data FROM documents WHERE collection='u_dine_orders' AND id=$1 AND company=$2 LIMIT 1", [vid + '__' + tid, 'user:' + vid]);
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  const d = rows[0].data || {};
  // فقط خودِ رستوران یا مشتریِ ثبت‌کننده. سفارشِ صندوق/حضوری (بدونِ customerId) فقط برای رستوران.
  if (vid !== String(req.user.sub) && String(d.customerId || '') !== String(req.user.sub)) {
    return res.status(403).json({ error: 'forbidden' });
  }
  res.json({
    id: tid, status: d.status || 'received', tableLabel: d.tableLabel || '', type: d.type || 'takeout',
    total: d.total || 0, createdAt: d.createdAt || '',
    lines: (d.lines || []).map((l) => ({ name: l.name, qty: l.qty, lineStatus: l.lineStatus || 'pending' })),
  });
});

// فروش‌های آنلاینِ فروشنده: سفارش‌هایی که «دیگران» از فروشگاهِ این کاربر خریده‌اند (kind=sale).
// برای نمایش در پنلِ «فروشنده/صندوقدار».
router.get('/sales', authRequired, async (req, res) => {
  const { rows } = await query(
    "SELECT data FROM documents WHERE collection = 'u_orders' AND company = $1 ORDER BY created_at DESC",
    ['user:' + req.user.sub]
  );
  res.json(rows.map((r) => r.data).filter((o) => o && o.kind === 'sale'));
});

// سفارش‌های خودِ کاربر
router.get('/orders', authRequired, async (req, res) => {
  const { rows } = await query(
    "SELECT data FROM documents WHERE collection = 'u_orders' AND company = $1 ORDER BY created_at DESC",
    ['user:' + req.user.sub]
  );
  res.json(rows.map((r) => r.data));
});

// ثبتِ سفارش — اتمیک: کسرِ کیف‌پول + ثبتِ سفارش
router.post('/order', authRequired, async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  let total = Math.floor(Number(req.body?.total || 0));
  const kind = String(req.body?.kind || 'order');
  const extra = (req.body && typeof req.body.meta === 'object') ? req.body.meta : {};
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── داین: قیمت‌گذاریِ «معتبرِ سمتِ سرور» + گیتِ اشتراک، پیش از هر کسری ──
    // قیمت‌ها از منوی واقعیِ رستوران خوانده می‌شوند (نه از سبدِ کلاینت)؛ حق‌سرویس/مالیاتِ رستوران اعمال
    // می‌شود؛ رستورانی که اشتراکش منقضی/غیرفعال است اصلاً سفارش نمی‌گیرد (۴۰۹). مبلغِ کلاینت نادیده.
    let dinePlan = null;
    if (kind === 'dine') {
      const cs = await client.query('SELECT data FROM settings WHERE id = 1');
      const sd = (cs.rows[0] && cs.rows[0].data) || {};
      const commPct = Math.max(0, Math.min(100, Number(sd.dineCommissionPct) || 0));
      const conv = (sd.unitConversion && typeof sd.unitConversion === 'object') ? sd.unitConversion : {};
      const grouped = {};
      for (const it of items) {
        const vid = it && it.venueId != null ? String(it.venueId) : '';
        const mid = it && it.menuItemId != null ? String(it.menuItemId) : '';
        const q = Math.max(0, Math.floor(Number(it && it.qty) || 0));
        if (!vid || vid === String(req.user.sub) || q <= 0) continue; // سفارشِ از رستورانِ خود را نادیده بگیر
        (grouped[vid] = grouped[vid] || []).push({ mid, q });
      }
      dinePlan = { commPct, conv, venues: [] };
      for (const vid of Object.keys(grouped)) {
        const scope = 'user:' + vid;
        // گیتِ اشتراک: مالکیت + گرنتِ منقضی‌نشده (همان قانونِ userHasDine).
        const ur = await client.query('SELECT meta FROM app_users WHERE id=$1', [vid]);
        const vMeta = (ur.rows[0] && ur.rows[0].meta) || {};
        const ownsDine = (Array.isArray(vMeta.ownedAgents) ? vMeta.ownedAgents : []).some((e) => {
          const bare = String(e).split('::').pop().split('#')[0];
          return DINE_AGENTS.has(bare) && grantOk(vMeta, bare) !== false;
        });
        if (!ownsDine) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'venue_unavailable', venueId: vid }); }
        // قیمتِ معتبر از منوی واقعیِ رستوران + حق‌سرویس/مالیات
        const miR = await client.query("SELECT data FROM documents WHERE collection='u_menu_items' AND company=$1", [scope]);
        const stR = await client.query("SELECT data FROM documents WHERE collection='u_dine_settings' AND company=$1 LIMIT 1", [scope]);
        const priceById = {}, nameById = {};
        for (const row of miR.rows) { const d = row.data || {}; if (d.id != null && d.available !== false) { priceById[String(d.id)] = Math.max(0, Math.floor(Number(d.priceNum) || 0)); nameById[String(d.id)] = d.name || 'غذا'; } }
        const st = (stR.rows[0] && stR.rows[0].data) || {};
        const svcPct = Math.max(0, Number(st.serviceChargePct) || 0);
        const taxPct = Math.max(0, Number(st.taxPct) || 0);
        const lines = [];
        for (const l of grouped[vid]) { if (!(l.mid in priceById)) continue; lines.push({ mid: l.mid, q: l.q, name: nameById[l.mid], priceNum: priceById[l.mid] }); }
        if (!lines.length) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'no_valid_items', venueId: vid }); }
        const subtotal = lines.reduce((s, l) => s + l.priceNum * l.q, 0);
        const service = Math.round(subtotal * svcPct / 100);
        const tax = Math.round((subtotal + service) * taxPct / 100);
        const saleTotal = subtotal + service + tax;
        const commission = Math.floor(subtotal * commPct / 100); // کمیسیونِ پلتفرم روی جمعِ غذا (نه مالیات)
        const net = saleTotal - commission; // رستوران کلِ فروش منهای کمیسیون را می‌گیرد (مالیات را خودش تسویه می‌کند)
        dinePlan.venues.push({ vid, scope, lines, subtotal, service, tax, saleTotal, commission, net, venueName: st.venueName || '' });
      }
      // فقط وقتی رستورانِ واقعی resolve شد، مبلغِ معتبرِ سرور جایگزینِ قیمتِ کلاینت می‌شود.
      // (سفارش‌های قدیمی/ویترینِ بدونِ venueId، مثلِ قبل با total کلاینت کار می‌کنند.)
      if (dinePlan.venues.length) total = dinePlan.venues.reduce((s, v) => s + v.saleTotal, 0);
    }

    const { rows } = await client.query('SELECT meta FROM app_users WHERE id = $1 FOR UPDATE', [req.user.sub]);
    if (!rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'not_found' }); }
    const meta = rows[0].meta || {};
    const _init = await walletInitial();
    if (!meta.wallet || typeof meta.wallet !== 'object') meta.wallet = { balance: _init, tx: [] };
    if (typeof meta.wallet.balance !== 'number') meta.wallet.balance = _init;
    if (!Array.isArray(meta.wallet.tx)) meta.wallet.tx = [];
    if (total > 0 && meta.wallet.balance < total) {
      await client.query('ROLLBACK');
      return res.status(402).json({ error: 'insufficient_funds', balance: meta.wallet.balance });
    }
    const oid = 'ord_' + Date.now() + Math.random().toString(36).slice(2, 5);
    const order = { id: oid, kind, items, total, status: 'preparing', date: new Date().toISOString(), ...extra };
    let cashbackEarned = 0;
    if (total > 0) {
      meta.wallet.balance -= total;
      meta.wallet.tx.unshift({ id: 'wt' + Date.now(), type: 'purchase', title: (kind === 'dine' ? 'سفارش غذا' : 'خرید از مارکت'), date: '', amount: -total });
      // کش‌بکِ واقعی: نرخِ پله‌ای بر اساسِ کل کش‌بکِ کسب‌شده (برنزی ۲٪ / نقره‌ای ۳.۵٪ / طلایی ۵٪)
      const earned = typeof meta.wallet.cashback === 'number' ? meta.wallet.cashback : 0;
      const rate = earned >= 5000000 ? 0.05 : earned >= 1000000 ? 0.035 : 0.02;
      cashbackEarned = Math.floor(total * rate);
      if (cashbackEarned > 0) {
        meta.wallet.cashback = earned + cashbackEarned;
        meta.wallet.balance += cashbackEarned; // کش‌بک به موجودی برمی‌گردد (قابلِ استفاده در خریدِ بعدی)
        meta.wallet.tx.unshift({ id: 'cb' + Date.now(), type: 'cashback', title: 'کش‌بک خرید', date: '', amount: cashbackEarned });
      }
      meta.wallet.tx = meta.wallet.tx.slice(0, 300);
    }
    order.cashback = cashbackEarned;
    await client.query('UPDATE app_users SET meta = $2::jsonb WHERE id = $1', [req.user.sub, JSON.stringify(meta)]);

    // —— اتصالِ کاملِ سفارشِ داین به رستوران —— (kind === 'dine')، اتمیک و در همان تراکنش:
    //   ۱) کسرِ موادِ اولیه از انبارِ رستوران بر اساسِ رسپیِ هر آیتم (u_proc_inventory)
    //   ۲) اعتبارِ خالص (منهای کمیسیونِ پلتفرم) به کیفِ‌پولِ صاحبِ رستوران
    //   ۳) ساختِ «تیکتِ آشپزخانه» (u_dine_orders) تا در KDS/صندوقِ رستوران دیده شود
    //   ۴) نوتیفِ «سفارشِ جدیدِ داین» برای رستوران — و ثبتِ tickets روی سفارشِ مشتری برای پیگیریِ زنده
    if (kind === 'dine' && dinePlan) {
      const convOf = (u) => { const v = Number(dinePlan.conv[u]); return v > 0 ? v : 1; };
      order.dineTickets = [];
      for (const V of dinePlan.venues) {
        const { vid, scope, lines, subtotal, service, tax, saleTotal, commission, net, venueName } = V;
        const itemsTxt = lines.map((l) => l.name + ' × ' + l.q).join('، ');

        // ۱) کسرِ موادِ اولیه بر اساسِ رسپیِ هر آیتم (اگر رسپی تعریف شده باشد)
        const rr = await client.query("SELECT data FROM documents WHERE collection='u_recipes' AND company=$1", [scope]);
        const recByItem = {};
        for (const row of rr.rows) { const rd = row.data || {}; if (rd.menuItemId != null) recByItem[String(rd.menuItemId)] = rd; }
        for (const ln of lines) {
          const rec = ln.mid ? recByItem[ln.mid] : null;
          if (!rec || !Array.isArray(rec.lines)) continue;
          const waste = 1 + (Math.max(0, Number(rec.wastePct) || 0) / 100);
          const yield_ = Math.max(1, Number(rec.yield) || 1);
          for (const rl of rec.lines) {
            const ingId = rl && rl.ingredientId != null ? String(rl.ingredientId) : '';
            if (!ingId) continue;
            const dbId = vid + '__' + ingId;
            const ir = await client.query("SELECT data FROM documents WHERE collection='u_proc_inventory' AND id=$1 AND company=$2 FOR UPDATE", [dbId, scope]);
            if (!ir.rows[0]) continue;
            const pd = ir.rows[0].data || {};
            const ingUnit = pd.unit || 'عدد';
            // مصرفِ «واحدِ پایه» برای هر پرس = qty × ضریبِ واحدِ خط × (۱+ضایعات) ÷ راندمان ؛ سپس به واحدِ خودِ ماده تبدیل و در تعدادِ سفارش ضرب شود
            const basePerPortion = (Number(rl.qty) || 0) * convOf(rl.unit) * waste / yield_;
            const usedInIngUnit = (basePerPortion / convOf(ingUnit)) * ln.q;
            const cur = Math.max(0, Number(pd.quantity) || 0);
            const nq = Math.max(0, cur - usedInIngUnit);
            const minS = Number(pd.minStock) || 0;
            pd.quantity = nq;
            pd.status = nq <= 0 ? 'critical' : (nq <= minS ? 'low' : 'sufficient');
            await client.query("UPDATE documents SET data=$3::jsonb, updated_at=now() WHERE collection='u_proc_inventory' AND id=$1 AND company=$2", [dbId, scope, JSON.stringify(pd)]);
          }
        }

        // ۲) اعتبارِ خالص (کلِ فروش منهای کمیسیون) به کیفِ‌پولِ رستوران
        const sr = await client.query('SELECT meta FROM app_users WHERE id=$1 FOR UPDATE', [vid]);
        if (sr.rows[0]) {
          const sMeta = sr.rows[0].meta || {};
          if (!sMeta.wallet || typeof sMeta.wallet !== 'object') sMeta.wallet = { balance: 0, tx: [] };
          if (typeof sMeta.wallet.balance !== 'number') sMeta.wallet.balance = 0;
          if (!Array.isArray(sMeta.wallet.tx)) sMeta.wallet.tx = [];
          if (net > 0) {
            sMeta.wallet.balance += net;
            sMeta.wallet.tx.unshift({ id: 'dine' + Date.now() + vid, type: 'sale', title: commission > 0 ? 'فروشِ داین (پس از کمیسیون)' : 'فروشِ داین', date: '', amount: net });
            sMeta.wallet.tx = sMeta.wallet.tx.slice(0, 300);
          }
          await client.query('UPDATE app_users SET meta=$2::jsonb WHERE id=$1', [vid, JSON.stringify(sMeta)]);
        }

        // ۳) تیکتِ آشپزخانه (u_dine_orders) با حق‌سرویس/مالیات/جمعِ واقعی — مشتری پرداخت کرده و وضعیت «received»
        const tid = 'dord_' + Date.now() + Math.random().toString(36).slice(2, 5);
        const kdsLines = lines.map((l) => ({ menuItemId: l.mid, name: l.name, priceNum: l.priceNum, qty: l.q, notes: '', station: 'آشپزخانه', lineStatus: 'pending' }));
        const ticket = {
          id: tid, type: extra.tableId ? 'dinein' : (extra.dineType || 'takeout'),
          tableId: extra.tableId || '', tableLabel: extra.tableLabel || '',
          lines: kdsLines, subtotal, service, tax, total: saleTotal,
          status: 'received', payMethod: 'wallet', paid: true, source: 'customer',
          customerId: req.user.sub, commission, net, createdAt: new Date().toISOString(),
        };
        await client.query("INSERT INTO documents (collection, id, company, data) VALUES ('u_dine_orders', $1, $2, $3::jsonb)", [vid + '__' + tid, scope, JSON.stringify(ticket)]);
        if (extra.tableId) {
          await client.query("UPDATE documents SET data = data || $3::jsonb, updated_at=now() WHERE collection='u_dine_tables' AND id=$1 AND company=$2", [vid + '__' + String(extra.tableId), scope, JSON.stringify({ currentOrderId: tid })]);
        }

        // ۴) نوتیفِ سفارشِ جدید برای رستوران
        const ntfId = 'ntf_' + Date.now() + Math.random().toString(36).slice(2, 5);
        const notif = { id: ntfId, type: 'dine_order', title: 'سفارشِ جدیدِ داین', message: itemsTxt + ' — ' + saleTotal.toLocaleString('en-US') + ' تومان' + (extra.tableLabel ? ' — میز ' + extra.tableLabel : ''), body: itemsTxt, date: new Date().toISOString(), read: false, amount: saleTotal };
        await client.query("INSERT INTO documents (collection, id, company, data) VALUES ('u_notifications', $1, $2, $3::jsonb)", [vid + '__' + ntfId, scope, JSON.stringify(notif)]);

        // ۵) کمیسیونِ پلتفرم → دفترِ درآمدِ داین (درآمدِ واقعیِ نئورا)
        if (commission > 0) {
          const rvId = 'rev_' + Date.now() + Math.random().toString(36).slice(2, 6);
          await client.query("INSERT INTO documents (collection, id, data) VALUES ('platform_revenue', $1, $2::jsonb)",
            [rvId, JSON.stringify({ type: 'dine_commission', venueId: vid, orderId: oid, amount: commission, gross: subtotal, date: new Date().toISOString() })]);
        }

        order.dineTickets.push({ venueId: vid, ticketId: tid, venueName, status: 'received' });
        if (venueName) order.vendor = venueName;
      }
    }

    await client.query(
      "INSERT INTO documents (collection, id, company, data) VALUES ('u_orders', $1, $2, $3::jsonb)",
      [req.user.sub + '__' + oid, 'user:' + req.user.sub, JSON.stringify(order)]
    );

    // —— اتصالِ کاملِ خرید به فروشنده —— هر قلمی که فروشنده و کالای مشخص دارد (از بازار):
    //   ۱) کسر از انبارِ مشترکِ فروشنده (u_proc_inventory ← همان انبارِ «فروشنده/صندوقدار» و «خرید تدارکات»)
    //   ۲) واریزِ مبلغ به کیفِ‌پولِ فروشنده  ۳) نوتیفِ «فروش جدید»  ۴) ثبتِ سفارشِ فروش در u_ordersِ فروشنده
    const sellers = {};
    for (const it of items) {
      const sid = it && it.sellerId != null ? String(it.sellerId) : '';
      const pid = it && it.productId != null ? String(it.productId) : '';
      const q = Math.max(0, Math.floor(Number(it && it.qty) || 0));
      if (!sid || sid === String(req.user.sub) || q <= 0) continue; // خریدِ از خود را نادیده بگیر
      (sellers[sid] = sellers[sid] || []).push({ pid, q, name: (it && it.name) || 'کالا', priceNum: Math.max(0, Math.floor(Number(it && it.priceNum) || 0)) });
    }
    for (const sid of Object.keys(sellers)) {
      const lines = sellers[sid];
      const scope = 'user:' + sid;
      // ۱) کسر از انبارِ فروشنده + به‌روزرسانیِ وضعیتِ موجودی
      for (const ln of lines) {
        if (!ln.pid) continue;
        const dbId = sid + '__' + ln.pid;
        const ir = await client.query("SELECT data FROM documents WHERE collection='u_proc_inventory' AND id=$1 AND company=$2 FOR UPDATE", [dbId, scope]);
        if (ir.rows[0]) {
          const pd = ir.rows[0].data || {};
          const cur = Math.max(0, Number(pd.quantity) || 0);
          const nq = Math.max(0, cur - ln.q);
          const minS = Number(pd.minStock) || 0;
          pd.quantity = nq;
          pd.status = nq <= 0 ? 'critical' : (nq <= minS ? 'low' : 'sufficient');
          await client.query("UPDATE documents SET data=$3::jsonb, updated_at=now() WHERE collection='u_proc_inventory' AND id=$1 AND company=$2", [dbId, scope, JSON.stringify(pd)]);
        }
      }
      const amount = lines.reduce((s, l) => s + l.priceNum * l.q, 0);
      const itemsTxt = lines.map((l) => l.name + ' × ' + l.q).join('، ');
      // ۲) واریز به کیفِ‌پولِ فروشنده + ۳) نوتیفِ فروش (در meta)
      const sr = await client.query('SELECT meta FROM app_users WHERE id=$1 FOR UPDATE', [sid]);
      if (sr.rows[0]) {
        const sMeta = sr.rows[0].meta || {};
        if (!sMeta.wallet || typeof sMeta.wallet !== 'object') sMeta.wallet = { balance: 0, tx: [] };
        if (typeof sMeta.wallet.balance !== 'number') sMeta.wallet.balance = 0;
        if (!Array.isArray(sMeta.wallet.tx)) sMeta.wallet.tx = [];
        if (amount > 0) {
          sMeta.wallet.balance += amount;
          sMeta.wallet.tx.unshift({ id: 'sale' + Date.now() + sid, type: 'sale', title: 'فروش از فروشگاه', date: '', amount: amount });
          sMeta.wallet.tx = sMeta.wallet.tx.slice(0, 300);
        }
        await client.query('UPDATE app_users SET meta=$2::jsonb WHERE id=$1', [sid, JSON.stringify(sMeta)]);
      }
      // ۳) نوتیفِ فروش در انبارِ per-userِ فروشنده (u_notifications)
      const ntfId = 'ntf_' + Date.now() + Math.random().toString(36).slice(2, 5);
      const notif = { id: ntfId, type: 'sale', title: 'فروش جدید', message: itemsTxt + ' — ' + amount.toLocaleString('en-US') + ' تومان', body: itemsTxt, date: new Date().toISOString(), read: false, amount };
      await client.query("INSERT INTO documents (collection, id, company, data) VALUES ('u_notifications', $1, $2, $3::jsonb)", [sid + '__' + ntfId, scope, JSON.stringify(notif)]);
      // ۴) ثبتِ سفارشِ فروش در u_ordersِ فروشنده (تا در «سفارش‌ها/فروش» دیده شود)
      const soid = 'sale_' + Date.now() + Math.random().toString(36).slice(2, 5);
      const saleOrder = { id: soid, kind: 'sale', items: lines.map((l) => ({ name: l.name, qty: l.q, priceNum: l.priceNum })), itemsText: itemsTxt, total: amount, status: 'preparing', date: new Date().toISOString(), buyerId: req.user.sub };
      await client.query("INSERT INTO documents (collection, id, company, data) VALUES ('u_orders', $1, $2, $3::jsonb)", [sid + '__' + soid, scope, JSON.stringify(saleOrder)]);
    }

    await client.query('COMMIT');
    res.json({ ok: true, order, balance: meta.wallet.balance });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    res.status(500).json({ error: 'order_failed', detail: String(e?.message || e) });
  } finally {
    client.release();
  }
});

export default router;
