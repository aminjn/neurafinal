// حسابِ دمو + دادهٔ دموی کامل برای تست (کاربر: demo / رمز: demo1234، نقشِ ادمین).
// دادهٔ کسب‌وکار با company='alpha' (scopeِ پیش‌فرضِ فرانت) و دادهٔ per-user برای همین حساب.
// idempotent: هر بار upsert می‌شود.
import bcrypt from 'bcryptjs';
import { query } from './db.js';

const CO = 'alpha';
const now = () => new Date().toISOString();

async function upsert(collection, id, company, data) {
  await query(
    `INSERT INTO documents (collection, id, company, data) VALUES ($1,$2,$3,$4::jsonb)
     ON CONFLICT (collection, id) DO UPDATE SET data=$4::jsonb, company=$3, updated_at=now()`,
    [collection, String(id), company, JSON.stringify({ ...data, id: data.id != null ? data.id : String(id) })]
  );
}

const BG = ['#7B62FC', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];
const initOf = (n) => (n || '?').trim().slice(0, 1);

const CUSTOMERS = [
  { id: 'dc1', name: 'شرکت آریا تجارت', contact: 'مهدی رضایی', phone: '09121110001', email: 'aria@corp.ir', status: 'active', value: '۴۵,۰۰۰,۰۰۰', lastContact: 'امروز', lastMsg: 'قرارداد را بررسی کردیم', lastTime: '۱۴:۲۰', unread: 2 },
  { id: 'dc2', name: 'بازرگانی پارس', contact: 'سارا احمدی', phone: '09121110002', email: 'pars@corp.ir', status: 'active', value: '۳۲,۵۰۰,۰۰۰', lastContact: 'دیروز', lastMsg: 'فاکتور را ارسال کنید', lastTime: '۱۱:۰۵', unread: 0 },
  { id: 'dc3', name: 'صنایع کیان', contact: 'علی محمدی', phone: '09121110003', email: 'kian@corp.ir', status: 'lead', value: '۱۸,۰۰۰,۰۰۰', lastContact: '۳ روز پیش', lastMsg: 'قیمت محصولات؟', lastTime: '۰۹:۳۰', unread: 1 },
  { id: 'dc4', name: 'فروشگاه مهر', contact: 'زهرا کریمی', phone: '09121110004', email: 'mehr@shop.ir', status: 'active', value: '۹,۲۰۰,۰۰۰', lastContact: 'هفته پیش', lastMsg: 'سفارش جدید ثبت شد', lastTime: 'دیروز', unread: 0 },
  { id: 'dc5', name: 'هلدینگ نوین', contact: 'رضا نوری', phone: '09121110005', email: 'novin@holding.ir', status: 'inactive', value: '۰', lastContact: '۱ ماه پیش', lastMsg: '—', lastTime: '—', unread: 0 },
].map((c, i) => ({ ...c, bg: BG[i % BG.length], init: initOf(c.contact),
  purchases: [23, 45, 8, 12, 0][i] ?? 5,
  totalSpent: [8750000, 15200000, 1800000, 3200000, 0][i] ?? 1000000,
  spent: [8750000, 15200000, 1800000, 3200000, 0][i] ?? 1000000,
  points: [875, 1520, 180, 320, 0][i] ?? 100,
  cashback: [175000, 320000, 36000, 64000, 0][i] ?? 20000,
  avgBasket: [380000, 520000, 225000, 267000, 0][i] ?? 200000,
  tier: ['طلایی', 'الماسی', 'برنزی', 'نقره‌ای', 'برنزی'][i] ?? 'برنزی',
  segment: ['loyal', 'vip', 'new', 'loyal', 'atrisk'][i] ?? 'regular',
  activity: ['active', 'active', 'inactive', 'active', 'risk'][i] ?? 'active',
  lastVisit: c.lastContact || '—',
  tags: [['ثابت', 'وفادار'], ['VIP', 'گروهی'], ['جدید'], ['ثابت'], ['غیرفعال']][i] ?? [],
  interests: [['قرمه‌سبزی', 'چلوکباب'], ['پیتزا', 'سالاد'], ['نوشابه'], ['دسر ویژه'], []][i] ?? [],
  channel: ['حضوری', 'آنلاین', 'تلفنی', 'حضوری', 'آنلاین'][i] ?? 'مستقیم',
  type: 'شخص', roi: [210, 340, 90, 150, 0][i] ?? 100, conv: [18, 24, 8, 12, 0][i] ?? 10,
  freq: 'هفتگی', icon: 'fa-solid fa-user',
}));

