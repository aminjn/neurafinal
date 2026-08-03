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
  company?: string;
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
  category?: string;
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
export const toFa = (n: number | string): string => {
  const _s = String(n);
  let _g = _s;
  if (/^-?[1-9]\d{3,}$/.test(_s)) {
    const _num = parseInt(_s, 10), _abs = Math.abs(_num);
    const _isYear = (_abs >= 1300 && _abs <= 1510) || (_abs >= 1900 && _abs <= 2100);
    if (!_isYear) _g = _num.toLocaleString('en-US');
  }
  return _g.replace(/\d/g, (d) => '\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9'[parseInt(d)]).replace(/,/g, '\u066C');
};

export const nowTime = (): string => {
  const d = new Date();
  return toFa(String(d.getHours()).padStart(2, '0')) + ':' + toFa(String(d.getMinutes()).padStart(2, '0'));
};

// ========================
// DATA
// ========================
export const COMPANIES: Record<string, { name: string; type: string }> = {
  alpha: { name: 'شرکت من', type: 'کسب‌وکار' },
};

export const INITIAL_AGENTS: Agent[] = [
  { id: 'marketing', name: 'ایجنت بازاریاب', role: 'عامل بازاریابی', gender: 'f', bg: 'aw-bg-blue', init: 'م', locked: false, instructions: 'تمرکز بر بازاریابی دیجیتال و تحلیل رقبا. کمپین‌های ایمیل و شبکه‌های اجتماعی را مدیریت کن.', lastMsg: '', lastTime: '', unread: 0, done: 0, pending: 0, voip: '۱۰۱', company: 'alpha' },
  { id: 'sales', name: 'ایجنت فروش', role: 'عامل فروش', gender: 'm', bg: 'aw-bg-green', init: 'ع', locked: false, instructions: 'مدیریت فرآیند فروش، پیگیری سرنخ‌ها و صدور فاکتور. تمرکز بر تبدیل سرنخ به مشتری.', lastMsg: '', lastTime: '', unread: 0, done: 0, pending: 0, voip: '۱۰۲', company: 'alpha' },
  { id: 'finance', name: 'ایجنت مالی و اداری', role: 'عامل مالی و اداری', gender: 'm', bg: 'aw-bg-purple', init: 'ع', locked: false, instructions: 'مدیریت مالی و حسابداری شامل دریافت و پرداخت، صورت‌حساب و گزارش‌های مالی.', lastMsg: '', lastTime: '', unread: 0, done: 0, pending: 0, voip: '۱۰۳', company: 'alpha' },
  { id: 'secretary', name: 'ایجنت منشی', role: 'عامل منشی', gender: 'f', bg: 'aw-bg-pink', init: 'ن', locked: false, instructions: 'مدیریت تقویم و جلسات. یادآوری قرارها و هماهنگی جلسات.', lastMsg: '', lastTime: '', unread: 0, done: 0, pending: 0, voip: '۱۰۴', company: 'alpha' },
  { id: 'procurement', name: 'ایجنت تدارکات', role: 'عامل تدارکات', gender: 'm', bg: 'aw-bg-orange', init: 'ر', locked: false, instructions: 'مدیریت تامین و سفارشات. بررسی موجودی و ثبت درخواست خرید.', lastMsg: '', lastTime: '', unread: 0, done: 0, pending: 0, voip: '۱۰۵', company: 'alpha' },
  { id: 'restaurant', name: 'ایجنت رستوران', role: 'عامل سفارش رستوران', gender: 'f', bg: 'aw-bg-teal', init: 'ف', locked: false, instructions: 'مدیریت سفارشات غذا. نمایش منو، دریافت سفارش و اعلام وضعیت.', lastMsg: '', lastTime: '', unread: 0, done: 0, pending: 0, voip: '۱۰۶', company: 'alpha' },
  { id: 'assistant', name: 'دستیار شخصی', role: 'عامل دستیار', gender: 'm', bg: 'aw-bg-indigo', init: 'د', locked: false, instructions: 'مدیریت امور شخصی، یادآوری‌ها، هماهنگی جلسات و پیگیری کارها.', lastMsg: '', lastTime: '', unread: 0, done: 0, pending: 0, voip: '۱۰۷', company: 'alpha' },
  { id: 'support', name: 'پشتیبانی', role: 'عامل پشتیبانی', gender: 'f', bg: 'aw-bg-rose', init: 'پ', locked: false, instructions: 'پاسخ‌گویی به سوالات، رفع مشکلات فنی و راهنمایی کاربران.', lastMsg: '', lastTime: '', unread: 0, done: 0, pending: 0, voip: '۱۰۸', company: 'alpha' },
];

export const INITIAL_PERSONNEL: Personnel[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const CRM_DEALS: Deal[] = [];

export const FINANCE_DATA: { income: FinanceItem[]; expense: FinanceItem[] } = {
  income: [],
  expense: [],
};

export const INVOICES_DATA: Invoice[] = [];

export const NOTIFICATIONS: Notification[] = [];

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
  email: '',
  phone: '',
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

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_TASKS: Task[] = [];

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
  // پاسخِ آفلاینِ صادق — هیچ عدد/دادهٔ ساختگی تولید نمی‌کند. پاسخِ واقعی از بک‌اند (api.chat) می‌آید؛
  // این تابع فقط زمانی استفاده می‌شود که ارتباط با سرور برقرار نشود.
  const t = (text || '').trim();
  if (!agent) return 'پیام شما دریافت شد.';
  if (/^(سلام|درود|وقت بخیر|صبح بخیر|hi|hello)/i.test(t)) return 'سلام! چطور می‌تونم کمکتون کنم؟';
  if (/ممنون|مرسی|سپاس|تشکر|خداحافظ|بای/i.test(t)) return 'خواهش می‌کنم! هر زمان کاری داشتید در خدمتم.';
  return 'الان نتونستم به سرور وصل شم؛ لطفاً چند لحظه دیگر دوباره تلاش کنید.';
}
function __genReplyLegacy(text: string, agent?: Agent): string {
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
      'قرارداد با یکی از مشتری‌ها در مرحله نهایی مذاکره است.',
      'پیش‌فاکتور برای مشتری ارسال شد. منتظر تایید هستم.',
    ],
    finance: [
      'گزارش مالی ماهانه آماده شد. سود خالص ۶۵۰ میلیون ریال.',
      'فاکتور معوق یکی از مشتری‌ها پیگیری شد. قول پرداخت تا هفته آینده.',
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
export const MONTHLY_REVENUE_DATA = [];

export const WEEKLY_ACTIVITY_DATA = [];

export const CRM_FUNNEL_DATA = [];