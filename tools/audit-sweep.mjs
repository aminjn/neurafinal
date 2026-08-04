// ممیزیِ سیستماتیکِ همهٔ صفحه‌ها: هر صفحه را واقعاً در مرورگر رِندر می‌کند و «کرشِ اجرا» یا «صفحهٔ سفید»
// یا «دادهٔ فیک» را خودکار می‌گیرد. جای «تستِ دستیِ تک‌فیچری» را می‌گیرد تا هیچ صفحه‌ای اسکیپ نشود.
//
// پیش‌نیاز: dist بیلدشده (npm --prefix front run build) + Playwright + Chromium.
// اجرا:
//   node tools/audit-sweep.mjs                 # همهٔ صفحه‌ها
//   node tools/audit-sweep.mjs salesOrders     # فقط صفحه‌هایی که نامشان شامل این رشته است
// متغیرهای محیطی (اختیاری، برای محیط‌های مختلف):
//   NEURA_FRONT     مسیرِ پوشهٔ front (پیش‌فرض: ../front کنارِ همین فایل)
//   PLAYWRIGHT_JS   مسیرِ ماژولِ playwright
//   CHROMIUM_BIN    مسیرِ باینریِ Chromium
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.NEURA_FRONT || path.resolve(HERE, '../front');
const DIST = path.join(ROOT, 'dist');
const PW = process.env.PLAYWRIGHT_JS || '/opt/node22/lib/node_modules/playwright/index.js';
const CHROME = process.env.CHROMIUM_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PORT = Number(process.env.AUDIT_PORT || 8151);
const FILTER = process.argv[2] || '';
const SHOTS = path.resolve(ROOT, '..', '.audit-shots');
if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error('dist یافت نشد — اول build کنید: npm --prefix front run build'); process.exit(2); }
const __pw = await import(PW); const chromium = __pw.chromium || (__pw.default && __pw.default.chromium);
fs.mkdirSync(SHOTS, { recursive: true });
for (const d of ['assets', 'avatars', 'icons']) { try { fs.cpSync(path.join(ROOT, 'src', d), path.join(DIST, 'src', d), { recursive: true }); } catch (e) {} }

const ADMIN = ['dashboardScreen','assistantScreen','chatsScreen','crmScreen','financeScreen','reportsScreen','analyticsScreen','tasksScreen','inventoryScreen','purchaseRequestScreen',
'salesOrdersScreen','salesPosScreen','salesMenuScreen','salesInvoicesScreen','salesConversationsScreen','salesCustomersScreen','salesFunnelScreen','salesForecastScreen','salesQuickReportScreen','salesShiftScreen',
'secTodayScreen','secPlanningScreen','secCrmLiteScreen','secPerformanceScreen','secDailyFinanceScreen',
'mktConversationsScreen','mktActionsScreen','mktCrmScreen','mktLeadsScreen','mktApprovalsScreen','mktCalendarScreen','mktSegmentScreen','mktPerformanceScreen','campaignScreen',
'procOrdersScreen','procRequestsScreen','procSupplyScreen','procDeliveryScreen','procFinanceScreen','procImportScreen',
'dinePosScreen','dineMenuScreen','dineKdsScreen','dineTablesScreen','dineReservationsScreen','dineStaffScreen','dineRecipesScreen','dineReportsScreen','dineLoyaltyScreen','dineMarketingScreen','dineCompetitorsScreen','dineSettingsScreen'];
const EU = ['euHomeScreen','euAssistantScreen','euChatListScreen','euSupportScreen','euDineScreen','euMarketScreen','euCartScreen','euOrdersScreen','euOffersScreen','euPlannerScreen','euProfileScreen','euReportScreen','euSearchScreen','euAgentDiscovery'];

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const srv = http.createServer((q, s) => { let fp = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) fp = path.join(DIST, 'index.html'); fs.readFile(fp, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); s.end(d); }); });
await new Promise(r => srv.listen(PORT, r));

