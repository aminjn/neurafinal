import React, { useEffect, useState } from 'react';

// بنرِ نصبِ PWA — روی همهٔ صفحات پایین می‌نشیند: «برنامه را نصب کنید».
// اندروید/کروم: از beforeinstallprompt استفاده می‌کند. iOS: راهنمای افزودن به صفحهٔ خانه.
export default function InstallBanner() {
  const [deferred, setDeferred] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);

  const isStandalone =
    (typeof window !== 'undefined' &&
      (window.matchMedia?.('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true));
  const isIOS =
    typeof navigator !== 'undefined' &&
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !/crios|fxios/i.test(navigator.userAgent);

  useEffect(() => {
    if (isStandalone) return;
    if (localStorage.getItem('neura_pwa_dismissed') === '1') return;
    const onPrompt = (e: any) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    // iOS از beforeinstallprompt پشتیبانی نمی‌کند ⇒ بنرِ راهنما را خودمان نشان می‌دهیم
    if (isIOS) setShow(true);
    // اگر مرورگر رویداد را دیر/اصلاً نداد، باز هم بنرِ عمومی را نشان بده
    const t = setTimeout(() => setShow(true), 1500);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const onInstalled = () => { setShow(false); localStorage.setItem('neura_pwa_dismissed', '1'); };
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  if (isStandalone || !show) return null;

  const install = async () => {
    if (deferred) {
      deferred.prompt();
      try { await deferred.userChoice; } catch {}
      setDeferred(null);
      setShow(false);
    } else if (isIOS) {
      setIosHelp((v) => !v);
    } else {
      // مرورگر هنوز آماده نیست یا پشتیبانی محدود است
      setIosHelp((v) => !v);
    }
  };

  const dismiss = () => { setShow(false); localStorage.setItem('neura_pwa_dismissed', '1'); };

  return (
    <div
      dir="rtl"
      style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 100000,
        padding: '10px 12px calc(10px + env(safe-area-inset-bottom))',
        background: 'rgba(13,11,46,0.96)',
        backdropFilter: 'blur(10px)',
        color: '#fff',
        boxShadow: '0 -6px 20px rgba(0,0,0,0.35)',
        fontFamily: "'Vazirmatn', system-ui, sans-serif",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 480, margin: '0 auto' }}>
        <img src="/pwa-192.png" alt="" width={36} height={36} style={{ borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>برای تجربهٔ بهتر، Neura را نصب کنید</div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>اپ را روی صفحهٔ خانهٔ گوشی خود اضافه کنید</div>
        </div>
        <button
          onClick={install}
          style={{ background: '#2E86FF', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          نصب
        </button>
        <button
          onClick={dismiss}
          aria-label="بستن"
          style={{ background: 'transparent', color: '#fff', border: 'none', fontSize: 16, cursor: 'pointer', opacity: 0.7, padding: 4 }}
        >
          ✕
        </button>
      </div>
      {iosHelp && (
        <div style={{ maxWidth: 480, margin: '8px auto 0', fontSize: 11.5, lineHeight: 1.7, background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 10px' }}>
          {isIOS ? (
            <>روی دکمهٔ <b>اشتراک‌گذاری</b> (مربع با فلش رو به بالا) بزنید، سپس <b>Add to Home Screen</b> / <b>افزودن به صفحهٔ اصلی</b> را انتخاب کنید.</>
          ) : (
            <>از منوی مرورگر (سه‌نقطه) گزینهٔ <b>Install app</b> / <b>افزودن به صفحهٔ اصلی</b> را بزنید.</>
          )}
        </div>
      )}
    </div>
  );
}
