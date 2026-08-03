import { JalaliDatePicker } from './jalali-datepicker'; // datepickerall
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './app-context';
import { QuickForm } from './quick-actions';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';

const toFa = (n: number | string) => { const _s = String(n); let _g = _s; if (/^-?[1-9]\d{3,}$/.test(_s)) { const _num = parseInt(_s, 10), _abs = Math.abs(_num); const _isYear = (_abs >= 1300 && _abs <= 1510) || (_abs >= 1900 && _abs <= 2100); if (!_isYear) _g = _num.toLocaleString('en-US'); } return _g.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]).replace(/,/g, '\u066C'); };

function __grpFa(v: any): string {
  const n = String(v == null ? '' : v).replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '');
  return n ? Number(n).toLocaleString('en-US').replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]) : '';
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-2.5 py-1.5 text-[11px]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontFamily: "'Kamand','Vazirmatn',sans-serif" }}>
      {label != null && <div className="text-[var(--aw-text-muted)] mb-0.5">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5 text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>
          <span className="w-2 h-2 rounded-sm" style={{ background: p.color || p.payload?.color }} />
          {p.name}: {toFa(p.value)}
        </div>
      ))}
    </div>
  );
}

// ========================
// SHARED STYLES
// ========================
const cardStyle: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)',
  backdropFilter: 'blur(20px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
  borderRadius: 10,
  border: '1px solid color-mix(in srgb, var(--aw-primary) 18%, transparent)',
  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.22), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)',
};
const tabBarStyle: React.CSSProperties = {
  background: 'var(--aw-eu-nav-bg)',
  border: '1px solid var(--aw-eu-nav-border)',
  borderRadius: 9999,
  padding: 3,
  backdropFilter: 'blur(20px)',
};
const activeTabStyle: React.CSSProperties = {
  background: 'var(--aw-bg-card)',
  borderRadius: 9999,
  color: 'var(--aw-text-primary)',
  fontWeight: 700,
  boxShadow: 'inset 0 0 0 1px var(--aw-border), 0 2px 6px rgba(0,0,0,0.10)',
};
const inactiveTabStyle: React.CSSProperties = {
  background: 'transparent',
  borderRadius: 9999,
  color: 'var(--aw-text-secondary)',
};

