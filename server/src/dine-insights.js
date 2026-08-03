// مغزِ داین — تحلیلِ «واقعیِ» رستوران از دادهٔ per-userِ خودِ صاحب (بدونِ هیچ عددِ فیک).
// هم اندپوینتِ «بینشِ مدیر» از این استفاده می‌کند، هم چتِ ایجنتِ داین با همین ارقام غنی می‌شود.
// فرمولِ بهای تمام‌شده دقیقاً همان فرمولِ فرانت (رسپی/واحد/ضایعات/راندمان) است.
import { query } from './db.js';

function ingCostPerBase(ing, conv) {
  const price = Number(ing && (ing.purchasePrice || ing.salePrice)) || 0;
  const iu = (conv && Number(conv[ing && ing.unit])) || 1;
  return iu ? price / iu : price;
}
function recipeFoodCost(recipe, ingById, conv) {
  const lines = (recipe && recipe.lines) || [];
  let batch = 0;
  for (const l of lines) {
    const ing = ingById[String(l && l.ingredientId)]; if (!ing) continue;
    const cpb = ingCostPerBase(ing, conv);
    const lineBase = (Number(l.qty) || 0) * ((conv && Number(conv[l.unit])) || 1);
    batch += lineBase * cpb;
  }
  const waste = (Number(recipe && recipe.wastePct) || 0) / 100;
  const y = Math.max(1, Number(recipe && recipe.yield) || 1);
  return Math.round((batch * (1 + waste)) / y);
}
function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export async function computeDineInsights(sub) {
  const scope = 'user:' + sub;
  const [stR, itR, rcR, invR, ordR, shfR, setR] = await Promise.all([
    query("SELECT data FROM documents WHERE collection='u_dine_settings' AND company=$1 LIMIT 1", [scope]),
    query("SELECT data FROM documents WHERE collection='u_menu_items' AND company=$1", [scope]),
    query("SELECT data FROM documents WHERE collection='u_recipes' AND company=$1", [scope]),
    query("SELECT data FROM documents WHERE collection='u_proc_inventory' AND company=$1", [scope]),
    query("SELECT data FROM documents WHERE collection='u_dine_orders' AND company=$1", [scope]),
    query("SELECT data FROM documents WHERE collection='u_dine_shifts' AND company=$1", [scope]),
    query('SELECT data FROM settings WHERE id=1'),
  ]);
  const st = (stR.rows[0] && stR.rows[0].data) || {};
  const items = itR.rows.map((r) => r.data).filter(Boolean);
  const recipes = rcR.rows.map((r) => r.data).filter(Boolean);
  const ings = invR.rows.map((r) => r.data).filter(Boolean);
  const orders = ordR.rows.map((r) => r.data).filter(Boolean);
  const shifts = shfR.rows.map((r) => r.data).filter(Boolean);
  const conv = (setR.rows[0] && setR.rows[0].data && setR.rows[0].data.unitConversion) || {};
  const ingById = {}; ings.forEach((g) => { ingById[String(g.id)] = g; });
  const recByItem = {}; recipes.forEach((r) => { if (r && r.menuItemId != null) recByItem[String(r.menuItemId)] = r; });

  // فروشِ هر آیتم (تعداد + درآمد) از خطوطِ همهٔ سفارش‌ها
  const soldQty = {}, itemRev = {};
  for (const o of orders) {
    for (const l of (o.lines || [])) {
      const id = String(l.menuItemId);
      soldQty[id] = (soldQty[id] || 0) + (Number(l.qty) || 0);
      itemRev[id] = (itemRev[id] || 0) + (Number(l.priceNum) || 0) * (Number(l.qty) || 0);
    }
  }
  const menu = items.map((it) => {
    const id = String(it.id);
    const rec = recByItem[id];
    const cost = rec ? recipeFoodCost(rec, ingById, conv) : null;
    const price = Number(it.priceNum) || 0;
    const margin = cost != null ? price - cost : null;
    const fcPct = (cost != null && price > 0) ? Math.round(cost / price * 100) : null;
    return { id, name: it.name, price, cost, margin, fcPct, sold: soldQty[id] || 0, revenue: itemRev[id] || 0, hasRecipe: !!rec };
  });
  // مهندسیِ منو: میانهٔ فروش و میانهٔ حاشیهٔ سود → ستاره/پرفروشِ کم‌سود/کم‌فروشِ پرسود/ضعیف
  const withMargin = menu.filter((m) => m.margin != null);
  const medSold = median(menu.map((m) => m.sold));
  const medMargin = median(withMargin.map((m) => m.margin));
  menu.forEach((m) => {
    if (m.margin == null) { m.klass = 'unknown'; return; }
    const hiPop = m.sold >= medSold, hiMar = m.margin >= medMargin;
    m.klass = hiPop && hiMar ? 'star' : hiPop && !hiMar ? 'plowhorse' : !hiPop && hiMar ? 'puzzle' : 'dog';
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const paidToday = orders.filter((o) => o.paid && String(o.createdAt || o.date || '').slice(0, 10) === todayStr);
  // درآمد = جمعِ فروش (غذا+حق‌سرویس+مالیات)، بدونِ انعام. انعام جدا شمرده می‌شود تا دوبار حساب نشود.
  const todayRevenue = paidToday.reduce((a, o) => a + (Number(o.total) || 0), 0);
  const todayTips = paidToday.reduce((a, o) => a + (Number(o.tip) || 0), 0);
  const avgTicket = paidToday.length ? Math.round(todayRevenue / paidToday.length) : 0;

  const lowStock = ings.filter((g) => { const q = Number(g.quantity) || 0; const mn = Number(g.minStock) || 0; return mn > 0 ? q <= mn : q <= 0; })
    .map((g) => ({ name: g.name, quantity: Number(g.quantity) || 0, unit: g.unit || '' }));
  const highFoodCost = menu.filter((m) => m.fcPct != null && m.fcPct > 35).map((m) => ({ name: m.name, fcPct: m.fcPct }));

  const liveCost = (sh) => sh.end ? (Number(sh.laborCost) || 0) : Math.round(((Date.now() - new Date(sh.start).getTime()) / 3600000) * (Number(sh.wage) || 0));
  const laborToday = shifts.filter((s) => String(s.start || '').slice(0, 10) === todayStr).reduce((a, s) => a + liveCost(s), 0);
  const openShifts = shifts.filter((s) => !s.end).length;

  const topSellers = [...menu].filter((m) => m.sold > 0).sort((a, b) => b.sold - a.sold).slice(0, 5)
    .map((m) => ({ name: m.name, sold: m.sold, revenue: m.revenue }));
  const noRecipeCount = menu.filter((m) => !m.hasRecipe).length;
  const byClass = (k) => menu.filter((m) => m.klass === k).map((m) => m.name);

  return {
    venueName: st.venueName || '',
    menuCount: items.length,
    today: { revenue: todayRevenue, orders: paidToday.length, avgTicket, tips: todayTips, laborCost: laborToday, laborPct: todayRevenue > 0 ? Math.round(laborToday / todayRevenue * 100) : 0 },
    menuEngineering: { star: byClass('star'), plowhorse: byClass('plowhorse'), puzzle: byClass('puzzle'), dog: byClass('dog') },
    highFoodCost, lowStock, topSellers, openShifts, noRecipeCount, menu,
  };
}

// باشگاهِ مشتریان + برگرداندنِ مشتری (win-back) — از سفارش‌های «شناسه‌دارِ» آنلاین (customerId).
// walk-in/صندوق (بدونِ customerId) ناشناس است و در باشگاه نمی‌آید. نام از app_users.
export async function computeDineCustomers(sub) {
  const scope = 'user:' + sub;
  const ordR = await query("SELECT data FROM documents WHERE collection='u_dine_orders' AND company=$1", [scope]);
  const orders = ordR.rows.map((r) => r.data).filter(Boolean);
  const byCust = {};
  for (const o of orders) {
    const cid = o.customerId != null ? String(o.customerId) : '';
    if (!cid) continue; // فقط مشتریِ شناسه‌دار
    const amt = Number(o.total) || 0; // فروشِ بدونِ انعام
    const when = String(o.createdAt || o.date || '');
    const c = byCust[cid] || (byCust[cid] = { orders: 0, totalSpent: 0, lastOrder: '', firstOrder: '' });
    c.orders += 1; c.totalSpent += amt;
    if (!c.lastOrder || when > c.lastOrder) c.lastOrder = when;
    if (!c.firstOrder || (when && when < c.firstOrder)) c.firstOrder = when;
  }
  const ids = Object.keys(byCust);
  const info = {};
  if (ids.length) {
    const ur = await query('SELECT id, name, username, meta FROM app_users WHERE id::text = ANY($1)', [ids]);
    for (const row of ur.rows) { const m = row.meta || {}; info[String(row.id)] = { name: row.name || m.name || row.username || ('کاربر ' + row.id), phone: m.phone || row.username || '' }; }
  }
  const now = Date.now();
  const tierOf = (spent) => spent >= 5000000 ? 'gold' : spent >= 1000000 ? 'silver' : 'bronze';
  const customers = ids.map((cid) => {
    const c = byCust[cid], nx = info[cid] || {};
    const lastMs = c.lastOrder ? new Date(c.lastOrder).getTime() : 0;
    const daysSinceLast = lastMs ? Math.floor((now - lastMs) / 86400000) : null;
    return {
      customerId: cid, name: nx.name || ('کاربر ' + cid), phone: nx.phone || '',
      orders: c.orders, totalSpent: c.totalSpent, points: Math.floor(c.totalSpent / 10000),
      tier: tierOf(c.totalSpent), lastOrder: c.lastOrder, daysSinceLast,
      atRisk: daysSinceLast != null && daysSinceLast > 21,
    };
  }).sort((a, b) => b.totalSpent - a.totalSpent);
  const summary = {
    total: customers.length,
    active: customers.filter((c) => c.daysSinceLast != null && c.daysSinceLast <= 21).length,
    atRisk: customers.filter((c) => c.atRisk).length,
    gold: customers.filter((c) => c.tier === 'gold').length,
    revenue: customers.reduce((a, c) => a + c.totalSpent, 0),
  };
  return { customers, summary };
}

// پیش‌بینیِ فروش — از تاریخچهٔ واقعیِ سفارش‌های پرداخت‌شده: سریِ ۱۴ روزه، میانگینِ هر روزِ هفته،
// پیش‌بینیِ ۷ روزِ آینده (میانگینِ همان روزِ هفته)، و ساعت‌های اوج. هیچ عددِ فیک نیست.
const WEEK_FA = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']; // getDay(): 0=یکشنبه
export async function computeDineForecast(sub) {
  const scope = 'user:' + sub;
  const ordR = await query("SELECT data FROM documents WHERE collection='u_dine_orders' AND company=$1", [scope]);
  const paid = ordR.rows.map((r) => r.data).filter((o) => o && o.paid);
  const daily = {}; const hourCount = new Array(24).fill(0);
  for (const o of paid) {
    const iso = String(o.createdAt || o.date || ''); const d = new Date(iso);
    if (isNaN(d.getTime())) continue;
    const key = iso.slice(0, 10);
    daily[key] = (daily[key] || 0) + (Number(o.total) || 0);
    hourCount[d.getHours()] += 1;
  }
  const dowTotals = [[], [], [], [], [], [], []];
  for (const [key, rev] of Object.entries(daily)) { const d = new Date(key); if (!isNaN(d.getTime())) dowTotals[d.getDay()].push(rev); }
  const dowAvg = dowTotals.map((arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0));
  const nowMs = Date.now();
  const series = [];
  for (let i = 13; i >= 0; i--) { const dt = new Date(nowMs - i * 86400000); const key = dt.toISOString().slice(0, 10); series.push({ date: key, day: WEEK_FA[dt.getDay()], revenue: daily[key] || 0 }); }
  const forecast = [];
  for (let i = 1; i <= 7; i++) { const dt = new Date(nowMs + i * 86400000); const dow = dt.getDay(); forecast.push({ date: dt.toISOString().slice(0, 10), day: WEEK_FA[dow], predicted: dowAvg[dow] }); }
  const peakHours = hourCount.map((c, h) => ({ h, c })).filter((x) => x.c > 0).sort((a, b) => b.c - a.c).slice(0, 3).map((x) => x.h);
  return {
    hasData: paid.length > 0,
    series,
    dowAvg: WEEK_FA.map((d, i) => ({ day: d, avg: dowAvg[i] })),
    forecast,
    next7Total: forecast.reduce((a, f) => a + f.predicted, 0),
    peakHours,
  };
}

// پیشنهادِ داینامیکِ قیمتِ منو — بر پایهٔ فودکاستِ واقعی + مهندسیِ منو + تقاضا. هیچ عددِ فیک نیست.
// راهبرد: آیتمِ گران‌درآمد (فودکاستِ بالاتر از هدف) → گران‌تر تا به هدف برسد؛ پرفروشِ کم‌سود →
// کمی گران‌تر (تقاضا بالاست)؛ کم‌فروشِ پرسود → کمی ارزان‌تر (تحریکِ تقاضا)؛ ضعیف → بازبینی.
const roundTo = (v, step) => Math.round(v / step) * step;
export async function computeDinePricing(sub, targetPct) {
  const ins = await computeDineInsights(sub);
  const tgt = Math.max(10, Math.min(60, Number(targetPct) || 30));
  const t = tgt / 100;
  const suggestions = [];
  for (const m of ins.menu) {
    if (m.cost == null || m.price <= 0) continue; // بدونِ رسپی، پیشنهادِ قیمت نمی‌دهیم
    const ideal = Math.max(1000, roundTo(m.cost / t, 1000)); // قیمتی که فودکاست = هدف
    let action = null, suggested = m.price, reason = '';
    if (m.fcPct > tgt + 5) {
      action = 'raise'; suggested = ideal;
      reason = `فودکاست ${m.fcPct}٪ بالاتر از هدفِ ${tgt}٪ — برای رسیدن به هدف، قیمت را افزایش بده`;
    } else if (m.klass === 'plowhorse') {
      action = 'raise'; suggested = roundTo(m.price * 1.1, 1000);
      reason = 'پرفروشِ کم‌سود — تقاضا بالاست، حدودِ ۱۰٪ گران‌تر کن';
    } else if (m.klass === 'puzzle') {
      action = 'lower'; suggested = roundTo(m.price * 0.9, 1000);
      reason = 'کم‌فروشِ پرسود — با حدودِ ۱۰٪ تخفیف، تقاضا را بالا ببر';
    } else if (m.klass === 'dog') {
      action = 'review'; suggested = m.price;
      reason = 'ضعیف (کم‌فروش و کم‌سود) — بازطراحی یا حذف';
    } else {
      continue; // ستاره/متعادل → پیشنهادی لازم نیست
    }
    const deltaPct = m.price > 0 ? Math.round((suggested - m.price) / m.price * 100) : 0;
    suggestions.push({ id: m.id, name: m.name, price: m.price, cost: m.cost, fcPct: m.fcPct, sold: m.sold, klass: m.klass, action, suggested, deltaPct, reason });
  }
  suggestions.sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));
  return { targetPct: tgt, count: suggestions.length, suggestions };
}

