// ========================
// TYPES
// ========================
export interface Agent {
  id: string;
  name: string;
  role: string;
  gender: string;
  bg: string;
  init: string;
  locked: boolean;
  instructions: string;
  lastMsg: string;
  lastTime: string;
  unread: number;
  done: number;
  pending: number;
  voip: string;
  company: string;
  avatar?: string;
  tone?: string;
  voice?: string;
  age?: string;
  lang?: string;
  welcomeMsg?: string;
  team?: string;
  accent?: string;
}

export interface Personnel {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'offline';
  bg: string;
  init: string;
  lastMsg: string;
  lastTime: string;
  unread: number;
  voip: string;
  email?: string;
  phone?: string;
  permissions?: string[];
}

export const PERSONNEL_PERMISSIONS: { id: string; label: string; icon: string; color: string }[] = [
  { id: 'dashboard', label: 'داشبورد و گزارش‌ها', icon: 'fa-solid fa-chart-line', color: '#3B82F6' },
  { id: 'crm', label: 'مدیریت مشتریان (CRM)', icon: 'fa-solid fa-users', color: '#EC4899' },
  { id: 'finance', label: 'مالی و حسابداری', icon: 'fa-solid fa-sack-dollar', color: '#10B981' },
  { id: 'agents', label: 'تنظیمات عامل‌های هوشمند', icon: 'fa-solid fa-robot', color: '#8B5CF6' },
  { id: 'orders', label: 'سفارشات و فاکتورها', icon: 'fa-solid fa-file-invoice', color: '#F59E0B' },
  { id: 'tasks', label: 'وظایف و پروژه‌ها', icon: 'fa-solid fa-list-check', color: '#06B6D4' },
  { id: 'marketing', label: 'بازاریابی و کمپین‌ها', icon: 'fa-solid fa-bullhorn', color: '#EF4444' },
  { id: 'personnel', label: 'مدیریت پرسنل', icon: 'fa-solid fa-user-tie', color: '#7E5FAA' },
  { id: 'settings', label: 'تنظیمات سیستم', icon: 'fa-solid fa-gear', color: '#6B7280' },
];

export interface Customer {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  status: 'active' | 'lead' | 'inactive';
  value: string;
  lastContact: string;
  bg: string;
  init: string;
  lastMsg: string;
  lastTime: string;
  unread: number;
}

export interface Deal {
  id: string;
  title: string;
  customer: string;
  value: string;
  stage: 'negotiation' | 'proposal' | 'closed';
  probability: string;
}

export interface FinanceItem {
  id: string;
  desc: string;
  amount: string;
  date: string;
  status: 'paid' | 'pending';
  category: string;
}

export interface InvoiceLine {
  desc: string;
  qty: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  number: string;        // e.g. INV-1405
  type: 'sales' | 'purchase';   // فروش / خرید
  customer: string;
  customerPhone?: string;
  issueDate: string;     // Persian date string
  dueDate: string;
  lines: InvoiceLine[];
  taxPct: number;        // %
  discount: number;      // rial
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  note?: string;
}

export interface Notification {
  id: string;
  title: string;
  desc: string;
  time: string;
  icon: string;
  iconBg: string;
  type: string;
  target: string;
  cta: string;
}

export interface Message {
  id: number;
  text: string;
  sent: boolean;
  time: string;
}

export interface Topic {
  id: number;
  title: string;
  date: string;
  messages: Message[];
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  company?: string;
  avatar: string;
  avatarImage?: string;
  status: string;
  bio: string;
  username: string;
  verified: boolean;
}

export interface Order {
  id: string;
  num: string;
  status: 'delivered' | 'preparing' | 'cancelled' | 'pending';
  desc: string;
  date: string;
  price: string;
  agentId: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'inProgress' | 'done';
  priority: 'high' | 'medium' | 'low';
  assignee: string;
  dueDate: string;
  createdAt: string;
}

// ========================
// HELPERS
// ========================
export const toFa = (n: number | string): string =>
  String(n).replace(/\d/g, (d) => '\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9'[parseInt(d)]);

