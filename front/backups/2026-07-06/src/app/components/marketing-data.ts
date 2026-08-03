// ============================================================
// MARKETING AGENT — MOCK DATA (بازاریاب هوشمند)
// All marketing mock data lives here so components stay clean.
// ============================================================

export const MKT_BLUE = 'var(--aw-primary)';
export const MKT_GRAD = 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))';

// ---------- LEADS ----------
export type LeadStatus = 'hot' | 'warm' | 'cold';
export type FunnelStage = 'new' | 'contacted' | 'interested' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface LeadActivity {
  id: number;
  type: 'call' | 'message' | 'note' | 'email' | 'stage';
  text: string;
  date: string;
}

export interface Lead {
  id: number;
  name: string;
  company: string;
  field: string;
  phone: string;
  source: string;
  sourceIcon: string;
  status: LeadStatus;
  stage: FunnelStage;
  score: number;
  date: string;
  lastAction: string;
  owner: string;
  nextAction: string;
  followUp: string;
  segment: string;
  campaigns: string[];
  aiSuggestion: string;
  timeline: LeadActivity[];
  notes: string[];
}

export const MOCK_LEADS: Lead[] = [
  {
    id: 1, name: 'سارا محمدی', company: 'شرکت آلفاتک', field: 'فناوری اطلاعات', phone: '۰۹۱۲۱۲۳۴۵۶۷',
    source: 'اینستاگرام', sourceIcon: 'fa-brands fa-instagram', status: 'hot', stage: 'interested', score: 92,
    date: 'امروز', lastAction: 'پر کردن فرم تماس', owner: 'تیم بازاریابی', nextAction: 'ارسال پیشنهاد قیمت',
    followUp: 'فردا ۱۰:۰۰', segment: 'شرکت‌های متوسط', campaigns: ['کمپین بهاره ۱۴۰۵'],
    aiSuggestion: 'لید بسیار داغ است. پیشنهاد می‌شود امروز تماس گرفته و دموی محصول ارائه شود.',
    timeline: [
      { id: 1, type: 'stage', text: 'وارد مرحله «علاقه‌مند» شد', date: 'امروز ۰۹:۱۲' },
      { id: 2, type: 'message', text: 'پیام خوش‌آمدگویی ارسال شد', date: 'امروز ۰۹:۰۵' },
      { id: 3, type: 'note', text: 'از طریق فرم تماس سایت ثبت شد', date: 'امروز ۰۸:۵۰' },
    ],
    notes: ['به دنبال راهکار اتوماسیون فروش است', 'بودجه تقریبی: ۵۰ میلیون'],
  },
  {
    id: 2, name: 'رضا کریمی', company: 'صنایع بتا', field: 'تولیدی', phone: '۰۹۱۳۲۳۴۵۶۷۸',
    source: 'گوگل', sourceIcon: 'fa-brands fa-google', status: 'hot', stage: 'proposal', score: 87,
    date: 'امروز', lastAction: 'درخواست دمو', owner: 'تیم بازاریابی', nextAction: 'پیگیری پیشنهاد ارسالی',
    followUp: 'امروز ۱۵:۰۰', segment: 'سازمان‌های بزرگ', campaigns: ['تبلیغات گوگل ادز'],
    aiSuggestion: 'پیشنهاد ارسال شده. زمان پیگیری تلفنی فرارسیده است.',
    timeline: [
      { id: 1, type: 'email', text: 'پیشنهاد قیمت ارسال شد', date: 'دیروز ۱۶:۳۰' },
      { id: 2, type: 'call', text: 'تماس اولیه — درخواست دمو', date: 'دیروز ۱۱:۰۰' },
    ],
    notes: ['تصمیم‌گیرنده اصلی است'],
  },
  {
    id: 3, name: 'مریم حسینی', company: 'فروشگاه گاما', field: 'خرده‌فروشی', phone: '۰۹۱۴۳۴۵۶۷۸۹',
    source: 'معرفی', sourceIcon: 'fa-solid fa-handshake', status: 'warm', stage: 'contacted', score: 65,
    date: 'دیروز', lastAction: 'بازدید صفحه قیمت', owner: 'تیم بازاریابی', nextAction: 'ارسال محتوای آموزشی',
    followUp: '۲ روز دیگر', segment: 'کسب‌وکارهای کوچک', campaigns: ['بلاگ و محتوای آموزشی'],
    aiSuggestion: 'علاقه‌مند به قیمت است اما هنوز مردد. ارسال نمونه موفق مشابه پیشنهاد می‌شود.',
    timeline: [
      { id: 1, type: 'message', text: 'پاسخ به سوال قیمت', date: 'دیروز ۱۴:۰۰' },
      { id: 2, type: 'note', text: 'از طریق معرفی مشتری قبلی', date: '۳ روز پیش' },
    ],
    notes: ['حساس به قیمت'],
  },
  {
    id: 4, name: 'احمد نوری', company: 'مؤسسه دلتا', field: 'آموزشی', phone: '۰۹۱۵۴۵۶۷۸۹۰',
    source: 'ایمیل', sourceIcon: 'fa-solid fa-envelope', status: 'warm', stage: 'contacted', score: 58,
    date: 'دیروز', lastAction: 'باز کردن ایمیل', owner: 'تیم بازاریابی', nextAction: 'تماس معرفی',
    followUp: '۳ روز دیگر', segment: 'شرکت‌های متوسط', campaigns: ['ایمیل معرفی محصول جدید'],
    aiSuggestion: 'ایمیل را باز کرده اما کلیک نکرده. ارسال پیام شخصی‌سازی‌شده مؤثر است.',
    timeline: [
      { id: 1, type: 'email', text: 'ایمیل معرفی باز شد', date: 'دیروز ۱۰:۰۰' },
    ],
    notes: [],
  },
  {
    id: 5, name: 'فاطمه رضایی', company: 'شرکت اپسیلون', field: 'خدماتی', phone: '۰۹۱۶۵۶۷۸۹۰۱',
    source: 'پیامک', sourceIcon: 'fa-solid fa-comment-sms', status: 'cold', stage: 'new', score: 30,
    date: '۳ روز پیش', lastAction: 'کلیک روی لینک', owner: 'عامل هوشمند', nextAction: 'افزودن به کمپین فعال‌سازی',
    followUp: 'این هفته', segment: 'فریلنسرها', campaigns: [],
    aiSuggestion: 'لید سرد. پیشنهاد افزودن به کمپین فعال‌سازی خودکار با محتوای آموزشی.',
    timeline: [
      { id: 1, type: 'message', text: 'کلیک روی لینک پیامک', date: '۳ روز پیش' },
    ],
    notes: [],
  },
  {
    id: 6, name: 'علی بهرامی', company: 'گروه زتا', field: 'بازرگانی', phone: '۰۹۱۷۶۷۸۹۰۱۲',
    source: 'وبسایت', sourceIcon: 'fa-solid fa-globe', status: 'cold', stage: 'new', score: 22,
    date: 'هفته پیش', lastAction: 'بازدید صفحه اصلی', owner: 'عامل هوشمند', nextAction: 'هدف‌گذاری مجدد',
    followUp: 'نامشخص', segment: 'کسب‌وکارهای کوچک', campaigns: [],
    aiSuggestion: 'تعامل کم. هدف‌گذاری مجدد (retargeting) با تبلیغ بصری پیشنهاد می‌شود.',
    timeline: [
      { id: 1, type: 'note', text: 'بازدید صفحه اصلی', date: 'هفته پیش' },
    ],
    notes: [],
  },
  {
    id: 7, name: 'نگار صادقی', company: 'تجارت اتا', field: 'بازرگانی', phone: '۰۹۱۸۷۸۹۰۱۲۳',
    source: 'اینستاگرام', sourceIcon: 'fa-brands fa-instagram', status: 'hot', stage: 'negotiation', score: 80,
    date: 'امروز', lastAction: 'ارسال پیام مستقیم', owner: 'تیم بازاریابی', nextAction: 'نهایی‌سازی قرارداد',
    followUp: 'امروز ۱۷:۰۰', segment: 'شرکت‌های متوسط', campaigns: ['کمپین بهاره ۱۴۰۵'],
    aiSuggestion: 'در مرحله مذاکره است. ارائه تخفیف محدود برای تسریع تصمیم پیشنهاد می‌شود.',
    timeline: [
      { id: 1, type: 'stage', text: 'وارد مرحله مذاکره شد', date: 'امروز ۱۱:۰۰' },
      { id: 2, type: 'message', text: 'پیام مستقیم اینستاگرام', date: 'امروز ۰۹:۳۰' },
    ],
    notes: ['درخواست تخفیف حجمی دارد'],
  },
];