const PERSONNEL = [
  { id: 'dp1', name: 'حسین موسوی', role: 'مدیر فروش', status: 'online', voip: '1001', email: 'hossein@demo.ir', phone: '09122220001', permissions: ['sales', 'customers', 'reports'] },
  { id: 'dp2', name: 'نرگس حسینی', role: 'کارشناس CRM', status: 'online', voip: '1002', email: 'narges@demo.ir', phone: '09122220002', permissions: ['customers', 'crm'] },
  { id: 'dp3', name: 'امیر صادقی', role: 'حسابدار', status: 'offline', voip: '1003', email: 'amir@demo.ir', phone: '09122220003', permissions: ['finance', 'invoices'] },
  { id: 'dp4', name: 'مریم رحیمی', role: 'کارشناس تدارکات', status: 'online', voip: '1004', email: 'maryam@demo.ir', phone: '09122220004', permissions: ['procurement', 'inventory'] },
  { id: 'dp5', name: 'کاوه اکبری', role: 'پشتیبان', status: 'offline', voip: '1005', email: 'kaveh@demo.ir', phone: '09122220005', permissions: ['support'] },
].map((p, i) => ({ ...p, bg: BG[i % BG.length], init: initOf(p.name), lastMsg: 'در دسترس', lastTime: 'امروز', unread: 0, company: CO }));

const DEALS = [
  { id: 'dd1', title: 'قرارداد سالانه آریا', customer: 'شرکت آریا تجارت', value: '۴۵,۰۰۰,۰۰۰', stage: 'negotiation', probability: '۷۰٪' },
  { id: 'dd2', title: 'فروش عمده پارس', customer: 'بازرگانی پارس', value: '۳۲,۵۰۰,۰۰۰', stage: 'proposal', probability: '۵۰٪' },
  { id: 'dd3', title: 'پروژه کیان', customer: 'صنایع کیان', value: '۱۸,۰۰۰,۰۰۰', stage: 'negotiation', probability: '۴۰٪' },
  { id: 'dd4', title: 'سفارش فروشگاه مهر', customer: 'فروشگاه مهر', value: '۹,۲۰۰,۰۰۰', stage: 'closed', probability: '۱۰۰٪' },
  { id: 'dd5', title: 'تفاهم‌نامه نوین', customer: 'هلدینگ نوین', value: '۶۰,۰۰۰,۰۰۰', stage: 'proposal', probability: '۳۰٪' },
];

const ORDERS = [
  { id: 'do1', num: '۱۰۴۱', status: 'delivered', desc: 'سفارش شرکت آریا — ۳ قلم', date: 'امروز', price: '۴,۵۰۰,۰۰۰', agentId: 'assistant' },
  { id: 'do2', num: '۱۰۴۲', status: 'preparing', desc: 'سفارش بازرگانی پارس', date: 'دیروز', price: '۲,۱۵۰,۰۰۰', agentId: 'assistant' },
  { id: 'do3', num: '۱۰۴۳', status: 'pending', desc: 'سفارش صنایع کیان', date: '۲ روز پیش', price: '۱,۸۰۰,۰۰۰', agentId: 'assistant' },
  { id: 'do4', num: '۱۰۴۴', status: 'delivered', desc: 'سفارش فروشگاه مهر', date: 'هفته پیش', price: '۹۲۰,۰۰۰', agentId: 'assistant' },
  { id: 'do5', num: '۱۰۴۵', status: 'cancelled', desc: 'سفارش لغوشده هلدینگ نوین', date: '۱۰ روز پیش', price: '۳,۲۰۰,۰۰۰', agentId: 'assistant' },
];

const INVOICES = [
  { id: 'di1', number: 'INV-1405', type: 'sales', customer: 'شرکت آریا تجارت', customerPhone: '09121110001', issueDate: '۴ اسفند ۱۴۰۴', dueDate: '۱۴ اسفند ۱۴۰۴', lines: [{ name: 'خدمات مشاوره', qty: 1, unitPrice: 4500000 }], taxPct: 9, discount: 0, status: 'paid' },
  { id: 'di2', number: 'INV-1406', type: 'sales', customer: 'بازرگانی پارس', customerPhone: '09121110002', issueDate: '۲ اسفند ۱۴۰۴', dueDate: '۱۲ اسفند ۱۴۰۴', lines: [{ name: 'فروش کالا', qty: 5, unitPrice: 430000 }], taxPct: 9, discount: 100000, status: 'pending' },
  { id: 'di3', number: 'PUR-0312', type: 'purchase', customer: 'شرکت آلفا تأمین', issueDate: '۱ اسفند ۱۴۰۴', dueDate: '۱۱ اسفند ۱۴۰۴', lines: [{ name: 'مواد اولیه', qty: 10, unitPrice: 250000 }], taxPct: 9, discount: 0, status: 'overdue' },
  { id: 'di4', number: 'INV-1407', type: 'sales', customer: 'فروشگاه مهر', issueDate: '۲۸ بهمن ۱۴۰۴', dueDate: '۸ اسفند ۱۴۰۴', lines: [{ name: 'اشتراک ماهانه', qty: 1, unitPrice: 920000 }], taxPct: 0, discount: 0, status: 'draft' },
];

