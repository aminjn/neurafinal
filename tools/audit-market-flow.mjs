// R19 — تستِ «کلِ پروسهٔ مارکت تا آخر» با دادهٔ واقعیِ seed‌شده: هر ۵ تبِ مارکت را می‌بیند (فروشگاه‌ها/محصول/
// سفارشات/پیشنهادها/حساب من)، بعد مسیرِ کاملِ خرید را می‌رود: افزودنِ محصول به سبد ← سبد ← پرداخت و ثبتِ
// سفارش ← دیدنِ سفارش در تبِ «سفارشات». اسکرین‌شاتِ fullPage از هر مرحله. پیش‌نیاز: سرورِ واقعی + audit-seed اجرا شده.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.NEURA_FRONT || path.resolve(HERE, '../front');
const DIST = path.join(ROOT, 'dist');
const PW = process.env.PLAYWRIGHT_JS || '/opt/node22/lib/node_modules/playwright/index.js';
const CHROME = process.env.CHROMIUM_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SERVER = process.env.SERVER_URL || 'http://127.0.0.1:4300';
const PORT = Number(process.env.AUDIT_PORT || 8170);
const SHOTS = path.resolve(ROOT, '..', '.audit-market-shots');
if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error('dist نیست — build کنید'); process.exit(2); }
const { chromium } = await (async () => { const m = await import(PW); return m.chromium ? m : m.default; })();
fs.mkdirSync(SHOTS, { recursive: true });
for (const d of ['assets', 'avatars', 'icons']) { try { fs.cpSync(path.join(ROOT, 'src', d), path.join(DIST, 'src', d), { recursive: true }); } catch (e) {} }

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const srvHost = new URL(SERVER);
const srv = http.createServer((q, s) => {
  if (q.url.startsWith('/api/')) {
    const preq = http.request({ host: srvHost.hostname, port: srvHost.port, method: q.method, path: q.url, headers: { ...q.headers, host: srvHost.host } }, (pr) => { s.writeHead(pr.statusCode || 502, pr.headers); pr.pipe(s); });
    preq.on('error', () => { if (!s.headersSent) s.writeHead(502); s.end('proxy err'); });
    q.pipe(preq); return;
  }
  let rel = decodeURIComponent(q.url.split('?')[0]);
  let fp = path.join(DIST, rel); if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) fp = path.join(DIST, 'index.html');
  fs.readFile(fp, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); s.end(d); });
});
await new Promise(r => srv.listen(PORT, r));
const BASE = 'http://localhost:' + PORT;

const token = await new Promise((res) => {
  const body = JSON.stringify({ username: process.env.AUDIT_USER || 'audituser', password: process.env.AUDIT_PASS || 'audit123' });
  const rq = http.request(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (r) => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d).token || ''); } catch (_) { res(''); } }); });
  rq.on('error', () => res('')); rq.write(body); rq.end();
});
if (!token) { console.error('login نشد'); process.exit(3); }

const br = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await ctx.addInitScript((t) => { try { localStorage.setItem('aw-token', t); localStorage.setItem('neura_loggedin', '1'); } catch (e) {} }, token);
const p = await ctx.newPage();
const log = [];
p.on('console', m => { if (m.type() === 'error' && !/favicon|React DevTools/i.test(m.text())) log.push('ERR ' + m.text().slice(0, 120)); });