export const STATUS_META: Record<LeadStatus, { bg: string; color: string; label: string }> = {
  hot: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', label: 'گرم 🔥' },
  warm: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: 'نیمه‌گرم' },
  cold: { bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', label: 'سرد ❄️' },
};

export const FUNNEL_STAGES: { id: FunnelStage; label: string; color: string }[] = [
  { id: 'new', label: 'لید جدید', color: '#3B82F6' },
  { id: 'contacted', label: 'تماس اولیه', color: '#8B5CF6' },
  { id: 'interested', label: 'علاقه‌مند', color: '#06B6D4' },
  { id: 'proposal', label: 'ارسال پیشنهاد', color: '#F59E0B' },
  { id: 'negotiation', label: 'مذاکره', color: '#EC4899' },
  { id: 'won', label: 'تبدیل‌شده', color: '#10B981' },
  { id: 'lost', label: 'ازدست‌رفته', color: '#EF4444' },
];

// ---------- CONVERSATIONS ----------
export interface MktConversation {
  id: number;
  name: string;
  kind: 'lead' | 'customer' | 'ai' | 'team';
  kindLabel: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  priority: 'high' | 'normal';
}

export const MOCK_CONVERSATIONS: MktConversation[] = [
  { id: 1, name: 'سارا محمدی', kind: 'lead', kindLabel: 'لید داغ', avatar: 'س', lastMessage: 'سلام، می‌خوام درباره قیمت‌ها بیشتر بدونم', time: '۲ دقیقه پیش', unread: true, priority: 'high' },
  { id: 2, name: 'رضا کریمی', kind: 'lead', kindLabel: 'لید', avatar: 'ر', lastMessage: 'پیشنهاد رو دریافت کردم، بررسی می‌کنم', time: '۱۵ دقیقه پیش', unread: true, priority: 'high' },
  { id: 3, name: 'فروشگاه گاما', kind: 'customer', kindLabel: 'مشتری VIP', avatar: 'گ', lastMessage: 'ممنون از پیگیری شما 🙏', time: '۱ ساعت پیش', unread: false, priority: 'normal' },
  { id: 4, name: 'عامل هوشمند بازاریاب', kind: 'ai', kindLabel: 'عامل AI', avatar: '🤖', lastMessage: '۳ لید داغ نیازمند پیگیری امروز شناسایی شد', time: '۲ ساعت پیش', unread: true, priority: 'high' },
  { id: 5, name: 'تیم فروش', kind: 'team', kindLabel: 'تیم داخلی', avatar: 'ف', lastMessage: 'لید آلفاتک رو به ما واگذار کنید', time: '۳ ساعت پیش', unread: false, priority: 'normal' },
  { id: 6, name: 'احمد نوری', kind: 'lead', kindLabel: 'لید', avatar: 'ا', lastMessage: 'فعلاً فرصت بررسی ندارم', time: 'دیروز', unread: false, priority: 'normal' },
];