const TASKS = [
  { id: 'dt1', title: 'پیگیری قرارداد آریا', description: 'تماس با مهدی رضایی و نهایی‌سازی', status: 'inProgress', priority: 'high', assignee: 'حسین موسوی', dueDate: 'امروز', createdAt: now() },
  { id: 'dt2', title: 'ارسال فاکتور پارس', description: 'صدور و ارسال INV-1406', status: 'todo', priority: 'medium', assignee: 'امیر صادقی', dueDate: 'فردا', createdAt: now() },
  { id: 'dt3', title: 'تأمین موجودی انبار', description: 'ثبت درخواست خرید مواد اولیه', status: 'todo', priority: 'high', assignee: 'مریم رحیمی', dueDate: '۲ روز دیگر', createdAt: now() },
  { id: 'dt4', title: 'گزارش فروش هفتگی', description: 'تهیه گزارش عملکرد', status: 'done', priority: 'low', assignee: 'حسین موسوی', dueDate: 'دیروز', createdAt: now() },
  { id: 'dt5', title: 'پاسخ به تیکت‌های پشتیبانی', description: '۳ تیکت باز', status: 'inProgress', priority: 'medium', assignee: 'کاوه اکبری', dueDate: 'امروز', createdAt: now() },
];

const PRODUCTS = [
  { id: 'dpr1', name: 'قرمه‌سبزی', price: 145000, priceNum: 145000, category: 'غذای اصلی', icon: 'fa-solid fa-bowl-rice', color: '#10B981' },
  { id: 'dpr2', name: 'چلوکباب', price: 185000, priceNum: 185000, category: 'غذای اصلی', icon: 'fa-solid fa-drumstick-bite', color: '#7B62FC' },
  { id: 'dpr3', name: 'پیتزا مخصوص', price: 220000, priceNum: 220000, category: 'فست‌فود', icon: 'fa-solid fa-pizza-slice', color: '#EF4444' },
  { id: 'dpr4', name: 'نوشابه', price: 25000, priceNum: 25000, category: 'نوشیدنی', icon: 'fa-solid fa-bottle-water', color: '#3B82F6' },
  { id: 'dpr5', name: 'سالاد فصل', price: 65000, priceNum: 65000, category: 'پیش‌غذا', icon: 'fa-solid fa-leaf', color: '#22C55E' },
  { id: 'dpr6', name: 'دسر ویژه', price: 55000, priceNum: 55000, category: 'دسر', icon: 'fa-solid fa-ice-cream', color: '#F59E0B' },
].map((p, i) => ({ ...p, stock: [45, 32, 18, 60, 25, 4][i] ?? 20, unit: 'عدد', img: ['🍲', '🍖', '🍕', '🥤', '🥗', '🍨'][i] || '📦', discount: [0, 0, 10, 0, 5, 15][i] ?? 0 }));

const PURCHASE_REQUESTS = [
  { id: 'dq1', title: 'خرید مواد اولیه', item: 'آرد و روغن', qty: '۲۰۰ کیلو', supplier: 'شرکت آلفا تأمین', status: 'pending', date: 'امروز' },
  { id: 'dq2', title: 'تجهیزات آشپزخانه', item: 'فر صنعتی', qty: '۱ دستگاه', supplier: 'صنایع بتا', status: 'approved', date: 'دیروز' },
  { id: 'dq3', title: 'بسته‌بندی', item: 'ظرف یکبارمصرف', qty: '۵۰۰۰ عدد', supplier: 'پخش دلتا', status: 'pending', date: '۳ روز پیش' },
];

const NOTIFS = [
  { id: 'sn1', title: 'کمپین جدید آماده بررسی', desc: 'عامل بازاریابی کمپین جدیدی ایجاد کرده است.', time: '۵ دقیقه پیش', icon: 'fa-solid fa-bullhorn', iconBg: 'aw-bg-blue', type: 'chat', target: 'marketing', cta: 'مشاهده', category: 'agents' },
  { id: 'sn2', title: 'فاکتور معوق', desc: 'فاکتور INV-1402 هنوز پرداخت نشده.', time: '۱ ساعت پیش', icon: 'fa-solid fa-file-invoice-dollar', iconBg: 'aw-bg-orange', type: 'finance', target: 'pending', cta: 'مشاهده مالی', category: 'finance' },
  { id: 'sn3', title: 'سرنخ جدید در CRM', desc: 'کافه لوتوس به‌عنوان سرنخ جدید ثبت شد.', time: '۲ ساعت پیش', icon: 'fa-solid fa-user-plus', iconBg: 'aw-bg-green', type: 'crm', target: 'leads', cta: 'مشاهده CRM', category: 'crm' },
  { id: 'sn4', title: 'موجودی کم', desc: 'کارتریج پرینتر HP زیر حد مجاز است.', time: 'دیروز', icon: 'fa-solid fa-box', iconBg: 'aw-bg-orange', type: 'system', target: '', cta: 'انبار', category: 'system' },
];