export const nowTime = (): string => {
  const d = new Date();
  return toFa(String(d.getHours()).padStart(2, '0')) + ':' + toFa(String(d.getMinutes()).padStart(2, '0'));
};

// ========================
// DATA
// ========================
export const COMPANIES: Record<string, { name: string; type: string }> = {
  alpha: { name: 'شرکت آلفا تجارت', type: 'تولیدی' },
  beta: { name: 'گروه صنعتی بتا', type: 'صنعتی' },
  gamma: { name: 'فناوری گاما', type: 'فناوری' },
  delta: { name: 'بازرگانی دلتا', type: 'بازرگانی' },
};

export const INITIAL_AGENTS: Agent[] = [
  { id: 'marketing', name: 'مریم فتحی', role: 'عامل بازاریابی', gender: 'f', bg: 'aw-bg-blue', init: 'م', locked: false, instructions: 'تمرکز بر بازاریابی دیجیتال و تحلیل رقبا. کمپین‌های ایمیل و شبکه‌های اجتماعی را مدیریت کن.', lastMsg: 'کمپین جدید آماده بررسی است...', lastTime: '۱۰:۳۲', unread: 3, done: 32, pending: 5, voip: '۱۰۱', company: 'alpha' },
  { id: 'sales', name: 'علی رضایی', role: 'عامل فروش', gender: 'm', bg: 'aw-bg-green', init: 'ع', locked: false, instructions: 'مدیریت فرآیند فروش، پیگیری سرنخ‌ها و صدور فاکتور. تمرکز بر تبدیل سرنخ به مشتری.', lastMsg: '۲ فاکتور جدید صادر شد...', lastTime: '۰۹:۱۵', unread: 2, done: 48, pending: 8, voip: '۱۰۲', company: 'alpha' },
  { id: 'finance', name: 'علی ناصری', role: 'عامل مالی و اداری', gender: 'm', bg: 'aw-bg-purple', init: 'ع', locked: false, instructions: 'مدیریت مالی و حسابداری شامل دریافت و پرداخت، صورت‌حساب و گزارش‌های مالی.', lastMsg: 'گزارش مالی ماهانه آماده شد', lastTime: 'دیروز', unread: 0, done: 21, pending: 3, voip: '۱۰۳', company: 'alpha' },
  { id: 'secretary', name: 'نرگس محمدی', role: 'عامل منشی', gender: 'f', bg: 'aw-bg-pink', init: 'ن', locked: false, instructions: 'مدیریت تقویم و جلسات. یادآوری قرارها و هماهنگی جلسات.', lastMsg: 'جلسه فردا ساعت ۱۰ تنظیم شد', lastTime: 'دیروز', unread: 0, done: 15, pending: 2, voip: '۱۰۴', company: 'alpha' },
  { id: 'procurement', name: 'رضا امینی', role: 'عامل تدارکات', gender: 'm', bg: 'aw-bg-orange', init: 'ر', locked: false, instructions: 'مدیریت تامین و سفارشات. بررسی موجودی و ثبت درخواست خرید.', lastMsg: 'سفارش لوازم اداری ثبت شد', lastTime: '۲ روز پیش', unread: 0, done: 18, pending: 1, voip: '۱۰۵', company: 'alpha' },
  { id: 'restaurant', name: 'فاطمه حسنی', role: 'عامل سفارش رستوران', gender: 'f', bg: 'aw-bg-teal', init: 'ف', locked: false, instructions: 'مدیریت سفارشات غذا. نمایش منو، دریافت سفارش و اعلام وضعیت.', lastMsg: 'منوی جدید آپلود شد', lastTime: '۳ روز پیش', unread: 0, done: 56, pending: 4, voip: '۱۰۶', company: 'alpha' },
  { id: 'assistant', name: 'دستیار شخصی', role: 'عامل دستیار', gender: 'm', bg: 'aw-bg-indigo', init: 'د', locked: false, instructions: 'مدیریت امور شخصی، یادآوری‌ها، هماهنگی جلسات و پیگیری کارها.', lastMsg: 'یادآوری جلسه ساعت ۱۶:۰۰ تنظیم شد', lastTime: '۵ دقیقه پیش', unread: 2, done: 34, pending: 3, voip: '۱۰۷', company: 'alpha' },
  { id: 'support', name: 'پشتیبان هوشمند', role: 'عامل پشتیبانی', gender: 'f', bg: 'aw-bg-rose', init: 'پ', locked: false, instructions: 'پاسخ‌گویی به سوالات، رفع مشکلات فنی و راهنمایی کاربران.', lastMsg: 'تیکت #۱۲۳ بررسی و پاسخ داده شد', lastTime: '۲۰ دقیقه پیش', unread: 1, done: 28, pending: 2, voip: '۱۰۸', company: 'alpha' },
  { id: 'marketing_beta', name: 'زهرا نوری', role: 'عامل بازاریابی', gender: 'f', bg: 'aw-bg-blue', init: 'ز', locked: false, instructions: 'بازاریابی محصولات صنعتی', lastMsg: 'تحلیل بازار آماده است', lastTime: '۱۱:۰۰', unread: 1, done: 12, pending: 3, voip: '۲۰۱', company: 'beta' },
  { id: 'sales_beta', name: 'حسین صادقی', role: 'عامل فروش', gender: 'm', bg: 'aw-bg-green', init: 'ح', locked: false, instructions: 'فروش تجهیزات صنعتی', lastMsg: 'پیش‌فاکتور ارسال شد', lastTime: '۰۸:۴۵', unread: 0, done: 22, pending: 5, voip: '۲۰۲', company: 'beta' },
];

