import express from 'express';
import { query } from '../db.js';
import { authRequired, roleRequired, optionalUser } from '../auth.js';
import { purchase } from '../billing.js';
import { getVoipSettings, placeCall } from '../voip.js';
import { shecanRequest } from '../shecan.js';
import { computeDineInsights, dineInsightsText, computeDineCustomers, computeDineForecast, computeDinePricing, computeDineCompetitors, computeDineReviews } from '../dine-insights.js'; // مغزِ داین — غنی‌سازیِ چت با دادهٔ واقعیِ رستوران

// endpointهای ایرانی (avalai و سایر دامنه‌های .ir) روی این سرور به IPِ اشتباهِ CDN آروان
// resolve می‌شوند و undici هنگ می‌کند؛ پس مثل ippanel از مسیرِ shecan (DNS شکن + https مستقیم) می‌روند.
function isDirectHost(u) {
  try { const h = new URL(u).hostname; return /\.ir$/i.test(h); } catch { return false; }
}

// ساختِ بدنهٔ multipart/form-data به‌صورتِ Buffer (سازگار با هر دو مسیرِ undici و shecan).
// fields: [{ name, value } | { name, filename, contentType, data:Buffer }]
function buildMultipart(fields) {
  const boundary = '----neura' + Math.random().toString(16).slice(2);
  const parts = [];
  for (const f of fields) {
    let head = `--${boundary}\r\nContent-Disposition: form-data; name="${f.name}"`;
    if (f.filename) head += `; filename="${f.filename}"`;
    head += '\r\n';
    if (f.contentType) head += `Content-Type: ${f.contentType}\r\n`;
    head += '\r\n';
    parts.push(Buffer.from(head, 'utf8'));
    parts.push(Buffer.isBuffer(f.data) ? f.data : Buffer.from(String(f.value ?? ''), 'utf8'));
    parts.push(Buffer.from('\r\n', 'utf8'));
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`, 'utf8'));
  return { body: Buffer.concat(parts), contentType: `multipart/form-data; boundary=${boundary}` };
}

// ابزارِ «برقراری تماس» برای چت — وقتی کاربر بخواهد ایجنت به کسی زنگ بزند.
const MAKE_CALL_TOOL = {
  type: 'function',
  function: {
    name: 'make_call',
    description: 'یک تماس تلفنی واقعی از طریق سرور ویپ برقرار می‌کند. وقتی کاربر می‌خواهد به کسی زنگ زده شود این را فراخوانی کن. مهم: قبل از فراخوانی مطمئن شو دقیقاً می‌دانی «چه کاری» باید در تماس انجام شود؛ اگر هدف یا کاری که باید انجام شود روشن نیست، اول از کاربر بپرس و بعد تماس بگیر.',
    parameters: {
      type: 'object',
      properties: {
        target_name: { type: 'string', description: 'نام شخصی که باید با او تماس گرفته شود' },
        phone: { type: 'string', description: 'شمارهٔ تلفن مقصد اگر کاربر گفته باشد (اختیاری؛ اگر ندانی از روی نام جستجو می‌شود)' },
        purpose: { type: 'string', description: 'شرحِ دقیق و کاملِ کاری که باید در تماس انجام شود — دقیقاً همان چیزی که کاربر می‌خواهد به مخاطب گفته یا از او پرسیده شود (نه فقط «تماس با فلانی»). مثال: «هماهنگی یک نوبتِ ویزیت برای پنجشنبه ساعت ۱۰ صبح».' },
        then_call: { type: 'boolean', description: 'اگر کاربر خواسته بعد از این تماس، با شماره‌ای که در همین تماس گرفته می‌شود یک تماسِ دوم برقرار شود (مثلِ «از علی شمارهٔ رضا را بگیر و بعد به رضا زنگ بزن»)، این را true بگذار.' },
        then_target: { type: 'string', description: 'فقط وقتی then_call=true: نامِ شخصی که در تماسِ دوم باید با او تماس گرفته شود (همان کسی که شماره‌اش در تماسِ اول گرفته می‌شود).' },
        then_purpose: { type: 'string', description: 'فقط وقتی then_call=true: کاری که باید در تماسِ دوم انجام شود (مثلِ «حالش را بپرس»).' },
      },
      required: ['target_name', 'purpose'],
    },
  },
};

// ابزارِ «ارسال پیامک» برای چت — وقتی کاربر بخواهد پیامکی فرستاده شود.
const SEND_SMS_TOOL = {
  type: 'function',
  function: {
    name: 'send_sms',
    description: 'یک پیامکِ واقعی به یک شماره موبایل ارسال می‌کند. هر زمان کاربر خواست پیامکی فرستاده شود، این را فراخوانی کن.',
    parameters: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: 'شمارهٔ موبایلِ گیرنده (مثلاً 09123456789)' },
        message: { type: 'string', description: 'متنِ کاملِ پیامک' },
      },
      required: ['phone', 'message'],
    },
  },
};

// ابزارِ «واگذاری به ایجنتِ دیگر» — دستیار می‌تواند از منشی/بازاریابی/… سوال بپرسد یا کاری بخواهد.
const ASK_AGENT_TOOL = {
  type: 'function',
  function: {
    name: 'ask_agent',
    description: 'از یک ایجنتِ دیگرِ همین کاربر (مثلِ منشی، بازاریابی، پشتیبانی، فروش) سوال بپرس یا کاری را به او بسپار و پاسخش را بگیر. هر وقت کاربر گفت کاری را از یک ایجنتِ دیگر بخواه یا چیزی را از او بپرس، این را فراخوانی کن و بعد پاسخِ آن ایجنت را به کاربر منتقل کن.',
    parameters: {
      type: 'object',
      properties: {
        agent: { type: 'string', description: 'نام یا نقشِ ایجنتِ مقصد (مثلاً «منشی» یا «بازاریابی» یا «پشتیبانی»)' },
        question: { type: 'string', description: 'سوال یا کاری که باید کامل و دقیق از آن ایجنت پرسیده/خواسته شود' },
      },
      required: ['agent', 'question'],
    },
  },
};

// ابزارهای «حیطهٔ دستیارِ شخصی» — دستیار واقعاً در روزمرگی/تقویم/کارها/یادداشت‌های کاربر ثبت می‌کند
// (نه ادعای دروغِ «انجام شد»). خروجی در همان صفحه‌ای که کاربر می‌بیند ذخیره می‌شود.
const CREATE_EVENT_TOOL = {
  type: 'function',
  function: {
    name: 'create_event',
    description: 'یک رویداد/یادآوری در «روزمرگیِ» (تقویمِ) کاربر واقعاً ثبت می‌کند و همان‌جا نمایش داده می‌شود. هر وقت کاربر خواست چیزی با زمانِ مشخص یا یک یادآوری/جلسه/قرار در برنامه‌اش ثبت شود (مثلِ «۱ ساعت دیگه به علی زنگ بزنم»، «فردا ساعت ۱۰ جلسه»، «یادم بنداز شیر بخرم»)، حتماً این را فراخوانی کن — فقط نگو «انجام شد».',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'عنوانِ کوتاه و تمیزِ خودِ کار (مثلاً «زنگ زدن به علیزاده»). کلماتی مثلِ «یه تسک بساز»، «تو روزمرگی»، «برام» را نیاور.' },
        day: { type: 'string', enum: ['today', 'tomorrow', 'later'], description: 'روزِ رویداد: today=امروز، tomorrow=فردا، later=تا یک ماه آینده. «۱ ساعت دیگه/امشب/امروز»→today؛ «فردا»→tomorrow؛ دورتر→later.' },
        in_minutes: { type: 'number', description: 'اگر کاربر زمان را نسبی گفت («۱ ساعت دیگه»=۶۰، «نیم ساعت دیگه»=۳۰)، تعدادِ دقیقه از الان را اینجا بده تا ساعت دقیق محاسبه شود.' },
        time: { type: 'string', description: 'اگر ساعتِ مطلق مشخص است، به‌صورتِ HH:MM (۲۴ساعته). اگر in_minutes دادی لازم نیست.' },
        type: { type: 'string', enum: ['reminder', 'meeting', 'personal', 'work'], description: 'نوعِ رویداد؛ پیش‌فرض reminder.' },
      },
      required: ['title', 'day'],
    },
  },
};
const CREATE_TASK_TOOL = {
  type: 'function',
  function: {
    name: 'create_task',
    description: 'یک وظیفهٔ چک‌لیستیِ بدونِ ساعتِ خاص در فهرستِ کارهای کاربر واقعاً ثبت می‌کند. وقتی کاربر یک کارِ بی‌زمان خواست («این را به کارهام اضافه کن»)، این را فراخوانی کن. اگر کار زمان/ساعت دارد به‌جای این از create_event استفاده کن.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'عنوانِ کوتاه و تمیزِ کار، بدونِ کلماتِ دستوری.' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'اولویت؛ پیش‌فرض medium.' },
      },
      required: ['title'],
    },
  },
};
const CREATE_NOTE_TOOL = {
  type: 'function',
  function: {
    name: 'create_note',
    description: 'یک یادداشتِ متنی برای کاربر واقعاً ثبت می‌کند. وقتی کاربر خواست چیزی را یادداشت/ذخیره کنی، این را فراخوانی کن.',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'متنِ کاملِ یادداشت.' },
      },
      required: ['text'],
    },
  },
};

// ابزارِ «پیگیریِ سفارش/فاکتور» — فقط‌خواندنی: دستیار سفارش‌های واقعیِ خودِ کاربر را از u_orders می‌خواند و
// وضعیت/فاکتور را با دادهٔ واقعی پاسخ می‌دهد (نه ادعای دروغ). هیچ چیزی نمی‌نویسد.
const GET_ORDERS_TOOL = {
  type: 'function',
  function: {
    name: 'get_my_orders',
    description: 'سفارش‌های واقعیِ خودِ کاربر (مارکت و سفارشِ غذا) را با وضعیت، اقلام، مبلغ، تاریخ و شمارهٔ فاکتور برمی‌گرداند. هر وقت کاربر دربارهٔ «سفارشم کجاست»، «پیگیریِ سفارش»، «وضعیتِ سفارش»، «فاکتور/رسیدِ خرید»، «چقدر خرج کردم» یا مشابه پرسید، حتماً این را فراخوانی کن و بر اساسِ همین داده پاسخ بده — از خودت عدد نساز.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'اختیاری: شمارهٔ سفارش یا کلیدواژه (مثلِ نامِ کالا/فروشگاه) برای فیلترِ سفارش‌ها.' },
      },
    },
  },
};
const ORDER_STATUS_FA = { preparing: 'در حال آماده‌سازی', pending: 'در انتظار تأیید', confirmed: 'تأییدشده', shipping: 'در حال ارسال', delivered: 'تحویل‌شده', cancelled: 'لغوشده', received: 'ثبت‌شده', cooking: 'در حال آماده‌سازی', ready: 'آماده', served: 'سرو شد', paid: 'تسویه‌شده' };
async function getMyOrders(sub, q) {
  const { rows } = await query("SELECT data FROM documents WHERE collection='u_orders' AND company=$1 ORDER BY created_at DESC LIMIT 60", ['user:' + sub]);
  let orders = rows.map((r) => r.data).filter((o) => o && o.kind !== 'sale'); // فقط خریدهای خودِ کاربر (نه فروش‌های فروشنده)
  const term = String(q || '').trim().replace(/[#\s]/g, '');
  if (term) orders = orders.filter((o) => JSON.stringify(o).replace(/\s/g, '').includes(term));
  return orders.slice(0, 12).map((o) => {
    const items = Array.isArray(o.items) ? o.items.map((it) => (it.name || 'کالا') + (it.qty ? ' ×' + it.qty : '')).join('، ') : (o.items || '');
    const dineSt = Array.isArray(o.dineTickets) && o.dineTickets[0] ? (ORDER_STATUS_FA[o.dineTickets[0].status] || o.dineTickets[0].status) : null;
    return { شماره: o.num || o.id, نوع: o.kind === 'dine' ? 'سفارش غذا' : 'خرید مارکت', وضعیت: dineSt || ORDER_STATUS_FA[o.status] || o.status || 'ثبت‌شده', فروشنده: o.vendor || '', اقلام: items, مبلغ: (Number(o.total) || 0).toLocaleString('en-US') + ' تومان', تاریخ: o.date || '', کش‌بک: o.cashback ? (Number(o.cashback).toLocaleString('en-US') + ' تومان') : undefined };
  });
}

// اجرای واقعیِ ابزارهای دستیار: نوشتن در انبارِ per-userِ کاربر (همان جایی که myList فرانت می‌خواند).
async function runAssistantTool(sub, fname, args) {
  const cid = Date.now() + Math.floor(Math.random() * 1000);
  const dbId = String(sub) + '__' + String(cid);
  const company = 'user:' + sub;
  const put = (coll, data) => query(
    `INSERT INTO documents (collection, id, company, data) VALUES ($1,$2,$3,$4::jsonb)
     ON CONFLICT (collection, id) DO UPDATE SET data=$4::jsonb, updated_at=now()`,
    ['u_' + coll, dbId, company, JSON.stringify({ ...data, id: cid })]
  );
  try {
    if (fname === 'create_task') {
      const title = String(args.title || '').trim();
      if (!title) return { msg: 'عنوانِ کار خالی بود؛ از کاربر بپرس چه کاری.' };
      const priority = ['low', 'medium', 'high'].includes(args.priority) ? args.priority : 'medium';
      await put('tasks', { title, priority, done: false, dueDate: '', status: 'todo' });
      return { coll: 'tasks', msg: `کارِ «${title}» در فهرستِ کارهای کاربر ثبت شد.` };
    }
    if (fname === 'create_note') {
      const text = String(args.text || args.title || '').trim();
      if (!text) return { msg: 'متنِ یادداشت خالی بود.' };
      await put('notes', { title: text.slice(0, 40), text, tag: 'یادداشت', color: '#6366f1', preview: text, date: '', at: Date.now() });
      return { coll: 'notes', msg: 'یادداشت ثبت شد.' };
    }
    // create_event
    const title = String(args.title || '').trim();
    if (!title) return { msg: 'عنوانِ رویداد خالی بود؛ از کاربر بپرس.' };
    const dayMap = { today: 'امروز', tomorrow: 'فردا', later: 'تا یک ماه آینده' };
    const date = dayMap[args.day] || 'امروز';
    let time = ''; let at = 0;
    const inMin = Number(args.in_minutes);
    if (inMin > 0) {
      at = Date.now() + inMin * 60000;
      try { time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(at)); } catch (_) {}
    } else if (/^\d{1,2}:\d{2}$/.test(String(args.time || ''))) {
      time = String(args.time);
    }
    const type = ['reminder', 'meeting', 'personal', 'work'].includes(args.type) ? args.type : 'reminder';
    await put('calendar', { title, time, date, type, status: 'pending', muted: false, ...(at ? { at } : {}) });
    return { coll: 'calendar', msg: `رویداد «${title}»${time ? ' برای ساعتِ ' + time : ''} در «${date}»یِ روزمرگیِ کاربر ثبت شد.` };
  } catch (e) {
    return { msg: 'ثبت در سیستم ناموفق بود: ' + String(e?.message || e) };
  }
}

// ارسالِ پیامکِ آزاد از طریق ippanel (مستقل از پترنِ OTP)
async function sendSmsViaIppanel(text, phone) {
  let s = {};
  try { const sr = await query('SELECT data FROM settings WHERE id = 1'); s = sr.rows[0]?.data || {}; } catch (_) {}
  if (!s.ippanelApiKey) return { ok: false, reason: 'sms_not_configured' };
  const baseUrl = (s.ippanelBaseUrl || 'https://api2.ippanel.com/api/v1').replace(/\/$/, '');
  const sendPath = s.ippanelTextSendPath || '/sms/send/webservice/single';
  const sender = s.ippanelTextSender || s.ippanelSender || '+983000505';
  const digits = String(phone || '').replace(/[^0-9+]/g, '');
  const recipient = digits.startsWith('+') ? digits : ('+98' + digits.replace(/^0+/, ''));
  try {
    const r = await shecanRequest(`${baseUrl}${sendPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: s.ippanelApiKey, accept: 'application/json' },
      body: JSON.stringify({ sender, message: text, recipient: [recipient] }),
      timeout: 15000,
    });
    let j = {}; try { j = JSON.parse(r.body); } catch (_) {}
    const good = r.status >= 200 && r.status < 300 && !(j && j.meta && j.meta.status === false) && !(j && j.status && j.status !== 'OK');
    if (good) { console.log('AI send_sms ok →', recipient, String(r.body).slice(0, 120)); return { ok: true, recipient }; }
    console.error('AI send_sms failed:', r.status, String(r.body).slice(0, 200));
    return { ok: false, reason: 'provider_error', detail: String(r.body).slice(0, 200) };
  } catch (e) { console.error('AI send_sms error:', e?.message || e); return { ok: false, reason: 'fetch_failed', detail: String(e?.message || e) }; }
}

