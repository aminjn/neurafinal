// ماژولِ سراسریِ «انتخابگرِ تاریخِ شمسی» (Jalali date picker).
// چرا: همه‌جای برنامه فیلدِ تاریخ یا text بود (کاربر باید دستی «۱۴۰۴/۱۲/۱۰» می‌نوشت) یا native date
// میلادی. کاربر خواست همه‌جا پیکرِ شمسی باشد. این یک کامپوننتِ خودبسنده است: یک دکمه که تاریخِ انتخابی را
// نشان می‌دهد و با زدن، یک تقویمِ شمسی (پاپ‌آور) باز می‌کند — بدونِ کیبورد (پس مشکلِ کیبوردِ فیلدِ تاریخ هم
// کلاً حذف می‌شود). خروجی رشتهٔ شمسی با رقمِ فارسی است (مثلِ «۱۴۰۴/۰۵/۰۶»).
import React, { useState, useRef, useEffect } from 'react';

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toFaNum = (n: number | string) => String(n).replace(/[0-9]/g, (d) => FA_DIGITS[+d]);
const faToEn = (s: string) => (s || '').replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)));
const J_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const J_WEEK = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

// جلالی → میلادی (الگوریتمِ استانداردِ jalaali)
function jalToGreg(jy: number, jm: number, jd: number): Date {
  let gy = jy <= 979 ? 621 : 1600;
  jy -= jy <= 979 ? 0 : 979;
  let days = 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + 78 + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) { gy += 100 * Math.floor(--days / 36524); days %= 36524; if (days >= 365) days++; }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) { gy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
  let gd = days + 1;
  const leap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
  const sal = [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 1;
  for (; gm <= 12; gm++) { if (gd <= sal[gm]) break; gd -= sal[gm]; }
  return new Date(gy, gm - 1, gd);
}

// امروزِ شمسی از تقویمِ سیستم (نه hardcode)
export function jNow(): { y: number; m: number; d: number } {
  try {
    const p = new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date());
    const g = (t: string) => { const f = p.find((x) => x.type === t); return f ? parseInt(f.value, 10) : 0; };
    return { y: g('year'), m: g('month'), d: g('day') };
  } catch (e) { return { y: 1404, m: 1, d: 1 }; }
}

const jDaysInMonth = (jy: number, jm: number) =>
  jm <= 6 ? 31 : jm <= 11 ? 30 : (((jy - 979) % 33) % 4 === 1 ? 30 : 29);

// شمارهٔ روزِ هفته (۰=شنبه) برای اولِ ماهِ شمسی
const jFirstWeekday = (jy: number, jm: number) => (jalToGreg(jy, jm, 1).getDay() + 1) % 7;

// «۱۴۰۴/۰۵/۰۶» → {y,m,d}
function parseJ(v?: string): { y: number; m: number; d: number } | null {
  if (!v) return null;
  const m = faToEn(v).match(/(\d{3,4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (!m) return null;
  return { y: +m[1], m: +m[2], d: +m[3] };
}
const fmtJ = (y: number, m: number, d: number) =>
  `${toFaNum(y)}/${toFaNum(String(m).padStart(2, '0'))}/${toFaNum(String(d).padStart(2, '0'))}`;

export function JalaliDatePicker({
  value, onChange, placeholder = 'انتخاب تاریخ', className, allowClear = true,
}: { value?: string; onChange: (v: string) => void; placeholder?: string; className?: string; allowClear?: boolean }) {
  const now = jNow();
  const sel = parseJ(value);
  const [open, setOpen] = useState(false);
  const [vy, setVy] = useState(sel?.y || now.y);
  const [vm, setVm] = useState(sel?.m || now.m);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { const s = parseJ(value); if (s) { setVy(s.y); setVm(s.m); } }, [value]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const prevMonth = () => { if (vm === 1) { setVm(12); setVy((y) => y - 1); } else setVm((m) => m - 1); };
  const nextMonth = () => { if (vm === 12) { setVm(1); setVy((y) => y + 1); } else setVm((m) => m + 1); };

  const dim = jDaysInMonth(vy, vm);
  const startDow = jFirstWeekday(vy, vm);
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);

  const inputCls =
    className ||
    'w-full py-2.5 px-3.5 rounded-[10px] border border-[var(--aw-border)] text-[13px] text-[var(--aw-text-primary)] outline-none';

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={inputCls + ' flex items-center justify-between cursor-pointer text-right'}
        style={{ background: 'var(--aw-bg-input)' }}
      >
        <span style={{ color: value ? 'var(--aw-text-primary)' : 'var(--aw-text-muted)' }}>{value || placeholder}</span>
        <i className="fa-solid fa-calendar-day text-[13px]" style={{ color: 'var(--aw-primary, #2E86FF)' }} />
      </button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2147483000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', padding: 16 }} onClick={() => setOpen(false)}>
        <div
          className="p-3 rounded-[14px]"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 320, maxWidth: '100%', background: 'var(--aw-bg-modal, var(--aw-bg-card, #fff))',
            border: '1px solid var(--aw-border)', boxShadow: '0 16px 40px rgba(0,0,0,0.28)',
            backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
          }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <button type="button" onClick={prevMonth} className="w-8 h-8 rounded-lg border-none cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-bg-input)', color: 'var(--aw-text-primary)' }}>
              <i className="fa-solid fa-chevron-right text-[12px]" />
            </button>
            <div className="text-[13px]" style={{ fontWeight: 700, color: 'var(--aw-text-primary)' }}>{J_MONTHS[vm - 1]} {toFaNum(vy)}</div>
            <button type="button" onClick={nextMonth} className="w-8 h-8 rounded-lg border-none cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-bg-input)', color: 'var(--aw-text-primary)' }}>
              <i className="fa-solid fa-chevron-left text-[12px]" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {J_WEEK.map((w, i) => (
              <div key={i} className="text-center text-[10px] text-[var(--aw-text-muted)]" style={{ fontWeight: 700 }}>{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const isToday = vy === now.y && vm === now.m && d === now.d;
              const isSel = !!sel && sel.y === vy && sel.m === vm && sel.d === d;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => { onChange(fmtJ(vy, vm, d)); setOpen(false); }}
                  className="h-8 rounded-lg border-none cursor-pointer text-[12px] flex items-center justify-center transition-colors"
                  style={
                    isSel
                      ? { background: 'var(--aw-primary, #2E86FF)', color: '#fff', fontWeight: 700 }
                      : isToday
                      ? { background: 'color-mix(in srgb, var(--aw-primary, #2E86FF) 16%, transparent)', color: 'var(--aw-primary, #2E86FF)', fontWeight: 700 }
                      : { background: 'transparent', color: 'var(--aw-text-primary)', fontWeight: 500 }
                  }
                >
                  {toFaNum(d)}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2.5" style={{ borderTop: '1px solid var(--aw-border)' }}>
            <button type="button" onClick={() => { onChange(fmtJ(now.y, now.m, now.d)); setOpen(false); }} className="text-[11px] border-none bg-transparent cursor-pointer" style={{ color: 'var(--aw-primary, #2E86FF)', fontWeight: 700 }}>
              امروز
            </button>
            {allowClear && value && (
              <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="text-[11px] border-none bg-transparent cursor-pointer" style={{ color: 'var(--aw-text-muted)', fontWeight: 600 }}>
                پاک کردن
              </button>
            )}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