export const INITIAL_PERSONNEL: Personnel[] = [
  { id: 'p1', name: 'محمد حسینی', role: 'مدیر فروش', status: 'online', bg: 'aw-bg-sky', init: 'م', lastMsg: 'قرارداد جدید بسته شد', lastTime: '۱۱:۰۰', unread: 1, voip: '۳۰۱', email: 'm.hosseini@neura.ir', phone: '۰۹۱۲۱۱۱۲۲۳۳', permissions: ['dashboard', 'crm', 'orders', 'tasks', 'marketing'] },
  { id: 'p2', name: 'زهرا نوری', role: 'حسابدار', status: 'online', bg: 'aw-bg-amber', init: 'ز', lastMsg: 'فاکتورها بررسی شد', lastTime: '۱۰:۴۵', unread: 0, voip: '۳۰۲', email: 'z.noori@neura.ir', phone: '۰۹۱۲۲۲۲۳۳۴۴', permissions: ['dashboard', 'finance', 'orders'] },
  { id: 'p3', name: 'امیر کاظمی', role: 'پشتیبان فنی', status: 'offline', bg: 'aw-bg-emerald', init: 'ا', lastMsg: 'تیکت شماره ۴۵ بسته شد', lastTime: 'دیروز', unread: 0, voip: '۳۰۳', email: 'a.kazemi@neura.ir', phone: '۰۹۱۲۳۳۳۴۴۵۵', permissions: ['dashboard', 'agents', 'tasks'] },
  { id: 'p4', name: 'مریم فرهادی', role: 'منابع انسانی', status: 'offline', bg: 'aw-bg-rose', init: 'م', lastMsg: 'قرارداد جدید آماده امضاست', lastTime: 'دیروز', unread: 0, voip: '۳۰۴', email: 'm.farhadi@neura.ir', phone: '۰۹۱۲۴۴۴۵۵۶۶', permissions: ['dashboard', 'personnel', 'tasks'] },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'شرکت پارس فولاد', contact: 'احمد محمدی', phone: '۰۹۱۲۱۲۳۴۵۶۷', email: 'info@parsfolad.ir', status: 'active', value: '۱,۲۰۰,۰۰۰,۰۰۰', lastContact: '۱۴۰۴/۱۱/۲۵', bg: 'aw-bg-sky', init: 'پ', lastMsg: 'قرارداد جدید آماده بررسی است', lastTime: '۱۰:۳۰', unread: 2 },
  { id: 'c2', name: 'فناوری آینده', contact: 'سارا رضایی', phone: '۰۹۱۳۹۸۷۶۵۴۳', email: 'info@ayandeh.co', status: 'active', value: '۸۵۰,۰۰۰,۰۰۰', lastContact: '۱۴۰۴/۱۱/۲۸', bg: 'aw-bg-green', init: 'ف', lastMsg: 'پیش‌فاکتور ارسال شد', lastTime: '۰۹:۱۵', unread: 1 },
  { id: 'c3', name: 'صنایع نور', contact: 'علی کریمی', phone: '۰۹۱۴۵۵۵۱۲۳۴', email: 'ali@noor.ir', status: 'lead', value: '۰', lastContact: '۱۴۰۴/۱۱/۳۰', bg: 'aw-bg-amber', init: 'ص', lastMsg: 'درخواست اولیه ثبت شد', lastTime: 'دیروز', unread: 0 },
  { id: 'c4', name: 'بازرگانی سپهر', contact: 'نیما احمدی', phone: '۰۹۱۵۱۱۱۲۲۲۳', email: 'nima@sepehr.com', status: 'inactive', value: '۲,۳۰۰,۰۰۰,۰۰۰', lastContact: '۱۴۰۴/۱۰/۱۵', bg: 'aw-bg-orange', init: 'ب', lastMsg: 'آخرین مکاتبه انجام شد', lastTime: '۲ روز پیش', unread: 0 },
];

