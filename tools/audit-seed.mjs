// R19 — بذرِ دادهٔ تستِ «واقعی» برای موتورِ ممیزی: یک فروشنده (فروشگاه) + محصولاتِ موجود + پیشنهاد/دسته +
// یک رستوران (داین) + منو، و شارژِ کیفِ‌پولِ خریدار. تا کلِ پروسهٔ مارکت/داین «تا آخر» با دادهٔ واقعی تست شود
// (نه صفحهٔ خالی). بازتولیدپذیر (idempotent) و مستقل. نیازمندِ DATABASE_URL (همان که run-deep-audit صادر می‌کند).
//
// اجرا:  DATABASE_URL=... node tools/audit-seed.mjs
import { query, pool } from '../server/src/db.js';

const BUYER = process.env.AUDIT_USER || 'audituser';
const SELLER_USER = 'audiseller';
const SHOP_NAME = 'فروشگاهِ نمونهٔ نئورا';
const REST_USER = 'audirest';
const REST_NAME = 'رستورانِ نمونهٔ نئورا';

// قیمت‌ها ASCII باشند (مَپِ فرانت با replace(/[^0-9]/g) رقمِ فارسی را هم پاک می‌کند؛ نمایش خودش fa می‌کند).
const PRODUCTS = [
  { id: 'p1', name: 'هدفون بلوتوث نئورا',   quantity: 25, salePrice: '1250000', purchasePrice: '900000',  category: 'electronics', unit: 'عدد', minStock: 5 },
  { id: 'p2', name: 'ماوس بی‌سیم پرو',       quantity: 40, salePrice: '650000',  purchasePrice: '420000',  category: 'electronics', unit: 'عدد', minStock: 8 },
  { id: 'p3', name: 'کیبورد مکانیکال RGB',   quantity: 15, salePrice: '2100000', purchasePrice: '1500000', category: 'electronics', unit: 'عدد', minStock: 4 },
  { id: 'p4', name: 'قهوهٔ ترکِ ۲۵۰ گرمی',   quantity: 60, salePrice: '320000',  purchasePrice: '210000',  category: 'grocery',     unit: 'بسته', minStock: 10 },
  { id: 'p5', name: 'تیشرتِ نخیِ یقه‌گرد',    quantity: 35, salePrice: '480000',  purchasePrice: '300000',  category: 'fashion',     unit: 'عدد', minStock: 6 },
];

const MARKET_CATEGORIES = [
  { id: 'electronics', label: 'دیجیتال',  icon: 'fa-solid fa-laptop' },
  { id: 'grocery',     label: 'خواروبار', icon: 'fa-solid fa-basket-shopping' },
  { id: 'fashion',     label: 'پوشاک',    icon: 'fa-solid fa-shirt' },
];
const MARKET_OFFERS = [
  { id: 'of1', title: 'تخفیفِ تابستانهٔ دیجیتال', desc: 'روی همهٔ کالاهای الکترونیک', discount: 20, code: 'SUMMER20', shop: SHOP_NAME, validUntil: '۱۴۰۴/۰۶/۳۱', color: '#F59E0B', icon: 'fa-solid fa-gift' },
  { id: 'of2', title: 'ارسالِ رایگانِ خواروبار',   desc: 'سفارشِ بالای ۵۰۰ هزار تومان',  discount: 10, code: 'FREESHIP', shop: SHOP_NAME, validUntil: '۱۴۰۴/۰۵/۱۵', color: '#8B5CF6', icon: 'fa-solid fa-truck' },
  { id: 'od1', title: 'پیتزا یکی بخر دوتا ببر', desc: 'ویژهٔ آخرِ هفته', discount: 50, code: 'PIZZA2X', restaurant: REST_NAME, source: 'dine', validUntil: '۱۴۰۴/۰۵/۱۰', color: '#14b8a6', icon: 'fa-solid fa-pizza-slice' },
];

const MENU_CATS = [
  { id: 'mc1', name: 'پیش‌غذا', order: 1 },
  { id: 'mc2', name: 'غذای اصلی', order: 2 },
  { id: 'mc3', name: 'نوشیدنی', order: 3 },
];
const MENU_ITEMS = [
  { id: 'mi1', name: 'سالادِ سزار',      categoryId: 'mc1', priceNum: 320000, price: '۳۲۰٬۰۰۰', available: true },
  { id: 'mi2', name: 'جوجه‌کبابِ ویژه',  categoryId: 'mc2', priceNum: 890000, price: '۸۹۰٬۰۰۰', available: true },
  { id: 'mi3', name: 'پیتزا مخصوص',      categoryId: 'mc2', priceNum: 720000, price: '۷۲۰٬۰۰۰', available: true },
  { id: 'mi4', name: 'نوشابهٔ خانواده',  categoryId: 'mc3', priceNum: 90000,  price: '۹۰٬۰۰۰',  available: true },
];

