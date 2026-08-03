import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './app-context';
import { ShahkarRegister } from './shahkar-register';
import { api, setToken } from '../services/api';

// ورود با گوگل — واقعی و گِیت‌شده با سوپرادمین (نه ورودِ الکی).
async function __doGoogle(showToast: any, completeAuth: any) {
  try {
    const st: any = await (api as any).getSettings();
    if (!st || !st.googleAuthEnabled || !st.googleClientId) { showToast('ورود با گوگل هنوز فعال نشده است'); return; }
    await new Promise<void>((resolve, reject) => {
      if ((window as any).google && (window as any).google.accounts && (window as any).google.accounts.id) return resolve();
      const sc = document.createElement('script'); sc.src = 'https://accounts.google.com/gsi/client'; sc.async = true;
      sc.onload = () => resolve(); sc.onerror = () => reject(new Error('gsi_load_failed'));
      document.head.appendChild(sc);
    });
    const g = (window as any).google;
    g.accounts.id.initialize({ client_id: st.googleClientId, callback: async (resp: any) => {
      try {
        const r: any = await (api as any).googleLogin(resp && resp.credential);
        if (r && r.needIdentity) { setAuthMode('register'); showToast('برای ادامه باید هویت خود را تأیید کنید'); return; } if (r && r.token) { setToken(r.token); showToast('خوش آمدید!'); completeAuth(); }
      } catch (e: any) {
        showToast((e && e.message === 'google_disabled') ? 'ورود با گوگل فعال نیست' : 'ورود با گوگل ناموفق بود');
      }
    }});
    g.accounts.id.prompt();
  } catch (_e) { showToast('ورود با گوگل در دسترس نیست'); }
}

import { toFa } from './data';
import { EuAvatar } from './eu-spectrum-avatar';

const LOGO = '/src/assets/neura-logo-blue.png';
const MAINLOGO = '/src/assets/0ee60e1dbaa3bcb0e2daccbfdd0200ba026fb510.png';

