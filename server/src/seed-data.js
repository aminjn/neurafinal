// داده‌ی اولیه برای seed — نسخه‌ی مستقل از فرانت (هم‌شکل با src/app/components/data.ts)

export const agents = [
  { id: 'marketing', name: 'ایجنت بازاریاب', role: 'عامل بازاریابی', team: 'marketing', gender: 'f', bg: 'aw-bg-blue', init: 'ب', locked: false, instructions: 'تمرکز بر بازاریابی دیجیتال و تحلیل رقبا. کمپین‌های ایمیل و شبکه‌های اجتماعی را مدیریت کن.', lastMsg: '', lastTime: '', unread: 0, done: 0, pending: 0, voip: '۱۰۱', company: 'alpha' },
  { id: 'sales', name: 'ایجنت فروش', role: 'عامل فروش', team: 'sales', gender: 'm', bg: 'aw-bg-green', init: 'ف', locked: false, instructions: 'مدیریت فرآیند فروش، پیگیری سرنخ‌ها و صدور فاکتور. تمرکز بر تبدیل سرنخ به مشتری.', lastMsg: '', lastTime: '', unread: 0, done: 0, pending: 0, voip: '۱۰۲', company: 'alpha' },
  { id: 'finance', name: 'ایجنت مالی و اداری', role: 'عامل مالی و اداری', team: 'finance', gender: 'f', bg: 'aw-bg-purple', init: 'م', locked: false, instructions: 'مدیریت مالی و حسابداری شامل دریافت و پرداخت، صورت‌حساب و گزارش‌های مالی.', lastMsg: '', lastTime: '', unread: 0, done: 0, pending: 0, voip: '۱۰۳', company: 'alpha' },
  { id: 'secretary', name: 'ایجنت منشی', role: 'عامل منشی', team: 'secretary', gender: 'f', bg: 'aw-bg-pink', init: 'م', locked: false, instructions: 'مدیریت تقویم و جلسات. یادآوری قرارها و هماهنگی جلسات.', lastMsg: '', lastTime: '', unread: 0, done: 0, pending: 0, voip: '۱۰۴', company: 'alpha' },
  { id: 'procurement', name: 'ایجنت تدارکات', role: 'عامل تدارکات', team: 'procurement', gender: 'm', bg: 'aw-bg-orange', init: 'ت', locked: false, instructions: 'مدیریت تامین و سفارشات. بررسی موجودی و ثبت درخواست خرید.', lastMsg: '', lastTime: '', unread: 0, done: 0, pending: 0, voip: '۱۰۵', company: 'alpha' },
  // ایجنتِ رستوران‌داری (داین) — نرم‌افزارِ کاملِ مدیریتِ رستوران/کافه (منو، سفارش، آشپزخانه/KDS،
  // بهای تمام‌شده، انبار و رسپی، پرسنل و شیفت، صندوق، گزارش‌ها). جدا از فروشنده/صندوقدارِ عمومی.
  { id: 'dine', name: 'داین', role: 'مدیریتِ کاملِ رستوران و کافه', team: 'dine', gender: 'm', bg: 'aw-bg-teal', init: 'د', locked: false, instructions: 'داین: نرم‌افزارِ کاملِ مدیریتِ رستوران/کافه — منو، پذیرش و سفارش، آشپزخانه (KDS)، بهای تمام‌شدهٔ غذا، انبار و رسپی، پرسنل و شیفت، صندوق، باشگاه مشتریان و گزارش‌ها — هوشمند و مبتنی بر هوش مصنوعی.', lastMsg: '', lastTime: '', unread: 0, done: 0, pending: 0, voip: '۱۰۹', company: 'alpha' },
  // «ایجنت رستوران»ِ قدیمی حذف شد — «داین» به‌طورِ کامل جایگزینش شده. (پاک‌سازیِ نمونه‌های موجود در ensureAgents)
  { id: 'assistant', name: 'دستیار شخصی', role: 'عامل دستیار', gender: 'm', bg: 'aw-bg-indigo', init: 'د', locked: false, instructions: 'مدیریت امور شخصی، یادآوری‌ها، هماهنگی جلسات و پیگیری کارها.', lastMsg: '', lastTime: '', unread: 0, done: 0, pending: 0, voip: '۱۰۷', company: 'alpha' },
  { id: 'support', name: 'پشتیبانی', role: 'عامل پشتیبانی', gender: 'f', bg: 'aw-bg-rose', init: 'پ', locked: false, instructions: 'پاسخ‌گویی به سوالات، رفع مشکلات فنی و راهنمایی کاربران.', lastMsg: '', lastTime: '', unread: 0, done: 0, pending: 0, voip: '۱۰۸', company: 'alpha' },
];