export const CRM_DEALS: Deal[] = [
  { id: 'd1', title: 'قرارداد تامین قطعات', customer: 'شرکت پارس فولاد', value: '۵۰۰,۰۰۰,۰۰۰', stage: 'negotiation', probability: '۷۵٪' },
  { id: 'd2', title: 'پروژه نرم‌افزار ERP', customer: 'فناوری آینده', value: '۱,۲۰۰,۰۰۰,۰۰۰', stage: 'proposal', probability: '۵۰٪' },
  { id: 'd3', title: 'خدمات پشتیبانی سالانه', customer: 'صنایع نور', value: '۲۰۰,۰۰۰,۰۰۰', stage: 'closed', probability: '۱۰۰٪' },
];

export const FINANCE_DATA: { income: FinanceItem[]; expense: FinanceItem[] } = {
  income: [
    { id: 'f1', desc: 'فاکتور پارس فولاد', amount: '۵۰۰,۰۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۲۸', status: 'paid', category: 'فروش' },
    { id: 'f2', desc: 'قرارداد فناوری آینده', amount: '۳۰۰,۰۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۲۵', status: 'pending', category: 'خدمات' },
    { id: 'f3', desc: 'خدمات پشتیبانی', amount: '۲۰۰,۰۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۲۰', status: 'paid', category: 'پشتیبانی' },
    { id: 'f7', desc: 'فروش تجهیزات صنایع نور', amount: '۱۵۰,۰۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۱۲', status: 'paid', category: 'فروش' },
    { id: 'f8', desc: 'مشاوره بازرگانی سامان', amount: '۱۳۰,۰۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۰۸', status: 'paid', category: 'مشاوره' },
    { id: 'f9', desc: 'اشتراک سالانه پلتفرم', amount: '۹۰,۰۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۰۳', status: 'pending', category: 'اشتراک' },
  ],
  expense: [
    { id: 'f4', desc: 'حقوق پرسنل', amount: '۱۸۰,۰۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۳۰', status: 'paid', category: 'حقوق' },
    { id: 'f5', desc: 'اجاره دفتر', amount: '۵۰,۰۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۰۱', status: 'paid', category: 'اداری' },
    { id: 'f6', desc: 'تجهیزات سرور', amount: '۱۲۰,۰۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۱۵', status: 'pending', category: 'فناوری' },
    { id: 'f10', desc: 'خرید قطعات البرز', amount: '۱۴۵,۶۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۱۸', status: 'paid', category: 'خرید' },
    { id: 'f11', desc: 'هزینه تبلیغات دیجیتال', amount: '۶۵,۰۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۱۰', status: 'paid', category: 'بازاریابی' },
    { id: 'f12', desc: 'بیمه و مالیات فصلی', amount: '۹۸,۰۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۰۵', status: 'pending', category: 'مالیات' },
  ],
};