// ارسالِ پیامک با «پترن» ippanel (الگوی تاییدشده + متغیرها) — برای آفرهای بازاریابی
async function sendSmsPattern(patternCode, phone, variables) {
  let s = {};
  try { const sr = await query('SELECT data FROM settings WHERE id = 1'); s = sr.rows[0]?.data || {}; } catch (_) {}
  if (!s.ippanelApiKey || !patternCode) return { ok: false, reason: 'not_configured' };
  const baseUrl = (s.ippanelBaseUrl || 'https://api2.ippanel.com/api/v1').replace(/\/$/, '');
  const sendPath = s.ippanelSendPath || '/sms/pattern/normal/send';
  const sender = s.ippanelSender || '+983000505';
  const digits = String(phone || '').replace(/[^0-9+]/g, '');
  const recipient = digits.startsWith('+') ? digits : ('+98' + digits.replace(/^0+/, ''));
  try {
    const r = await shecanRequest(`${baseUrl}${sendPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: s.ippanelApiKey, accept: 'application/json' },
      body: JSON.stringify({ code: patternCode, sender, recipient, variable: variables || {} }),
      timeout: 15000,
    });
    const good = r.status >= 200 && r.status < 300;
    console.log('TRACK pattern sms', good ? 'ok' : 'fail', r.status, 'code=', patternCode, String(r.body).slice(0, 120));
    return { ok: good };
  } catch (e) { console.error('TRACK pattern sms error:', e?.message || e); return { ok: false }; }
}

const router = express.Router();
const adminGuard = [authRequired, roleRequired('admin', 'superadmin')];

async function getProvider(id) {
  const { rows } = await query("SELECT data FROM documents WHERE collection='ai_providers' AND id=$1", [id]);
  return rows[0]?.data || null;
}

// fetch با تایم‌اوت + تلاش مجدد (برای پایداری در برابر خطاهای موقتِ پروکسی)
async function fetchT(url, opts = {}, ms = 30000, retries = 2) {
  // هاستِ ایرانی → از مسیرِ shecan (DNS شکن، https مستقیم) که روی این سرور به .ir می‌رسد.
  // خروجی را به شکلِ Response درمی‌آوریم تا فراخوان‌ها (r.ok/r.status/r.text/r.json) بدون تغییر کار کنند.
  if (isDirectHost(url)) {
    const r = await shecanRequest(url, { method: opts.method || 'GET', headers: opts.headers, body: opts.body, timeout: ms });
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      headers: r.headers,
      text: async () => r.body,
      json: async () => JSON.parse(r.body),
      arrayBuffer: async () => r.buffer,
    };
  }
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const r = await fetch(url, { ...opts, signal: ctrl.signal });
      clearTimeout(t);
      if (r.status >= 502 && r.status <= 504 && attempt < retries) continue; // 502/503/504 موقت → تلاش مجدد
      return r;
    } catch (e) {
      clearTimeout(t);
      lastErr = e;
      if (attempt < retries) { await new Promise(s => setTimeout(s, 600 * (attempt + 1))); continue; }
      throw e;
    }
  }
  throw lastErr;
}

// ── گرم نگه‌داشتنِ اتصالِ پروکسی→provider ──
// اولین درخواستِ بعد از بیکاری، تونلِ پروکسی به GapGPT را از صفر می‌سازد (~۱۶ ثانیه) و
// CDN آروان سرِ همان تایم‌اوت می‌کند → پاسخِ نمونه. با پینگِ سبکِ دوره‌ای، اتصال همیشه گرم می‌ماند.
let _warmBusy = false;
async function keepProviderWarm() {
  if (_warmBusy) return;
  _warmBusy = true;
  try {
    const all = await query("SELECT data FROM documents WHERE collection='ai_providers'");
    const provider = all.rows.map((r) => r.data).find((p) => p && p.enabled !== false && p.apiKey && p.baseUrl);
    if (provider) {
      await fetchT(`${provider.baseUrl.replace(/\/$/, '')}/models`,
        { method: 'GET', headers: { Authorization: `Bearer ${provider.apiKey}` } }, 25000, 0).catch(() => {});
    }
  } catch (_) { /* بی‌صدا */ } finally { _warmBusy = false; }
}
const _warmTimer = setInterval(keepProviderWarm, 25000);
if (_warmTimer.unref) _warmTimer.unref();
keepProviderWarm();

// مدل → ارائه‌دهنده و شناسه واقعی مدل
async function resolveModel(modelId, fallbackModel) {
  let providerId = null, realModel = modelId || fallbackModel;
  if (modelId) {
    const mr = await query("SELECT data FROM documents WHERE collection='ai_models' AND id=$1", [modelId]);
    const md = mr.rows[0]?.data;
    if (md) { providerId = md.provider; realModel = md.modelId; }
  }
  // ارائه‌دهنده: از مدل، وگرنه اولین ارائه‌دهنده‌ی فعالِ دارای کلید
  let provider = providerId ? await getProvider(providerId) : null;
  if (!provider || provider.enabled === false || !provider.apiKey) {
    const all = await query("SELECT data FROM documents WHERE collection='ai_providers'");
    provider = all.rows.map((r) => r.data).find((p) => p.enabled !== false && p.apiKey) || null;
  }
  return { provider, realModel };
}

// یک تکمیلِ سادهٔ LLM (system+user → متن). اگر ارائه‌دهنده‌ای پیکربندی نشده باشد null برمی‌گرداند.
async function llmComplete(systemPrompt, userPrompt, maxTokens) {
  const { provider, realModel } = await resolveModel(null, process.env.DEFAULT_CHAT_MODEL || 'gpt-4o-mini');
  if (!provider || !provider.apiKey) return null;
  try {
    const r = await fetchT(`${provider.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
      body: JSON.stringify({ model: realModel, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], ...(maxTokens ? { max_tokens: maxTokens } : {}) }),
    }, 40000, 1);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return null;
    return (j?.choices?.[0]?.message?.content || '').trim() || null;
  } catch (_) { return null; }
}

// تبدیل گفتار به متن (STT) — صوت به‌صورت base64 در JSON
router.post('/stt', async (req, res) => {
  const _t0 = Date.now();
  try {
    const { agentId, model: modelOverride, audioBase64, mime } = req.body || {};
    console.log('STT request agent=', agentId, 'mime=', mime, 'bytes=', audioBase64 ? audioBase64.length : 0);
    if (!audioBase64) return res.status(400).json({ error: 'audio_required' });
    let sttModel = modelOverride;
    if (!sttModel && agentId) {
      const a = await query("SELECT data FROM documents WHERE collection='agents' AND id=$1", [agentId]);
      sttModel = a.rows[0]?.data?.sttModel;
    }
    if (!sttModel) { try { const sr = await query('SELECT data FROM settings WHERE id = 1'); sttModel = sr.rows[0]?.data?.sttModel; } catch (_) {} }
    const { provider, realModel } = await resolveModel(sttModel, 'whisper-1');
    if (!provider) return res.json({ ok: false, fallback: true, reason: 'provider_unavailable' });
    const ext = /wav/i.test(mime || '') ? 'wav' : /mp4|m4a|aac/i.test(mime || '') ? 'm4a' : /mp3|mpeg/i.test(mime || '') ? 'mp3' : /ogg/i.test(mime || '') ? 'ogg' : 'webm';
    // زبانِ فارسی + پرامپتِ بایاس‌کننده (مخصوصاً برای شماره‌ها) دقت را روی خطِ تلفن خیلی بالا می‌برد.
    let sttLang = 'fa';
    try { const sr = await query('SELECT data FROM settings WHERE id = 1'); if (sr.rows[0]?.data?.sttLang) sttLang = String(sr.rows[0].data.sttLang); } catch (_) {}
    const sttPrompt = (req.body && typeof req.body.prompt === 'string' && req.body.prompt.trim())
      ? req.body.prompt.trim()
      : 'گفتگوی فارسیِ روزمره.';
    const audioBuf = Buffer.from(audioBase64, 'base64');
    const sttUrl = `${provider.baseUrl.replace(/\/$/, "")}/audio/transcriptions`;
    const doStt = (model) => {
      const fields = [
        { name: 'file', filename: `audio.${ext}`, contentType: (mime || 'audio/webm').split(';')[0], data: audioBuf },
        { name: 'model', value: model },
        { name: 'temperature', value: '0' },
      ];
      if (sttLang) fields.push({ name: 'language', value: sttLang });
      if (sttPrompt) fields.push({ name: 'prompt', value: sttPrompt });
      const { body, contentType } = buildMultipart(fields);
      return fetchT(sttUrl, { method: 'POST', headers: { Authorization: `Bearer ${provider.apiKey}`, 'Content-Type': contentType }, body }, 60000);
    };
    let r = await doStt(realModel);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      console.error('STT ERROR model=', realModel, 'status=', r.status, JSON.stringify(j).slice(0, 300));
      // fallback: مدلِ استانداردِ whisper-1 که روی گپ موجود است
      if (realModel !== 'whisper-1') {
        console.log('STT fallback → whisper-1');
        const r2 = await doStt('whisper-1');
        if (r2.ok) { r = r2; }
        else { const j2 = await r2.json().catch(() => ({})); console.error('STT fallback ERROR status=', r2.status, JSON.stringify(j2).slice(0, 300)); return res.status(502).json({ error: 'provider_error', detail: j2 }); }
      } else {
        return res.status(502).json({ error: 'provider_error', detail: j });
      }
    }
    const j = await r.json();
    console.log('STT OK took=', (Date.now() - _t0) + 'ms', 'text=', (j.text || '').slice(0, 40));
    res.json({ ok: true, text: j.text || '' });
  } catch (e) {
    console.error('STT EXCEPTION', String(e?.stack || e?.message || e));
    res.status(502).json({ error: 'fetch_failed', detail: String(e?.message || e) });
  }
});

// تبدیل متن به گفتار (TTS) — خروجی صوت base64
router.post('/tts', async (req, res) => {
  const _t0 = Date.now();
  try {
    const { agentId, model: modelOverride, voice, text } = req.body || {};
    if (!text) return res.status(400).json({ error: 'text_required' });
    const MALE_VOICES = new Set(['onyx','echo','verse','ash','ballad','charon','puck','fenrir','orus','enceladus','iapetus','algieba']);
    let ttsModel = modelOverride, ttsVoice = voice;
    // اگر صدا صریح داده شده (مثلِ دکمهٔ «نمونه» در تنظیمات)، جنسیت را از همان صدا بگیر — اولویتِ اول،
    // تا پیش‌نمایش دقیقاً همان چیزی باشد که کاربر همین حالا انتخاب کرده (نه جنسیتِ ذخیره‌شدهٔ ایجنت).
    let gender = voice ? (MALE_VOICES.has(String(voice).toLowerCase()) ? 'm' : 'f') : null;
    let accent = (req.body && req.body.accent) || null;
    if (agentId) {
      const a = await query("SELECT data FROM documents WHERE collection='agents' AND id=$1", [agentId]);
      const ad = a.rows[0]?.data;
      ttsModel = ttsModel || ad?.ttsModel;
      ttsVoice = ttsVoice || ad?.ttsVoice;
      if (gender == null) gender = ad?.gender || ad?.persona?.gender || null;
      if (!accent) accent = ad?.persona?.accent || null;
      // تنظیماتِ شخصیِ خودِ کاربر برای این ایجنت (per-user): صدا/جنسیت/لهجه — وقتی voice صریح داده نشده
      if (!voice) {
        try { const me = optionalUser(req); if (me && me.sub != null) { const pr = await query("SELECT data FROM documents WHERE collection='agent_prefs' AND id=$1", ['pref_' + me.sub + '_' + agentId]); const pf = pr.rows[0]?.data; if (pf) { if (pf.ttsVoice) ttsVoice = pf.ttsVoice; if (pf.gender) gender = pf.gender; if (pf.accent) accent = pf.accent; } } } catch (_) {}
      }
    }
    // پیکربندیِ سراسریِ سوپرادمین — مدل/صدا به تفکیکِ جنسیت (قابلِ کنترل در سوپرادمین)
    let sd = {};
    try { const sr = await query('SELECT data FROM settings WHERE id = 1'); sd = sr.rows[0]?.data || {}; } catch (_) {}
    // اگر جنسیت هنوز مشخص نبود، از روی نامِ صدای انتخابی حدس بزن
    if (!gender && ttsVoice) gender = MALE_VOICES.has(String(ttsVoice).toLowerCase()) ? 'm' : 'f';
    const isMale = (gender === 'm' || gender === 'مرد');
    if (isMale) {
      // صدای مردانه: مدلی که واقعاً جنسیت را اعمال می‌کند (پیش‌فرض gpt-4o-mini-tts). gemini را رد کن.
      ttsModel = (ttsModel && !/gemini/i.test(String(ttsModel))) ? ttsModel : (sd.ttsModelMale || 'gpt-4o-mini-tts');
      const OA_MALE = { onyx:'onyx', echo:'echo', verse:'ash', ash:'ash', ballad:'ballad', charon:'onyx', puck:'echo', fenrir:'ash' };
      ttsVoice = OA_MALE[String(ttsVoice||'').toLowerCase()] || sd.ttsVoiceMale || 'onyx';
    } else {
      // صدای زنانه: پیش‌فرضِ امن و سازگار با گپ = gpt-4o-mini-tts (صدای alloy را می‌پذیرد).
      // (قبلاً 'gemini-2.5-flash-tts' بود که روی گپ وجود ندارد → مدلِ ناموجود → خطای TTS.)
      ttsModel = ttsModel || sd.ttsModelFemale || sd.ttsModel || 'gpt-4o-mini-tts';
      ttsVoice = ttsVoice || sd.ttsVoiceFemale || sd.ttsVoice || 'alloy';
    }
    const { provider, realModel } = await resolveModel(ttsModel, 'tts-1');
    if (!provider) return res.json({ ok: false, fallback: true, reason: 'provider_unavailable' });
    // مدل‌های Gemini نام‌های صدای OpenAI را نمی‌شناسند → به نام‌های واقعیِ Gemini نگاشت کن (برای صدای زنانه).
    let voiceToSend = ttsVoice || 'alloy';
    if (/gemini/i.test(String(realModel))) {
      const GEM = new Set(['Zephyr','Kore','Leda','Aoede','Callirrhoe','Autonoe','Despina','Erinome','Laomedeia','Achird','Gacrux','Pulcherrima','Vindemiatrix','Sulafat','Puck','Charon','Fenrir','Orus','Enceladus','Iapetus','Algieba','Algenib','Rasalgethi','Achernar','Schedar','Alnilam','Umbriel','Zubenelgenubi','Sadaltager','Sadachbia']);
      const OA2GEM = {
        alloy: 'Kore', nova: 'Kore', shimmer: 'Aoede', coral: 'Leda', fable: 'Callirrhoe', sage: 'Vindemiatrix',
        onyx: 'Charon', echo: 'Puck', verse: 'Fenrir', ash: 'Orus', ballad: 'Algieba',
      };
      voiceToSend = GEM.has(voiceToSend) ? voiceToSend : (OA2GEM[String(voiceToSend).toLowerCase()] || 'Kore');
    }
    const fmt = (req.body && req.body.format) || 'wav'; // پیش‌فرض wav (برای پلِ صوتیِ تلفن)؛ اپ mp3 می‌خواهد
    const mime = fmt === 'mp3' ? 'audio/mpeg' : fmt === 'wav' ? 'audio/wav' : ('audio/' + fmt);
    // کنترلِ سبکِ گفتار در Gemini TTS: یک دستورِ سبک قبلِ متن می‌گذاریم تا با لهجه ادا کند.
    // Gemini این دستور را اجرا می‌کند و به‌صورتِ متن نمی‌خواند (مخصوصِ مدل‌های Gemini).
    let speakInput = text;
    const accentClean = accent && !['بدون لهجه', 'استاندارد', 'معیار'].includes(accent) ? accent : null;
    if (accentClean && /gemini/i.test(String(realModel))) {
      speakInput = 'این جمله را با لهجهٔ ' + accentClean + ' و کاملاً محاوره‌ای و خودمانی بگو: ' + text;
    }
    console.log('TTS req model=', realModel, 'voice=', voiceToSend, 'accent=', accentClean || '-');
    const ttsUrl = `${provider.baseUrl.replace(/\/$/, "")}/audio/speech`;
    const doTts = (model, input, v) => fetchT(ttsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
      body: JSON.stringify({ model, input, voice: v, response_format: fmt }),
    });
    let r = await doTts(realModel, speakInput, voiceToSend);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      console.error('TTS ERROR model=', realModel, 'voice=', voiceToSend, 'status=', r.status, JSON.stringify(j).slice(0, 300));
      // fallback مقاوم: هر مدل/صدای ناسازگار (مثلِ مدلِ ناموجود یا صدای gemini-only) → مدلِ استانداردِ OpenAI
      const fbModel = 'gpt-4o-mini-tts';
      const fbVoice = isMale ? 'onyx' : 'alloy';
      if (realModel !== fbModel || voiceToSend !== fbVoice) {
        console.log('TTS fallback → model=', fbModel, 'voice=', fbVoice);
        const r2 = await doTts(fbModel, text, fbVoice);
        if (r2.ok) { r = r2; }
        else { const j2 = await r2.json().catch(() => ({})); console.error('TTS fallback ERROR status=', r2.status, JSON.stringify(j2).slice(0, 300)); return res.status(502).json({ error: 'provider_error', detail: j2 }); }
      } else {
        return res.status(502).json({ error: 'provider_error', detail: j });
      }
    }
    const buf = Buffer.from(await r.arrayBuffer());
    console.log('TTS OK model=', realModel, 'voice=', voiceToSend, 'fmt=', fmt, 'took=', (Date.now() - _t0) + 'ms', 'bytes=', buf.length);
    res.json({ ok: true, audioBase64: buf.toString('base64'), mime });
  } catch (e) {
    res.status(502).json({ error: 'fetch_failed', detail: String(e?.message || e) });
  }
});

// ---------------------------------------------------------------------------
// چت واقعی ایجنت — عمومی (اپ اصلی لاگین جدا ندارد). در صورت نبودِ کلید/مدل،
// fallback:true برمی‌گرداند تا فرانت به پاسخ نمونه برگردد.
// ---------------------------------------------------------------------------
// ── چتِ ناهمگام ──
// مسیرِ ایران↔فرانسهٔ آروان، اتصالی که چند ثانیه باز بماند را throttle می‌کند (→ ۵۰۴).
// پس POST فوراً jobId می‌دهد (آنی)، AI در پس‌زمینه اجرا می‌شود، و فرانت با pollِ آنی نتیجه را می‌گیرد.
// صفِ کارِ چت روی دیتابیس ذخیره می‌شود تا با چند-پروسه (cluster) و ری‌استارت هم درست کار کند
// (نسخهٔ قبلی Map در حافظه بود → با چند worker یک poll به workerِ دیگر job را پیدا نمی‌کرد).
const _jobSet = (id, val) =>
  query("INSERT INTO documents (collection,id,data) VALUES ('ai_jobs',$1,$2::jsonb) ON CONFLICT (collection,id) DO UPDATE SET data=$2::jsonb, updated_at=now()", [id, JSON.stringify(val)]);
const _jobGet = async (id) => {
  const r = await query("SELECT data FROM documents WHERE collection='ai_jobs' AND id=$1", [id]);
  return r.rows[0]?.data || null;
};
const _jobDel = (id) => query("DELETE FROM documents WHERE collection='ai_jobs' AND id=$1", [id]);
{ const _gc = setInterval(() => { query("DELETE FROM documents WHERE collection='ai_jobs' AND updated_at < now() - interval '3 minutes'").catch(() => {}); }, 60000); if (_gc.unref) _gc.unref(); }