const b64u = (o) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const token = ['x', b64u({ sub: '1', role: 'admin', name: 'مدیر', company: 'acme' }), 'y'].join('.');

// دادهٔ واقع‌نما تا صفحه‌ها با محتوا رِندر شوند (کرش/سفیدی مستقل از داده است ولی «خالیِ بی‌دلیل» هم دیده می‌شود)
const AGENTS = [{ id: 'assistant', name: 'دستیار شخصی', role: 'دستیار', init: 'د', team: 'assistant', accent: '#7B62FC', locked: false, gender: 'f' }, { id: 'sales', name: 'فروش', role: 'فروش', init: 'ف', team: 'sales', locked: false }, { id: 'support', name: 'پشتیبانی', role: 'پشتیبانی', init: 'پ', team: 'biz', locked: false }];
const ORDERS = [
  { id: 'so_1', source: 'sales', customer: 'رضا', table: 'میز ۲', items: [{ name: 'چای', qty: 2 }], total: 50000, status: 'active', paid: false },
  { id: 'so_2', source: 'pos', customer: 'مهمان', items: [{ name: 'کیک' }], total: 120000, status: 'completed', paid: true },
  { id: 'on_1', source: 'dine', items: [{ name: 'پیتزا', qty: 1 }, { name: 'نوشابه', qty: 2 }], total: 320000, status: 'preparing', num: 1041, date: new Date().toISOString() },
  { id: 'on_2', source: 'market', items: [{ name: 'شامپو' }], total: 85000, status: 'pending', num: 1042, date: new Date().toISOString() },
];

const br = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await ctx.addInitScript(t => { try { localStorage.setItem('aw-token', t); localStorage.setItem('neura_loggedin', '1'); localStorage.setItem('neura-agent-team', 'sales'); } catch (e) {} }, token);
await ctx.route('**/api/**', async r => {
  const req = r.request(); const u = req.url(); const j = o => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(o) });
  if (u.includes('/auth/me')) return j({ user: { id: 1, name: 'مدیر', username: 'admin', role: 'admin', company: 'acme', prefs: {}, identityVerified: true } });
  if (u.includes('/agents')) return j(AGENTS);
  if (u.includes('/wallet')) return j({ balance: 1e7, tx: [], ownedAgents: ['assistant', 'sales', 'support'] });
  if (u.includes('/settings')) return j({ defaultTheme: 'light', cuisineCategories: ['ایرانی', 'فست‌فود'] });
  if (u.includes('/ai/usage')) return j({ used: 0, balance: 1e7, byAgent: {} });
  const dm = u.match(/\/data\/([a-z_]+)/i) || u.match(/\/me\/data\/([a-z_]+)/i);
  if (dm) { if (req.method() === 'POST') return j({ ok: true }); return dm[1] === 'orders' ? j(ORDERS) : j([]); }
  if (u.includes('/orders')) return j(ORDERS);
  if (u.includes('/ai/')) return j({ ok: true, text: 'ok' });
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method())) return j({ ok: true });
  return j([]);
});

const p = await ctx.newPage();
let errBuf = [];
p.on('pageerror', e => { const m = (e.message || '').split('\n')[0]; if (!/localStorage|ResizeObserver/i.test(m)) errBuf.push(m.slice(0, 160)); });
p.on('console', m => { if (m.type() === 'error') { const t = m.text(); if (/is not defined|is not a function|Cannot read|undefined is not|Minified React error/i.test(t)) errBuf.push('[console] ' + t.slice(0, 160)); } });