// ---------- AI ACTIONS / APPROVALS ----------
export type RiskLevel = 'high' | 'medium' | 'low';
export type ActionStatus = 'pending' | 'approved' | 'rejected';
export interface AiAction {
  id: number;
  title: string;
  desc: string;
  type: string;
  typeIcon: string;
  date: string;
  priority: 'high' | 'normal';
  risk: RiskLevel;
  reason: string;
  expected: string;
  owner: string;
  preview: string;
  status?: ActionStatus;
}

export const ACTION_STATUS_META: Record<ActionStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: 'در انتظار', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: 'fa-solid fa-clock' },
  approved: { label: 'تأییدشده', color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: 'fa-solid fa-circle-check' },
  rejected: { label: 'ردشده', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: 'fa-solid fa-circle-xmark' },
};

export const MOCK_AI_ACTIONS: AiAction[] = [
  {
    id: 1, title: 'تأیید متن کمپین پیامکی', desc: 'متن پیشنهادی برای کمپین جشنواره بهاره', type: 'پیام انبوه', typeIcon: 'fa-solid fa-comment-sms',
    date: 'امروز ۰۹:۳۰', priority: 'high', risk: 'medium', reason: 'افزایش نرخ پاسخ بر اساس عملکرد کمپین قبلی',
    expected: 'افزایش ۱۵٪ نرخ کلیک', owner: 'عامل هوشمند',
    preview: '🌸 جشنواره بهاره نورا آغاز شد! تا ۳۰٪ تخفیف روی تمام پلن‌ها. همین حالا فعال کنید: neura.app/spring',
  },
  {
    id: 2, title: 'بررسی پاسخ پیشنهادی برای لید', desc: 'پاسخ آماده‌شده برای سارا محمدی (لید داغ)', type: 'پیام به مشتری', typeIcon: 'fa-solid fa-reply',
    date: 'امروز ۱۰:۱۵', priority: 'high', risk: 'low', reason: 'لید داغ نیازمند پاسخ سریع است',
    expected: 'حفظ تعامل و تسریع تبدیل', owner: 'عامل هوشمند',
    preview: 'سلام سارا جان، ممنون از پیام شما. خوشحال می‌شیم دموی اختصاصی براتون ترتیب بدیم. فردا ساعت ۱۰ مناسبه؟',
  },
  {
    id: 3, title: 'تأیید افزایش بودجه کمپین', desc: 'افزایش ۲۰٪ بودجه کمپین اینستاگرام بهاره', type: 'افزایش بودجه', typeIcon: 'fa-solid fa-coins',
    date: 'امروز ۰۸:۰۰', priority: 'high', risk: 'high', reason: 'ROI کمپین ۳۲۰٪ است و ظرفیت رشد دارد',
    expected: 'افزایش ۴۰ تبدیل اضافی', owner: 'عامل هوشمند',
    preview: 'بودجه فعلی: ۵۰,۰۰۰,۰۰۰ ت ← بودجه پیشنهادی: ۶۰,۰۰۰,۰۰۰ ت',
  },
  {
    id: 4, title: 'تأیید ارسال گزارش هفتگی', desc: 'گزارش عملکرد هفتگی برای مدیریت', type: 'ارسال گزارش', typeIcon: 'fa-solid fa-file-lines',
    date: 'امروز ۰۷:۳۰', priority: 'normal', risk: 'low', reason: 'پایان هفته کاری',
    expected: 'اطلاع‌رسانی شفاف به مدیریت', owner: 'عامل هوشمند',
    preview: 'گزارش شامل: ۱۳۸ لید جدید، نرخ تبدیل ۴.۸٪، ROI کلی ۲۸۰٪',
  },
  {
    id: 5, title: 'پیام پیشنهادی برای مشتری VIP', desc: 'پیام تبریک و پیشنهاد ویژه برای فروشگاه گاما', type: 'پیام حساس', typeIcon: 'fa-solid fa-crown',
    date: 'دیروز ۱۶:۰۰', priority: 'normal', risk: 'medium', reason: 'حفظ و تقویت رابطه با مشتری ارزشمند',
    expected: 'افزایش وفاداری و خرید مجدد', owner: 'عامل هوشمند',
    preview: 'جناب مدیر گرامی، به‌عنوان مشتری ویژه نورا، پیشنهاد ارتقای رایگان به پلن حرفه‌ای برای شما فعال شده است.',
  },
  {
    id: 6, title: 'ارسال پیام یادآوری سبد رها‌شده', desc: 'یادآوری خودکار برای ۳۲ مشتری با سبد نیمه‌کاره', type: 'پیام انبوه', typeIcon: 'fa-solid fa-cart-shopping',
    date: 'دیروز ۱۱:۲۰', priority: 'normal', risk: 'low', reason: 'بازگرداندن مشتریان مردد به فرآیند خرید',
    expected: 'بازیابی ۸ سفارش', owner: 'عامل هوشمند', status: 'approved',
    preview: 'سبد خرید شما هنوز منتظرتان است 🛒 با کد BACK10 ده درصد تخفیف بگیرید.',
  },
  {
    id: 7, title: 'انتشار خودکار پست اینستاگرام', desc: 'زمان‌بندی پست جدید برای ساعت اوج بازدید', type: 'انتشار محتوا', typeIcon: 'fa-brands fa-instagram',
    date: 'دیروز ۰۹:۰۰', priority: 'normal', risk: 'medium', reason: 'بیشترین تعامل مخاطب در این بازه ثبت شده',
    expected: 'افزایش ۱۲٪ ریچ', owner: 'عامل هوشمند', status: 'approved',
    preview: 'پست معرفی ویژگی جدید نورا — زمان انتشار: ۱۸:۳۰',
  },
  {
    id: 8, title: 'ارسال تخفیف ۵۰٪ به کل پایگاه', desc: 'پیشنهاد تخفیف گسترده به تمام مخاطبان', type: 'پیام حساس', typeIcon: 'fa-solid fa-triangle-exclamation',
    date: '۲ روز پیش', priority: 'high', risk: 'high', reason: 'افزایش سریع فروش کوتاه‌مدت',
    expected: 'ریسک کاهش حاشیه سود', owner: 'عامل هوشمند', status: 'rejected',
    preview: 'تخفیف ۵۰٪ روی همه پلن‌ها فقط امروز! — رد شد به دلیل آسیب به ارزش برند.',
  },
  {
    id: 9, title: 'پیام خوش‌آمدگویی به لیدهای جدید', desc: 'ارسال خودکار پیام معرفی به ۴۷ لید تازه', type: 'پیام انبوه', typeIcon: 'fa-solid fa-hand-wave',
    date: '۲ روز پیش', priority: 'normal', risk: 'low', reason: 'شروع تعامل در نخستین ساعت‌های ورود لید',
    expected: 'افزایش ۱۸٪ نرخ پاسخ اولیه', owner: 'عامل هوشمند', status: 'approved',
    preview: 'به نورا خوش آمدید 👋 برای شروع، دموی رایگان رزرو کنید: neura.app/demo',
  },
  {
    id: 10, title: 'زمان‌بندی ایمیل خبرنامه هفتگی', desc: 'ارسال خبرنامه به ۱,۲۰۰ مشترک فعال', type: 'ارسال گزارش', typeIcon: 'fa-solid fa-envelope',
    date: '۳ روز پیش', priority: 'normal', risk: 'low', reason: 'حفظ تعامل منظم با مشترکین',
    expected: 'نرخ باز شدن ۳۴٪', owner: 'عامل هوشمند', status: 'approved',
    preview: 'خبرنامه این هفته: سه ترفند رشد فروش + معرفی مشتری موفق ماه',
  },
  {
    id: 11, title: 'افزایش بودجه تبلیغات گوگل', desc: 'افزایش ۱۵٪ بودجه کلمات کلیدی پربازده', type: 'افزایش بودجه', typeIcon: 'fa-solid fa-coins',
    date: '۳ روز پیش', priority: 'high', risk: 'medium', reason: 'کلمات کلیدی با ROI ۲۸۰٪ ظرفیت رشد دارند',
    expected: 'افزایش ۲۵ تبدیل', owner: 'عامل هوشمند', status: 'approved',
    preview: 'بودجه فعلی: ۲۰,۰۰۰,۰۰۰ ت ← پیشنهادی: ۲۳,۰۰۰,۰۰۰ ت',
  },
  {
    id: 12, title: 'پاسخ خودکار به نظرات اینستاگرام', desc: 'پاسخ آماده به ۲۳ نظر جدید زیر پست‌ها', type: 'پیام به مشتری', typeIcon: 'fa-brands fa-instagram',
    date: '۴ روز پیش', priority: 'normal', risk: 'low', reason: 'حفظ تعامل و سرعت پاسخ‌گویی',
    expected: 'افزایش نرخ تعامل صفحه', owner: 'عامل هوشمند', status: 'approved',
    preview: 'ممنون از پیام شما 🙏 برای اطلاعات بیشتر دایرکت بدید.',
  },
  {
    id: 13, title: 'ارسال پیام انبوه شبانه', desc: 'ارسال ۵,۰۰۰ پیامک تبلیغاتی ساعت ۲ بامداد', type: 'پیام انبوه', typeIcon: 'fa-solid fa-moon',
    date: '۴ روز پیش', priority: 'normal', risk: 'high', reason: 'کاهش هزینه ارسال در ساعات کم‌ترافیک',
    expected: 'ریسک نارضایتی مشتری', owner: 'عامل هوشمند', status: 'rejected',
    preview: 'ارسال در ساعت ۲ بامداد — رد شد به دلیل زمان‌بندی نامناسب و مزاحمت.',
  },
  {
    id: 14, title: 'حذف خودکار لیدهای غیرفعال', desc: 'پاک‌سازی ۸۹ لید بدون تعامل در ۹۰ روز', type: 'پیام حساس', typeIcon: 'fa-solid fa-trash',
    date: '۵ روز پیش', priority: 'normal', risk: 'high', reason: 'بهبود کیفیت پایگاه داده',
    expected: 'ریسک از دست دادن لید بالقوه', owner: 'عامل هوشمند', status: 'rejected',
    preview: 'حذف ۸۹ لید — رد شد؛ ابتدا کمپین بازفعال‌سازی اجرا شود.',
  },
  {
    id: 15, title: 'پیشنهاد تخفیف به رقبای مستقیم', desc: 'ارسال پیشنهاد ویژه به شرکت‌های همکار رقیب', type: 'پیام حساس', typeIcon: 'fa-solid fa-triangle-exclamation',
    date: '۶ روز پیش', priority: 'high', risk: 'high', reason: 'جذب مشتری از بازار رقیب',
    expected: 'ریسک واکنش منفی برند', owner: 'عامل هوشمند', status: 'rejected',
    preview: 'ارسال پیشنهاد به فهرست رقبا — رد شد به دلیل ریسک اعتباری.',
  },
];

