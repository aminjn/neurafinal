import { JalaliDatePicker } from './jalali-datepicker'; // datepickerall
import React, { useState } from 'react';
import { useApp } from './app-context';
import { api } from '../services/api';

// جداکنندهٔ زندهٔ پول (رشته → گروه‌بندی با ویرگول → ارقامِ فارسی)
const __grpMoney = (s: string) => { const en = String(s).replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, ''); if (!en) return ''; return Number(en).toLocaleString('en-US').replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]); };

// A lightweight, reusable form modal so "create / new …" buttons across the app
// actually open a working sheet instead of doing nothing.
export function QuickForm({ fields, submitLabel, toast, onSubmit, initial }: {
  fields: { key: string; label: string; type?: 'text' | 'textarea' | 'date' | 'time' | 'select' | 'tel' | 'money' | 'map'; options?: string[]; placeholder?: string }[];
  submitLabel: string;
  toast: string;
  onSubmit?: (vals: Record<string, string>) => void;
  initial?: Record<string, string>;
}) {
  const { closeModal, showToast } = useApp();
  const [vals, setVals] = useState<Record<string, string>>(initial || {});
  const set = (k: string, v: string) => setVals(s => ({ ...s, [k]: v }));
  const firstReq = fields[0];

  const submit = () => {
    if (firstReq && !(vals[firstReq.key] || '').trim()) { showToast(`«${firstReq.label}» را وارد کنید`); return; }
    if (onSubmit) onSubmit(vals);
    closeModal();
    showToast(toast);
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--aw-bg-input)', border: '1px solid var(--aw-border)', color: 'var(--aw-text-primary)',
    borderRadius: 12, padding: '11px 13px', fontSize: 13, width: '100%', outline: 'none',
    fontFamily: "'Kamand', 'Vazirmatn', sans-serif",
  };

  return (
    <div className="flex flex-col gap-3 p-1">
      {fields.map(f => (
        <div key={f.key} className="flex flex-col gap-1.5">
          <label className="text-[12px]" style={{ color: 'var(--aw-text-secondary)', fontWeight: 600 }}>{f.label}</label>
          {f.type === 'textarea' ? (
            <textarea rows={3} style={inputStyle} placeholder={f.placeholder || ''} value={vals[f.key] || ''} onChange={e => set(f.key, e.target.value)} />
          ) : f.type === 'select' ? (
            <select style={inputStyle} value={vals[f.key] || ''} onChange={e => set(f.key, e.target.value)}>
              <option value="">انتخاب کنید…</option>
              {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : f.type === 'date' ? (
            <JalaliDatePicker value={vals[f.key] || ''} onChange={v => set(f.key, v)} placeholder={f.placeholder || 'انتخاب تاریخ'} />
          ) : f.type === 'money' ? (
            <input inputMode="numeric" dir="ltr" style={{ ...inputStyle, textAlign: 'right' }} placeholder={f.placeholder || 'مبلغ (تومان)'} value={vals[f.key] || ''} onChange={e => set(f.key, __grpMoney(e.target.value))} />
          ) : f.type === 'map' ? (
            <MapField value={vals[f.key] || ''} placeholder={f.placeholder} inputStyle={inputStyle} onPick={(t, loc) => { set(f.key, t); if (loc && loc.lat != null) { set('lat', String(loc.lat)); set('lng', String(loc.lng)); } }} />
          ) : (
            <input type={f.type === 'time' ? 'time' : f.type === 'tel' ? 'tel' : 'text'}
              style={inputStyle} placeholder={f.placeholder || ''} value={vals[f.key] || ''} onChange={e => set(f.key, e.target.value)} />
          )}
        </div>
      ))}
      <button
        onClick={submit}
        className="mt-1 w-full rounded-[12px] border-none cursor-pointer text-white py-3 text-[14px]"
        style={{ background: 'var(--aw-primary)', fontWeight: 700, fontFamily: "'Kamand', 'Vazirmatn', sans-serif" }}
      >
        {submitLabel}
      </button>
    </div>
  );
}

// فیلدِ آدرسِ نکسا‌مپ (autocomplete). با انتخاب، آدرس + lat/lng را برمی‌گردانَد.
function MapField({ value, onPick, placeholder, inputStyle }: { value: string; onPick: (t: string, loc: any) => void; placeholder?: string; inputStyle: React.CSSProperties }) {
  const [preds, setPreds] = useState<any[]>([]);
  const [on, setOn] = useState(false);
  const [q, setQ] = useState(value || '');
  React.useEffect(() => { (api as any).mapStatus().then((r: any) => setOn(!!(r && r.configured))).catch(() => {}); }, []);
  React.useEffect(() => {
    if (!on || q.trim().length < 2) { setPreds([]); return; }
    let alive = true;
    const h = setTimeout(() => { (api as any).mapAutocomplete(q.trim()).then((r: any) => { if (alive) setPreds(Array.isArray(r && r.predictions) ? r.predictions : []); }).catch(() => {}); }, 350);
    return () => { alive = false; clearTimeout(h); };
  }, [q, on]);
  return (
    <div className="relative flex flex-col gap-1">
      <textarea rows={2} style={inputStyle} placeholder={placeholder || (on ? 'شروع به تایپِ آدرس کن…' : 'آدرس را وارد کن')} value={q} onChange={e => { setQ(e.target.value); onPick(e.target.value, null); }} />
      {preds.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--aw-border)', background: 'var(--aw-bg-card)' }}>
          {preds.slice(0, 6).map((p: any, i: number) => (
            <button key={p.place_id || i} type="button" onClick={() => { const t = p.main_text ? (p.main_text + (p.secondary_text ? '، ' + p.secondary_text : '')) : (p.formatted_address || q); setQ(t); setPreds([]); onPick(t, p.location || null); }} className="w-full text-right px-3 py-2 cursor-pointer bg-transparent border-none" style={{ borderTop: i ? '1px solid var(--aw-border)' : 'none' }}>
              <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{p.main_text || p.formatted_address || '—'}</div>
              {p.secondary_text ? <div className="text-[10px] text-[var(--aw-text-muted)]">{p.secondary_text}</div> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
