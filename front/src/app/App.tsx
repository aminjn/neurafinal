import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './components/app-context';
const AdminPanel = React.lazy(() => import('./components/admin-panel'));
const EndUserPanel = React.lazy(() => import('./components/end-user-panel'));
import ChatOverlay from './components/chat-overlay';
import { ModalOverlay, CallOverlay, UnifiedCallModal, Toast } from './components/overlays';
import FloatingMicFAB from './components/floating-mic-fab';
import { SplashScreen, HomeScreen, AuthScreen } from './components/auth-flow';
import { MarketingProvider } from './components/marketing-context';

// رفعِ سراسریِ UI: آواتارهای قدیمی (w→fw) + تمام‌صفحه‌شدنِ شیتِ چت هنگامِ تایپ.
function __useNeuraUiFix() {
  React.useEffect(() => {
    const onErr = (e: any) => {
      const t = e.target;
      if (!t || t.tagName !== 'IMG' || !t.src) return;
      const s = String(t.src);
      const mw = s.match(/\/avatars\/w(\d+)\.png/);
      if (mw && t.dataset.avfix !== 'w') { t.dataset.avfix = 'w'; t.src = s.replace('/avatars/w' + mw[1] + '.png', '/avatars/fw' + mw[1] + '.png'); return; }
      const mf = s.match(/\/avatars\/fw(\d+)\.png/);
      if (mf && t.dataset.avfix !== 'f') { t.dataset.avfix = 'f'; t.src = s.replace('/avatars/fw' + mf[1] + '.png', '/avatars/m' + mf[1] + '.png'); return; }
    };
    document.addEventListener('error', onErr, true);
    const isTextInput = (el: any) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    const onFi = (e: any) => { if (isTextInput(e.target)) document.documentElement.classList.add('kb-typing'); };
    const onFo = () => { setTimeout(() => { if (!isTextInput(document.activeElement)) document.documentElement.classList.remove('kb-typing'); }, 60); };
    document.addEventListener('focusin', onFi);
    document.addEventListener('focusout', onFo);
    return () => {
      document.removeEventListener('error', onErr, true);
      document.removeEventListener('focusin', onFi);
      document.removeEventListener('focusout', onFo);
    };
  }, []);
}