export const RISK_META: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  high: { label: 'ریسک بالا', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  medium: { label: 'ریسک متوسط', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  low: { label: 'ریسک پایین', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
};

// ---------- SEGMENTS ----------
export interface Segment {
  id: number;
  name: string;
  desc: string;
  size: string;
  growth: string;
  color: string;
  icon: string;
  penetration: number;
  conversion: string;
  engagement: string;
  value: string;
  updated: string;
  dataSource: string;
  rules: string[];
  campaigns: string[];
  overlap: { name: string; pct: number }[];
  aiSuggestion: string;
}

export const MOCK_SEGMENTS: Segment[] = [
  {
    id: 1, name: 'کسب‌وکارهای کوچک', desc: 'فروشگاه‌ها و مغازه‌دارهای محلی', size: '۲,۴۰۰', growth: '+۱۲%', color: '#3B82F6',
    icon: 'fa-solid fa-store', penetration: 35, conversion: '۴.۲٪', engagement: '۶۸٪', value: '۱.۲ میلیارد', updated: 'امروز', dataSource: 'CRM + فرم سایت',
    rules: ['تعداد کارمند < ۱۰', 'صنعت: خرده‌فروشی', 'منطقه: شهری'],
    campaigns: ['بلاگ و محتوای آموزشی', 'کمپین پیامکی جشنواره'],
    overlap: [{ name: 'فریلنسرها', pct: 18 }, { name: 'شرکت‌های متوسط', pct: 9 }],
    aiSuggestion: 'بیشترین رشد را دارند. تمرکز بودجه پیامکی روی این سگمنت پیشنهاد می‌شود.',
  },
  {
    id: 2, name: 'شرکت‌های متوسط', desc: 'شرکت‌های ۱۰ تا ۵۰ نفره', size: '۸۵۰', growth: '+۸%', color: '#8B5CF6',
    icon: 'fa-solid fa-building', penetration: 22, conversion: '۶.۸٪', engagement: '۷۴٪', value: '۳.۵ میلیارد', updated: 'دیروز', dataSource: 'CRM',
    rules: ['تعداد کارمند ۱۰ تا ۵۰', 'دارای واحد فروش'],
    campaigns: ['ایمیل معرفی محصول جدید', 'کمپین بهاره ۱۴۰۵'],
    overlap: [{ name: 'سازمان‌های بزرگ', pct: 12 }],
    aiSuggestion: 'بالاترین نرخ تبدیل را دارند. ارزش سرمایه‌گذاری بیشتر روی محتوای تخصصی.',
  },
  {
    id: 3, name: 'سازمان‌های بزرگ', desc: 'سازمان‌ها و هلدینگ‌ها', size: '۱۲۰', growth: '+۳%', color: '#EC4899',
    icon: 'fa-solid fa-city', penetration: 10, conversion: '۸.۵٪', engagement: '۸۱٪', value: '۸.۲ میلیارد', updated: '۳ روز پیش', dataSource: 'فروش مستقیم',
    rules: ['تعداد کارمند > ۵۰', 'بودجه سالانه بالا'],
    campaigns: ['تبلیغات گوگل ادز'],
    overlap: [{ name: 'شرکت‌های متوسط', pct: 12 }],
    aiSuggestion: 'چرخه فروش طولانی اما ارزش بالا. تمرکز روی فروش مشاوره‌ای.',
  },
  {
    id: 4, name: 'فریلنسرها', desc: 'افراد مستقل و خوداشتغال', size: '۵,۲۰۰', growth: '+۲۵%', color: '#10B981',
    icon: 'fa-solid fa-laptop-code', penetration: 45, conversion: '۳.۱٪', engagement: '۵۹٪', value: '۹۸۰ میلیون', updated: 'امروز', dataSource: 'شبکه‌های اجتماعی',
    rules: ['نوع: فردی', 'فعال در شبکه‌های اجتماعی'],
    campaigns: ['کمپین بهاره ۱۴۰۵'],
    overlap: [{ name: 'کسب‌وکارهای کوچک', pct: 18 }],
    aiSuggestion: 'سریع‌ترین رشد. کمپین‌های ویدیویی اینستاگرام بیشترین اثر را دارند.',
  },
];

// ---------- PERSONAS ----------
export interface Persona {
  id: number;
  name: string;
  age: string;
  avatar: string;
  desc: string;
  color: string;
  goals: string[];
  pains: string[];
  channels: string[];
  suggestedMessage: string;
  relatedSegments: string[];
}

export const MOCK_PERSONAS: Persona[] = [
  {
    id: 1, name: 'مدیر کسب‌وکار سنتی', age: '۳۵-۵۵', avatar: '👨‍💼', desc: 'صاحب کسب‌وکاری که به‌دنبال دیجیتالی شدن است', color: '#3B82F6',
    goals: ['کاهش هزینه‌ها', 'دیجیتالی شدن', 'مدیریت بهتر'],
    pains: ['عدم آشنایی با تکنولوژی', 'مقاومت تیم', 'هزینه اولیه'],
    channels: ['تماس تلفنی', 'حضوری', 'واتساپ'],
    suggestedMessage: 'با نورا بدون دانش فنی، کسب‌وکارتان را هوشمند کنید — راه‌اندازی در یک روز.',
    relatedSegments: ['کسب‌وکارهای کوچک'],
  },
  {
    id: 2, name: 'استارتاپ‌دار جوان', age: '۲۵-۳۵', avatar: '👩‍💻', desc: 'بنیان‌گذار جوان به‌دنبال رشد سریع', color: '#10B981',
    goals: ['رشد سریع', 'اتوماسیون', 'مقیاس‌پذیری'],
    pains: ['بودجه محدود', 'نیاز به سرعت', 'رقابت بالا'],
    channels: ['اینستاگرام', 'لینکدین', 'ایمیل'],
    suggestedMessage: 'با نورا تیم کوچکت رو ۱۰ برابر کن — اتوماسیون کامل با قیمت استارتاپی.',
    relatedSegments: ['فریلنسرها', 'شرکت‌های متوسط'],
  },
  {
    id: 3, name: 'مدیر مالی شرکت', age: '۳۰-۵۰', avatar: '🧑‍💼', desc: 'مدیر مالی به‌دنبال شفافیت و گزارش‌گیری', color: '#8B5CF6',
    goals: ['گزارش‌گیری دقیق', 'صرفه‌جویی', 'شفافیت'],
    pains: ['سیستم‌های پراکنده', 'خطای انسانی', 'وقت‌گیر بودن'],
    channels: ['ایمیل', 'وبینار', 'دمو آنلاین'],
    suggestedMessage: 'گزارش‌های مالی دقیق و لحظه‌ای با نورا — پایان کار با اکسل‌های پراکنده.',
    relatedSegments: ['شرکت‌های متوسط', 'سازمان‌های بزرگ'],
  },
];

// ---------- CAMPAIGNS ----------
export interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'social' | 'ads' | 'sms' | 'content';
  status: 'active' | 'paused' | 'completed' | 'draft';
  goal: string;
  segment: string;
  budget: string;
  spent: string;
  startDate: string;
  endDate: string;
  reach: string;
  clicks: string;
  conversions: string;
  cpa: string;
  revenue: string;
  roi: string;
  channel: string;
  owner: string;
}

export const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 'c1', name: 'کمپین بهاره ۱۴۰۵', type: 'social', status: 'active', goal: 'جذب لید', segment: 'فریلنسرها', budget: '۵۰,۰۰۰,۰۰۰', spent: '۳۲,۵۰۰,۰۰۰', startDate: '۱۴۰۵/۰۱/۰۱', endDate: '۱۴۰۵/۰۱/۳۱', reach: '۱۲۵,۰۰۰', clicks: '۸,۷۴۰', conversions: '۳۴۲', cpa: '۹۵,۰۰۰', revenue: '۲۱۰,۰۰۰,۰۰۰', roi: '+۳۲۰٪', channel: 'اینستاگرام', owner: 'تیم بازاریابی' },
  { id: 'c2', name: 'ایمیل معرفی محصول جدید', type: 'email', status: 'active', goal: 'معرفی محصول', segment: 'شرکت‌های متوسط', budget: '۱۵,۰۰۰,۰۰۰', spent: '۱۲,۸۰۰,۰۰۰', startDate: '۱۴۰۴/۱۲/۱۵', endDate: '۱۴۰۵/۰۱/۱۵', reach: '۴۵,۰۰۰', clicks: '۵,۴۰۰', conversions: '۱۸۷', cpa: '۶۸,۰۰۰', revenue: '۹۵,۰۰۰,۰۰۰', roi: '+۲۱۰٪', channel: 'ایمیل', owner: 'عامل هوشمند' },
  { id: 'c3', name: 'تبلیغات گوگل ادز', type: 'ads', status: 'paused', goal: 'افزایش بازدید', segment: 'سازمان‌های بزرگ', budget: '۸۰,۰۰۰,۰۰۰', spent: '۴۵,۲۰۰,۰۰۰', startDate: '۱۴۰۴/۱۱/۰۱', endDate: '۱۴۰۵/۰۲/۳۱', reach: '۲۵۰,۰۰۰', clicks: '۱۸,۶۰۰', conversions: '۵۲۰', cpa: '۸۷,۰۰۰', revenue: '۱۸۰,۰۰۰,۰۰۰', roi: '+۱۸۰٪', channel: 'گوگل', owner: 'تیم بازاریابی' },
  { id: 'c4', name: 'کمپین پیامکی جشنواره', type: 'sms', status: 'completed', goal: 'فروش', segment: 'کسب‌وکارهای کوچک', budget: '۱۰,۰۰۰,۰۰۰', spent: '۱۰,۰۰۰,۰۰۰', startDate: '۱۴۰۴/۱۱/۲۰', endDate: '۱۴۰۴/۱۱/۳۰', reach: '۸۰,۰۰۰', clicks: '۴,۲۰۰', conversions: '۲۸۰', cpa: '۳۶,۰۰۰', revenue: '۱۲۰,۰۰۰,۰۰۰', roi: '+۴۲۰٪', channel: 'پیامک', owner: 'عامل هوشمند' },
  { id: 'c5', name: 'بلاگ و محتوای آموزشی', type: 'content', status: 'active', goal: 'جذب لید', segment: 'کسب‌وکارهای کوچک', budget: '۲۰,۰۰۰,۰۰۰', spent: '۸,۵۰۰,۰۰۰', startDate: '۱۴۰۴/۱۰/۰۱', endDate: '۱۴۰۵/۰۳/۳۱', reach: '۹۵,۰۰۰', clicks: '۱۲,۳۰۰', conversions: '۴۱۰', cpa: '۲۱,۰۰۰', revenue: '۱۶۰,۰۰۰,۰۰۰', roi: '+۵۸۰٪', channel: 'وبسایت', owner: 'تیم بازاریابی' },
  { id: 'c6', name: 'کمپین تلگرام عید نوروز', type: 'social', status: 'draft', goal: 'جذب لید', segment: 'فریلنسرها', budget: '۳۰,۰۰۰,۰۰۰', spent: '۰', startDate: '۱۴۰۵/۰۱/۰۱', endDate: '۱۴۰۵/۰۱/۱۳', reach: '—', clicks: '—', conversions: '—', cpa: '—', revenue: '—', roi: '—', channel: 'تلگرام', owner: 'تیم بازاریابی' },
];

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  active: 'فعال', paused: 'متوقف', completed: 'تکمیل‌شده', draft: 'پیش‌نویس',
};
export const CAMPAIGN_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
  paused: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  completed: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
  draft: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
};
export const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  email: 'ایمیل مارکتینگ', social: 'شبکه اجتماعی', ads: 'تبلیغات کلیکی', sms: 'پیامک', content: 'بازاریابی محتوا',
};
export const CAMPAIGN_TYPE_ICONS: Record<string, string> = {
  email: 'fa-solid fa-envelope', social: 'fa-solid fa-share-nodes', ads: 'fa-solid fa-rectangle-ad', sms: 'fa-solid fa-comment-sms', content: 'fa-solid fa-pen-nib',
};