// تحلیلِ رقبا — منوی خودِ رستوران در برابرِ قیمتِ رقبایی که صاحب وارد کرده (dine_competitors).
// تطبیق بر اساسِ نامِ نرمال‌شده؛ برای هر آیتمِ منطبق، موقعیتِ قیمتی (ارزان‌تر/گران‌تر/رقابتی).
function normName(s) { return String(s || '').replace(/\s+/g, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/‌/g, '').trim(); }
export async function computeDineCompetitors(sub) {
  const scope = 'user:' + sub;
  const [miR, cpR] = await Promise.all([
    query("SELECT data FROM documents WHERE collection='u_menu_items' AND company=$1", [scope]),
    query("SELECT data FROM documents WHERE collection='u_dine_competitors' AND company=$1", [scope]),
  ]);
  const items = miR.rows.map((r) => r.data).filter((p) => p && p.available !== false);
  const competitors = cpR.rows.map((r) => r.data).filter(Boolean);
  // قیمتِ رقبا بر اساسِ نامِ نرمال → فهرستِ قیمت‌ها
  const compPrices = {};
  for (const c of competitors) {
    for (const it of (c.items || [])) {
      const key = normName(it.name); if (!key) continue;
      const price = Math.max(0, Math.floor(Number(it.price) || 0)); if (!price) continue;
      (compPrices[key] = compPrices[key] || []).push({ competitor: c.name || 'رقیب', price });
    }
  }
  const comparison = [];
  for (const m of items) {
    const key = normName(m.name);
    const rivals = compPrices[key] || [];
    if (!rivals.length) continue;
    const myPrice = Math.max(0, Math.floor(Number(m.priceNum) || 0));
    const avg = Math.round(rivals.reduce((a, r) => a + r.price, 0) / rivals.length);
    const diffPct = avg > 0 ? Math.round((myPrice - avg) / avg * 100) : 0;
    const position = diffPct <= -5 ? 'cheaper' : diffPct >= 5 ? 'pricier' : 'competitive';
    comparison.push({ name: m.name, myPrice, avgRival: avg, rivals: rivals.length, diffPct, position });
  }
  comparison.sort((a, b) => Math.abs(b.diffPct) - Math.abs(a.diffPct));
  const summary = {
    competitors: competitors.length,
    matched: comparison.length,
    cheaper: comparison.filter((c) => c.position === 'cheaper').length,
    pricier: comparison.filter((c) => c.position === 'pricier').length,
    competitive: comparison.filter((c) => c.position === 'competitive').length,
  };
  return { summary, comparison };
}