async function upsertDoc(collection, id, company, data) {
  await query(
    `INSERT INTO documents (collection, id, company, data) VALUES ($1,$2,$3,$4::jsonb)
     ON CONFLICT (collection, id) DO UPDATE SET data = $4::jsonb, updated_at = now()`,
    [collection, id, company, JSON.stringify(data)]
  );
}

async function ensureUser(username, name, meta) {
  const ex = await query('SELECT id FROM app_users WHERE username = $1', [username]);
  if (ex.rows[0]) {
    await query('UPDATE app_users SET meta = $2::jsonb WHERE id = $1', [ex.rows[0].id, JSON.stringify(meta)]);
    return ex.rows[0].id;
  }
  const ins = await query(
    `INSERT INTO app_users (username, password_hash, name, role, status, meta)
     VALUES ($1, '!seed-no-login', $2, 'user', 'active', $3::jsonb) RETURNING id`,
    [username, name, JSON.stringify(meta)]
  );
  return ins.rows[0].id;
}

// ── فروشنده (فروشگاه) ──
const sellerId = await ensureUser(SELLER_USER, SHOP_NAME, { ownedAgents: ['sales'], wallet: { balance: 0, tx: [] } });
await upsertDoc('u_businesses', 'biz_' + sellerId, 'user:' + sellerId, { id: 'biz_' + sellerId, name: SHOP_NAME });
for (const p of PRODUCTS) {
  await upsertDoc('u_proc_inventory', sellerId + '__' + p.id, 'user:' + sellerId,
    { ...p, shopName: SHOP_NAME, status: (p.quantity <= (p.minStock || 0) ? 'low' : 'sufficient'), description: p.name });
}

// ── رستوران (داین) ──
const restId = await ensureUser(REST_USER, REST_NAME, { ownedAgents: ['dine'], agentGrants: { dine: { active: true } }, wallet: { balance: 0, tx: [] } });
await upsertDoc('u_dine_settings', 'set_' + restId, 'user:' + restId,
  { venueName: REST_NAME, venueType: 'رستوران', published: true, address: 'تهران، خیابانِ نمونه', taxPct: 9, serviceChargePct: 10, orderTypes: { dinein: true, takeout: true, delivery: true }, menuTheme: 'modern', primaryColor: '#14b8a6' });
for (const c of MENU_CATS) await upsertDoc('u_menu_categories', restId + '__' + c.id, 'user:' + restId, c);
for (const m of MENU_ITEMS) await upsertDoc('u_menu_items', restId + '__' + m.id, 'user:' + restId, m);

// ── تنظیماتِ سوپرادمین: پیشنهادها + دسته‌ها (سیم‌کشیِ R17) ──
const s = await query('SELECT data FROM settings WHERE id = 1');
const sd = (s.rows[0] && s.rows[0].data) || {};
sd.marketOffers = MARKET_OFFERS;
sd.marketCategories = MARKET_CATEGORIES;
if (s.rows[0]) await query('UPDATE settings SET data = $1::jsonb WHERE id = 1', [JSON.stringify(sd)]);
else await query("INSERT INTO settings (id, data) VALUES (1, $1::jsonb)", [JSON.stringify(sd)]);

// ── خریدار: کیفِ‌پول شارژ + یک آدرسِ تحویل (چون تسویه آدرس را اجباری می‌خواهد؛ R19: کلِ پروسه) ──
await query(
  `UPDATE app_users SET meta = jsonb_set(coalesce(meta,'{}'::jsonb), '{wallet}', '{"balance":50000000,"tx":[]}'::jsonb) WHERE username = $1`,
  [BUYER]);
const buyer = await query('SELECT id FROM app_users WHERE username = $1', [BUYER]);
if (buyer.rows[0]) {
  const bid = buyer.rows[0].id;
  await upsertDoc('u_addresses', bid + '__addr_seed', 'user:' + bid,
    { id: 'addr_seed', title: 'خانهٔ من', address: 'تهران، خیابانِ نمونه، پلاک ۱۰', text: 'تهران، خیابانِ نمونه، پلاک ۱۰', plate: '۱۰', unit: '۳', icon: 'fa-solid fa-location-dot' });
}

console.log(JSON.stringify({ ok: true, sellerId, restId, products: PRODUCTS.length, menuItems: MENU_ITEMS.length, offers: MARKET_OFFERS.length }));
await pool.end();
