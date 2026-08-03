import React, { useState } from 'react';
import { useApp } from './app-context';

// A lightweight, reusable form modal so "create / new …" buttons across the app
// actually open a working sheet instead of doing nothing.
export function QuickForm({ fields, submitLabel, toast, onSubmit, initial }: {
  fields: { key: string; label: string; type?: 'text' | 'textarea' | 'date' | 'time' | 'select' | 'tel'; options?: string[]; placeholder?: string }[];
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
          ) : (
            <input type={f.type === 'date' ? 'date' : f.type === 'time' ? 'time' : f.type === 'tel' ? 'tel' : 'text'}
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