const dismiss = async () => { for (let i = 0; i < 3; i++) { const c = await p.evaluate(() => { const b = [...document.querySelectorAll('button,[role="button"],.cursor-pointer')].find(x => /^(بعدا|بعداً|باشه|بستن|رد کردن|فهمیدم|متوجه شدم)$/.test((x.innerText || '').trim()) && x.offsetParent !== null); if (b) { b.click(); return true; } return false; }).catch(() => false); if (!c) await p.keyboard.press('Escape').catch(() => {}); await p.waitForTimeout(200); } };
const scrollAll = async () => { await p.evaluate(async () => { const el = [...document.querySelectorAll('*')].find(e => e.scrollHeight > e.clientHeight + 80 && /auto|scroll/.test(getComputedStyle(e).overflowY)) || document.scrollingElement; const step = Math.max(200, el.clientHeight - 60); for (let y = 0; y <= el.scrollHeight; y += step) { el.scrollTop = y; await new Promise(r => setTimeout(r, 80)); } el.scrollTop = 0; }).catch(() => {}); };
const shot = async (name) => { await scrollAll(); await p.waitForTimeout(150); try { await p.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: true }); } catch (e) {} };
const clickText = (t) => p.evaluate((t) => { const el = [...document.querySelectorAll('button,[role="tab"],[role="button"],.cursor-pointer,a')].find(e => ((e.innerText || '').trim().split('\n')[0] || '').includes(t) && e.offsetParent !== null); if (el) { el.scrollIntoView({ block: 'center' }); el.click(); return true; } return false; }, t).catch(() => false);
const goEu = (name) => p.evaluate((n) => { const nav = window.__NEURA_NAV__; if (nav) nav.goEu(n); }, name).catch(() => {});
const balance = () => p.evaluate(async () => { try { const r = await fetch('/api/wallet', { headers: { Authorization: 'Bearer ' + localStorage.getItem('aw-token') } }); const j = await r.json(); return j.balance != null ? j.balance : (j.wallet && j.wallet.balance); } catch (_) { return null; } });
const orderCount = () => p.evaluate(async () => { try { const r = await fetch('/api/shop/orders', { headers: { Authorization: 'Bearer ' + localStorage.getItem('aw-token') } }); const j = await r.json(); return Array.isArray(j) ? j.length : 0; } catch (_) { return -1; } });

await p.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
await p.waitForTimeout(1800); await dismiss();

// ── ۱) پیمایشِ هر ۵ تبِ مارکت با دادهٔ واقعی ──
const TABS = [['فروشگاه‌ها', 'shops'], ['محصول', 'catalog'], ['سفارشات', 'orders'], ['پیشنهادها', 'deals'], ['حساب من', 'account']];
await goEu('euMarketScreen'); await p.waitForTimeout(900); await dismiss();
const tabReport = [];
for (const [label, key] of TABS) {
  await clickText(label); await p.waitForTimeout(700);
  const txt = await p.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 300));
  await shot('mkt_' + key);
  tabReport.push({ key, label, textLen: txt.length, sample: txt.slice(0, 120) });
  console.log('TAB ' + key.padEnd(9) + ' → ' + txt.slice(0, 80).replace(/\n/g, ' '));
}

// ── ۲) مسیرِ کاملِ خرید: افزودن به سبد ← سبد ← پرداخت ← سفارشات ──
const balBefore = await balance(); const ordBefore = await orderCount();
await goEu('euMarketScreen'); await p.waitForTimeout(600); await dismiss();
await clickText('محصول'); await p.waitForTimeout(700);
let added = 0;
for (let i = 0; i < 2; i++) { if (await clickText('افزودن')) { added++; await p.waitForTimeout(500); } }
await shot('mkt_after_add');
await goEu('euCartScreen'); await p.waitForTimeout(900); await dismiss(); await shot('mkt_cart');
await clickText('خانهٔ من'); await p.waitForTimeout(400); // انتخابِ آدرسِ تحویلِ اجباری
const paid = await clickText('پرداخت و ثبت سفارش'); await p.waitForTimeout(2200); await dismiss(); await shot('mkt_checkout_result');
const balAfter = await balance(); const ordAfter = await orderCount();
await goEu('euMarketScreen'); await p.waitForTimeout(600); await dismiss(); await clickText('سفارشات'); await p.waitForTimeout(700); await shot('mkt_orders_after');

const result = { tabs: tabReport, purchase: { added, paidClicked: paid, balBefore, balAfter, spent: (balBefore != null && balAfter != null) ? balBefore - balAfter : null, ordBefore, ordAfter, newOrders: (ordAfter >= 0 && ordBefore >= 0) ? ordAfter - ordBefore : null }, errors: log.slice(0, 5) };
fs.writeFileSync(path.resolve(ROOT, '..', '.audit-market-flow.json'), JSON.stringify(result, null, 2));
console.log('\n===== نتیجهٔ خریدِ واقعی =====');
console.log(JSON.stringify(result.purchase, null, 2));
if (log.length) console.log('خطاها:', log.slice(0, 5));
await br.close(); srv.close();