// راهنمای لهجه‌ها — به مدل واژه‌ها و آهنگِ مشخص می‌دهد تا لهجه واقعاً در متن دیده شود.
const ACCENT_HINTS = {
  'ترکی (آذری)': 'فارسی را با لهجهٔ ترکیِ آذری صحبت کن؛ تعارف‌ها و واژه‌های آذربایجانی را بچاشان (قوربان، جانیم، نه‌نه). دقیقاً با همین حال‌وهوا بنویس، مثالِ سبک: «سلام قوربان! خوبی جانیم؟ نه‌نه‌جان سلام رسوند؛ بیو یه چایی با هم بخوریم دیگه.»',
  'اصفهانی': 'با لهجهٔ اصفهانی صحبت کن؛ کشیدنِ آخرِ جمله‌ها و واژه‌هایی مثلِ «سی کن»، «چِطو»، «دیه». مثالِ سبک: «چطوری؟ خوبی؟ سی کن چقد وقته ندیدمت، بیو یه سر بزن دیه!»',
  'شیرازی': 'با لهجهٔ شیرازی صحبت کن؛ «کاکو»، «نمیشد که»، آهنگِ نرم و کشیده. مثالِ سبک: «کاکو خوبی؟ کجایی تو؟ نمیشد یه زنگ بزنی، دلمون تنگ شد برات.»',
  'مشهدی': 'با لهجهٔ مشهدی/خراسانی صحبت کن؛ «شومو»، «موری». مثالِ سبک: «سلام، چطوری شومو؟ کجا موری؟ بیو ببینم چه خبرا ازت.»',
  'یزدی': 'با لهجهٔ یزدی صحبت کن؛ کشیدنِ کلمات و آهنگِ مخصوصِ یزدی. مثالِ سبک: «چطوری؟ خوبی؟ خیلی وقته ازت خبری نیس‌ها.»',
  'گیلکی': 'با ته‌لهجهٔ گیلکی/شمالی صحبت کن؛ گاهی واژه‌های گیلکی و آهنگِ شمالی. مثالِ سبک: «خوبی تو؟ مو خوبمه، بیه بشیم یه دوری بزنیم.»',
  'کردی': 'با ته‌لهجهٔ کردی صحبت کن؛ گاهی واژه‌های کردی و آهنگِ کردی. مثالِ سبک: «کاکه، چونی؟ باش بوم، بیو لای هم چایێک بخۆینەوە.»',
  'لری': 'با ته‌لهجهٔ لری صحبت کن؛ گاهی واژه‌های لری و آهنگِ لری. مثالِ سبک: «هِی گَپ، خوبی؟ کوجا بی؟ بیو یه سر بزن.»',
  'آبادانی': 'با لهجهٔ آبادانی/جنوبی صحبت کن؛ «بیو»، «اوناهاش». مثالِ سبک: «اوس، چطوری داداش؟ کوجایی تو؟ بیو ببینُم چه خبر.»',
};
function accentHint(ac) { return ACCENT_HINTS[ac] || ('با گویش و لهجهٔ «' + ac + '» و واژه‌ها و آهنگِ همان لهجه صحبت کن.'); }

// ── حافظهٔ بلندمدت: «پروندهٔ پایدارِ کاربر» (دوسیه) ──
// دوسیه ساختاریافته است تا حقایقِ مهمِ کاربر هرگز گم نشوند و همهٔ ایجنت‌ها دقیقاً بدانند با چه کسی طرف‌اند.
const DOSSIER_FIELDS = [
  ['name', 'نام'], ['job', 'شغل/سمت'], ['company', 'کسب‌وکار/شرکت'], ['location', 'محل'],
  ['family', 'خانواده و نزدیکان'], ['likes', 'علاقه‌مندی‌ها'], ['dislikes', 'بیزاری‌ها'],
  ['personality', 'شخصیت'], ['communicationStyle', 'سبکِ ارتباطی/لحنِ موردِعلاقه'],
  ['goals', 'هدف‌ها و کارهای جاری'], ['keyFacts', 'حقایقِ مهمِ ماندگار'],
];
function renderDossier(d) {
  if (!d || typeof d !== 'object') return '';
  const lines = [];
  for (const [k, label] of DOSSIER_FIELDS) {
    let v = d[k];
    if (Array.isArray(v)) v = v.filter(Boolean).join('، ');
    v = (v == null) ? '' : String(v).trim();
    if (v) lines.push(`- ${label}: ${v}`);
  }
  return lines.join('\n');
}
// JSON خامِ خروجیِ مدل را تحمل‌پذیر پارس کن (پاک‌کردنِ ``` و گرفتنِ اولین آبجکت)
function _parseDossierJSON(raw) {
  try {
    let t = String(raw || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/,'').trim();
    const i = t.indexOf('{'), k = t.lastIndexOf('}');
    if (i >= 0 && k > i) t = t.slice(i, k + 1);
    const o = JSON.parse(t);
    return (o && typeof o === 'object') ? o : null;
  } catch (_) { return null; }
}
// ادغامِ مطمئن: مدل باید ادغام کند، ولی برای اطمینان آرایه‌ها را هم با قبلی یکی می‌کنیم تا حقیقتی گم نشود.
function _mergeDossier(prev, next) {
  const out = {};
  const ARR = new Set(['family', 'likes', 'dislikes', 'goals', 'keyFacts']);
  for (const [k] of DOSSIER_FIELDS) {
    if (ARR.has(k)) {
      const a = Array.isArray(prev?.[k]) ? prev[k] : [];
      const b = Array.isArray(next?.[k]) ? next[k] : [];
      const seen = new Set(); const merged = [];
      for (const v of [...a, ...b]) {
        const s = String(v || '').trim(); if (!s) continue;
        const key = s.toLowerCase().replace(/\s+/g, '');
        if (seen.has(key)) continue; seen.add(key); merged.push(s);
      }
      if (merged.length) out[k] = merged.slice(-16); // سقفِ سخاوتمندانه
    } else {
      const v = (next?.[k] != null && String(next[k]).trim()) ? String(next[k]).trim() : (prev?.[k] || '');
      if (v) out[k] = v;
    }
  }
  return out;
}
// خلاصهٔ کوتاهِ یک‌خطی برای جاهایی که فقط چند حقیقتِ کلیدی لازم است (مثلِ تماسِ تلفنی)
function dossierBrief(d) {
  if (!d || typeof d !== 'object') return '';
  const parts = [];
  if (d.name) parts.push(String(d.name));
  if (d.job) parts.push(String(d.job));
  if (d.company) parts.push(String(d.company));
  const kf = Array.isArray(d.keyFacts) ? d.keyFacts.slice(0, 3).filter(Boolean) : [];
  let s = parts.join('، ');
  if (kf.length) s += (s ? ' — ' : '') + kf.join('؛ ');
  return s.trim();
}

// واگذاری به ایجنتِ دیگر: ایجنتِ مقصد را با نام/نقش/شناسه پیدا و یک نوبت ازش سوال می‌پرسد.
async function askAgent(req, fromAgentId, targetNameOrId, question) {
  try {
    const ar = await query("SELECT id, data FROM documents WHERE collection='agents'");
    const list = ar.rows.map((r) => ({ id: String(r.id), name: String(r.data?.name || ''), role: String(r.data?.role || '') }));
    const q = String(targetNameOrId || '').trim().toLowerCase();
    if (!q) return '';
    const norm = (x) => x.toLowerCase();
    let target = list.find((a) => norm(a.id) === q)
      || list.find((a) => norm(a.name) === q)
      || list.find((a) => (a.name && (norm(a.name).includes(q) || q.includes(norm(a.name)))) || (a.role && (norm(a.role).includes(q) || q.includes(norm(a.role)))))
      || null;
    if (!target || target.id === fromAgentId) return '';
    const fakeReq = { headers: req.headers, user: req.user, body: { agentId: target.id, messages: [{ role: 'user', content: String(question || '') }], _nested: true } };
    const r = await runChat(fakeReq);
    const txt = (r && r.text) ? String(r.text).trim() : '';
    return txt ? `«${target.name || target.id}» می‌گوید: ${txt}` : '';
  } catch (_) { return ''; }
}

