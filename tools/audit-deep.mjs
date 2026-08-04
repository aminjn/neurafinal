// ممیزیِ عمیقِ «واقعی»: برخلافِ سوییپِ ساده، این ابزار روی «سرورِ واقعی + دیتابیسِ واقعی» اجرا می‌شود
// (نه stubِ فیک) و برای هر صفحه:
//   • هر دکمه/تب/لینک را واقعاً کلیک می‌کند و «دکمهٔ مرده/کارنکن» را پیدا می‌کند (هیچ اثری: نه شبکه، نه
//     تغییرِ DOM، نه ناوبری).
//   • خطاهای واقعیِ شبکه (۴۰۴/۵۰۰) و کنسول را per-screen ثبت می‌کند.
//   • «فیک» را رفتاری می‌گیرد: صفحه‌ای که ردیفِ داده نشان می‌دهد ولی هیچ درخواستِ /api نزده = هاردکد.
//   • تب‌ها را عوض و کرش/سفیدی را می‌سنجد.
// پیش‌نیاز: سرورِ واقعیِ Node روی SERVER_URL بالا باشد و dist بیلد شده باشد. (اسکریپتِ run-deep-audit.sh
// این‌ها را مدیریت می‌کند.)
//
// اجرا:  node tools/audit-deep.mjs [filter]
// env:  SERVER_URL (پیش‌فرض http://127.0.0.1:4300) ، AUDIT_USER/AUDIT_PASS برای login
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.NEURA_FRONT || path.resolve(HERE, '../front');
// حالت: main = اپِ کاربر/کسب‌وکار ، admin = پنلِ سوپرادمین (اپِ جدا زیرِ front/admin ، base=/admin/)
const MODE = process.env.APP === 'admin' ? 'admin' : 'main';
const DIST = MODE === 'admin' ? path.join(ROOT, 'admin', 'dist') : path.join(ROOT, 'dist');
const TOKEN_KEY = MODE === 'admin' ? 'aw-admin-token' : 'aw-token';
const INDEX = MODE === 'admin' ? '/admin/index.html' : '/index.html';
// صفحه‌های سوپرادمین (کلیدهای منو)
const ADMIN_KEYS = ['data.home','data.users','data.agents','data.businesses','data.chats','data.customers','data.transactions','data.wallets','data.invoices','agents.secretary','agents.marketer','agents.finance','agents.procurement','agents.cashier','support.tickets','support.qc','support.contact','support.rss','panel.ai','panel.voip','panel.tracker','panel.plans','panel.settings','panel.appearance','panel.languages','panel.config','super.roles','super.admins','super.logs'];
const PW = process.env.PLAYWRIGHT_JS || '/opt/node22/lib/node_modules/playwright/index.js';
const CHROME = process.env.CHROMIUM_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SERVER = process.env.SERVER_URL || 'http://127.0.0.1:4300';
const PORT = Number(process.env.AUDIT_PORT || 8160);
const FILTER = process.argv[2] || '';
// فیلترِ کاما-جدا برای اجرای تکه‌ای. اگر ترم با * تمام شود = پیشوندی؛ وگرنه تطبیقِ دقیق (بدونِ هم‌پوشانی).
const FILTERS = FILTER.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const matchFilter = (name) => { if (!FILTERS.length) return true; const n = name.toLowerCase(); return FILTERS.some(f => f.endsWith('*') ? n.startsWith(f.slice(0, -1)) : n === f); };
const MAX_BTN = Number(process.env.MAX_BTN || 60);        // سقفِ دکمه در هر صفحه (بالا بردیم تا تبِ زیرِ فولد جا نیفتد)
const SHOTS = path.resolve(ROOT, '..', '.audit-deep-shots');
const REPORT = process.env.AUDIT_REPORT || path.resolve(ROOT, '..', '.audit-deep-report' + (MODE === 'admin' ? '-admin' : '') + '.json');
if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error('dist نیست — build کنید'); process.exit(2); }
const { chromium } = await (async () => { const m = await import(PW); return m.chromium ? m : m.default; })();
fs.mkdirSync(SHOTS, { recursive: true });
for (const d of ['assets', 'avatars', 'icons']) { try { fs.cpSync(path.join(ROOT, 'src', d), path.join(DIST, 'src', d), { recursive: true }); } catch (e) {} }