await p.goto('http://localhost:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
await p.waitForTimeout(1800);

// نشانه‌های دادهٔ فیک — عمداً بَجِ مجازِ «حالت دمو»/«نسخه دمو» را استثنا می‌کنیم تا false-positive نشود.
const FAKE_RE = /رستوران نمونه|فروشگاه نمونه|کاربر نمونه|lorem ipsum|example\.com|سلام دنبال چی|جان دو|John Doe/i;
const results = [];
const visit = async (kind, name) => {
  if (FILTER && !name.toLowerCase().includes(FILTER.toLowerCase())) return;
  await p.goto('http://localhost:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' }).catch(() => {}); // بازیابی از کرشِ قبلی
  await p.waitForTimeout(700);
  errBuf = [];
  const ok = await p.evaluate(({ kind, name }) => { const nav = window.__NEURA_NAV__; if (!nav) return false; if (kind === 'admin') nav.goAdmin(name); else nav.goEu(name); return true; }, { kind, name }).catch(() => false);
  if (!ok) { results.push({ name, status: 'NO-BRIDGE' }); return; }
  await p.waitForTimeout(1100);
  const info = await p.evaluate(() => ({ len: (document.body.innerText || '').replace(/\s+/g, '').length, sample: (document.body.innerText || '').slice(0, 60).replace(/\n/g, ' ') }));
  const fake = await p.evaluate((src) => { const m = (document.body.innerText || '').match(new RegExp(src, 'i')); return m ? m[0] : ''; }, FAKE_RE.source);
  let status = 'OK';
  if (errBuf.length) status = 'CRASH';
  else if (info.len < 40) status = 'BLANK';
  else if (fake) status = 'FAKE:' + fake;
  results.push({ name, status, len: info.len, err: errBuf.slice(0, 2).join(' | '), sample: info.sample });
  if (status !== 'OK') { try { await p.screenshot({ path: path.join(SHOTS, name + '.png') }); } catch (e) {} }
};

for (const s of ADMIN) await visit('admin', s);
for (const s of EU) await visit('eu', s);

// ── ChatOverlay: گفتگوی تکی و گروهی را واقعاً باز کن (کرشِ hooks/رِندر را بگیر — سوییپِ صفحه‌ها این را نمی‌گیرد) ──
const visitChat = async (label, id, meta) => {
  if (FILTER && !label.toLowerCase().includes(FILTER.toLowerCase())) return;
  await p.goto('http://localhost:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
  await p.waitForTimeout(700);
  errBuf = [];
  const ok = await p.evaluate(({ id, meta }) => { const n = window.__NEURA_NAV__; if (!n) return false; n.goEu('euChatListScreen'); if (n.openChat) { n.openChat(id, 'contact', meta); return true; } return false; }, { id, meta }).catch(() => false);
  if (!ok) { results.push({ name: label, status: 'NO-BRIDGE' }); return; }
  await p.waitForTimeout(1200);
  const len = await p.evaluate(() => (document.body.innerText || '').replace(/\s+/g, '').length);
  let status = 'OK';
  if (errBuf.length) status = 'CRASH'; else if (len < 40) status = 'BLANK';
  results.push({ name: label, status, len, err: errBuf.slice(0, 2).join(' | ') });
  if (status !== 'OK') { try { await p.screenshot({ path: path.join(SHOTS, label.replace(/[:]/g, '_') + '.png') }); } catch (e) {} }
};
await visitChat('chat:peer', 'peer_2', { name: 'رضا', init: 'ر', bg: 'bg-[#7B62FC]', sub: 'کاربر نورا' });
await visitChat('chat:group', 'pgroup_g1', { name: 'گروه تست', init: 'گ', bg: 'bg-[#7B62FC]', sub: '۳ عضو' });

await br.close(); srv.close();

const bad = results.filter(r => r.status !== 'OK');
console.log('\n===== ممیزیِ صفحه‌ها: ' + results.length + ' مورد بررسی شد، ' + bad.length + ' مشکل =====');
for (const r of bad) console.log('❌ ' + r.name.padEnd(26) + ' ' + r.status + (r.err ? '  → ' + r.err : '') + (r.status === 'BLANK' ? '  (len=' + r.len + ')' : ''));
console.log('\n--- سالم (' + (results.length - bad.length) + ') ---\n' + results.filter(r => r.status === 'OK').map(r => r.name).join(', '));
if (bad.length) { console.log('\nاسکرین‌شاتِ مشکل‌دارها: ' + SHOTS); process.exitCode = 1; }