// ── مخاطبینِ کاربر (وارد شده از گوشی) ──
function _normName(s) { return String(s || '').toLowerCase().replace(/\s+/g, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').trim(); }
function _normPhone(p) { return String(p || '').replace(/[^0-9+]/g, ''); }
// روی تماس: رشته‌های عددیِ بلند (مثلِ شمارهٔ تلفن) را به حروفِ فارسیِ تک‌تک تبدیل کن تا TTS آن‌ها را
// دانه‌دانه و فارسی بخواند، نه انگلیسی و نه یکجا. اعدادِ کوتاه (زمان/تعداد) دست‌نخورده می‌مانند.
const _FA_DIGIT_WORDS = ['صفر', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
function _spellLongNumbersFa(text) {
  const ascii = String(text || '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  return ascii.replace(/\d{5,}/g, (m) => m.split('').map((d) => _FA_DIGIT_WORDS[+d]).join('، '));
}
async function lookupContact(sub, name) {
  try {
    const r = await query("SELECT data FROM documents WHERE collection='contacts' AND id=$1", ['usr_' + sub]);
    const list = (r.rows[0]?.data?.list) || [];
    if (!list.length) return null;
    const q = _normName(name);
    if (!q) return null;
    const hit = list.find((c) => _normName(c.name) === q)
      || list.find((c) => { const n = _normName(c.name); return n && (n.includes(q) || q.includes(n)); });
    return hit ? _normPhone(hit.phone) : null;
  } catch (_) { return null; }
}

// شمارشِ توکن — مجموعِ مصرفِ هر کاربر (و به‌تفکیکِ ایجنت)
function usageTokens(j) { const u = j && j.usage; if (!u) return 0; return Number(u.total_tokens) || ((Number(u.prompt_tokens) || 0) + (Number(u.completion_tokens) || 0)); }
async function addTokenUsage(sub, tokens, agentId) {
  const n = Number(tokens) || 0;
  if (sub == null || n <= 0) return 0;
  const id = 'usr_' + sub;
  try {
    const r = await query("SELECT data FROM documents WHERE collection='usage' AND id=$1", [id]);
    const d = r.rows[0]?.data || { used: 0, balance: 0 };
    d.used = (Number(d.used) || 0) + n;
    d.lastTs = Date.now();
    if (agentId) { d.byAgent = d.byAgent || {}; d.byAgent[agentId] = (Number(d.byAgent[agentId]) || 0) + n; }
    await query("INSERT INTO documents (collection,id,company,data) VALUES ('usage',$1,$2,$3::jsonb) ON CONFLICT (collection,id) DO UPDATE SET data=$3::jsonb, updated_at=now()", [id, id, JSON.stringify(d)]);
    return d.used;
  } catch (_) { return 0; }
}

// افزودنِ یک پیام (از طرفِ ایجنت) به چتِ کاربر — برای اعلان‌ها/گزارش‌ها
async function appendAssistantMessage(sub, agentId, content, title) {
  try {
    const cid = 'chat_' + sub + '_' + (agentId || 'assistant');
    const cr = await query("SELECT data FROM documents WHERE collection='chats' AND id=$1", [cid]);
    const d = cr.rows[0]?.data || {};
    let sessions = Array.isArray(d.sessions) ? d.sessions : [];
    let active = sessions.find((sx) => String(sx.id) === String(d.activeId));
    if (!active) {
      active = { id: Date.now(), title: title || 'گفتگو', date: new Date().toLocaleDateString('fa-IR'), ts: Date.now(), messages: [] };
      sessions.unshift(active); d.activeId = active.id;
    }
    active.messages.push({ role: 'assistant', content, ts: Date.now() });
    active.ts = Date.now();
    await query("INSERT INTO documents (collection,id,company,data) VALUES ('chats',$1,$2,$3::jsonb) ON CONFLICT (collection,id) DO UPDATE SET data=$3::jsonb, updated_at=now()",
      [cid, 'usr_' + sub, JSON.stringify({ sessions: sessions.slice(0, 500), activeId: d.activeId, agentId: agentId || 'assistant', name: d.name || '' })]);
  } catch (_) {}
}
// تحویلِ زندهٔ یک پیام به کاربر (هم در poll گزارش‌ها، هم در تاریخچهٔ چت)
async function deliverToUser(sub, agentId, text, target, idSuffix) {
  if (!sub) return;
  const rid = 'rpt_' + (idSuffix || (Date.now() + '_' + Math.random().toString(36).slice(2, 6)));
  try {
    await query("INSERT INTO documents (collection,id,company,data) VALUES ('call_reports',$1,$2,$3::jsonb) ON CONFLICT (collection,id) DO UPDATE SET data=$3::jsonb, updated_at=now()",
      [rid, 'usr_' + sub, JSON.stringify({ sub, agentId: agentId || 'assistant', target: target || '', summary: text, text, ts: Date.now(), delivered: false })]);
  } catch (_) {}
  await appendAssistantMessage(sub, agentId, text, 'تماس');
}
// تماسِ زنجیره‌ایِ معلق: آخرین موردِ pending برای این کاربر
async function getPendingChain(sub) {
  try {
    const r = await query("SELECT id, data FROM documents WHERE collection='pending_calls' AND data->>'sub'=$1 AND data->>'status'='pending' ORDER BY updated_at DESC LIMIT 1", [String(sub)]);
    return r.rows[0] ? { _id: r.rows[0].id, ...r.rows[0].data } : null;
  } catch (_) { return null; }
}
async function savePending(d) {
  await query("INSERT INTO documents (collection,id,company,data) VALUES ('pending_calls',$1,$2,$3::jsonb) ON CONFLICT (collection,id) DO UPDATE SET data=$3::jsonb, updated_at=now()", [d.id, null, JSON.stringify(d)]);
}
// بعد از پنجرهٔ مهلت، اگر کاربر لغو نکرده بود، تماسِ دوم را برقرار کن.
function scheduleChainFire(pcId, delayMs) {
  setTimeout(async () => {
    try {
      const r = await query("SELECT data FROM documents WHERE collection='pending_calls' AND id=$1", [pcId]);
      const d = r.rows[0]?.data;
      if (!d || d.status !== 'pending') return; // لغو شده یا قبلاً اجرا شده
      d.status = 'placed'; d.updatedAt = Date.now();
      await savePending(d);
      await placeCall({ agentId: d.agentId, agentName: d.agentName, targetName: d.targetName, targetNumber: d.number, purpose: d.purpose, requestedBy: d.requestedBy, requestedBySub: d.sub, company: d.company });
      console.log('chain-call → pending window passed, calling', d.number);
    } catch (e) { console.error('chain fire error', String(e?.message || e)); }
  }, delayMs);
}

async function runChat(req) {
  const _t0 = Date.now();
  try {
    const { agentId, model: modelOverride, messages, voice: voiceMode } = req.body || {};
    // حالتِ تماسِ تلفنی: پلِ صوتی هدف/مخاطب/سفارش‌دهنده را می‌فرستد تا پرامپتِ مخصوصِ تماس ساخته شود.
    const phone = (req.body && req.body.phone && typeof req.body.phone === 'object') ? req.body.phone : null;
    console.log('AI /chat run — agent=', agentId, 'override=', modelOverride || '-', voiceMode ? '(voice)' : '', phone ? '(phone)' : '');

    // ایجنت و مدل انتساب‌یافته
    let agentDoc = null;
    if (agentId) {
      const r = await query("SELECT data FROM documents WHERE collection='agents' AND id=$1", [agentId]);
      agentDoc = r.rows[0]?.data || null;
    }
    const modelId = modelOverride || agentDoc?.modelId;
    let useModelId = modelId;
    // اگر ایجنت مدلِ چت ندارد: اولین مدلِ چتِ کاتالوگ، وگرنه مدلِ هر ایجنتِ دیگری که مدل دارد.
    if (!useModelId) {
      const dm = await query(
        "SELECT id FROM documents WHERE collection='ai_models' AND coalesce(data->>'kind','chat')='chat' AND coalesce(data->>'enabled','true') <> 'false' ORDER BY updated_at LIMIT 1",
      );
      useModelId = dm.rows[0]?.id;
    }
    if (!useModelId) {
      const am = await query(
        "SELECT data->>'modelId' AS m FROM documents WHERE collection='agents' AND coalesce(data->>'modelId','') <> '' LIMIT 1",
      );
      useModelId = am.rows[0]?.m || null;
    }

    // مدل → ارائه‌دهنده (در نبودِ کاتالوگ، نام مدلِ پیش‌فرض روی provider فعال)
    let providerId = 'noyan';
    let realModel = useModelId || process.env.DEFAULT_CHAT_MODEL || 'gpt-4o-mini';
    if (useModelId) {
      const mr = await query("SELECT data FROM documents WHERE collection='ai_models' AND id=$1", [useModelId]);
      const modelDoc = mr.rows[0]?.data;
      if (modelDoc) { providerId = modelDoc.provider || providerId; realModel = modelDoc.modelId || useModelId; }
    }

    // provider: ابتدا با شناسه؛ وگرنه اولین provider فعالِ دارای کلید
    let provider = await getProvider(providerId);
    if (!provider || provider.enabled === false || !provider.apiKey) {
      const all = await query("SELECT data FROM documents WHERE collection='ai_providers'");
      provider = all.rows.map((row) => row.data).find((pr) => pr.enabled !== false && pr.apiKey) || null;
    }
    if (!provider) return { ok: false, fallback: true, reason: 'provider_unavailable' };

    // ── حافظهٔ شخصیِ کاربر (مشترک بینِ همهٔ ایجنت‌ها) ──
    // هر چه کاربر به هر ایجنتی می‌گوید این‌جا ثبت می‌شود و همهٔ ایجنت‌ها (به‌ویژه دستیار شخصی) آن را می‌بینند.
    const me = optionalUser(req);
    // اگر سوپرادمین این ایجنت را برای کاربر غیرفعال یا منقضی کرده، اجازهٔ گفتگو نده (دستیار شخصی استثناست).
    if (!phone && me && me.sub != null && agentId && agentId !== 'assistant') {
      try {
        const ur = await query('SELECT meta FROM app_users WHERE id=$1', [me.sub]);
        const g = ur.rows[0]?.meta?.agentGrants?.[agentId];
        if (g) {
          const expired = g.expiresAt ? (new Date(g.expiresAt).getTime() < Date.now()) : false;
          if (g.active === false) return { ok: true, text: 'این ایجنت برای حسابِ شما غیرفعال شده است. برای فعال‌سازی با پشتیبانی تماس بگیرید.', model: null, blocked: true };
          if (expired) return { ok: true, text: 'مدتِ اعتبارِ این ایجنت به پایان رسیده است؛ برای تمدید اقدام کنید.', model: null, blocked: true };
        }
      } catch (_) {}
    }
    // تنظیماتِ شخصیِ این کاربر برای این ایجنت (per-user): فقط نام/نقش/شخصیت/صدا/خوش‌آمد را override می‌کند.
    console.log('AI chat auth — sub=', me ? me.sub : '(no me / not authenticated)', 'agentId=', agentId);
    if (me && me.sub != null && agentId && agentDoc) {
      try {
        const pr = await query("SELECT data FROM documents WHERE collection='agent_prefs' AND id=$1", ['pref_' + me.sub + '_' + agentId]);
        const pf = pr.rows[0]?.data;
        console.log('AI chat prefs — key=', 'pref_' + me.sub + '_' + agentId, 'found=', !!pf, pf ? ('lang=' + (pf.lang||'-') + ' accent=' + (pf.accent||'-') + ' name=' + (pf.name||'-')) : '');
        if (pf && typeof pf === 'object') {
          agentDoc = { ...agentDoc,
            name: pf.name || agentDoc.name,
            welcomeMsg: pf.welcomeMsg || agentDoc.welcomeMsg,
            ttsVoice: pf.ttsVoice || agentDoc.ttsVoice,
            handoff: (pf.handoff && typeof pf.handoff === 'object') ? pf.handoff : agentDoc.handoff,
            persona: { ...(agentDoc.persona || {}), ...(pf.tone ? { tone: pf.tone } : {}), ...(pf.gender ? { gender: pf.gender } : {}), ...(pf.age ? { age: pf.age } : {}), ...(pf.lang ? { lang: pf.lang } : {}), ...(pf.accent ? { accent: pf.accent } : {}) },
          };
          // نقش از سندِ پایه (سوپرادمین) خوانده می‌شود و کاربر آن را عوض نمی‌کند — pref.role نادیده.
        }
      } catch (_) {}
    }
    const lastUser = [...(Array.isArray(messages) ? messages : [])].reverse().find((m) => m && m.role === 'user' && m.content);
    const isWelcome = !!(req.body && req.body.welcome);
    // لغوِ تماسِ دومِ زنجیره‌ای: اگر در پنجرهٔ مهلت کاربر «لغو» بنویسد، تماسِ دوم انجام نشود.
    if (!phone && !isWelcome && me && me.sub != null && lastUser && /لغو|کنسل|cancel|زنگ نزن|تماس نگیر|نگیر/i.test(String(lastUser.content || ''))) {
      try {
        const pend = await getPendingChain(me.sub);
        if (pend) {
          pend.status = 'cancelled'; pend.updatedAt = Date.now();
          await savePending({ id: pend._id, ...pend, _id: undefined });
          return { ok: true, text: `باشه، تماسِ دوم با ${pend.targetName || 'آن شماره'} (${pend.number}) لغو شد و انجام نمی‌شود.` };
        }
      } catch (_) {}
    }
    // ذخیرهٔ تاریخچهٔ کاملِ گفتگو per-user per-agent (برای نمایش به کاربر)
    // مدلِ ChatGPT: هر گفتگو یک «پرونده/سشن» است که خودکار و زنده ذخیره می‌شود (بدون پیش‌نویس و بدون پرسش).
    // اولین پیامِ هر گفتگو یک سشنِ جدید می‌سازد؛ «گفتگوی جدید» activeId را خالی می‌کند تا سشنِ بعدی ساخته شود.
    const persistChat = async (replyText) => {
      if (isWelcome || !me || me.sub == null || !lastUser) return;
      const cid = 'chat_' + me.sub + '_' + (agentId || 'assistant');
      try {
        const cr = await query("SELECT data FROM documents WHERE collection='chats' AND id=$1", [cid]);
        const d = cr.rows[0]?.data || {};
        let sessions = Array.isArray(d.sessions) ? d.sessions : [];
        let active = sessions.find((sx) => String(sx.id) === String(d.activeId));
        if (!active) {
          active = { id: Date.now(), title: String(lastUser.content).slice(0, 60) || 'گفتگو', date: new Date().toLocaleDateString('fa-IR'), ts: Date.now(), messages: [] };
          sessions.unshift(active);
          d.activeId = active.id;
        }
        active.messages.push({ role: 'user', content: String(lastUser.content).slice(0, 1200), ts: Date.now() });
        active.messages.push({ role: 'assistant', content: String(replyText || '').slice(0, 4000), ts: Date.now() });
        active.messages = active.messages.slice(-400);
        active.ts = Date.now();
        sessions = sessions.slice(0, 500); // سقفِ بالا (عملاً بی‌نهایت)
        await query("INSERT INTO documents (collection, id, company, data) VALUES ('chats',$1,$2,$3::jsonb) ON CONFLICT (collection, id) DO UPDATE SET data=$3::jsonb, updated_at=now()",
          [cid, 'usr_' + me.sub, JSON.stringify({ sessions, activeId: d.activeId, agentId: agentId || 'assistant', name: me.name || '' })]);
      } catch (_) {}
    };

    let memoryStr = '';
    let _recentNotes = [];      // یادداشت‌های اخیر (برای به‌روزرسانیِ پروفایل)
    let _userDossier = null;    // پروندهٔ ساختاریافتهٔ کاربر (حافظهٔ بلندمدت)
    let _hasUser = !!(me && me.sub != null);
    if (me && me.sub != null) {
      const memId = 'usr_' + me.sub;
      let notes = [];
      try {
        const mr = await query("SELECT data FROM documents WHERE collection='memory' AND id=$1", [memId]);
        notes = Array.isArray(mr.rows[0]?.data?.notes) ? mr.rows[0].data.notes : [];
      } catch (_) {}
      // عمقِ حافظه قابل‌تنظیم: اول مقدارِ خودِ ایجنت (memoryDepth)، وگرنه پیش‌فرضِ سراسریِ سوپرادمین (aiMemoryDepth)
      let memDepth = 50;
      try { const sr = await query('SELECT data FROM settings WHERE id = 1'); const gd = Number(sr.rows[0]?.data?.aiMemoryDepth); if (Number.isFinite(gd) && gd > 0) memDepth = gd; } catch (_) {}
      const adDepth = Number(agentDoc?.memoryDepth);
      if (Number.isFinite(adDepth) && adDepth > 0) memDepth = adDepth;
      memDepth = Math.min(Math.floor(memDepth), 500);
      const recent = notes.slice(-memDepth);
      _recentNotes = recent;
      if (me.name) memoryStr += `\nنامِ کاربر: ${me.name}.`;
      // حافظهٔ بلندمدت: «پروندهٔ پایدارِ کاربر» (دوسیه) همیشه تزریق می‌شود (هیچ‌وقت trim نمی‌شود — حتی سال‌ها بعد)
      try {
        const pr2 = await query("SELECT data FROM documents WHERE collection='profile' AND id=$1", ['usr_' + me.sub]);
        const pdata = pr2.rows[0]?.data || {};
        _userDossier = (pdata.dossier && typeof pdata.dossier === 'object') ? pdata.dossier : null;
        const dossierTxt = renderDossier(_userDossier);
        if (dossierTxt) {
          memoryStr += '\n\n— پروندهٔ پایدارِ این کاربر (حافظهٔ بلندمدتِ تو دربارهٔ او؛ همیشه و در همهٔ پاسخ‌ها در نظر بگیر و بر اساسش با او رفتار کن — کیست، شخصیتش، چه دوست دارد و چه ندارد، چه می‌خواهد):\n' + dossierTxt;
        } else {
          const psum = String(pdata.summary || '');
          if (psum) memoryStr += '\n\n— پروندهٔ پایدارِ این کاربر (همیشه در نظر بگیر — کیست، چه دوست دارد، چه دوست ندارد، شخصیت و ترجیحاتش):\n' + psum;
        }
      } catch (_) {}
      if (recent.length) {
        memoryStr += '\n\nتو این کاربر را خوب می‌شناسی. این‌ها همهٔ چیزهایی است که او به تو و ایجنت‌های دیگر گفته؛ از آن‌ها شخصیت، برنامهٔ امروز، قرارها و کارهایی که باید انجام دهد را استنباط کن و پاسخت را کاملاً شخصی، دقیق و فعالانه بده:\n'
          + recent.map((n) => `- [${n.agent || 'دستیار'}] ${n.text}`).join('\n');
      }
      // پیامِ جدیدِ کاربر را در حافظه ثبت کن تا ایجنت‌های دیگر هم ببینند (به‌جز پیامِ خوشامد)
      if (lastUser && !isWelcome) {
        notes.push({ agent: agentId || 'assistant', text: String(lastUser.content).slice(0, 300), ts: Date.now() });
        const trimmed = notes.slice(-500); // ذخیرهٔ سخاوتمندانه؛ عمقِ موردِاستفاده با aiMemoryDepth کنترل می‌شود
        try {
          await query(
            "INSERT INTO documents (collection, id, company, data) VALUES ('memory',$1,$2,$3::jsonb) ON CONFLICT (collection, id) DO UPDATE SET data=$3::jsonb, updated_at=now()",
            [memId, memId, JSON.stringify({ notes: trimmed })]
          );
        } catch (_) {}
      }
    }

    // هویت و سبکِ شخصی‌سازی‌شدهٔ کاربر — بر دستورالعملِ پایه (حتی نامِ بِیک‌شده در instructions) اولویت دارد
    const p = agentDoc?.persona || {};
    const _genderFa = (g) => (g === 'm' || g === 'مرد') ? 'مرد' : (g === 'f' || g === 'زن') ? 'زن' : g;
    const _lang = p.lang || agentDoc?.lang;
    const idn = [];
    if (agentDoc?.name) idn.push(`نامِ تو دقیقاً «${agentDoc.name}» است. همیشه و فقط خودت را با همین نام معرفی کن؛ اگر در متنِ بالا نامِ دیگری آمده آن را کاملاً نادیده بگیر.`);
    if (p.tone) idn.push(`لحنِ گفتگوی تو: ${p.tone}.`);
    if (p.age) idn.push(`مانندِ یک فردِ ${p.age} صحبت کن.`);
    if (p.gender) idn.push(`جنسیتِ تو ${_genderFa(p.gender)} است.`);
    // لهجه/گویش — مدل در متن، واژه‌ها و آهنگِ کلامِ آن لهجه را تقلید می‌کند
    if (p.accent && !['بدون لهجه', 'استاندارد', 'معیار'].includes(p.accent)) {
      idn.push('لهجه (الزامی): ' + accentHint(p.accent) + ' این لهجه باید در همهٔ جواب‌هایت کاملاً مشهود باشد، نه فارسیِ رسمیِ معیار.');
    }
    // زبان — دستورِ قاطع، ترجیحاً به همان زبانِ هدف تا مدل حتماً رعایت کند
    const LANG_RULE = {
      'انگلیسی': 'CRITICAL INSTRUCTION: You MUST reply ONLY in English. Even if the user writes in Persian/Farsi, your entire reply must be in English. Never reply in Persian.',
      'عربی': 'تعليمات إلزامية: يجب أن تردّ باللغة العربية فقط. حتى لو كتب المستخدم بالفارسية، يكون ردّك كاملاً بالعربية. لا تردّ بالفارسية إطلاقاً.',
      'دو زبانه': 'به‌صورتِ دوزبانه پاسخ بده: هر پاسخ را اول به فارسی و بلافاصله زیرِ آن، ترجمهٔ کاملِ انگلیسیِ همان را بنویس.',
    };
    if (_lang && LANG_RULE[_lang]) idn.push(LANG_RULE[_lang]);
    else if (_lang && _lang !== 'فارسی') idn.push(`همیشه و فقط به زبانِ «${_lang}» پاسخ بده، حتی اگر کاربر به زبانِ دیگری بنویسد. این الزامی است.`);
    const identityStr = idn.length ? `\n\n— هویت و سبکِ تو (این موارد از هر دستورِ قبلی مهم‌تر و الزامی‌اند):\n- ${idn.join('\n- ')}` : '';
    // مخاطبینِ کاربر را فقط وقتی پیام دربارهٔ تماس/شماره است تزریق کن (تا پرامپت سنگین نشود)
    let contactsStr = '';
    if (!phone && me && me.sub != null && lastUser && /زنگ|تماس|بگیر|تلفن|شماره|call|phone|dial/i.test(String(lastUser.content || ''))) {
      try {
        const cc = await query("SELECT data FROM documents WHERE collection='contacts' AND id=$1", ['usr_' + me.sub]);
        const clist = (cc.rows[0]?.data?.list) || [];
        if (clist.length) contactsStr = '\n\nمخاطبینِ کاربر (هنگامِ تماس، نام را چه فارسی چه انگلیسی با این فهرست تطبیق بده و شمارهٔ همان را به ابزارِ make_call بده):\n' + clist.slice(0, 300).map((c) => `- ${c.name}: ${c.phone}`).join('\n');
      } catch (_) {}
    }
    // قوانینِ ارجاع به اپراتورِ انسانی (هندآف) — اگر فعال باشند، رفتارِ ایجنت را عوض می‌کنند
    const HO_MAP = {
      angry: 'کاربر عصبانی، ناراحت یا ناراضی باشد',
      complex: 'سوالی خارج از دانش یا تخصصِ تو پرسیده شود',
      finance: 'موضوعاتِ مالی، پرداخت یا تراکنش مطرح شود',
      legal: 'موضوعاتِ حقوقی یا قراردادی مطرح شود',
      userRequest: 'کاربر بخواهد با یک انسان صحبت کند',
      repeat: 'کاربر یک سوال را بیش از سه بار تکرار کند',
    };
    const _ho = (agentDoc?.handoff && typeof agentDoc.handoff === 'object') ? Object.keys(HO_MAP).filter((k) => agentDoc.handoff[k]) : [];
    const handoffStr = _ho.length ? `\n\n— ارجاع به اپراتورِ انسانی: اگر هر یک از این شرایط رخ داد، دیگر خودت ادامه نده؛ مودبانه به کاربر بگو که موضوع را همین حالا به یک همکارِ انسانی ارجاع می‌دهی تا پیگیری کند:\n- ${_ho.map((k) => HO_MAP[k]).join('\n- ')}` : '';
    const langClause = (_lang && _lang !== 'فارسی') ? '' : ' و به زبان فارسی';
    const voiceHint = voiceMode ? ' این یک مکالمهٔ صوتیِ زنده است؛ خیلی کوتاه و محاوره‌ای جواب بده (حداکثر یکی دو جملهٔ کوتاه)، بدونِ فهرست، علامت یا ایموجی.' : '';
    // پرامپتِ مخصوصِ تماسِ تلفنی — ایجنت روی تماس باید با «طرفِ مقابل» تعامل کند، نه مثلِ چتِ دستیار رفتار کند.
    let phoneSys = null;
    if (phone) {
      // اگر نامِ صاحبِ کار خالی یا فقط عدد/شماره بود، شماره را به زبان نیاور — عمومی بگو.
      const byOk = phone.by && phone.by !== 'chat' && !/^[\d\s+\-()]+$/.test(String(phone.by));
      const who = byOk ? phone.by : 'صاحبِ کارم';
      const nm = (agentDoc && agentDoc.name) || 'دستیار';
      phoneSys = `تو «${nm}» هستی؛ یک دستیارِ تلفنیِ مودب، باهوش و کاملاً طبیعی که به‌نمایندگی از «${who}» با تلفن به «${phone.target || 'مخاطب'}» زنگ زده‌ای. تو تماس‌گیرنده‌ای، نه گیرنده.\n`
        + `هدفی که «${who}» از تو خواسته و باید در این تماس به نتیجه برسانی: ${phone.purpose || '-'}.\n`
        + `قواعدِ مهم:\n`
        + `- در شروع کوتاه سلام کن، بگو «من دستیارِ هوشمندِ ${who} هستم»، علتِ تماس را در یک جمله بگو، بعد منتظرِ پاسخِ طرفِ مقابل بمان.\n`
        + `- خیلی کوتاه، محاوره‌ای و انسانی حرف بزن (یکی‌دو جملهٔ کوتاه). به حرفِ طرف دقیق گوش بده، گفتگو را رو به جلو ببر و خودت را بی‌جهت تکرار نکن.\n`
        + `- تو همین الان روی یک تماسِ زنده‌ای و کاملاً اجازه و اختیارِ انجامِ این کار را داری. این جمله‌ها مطلقاً ممنوع‌اند: «اجازه ندارم»، «نمی‌توانم»، «شماره‌ای ندارم»، «دسترسی ندارم». هیچ‌وقت کارِ خواسته‌شده را رد نکن.\n`
        + `- تنها چیزی که نباید بی‌جهت لو بدهی، اطلاعاتِ خصوصیِ خودِ «${who}» (مثلِ شمارهٔ شخصیِ او) است. اما هر اطلاعاتی که طرفِ مقابل به تو می‌گوید (مثلِ یک شماره، آدرس یا زمان) را آزادانه می‌توانی بشنوی، با صدای بلند تکرار کنی و تأیید کنی — این هیچ اشکالی ندارد.\n`
        + `- اگر هدفِ تماس «گرفتنِ یک اطلاعات» است (مثلِ یک شمارهٔ تلفن): با دقت گوش بده، از طرف بخواه آرام و رقم‌به‌رقم بگوید، بعد همان را یک‌بار شمرده برایش بخوان تا تأیید کند، و به‌محضِ اینکه گفت یا تأیید کرد، قبولش کن و تشکر کن. حداکثر یک‌بار برای اطمینان بپرس؛ هرگز چند بار پشتِ‌سرِهم نگو «نفهمیدم» و بحث و تنش ایجاد نکن.\n`
        + `- خواندنِ هر عدد (شماره، تاریخ، مبلغ) همیشه باید کاملاً فارسی و تک‌تکِ ارقام باشد، نه انگلیسی و نه به‌صورتِ عددِ یکجا. هرگز رقم‌ها را با کاراکترِ عددی (مثلِ ۰۹۱۲) ننویس؛ هر رقم را با حروفِ فارسی و جدا بنویس. مثال: شمارهٔ «09123» را این‌طور بخوان: «صفر، نُه، یک، دو، سه». آرام و با مکثِ کوتاه بینِ ارقام.\n`
        + `- طرفِ مقابل معمولاً شماره را گروهی و محاوره‌ای می‌گوید (مثلِ «صفر، نهصد و دوازده، نهصد و سی و دو، هفت، نهصد و شش»). تو باید این را دقیق به دنبالهٔ ارقامِ تک‌تک باز کنی: «نهصد و دوازده» یعنی «نه، یک، دو»؛ «نهصد و سی و دو» یعنی «نه، سه، دو»؛ «هفت» یعنی «هفت»؛ «نهصد و شش» یعنی «نه، صفر، شش». پس آن مثال می‌شود: صفر، نه، یک، دو، نه، سه، دو، هفت، نه، صفر، شش. کلِ شماره را به همین شکلِ رقم‌به‌رقم بفهم و همان را برای تأیید بخوان.\n`
        + `- اگر چیزی را خوب نشنیدی، فقط یک‌بار مودبانه بگو «ببخشید، لطفاً یک‌بارِ دیگر آرام‌تر بفرمایید»؛ بعد از آن دیگر اصرارِ مکرر نکن و با همان چیزی که داری جلو برو.\n`
        + `- وقتی هدف انجام شد یا طرف خداحافظی کرد، یک جملهٔ کوتاهِ خداحافظیِ مودبانه بگو و دقیقاً در انتهای همان جمله این نشانه را بگذار: [[END]] — این نشانه فقط برای سیستم است، خوانده نمی‌شود و بعد از آن دیگر چیزی نگو. (یعنی هر وقت طرف گفت «خداحافظ/قطع می‌کنم/کاری ندارید»، تو هم خداحافظی کن و [[END]] بگذار تا تماس بسته شود.)`;
      const _brief = dossierBrief(_userDossier);
      if (_brief) phoneSys += `\nچیزهایی که دربارهٔ «${who}» می‌دانی (فقط برای اینکه بهتر و دقیق‌تر کارش را پیش ببری؛ بی‌جهت فاش نکن): ${_brief}`;
    }
    let sys = phoneSys || ((agentDoc
      ? `تو «${agentDoc.name}» هستی، ${agentDoc.role}. ${agentDoc.instructions || ''}${identityStr}${handoffStr}\n\nپاسخ‌ها را کوتاه و مودبانه${langClause} بده.${voiceHint}`
      : 'پاسخ کوتاه و فارسی بده.' + voiceHint) + memoryStr + contactsStr);
    // مغزِ داین: چتِ ایجنتِ داین با دادهٔ «واقعیِ» رستورانِ همین کاربر غنی می‌شود (فروش/منو/فودکاست/انبار/نیرو).
    if (!phone && me && me.sub != null && agentId === 'dine') {
      try {
        const ins = await computeDineInsights(me.sub);
        let dt = dineInsightsText(ins);
        try {
          const cust = await computeDineCustomers(me.sub);
          if (cust.summary.total) dt += `\n- باشگاهِ مشتریان: ${cust.summary.total} مشتری (${cust.summary.gold} طلایی، ${cust.summary.atRisk} در معرضِ ریزش/بیش از ۲۱ روز غایب). برای برگرداندنِ مشتری (win-back)، مشتریانِ در معرضِ ریزش را با پیشنهادِ ویژه دعوتِ بازگشت کن.`;
        } catch (_) {}
        try {
          const fc = await computeDineForecast(me.sub);
          if (fc.hasData) dt += `\n- پیش‌بینیِ فروشِ ۷ روزِ آینده: حدودِ ${(Number(fc.next7Total) || 0).toLocaleString('en-US')} تومان${fc.peakHours && fc.peakHours.length ? `؛ ساعت‌های اوج: ${fc.peakHours.join('، ')}` : ''}. برای روزهای پرفروش موجودی و پرسنل را بیشتر کن.`;
        } catch (_) {}
        try {
          let tgt = 30; try { const sr = await query('SELECT data FROM settings WHERE id = 1'); tgt = Number(sr.rows[0]?.data?.dineTargetFoodCostPct) || 30; } catch (_) {}
          const pr = await computeDinePricing(me.sub, tgt);
          if (pr.count) dt += `\n- پیشنهادِ قیمت (هدفِ فودکاست ${pr.targetPct}٪): ${pr.suggestions.slice(0, 4).map((s) => `${s.name} ${s.action === 'raise' ? '↑' : s.action === 'lower' ? '↓' : 'بازبینی'}`).join('، ')}.`;
        } catch (_) {}
        try {
          const cp = await computeDineCompetitors(me.sub);
          if (cp.summary.matched) dt += `\n- تحلیلِ رقبا: ${cp.summary.matched} آیتمِ منطبق (${cp.summary.cheaper} ارزان‌تر، ${cp.summary.pricier} گران‌تر از بازار). قیمت‌گذاری را با موقعیتِ رقابتی هماهنگ کن.`;
        } catch (_) {}
        try {
          const rvw = await computeDineReviews(me.sub);
          if (rvw.count) dt += `\n- نظرات: ${rvw.count} نظر، میانگین ${rvw.avg}/۵، رضایت ${rvw.satisfactionPct}٪ (${rvw.negative} منفی). به نظرهای منفی رسیدگی کن.`;
        } catch (_) {}
        if (dt) sys += '\n\n' + dt;
      } catch (_) {}
    }
    console.log('AI chat persona — lang=', _lang || '-', 'accent=', p.accent || '-', 'tone=', p.tone || '-', 'gender=', p.gender || '-', phone ? 'PHONE' : '');
    const history = Array.isArray(messages) ? messages.slice(-12) : [];

    // ابزار تماس فقط وقتی فعال است که ویپ روشن باشد. روی خودِ تماس هیچ ابزاری نباید باشد.
    const voip = await getVoipSettings();
    const nested = !!(req.body && req.body._nested);
    const toolList = phone ? [] : [SEND_SMS_TOOL]; // پیامک همیشه در دسترس است (از گوشیِ خودِ کاربر)
    if (!phone && voip.voipEnabled) toolList.push(MAKE_CALL_TOOL);
    if (!phone && !nested) toolList.push(ASK_AGENT_TOOL); // واگذاری به ایجنتِ دیگر (نه در تماس، نه در فراخوانیِ تو‌در‌تو)
    // حیطهٔ دستیارِ شخصی: ثبتِ واقعیِ رویداد/کار/یادداشت در روزمرگیِ خودِ کاربر
    const asstDomain = !phone && me && me.sub != null && agentId === 'assistant';
    if (asstDomain) {
      toolList.push(CREATE_EVENT_TOOL, CREATE_TASK_TOOL, CREATE_NOTE_TOOL, GET_ORDERS_TOOL);
      let nowFa = '';
      try { nowFa = new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', weekday: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date()); } catch (_) {}
      sys += `\n\n— اقدامِ واقعی (بسیار مهم): تو فقط حرف نمی‌زنی؛ در حیطهٔ خودت واقعاً کار انجام می‌دهی.`
        + (nowFa ? ` زمانِ فعلی به وقتِ ایران: ${nowFa}.` : '')
        + ` هر وقت کاربر خواست چیزی در «روزمرگی»/تقویم/کارها/یادداشت‌هایش ثبت شود، حتماً ابزارِ مناسب را فراخوانی کن و بعد کوتاه تأیید کن — هرگز نگو «ثبت کردم» بدونِ اینکه واقعاً ابزار را صدا زده باشی.`
        + ` کارِ زمان‌دار/یادآوری/قرار→create_event (برای «۱ ساعت دیگه» مقدارِ in_minutes=۶۰)؛ کارِ بی‌زمان→create_task؛ یادداشت→create_note. عنوان را کوتاه و تمیز بده (بدونِ «یه تسک بساز»، «تو روزمرگی»، «برام»).`
        + ` برای پیگیریِ سفارش/وضعیت/فاکتور/میزانِ خرید→get_my_orders را صدا بزن و فقط بر اساسِ همان دادهٔ واقعی جواب بده؛ اگر سفارشی نبود صادقانه بگو سفارشی ثبت نشده.`;
    }
    const tools = toolList.length ? toolList : null;

    const callChat = (m, msgs, withTools) => fetchT(`${provider.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
      body: JSON.stringify({ model: m, messages: msgs, ...(voiceMode ? { max_tokens: 200 } : {}), ...(withTools && tools ? { tools, tool_choice: 'auto' } : {}) }),
    });

    // به‌روزرسانیِ پروفایلِ پایدارِ کاربر (حافظهٔ بلندمدت) — هر چند پیام یک‌بار، در پس‌زمینه
    const maybeUpdateProfile = async () => {
      try {
        if (isWelcome || !_hasUser) return;
        let pEnabled = true, everyN = 4;
        try {
          const sr = await query('SELECT data FROM settings WHERE id = 1');
          const d = sr.rows[0]?.data || {};
          if (d.aiProfileEnabled === false) pEnabled = false;
          if (Number(d.aiProfileEveryN) > 0) everyN = Math.floor(Number(d.aiProfileEveryN));
        } catch (_) {}
        if (!pEnabled) return;
        const pid = 'usr_' + me.sub;
        let pdoc = {};
        try { const pr3 = await query("SELECT data FROM documents WHERE collection='profile' AND id=$1", [pid]); pdoc = pr3.rows[0]?.data || {}; } catch (_) {}
        pdoc.count = (Number(pdoc.count) || 0) + 1;
        // پرونده را زود بساز (پیامِ اول/دوم) تا از همان ابتدا کاربر را بشناسد، بعد هر everyN پیام یک‌بار به‌روز کن.
        const shouldBuild = pdoc.count <= 2 || pdoc.count % everyN === 0;
        if (shouldBuild) {
          const prevDossier = (pdoc.dossier && typeof pdoc.dossier === 'object')
            ? pdoc.dossier
            : (pdoc.summary ? { keyFacts: [String(pdoc.summary)] } : {});
          const sys2 = 'تو یک «پروندهٔ پایدار» از یک کاربر را برای دستیارهای هوشمند نگه می‌داری تا همیشه دقیقاً بدانند با چه کسی طرف‌اند. '
            + 'بر اساس پروندهٔ قبلی (JSON) و گفته‌های اخیرِ کاربر، یک پروندهٔ به‌روز فقط به‌صورتِ JSON خروجی بده با همین کلیدها: '
            + 'name, job, company, location, family, likes, dislikes, personality, communicationStyle, goals, keyFacts. '
            + 'فیلدهای family/likes/dislikes/goals/keyFacts آرایه‌ای از رشته‌اند؛ بقیه رشتهٔ کوتاه. '
            + 'قواعد: ادغام کن — هر حقیقتِ ماندگارِ قبلی را حفظ کن مگر کاربر صریحاً نقضش کند؛ حقایقِ تازه و ماندگار را اضافه کن؛ حرف‌های گذرا و بی‌اهمیت را نیاور؛ تکراری‌ها را حذف کن؛ هرگز چیزی از خودت نساز و فقط چیزی را بنویس که واقعاً از کاربر معلوم است. '
            + 'هر آرایه حداکثر ۱۲ مورد. همه به فارسی. فقط و فقط JSON خام خروجی بده، بدون توضیح و بدون ```.';
          const userContent = 'پروندهٔ قبلی (JSON):\n' + JSON.stringify(prevDossier) + '\n\nگفته‌های اخیرِ کاربر:\n' + (_recentNotes || []).map((n) => `- ${n.text}`).join('\n');
          const SAFE = process.env.DEFAULT_CHAT_MODEL || 'gpt-4o-mini';
          const rr = await callChat(SAFE, [{ role: 'system', content: sys2 }, { role: 'user', content: userContent }], false);
          const jj = await rr.json().catch(() => ({}));
          const raw = jj?.choices?.[0]?.message?.content;
          if (rr.ok && raw) {
            const parsed = _parseDossierJSON(raw);
            if (parsed) {
              pdoc.dossier = _mergeDossier(prevDossier, parsed);
              pdoc.summary = renderDossier(pdoc.dossier); // back-compat: خلاصهٔ خوانا هم نگه دار
              pdoc.updatedAt = Date.now();
            }
          }
        }
        try { await query("INSERT INTO documents (collection, id, company, data) VALUES ('profile',$1,$2,$3::jsonb) ON CONFLICT (collection, id) DO UPDATE SET data=$3::jsonb, updated_at=now()", [pid, pid, JSON.stringify(pdoc)]); } catch (_) {}
      } catch (_) {}
    };

    // قانونِ زبان/لهجه را به‌عنوانِ آخرین پیام (درست قبل از تولید) هم می‌گذاریم؛
    // مدل دستورِ پایانی را بسیار قوی‌تر از یک خطِ دفن‌شده در سیستم‌پرامپت رعایت می‌کند.
    const tailParts = [];
    if (!phone && _lang && LANG_RULE[_lang]) tailParts.push(LANG_RULE[_lang]);
    else if (!phone && _lang && _lang !== 'فارسی') tailParts.push('Reply ONLY in ' + _lang + ', never in Persian.');
    if (!phone && p.accent && !['بدون لهجه', 'استاندارد', 'معیار'].includes(p.accent)) tailParts.push('لهجه: ' + accentHint(p.accent) + ' لهجه را در همین پاسخ به‌وضوح نشان بده.');
    const tailRule = tailParts.join(' ');
    const baseMsgs = [{ role: 'system', content: sys }, ...history, ...(tailRule ? [{ role: 'system', content: tailRule }] : [])];
    let r = await callChat(realModel, baseMsgs, true);
    let j = await r.json().catch(() => ({}));
    // خودترمیمی: اگر مدلِ انتخابی روی گپ اجرا نشد، یک‌بار با مدلِ سالمِ پیش‌فرض تلاش کن
    const SAFE_MODEL = process.env.DEFAULT_CHAT_MODEL || 'gpt-4o-mini';
    if (!r.ok && realModel !== SAFE_MODEL) {
      console.error('AI chat model failed — retrying with safe model. model=', realModel, 'status=', r.status, JSON.stringify(j).slice(0, 200));
      r = await callChat(SAFE_MODEL, baseMsgs, true);
      j = await r.json().catch(() => ({}));
      if (r.ok) realModel = SAFE_MODEL;
    }
    if (!r.ok) { console.error('AI chat ERROR model=', realModel, 'status=', r.status, JSON.stringify(j).slice(0, 300)); return { ok: false, fallback: true, reason: 'provider_error', detail: j }; }

    // اگر مدل خواست تماس بگیرد → اجرای ابزار + یک دور دیگر برای پاسخ نهایی
    const assistantMsg = j?.choices?.[0]?.message;
    const toolCalls = assistantMsg?.tool_calls || [];
    let callResult = null;
    let smsAction = null;
    if (toolCalls.length && tools) {
      const toolMsgs = [];
      const dataChanged = new Set(); // مجموعه‌هایی که تغییر کردند تا فرانت آن‌ها را تازه‌سازی کند
      let didCall = false; // جلوگیری از تماسِ دوتایی وقتی مدل make_call را دوبار صدا می‌زند
      for (const tc of toolCalls) {
        const fname = tc.function?.name;
        let args = {};
        try { args = JSON.parse(tc.function.arguments || '{}'); } catch {}
        if ((fname === 'create_event' || fname === 'create_task' || fname === 'create_note') && asstDomain) {
          const out = await runAssistantTool(me.sub, fname, args);
          if (out.coll) dataChanged.add(out.coll);
          console.log('AI', fname, '→', out.coll || 'noop', 'title=', args.title || args.text || '');
          toolMsgs.push({ role: 'tool', tool_call_id: tc.id, content: out.msg });
          continue;
        }
        if (fname === 'get_my_orders' && asstDomain) {
          let content;
          try { const ords = await getMyOrders(me.sub, args.query); content = ords.length ? ('سفارش‌های واقعیِ کاربر (JSON):\n' + JSON.stringify(ords)) : 'کاربر هیچ سفارشی ثبت نکرده است.'; }
          catch (e) { content = 'خواندنِ سفارش‌ها ناموفق بود.'; }
          console.log('AI get_my_orders → sub=', me.sub, 'q=', args.query || '-');
          toolMsgs.push({ role: 'tool', tool_call_id: tc.id, content });
          continue;
        }
        if (fname === 'make_call' && didCall) {
          toolMsgs.push({ role: 'tool', tool_call_id: tc.id, content: 'یک تماس قبلاً در همین پیام انجام شد؛ تماسِ تکراری نگیر.' });
          continue;
        }
        if (fname === 'make_call') didCall = true;
        if (fname === 'ask_agent') {
          const ans = await askAgent(req, agentId, args.agent, args.question);
          toolMsgs.push({ role: 'tool', tool_call_id: tc.id, content: ans || 'از آن ایجنت پاسخی دریافت نشد.' });
          continue;
        }
        if (fname === 'send_sms') {
          // پیامک از گوشیِ خودِ کاربر فرستاده می‌شود: فرانت اپِ پیامک را با متن باز می‌کند.
          smsAction = { phone: String(args.phone || ''), message: String(args.message || '') };
          console.log('AI send_sms (device) → phone=', args.phone);
          toolMsgs.push({ role: 'tool', tool_call_id: tc.id, content: 'پیامک آماده شد و روی گوشیِ کاربر در حالِ باز شدن است؛ کاربر فقط باید دکمهٔ «ارسال» را بزند. اگر کاربر روی موبایل نباشد، به او بگو برای فرستادنِ پیامک با گوشیِ موبایل وارد شود. متنِ پیامک را هم برایش بنویس.' });
          continue;
        }
        if (fname !== 'make_call') { toolMsgs.push({ role: 'tool', tool_call_id: tc.id, content: 'ابزار ناشناخته.' }); continue; }
        // اگر شماره داده نشده، از مخاطبینِ خودِ کاربر (فارسی/انگلیسی) پیدا کن
        let callNum = _normPhone(args.phone);
        if (!callNum && me && me.sub != null && args.target_name) { try { callNum = await lookupContact(me.sub, args.target_name); } catch (_) {} }
        // زنجیرهٔ تماس: بعد از این تماس، با شماره‌ای که گرفته شد یک تماسِ دوم برقرار شود
        const chain = args.then_call ? { then: true, targetName: String(args.then_target || '').slice(0, 120), purpose: String(args.then_purpose || '').slice(0, 600) } : null;
        const pr = await placeCall({
          agentId, agentName: agentDoc?.name, targetName: args.target_name,
          targetNumber: callNum || args.phone, purpose: args.purpose,
          requestedBy: me?.name || 'chat', requestedBySub: (me && me.sub != null) ? String(me.sub) : null,
          company: agentDoc?.company, chain,
        });
        callResult = pr;
        let content;
        if (pr.ok) content = `تماس با ${pr.task.targetName || args.target_name} به شمارهٔ ${pr.task.targetNumber} برقرار شد (در حال زنگ‌خوردن). شناسهٔ تماس: ${pr.task.id}. نتیجهٔ نهایی پس از پایان تماس در گزارش‌ها ثبت می‌شود.`;
        else if (pr.reason === 'no_number') content = `شمارهٔ «${args.target_name}» در سیستم پیدا نشد. از کاربر بخواه شمارهٔ تماس را بدهد.`;
        else content = `برقراری تماس ناموفق بود (${pr.task?.error || pr.originate?.error || 'خطا'}). به کاربر اطلاع بده و پیشنهاد تلاش مجدد بده.`;
        console.log('AI make_call →', pr.ok ? 'ok' : 'fail', 'target=', args.target_name, 'num=', pr.task?.targetNumber);
        toolMsgs.push({ role: 'tool', tool_call_id: tc.id, content });
      }
      const r2 = await callChat(realModel, [...baseMsgs, assistantMsg, ...toolMsgs], false);
      const j2 = await r2.json().catch(() => ({}));
      const finalText = r2.ok ? (j2?.choices?.[0]?.message?.content ?? '') : (toolMsgs.map((m) => m.content).join(' '));
      console.log('AI chat OK (with make_call) model=', realModel, 'agent=', agentId);
      await persistChat(finalText);
      maybeUpdateProfile();
      const _tok1 = usageTokens(j) + usageTokens(j2);
      if (me && me.sub != null) await addTokenUsage(me.sub, _tok1, agentId);
      return { ok: true, text: finalText, model: realModel, call: callResult?.task || null, sms: smsAction, dataChanged: [...dataChanged], tokens: _tok1 };
    }

    console.log('AI chat OK model=', realModel, 'agent=', agentId, 'took=', (Date.now() - _t0) + 'ms');
    let outText = assistantMsg?.content ?? '';
    // روی تماس: تضمین کن شماره‌های بلند فارسی و دانه‌دانه خوانده شوند (حتی اگر مدل رقم انگلیسی داد).
    if (phone && outText) outText = _spellLongNumbersFa(outText);
    await persistChat(outText);
    maybeUpdateProfile();
    const _tok2 = usageTokens(j);
    if (me && me.sub != null) await addTokenUsage(me.sub, _tok2, agentId);
    return { ok: true, text: outText, model: realModel, tokens: _tok2 };
  } catch (e) {
    // هر خطایی (از جمله DB) → fallback تا اپ اصلی به پاسخ نمونه برگردد
    return { ok: false, fallback: true, reason: 'error', detail: String(e?.message || e) };
  }
}

// POST: فوراً jobId بده و AI را در پس‌زمینه اجرا کن (آنی → throttleِ آروان رخ نمی‌دهد)
const chatPost = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  const id = (globalThis.crypto && globalThis.crypto.randomUUID)
    ? globalThis.crypto.randomUUID()
    : (Date.now().toString(36) + Math.random().toString(36).slice(2));
  try { await _jobSet(id, { done: false, ts: Date.now() }); }
  catch (e) { return res.status(500).json({ ok: false, error: 'job_init_failed', detail: String(e?.message || e) }); }
  res.json({ ok: true, jobId: id });
  runChat(req)
    .then((result) => _jobSet(id, { done: true, result, ts: Date.now() }))
    .catch((e) => _jobSet(id, { done: true, result: { ok: false, fallback: true, reason: 'error', detail: String(e?.message || e) }, ts: Date.now() }))
    .catch(() => {});
};

// GET: نتیجهٔ آماده را بگیر (هر poll آنی است)
const chatPoll = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  const id = String(req.query.id || '');
  let j; try { j = await _jobGet(id); } catch (_) { j = null; }
  if (!j) return res.json({ done: true, result: { ok: false, fallback: true, reason: 'expired' } });
  if (!j.done) return res.json({ done: false });
  _jobDel(id).catch(() => {});
  res.json({ done: true, result: j.result });
};

// تاریخچهٔ گفتگوی کاربر با یک ایجنت (برای نمایش پیام‌های قبلی)
router.get('/history', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const me = optionalUser(req);
  if (!me || me.sub == null) return res.json({ messages: [] });
  const agentId = String(req.query.agentId || 'assistant');
  const cid = 'chat_' + me.sub + '_' + agentId;
  query("SELECT data FROM documents WHERE collection='chats' AND id=$1", [cid])
    .then((r) => res.json({ messages: Array.isArray(r.rows[0]?.data?.messages) ? r.rows[0].data.messages : [] }))
    .catch(() => res.json({ messages: [] }));
});