const ADMIN = ['dashboardScreen','assistantScreen','chatsScreen','crmScreen','financeScreen','reportsScreen','analyticsScreen','tasksScreen','inventoryScreen','purchaseRequestScreen','salesOrdersScreen','salesPosScreen','salesMenuScreen','salesInvoicesScreen','salesConversationsScreen','salesCustomersScreen','salesFunnelScreen','salesForecastScreen','salesQuickReportScreen','salesShiftScreen','secTodayScreen','secPlanningScreen','secCrmLiteScreen','secPerformanceScreen','secDailyFinanceScreen','mktConversationsScreen','mktActionsScreen','mktCrmScreen','mktLeadsScreen','mktApprovalsScreen','mktCalendarScreen','mktSegmentScreen','mktPerformanceScreen','campaignScreen','procOrdersScreen','procRequestsScreen','procSupplyScreen','procDeliveryScreen','procFinanceScreen','procImportScreen','dinePosScreen','dineMenuScreen','dineKdsScreen','dineTablesScreen','dineReservationsScreen','dineStaffScreen','dineRecipesScreen','dineReportsScreen','dineLoyaltyScreen','dineMarketingScreen','dineCompetitorsScreen','dineSettingsScreen'];
const EU = ['euHomeScreen','euAssistantScreen','euChatListScreen','euSupportScreen','euDineScreen','euMarketScreen','euCartScreen','euOrdersScreen','euOffersScreen','euPlannerScreen','euProfileScreen','euReportScreen','euSearchScreen','euAgentDiscovery'];

// ── سرورِ استاتیکِ dist + پراکسیِ /api → سرورِ واقعی (هم‌مبدأ‌سازی تا اپ با بک‌اندِ واقعی حرف بزند) ──
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const srvHost = new URL(SERVER);
const srv = http.createServer((q, s) => {
  if (q.url.startsWith('/api/')) {
    const preq = http.request({ host: srvHost.hostname, port: srvHost.port, method: q.method, path: q.url, headers: { ...q.headers, host: srvHost.host } }, (pr) => { s.writeHead(pr.statusCode || 502, pr.headers); pr.pipe(s); });
    preq.on('error', () => { if (!s.headersSent) s.writeHead(502); s.end('proxy err'); });
    q.pipe(preq); return;
  }
  let rel = decodeURIComponent(q.url.split('?')[0]);
  if (MODE === 'admin' && rel.startsWith('/admin/')) rel = rel.slice('/admin'.length); // base=/admin/ را بردار
  let fp = path.join(DIST, rel); if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) fp = path.join(DIST, 'index.html');
  fs.readFile(fp, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); s.end(d); });
});
await new Promise(r => srv.listen(PORT, r));
const BASE = 'http://localhost:' + PORT;

// login نزدِ سرورِ واقعی (از طریقِ پراکسی) برای گرفتنِ توکنِ واقعی
const token = await new Promise((res) => {
  const body = JSON.stringify({ username: process.env.AUDIT_USER || 'audituser', password: process.env.AUDIT_PASS || 'audit123' });
  const rq = http.request(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (r) => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d).token || ''); } catch (_) { res(''); } }); });
  rq.on('error', () => res('')); rq.write(body); rq.end();
});
if (!token) { console.error('login نشد — سرورِ واقعی/کاربر را چک کنید'); process.exit(3); }

const br = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await ctx.addInitScript(({ t, k }) => { try { localStorage.setItem(k, t); localStorage.setItem('neura_loggedin', '1'); } catch (e) {} }, { t: token, k: TOKEN_KEY });

const p = await ctx.newPage();
let consoleErrs = [], netFails = [], apiHits = [];
p.on('pageerror', e => { const m = (e.message || '').split('\n')[0]; if (!/localStorage|ResizeObserver/i.test(m)) consoleErrs.push('PAGEERROR ' + m.slice(0, 150)); });
p.on('console', m => { if (m.type() === 'error') { const t = m.text(); if (!/favicon|Download the React/i.test(t)) consoleErrs.push(t.slice(0, 150)); } });
p.on('response', r => { const u = r.url(); if (u.includes('/api/')) { apiHits.push(u); const st = r.status(); if (st >= 400) netFails.push(st + ' ' + u.replace(BASE, '').slice(0, 80)); } });
p.on('requestfailed', r => { const u = r.url(); if (u.includes('/api/')) netFails.push('FAIL ' + u.replace(BASE, '').slice(0, 80)); });