const INVENTORY = [
  { id: 'sinv1', name: 'کاغذ A4 (بسته ۵۰۰ برگی)', category: 'لوازم اداری', quantity: 45, unit: 'بسته', minStock: 20, price: '۲۸۰,۰۰۰', location: 'انبار اصلی', lastUpdated: 'امروز', status: 'sufficient', urgentQueue: 0, urgencyFactor: 1 },
  { id: 'sinv2', name: 'کارتریج پرینتر HP', category: 'لوازم IT', quantity: 3, unit: 'عدد', minStock: 5, price: '۱,۸۰۰,۰۰۰', location: 'انبار IT', lastUpdated: 'دیروز', status: 'low', urgentQueue: 4, urgencyFactor: 6 },
  { id: 'sinv3', name: 'روغن موتور صنعتی', category: 'مواد مصرفی', quantity: 12, unit: 'لیتر', minStock: 50, price: '۴۵۰,۰۰۰', location: 'انبار فنی', lastUpdated: '۳ روز پیش', status: 'critical', urgentQueue: 9, urgencyFactor: 9 },
  { id: 'sinv4', name: 'جعبه بسته‌بندی', category: 'بسته‌بندی', quantity: 320, unit: 'عدد', minStock: 100, price: '۱۵,۰۰۰', location: 'انبار اصلی', lastUpdated: 'امروز', status: 'sufficient', urgentQueue: 0, urgencyFactor: 1 },
];

const SALES_ORDERS = [
  { id: 'sord1', source: 'sales', customer: 'علی رضایی', table: 'میز ۴', items: 3, total: 285000, time: 'اخیر', status: 'active', payment: 'pending', note: 'بدون پیاز' },
  { id: 'sord2', source: 'sales', customer: 'سارا محمدی', table: 'بیرون‌بر', items: 2, total: 165000, time: 'اخیر', status: 'completed', payment: 'paid' },
];
// شکلِ کامل: هم فیلدهای صفحهٔ فروش (source/amount/method/items) و هم فیلدهای صفحهٔ فاکتورِ ادمین
// (number/type/issueDate/dueDate/lines/taxPct/customerPhone) تا هر دو صفحه واقعی رندر شوند.
const SALES_INVOICES = [
  { id: 'INV-1401', number: 'INV-1401', type: 'sales', source: 'sales', customer: 'علی رضایی', phone: '09121110001', customerPhone: '09121110001', amount: 685000, discount: 35000, tax: 61500, taxPct: 9, status: 'paid', date: 'امروز', issueDate: '۵ اسفند ۱۴۰۴', dueDate: '۱۵ اسفند ۱۴۰۴', items: 3, method: 'کارت', lines: [{ name: 'کباب کوبیده', qty: 2, unitPrice: 185000 }, { name: 'نوشابه', qty: 3, unitPrice: 105000 }] },
  { id: 'INV-1402', number: 'INV-1402', type: 'sales', source: 'sales', customer: 'سارا محمدی', phone: '09121110002', customerPhone: '09121110002', amount: 1250000, discount: 125000, tax: 112500, taxPct: 9, status: 'pending', date: 'امروز', issueDate: '۵ اسفند ۱۴۰۴', dueDate: '۲۰ اسفند ۱۴۰۴', items: 5, method: 'نقد', lines: [{ name: 'چلوکباب سلطانی', qty: 3, unitPrice: 285000 }, { name: 'جوجه‌کباب', qty: 2, unitPrice: 197500 }] },
];

const PURCHASE_ORDERS = [
  { id: 'do1', number: 'PO-۱۴۰۳۰۱', supplier: 'شرکت آلفا تأمین', item: 'آرد و روغن', qty: '۲۰۰ کیلو', total: '۴۸,۰۰۰,۰۰۰', status: 'confirmed', date: 'امروز' },
  { id: 'do2', number: 'PO-۱۴۰۳۰۲', supplier: 'صنایع بتا', item: 'فر صنعتی', qty: '۱ دستگاه', total: '۱۲۰,۰۰۰,۰۰۰', status: 'pending', date: 'دیروز' },
];

const DELIVERIES = [
  { id: 'dd1', order: 'PO-۱۴۰۳۰۱', supplier: 'شرکت آلفا تأمین', item: 'آرد و روغن', status: 'intransit', eta: 'فردا', tracking: 'NP-۸۸۴۲' },
  { id: 'dd2', order: 'PO-۱۴۰۳۰۲', supplier: 'صنایع بتا', item: 'فر صنعتی', status: 'delivered', eta: 'دیروز', tracking: 'NP-۸۸۱۰' },
];