// ── پرونده‌های گفتگو (واقعی) ──
const _chatCid = (req, agentId) => {
  const me = optionalUser(req);
  if (!me || me.sub == null) return null;
  return { me, cid: 'chat_' + me.sub + '_' + String(agentId || 'assistant') };
};
async function _loadChatDoc(cid) {
  try { const r = await query("SELECT data FROM documents WHERE collection='chats' AND id=$1", [cid]); return r.rows[0]?.data || {}; } catch { return {}; }
}
async function _saveChatDoc(cid, me, agentId, d) {
  await query("INSERT INTO documents (collection, id, company, data) VALUES ('chats',$1,$2,$3::jsonb) ON CONFLICT (collection, id) DO UPDATE SET data=$3::jsonb, updated_at=now()",
    [cid, 'usr_' + me.sub, JSON.stringify({ ...d, agentId: String(agentId || 'assistant') })]);
}

// فهرستِ پرونده‌ها (هر گفتگو یک پرونده است) + شناسهٔ گفتگوی فعال
router.get('/sessions', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const ctx = _chatCid(req, req.query.agentId);
  if (!ctx) return res.json({ draft: { count: 0 }, sessions: [], activeId: null });
  const d = await _loadChatDoc(ctx.cid);
  const sessions = (Array.isArray(d.sessions) ? d.sessions : []).map((s) => ({ id: s.id, title: s.title, date: s.date, count: (s.messages || []).length }));
  // draft فقط برای سازگاری با نسخهٔ قدیمیِ فرانت؛ همیشه ۰ (دیگر پیش‌نویس نداریم)
  res.json({ draft: { count: 0 }, sessions, activeId: d.activeId || null });
});