// ---------- CHARTS ----------
export const CONVERSION_DATA = [
  { name: 'فروردین', rate: 2.1 }, { name: 'اردیبهشت', rate: 2.8 }, { name: 'خرداد', rate: 3.5 },
  { name: 'تیر', rate: 3.2 }, { name: 'مرداد', rate: 4.1 }, { name: 'شهریور', rate: 4.8 },
];
export const LEAD_GROWTH_DATA = [
  { name: 'فروردین', leads: 45 }, { name: 'اردیبهشت', leads: 62 }, { name: 'خرداد', leads: 78 },
  { name: 'تیر', leads: 95 }, { name: 'مرداد', leads: 112 }, { name: 'شهریور', leads: 138 },
];
export const CHANNEL_DATA = [
  { name: 'اینستاگرام', value: 35, color: '#E1306C' },
  { name: 'گوگل', value: 25, color: '#4285F4' },
  { name: 'ایمیل', value: 18, color: '#F59E0B' },
  { name: 'معرفی', value: 15, color: '#10B981' },
  { name: 'پیامک', value: 7, color: '#8B5CF6' },
];
export const CAMPAIGN_PERFORMANCE_DATA = [
  { month: 'مهر', reach: 45000, clicks: 3200, conversions: 120 },
  { month: 'آبان', reach: 62000, clicks: 4800, conversions: 185 },
  { month: 'آذر', reach: 78000, clicks: 6100, conversions: 230 },
  { month: 'دی', reach: 95000, clicks: 7500, conversions: 310 },
  { month: 'بهمن', reach: 110000, clicks: 8200, conversions: 380 },
  { month: 'اسفند', reach: 125000, clicks: 8740, conversions: 420 },
];

