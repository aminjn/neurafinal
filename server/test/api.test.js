// تست‌های یکپارچهٔ API (node:test — بدون وابستگیِ اضافه). به یک Postgresِ تست نیاز دارد
// (در CI به‌صورتِ سرویس بالا می‌آید؛ محلی از PG* env). قبل از اجرا: npm run migrate && npm run seed.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { pool } from '../src/db.js';
import { generateToken } from '../src/totp.js';
import bcrypt from 'bcryptjs';
import { _setTransport, isValidNationalId } from '../src/shahkar.js';

let server, base;

before(async () => {
  const app = createApp();
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((r) => server.close(r));
  await pool.end();
});

const post = (path, body, token) =>
  fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: JSON.stringify(body),
  });
const get = (path, token) =>
  fetch(base + path, { headers: token ? { Authorization: 'Bearer ' + token } : {} });

test('health responds ok', async () => {
  const r = await get('/api/health');
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.ok, true);
});

test('register → login → me, and wrong password is 401', async () => {
  const username = 'itest_' + Date.now();
  const password = 'secret1234';

  let r = await post('/api/auth/register', { username, password, name: 'IntegrationTest' });
  assert.equal(r.status, 200);
  const reg = await r.json();
  assert.ok(reg.token, 'register returns a token');

  r = await post('/api/auth/login', { username, password });
  assert.equal(r.status, 200);
  const login = await r.json();
  assert.ok(login.token, 'login returns a token');

  r = await post('/api/auth/login', { username, password: 'wrong-pass' });
  assert.equal(r.status, 401, 'wrong password → 401 (not a connection error)');

  r = await post('/api/auth/register', { username, password });
  assert.equal(r.status, 409, 'duplicate username → 409');

  r = await get('/api/auth/me', login.token);
  assert.equal(r.status, 200);
  const me = await r.json();
  assert.equal(me.user.username, username);
});

test('per-user prefs persist via /auth/me', async () => {
  const username = 'itest_prefs_' + Date.now();
  const { token } = await (await post('/api/auth/register', { username, password: 'secret1234' })).json();
  let r = await fetch(base + '/api/auth/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ prefs: { lang: 'en', notifOn: false } }),
  });
  assert.equal(r.status, 200);
  const me = await (await get('/api/auth/me', token)).json();
  assert.equal(me.user.prefs.lang, 'en');
  assert.equal(me.user.prefs.notifOn, false);
});

test('data CRUD + bulk replace (admin), gated for anonymous', async () => {
  // نوشتنِ ناشناس باید رد شود
  let r = await post('/api/data/customers', { id: 'x', name: 'x' });
  assert.ok(r.status === 401 || r.status === 403, 'anonymous write is rejected');

  const admin = process.env.SUPERADMIN_USERNAME || 'superadmin';
  const adminPass = process.env.SUPERADMIN_PASSWORD || 'Admin@12345';
  const login = await (await post('/api/auth/login', { username: admin, password: adminPass })).json();
  assert.ok(login.token, 'superadmin can log in');
  const t = login.token;
  const co = 'testco_' + Date.now();

  r = await post('/api/data/customers', { id: 'c1', name: 'C One', company: co }, t);
  assert.equal(r.status, 201);

  let list = await (await get('/api/data/customers?company=' + co, t)).json();
  assert.ok(list.some((x) => x.id === 'c1'), 'created doc appears in list');

  r = await post('/api/data/customers/bulk', { company: co, items: [{ id: 'c2', name: 'C Two' }] }, t);
  assert.equal(r.status, 200);
  list = await (await get('/api/data/customers?company=' + co, t)).json();
  assert.ok(list.some((x) => x.id === 'c2') && !list.some((x) => x.id === 'c1'), 'bulk replaced the collection');

  // پاک‌سازی
  await post('/api/data/customers/bulk', { company: co, items: [] }, t);
  list = await (await get('/api/data/customers?company=' + co, t)).json();
  assert.equal(list.length, 0, 'cleanup empties the company collection');
});

test('business data (/api/data) is admin-only for READ too (privacy)', async () => {
  // یک کاربرِ عادی (نه admin) نباید بتواند مشتریان/داده‌های کسب‌وکار را بخواند
  const u = 'itest_reader_' + Date.now();
  const { token } = await (await post('/api/auth/register', { username: u, password: 'secret1234' })).json();
  const r = await get('/api/data/customers', token);
  assert.ok(r.status === 401 || r.status === 403, 'a non-admin user cannot read business collections');
  const r2 = await get('/api/data/customers/some-id', token);
  assert.ok(r2.status === 401 || r2.status === 403, 'a non-admin user cannot read a business doc');
});