// شکلِ کاملِ ProcFinanceItem که FinDetail می‌خواند (invoiceCode/totalAmount/paidAmount/remainingAmount/orderCode/dueDate)
const PURCHASE_INVOICES = [
  { id: 'pfin1', invoiceCode: 'INV-۵۰۲۱', number: 'INV-۵۰۲۱', supplier: 'شرکت آلفا تأمین', totalAmount: '۱۲۰,۰۰۰,۰۰۰', amount: '۱۲۰,۰۰۰,۰۰۰', paidAmount: '۶۰,۰۰۰,۰۰۰', remainingAmount: '۶۰,۰۰۰,۰۰۰', status: 'pending', dueDate: '۱۴۰۴/۱۲/۲۰', date: '۱۴۰۴/۱۲/۲۰', orderCode: 'PO-۲۰۴۵' },
  { id: 'pfin2', invoiceCode: 'INV-۵۰۲۰', number: 'INV-۵۰۲۰', supplier: 'پخش دلتا', totalAmount: '۶۵,۰۰۰,۰۰۰', amount: '۶۵,۰۰۰,۰۰۰', paidAmount: '۶۵,۰۰۰,۰۰۰', remainingAmount: '۰', status: 'paid', dueDate: '۱۴۰۴/۱۲/۰۵', date: '۱۴۰۴/۱۲/۰۵', orderCode: 'PO-۲۰۴۲' },
  { id: 'pfin3', invoiceCode: 'INV-۵۰۱۹', number: 'INV-۵۰۱۹', supplier: 'صنایع بتا', totalAmount: '۴۵,۰۰۰,۰۰۰', amount: '۴۵,۰۰۰,۰۰۰', paidAmount: '۰', remainingAmount: '۴۵,۰۰۰,۰۰۰', status: 'debt', dueDate: '۱۴۰۴/۱۱/۲۸', date: '۱۴۰۴/۱۱/۲۸', orderCode: 'PO-۲۰۴۴' },
  { id: 'pfin4', invoiceCode: 'INV-۵۰۱۸', number: 'INV-۵۰۱۸', supplier: 'تأمین‌کار اتا', totalAmount: '۳۲,۰۰۰,۰۰۰', amount: '۳۲,۰۰۰,۰۰۰', paidAmount: '۳۲,۰۰۰,۰۰۰', remainingAmount: '۰', status: 'paid', dueDate: '۱۴۰۴/۱۱/۲۵', date: '۱۴۰۴/۱۱/۲۵', orderCode: 'PO-۲۰۳۹' },
  { id: 'pfin5', invoiceCode: 'INV-۵۰۱۷', number: 'INV-۵۰۱۷', supplier: 'واردات زتا', totalAmount: '۸۵,۰۰۰,۰۰۰', amount: '۸۵,۰۰۰,۰۰۰', paidAmount: '۲۵,۰۰۰,۰۰۰', remainingAmount: '۶۰,۰۰۰,۰۰۰', status: 'debt', dueDate: '۱۴۰۴/۱۲/۱۰', date: '۱۴۰۴/۱۲/۱۰', orderCode: 'PO-۲۰۴۰' },
];

const MEETINGS = [
  { id: 'dm1', title: 'جلسهٔ فروش هفتگی', date: 'امروز ۱۰:۰۰', attendees: ['حسین موسوی', 'نرگس حسینی'], status: 'scheduled', notes: 'بررسی اهداف فروش' },
  { id: 'dm2', title: 'مذاکره با آریا تجارت', date: 'فردا ۱۴:۳۰', attendees: ['مهدی رضایی'], status: 'scheduled', notes: 'نهایی‌سازی قرارداد' },
  { id: 'dm3', title: 'جلسهٔ تدارکات', date: 'دیروز ۰۹:۰۰', attendees: ['مریم رحیمی'], status: 'done', notes: 'تأیید سفارش‌های خرید' },
];

const LEADS = [
  { id: 'dl1', name: 'کافه رستوران لوتوس', source: 'اینستاگرام', status: 'new', phone: '09123330001', value: '۱۲,۰۰۰,۰۰۰' },
  { id: 'dl2', name: 'فست‌فود سیب', source: 'وب‌سایت', status: 'contacted', phone: '09123330002', value: '۸,۵۰۰,۰۰۰' },
  { id: 'dl3', name: 'قنادی شیرین', source: 'معرفی', status: 'qualified', phone: '09123330003', value: '۵,۲۰۰,۰۰۰' },
  { id: 'dl4', name: 'سفره‌خانه سنتی', source: 'تبلیغات', status: 'new', phone: '09123330004', value: '۲۰,۰۰۰,۰۰۰' },
];