export const INVOICES_DATA: Invoice[] = [
  {
    id: 'inv1', number: 'INV-1405', type: 'sales', customer: 'شرکت پارس فولاد', customerPhone: '۰۲۱۸۸۴۴۲۲۱۱',
    issueDate: '۱۴۰۴/۱۲/۰۱', dueDate: '۱۴۰۴/۱۲/۱۵', status: 'pending', taxPct: 9, discount: 0,
    lines: [
      { desc: 'ورق فولادی گالوانیزه', qty: 12, unitPrice: 28000000 },
      { desc: 'هزینه حمل و بارگیری', qty: 1, unitPrice: 15000000 },
    ],
    note: 'تحویل درب کارخانه. پرداخت تا سررسید.',
  },
  {
    id: 'inv2', number: 'INV-1404', type: 'sales', customer: 'فناوری آینده', customerPhone: '۰۲۱۴۴۵۵۶۶۷۷',
    issueDate: '۱۴۰۴/۱۱/۲۵', dueDate: '۱۴۰۴/۱۲/۱۰', status: 'overdue', taxPct: 9, discount: 5000000,
    lines: [
      { desc: 'لایسنس نرم‌افزار سالانه', qty: 3, unitPrice: 45000000 },
      { desc: 'خدمات پشتیبانی فنی', qty: 6, unitPrice: 8000000 },
    ],
    note: 'سررسید گذشته — نیاز به پیگیری.',
  },
  {
    id: 'inv3', number: 'INV-1403', type: 'sales', customer: 'بازرگانی سامان', customerPhone: '۰۳۱۳۳۲۲۱۱۰۰',
    issueDate: '۱۴۰۴/۱۱/۲۰', dueDate: '۱۴۰۴/۱۱/۲۸', status: 'paid', taxPct: 9, discount: 0,
    lines: [
      { desc: 'مشاوره مدیریت پروژه', qty: 20, unitPrice: 6500000 },
    ],
    note: '',
  },
  {
    id: 'inv4', number: 'PUR-0312', type: 'purchase', customer: 'تأمین‌کننده البرز', customerPhone: '۰۲۶۳۴۴۵۵۶۶۷',
    issueDate: '۱۴۰۴/۱۱/۱۸', dueDate: '۱۴۰۴/۱۲/۰۲', status: 'paid', taxPct: 9, discount: 0,
    lines: [
      { desc: 'قطعات یدکی خط تولید', qty: 50, unitPrice: 2400000 },
      { desc: 'روغن صنعتی', qty: 8, unitPrice: 3200000 },
    ],
    note: 'خرید ماهانه.',
  },
  {
    id: 'inv5', number: 'INV-1402', type: 'sales', customer: 'صنایع نور', customerPhone: '۰۲۱۲۲۳۳۴۴۵۵',
    issueDate: '۱۴۰۴/۱۱/۱۲', dueDate: '۱۴۰۴/۱۱/۲۰', status: 'paid', taxPct: 9, discount: 2000000,
    lines: [
      { desc: 'تابلو روشنایی LED', qty: 30, unitPrice: 1800000 },
      { desc: 'نصب و راه‌اندازی', qty: 1, unitPrice: 12000000 },
    ],
    note: '',
  },
  {
    id: 'inv6', number: 'INV-1401', type: 'sales', customer: 'پخش سراسری ایرانیان',
    issueDate: '۱۴۰۴/۱۱/۰۵', dueDate: '۱۴۰۴/۱۱/۱۹', status: 'pending', taxPct: 9, discount: 0,
    lines: [
      { desc: 'بسته خدمات بازاریابی دیجیتال', qty: 1, unitPrice: 85000000 },
    ],
    note: 'پیش‌پرداخت ۴۰٪ دریافت شد.',
  },
];