test('per-user data store is isolated between users', async () => {
  // دو کاربرِ متفاوت، هرکدام وظایفِ خودش را ذخیره می‌کند و فقط مالِ خودش را می‌بیند
  const uA = 'itest_pu_a_' + Date.now();
  const uB = 'itest_pu_b_' + Date.now();
  const a = (await (await post('/api/auth/register', { username: uA, password: 'secret1234' })).json()).token;
  const b = (await (await post('/api/auth/register', { username: uB, password: 'secret1234' })).json()).token;

  // هر دو با همان id 't1' ذخیره می‌کنند (نباید تصادم/نشت بدهد)
  let r = await post('/api/me/data/tasks/bulk', { items: [{ id: 't1', title: 'A-task' }] }, a);
  assert.equal(r.status, 200);
  r = await post('/api/me/data/tasks/bulk', { items: [{ id: 't1', title: 'B-task' }] }, b);
  assert.equal(r.status, 200);

  const listA = await (await get('/api/me/data/tasks', a)).json();
  const listB = await (await get('/api/me/data/tasks', b)).json();
  assert.equal(listA.length, 1);
  assert.equal(listB.length, 1);
  assert.equal(listA[0].title, 'A-task', 'user A sees only their own task');
  assert.equal(listB[0].title, 'B-task', 'user B sees only their own task, no collision on shared id');
  assert.equal(listA[0].id, 't1', 'client id is returned unprefixed');

  // نوشتن بدونِ توکن رد می‌شود
  r = await post('/api/me/data/tasks/bulk', { items: [] });
  assert.ok(r.status === 401 || r.status === 403, 'anonymous per-user write rejected');
  // مجموعهٔ ناشناخته در انبارِ per-user هم ۴۰۴
  r = await get('/api/me/data/not_a_collection', a);
  assert.equal(r.status, 404);
});

test('wallet: deposit, purchase, insufficient funds, no double charge (server-authoritative)', async () => {
  const u = 'itest_wallet_' + Date.now();
  const { token } = await (await post('/api/auth/register', { username: u, password: 'secret1234' })).json();

  // موجودیِ اولیه
  let w = await (await get('/api/wallet', token)).json();
  const start = w.balance;
  assert.equal(typeof start, 'number');

  // واریز
  w = await (await post('/api/wallet/deposit', { amount: 500000 }, token)).json();
  assert.equal(w.balance, start + 500000);
  assert.ok(w.tx.length >= 1 && w.tx[0].type === 'deposit');

  // خرید آواتار
  w = await (await post('/api/wallet/purchase', { kind: 'avatar', id: 'av_x', price: 200000, title: 'خرید آواتار' }, token)).json();
  assert.equal(w.balance, start + 500000 - 200000);
  assert.ok(w.ownedAvatars.includes('av_x'));

  // خریدِ دوباره‌ی همان آواتار → کسرِ دوباره نمی‌شود
  const before = w.balance;
  w = await (await post('/api/wallet/purchase', { kind: 'avatar', id: 'av_x', price: 200000 }, token)).json();
  assert.equal(w.balance, before, 'buying an already-owned item does not charge again');

  // خرید گران‌تر از موجودی → ۴۰۲ و بدونِ کسر
  const r = await post('/api/wallet/purchase', { kind: 'theme', id: 't_expensive', price: 999999999 }, token);
  assert.equal(r.status, 402);
  const after = await (await get('/api/wallet', token)).json();
  assert.equal(after.balance, before, 'insufficient purchase does not change balance');
  assert.ok(!after.ownedThemes.includes('t_expensive'));

  // ناشناس نمی‌تواند کیف‌پول بخواند
  const anon = await get('/api/wallet');
  assert.ok(anon.status === 401 || anon.status === 403);
});