// پیام‌های یک پرونده
router.get('/session', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const ctx = _chatCid(req, req.query.agentId);
  if (!ctx) return res.json({ messages: [] });
  const d = await _loadChatDoc(ctx.cid);
  const s = (Array.isArray(d.sessions) ? d.sessions : []).find((x) => String(x.id) === String(req.query.id));
  res.json({ messages: s?.messages || [] });
});

// مخاطبینِ کاربر — لیست
router.get('/contacts', authRequired, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const id = 'usr_' + req.user.sub;
  const r = await query("SELECT data FROM documents WHERE collection='contacts' AND id=$1", [id]);
  const list = (r.rows[0]?.data?.list) || [];
  list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'fa'));
  res.json({ contacts: list });
});
// مخاطبین — افزودن/ادغام (از گوشی یا دستی). dedupe بر اساسِ شماره.
router.post('/contacts', authRequired, async (req, res) => {
  const id = 'usr_' + req.user.sub;
  const incoming = Array.isArray(req.body?.contacts) ? req.body.contacts : [];
  const r = await query("SELECT data FROM documents WHERE collection='contacts' AND id=$1", [id]);
  let list = (r.rows[0]?.data?.list) || [];
  const byPhone = {};
  for (const c of list) { const ph = _normPhone(c.phone); if (ph) byPhone[ph] = c; }
  let added = 0;
  for (const c of incoming) {
    const ph = _normPhone(c.phone); if (!ph) continue;
    if (!byPhone[ph]) added++;
    byPhone[ph] = { name: String(c.name || '').slice(0, 80) || ph, phone: ph, ts: Date.now() };
  }
  list = Object.values(byPhone).slice(0, 5000);
  await query("INSERT INTO documents (collection,id,company,data) VALUES ('contacts',$1,$2,$3::jsonb) ON CONFLICT (collection,id) DO UPDATE SET data=$3::jsonb, updated_at=now()", [id, id, JSON.stringify({ list })]);
  res.json({ ok: true, total: list.length, added });
});
// مخاطبین — حذفِ یک مورد
router.post('/contacts/delete', authRequired, async (req, res) => {
  const id = 'usr_' + req.user.sub;
  const ph = _normPhone(req.body?.phone);
  const r = await query("SELECT data FROM documents WHERE collection='contacts' AND id=$1", [id]);
  let list = (r.rows[0]?.data?.list) || [];
  list = list.filter((c) => _normPhone(c.phone) !== ph);
  await query("INSERT INTO documents (collection,id,company,data) VALUES ('contacts',$1,$2,$3::jsonb) ON CONFLICT (collection,id) DO UPDATE SET data=$3::jsonb, updated_at=now()", [id, id, JSON.stringify({ list })]);
  res.json({ ok: true });
});

// ── ردیاب + اتوماسیونِ بازاریابی ──
// ثبتِ بازدیدِ کاربر از یک صفحه/ایجنت + ارزیابیِ قوانینِ سوپرادمین (پیامک یا آفرِ درجا).
router.post('/track', async (req, res) => {
  try {
    const me = optionalUser(req);
    const target = String(req.body?.target || '').slice(0, 80);
    const kind = req.body?.kind === 'screen' ? 'screen' : 'agent';
    if (!target) return res.json({ ok: true, offers: [] });
    const sub = (me && me.sub != null) ? String(me.sub) : null;
    const name = (me && me.name) || '';
    console.log('TRACK hit — target=', target, 'kind=', kind, 'sub=', sub);
    // ثبتِ رویداد برای فیدِ سوپرادمین
    try {
      const evId = 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      await query("INSERT INTO documents (collection,id,company,data) VALUES ('track_events',$1,$2,$3::jsonb)", [evId, null, JSON.stringify({ sub, name, target, kind, ts: Date.now() })]);
    } catch (_) {}
    // قوانین + کدهای پترنِ پیامک از تنظیماتِ سوپرادمین
    let rules = [], smsPatternPage = '', smsByAgent = {};
    try { const sr = await query('SELECT data FROM settings WHERE id=1'); const sd = sr.rows[0]?.data || {}; rules = Array.isArray(sd.trackRules) ? sd.trackRules : []; smsPatternPage = sd.smsPatternPage || ''; smsByAgent = sd.smsPatternsByAgent || {}; } catch (_) {}
    // ۵ نوعِ پایهٔ ایجنت. کاربر اسمِ دلخواه می‌گذارد (سیاوش)، ولی جنسِ ایجنت یکی از این ۵ است.
    const ID_TO_TYPE = { marketing: 'marketer', marketer: 'marketer', sales: 'cashier', cashier: 'cashier', secretary: 'secretary', finance: 'finance', procurement: 'procurement', dine: 'dine' };
    const TYPE_LABEL = { secretary: 'منشی', marketer: 'بازاریاب', finance: 'مالی/اداری', procurement: 'خرید/تدارکات', cashier: 'فروشنده/صندوقدار', dine: 'داین' };
    let trackedType = null;
    if (kind === 'agent') {
      try { const ar = await query("SELECT data FROM documents WHERE collection='agents' AND id=$1", [target]); const td = ar.rows[0]?.data; trackedType = (td && (td.team || td.type)) || null; } catch (_) {}
      if (!trackedType) trackedType = ID_TO_TYPE[target] || target;
    }
    console.log('TRACK eval — type=', trackedType, 'rules=', rules.length, 'values=', rules.map((x) => x && x.value).join(','));
    const offers = [];
    for (const r of rules) {
      if (!r || r.enabled === false) continue;
      if ((r.kind || 'agent') !== kind) continue;
      if (kind === 'agent') { if (String(r.value) !== String(trackedType) && String(r.value) !== String(target)) continue; }
      else { if (String(r.value) !== target) continue; }
      console.log('TRACK matched rule=', r.id, 'action=', r.action, 'value=', r.value);
      // برای قوانینِ ایجنت: فقط اگر کاربر آن نوع ایجنت را «به‌صورتِ فعال» ندارد (پیشنهادِ خرید/تمدید).
      // ایجنتِ غیرفعال‌شده یا منقضی = «ندارد» ⇒ آفر می‌رود. مگر r.onlyIfNotOwned=false.
      if (kind === 'agent' && sub && r.onlyIfNotOwned !== false) {
        let ownedTypes = [];
        try {
          const u = await query('SELECT meta FROM app_users WHERE id=$1', [sub]);
          const meta = u.rows[0]?.meta || {};
          const owned = Array.isArray(meta.ownedAgents) ? meta.ownedAgents : [];
          const grants = meta.agentGrants || {};
          const nowMs = Date.now();
          const effective = owned.filter((id) => {
            const g = grants[id];
            if (!g) return true;
            if (g.active === false) return false;
            if (g.expiresAt && new Date(g.expiresAt).getTime() < nowMs) return false;
            return true;
          });
          if (effective.length) {
            const ar2 = await query("SELECT id, data FROM documents WHERE collection='agents' AND id = ANY($1)", [effective]);
            ownedTypes = ar2.rows.map((x) => (x.data && (x.data.team || x.data.type)) || ID_TO_TYPE[x.id] || x.id);
          }
        } catch (_) {}
        if (ownedTypes.includes(String(r.value))) continue; // به‌صورتِ فعال دارد → پیام نده
      }
      // cooldown برای هر (کاربر، قانون) تا اسپم نشود
      if (sub) {
        const stId = 'trackst_' + sub + '_' + r.id;
        let last = 0;
        try { const st = await query("SELECT data FROM documents WHERE collection='track_state' AND id=$1", [stId]); last = Number(st.rows[0]?.data?.last) || 0; } catch (_) {}
        const cd = (Number(r.cooldownMin) || 0) * 60000;
        if (cd && (Date.now() - last) < cd) continue;
        try { await query("INSERT INTO documents (collection,id,company,data) VALUES ('track_state',$1,$2,$3::jsonb) ON CONFLICT (collection,id) DO UPDATE SET data=$3::jsonb, updated_at=now()", [stId, null, JSON.stringify({ last: Date.now() })]); } catch (_) {}
      }
      // {agent} = نامِ نوعِ ایجنتِ پیشنهادی (منشی/بازاریاب/…)
      const agentLabel = TYPE_LABEL[r.offerAgentId] || r.offerAgentId || '';
      const msg = String(r.message || '').replace(/\{discount\}/g, String(r.discount || '')).replace(/\{agent\}/g, agentLabel);
      if (r.action === 'sms' && sub) {
        let phone = '';
        try { const u = await query('SELECT meta FROM app_users WHERE id=$1', [sub]); phone = u.rows[0]?.meta?.phone || ''; } catch (_) {}
        if (phone) {
          try {
            if (kind === 'agent') {
              const code = r.patternCode || smsByAgent[r.value] || smsPatternPage || '';
              if (code) await sendSmsPattern(code, phone, { agent: agentLabel, discount: String(r.discount || '') });
              else await sendSmsViaIppanel(msg, phone); // اگر پترن تنظیم نشده، متنِ آزاد
            } else {
              const code = r.patternCode || smsPatternPage || '';
              if (code) await sendSmsPattern(code, phone, { offer: msg });
              else await sendSmsViaIppanel(msg, phone);
            }
            console.log('TRACK sms →', phone, 'rule=', r.id, 'kind=', kind);
          } catch (_) {}
        }
      } else if (r.action === 'offer') {
        offers.push({ id: 'of_' + r.id + '_' + Date.now(), message: msg, discount: r.discount || null, agentId: r.offerAgentId || null, cta: r.cta || 'مشاهده' });
      }
    }
    console.log('TRACK result — offers=', offers.length);
    res.json({ ok: true, offers });
  } catch (e) { console.error('TRACK error', String(e?.message || e)); res.json({ ok: true, offers: [] }); }
});

// فیدِ زندهٔ فعالیتِ کاربران — برای سوپرادمین
router.get('/track/feed', ...adminGuard, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const limit = Math.min(Number(req.query.limit) || 200, 500);
  const r = await query("SELECT data FROM documents WHERE collection='track_events' ORDER BY created_at DESC LIMIT $1", [limit]);
  res.json({ events: r.rows.map((x) => x.data) });
});

// مصرفِ توکنِ کاربر (همهٔ چت‌ها) — برای نمایش به کاربر
router.get('/usage', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const me = optionalUser(req);
  if (!me || me.sub == null) return res.json({ used: 0, balance: 0 });
  const r = await query("SELECT data FROM documents WHERE collection='usage' AND id=$1", ['usr_' + me.sub]);
  const d = r.rows[0]?.data || {};
  res.json({ used: Number(d.used) || 0, balance: Number(d.balance) || 0, byAgent: d.byAgent || {} });
});

// تغییرِ نامِ یک پرونده توسط کاربر
router.post('/session/rename', authRequired, async (req, res) => {
  const ctx = _chatCid(req, req.body?.agentId);
  if (!ctx) return res.status(401).json({ error: 'unauthorized' });
  const d = await _loadChatDoc(ctx.cid);
  const title = String(req.body?.title || '').slice(0, 80).trim();
  if (!title) return res.status(400).json({ error: 'title_required' });
  const sessions = (Array.isArray(d.sessions) ? d.sessions : []).map((s) => (String(s.id) === String(req.body?.id) ? { ...s, title } : s));
  await _saveChatDoc(ctx.cid, ctx.me, req.body?.agentId, { ...d, sessions });
  res.json({ ok: true });
});