function OfferBanner() {
  const [offer, setOffer] = React.useState<any>(null);
  React.useEffect(() => {
    const on = (e: any) => setOffer(e.detail);
    window.addEventListener('neura-offer', on);
    return () => window.removeEventListener('neura-offer', on);
  }, []);
  if (!offer) return null;
  return (
    <div style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top) + 8px)', left: 12, right: 12, zIndex: 99997 }}>
      <div style={{ background: 'linear-gradient(135deg,#7B62FC,#1E6BFF)', borderRadius: 16, padding: '12px 14px', color: '#fff', boxShadow: '0 10px 34px rgba(46,134,255,0.45)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className="fa-solid fa-gift" style={{ fontSize: 18 }} />
        <div style={{ flex: 1, fontSize: 12.5, fontWeight: 700, lineHeight: 1.7 }}>{offer.message}</div>
        <button onClick={() => setOffer(null)} style={{ background: 'rgba(255,255,255,0.22)', border: 'none', color: '#fff', borderRadius: 10, padding: '7px 13px', fontWeight: 800, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>{offer.cta || 'باشه'}</button>
        <button onClick={() => setOffer(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 15 }}><i className="fa-solid fa-xmark" /></button>
      </div>
    </div>
  );
}

// رفعِ سراسریِ کیبورد: ارتفاعِ visible viewport را به CSS می‌دهد تا اپ/مودال‌ها بالای کیبورد بمانند.
function __useKeyboardFit() {
  React.useEffect(() => {
    const vv = (window as any).visualViewport;
    // دیباگِ اختیاری: با افزودنِ ?kbdebug به آدرس، یک نوارِ مشکی بالای صفحه مقادیرِ زندهٔ کیبورد را
    // نشان می‌دهد (ارتفاعِ visualViewport، اسکرول، فیلدِ فوکوس‌شده). برای دیدنِ وضعیتِ واقعیِ دستگاه.
    const dbg = (typeof location !== 'undefined' && /kbdebug/.test(location.search))
      ? (() => { const el = document.createElement('div');
          el.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;background:rgba(0,0,0,0.85);color:#0f0;font:11px/1.4 monospace;padding:4px 8px;pointer-events:none;white-space:pre-wrap;direction:ltr;text-align:left';
          document.body.appendChild(el); return el; })()
      : null;
    // اگر فیلدِ فوکوس‌شده پایین‌تر از لبهٔ کیبورد بیفتد (پشتِ کیبورد)، ریشهٔ اپ را دقیقاً به‌اندازهٔ
    // سرریز بالا می‌بریم تا فیلد دیده شود. پس‌زمینهٔ body با پس‌زمینهٔ اپ یکی است، پس فضای پایین دیده نمی‌شود.
    const reveal = () => {
      // فقط transformِ باقی‌ماندهٔ نسخه‌های قبلی را پاک کن. بالا‌آوردنِ فیلد را با مخفی‌کردنِ hero (CSS
      // روی html.kb-typing) انجام می‌دهیم — نه با translateِ اپ، که فیلد را بیرونِ کادرِ اپ روی
      // پس‌زمینهٔ سفیدِ body می‌انداخت و نامرئی می‌کرد (hit=SELF ولی بدونِ کنتراست).
      const a = document.querySelector('.aw-app') as HTMLElement | null; if (a) a.style.transform = '';
    };
    let __maxH = window.innerHeight; // بیشترین innerHeight (حالتِ بدونِ کیبورد) — مبنای تشخیصِ کیبوردِ اندروید
    const setVars = () => {
      if (window.innerHeight > __maxH) __maxH = window.innerHeight;
      const h = vv ? vv.height : window.innerHeight;
      const top = vv ? vv.offsetTop : 0;
      // iOS: فقط visualViewport کوچک می‌شود (innerHeight ثابت). اندروید با interactive-widget=resizes-content:
      // خودِ innerHeight کوچک می‌شود و vv هم با آن؛ پس باید از کاهشِ innerHeight نسبت به مبنا هم کیبورد را فهمید.
      const kbVV = Math.max(0, window.innerHeight - h - top);
      const kbLayout = Math.max(0, __maxH - window.innerHeight);
      const kb = Math.max(kbVV, kbLayout);
      const d = document.documentElement.style;
      d.setProperty('--app-h', h + 'px');
      d.setProperty('--vv-top', top + 'px');
      d.setProperty('--kb-h', kb + 'px');
      // وقتی کیبورد باز است کلاسِ kb-open روی <html> بگذار تا CSS بلوکِ آواتار/hero را جمع کند و
      // فیلدِ نوشتن بالای کیبورد واضح دیده شود (رفعِ «تصویرِ ایجنت روی جای نوشته می‌افتد»).
      const __kbOpen = kb > 120;
      document.documentElement.classList.toggle('kb-open', __kbOpen);
      // شیت/مودالِ سفارشی (اورلیِ تمام‌صفحهٔ fixed) را نرم به ناحیهٔ بالای کیبورد محدود کن تا فیلد بالای
      // کیبورد بماند — بدونِ transform (بی‌پرش)، بدونِ لو رفتنِ پشتِ صفحه، بدونِ نیاز به پچِ تک‌تکِ شیت‌ها.
      // فقط وقتی فیلدِ فوکوس‌شده واقعاً پشتِ کیبورد است (مودالِ اصلی که خودش --kb-h دارد دست‌نخورده می‌ماند).
      try {
        const ae2: any = document.activeElement;
        const behind = __kbOpen && ae2 && (ae2.tagName === 'INPUT' || ae2.tagName === 'TEXTAREA' || ae2.isContentEditable)
          && ae2.getBoundingClientRect && ae2.getBoundingClientRect().bottom > (top + h) - 8;
        let ov: any = null;
        if (behind) {
          let el: any = ae2.parentElement;
          while (el && el !== document.body) {
            const cs = getComputedStyle(el); const rr = el.getBoundingClientRect();
            if (cs.position === 'fixed' && rr.top <= 2 && rr.height >= window.innerHeight * 0.8) { ov = el; break; }
            el = el.parentElement;
          }
        }
        document.querySelectorAll('[data-kb-lift]').forEach((s: any) => { if (s !== ov) { s.style.top = ''; s.style.height = ''; s.style.bottom = ''; s.removeAttribute('data-kb-lift'); } });
        if (ov) { ov.setAttribute('data-kb-lift', '1'); ov.style.top = top + 'px'; ov.style.height = h + 'px'; ov.style.bottom = 'auto'; }
      } catch (_) {}
      // iOS: هنگامِ بازشدنِ کیبورد، Safari گاهی کلِ صفحه (layout viewport) را به بالا اسکرول می‌کند و
      // محتوا می‌پرد. صفحه را زوری به بالا برمی‌گردانیم تا این جابه‌جایی خنثی شود (مکملِ قفلِ position:fixed).
      try { window.scrollTo(0, 0); if (document.scrollingElement) (document.scrollingElement as any).scrollTop = 0; } catch (_) {}
      reveal();
      if (dbg) {
        const app = document.querySelector('.aw-app'); const ar = app ? app.getBoundingClientRect() : null;
        const ae: any = document.activeElement;
        dbg.textContent = 'vv.h=' + Math.round(h) + ' vv.top=' + Math.round(top) + ' kb=' + Math.round(kb) + ' (vv=' + Math.round(kbVV) + ' layout=' + Math.round(kbLayout) + ' maxH=' + __maxH + ')'
          + ' win.h=' + window.innerHeight + ' scrollY=' + Math.round(window.scrollY)
          + '\napp.h=' + (ar ? Math.round(ar.height) : '?') + ' app.top=' + (ar ? Math.round(ar.top) : '?')
          + ' body=' + (document.body ? getComputedStyle(document.body).position : '?')
          + '\nfocus=' + (ae && ae.tagName ? (ae.tagName + ' ph="' + (ae.placeholder || '') + '" y=' + (ae.getBoundingClientRect ? (Math.round(ae.getBoundingClientRect().top) + '..' + Math.round(ae.getBoundingClientRect().bottom)) : '?')) : 'none')
          + '\nhit=' + ((): string => { try { const ae2: any = document.activeElement; if (!ae2 || !ae2.getBoundingClientRect) return '-'; const rr = ae2.getBoundingClientRect(); const hx = Math.round(rr.left + rr.width / 2), hy = Math.round(rr.top + rr.height / 2); const hh: any = document.elementFromPoint(hx, hy); if (!hh) return 'NULL@' + hx + ',' + hy; return (hh === ae2 || ae2.contains(hh) || hh.contains(ae2)) ? 'SELF ok' : ('COVER ' + hh.tagName + '.' + String(hh.className || '').slice(0, 22)); } catch (e) { return 'err'; } })();
      }
    };
    setVars();
    if (vv) { vv.addEventListener('resize', setVars); vv.addEventListener('scroll', setVars); }
    window.addEventListener('resize', setVars);
    // چرخشِ صفحه ابعاد را عوض می‌کند؛ مبنای __maxH را بعد از نشستنِ ابعاد ری‌ست کن تا kb-open گیر نکند.
    const onOrient = () => { setTimeout(() => { __maxH = window.innerHeight; setVars(); }, 350); };
    window.addEventListener('orientationchange', onOrient);
    // با فوکوسِ ورودی: بعد از بازشدنِ کیبورد (۳۴۰ms) اپ را تنظیم کن و **فیلدِ فوکوس‌شده را به وسطِ
    // ناحیهٔ دیده‌شونده اسکرول کن** تا هیچ‌وقت پشتِ کیبورد نماند (رفعِ «عنوان رویداد زیرِ کیبورد»).
    const onFI = (e: any) => {
      const t = e && e.target;
      setTimeout(() => {
        setVars();
        const ae: any = (t && t.tagName) ? t : document.activeElement;
        if (!ae || !(ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return;
        try {
          // فقط اگر فیلد پشتِ کیبورد است، درون محتوای اسکرول‌شونده بیاورش بالا. محدودکردنِ خودِ
          // اورلی به ناحیهٔ بالای کیبورد را setVars نرم انجام می‌دهد (بدونِ translate/پرش/لو رفتنِ پشتِ صفحه).
          const vvo: any = (window as any).visualViewport;
          const vTop = vvo ? vvo.offsetTop : 0;
          const vBot = vTop + (vvo ? vvo.height : window.innerHeight);
          const r = ae.getBoundingClientRect();
          if (r.bottom > vBot - 8 || r.top < vTop + 4) ae.scrollIntoView({ block: 'center', behavior: 'smooth' });
        } catch (_) {}
      }, 340);
    };
    const onFO = () => setTimeout(() => {
      const ae: any = document.activeElement;
      if (!(ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable))) {
        // هر اورلی‌ای که برای کیبورد بالا برده شده بود را به جای خودش برگردان.
        try { document.querySelectorAll('[data-kb-lift]').forEach((s: any) => { s.style.top = ''; s.style.height = ''; s.style.bottom = ''; s.removeAttribute('data-kb-lift'); }); } catch (_) {}
        const a = document.querySelector('.aw-app') as HTMLElement | null; if (a) a.style.transform = '';
        setVars();
      }
    }, 120);
    // اینترِ کیبوردِ موبایل: در فرم‌های چندفیلدی → فیلدِ بعدی؛ روی فیلدِ آخر → دکمهٔ ثبتِ همان فرم.
    // ورودی‌های تک‌فیلدی (چت/سرچ/تودو) دست‌نخورده می‌مانند تا هندلرِ خودشان (مثلِ ارسالِ پیام) کار کند.
    const onEnter = (ev: any) => {
      if (ev.key !== 'Enter' || ev.shiftKey || ev.defaultPrevented) return;
      const el: any = ev.target;
      if (!el || el.tagName !== 'INPUT') return;
      const ty = (el.type || 'text').toLowerCase();
      if (['checkbox', 'radio', 'button', 'submit', 'file', 'range'].indexOf(ty) >= 0) return;
      const SEL = 'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=file]):not([type=range]), textarea';
      let scope: any = el;
      for (let i = 0; i < 8 && scope.parentElement; i++) { scope = scope.parentElement; if ([...scope.querySelectorAll(SEL)].filter((x: any) => x.offsetHeight > 0).length >= 2) break; }
      const ins = [...scope.querySelectorAll(SEL)].filter((x: any) => x.offsetHeight > 0 && !x.disabled && !x.readOnly);
      if (ins.length < 2) return; // تک‌فیلدی → دست نزن (هندلرِ خودش کار کند)
      const idx = ins.indexOf(el);
      if (idx < 0) return;
      if (idx < ins.length - 1) { ev.preventDefault(); try { ins[idx + 1].focus(); } catch (_) {} return; }
      const RE = /^(ذخیره|ثبت|افزودن|ساخت|تأیید|تایید|ارسال|ورود|ادامه|بعدی)/;
      const btns = [...scope.querySelectorAll('button,[role="button"]')].filter((b: any) => b.offsetHeight > 0 && !b.disabled && RE.test((b.innerText || '').replace(/\s+/g, ' ').trim()));
      if (btns[0]) { ev.preventDefault(); try { btns[0].click(); } catch (_) {} }
    };
    document.addEventListener('keydown', onEnter, false);
    document.addEventListener('focusin', onFI);
    document.addEventListener('focusout', onFO);
    return () => {
      document.removeEventListener('keydown', onEnter, false);
      if (vv) { vv.removeEventListener('resize', setVars); vv.removeEventListener('scroll', setVars); }
      window.removeEventListener('resize', setVars);
      window.removeEventListener('orientationchange', onOrient);
      document.removeEventListener('focusin', onFI);
      document.removeEventListener('focusout', onFO);
    };
  }, []);
}

function AppContent() {
  __useKeyboardFit();
  __useNeuraUiFix();
  const app = useApp();
  const { role, theme, appStage, agentTeam } = app;

  // ── Figma-export navigation bridge ──────────────────────────────
  // Lets an external driver jump straight to any screen/state for capture.
  // window.__neuraGoTo({ team, screen, theme }) ; window.__neuraFrames() lists all.
  useEffect(() => {
    const w = window as any;
    w.__neuraApp = app;
    w.__neuraGoTo = (opts: any = {}) => {
      const { team = null, screen, theme: th } = opts;
      try {
        if (th) app.setThemeAndPersist ? app.setThemeAndPersist(th) : app.setTheme?.(th);
        app.setAppStage?.('app');
        app.setBriefingSeen?.(true);
        // Unlock every agent for the active company so no demo-lock covers screens
        ['marketing','secretary','finance','procurement','sales','assistant'].forEach(id => {
          try { app.purchaseAgent?.(id, { price: 0 }); } catch (_) {}
        });
        if (team === 'assistant' || (!team && screen && String(screen).startsWith('eu'))) {
          app.setRole?.('user');
          app.setAgentTeam?.('assistant');
          if (screen) app.setEuScreen?.(screen);
        } else if (team) {
          app.setRole?.('admin');
          app.setAgentTeam?.(team);
          if (screen) app.setAdminScreen?.(screen);
        } else if (screen) {
          app.setRole?.('admin');
          if (screen) app.setAdminScreen?.(screen);
        }
      } catch (e) { console.warn('neuraGoTo failed', e); }
      return { team, screen };
    };
  }, [app]);
  // When the personal assistant is embedded inside the management panel we still
  // render AdminPanel (role stays 'admin'), but it shows the EU experience — so
  // drop the blue `neura-admin` theme scope to keep the personal panel's own look.
  const adminChrome = role === 'admin' && agentTeam !== 'assistant';

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.style.background = 'var(--aw-bg-app)';
    document.body.style.color = 'var(--aw-text-primary)';
  }, [theme]);

  // Messenger-style keyboard handling: map the app to the *visual* viewport so
  // that when the on-screen keyboard opens, the whole UI sits above it (the
  // input bar stays visible and the view shifts up) instead of the chat shrinking.
  const appRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const el = appRef.current;
    if (!el) return;
    const apply = () => {
      // ارتفاع از --app-h می‌آید و هیچ transformای ست نمی‌شود (نگاه: patch-neuravergh-keyboard).
      // transformِ قبلی با شیت‌های portalی ناسازگار بود و آفست را دوبار اعمال می‌کرد.
      void el; void vv;
    };
    apply();
    vv.addEventListener('resize', apply);
    vv.addEventListener('scroll', apply);
    return () => {
      vv.removeEventListener('resize', apply);
      vv.removeEventListener('scroll', apply);
    };
  }, []);

  return (
    <div
      ref={appRef}
      className={`aw-app mx-auto relative overflow-hidden ${adminChrome ? 'neura-admin' : ''}`}
      dir="rtl"
      data-theme={theme}
      style={{
        height: 'var(--app-h, 100dvh)',
        background: (theme === 'glass' || theme === 'dark') ? 'transparent' : 'var(--aw-bg-app)',
        fontFamily: "'Vazirmatn', 'Neogrey', system-ui, sans-serif",
        color: 'var(--aw-text-primary)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {(theme === 'glass' || theme === 'dark') && (
        <div className={`aw-glass-bg ${adminChrome ? 'admin-bg' : ''}`} aria-hidden>
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
          <div className="blob blob-4" />
          <div className="blob blob-5" />
          <div className="blob blob-6" />
        </div>
      )}
      {appStage !== 'app' ? (
        <AnimatePresence mode="wait">
          <motion.div key={appStage} className="h-full relative z-10"
            initial={{ opacity: appStage === 'splash' ? 0 : 1 }} animate={{ opacity: 1 }} exit={{ opacity: appStage === 'splash' ? 0 : 1 }}
            transition={{ duration: appStage === 'splash' ? 0.3 : 0.01 }}>
            {appStage === 'splash' ? <SplashScreen /> : appStage === 'home' ? <HomeScreen /> : <AuthScreen />}
          </motion.div>
        </AnimatePresence>
      ) : (
      <React.Suspense fallback={<div className="h-full w-full flex items-center justify-center"><div style={{ width: 38, height: 38, borderRadius: '50%', border: '3px solid rgba(123,98,252,0.25)', borderTopColor: '#7B62FC', animation: 'spin 0.8s linear infinite' }} /></div>}>
      <AnimatePresence mode="wait">
        {role === 'admin' ? (
          <motion.div
            key="admin"
            className="h-full relative z-10"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <AdminPanel />
          </motion.div>
        ) : (
          <motion.div
            key="user"
            className="h-full relative z-10"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <EndUserPanel />
          </motion.div>
        )}
      </AnimatePresence>
      </React.Suspense>
      )}
      <ChatOverlay />
      <ModalOverlay />
      <CallOverlay />
      <UnifiedCallModal />
      <Toast />
      <OfferBanner />
      <FloatingMicFAB />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MarketingProvider>
        <AppContent />
      </MarketingProvider>
    </AppProvider>
  );
}