export const personnel = [
  { id: 'p1', name: 'محمد حسینی', role: 'مدیر فروش', status: 'online', bg: 'aw-bg-sky', init: 'م', lastMsg: 'قرارداد جدید بسته شد', lastTime: '۱۱:۰۰', unread: 1, voip: '۳۰۱', email: 'm.hosseini@neura.ir', phone: '۰۹۱۲۱۱۱۲۲۳۳', permissions: ['dashboard', 'crm', 'orders', 'tasks', 'marketing'] },
  { id: 'p2', name: 'زهرا نوری', role: 'حسابدار', status: 'online', bg: 'aw-bg-amber', init: 'ز', lastMsg: 'فاکتورها بررسی شد', lastTime: '۱۰:۴۵', unread: 0, voip: '۳۰۲', email: 'z.noori@neura.ir', phone: '۰۹۱۲۲۲۲۳۳۴۴', permissions: ['dashboard', 'finance', 'orders'] },
  { id: 'p3', name: 'امیر کاظمی', role: 'پشتیبان فنی', status: 'offline', bg: 'aw-bg-emerald', init: 'ا', lastMsg: 'تیکت شماره ۴۵ بسته شد', lastTime: 'دیروز', unread: 0, voip: '۳۰۳', email: 'a.kazemi@neura.ir', phone: '۰۹۱۲۳۳۳۴۴۵۵', permissions: ['dashboard', 'agents', 'tasks'] },
  { id: 'p4', name: 'مریم فرهادی', role: 'منابع انسانی', status: 'offline', bg: 'aw-bg-rose', init: 'م', lastMsg: 'قرارداد جدید آماده امضاست', lastTime: 'دیروز', unread: 0, voip: '۳۰۴', email: 'm.farhadi@neura.ir', phone: '۰۹۱۲۴۴۴۵۵۶۶', permissions: ['dashboard', 'personnel', 'tasks'] },
];

export const customers = [
  { id: 'c1', name: 'شرکت پارس فولاد', contact: 'احمد محمدی', phone: '۰۹۱۲۱۲۳۴۵۶۷', email: 'info@parsfolad.ir', status: 'active', value: '۱,۲۰۰,۰۰۰,۰۰۰', lastContact: '۱۴۰۴/۱۱/۲۵', bg: 'aw-bg-sky', init: 'پ', lastMsg: 'قرارداد جدید آماده بررسی است', lastTime: '۱۰:۳۰', unread: 2 },
  { id: 'c2', name: 'فناوری آینده', contact: 'سارا رضایی', phone: '۰۹۱۳۹۸۷۶۵۴۳', email: 'info@ayandeh.co', status: 'active', value: '۸۵۰,۰۰۰,۰۰۰', lastContact: '۱۴۰۴/۱۱/۲۸', bg: 'aw-bg-green', init: 'ف', lastMsg: 'پیش‌فاکتور ارسال شد', lastTime: '۰۹:۱۵', unread: 1 },
  { id: 'c3', name: 'صنایع نور', contact: 'علی کریمی', phone: '۰۹۱۴۵۵۵۱۲۳۴', email: 'ali@noor.ir', status: 'lead', value: '۰', lastContact: '۱۴۰۴/۱۱/۳۰', bg: 'aw-bg-amber', init: 'ص', lastMsg: 'درخواست اولیه ثبت شد', lastTime: 'دیروز', unread: 0 },
  { id: 'c4', name: 'بازرگانی سپهر', contact: 'نیما احمدی', phone: '۰۹۱۵۱۱۱۲۲۲۳', email: 'nima@sepehr.com', status: 'inactive', value: '۲,۳۰۰,۰۰۰,۰۰۰', lastContact: '۱۴۰۴/۱۰/۱۵', bg: 'aw-bg-orange', init: 'ب', lastMsg: 'آخرین مکاتبه انجام شد', lastTime: '۲ روز پیش', unread: 0 },
];