export const NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'کمپین جدید آماده بررسی', desc: 'عامل بازاریابی کمپین جدیدی ایجاد کرده است.', time: '۵ دقیقه پیش', icon: 'fa-solid fa-bullhorn', iconBg: 'aw-bg-blue', type: 'chat', target: 'marketing', cta: 'مشاهده چت' },
  { id: 'n2', title: 'فاکتور معوق', desc: 'فاکتور فناوری آینده هنوز پرداخت نشده.', time: '۱ ساعت پیش', icon: 'fa-solid fa-file-invoice-dollar', iconBg: 'aw-bg-orange', type: 'finance', target: 'pending', cta: 'مشاهده مالی' },
  { id: 'n3', title: 'سرنخ جدید در CRM', desc: 'صنایع نور به عنوان سرنخ جدید ثبت شده.', time: '۲ ساعت پیش', icon: 'fa-solid fa-user-plus', iconBg: 'aw-bg-green', type: 'crm', target: 'leads', cta: 'مشاهده CRM' },
  { id: 'n4', title: 'گزارش ماهانه آماده است', desc: 'گزارش عملکرد عامل‌ها برای ماه جاری تولید شد.', time: '۳ ساعت پیش', icon: 'fa-solid fa-chart-bar', iconBg: 'aw-bg-purple', type: 'reports', target: 'agent', cta: 'مشاهده گزارش' },
  { id: 'n5', title: 'جلسه فردا ساعت ۱۰', desc: 'عامل منشی جلسه‌ای برای فردا تنظیم کرده.', time: 'دیروز', icon: 'fa-solid fa-calendar-check', iconBg: 'aw-bg-pink', type: 'chat', target: 'secretary', cta: 'مشاهده چت' },
];

export const INITIAL_USER_PROFILE: UserProfile = {
  name: 'مدیر سیستم',
  email: 'admin@aiwork.ir',
  phone: '۰۹۱۲۱۲۳۴۵۶۷',
  role: 'مدیر ارشد',
  company: 'شرکت آلفا تجارت',
  avatar: 'م',
  status: 'online',
  bio: 'مدیر و بنیان‌گذار AIWork',
  username: 'admin_neura',
  verified: true,
};

export const INITIAL_EU_PROFILE: UserProfile = {
  name: 'کاربر گرامی',
  email: 'user@example.com',
  phone: '۰۹۱۳۹۸۷۶۵۴۳',
  role: 'کاربر نهایی',
  avatar: 'ک',
  status: 'online',
  bio: '',
  username: 'user_neura',
  verified: false,
};

export const STAGE_LABELS: Record<string, string> = {
  negotiation: 'مذاکره',
  proposal: 'پیشنهاد',
  closed: 'بسته شده',
};

export const STATUS_LABELS: Record<string, string> = {
  active: 'فعال',
  lead: 'سرنخ',
  inactive: 'غیرفعال',
};

export const INITIAL_ORDERS: Order[] = [
  { id: 'o1', num: '۱۰۲۳', status: 'delivered', desc: 'چلوکباب سلطانی × ۲', date: '۱۴۰۴/۱۱/۲۸', price: '۴۵۰,۰۰۰', agentId: 'restaurant' },
  { id: 'o2', num: '۱۰۲۴', status: 'preparing', desc: 'پیتزا مخصوص × ۱', date: '۱۴۰۴/۱۱/۳۰', price: '۳۲۰,۰۰۰', agentId: 'restaurant' },
  { id: 'o3', num: '۱۰۲۵', status: 'pending', desc: 'ساندویچ ویژه × ۳', date: '۱۴۰۴/۱۲/۰۱', price: '۲۷۰,۰۰۰', agentId: 'restaurant' },
];