await p.goto(BASE + INDEX, { waitUntil: 'domcontentloaded' }).catch(() => {});
await p.waitForTimeout(1800);

// R18: هشِ چگال (هر نویسه) + اثرِ انگشتِ «انتخابِ تب» (aria-selected + استایلِ فعال) تا سوییچِ تبی که فقط
// رنگ/حالتش عوض می‌شود (مثلِ تبِ خالیِ پیشنهادها) به‌غلط «مرده» گزارش نشود — مشکلِ نمونه‌گیریِ هر ۷ نویسه رفع شد.
const bodyHash = () => p.evaluate(() => {
  const s = document.body.innerHTML; let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  const sel = [...document.querySelectorAll('[aria-selected="true"],[data-state="active"],[aria-current]')].map(e => (e.className || '') + ':' + (e.textContent || '').slice(0, 12)).join('|');
  return h + ':' + s.length + ':' + sel;
});
const curScreen = () => p.evaluate(() => { try { return JSON.stringify({ a: (window.__NEURA_STATE__ && window.__NEURA_STATE__.adminScreen) || '', e: (window.__NEURA_STATE__ && window.__NEURA_STATE__.euScreen) || '', u: location.hash }); } catch (_) { return ''; } });
const gotoScreen = async (kind, name) => {
  await p.evaluate(({ kind, name }) => {
    if (kind === 'super') { const a = window.__ADMIN_NAV__; if (a) a.go(name); return; }
    const n = window.__NEURA_NAV__; if (n) kind === 'admin' ? n.goAdmin(name) : n.goEu(name);
  }, { kind, name }).catch(() => {});
  await p.waitForTimeout(650);
};