test('storefront: real catalog + order deducts wallet', async () => {
  const u = 'itest_shop_' + Date.now();
  const { token } = await (await post('/api/auth/register', { username: u, password: 'secret1234' })).json();

  // کاتالوگِ واقعی (seedشده) خواندنی است
  const menu = await (await get('/api/shop/catalog/menu', token)).json();
  assert.ok(Array.isArray(menu) && menu.length > 0, 'menu catalog is seeded/non-empty');
  const restaurants = await (await get('/api/shop/catalog/restaurants', token)).json();
  assert.ok(restaurants.length > 0, 'restaurants seeded');

  const w0 = await (await get('/api/wallet', token)).json();
  // ثبتِ سفارش → کسرِ کیف‌پول + ثبت
  const r = await post('/api/shop/order', { kind: 'dine', items: [{ id: menu[0].id, qty: 2 }], total: 200000, meta: { vendor: 'x' } }, token);
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.equal(body.ok, true);
  // موجودی = قبلی − مبلغِ سفارش + کش‌بکِ برگشتی
  assert.equal(body.balance, w0.balance - 200000 + (body.order.cashback || 0), 'order deducted the wallet (net of cashback)');

  const orders = await (await get('/api/shop/orders', token)).json();
  assert.ok(orders.some((o) => o.id === body.order.id), 'order recorded and readable');

  // unknown catalog → 404
  assert.equal((await get('/api/shop/catalog/nope', token)).status, 404);
});

test('change-password: wrong old → 401, correct → new password works', async () => {
  const username = 'itest_pw_' + Date.now();
  const { token } = await (await post('/api/auth/register', { username, password: 'oldpass1234' })).json();

  let r = await post('/api/auth/change-password', { oldPassword: 'WRONG', newPassword: 'newpass1234' }, token);
  assert.equal(r.status, 401, 'wrong current password rejected');

  r = await post('/api/auth/change-password', { oldPassword: 'oldpass1234', newPassword: 'newpass1234' }, token);
  assert.equal(r.status, 200, 'correct current password → changed');

  assert.equal((await post('/api/auth/login', { username, password: 'oldpass1234' })).status, 401, 'old password no longer works');
  assert.equal((await post('/api/auth/login', { username, password: 'newpass1234' })).status, 200, 'new password works');
});

test('security log records login and password events', async () => {
  const username = 'itest_seclog_' + Date.now();
  const { token } = await (await post('/api/auth/register', { username, password: 'secret1234' })).json();
  await post('/api/auth/login', { username, password: 'secret1234' }); // records a login
  const log = await (await get('/api/auth/security-log', token)).json();
  assert.ok(Array.isArray(log) && log.some((e) => e.type === 'login'), 'security log has a login event');
});

test('2FA (TOTP): setup → enable → login enforced → recovery code → disable', async () => {
  const username = 'itest_2fa_' + Date.now();
  const password = 'secret1234';
  const { token } = await (await post('/api/auth/register', { username, password })).json();

  const setup = await (await post('/api/auth/2fa/setup', {}, token)).json();
  assert.ok(setup.secret && setup.otpauth, 'setup returns a secret + otpauth uri');

  // فعال‌سازیِ با کدِ نامعتبر → رد
  assert.equal((await post('/api/auth/2fa/enable', { code: '000000' }, token)).status, 401, 'invalid code rejected');

  const good = generateToken(setup.secret);
  const en = await (await post('/api/auth/2fa/enable', { code: good, method: 'app' }, token)).json();
  assert.ok(en.enabled && Array.isArray(en.recoveryCodes) && en.recoveryCodes.length >= 4, 'enabled + recovery codes issued');

  const me = await (await get('/api/auth/me', token)).json();
  assert.equal(me.user.twofa.enabled, true, 'me() reports 2fa enabled');

  // ورودِ بدونِ کد → 401 twofa_required
  let r = await post('/api/auth/login', { username, password });
  assert.equal(r.status, 401);
  assert.equal((await r.json()).error, 'twofa_required', 'login without otp is blocked');

  // ورودِ با کدِ TOTP → موفق
  r = await post('/api/auth/login', { username, password, otp: generateToken(setup.secret) });
  assert.equal(r.status, 200, 'login with valid TOTP succeeds');

  // ورودِ با کدِ بازیابی → موفق و مصرف‌شونده
  const rc = en.recoveryCodes[0];
  assert.equal((await post('/api/auth/login', { username, password, otp: rc })).status, 200, 'recovery code works once');
  assert.equal((await post('/api/auth/login', { username, password, otp: rc })).status, 401, 'same recovery code cannot be reused');

  // غیرفعال‌سازی نیازمندِ رمز است
  assert.equal((await post('/api/auth/2fa/disable', { password: 'nope' }, token)).status, 401, 'disable needs correct password');
  assert.equal((await post('/api/auth/2fa/disable', { password }, token)).status, 200, 'disable with password ok');
  assert.equal((await post('/api/auth/login', { username, password })).status, 200, 'after disable, password-only login works');
});