// Funnel conversion data (for performance page)
export const FUNNEL_PERF = [
  { stage: 'بازدید', value: 100, color: '#3B82F6' },
  { stage: 'لید', value: 42, color: '#8B5CF6' },
  { stage: 'علاقه‌مند', value: 24, color: '#EC4899' },
  { stage: 'پیشنهاد', value: 12, color: '#F59E0B' },
  { stage: 'مشتری', value: 6, color: '#10B981' },
];

// ---------- PERFORMANCE KPIs ----------
export interface KpiItem { label: string; value: string; change: string; icon: string; color: string; note: string; }
export const PERFORMANCE_KPIS: KpiItem[] = [
  { label: 'نرخ تبدیل', value: '۴.۸٪', change: '+۱.۲٪', icon: 'fa-solid fa-arrows-spin', color: '#10B981', note: 'نسبت به ماه قبل' },
  { label: 'لید جدید', value: '۱۳۸', change: '+۲۳٪', icon: 'fa-solid fa-user-plus', color: '#3B82F6', note: 'این ماه' },
  { label: 'هزینه جذب', value: '۸۵K', change: '-۸٪', icon: 'fa-solid fa-coins', color: '#F59E0B', note: 'به ازای هر مشتری' },
  { label: 'درآمد کمپین‌ها', value: '۶۸۵M', change: '+۳۱٪', icon: 'fa-solid fa-sack-dollar', color: '#8B5CF6', note: 'این ماه' },
  { label: 'ROI کلی', value: '۲۸۰٪', change: '+۴۵٪', icon: 'fa-solid fa-chart-line', color: '#EC4899', note: 'بازگشت سرمایه' },
  { label: 'مشتری جدید', value: '۴۲', change: '+۱۸٪', icon: 'fa-solid fa-handshake', color: '#06B6D4', note: 'این ماه' },
];