// «گفتگوی جدید» — فقط گفتگوی فعال را آزاد می‌کند؛ پیامِ بعدی یک پروندهٔ جدید می‌سازد.
// (گفتگوی قبلی از قبل به‌صورتِ زنده ذخیره شده، پس چیزی از دست نمی‌رود.)
router.post('/session/new', authRequired, async (req, res) => {
  const ctx = _chatCid(req, req.body?.agentId);
  if (!ctx) return res.status(401).json({ error: 'unauthorized' });
  const d = await _loadChatDoc(ctx.cid);
  await _saveChatDoc(ctx.cid, ctx.me, req.body?.agentId, { ...d, activeId: null });
  res.json({ ok: true });
});

// قدیمی: «ذخیره» — حالا خودکار است؛ فقط گفتگوی فعال را می‌بندد (مثلِ new).
router.post('/session/save', authRequired, async (req, res) => {
  const ctx = _chatCid(req, req.body?.agentId);
  if (!ctx) return res.status(401).json({ error: 'unauthorized' });
  const d = await _loadChatDoc(ctx.cid);
  await _saveChatDoc(ctx.cid, ctx.me, req.body?.agentId, { ...d, activeId: null });
  res.json({ ok: true, auto: true });
});

// دورانداختنِ گفتگوی جاری — پروندهٔ فعال را حذف می‌کند.
router.post('/session/discard', authRequired, async (req, res) => {
  const ctx = _chatCid(req, req.body?.agentId);
  if (!ctx) return res.status(401).json({ error: 'unauthorized' });
  const d = await _loadChatDoc(ctx.cid);
  const sessions = (Array.isArray(d.sessions) ? d.sessions : []).filter((s) => String(s.id) !== String(d.activeId));
  await _saveChatDoc(ctx.cid, ctx.me, req.body?.agentId, { ...d, sessions, activeId: null });
  res.json({ ok: true });
});

// مسیرِ اصلی + مسیرهای جایگزین (برای دور زدنِ کشِ مسمومِ احتمالیِ CDN روی /chat)
router.post('/chat', chatPost);
router.post('/send', chatPost);
router.post('/converse', chatPost);
router.get('/chat-result', chatPoll);
router.get('/poll', chatPoll);
router.get('/result', chatPoll);

// تنظیماتِ شخصیِ کاربر برای یک ایجنت (per-user overlay). مدل/دستورالعمل اینجا نیست (فقط سوپرادمین).
const PREF_FIELDS = ['name', 'role', 'tone', 'lang', 'age', 'gender', 'accent', 'voice', 'ttsVoice', 'welcomeMsg', 'avatar', 'init', 'handoff', 'locked'];
router.get('/agent-prefs', async (req, res) => {
  try {
    const me = optionalUser(req);
    const agentId = String(req.query.agentId || '');
    if (!me || me.sub == null || !agentId) return res.json({ prefs: {} });
    const r = await query("SELECT data FROM documents WHERE collection='agent_prefs' AND id=$1", ['pref_' + me.sub + '_' + agentId]);
    res.json({ prefs: r.rows[0]?.data || {} });
  } catch (e) { res.json({ prefs: {} }); }
});
router.put('/agent-prefs', authRequired, async (req, res) => {
  try {
    const me = req.user;
    const agentId = String((req.body && req.body.agentId) || '');
    if (!agentId) return res.status(400).json({ error: 'agentId_required' });
    const patch = {};
    for (const k of PREF_FIELDS) if (k in (req.body || {})) patch[k] = req.body[k];
    if (!Object.keys(patch).length) return res.json({ ok: true });
    const id = 'pref_' + me.sub + '_' + agentId;
    await query(
      "INSERT INTO documents (collection, id, company, data) VALUES ('agent_prefs',$1,$2,$3::jsonb) ON CONFLICT (collection, id) DO UPDATE SET data = documents.data || $3::jsonb, updated_at = now()",
      [id, 'usr_' + me.sub, JSON.stringify(patch)],
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'server_error', detail: String(e?.message || e) }); }
});

// گزارشِ تماس از پلِ صوتی: متنِ مکالمه را می‌گیرد، خلاصه می‌کند، در تاریخچهٔ چتِ کاربر درج می‌کند
// و در صفِ تحویلِ زنده می‌گذارد تا چت آن را نشان دهد.
router.post('/call-report', async (req, res) => {
  try {
    const { taskId, transcript } = req.body || {};
    if (!taskId) return res.status(400).json({ error: 'taskId_required' });
    const tr = await query("SELECT data FROM documents WHERE collection='call_tasks' AND id=$1", [taskId]);
    const task = tr.rows[0]?.data;
    if (!task) return res.status(404).json({ error: 'task_not_found' });
    const arr = Array.isArray(transcript) ? transcript : [];
    // آیا طرفِ مقابل (نه دستیار) واقعاً چیزی گفته؟
    const spoke = arr.some((m) => m && m.role === 'user' && String(m.content || '').trim());
    const convo = arr.length ? arr.map((m) => (m.role === 'assistant' ? 'دستیار' : 'مخاطب') + ': ' + String(m.content || '')).join('\n') : String(transcript || '');

    let summary = '';
    if (!spoke) {
      // هیچ پاسخی از طرفِ مقابل ثبت نشده — هیچ خلاصه‌ای نساز (وگرنه مدل توهم می‌زند)
      summary = 'تماس برقرار شد، اما طرفِ مقابل پاسخی نداد یا صحبتی از او ثبت نشد.';
    } else {
      try {
        let modelId = null;
        if (task.agentId) { const ar = await query("SELECT data FROM documents WHERE collection='agents' AND id=$1", [task.agentId]); modelId = ar.rows[0]?.data?.modelId || null; }
        const { provider, realModel } = await resolveModel(modelId, 'gpt-4o-mini');
        if (provider) {
          const r = await fetchT(`${provider.baseUrl.replace(/\/$/, "")}/chat/completions`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
            body: JSON.stringify({ model: realModel, max_tokens: 320, messages: [
              { role: 'system', content: 'خلاصه‌نویسِ دقیق و صادقِ فارسی هستی. فقط و فقط بر اساسِ متنی که داده می‌شود خلاصه کن؛ هیچ‌چیزی از خودت اضافه یا حدس نزن. اگر طرفِ مقابل چیزی نگفته یا اطلاعاتی نیست، صادقانه همان را بنویس.' },
              { role: 'user', content: `این متنِ واقعیِ یک مکالمهٔ تلفنی است که دستیار به‌جای کاربر با «${task.targetName || 'مخاطب'}» داشت. هدف: ${task.purpose || '-'}.\n\n${convo}\n\nفقط بر اساسِ همین متن، در ۲ تا ۴ جملهٔ کوتاهِ فارسی بگو دقیقاً چه گفته‌وگو شد و نتیجه چه بود. چیزی اضافه نکن.` },
            ] }),
          });
          const j = await r.json().catch(() => ({}));
          summary = j?.choices?.[0]?.message?.content || '';
        }
      } catch (_) {}
      if (!summary) summary = convo.slice(0, 500);
    }

    const sub = task.requestedBySub;
    const agentId = task.agentId || 'assistant';
    const reportMsg = `📞 گزارشِ تماس با ${task.targetName || task.targetNumber || 'مخاطب'}:\n${summary}`;
    if (sub) {
      await query("INSERT INTO documents (collection,id,company,data) VALUES ('call_reports',$1,$2,$3::jsonb) ON CONFLICT (collection,id) DO UPDATE SET data=$3::jsonb, updated_at=now()",
        ['rpt_' + taskId, 'usr_' + sub, JSON.stringify({ sub, agentId, target: task.targetName || task.targetNumber || '', summary, text: reportMsg, ts: Date.now(), delivered: false })]);
      try {
        const cid = 'chat_' + sub + '_' + agentId;
        const cr = await query("SELECT data FROM documents WHERE collection='chats' AND id=$1", [cid]);
        const d = cr.rows[0]?.data || {};
        let sessions = Array.isArray(d.sessions) ? d.sessions : [];
        let active = sessions.find((sx) => String(sx.id) === String(d.activeId));
        if (!active) {
          active = { id: Date.now(), title: 'گزارشِ تماس با ' + (task.targetName || task.targetNumber || 'مخاطب'), date: new Date().toLocaleDateString('fa-IR'), ts: Date.now(), messages: [] };
          sessions.unshift(active);
          d.activeId = active.id;
        }
        active.messages.push({ role: 'assistant', content: reportMsg, ts: Date.now() });
        active.ts = Date.now();
        await query("INSERT INTO documents (collection,id,company,data) VALUES ('chats',$1,$2,$3::jsonb) ON CONFLICT (collection,id) DO UPDATE SET data=$3::jsonb, updated_at=now()",
          [cid, 'usr_' + sub, JSON.stringify({ sessions: sessions.slice(0, 500), activeId: d.activeId, agentId, name: d.name || '' })]);
      } catch (_) {}
    }
    // زنجیرهٔ تماس: اگر این تماس قرار بود شماره‌ای بگیرد و بعد به همان شماره زنگ بزند، حالا تماسِ دوم را بگیر.
    try {
      if (task.chain && task.chain.then && !task.chain.done && spoke) {
        const { provider, realModel } = await resolveModel(null, 'gpt-4o-mini');
        let num = '';
        if (provider) {
          const er = await fetchT(`${provider.baseUrl.replace(/\/$/, "")}/chat/completions`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
            body: JSON.stringify({ model: realModel, max_tokens: 40, messages: [
              { role: 'system', content: 'از متنِ این مکالمهٔ تلفنی، فقط شمارهٔ تلفنی که «مخاطب» اعلام کرد را استخراج کن و فقط همان را به‌صورتِ ارقامِ پیوستهٔ انگلیسی (مثلِ 09129327906) برگردان. اعدادِ گفته‌شده با حروف (مثلِ «نهصد و دوازده») را به رقم تبدیل کن. اگر هیچ شماره‌ای نبود فقط بنویس NONE. هیچ توضیحِ دیگری نده.' },
              { role: 'user', content: convo },
            ] }),
          });
          const ej = await er.json().catch(() => ({}));
          num = String(ej?.choices?.[0]?.message?.content || '').replace(/[^0-9+]/g, '');
        }
        task.chain.done = true; // فقط یک‌بار
        if (num && num.replace(/\D/g, '').length >= 7) {
          task.chain.extractedNumber = num;
          const sub2 = task.requestedBySub;
          if (sub2) {
            // گامِ ایمنی: شماره را در چتِ کاربر نشان بده و یک پنجرهٔ مهلت بده تا اگر اشتباه است «لغو» کند.
            const delaySec = 60;
            const pc = { id: 'pc_' + taskId, sub: String(sub2), agentId: task.agentId || 'assistant', agentName: task.agentName || null, targetName: task.chain.targetName || null, number: num, purpose: task.chain.purpose || 'پیگیری', requestedBy: task.requestedBy || null, company: task.company || null, status: 'pending', createdAt: Date.now(), updatedAt: Date.now() };
            await savePending(pc);
            await deliverToUser(sub2, pc.agentId, `📞 شمارهٔ «${task.chain.targetName || 'مخاطب'}» را گرفتم: ${num}\nتا ${delaySec} ثانیهٔ دیگر خودکار با او تماس می‌گیرم. اگر این شماره درست نیست، همین‌جا بنویس «لغو».`, task.chain.targetName, 'pcnote_' + taskId);
            scheduleChainFire(pc.id, delaySec * 1000);
            console.log('AI chain-call → pending notice sent, number', num);
          } else {
            const pr2 = await placeCall({ agentId: task.agentId, agentName: task.agentName, targetName: task.chain.targetName || null, targetNumber: num, purpose: task.chain.purpose || 'پیگیری', requestedBy: task.requestedBy, requestedBySub: task.requestedBySub, company: task.company });
            console.log('AI chain-call → no user; placed second call directly', pr2.ok ? 'OK' : 'FAIL');
          }
        } else {
          console.log('AI chain-call → no number extracted from transcript, skipping second call');
        }
      }
    } catch (e) { console.error('chain-call error', String(e?.message || e)); }

    task.outcome = 'completed'; task.notes = summary; task.transcript = convo.slice(0, 4000); task.status = 'ended'; task.updatedAt = new Date().toISOString();
    await query("INSERT INTO documents (collection,id,company,data) VALUES ('call_tasks',$1,$2,$3::jsonb) ON CONFLICT (collection,id) DO UPDATE SET data=$3::jsonb, updated_at=now()", [taskId, task.company || null, JSON.stringify(task)]);
    console.log('AI call-report stored for task', taskId, 'sub=', sub);
    res.json({ ok: true, summary });
  } catch (e) { console.error('call-report error', String(e?.message || e)); res.status(500).json({ error: 'server_error', detail: String(e?.message || e) }); }
});

// تحویلِ زندهٔ گزارش‌های تماس به چتِ کاربر (poll از فرانت)
router.get('/call-reports', async (req, res) => {
  try {
    const me = optionalUser(req);
    if (!me || me.sub == null) return res.json({ reports: [] });
    const r = await query("SELECT id, data FROM documents WHERE collection='call_reports' AND data->>'sub'=$1 AND coalesce(data->>'delivered','false')='false' ORDER BY updated_at LIMIT 10", [String(me.sub)]);
    const reports = r.rows.map((x) => ({ id: x.id, text: x.data.text, agentId: x.data.agentId, ts: x.data.ts }));
    for (const x of r.rows) { try { await query("UPDATE documents SET data = data || '{\"delivered\":true}'::jsonb WHERE collection='call_reports' AND id=$1", [x.id]); } catch (_) {} }
    res.json({ reports });
  } catch (e) { res.json({ reports: [] }); }
});

// به‌روزرسانیِ سندِ پایهٔ ایجنت (نقش/مدل/دستورالعمل/…) — فقط ادمین/سوپرادمین.
// کاربرِ عادی هرگز سندِ پایه را تغییر نمی‌دهد؛ شخصی‌سازیِ او در agent_prefs است.
router.put('/agent/:id', ...adminGuard, async (req, res) => {
  try {
    const ALLOWED_FIELDS = ['name', 'role', 'instructions', 'modelId', 'sttModel', 'ttsModel', 'imageModel', 'ttsVoice', 'voip', 'locked', 'persona', 'quickActions', 'init', 'gender', 'bg', 'avatar', 'welcomeMsg', 'tone', 'lang', 'age', 'voice', 'team', 'handoff'];
    const patch = {};
    for (const k of ALLOWED_FIELDS) if (k in (req.body || {})) patch[k] = req.body[k];
    if (!Object.keys(patch).length) return res.json({ ok: true });
    const { rows } = await query(
      `UPDATE documents SET data = data || $2::jsonb, updated_at = now()
        WHERE collection = 'agents' AND id = $1 RETURNING data`,
      [req.params.id, JSON.stringify(patch)],
    );
    if (!rows[0]) return res.status(404).json({ error: 'not_found' });
    res.json({ ok: true, agent: rows[0].data });
  } catch (e) {
    res.status(500).json({ error: 'server_error', detail: String(e?.message || e) });
  }
});