// دادهٔ کاملِ کمپین‌ها (همهٔ فیلدهایی که UI می‌خواند: spent/conversions/cpa/revenue/roi/startDate/…)
const CAMPAIGNS = [
  { id: 'c1', name: 'کمپین بهاره ۱۴۰۵', type: 'social', status: 'active', goal: 'جذب لید', segment: 'فریلنسرها', budget: '۵۰,۰۰۰,۰۰۰', spent: '۳۲,۵۰۰,۰۰۰', startDate: '۱۴۰۵/۰۱/۰۱', endDate: '۱۴۰۵/۰۱/۳۱', reach: '۱۲۵,۰۰۰', clicks: '۸,۷۴۰', conversions: '۳۴۲', cpa: '۹۵,۰۰۰', revenue: '۲۱۰,۰۰۰,۰۰۰', roi: '+۳۲۰٪', channel: 'اینستاگرام', owner: 'تیم بازاریابی' },
  { id: 'c2', name: 'ایمیل معرفی محصول جدید', type: 'email', status: 'active', goal: 'معرفی محصول', segment: 'شرکت‌های متوسط', budget: '۱۵,۰۰۰,۰۰۰', spent: '۱۲,۸۰۰,۰۰۰', startDate: '۱۴۰۴/۱۲/۱۵', endDate: '۱۴۰۵/۰۱/۱۵', reach: '۴۵,۰۰۰', clicks: '۵,۴۰۰', conversions: '۱۸۷', cpa: '۶۸,۰۰۰', revenue: '۹۵,۰۰۰,۰۰۰', roi: '+۲۱۰٪', channel: 'ایمیل', owner: 'عامل هوشمند' },
  { id: 'c3', name: 'تبلیغات گوگل ادز', type: 'ads', status: 'paused', goal: 'افزایش بازدید', segment: 'سازمان‌های بزرگ', budget: '۸۰,۰۰۰,۰۰۰', spent: '۴۵,۲۰۰,۰۰۰', startDate: '۱۴۰۴/۱۱/۰۱', endDate: '۱۴۰۵/۰۲/۳۱', reach: '۲۵۰,۰۰۰', clicks: '۱۸,۶۰۰', conversions: '۵۲۰', cpa: '۸۷,۰۰۰', revenue: '۱۸۰,۰۰۰,۰۰۰', roi: '+۱۸۰٪', channel: 'گوگل', owner: 'تیم بازاریابی' },
  { id: 'c4', name: 'کمپین پیامکی جشنواره', type: 'sms', status: 'completed', goal: 'فروش', segment: 'کسب‌وکارهای کوچک', budget: '۱۰,۰۰۰,۰۰۰', spent: '۱۰,۰۰۰,۰۰۰', startDate: '۱۴۰۴/۱۱/۲۰', endDate: '۱۴۰۴/۱۱/۳۰', reach: '۸۰,۰۰۰', clicks: '۴,۲۰۰', conversions: '۲۸۰', cpa: '۳۶,۰۰۰', revenue: '۱۲۰,۰۰۰,۰۰۰', roi: '+۴۲۰٪', channel: 'پیامک', owner: 'عامل هوشمند' },
  { id: 'c5', name: 'بلاگ و محتوای آموزشی', type: 'content', status: 'active', goal: 'جذب لید', segment: 'کسب‌وکارهای کوچک', budget: '۲۰,۰۰۰,۰۰۰', spent: '۸,۵۰۰,۰۰۰', startDate: '۱۴۰۴/۱۰/۰۱', endDate: '۱۴۰۵/۰۳/۳۱', reach: '۹۵,۰۰۰', clicks: '۱۲,۳۰۰', conversions: '۴۱۰', cpa: '۲۱,۰۰۰', revenue: '۱۶۰,۰۰۰,۰۰۰', roi: '+۵۸۰٪', channel: 'وبسایت', owner: 'تیم بازاریابی' },
  { id: 'c6', name: 'کمپین تلگرام عید نوروز', type: 'social', status: 'draft', goal: 'جذب لید', segment: 'فریلنسرها', budget: '۳۰,۰۰۰,۰۰۰', spent: '۰', startDate: '۱۴۰۵/۰۱/۰۱', endDate: '۱۴۰۵/۰۱/۱۳', reach: '—', clicks: '—', conversions: '—', cpa: '—', revenue: '—', roi: '—', channel: 'تلگرام', owner: 'تیم بازاریابی' },
];

// حذفِ ردیف‌های دموِ قدیمی/orphan که idشان عوض شده (مثلاً dcamp1 → c1) تا صفحه‌ی جزئیات
// دیگر رویِ دادهٔ ناقصِ قدیمی باز نشود و undefined نشان ندهد.
async function prune(collection, keepIds) {
  await query(`DELETE FROM documents WHERE collection=$1 AND company=$2 AND NOT (id = ANY($3::text[]))`,
    [collection, CO, keepIds.map(String)]);
}