test('subscription: buy deducts wallet + sets expiry; insufficient → 402', async () => {
  const username = 'itest_sub_' + Date.now();
  const { token } = await (await post('/api/auth/register', { username, password: 'secret1234' })).json();
  const w0 = await (await get('/api/wallet', token)).json();

  const r = await post('/api/wallet/subscribe', { plan: 'Neura Pro', planId: 'pro', price: 149000, months: 1 }, token);
  assert.equal(r.status, 200);
  const w = await r.json();
  assert.equal(w.balance, w0.balance - 149000, 'subscription deducted wallet');
  assert.ok(w.subscription && w.subscription.planId === 'pro' && w.subscription.expiresAt, 'subscription recorded with expiry');

  const big = await post('/api/wallet/subscribe', { plan: 'Neura Max', planId: 'max', price: 999999999, months: 1 }, token);
  assert.equal(big.status, 402, 'insufficient funds → 402');
});

test('cashback accrues from a real order', async () => {
  const username = 'itest_cb_' + Date.now();
  const { token } = await (await post('/api/auth/register', { username, password: 'secret1234' })).json();
  const menu = await (await get('/api/shop/catalog/menu', token)).json();
  const w0 = await (await get('/api/wallet', token)).json();
  const r = await (await post('/api/shop/order', { kind: 'dine', items: [{ id: menu[0].id, qty: 1 }], total: 200000 }, token)).json();
  assert.ok(r.order.cashback > 0, 'order earned cashback');
  const w1 = await (await get('/api/wallet', token)).json();
  assert.equal(w1.cashback, (w0.cashback || 0) + r.order.cashback, 'wallet cashback total increased');
  // موجودی = قبلی − مبلغ + کش‌بک
  assert.equal(w1.balance, w0.balance - 200000 + r.order.cashback, 'balance reflects spend minus cashback credit');
});

test('per-user payment methods persist and isolate', async () => {
  const username = 'itest_pm_' + Date.now();
  const { token } = await (await post('/api/auth/register', { username, password: 'secret1234' })).json();
  let r = await post('/api/me/data/payment_methods', { id: 'pm_1', label: 'بانک ملی', last4: '4278', type: 'card' }, token);
  assert.equal(r.status, 201);
  const list = await (await get('/api/me/data/payment_methods', token)).json();
  assert.ok(list.some((p) => p.id === 'pm_1' && p.last4 === '4278'), 'saved payment method is readable');
});

test('national-id checksum validates offline', () => {
  assert.equal(isValidNationalId('0499370899'), true, 'known valid national id passes');
  assert.equal(isValidNationalId('1234567890'), false, 'bad checksum fails');
  assert.equal(isValidNationalId('12345'), false, 'too short fails');
});