export const deals = [
  { id: 'd1', title: 'قرارداد تامین قطعات', customer: 'شرکت پارس فولاد', value: '۵۰۰,۰۰۰,۰۰۰', stage: 'negotiation', probability: '۷۵٪' },
  { id: 'd2', title: 'پروژه نرم‌افزار ERP', customer: 'فناوری آینده', value: '۱,۲۰۰,۰۰۰,۰۰۰', stage: 'proposal', probability: '۵۰٪' },
  { id: 'd3', title: 'خدمات پشتیبانی سالانه', customer: 'صنایع نور', value: '۲۰۰,۰۰۰,۰۰۰', stage: 'closed', probability: '۱۰۰٪' },
];

export const finance = [
  { id: 'f1', kind: 'income', desc: 'فاکتور پارس فولاد', amount: '۵۰۰,۰۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۲۸', status: 'paid', category: 'فروش' },
  { id: 'f2', kind: 'income', desc: 'قرارداد فناوری آینده', amount: '۳۰۰,۰۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۲۵', status: 'pending', category: 'خدمات' },
  { id: 'f3', kind: 'income', desc: 'خدمات پشتیبانی', amount: '۲۰۰,۰۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۲۰', status: 'paid', category: 'پشتیبانی' },
  { id: 'f4', kind: 'expense', desc: 'حقوق پرسنل', amount: '۱۸۰,۰۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۳۰', status: 'paid', category: 'حقوق' },
  { id: 'f5', kind: 'expense', desc: 'اجاره دفتر', amount: '۵۰,۰۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۰۱', status: 'paid', category: 'اداری' },
  { id: 'f6', kind: 'expense', desc: 'تجهیزات سرور', amount: '۱۲۰,۰۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۱۵', status: 'pending', category: 'فناوری' },
];

export const orders = [
  { id: 'o1', num: '۱۰۲۳', status: 'delivered', desc: 'چلوکباب سلطانی × ۲', date: '۱۴۰۴/۱۱/۲۸', price: '۴۵۰,۰۰۰', agentId: 'restaurant' },
  { id: 'o2', num: '۱۰۲۴', status: 'preparing', desc: 'پیتزا مخصوص × ۱', date: '۱۴۰۴/۱۱/۳۰', price: '۳۲۰,۰۰۰', agentId: 'restaurant' },
  { id: 'o3', num: '۱۰۲۵', status: 'pending', desc: 'ساندویچ ویژه × ۳', date: '۱۴۰۴/۱۲/۰۱', price: '۲۷۰,۰۰۰', agentId: 'restaurant' },
];

export const tasks = [
  { id: 't1', title: 'بررسی گزارش مالی ماهانه', description: 'بررسی و تایید گزارش مالی ماه جاری و ارسال به مدیرعامل', status: 'todo', priority: 'high', assignee: 'سارا محمدی', dueDate: '۱۴۰۴/۱۲/۰۵', createdAt: '۱۴۰۴/۱۱/۲۸' },
  { id: 't2', title: 'آماده‌سازی کمپین تبلیغاتی بهاره', description: 'طراحی بنر و محتوای شبکه‌های اجتماعی برای کمپین بهاره', status: 'inProgress', priority: 'medium', assignee: 'مریم احمدی', dueDate: '۱۴۰۴/۱۲/۱۰', createdAt: '۱۴۰۴/۱۱/۲۵' },
  { id: 't3', title: 'پیگیری قرارداد پارس فولاد', description: 'تماس با مشتری و نهایی کردن شرایط قرارداد', status: 'inProgress', priority: 'high', assignee: 'علی رضایی', dueDate: '۱۴۰۴/۱۲/۰۳', createdAt: '۱۴۰۴/۱۱/۲۰' },
  { id: 't4', title: 'به‌روزرسانی منوی رستوران', description: 'افزودن غذاهای جدید فصلی به منوی رستوران', status: 'done', priority: 'low', assignee: 'فاطمه حسنی', dueDate: '۱۴۰۴/۱۱/۳۰', createdAt: '۱۴۰۴/۱۱/۱۵' },
  { id: 't5', title: 'هماهنگی جلسه هیئت‌مدیره', description: 'ارسال دعوتنامه و تنظیم دستور جلسه', status: 'done', priority: 'medium', assignee: 'نرگس کریمی', dueDate: '۱۴۰۴/۱۱/۲۸', createdAt: '۱۴۰۴/۱۱/۲۰' },
  { id: 't6', title: 'سفارش تجهیزات سرور جدید', description: 'بررسی قیمت و ثبت سفارش سرور HP ProLiant', status: 'todo', priority: 'medium', assignee: 'رضا امینی', dueDate: '۱۴۰۴/۱۲/۱۵', createdAt: '۱۴۰۴/۱۱/۲۸' },
  { id: 't7', title: 'ارسال فاکتور به فناوری آینده', description: 'تهیه و ارسال فاکتور خدمات نرم‌افزاری', status: 'todo', priority: 'high', assignee: 'سارا محمدی', dueDate: '۱۴۰۴/۱۲/۰۱', createdAt: '۱۴۰۴/۱۱/۲۸' },
];

