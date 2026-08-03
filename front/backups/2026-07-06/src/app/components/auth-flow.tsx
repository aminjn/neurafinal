import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './app-context';
import { toFa } from './data';
import { EuAvatar } from './eu-spectrum-avatar';

const LOGO = 'src/assets/neura-logo-blue.png';

// ============================================================
// SPLASH — 2s logo screen (auto-advances via context timer)
// ============================================================
export function SplashScreen() {
  return (
    <div className="h-full w-full relative overflow-hidden" style={{ background: '#3a2566' }}>
      <motion.img
        src="src/assets/splash.png"
        alt="Neura"
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'cover', objectPosition: 'center' }}
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
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
  { img: 'src/assets/home/svc-tasks.png', title: 'مدیریت وظایف', desc: 'تقسیم و پیگیری کارها به صورت خودکار' },
  { img: 'src/assets/home/svc-office.png', title: 'اتوماسیون اداری', desc: 'انجام سریع کارهای اداری، مالی و برنامه‌ریزی' },
  { img: 'src/assets/home/svc-global.png', title: 'ارتباط جهانی', desc: 'تعامل فوری و چندزبانه با شرکت‌ها از هر نقطه دنیا' },
];

// 6 hireable agent roles shown as cards on the landing page
const AGENT_CARDS = [
  {
    id: 'assistant', name: 'دستیار شخصی', icon: 'fa-user-astronaut', color: '#6366F1',
    tagline: 'دستیار هوشمند روزمره شما',
    desc: 'مدیریت امور شخصی، یادآوری‌ها، برنامه‌ریزی روزانه، جستجوی هوشمند و هماهنگی کارها. سفارش غذا، خرید از مارکت و پشتیبانی همه در یک جا.',
    features: ['برنامه‌ریزی و یادآوری هوشمند', 'سفارش غذا و خرید آنلاین', 'جستجو و دستیار گفتگومحور'],
    price: '۲۹۰,۰۰۰',
  },
  {
    id: 'secretary', name: 'منشی', icon: 'fa-calendar-check', color: '#EC4899',
    tagline: 'هماهنگ‌کننده جلسات و تقویم',
    desc: 'مدیریت تقویم و جلسات، یادآوری قرارها، ثبت سرنخ‌ها، برنامه‌ریزی وظایف و ارتباط با مشتریان به‌صورت خودکار.',
    features: ['مدیریت تقویم و جلسات', 'یادآوری و برنامه‌ریزی وظایف', 'ثبت و پیگیری سرنخ‌ها'],
    price: '۳۹۰,۰۰۰',
  },
  {
    id: 'marketing', name: 'بازاریاب', icon: 'fa-bullhorn', color: '#3B82F6',
    tagline: 'متخصص بازاریابی دیجیتال',
    desc: 'طراحی و اجرای کمپین‌های بازاریابی، تحلیل رقبا، مدیریت شبکه‌های اجتماعی و ایمیل، و امتیازدهی به سرنخ‌ها بر اساس داده.',
    features: ['کمپین‌های ایمیل و شبکه اجتماعی', 'تحلیل رقبا و بازار', 'امتیازدهی هوشمند سرنخ'],
    price: '۴۹۰,۰۰۰',
  },
  {
    id: 'procurement', name: 'خرید و تدارکات', icon: 'fa-box-open', color: '#F97316',
    tagline: 'مدیر تأمین و موجودی',
    desc: 'مدیریت تأمین‌کنندگان و سفارشات خرید، کنترل موجودی انبار، ثبت درخواست خرید و پیگیری وضعیت تحویل کالا.',
    features: ['مدیریت تأمین‌کنندگان', 'کنترل موجودی انبار', 'ثبت و پیگیری سفارش خرید'],
    price: '۳۹۰,۰۰۰',
  },
  {
    id: 'finance', name: 'مالی و اداری', icon: 'fa-file-invoice-dollar', color: '#8B5CF6',
    tagline: 'حسابدار و مدیر مالی',
    desc: 'مدیریت دریافت و پرداخت، صدور فاکتور، گزارش‌های مالی، مدیریت اسناد اداری و پیگیری بدهی‌ها و مطالبات.',
    features: ['صدور فاکتور و گزارش مالی', 'مدیریت دریافت و پرداخت', 'مدیریت اسناد اداری'],
    price: '۴۹۰,۰۰۰',
  },
  {
    id: 'sales', name: 'فروشنده و صندوق‌دار', icon: 'fa-cash-register', color: '#10B981',
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
  const { setAppStage, setAuthMode, preTheme, setPreTheme } = useApp();
  const dark = preTheme === 'dark';
  const { PAGE_BG, GLASS, TXT, CIRCLE_BG, CIRCLE_SHADOW } = prePalette(dark);
  const go = (mode: 'login' | 'register') => { setAuthMode(mode); setAppStage('auth'); };
  const toggle = () => setPreTheme(dark ? 'light' : 'dark');
  const [picked, setPicked] = useState<typeof AGENT_CARDS[number] | null>(null);

  return (
    <div className="h-full w-full overflow-y-auto aw-scroll" dir="rtl" style={{ background: PAGE_BG }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-[46px] pb-3">
        <div className="flex items-center gap-3">
          <ThemeToggle dark={dark} onToggle={toggle} tint={dark ? '#cdb9ff' : '#5c4abd'} />
          <button onClick={() => go('login')} className="bg-transparent border-none cursor-pointer p-0" style={{ color: TXT }}>
            <i className="fa-solid fa-gear text-[19px]" />
          </button>
          <button onClick={() => go('login')} className="bg-transparent border-none cursor-pointer p-0" style={{ color: dark ? '#cdb9ff' : '#5c4abd' }}>
            <i className="fa-solid fa-magnifying-glass text-[19px]" />
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ fontFamily: "'Neogrey','Space Grotesk',sans-serif", fontWeight: 500, fontSize: 22, color: TXT }}>Neura</span>
          <img src={LOGO} alt="" className="w-[30px] h-[30px] object-contain" />
        </div>
      </div>

      {/* Intro video */}
      <motion.div className="mx-4 mt-1 relative overflow-hidden" style={{ ...GLASS, borderRadius: 26 }}
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="relative w-full flex items-center justify-center" style={{ aspectRatio: '16 / 9', background: dark ? 'linear-gradient(135deg,#1c1830,#241d3d)' : 'linear-gradient(135deg,#e9e3ff,#f3eeff)' }}>
          <button onClick={() => go('register')} aria-label="پخش ویدئو معرفی"
            className="w-[64px] h-[64px] rounded-full border-none cursor-pointer flex items-center justify-center"
            style={{ background: PURPLE, boxShadow: PURPLE_GLOW }}>
            <i className="fa-solid fa-play text-white text-[22px]" style={{ marginRight: -3 }} />
          </button>
          <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
            <i className="fa-solid fa-circle-play text-[13px]" style={{ color: TXT }} />
            <span className="text-[11px]" style={{ color: TXT, fontWeight: 600 }}>ویدئو معرفی نـورا</span>
          </div>
        </div>
      </motion.div>

      {/* Agents grid */}
      <div className="mt-8">
        <SectionHead title="عامل‌های هوشمند نـورا" onMore={() => go('register')} txt={TXT} />
        <div className="grid grid-cols-2 gap-3 px-4">
          {AGENT_CARDS.map((a, i) => (
            <motion.button key={a.id} onClick={() => setPicked(a)}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.05 }}
              className="text-right border-none cursor-pointer overflow-hidden flex flex-col items-start p-4"
              style={{ ...GLASS, borderRadius: 20 }}>
              <span className="w-11 h-11 rounded-[14px] flex items-center justify-center mb-3"
                style={{ background: `${a.color}1f`, color: a.color }}>
                <i className={`fa-solid ${a.icon} text-[19px]`} />
              </span>
              <span className="text-[13.5px] mb-1" style={{ fontWeight: 700, color: TXT }}>{a.name}</span>
              <span className="text-[10px] leading-[1.7]" style={{ color: TXT, opacity: 0.8 }}>{a.tagline}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Enter panel */}
      <div className="px-4 pt-7 pb-7">
        <button onClick={() => go('login')}
          className="w-full border-none cursor-pointer text-white text-[16px] rounded-[14px]"
          style={{ background: PURPLE, padding: '15px', fontWeight: 600, boxShadow: PURPLE_GLOW }}>
          ورود به پنل
        </button>
      </div>

      {/* Agent intro popup */}
      <AnimatePresence>
        {picked && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPicked(null)}>
            <motion.div className="w-full max-w-[480px] rounded-t-[26px] overflow-hidden"
              style={{ background: dark ? '#16121f' : '#ffffff', maxHeight: '88vh' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              onClick={e => e.stopPropagation()}>
              <div className="flex flex-col overflow-y-auto aw-scroll" style={{ maxHeight: '88vh' }}>
                {/* Banner */}
                <div className="relative px-5 pt-6 pb-5 flex items-center gap-4" style={{ background: `linear-gradient(135deg, ${picked.color}, ${picked.color}cc)` }}>
                  <button onClick={() => setPicked(null)} className="absolute top-3 left-3 w-8 h-8 rounded-full border-none bg-white/20 text-white cursor-pointer flex items-center justify-center"><i className="fa-solid fa-xmark text-[15px]" /></button>
                  <span className="w-16 h-16 rounded-[20px] flex items-center justify-center flex-shrink-0 bg-white/22">
                    <i className={`fa-solid ${picked.icon} text-white text-[28px]`} />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-white text-[19px]" style={{ fontWeight: 800 }}>{picked.name}</span>
                    <span className="text-white/90 text-[12px]" style={{ fontWeight: 500 }}>{picked.tagline}</span>
                  </div>
                </div>
                {/* Body */}
                <div className="px-5 py-5 flex flex-col gap-4">
                  <p className="text-[13px] leading-[2.1]" style={{ color: dark ? '#d8d4e6' : '#444' }}>{picked.desc}</p>
                  <div className="flex flex-col gap-2.5">
                    {picked.features.map(f => (
                      <div key={f} className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${picked.color}1f`, color: picked.color }}>
                          <i className="fa-solid fa-check text-[11px]" />
                        </span>
                        <span className="text-[12.5px]" style={{ color: dark ? '#ece9f6' : '#333', fontWeight: 500 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-[20px]" style={{ fontWeight: 800, color: dark ? '#fff' : '#1a1a1a' }}>{picked.price}</span>
                    <span className="text-[12px]" style={{ color: dark ? '#a39fb6' : '#888' }}>تومان / ماه</span>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2.5 mt-1">
                    <button onClick={() => go('register')}
                      className="flex-1 py-3 rounded-[14px] border-none cursor-pointer text-white text-[14px]"
                      style={{ background: picked.color, fontWeight: 700, boxShadow: `0 8px 20px ${picked.color}55` }}>
                      <i className="fa-solid fa-bolt text-[12px] ml-1.5" />خرید و استخدام
                    </button>
                    <button onClick={() => go('login')}
                      className="flex-1 py-3 rounded-[14px] cursor-pointer text-[14px]"
                      style={{ background: 'transparent', border: `1.5px solid ${picked.color}`, color: picked.color, fontWeight: 700 }}>
                      <i className="fa-solid fa-play text-[11px] ml-1.5" />نسخه دمو
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// AUTH — login / register form
// ============================================================
function GlassField({ type = 'text', value, onChange, placeholder, dark }: {
  type?: string; value: string; onChange: (v: string) => void; placeholder: string; dark: boolean;
}) {
  return (
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
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
  const { authMode, setAuthMode, setAppStage, completeAuth, showToast, preTheme, setPreTheme } = useApp();
  const dark = preTheme === 'dark';
  const isLogin = authMode === 'login';
  // stage: 'form' (voice + text) → 'listening' → 'otp'
  const [stage, setStage] = useState<'form' | 'listening' | 'otp'>('listening');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [resend, setResend] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const PURPLE_GRAD = 'linear-gradient(135deg, #8f74ee, #6d4ee0)';
  const DEMO_PHONE = '۰۹۱۲ ۳۴۵ ۶۷۸۹';
  const logoTint = dark ? '#f3f0ff' : '#2a2150';
  const txt = dark ? '#ece9f6' : '#3a3450';
  const mute = dark ? '#a39fb6' : '#8a84a0';

  // resend countdown while on OTP stage
  useEffect(() => {
    if (stage !== 'otp' || resend <= 0) return;
    const t = setInterval(() => setResend(r => (r <= 1 ? 0 : r - 1)), 1000);
    return () => clearInterval(t);
  }, [stage, resend]);

  const mmss = (s: number) => `${toFa(Math.floor(s / 60))}:${toFa(String(s % 60).padStart(2, '0'))}`;

  const goOtp = () => {
    if (!phone.trim()) setPhone(DEMO_PHONE);
    setOtp(['', '', '', '', '', '']);
    setResend(105);
    setStage('otp');
    showToast('کد تأیید ارسال شد');
  };
  const submit = () => {
    if (!isLogin && !name.trim()) { showToast('نام خود را وارد کنید'); return; }
    if (!phone.trim()) { showToast('شماره موبایل یا نام کاربری را وارد کنید'); return; }
    if (!pass.trim()) { showToast('رمز عبور را وارد کنید'); return; }
    showToast(isLogin ? 'خوش آمدید!' : 'حساب شما ساخته شد');
    completeAuth();
  };
  const verifyOtp = () => {
    if (otp.some(d => d === '')) { showToast('کد ۶ رقمی را کامل وارد کنید'); return; }
    showToast('خوش آمدید!');
    completeAuth();
  };
  const setOtpDigit = (i: number, v: string) => {
    const d = v.replace(/[^0-9۰-۹]/g, '').slice(-1);
    setOtp(prev => { const n = [...prev]; n[i] = d; return n; });
    if (d && i < 5) otpRefs.current[i + 1]?.focus();
  };

  // ── shared chrome ──
  const glassCard: React.CSSProperties = dark
    ? { background: 'rgba(22,17,34,0.5)', backdropFilter: 'blur(22px) saturate(1.3)', WebkitBackdropFilter: 'blur(22px) saturate(1.3)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 14px 40px rgba(0,0,0,0.4)' }
    : { background: 'rgba(255,255,255,0.62)', backdropFilter: 'blur(22px) saturate(1.4)', WebkitBackdropFilter: 'blur(22px) saturate(1.4)', border: '1px solid rgba(255,255,255,0.7)', boxShadow: '0 12px 34px rgba(86,56,176,0.16)' };
  const inputStyle: React.CSSProperties = {
    background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)',
    borderRadius: 14, padding: '14px 16px', color: dark ? '#f0eef9' : '#2a2150',
    border: dark ? '0.5px solid rgba(255,255,255,0.14)' : '0.5px solid rgba(255,255,255,0.85)',
    fontFamily: "'Kamand', 'Vazirmatn', sans-serif", fontSize: 14, outline: 'none', width: '100%', textAlign: 'right',
  };
  const headerIcon = (icon: string, onClick?: () => void, dot?: boolean) => (
    <button onClick={onClick} className="relative w-9 h-9 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer" style={{ color: dark ? '#cbb9ff' : '#6a5ba8' }}>
      <i className={`fa-solid ${icon} text-[15px]`} />
      {dot && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#ef4444' }} />}
    </button>
  );
  const linksRow = (
    <div className="w-full flex flex-col gap-2 mt-1">
      <div className="flex items-stretch gap-2">
        <button onClick={() => setAuthMode(isLogin ? 'register' : 'login')}
          className="flex-1 cursor-pointer text-[12px] whitespace-nowrap flex items-center justify-center"
          style={{ ...glassCard, borderRadius: 14, padding: '12px 8px', color: logoTint, fontWeight: 700 }}>
          {isLogin ? 'ثبت‌نام' : 'ورود'}
        </button>
        <button onClick={() => (stage === 'otp' ? setStage('form') : goOtp())}
          className="flex-1 cursor-pointer text-[12px] whitespace-nowrap flex items-center justify-center"
          style={{ ...glassCard, borderRadius: 14, padding: '12px 8px', color: '#8f74ee', fontWeight: 700 }}>
          ورود با رمز یکبار مصرف
        </button>
      </div>
      <button onClick={() => showToast('لینک بازیابی رمز عبور ارسال شد')}
        className="w-full cursor-pointer text-[12px]"
        style={{ ...glassCard, borderRadius: 14, padding: '12px 8px', color: logoTint, fontWeight: 600 }}>
        فراموشی رمز عبور
      </button>
    </div>
  );

  return (
    <div className="h-full w-full relative flex flex-col overflow-hidden">
      {/* Blurred background image */}
      <div className="absolute inset-0 z-0" style={{
        backgroundImage: `url('${dark ? 'src/assets/login-bg-dark.png' : 'src/assets/login-bg.png'}')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'blur(18px)', transform: 'scale(1.12)',
      }} aria-hidden />
      <div className="absolute inset-0 z-0" style={{ background: dark ? 'rgba(12,9,20,0.4)' : 'rgba(255,255,255,0.28)' }} aria-hidden />
      <div className="relative z-10 flex flex-col h-full">
      {/* ===== Header ===== */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
        <div className="flex items-center gap-0.5">
          {headerIcon('fa-gear', () => setPreTheme(dark ? 'light' : 'dark'))}
          {headerIcon('fa-bell', undefined, true)}
          {headerIcon('fa-comment-dots')}
          {headerIcon('fa-arrow-left', () => setAppStage('home'))}
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ fontFamily: "'Neogrey', 'Space Grotesk', sans-serif", fontWeight: 500, fontSize: 20, letterSpacing: 0.5, color: logoTint }}>Neura</span>
          <img src={LOGO} alt="" className="w-6 h-6 object-contain" />
        </div>
      </div>

      {/* ===== Scroll body ===== */}
      <div className="flex-1 overflow-y-auto aw-scroll px-5 pb-3 flex flex-col items-center">
        {/* Avatar */}
        <div className="w-[320px] max-w-full flex items-center justify-center mt-1">
          <EuAvatar palette="cyan" accent="#7b62fc" display speaking={stage !== 'form'} portrait="src/assets/avatar-portrait.png" name="دستیار شخصی" />
        </div>
        {/* Online label */}
        <div className="flex items-center gap-1.5 -mt-1 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} />
          <span className="text-[12.5px]" style={{ color: txt, fontWeight: 600 }}>دستیار شخصی آنلاین</span>
          <i className="fa-solid fa-volume-high text-[11px]" style={{ color: '#8f74ee' }} />
        </div>
        <button onClick={() => setStage('listening')} className="bg-transparent border-none cursor-pointer text-[12px] mb-4 flex items-center gap-1.5" style={{ color: '#8f74ee', fontWeight: 600 }}>
          <i className="fa-solid fa-microphone text-[11px]" />برای صحبت با ایجنت کلیک کنید
        </button>

        {/* ── STAGE: FORM ── */}
        {stage === 'form' && (
          <motion.div key="form" className="w-full max-w-[380px] flex flex-col gap-3"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="w-full flex flex-col gap-2.5 p-3.5" style={{ ...glassCard, borderRadius: 20 }}>
              {!isLogin && <input value={name} onChange={e => setName(e.target.value)} placeholder="نام و نام خانوادگی" style={inputStyle} />}
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={isLogin ? 'شماره موبایل یا نام کاربری' : 'شماره موبایل'} style={inputStyle} />
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="رمز عبور" style={inputStyle} />
              <button onClick={submit} className="w-full border-none cursor-pointer text-white text-[15px]"
                style={{ background: PURPLE_GRAD, borderRadius: 14, padding: '14px', fontWeight: 700, fontFamily: "'Kamand', sans-serif", boxShadow: '0 8px 20px rgba(109,78,224,0.35)' }}>
                {isLogin ? 'ورود' : 'ثبت‌نام و ورود'}
              </button>
            </div>
            {/* Two split buttons */}
            <div className="flex items-stretch gap-2">
              <button onClick={() => setAuthMode(isLogin ? 'register' : 'login')}
                className="flex-1 cursor-pointer text-[12px] whitespace-nowrap flex items-center justify-center"
                style={{ ...glassCard, borderRadius: 14, padding: '12px 8px', color: logoTint, fontWeight: 700 }}>
                {isLogin ? 'ثبت‌نام' : 'ورود'}
              </button>
              <button onClick={goOtp}
                className="flex-1 cursor-pointer text-[12px] whitespace-nowrap flex items-center justify-center"
                style={{ ...glassCard, borderRadius: 14, padding: '12px 8px', color: '#8f74ee', fontWeight: 700 }}>
                ورود با رمز یکبار مصرف
              </button>
            </div>
            {/* Forgot link */}
            <button onClick={() => showToast('لینک بازیابی برای شما ارسال شد')}
              className="w-full text-center bg-transparent border-none cursor-pointer text-[12px]" style={{ color: mute }}>
              فراموشی نام کاربری و رمز عبور
            </button>
          </motion.div>
        )}

        {/* ── STAGE: LISTENING ── */}
        {stage === 'listening' && (
          <motion.div key="listening" className="w-full max-w-[380px] flex flex-col gap-3"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="flex items-center justify-center gap-2 p-3" style={{ ...glassCard, borderRadius: 16 }}>
              <i className="fa-solid fa-volume-high text-[13px]" style={{ color: '#8f74ee' }} />
              <span className="text-[13.5px]" style={{ color: txt, fontWeight: 600 }}>بگو: «ورود با شماره موبایل»</span>
            </div>
            <div className="flex flex-col gap-2 p-4" style={{ ...glassCard, borderRadius: 18 }}>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.span key={i} className="w-1 rounded-full" style={{ background: '#8f74ee' }}
                      animate={{ height: [6, 16, 6] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </span>
                <span className="text-[12.5px]" style={{ color: mute }}>در حال شنیدن...</span>
              </div>
              <div className="text-[14px]" style={{ color: txt, fontWeight: 600 }}>ورود با شماره موبایل {DEMO_PHONE}</div>
              <div className="text-[13px]" style={{ color: mute }}>...</div>
            </div>
            {linksRow}
          </motion.div>
        )}

        {/* ── STAGE: OTP ── */}
        {stage === 'otp' && (
          <motion.div key="otp" className="w-full max-w-[380px] flex flex-col gap-3"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            {/* Assistant message bubble */}
            <div className="p-3.5 relative" style={{ ...glassCard, borderRadius: 18 }}>
              <div className="flex items-start gap-2">
                <p className="text-[13.5px] leading-[2] flex-1" style={{ color: txt, fontWeight: 500 }}>
                  کد برایت ارسال شد. اگر خواستی می‌توانی آن را بخوانی یا تایپ کنی.
                </p>
                <i className="fa-solid fa-volume-high text-[13px] mt-1" style={{ color: '#8f74ee' }} />
              </div>
            </div>
            {/* OTP box */}
            <div className="flex flex-col items-center gap-3 p-4" style={{ ...glassCard, borderRadius: 20 }}>
              <span className="text-[13px]" style={{ color: mute }}>کد ارسال‌شده را وارد کنید</span>
              <div className="flex items-center gap-2" dir="ltr">
                {otp.map((d, i) => (
                  <input key={i} ref={el => { otpRefs.current[i] = el; }} value={d} inputMode="numeric" maxLength={1}
                    onChange={e => setOtpDigit(i, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus(); }}
                    className="text-center outline-none"
                    style={{ width: 42, height: 50, borderRadius: 12, background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.75)', border: `1px solid ${d ? '#8f74ee' : (dark ? 'rgba(255,255,255,0.16)' : 'rgba(124,92,220,0.25)')}`, color: dark ? '#f0eef9' : '#2a2150', fontSize: 20, fontWeight: 800 }} />
                ))}
              </div>
              <div className="flex items-center gap-2 text-[12px]" style={{ color: mute }}>
                {resend > 0
                  ? <span>ارسال مجدد کد {mmss(resend)}</span>
                  : <button onClick={goOtp} className="bg-transparent border-none cursor-pointer" style={{ color: '#8f74ee', fontWeight: 700 }}>ارسال مجدد کد</button>}
              </div>
            </div>
            <button onClick={verifyOtp} className="w-full border-none cursor-pointer text-white text-[15px]"
              style={{ background: PURPLE_GRAD, borderRadius: 14, padding: '14px', fontWeight: 700, fontFamily: "'Kamand', sans-serif", boxShadow: '0 8px 20px rgba(109,78,224,0.35)' }}>
              تأیید و ورود
            </button>
            <button onClick={() => setStage('listening')} className="w-full flex items-center justify-center gap-2 cursor-pointer text-[14px]"
              style={{ ...glassCard, borderRadius: 14, padding: '12px', color: logoTint, fontWeight: 600 }}>
              <i className="fa-solid fa-microphone text-[13px]" style={{ color: '#8f74ee' }} />خواندن کد با صدا
            </button>
            <div className="flex items-center justify-center gap-1.5 text-[11.5px] mt-1" style={{ color: mute }}>
              <i className="fa-solid fa-shield-halved text-[11px]" style={{ color: '#22c55e' }} />
              نـورا هیچ‌وقت کد ورودت را در گفتگو نمی‌خواهد
            </div>
          </motion.div>
        )}
      </div>

      {/* ===== Footer chat bar ===== */}
      <div className="flex-shrink-0 px-3 pb-3 pt-1">
        <div className="flex items-center gap-2 px-2.5 py-2" style={{ ...glassCard, borderRadius: 26 }}>
          <button className="w-9 h-9 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer flex-shrink-0" style={{ color: mute }}>
            <i className="fa-solid fa-plus text-[15px]" />
          </button>
          <input placeholder="پیام خود را بنویسید..." className="flex-1 min-w-0 bg-transparent border-none outline-none text-[13.5px]"
            style={{ color: dark ? '#f0eef9' : '#2a2150', fontFamily: "'Kamand', sans-serif", textAlign: 'right' }} />
          <button onClick={() => setStage('listening')} className="w-9 h-9 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer flex-shrink-0" style={{ color: mute }}>
            <i className="fa-solid fa-microphone text-[15px]" />
          </button>
          <button onClick={() => (stage === 'otp' ? verifyOtp() : stage === 'listening' ? goOtp() : submit())}
            className="w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer flex-shrink-0"
            style={{ background: PURPLE_GRAD, boxShadow: '0 6px 16px rgba(123,98,252,0.4)' }}>
            <i className="fa-solid fa-paper-plane text-white text-[15px]" />
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