// تحلیلِ نظرات و رضایت — از نظرهای «واقعیِ» مشتریان (u_dine_reviews). احساسات بر پایهٔ امتیاز:
// ۴–۵ مثبت، ۳ خنثی، ۱–۲ منفی. میانگین، درصدِ رضایت، توزیع، و آخرین نظرها.
export async function computeDineReviews(sub) {
  const scope = 'user:' + sub;
  const { rows } = await query("SELECT data FROM documents WHERE collection='u_dine_reviews' AND company=$1 ORDER BY created_at DESC", [scope]);
  const reviews = rows.map((r) => r.data).filter(Boolean);
  const n = reviews.length;
  const rt = (r) => Math.max(0, Math.min(5, Math.round(Number(r.rating) || 0)));
  const avg = n ? Math.round(reviews.reduce((a, r) => a + (Number(r.rating) || 0), 0) / n * 10) / 10 : 0;
  const positive = reviews.filter((r) => rt(r) >= 4).length;
  const neutral = reviews.filter((r) => rt(r) === 3).length;
  const negative = reviews.filter((r) => rt(r) <= 2).length;
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => rt(r) === star).length }));
  const recent = reviews.slice(0, 12).map((r) => ({ user: r.user || 'کاربر', rating: rt(r), text: r.text || '', date: r.date || '', sentiment: rt(r) >= 4 ? 'positive' : rt(r) === 3 ? 'neutral' : 'negative' }));
  return { count: n, avg, positive, neutral, negative, satisfactionPct: n ? Math.round(positive / n * 100) : 0, dist, recent };
}

