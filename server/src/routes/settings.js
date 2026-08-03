import express from 'express';
import { query } from '../db.js';
import { authRequired, roleRequired } from '../auth.js';

const router = express.Router();

// مقادیر پیش‌فرض تنظیمات — باید با AppSettings فرانت هماهنگ بماند
const DEFAULTS = {
  brandName: 'Neura',
  supportEmail: 'support@neura.app',
  supportPhone: '۰۲۱-۱۲۳۴۵۶۷۸',
  // محتوای پشتیبانی که سوپرادمین ویرایش می‌کند (قبلاً در فرانت هاردکد بود).
  faqItems: [
    { id: 1, q: 'چگونه سفارش خود را پیگیری کنم؟', a: 'از بخش سفارشات من، وضعیت سفارش‌تان را ببینید. همچنین می‌توانید با ربات پشتیبانی گفتگو کنید.', category: 'سفارش' },
    { id: 2, q: 'چگونه سفارش را لغو کنم؟', a: 'قبل از آماده‌سازی، می‌توانید از بخش سفارشات دکمه لغو را بزنید. بعد از آماده‌سازی با پشتیبانی تماس بگیرید.', category: 'سفارش' },
    { id: 3, q: 'روش‌های پرداخت چیست؟', a: 'پرداخت آنلاین، کارت‌خوان در محل و کیف پول الکترونیکی پشتیبانی می‌شود.', category: 'پرداخت' },
    { id: 4, q: 'زمان تحویل چقدر است؟', a: 'معمولاً ۲۰ تا ۴۵ دقیقه بسته به فاصله رستوران. در ساعات شلوغ ممکن است بیشتر شود.', category: 'تحویل' },
    { id: 5, q: 'چگونه آدرس تحویل را تغییر دهم؟', a: 'از بخش پروفایل > آدرس‌ها، آدرس جدید اضافه یا آدرس فعلی را ویرایش کنید.', category: 'حساب' },
    { id: 6, q: 'اگر غذا مشکل داشت چه کنم؟', a: 'در بخش تیکت‌ها یک درخواست جدید ثبت کنید یا با پشتیبانی تماس بگیرید. مبلغ بازگردانده می‌شود.', category: 'کیفیت' },
  ],
  // دسته‌بندیِ فروشگاه‌های مارکت — تاکسونومیِ سوپرادمین (قبلاً در فرانت هاردکد بود). فروشنده فروشگاهش را
  // به یکی از این‌ها منتسب می‌کند و /shop/market فیلد cat را برمی‌گرداند.
  marketCategories: [
    { id: 'electronics', label: 'دیجیتال', icon: 'fa-solid fa-laptop' },
    { id: 'grocery', label: 'سوپرمارکت', icon: 'fa-solid fa-basket-shopping' },
    { id: 'fashion', label: 'پوشاک', icon: 'fa-solid fa-shirt' },
    { id: 'beauty', label: 'آرایشی', icon: 'fa-solid fa-spa' },
    { id: 'books', label: 'کتاب', icon: 'fa-solid fa-book' },
  ],
  // نکته: دسته‌بندیِ «منویِ» داین عمداً اینجا نیست — بخش‌های منو از دادهٔ واقعیِ منوی هر رستوران
  // ساخته می‌شوند (per-restaurant)، نه تاکسونومیِ سوپرادمین. فقط «نوعِ آشپزیِ رستوران» تاکسونومیِ سراسری است:
  // دسته‌بندیِ نوعِ آشپزیِ رستوران‌ها (فیلترِ رستوران در داین) — سوپرادمین کنترل می‌کند.
  cuisineCategories: [
    { id: 'iranian', label: 'ایرانی', icon: 'fa-solid fa-bowl-rice' },
    { id: 'fastfood', label: 'فست‌فود', icon: 'fa-solid fa-burger' },
    { id: 'italian', label: 'ایتالیایی', icon: 'fa-solid fa-pizza-slice' },
    { id: 'diet', label: 'سالاد و رژیمی', icon: 'fa-solid fa-leaf' },
    { id: 'kabab', label: 'کبابی', icon: 'fa-solid fa-fire-burner' },
    { id: 'seafood', label: 'دریایی', icon: 'fa-solid fa-fish' },
    { id: 'cafe', label: 'کافه و صبحانه', icon: 'fa-solid fa-mug-hot' },
  ],
  // خطوطِ تماسِ پشتیبانی (هر واحد شمارهٔ واقعی خودش؛ پیش‌فرض = supportPhone). سوپرادمین ویرایش می‌کند.
  supportLines: [
    { icon: 'fa-solid fa-headset', label: 'پشتیبانی عمومی', desc: 'پاسخگویی ۲۴ ساعته', phone: '۰۲۱-۱۲۳۴۵۶۷۸', color: '#3B82F6', available: true },
    { icon: 'fa-solid fa-utensils', label: 'واحد سفارشات', desc: 'پیگیری و تغییر سفارش', phone: '۰۲۱-۱۲۳۴۵۶۷۸', color: '#10B981', available: true },
    { icon: 'fa-solid fa-money-bill', label: 'واحد مالی', desc: 'مشکلات پرداخت و استرداد', phone: '۰۲۱-۱۲۳۴۵۶۷۸', color: '#F59E0B', available: true },
  ],
  defaultTheme: 'light',
  primaryColor: '#9B59B6',
  language: 'fa',
  aiEnabled: true,
  aiApiBase: 'https://api.openai.com/v1',
  aiApiKey: '',
  aiModel: 'gpt-4o-mini',
  smsEnabled: false,
  smsApiKey: '',
  webhookUrl: '',
  allowRegistration: true,
  sessionTimeout: 30,
  maintenanceMode: false,
  // کیفِ‌پول: اعدادِ پیش‌فرضِ قابل‌تنظیم از سوپرادمین.
  walletInitialBalance: 0,                                   // موجودیِ اولیهٔ کاربرِ جدید (تومان)
  walletQuickAmounts: [1000000, 2000000, 5000000, 10000000], // دکمه‌های مبلغِ سریعِ شارژ
  // پلن‌های اشتراکِ کاربرِ نهایی (دستیار) — سوپرادمین قیمت/توکن/ویژگی‌ها را کنترل می‌کند؛
  // کاربر این‌ها را در «اشتراک و پلن‌ها» می‌بیند و با کیف‌پول ارتقا می‌دهد. (نه هاردکد در کلاینت.)
  neuraPlans: [
    { id: 'free', name: 'پایه',      price: 'رایگان',        priceNum: 0,      tokens: '۲,۰۰۰ توکن',   features: ['دستیار پایه', 'پشتیبانی ایمیلی'],                color: '#6B7280' },
    { id: 'pro',  name: 'Neura Pro', price: '۱۴۹,۰۰۰ / ماه', priceNum: 149000, tokens: '۱۰,۰۰۰ توکن',  features: ['دستیار پیشرفته', 'صدای پریمیوم', 'پشتیبانی ۲۴/۷'], color: '#B83D9E' },
    { id: 'max',  name: 'Neura Max', price: '۳۹۹,۰۰۰ / ماه', priceNum: 399000, tokens: 'نامحدود',      features: ['همه ایجنت‌ها', 'API دسترسی', 'آموزش اختصاصی'],     color: '#F59E0B' },
  ],
  // پلن‌های «کسب‌وکار» (مدیریت پلن‌ها در پنل) — سوپرادمین کنترل می‌کند؛ جدا از پلنِ مصرفیِ کاربر.
  neuraBizPlans: [
    { id: 'p1', name: 'استارتر', price: '۹۰۰K', period: 'ماهانه', color: '#3B82F6', features: ['۲ ایجنت فعال', '۵۰۰ گفتگو در ماه', 'گزارش پایه', 'پشتیبانی ایمیلی'] },
    { id: 'p2', name: 'حرفه‌ای', price: '۲.۵M', period: 'ماهانه', color: '#10B981', features: ['۱۰ ایجنت فعال', 'گفتگوی نامحدود', 'تحلیل پیشرفته AI', 'API + Webhook', 'پشتیبانی ۲۴/۷'] },
    { id: 'p3', name: 'سازمانی', price: '۸M', period: 'ماهانه', color: '#FFD700', features: ['ایجنت نامحدود', 'مدل اختصاصی', 'SLA ۹۹.۹٪', 'استقرار اختصاصی', 'مدیر حساب اختصاصی'], badge: 'محبوب‌ترین' },
  ],
  // قیمتِ ماهانهٔ «پروموشنِ» هر فروشگاه/محصول در مارکت (تومان) — سوپرادمین کنترل می‌کند.
  promoMonthlyPrice: 49000,
  // کدهای تخفیف/آفرهای «پیشنهادات ویژه» — سوپرادمین تعریف می‌کند (پیش‌فرض خالی: سوپرادمینِ تازه هیچ
  // آفری ندارد مگر خودش اضافه کند). هر آفر: {title, desc, discount, code, validUntil, source:'market'|'dine'}.
  marketOffers: [],
  // ورود با گوگل (Google Identity) — تا وقتی سوپرادمین Client ID را نگذارد و فعال نکند، دکمه
  // «الکی» وارد نمی‌کند؛ پیامِ صادق می‌دهد. با فعال‌سازی، جریانِ واقعیِ OAuth انجام می‌شود.
  googleAuthEnabled: false,
  googleClientId: '',
  // واحدهای کالا (ایجنتِ خرید و تدارکات) — سوپرادمین تعریف می‌کند؛ در تعریفِ کالا و درخواستِ خرید استفاده می‌شود.
  procUnits: ['عدد', 'کیلوگرم', 'تن', 'لیتر', 'متر', 'متر مکعب', 'بسته', 'کارتن'],
  // دسته‌بندیِ کالا (تدارکات) — لیستِ کاملِ ثابت از سوپرادمین تا کاربر برای انتخابِ دسته گیر نیفتد و
  // با املای غلط دیتا به‌هم نریزد. کاربر فقط از این فهرست انتخاب می‌کند (دراپ‌داون).
  procCategories: [
    'لوازم اداری', 'لوازم IT و رایانه', 'مواد مصرفی', 'مواد اولیهٔ تولید', 'قطعات یدکی',
    'ابزار و یراق‌آلات', 'تجهیزات و ماشین‌آلات', 'ایمنی و حفاظت فردی', 'برقی و الکترونیک',
    'بهداشتی و نظافتی', 'بسته‌بندی', 'مواد غذایی و آشامیدنی', 'پوشاک و منسوجات', 'مصالح ساختمانی',
    'خودرو و حمل‌ونقل', 'مواد شیمیایی', 'کشاورزی و دامی', 'پزشکی و آزمایشگاهی', 'روشنایی',
    'لوله و اتصالات', 'رنگ و پوشش', 'انرژی و سوخت', 'خدمات', 'سایر',
  ],
  // ورود با OTP پیامکی (ippanel)
  otpEnabled: false,
  ippanelApiKey: '',
  ippanelBaseUrl: 'https://api2.ippanel.com/api/v1',
  ippanelSendPath: '/sms/pattern/normal/send',
  ippanelPatternCode: '',
  ippanelSender: '+983000505',
  ippanelVariable: 'code',
  // الگوی پیامکِ «یادآور» (جدا از OTP). الگو در پنلِ ippanel باید متغیرهای title / time / name را داشته باشد.
  reminderPatternCode: '',
  // احرازِ هویتِ رسمی (سامانهٔ شاهکار + ثبت‌احوال) از طریقِ Pod.ir — کلیدها از env هم خوانده می‌شوند.
  // وقتی این کلیدها پر باشند، ثبت‌نامِ کاربرِ جدید «حتماً» با شاهکار انجام می‌شود (تطبیقِ موبایل↔کدملی).
  shahkarEnabled: false,
  podium: {
    url: 'https://api.pod.ir/srv/sc2/consumers/services/do',
    token: '',        // PODIUM_TOKEN
    idKey: '',        // GET_IDENTITY_INFO_API_KEY (استعلامِ ثبت‌احوال)
    matchKey: '',     // MATCH_NATIONAL_ID_AND_PHONE_NUMBER_API_KEY (تطبیقِ شاهکار)
    idProduct: '46659320',
    matchProduct: '46645324',
  },
  // تماس صوتی با سرور ویپ (Asterisk ARI روی HTTP)
  voipEnabled: false,
  voipType: 'asterisk-ari',
  voipBaseUrl: '',          // مثلاً 84.241.5.9:8585 (http:// و /ari خودکار)
  voipUsername: '',
  voipPassword: '',
  voipTrunk: '',            // ترانک خروجی، مثلاً mytrunk → PJSIP/{number}@{trunk}
  voipEndpointPattern: 'PJSIP/{number}',
  voipContext: 'from-internal',
  voipExtension: '',        // داخلیِ مقصدِ اتصال در dialplan (خالی = همان شماره)
  voipPriority: 1,
  voipCallerId: 'Neura',
  voipTimeout: 30,
  voipAppName: '',          // اگر پر شود، تماس به اپ Stasis می‌رود (برای فاز ۲ صدای AI)
  voipAppArgs: '',
  // دسترسیِ کاربران: تا قبل از خرید ایجنت، محیط سیاه‌سفید + این متن نمایش داده می‌شود
  trialMessage: 'برای استفاده از همهٔ امکانات و ایجنت‌ها، یکی از ایجنت‌ها را فعال/خریداری کنید.',
  freeAgentId: 'assistant',  // ایجنتِ رایگانِ همهٔ کاربران (دستیار شخصی)
  aiMemoryDepth: 50,         // چند پیامِ گذشتهٔ کاربر را هوش مصنوعی به‌خاطر بسپارد/در نظر بگیرد
  // حافظهٔ بلندمدت (پروفایلِ پایدارِ کاربر) — هیچ‌وقت trim نمی‌شود؛ حتی سال‌ها بعد کاربر را می‌شناسد
  aiProfileEnabled: true,    // ساخت/استفاده از پروفایلِ پایدارِ کاربر
  aiProfileEveryN: 6,        // هر چند پیامِ کاربر، پروفایل به‌روزرسانی شود
  aiProfileMaxWords: 220,    // حداکثر طولِ خلاصهٔ پروفایل (کلمه)
  // ارسالِ پیامکِ متنِ آزاد (برای ابزارِ send_sms دستیار) — جدا از پترنِ OTP
  ippanelTextSender: '',     // خطِ ارسالِ متنِ آزاد (اگر خالی، از همان sender پترن استفاده می‌شود)
  ippanelTextSendPath: '/sms/send/webservice/single',
  // مدل‌های صوت (گفتار↔متن) — از مدل‌های گپ انتخاب می‌شوند
  sttModel: 'whisper-1',     // تبدیل گفتار به متن (مثلاً gapgpt/whisper-1)
  ttsModel: 'tts-1',         // تبدیل متن به صوت (مثلاً gapgpt/tts-1)
  ttsVoice: 'alloy',         // صدای پیش‌فرضِ TTS
  // صدا به تفکیکِ جنسیت — چون بعضی مدل‌ها (Gemini) جنسیتِ صدا را اعمال نمی‌کنند،
  // برای هر جنسیت می‌توان مدل و صدای جداگانه گذاشت (قابلِ تغییر در سوپرادمین).
  ttsModelFemale: 'gemini-2.5-flash-tts', // صدای زنانه (کیفیتِ فارسیِ خوب)
  ttsVoiceFemale: 'Aoede',
  ttsModelMale: 'gpt-4o-mini-tts',        // صدای مردانه (مدلی که جنسیت را واقعاً اعمال می‌کند)
  ttsVoiceMale: 'onyx',
  // ردیاب/اتوماسیونِ بازاریابی — قوانینِ «وقتی کاربر وارد ایجنت/صفحه شد، پیامک بده یا آفر نشان بده»
  trackRules: [],
  // کدهای پترنِ ippanel برای پیامکِ بازاریابی (در پنلِ ippanel ثبت می‌شوند)
  smsPatternPage: '',                 // پترنِ پیامک برای صفحات — متغیر: offer
  smsPatternsByAgent: { secretary: '', marketer: '', finance: '', procurement: '', cashier: '', dine: '' }, // متغیرها: agent, discount
  // نقشه/ژئوکدینگِ فارسی (برای گرفتنِ آدرس و لوکیشنِ کاربر). کلید و آدرسِ پایه از سوپرادمین تنظیم می‌شوند؛
  // کلید هرگز به کلاینت داده نمی‌شود — سرور به‌عنوان پروکسی درخواست می‌زند (/api/map/*).
  mapEnabled: false,
  mapApiBaseUrl: '',                  // مثلاً https://map.example.ir (بدونِ /v1)
  mapApiKey: '',                      // کلید API نقشه (حساس)
  mapApiKeyParam: 'api_key',          // نامِ پارامترِ کوئریِ کلید (اگر API هدر می‌خواهد: خالی بگذار)
  mapApiKeyHeader: '',                // نامِ هدرِ کلید (مثلاً X-API-Key) — اگر API هدری است
  mapTileUrl: '',                     // قالبِ تایلِ نقشه (اختیاری): https://tile.neksa.ir/{z}/{x}/{y}.png?key={key} — خالی = نقشهٔ OSM
  // ایجنتِ رستوران‌داری (داین) — درآمدزایی + تنظیماتِ عملیاتی که سوپرادمین کنترل می‌کند.
  dineSubscriptionPrice: 0,           // قیمتِ اشتراکِ ماهانهٔ ایجنت داین (تومان) — از کیف‌پول کسر می‌شود
  dineCommissionPct: 0,               // درصدِ کمیسیونِ پلتفرم روی هر سفارشِ داین (به‌نفعِ پلتفرم)
  dineTargetFoodCostPct: 30,          // هدفِ فودکاست (٪) — مبنای پیشنهادِ داینامیکِ قیمتِ منو
  // ضرایبِ تبدیلِ واحد به «واحدِ پایه» برای محاسبهٔ بهای تمام‌شده (هزینه به‌ازای گرم/میلی‌لیتر/عدد):
  // مقدار = چند واحدِ پایه در هر واحد. پایه‌ها: kg→g(۱۰۰۰)، l→ml(۱۰۰۰)، بقیه عددی.
  unitConversion: {
    'گرم': 1, 'کیلوگرم': 1000, 'تن': 1000000,
    'میلی‌لیتر': 1, 'لیتر': 1000,
    'عدد': 1, 'بسته': 1, 'کارتن': 1, 'متر': 1, 'متر مکعب': 1,
  },
};