async function seedBusiness() {
  // پاک‌سازیِ دادهٔ دموِ قدیمیِ کالکشن‌هایی که شکل/idشان کامل شده
  await prune('campaigns', CAMPAIGNS.map((c) => c.id));
  await prune('purchase_invoices', PURCHASE_INVOICES.map((x) => x.id));
  await prune('invoices', [...INVOICES, ...SALES_INVOICES].map((x) => x.id));
  for (const c of CUSTOMERS) await upsert('customers', c.id, CO, c);
  for (const p of PERSONNEL) await upsert('personnel', p.id, CO, p);
  for (const d of DEALS) await upsert('deals', d.id, CO, d);
  for (const o of ORDERS) await upsert('orders', o.id, CO, o);
  for (const inv of INVOICES) await upsert('invoices', inv.id, CO, inv);
  for (const t of TASKS) await upsert('tasks', t.id, CO, t);
  for (const pr of PRODUCTS) await upsert('products', pr.id, CO, pr);
  for (const q of PURCHASE_REQUESTS) await upsert('purchase_requests', q.id, CO, q);
  for (const o of PURCHASE_ORDERS) await upsert('purchase_orders', o.id, CO, o);
  for (const d of DELIVERIES) await upsert('deliveries', d.id, CO, d);
  for (const iv of PURCHASE_INVOICES) await upsert('purchase_invoices', iv.id, CO, iv);
  for (const o of SALES_ORDERS) await upsert('orders', o.id, CO, o);
  for (const iv of SALES_INVOICES) await upsert('invoices', iv.id, CO, iv);
  for (const it of INVENTORY) await upsert('inventory', it.id, CO, it);
  for (const nf of NOTIFS) await upsert('notifications', nf.id, CO, nf);
  for (const m of MEETINGS) await upsert('meetings', m.id, CO, m);
  for (const l of LEADS) await upsert('leads', l.id, CO, l);
  for (const c of CAMPAIGNS) await upsert('campaigns', c.id, CO, c);
}