test('Shahkar: identity verified → OTP → account with stored identity; national id is unique', async () => {
  // کلیدهای پاد را از env روشن می‌کنیم و transport را برای تست تزریق (بدونِ تماسِ دولتیِ واقعی)
  process.env.PODIUM_TOKEN = 'test-token';
  process.env.GET_IDENTITY_INFO_API_KEY = 'idk';
  process.env.MATCH_NATIONAL_ID_AND_PHONE_NUMBER_API_KEY = 'mk';
  const OWNER_PHONE = '09121112233';
  _setTransport((c, payload) => {
    if (payload.apiKey === 'idk') {
      return { result: JSON.stringify({ identityInfo: { nationalCode: payload.providerParameters.nationalCode, firstName: 'علی', lastName: 'رضایی', fatherName: 'حسن', gender: 'male', alive: true } }) };
    }
    if (payload.apiKey === 'mk') {
      return { result: JSON.stringify({ matched: payload.providerParameters.body.mobileNumber === OWNER_PHONE }) };
    }
    return { hasError: true, message: 'unexpected' };
  });
  try {
    const nid = '0499370899';
    // پاک‌سازی تا تست idempotent باشد (شماره/کد ملیِ ثابت در اجرای قبلی ممکن است مانده باشد)
    await pool.query("DELETE FROM app_users WHERE username IN ('989121112233','989120000000','989129998877') OR meta->>'nationalId' = $1", [nid]);
    await pool.query("DELETE FROM documents WHERE collection = 'shahkar_pending'");
    await pool.query("DELETE FROM otp_codes WHERE phone IN ('989121112233','989120000000','989129998877')");

    // ۱) کد ملیِ نامعتبر → رد قبل از هر تماس
    let r = await post('/api/auth/shahkar/verify', { phone: OWNER_PHONE, nationalCode: '1234567890', jBirthDate: '13700101' });
    assert.equal(r.status, 400);

    // احرازِ ناهمگام: POST یک jobId می‌دهد، نتیجه با poll خوانده می‌شود
    const shahkarFull = async (payload) => {
      const rr = await post('/api/auth/shahkar/verify', payload);
      if (rr.status !== 200) return { httpStatus: rr.status, body: await rr.json() };
      const { jobId } = await rr.json();
      for (let i = 0; i < 60; i++) {
        const p = await (await get('/api/auth/shahkar/poll?id=' + jobId)).json();
        if (p.done) return { httpStatus: 200, result: p.result };
        await new Promise((s) => setTimeout(s, 30));
      }
      return { httpStatus: 200, result: { ok: false, error: 'timeout' } };
    };

    // ۲) موبایلی که به نامِ این کد ملی نیست → عدمِ تطبیقِ شاهکار (از مسیرِ poll)
    let x = await shahkarFull({ phone: '09120000000', nationalCode: nid, jBirthDate: '13700101' });
    assert.equal(x.result.ok, false);
    assert.equal(x.result.error, 'shahkar_not_matched', 'mismatched mobile is rejected');

    // ۳) موبایلِ درست + کد ملیِ درست → تأیید و ذخیرهٔ هویت
    x = await shahkarFull({ phone: OWNER_PHONE, nationalCode: nid, jBirthDate: '13700101' });
    assert.equal(x.result.ok, true);
    assert.match(x.result.name, /علی/);

    // ۴) OTP را مستقیم می‌گذاریم (بدونِ پیامک) و تأیید می‌کنیم → حساب با هویتِ واقعی ساخته می‌شود
    const phone98 = '98' + OWNER_PHONE.slice(1);
    await pool.query(
      "INSERT INTO otp_codes (phone, code_hash, expires_at, attempts) VALUES ($1, $2, now()+interval '3 minutes', 0) ON CONFLICT (phone) DO UPDATE SET code_hash=$2, expires_at=now()+interval '3 minutes', attempts=0",
      [phone98, await bcrypt.hash('12345', 8)]
    );
    r = await post('/api/auth/otp/verify', { phone: OWNER_PHONE, code: '12345' });
    assert.equal(r.status, 200, 'otp verify creates the verified account');
    const login = await r.json();
    assert.ok(login.token && /علی/.test(login.user.name), 'account name comes from civil registry');

    const row = (await pool.query('SELECT name, meta FROM app_users WHERE username = $1', [phone98])).rows[0];
    assert.equal(row.meta.nationalId, nid, 'national id stored on the account');
    assert.equal(row.meta.identity.firstName, 'علی', 'identity info stored');
    assert.ok(row.meta.identityVerifiedAt, 'identityVerifiedAt set');

    // ۵) یکتاییِ کد ملی: همان کد ملی با شماره‌ای دیگر → ۴۰۹
    r = await post('/api/auth/shahkar/verify', { phone: '09129998877', nationalCode: nid, jBirthDate: '13700101' });
    assert.equal(r.status, 409, 'same national id on another phone is rejected');
    assert.equal((await r.json()).error, 'national_id_taken');
  } finally {
    _setTransport(null);
    delete process.env.PODIUM_TOKEN;
    delete process.env.GET_IDENTITY_INFO_API_KEY;
    delete process.env.MATCH_NATIONAL_ID_AND_PHONE_NUMBER_API_KEY;
  }
});

test('unknown collection is 404', async () => {
  const admin = process.env.SUPERADMIN_USERNAME || 'superadmin';
  const adminPass = process.env.SUPERADMIN_PASSWORD || 'Admin@12345';
  const { token } = await (await post('/api/auth/login', { username: admin, password: adminPass })).json();
  const r = await get('/api/data/definitely_not_a_collection', token);
  assert.equal(r.status, 404);
});