// تنظیمات حساس را از خروجی عمومی حذف کن
const SECRET_KEYS = ['aiApiKey', 'smsApiKey', 'ippanelApiKey', 'voipPassword', 'mapApiKey'];

// خواندن تنظیمات — عمومی است (برند/تم برای همه لازم است)
// کلیدهای حساس حذف می‌شوند؛ به‌جای مقدار، پرچم "*Set" نشان می‌دهد که مقداری ذخیره شده است.
router.get('/', async (_req, res) => {
  const { rows } = await query('SELECT data FROM settings WHERE id = 1');
  const merged = { ...DEFAULTS, ...(rows[0]?.data || {}) };
  const out = { ...merged };
  for (const k of SECRET_KEYS) {
    out[`${k}Set`] = !!merged[k];
    delete out[k];
  }
  res.json(out);
});

// ذخیره تنظیمات — فقط سوپر‌ادمین
router.put('/', authRequired, roleRequired('superadmin'), async (req, res) => {
  const patch = req.body || {};
  // فقط کلیدهای شناخته‌شده را قبول کن
  const clean = {};
  for (const k of Object.keys(DEFAULTS)) {
    if (!(k in patch)) continue;
    // کلید حساسِ خالی، مقدار قبلی را پاک نکند
    if (SECRET_KEYS.includes(k) && !patch[k]) continue;
    clean[k] = patch[k];
  }

  const { rows } = await query(
    `INSERT INTO settings (id, data, updated_at)
       VALUES (1, $1::jsonb, now())
     ON CONFLICT (id) DO UPDATE
       SET data = settings.data || $1::jsonb, updated_at = now()
     RETURNING data`,
    [JSON.stringify(clean)]
  );
  const merged = { ...DEFAULTS, ...rows[0].data };
  for (const k of SECRET_KEYS) { merged[`${k}Set`] = !!merged[k]; delete merged[k]; }
  res.json(merged);
});

export default router;