export async function seedDemo() {
  const hash = await bcrypt.hash('demo1234', 10);
  const agents = (await query("SELECT id FROM documents WHERE collection='agents'")).rows.map((r) => String(r.id));
  const meta = {
    phone: '989120000000',
    nationalId: '0000000000',
    identity: { firstName: 'کاربر', lastName: 'دمو', fatherName: 'تست', gender: 'male' },
    identityVerifiedAt: now(),
    wallet: {
      balance: 8500000,
      cashback: 245000,
      tx: [
        { id: 'wt1', type: 'deposit', title: 'شارژ کیف پول', date: 'امروز', amount: 5000000 },
        { id: 'wt2', type: 'purchase', title: 'خرید اشتراک Neura Pro', date: 'دیروز', amount: -149000 },
        { id: 'wt3', type: 'cashback', title: 'کش‌بک خرید', date: '۲ روز پیش', amount: 18500 },
      ],
    },
    subscription: { plan: 'Neura Pro', planId: 'pro', price: 149000, months: 1, startedAt: now(), expiresAt: new Date(Date.now() + 30 * 864e5).toISOString(), autoRenew: true },
    ownedAgents: agents.length ? agents : ['assistant'],
    prefs: { lang: 'fa', notifOn: true, theme: 'light' },
  };

  const existing = (await query('SELECT id FROM app_users WHERE username = $1', ['demo'])).rows[0];
  let uid;
  if (existing) {
    uid = existing.id;
    await query("UPDATE app_users SET password_hash=$2, name=$3, role='admin', company=$4, status='active', meta=$5::jsonb, updated_at=now() WHERE id=$1",
      [uid, hash, 'کاربر دمو', CO, JSON.stringify(meta)]);
  } else {
    uid = (await query("INSERT INTO app_users (username,password_hash,name,role,company,status,meta) VALUES ($1,$2,$3,'admin',$4,'active',$5::jsonb) RETURNING id",
      ['demo', hash, 'کاربر دمو', CO, JSON.stringify(meta)])).rows[0].id;
  }

  await seedBusiness();

  // دادهٔ per-user (منشیِ شخصی + دستیار + روش پرداخت) برای همین حساب
  const uco = 'user:' + uid;
  const udoc = async (coll, cid, data) => upsert('u_' + coll, uid + '__' + cid, uco, data);
  await udoc('sec_tasks', 'st1', { id: 'st1', title: 'تماس با مشتری آریا', done: false, priority: 'high' });
  await udoc('sec_tasks', 'st2', { id: 'st2', title: 'تنظیم جلسهٔ هفتگی', done: true, priority: 'medium' });
  await udoc('sec_contacts', 'sc1', { id: 'sc1', name: 'مهدی رضایی', phone: '09121110001', company: 'آریا تجارت' });
  await udoc('sec_contacts', 'sc2', { id: 'sc2', name: 'سارا احمدی', phone: '09121110002', company: 'بازرگانی پارس' });
  await udoc('sec_meetings', 'sm1', { id: 'sm1', title: 'جلسهٔ فروش', date: 'امروز ۱۰:۰۰' });
  const SEC_FOLLOWUPS = [
    { id: 1, title: 'تماس پیگیری مشتری', contact: 'احمد رضایی', company: 'شرکت آلفا', assignee: 'سارا احمدی', due: '۲ ساعت گذشته', status: 'overdue', type: 'call', state: 'در انتظار تماس' },
    { id: 2, title: 'پیگیری فاکتور ارسالی', contact: 'زهرا محمدی', company: 'شرکت دلتا', assignee: 'رضا حسینی', due: 'دیروز', status: 'overdue', type: 'invoice', state: 'بدون پاسخ' },
    { id: 3, title: 'پاسخ به درخواست مشتری', contact: 'علی نوری', company: 'صنایع اپسیلون', assignee: 'مریم کریمی', due: '۳ ساعت گذشته', status: 'overdue', type: 'email', state: 'منتظر پاسخ' },
    { id: 4, title: 'ارسال پیش‌فاکتور', contact: 'فاطمه حسینی', company: 'فروشگاه بتا', assignee: 'سارا احمدی', due: 'دیروز', status: 'overdue', type: 'invoice', state: 'آماده ارسال' },
    { id: 5, title: 'تماس مجدد با سرنخ', contact: 'حسین امینی', company: 'شرکت زتا', assignee: 'نرگس رضایی', due: '۴ ساعت گذشته', status: 'overdue', type: 'call', state: 'تماس ناموفق قبلی' },
    { id: 6, title: 'ارسال قیمت', contact: 'مریم صادقی', company: 'فروشگاه اتا', assignee: 'رضا حسینی', due: 'فردا ۱۰:۰۰', status: 'upcoming', type: 'email', state: 'در حال آماده‌سازی' },
    { id: 7, title: 'جلسه حضوری', contact: 'محمد کریمی', company: 'مؤسسه گاما', assignee: 'علی محمدی', due: 'چهارشنبه ۱۴:۰۰', status: 'upcoming', type: 'meeting', state: 'تأیید شده' },
    { id: 8, title: 'ارسال نمونه محصول', contact: 'علی نوری', company: 'صنایع اپسیلون', assignee: 'مریم کریمی', due: 'پنج‌شنبه', status: 'upcoming', type: 'task', state: 'برنامه‌ریزی شده' },
    { id: 9, title: 'تماس مجدد', contact: 'سارا کاظمی', company: 'گروه یوتا', assignee: 'نرگس رضایی', due: 'جمعه ۱۱:۰۰', status: 'upcoming', type: 'call', state: 'موعد مقرر' },
    { id: 10, title: 'پیگیری نتیجه جلسه', contact: 'رضا بهرامی', company: 'مجموعه تتا', assignee: 'علی محمدی', due: 'شنبه ۰۹:۰۰', status: 'upcoming', type: 'meeting', state: 'پس از جلسه' },
  ];
  for (const f of SEC_FOLLOWUPS) await udoc('sec_followups', 'sf' + f.id, f);
  const SEC_REFERRALS = [
    { id: 1, type: 'invoice', title: 'صدور فاکتور رسمی برای شرکت آلفا', desc: 'سفارش RC-۱۰۲۳ نیاز به فاکتور رسمی دارد', date: 'امروز ۱۱:۴۰', status: 'pending' },
    { id: 2, type: 'discrepancy', title: 'مغایرت در واریزی فروشگاه بتا', desc: 'مبلغ واریزی با پیش‌فاکتور ۲۰۰هزار اختلاف دارد', date: 'امروز ۱۰:۰۵', status: 'pending' },
    { id: 3, type: 'debt', title: 'بررسی بدهی معوق مؤسسه گاما', desc: 'فاکتور بهمن‌ماه هنوز تسویه نشده', date: 'دیروز', status: 'in_progress' },
    { id: 4, type: 'correction', title: 'اصلاح سند هزینه تعمیر پرینتر', desc: 'دسته‌بندی نادرست ثبت شده است', date: 'دیروز', status: 'pending' },
    { id: 5, type: 'report', title: 'درخواست گزارش دریافتی هفتگی', desc: 'برای جلسه مدیریت روز شنبه', date: '۲ روز پیش', status: 'done' },
  ];
  for (const r of SEC_REFERRALS) await udoc('sec_referrals', 'sr' + r.id, r);
  await udoc('tasks', 't1', { id: 't1', title: 'مرور برنامهٔ امروز', done: false });
  await udoc('tasks', 't2', { id: 't2', title: 'خرید هفتگی', done: false });
  await udoc('calendar', 'e1', { id: 'e1', title: 'قرار ملاقات دندانپزشکی', date: 'فردا ۱۶:۰۰' });
  await udoc('notes', 'n1', { id: 'n1', title: 'ایده‌های پروژه', preview: 'فاز ۱: تحلیل / فاز ۲: طراحی', tag: 'کاری' });
  await udoc('payment_methods', 'pm1', { id: 'pm1', type: 'card', label: 'بانک ملی', last4: '4278', isDefault: true });

  console.log(`✓ demo account ready (username: demo / password: demo1234, role admin, ${CUSTOMERS.length} customers, ${PERSONNEL.length} personnel, ${agents.length} agents owned)`);
}
