// انتخابگرِ ساعتِ «عقربه‌ای/دایره‌ای» سراسری — روی همهٔ پلتفرم‌ها (دسکتاپ و موبایل) یک صفحه‌ساعتِ
// دایره‌ای نشان می‌دهد (نه اسپینرِ فلش‌دارِ نیتیوِ دسکتاپ). خروجی «HH:MM» (۲۴ساعته).
import React, { useState, useRef, useEffect } from 'react';

const FA = '۰۱۲۳۴۵۶۷۸۹';
const toFa = (n: number | string) => String(n).replace(/[0-9]/g, (d) => FA[+d]);
const faToEn = (s: string) => (s || '').replace(/[۰-۹]/g, (d) => String(FA.indexOf(d)));
const pad = (n: number) => String(n).padStart(2, '0');

function parseHM(v?: string): { h: number; m: number } {
  const mm = faToEn(v || '').match(/(\d{1,2}):(\d{2})/);
  if (!mm) return { h: 9, m: 0 };
  return { h: Math.min(23, +mm[1]), m: Math.min(59, +mm[2]) };
}

export function TimePicker({
  value, onChange, className, placeholder = 'انتخاب ساعت',
}: { value?: string; onChange: (v: string) => void; className?: string; placeholder?: string }) {
  const init = parseHM(value);
  const [open, setOpen] = useState(false);
  const [h, setH] = useState(init.h);
  const [m, setM] = useState(init.m);
  const [view, setView] = useState<'h' | 'm'>('h');
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { const p = parseHM(value); setH(p.h); setM(p.m); }, [value]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const SIZE = 224, C = SIZE / 2, R_OUT = 92, R_IN = 58;
  const pos = (idx: number, total: number, r: number) => {
    const a = (idx / total) * 2 * Math.PI - Math.PI / 2;
    return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
  };

  // عقربه به مقدارِ انتخابیِ نمای فعلی اشاره کند
  const handAngle = view === 'h'
    ? ((h % 12) / 12) * 360 + (h === 0 || h >= 12 ? 0 : 0)
    : (m / 60) * 360;
  const handLen = view === 'h' ? (h >= 1 && h <= 12 ? R_OUT : R_IN) : R_OUT;

  const numCls = 'absolute flex items-center justify-center rounded-full';
  const cell = (label: string, x: number, y: number, active: boolean, on: () => void) => (
    <button key={label + x + y} type="button" onClick={on} className={numCls}
      style={{ left: x - 15, top: y - 15, width: 30, height: 30, border: 'none', cursor: 'pointer',
        background: active ? 'var(--aw-primary, #2E86FF)' : 'transparent',
        color: active ? '#fff' : 'var(--aw-text-primary)', fontWeight: active ? 800 : 600, fontSize: 13,
        fontFamily: "'Vazirmatn','Kamand',sans-serif" }}>{label}</button>
  );

  const inputCls = className || 'w-full py-2.5 px-3.5 rounded-[10px] border border-[var(--aw-border)] text-[13px] text-[var(--aw-text-primary)] outline-none';

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button type="button" onClick={() => { setView('h'); setOpen((o) => !o); }}
        className={inputCls + ' flex items-center justify-between cursor-pointer text-right'} style={{ background: 'var(--aw-bg-input)' }}>
        <span style={{ color: value ? 'var(--aw-text-primary)' : 'var(--aw-text-muted)', direction: 'ltr' }}>{value ? (toFa(pad(h)) + ':' + toFa(pad(m))) : placeholder}</span>
        <i className="fa-regular fa-clock text-[14px]" style={{ color: 'var(--aw-primary, #2E86FF)' }} />
      </button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2147483000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', padding: 16 }} onClick={() => setOpen(false)}>
        <div className="p-3 rounded-[16px]" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--aw-bg-modal, var(--aw-bg-card, #fff))', border: '1px solid var(--aw-border)', boxShadow: '0 16px 44px rgba(0,0,0,0.3)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', width: SIZE + 24 }}>
          {/* نمایشِ HH:MM با سوییچِ نما */}
          <div className="flex items-center justify-center gap-1 mb-2" style={{ direction: 'ltr', fontWeight: 800, fontSize: 26 }}>
            <span onClick={() => setView('h')} style={{ cursor: 'pointer', color: view === 'h' ? 'var(--aw-primary, #2E86FF)' : 'var(--aw-text-primary)' }}>{toFa(pad(h))}</span>
            <span style={{ color: 'var(--aw-text-muted)' }}>:</span>
            <span onClick={() => setView('m')} style={{ cursor: 'pointer', color: view === 'm' ? 'var(--aw-primary, #2E86FF)' : 'var(--aw-text-primary)' }}>{toFa(pad(m))}</span>
          </div>
          {/* صفحه‌ساعتِ دایره‌ای */}
          <div style={{ position: 'relative', width: SIZE, height: SIZE, borderRadius: '50%', background: 'var(--aw-bg-input, rgba(120,120,140,0.12))', margin: '0 auto' }}>
            {/* عقربه */}
            <div style={{ position: 'absolute', left: C, top: C, width: handLen, height: 2, background: 'var(--aw-primary, #2E86FF)', transformOrigin: '0 50%', transform: `rotate(${handAngle - 90}deg)`, borderRadius: 2, opacity: 0.7 }} />
            <div style={{ position: 'absolute', left: C - 4, top: C - 4, width: 8, height: 8, borderRadius: '50%', background: 'var(--aw-primary, #2E86FF)' }} />
            {view === 'h' ? (
              <>
                {Array.from({ length: 12 }).map((_, i) => { const hh = i + 1; const p = pos(hh, 12, R_OUT); return cell(toFa(hh), p.x, p.y, h === hh || (h === 12 && hh === 12), () => { setH(hh === 12 ? 12 : hh); setView('m'); }); })}
                {Array.from({ length: 12 }).map((_, i) => { const hh = i === 11 ? 0 : i + 13; const p = pos(i + 1, 12, R_IN); return cell(toFa(pad(hh)), p.x, p.y, h === hh, () => { setH(hh); setView('m'); }); })}
              </>
            ) : (
              Array.from({ length: 12 }).map((_, i) => { const mm = i * 5; const p = pos(i, 12, R_OUT); return cell(toFa(pad(mm)), p.x, p.y, m === mm, () => setM(mm)); })
            )}
          </div>
          <div className="flex items-center justify-between mt-2.5">
            <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="text-[12px] border-none bg-transparent cursor-pointer" style={{ color: 'var(--aw-text-muted)', fontWeight: 600 }}>پاک کردن</button>
            <button type="button" onClick={() => { onChange(pad(h) + ':' + pad(m)); setOpen(false); }} className="text-[12px] border-none cursor-pointer rounded-lg px-4 py-1.5 text-white" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 700 }}>تأیید</button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