export const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'بررسی گزارش مالی ماهانه', description: 'بررسی و تایید گزارش مالی ماه جاری و ارسال به مدیرعامل', status: 'todo', priority: 'high', assignee: 'سارا محمدی', dueDate: '۱۴۰۴/۱۲/۰۵', createdAt: '۱۴۰۴/۱۱/۲۸' },
  { id: 't2', title: 'آماده‌سازی کمپین تبلیغاتی بهاره', description: 'طراحی بنر و محتوای شبکه‌های اجتماعی برای کمپین بهاره', status: 'inProgress', priority: 'medium', assignee: 'مریم احمدی', dueDate: '۱۴۰۴/۱۲/۱۰', createdAt: '۱۴۰۴/۱۱/۲۵' },
  { id: 't3', title: 'پیگیری قرارداد پارس فولاد', description: 'تماس با مشتری و نهایی کردن شرایط قرارداد', status: 'inProgress', priority: 'high', assignee: 'علی رضایی', dueDate: '۱۴۰۴/۱۲/۰۳', createdAt: '۱۴۰۴/۱۱/۲۰' },
  { id: 't4', title: 'به‌روزرسانی منوی رستوران', description: 'افزودن غذاهای جدید فصلی به منوی رستوران', status: 'done', priority: 'low', assignee: 'فاطمه حسنی', dueDate: '۱۴۰۴/۱۱/۳۰', createdAt: '۱۴۰۴/۱۱/۱۵' },
  { id: 't5', title: 'هماهنگی جلسه هیئت‌مدیره', description: 'ارسال دعوتنامه و تنظیم دستور جلسه', status: 'done', priority: 'medium', assignee: 'نرگس کریمی', dueDate: '۱۴۰۴/۱۱/۲۸', createdAt: '۱۴۰۴/۱۱/۲۰' },
  { id: 't6', title: 'سفارش تجهیزات سرور جدید', description: 'بررسی قیمت و ثبت سفارش سرور HP ProLiant', status: 'todo', priority: 'medium', assignee: 'رضا امینی', dueDate: '۱۴۰۴/۱۲/۱۵', createdAt: '۱۴۰۴/۱۱/۲۸' },
  { id: 't7', title: 'ارسال فاکتور به فناوری آینده', description: 'تهیه و ارسال فاکتور خدمات نرم‌افزاری', status: 'todo', priority: 'high', assignee: 'سارا محمدی', dueDate: '۱۴۰۴/۱۲/۰۱', createdAt: '۱۴۰۴/۱۱/۲۸' },
];

export const TASK_STATUS_LABELS: Record<string, string> = {
  todo: 'در انتظار',
  inProgress: 'در حال انجام',
  done: 'انجام شده',
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  high: 'بالا',
  medium: 'متوسط',
  low: 'پایین',
};

export const TASK_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  todo: { bg: 'rgba(155,89,182,0.2)', text: '#9B59B6' },
  inProgress: { bg: 'rgba(245,158,11,0.2)', text: '#f59e0b' },
  done: { bg: 'rgba(16,185,129,0.2)', text: '#10b981' },
};

export const TASK_PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  high: { bg: 'rgba(239,68,68,0.2)', text: '#ef4444' },
  medium: { bg: 'rgba(245,158,11,0.2)', text: '#f59e0b' },
  low: { bg: 'rgba(100,116,139,0.2)', text: '#64748b' },
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  delivered: 'تحویل شده',
  preparing: 'در حال آماده‌سازی',
  cancelled: 'لغو شده',
  pending: 'در انتظار تایید',
};

export const ORDER_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  delivered: { bg: 'rgba(16,185,129,0.2)', text: '#10b981' },
  preparing: { bg: 'rgba(245,158,11,0.2)', text: '#f59e0b' },
  cancelled: { bg: 'rgba(239,68,68,0.2)', text: '#ef4444' },
  pending: { bg: 'rgba(155,89,182,0.2)', text: '#9B59B6' },
};