const report = [];
const auditScreen = async (kind, name) => {
  if (!matchFilter(name)) return;
  await p.goto(BASE + INDEX, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await p.waitForTimeout(500);
  consoleErrs = []; netFails = []; apiHits = [];
  await gotoScreen(kind, name);
  await p.waitForTimeout(900);
  const loadErrs = [...consoleErrs]; const loadNetFails = [...netFails]; const loadApiHits = apiHits.length;
  const blank = await p.evaluate(() => (document.body.innerText || '').replace(/\s+/g, '').length < 40);
  // تشخیصِ فیکِ رفتاری: ردیفِ دادهٔ لیستی دارد ولی هیچ /api نزده؟
  const dataRows = await p.evaluate(() => {
    const cards = document.querySelectorAll('[class*="rounded"] , li, tr');
    let n = 0; cards.forEach(c => { const t = (c.textContent || '').trim(); if (t.length > 8 && /[۰-۹0-9]/.test(t)) n++; }); return n;
  });
  const fakeSuspect = loadApiHits === 0 && dataRows >= 6;

  // R18: مودالِ مسدودکننده (مثلِ «دسترسی به میکروفون/دوربین») را ببند وگرنه backdrop-blurِ آن کلِ صفحه را
  // تار/پوشیده می‌کند و اسکرین‌شات ناخواناست — علتِ اصلیِ «نمی‌بینم»ِ تب‌های خانه همین بود.
  const dismissOverlay = async () => {
    for (let i = 0; i < 3; i++) {
      const closed = await p.evaluate(() => {
        const btns = [...document.querySelectorAll('button,[role="button"],.cursor-pointer')];
        const hit = btns.find(b => { const t = (b.innerText || b.getAttribute('aria-label') || '').trim(); return b.offsetParent !== null && /^(بعدا|بعداً|بعد|باشه|فهمیدم|رد کردن|بستن|انصراف|رد|متوجه شدم|بعداً یادآوری کن)$/.test(t); });
        if (hit) { hit.click(); return true; }
        return false;
      }).catch(() => false);
      if (!closed) { await p.keyboard.press('Escape').catch(() => {}); }
      await p.waitForTimeout(220);
      const stillBlocked = await p.evaluate(() => /میکروفون|دوربین|دسترسی به/.test((document.body.innerText || ''))).catch(() => false);
      if (!stillBlocked && !closed) break;
    }
  };
  await dismissOverlay();
  // پرونده را «همین‌جا» (صفحهٔ تازه‌لود، بدونِ منوی باز) بگیر — نه بعد از کلیک‌ها (وگرنه مودالِ باز روی عکس می‌افتد).
  const visibleText = await p.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 700));
  // R18: کلِ صفحه را از بالا تا پایین اسکرول کن (لود لِیزی/پدیدارشدنِ تبِ زیرِ فولد) تا هیچ بخشی جا نماند.
  await p.evaluate(async () => {
    const sc = document.scrollingElement || document.body;
    const inner = [...document.querySelectorAll('*')].find(e => e.scrollHeight > e.clientHeight + 80 && /auto|scroll/.test(getComputedStyle(e).overflowY));
    const el = inner || sc;
    const step = Math.max(200, el.clientHeight - 60);
    for (let y = 0; y <= el.scrollHeight; y += step) { el.scrollTop = y; await new Promise(r => setTimeout(r, 90)); }
    el.scrollTop = 0; await new Promise(r => setTimeout(r, 120));
  }).catch(() => {});
  // R18: اسکرین‌شاتِ fullPage (نه فقط ۸۴۴px نخست) + یک پاسِ دوم در عرضِ دسکتاپ ۱۰۲۴ تا لِی‌اوتِ رِسپانسیو هم دیده شود.
  const shot = (MODE === 'admin' ? 'sa_' : '') + name + '.png';
  try { await p.screenshot({ path: path.join(SHOTS, shot), fullPage: true }); } catch (e) {}
  const shotWide = (MODE === 'admin' ? 'sa_' : '') + name + '.wide.png';
  try {
    await p.setViewportSize({ width: 1024, height: 900 }); await p.waitForTimeout(350);
    await p.screenshot({ path: path.join(SHOTS, shotWide), fullPage: true });
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(250);
  } catch (e) {}

  // فهرستِ دکمه‌ها/تب‌ها — یکتا. R18: کارت‌های چندخطیِ خانه (لیبل+زیرلیبل+قیمت) قبلاً به‌خاطرِ سقفِ ۴۰
  // نویسه دور ریخته می‌شدند؛ حالا «خطِ نخست» را برچسب می‌گیریم و سقف را ۸۰ گذاشتیم تا هیچ تب/کارتی جا نماند.
  const labels = await p.evaluate((MAX) => {
    const out = []; const seen = new Set();
    const els = [...document.querySelectorAll('button,[role="tab"],[role="button"],a[href],.cursor-pointer')];
    for (const e of els) {
      if (e.offsetParent === null) continue; // نامرئی
      const raw = (e.innerText || e.getAttribute('aria-label') || e.getAttribute('title') || '').trim();
      const t = (raw.split('\n')[0] || raw).trim().replace(/\s+/g, ' ').slice(0, 80); // خطِ نخستِ کارتِ چندخطی
      if (!t || seen.has(t)) continue;
      if (/خانه|گفتگو|پروفایل|فروشگاه|سفارش‌ها|بیشتر|منو/.test(t) && e.closest('nav')) continue; // ناوبریِ سراسری
      seen.add(t); out.push(t);
      if (out.length >= MAX) break;
    }
    return out;
  }, MAX_BTN);

  const clickByLabel = (label) => p.evaluate((label) => {
    // همان نرمال‌سازیِ فهرست‌گیری: خطِ نخست، برشِ ۸۰ — تا کارتِ چندخطی هم پیدا شود.
    const norm = (e) => { const raw = (e.innerText || e.getAttribute('aria-label') || e.getAttribute('title') || '').trim(); return (raw.split('\n')[0] || raw).trim().replace(/\s+/g, ' ').slice(0, 80); };
    const els = [...document.querySelectorAll('button,[role="tab"],[role="button"],a[href],.cursor-pointer')];
    const el = els.find(e => norm(e) === label && e.offsetParent !== null);
    if (el) { el.scrollIntoView({ block: 'center' }); el.click(); return true; } return false;
  }, label).catch(() => false);

  const tryClick = async (label) => {
    consoleErrs = [];
    const before = await bodyHash(); const beforeApi = apiHits.length;
    const clicked = await clickByLabel(label);
    if (!clicked) return { found: false };
    await p.waitForTimeout(480);
    if (consoleErrs.length) return { found: true, crash: consoleErrs[0] };
    const after = await bodyHash(); const afterApi = apiHits.length;
    return { found: true, changed: (after !== before) || (afterApi > beforeApi) };
  };

  const dead = []; const crashed = [];
  for (const label of labels) {
    await gotoScreen(kind, name); await p.waitForTimeout(220);
    const r1 = await tryClick(label);
    if (!r1.found) continue;
    if (r1.crash) { crashed.push({ label, err: r1.crash }); continue; }
    if (r1.changed) continue; // کاری کرد → سالم
    // «بدونِ اثر» → دوباره با «تلنگرِ حالت» بررسی کن: اول یک المانِ دیگر را بزن (تغییرِ وضعیت)، بعد دوباره این را.
    // این‌طور «تبِ ازقبل‌فعال» (که اثری ندارد چون فعال است) با «دکمهٔ واقعاً مرده» اشتباه نمی‌شود.
    const other = labels.find((l) => l !== label);
    await gotoScreen(kind, name); await p.waitForTimeout(220);
    if (other) { await clickByLabel(other); await p.waitForTimeout(400); }
    // R18: اگر «تلنگر» ما را به صفحهٔ دیگری بُرد (مثلاً other=جستجو)، به صفحهٔ هدف برگرد تا کلیکِ دوباره روی
    // خودِ همان دکمه انجام شود؛ وگرنه دکمه پیدا نمی‌شود و به‌غلط «مرده» ثبت می‌شد.
    const scNow = await curScreen();
    if (!scNow.includes(name)) { await gotoScreen(kind, name); await p.waitForTimeout(300); if (other) { /* در همان صفحه یک تبِ دیگر را بزن */ } }
    const r2 = await tryClick(label);
    if (r2.crash) { crashed.push({ label, err: r2.crash }); continue; }
    // فقط وقتی «مرده» بگو که دکمه هنوز حاضر باشد ولی هیچ اثری نداشته باشد. اگر اصلاً پیدا نشد (found=false)
    // احتمالاً ناوبری جابه‌جامان کرده — مرده حساب نکن (جلوگیری از false-positive).
    if (r2.found && !r2.changed) dead.push(label);
  }

  const status = crashed.length ? 'CRASH' : (blank ? 'BLANK' : (dead.length ? 'DEAD-BTNS' : (loadNetFails.length ? 'NET-ERR' : (fakeSuspect ? 'FAKE?' : 'OK'))));
  const rec = { mode: MODE, screen: name, status, buttons: labels.length, dead, crashed, loadErrs: loadErrs.slice(0, 3), netFails: loadNetFails.slice(0, 5), apiHits: loadApiHits, dataRows, fakeSuspect, visibleText, shot };
  report.push(rec);
  const flag = status === 'OK' ? '✅' : '⚠️';
  console.log(`${flag} ${name.padEnd(24)} ${status.padEnd(10)} btns:${labels.length} dead:${dead.length} netErr:${loadNetFails.length} api:${loadApiHits}${dead.length ? '  مرده: ' + dead.slice(0, 5).join(' | ') : ''}${crashed.length ? '  کرش: ' + crashed[0].label : ''}`);
};

if (MODE === 'admin') { for (const k of ADMIN_KEYS) await auditScreen('super', k); }
else { for (const s of ADMIN) await auditScreen('admin', s); for (const s of EU) await auditScreen('eu', s); }
await br.close(); srv.close();

fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
const bad = report.filter(r => r.status !== 'OK');
console.log('\n===== ممیزیِ عمیق: ' + report.length + ' صفحه، ' + bad.length + ' نیازمندِ توجه =====');
const byKind = {}; for (const r of bad) byKind[r.status] = (byKind[r.status] || 0) + 1;
console.log('خلاصه:', JSON.stringify(byKind));
console.log('کلِ دکمه‌های مرده:', report.reduce((a, r) => a + r.dead.length, 0));
console.log('گزارشِ کامل:', REPORT, '| اسکرین‌شات‌ها:', SHOTS);
if (bad.length) process.exitCode = 1;