export const notifications = [
  { id: 'n1', title: 'کمپین جدید آماده بررسی', desc: 'عامل بازاریابی کمپین جدیدی ایجاد کرده است.', time: '۵ دقیقه پیش', icon: 'fa-solid fa-bullhorn', iconBg: 'aw-bg-blue', type: 'chat', target: 'marketing', cta: 'مشاهده چت' },
  { id: 'n2', title: 'فاکتور معوق', desc: 'فاکتور فناوری آینده هنوز پرداخت نشده.', time: '۱ ساعت پیش', icon: 'fa-solid fa-file-invoice-dollar', iconBg: 'aw-bg-orange', type: 'finance', target: 'pending', cta: 'مشاهده مالی' },
  { id: 'n3', title: 'سرنخ جدید در CRM', desc: 'صنایع نور به عنوان سرنخ جدید ثبت شده.', time: '۲ ساعت پیش', icon: 'fa-solid fa-user-plus', iconBg: 'aw-bg-green', type: 'crm', target: 'leads', cta: 'مشاهده CRM' },
  { id: 'n4', title: 'گزارش ماهانه آماده است', desc: 'گزارش عملکرد عامل‌ها برای ماه جاری تولید شد.', time: '۳ ساعت پیش', icon: 'fa-solid fa-chart-bar', iconBg: 'aw-bg-purple', type: 'reports', target: 'agent', cta: 'مشاهده گزارش' },
  { id: 'n5', title: 'جلسه فردا ساعت ۱۰', desc: 'عامل منشی جلسه‌ای برای فردا تنظیم کرده.', time: 'دیروز', icon: 'fa-solid fa-calendar-check', iconBg: 'aw-bg-pink', type: 'chat', target: 'secretary', cta: 'مشاهده چت' },
];

// --- ارائه‌دهندگان هوش مصنوعی (OpenAI-compatible) ---
export const ai_providers = [
  { id: 'avalai', name: 'AvalAI', baseUrl: 'https://api.avalai.ir/v1', apiKey: '', enabled: true, note: 'سازگار با OpenAI — کلید API را وارد و «دریافت مدل‌ها» را بزن' },
  { id: 'noyan', name: 'Noyan (GapGPT)', baseUrl: 'https://api.gapgpt.app/v1', apiKey: '', enabled: true, note: 'سازگار با OpenAI' },
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', apiKey: '', enabled: false },
];

// کاتالوگ مدل‌ها خالی است؛ با «دریافت مدل‌ها» مستقیماً از خود API پر می‌شود
// (نام نمایشی = همان شناسه‌ی مدل در API).
export const ai_models = [];

// --- تراکنش‌ها ---
export const transactions = [
  { id: 'TX-3001', user: 'سارا احمدی', type: 'شارژ کیف پول', amount: 1500000, method: 'آنلاین', status: 'موفق', date: '2026-04-02', ref: 'A8F12C' },
  { id: 'TX-3002', user: 'محمد کریمی', type: 'خرید ایجنت', amount: 1200000, method: 'کیف پول', status: 'موفق', date: '2026-04-08', ref: 'B91DDA' },
  { id: 'TX-3003', user: 'نگار موسوی', type: 'بازگشت وجه', amount: 200000, method: 'آنلاین', status: 'در انتظار', date: '2026-04-15', ref: 'C30FE7' },
  { id: 'TX-3004', user: 'رضا نجفی', type: 'خرید ایجنت', amount: 980000, method: 'آنلاین', status: 'ناموفق', date: '2026-04-22', ref: 'D77AA1' },
  { id: 'TX-3005', user: 'مریم صادقی', type: 'شارژ توکن', amount: 350000, method: 'کیف پول', status: 'موفق', date: '2026-04-30', ref: 'E12B33' },
  { id: 'TX-3006', user: 'علی حسینی', type: 'خرید', amount: 480000, method: 'آنلاین', status: 'موفق', date: '2026-05-04', ref: 'F44CC2' },
];