// تولید تصویر با مدلِ تصویرِ خود ایجنت — عمومی (برای ویجت پشتیبان و پنل کاربر)
router.post('/agent-image', async (req, res) => {
  try {
    const { agentId, prompt, size } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'prompt_required' });
    let imgModel;
    if (agentId) {
      const a = await query("SELECT data FROM documents WHERE collection='agents' AND id=$1", [agentId]);
      imgModel = a.rows[0]?.data?.imageModel;
    }
    const { provider, realModel } = await resolveModel(imgModel, 'gpt-image-1');
    if (!provider) return res.json({ ok: false, fallback: true, reason: 'provider_unavailable' });
    const r = await fetchT(`${provider.baseUrl.replace(/\/$/, "")}/images/generations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
      body: JSON.stringify({ model: realModel, prompt, size: size || '1024x1024' }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: 'provider_error', detail: j });
    const item = j?.data?.[0] || {};
    res.json({ ok: true, url: item.url || (item.b64_json ? `data:image/png;base64,${item.b64_json}` : null) });
  } catch (e) {
    res.status(502).json({ error: 'fetch_failed', detail: String(e?.message || e) });
  }
});

// فهرست عمومی ایجنت‌ها — برای نمایش در فرانت (همان داده‌ای که سوپرادمین مدیریت می‌کند)
router.get('/agents', async (req, res) => {
  try {
    // هرگز کش نشود: overlayِ prefsِ per-user باید همیشه تازه باشد (وگرنه 304 = دستیارِ قدیمی).
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    const company = req.query.company;
    const sql = company
      ? "SELECT data FROM documents WHERE collection='agents' AND company=$1 ORDER BY created_at"
      : "SELECT data FROM documents WHERE collection='agents' ORDER BY created_at";
    const { rows } = await query(sql, company ? [company] : []);
    let agents = rows.map((r) => r.data);
    // نمایشِ per-user: تنظیماتِ شخصیِ همین کاربر (نام/نقش/عکس/لحن/صدا) روی هر ایجنت overlay می‌شود.
    // مدل و دستورالعمل سراسری (سوپرادمین) می‌مانند. هر کاربر نسخهٔ یونیکِ خودش را می‌بیند.
    const me = optionalUser(req);
    if (me && me.sub != null) {
      try {
        // نقش و مالکیتِ ایجنتِ همین کاربر (برای نمایشِ per-user).
        const ur = await query("SELECT meta, role FROM app_users WHERE id=$1", [me.sub]);
        const uMeta = ur.rows[0]?.meta || {};
        const uRole = ur.rows[0]?.role || me.role || 'user';
        const owned = new Set(Array.isArray(uMeta.ownedAgents) ? uMeta.ownedAgents : []);
        // گرنتِ سوپرادمین: ایجنتِ «غیرفعال‌شده» یا «منقضی» برای کاربر مثلِ نداشتن است (قفل می‌شود).
        const grants = (uMeta.agentGrants && typeof uMeta.agentGrants === 'object') ? uMeta.agentGrants : {};
        const grantActive = (id) => {
          const g = grants[id];
          if (!g) return true; // بدونِ گرنت = فعالِ پیش‌فرض
          if (g.active === false) return false;
          if (g.expiresAt) { const t = new Date(g.expiresAt).getTime(); if (!isNaN(t) && t < Date.now()) return false; }
          return true;
        };
        const prefix = 'pref_' + me.sub + '_';
        const pr = await query("SELECT id, data FROM documents WHERE collection='agent_prefs' AND id LIKE $1", [prefix + '%']);
        const byAgent = {};
        for (const row of pr.rows) byAgent[String(row.id).slice(prefix.length)] = row.data || {};
        // آخرین پیامِ واقعیِ همین کاربر با هر ایجنت (برای لیستِ گفتگوها) — نه پیامِ نمونه
        const chatPrefix = 'chat_' + me.sub + '_';
        const cr = await query("SELECT id, data FROM documents WHERE collection='chats' AND id LIKE $1", [chatPrefix + '%']);
        const lastByAgent = {};
        for (const row of cr.rows) {
          const aid = String(row.id).slice(chatPrefix.length);
          // آخرین پیام از جدیدترین پروندهٔ گفتگو
          const sess = Array.isArray(row.data?.sessions) ? row.data.sessions : [];
          let latest = null;
          for (const sx of sess) { if (!latest || (sx.ts || 0) > (latest.ts || 0)) latest = sx; }
          const msgs = (latest && Array.isArray(latest.messages)) ? latest.messages : [];
          if (msgs.length) { const last = msgs[msgs.length - 1]; lastByAgent[aid] = { text: String(last.content || '').slice(0, 80), ts: last.ts || null, count: msgs.length }; }
        }
        // overlayِ شخصی‌سازی + پیامِ آخر روی یک ایجنت (با کلیدِ pref/chat مشخص). قابلِ استفاده برای
        // ایجنتِ پایه و «نمونه‌های شخصیِ» کاربر.
        const FA = '۰۱۲۳۴۵۶۷۸۹';
        const faNum = (n) => String(n).replace(/[0-9]/g, (d) => FA[+d]);
        const applyPrefs = (a, prefKey) => {
          const pf = byAgent[prefKey];
          const lm = lastByAgent[prefKey];
          let out = a;
          if (pf) out = { ...out,
            name: pf.name || out.name, init: pf.init || out.init, role: pf.role || out.role,
            avatar: pf.avatar || out.avatar, ttsVoice: pf.ttsVoice || out.ttsVoice, voice: pf.voice || out.voice,
            tone: pf.tone || out.tone, lang: pf.lang || out.lang, age: pf.age || out.age,
            gender: pf.gender || out.gender, accent: pf.accent || out.accent,
            welcomeMsg: pf.welcomeMsg || out.welcomeMsg, handoff: pf.handoff || out.handoff,
            locked: (typeof pf.locked === 'boolean' ? pf.locked : out.locked),
            persona: { ...(out.persona || {}), ...(pf.tone ? { tone: pf.tone } : {}), ...(pf.gender ? { gender: pf.gender } : {}), ...(pf.age ? { age: pf.age } : {}) },
          };
          // فیلدهای نمایشیِ فیک (از seedِ قدیمیِ DB) را پاک کن — پیام/زمان/شمارها فقط از دادهٔ واقعی می‌آیند
          // (رفعِ «چتِ فیک»: lastMsg/lastTime/unread/done/pending دیگر از سندِ ایجنت نشت نمی‌کنند).
          out = { ...out, lastMsg: lm ? lm.text : '', lastTime: '', unread: 0, done: 0, pending: 0, hasChat: !!lm, msgCount: lm ? lm.count : 0 };
          return out;
        };
        const baseById = {}; for (const a of agents) baseById[a.id] = a;
        agents = agents.map((a) => applyPrefs(a, a.id));
        // نمایشِ per-user: کاربرِ عادی فقط ایجنت‌هایِ خریده‌شده + دستیار شخصی را می‌بیند.
        if (uRole !== 'admin' && uRole !== 'superadmin') {
          const list = agents.filter((a) => a.id === 'assistant' || (owned.has((a.company || '') + '::' + a.id) && grantActive(a.id)));
          // «نمونه‌های شخصیِ» کاربر: کلیدهای owned مثلِ company::baseId#N (استخدامِ چندبارهٔ یک تیم).
          // ایجنتِ نمونه از تمپلیتِ پایه ساخته می‌شود، idِ یکتا می‌گیرد و شخصی‌سازیِ خودش را می‌گیرد.
          const seenInst = new Set(list.map((a) => a.id));
          for (const key of owned) {
            const ci = String(key).indexOf('::');
            const bare = ci >= 0 ? String(key).slice(ci + 2) : String(key);
            const hi = bare.indexOf('#'); if (hi < 0) continue;
            if (seenInst.has(bare)) continue; // حذفِ تکراری
            seenInst.add(bare);
            const baseId = bare.slice(0, hi);
            const base = baseById[baseId]; if (!base) continue;
            if (!grantActive(bare)) continue;
            // نمونهٔ تازه باید «تمیز» باشد — بدونِ آمار/پیام/شمارِ ایجنتِ پایه (رفعِ «دیتای فیک در ایجنتِ جدید»).
            let inst = applyPrefs({ ...base, id: bare, team: base.team || baseId, done: 0, pending: 0, unread: 0, voip: '', lastMsg: '', lastTime: '' }, bare);
            if (!byAgent[bare] || !byAgent[bare].name) inst = { ...inst, name: (base.name || baseId) + ' ' + faNum(bare.slice(hi + 1)) };
            list.push(inst);
          }
          // تاریخِ انقضا/وضعیتِ گرنت روی هر ایجنت (برای نمایش در «اشتراک و پلن‌ها»).
          const _now = Date.now();
          agents = list.map((a) => {
            const g = grants[a.id] || {};
            const expired = g.expiresAt ? (new Date(g.expiresAt).getTime() < _now) : false;
            return { ...a, expiresAt: g.expiresAt || null, expired, active: g.active !== false && !expired };
          });
        }
        // نمونه‌های خریداری‌شده برای ادمین/سوپرادمین هم نمایش داده شوند — خرید نباید فقط برای role=user
        // دیده شود (باگ: کاربر نمونهٔ دستیار خرید ولی چون حسابش admin بود، در لیستش نیامد).
        if (uRole === 'admin' || uRole === 'superadmin') {
          const seenA = new Set(agents.map((a) => a.id));
          for (const key of owned) {
            const ci = String(key).indexOf('::'); const bare = ci >= 0 ? String(key).slice(ci + 2) : String(key);
            const hi = bare.indexOf('#'); if (hi < 0 || seenA.has(bare)) continue; seenA.add(bare);
            const baseId = bare.slice(0, hi); const base = baseById[baseId]; if (!base) continue;
            let inst = applyPrefs({ ...base, id: bare, team: base.team || baseId, done: 0, pending: 0, unread: 0, voip: '', lastMsg: '', lastTime: '' }, bare);
            if (!byAgent[bare] || !byAgent[bare].name) inst = { ...inst, name: (base.name || baseId) + ' ' + faNum(bare.slice(hi + 1)) };
            agents.push(inst);
          }
        }
      } catch (_) {}
    }
    res.json(agents);
  } catch (e) {
    res.status(500).json({ error: 'server_error', detail: String(e?.message || e) });
  }
});

// خریدِ «نمونهٔ دیگرِ» یک ایجنت (مثلاً دستیارِ دوم) — از کیف‌پول، از طریقِ ماژولِ خریدِ متمرکز.
// نمونه‌ها با کلیدِ owned مثلِ ::baseId#N نگه‌داری می‌شوند و endpointِ /agents خودش آن‌ها را به ایجنتِ جدا بسط می‌دهد.
router.post('/agent/instance', authRequired, async (req, res) => {
  try {
    const sub = String(req.user.sub);
    const baseId = String(req.body?.baseId || 'assistant').trim();
    if (!/^[a-zA-Z0-9_]+$/.test(baseId)) return res.status(400).json({ error: 'bad_base' });
    // قیمت از تنظیماتِ سوپرادمین (agentInstancePrice) یا پیش‌فرض.
    let price = 50000;
    try { const { rows } = await query("SELECT data->>'agentInstancePrice' AS p FROM settings WHERE id = 1"); const p = Number(rows[0]?.p); if (!isNaN(p) && p >= 0) price = p; } catch (_) {}

    const bareOf = (k) => String(k).split('::').pop().split('#')[0];
    const out = await purchase(sub, {
      amount: price, txType: 'agent_instance', txLabel: 'خرید نمونهٔ دیگرِ ایجنت (' + baseId + ')',
      apply: (meta) => {
        const owned = Array.isArray(meta.ownedAgents) ? meta.ownedAgents : [];
        // بزرگ‌ترین اندیسِ موجود برای این baseId را پیدا کن؛ نمونهٔ بعدی = max+1 (پایه بدونِ # است، پس از ۲ شروع).
        let maxN = 1;
        for (const k of owned) { if (bareOf(k) === baseId) { const hi = String(k).indexOf('#'); if (hi >= 0) { const n = parseInt(String(k).slice(hi + 1), 10); if (!isNaN(n) && n > maxN) maxN = n; } } }
        const N = maxN + 1;
        const key = '::' + baseId + '#' + N;
        owned.push(key);
        meta.ownedAgents = owned;
        return { instanceId: baseId + '#' + N };
      },
    });
    if (out.error) return res.status(out.status || 400).json({ error: out.error, balance: out.balance });
    res.json({ ok: true, instanceId: out.instanceId, balance: out.balance, ownedAgents: out.ownedAgents });
  } catch (e) {
    res.status(500).json({ error: 'server_error', detail: String(e?.message || e) });
  }
});

// تولیدِ محتوای بازاریابیِ داین (شبکه اجتماعی/پیشنهادِ ویژه/پیامک/آگهی) — از دادهٔ «واقعیِ» رستوران
// (اسم، پرفروش‌ها، ستاره‌های منو) + موتورِ LLM. اگر LLM نبود، یک قالبِ واقعی از همان داده برمی‌گردد.
// «قبل از» گاردِ ادمین، چون صاحبِ رستوران (نقشِ user) باید بتواند صدایش بزند.
router.post('/dine-content', authRequired, async (req, res) => {
  const kind = String(req.body?.kind || 'social');
  const topic = String(req.body?.topic || '').slice(0, 200);
  const tone = String(req.body?.tone || 'صمیمی و جذاب').slice(0, 60);
  try {
    const ins = await computeDineInsights(req.user.sub);
    const venue = ins.venueName || 'رستوران';
    const popular = (ins.topSellers || []).slice(0, 4).map((t) => t.name);
    const stars = ((ins.menuEngineering && ins.menuEngineering.star) || []).slice(0, 3);
    const KIND_DESC = {
      social: 'یک پستِ جذابِ اینستاگرام/شبکه‌های اجتماعی با چند ایموجی و ۳ تا ۵ هشتگِ فارسیِ مرتبط',
      promo: 'یک متنِ کوتاهِ تبلیغِ پیشنهادِ ویژه/تخفیف',
      sms: 'یک پیامکِ تبلیغاتیِ کوتاه (زیرِ ۱۶۰ کاراکتر، بدونِ لینک)',
      ad: 'یک متنِ کوتاهِ آگهیِ تبلیغاتی برای بنر/گوگل',
    };
    const sys = 'تو کارشناسِ محتوای بازاریابیِ رستوران هستی و فارسیِ روان و جذاب می‌نویسی. فقط متنِ نهایی را بده، بدونِ توضیحِ اضافه و بدونِ نقلِ‌قول.';
    const user = `برای «${venue}» ${KIND_DESC[kind] || KIND_DESC.social} بنویس با لحنِ «${tone}».`
      + (popular.length ? ` غذاهای پرفروش: ${popular.join('، ')}.` : '')
      + (stars.length ? ` روی این‌ها تأکید کن: ${stars.join('، ')}.` : '')
      + (topic ? ` موضوع/مناسبت: ${topic}.` : '');
    const text = await llmComplete(sys, user, 400);
    if (text) return res.json({ ok: true, text });
    // fallback بدونِ LLM — قالبِ واقعی از دادهٔ رستوران (نه فیک)
    const fb = `${venue} 🍽️\n${topic ? topic + '\n' : ''}${popular.length ? 'پیشنهادِ امروزِ ما: ' + popular.slice(0, 3).join('، ') + '\n' : ''}همین حالا سفارش بده! 😋`;
    res.json({ ok: true, text: fb, fallback: true });
  } catch (e) {
    res.status(500).json({ error: 'content_failed', detail: String(e?.message || e) });
  }
});

// همه‌ی مسیرهای بعدی فقط برای ادمین/سوپر‌ادمین
router.use(...adminGuard);

// دریافت کل لیست مدل‌ها از ارائه‌دهنده (endpoint استاندارد OpenAI: /models)
// و درج/به‌روزرسانی در کاتالوگ ai_models (نام نمایشی موجود حفظ می‌شود).
router.post('/providers/:id/sync', async (req, res) => {
  const provider = await getProvider(req.params.id);
  if (!provider) return res.status(404).json({ error: 'provider_not_found' });
  if (!provider.apiKey) return res.status(400).json({ error: 'missing_api_key' });

  let list;
  try {
    const url = `${provider.baseUrl.replace(/\/$/, "")}/models`;
    console.log('AI sync → GET', url);
    const r = await fetchT(url, {
      headers: { Authorization: `Bearer ${provider.apiKey}` },
    });
    const bodyText = await r.text();
    if (!r.ok) {
      console.error('AI sync provider_error', r.status, String(bodyText).slice(0, 300));
      return res.status(502).json({ error: 'provider_error', status: r.status, detail: String(bodyText).slice(0, 300) });
    }
    let j; try { j = JSON.parse(bodyText); } catch (e) { j = null; }
    list = Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];
    console.log('AI sync OK — received', list.length, 'models from', req.params.id);
  } catch (e) {
    console.error('AI sync fetch_failed', String(e?.message || e));
    return res.status(502).json({ error: 'fetch_failed', detail: String(e?.message || e) });
  }

  let added = 0, updated = 0;
  for (const m of list) {
    const modelId = m.id || m.model || m.name;
    if (!modelId) continue;
    const id = String(modelId);
    const existing = await query("SELECT data FROM documents WHERE collection='ai_models' AND id=$1", [id]);
    const prev = existing.rows[0]?.data;
    const kind = /image|dall|flux|sd|midjourney|imagen|seedream|kandinsky/i.test(id) ? 'image'
      : /tts|speech|audio|whisper|stt|transcrib|voice|sahab|gpt-4o-mini-tts|gpt-4o-transcribe/i.test(id) ? 'audio' : 'chat';
    const data = {
      id,
      modelId: id,
      displayName: prev?.displayName || id, // نام نمایشی = همان شناسه‌ی مدل در API
      provider: req.params.id,
      kind: prev?.kind || kind,
      enabled: prev ? prev.enabled : true, // مدل‌های import‌شده پیش‌فرض فعال‌اند
      raw: m,
    };
    await query(
      `INSERT INTO documents (collection, id, data) VALUES ('ai_models', $1, $2::jsonb)
       ON CONFLICT (collection, id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [id, JSON.stringify(data)]
    );
    prev ? updated++ : added++;
  }
  res.json({ ok: true, total: list.length, added, updated });
});

// تست چت با یک مدل
router.post('/test', async (req, res) => {
  const { providerId, model, prompt } = req.body || {};
  const provider = await getProvider(providerId);
  if (!provider) return res.status(404).json({ error: 'provider_not_found' });
  if (!provider.apiKey) return res.status(400).json({ error: 'missing_api_key' });
  try {
    const r = await fetchT(`${provider.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt || 'سلام! یک جمله کوتاه فارسی بگو.' }],
      }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: 'provider_error', status: r.status, detail: j });
    res.json({ ok: true, text: j?.choices?.[0]?.message?.content ?? '', usage: j?.usage });
  } catch (e) {
    res.status(502).json({ error: 'fetch_failed', detail: String(e?.message || e) });
  }
});

// اندازه‌گیریِ سرعتِ پاسخِ یک مدل: یک درخواستِ کوچک (max_tokens=1) و زمانِ round-trip به میلی‌ثانیه.
router.post('/latency', async (req, res) => {
  const { model } = req.body || {};
  if (!model) return res.status(400).json({ error: 'model_required' });
  const { provider, realModel } = await resolveModel(model, null);
  if (!provider) return res.status(400).json({ error: 'no_provider' });
  if (!provider.apiKey) return res.status(400).json({ error: 'missing_api_key' });
  const t0 = Date.now();
  try {
    const r = await fetchT(`${provider.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
      body: JSON.stringify({ model: realModel, messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 }),
    }, 20000, 0); // بدون retry تا اندازهٔ واقعی به‌دست آید
    const ms = Date.now() - t0;
    const body = await r.text();
    if (!r.ok) return res.status(502).json({ error: 'provider_error', status: r.status, ms, detail: String(body).slice(0, 150) });
    res.json({ ok: true, ms });
  } catch (e) {
    res.status(502).json({ error: 'fetch_failed', ms: Date.now() - t0, detail: String(e?.message || e) });
  }
});

// تولید تصویر (مسیر استاندارد images/generations)
router.post('/image', async (req, res) => {
  const { providerId, model, prompt, size } = req.body || {};
  const provider = await getProvider(providerId);
  if (!provider) return res.status(404).json({ error: 'provider_not_found' });
  if (!provider.apiKey) return res.status(400).json({ error: 'missing_api_key' });
  if (!prompt) return res.status(400).json({ error: 'prompt_required' });
  try {
    const r = await fetchT(`${provider.baseUrl.replace(/\/$/, "")}/images/generations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
      body: JSON.stringify({ model: model || 'gpt-image-1', prompt, size: size || '1024x1024' }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: 'provider_error', status: r.status, detail: j });
    const item = j?.data?.[0] || {};
    const url = item.url || (item.b64_json ? `data:image/png;base64,${item.b64_json}` : null);
    res.json({ ok: true, url, raw: j?.data });
  } catch (e) {
    res.status(502).json({ error: 'fetch_failed', detail: String(e?.message || e) });
  }
});

export default router;
