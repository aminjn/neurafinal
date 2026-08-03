// فرمِ مرحله‌ایِ ثبت‌نام با احرازِ هویتِ شاهکار (Pod.ir):
// شماره موبایل → کد ملی → تاریخ تولدِ شمسی → تطبیقِ شاهکار → کدِ پیامکی.
// هر مرحله که پر شد، به مرحلهٔ بعد می‌رود. کاملاً به بک‌اندِ واقعیِ Neura وصل است.
import React, { useState, useRef } from 'react';
import { useApp } from './app-context';
import { api, setToken } from '../services/api';

const faToEn = (v: string) => (v || '').replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
const onlyDigits = (v: string) => faToEn(v).replace(/\D/g, '');

export function ShahkarRegister() {
  const { completeAuth, showToast, setAuthMode, preTheme } = useApp() as any;
  const dark = preTheme === 'dark';
  const [step, setStep] = useState<'phone' | 'nid' | 'birth' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [nid, setNid] = useState('');
  const [by, setBy] = useState(''); const [bm, setBm] = useState(''); const [bd, setBd] = useState('');
  const bmRef = useRef<HTMLInputElement>(null);
  const bdRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const C = {
    bg: dark ? 'rgba(12,9,20,0.92)' : 'rgba(250,249,255,0.96)',
    card: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.92)',
    txt: dark ? '#f0eef9' : '#2a2150',
    mute: dark ? '#a39fb6' : '#8f8aa8',
    border: dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)',
    primary: '#7B62FC',
  };
  const inputStyle: React.CSSProperties = {
    background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)',
    borderRadius: 14, padding: '14px 16px', color: C.txt,
    border: `0.5px solid ${C.border}`, fontFamily: "'Kamand','Vazirmatn',sans-serif",
    fontSize: 15, outline: 'none', width: '100%', textAlign: 'center', letterSpacing: 1,
  };
  const btn = (bg: string): React.CSSProperties => ({
    width: '100%', padding: '13px', borderRadius: 14, border: 'none', color: bg === 'transparent' ? C.mute : '#fff',
    background: bg, fontWeight: 800, fontSize: 14, cursor: 'pointer', opacity: loading ? 0.6 : 1,
    fontFamily: "'Kamand','Vazirmatn',sans-serif",
  });

  const nextFromPhone = () => {
    if (!/^09\d{9}$/.test(onlyDigits(phone))) { showToast('شماره موبایل را درست وارد کنید (۰۹...)'); return; }
    setStep('nid');
  };
  const nextFromNid = () => {
    if (onlyDigits(nid).length !== 10) { showToast('کد ملی باید ۱۰ رقم باشد'); return; }
    setStep('birth');
  };
  const submitBirth = async () => {
    const y = onlyDigits(by), m = onlyDigits(bm), d = onlyDigits(bd);
    if (y.length !== 4 || !m || !d) { showToast('تاریخ تولدِ شمسی را کامل وارد کنید'); return; }
    const jbd = y + m.padStart(2, '0') + d.padStart(2, '0');
    setLoading(true);
    try {
      const r: any = await api.shahkarVerify(onlyDigits(phone), onlyDigits(nid), jbd);
      if (r && r.ok) {
        // هویت تأیید شد → همیشه برو مرحلهٔ کد (اگر پیامک نرفته بود، دکمهٔ «ارسالِ دوباره» هست)
        if (r.name) setName(r.name);
        showToast(r.otpSent ? 'هویتِ شما تأیید شد؛ کدِ پیامک‌شده را وارد کنید' : 'هویت تأیید شد؛ روی «ارسالِ دوبارهٔ کد» بزنید');
        setStep('otp');
      }
    } catch (e: any) {
      const key = e && e.message;
      const map: Record<string, string> = {
        national_id_taken: 'این کد ملی قبلاً ثبت شده؛ با همان شماره وارد شوید',
        shahkar_not_matched: 'این شماره موبایل به نامِ این کد ملی نیست',
        already_verified: 'این حساب قبلاً تأیید شده؛ از ورود استفاده کنید',
        bad_national_id: 'کد ملی نامعتبر است',
        bad_birthdate: 'تاریخِ تولدِ شمسی را کامل وارد کنید',
        bad_phone: 'شماره موبایل نامعتبر است',
        identity_failed: 'کد ملی یا تاریخِ تولد نادرست است',
        shahkar_not_configured: 'سرویسِ احرازِ هویت هنوز پیکربندی نشده است',
      };
      showToast(map[key] || 'خطا در احرازِ هویت؛ دوباره تلاش کنید');
    }
    setLoading(false);
  };
  const submitOtp = async () => {
    const c = onlyDigits(code);
    if (c.length < 6) { showToast('کدِ ۶ رقمیِ پیامک‌شده را کامل وارد کنید'); return; }
    setLoading(true);
    try {
      const r: any = await api.otpVerify(onlyDigits(phone), c);
      if (r && r.token) { setToken(r.token); showToast('خوش آمدید' + (name ? ' ' + name : '') + '!'); completeAuth(); return; }
      showToast('کدِ تأیید نادرست است');
    } catch (e: any) { showToast(e && e.message === 'shahkar_required' ? 'ابتدا هویتِ خود را تأیید کنید' : 'کدِ تأیید نادرست است'); }
    setLoading(false);
  };
  const resend = async () => { try { await api.otpRequest(onlyDigits(phone)); showToast('کد دوباره ارسال شد'); } catch { showToast('خطا در ارسالِ مجدد'); } };

  const steps = ['phone', 'nid', 'birth', 'otp'];
  const idx = steps.indexOf(step);
  const arrow = <i className="fa-solid fa-arrow-left" style={{ fontSize: 11, marginRight: 4 }} />;

  return (
    <div dir="rtl" style={{ position: 'fixed', inset: 0, zIndex: 100000, background: C.bg, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380, background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          {steps.map((s, i) => (<div key={s} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= idx ? C.primary : C.border, transition: 'background .25s' }} />))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <i className="fa-solid fa-shield-halved" style={{ color: C.primary, fontSize: 16 }} />
          <span style={{ color: C.txt, fontWeight: 800, fontSize: 16 }}>ثبت‌نام با احرازِ هویت</span>
        </div>
        <div style={{ color: C.mute, fontSize: 11.5, marginBottom: 18 }}>هویتِ شما از طریقِ سامانهٔ شاهکار تأیید می‌شود</div>

        {step === 'phone' && (
          <>
            <label style={{ color: C.mute, fontSize: 12, display: 'block', marginBottom: 8 }}>شماره موبایل</label>
            <input autoFocus value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && nextFromPhone()} placeholder="۰۹۱۲۳۴۵۶۷۸۹" inputMode="tel" style={inputStyle} />
            <div style={{ height: 14 }} />
            <button onClick={nextFromPhone} style={btn(C.primary)}>بعدی {arrow}</button>
          </>
        )}

        {step === 'nid' && (
          <>
            <label style={{ color: C.mute, fontSize: 12, display: 'block', marginBottom: 8 }}>کد ملی (۱۰ رقم)</label>
            <input autoFocus value={nid} onChange={(e) => setNid(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && nextFromNid()} placeholder="۰۰۱۲۳۴۵۶۷۸" inputMode="numeric" maxLength={10} style={inputStyle} />
            <div style={{ height: 14 }} />
            <button onClick={nextFromNid} style={btn(C.primary)}>بعدی {arrow}</button>
            <button onClick={() => setStep('phone')} style={{ ...btn('transparent'), marginTop: 8 }}>بازگشت</button>
          </>
        )}

        {step === 'birth' && (
          <>
            <label style={{ color: C.mute, fontSize: 12, display: 'block', marginBottom: 8 }}>تاریخِ تولد (شمسی) — سال / ماه / روز</label>
            {/* چپ‌به‌راست: سال (چپ) ← ماه ← روز؛ با پر شدنِ هر خانه خودکار می‌رود بعدی */}
            <div style={{ display: 'flex', gap: 8, direction: 'ltr' }}>
              <input autoFocus value={by}
                onChange={(e) => { setBy(e.target.value); if (onlyDigits(e.target.value).length >= 4) bmRef.current?.focus(); }}
                placeholder="سال ۱۳۷۰" inputMode="numeric" maxLength={4} style={{ ...inputStyle, flex: 1.5 }} />
              <input ref={bmRef} value={bm}
                onChange={(e) => { setBm(e.target.value); if (onlyDigits(e.target.value).length >= 2) bdRef.current?.focus(); }}
                placeholder="ماه" inputMode="numeric" maxLength={2} style={{ ...inputStyle, flex: 1 }} />
              <input ref={bdRef} value={bd}
                onChange={(e) => setBd(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitBirth()}
                placeholder="روز" inputMode="numeric" maxLength={2} style={{ ...inputStyle, flex: 1 }} />
            </div>
            <div style={{ height: 14 }} />
            <button onClick={submitBirth} disabled={loading} style={btn(C.primary)}>{loading ? 'در حالِ بررسی…' : 'تأییدِ هویت و ارسالِ کد'}</button>
            <button onClick={() => setStep('nid')} style={{ ...btn('transparent'), marginTop: 8 }}>بازگشت</button>
          </>
        )}

        {step === 'otp' && (
          <>
            <div style={{ color: C.txt, fontSize: 13, marginBottom: 10, lineHeight: 1.7 }}>{name ? `سلام ${name}، ` : ''}کدِ پیامک‌شده به {phone} را وارد کنید</div>
            <input autoFocus value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitOtp()} placeholder="- - - - - -" inputMode="numeric" maxLength={6} style={inputStyle} />
            <div style={{ height: 14 }} />
            <button onClick={submitOtp} disabled={loading} style={btn(C.primary)}>{loading ? '…' : 'تأیید و ورود'}</button>
            <button onClick={resend} style={{ ...btn('transparent'), color: C.primary, marginTop: 8 }}>ارسالِ دوبارهٔ کد</button>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button onClick={() => setAuthMode('login')} style={{ background: 'none', border: 'none', color: C.mute, fontSize: 12, cursor: 'pointer', fontFamily: "'Kamand','Vazirmatn',sans-serif" }}>حساب دارید؟ وارد شوید</button>
        </div>
      </div>
    </div>
  );
}