// --- فاکتورها ---
export const invoices = [
  { id: 'INV-5001', business: 'فروشگاه آلفا', createdAt: '2026-02-15', agent: 'حسابدار', grossAmount: 1500000, finalAmount: 1200000, paymentMethod: 'آنلاین', settledAt: '2026-02-15', status: 'تسویه شده' },
  { id: 'INV-5002', business: 'انبار بتا', createdAt: '2026-02-20', agent: 'انباردار', grossAmount: 600000, finalAmount: 480000, paymentMethod: 'کیف پول', settledAt: '2026-02-20', status: 'تسویه شده' },
  { id: 'INV-5003', business: 'خدمات گاما', createdAt: '2026-03-08', agent: 'پشتیبان', grossAmount: 1400000, finalAmount: 1100000, paymentMethod: 'آنلاین', settledAt: '2026-03-09', status: 'تسویه شده' },
  { id: 'INV-5004', business: 'فروشگاه آلفا', createdAt: '2026-04-01', agent: 'حسابدار', grossAmount: 1500000, finalAmount: 1500000, paymentMethod: 'آنلاین', settledAt: '', status: 'در انتظار پرداخت' },
  { id: 'INV-5005', business: 'خدمات گاما', createdAt: '2026-04-12', agent: 'بازاریاب', grossAmount: 900000, finalAmount: 720000, paymentMethod: 'کیف پول', settledAt: '2026-04-12', status: 'تسویه شده' },
];

// --- کیف‌پول‌ها ---
export const wallets = [
  { id: 'w1', user: 'سارا احمدی', email: 'sara@example.com', balance: 540000, totalCharged: 2500000, totalSpent: 1960000, status: 'فعال', lastUpdate: '2026-05-04' },
  { id: 'w2', user: 'محمد کریمی', email: 'mk@example.com', balance: 0, totalCharged: 1200000, totalSpent: 1200000, status: 'فعال', lastUpdate: '2026-04-08' },
  { id: 'w3', user: 'نگار موسوی', email: 'negar@example.com', balance: 1800000, totalCharged: 3000000, totalSpent: 1200000, status: 'فعال', lastUpdate: '2026-05-07' },
  { id: 'w4', user: 'رضا نجفی', email: 'reza@example.com', balance: 120000, totalCharged: 500000, totalSpent: 380000, status: 'غیرفعال', lastUpdate: '2026-04-22' },
  { id: 'w5', user: 'مریم صادقی', email: 'maryam@example.com', balance: 75000, totalCharged: 425000, totalSpent: 350000, status: 'فعال', lastUpdate: '2026-04-30' },
];

// --- تیکت‌ها ---
export const tickets = [
  { id: 'T-1024', subject: 'مشکل در ورود', user: 'سارا احمدی', priority: 'بالا', status: 'باز', createdAt: '2026-04-20' },
  { id: 'T-1025', subject: 'خطای پرداخت', user: 'محمد کریمی', priority: 'بحرانی', status: 'بسته', createdAt: '2026-04-22' },
  { id: 'T-1026', subject: 'درخواست بازگشت وجه', user: 'نگار موسوی', priority: 'متوسط', status: 'در حال بررسی', createdAt: '2026-05-01' },
  { id: 'T-1027', subject: 'مشکل آپلود فایل', user: 'رضا نجفی', priority: 'پایین', status: 'باز', createdAt: '2026-05-03' },
];

// --- بیزینس‌ها ---
export const businesses = [
  { id: 'B1', name: 'فروشگاه آلفا', owner: 'سارا احمدی', agents: ['حسابدار', 'پشتیبان'], createdAt: '2026-02-12', users: 12 },
  { id: 'B2', name: 'انبار بتا', owner: 'محمد کریمی', agents: ['انباردار'], createdAt: '2026-02-18', users: 7 },
  { id: 'B3', name: 'خدمات گاما', owner: 'نگار موسوی', agents: ['پشتیبان', 'بازاریاب'], createdAt: '2026-03-05', users: 24 },
];

// فقط هسته و پیکربندی seed می‌شوند؛ داده‌ی نمونه‌ی کسب‌وکار seed نمی‌شود (شروع تمیز).
// (آرایه‌های customers/transactions/.../businesses تعریف‌شده می‌مانند ولی استفاده نمی‌شوند.)
// بدون دیتای دمو: فقط ایجنت‌های هسته (لازم برای AI) و پیکربندی ارائه‌دهنده‌ها seed می‌شوند.
export const collections = { agents, ai_providers, ai_models };