export const TIME_FILTERS = [
  { id: 'today', label: 'امروز' },
  { id: 'week', label: 'این هفته' },
  { id: 'month', label: 'این ماه' },
  { id: 'quarter', label: 'سه ماه اخیر' },
];

export const PERFORMANCE_INSIGHT =
  'کمپین اینستاگرام نرخ تبدیل خوبی دارد، اما هزینه جذب مشتری نسبت به هفته قبل ۱۸٪ افزایش یافته است. پیشنهاد می‌شود بخشی از بودجه کمپین گوگل به کمپین پیامکی منتقل شود.';

// ---------- CALENDAR ----------
export interface CalendarEvent {
  id: number;
  title: string;
  type: 'email' | 'sms' | 'social' | 'meeting' | 'report' | 'followup' | 'event';
  date: string;
  day: number; // day of month
  time: string;
  color: string;
  icon: string;
}

export const CALENDAR_EVENTS: CalendarEvent[] = [
  { id: 1, title: 'انتشار کمپین بهاره', type: 'social', date: '۱ فروردین', day: 1, time: '۰۹:۰۰', color: '#E1306C', icon: 'fa-solid fa-share-nodes' },
  { id: 2, title: 'ارسال ایمیل هفتگی', type: 'email', date: '۳ فروردین', day: 3, time: '۱۰:۰۰', color: '#F59E0B', icon: 'fa-solid fa-envelope' },
  { id: 3, title: 'کمپین پیامکی جشنواره', type: 'sms', date: '۵ فروردین', day: 5, time: '۱۲:۰۰', color: '#8B5CF6', icon: 'fa-solid fa-comment-sms' },
  { id: 4, title: 'جلسه تیم بازاریابی', type: 'meeting', date: '۷ فروردین', day: 7, time: '۱۴:۰۰', color: '#3B82F6', icon: 'fa-solid fa-users' },
  { id: 5, title: 'موعد گزارش هفتگی', type: 'report', date: '۷ فروردین', day: 7, time: '۱۷:۰۰', color: '#10B981', icon: 'fa-solid fa-file-lines' },
  { id: 6, title: 'پیگیری کمپین گوگل', type: 'followup', date: '۱۰ فروردین', day: 10, time: '۱۱:۰۰', color: '#06B6D4', icon: 'fa-solid fa-rotate' },
  { id: 7, title: 'پست شبکه اجتماعی', type: 'social', date: '۱۲ فروردین', day: 12, time: '۱۸:۰۰', color: '#E1306C', icon: 'fa-solid fa-share-nodes' },
  { id: 8, title: 'مناسبت: روز طبیعت', type: 'event', date: '۱۳ فروردین', day: 13, time: 'تمام روز', color: '#EF4444', icon: 'fa-solid fa-star' },
];