export function generateReply(text: string, agent?: Agent): string {
  if (!agent) return 'پیام شما دریافت شد.';
  const instr = agent.instructions || '';

  const contextReplies: Record<string, string[]> = {
    marketing: [
      'کمپین جدید با نرخ بازگشت ۲۳٪ آماده اجراست. آیا تایید می‌کنید؟',
      'تحلیل رقبا نشان می‌دهد که باید روی شبکه‌های اجتماعی بیشتر تمرکز کنیم.',
      'گزارش عملکرد کمپین ایمیلی ماه گذشته: نرخ باز شدن ۳۵٪، نرخ کلیک ۱۲٪.',
      'پیشنهاد می‌کنم بودجه تبلیغات گوگل را ۲۰٪ افزایش دهیم.',
    ],
    sales: [
      'فاکتور شماره ۱۰۴۵ به مبلغ ۵۰۰ میلیون ریال صادر شد.',
      'سرنخ جدیدی از طریق وبسایت ثبت شده. در حال پیگیری هستم.',
      'قرارداد با شرکت پارس فولاد در مرحله نهایی مذاکره است.',
      'پیش‌فاکتور برای مشتری ارسال شد. منتظر تایید هستم.',
    ],
    finance: [
      'گزارش مالی ماهانه آماده شد. سود خالص ۶۵۰ میلیون ریال.',
      'فاکتور معوق فناوری آینده پیگیری شد. قول پرداخت تا هفته آینده.',
      'حقوق پرسنل ماه جاری محاسبه و آماده پرداخت است.',
      'بودجه سه‌ماهه دوم تنظیم شد. آیا مایل به بررسی هستید؟',
    ],
    secretary: [
      'جلسه با تیم فروش برای فردا ساعت ۱۰ تنظیم شد.',
      'یادآوری: جلسه هیئت‌مدیره پنجشنبه ساعت ۱۴.',
      'تقویم هفته آینده: ۳ جلسه داخلی و ۲ جلسه با مشتری.',
      'دعوتنامه جلسه برای همه شرکت‌کنندگان ارسال شد.',
    ],
    procurement: [
      'سفارش لوازم اداری ثبت شد. زمان تحویل: ۳ روز کاری.',
      'موجودی کاغذ A4 به حداقل رسیده. درخواست خرید ثبت شد.',
      'قیمت از ۳ تامین‌کننده استعلام شد. بهترین قیمت: تامین‌کننده الف.',
      'تجهیزات IT سفارش‌ داده شده تحویل گرفته شد.',
    ],
    restaurant: [
      'منوی امروز آپدیت شد. غذای ویژه: چلوکباب سلطانی.',
      'سفارش شما ثبت شد. زمان تقریبی آماده‌سازی: ۲۰ دقیقه.',
      'آیا مایل به افزودن نوشیدنی به سفارش هستید؟',
      'سفارش شما آماده تحویل است. نوش جان!',
    ],
  };

  const agentReplies = contextReplies[agent.id] || [];
  const generalReplies = [
    'بله، بررسی می‌کنم. ' + (instr.split('.')[0] || '') + '.',
    'اطلاعات مورد نظر آماده می‌شود.',
    'این موضوع در حوزه کاری من است. پیگیری می‌کنم.',
    'ممنون از پیامتان. نتیجه را اعلام خواهم کرد.',
    'در حال پردازش درخواست شما هستم...',
  ];
  const allReplies = [...agentReplies, ...generalReplies];
  return allReplies[Math.floor(Math.random() * allReplies.length)];
}

// ========================
// CHART DATA
// ========================
export const MONTHLY_REVENUE_DATA = [
  { month: 'فروردین', income: 720, expense: 280 },
  { month: 'اردیبهشت', income: 850, expense: 310 },
  { month: 'خرداد', income: 680, expense: 290 },
  { month: 'تیر', income: 920, expense: 340 },
  { month: 'مرداد', income: 780, expense: 300 },
  { month: 'شهریور', income: 1050, expense: 360 },
  { month: 'مهر', income: 890, expense: 320 },
  { month: 'آبان', income: 960, expense: 350 },
  { month: 'آذر', income: 1100, expense: 380 },
  { month: 'دی', income: 870, expense: 330 },
  { month: 'بهمن', income: 1000, expense: 350 },
  { month: 'اسفند', income: 1150, expense: 400 },
];

export const WEEKLY_ACTIVITY_DATA = [
  { day: 'شنبه', messages: 42, calls: 8 },
  { day: 'یکشنبه', messages: 55, calls: 12 },
  { day: 'دوشنبه', messages: 38, calls: 6 },
  { day: 'سه‌شنبه', messages: 67, calls: 15 },
  { day: 'چهارشنبه', messages: 48, calls: 10 },
  { day: 'پنجشنبه', messages: 35, calls: 5 },
  { day: 'جمعه', messages: 12, calls: 2 },
];

export const CRM_FUNNEL_DATA = [
  { name: 'سرنخ جدید', value: 45, fill: '#9B59B6' },
  { name: 'در حال مذاکره', value: 28, fill: '#f59e0b' },
  { name: 'پیشنهاد ارسال شده', value: 18, fill: '#3b82f6' },
  { name: 'بسته شده', value: 12, fill: '#10b981' },
];