// نسخهٔ متنیِ فشرده برای تزریق در سیستم‌پرامپتِ چتِ ایجنتِ داین (فقط ارقامِ واقعی).
export function dineInsightsText(ins) {
  const n = (v) => (Number(v) || 0).toLocaleString('en-US');
  const L = [];
  L.push(`دادهٔ زندهٔ رستوران${ins.venueName ? ` «${ins.venueName}»` : ''} (برای مشاوره فقط از همین ارقامِ واقعی استفاده کن، عدد از خودت نساز):`);
  L.push(`- فروشِ امروز: ${n(ins.today.revenue)} تومان از ${ins.today.orders} سفارش (میانگینِ فاکتور ${n(ins.today.avgTicket)})؛ انعام ${n(ins.today.tips)}؛ هزینهٔ نیرو ${n(ins.today.laborCost)} (${ins.today.laborPct}٪ فروش).`);
  const me = ins.menuEngineering;
  L.push(`- منو: ${ins.menuCount} آیتم. مهندسیِ منو → ستاره‌ها: ${me.star.join('، ') || '—'}؛ پرفروشِ کم‌سود: ${me.plowhorse.join('، ') || '—'}؛ کم‌فروشِ پرسود: ${me.puzzle.join('، ') || '—'}؛ ضعیف: ${me.dog.join('، ') || '—'}.`);
  if (ins.topSellers.length) L.push(`- پرفروش‌ها: ${ins.topSellers.map((t) => t.name + ' (' + t.sold + ')').join('، ')}.`);
  if (ins.highFoodCost.length) L.push(`- فودکاستِ بالا (>۳۵٪): ${ins.highFoodCost.map((h) => h.name + ' ' + h.fcPct + '٪').join('، ')}.`);
  if (ins.lowStock.length) L.push(`- کمبودِ انبار: ${ins.lowStock.map((s) => s.name).join('، ')}.`);
  if (ins.noRecipeCount) L.push(`- ${ins.noRecipeCount} آیتم بدونِ رسپی‌اند (بهای تمام‌شده‌شان نامعلوم است — برای تحلیلِ دقیق‌تر رسپی تعریف شود).`);
  L.push('راهنمای مشاوره: ستاره‌ها را برجسته/تبلیغ کن؛ پرفروشِ کم‌سود را بهینه یا کمی گران‌تر کن؛ کم‌فروشِ پرسود را فعالانه پیشنهاد بده (آپ‌سل)؛ ضعیف‌ها را بازطراحی یا حذف کن؛ برای کمبودِ انبار سفارشِ خرید یادآوری کن.');
  return L.join('\n');
}