export const CALENDAR_TYPE_LABELS: Record<string, string> = {
  email: 'ایمیل', sms: 'پیامک', social: 'شبکه اجتماعی', meeting: 'جلسه', report: 'گزارش', followup: 'پیگیری', event: 'مناسبت',
};

// ---------- AI QUICK ACTIONS (contextual, per screen) ----------
export const MKT_QUICK_ACTIONS: Record<string, { icon: string; label: string }[]> = {
  mktConversationsScreen: [
    { icon: 'fa-solid fa-inbox', label: 'گفتگوهای نیازمند پاسخ را نشان بده' },
    { icon: 'fa-solid fa-pen', label: 'برای این پیام پاسخ بنویس' },
    { icon: 'fa-solid fa-circle-check', label: 'اقدامات نیازمند تأیید را نمایش بده' },
  ],
  mktLeadsScreen: [
    { icon: 'fa-solid fa-fire', label: 'لیدهای داغ امروز را نشان بده' },
    { icon: 'fa-solid fa-bell-slash', label: 'لیدهای بدون پیگیری را پیدا کن' },
    { icon: 'fa-solid fa-snowflake', label: 'برای لیدهای سرد برنامه فعال‌سازی بده' },
    { icon: 'fa-solid fa-comment-dots', label: 'برای این لید پیام آماده کن' },
    { icon: 'fa-solid fa-arrow-right', label: 'اقدام بعدی این لید را پیشنهاد بده' },
  ],
  campaignScreen: [
    { icon: 'fa-solid fa-wand-magic-sparkles', label: 'کمپین جدید طراحی کن' },
    { icon: 'fa-solid fa-magnifying-glass-chart', label: 'کمپین‌های ضعیف را تحلیل کن' },
    { icon: 'fa-solid fa-scale-balanced', label: 'بودجه کمپین‌ها را بهینه کن' },
    { icon: 'fa-solid fa-pen-nib', label: 'متن تبلیغاتی تولید کن' },
    { icon: 'fa-solid fa-layer-group', label: 'سگمنت مناسب این کمپین را پیشنهاد بده' },
  ],
  mktSegmentScreen: [
    { icon: 'fa-solid fa-layer-group', label: 'سگمنت جدید پیشنهاد بده' },
    { icon: 'fa-solid fa-user-tag', label: 'پرسونا بساز' },
    { icon: 'fa-solid fa-star', label: 'سگمنت‌های پربازده را نشان بده' },
    { icon: 'fa-solid fa-clone', label: 'هم‌پوشانی سگمنت‌ها را تحلیل کن' },
  ],
  mktPerformanceScreen: [
    { icon: 'fa-solid fa-calendar-day', label: 'عملکرد ماه را خلاصه کن' },
    { icon: 'fa-solid fa-triangle-exclamation', label: 'مشکل اصلی را پیدا کن' },
    { icon: 'fa-solid fa-trophy', label: 'بهترین کمپین را نمایش بده' },
    { icon: 'fa-solid fa-lightbulb', label: 'برای ماه بعد پیشنهاد بده' },
    { icon: 'fa-solid fa-file-lines', label: 'گزارش مدیریتی آماده کن' },
  ],
};