// ============================================================
// SPLASH — coded splash (no full-bleed PNG): app bg + ambient
// blobs + gradient halo + logo. Auto-advances via context timer.
// Matches the glass theme so the transition into the app is seamless.
// ============================================================
export function SplashScreen() {
  return (
    <div className="h-full w-full relative overflow-hidden flex items-center justify-center" style={{ background: '#0f0d16' }}>
      {/* Ambient blobs — quiet version of the in-app glass background */}
      <motion.div aria-hidden className="absolute rounded-full" style={{ width: 360, height: 360, top: '-14%', right: '-20%', background: 'radial-gradient(circle at 42% 42%, rgba(123,98,252,0.30), transparent 70%)', filter: 'blur(56px)' }}
        animate={{ x: [0, 20, 0], y: [0, 14, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div aria-hidden className="absolute rounded-full" style={{ width: 300, height: 300, bottom: '-12%', left: '-16%', background: 'radial-gradient(circle at 55% 55%, rgba(236,72,153,0.16), transparent 70%)', filter: 'blur(56px)' }}
        animate={{ x: [0, -16, 0], y: [0, -12, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div aria-hidden className="absolute rounded-full" style={{ width: 240, height: 240, top: '36%', left: '8%', background: 'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.12), transparent 70%)', filter: 'blur(48px)' }}
        animate={{ y: [0, 18, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} />

      {/* Gradient halo behind the logo */}
      <motion.div aria-hidden className="absolute rounded-full" style={{ width: 220, height: 220, background: 'conic-gradient(from 210deg, rgba(123,98,252,0), rgba(123,98,252,0.55), rgba(236,72,153,0.30), rgba(123,98,252,0))', filter: 'blur(20px)' }}
        initial={{ scale: 0.55, opacity: 0, rotate: 0 }} animate={{ scale: 1, opacity: 1, rotate: 90 }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }} />

      {/* Logo + wordmark + tagline */}
      <motion.div className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.92, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}>
        <img src={MAINLOGO} alt="Neura" className="h-[78px] w-auto object-contain" style={{ filter: 'drop-shadow(0 10px 30px rgba(123,98,252,0.35))' }} />
        <span style={{ fontFamily: "'Neogrey','Space Grotesk',sans-serif", fontWeight: 600, fontSize: 27, letterSpacing: 1.5, color: '#ece9f6', marginTop: 16 }}>Neura</span>
        <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 0.78, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}
          style={{ fontFamily: "'Kamand','Vazirmatn',sans-serif", fontWeight: 300, fontSize: 13.5, color: '#a39fb6', marginTop: 9, letterSpacing: 0.2 }}>
          همیشه روشن، همیشه همراه
        </motion.span>
      </motion.div>

      {/* Loading dots */}
      <div className="absolute bottom-12 flex items-center gap-1.5" aria-hidden>
        {[0, 1, 2].map(i => (
          <motion.span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: '#7b62fc' }}
            animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1.15, 0.85] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// HOME — first-visit landing (after splash, before auth)
// ============================================================
const PURPLE = '#7b62fc';
const PURPLE_GLOW = '0 8px 22px rgba(123,98,252,0.40)';

// Theme-aware palette for the pre-welcome screens (home / auth)
function prePalette(dark: boolean) {
  return dark
    ? {
        PAGE_BG: '#0f0d16',
        GLASS: {
          background: 'rgba(255,255,255,0.045)',
          backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
          border: '0.5px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 26px rgba(0,0,0,0.4)',
        } as React.CSSProperties,
        TXT: '#ece9f6',
        HEAD: '#f3f0ff',
        MUTE: '#a39fb6',
        CIRCLE_BG: 'rgba(255,255,255,0.06)',
        CIRCLE_SHADOW: '0 6px 16px rgba(0,0,0,0.35)',
      }
    : {
        PAGE_BG: '#eeeeee',
        GLASS: {
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          border: '0.25px solid rgba(255,255,255,0.77)',
          boxShadow: '0 4px 14px rgba(123,98,252,0.13)',
        } as React.CSSProperties,
        TXT: '#565656',
        HEAD: '#3d3d3d',
        MUTE: '#8f8f8f',
        CIRCLE_BG: '#ffffff',
        CIRCLE_SHADOW: '0 6px 16px rgba(108,78,190,0.16)',
      };
}

// Sun / moon light–dark toggle, fixed to the top of the pre-welcome screens
function ThemeToggle({ dark, onToggle, tint }: { dark: boolean; onToggle: () => void; tint: string }) {
  return (
    <button onClick={onToggle} aria-label="تغییر تم"
      className="w-9 h-9 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer transition-colors"
      style={{
        color: tint,
        background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(123,98,252,0.10)',
        border: dark ? '0.5px solid rgba(255,255,255,0.18)' : '0.5px solid rgba(123,98,252,0.20)',
      }}>
      <i className={`fa-solid ${dark ? 'fa-sun' : 'fa-moon'} text-[15px]`} />
    </button>
  );
}

const QUICK = [
  { label: 'صفحه من', icon: 'fa-house' },
  { label: 'اپلیکیشن', icon: 'fa-table-cells-large' },
  { label: 'پشتیبانی', icon: 'fa-headset' },
  { label: 'امکانات', icon: 'fa-plus' },
  { label: 'بیشتر', icon: 'fa-ellipsis' },
];

const SERVICES = [
  { img: '/src/assets/home/svc-tasks.png', title: 'مدیریت وظایف', desc: 'تقسیم و پیگیری کارها به صورت خودکار' },
  { img: '/src/assets/home/svc-office.png', title: 'اتوماسیون اداری', desc: 'انجام سریع کارهای اداری، مالی و برنامه‌ریزی' },
  { img: '/src/assets/home/svc-global.png', title: 'ارتباط جهانی', desc: 'تعامل فوری و چندزبانه با شرکت‌ها از هر نقطه دنیا' },
];
// 6 hireable agent roles shown as cards on the landing page
const AGENT_CARDS = [
  {
    id: 'assistant', name: 'دستیار شخصی', icon: 'fa-user-astronaut', color: '#6366F1', img: '/src/avatars/m4.png',
    tagline: 'دستیار هوشمند روزمره شما',
    desc: 'مدیریت امور شخصی، یادآوری‌ها، برنامه‌ریزی روزانه، جستجوی هوشمند و هماهنگی کارها. سفارش غذا، خرید از مارکت و پشتیبانی همه در یک جا.',
    features: ['برنامه‌ریزی و یادآوری هوشمند', 'سفارش غذا و خرید آنلاین', 'جستجو و دستیار گفتگومحور'],
    price: '۲۹۰,۰۰۰',
  },
  {
    id: 'secretary', name: 'منشی', icon: 'fa-calendar-check', color: '#EC4899', img: '/src/avatars/fw1.png',
    tagline: 'هماهنگ‌کننده جلسات و تقویم',
    desc: 'مدیریت تقویم و جلسات، یادآوری قرارها، ثبت سرنخ‌ها، برنامه‌ریزی وظایف و ارتباط با مشتریان به‌صورت خودکار.',
    features: ['مدیریت تقویم و جلسات', 'یادآوری و برنامه‌ریزی وظایف', 'ثبت و پیگیری سرنخ‌ها'],
    price: '۳۹۰,۰۰۰',
  },
  {
    id: 'marketing', name: 'بازاریاب', icon: 'fa-bullhorn', color: '#3B82F6', img: '/src/avatars/m5.png',
    tagline: 'متخصص بازاریابی دیجیتال',
    desc: 'طراحی و اجرای کمپین‌های بازاریابی، تحلیل رقبا، مدیریت شبکه‌های اجتماعی و ایمیل، و امتیازدهی به سرنخ‌ها بر اساس داده.',
    features: ['کمپین‌های ایمیل و شبکه اجتماعی', 'تحلیل رقبا و بازار', 'امتیازدهی هوشمند سرنخ'],
    price: '۴۹۰,۰۰۰',
  },
  {
    id: 'procurement', name: 'خرید و تدارکات', icon: 'fa-box-open', color: '#F97316', img: '/src/avatars/m2.png',
    tagline: 'مدیر تأمین و موجودی',
    desc: 'مدیریت تأمین‌کنندگان و سفارشات خرید، کنترل موجودی انبار، ثبت درخواست خرید و پیگیری وضعیت تحویل کالا.',
    features: ['مدیریت تأمین‌کنندگان', 'کنترل موجودی انبار', 'ثبت و پیگیری سفارش خرید'],
    price: '۳۹۰,۰۰۰',
  },
  {
    id: 'finance', name: 'مالی و اداری', icon: 'fa-file-invoice-dollar', color: '#8B5CF6', img: '/src/avatars/m3.png',
    tagline: 'حسابدار و مدیر مالی',
    desc: 'مدیریت دریافت و پرداخت، صدور فاکتور، گزارش‌های مالی، مدیریت اسناد اداری و پیگیری بدهی‌ها و مطالبات.',
    features: ['صدور فاکتور و گزارش مالی', 'مدیریت دریافت و پرداخت', 'مدیریت اسناد اداری'],
    price: '۴۹۰,۰۰۰',
  },
  {
    id: 'sales', name: 'فروشنده و صندوق‌دار', icon: 'fa-cash-register', color: '#10B981', img: '/src/avatars/fw3.png',
    tagline: 'مدیر فروش و صندوق',
    desc: 'مدیریت فرآیند فروش، صدور فاکتور فروش، مدیریت محصولات و دسته‌بندی، باشگاه مشتریان و پیگیری سرنخ تا تبدیل به مشتری.',
    features: ['صدور فاکتور و مدیریت فروش', 'مدیریت محصولات و موجودی', 'باشگاه مشتریان و وفاداری'],
    price: '۴۹۰,۰۰۰',
  },
];

function SectionHead({ title, onMore, txt }: { title: string; onMore: () => void; txt: string }) {
  return (
    <div className="flex items-center justify-between px-5 mb-3.5">
      <button onClick={onMore} className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-[10px]" style={{ color: txt, fontWeight: 500 }}>
        <i className="fa-solid fa-chevron-left text-[9px]" />
        مشاهده بیشتر
      </button>
      <h2 className="text-[16px]" style={{ fontWeight: 600, color: txt }}>{title}</h2>
    </div>
  );
}


export function HomeScreen() {
  const { setAppStage, setAuthMode, authMode, completeAuth, showToast, preTheme, setPreTheme, welcomeConfig } = useApp();
  const dark = preTheme === 'dark';
  const { PAGE_BG, GLASS, TXT, HEAD, MUTE, CIRCLE_BG, CIRCLE_SHADOW } = prePalette(dark);
  // Auth now lives inside the landing: agents leave, auth controls arrive — the avatar never moves.
  const [mode, setMode] = useState<'welcome' | 'auth'>('welcome');
  const [authStage, setAuthStage] = useState<'buttons' | 'form' | 'otp'>('buttons');
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCd, setResendCd] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const DEMO_PHONE = '۰۹۱۲ ۳۴۵ ۶۷۸۹';
  const go = (m: 'login' | 'register') => { try { if (localStorage.getItem('aw-token')) { completeAuth(); return; } } catch (_) {} setAuthMode(m); setMode('auth'); setAuthStage(m === 'register' ? 'form' : 'buttons'); };
  const backFromAuth = () => { if (authStage !== 'buttons') setAuthStage('buttons'); else setMode('welcome'); };
  const submitForm = () => {
    if (!phone.trim()) { showToast('شماره موبایل یا ایمیل را وارد کن'); return; }
    if ((authMode === 'register' || /[a-zA-Z@]/.test(phone.trim())) && !pass.trim()) { showToast('رمز عبور را وارد کن'); return; }
    if (authMode === 'register' && !name.trim()) { showToast('نام خود را وارد کن'); return; }
    (async () => {
      const _p = phone.trim();
      const _prompt = (m: string) => (typeof window !== 'undefined' && window.prompt) ? (window.prompt(m) || '').trim() : '';
      // ── ثبت‌نام: فرمِ مرحله‌ایِ شاهکار به‌صورتِ overlay انجام می‌شود (ShahkarRegister).
      //    این‌جا فقط ثبت‌نامِ رمزیِ سادهٔ پشتیبان است (اگر overlay رندر نشد یا شاهکار خاموش بود). ──
      if (authMode === 'register') {
        try {
          const rr: any = await (api as any).register(_p, pass.trim(), (typeof name !== 'undefined' ? name : '').trim());
          if (rr && rr.needIdentity) { setAuthMode('register'); showToast('برای احراز هویت، شماره و کد ملی را وارد کنید'); return; } if (rr && rr.token) { setToken(rr.token); showToast('حساب شما ساخته شد!'); completeAuth(); return; }
          showToast('اطلاعات ثبت‌نام نادرست است');
        } catch (re: any) {
          const st = re && re.status;
          if (st === 409) showToast('این نام کاربری قبلاً ثبت شده؛ وارد شو');
          else if (st === 400) showToast('اطلاعات ناقص است؛ رمز حداقل ۴ کاراکتر');
          else showToast('خطا در اتصال؛ دوباره تلاش کن');
        }
        return;
      }
      // ── ورود: ایمیل → رمز عبور | موبایل → کدِ پیامکی (بدونِ رمز) ──
      if (/[a-zA-Z@]/.test(_p)) {
        const _doLogin = async (_otp?: string) => await (api as any).login(_p, pass.trim(), _otp);
        try {
          let r: any;
          try { r = await _doLogin(); }
          catch (e1: any) {
            if (e1 && (e1.message === 'twofa_required' || e1.message === 'invalid_otp')) {
              const _code = _prompt('کد احراز هویت دو مرحله‌ای (۶ رقمی) یا کد بازیابی را وارد کنید:');
              if (!_code) { showToast('برای ورود، کد دو مرحله‌ای لازم است'); return; }
              r = await _doLogin(_code);
            } else throw e1;
          }
          if (r && r.needIdentity) { setAuthMode('register'); showToast('برای ادامه باید هویت خود را تأیید کنید'); return; } if (r && r.token) { setToken(r.token); showToast('خوش آمدید!'); completeAuth(); }
          else showToast('ایمیل یا رمز عبور اشتباه است');
        } catch (e: any) {
          const _st = e && e.status;
          if (e && e.message === 'invalid_otp') showToast('کد دو مرحله‌ای نادرست است');
          else if (_st === 401) showToast('ایمیل یا رمز عبور اشتباه است');
          else showToast('خطا در اتصال؛ دوباره تلاش کن');
        }
        return;
      }
      // موبایل → ارسالِ کدِ پیامکی و رفتن به صفحهٔ واردکردنِ کدِ بومی (۶ خانه‌ای — بدونِ prompt)
      try {
        await (api as any).otpRequest(_p);
        showToast('کد تأیید پیامک شد');
        setOtp(['', '', '', '', '', '']);
        setAuthStage('otp');
      } catch (e: any) {
        const _m = e && e.message;
        if (_m === 'otp_disabled' || _m === 'ippanel_not_configured') showToast('سرویسِ پیامک فعال نیست؛ با ایمیل و رمز وارد شوید');
        else if (_m === 'shahkar_required') showToast('این شماره ثبت‌نام نشده؛ اول ثبت‌نام کنید');
        else if (_m === 'bad_phone') showToast('شماره موبایل نامعتبر است');
        else showToast('خطا در ورود؛ دوباره تلاش کن');
      }
    })();
  };
  const goOtp = () => { if (!phone.trim()) setPhone(DEMO_PHONE); setOtp(['', '', '', '', '', '']); setAuthStage('otp'); };
  const resendOtp = async () => {
    if (resendCd > 0 || !phone.trim()) return;
    try {
      await (api as any).otpRequest(phone.trim());
      showToast('کد دوباره ارسال شد'); setOtp(['', '', '', '', '', '']); setResendCd(60);
      const _t = setInterval(() => setResendCd((c) => { if (c <= 1) { clearInterval(_t); return 0; } return c - 1; }), 1000);
    } catch (e: any) {
      const _m = e && e.message;
      if (_m === 'otp_disabled' || _m === 'ippanel_not_configured') showToast('سرویسِ پیامک فعال نیست');
      else showToast('ارسال مجدد ناموفق؛ دوباره تلاش کن');
    }
  };
  const setOtpDigit = (i: number, v: string) => {
    const d = v.replace(/[^0-9۰-۹]/g, '').slice(-1);
    setOtp(prev => { const n = [...prev]; n[i] = d; return n; });
    if (d && i < 5) otpRefs.current[i + 1]?.focus();
  };
  const verifyOtp = () => {
    if (otp.join('').length < 6) { showToast('کد ۶ رقمی را کامل وارد کن'); return; }
    (async () => {
      try {
        const _code = otp.join('').replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
        const r: any = await (api as any).otpVerify(phone.trim(), _code);
        if (r && r.needIdentity) { setAuthMode('register'); showToast('برای ادامه باید هویت خود را تأیید کنید'); return; } if (r && r.token) { setToken(r.token); showToast('خوش آمدید!'); completeAuth(); }
        else showToast('کد تأیید نادرست است');
      } catch (e: any) { showToast('خطا در تأیید کد'); }
    })();
  };
  const inputStyle: React.CSSProperties = {
    background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)',
    borderRadius: 14, padding: '14px 16px', color: dark ? '#f0eef9' : '#2a2150',
    border: dark ? '0.5px solid rgba(255,255,255,0.14)' : '0.5px solid rgba(255,255,255,0.85)',
    fontFamily: "'Kamand', 'Vazirmatn', sans-serif", fontSize: 14, outline: 'none', width: '100%', textAlign: 'right' as const,
  };
  const toggle = () => setPreTheme(dark ? 'light' : 'dark');
  const [picked, setPicked] = useState<typeof AGENT_CARDS[number] | null>(null);
  const [sheetFull, setSheetFull] = useState(false);
  // Landing guest chat popup
  const GUEST_LIMIT = 10;
  const [chatOpen, setChatOpen] = useState(false);
  const [chatFull, setChatFull] = useState(false);
  const [cmsgs, setCmsgs] = useState<{ from: 'user' | 'bot'; text: string }[]>([]);
  const [cdraft, setCdraft] = useState('');
  const cUserTurns = cmsgs.filter(m => m.from === 'user').length;
  const cEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { cEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [cmsgs, chatOpen]);
  const landingReply = (t: string): string => {
    const agent = AGENT_CARDS.find(a => t.includes(a.name) || a.name.split(' ').some(w => w.length > 2 && t.includes(w)));
    if (/ثبت.?نام/.test(t)) { setChatOpen(false); go('register'); return 'فرم ثبت‌نام رو همین‌جا برات باز کردم…'; }
    if (/(ورود|لاگین)/.test(t)) { setChatOpen(false); go('login'); return 'گزینه‌های ورود رو همین‌جا برات آوردم…'; }
    if (agent) return `${agent.name} ${agent.tagline} است — ${agent.desc} اشتراکش از ${agent.price} تومان در ماه شروع می‌شود؛ برای جزئیات بیشتر روی مدالش در همین صفحه بزن.`;
    if (/(قیمت|تعرفه|هزینه|چند)/.test(t)) return `اشتراک عامل‌ها از ${AGENT_CARDS[0].price} تومان در ماه شروع می‌شود و هر عامل تعرفه خودش را دارد — اسم هر عامل را بپرسی دقیقش را می‌گویم.`;
    if (/(چی|چه کار|چیکار|معرفی|نورا چیست|نورا چیه)/.test(t)) return 'نورا یک تیم شش‌نفره از عامل‌های هوشمند است: دستیار شخصی، منشی، بازاریاب، فروشنده، خرید و تدارکات، و مالی و اداری — همه با هم برای کسب‌وکار تو کار می‌کنند.';
    if (/(سلام|درود|های|هی)/.test(t)) return 'سلام! من دستیار شخصی نورا هستم 🌟 درباره عامل‌ها و تعرفه‌ها بپرس، یا بنویس «ورود» تا ببرمت داخل پنل.';
    return 'من اینجام که راهنمایی‌ات کنم — درباره هر عامل یا تعرفه‌ها بپرس، یا بنویس «ورود» / «ثبت‌نام» تا مرحله بعد را شروع کنیم.';
  };
  const sendLandingChat = () => {
    const t = cdraft.trim();
    if (!t) return;
    if (cUserTurns >= GUEST_LIMIT) { setCdraft(''); return; }
    const reply = landingReply(t);
    const isLast = cUserTurns + 1 >= GUEST_LIMIT;
    const botText = isLast ? reply + ' (به سقف ۱۰ پیام گفتگوی مهمان رسیدیم — برای ادامه وارد شو.)' : reply;
    setCmsgs(prev => [...prev, { from: 'user', text: t }, { from: 'bot', text: botText }]);
    setCdraft('');
    setChatOpen(true);
  };
  const openAgent = (a: typeof AGENT_CARDS[number]) => { setSheetFull(false); setPicked(a); };

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden" dir="rtl">
      {mode === 'auth' && authMode === 'register' && <ShahkarRegister />}
      {/* Blurred background image — same as login screen */}
      <div className="absolute inset-0 z-0" style={{
        backgroundImage: `url('${dark ? '/src/assets/login-bg-dark.png' : '/src/assets/login-bg.png'}')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'blur(18px)', transform: 'scale(1.12)',
      }} aria-hidden />
      <div className="absolute inset-0 z-0" style={{ background: dark ? 'rgba(12,9,20,0.4)' : 'rgba(255,255,255,0.28)' }} aria-hidden />
      <div className="relative z-10 flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto aw-scroll">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-3" style={{ paddingTop: 'calc(env(safe-area-inset-top, 24px) + 22px)' }}>
        {/* right: theme toggle */}
        <ThemeToggle dark={dark} onToggle={toggle} tint={dark ? '#cdb9ff' : '#5c4abd'} />
        {/* center: main logo + wordmark below */}
        <motion.div className="flex flex-col items-center"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16, transition: { duration: 0.25 } }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <img src={MAINLOGO} alt="Neura" className="h-[46px] w-auto object-contain" style={{ filter: dark ? 'drop-shadow(0 6px 18px rgba(123,98,252,0.35))' : 'drop-shadow(0 6px 14px rgba(123,98,252,0.28))' }} />
          <span style={{ fontFamily: "'Neogrey','Space Grotesk',sans-serif", fontWeight: 600, fontSize: 20, letterSpacing: 1, color: HEAD, marginTop: 4 }}>{welcomeConfig.title}</span>
          {welcomeConfig.subtitle ? (
            <span style={{ fontSize: 11, color: TXT, opacity: 0.75, fontWeight: 500, marginTop: 2, textAlign: 'center' }}>{welcomeConfig.subtitle}</span>
          ) : null}
        </motion.div>
        {/* left: search (welcome) / square back (auth) */}
        {mode === 'welcome' ? (
          <button onClick={() => go('login')} aria-label="جستجو" className="bg-transparent border-none cursor-pointer p-0" style={{ color: dark ? '#cdb9ff' : '#5c4abd' }}>
            <i className="fa-solid fa-magnifying-glass text-[20px]" />
          </button>
        ) : (
          <button onClick={backFromAuth} aria-label="بازگشت"
            className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center"
            style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(123,98,252,0.10)', border: dark ? '0.5px solid rgba(255,255,255,0.18)' : '0.5px solid rgba(123,98,252,0.20)', color: dark ? '#cdb9ff' : '#5c4abd' }}>
            <i className="fa-solid fa-arrow-right text-sm" />
          </button>
        )}
      </div>

      {/* Personal assistant — greets and guides the user from the very first screen */}
      <motion.div className="relative flex flex-col items-center px-5 mt-3 neura-kbhide"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <motion.div layoutId="guide-avatar" className="w-[380px] max-w-full">
          <EuAvatar palette="cyan" accent="#7b62fc" display fixed hideName speaking portrait="/src/assets/avatar-portrait.png" name="دستیار شخصی" />
        </motion.div>
        <div className="flex items-center gap-1.5 -mt-1 mb-2.5">
          <span className="w-2 h-2 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.7)' }} />
          <span className="text-[12.5px]" style={{ color: HEAD, fontWeight: 700 }}>دستیار شخصی همراه شماست</span>
        </div>
      </motion.div>

      {/* Welcome grid <-> in-place auth flow. mode="wait": medallions finish leaving before controls arrive */}
      <AnimatePresence mode="wait">
        {mode === 'welcome' ? (
          <motion.div key="w">
          {/* Agents — circular medallions. Assistant lives at the top of the page, so it's out of the grid;
              finance takes its slot and finance's old slot is a "coming soon" medallion. */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-9 px-5 mt-10 pb-3">
            {([
              AGENT_CARDS.find(x => x.id === 'finance')!,
              AGENT_CARDS.find(x => x.id === 'secretary')!,
              AGENT_CARDS.find(x => x.id === 'marketing')!,
              AGENT_CARDS.find(x => x.id === 'procurement')!,
              'soon' as const,
              AGENT_CARDS.find(x => x.id === 'sales')!,
            ]).map((a, i) => a === 'soon' ? (
              <motion.div key="soon"
                initial={{ opacity: 0, y: 22, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 46, scale: 0.9, transition: { duration: 0.3, delay: i * 0.045, ease: [0.4, 0, 1, 1] } }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex flex-col items-center">
                <span aria-hidden className="absolute rounded-full pointer-events-none" style={{
                  width: 148, height: 148, top: -4,
                  background: `radial-gradient(circle, rgba(123,98,252,${dark ? 0.16 : 0.12}), transparent 68%)`,
                  filter: 'blur(16px)',
                }} />
                <span className="relative rounded-full flex items-center justify-center" style={{
                  width: 118, height: 118,
                  border: dark ? '2px dashed rgba(255,255,255,0.28)' : '2px dashed rgba(90,70,160,0.35)',
                  background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.4)',
                  backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                }}>
                  <i className="fa-solid fa-wand-magic-sparkles text-[30px]" style={{ color: dark ? 'rgba(205,185,255,0.7)' : 'rgba(108,84,232,0.55)' }} />
                </span>
                <span className="relative -mt-4 flex flex-col items-center px-4 py-2 rounded-[16px]" style={{
                  minWidth: 122,
                  background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.6)',
                  border: dark ? '0.75px solid rgba(255,255,255,0.18)' : '0.75px solid rgba(255,255,255,0.85)',
                  boxShadow: dark ? '0 8px 22px rgba(0,0,0,0.3)' : '0 8px 20px rgba(86,56,176,0.12)',
                  backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                }}>
                  <span className="text-[13px] whitespace-nowrap" style={{ fontWeight: 800, color: dark ? '#ece9f6' : '#4a3f70' }}>به‌زودی</span>
                  <span className="text-[8.5px] mt-0.5 whitespace-nowrap" style={{ color: dark ? '#a39fb6' : '#8f8aa8', fontWeight: 600 }}>عامل جدید در راه است</span>
                </span>
              </motion.div>
            ) : (
              <motion.button key={a.id} onClick={() => openAgent(a)}
                initial={{ opacity: 0, y: 22, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 46, scale: 0.9, transition: { duration: 0.3, delay: i * 0.045, ease: [0.4, 0, 1, 1] } }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex flex-col items-center bg-transparent border-none cursor-pointer p-0 active:scale-[0.97] transition-transform">
                {/* Agent-color halo */}
                <span aria-hidden className="absolute rounded-full pointer-events-none" style={{
                  width: 150, height: 150, top: -8,
                  background: `radial-gradient(circle, ${a.color}${dark ? '3d' : '2b'}, transparent 68%)`,
                  filter: 'blur(16px)',
                }} />
                {/* Medallion — gradient ring around a circular portrait */}
                <motion.span className="relative rounded-full p-[3px]"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 4 + (i % 3) * 0.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.45 }}
                  style={{
                    background: `conic-gradient(from 210deg, ${a.color}, ${a.color}44, ${a.color})`,
                    boxShadow: dark ? `0 14px 30px rgba(0,0,0,0.45), 0 4px 14px ${a.color}40` : `0 14px 26px rgba(86,56,176,0.18), 0 4px 14px ${a.color}38`,
                  }}>
                  <span className="block w-[112px] h-[112px] rounded-full overflow-hidden" style={{
                    border: dark ? '2.5px solid rgba(20,16,32,0.9)' : '2.5px solid rgba(255,255,255,0.95)',
                    background: dark ? '#1c1830' : '#f3eeff',
                  }}>
                    <img src={a.img} alt={a.name} className="w-full h-full object-cover object-top pointer-events-none" />
                  </span>
                  {/* Online dot on the ring — top-right so it never collides with the pill */}
                  <span className="absolute top-[7px] right-[7px] w-3.5 h-3.5 rounded-full" style={{
                    background: '#22c55e',
                    border: dark ? '2.5px solid #14101f' : '2.5px solid #ffffff',
                    boxShadow: '0 0 8px rgba(34,197,94,0.7)',
                  }} />
                </motion.span>
                {/* Glass pill — overlaps the medallion */}
                <span className="relative -mt-4 flex flex-col items-center px-4 py-2 rounded-[16px]" style={{
                  minWidth: 122,
                  background: dark
                    ? 'linear-gradient(180deg, rgba(96,70,206,0.72), rgba(123,98,252,0.50))'
                    : 'linear-gradient(180deg, rgba(134,109,244,0.92), rgba(166,146,255,0.76))',
                  border: '0.75px solid rgba(255,255,255,0.45)',
                  boxShadow: dark ? '0 8px 22px rgba(0,0,0,0.4)' : '0 8px 20px rgba(86,56,176,0.24)',
                  backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                }}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: a.color, boxShadow: `0 0 6px ${a.color}` }} />
                    <span className="text-[13px] text-white whitespace-nowrap" style={{ fontWeight: 800, textShadow: '0 1px 3px rgba(52,32,120,0.4)' }}>{a.name}</span>
                  </span>
                  <span className="text-[8.5px] mt-0.5 whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 600 }}>{a.tagline}</span>
                </span>
              </motion.button>
            ))}
          </div>
            {/* spacer so content clears the floating CTA */}
            <div className="pb-[158px]" />
          </motion.div>
        ) : (
          <motion.div key="a" className="px-5 mt-6 pb-[120px] flex flex-col items-center"
            exit={{ opacity: 0, y: 18, transition: { duration: 0.2 } }}>
            <div className="w-full max-w-[380px]">
              <AnimatePresence mode="wait">
                {authStage === 'buttons' && (
                  <motion.div key="btns" className="flex flex-col gap-2"
                    initial={{ opacity: 1 }} exit={{ opacity: 0, y: 14, transition: { duration: 0.18 } }}>
                    <motion.button onClick={() => setAuthStage('form')}
                      initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                      className="w-full cursor-pointer text-[14px] text-white flex items-center justify-center gap-2 border-none"
                      style={{ background: 'linear-gradient(90deg, #8f74ee, #6d4ee0)', borderRadius: 14, padding: '13px 8px', fontWeight: 700, boxShadow: '0 8px 20px rgba(109,78,224,0.32)', fontFamily: "'Kamand', sans-serif" }}>
                      <i className="fa-solid fa-right-to-bracket text-[13px]" />ورود / ثبت‌نام
                    </motion.button>
                    <motion.div className="flex items-stretch gap-2"
                      initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}>
                      <button onClick={() => __doGoogle(showToast, completeAuth)}
                        className="flex-1 cursor-pointer text-[12px] whitespace-nowrap flex items-center justify-center gap-1.5"
                        style={{ ...GLASS, borderRadius: 14, padding: '12px 8px', color: dark ? '#cdb9ff' : '#5c4abd', fontWeight: 700 }}>
                        <i className="fa-brands fa-google text-[12px]" style={{ color: '#EA4335' }} />ورود با گوگل
                      </button>
                      <button onClick={goOtp}
                        className="flex-1 cursor-pointer text-[12px] whitespace-nowrap flex items-center justify-center"
                        style={{ ...GLASS, borderRadius: 14, padding: '12px 8px', color: '#8f74ee', fontWeight: 700 }}>
                        ورود با رمز یکبار مصرف
                      </button>
                    </motion.div>
                    <motion.button onClick={() => { goOtp(); showToast('برای بازیابی، با رمز یکبار‌مصرف وارد شوید'); }}
                      initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="w-full cursor-pointer text-[12px]"
                      style={{ ...GLASS, borderRadius: 14, padding: '12px 8px', color: dark ? '#cdb9ff' : '#5c4abd', fontWeight: 600 }}>
                      فراموشی رمز عبور
                    </motion.button>
                  </motion.div>
                )}
                {authStage === 'form' && (
                  <motion.div key="form" className="flex flex-col gap-2.5"
                    initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14, transition: { duration: 0.18 } }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                    {authMode === 'register' && (
                      <input placeholder="نام و نام خانوادگی" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
                    )}
                    <input placeholder="موبایل یا ایمیل" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} inputMode="tel" />
                    {(authMode !== 'login' || /[a-zA-Z@]/.test(phone)) && <input placeholder="رمز عبور" type="password" value={pass} onChange={e => setPass(e.target.value)} style={inputStyle} />}
                    <button onClick={submitForm}
                      className="w-full cursor-pointer text-[14px] text-white flex items-center justify-center gap-2 border-none mt-1"
                      style={{ background: 'linear-gradient(90deg, #8f74ee, #6d4ee0)', borderRadius: 14, padding: '13px 8px', fontWeight: 700, boxShadow: '0 8px 20px rgba(109,78,224,0.32)', fontFamily: "'Kamand', sans-serif" }}>
                      {authMode === 'register' ? 'ثبت‌نام' : 'ورود'}
                    </button>
                    <button onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}
                      className="w-full text-center bg-transparent border-none cursor-pointer text-[12px]" style={{ color: MUTE, fontWeight: 600 }}>
                      {authMode === 'register' ? 'حساب داری؟ وارد شو' : 'حساب نداری؟ ثبت‌نام کن'}
                    </button>
                  </motion.div>
                )}
                {authStage === 'otp' && (
                  <motion.div key="otp" className="flex flex-col gap-3"
                    initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14, transition: { duration: 0.18 } }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                    <div className="flex items-center justify-center gap-2 p-3" style={{ ...GLASS, borderRadius: 16 }}>
                      <i className="fa-solid fa-volume-high text-[13px]" style={{ color: '#8f74ee' }} />
                      <span className="text-[13px]" style={{ color: TXT, fontWeight: 600 }}>کد ۶ رقمی به {phone || DEMO_PHONE} ارسال شد</span>
                    </div>
                    <div className="flex justify-center gap-2" dir="ltr">
                      {otp.map((d, i) => (
                        <input key={i} value={d} onChange={e => setOtpDigit(i, e.target.value)}
                          onPaste={e => { /* otppaste */ const t = (e.clipboardData.getData('text') || '').replace(/[^0-9]/g, '').slice(0, 6); if (!t) return; e.preventDefault(); const a = ['', '', '', '', '', '']; for (let k = 0; k < t.length; k++) a[k] = t[k]; setOtp(a); otpRefs.current[Math.min(t.length, 5)]?.focus(); }}
                          onKeyDown={e => { if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus(); }}
                          ref={el => { otpRefs.current[i] = el; }} inputMode="numeric" maxLength={1}
                          className="text-center outline-none"
                          style={{ width: 44, height: 52, borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: `1px solid ${d ? '#8f74ee' : 'rgba(255,255,255,0.18)'}`, color: TXT, fontSize: 20, fontWeight: 800 }} />
                      ))}
                    </div>
                    <button onClick={verifyOtp}
                      className="w-full cursor-pointer text-[14px] text-white border-none"
                      style={{ background: 'linear-gradient(90deg, #8f74ee, #6d4ee0)', borderRadius: 14, padding: '13px 8px', fontWeight: 700, boxShadow: '0 8px 20px rgba(109,78,224,0.32)', fontFamily: "'Kamand', sans-serif" }}>
                      تأیید کد
                    </button>
                    <button onClick={resendOtp} disabled={resendCd > 0}
                      className="w-full text-center mt-3 text-[13px] bg-transparent border-none cursor-pointer"
                      style={{ color: resendCd > 0 ? MUTE : '#8f74ee', fontWeight: 600, opacity: resendCd > 0 ? 0.7 : 1 }}>
                      {resendCd > 0 ? ('ارسال مجدد کد تا ' + resendCd + ' ثانیه') : 'ارسال مجدد کد'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Enter — pinned CTA + typing bar over a progressive glass backdrop:
          full blur/tint at the very bottom, fading to semi-transparent at the top edge */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-5 pb-6 pt-9 pointer-events-none">
        <div aria-hidden className="absolute inset-0" style={{
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          WebkitMaskImage: 'linear-gradient(to top, black 0%, black 58%, rgba(0,0,0,0.45) 82%, transparent 100%)',
          maskImage: 'linear-gradient(to top, black 0%, black 58%, rgba(0,0,0,0.45) 82%, transparent 100%)',
          background: dark
            ? 'linear-gradient(to top, rgba(15,13,22,0.60) 0%, rgba(15,13,22,0.28) 55%, rgba(15,13,22,0) 100%)'
            : 'linear-gradient(to top, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.25) 55%, rgba(255,255,255,0) 100%)',
        }} />
        <AnimatePresence>
        {mode === 'welcome' && (
        <motion.button onClick={() => go('login')}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="relative w-full cursor-pointer text-[17px] text-white border-none rounded-[999px] flex items-center justify-center gap-2 pointer-events-auto"
          style={{
            background: 'linear-gradient(90deg, #8f74ee, #6d4ee0)',
            padding: '16px',
            fontWeight: 700,
            fontFamily: "'Kamand','Vazirmatn',sans-serif",
            boxShadow: '0 12px 28px rgba(109,78,224,0.45), 0 4px 12px rgba(0,0,0,0.18), inset 0 1px 1px rgba(255,255,255,0.35)',
          }}>
          {welcomeConfig.cta}
          <i className="fa-solid fa-arrow-left text-[13px]" />
        </motion.button>
        )}
        </AnimatePresence>
        {/* Typing bar — same pattern as the agent conversations; send opens the chat popup */}
        <div className="relative flex items-center gap-2 mt-2.5 pointer-events-auto" style={{ marginTop: mode === 'welcome' ? 10 : 0 }}>
          <div className="flex-1 flex items-center gap-2 min-w-0" style={{ ...GLASS, height: 44, borderRadius: 9999, paddingRight: 12, paddingLeft: 12 }}>
            <i className="fa-solid fa-comment-dots text-[14px] flex-shrink-0" style={{ color: MUTE }} />
            <input placeholder="از دستیار شخصی بپرس..." className="flex-1 min-w-0 bg-transparent border-none outline-none text-[13.5px]"
              value={cdraft} onChange={e => setCdraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendLandingChat(); }}
              style={{ color: dark ? '#f0eef9' : '#2a2150', fontFamily: "'Kamand', sans-serif", textAlign: 'right' }} />
          </div>
          <button onClick={sendLandingChat}
            className="flex-shrink-0 flex items-center justify-center rounded-full border-none cursor-pointer"
            style={{ width: 44, height: 44, background: 'linear-gradient(90deg, #8f74ee, #6d4ee0)', boxShadow: 'inset 2px 2px 1px 0px rgba(255,255,255,0.4), 2px 4px 6px rgba(0,0,0,0.25)', border: dark ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.85)' }}>
            <i className="fa-solid fa-paper-plane text-white text-[16px]" />
          </button>
        </div>
      </div>

      {/* Agent sheet — 70% glass panel: talking-avatar stage on top, details, actions */}
      <AnimatePresence>
        {picked && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(10,8,18,0.45)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPicked(null)}>
            <motion.div className="w-full max-w-[480px] overflow-hidden flex flex-col"
              animate={{ y: 0, height: sheetFull ? '100%' : '70%', borderTopLeftRadius: sheetFull ? 0 : 28, borderTopRightRadius: sheetFull ? 0 : 28 }}
              style={{
                background: dark
                  ? 'linear-gradient(180deg, rgba(44,36,68,0.55), rgba(26,20,42,0.60))'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(246,243,255,0.60))',
                backdropFilter: 'blur(32px) saturate(1.6)', WebkitBackdropFilter: 'blur(32px) saturate(1.6)',
                borderTop: dark ? '1px solid rgba(255,255,255,0.16)' : '1px solid rgba(255,255,255,0.8)',
                borderLeft: dark ? '0.5px solid rgba(255,255,255,0.10)' : '0.5px solid rgba(255,255,255,0.6)',
                borderRight: dark ? '0.5px solid rgba(255,255,255,0.10)' : '0.5px solid rgba(255,255,255,0.6)',
                boxShadow: dark ? '0 -18px 50px rgba(0,0,0,0.55)' : '0 -18px 50px rgba(86,56,176,0.22)',
              }}
              initial={{ y: '100%', height: '70%' }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              onClick={e => e.stopPropagation()}>
              {/* Tinted aura behind the avatar stage — agent color */}
              <div aria-hidden className="absolute inset-x-0 top-0 pointer-events-none" style={{ height: '54%', background: `radial-gradient(ellipse 72% 88% at 50% 0%, ${picked.color}${dark ? '30' : '26'}, transparent 75%)` }} />

              {/* Handle (tap: fullscreen ⇄ 70%) + square close */}
              <div className="relative z-30 flex-shrink-0 flex items-center justify-center">
                <button onClick={() => setSheetFull(f => !f)} aria-label={sheetFull ? 'کوچک کردن' : 'تمام‌صفحه'}
                  className="bg-transparent border-none cursor-pointer px-10 pt-3 pb-2 flex items-center justify-center">
                  <span className="w-10 h-1 rounded-full transition-all" style={{ background: dark ? 'rgba(255,255,255,0.28)' : 'rgba(60,45,110,0.22)', width: sheetFull ? 26 : 40 }} />
                </button>
                <button onClick={() => setPicked(null)} aria-label="بستن"
                  className="absolute top-2.5 left-4 w-8 h-8 rounded-[10px] border-none cursor-pointer flex items-center justify-center"
                  style={{ background: dark ? 'rgba(255,255,255,0.10)' : 'rgba(60,45,110,0.08)', color: dark ? '#ece9f6' : '#4a3f70', border: dark ? '0.5px solid rgba(255,255,255,0.16)' : '0.5px solid rgba(60,45,110,0.14)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                  <i className="fa-solid fa-xmark text-[14px]" />
                </button>
              </div>

              {/* Talking-avatar stage — EuAvatar so hooking real speech later is a prop flip */}
              <div className="relative z-10 flex-shrink-0 flex flex-col items-center px-4 mt-5">
                <div className="w-[494px] max-w-full">
                  <EuAvatar palette="cyan" accent={picked.color} display fixed hideName speaking portrait={picked.img} name={picked.name} />
                </div>
                <div className="flex items-center gap-2 -mt-1">
                  <span className="text-[18px]" style={{ fontWeight: 800, color: dark ? '#ffffff' : '#241a45' }}>{picked.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] flex items-center gap-1"
                    style={{ background: `${picked.color}${dark ? '2e' : '1f'}`, color: picked.color, fontWeight: 700, border: `0.75px solid ${picked.color}55` }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.8)' }} />
                    آنلاین
                  </span>
                </div>
                <span className="text-[11.5px] mt-1" style={{ color: dark ? '#a39fb6' : '#6e6590', fontWeight: 600 }}>{picked.tagline}</span>
              </div>

              {/* Scrollable details */}
              <div className="relative flex-1 min-h-0 overflow-y-auto aw-scroll px-6 pt-4 pb-3">
                <p className="text-[13px] leading-[2.1] m-0" style={{ color: dark ? '#d8d4e6' : '#3d3654' }}>{picked.desc}</p>
                <div className="flex flex-col gap-2.5 mt-4">
                  {picked.features.map(f => (
                    <div key={f} className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${picked.color}${dark ? '30' : '1f'}`, color: picked.color }}>
                        <i className="fa-solid fa-check text-[11px]" />
                      </span>
                      <span className="text-[12.5px]" style={{ color: dark ? '#ece9f6' : '#332c50', fontWeight: 500 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pinned footer — price + actions */}
              <div className="relative flex-shrink-0 px-5 pt-3 pb-5 flex flex-col gap-3"
                style={{ borderTop: dark ? '0.5px solid rgba(255,255,255,0.10)' : '0.5px solid rgba(60,45,110,0.10)' }}>
                <div className="flex items-baseline justify-center gap-1.5" dir="rtl">
                  <span className="text-[21px]" style={{ fontWeight: 800, color: dark ? '#fff' : '#241a45' }}>{picked.price}</span>
                  <span className="text-[11.5px]" style={{ color: dark ? '#a39fb6' : '#8a84a0', fontWeight: 500 }}>تومان / ماه</span>
                </div>
                <div className="flex gap-2.5">
                  <button onClick={() => go('register')}
                    className="flex-1 py-3.5 rounded-[999px] cursor-pointer text-[14px]"
                    style={{
                      background: dark ? `${picked.color}33` : `${picked.color}26`,
                      border: `1px solid ${picked.color}88`,
                      color: dark ? '#ffffff' : picked.color,
                      fontWeight: 700,
                      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                      boxShadow: `0 10px 24px ${picked.color}3d, inset 0 1px 1px rgba(255,255,255,0.35)`,
                    }}>
                    <i className="fa-solid fa-bolt text-[12px] ml-1.5" style={{ color: picked.color }} />خرید و استخدام
                  </button>
                  <button onClick={() => go('login')}
                    className="flex-1 py-3.5 rounded-[999px] cursor-pointer text-[14px]"
                    style={{
                      background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.5)',
                      border: dark ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.75)',
                      color: dark ? '#ece9f6' : '#4a3f70',
                      fontWeight: 700,
                      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                      boxShadow: dark ? '0 8px 20px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.12)' : '0 8px 20px rgba(86,56,176,0.14), inset 0 1px 1px rgba(255,255,255,0.8)',
                    }}>
                    <i className="fa-solid fa-play text-[11px] ml-1.5" style={{ color: picked.color }} />نسخه دمو
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Landing chat popup — glass sheet, handle toggles fullscreen, square close */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(10,8,18,0.45)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setChatOpen(false)}>
            <motion.div className="w-full max-w-[480px] overflow-hidden flex flex-col"
              animate={{ y: 0, height: chatFull ? '100%' : '70%', borderTopLeftRadius: chatFull ? 0 : 28, borderTopRightRadius: chatFull ? 0 : 28 }}
              style={{
                background: dark
                  ? 'linear-gradient(180deg, rgba(44,36,68,0.55), rgba(26,20,42,0.60))'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(246,243,255,0.60))',
                backdropFilter: 'blur(32px) saturate(1.6)', WebkitBackdropFilter: 'blur(32px) saturate(1.6)',
                borderTop: dark ? '1px solid rgba(255,255,255,0.16)' : '1px solid rgba(255,255,255,0.8)',
                borderLeft: dark ? '0.5px solid rgba(255,255,255,0.10)' : '0.5px solid rgba(255,255,255,0.6)',
                borderRight: dark ? '0.5px solid rgba(255,255,255,0.10)' : '0.5px solid rgba(255,255,255,0.6)',
                boxShadow: dark ? '0 -18px 50px rgba(0,0,0,0.55)' : '0 -18px 50px rgba(86,56,176,0.22)',
              }}
              initial={{ y: '100%', height: '70%' }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              onClick={e => e.stopPropagation()}>
              {/* Handle (tap: fullscreen ⇄ 70%) + square close */}
              <div className="relative z-30 flex-shrink-0 flex items-center justify-center">
                <button onClick={() => setChatFull(f => !f)} aria-label={chatFull ? 'کوچک کردن' : 'تمام‌صفحه'}
                  className="bg-transparent border-none cursor-pointer px-10 pt-3 pb-2 flex items-center justify-center">
                  <span className="w-10 h-1 rounded-full transition-all" style={{ background: dark ? 'rgba(255,255,255,0.28)' : 'rgba(60,45,110,0.22)', width: chatFull ? 26 : 40 }} />
                </button>
                <button onClick={() => setChatOpen(false)} aria-label="بستن"
                  className="absolute top-2.5 left-4 w-8 h-8 rounded-[10px] border-none cursor-pointer flex items-center justify-center"
                  style={{ background: dark ? 'rgba(255,255,255,0.10)' : 'rgba(60,45,110,0.08)', color: dark ? '#ece9f6' : '#4a3f70', border: dark ? '0.5px solid rgba(255,255,255,0.16)' : '0.5px solid rgba(60,45,110,0.14)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                  <i className="fa-solid fa-xmark text-[14px]" />
                </button>
              </div>
              {/* Assistant mini header */}
              <div className="relative z-10 flex-shrink-0 flex items-center gap-2.5 px-5 pb-2.5">
                <span className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ border: '1.5px solid #8f74ee', background: dark ? '#1c1830' : '#f3eeff' }}>
                  <img src="/src/assets/avatar-portrait.png" alt="دستیار شخصی" className="w-full h-full object-cover object-top" />
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[14px]" style={{ fontWeight: 800, color: dark ? '#fff' : '#241a45' }}>دستیار شخصی</span>
                  <span className="text-[10px] flex items-center gap-1" style={{ color: dark ? '#a39fb6' : '#6e6590', fontWeight: 600 }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.8)' }} />آنلاین — راهنمای شما
                  </span>
                </div>
                <span className="mr-auto text-[10px] px-2 py-0.5 rounded-full" style={{ background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(60,45,110,0.07)', color: cUserTurns >= GUEST_LIMIT ? '#ef4444' : (dark ? '#a39fb6' : '#6e6590'), fontWeight: 700 }}>
                  {toFa(cUserTurns)}/{toFa(GUEST_LIMIT)}
                </span>
              </div>
              {/* Messages */}
              <div className="relative flex-1 min-h-0 overflow-y-auto aw-scroll px-4 py-3 flex flex-col gap-2">
                {cmsgs.map((m, i) => (
                  <motion.div key={`${i}-${m.text.slice(0, 10)}`}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                    className={`max-w-[85%] px-3.5 py-2.5 text-[12.5px] leading-[1.95] ${m.from === 'user' ? 'self-start' : 'self-end'}`}
                    style={m.from === 'user'
                      ? { background: 'linear-gradient(90deg, #8f74ee, #6d4ee0)', color: '#fff', fontWeight: 600, borderRadius: '16px 16px 5px 16px', boxShadow: '0 6px 16px rgba(109,78,224,0.3)' }
                      : { background: dark ? 'rgba(255,255,255,0.94)' : '#ffffff', border: '0.5px solid rgba(255,255,255,0.95)', color: '#3d3654', fontWeight: 500, borderRadius: '16px 16px 16px 5px', boxShadow: dark ? '0 6px 16px rgba(0,0,0,0.3)' : '0 6px 14px rgba(86,56,176,0.12)' }}>
                    {m.from === 'bot' && <i className="fa-solid fa-volume-high text-[10px] ml-1.5" style={{ color: '#8f74ee' }} />}
                    {m.text}
                  </motion.div>
                ))}
                <div ref={cEndRef} />
              </div>
              {/* Input pinned at the sheet bottom — agent-conversation pattern */}
              <div className="relative flex-shrink-0 px-3 pb-4 pt-2" style={{ borderTop: dark ? '0.5px solid rgba(255,255,255,0.10)' : '0.5px solid rgba(60,45,110,0.10)' }}>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 min-w-0" style={{ height: 44, borderRadius: 9999, paddingRight: 12, paddingLeft: 12, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)', border: dark ? '0.5px solid rgba(255,255,255,0.14)' : '0.5px solid rgba(255,255,255,0.9)' }}>
                    <i className="fa-solid fa-microphone text-[15px] flex-shrink-0" style={{ color: dark ? '#a39fb6' : '#8f8aa8' }} />
                    <input placeholder={cUserTurns >= GUEST_LIMIT ? 'سقف گفتگوی مهمان پر شد — وارد شو' : 'پیام خود را بنویسید...'}
                      disabled={cUserTurns >= GUEST_LIMIT}
                      className="flex-1 min-w-0 bg-transparent border-none outline-none text-[13.5px]"
                      value={cdraft} onChange={e => setCdraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendLandingChat(); }}
                      style={{ color: dark ? '#f0eef9' : '#2a2150', fontFamily: "'Kamand', sans-serif", textAlign: 'right' }} />
                  </div>
                  <button onClick={sendLandingChat}
                    className="flex-shrink-0 flex items-center justify-center rounded-full border-none cursor-pointer"
                    style={{ width: 44, height: 44, background: 'linear-gradient(90deg, #8f74ee, #6d4ee0)', opacity: cUserTurns >= GUEST_LIMIT ? 0.45 : 1, boxShadow: 'inset 2px 2px 1px 0px rgba(255,255,255,0.4), 2px 4px 6px rgba(0,0,0,0.25)', border: dark ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.85)' }}>
                    <i className="fa-solid fa-paper-plane text-white text-[16px]" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================
// AUTH — login / register form
// ============================================================
function GlassField({ type = 'text', value, onChange, placeholder, dark, onEnter }: {
  type?: string; value: string; onChange: (v: string) => void; placeholder: string; dark: boolean; onEnter?: () => void;
}) {
  return (
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      onKeyDown={e => { if (e.key === 'Enter' && onEnter) { e.preventDefault(); onEnter(); } }}
      className="w-full outline-none border-none text-[15px] text-right"
      style={{
        background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.5)',
        borderRadius: 16,
        padding: '16px 18px',
        color: dark ? '#f0eef9' : '#2a2150',
        border: dark ? '0.5px solid rgba(255,255,255,0.14)' : 'none',
        boxShadow: dark ? 'inset 0 1px 2px rgba(255,255,255,0.06)' : '0 2px 8px rgba(124,92,220,0.10), inset 0 1px 2px rgba(255,255,255,0.9)',
        fontFamily: "'Kamand', 'Vazirmatn', sans-serif",
      }}
    />
  );
}

export function AuthScreen() {
  // OTP three-step auth (form + phone + code) — همه واقعی
  const { authMode, setAuthMode, setAppStage, completeAuth, showToast, preTheme, setPreTheme } = useApp();
  const dark = preTheme === 'dark';
  const isLogin = authMode === 'login';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [code, setCode] = useState('');
  const [view, setView] = useState<'main' | 'otpPhone' | 'otpCode'>('main');
  const [busy, setBusy] = useState(false);

  // ورود با رمز (برای حساب‌های ادمین/سوپرادمین) — واقعی
  const submitMain = async () => {
    if (!isLogin) { // ثبت‌نام واقعی از طریق پیامک
      if (!name.trim()) { showToast('نام خود را وارد کنید'); return; }
      setView('otpPhone'); return;
    }
    if (!phone.trim()) { showToast('شماره موبایل یا ایمیل را وارد کنید'); return; }
    const _id = phone.trim();
    setBusy(true);
    try {
      if (/[a-zA-Z@]/.test(_id)) {
        if (!pass.trim()) { showToast('رمز عبور را وارد کنید'); setBusy(false); return; }
        const r: any = await api.login(_id, pass);
        if (r && r.needIdentity) { setAuthMode('register'); showToast('برای ادامه باید هویت خود را تأیید کنید'); return; } if (r && r.token) { setToken(r.token); showToast('خوش آمدید!'); completeAuth(); }
        else showToast('ایمیل یا رمز اشتباه است');
      } else {
        // موبایل → کدِ پیامکی؛ به صفحهٔ واردکردنِ کدِ بومیِ AuthScreen برو (view=otpCode) — بدونِ prompt
        await (api as any).otpRequest(_id);
        showToast('کد تأیید پیامک شد');
        setView('otpCode');
      }
    } catch (e: any) {
      const _m = e && e.message;
      if (_m === 'otp_disabled' || _m === 'ippanel_not_configured') showToast('سرویسِ پیامک فعال نیست؛ با ایمیل وارد شوید');
      else if (_m === 'shahkar_required') showToast('این شماره ثبت‌نام نشده؛ اول ثبت‌نام کنید');
      else showToast('ورود ناموفق');
    }
    finally { setBusy(false); }
  };

  const sendCode = async () => {
    if (!phone.trim()) { showToast('شماره موبایل را وارد کنید'); return; }
    setBusy(true);
    try {
      await api.otpRequest(phone.trim());
      setView('otpCode');
      showToast('کد تأیید پیامک شد');
    } catch (e: any) {
      showToast(e?.status === 400 ? 'ورود پیامکی غیرفعال است یا شماره نامعتبر' : 'ارسال کد ناموفق بود');
    } finally { setBusy(false); }
  };

  const verify = async () => {
    if (!code.trim()) { showToast('کد تأیید را وارد کنید'); return; }
    setBusy(true);
    try {
      const r: any = await api.otpVerify(phone.trim(), code.trim());
      if (r && r.needIdentity) { setAuthMode('register'); showToast('برای ادامه باید هویت خود را تأیید کنید'); return; } if (r && r.token) { setToken(r.token); showToast('خوش آمدید!'); completeAuth(); }
      else showToast('کد نادرست است');
    } catch (e: any) {
      showToast(e?.status === 400 ? 'کد نادرست یا منقضی شده' : 'خطا در ورود');
    } finally { setBusy(false); }
  };

  const cardStyle: React.CSSProperties = dark
    ? {
        background: 'rgba(18,14,30,0.46)',
        backdropFilter: 'blur(28px) saturate(1.3)', WebkitBackdropFilter: 'blur(28px) saturate(1.3)',
        borderRadius: 28, border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 24px 70px rgba(0,0,0,0.5)', padding: '40px 28px 32px',
      }
    : {
        background: 'rgba(255,255,255,0.34)',
        backdropFilter: 'blur(28px) saturate(1.4)', WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
        borderRadius: 28, border: '1px solid rgba(255,255,255,0.55)',
        boxShadow: '0 24px 70px rgba(86,56,176,0.28)', padding: '40px 28px 32px',
      };
  const logoTint = dark ? '#f3f0ff' : '#2a2150';
  const accentTint = dark ? '#cdb9ff' : '#5b4ba8';
  const primaryStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #8f74ee, #6d4ee0)',
    borderRadius: 16, padding: '16px', fontWeight: 700,
    fontFamily: "'Kamand', 'Vazirmatn', sans-serif",
    boxShadow: '0 10px 26px rgba(109,78,224,0.4), inset 0 1px 2px rgba(255,255,255,0.5)',
    opacity: busy ? 0.7 : 1,
  };
  const secondaryStyle: React.CSSProperties = {
    background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.5)',
    border: dark ? '1px solid rgba(255,255,255,0.16)' : '1px solid rgba(255,255,255,0.7)',
    borderRadius: 16, padding: '15px', color: logoTint, fontWeight: 600,
    boxShadow: dark ? 'none' : '0 4px 14px rgba(124,92,220,0.12)',
    fontFamily: "'Kamand', 'Vazirmatn', sans-serif",
  };

  const onBack = () => view === 'main' ? setAppStage('home') : (view === 'otpCode' ? setView('otpPhone') : setView('main'));

  return (
    <div className="h-full w-full relative overflow-y-auto aw-scroll" style={{
      backgroundImage: `url('${dark ? 'src/assets/login-bg-dark.png' : 'src/assets/login-bg.png'}')`,
      backgroundSize: 'cover', backgroundPosition: 'center',
    }}>
      <div className="absolute top-[42px] left-5 z-20">
        <ThemeToggle dark={dark} onToggle={() => setPreTheme(dark ? 'light' : 'dark')} tint={dark ? '#e9e2ff' : '#5b4ba8'} />
      </div>

      {authMode === 'register' && <ShahkarRegister />}
      <div className="min-h-full flex items-center justify-center px-5 py-10">
        <motion.div className="w-full max-w-[400px] relative"
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={cardStyle}>
          <button onClick={onBack}
            className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer z-10"
            style={{ color: accentTint }}>
            <i className="fa-solid fa-arrow-right text-[16px]" />
          </button>

          <div className="flex flex-col items-center mb-9">
            <img src={LOGO} alt="Neura" className="w-[88px] h-[88px] object-contain mb-1" />
            <span style={{ fontFamily: "'Neogrey', 'Space Grotesk', sans-serif", fontWeight: 500, fontSize: 32, letterSpacing: 1, color: logoTint }}>neura</span>
          </div>

          {view === 'main' && (
            <>
              <div className="flex flex-col gap-3.5">
                {!isLogin && <GlassField value={name} onChange={setName} placeholder="نام و نام خانوادگی" dark={dark} />}
                <GlassField type="tel" value={phone} onChange={setPhone} placeholder={isLogin ? 'شماره موبایل یا نام کاربری' : 'شماره موبایل'} dark={dark} onEnter={submitMain} />
                {isLogin && /[a-zA-Z@]/.test(phone) && <GlassField type="password" value={pass} onChange={setPass} placeholder="رمز عبور" dark={dark} onEnter={submitMain} />}
              </div>
              <button onClick={submitMain} disabled={busy}
                className="w-full mt-4 border-none cursor-pointer text-white text-[16px]" style={primaryStyle}>
                {isLogin ? 'ورود' : 'ادامه و دریافت کد'}
              </button>
              <button onClick={() => setView('otpPhone')}
                className="w-full mt-5 cursor-pointer text-[15px]" style={secondaryStyle}>
                ورود با رمز یکبار مصرف
              </button>
              <div className="flex items-center justify-center gap-1.5 mt-5 text-[14px]">
                <span style={{ color: accentTint }}>{isLogin ? 'هنوز ثبت‌نام نکرده‌اید؟' : 'قبلاً ثبت‌نام کرده‌اید؟'}</span>
                <button className="bg-transparent border-none cursor-pointer text-[14px]" style={{ color: '#8f74ee', fontWeight: 800 }}
                  onClick={() => setAuthMode(isLogin ? 'register' : 'login')}>
                  {isLogin ? 'ثبت‌نام' : 'ورود'}
                </button>
              </div>
            </>
          )}

          {view === 'otpPhone' && (
            <>
              <p className="text-center text-[13px] leading-[2] mb-4" style={{ color: accentTint }}>
                شماره موبایل خود را وارد کنید تا کد تأیید برایتان پیامک شود
              </p>
              <GlassField type="tel" value={phone} onChange={setPhone} placeholder="موبایل یا ایمیل" dark={dark} onEnter={sendCode} />
              <button onClick={sendCode} disabled={busy}
                className="w-full mt-4 border-none cursor-pointer text-white text-[16px]" style={primaryStyle}>
                {busy ? 'در حال ارسال…' : 'دریافت کد تأیید'}
              </button>
            </>
          )}

          {view === 'otpCode' && (
            <>
              <p className="text-center text-[13px] leading-[2] mb-4" style={{ color: accentTint }}>
                کد پیامک‌شده به <span dir="ltr" style={{ fontWeight: 700 }}>{phone}</span> را وارد کنید
              </p>
              <GlassField type="tel" value={code} onChange={setCode} placeholder="کد تأیید" dark={dark} onEnter={verify} />
              <button onClick={verify} disabled={busy}
                className="w-full mt-4 border-none cursor-pointer text-white text-[16px]" style={primaryStyle}>
                {busy ? 'در حال بررسی…' : 'تأیید و ورود'}
              </button>
              <button onClick={sendCode} disabled={busy}
                className="w-full text-center mt-5 text-[14px] bg-transparent border-none cursor-pointer"
                style={{ color: '#8f74ee', fontWeight: 600 }}>
                ارسال مجدد کد
              </button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