function TabBar({ tabs, active, onChange }: { tabs: { id: string; label: string; icon: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 p-1 mx-4 mt-3 mb-2 overflow-x-auto aw-noscroll" style={tabBarStyle}>
      {tabs.map(t => (
        <button
          key={t.id}
          className="flex-1 flex items-center justify-center gap-1 py-2 px-1 border-none cursor-pointer transition-all text-[11px]"
          style={active === t.id ? activeTabStyle : inactiveTabStyle}
          onClick={() => onChange(t.id)}
        >
          <i className={`${t.icon} text-[11px]`} />
          <span style={{ whiteSpace: 'nowrap' }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function SectionHeader({ title, icon, count, color }: { title: string; icon: string; count?: number; color?: string }) {
  const c = 'var(--aw-primary)';
  return (
    <div className="flex items-center gap-2 px-1 pt-3 pb-1">
      <i className={`${icon} text-[14px]`} style={{ color: c }} />
      <span className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{title}</span>
      {count !== undefined && (
        <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--aw-primary-bg)', color: c }}>{count}</span>
      )}
    </div>
  );
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>{label}</span>
  );
}

// ========================
// 1. REQUESTS SCREEN (درخواست‌ها)
// ========================
type ReqStatus = 'new' | 'pending' | 'rejected';
type PendingOn = 'supplier' | 'sales';
type RejectReason = 'cancelled' | 'no-stock';

interface PurchaseRequest {
  id: number;
  code: string;            // RFQ number
  title: string;           // نام کالا
  unit: string;            // واحد (عدد/کیلوگرم/...)
  urgency: 'urgent' | 'normal';
  qty: string;             // مقدار/تعداد
  lastPrice: string;       // آخرین قیمت
  targetAmount: string;    // مبلغ تارگت شده
  status: ReqStatus;
  pendingOn?: PendingOn;
  rejectReason?: RejectReason;
  date: string;
  requester: string;       // انبار / فروش
  supplier: string;        // نام تامین‌کننده
  customer: string;        // نام مشتری
  hsCode: string;
  hasAttachment: boolean;  // پیش‌فاکتور سنجاق‌شده
}

// ---- localStorage-backed suggestion stores ----
const SUP_KEY = 'neura-proc-suppliers';
const HS_KEY = 'neura-proc-hscodes';
const GOODS_KEY = 'neura-proc-goods';
const REQ_KEY = 'neura-proc-requests-v1';
const TODAY_FA = '۱۴۰۴/۱۲/۱۵';
const PROC_UNITS = ['عدد', 'کیلوگرم', 'تن', 'لیتر', 'متر', 'متر مکعب', 'بسته', 'کارتن'];

function lsArr(key: string): string[] { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function lsPush(key: string, val: string) { if (!val || !val.trim()) return; const a = lsArr(key); if (!a.includes(val)) { a.unshift(val); try { localStorage.setItem(key, JSON.stringify(a.slice(0, 60))); } catch {} } }
function lsGoods(): { name: string; unit: string }[] { try { return JSON.parse(localStorage.getItem(GOODS_KEY) || '[]'); } catch { return []; } }
function lsPushGood(name: string, unit: string) { if (!name || !name.trim()) return; const a = lsGoods(); const i = a.findIndex(g => g.name === name); if (i >= 0) a[i] = { name, unit }; else a.unshift({ name, unit }); try { localStorage.setItem(GOODS_KEY, JSON.stringify(a.slice(0, 60))); } catch {} }

// seed defaults once so the demo shows suggestions immediately
function seedProcSuggestions() {
  if (lsArr(SUP_KEY).length === 0) try { localStorage.setItem(SUP_KEY, JSON.stringify([])); } catch {}
  if (lsArr(HS_KEY).length === 0) try { localStorage.setItem(HS_KEY, JSON.stringify(['8471.30', '3923.21', '8517.62', '7309.00', '0909.30', '8544.42'])); } catch {}
  if (lsGoods().length === 0) try { localStorage.setItem(GOODS_KEY, JSON.stringify([])); } catch {}
}

const reqStatusColors: Record<ReqStatus, { color: string; label: string; icon: string }> = {
  new: { color: '#3B82F6', label: 'جدید', icon: 'fa-solid fa-wand-magic-sparkles' },
  pending: { color: '#F59E0B', label: 'در انتظار', icon: 'fa-solid fa-hourglass-half' },
  rejected: { color: '#EF4444', label: 'رد شده', icon: 'fa-solid fa-xmark' },
};
const pendingOnLabels: Record<PendingOn, string> = { supplier: 'تأمین‌کننده', sales: 'تیم فروش' };
const rejectReasonLabels: Record<RejectReason, string> = { cancelled: 'لغو شده', 'no-stock': 'عدم موجودی' };
const urgencyColors: Record<string, { color: string; label: string }> = {
  urgent: { color: '#EF4444', label: 'اضطراری' },
  normal: { color: '#10B981', label: 'غیراضطراری' },
};

const MOCK_REQUESTS: PurchaseRequest[] = [];

// ---- Autocomplete text input (suggestions from a growing list) ----
function ACInput({ value, onChange, suggestions, placeholder, onPick }: { value: string; onChange: (v: string) => void; suggestions: string[]; placeholder?: string; onPick?: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const q = value.trim();
  const list = (q ? suggestions.filter(s => s.includes(q) && s !== value) : suggestions).slice(0, 6);
  const inputStyle: React.CSSProperties = { background: 'var(--aw-bg-input)', border: '1px solid var(--aw-border)', color: 'var(--aw-text-primary)', borderRadius: 12, padding: '11px 13px', fontSize: 13, width: '100%', outline: 'none', fontFamily: "'Kamand','Vazirmatn',sans-serif" };
  return (
    <div style={{ position: 'relative' }}>
      <input style={inputStyle} placeholder={placeholder || ''} value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 160)} />
      {open && list.length > 0 && (
        <div className="absolute left-0 right-0 z-30 mt-1 rounded-[10px] overflow-hidden aw-scroll" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.18)', maxHeight: 180, overflowY: 'auto' }}>
          {list.map(s => (
            <button key={s} type="button" className="w-full text-right px-3 py-2 border-none bg-transparent cursor-pointer text-[12px] text-[var(--aw-text-primary)] hover:bg-[var(--aw-primary-bg)]"
              onMouseDown={e => { e.preventDefault(); onChange(s); if (onPick) onPick(s); setOpen(false); }}>
              <i className="fa-solid fa-clock-rotate-left text-[9px] ml-1.5 text-[var(--aw-text-muted)]" />{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function procFieldLabel(t: string) { return <label className="text-[12px]" style={{ color: 'var(--aw-text-secondary)', fontWeight: 600 }}>{t}</label>; }

function NewProcRequestForm({ onAdd }: { onAdd: (r: PurchaseRequest) => void }) {
  const { closeModal, showToast } = useApp();
  const [f, setF] = useState({
    date: TODAY_FA, rfq: '', title: '', unit: 'عدد', qty: '', lastPrice: '', target: '',
    supplier: '', urgency: 'normal', requester: 'انبار', customer: '', hsCode: '',
  });
  const set = (k: string, v: string) => setF(s => ({ ...s, [k]: v }));
  // procsearch: کاتالوگِ واقعیِ کالا/تأمین‌کننده + واحدهای سوپرادمین (به‌جای localStorageِ فیک)
  const [goods, setGoods] = useState<any[]>([]);
  const [supList, setSupList] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>(PROC_UNITS);
  React.useEffect(() => {
    (api as any).myList('proc_inventory').then((r: any) => setGoods(Array.isArray(r) ? r : [])).catch(() => {});
    (api as any).myList('proc_suppliers').then((r: any) => setSupList((Array.isArray(r) ? r : []).map((x: any) => x && x.name).filter(Boolean))).catch(() => {});
    (api as any).getSettings().then((cfg: any) => { if (cfg && Array.isArray(cfg.procUnits) && cfg.procUnits.length) setUnits(cfg.procUnits); }).catch(() => {});
  }, []);
  const inputStyle: React.CSSProperties = { background: 'var(--aw-bg-input)', border: '1px solid var(--aw-border)', color: 'var(--aw-text-primary)', borderRadius: 12, padding: '11px 13px', fontSize: 13, width: '100%', outline: 'none', fontFamily: "'Kamand','Vazirmatn',sans-serif" };

  const submit = () => {
    if (!f.title.trim()) { showToast('«نام کالا» را وارد کنید'); return; }
    lsPush(SUP_KEY, f.supplier); lsPush(HS_KEY, f.hsCode); lsPushGood(f.title, f.unit);
    // procsearch: تأمین‌کنندهٔ جدید به فهرستِ واقعیِ سرور افزوده شود (کالاها در انبار مدیریت می‌شوند)
    try { const _sp = f.supplier.trim(); if (_sp && !supList.includes(_sp)) (api as any).myCreate('proc_suppliers', { id: Date.now() + 7, name: _sp }); } catch (_e) {}
    const rfq = f.rfq.trim() || ('RFQ-' + Math.floor(1086 + Math.random() * 900));
    onAdd({
      id: Date.now(), code: rfq, title: f.title, unit: f.unit, urgency: f.urgency as 'urgent' | 'normal',
      qty: f.qty || '۰', lastPrice: f.lastPrice || '۰', targetAmount: f.target || '۰',
      status: 'new', date: 'همین حالا', requester: f.requester, supplier: f.supplier || '—',
      customer: f.customer || '—', hsCode: f.hsCode || '—', hasAttachment: false,
    });
    closeModal(); showToast('درخواست جدید ثبت شد');
  };

  return (
    <div className="flex flex-col gap-3 p-1">
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1.5">{procFieldLabel('تاریخ')}<JalaliDatePicker value={f.date} onChange={v => set('date', v)} placeholder="انتخاب تاریخ" /></div>
        <div className="flex-1 flex flex-col gap-1.5">{procFieldLabel('شماره RFQ')}<input style={inputStyle} placeholder="خودکار در صورت خالی" value={f.rfq} onChange={e => set('rfq', e.target.value)} /></div>
      </div>
      <div className="flex flex-col gap-1.5">{procFieldLabel('نام کالا')}<ACInput value={f.title} onChange={v => set('title', v)} suggestions={goods.map(g => g.name)} placeholder="نام کالا" onPick={v => { const g = goods.find(x => x.name === v); if (g) set('unit', g.unit); }} /></div>
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1.5">{procFieldLabel('مقدار')}<input style={inputStyle} value={f.qty} onChange={e => set('qty', e.target.value)} /></div>
        <div className="flex-1 flex flex-col gap-1.5">{procFieldLabel('واحد')}<select style={inputStyle} value={f.unit} onChange={e => set('unit', e.target.value)}>{units.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1.5">{procFieldLabel('آخرین قیمت (تومان)')}<input style={inputStyle} value={f.lastPrice} onChange={e => set('lastPrice', __grpFa(e.target.value))} /></div>
        <div className="flex-1 flex flex-col gap-1.5">{procFieldLabel('مبلغ تارگت (تومان)')}<input style={inputStyle} value={f.target} onChange={e => set('target', __grpFa(e.target.value))} /></div>
      </div>
      <div className="flex flex-col gap-1.5">{procFieldLabel('نام تأمین‌کننده')}<ACInput value={f.supplier} onChange={v => set('supplier', v)} suggestions={supList} placeholder="نام تأمین‌کننده" /></div>
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1.5">{procFieldLabel('اولویت')}
          <button type="button" onClick={() => set('urgency', f.urgency === 'urgent' ? 'normal' : 'urgent')}
            className="flex items-center justify-between rounded-[12px] border cursor-pointer px-3"
            style={{ ...inputStyle, borderColor: f.urgency === 'urgent' ? '#EF4444' : 'var(--aw-border)', background: f.urgency === 'urgent' ? 'rgba(239,68,68,0.10)' : 'var(--aw-bg-input)' }}>
            <span className="text-[12px]" style={{ fontWeight: 600, color: f.urgency === 'urgent' ? '#EF4444' : 'var(--aw-text-secondary)' }}>
              <i className={`fa-solid fa-fire text-[11px] ml-1.5 ${f.urgency === 'urgent' ? '' : 'opacity-40'}`} />اضطراری
            </span>
            <span className="relative inline-block" style={{ width: 38, height: 22, borderRadius: 999, background: f.urgency === 'urgent' ? '#EF4444' : 'var(--aw-border)', transition: 'background 0.2s' }}>
              <span className="absolute top-[2px] rounded-full bg-white" style={{ width: 18, height: 18, right: f.urgency === 'urgent' ? 2 : 18, transition: 'right 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
            </span>
          </button>
        </div>
        <div className="flex-1 flex flex-col gap-1.5">{procFieldLabel('ثبت‌کننده')}<select style={inputStyle} value={f.requester} onChange={e => set('requester', e.target.value)}><option value="انبار">انبار</option><option value="فروش">فروش</option></select></div>
      </div>
      <div className="flex flex-col gap-1.5">{procFieldLabel('نام مشتری')}<input style={inputStyle} value={f.customer} onChange={e => set('customer', e.target.value)} /></div>
      <div className="flex flex-col gap-1.5">{procFieldLabel('کد HS')}<ACInput value={f.hsCode} onChange={v => set('hsCode', v)} suggestions={lsArr(HS_KEY)} placeholder="مثلاً 8471.30" /></div>
      <button onClick={submit} className="mt-1 w-full rounded-[12px] border-none cursor-pointer text-white py-3 text-[14px]" style={{ background: 'var(--aw-primary)', fontWeight: 700, fontFamily: "'Kamand','Vazirmatn',sans-serif" }}>ثبت درخواست</button>
    </div>
  );
}

function ProformaView({ req }: { req: PurchaseRequest }) {
  return (
    <div className="flex flex-col gap-2 p-1 text-[12px] text-[var(--aw-text-primary)]">
      <div className="flex items-center justify-between"><span className="text-[var(--aw-text-muted)]">شماره RFQ</span><span style={{ fontWeight: 700 }}>{req.code}</span></div>
      <div className="flex items-center justify-between"><span className="text-[var(--aw-text-muted)]">کالا</span><span>{req.title}</span></div>
      <div className="flex items-center justify-between"><span className="text-[var(--aw-text-muted)]">مقدار</span><span>{req.qty} {req.unit}</span></div>
      <div className="flex items-center justify-between"><span className="text-[var(--aw-text-muted)]">تأمین‌کننده</span><span>{req.supplier}</span></div>
      <div className="flex items-center justify-between"><span className="text-[var(--aw-text-muted)]">مبلغ تارگت</span><span style={{ fontWeight: 700 }}>{req.targetAmount} تومان</span></div>
      <div className="mt-2 rounded-[10px] p-3 text-center text-[var(--aw-text-muted)]" style={{ background: 'var(--aw-bg-app)', border: '1px dashed var(--aw-border)' }}><i className="fa-solid fa-file-invoice text-[22px] mb-1.5" /><div className="text-[11px]">پیش‌فاکتور پیوست‌شده</div></div>
    </div>
  );
}

function ReqDetail({ req }: { req: PurchaseRequest }) {
  const { showToast, openModal } = useApp();
  const st = reqStatusColors[req.status] || { label: '—', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', icon: 'fa-solid fa-circle' };
  const urg = urgencyColors[req.urgency] || { label: '—', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', icon: 'fa-solid fa-circle' };
  const statusText = req.status === 'pending' && req.pendingOn ? st.label + ' — ' + pendingOnLabels[req.pendingOn]
    : req.status === 'rejected' && req.rejectReason ? st.label + ' — ' + rejectReasonLabels[req.rejectReason] : st.label;
  const Row = ({ l, v, c }: { l: string; v: React.ReactNode; c?: string }) => (
    <div className="flex items-center justify-between py-2 border-b border-[var(--aw-border-light)] text-[12px]">
      <span className="text-[var(--aw-text-muted)]">{l}</span>
      <span style={{ fontWeight: 600, color: c || 'var(--aw-text-primary)' }}>{v}</span>
    </div>
  );
  return (
    <div className="flex flex-col p-1">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-[13px] text-[var(--aw-primary)]" style={{ fontWeight: 700 }}>{req.code}</span>
        <StatusBadge label={statusText} color={st.color} />
        {req.urgency === 'urgent' && <StatusBadge label={urg.label} color={urg.color} />}
      </div>
      <Row l="نام کالا" v={req.title} />
      <Row l="تعداد / مقدار" v={req.qty + ' ' + req.unit} />
      <Row l="ضریب اضطرار" v={req.urgency === 'urgent' ? 'اضطراری' : '—'} c={req.urgency === 'urgent' ? urg.color : undefined} />
      <Row l="وضعیت" v={statusText} c={st.color} />
      <Row l="آخرین قیمت" v={req.lastPrice + ' تومان'} />
      <Row l="مبلغ تارگت" v={req.targetAmount + ' تومان'} c="var(--aw-primary)" />
      <Row l="تأمین‌کننده" v={req.supplier} />
      <Row l="نام مشتری" v={req.customer} />
      <Row l="کد HS" v={req.hsCode} />
      <Row l="ثبت‌کننده" v={req.requester} />
      <Row l="تاریخ" v={req.date} />
      <div className="flex gap-2 mt-3">
        {req.hasAttachment && (
          <button onClick={() => openModal('پیش‌فاکتور ' + req.code, <ProformaView req={req} />)} className="flex-1 py-2.5 rounded-[10px] border-none cursor-pointer text-[12px]" style={{ background: 'var(--aw-primary-bg)', color: 'var(--aw-primary)', fontWeight: 600 }}><i className="fa-solid fa-paperclip text-[10px] ml-1" />پیش‌فاکتور</button>
        )}
        <button onClick={() => { try { (api as any).update('purchase_requests', req.id, { status: 'in_progress' }); } catch (_) {} showToast('اقدام برای ' + req.code + ' ثبت شد'); }} className="flex-1 py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[12px]" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 700 }}><i className="fa-solid fa-bolt text-[10px] ml-1" />اقدام</button>
      </div>
    </div>
  );
}

export function ProcRequestsScreen() {
  const { showToast, openModal } = useApp();
  React.useEffect(() => { seedProcSuggestions(); }, []);
  const __coReq = (useApp() as any).company;
  const [added, setAdded] = useState<PurchaseRequest[]>([]);
  useEffect(() => { (async () => { try { const v: any = await (api as any).list('purchase_requests', __coReq); if (Array.isArray(v)) setAdded(v); } catch (_) {} })(); }, [__coReq]);
  const addRequest = (r: PurchaseRequest) => { const next = [r, ...added]; setAdded(next); try { (api as any).create('purchase_requests', { ...r, company: __coReq }).catch(() => {}); } catch (_) {} };
  const requests = added;

  const [filter, setFilter] = useState<'all' | 'new' | 'pending' | 'rejected'>('all');
  const [pendingSub, setPendingSub] = useState<PendingOn | null>(null);
  const [rejectSub, setRejectSub] = useState<RejectReason | null>(null);
  const [dd, setDd] = useState<'pending' | 'rejected' | null>(null);

  const counts = {
    new: requests.filter(r => r.status === 'new').length,
    pending: requests.filter(r => r.status === 'pending').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  let filtered = requests;
  if (filter === 'new') filtered = requests.filter(r => r.status === 'new');
  else if (filter === 'pending') filtered = requests.filter(r => r.status === 'pending' && (!pendingSub || r.pendingOn === pendingSub));
  else if (filter === 'rejected') filtered = requests.filter(r => r.status === 'rejected' && (!rejectSub || r.rejectReason === rejectSub));

  const cardBase = (active: boolean): React.CSSProperties => ({ ...cardStyle, borderRadius: 10, border: active ? '1px solid var(--aw-primary)' : (cardStyle.border as string), boxShadow: active ? '0 0 0 2px color-mix(in srgb, var(--aw-primary) 40%, transparent)' : (cardStyle.boxShadow as string) });

  return (
    <div className="flex flex-col h-full">
      {/* Filter icon cards */}
      <div className="flex gap-2 px-4 mt-3 mb-2.5">
        {/* جدید */}
        <button type="button" onClick={() => { setFilter(filter === 'new' ? 'all' : 'new'); setDd(null); }} className="aw-no-pill flex-1 flex flex-col items-center gap-0.5 pt-2 pb-2 cursor-pointer" style={cardBase(filter === 'new')}>
          <i className="fa-solid fa-wand-magic-sparkles text-[15px]" style={{ color: '#3B82F6' }} />
          <span className="text-[16px] text-[var(--aw-text-primary)] mt-0.5" style={{ fontWeight: 800 }}>{counts.new}</span>
          <span className="text-[10px] text-[var(--aw-text-secondary)]">جدید</span>
        </button>
        {/* در انتظار */}
        <div className="flex-1" style={{ position: 'relative' }}>
          <button type="button" onClick={() => { setFilter(filter === 'pending' && !pendingSub ? 'all' : 'pending'); setPendingSub(null); setDd(null); }} className="aw-no-pill w-full flex flex-col items-center gap-0.5 pt-2 pb-2 cursor-pointer" style={cardBase(filter === 'pending')}>
            <i className="fa-solid fa-hourglass-half text-[15px]" style={{ color: '#F59E0B' }} />
            <span className="text-[16px] text-[var(--aw-text-primary)] mt-0.5" style={{ fontWeight: 800 }}>{counts.pending}</span>
            <span onClick={e => { e.stopPropagation(); setDd(dd === 'pending' ? null : 'pending'); }} className="flex items-center gap-1 mt-0.5 px-2.5 py-0.5 rounded-full cursor-pointer" style={{ whiteSpace: 'nowrap' }}>
              <span className="text-[10px] text-[var(--aw-text-secondary)]">{filter === 'pending' && pendingSub ? pendingOnLabels[pendingSub] : 'در انتظار'}</span>
              <i className="fa-solid fa-chevron-down text-[9px]" style={{ color: '#F59E0B' }} />
            </span>
          </button>
          {dd === 'pending' && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-[10px] overflow-hidden" style={{ background: 'color-mix(in srgb, var(--aw-bg-card) 55%, transparent)', backdropFilter: 'blur(22px) saturate(1.5)', WebkitBackdropFilter: 'blur(22px) saturate(1.5)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2), 0 8px 24px rgba(0,0,0,0.22)' }}>
              {(['supplier', 'sales'] as PendingOn[]).map(k => (
                <button key={k} type="button" onClick={() => { setFilter('pending'); setPendingSub(k); setDd(null); }} className="w-full text-center px-2 py-2 border-none bg-transparent cursor-pointer text-[11px] text-[var(--aw-text-primary)] hover:bg-[var(--aw-primary-bg)]">{pendingOnLabels[k]}</button>
              ))}
            </div>
          )}
        </div>
        {/* رد */}
        <div className="flex-1" style={{ position: 'relative' }}>
          <button type="button" onClick={() => { setFilter(filter === 'rejected' && !rejectSub ? 'all' : 'rejected'); setRejectSub(null); setDd(null); }} className="aw-no-pill w-full flex flex-col items-center gap-0.5 pt-2 pb-2 cursor-pointer" style={cardBase(filter === 'rejected')}>
            <i className="fa-solid fa-xmark text-[15px]" style={{ color: '#EF4444' }} />
            <span className="text-[16px] text-[var(--aw-text-primary)] mt-0.5" style={{ fontWeight: 800 }}>{counts.rejected}</span>
            <span onClick={e => { e.stopPropagation(); setDd(dd === 'rejected' ? null : 'rejected'); }} className="flex items-center gap-1 mt-0.5 px-2.5 py-0.5 rounded-full cursor-pointer" style={{ whiteSpace: 'nowrap' }}>
              <span className="text-[10px] text-[var(--aw-text-secondary)]">{filter === 'rejected' && rejectSub ? rejectReasonLabels[rejectSub] : 'رد'}</span>
              <i className="fa-solid fa-chevron-down text-[9px]" style={{ color: '#EF4444' }} />
            </span>
          </button>
          {dd === 'rejected' && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-[10px] overflow-hidden" style={{ background: 'color-mix(in srgb, var(--aw-bg-card) 55%, transparent)', backdropFilter: 'blur(22px) saturate(1.5)', WebkitBackdropFilter: 'blur(22px) saturate(1.5)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2), 0 8px 24px rgba(0,0,0,0.22)' }}>
              {(['cancelled', 'no-stock'] as RejectReason[]).map(k => (
                <button key={k} type="button" onClick={() => { setFilter('rejected'); setRejectSub(k); setDd(null); }} className="w-full text-center px-2 py-2 border-none bg-transparent cursor-pointer text-[11px] text-[var(--aw-text-primary)] hover:bg-[var(--aw-primary-bg)]">{rejectReasonLabels[k]}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add request */}
      <button type="button" onClick={() => openModal('درخواست خرید جدید', <NewProcRequestForm onAdd={addRequest} />)} className="mx-4 mt-1 mb-1 flex items-center justify-center gap-2 py-2.5 rounded-full cursor-pointer text-[13px]" style={{ background: 'color-mix(in srgb, var(--aw-primary) 12%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 30%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.22), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)', color: 'var(--aw-primary)', fontWeight: 700 }}>
        <i className="fa-solid fa-plus text-[11px]" />افزودن درخواست
      </button>

      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-24 aw-scroll">
        <AnimatePresence mode="wait">
          <motion.div key={filter + String(pendingSub) + String(rejectSub)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2">
            {filtered.map(req => {
              const st = reqStatusColors[req.status] || { label: '—', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', icon: 'fa-solid fa-circle' };
              const urg = urgencyColors[req.urgency] || { label: '—', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', icon: 'fa-solid fa-circle' };
              const statusText = req.status === 'pending' && req.pendingOn ? st.label + ' — ' + pendingOnLabels[req.pendingOn]
                : req.status === 'rejected' && req.rejectReason ? st.label + ' — ' + rejectReasonLabels[req.rejectReason] : st.label;
              return (
                <div key={req.id} className="p-3 cursor-pointer" style={cardStyle} onClick={() => openModal('جزئیات درخواست', <ReqDetail req={req} />)}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] text-[var(--aw-primary)]" style={{ fontWeight: 700 }}>{req.code}</span>
                        <StatusBadge label={statusText} color={st.color} />
                        {req.urgency === 'urgent' && <StatusBadge label={urg.label} color={urg.color} />}
                      </div>
                      <div className="text-[13px] text-[var(--aw-text-primary)] mt-1" style={{ fontWeight: 600 }}>{req.title}</div>
                    </div>
                    {req.hasAttachment && (
                      <button type="button" onClick={e => { e.stopPropagation(); openModal('پیش‌فاکتور ' + req.code, <ProformaView req={req} />); }} className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border-none cursor-pointer" style={{ background: 'var(--aw-primary-bg)' }} title="پیش‌فاکتور">
                        <i className="fa-solid fa-paperclip text-[11px] text-[var(--aw-primary)]" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-[10px] text-[var(--aw-text-muted)]">
                    <span><i className="fa-solid fa-boxes-stacked text-[8px] ml-1" />{req.qty} {req.unit}</span>
                    <span><i className="fa-solid fa-user text-[8px] ml-1" />{req.requester}</span>
                    <span><i className="fa-regular fa-clock text-[8px] ml-1" />{req.date}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--aw-border)]">
                    <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>
                      <i className="fa-solid fa-bullseye text-[10px] ml-1 text-[var(--aw-primary)]" />{req.targetAmount} <span className="text-[10px] text-[var(--aw-text-muted)]">تومان</span>
                    </span>
                    <button type="button" onClick={e => { e.stopPropagation(); openModal('ثبت سفارش خرید', <QuickForm submitLabel="ثبت سفارش" toast="سفارش خرید ثبت شد" fields={[{ key: 'supplier', label: 'تأمین‌کننده' }, { key: 'qty', label: 'تعداد' }, { key: 'date', label: 'تاریخ تحویل', type: 'date' }]} />); }} className="text-[10px] px-3 py-1.5 rounded-lg border-none cursor-pointer text-white" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
                      <i className="fa-solid fa-bolt text-[8px] ml-1" />اقدام
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}


// ========================
// 2. ORDERS SCREEN (سفارشات)
// ========================
const ORD_TABS = [
  { id: 'all', label: 'همه', icon: 'fa-solid fa-list' },
  { id: 'preparing', label: 'در حال آماده‌سازی', icon: 'fa-solid fa-box' },
  { id: 'ready', label: 'آماده ارسال', icon: 'fa-solid fa-box-open' },
  { id: 'shipping', label: 'در حال ارسال', icon: 'fa-solid fa-truck' },
  { id: 'delivered', label: 'تحویل شده', icon: 'fa-solid fa-circle-check' },
  { id: 'cancelled', label: 'لغو شده', icon: 'fa-solid fa-ban' },
];

type OrderStatus = 'preparing' | 'ready' | 'shipping' | 'delivered' | 'cancelled';

interface ProcOrder {
  id: number;
  code: string;            // PO number
  supplier: string;        // اسم شرکت / تأمین‌کننده
  qty: string;             // مقدار (Qty)
  daysLeft: number;        // countdown to delivery (روز مانده); -1 when N/A
  deliveryDate: string;    // زمان تحویل (تاریخ)
  discount: string;        // درصد تخفیف
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  status: OrderStatus;
  visit?: 'none' | 'done';   // مرحله‌ی مراجعه: نیاز نداشت / انجام شد
  amount: string;
  docs: string;            // مدارک
  shipping: string;        // نحوه حمل
}

// stroke color per status: delivered=green, ready/shipping=yellow, cancelled=red, preparing=neutral
function orderStroke(s: OrderStatus): string {
  if (s === 'delivered') return '#10B981';
  if (s === 'ready' || s === 'shipping') return '#F59E0B';
  if (s === 'cancelled') return '#EF4444';
  return 'var(--aw-border)';
}

const MOCK_ORDERS: ProcOrder[] = [];

const ordStatusColors: Record<OrderStatus, { color: string; label: string; icon: string }> = {
  preparing: { color: '#8B5CF6', label: 'در حال آماده‌سازی', icon: 'fa-solid fa-box' },
  ready: { color: '#F59E0B', label: 'آماده ارسال', icon: 'fa-solid fa-box-open' },
  shipping: { color: '#F59E0B', label: 'در حال ارسال', icon: 'fa-solid fa-truck' },
  delivered: { color: '#10B981', label: 'تحویل شده', icon: 'fa-solid fa-circle-check' },
  cancelled: { color: '#EF4444', label: 'لغو شده', icon: 'fa-solid fa-ban' },
};

const payStatusColors: Record<string, { color: string; label: string }> = {
  paid: { color: '#10B981', label: 'پرداخت شده' },
  partial: { color: '#F59E0B', label: 'نیمه‌پرداخت' },
  unpaid: { color: '#EF4444', label: 'پرداخت نشده' },
};

const ORDER_SHIP_METHODS = ['زمینی', 'دریایی', 'هوایی', 'ریلی', 'پیک'];
const ORDER_PAY_OPTIONS = ['پرداخت شده', 'نیمه‌پرداخت', 'پرداخت نشده'];

const ORDER_KEY = 'neura-proc-orders-v1';
const payFromLabel = (l: string): 'paid' | 'partial' | 'unpaid' => l === 'پرداخت شده' ? 'paid' : l === 'نیمه‌پرداخت' ? 'partial' : 'unpaid';

function NewProcOrderForm({ onAdd }: { onAdd: (o: ProcOrder) => void }) {
  return (
    <QuickForm
      submitLabel="ثبت سفارش"
      toast="سفارش خرید ثبت شد"
      onSubmit={v => {
        onAdd({
          id: Date.now(),
          code: (v.code || '').trim() || ('PO-' + Math.floor(2046 + Math.random() * 900)),
          supplier: v.supplier || '—',
          qty: v.qty || '—',
          daysLeft: 7,
          deliveryDate: v.delivery || '—',
          discount: '۰',
          paymentStatus: payFromLabel(v.payment || ''),
          status: 'preparing',
          amount: v.amount || '۰',
          docs: v.docs || '—',
          shipping: v.shipping || '—',
        });
      }}
      fields={[
        { key: 'code', label: 'شماره سفارش', placeholder: 'PO-…' },
        { key: 'supplier', label: 'نام تأمین‌کننده' },
        { key: 'qty', label: 'مقدار (Qty)' },
        { key: 'delivery', label: 'زمان تحویل', type: 'date' },
        { key: 'payment', label: 'وضعیت پرداخت', type: 'select', options: ORDER_PAY_OPTIONS },
        { key: 'docs', label: 'مدارک', placeholder: 'مثلاً پیش‌فاکتور، قرارداد' },
        { key: 'shipping', label: 'نحوه حمل', type: 'select', options: ORDER_SHIP_METHODS },
      ]}
    />
  );
}

const TRACK_KEY = 'neura-proc-tracking-v1';
function trackList(): string[] { try { return JSON.parse(localStorage.getItem(TRACK_KEY) || '[]'); } catch { return []; } }
function trackSet(code: string, on: boolean) { let a = trackList(); if (on && !a.includes(code)) a.push(code); if (!on) a = a.filter(c => c !== code); try { localStorage.setItem(TRACK_KEY, JSON.stringify(a)); } catch {} }

function TrackControls({ code, big }: { code: string; big?: boolean }) {
  const { showToast } = useApp();
  const [on, setOn] = useState(() => trackList().includes(code));
  const size = big ? 'py-2.5 text-[12px] flex-1 justify-center' : 'px-3.5 py-1.5 text-[11px]';
  if (!on) {
    return (
      <button type="button" onClick={e => { e.stopPropagation(); setOn(true); trackSet(code, true); showToast('پیگیری سفارش ' + code + ' آغاز شد'); }}
        className={'aw-no-pill rounded-[8px] cursor-pointer flex items-center gap-1.5 ' + size}
        style={{ background: 'color-mix(in srgb, var(--aw-primary) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--aw-primary) 30%, transparent)', color: 'var(--aw-primary)', fontWeight: 600 }}>
        <i className="fa-solid fa-location-crosshairs text-[10px]" />پیگیری
      </button>
    );
  }
  return (
    <div className={'flex items-center gap-2 ' + (big ? 'flex-1' : '')}>
      <span className={'aw-no-pill rounded-[8px] flex items-center gap-1.5 ' + size} style={{ background: 'color-mix(in srgb, #F59E0B 15%, transparent)', border: '1px solid color-mix(in srgb, #F59E0B 40%, transparent)', color: '#F59E0B', fontWeight: 700 }}>
        <i className="fa-solid fa-spinner fa-spin text-[10px]" />در حال پیگیری
      </span>
      <button type="button" onClick={e => { e.stopPropagation(); setOn(false); trackSet(code, false); showToast('پیگیری سفارش ' + code + ' لغو شد'); }}
        className={'aw-no-pill rounded-[8px] cursor-pointer flex items-center gap-1.5 ' + size}
        style={{ background: 'color-mix(in srgb, #EF4444 12%, transparent)', border: '1px solid color-mix(in srgb, #EF4444 35%, transparent)', color: '#EF4444', fontWeight: 600 }}>
        <i className="fa-solid fa-xmark text-[10px]" />لغو پیگیری
      </button>
    </div>
  );
}

function OrderInvoice({ ord }: { ord: ProcOrder }) {
  const { showToast } = useApp();
  const ps = payStatusColors[ord.paymentStatus] || { label: '—', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', icon: 'fa-solid fa-circle' };
  const num = parseInt((ord.amount || '0').replace(/[^\d]/g, '')) || 0;
  const vat = Math.round(num * 0.09);
  const total = num + vat;
  const fa = (n: number) => n.toLocaleString('en-US').replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
  const Row = ({ l, v, c, bold }: { l: string; v: React.ReactNode; c?: string; bold?: boolean }) => (
    <div className="flex items-center justify-between py-2 border-b border-[var(--aw-border-light)] text-[12px]">
      <span className="text-[var(--aw-text-muted)]">{l}</span>
      <span style={{ fontWeight: bold ? 800 : 600, color: c || 'var(--aw-text-primary)' }}>{v}</span>
    </div>
  );
  return (
    <div className="flex flex-col p-1">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: 'var(--aw-primary-bg)' }}><i className="fa-solid fa-file-invoice text-[13px] text-[var(--aw-primary)]" /></div>
          <div>
            <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>فاکتور خرید</div>
            <div className="text-[10px] text-[var(--aw-text-muted)]">شماره {ord.code}</div>
          </div>
        </div>
        <StatusBadge label={ps.label} color={ps.color} />
      </div>
      <Row l="تأمین‌کننده" v={ord.supplier} />
      <Row l="مقدار" v={ord.qty} />
      <Row l="تاریخ تحویل" v={ord.deliveryDate} />
      <Row l="نحوه حمل" v={ord.shipping} />
      <div className="h-2" />
      <Row l="مبلغ کالا" v={fa(num) + ' تومان'} />
      {ord.discount !== '۰' && <Row l={'تخفیف (٪' + ord.discount + ')'} v={'—'} c="#10B981" />}
      <Row l="مالیات بر ارزش افزوده (۹٪)" v={fa(vat) + ' تومان'} />
      <Row l="مبلغ نهایی" v={fa(total) + ' تومان'} c="var(--aw-primary)" bold />
      <div className="flex gap-2 mt-3">
        <button onClick={() => showToast('فاکتور ' + ord.code + ' دانلود شد')} className="flex-1 py-2.5 rounded-[10px] border-none cursor-pointer text-[12px]" style={{ background: 'var(--aw-primary-bg)', color: 'var(--aw-primary)', fontWeight: 600 }}><i className="fa-solid fa-download text-[10px] ml-1" />دانلود PDF</button>
        <button onClick={() => { try { (api as any).update('purchase_orders', ord.id, { invoiceStatus: 'sent' }); } catch (_) {} showToast('فاکتور ' + ord.code + ' ارسال شد'); }} className="flex-1 py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[12px]" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 700 }}><i className="fa-solid fa-paper-plane text-[10px] ml-1" />ارسال</button>
      </div>
    </div>
  );
}

function OrderStepper({ status, visit, compact }: { status: OrderStatus; visit?: 'none' | 'done'; compact?: boolean }) {
  const PRIMARY = 'var(--aw-primary)', MUTED_BG = 'var(--aw-bg-hover)', MUTED_TX = 'var(--aw-text-muted)';
  const stages: Record<'done' | 'active' | 'todo', string>[] = [
    { done: 'ثبت شد', active: 'در انتظار ثبت', todo: 'در انتظار ثبت' },
    { done: 'تخصیص داده شد', active: 'در انتظار تخصیص', todo: 'تخصیص' },
    { done: 'نیاز به مراجعه ندارد\nمراجعه انجام شد', active: 'نیاز به مراجعه', todo: 'نیاز به مراجعه' },
    { done: 'انجام شده', active: 'در انتظار', todo: 'در انتظار' },
  ];
  // current = number of COMPLETED (green) stages; stage at index `current` is in-progress (yellow)
  const map: Record<OrderStatus, number> = { preparing: 0, ready: 1, shipping: 2, delivered: 4, cancelled: -1 };
  const current = map[status];
  const cancelled = status === 'cancelled';
  // stage-2 (مراجعه) done label branches on the visit field; fully-done order shows both lines
  const visitDoneLabel = current >= 4
    ? 'نیاز به مراجعه ندارد\nمراجعه انجام شد'
    : (visit === 'done' ? 'مراجعه انجام شد' : 'نیاز به مراجعه ندارد');
  const stateOf = (i: number): 'done' | 'active' | 'todo' =>
    cancelled ? 'todo' : i < current ? 'done' : i === current ? 'active' : 'todo';
  const DOT = compact ? 20 : 24;
  return (
    <div className={'flex items-start gap-0 px-1 ' + (compact ? '' : 'mt-1 mb-1')} style={{ direction: 'rtl' }}>
      {stages.map((s, i) => {
        const st = stateOf(i);
        const done = st === 'done', active = st === 'active';
        const bg = done ? PRIMARY : 'transparent';
        const fg = done ? '#fff' : active ? PRIMARY : MUTED_TX;
        const ring = done ? PRIMARY : active ? PRIMARY : MUTED_TX;
        const labelColor = (done || active) ? PRIMARY : MUTED_TX;
        const label = i === 2 && st === 'done' ? visitDoneLabel : s[st];
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0" style={{ width: compact ? 62 : 76 }}>
              <div className="rounded-full flex items-center justify-center" style={{ width: DOT, height: DOT, background: bg, color: fg, border: done ? 'none' : `1.5px solid ${ring}`, fontSize: compact ? 9 : 11, fontWeight: 700 }}>
                {done ? <i className="fa-solid fa-check" /> : (i + 1)}
              </div>
              <span className="text-center leading-tight" style={{ fontSize: compact ? 8 : 10, color: labelColor, fontWeight: active ? 700 : done ? 600 : 500, whiteSpace: 'pre-line' }}>{label}</span>
            </div>
            {i < 3 && (
              <div className="flex-1 h-0.5 rounded-full" style={{ background: (!cancelled && i < current) ? PRIMARY : MUTED_BG, marginTop: DOT / 2 - 1, marginInline: 2 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function OrderDetail({ ord }: { ord: ProcOrder }) {
  const { showToast, openModal } = useApp();
  const st = ordStatusColors[ord.status] || { label: '—', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', icon: 'fa-solid fa-circle' };
  const ps = payStatusColors[ord.paymentStatus] || { label: '—', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', icon: 'fa-solid fa-circle' };
  const cd = ord.status === 'delivered' ? 'تحویل شده' : ord.daysLeft < 0 ? '—' : ord.daysLeft === 0 ? 'امروز' : ord.daysLeft + ' روز مانده';
  const Row = ({ l, v, c }: { l: string; v: React.ReactNode; c?: string }) => (
    <div className="flex items-center justify-between py-2 border-b border-[var(--aw-border-light)] text-[12px]">
      <span className="text-[var(--aw-text-muted)]">{l}</span>
      <span style={{ fontWeight: 600, color: c || 'var(--aw-text-primary)' }}>{v}</span>
    </div>
  );
  return (
    <div className="flex flex-col p-1">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-[13px] text-[var(--aw-primary)]" style={{ fontWeight: 700 }}>{ord.code}</span>
        <StatusBadge label={st.label} color={st.color} />
        {ord.discount !== '۰' && <StatusBadge label={'٪' + ord.discount + ' تخفیف'} color="#10B981" />}
      </div>
      <OrderStepper status={ord.status} visit={ord.visit} />
      <Row l="تأمین‌کننده / شرکت" v={ord.supplier} />
      <Row l="مقدار (Qty)" v={ord.qty} />
      <Row l="زمان تحویل" v={ord.deliveryDate + (ord.status !== 'delivered' && ord.daysLeft >= 0 ? '  (' + cd + ')' : '')} c={ord.daysLeft >= 0 && ord.daysLeft <= 3 && ord.status !== 'delivered' ? '#F59E0B' : ord.status === 'delivered' ? '#10B981' : undefined} />
      <Row l="وضعیت پرداخت" v={ps.label} c={ps.color} />
      <Row l="مدارک" v={ord.docs} />
      <Row l="نحوه حمل" v={ord.shipping} />
      {ord.discount !== '۰' && <Row l="درصد تخفیف" v={'٪' + ord.discount} c="#10B981" />}
      <Row l="مبلغ" v={ord.amount + ' تومان'} c="var(--aw-primary)" />
      <div className="flex gap-2 mt-3">
        <TrackControls code={ord.code} big />
        <button onClick={() => openModal('فاکتور ' + ord.code, <OrderInvoice ord={ord} />)} className="flex-1 py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[12px]" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 700 }}><i className="fa-solid fa-file-invoice text-[10px] ml-1" />فاکتور</button>
      </div>
    </div>
  );
}

export function ProcOrdersScreen() {
  const { showToast, openModal } = useApp();
  const [tab, setTab] = useState('all');
  const [shipDd, setShipDd] = useState(false);
  const __coOrd = (useApp() as any).company;
  const [added, setAdded] = useState<ProcOrder[]>([]);
  useEffect(() => { (async () => { try { const v: any = await (api as any).list('purchase_orders', __coOrd); if (Array.isArray(v)) setAdded(v); } catch (_) {} })(); }, [__coOrd]);
  const addOrder = (o: ProcOrder) => { const next = [o, ...added]; setAdded(next); try { (api as any).create('purchase_orders', { ...o, company: __coOrd }).catch(() => {}); } catch (_) {} };
  const orders = added;
  const cardBase = (active: boolean): React.CSSProperties => ({ ...cardStyle, borderRadius: 10, border: active ? '1px solid var(--aw-primary)' : (cardStyle.border as string), boxShadow: active ? '0 0 0 2px color-mix(in srgb, var(--aw-primary) 40%, transparent)' : (cardStyle.boxShadow as string) });
  const filtered = tab === 'all' ? orders : orders.filter(o => o.status === tab);

  const countdown = (o: ProcOrder) => {
    if (o.status === 'delivered') return { text: 'تحویل شده', color: '#10B981' };
    if (o.daysLeft < 0) return { text: '—', color: 'var(--aw-text-muted)' };
    if (o.daysLeft === 0) return { text: 'امروز', color: '#F59E0B' };
    return { text: o.daysLeft + ' روز مانده به تحویل', color: o.daysLeft <= 3 ? '#F59E0B' : 'var(--aw-text-secondary)' };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filter cards */}
      <div className="flex gap-2 px-4 mt-3 mb-2">
        {/* ارسال — combined dropdown */}
        {(() => {
          const shipSubs = [
            { id: 'preparing', label: 'در حال آماده‌سازی', icon: 'fa-solid fa-box', color: '#8B5CF6' },
            { id: 'ready', label: 'آماده ارسال', icon: 'fa-solid fa-box-open', color: '#F59E0B' },
            { id: 'shipping', label: 'در حال ارسال', icon: 'fa-solid fa-truck', color: '#F97316' },
          ] as const;
          const active = tab === 'preparing' || tab === 'ready' || tab === 'shipping';
          const activeSub = shipSubs.find(s => s.id === tab);
          const cnt = orders.filter(o => o.status === 'preparing' || o.status === 'ready' || o.status === 'shipping').length;
          return (
            <div className="flex-1" style={{ position: 'relative' }}>
              <button type="button" onClick={() => { if (active) { setTab('all'); setShipDd(false); } else { setShipDd(v => !v); } }}
                className="aw-no-pill w-full flex flex-col items-center gap-0.5 pt-2 pb-2 px-2 cursor-pointer"
                style={cardBase(active)}>
                <i className={(activeSub ? activeSub.icon : 'fa-solid fa-truck-fast') + ' text-[15px]'} style={{ color: activeSub ? activeSub.color : '#F59E0B' }} />
                <span className="text-[16px] text-[var(--aw-text-primary)] mt-0.5" style={{ fontWeight: 800 }}>{cnt}</span>
                <span onClick={e => { e.stopPropagation(); setShipDd(v => !v); }} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full cursor-pointer">
                  <span className="text-[9px] text-[var(--aw-text-secondary)] leading-tight">{activeSub ? activeSub.label : 'ارسال'}</span>
                  <i className="fa-solid fa-chevron-down text-[8px]" style={{ color: '#F59E0B' }} />
                </span>
              </button>
              {shipDd && (
                <div className="absolute right-0 z-30 mt-1.5 rounded-[10px] overflow-hidden" style={{ minWidth: 150, background: 'color-mix(in srgb, var(--aw-bg-card) 55%, transparent)', backdropFilter: 'blur(22px) saturate(1.5)', WebkitBackdropFilter: 'blur(22px) saturate(1.5)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2), 0 8px 24px rgba(0,0,0,0.22)' }}>
                  {shipSubs.map(s => (
                    <button key={s.id} type="button" onClick={() => { setTab(s.id); setShipDd(false); }} className="w-full flex items-center gap-2 px-3 py-2 border-none bg-transparent cursor-pointer text-[11px] text-[var(--aw-text-primary)] hover:bg-[var(--aw-primary-bg)]" style={{ justifyContent: 'flex-start' }}>
                      <i className={s.icon + ' text-[11px]'} style={{ color: s.color }} />
                      <span>{s.label}</span>
                      <span className="text-[10px] text-[var(--aw-text-muted)] mr-auto">{orders.filter(o => o.status === s.id).length}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
        {([
          { id: 'delivered', label: 'تحویل شده', icon: 'fa-solid fa-circle-check', color: '#10B981' },
          { id: 'cancelled', label: 'لغو شده', icon: 'fa-solid fa-ban', color: '#EF4444' },
        ] as const).map(f => {
          const active = tab === f.id;
          const cnt = orders.filter(o => o.status === f.id).length;
          return (
            <button key={f.id} type="button" onClick={() => { setTab(active ? 'all' : f.id); setShipDd(false); }}
              className="aw-no-pill flex-1 flex flex-col items-center gap-0.5 pt-2 pb-2 px-2 cursor-pointer"
              style={cardBase(active)}>
              <i className={f.icon + ' text-[15px]'} style={{ color: f.color }} />
              <span className="text-[16px] text-[var(--aw-text-primary)] mt-0.5" style={{ fontWeight: 800 }}>{cnt}</span>
              <span className="text-[9px] text-[var(--aw-text-secondary)] text-center leading-tight" style={{ whiteSpace: 'normal' }}>{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* Add order */}
      <button type="button" onClick={() => openModal('ایجاد سفارش خرید', <NewProcOrderForm onAdd={addOrder} />)} className="mx-4 mt-0 mb-1.5 flex items-center justify-center gap-2 py-2.5 rounded-full cursor-pointer text-[13px]" style={{ background: 'color-mix(in srgb, var(--aw-primary) 12%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 30%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.22), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)', color: 'var(--aw-primary)', fontWeight: 700 }}>
        <i className="fa-solid fa-plus text-[11px]" />ایجاد سفارش
      </button>

      <div className="flex-1 overflow-y-auto px-4 pb-24 aw-scroll">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2">
            {filtered.map((ord, i) => {
              const st = ordStatusColors[ord.status] || { label: '—', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', icon: 'fa-solid fa-circle' };
              const ps = payStatusColors[ord.paymentStatus] || { label: '—', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', icon: 'fa-solid fa-circle' };
              const cd = countdown(ord);
              const stroke = orderStroke(ord.status);
              return (
                <motion.div key={ord.id} onClick={() => openModal('جزئیات سفارش', <OrderDetail ord={ord} />)}
                  className="p-3 cursor-pointer" style={{ ...cardStyle, borderRadius: 10, border: `1.5px solid color-mix(in srgb, ${stroke} 50%, transparent)` }}
                  initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  {/* top: اطلاعات (راست) · قیمت/تخفیف/شمارنده (چپ) — هم‌تراز عمودی */}
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-[var(--aw-primary)]" style={{ fontWeight: 700 }}>{ord.code}</span>
                        <StatusBadge label={st.label} color={st.color} />
                      </div>
                      <div className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>
                        <i className="fa-solid fa-building text-[10px] ml-1.5 text-[var(--aw-text-muted)]" />{ord.supplier}
                      </div>
                      <div className="flex items-center gap-2.5 flex-wrap text-[10px] text-[var(--aw-text-muted)]">
                        <span><i className="fa-solid fa-boxes-stacked text-[8px] ml-1" />{ord.qty}</span>
                        <span><i className="fa-regular fa-calendar text-[8px] ml-1" />{ord.deliveryDate}</span>
                        <StatusBadge label={ps.label} color={ps.color} />
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-[16px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{ord.amount} <span className="text-[9px] text-[var(--aw-text-muted)]" style={{ fontWeight: 400 }}>تومان</span></span>
                      {ord.discount !== '۰' && (
                        <span className="text-[9px] mt-0.5" style={{ color: '#10B981', fontWeight: 700 }}><i className="fa-solid fa-tag text-[7px] ml-1" />٪{ord.discount} تخفیف</span>
                      )}
                      {ord.status === 'delivered' ? (
                        <span className="text-[11px] mt-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'color-mix(in srgb, #10B981 14%, transparent)', color: '#10B981', fontWeight: 700, whiteSpace: 'nowrap' }}><i className="fa-solid fa-circle-check text-[10px] ml-1" />تحویل شده</span>
                      ) : ord.daysLeft > 0 ? (
                        <div className="flex items-baseline gap-1 mt-1">
                          <span style={{ fontSize: 28, fontWeight: 800, color: cd.color, lineHeight: 1 }}>{String(ord.daysLeft).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])}</span>
                          <span className="text-[8px]" style={{ color: cd.color, fontWeight: 600, whiteSpace: 'nowrap' }}>روز تا تحویل</span>
                        </div>
                      ) : ord.daysLeft === 0 ? (
                        <span className="text-[12px] mt-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, #F59E0B 14%, transparent)', color: '#F59E0B', fontWeight: 800, whiteSpace: 'nowrap' }}>تحویل امروز</span>
                      ) : null}
                    </div>
                  </div>

                  {/* stepper */}
                  <div className="pt-1.5 mt-0.5 border-t border-[var(--aw-border)]">
                    <OrderStepper status={ord.status} visit={ord.visit} compact />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ========================
// 3. DELIVERY SCREEN (دریافت و تحویل)
// ========================
const DEL_TABS = [
  { id: 'all', label: 'همه', icon: 'fa-solid fa-list' },
  { id: 'awaiting', label: 'انتظار', icon: 'fa-solid fa-clock' },
  { id: 'partial', label: 'جزئی', icon: 'fa-solid fa-circle-half-stroke' },
  { id: 'complete', label: 'کامل', icon: 'fa-solid fa-circle-check' },
  { id: 'discrepancy', label: 'مغایرت', icon: 'fa-solid fa-triangle-exclamation' },
];

type DeliveryStatus = 'awaiting' | 'partial' | 'complete' | 'discrepancy';

interface Delivery {
  id: number;
  orderCode: string;
  supplier: string;
  expectedDate: string;
  receivedDate: string;
  status: DeliveryStatus;
  totalItems: number;
  receivedItems: number;
  note: string;
}

const MOCK_DELIVERIES: Delivery[] = [];

const delStatusColors: Record<DeliveryStatus, { color: string; label: string; icon: string }> = {
  awaiting: { color: '#F59E0B', label: 'در انتظار تحویل', icon: 'fa-solid fa-clock' },
  partial: { color: '#3B82F6', label: 'تحویل جزئی', icon: 'fa-solid fa-circle-half-stroke' },
  complete: { color: '#10B981', label: 'تحویل کامل', icon: 'fa-solid fa-circle-check' },
  discrepancy: { color: '#EF4444', label: 'مغایرت / مرجوعی', icon: 'fa-solid fa-triangle-exclamation' },
};

export function ProcDeliveryScreen() {
  const __coDel = (useApp() as any).company;
  const [tab, setTab] = useState('all');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  useEffect(() => { (async () => { try { const v: any = await (api as any).list('deliveries', __coDel); if (Array.isArray(v)) setDeliveries(v); } catch (_) {} })(); }, [__coDel]);
  const filtered = tab === 'all' ? deliveries : deliveries.filter(d => d.status === tab);

  return (
    <div className="flex flex-col h-full">
      <TabBar tabs={DEL_TABS} active={tab} onChange={setTab} />

      <div className="flex-1 overflow-y-auto px-4 pb-24 aw-scroll">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2">
            {filtered.map((del, i) => {
              const st = delStatusColors[del.status] || { label: '—', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', icon: 'fa-solid fa-circle' };
              const progress = del.totalItems > 0 ? (del.receivedItems / del.totalItems) * 100 : 0;
              return (
                <motion.div key={del.id} className="p-3" style={cardStyle}
                  initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[var(--aw-primary)]" style={{ fontWeight: 700 }}>{del.orderCode}</span>
                        <StatusBadge label={st.label} color={st.color} />
                      </div>
                      <div className="text-[12px] text-[var(--aw-text-primary)] mt-1" style={{ fontWeight: 600 }}>
                        <i className="fa-solid fa-building text-[9px] ml-1 text-[var(--aw-text-muted)]" />{del.supplier}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: `${st.color}15` }}>
                      <i className={`${st.icon} text-[16px]`} style={{ color: st.color }} />
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--aw-bg-hover)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: st.color }} />
                    </div>
                    <span className="text-[11px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>
                      {del.receivedItems}/{del.totalItems}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap text-[10px] text-[var(--aw-text-muted)] mt-2">
                    <span><i className="fa-solid fa-calendar text-[8px] ml-1" />موعد: {del.expectedDate}</span>
                    {del.receivedDate !== '—' && (
                      <span><i className="fa-solid fa-calendar-check text-[8px] ml-1" />دریافت: {del.receivedDate}</span>
                    )}
                  </div>
                  <div className="text-[10px] text-[var(--aw-text-secondary)] mt-1.5 flex items-center gap-1">
                    <i className="fa-solid fa-sticky-note text-[8px]" />
                    {del.note}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}


// ========================
// 4. PROCUREMENT FINANCE SCREEN (مالی تأمین)
// ========================
const FIN_TABS = [
  { id: 'all', label: 'همه', icon: 'fa-solid fa-list' },
  { id: 'paid', label: 'پرداخت‌شده', icon: 'fa-solid fa-check-circle' },
  { id: 'pending', label: 'انتظار', icon: 'fa-solid fa-hourglass-half' },
  { id: 'debt', label: 'بدهی', icon: 'fa-solid fa-exclamation-circle' },
];

type FinStatus = 'paid' | 'pending' | 'debt';

interface ProcFinanceItem {
  id: number;
  invoiceCode: string;
  supplier: string;
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
  status: FinStatus;
  dueDate: string;
  orderCode: string;
}

const MOCK_PROC_FINANCE: ProcFinanceItem[] = [];

const finStatusColors: Record<FinStatus, { color: string; label: string }> = {
  paid: { color: '#10B981', label: 'تسویه شده' },
  pending: { color: '#F59E0B', label: 'در انتظار پرداخت' },
  debt: { color: '#EF4444', label: 'بدهکار' },
};

function FinDetail({ fin }: { fin: ProcFinanceItem }) {
  const { openModal } = useApp();
  const st = finStatusColors[fin.status] || { label: '—', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', icon: 'fa-solid fa-circle' };
  const totalNum = parseInt(String(fin.totalAmount || '0').replace(/[^\d]/g, '')) || 0;
  const paidNum = parseInt(String(fin.paidAmount || '0').replace(/[^\d]/g, '')) || 0;
  const progress = totalNum > 0 ? Math.round((paidNum / totalNum) * 100) : 0;
  const Row = ({ l, v, c }: { l: string; v: React.ReactNode; c?: string }) => (
    <div className="flex items-center justify-between py-2 border-b border-[var(--aw-border-light)] text-[12px]">
      <span className="text-[var(--aw-text-muted)]">{l}</span>
      <span style={{ fontWeight: 600, color: c || 'var(--aw-text-primary)' }}>{v}</span>
    </div>
  );
  return (
    <div className="flex flex-col p-1">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-[13px] text-[var(--aw-primary)]" style={{ fontWeight: 700 }}>{fin.invoiceCode}</span>
        <StatusBadge label={st.label} color={st.color} />
      </div>
      <Row l="تأمین‌کننده" v={fin.supplier} />
      <Row l="شماره سفارش" v={fin.orderCode} />
      <Row l="مبلغ کل" v={fin.totalAmount + ' تومان'} />
      <Row l="پرداخت‌شده" v={fin.paidAmount + ' تومان'} c="#10B981" />
      <Row l="مانده" v={fin.remainingAmount + ' تومان'} c={fin.remainingAmount === '۰' ? 'var(--aw-text-primary)' : '#EF4444'} />
      <Row l="سررسید" v={fin.dueDate} />
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-[var(--aw-text-muted)]">درصد پرداخت</span>
          <span style={{ fontWeight: 700, color: st.color, direction: 'ltr' }}>٪{toFa(progress)}</span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ background: 'var(--aw-bg-hover)' }}>
          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: progress === 100 ? '#10B981' : progress > 0 ? '#F59E0B' : '#EF4444' }} />
        </div>
      </div>
      {fin.status !== 'paid' && (
        <button onClick={() => openModal('ثبت پرداخت', <QuickForm submitLabel="ثبت پرداخت" toast="پرداخت ثبت شد" fields={[{ key: 'to', label: 'دریافت‌کننده' }, { key: 'amount', label: 'مبلغ (تومان)' }, { key: 'method', label: 'روش', type: 'select', options: ['نقدی', 'کارت‌به‌کارت', 'چک', 'حواله'] }]} />)}
          className="mt-4 w-full rounded-[12px] border-none cursor-pointer text-white py-3 text-[13px]" style={{ background: 'var(--aw-primary)', fontWeight: 700, fontFamily: "'Kamand','Vazirmatn',sans-serif" }}>
          <i className="fa-solid fa-credit-card text-[11px] ml-1.5" />ثبت پرداخت
        </button>
      )}
    </div>
  );
}

function ProcNewInvoiceForm({ onAdd }: { onAdd: (inv: ProcFinanceItem) => void }) {
  const { closeModal, showToast } = useApp();
  const grp = (s: string) => { const n = s.replace(/[^\d]/g, ''); return n ? Number(n).toLocaleString('en-US') : ''; };
  const fa = (s: string) => s.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
  const [f, setF] = useState({ invoiceCode: '', supplier: '', orderCode: '', total: '', paid: '', dueDate: '' });
  const set = (k: string, v: string) => setF(s => ({ ...s, [k]: v }));
  const totalN = Number((f.total || '').replace(/[^\d]/g, '')) || 0;
  const paidN = Number((f.paid || '').replace(/[^\d]/g, '')) || 0;
  const remaining = Math.max(0, totalN - paidN);
  const status: FinStatus = totalN > 0 && paidN >= totalN ? 'paid' : paidN > 0 ? 'pending' : 'debt';
  const inputStyle: React.CSSProperties = { background: 'var(--aw-bg-input)', border: '1px solid var(--aw-border)', borderRadius: 12, padding: '10px 12px', fontSize: 13, color: 'var(--aw-text-primary)', width: '100%', outline: 'none', fontFamily: "'Kamand','Vazirmatn',sans-serif" };
  const Label = ({ children }: { children: React.ReactNode }) => <span className="text-[11px] text-[var(--aw-text-secondary)]" style={{ fontWeight: 600 }}>{children}</span>;
  const submit = () => {
    if (!f.supplier.trim()) { showToast('نام تأمین‌کننده را وارد کنید'); return; }
    const code = f.invoiceCode.trim() || ('INV-' + fa(String(Math.floor(5022 + Math.random() * 900))));
    onAdd({
      id: Date.now(), invoiceCode: code, supplier: f.supplier.trim(),
      orderCode: f.orderCode.trim() || '—',
      totalAmount: totalN ? fa(grp(f.total)) : '۰',
      paidAmount: paidN ? fa(grp(f.paid)) : '۰',
      remainingAmount: fa(remaining.toLocaleString('en-US')),
      status, dueDate: f.dueDate.trim() || '—',
    });
    showToast('فاکتور ثبت شد');
    closeModal();
  };
  const statusColor = status === 'paid' ? '#10B981' : status === 'pending' ? '#F59E0B' : '#EF4444';
  const statusLabel = status === 'paid' ? 'تسویه شده' : status === 'pending' ? 'تسویه نشده' : 'بدهی';
  return (
    <div className="flex flex-col gap-2.5 p-1">
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1.5"><Label>شماره فاکتور</Label><input style={inputStyle} value={f.invoiceCode} onChange={e => set('invoiceCode', e.target.value)} placeholder="خودکار" /></div>
        <div className="flex-1 flex flex-col gap-1.5"><Label>شماره سفارش (PO)</Label><ACInput value={f.orderCode} onChange={v => set('orderCode', v)} suggestions={[]} placeholder="PO-…" /></div>
      </div>
      <div className="flex flex-col gap-1.5"><Label>تأمین‌کننده</Label><ACInput value={f.supplier} onChange={v => set('supplier', v)} suggestions={lsArr(SUP_KEY)} placeholder="نام تأمین‌کننده" /></div>
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1.5"><Label>مبلغ کل (تومان)</Label><input style={inputStyle} inputMode="numeric" value={f.total} onChange={e => set('total', grp(e.target.value))} placeholder="۰" /></div>
        <div className="flex-1 flex flex-col gap-1.5"><Label>پرداخت‌شده (تومان)</Label><input style={inputStyle} inputMode="numeric" value={f.paid} onChange={e => set('paid', grp(e.target.value))} placeholder="۰" /></div>
      </div>
      <div className="flex flex-col gap-1.5"><Label>تاریخ سررسید</Label><input style={inputStyle} value={f.dueDate} onChange={e => set('dueDate', e.target.value)} placeholder="۱۴۰۴/۱۲/۲۰" /></div>
      <div className="flex items-center justify-between rounded-[10px] px-3 py-2 mt-1" style={{ background: `${statusColor}14` }}>
        <span className="text-[11px] text-[var(--aw-text-secondary)]">مانده: <span style={{ fontWeight: 700, color: '#EF4444', direction: 'ltr', unicodeBidi: 'plaintext' }}>{fa(remaining.toLocaleString('en-US'))} تومان</span></span>
        <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: `${statusColor}22`, color: statusColor, fontWeight: 700 }}>{statusLabel}</span>
      </div>
      <button onClick={submit} className="mt-1 w-full rounded-[12px] border-none cursor-pointer text-white py-3 text-[14px]" style={{ background: 'var(--aw-primary)', fontWeight: 700, fontFamily: "'Kamand','Vazirmatn',sans-serif" }}>ثبت فاکتور</button>
    </div>
  );
}

export function ProcFinanceScreen() {
  const { openModal, showToast } = useApp();
  const [mainTab, setMainTab] = useState<'finance' | 'report'>('finance');
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const __coFin = (useApp() as any).company;
  const [invoices, setInvoices] = useState<ProcFinanceItem[]>([]);
  useEffect(() => { (async () => { try { const v: any = await (api as any).list('purchase_invoices', __coFin); if (Array.isArray(v)) setInvoices(v); } catch (_) {} })(); }, [__coFin]);

  const addInvoice = (inv: ProcFinanceItem) => { setInvoices(prev => [inv, ...prev]); try { (api as any).create('purchase_invoices', { ...inv, company: __coFin }).catch(() => {}); } catch (_) {} };
  const filtered = invoices.filter(f => {
    if (tab !== 'all' && tab !== 'credit' && f.status !== tab) return false;
    if (search) {
      const q = search.trim();
      if (!f.invoiceCode.includes(q) && !f.supplier.includes(q) && !f.orderCode.includes(q)) return false;
    }
    return true;
  });

  // Summary calc
  const totalDebt = '۰';      // بدهی — هیچ پرداختی نشده
  const totalPending = '۰';     // تسویه‌نشده — پرداخت ناقص
  const totalPaid = '۰';       // تسویه‌شده
  const totalCredit = '۰';      // اعتبار نزد تأمین‌کنندگان

  return (
    <div className="flex flex-col h-full">
      {/* Main tabs: مالی / گزارش */}
      <div className="px-4 pt-3">
        <div className="flex gap-0.5 p-[3px] rounded-full border" style={{ background: 'var(--aw-eu-nav-bg)', borderColor: 'var(--aw-eu-nav-border)' }}>
          {([
            { id: 'finance' as const, label: 'مالی', icon: 'fa-solid fa-wallet' },
            { id: 'report' as const, label: 'گزارش', icon: 'fa-solid fa-chart-pie' },
          ]).map(t => {
            const active = mainTab === t.id;
            return (
              <button key={t.id} onClick={() => setMainTab(t.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full border-none cursor-pointer text-[12px] transition-all"
                style={active ? { background: 'var(--aw-bg-card)', color: 'var(--aw-text-primary)', fontWeight: 700, boxShadow: 'inset 0 0 0 1px var(--aw-border), 0 2px 6px rgba(0,0,0,0.10)' } : { background: 'transparent', color: 'var(--aw-text-secondary)', fontWeight: 500 }}>
                <i className={`${t.icon} text-[11px]`} style={active ? { color: 'var(--aw-primary)' } : {}} />{t.label}
              </button>
            );
          })}
        </div>
      </div>

      {mainTab === 'report' ? <ProcFinanceReport /> : (<>
      {/* Summary — 4 square filter cards in one row */}
      <div className="grid grid-cols-4 gap-2 px-4 mt-3">
        {([
          { id: 'paid', label: 'تسویه شده', value: totalPaid, color: '#10B981', icon: 'fa-solid fa-check-circle' },
          { id: 'pending', label: 'تسویه نشده', value: totalPending, color: '#F59E0B', icon: 'fa-solid fa-hourglass-half' },
          { id: 'debt', label: 'بدهی', value: totalDebt, color: '#EF4444', icon: 'fa-solid fa-exclamation-triangle' },
          { id: 'credit', label: 'اعتبار', value: totalCredit, color: '#3B82F6', icon: 'fa-solid fa-hand-holding-dollar' },
        ]).map((s, i) => {
          const active = tab === s.id;
          return (
            <motion.button key={s.id} onClick={() => setTab(active ? 'all' : s.id)}
              className="aw-no-pill rounded-[8px] p-2 flex flex-col items-center gap-1 cursor-pointer border transition-all"
              style={{ ...cardStyle, borderRadius: 8, border: active ? `1.5px solid ${s.color}` : '1px solid color-mix(in srgb, var(--aw-primary) 18%, transparent)', background: active ? `${s.color}1A` : cardStyle.background }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <i className={`${s.icon} text-[15px]`} style={{ color: s.color }} />
              <span className="text-[10px] text-[var(--aw-text-primary)] text-center leading-tight" style={{ fontWeight: 800, direction: 'ltr', unicodeBidi: 'plaintext' }}>{s.value}</span>
              <span className="text-[8.5px] text-[var(--aw-text-muted)]">{s.label}</span>
            </motion.button>
          );
        })}
      </div>


      {/* Search + new invoice */}
      <div className="flex items-center gap-2 px-4 mt-3">
        <div className="relative flex-1">
          <i className="fa-solid fa-magnifying-glass absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[var(--aw-text-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجوی فاکتور، تأمین‌کننده یا سفارش…"
            className="w-full rounded-[10px] border py-2 pr-8 pl-3 text-[12px] outline-none"
            style={{ background: 'var(--aw-bg-input)', borderColor: 'var(--aw-border)', color: 'var(--aw-text-primary)', fontFamily: "'Kamand','Vazirmatn',sans-serif" }} />
        </div>
        <button onClick={() => openModal('فاکتور جدید', <ProcNewInvoiceForm onAdd={addInvoice} />)}
          className="flex items-center gap-1.5 rounded-[10px] border-none cursor-pointer text-white px-3 py-2 text-[12px] flex-shrink-0"
          style={{ background: 'var(--aw-primary)', fontWeight: 700, fontFamily: "'Kamand','Vazirmatn',sans-serif" }}>
          <i className="fa-solid fa-plus text-[11px]" />فاکتور جدید
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-24 aw-scroll">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2">
            {filtered.length === 0 && (
              <div className="text-center text-[12px] text-[var(--aw-text-muted)] py-10">
                <i className="fa-solid fa-file-invoice-dollar text-[24px] mb-2 block opacity-40" />فاکتوری یافت نشد
              </div>
            )}
            {filtered.map((fin, i) => {
              const st = finStatusColors[fin.status] || { label: '—', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', icon: 'fa-solid fa-circle' };
              const totalNum = parseInt(String(fin.totalAmount || '0').replace(/[^\d]/g, '')) || 0;
              const paidNum = parseInt(String(fin.paidAmount || '0').replace(/[^\d]/g, '')) || 0;
              const progress = totalNum > 0 ? (paidNum / totalNum) * 100 : 0;
              return (
                <motion.div key={fin.id} className="p-3 cursor-pointer" style={cardStyle}
                  onClick={() => openModal('جزئیات فاکتور ' + fin.invoiceCode, <FinDetail fin={fin} />)}
                  initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] text-[var(--aw-primary)]" style={{ fontWeight: 700 }}>{fin.invoiceCode}</span>
                        <span className="text-[10px] text-[var(--aw-text-muted)]">({fin.orderCode})</span>
                        <StatusBadge label={st.label} color={st.color} />
                      </div>
                      <div className="text-[13px] text-[var(--aw-text-primary)] mt-1" style={{ fontWeight: 600 }}>
                        <i className="fa-solid fa-building text-[9px] ml-1 text-[var(--aw-text-muted)]" />{fin.supplier}
                      </div>
                    </div>
                    <span className="text-[10px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-calendar text-[8px] ml-1" />{fin.dueDate}</span>
                  </div>

                  {/* Amounts */}
                  <div className="flex items-center gap-4 text-[11px] mb-2">
                    <div><span className="text-[var(--aw-text-muted)]">کل: </span><span className="text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{fin.totalAmount}</span></div>
                    <div><span className="text-[var(--aw-text-muted)]">پرداخت: </span><span className="text-[#10B981]" style={{ fontWeight: 600 }}>{fin.paidAmount}</span></div>
                    <div><span className="text-[var(--aw-text-muted)]">مانده: </span><span className="text-[#EF4444]" style={{ fontWeight: 600 }}>{fin.remainingAmount}</span></div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--aw-bg-hover)' }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${progress}%`,
                      background: progress === 100 ? '#10B981' : progress > 0 ? '#F59E0B' : '#EF4444',
                    }} />
                  </div>

                  {fin.status === 'debt' && (
                    <div className="flex justify-end mt-2">
                      <button onClick={(e) => { e.stopPropagation(); openModal('ثبت پرداخت', <QuickForm submitLabel="ثبت پرداخت" toast="پرداخت ثبت شد" fields={[{ key: 'to', label: 'دریافت‌کننده' }, { key: 'amount', label: 'مبلغ (تومان)' }, { key: 'method', label: 'روش', type: 'select', options: ['نقدی', 'کارت‌به‌کارت', 'چک', 'حواله'] }]} />)}} className="text-[10px] px-3 py-1.5 rounded-lg border-none cursor-pointer text-white" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
                        <i className="fa-solid fa-credit-card text-[8px] ml-1" />ثبت پرداخت
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
      </>)}
    </div>
  );
}

// ── Procurement finance REPORT tab ──
const REPORT_RANGES = ['۷ روز اخیر', '۳۰ روز اخیر', 'فصل جاری', 'سال جاری'];

// Professional report builder: pick date/range, sections, chart types, title/notes, format.
function ProcExportBuilder({ range, data }: { range: string; data: any }) {
  const { closeModal, showToast } = useApp();
  const [preset, setPreset] = useState(range);
  const [useCustom, setUseCustom] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [title, setTitle] = useState('گزارش مالی و تدارکات');
  const [notes, setNotes] = useState('');
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');
  const [sections, setSections] = useState<Record<string, boolean>>({ kpi: true, orders: true, discrepancy: true, trend: true, suppliers: true, carriers: true, compare: true });
  const [charts, setCharts] = useState<Record<string, string>>({ orders: 'donut', trend: 'bar', suppliers: 'bar', carriers: 'bar', compare: 'table' });
  const toggle = (k: string) => setSections(s => ({ ...s, [k]: !s[k] }));
  const rangeText = useCustom && from && to ? `${from} تا ${to}` : preset;

  const SECTION_DEFS = [
    { key: 'kpi', label: 'شاخص‌های کلیدی (KPI)', chart: null },
    { key: 'orders', label: 'سفارشات بر اساس وضعیت', chart: ['donut', 'bar', 'table'] },
    { key: 'discrepancy', label: 'نرخ مغایرت', chart: ['bar', 'table'] },
    { key: 'trend', label: 'روند سفارشات', chart: ['bar', 'line', 'table'] },
    { key: 'suppliers', label: 'امتیاز تأمین‌کنندگان', chart: ['bar', 'table'] },
    { key: 'carriers', label: 'امتیاز شرکت‌های حمل', chart: ['bar', 'table'] },
    { key: 'compare', label: 'مقایسه تأمین‌کنندگان', chart: ['table'] },
  ];
  const CHART_LABEL: Record<string, string> = { donut: 'دایره‌ای', bar: 'میله‌ای', line: 'خطی', table: 'جدول' };

  const cssBars = (rows: { name: string; v: number; color?: string }[], max: number, unit = '') =>
    `<div class="bars">${rows.map(r => `<div class="bar-row"><span class="bar-l">${r.name}</span><span class="bar-track"><span class="bar-fill" style="width:${Math.round((r.v / max) * 100)}%;background:${r.color || '#F97316'}"></span></span><span class="bar-v">${toFa(r.v)}${unit}</span></div>`).join('')}</div>`;
  const cssDonut = (rows: { name: string; value: number; color: string }[]) => {
    const total = rows.reduce((s, r) => s + r.value, 0);
    let acc = 0; const stops = rows.map(r => { const a = (acc / total) * 360; acc += r.value; const b = (acc / total) * 360; return `${r.color} ${a}deg ${b}deg`; }).join(',');
    return `<div class="donut-wrap"><div class="donut" style="background:conic-gradient(${stops})"><div class="donut-hole">${toFa(total)}<small>کل</small></div></div><div class="donut-legend">${rows.map(r => `<div><span class="dot" style="background:${r.color}"></span>${r.name}: <b>${toFa(r.value)}</b></div>`).join('')}</div></div>`;
  };
  const tableHtml = (head: [string, string], rows: [string, string | number][]) =>
    `<table><thead><tr><th>${head[0]}</th><th>${head[1]}</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table>`;

  const generate = () => {
    if (format === 'csv') {
      const rows: string[][] = [[title + ' — بازه: ' + rangeText]];
      if (notes) rows.push(['یادداشت:', notes]);
      if (sections.kpi) { rows.push([], ['شاخص', 'مقدار']); data.kpis.forEach((k: any) => rows.push([k.label, (k.value + ' ' + k.sub).trim()])); }
      if (sections.orders) { rows.push([], ['وضعیت سفارش', 'تعداد']); data.orderStatusData.forEach((d: any) => rows.push([d.name, String(d.value)])); }
      if (sections.discrepancy) { rows.push([], ['نوع مغایرت', 'درصد']); data.discrepancy.forEach((d: any) => rows.push([d.name, d.value + '%'])); }
      if (sections.trend) { rows.push([], ['ماه', 'تعداد سفارش']); data.trend.forEach((t: any) => rows.push([t.m, String(t.v)])); }
      if (sections.suppliers) { rows.push([], ['تأمین‌کننده', 'امتیاز']); data.suppliers.forEach((s: any) => rows.push([s.name, String(s.score)])); }
      if (sections.carriers) { rows.push([], ['شرکت حمل', 'امتیاز']); data.carriers.forEach((c: any) => rows.push([c.name, String(c.score)])); }
      if (sections.compare) { rows.push([], ['تأمین‌کننده', 'قیمت', 'کیفیت', 'تحویل', 'امتیاز کل']); data.supplierCompare.forEach((s: any) => rows.push([s.name, String(s.price), String(s.quality), String(s.delivery), String(s.overall)])); }
      const csv = '\uFEFF' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = `${title}-${rangeText}.csv`;
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
      closeModal(); showToast('خروجی Excel/CSV دانلود شد');
      return;
    }
    const today = new Date().toLocaleDateString('fa-IR');
    let body = '';
    if (sections.kpi) body += `<h2>شاخص‌های کلیدی</h2><div class="kpis">${data.kpis.map((k: any) => `<div class="kpi"><span class="kpi-l">${k.label}</span><span class="kpi-v">${k.value} <small>${k.sub}</small></span></div>`).join('')}</div>`;
    if (sections.orders) { body += `<h2>سفارشات بر اساس وضعیت</h2>`; body += charts.orders === 'donut' ? cssDonut(data.orderStatusData) : charts.orders === 'bar' ? cssBars(data.orderStatusData.map((d: any) => ({ name: d.name, v: d.value, color: d.color })), Math.max(...data.orderStatusData.map((d: any) => d.value))) : tableHtml(['وضعیت', 'تعداد'], data.orderStatusData.map((d: any) => [d.name, toFa(d.value)])); }
    if (sections.discrepancy) { body += `<h2>نرخ مغایرت سفارشات</h2>`; body += charts.discrepancy === 'table' ? tableHtml(['نوع', 'درصد'], data.discrepancy.map((d: any) => [d.name, '٪' + toFa(d.value)])) : cssBars(data.discrepancy.map((d: any) => ({ name: d.name, v: d.value, color: d.color })), 5, '٪'); }
    if (sections.trend) { body += `<h2>روند سفارشات</h2>`; body += charts.trend === 'table' ? tableHtml(['ماه', 'تعداد'], data.trend.map((t: any) => [t.m, toFa(t.v)])) : `<div class="cols">${data.trend.map((t: any) => `<div class="col"><span class="col-bar" style="height:${Math.round((t.v / Math.max(...data.trend.map((x: any) => x.v))) * 90)}px"></span><span class="col-l">${t.m}</span></div>`).join('')}</div>`; }
    if (sections.suppliers) { body += `<h2>امتیاز تأمین‌کنندگان</h2>`; body += charts.suppliers === 'table' ? tableHtml(['تأمین‌کننده', 'امتیاز'], data.suppliers.map((s: any) => [s.name, toFa(s.score)])) : cssBars(data.suppliers.map((s: any) => ({ name: s.name, v: s.score, color: s.score >= 85 ? '#10B981' : s.score >= 70 ? '#F59E0B' : '#EF4444' })), 100); }
    if (sections.carriers) { body += `<h2>امتیاز شرکت‌های حمل</h2>`; body += charts.carriers === 'table' ? tableHtml(['شرکت حمل', 'امتیاز'], data.carriers.map((c: any) => [c.name, toFa(c.score)])) : cssBars(data.carriers.map((c: any) => ({ name: c.name, v: c.score, color: c.score >= 85 ? '#10B981' : c.score >= 70 ? '#F59E0B' : '#EF4444' })), 100); }
    if (sections.compare) {
      const sc = (v: number) => v >= 85 ? '#10B981' : v >= 70 ? '#F59E0B' : '#EF4444';
      body += `<h2>مقایسه تأمین‌کنندگان</h2><table><thead><tr><th>تأمین‌کننده</th><th>قیمت</th><th>کیفیت</th><th>تحویل</th><th>امتیاز کل</th></tr></thead><tbody>${data.supplierCompare.map((s: any) => `<tr><td>${s.name}</td><td style="color:${sc(s.price)};font-weight:700">${toFa(s.price)}</td><td style="color:${sc(s.quality)};font-weight:700">${toFa(s.quality)}</td><td style="color:${sc(s.delivery)};font-weight:700">${toFa(s.delivery)}</td><td style="background:${sc(s.overall)};color:#fff;font-weight:800">${toFa(s.overall)}</td></tr>`).join('')}</tbody></table>`;
    }
    const doc = `<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="utf-8"><title>${title}</title>
    <style>
      *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      body{font-family:'Vazirmatn UI',system-ui,sans-serif;color:#0f172a;margin:0;background:#fff;counter-reset:sec;font-size:13px;line-height:1.6}
      .sheet{padding:0 44px 44px}
      /* Header band */
      .band{background:linear-gradient(120deg,#9a3412,#F97316);color:#fff;padding:26px 44px;display:flex;justify-content:space-between;align-items:center}
      .band .b-right{display:flex;align-items:center;gap:14px}
      .logo{width:46px;height:46px;border-radius:12px;background:rgba(255,255,255,.16);border:1.5px solid rgba(255,255,255,.5);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800}
      .b-title{font-size:21px;font-weight:800;line-height:1.3}.b-title small{display:block;font-size:12px;font-weight:400;opacity:.9;margin-top:2px}
      .b-meta{text-align:left;font-size:11.5px;line-height:1.95;opacity:.96}.b-meta b{font-weight:700}
      /* Report title strip */
      .title-strip{background:#fff7ed;border-bottom:1px solid #fed7aa;padding:14px 44px;display:flex;justify-content:space-between;align-items:center;margin-bottom:26px}
      .title-strip h1{font-size:17px;margin:0;color:#7c2d12}
      .title-strip .tag{font-size:11px;color:#9a3412;background:#ffedd5;border:1px solid #fdba74;border-radius:20px;padding:3px 12px;font-weight:700}
      .note{font-size:12px;color:#334155;background:#f8fafc;border:1px solid #e2e8f0;border-right:4px solid #F97316;border-radius:8px;padding:11px 14px;margin:0 0 22px}
      h2{font-size:14px;margin:26px 0 12px;color:#0f172a;display:flex;align-items:center;gap:10px}
      h2::before{counter-increment:sec;content:counter(sec);width:24px;height:24px;flex-shrink:0;background:#F97316;color:#fff;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:800}
      .card{border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:6px;background:#fff}
      .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
      .kpi{border:1px solid #e2e8f0;border-top:3px solid #F97316;border-radius:10px;padding:13px;display:flex;flex-direction:column;gap:5px;background:#fff}
      .kpi-l{font-size:11px;color:#64748b}.kpi-v{font-size:19px;font-weight:800}.kpi-v small{font-size:10px;font-weight:500;color:#94a3b8}
      table{width:100%;border-collapse:collapse;font-size:12px;border-radius:10px;overflow:hidden}
      th,td{border:1px solid #e2e8f0;padding:9px 11px;text-align:right}th{background:#0f172a;color:#fff;font-weight:700}tbody tr:nth-child(even){background:#f8fafc}
      .bars{display:flex;flex-direction:column;gap:9px}.bar-row{display:flex;align-items:center;gap:10px;font-size:12px}.bar-l{width:130px;color:#334155}.bar-track{flex:1;height:14px;background:#f1f5f9;border-radius:7px;overflow:hidden}.bar-fill{display:block;height:100%;border-radius:7px}.bar-v{width:54px;text-align:left;font-weight:800}
      .donut-wrap{display:flex;align-items:center;gap:28px}.donut{width:128px;height:128px;border-radius:50%;position:relative}.donut-hole{position:absolute;inset:28px;background:#fff;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:22px;font-weight:800}.donut-hole small{font-size:10px;font-weight:500;color:#94a3b8}.donut-legend{font-size:12px;line-height:2.2}.dot{display:inline-block;width:11px;height:11px;border-radius:3px;margin-left:7px}
      .cols{display:flex;align-items:flex-end;gap:16px;height:118px;padding:0 10px;border-bottom:2px solid #e2e8f0}.col{display:flex;flex-direction:column;align-items:center;gap:5px;justify-content:flex-end}.col-bar{width:24px;background:linear-gradient(#F97316,#9a3412);border-radius:5px 5px 0 0}.col-l{font-size:10px;color:#64748b}
      .foot{margin:36px 44px 0;padding-top:14px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between}
      @media print{.band{-webkit-print-color-adjust:exact}@page{margin:0;size:A4}.foot{position:fixed;bottom:0;left:0;right:0;margin:0;padding:10px 44px;background:#fff}}
    </style></head><body>
      <div class="band">
        <div class="b-right"><div class="logo">N</div><div class="b-title">Neura<small>سامانه مدیریت هوشمند کسب‌وکار</small></div></div>
        <div class="b-meta"><div>تاریخ صدور: <b>${today}</b></div><div>بازه گزارش: <b>${rangeText}</b></div><div>واحد: <b>خرید / تدارکات</b></div></div>
      </div>
      <div class="title-strip"><h1>${title}</h1><span class="tag">گزارش رسمی</span></div>
      <div class="sheet">
      ${notes ? `<div class="note"><b>یادداشت مدیریتی:</b> ${notes}</div>` : ''}
      ${body}
      </div>
      <div class="foot"><span>Neura — گزارش خودکار</span><span>${today}</span></div>
    </body></html>`;
    const w = window.open('', '_blank');
    if (!w) { showToast('پنجره خروجی مسدود شد'); return; }
    w.document.open(); w.document.write(doc); w.document.close(); w.focus();
    setTimeout(() => { try { w.print(); } catch {} }, 600);
    closeModal(); showToast('سند گزارش آماده چاپ/PDF شد');
  };

  const inputStyle: React.CSSProperties = { background: 'var(--aw-bg-input)', border: '1px solid var(--aw-border)', borderRadius: 10, padding: '8px 10px', fontSize: 12, color: 'var(--aw-text-primary)', width: '100%', outline: 'none', fontFamily: "'Kamand','Vazirmatn',sans-serif" };
  const SecLabel = ({ children }: { children: React.ReactNode }) => <div className="text-[11px] text-[var(--aw-text-secondary)] mb-1.5 mt-1" style={{ fontWeight: 700 }}>{children}</div>;

  return (
    <div className="flex flex-col gap-1 p-1">
      {/* Title */}
      <SecLabel>عنوان گزارش</SecLabel>
      <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} />

      {/* Date range */}
      <SecLabel>بازه زمانی</SecLabel>
      <div className="flex items-center gap-2">
        <select value={preset} disabled={useCustom} onChange={e => setPreset(e.target.value)} style={{ ...inputStyle, opacity: useCustom ? 0.5 : 1 }}>
          {REPORT_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <button onClick={() => setUseCustom(v => !v)} className="text-[11px] px-2.5 py-2 rounded-lg border cursor-pointer flex-shrink-0" style={{ background: useCustom ? 'var(--aw-primary)' : 'var(--aw-bg-input)', color: useCustom ? '#fff' : 'var(--aw-text-secondary)', borderColor: 'var(--aw-border)', fontWeight: 700 }}>دلخواه</button>
      </div>
      {useCustom && (
        <div className="flex items-center gap-2 mt-1.5">
          <input style={inputStyle} value={from} onChange={e => setFrom(e.target.value)} placeholder="از ۱۴۰۴/۱۲/۰۱" />
          <input style={inputStyle} value={to} onChange={e => setTo(e.target.value)} placeholder="تا ۱۴۰۴/۱۲/۳۰" />
        </div>
      )}

      {/* Sections + chart types */}
      <SecLabel>بخش‌ها و نوع نمودار</SecLabel>
      <div className="flex flex-col gap-1.5">
        {SECTION_DEFS.map(sec => (
          <div key={sec.key} className="flex items-center gap-2 rounded-[10px] px-2.5 py-2" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
            <button onClick={() => toggle(sec.key)} className="w-5 h-5 rounded-md flex items-center justify-center border-none cursor-pointer flex-shrink-0" style={{ background: sections[sec.key] ? 'var(--aw-primary)' : 'var(--aw-bg-input)', color: '#fff' }}>
              {sections[sec.key] && <i className="fa-solid fa-check text-[10px]" />}
            </button>
            <span className="text-[12px] text-[var(--aw-text-primary)] flex-1" style={{ fontWeight: 600, opacity: sections[sec.key] ? 1 : 0.5 }}>{sec.label}</span>
            {sec.chart && sections[sec.key] && (
              <select value={charts[sec.key]} onChange={e => setCharts(c => ({ ...c, [sec.key]: e.target.value }))} className="text-[10px] rounded-md border cursor-pointer px-1.5 py-1 outline-none" style={{ background: 'var(--aw-bg-input)', borderColor: 'var(--aw-border)', color: 'var(--aw-text-secondary)', fontFamily: "'Kamand','Vazirmatn',sans-serif" }}>
                {sec.chart.map(c => <option key={c} value={c}>{CHART_LABEL[c]}</option>)}
              </select>
            )}
          </div>
        ))}
      </div>

      {/* Notes */}
      <SecLabel>یادداشت / توضیحات (اختیاری)</SecLabel>
      <textarea style={{ ...inputStyle, minHeight: 54, resize: 'none' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="توضیحات مدیریتی برای این گزارش…" />

      {/* Format */}
      <SecLabel>فرمت خروجی</SecLabel>
      <div className="flex gap-2">
        {([{ id: 'pdf', label: 'PDF / چاپ', icon: 'fa-solid fa-file-pdf', color: '#EF4444' }, { id: 'csv', label: 'Excel / CSV', icon: 'fa-solid fa-file-excel', color: '#10B981' }] as const).map(f => (
          <button key={f.id} onClick={() => setFormat(f.id)} className="flex-1 flex items-center justify-center gap-2 rounded-[10px] border cursor-pointer py-2.5 text-[12px]" style={{ background: format === f.id ? `${f.color}18` : 'var(--aw-bg-card)', borderColor: format === f.id ? f.color : 'var(--aw-border)', color: format === f.id ? f.color : 'var(--aw-text-secondary)', fontWeight: 700 }}>
            <i className={f.icon} />{f.label}
          </button>
        ))}
      </div>

      <button onClick={generate} className="mt-3 w-full rounded-[12px] border-none cursor-pointer text-white py-3 text-[14px]" style={{ background: 'var(--aw-primary)', fontWeight: 700, fontFamily: "'Kamand','Vazirmatn',sans-serif" }}>
        <i className="fa-solid fa-file-export text-[12px] ml-1.5" />ساخت و دریافت گزارش
      </button>
    </div>
  );
}

function ProcFinanceReport() {
  const { openModal, closeModal, showToast } = useApp();
  const axis = { fontSize: 10, fill: 'var(--aw-text-muted)', fontFamily: "'Kamand','Vazirmatn',sans-serif" };
  const [range, setRange] = useState(REPORT_RANGES[1]);
  const ordersRange = range, trendRange = range;

  // 1. سفارشات بر اساس وضعیت
  const orderStatusData = [];
  // 2. مغایرت
  const discrepancy = [];
  // 3. روند سفارشات
  const trend = [];
  // 4. امتیاز تأمین‌کنندگان
  const suppliers = [];
  // 5. امتیاز شرکت‌های حمل
  const carriers = [];
  // 6. مقایسه تأمین‌کنندگان (چند شاخصه)
  const supplierCompare = [].map(s => ({ ...s, overall: Math.round((s.price + s.quality + s.delivery) / 3) }));

  // Top-line KPIs for the selected range
  const kpis = [];

  const doExport = (fmt: 'csv' | 'print') => {
    if (fmt === 'print') {
      const today = new Date().toLocaleDateString('fa-IR');
      const kpiHtml = kpis.map(k => `<div class="kpi"><span class="kpi-l">${k.label}</span><span class="kpi-v">${k.value} <small>${k.sub}</small></span></div>`).join('');
      const tbl = (title: string, head: [string, string], rows: [string, string | number][]) =>
        `<h2>${title}</h2><table><thead><tr><th>${head[0]}</th><th>${head[1]}</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table>`;
      const doc = `<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="utf-8"><title>گزارش مالی و تدارکات</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Vazirmatn UI', system-ui, sans-serif; color: #1e293b; margin: 0; padding: 32px 40px; background: #fff; }
        .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #F97316; padding-bottom: 16px; margin-bottom: 24px; }
        .brand { font-size: 22px; font-weight: 800; color: #C2410C; }
        .brand small { display:block; font-size: 12px; font-weight: 500; color: #64748b; margin-top: 4px; }
        .meta { text-align: left; font-size: 12px; color: #64748b; line-height: 1.9; }
        .meta b { color: #1e293b; }
        h1 { font-size: 18px; margin: 0 0 20px; }
        h2 { font-size: 14px; margin: 26px 0 10px; color: #C2410C; border-right: 4px solid #F97316; padding-right: 8px; }
        .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px; }
        .kpi { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 4px; }
        .kpi-l { font-size: 11px; color: #64748b; }
        .kpi-v { font-size: 18px; font-weight: 800; } .kpi-v small { font-size: 10px; font-weight: 500; color: #94a3b8; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 4px; }
        th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: right; }
        th { background: #fff7ed; color: #9a3412; font-weight: 700; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        .foot { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
        @media print { body { padding: 0; } @page { margin: 1.4cm; } }
      </style></head><body>
        <div class="head">
          <div class="brand">Neura<small>گزارش مالی و تدارکات</small></div>
          <div class="meta"><div>تاریخ صدور: <b>${today}</b></div><div>بازه گزارش: <b>${range}</b></div><div>واحد: <b>خرید / تدارکات</b></div></div>
        </div>
        <h1>خلاصه شاخص‌های کلیدی</h1>
        <div class="kpis">${kpiHtml}</div>
        ${tbl('تعداد سفارشات بر اساس وضعیت', ['وضعیت', 'تعداد'], orderStatusData.map(d => [d.name, toFa(d.value)] as [string, string]).concat([['مجموع', toFa(totalOrders)]]))}
        ${tbl('نرخ مغایرت سفارشات', ['نوع مغایرت', 'درصد'], discrepancy.map(d => [d.name, '٪' + toFa(d.value)] as [string, string]))}
        ${tbl('روند سفارشات در بازه', ['ماه', 'تعداد'], trend.map(t => [t.m, toFa(t.v)] as [string, string]))}
        ${tbl('امتیاز تأمین‌کنندگان', ['تأمین‌کننده', 'امتیاز (از ۱۰۰)'], suppliers.map(s => [s.name, toFa(s.score)] as [string, string]))}
        ${tbl('امتیاز شرکت‌های حمل', ['شرکت حمل', 'امتیاز (از ۱۰۰)'], carriers.map(c => [c.name, toFa(c.score)] as [string, string]))}
        <div class="foot">این گزارش به‌صورت خودکار توسط سامانه Neura تولید شده است — ${today}</div>
      </body></html>`;
      const w = window.open('', '_blank');
      if (!w) { showToast('پنجره خروجی مسدود شد'); return; }
      w.document.open(); w.document.write(doc); w.document.close();
      w.focus();
      setTimeout(() => { try { w.print(); } catch {} }, 600);
      closeModal();
      showToast('سند گزارش آماده چاپ/PDF شد');
      return;
    }
    const rows: string[][] = [];
    rows.push(['گزارش مالی و تدارکات — بازه: ' + range]);
    rows.push([]);
    rows.push(['شاخص', 'مقدار']);
    kpis.forEach(k => rows.push([k.label, (k.value + ' ' + k.sub).trim()]));
    rows.push([]);
    rows.push(['وضعیت سفارش', 'تعداد']);
    orderStatusData.forEach(d => rows.push([d.name, String(d.value)]));
    rows.push([]);
    rows.push(['نوع مغایرت', 'درصد']);
    discrepancy.forEach(d => rows.push([d.name, d.value + '%']));
    rows.push([]);
    rows.push(['تأمین‌کننده', 'امتیاز']);
    suppliers.forEach(s => rows.push([s.name, String(s.score)]));
    rows.push([]);
    rows.push(['شرکت حمل', 'امتیاز']);
    carriers.forEach(c => rows.push([c.name, String(c.score)]));
    const csv = '\uFEFF' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `گزارش-تدارکات-${range}.csv`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
    closeModal();
    showToast('خروجی Excel/CSV دانلود شد');
  };
  const openExport = () => openModal('ساخت گزارش', <ProcExportBuilder range={range} data={{ kpis, orderStatusData, discrepancy, trend, suppliers, carriers, supplierCompare, totalOrders }} />);

  const totalOrders = orderStatusData.reduce((s, d) => s + d.value, 0);
  const Dropdown = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="text-[10px] rounded-lg border cursor-pointer px-2 py-1 outline-none"
      style={{ background: 'var(--aw-bg-input)', borderColor: 'var(--aw-border)', color: 'var(--aw-text-secondary)', fontFamily: "'Kamand','Vazirmatn',sans-serif" }}>
      {REPORT_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
    </select>
  );
  const CardTitle = ({ icon, children, extra }: { icon: string; children: React.ReactNode; extra?: React.ReactNode }) => (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2 text-[12.5px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>
        <i className={`${icon} text-[12px] text-[var(--aw-primary)]`} />{children}
      </div>
      {extra}
    </div>
  );
  const scoreColor = (s: number) => s >= 85 ? '#10B981' : s >= 70 ? '#F59E0B' : '#EF4444';

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-3 pb-24 aw-scroll flex flex-col gap-3">
      {/* Parameter bar: range + export */}
      <div className="flex items-center gap-2 sticky top-0 z-10 -mx-4 px-4 py-2" style={{ background: 'linear-gradient(var(--aw-bg-app), color-mix(in srgb, var(--aw-bg-app) 70%, transparent))', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-1.5 flex-1">
          <i className="fa-solid fa-sliders text-[11px] text-[var(--aw-text-muted)]" />
          <span className="text-[11px] text-[var(--aw-text-secondary)]" style={{ fontWeight: 600 }}>بازه:</span>
          <select value={range} onChange={e => setRange(e.target.value)}
            className="text-[11px] rounded-lg border cursor-pointer px-2 py-1.5 outline-none flex-1"
            style={{ background: 'var(--aw-bg-input)', borderColor: 'var(--aw-border)', color: 'var(--aw-text-primary)', fontFamily: "'Kamand','Vazirmatn',sans-serif", fontWeight: 600 }}>
            {REPORT_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <button onClick={openExport} className="flex items-center gap-1.5 rounded-lg border-none cursor-pointer text-white px-3 py-1.5 text-[11.5px] flex-shrink-0"
          style={{ background: 'var(--aw-primary)', fontWeight: 700, fontFamily: "'Kamand','Vazirmatn',sans-serif" }}>
          <i className="fa-solid fa-file-export text-[11px]" />خروجی
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-2">
        {kpis.map((k, i) => (
          <motion.div key={i} className="p-2.5 flex items-center gap-2.5" style={{ ...cardStyle, borderRadius: 10 }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="w-9 h-9 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${k.color} 15%, transparent)` }}>
              <i className={`${k.icon} text-[14px]`} style={{ color: k.color }} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] text-[var(--aw-text-muted)] truncate">{k.label}</span>
              <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{k.value}<span className="text-[9px] text-[var(--aw-text-muted)] mr-1" style={{ fontWeight: 500 }}>{k.sub}</span></span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 1. Orders by status */}
      <motion.div className="p-3.5" style={cardStyle} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <CardTitle icon="fa-solid fa-clipboard-list" extra={<Dropdown value={ordersRange} onChange={setRange} />}>تعداد کل سفارشات</CardTitle>
        <div className="flex items-center gap-3">
          <div style={{ width: 108, height: 108 }} className="relative flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={orderStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={32} outerRadius={50} paddingAngle={2} stroke="none">
                  {orderStatusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[18px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{toFa(totalOrders)}</span>
              <span className="text-[8px] text-[var(--aw-text-muted)]">کل</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-2">
            {orderStatusData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-[11.5px]">
                <span className="flex items-center gap-1.5 text-[var(--aw-text-secondary)]"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />{d.name}</span>
                <span className="text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{toFa(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 2. Discrepancy */}
      <motion.div className="p-3.5" style={cardStyle} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <CardTitle icon="fa-solid fa-triangle-exclamation">نرخ مغایرت سفارشات</CardTitle>
        <div className="flex flex-col gap-2.5">
          {discrepancy.map(d => (
            <div key={d.name}>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-[var(--aw-text-secondary)]">{d.name}</span>
                <span style={{ fontWeight: 700, color: d.color, direction: 'ltr' }}>٪{toFa(d.value)}</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: 'var(--aw-bg-hover)' }}>
                <div className="h-full rounded-full" style={{ width: `${(d.value / 5) * 100}%`, background: d.color }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 3. Orders trend */}
      <motion.div className="p-3.5" style={cardStyle} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <CardTitle icon="fa-solid fa-arrow-trend-up" extra={<Dropdown value={trendRange} onChange={setRange} />}>روند سفارشات</CardTitle>
        <div style={{ width: '100%', height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="procTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--aw-primary)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--aw-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--aw-border-light)" vertical={false} />
              <XAxis dataKey="m" tick={axis} axisLine={false} tickLine={false} />
              <YAxis tick={axis} axisLine={false} tickLine={false} width={34} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="v" stroke="var(--aw-primary)" strokeWidth={2.5} fill="url(#procTrend)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 4. Supplier scores */}
      <motion.div className="p-3.5" style={cardStyle} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <CardTitle icon="fa-solid fa-star">امتیاز تأمین‌کنندگان</CardTitle>
        <div className="flex flex-col gap-2.5">
          {suppliers.map(s => (
            <div key={s.name} className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--aw-text-secondary)] w-[92px] truncate">{s.name}</span>
              <div className="flex-1 h-2.5 rounded-full" style={{ background: 'var(--aw-bg-hover)' }}>
                <div className="h-full rounded-full" style={{ width: `${s.score}%`, background: scoreColor(s.score) }} />
              </div>
              <span className="text-[11px] w-7 text-left" style={{ fontWeight: 700, color: scoreColor(s.score), direction: 'ltr' }}>{toFa(s.score)}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 5. Carrier scores */}
      <motion.div className="p-3.5" style={cardStyle} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <CardTitle icon="fa-solid fa-truck-fast">امتیاز شرکت‌های حمل</CardTitle>
        <div style={{ width: '100%', height: 150 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={carriers} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--aw-border-light)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={axis} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={axis} axisLine={false} tickLine={false} width={88} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--aw-bg-hover)' }} />
              <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={16}>
                {carriers.map((c, i) => <Cell key={i} fill={scoreColor(c.score)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 6. Supplier comparison (multi-metric) */}
      <motion.div className="p-3.5" style={cardStyle} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <CardTitle icon="fa-solid fa-scale-balanced">مقایسه تأمین‌کنندگان</CardTitle>
        <div className="overflow-x-auto aw-noscroll">
          <table className="w-full text-[11px]" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="text-[var(--aw-text-muted)]">
                <th className="text-right pb-2 font-normal">تأمین‌کننده</th>
                <th className="pb-2 font-normal">قیمت</th>
                <th className="pb-2 font-normal">کیفیت</th>
                <th className="pb-2 font-normal">تحویل</th>
                <th className="pb-2 font-normal">امتیاز کل</th>
              </tr>
            </thead>
            <tbody>
              {supplierCompare.map((s, i) => {
                const Cell2 = ({ v }: { v: number }) => (
                  <td className="py-1.5 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-md text-[11px]" style={{ background: `${scoreColor(v)}1A`, color: scoreColor(v), fontWeight: 700, direction: 'ltr' }}>{toFa(v)}</span>
                  </td>
                );
                return (
                  <tr key={s.name} style={{ borderTop: '1px solid var(--aw-border-light)' }}>
                    <td className="py-1.5 text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{s.name}</td>
                    <Cell2 v={s.price} /><Cell2 v={s.quality} /><Cell2 v={s.delivery} />
                    <td className="py-1.5 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px]" style={{ background: scoreColor(s.overall), color: '#fff', fontWeight: 800, direction: 'ltr' }}>{toFa(s.overall)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-3 mt-2.5 text-[9px] text-[var(--aw-text-muted)]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: '#10B981' }} />۸۵+</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: '#F59E0B' }} />۷۰–۸۴</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: '#EF4444' }} />زیر ۷۰</span>
        </div>
      </motion.div>
    </div>
  );
}
// ========================
const SUPPLY_MAIN_TABS = [
  { id: 'requests', label: 'درخواست', icon: 'fa-solid fa-file-circle-plus' },
  { id: 'orders', label: 'سفارشات', icon: 'fa-solid fa-truck-field' },
  { id: 'supply', label: 'تحویل', icon: 'fa-solid fa-dolly' },
];

export function ProcSupplyScreen() {
  const [main, setMain] = useState('requests');
  return (
    <div className="flex flex-col h-full">
      <TabBar tabs={SUPPLY_MAIN_TABS} active={main} onChange={setMain} />
      <div className="flex-1 overflow-hidden flex flex-col">
        {main === 'requests' && <ProcRequestsScreen />}
        {main === 'orders' && <ProcOrdersScreen />}
        {main === 'supply' && <ProcDeliveryScreen />}
      </div>
    </div>
  );
}


// ========================
// 6. IMPORT OPERATIONS SCREEN (عملیات واردات)
// ========================
const IMP_TABS = [
  { id: 'all', label: 'همه', icon: 'fa-solid fa-list' },
  { id: 'ordered', label: 'ثبت سفارش', icon: 'fa-solid fa-file-signature' },
  { id: 'shipping', label: 'حمل و نقل', icon: 'fa-solid fa-ship' },
  { id: 'customs', label: 'گمرک', icon: 'fa-solid fa-building-columns' },
  { id: 'delivered', label: 'تحویل', icon: 'fa-solid fa-box-open' },
];

type ImportStatus = 'ordered' | 'shipping' | 'customs' | 'delivered';

interface ImportShipment {
  id: number;
  code: string;            // PO number
  blNumber: string;        // شماره بارنامه
  goodsName: string;       // نام کالا
  packages: string;        // تعداد بسته
  totalValue: string;      // ارزش کل
  weight: string;          // وزن (نمایش روی کارت)
  status: ImportStatus;    // وضعیت محموله (مرحله)
  subState: string;        // زیرحالت جاری داخل مرحله
  transportMode: string;   // نوع حمل
  incoterm: string;        // اینکوترمز
  origin: string;          // مبدأ
  destination: string;     // مقصد
  supplier: string;        // تأمین‌کننده
  grossWeight: string;     // وزن ناخالص
  netWeight: string;       // وزن خالص
  dimensions: string;      // ابعاد
  hsCode: string;          // کد HS
  carrier: string;         // شرکت حمل
  vesselNo: string;        // شماره پرواز/کشتی/کانتینر
  eta: string;
  tracking: string;
}

const IMP_STAGE_LABELS = ['ثبت سفارش', 'حمل و نقل', 'گمرک', 'تحویل'];
const IMP_STAGE_INDEX: Record<ImportStatus, number> = { ordered: 0, shipping: 1, customs: 2, delivered: 3 };

const impStatusColors: Record<ImportStatus, { color: string; label: string; icon: string }> = {
  ordered: { color: '#8B5CF6', label: 'ثبت سفارش', icon: 'fa-solid fa-file-signature' },
  shipping: { color: '#3B82F6', label: 'در حال حمل', icon: 'fa-solid fa-ship' },
  customs: { color: '#F59E0B', label: 'ترخیص گمرک', icon: 'fa-solid fa-building-columns' },
  delivered: { color: '#10B981', label: 'تحویل شده', icon: 'fa-solid fa-box-open' },
};

const transportMeta: Record<string, { icon: string; vesselLabel: string }> = {
  'دریایی': { icon: 'fa-solid fa-ship', vesselLabel: 'شماره کشتی / کانتینر' },
  'هوایی': { icon: 'fa-solid fa-plane', vesselLabel: 'شماره پرواز (AWB)' },
  'زمینی': { icon: 'fa-solid fa-truck', vesselLabel: 'شماره کامیون / بارنامه' },
};

const MOCK_IMPORTS: ImportShipment[] = [];

function ImportStepper({ status, subState, compact }: { status: ImportStatus; subState: string; compact?: boolean }) {
  const RED = '#EA5B5E';
  const doneLabels = ['ثبت شد', 'حمل شد', 'ترخیص شد', 'تحویل شد'];
  const todoLabels = ['ثبت سفارش', 'حمل و نقل', 'گمرک', 'تحویل'];
  const badStates = ['نیازمند مراجعه به سازمان', 'مصادره شده'];
  const current = IMP_STAGE_INDEX[status]; // 0..3 = active stage
  const labelOf = (i: number) => i < current ? doneLabels[i] : i === current ? subState : todoLabels[i];
  const DOT = compact ? 20 : 24;
  return (
    <div className="flex items-start gap-0 px-1" style={{ direction: 'rtl' }}>
      {[0, 1, 2, 3].map(i => {
        const done = i < current;
        const active = i === current;
        const bad = active && badStates.includes(subState);
        const bg = bad ? RED : (done || active) ? 'var(--aw-primary)' : 'var(--aw-bg-hover)';
        const fg = (done || active || bad) ? '#fff' : 'var(--aw-text-muted)';
        const labelColor = bad ? RED : active ? 'var(--aw-primary)' : done ? 'var(--aw-text-secondary)' : 'var(--aw-text-muted)';
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0" style={{ width: compact ? 60 : 74 }}>
              <div className="rounded-full flex items-center justify-center" style={{ width: DOT, height: DOT, background: bg, color: fg, fontSize: compact ? 9 : 11, fontWeight: 700 }}>
                {bad ? <i className="fa-solid fa-exclamation" /> : done ? <i className="fa-solid fa-check" /> : (i + 1)}
              </div>
              <span className="text-center leading-tight" style={{ fontSize: compact ? 8 : 10, color: labelColor, fontWeight: (active || bad) ? 700 : 500 }}>{labelOf(i)}</span>
            </div>
            {i < 3 && (
              <div className="flex-1 h-0.5 rounded-full" style={{ background: i < current ? 'var(--aw-primary)' : 'var(--aw-bg-hover)', marginTop: DOT / 2 - 1, marginInline: 2 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ImportDetail({ sh }: { sh: ImportShipment }) {
  const { showToast, openModal } = useApp();
  const st = impStatusColors[sh.status] || { label: '—', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', icon: 'fa-solid fa-circle' };
  const tm = transportMeta[sh.transportMode] || transportMeta['دریایی'];
  const Row = ({ l, v, c }: { l: string; v: React.ReactNode; c?: string }) => (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-[var(--aw-border-light)] text-[12px]">
      <span className="text-[var(--aw-text-muted)]" style={{ flexShrink: 0 }}>{l}</span>
      <span style={{ fontWeight: 600, color: c || 'var(--aw-text-primary)', textAlign: 'left' }}>{v}</span>
    </div>
  );
  const Section = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-6 h-6 rounded-[7px] flex items-center justify-center" style={{ background: 'var(--aw-primary-bg)' }}>
          <i className={icon + ' text-[10px] text-[var(--aw-primary)]'} />
        </div>
        <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{title}</span>
      </div>
      <div className="rounded-[12px] px-3" style={{ background: 'color-mix(in srgb, var(--aw-primary) 4%, transparent)', border: '1px solid var(--aw-border-light)' }}>
        {children}
      </div>
    </div>
  );
  return (
    <div className="flex flex-col p-1">
      {/* header */}
      <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] text-[var(--aw-primary)]" style={{ fontWeight: 700 }}>{sh.code}</span>
            <StatusBadge label={st.label} color={st.color} />
          </div>
          <div className="text-[14px] text-[var(--aw-text-primary)] mt-1" style={{ fontWeight: 700 }}>{sh.goodsName}</div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[15px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{sh.totalValue}</span>
          <span className="text-[9px] text-[var(--aw-text-muted)]">ارزش کل (تومان)</span>
        </div>
      </div>

      {/* pipeline */}
      <ImportStepper status={sh.status} subState={sh.subState} />

      <Section icon="fa-solid fa-circle-info" title="اطلاعات اصلی">
        <Row l="شماره PO" v={sh.code} />
        <Row l="وضعیت محموله" v={st.label} c={st.color} />
        <Row l="نوع حمل" v={sh.transportMode} />
        <Row l="اینکوترمز" v={sh.incoterm} />
        <Row l="مبدأ و مقصد" v={sh.origin + ' ← ' + sh.destination} />
        <Row l="تأمین‌کننده" v={sh.supplier} />
      </Section>

      <Section icon="fa-solid fa-boxes-stacked" title="اطلاعات کالا">
        <Row l="تعداد بسته‌ها" v={sh.packages} />
        <Row l="وزن ناخالص" v={sh.grossWeight} />
        <Row l="وزن خالص" v={sh.netWeight} />
        <Row l="ابعاد" v={sh.dimensions} />
        <Row l="کد HS" v={sh.hsCode} />
      </Section>

      <Section icon={tm.icon} title="اطلاعات حمل">
        <Row l="شرکت حمل" v={sh.carrier} />
        <Row l="شماره بارنامه" v={sh.blNumber} />
        <Row l={tm.vesselLabel} v={sh.vesselNo} />
        <Row l="کد رهگیری" v={sh.tracking} />
        <Row l="زمان تحویل (ETA)" v={sh.eta} />
      </Section>

      <div className="flex gap-2 mt-3">
        <TrackControls code={sh.code} big />
        {sh.status === 'customs' && (
          <button onClick={() => openModal('ثبت ترخیص گمرک', <QuickForm submitLabel="ثبت ترخیص" toast="ترخیص گمرک ثبت شد" fields={[{ key: 'declaration', label: 'شماره اظهارنامه' }, { key: 'duty', label: 'حقوق گمرکی (تومان)' }, { key: 'date', label: 'تاریخ ترخیص', type: 'date' }]} />)} className="flex-1 py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[12px]" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 700 }}>
            <i className="fa-solid fa-stamp text-[10px] ml-1" />ثبت ترخیص
          </button>
        )}
      </div>
    </div>
  );
}

export function ProcImportScreen() {
  const { showToast, openModal } = useApp();
  const [tab, setTab] = useState('all');
  const filtered = tab === 'all' ? MOCK_IMPORTS : MOCK_IMPORTS.filter(s => s.status === tab);

  return (
    <div className="flex flex-col h-full">
      {/* Summary cards double as filters */}
      <div className="flex gap-2 px-4 mt-3">
        {IMP_TABS.slice(1).map((t, i) => {
          const count = MOCK_IMPORTS.filter(s => s.status === t.id).length;
          const c = impStatusColors[t.id as ImportStatus] || { label: '—', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', icon: 'fa-solid fa-circle' };
          const on = tab === t.id;
          return (
            <motion.div key={t.id} onClick={() => setTab(on ? 'all' : t.id)}
              className="flex-1 p-2 flex flex-col items-center gap-0.5 cursor-pointer" style={{
                ...cardStyle, borderRadius: 5,
                border: on ? `1.5px solid ${c.color}` : (cardStyle.border as string),
                background: on ? `color-mix(in srgb, ${c.color} 12%, transparent)` : (cardStyle.background as string),
                boxShadow: on ? `0 0 0 2px color-mix(in srgb, ${c.color} 18%, transparent)` : undefined,
              }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <i className={`${t.icon} text-[13px]`} style={{ color: c.color }} />
              <span className="text-[15px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{count}</span>
              <span className="text-[9px]" style={{ whiteSpace: 'nowrap', color: on ? c.color : 'var(--aw-text-muted)', fontWeight: on ? 700 : 400 }}>{t.label}</span>
            </motion.div>
          );
        })}
      </div>

      {tab !== 'all' && (
        <button type="button" onClick={() => setTab('all')} className="mx-4 mt-2 -mb-1 self-start flex items-center gap-1.5 px-3 py-1 rounded-full border-none cursor-pointer text-[10px]" style={{ background: 'var(--aw-primary-bg)', color: 'var(--aw-primary)', fontWeight: 600 }}>
          <i className="fa-solid fa-xmark text-[9px]" />حذف فیلتر
        </button>
      )}

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-24 aw-scroll">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2">
            {filtered.map((sh, i) => {
              const st = impStatusColors[sh.status] || { label: '—', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', icon: 'fa-solid fa-circle' };
              return (
                <motion.div key={sh.id} onClick={() => openModal('جزئیات محموله', <ImportDetail sh={sh} />)}
                  className="p-3 cursor-pointer" style={cardStyle}
                  initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12px] text-[var(--aw-primary)]" style={{ fontWeight: 700 }}>{sh.code}</span>
                      <StatusBadge label={st.label} color={st.color} />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{sh.totalValue}</span>
                      <span className="text-[9px] text-[var(--aw-text-muted)]">ارزش کل (تومان)</span>
                    </div>
                  </div>
                  <div className="text-[13px] text-[var(--aw-text-primary)] mb-2" style={{ fontWeight: 700 }}>
                    <i className={st.icon + ' text-[11px] ml-1 text-[var(--aw-text-muted)]'} />{sh.goodsName}
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--aw-border)]">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-barcode text-[8px] ml-1" />شماره بارنامه</span>
                      <span className="text-[11px] text-[var(--aw-text-secondary)]" style={{ fontWeight: 600 }}>{sh.blNumber}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-boxes-stacked text-[8px] ml-1" />تعداد بسته</span>
                      <span className="text-[11px] text-[var(--aw-text-secondary)]" style={{ fontWeight: 600 }}>{sh.packages}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-weight-hanging text-[8px] ml-1" />وزن</span>
                      <span className="text-[11px] text-[var(--aw-text-secondary)]" style={{ fontWeight: 600 }}>{sh.weight}</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-[var(--aw-border)]">
                    <ImportStepper status={sh.status} subState={sh.subState} compact />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}