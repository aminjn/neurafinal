import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { useApp } from './app-context';
import { TimePicker } from './time-picker';
import { api, getToken } from '../services/api';
import { toFa } from './data';
import { ImageWithFallback } from './figma/ImageWithFallback';
import svgChatIcons from '../../imports/Frame2147223516/svg-6y73huub0v';

// Import shared utilities for use in this file
import { euCardStyle, AgentHeader, AgentTabBar, StatusPill, SectionTitle, EmptyState, AgentChatTabUI, MiniChatPreview } from './eu-agent-shared';
// Re-export shared utilities so other files can import from this file
export { euCardStyle, AgentHeader, AgentTabBar, StatusPill, SectionTitle, EmptyState, AgentChatTabUI, MiniChatPreview } from './eu-agent-shared';
export type { ChatListItem, AgentCardItem, AgentTopicItem, ChatMsgItem } from './eu-agent-shared';

// Re-export split screen components so end-user-panel.tsx import still works
export { EuDineScreen, DINE_ORDERS } from './eu-dine-screen';
import { DINE_ORDERS } from './eu-dine-screen';
export { EuSupportScreen } from './eu-support-screen';
export { EuMarketScreen } from './eu-market-screen';


// =====================================================================
//  2.  ASSISTANT SCREEN (دستیار شخصی)
// =====================================================================
const ASSISTANT_TABS = [
  { id: 'chat', icon: 'fa-solid fa-comments', label: 'گفتگو' },
];

type PlanStatus = 'pending' | 'inprogress' | 'done' | 'cancelled';

interface CalEvent { id: number; title: string; time: string; date: string; type: 'meeting' | 'reminder' | 'personal' | 'work'; status: PlanStatus; muted: boolean; description?: string; at?: number }

const planStatusStyles: Record<PlanStatus, { label: string; bg: string; border: string; pillBg: string; pillText: string; icon: string }> = {
  pending:    { label: 'معلق',         bg: 'rgba(255,255,255,0.04)',  border: 'rgba(255,255,255,0.10)', pillBg: 'rgba(255,255,255,0.10)', pillText: '#E5E7EB', icon: 'fa-solid fa-hourglass-half' },
  inprogress: { label: 'در حال انجام', bg: 'rgba(245,158,11,0.10)',   border: 'rgba(245,158,11,0.35)', pillBg: 'rgba(245,158,11,0.18)', pillText: '#F59E0B', icon: 'fa-solid fa-spinner' },
  done:       { label: 'انجام شده',    bg: 'rgba(16,185,129,0.10)',   border: 'rgba(16,185,129,0.35)', pillBg: 'rgba(16,185,129,0.18)', pillText: '#10B981', icon: 'fa-solid fa-circle-check' },
  cancelled:  { label: 'لغو شده',      bg: 'rgba(239,68,68,0.10)',    border: 'rgba(239,68,68,0.35)',  pillBg: 'rgba(239,68,68,0.18)',  pillText: '#EF4444', icon: 'fa-solid fa-ban' },
};

const INITIAL_CAL_EVENTS: CalEvent[] = [];

const calTypeColors: Record<string, { color: string; icon: string; label: string }> = {
  meeting: { color: '#3B82F6', icon: 'fa-solid fa-users', label: 'جلسه' },
  reminder: { color: '#F59E0B', icon: 'fa-solid fa-bell', label: 'یادآور' },
  personal: { color: '#10B981', icon: 'fa-solid fa-heart', label: 'شخصی' },
  work: { color: '#8B5CF6', icon: 'fa-solid fa-briefcase', label: 'کاری' },
};

interface AsstTask { id: number; title: string; priority: 'high' | 'medium' | 'low'; done: boolean; dueDate: string; eventId?: number }

const INITIAL_TASKS: AsstTask[] = [];

const priColors: Record<string, { color: string; label: string }> = {
  high: { color: '#EF4444', label: 'فوری' },
  medium: { color: '#F59E0B', label: 'متوسط' },
  low: { color: '#10B981', label: 'عادی' },
};

interface Note { id: number; title: string; preview: string; date: string; tag: string; color: string }

const NOTES: Note[] = [];

const ASST_CHAT_MSGS = [];

// ── تبدیلِ تاریخِ میلادی↔شمسی برای تقویمِ دستیار ──
function _jdiv(a: number, b: number) { return Math.trunc(a / b); }
function _g2d(gy: number, gm: number, gd: number) { let d = _jdiv((gy + _jdiv(gm - 8, 6) + 100100) * 1461, 4) + _jdiv(153 * ((gm + 9) % 12) + 2, 5) + gd - 34840408; d = d - _jdiv(_jdiv(gy + 100100 + _jdiv(gm - 8, 6), 100) * 3, 4) + 752; return d; }
function _jalMarch(jy: number) { const breaks = [-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178]; const gy = jy + 621; let leapJ = -14, jp = breaks[0], jump = 0; for (let i = 1; i < breaks.length; i++) { const jm = breaks[i]; jump = jm - jp; if (jy < jm) break; leapJ += _jdiv(jump, 33) * 8 + _jdiv(jump % 33, 4); jp = jm; } let n = jy - jp; leapJ += _jdiv(n, 33) * 8 + _jdiv((n % 33) + 3, 4); if ((jump % 33) === 4 && (jump - n) === 4) leapJ += 1; const leapG = _jdiv(gy, 4) - _jdiv((_jdiv(gy, 100) + 1) * 3, 4) - 150; return { gy, march: 20 + leapJ - leapG }; }
function _j2d(jy: number, jm: number, jd: number) { const r = _jalMarch(jy); return _g2d(r.gy, 3, r.march) + (jm - 1) * 31 - _jdiv(jm, 7) * (jm - 7) + jd - 1; }
function _d2g(jdn: number) { let j = 4 * jdn + 139361631; j = j + _jdiv(_jdiv(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908; const i = _jdiv(j % 1461, 4) * 5 + 308; const gd = _jdiv(i % 153, 5) + 1; const gm = (_jdiv(i, 153) % 12) + 1; const gy = _jdiv(j, 1461) - 100100 + _jdiv(8 - gm, 6); return { gy, gm, gd }; }
function _g2j(date: Date): [number, number, number] { try { const f = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }); const p: any = f.formatToParts(date); const get = (t: string) => +((p.find((x: any) => x.type === t) || {}).value || 0); return [get('year'), get('month'), get('day')]; } catch { return [1400, 1, 1]; } }
function _j2g(jy: number, jm: number, jd: number) { const g = _d2g(_j2d(jy, jm, jd)); return new Date(g.gy, g.gm - 1, g.gd); }
function _jLen(jy: number, jm: number) { if (jm <= 6) return 31; if (jm <= 11) return 30; return (_j2d(jy + 1, 1, 1) - _j2d(jy, 1, 1)) === 366 ? 30 : 29; }

function AssistantCalendarTab({ events, setEvents, tasks, setTasks }: { events: CalEvent[]; setEvents: React.Dispatch<React.SetStateAction<CalEvent[]>>; tasks: AsstTask[]; setTasks: React.Dispatch<React.SetStateAction<AsstTask[]>> }) {
  const { showToast } = useApp();
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newDate, setNewDate] = useState<string>('امروز');
  const [newType, setNewType] = useState<CalEvent['type']>('reminder');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCalendarHint, setShowCalendarHint] = useState(false);
  useEffect(() => {
    if (!showCalendar) return;
    setShowCalendarHint(true);
    const t = setTimeout(() => setShowCalendarHint(false), 1000);
    return () => clearTimeout(t);
  }, [showCalendar]);
  const [calMonth, setCalMonth] = useState(() => { const [jy, jm] = _g2j(new Date()); return _j2g(jy, jm, 1); });
  const [selectedCalDate, setSelectedCalDate] = useState<Date | null>(null);
  const [newTaskDrafts, setNewTaskDrafts] = useState<{ title: string; priority: 'high' | 'medium' | 'low' }[]>([]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [autoRepeat, setAutoRepeat] = useState(false);
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [repeatUnit, setRepeatUnit] = useState<'hour' | 'day' | 'week' | 'month'>('week');
  const [repeatMaxCount, setRepeatMaxCount] = useState(5);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [startH, setStartH] = useState(9);
  const [startM, setStartM] = useState(0);
  const [hasEnd, setHasEnd] = useState(false);
  const [endH, setEndH] = useState(10);
  const [endM, setEndM] = useState(0);
  const pad2 = (n: number) => n.toString().padStart(2, '0');
  const composeTime = () => {
    const s = `${toFa(pad2(startH))}:${toFa(pad2(startM))}`;
    return hasEnd ? `${s} - ${toFa(pad2(endH))}:${toFa(pad2(endM))}` : s;
  };
  const timeField = (val: number, setVal: (n: number) => void, mod: number, step: number) => (
    <div className="flex flex-col items-center gap-1">
      <button type="button" onClick={() => setVal((val + step) % mod)}
        className="w-9 h-7 rounded-lg border border-[var(--aw-border)] cursor-pointer text-[var(--aw-text-secondary)] flex items-center justify-center"
        style={{ background: 'var(--aw-bg-card)' }}><i className="fa-solid fa-chevron-up text-[9px]" /></button>
      <div className="w-11 text-center text-[19px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{toFa(pad2(val))}</div>
      <button type="button" onClick={() => setVal((val - step + mod) % mod)}
        className="w-9 h-7 rounded-lg border border-[var(--aw-border)] cursor-pointer text-[var(--aw-text-secondary)] flex items-center justify-center"
        style={{ background: 'var(--aw-bg-card)' }}><i className="fa-solid fa-chevron-down text-[9px]" /></button>
    </div>
  );

  const PERSIAN_WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
  const PERSIAN_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

  const getCalendarDays = (monthStart: Date) => {
    const [jy, jm] = _g2j(monthStart);
    const first = _j2g(jy, jm, 1);
    const startDow = (first.getDay() + 1) % 7;
    const daysInMonth = _jLen(jy, jm);
    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  };

  const dateToCategoryLabel = (date: Date): string => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(date); target.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'امروز';
    if (diff === 1) return 'فردا';
    return 'تا یک ماه آینده';
  };

  const formatSelectedDate = (date: Date): string => {
    const [jy, jm, jd] = _g2j(date); return `${toFa(jd)} ${PERSIAN_MONTHS[jm - 1]} ${toFa(jy)}`;
  };

  const todayEvents = events.filter(e => e.date === 'امروز');
  const tomorrowEvents = events.filter(e => e.date === 'فردا');
  const upToMonthEvents = events.filter(e => e.date === 'تا یک ماه آینده');

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [dragId, setDragId] = useState<number | null>(null);
  const [taskDragId, setTaskDragId] = useState<number | null>(null);

  const toggleTaskDone = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : (t as any).completedAt } : t));
    showToast('وضعیت وظیفه تغییر کرد');
  };

  const reorderTask = (sourceId: number, targetId: number) => {
    if (sourceId === targetId) return;
    setTasks(prev => {
      const source = prev.find(t => t.id === sourceId);
      const target = prev.find(t => t.id === targetId);
      if (!source || !target || source.eventId !== target.eventId) return prev;
      const others = prev.filter(t => t.id !== sourceId);
      const targetIdx = others.findIndex(t => t.id === targetId);
      return [...others.slice(0, targetIdx), source, ...others.slice(targetIdx)];
    });
  };

  const setStatus = (id: number, status: PlanStatus) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    showToast(`وضعیت برنامه: ${planStatusStyles[status].label}`);
  };

  const reorderEvent = (sourceId: number, targetId: number) => {
    if (sourceId === targetId) return;
    setEvents(prev => {
      const source = prev.find(e => e.id === sourceId);
      const target = prev.find(e => e.id === targetId);
      if (!source || !target || source.date !== target.date) return prev;
      const others = prev.filter(e => e.id !== sourceId);
      const targetIdx = others.findIndex(e => e.id === targetId);
      const next = [...others.slice(0, targetIdx), source, ...others.slice(targetIdx)];
      return next;
    });
  };

  const toggleMute = (id: number) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, muted: !e.muted } : e));
    const ev = events.find(e => e.id === id);
    showToast(ev?.muted ? 'اعلان فعال شد' : 'اعلان سایلنت شد');
  };

  const deleteEvent = (id: number) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    showToast('رویداد حذف شد');
  };

  const startEdit = (ev: CalEvent) => {
    setEditingId(ev.id);
    setNewTitle(ev.title);
    setNewTime(ev.time);
    setNewDate(ev.date);
    setNewType(ev.type);
    setShowCalendar(false); setSelectedCalDate(null);
    setAutoRepeat(false); setRepeatInterval(1); setRepeatUnit('week'); setRepeatMaxCount(5);
    /* __plannerEdit: وظایفِ همین رویداد را در فرم نشان بده (قبلاً خالی می‌شد) */
    setNewTaskDrafts(tasks.filter(t => t.eventId === ev.id).map(t => ({ title: t.title, priority: t.priority }))); setNewTaskInput(''); setNewTaskPriority('medium');
    setShowNewForm(true);
  };

  const submitNewEvent = () => {
    if (!newTitle.trim()) { showToast('لطفاً عنوان رویداد را وارد کنید'); return; }
    if (!newTime.trim()) { showToast('لطفاً ساعت رویداد را وارد کنید'); return; }
    if (editingId !== null) {
      const _nAt = String(newTime).replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x06F0)).replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660)).match(/(\d{1,2}):(\d{2})/);
      const _nDate: Date | null = selectedCalDate ? new Date(selectedCalDate)
        : /\u0627\u0645\u0631\u0648\u0632|today/i.test(newDate) ? new Date()
        : /\u0641\u0631\u062F\u0627/.test(newDate) ? (() => { const _x = new Date(); _x.setDate(_x.getDate() + 1); return _x; })()
        : null;
      let _at = 0; if (_nAt && _nDate) { _nDate.setHours(Number(_nAt[1]), Number(_nAt[2]), 0, 0); _at = _nDate.getTime(); }
      setEvents(prev => prev.map(e => e.id === editingId ? { ...e, title: newTitle.trim(), time: newTime.trim(), date: newDate, type: newType, at: _at } : e));
      setTasks(prev => { const old = prev.filter(t => t.eventId === editingId); const others = prev.filter(t => t.eventId !== editingId); const baseId = Math.max(0, ...prev.map(t => t.id)) + 1; const rebuilt = newTaskDrafts.map((d, idx) => { const m = old.find(o => o.title === d.title); return { id: m ? m.id : baseId + idx, title: d.title, priority: d.priority, done: m ? m.done : false, dueDate: m ? m.dueDate : newDate, eventId: editingId as number }; }); return [...others, ...rebuilt]; });
      setEditingId(null);
      setNewTitle(''); setNewTime(''); setNewDate('امروز'); setNewType('reminder'); setShowCalendar(false); setSelectedCalDate(null); setAutoRepeat(false); setRepeatInterval(1); setRepeatUnit('week'); setRepeatMaxCount(5); setShowTimePicker(false);
      setNewTaskDrafts([]); setNewTaskInput(''); setNewTaskPriority('medium');
      setShowNewForm(false);
      showToast('برنامه ویرایش شد');
      return;
    }
    const newId = Math.max(...events.map(e => e.id), 0) + 1;
    const _nAt = String(newTime).replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x06F0)).replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660)).match(/(\d{1,2}):(\d{2})/);
    const _nDate: Date | null = selectedCalDate ? new Date(selectedCalDate)
      : /\u0627\u0645\u0631\u0648\u0632|today/i.test(newDate) ? new Date()
      : /\u0641\u0631\u062F\u0627/.test(newDate) ? (() => { const _x = new Date(); _x.setDate(_x.getDate() + 1); return _x; })()
      : null;
    let _at = 0; if (_nAt && _nDate) { _nDate.setHours(Number(_nAt[1]), Number(_nAt[2]), 0, 0); _at = _nDate.getTime(); }
    const ev: CalEvent = { id: newId, title: newTitle.trim(), time: newTime.trim(), date: newDate, type: newType, status: 'pending', muted: false, at: _at };
    setEvents(prev => [...prev, ev]);
    try { if (_at && typeof window !== 'undefined' && 'Notification' in window && (Notification as any).permission === 'default') (Notification as any).requestPermission().catch(() => {}); } catch (_) {}
    // reminders: schedule server — یادآور سرِ موعد از سرور پیامک شود (حتی با اپِ بسته).
    if (newType === 'reminder') { try {
      const _hm = newTime.trim().replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).match(/(\d{1,2}):(\d{2})/);
      if (_hm) { const _b = selectedCalDate ? new Date(selectedCalDate) : new Date(); if (!selectedCalDate && newDate === 'فردا') _b.setDate(_b.getDate() + 1); _b.setHours(parseInt(_hm[1], 10), parseInt(_hm[2], 10), 0, 0); if (_b.getTime() > Date.now()) (api as any).reminderCreate(newTitle.trim(), _b.getTime()); }
    } catch (_) {} }
    if (newTaskDrafts.length > 0) {
      const baseId = Math.max(...tasks.map(t => t.id), 0) + 1;
      const newTasks: AsstTask[] = newTaskDrafts.map((d, idx) => ({
        id: baseId + idx, title: d.title, priority: d.priority, done: false, dueDate: newDate, eventId: newId,
      }));
      setTasks(prev => [...prev, ...newTasks]);
    }
    setNewTitle(''); setNewTime(''); setNewDate('امروز'); setNewType('reminder'); setShowCalendar(false); setSelectedCalDate(null); setAutoRepeat(false); setRepeatInterval(1); setRepeatUnit('week'); setRepeatMaxCount(5); setShowTimePicker(false);
    setNewTaskDrafts([]); setNewTaskInput(''); setNewTaskPriority('medium');
    setShowNewForm(false);
    showToast('رویداد جدید اضافه شد');
  };

  const dateOptions = [
    { value: 'امروز', label: 'امروز' },
    { value: 'فردا', label: 'فردا' },
  ];

  const typeOptions: { value: CalEvent['type']; label: string; icon: string; color: string }[] = [
    { value: 'reminder', label: 'یادآور', icon: 'fa-solid fa-bell', color: '#F59E0B' },
    { value: 'personal', label: 'شخصی', icon: 'fa-solid fa-heart', color: '#10B981' },
    { value: 'work', label: 'کاری', icon: 'fa-solid fa-briefcase', color: '#8B5CF6' },
    { value: 'meeting', label: 'جلسه', icon: 'fa-solid fa-users', color: '#3B82F6' },
  ];

  const renderStatusActions = (ev: CalEvent) => {
    const btn = (label: string, icon: string, color: string, target: PlanStatus) => (
      <button
        key={target}
        className="flex-1 py-2 px-2.5 rounded-lg border-none text-white text-[11px] cursor-pointer flex items-center justify-center gap-1.5 transition-all"
        style={{ background: color, fontWeight: 600 }}
        onClick={e => { e.stopPropagation(); setStatus(ev.id, target); }}
      >
        <i className={`${icon} text-[10px]`} /> {label}
      </button>
    );
    if (ev.status === 'pending') return <>{btn('شروع', 'fa-solid fa-play', '#F59E0B', 'inprogress')}{btn('لغو', 'fa-solid fa-ban', '#EF4444', 'cancelled')}</>;
    if (ev.status === 'inprogress') return <>{btn('انجام شد', 'fa-solid fa-check', '#10B981', 'done')}{btn('لغو', 'fa-solid fa-ban', '#EF4444', 'cancelled')}</>;
    if (ev.status === 'done') return <>{btn('بازگردانی به معلق', 'fa-solid fa-rotate-left', '#6366f1', 'pending')}</>;
    return <>{btn('بازگردانی به معلق', 'fa-solid fa-rotate-left', '#6366f1', 'pending')}</>;
  };

  const renderGroup = (title: string, icon: string, iconColor: string, items: CalEvent[], delayOffset: number) => {
    const collapsed = collapsedGroups[title];
    return (
      <div className="mb-3 rounded-2xl border border-[var(--aw-border)] overflow-hidden" style={{ background: 'var(--aw-bg-card)' }}>
        <button type="button"
          className="w-full flex items-center gap-2.5 px-3 py-2.5 cursor-pointer border-none bg-transparent text-right"
          onClick={() => setCollapsedGroups(prev => ({ ...prev, [title]: !prev[title] }))}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${iconColor}1F`, color: iconColor }}>
            <i className={`${icon} text-[12px]`} />
          </span>
          <span className="text-[14px] flex-1" style={{ fontWeight: 700, color: 'var(--aw-text-primary)' }}>{title}</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--aw-bg-input)', color: '#8F8F8F', fontWeight: 600 }}>{toFa(items.length)} مورد</span>
          <i className={`fa-solid fa-chevron-${collapsed ? 'down' : 'up'} text-[11px] text-[var(--aw-text-muted)] flex-shrink-0`} />
        </button>
        {!collapsed && (
            <div className="overflow-hidden">
              <div className="px-2.5 pb-2.5 pt-0.5">
                {items.length === 0 && (
                  <div className="text-[11px] text-[var(--aw-text-muted)] px-3 py-3 text-center">رویدادی ثبت نشده است.</div>
                )}
      {items.map((ev, i) => {
        const ct = calTypeColors[ev.type];
        const ss = planStatusStyles[ev.status];
        const isExpanded = expandedId === ev.id;
        return (
          <motion.div key={ev.id}
            className={`group mb-2 cursor-pointer rounded-2xl border transition-all ${dragId === ev.id ? 'opacity-50' : ''}`}
            style={{ background: ss.bg, borderColor: ss.border }}
            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 + delayOffset }}
            onClick={() => setExpandedId(isExpanded ? null : ev.id)}
            draggable
            onDragStart={() => setDragId(ev.id)}
            onDragEnd={() => setDragId(null)}
            onDragOver={e => { e.preventDefault(); }}
            onDrop={e => { e.preventDefault(); if (dragId !== null) { reorderEvent(dragId, ev.id); setDragId(null); } }}
          >
            <div className="flex items-center gap-2 p-3">
              <div className="flex-1 min-w-0">
                <div className={`text-[13px] ${ev.status === 'done' ? 'line-through text-[var(--aw-text-muted)]' : 'text-[var(--aw-text-primary)]'}`} style={{ fontWeight: 700 }}>{ev.title}</div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {/* پیل وضعیت فقط برای حالت‌های معنادار (در حالِ انجام/انجام‌شده/لغو) — «معلق» حالتِ پیش‌فرضِ هر رویدادِ تازه است و نشان‌دادنش کنارِ همه‌چیز فقط شلوغی/گیج‌کننده بود. */}
                  {ev.status !== 'pending' && (
                    <span className="text-[10px] flex items-center gap-1" style={{ color: ss.pillText, fontWeight: 600 }}>
                      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: ss.pillText }} />
                      {ss.label}
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--aw-text-muted)]"><i className="fa-regular fa-clock text-[8px] ml-1" />{ev.time}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: `${ct.color}1F`, color: ct.color, fontWeight: 700 }}>{ct.label}</span>
                </div>
              </div>
              <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-[11px] text-[var(--aw-text-muted)] flex-shrink-0`} />
              <button
                className="w-7 h-7 rounded-lg border-none bg-transparent text-[12px] cursor-pointer flex items-center justify-center flex-shrink-0 text-[var(--aw-text-muted)] hover:text-[#6366f1] hover:bg-[rgba(99,102,241,0.1)]"
                onClick={e => { e.stopPropagation(); startEdit(ev); }}
                title="ویرایش"
              >
                <i className="fa-solid fa-pen" />
              </button>
              <button
                className="w-7 h-7 rounded-lg border-none bg-transparent text-[12px] cursor-pointer flex items-center justify-center flex-shrink-0 hover:bg-red-500/10"
                style={{ color: '#EF4444' }}
                onClick={e => { e.stopPropagation(); deleteEvent(ev.id); }}
                title="حذف"
              >
                <i className="fa-solid fa-trash" />
              </button>
              <button
                className={`w-7 h-7 rounded-lg border-none bg-transparent text-[12px] cursor-pointer flex items-center justify-center flex-shrink-0 ${ev.muted ? 'text-amber-400 hover:bg-amber-500/10' : 'text-[var(--aw-text-muted)] hover:text-amber-400 hover:bg-amber-500/10'}`}
                onClick={e => { e.stopPropagation(); toggleMute(ev.id); }}
                title={ev.muted ? 'فعال‌سازی اعلان' : 'سایلنت'}
              >
                <i className={ev.muted ? 'fa-solid fa-bell-slash' : 'fa-regular fa-bell'} />
              </button>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 pt-0 border-t" style={{ borderColor: ss.border }} onClick={e => e.stopPropagation()}>
                    <div className="text-[11px] text-[var(--aw-text-secondary)] leading-6 mt-2.5 mb-3">
                      {ev.description || 'توضیحاتی برای این برنامه ثبت نشده است.'}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-[var(--aw-text-muted)] mb-3">
                      <div className="flex items-center gap-1.5"><i className="fa-regular fa-calendar text-[9px]" />{ev.date}</div>
                      <div className="flex items-center gap-1.5"><i className="fa-regular fa-clock text-[9px]" />{ev.time}</div>
                    </div>

                    {/* Tasks for this plan */}
                    {(() => {
                      const planTasks = tasks.filter(t => t.eventId === ev.id);
                      return (
                        <div className="mb-3">
                          <div className="text-[10.5px] text-[var(--aw-text-muted)] mb-1.5 px-0.5 flex items-center gap-1.5" style={{ fontWeight: 700 }}>
                            <i className="fa-solid fa-list-check text-[10px]" />
                            وظایف برنامه ({toFa(planTasks.length)})
                          </div>
                          {planTasks.length === 0 ? (
                            <div className="text-[10.5px] text-[var(--aw-text-muted)] px-3 py-2 rounded-[10px] border border-dashed border-[var(--aw-border)]">
                              وظیفه‌ای برای این برنامه ثبت نشده است.
                            </div>
                          ) : planTasks.map(task => {
                            const pr = priColors[task.priority];
                            return (
                              <div key={task.id}
                                className={`flex items-center gap-2 px-2.5 py-2 mb-1.5 rounded-[10px] border border-[var(--aw-border)] cursor-pointer ${taskDragId === task.id ? 'opacity-50' : ''}`}
                                style={{ background: 'var(--aw-bg-input)' }}
                                onClick={() => toggleTaskDone(task.id)}
                                draggable
                                onDragStart={e => { e.stopPropagation(); setTaskDragId(task.id); }}
                                onDragEnd={() => setTaskDragId(null)}
                                onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                                onDrop={e => { e.preventDefault(); e.stopPropagation(); if (taskDragId !== null) { reorderTask(taskDragId, task.id); setTaskDragId(null); } }}
                              >
                                <div className="w-4 h-6 flex items-center justify-center text-[var(--aw-text-muted)] cursor-grab active:cursor-grabbing flex-shrink-0"
                                  onClick={e => e.stopPropagation()} title="جابه‌جایی">
                                  <i className="fa-solid fa-grip-vertical text-[10px]" />
                                </div>
                                <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
                                  style={{ borderColor: task.done ? '#10B981' : 'var(--aw-border)', background: task.done ? 'rgba(16,185,129,0.15)' : 'transparent' }}>
                                  {task.done && <i className="fa-solid fa-check text-[8px] text-[#10B981]" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-[11.5px] truncate ${task.done ? 'line-through text-[var(--aw-text-muted)]' : 'text-[var(--aw-text-primary)]'}`} style={{ fontWeight: 600 }}>{task.title}</div>
                                </div>
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md flex-shrink-0" style={{ background: `${pr.color}18`, color: pr.color, fontWeight: 700 }}>{pr.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    <div className="flex gap-2">{renderStatusActions(ev)}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
              </div>
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll px-4 pt-3">
      <AnimatePresence>
        {showCalendarHint && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[12px] shadow-lg"
            style={{
              position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              background: '#6366f1', color: '#fff', fontWeight: 600, zIndex: 9999,
              boxShadow: '0 10px 30px rgba(99,102,241,0.4)',
            }}
          >
            <i className="fa-solid fa-circle-info text-[12px]" />
            یک تاریخ برای این برنامه انتخاب کنید
          </motion.div>
        )}
      </AnimatePresence>
      {/* New event button / form */}
      <AnimatePresence mode="wait">
        {showNewForm ? (
          <motion.div key="new-form" className="p-3.5 mb-4 rounded-2xl border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)' }}>
                <i className={`fa-solid ${editingId !== null ? 'fa-pen' : 'fa-plus'} text-[13px]`} style={{ color: '#6366f1' }} />
              </div>
              <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{editingId !== null ? 'ویرایش برنامه' : 'ایجاد برنامه جدید'}</span>
            </div>

            <input
              className="w-full rounded-[10px] border border-[var(--aw-border)] px-3 py-2.5 text-[12px] text-[var(--aw-text-primary)] outline-none mb-2.5 placeholder:text-[var(--aw-text-muted)]"
              style={{ background: 'var(--aw-bg-input)' }}
              placeholder="عنوان رویداد..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
            />

            <div className="mb-2.5">
              <div className="text-[10px] text-[var(--aw-text-muted)] mb-1.5 px-0.5" style={{ fontWeight: 600 }}>ساعت</div>
              <TimePicker value={String(newTime || '')} onChange={(v: string) => setNewTime(v)} />
            </div>

            <div className="mb-2.5">
              <div className="text-[10px] text-[var(--aw-text-muted)] mb-1.5 px-0.5" style={{ fontWeight: 600 }}>زمان‌بندی</div>
              <div className="flex gap-1.5 flex-wrap">
                {dateOptions.map(d => (
                  <button key={d.value}
                    className={`py-1.5 px-3 rounded-lg border text-[11px] cursor-pointer transition-all ${
                      newDate === d.value && !showCalendar ? 'text-white border-transparent' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'
                    }`}
                    style={newDate === d.value && !showCalendar ? { background: '#6366f1', fontWeight: 600 } : { fontWeight: 500 }}
                    onClick={() => { setNewDate(d.value); setShowCalendar(false); setSelectedCalDate(null); }}
                  >
                    {d.label}
                  </button>
                ))}
                <button
                  className={`py-1.5 px-3 rounded-lg border text-[11px] cursor-pointer transition-all flex items-center gap-1 ${
                    showCalendar ? 'text-white border-transparent' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'
                  }`}
                  style={showCalendar ? { background: '#6366f1', fontWeight: 600 } : { fontWeight: 500 }}
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <i className="fa-solid fa-calendar-days text-[9px]" />
                  {selectedCalDate ? formatSelectedDate(selectedCalDate) : 'انتخاب تاریخ'}
                </button>

                <button
                  type="button"
                  onClick={() => setAutoRepeat(v => !v)}
                  className="py-1.5 px-3 rounded-lg border text-[11px] cursor-pointer transition-all flex items-center gap-2"
                  style={autoRepeat
                    ? { background: '#10B981', borderColor: 'transparent', color: '#fff', fontWeight: 600 }
                    : { background: 'transparent', borderColor: 'var(--aw-border)', color: 'var(--aw-text-secondary)', fontWeight: 500 }}
                >
                  <i className="fa-solid fa-repeat text-[9px]" />
                  تکرار خودکار
                  <span className="relative inline-block w-7 h-3.5 rounded-full transition-colors" style={{ background: autoRepeat ? 'rgba(255,255,255,0.45)' : 'var(--aw-border)' }}>
                    <span className="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all" style={{ right: autoRepeat ? 2 : 14 }} />
                  </span>
                </button>
              </div>

              <AnimatePresence>
                {autoRepeat && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mt-2 rounded-[10px] border border-[var(--aw-border)] overflow-hidden"
                    style={{ background: 'var(--aw-bg-input)' }}
                  >
                    <div className="p-2.5 space-y-2.5">
                      <div>
                        <div className="text-[10px] text-[var(--aw-text-muted)] mb-1.5 px-0.5" style={{ fontWeight: 600 }}>مدت زمان تکرار</div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10.5px] text-[var(--aw-text-muted)]">هر</span>
                          <input
                            type="number" min={1} max={99}
                            value={repeatInterval}
                            onChange={e => setRepeatInterval(Math.max(1, parseInt(e.target.value || '1', 10)))}
                            className="w-14 rounded-lg border border-[var(--aw-border)] px-2 py-1 text-[11px] text-center outline-none"
                            style={{ background: 'var(--aw-bg-card)' }}
                          />
                          <div className="flex gap-1">
                            {([['hour','ساعت'],['day','روز'],['week','هفته'],['month','ماه']] as const).map(([u, lbl]) => {
                              const active = repeatUnit === u;
                              return (
                                <button key={u} type="button" onClick={() => setRepeatUnit(u)}
                                  className="py-1 px-2.5 rounded-md border text-[10.5px] cursor-pointer"
                                  style={active
                                    ? { background: '#6366f1', borderColor: 'transparent', color: '#fff', fontWeight: 700 }
                                    : { background: 'transparent', borderColor: 'var(--aw-border)', color: 'var(--aw-text-secondary)', fontWeight: 500 }}>
                                  {lbl}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-[var(--aw-text-muted)] mb-1.5 px-0.5" style={{ fontWeight: 600 }}>حداکثر تعداد تکرار</div>
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => setRepeatMaxCount(c => Math.max(1, c - 1))}
                            className="w-7 h-7 rounded-lg border border-[var(--aw-border)] cursor-pointer text-[var(--aw-text-secondary)]"
                            style={{ background: 'var(--aw-bg-card)' }}>−</button>
                          <input
                            type="number" min={1} max={365}
                            value={repeatMaxCount}
                            onChange={e => setRepeatMaxCount(Math.max(1, parseInt(e.target.value || '1', 10)))}
                            className="w-16 rounded-lg border border-[var(--aw-border)] px-2 py-1 text-[11px] text-center outline-none"
                            style={{ background: 'var(--aw-bg-card)' }}
                          />
                          <button type="button" onClick={() => setRepeatMaxCount(c => Math.min(365, c + 1))}
                            className="w-7 h-7 rounded-lg border border-[var(--aw-border)] cursor-pointer text-[var(--aw-text-secondary)]"
                            style={{ background: 'var(--aw-bg-card)' }}>+</button>
                          <span className="text-[10.5px] text-[var(--aw-text-muted)]">بار</span>
                        </div>
                      </div>

                      <div className="text-[10px] text-[var(--aw-text-muted)] flex items-center gap-1 pt-1 border-t border-[var(--aw-border)]" style={{ paddingTop: 8 }}>
                        <i className="fa-solid fa-circle-info text-[#6366f1]" />
                        این رویداد {toFa(repeatMaxCount)} بار، هر {toFa(repeatInterval)} {repeatUnit === 'hour' ? 'ساعت' : repeatUnit === 'day' ? 'روز' : repeatUnit === 'week' ? 'هفته' : 'ماه'} یک‌بار تکرار می‌شود.
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Inline Calendar */}
              <AnimatePresence>
                {showCalendar && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mt-2 rounded-[10px] border border-[var(--aw-border)] overflow-hidden"
                    style={{ background: 'var(--aw-bg-input)' }}
                  >
                    <div className="p-2.5">
                      {/* Month navigation */}
                      <div className="flex items-center justify-between mb-2">
                        <button
                          className="w-7 h-7 rounded-lg border-none bg-transparent text-[var(--aw-text-secondary)] cursor-pointer hover:bg-[var(--aw-bg-card-hover)] flex items-center justify-center transition-colors"
                          onClick={() => { const [jy, jm] = _g2j(calMonth); let y = jy, m = jm + 1; if (m > 12) { m = 1; y++; } setCalMonth(_j2g(y, m, 1)); }}
                        >
                          <i className="fa-solid fa-chevron-right text-[10px]" />
                        </button>
                        <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>
                          {(() => { const [jy, jm] = _g2j(calMonth); return `${PERSIAN_MONTHS[jm - 1]} ${toFa(jy)}`; })()}
                        </span>
                        <button
                          className="w-7 h-7 rounded-lg border-none bg-transparent text-[var(--aw-text-secondary)] cursor-pointer hover:bg-[var(--aw-bg-card-hover)] flex items-center justify-center transition-colors"
                          onClick={() => { const [jy, jm] = _g2j(calMonth); let y = jy, m = jm - 1; if (m < 1) { m = 12; y--; } setCalMonth(_j2g(y, m, 1)); }}
                        >
                          <i className="fa-solid fa-chevron-left text-[10px]" />
                        </button>
                      </div>
                      {/* Weekday headers */}
                      <div className="grid grid-cols-7 gap-0.5 mb-1">
                        {PERSIAN_WEEKDAYS.map(wd => (
                          <div key={wd} className="text-center text-[9px] text-[var(--aw-text-muted)] py-0.5" style={{ fontWeight: 600 }}>{wd}</div>
                        ))}
                      </div>
                      {/* Day cells */}
                      <div className="grid grid-cols-7 gap-0.5">
                        {getCalendarDays(calMonth).map((day, idx) => {
                          if (day === null) return <div key={`empty-${idx}`} />;
                          const _cj = _g2j(calMonth); const cellDate = _j2g(_cj[0], _cj[1], day);
                          const todayNow = new Date(); todayNow.setHours(0,0,0,0);
                          const isToday = cellDate.getTime() === todayNow.getTime();
                          const isPast = cellDate < todayNow;
                          const isSelected = selectedCalDate && cellDate.getTime() === selectedCalDate.getTime();
                          return (
                            <button
                              key={`day-${day}`}
                              disabled={isPast && !isToday}
                              className={`w-full aspect-square rounded-lg border-none text-[11px] cursor-pointer flex items-center justify-center transition-all ${
                                isSelected ? 'text-white' : isToday ? 'text-[#6366f1]' : isPast ? 'text-[var(--aw-text-muted)] opacity-40 cursor-not-allowed' : 'text-[var(--aw-text-secondary)] hover:bg-[var(--aw-bg-card-hover)]'
                              }`}
                              style={{
                                background: isSelected ? '#6366f1' : isToday && !isSelected ? 'rgba(99,102,241,0.1)' : 'transparent',
                                fontWeight: isToday || isSelected ? 700 : 500,
                              }}
                              onClick={() => {
                                if (isPast && !isToday) return;
                                setSelectedCalDate(cellDate);
                                setNewDate(dateToCategoryLabel(cellDate));
                              }}
                            >
                              {toFa(day)}
                            </button>
                          );
                        })}
                      </div>
                      {/* Selected date label */}
                      {selectedCalDate && (
                        <div className="mt-2 text-center text-[10px] text-[var(--aw-text-muted)]">
                          <i className="fa-solid fa-check-circle text-[#6366f1] ml-1 text-[9px]" />
                          {formatSelectedDate(selectedCalDate)} — <span style={{ color: '#6366f1', fontWeight: 600 }}>{newDate}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mb-3">
              <div className="text-[10px] text-[var(--aw-text-muted)] mb-1.5 px-0.5" style={{ fontWeight: 600 }}>نوع رویداد</div>
              <div className="flex gap-1.5 flex-wrap">
                {typeOptions.map(t => (
                  <button key={t.value}
                    className={`py-1.5 px-3 rounded-lg border text-[11px] cursor-pointer transition-all flex items-center gap-1.5 ${
                      newType === t.value ? 'text-white border-transparent' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'
                    }`}
                    style={newType === t.value ? { background: t.color, fontWeight: 600 } : { fontWeight: 500 }}
                    onClick={() => setNewType(t.value)}
                  >
                    <i className={`${t.icon} text-[9px]`} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tasks list */}
            <div className="mb-3">
              <div className="text-[10px] text-[var(--aw-text-muted)] mb-1.5 px-0.5 flex items-center gap-1.5" style={{ fontWeight: 600 }}>
                <i className="fa-solid fa-list-check text-[9px]" />
                وظایف برنامه ({toFa(newTaskDrafts.length)})
              </div>

              {newTaskDrafts.length > 0 && (
                <div className="mb-2">
                  {newTaskDrafts.map((d, idx) => {
                    const pr = priColors[d.priority];
                    return (
                      <div key={idx} className="flex items-center gap-2 px-2.5 py-2 mb-1.5 rounded-[10px] border border-[var(--aw-border)]"
                        style={{ background: 'var(--aw-bg-input)' }}>
                        <i className="fa-solid fa-circle text-[6px]" style={{ color: pr.color }} />
                        <span className="flex-1 text-[11.5px] text-[var(--aw-text-primary)] truncate" style={{ fontWeight: 600 }}>{d.title}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md flex-shrink-0" style={{ background: `${pr.color}18`, color: pr.color, fontWeight: 700 }}>{pr.label}</span>
                        <button
                          className="w-6 h-6 rounded-[10px] border-none bg-transparent text-[var(--aw-text-muted)] cursor-pointer hover:text-red-400 flex items-center justify-center"
                          onClick={() => setNewTaskDrafts(prev => prev.filter((_, i) => i !== idx))}
                          title="حذف"
                        >
                          <i className="fa-solid fa-times text-[11px]" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-1.5">
                <input
                  className="flex-1 rounded-[10px] border border-[var(--aw-border)] px-3 py-2 text-[11.5px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
                  style={{ background: 'var(--aw-bg-input)' }}
                  placeholder="افزودن وظیفه..."
                  value={newTaskInput}
                  onChange={e => setNewTaskInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newTaskInput.trim()) {
                      e.preventDefault();
                      setNewTaskDrafts(prev => [...prev, { title: newTaskInput.trim(), priority: newTaskPriority }]);
                      setNewTaskInput('');
                    }
                  }}
                />
                <button
                  type="button"
                  className="px-3 rounded-[10px] border border-[var(--aw-border)] bg-transparent text-[11px] cursor-pointer flex items-center gap-1"
                  style={{ color: priColors[newTaskPriority].color, fontWeight: 600 }}
                  onClick={() => {
                    const order: ('medium' | 'high' | 'low')[] = ['medium', 'high', 'low'];
                    const next = order[(order.indexOf(newTaskPriority) + 1) % order.length];
                    setNewTaskPriority(next);
                  }}
                  title="تغییر اولویت"
                >
                  <i className="fa-solid fa-flag text-[9px]" />
                  {priColors[newTaskPriority].label}
                </button>
                <button
                  type="button"
                  className="px-3 rounded-[10px] border-none text-white text-[11px] cursor-pointer flex items-center justify-center"
                  style={{ background: '#6366f1', fontWeight: 600 }}
                  onClick={() => {
                    if (!newTaskInput.trim()) return;
                    setNewTaskDrafts(prev => [...prev, { title: newTaskInput.trim(), priority: newTaskPriority }]);
                    setNewTaskInput('');
                  }}
                  title="افزودن"
                >
                  <i className="fa-solid fa-plus text-[10px]" />
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 py-2.5 rounded-[10px] border-none text-white text-[12px] cursor-pointer flex items-center justify-center gap-1.5"
                style={{ background: '#6366f1', fontWeight: 600 }}
                onClick={submitNewEvent}
              >
                <i className="fa-solid fa-check text-[10px]" /> {editingId !== null ? 'ذخیره تغییرات' : 'ذخیره رویداد'}
              </button>
              <button
                className="py-2.5 px-4 rounded-[10px] border border-[var(--aw-border)] bg-transparent text-[var(--aw-text-muted)] text-[12px] cursor-pointer"
                style={{ fontWeight: 500 }}
                onClick={() => { setShowNewForm(false); setEditingId(null); setNewTitle(''); setNewTime(''); setShowCalendar(false); setSelectedCalDate(null); setNewTaskDrafts([]); setNewTaskInput(''); setShowTimePicker(false); }}
              >
                انصراف
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button key="new-btn"
            className="w-full flex items-center justify-center gap-2 p-3 mb-4 rounded-[10px] border border-dashed cursor-pointer text-[12px] transition-all hover:border-[#6366f1] hover:bg-[rgba(99,102,241,0.06)]"
            style={{ borderColor: '#6366f1', background: 'transparent', color: '#6366f1', fontWeight: 600 }}
            onClick={() => setShowNewForm(true)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <i className="fa-solid fa-plus" /> ایجاد برنامه جدید
          </motion.button>
        )}
      </AnimatePresence>

      {renderGroup('امروز', 'fa-solid fa-sun', '#F59E0B', todayEvents, 0)}
      {renderGroup('فردا', 'fa-solid fa-moon', '#8B5CF6', tomorrowEvents, 0.2)}
      {renderGroup('تا یک ماه آینده', 'fa-solid fa-calendar', '#3B82F6', upToMonthEvents, 0.4)}
    </div>
  );
}

function AssistantTodoTab({ tasks, setTasks, events }: { tasks: AsstTask[]; setTasks: React.Dispatch<React.SetStateAction<AsstTask[]>>; events: CalEvent[] }) {
  const { showToast } = useApp();
  const [dragId, setDragId] = useState<number | null>(null);

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : (t as any).completedAt } : t));
    showToast('وضعیت وظیفه تغییر کرد');
  };

  const reorderTask = (sourceId: number, targetId: number) => {
    if (sourceId === targetId) return;
    setTasks(prev => {
      const source = prev.find(t => t.id === sourceId);
      const target = prev.find(t => t.id === targetId);
      if (!source || !target || source.eventId !== target.eventId) return prev;
      const others = prev.filter(t => t.id !== sourceId);
      const targetIdx = others.findIndex(t => t.id === targetId);
      return [...others.slice(0, targetIdx), source, ...others.slice(targetIdx)];
    });
  };

  const inProgressEvents = events.filter(e => e.status === 'inprogress');
  const groups = inProgressEvents.map(ev => ({ ev, items: tasks.filter(t => t.eventId === ev.id) }));
  const orphanTasks = tasks.filter(t => !t.eventId || !inProgressEvents.some(ev => ev.id === t.eventId));

  const doneCount = tasks.filter(t => t.done).length;

  const renderTaskRow = (task: AsstTask, i: number) => {
    const pr = priColors[task.priority];
    return (
      <motion.div key={task.id}
        className={`flex items-center gap-2.5 p-3 mb-2 cursor-pointer ${dragId === task.id ? 'opacity-50' : ''}`}
        style={euCardStyle}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
        onClick={() => toggleTask(task.id)}
        draggable
        onDragStart={() => setDragId(task.id)}
        onDragEnd={() => setDragId(null)}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); if (dragId !== null) { reorderTask(dragId, task.id); setDragId(null); } }}
      >
        <div className="w-5 h-7 flex items-center justify-center text-[var(--aw-text-muted)] cursor-grab active:cursor-grabbing flex-shrink-0"
          onClick={e => e.stopPropagation()} title="جابه‌جایی">
          <i className="fa-solid fa-grip-vertical text-[11px]" />
        </div>
        <div className="w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all"
          style={{ borderColor: task.done ? '#10B981' : 'var(--aw-border)', background: task.done ? 'rgba(16,185,129,0.15)' : 'transparent' }}>
          {task.done && <i className="fa-solid fa-check text-[10px] text-[#10B981]" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-[13px] ${task.done ? 'line-through text-[var(--aw-text-muted)]' : 'text-[var(--aw-text-primary)]'}`} style={{ fontWeight: 600 }}>{task.title}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusPill label={pr.label} color={pr.color} />
            <span className="text-[9px] text-[var(--aw-text-muted)]"><i className="fa-regular fa-clock text-[8px] ml-0.5" />{task.dueDate}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll px-4 pt-3">
      {/* Progress summary */}
      <div className="p-3 mb-3 flex items-center gap-3" style={euCardStyle}>
        <div className="relative w-12 h-12 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(126,95,170,0.15)" strokeWidth="3" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--aw-eu-primary)" strokeWidth="3"
              strokeDasharray={`${(doneCount / Math.max(tasks.length, 1)) * 100}, 100`} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>
            {toFa(Math.round((doneCount / Math.max(tasks.length, 1)) * 100))}%
          </span>
        </div>
        <div>
          <div className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{toFa(doneCount)} از {toFa(tasks.length)} انجام شده</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">{toFa(tasks.length - doneCount)} وظیفه باقی‌مانده</div>
        </div>
      </div>

      {groups.length === 0 && orphanTasks.length === 0 && (
        <div className="p-6 text-center rounded-2xl border border-dashed border-[var(--aw-border)]">
          <i className="fa-solid fa-list-check text-[22px] text-[var(--aw-text-muted)] mb-2 block" />
          <div className="text-[12px] text-[var(--aw-text-muted)]">وظیفه‌ای برای برنامه‌های در حال انجام ثبت نشده است.</div>
        </div>
      )}

      {groups.map(({ ev, items }) => {
        const ct = calTypeColors[ev.type];
        return (
          <div key={`grp-${ev.id}`} className="mb-4">
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${ct.color}15` }}>
                <i className={`${ct.icon} text-[11px]`} style={{ color: ct.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-[var(--aw-text-primary)] truncate" style={{ fontWeight: 700 }}>{ev.title}</div>
                <div className="text-[9.5px] text-[var(--aw-text-muted)]">{ev.date} · {ev.time}</div>
              </div>
              <span className="text-[9.5px] px-1.5 py-0.5 rounded-md flex items-center gap-1"
                style={{ background: planStatusStyles.inprogress.pillBg, color: planStatusStyles.inprogress.pillText, fontWeight: 700 }}>
                <i className={`${planStatusStyles.inprogress.icon} text-[8px]`} />{toFa(items.length)} وظیفه
              </span>
            </div>
            {items.length === 0 ? (
              <div className="text-[10.5px] text-[var(--aw-text-muted)] px-3 py-2.5 rounded-[10px] border border-dashed border-[var(--aw-border)] mb-2">
                وظیفه‌ای برای این برنامه ثبت نشده است.
              </div>
            ) : items.map((t, i) => renderTaskRow(t, i))}
          </div>
        );
      })}

      {orphanTasks.length > 0 && (
        <div className="mb-3">
          <div className="text-[12px] text-[var(--aw-text-muted)] mb-2 px-1 flex items-center gap-1.5" style={{ fontWeight: 700 }}>
            <i className="fa-solid fa-inbox text-[10px]" /> سایر وظایف
          </div>
          {orphanTasks.map((t, i) => renderTaskRow(t, i))}
        </div>
      )}
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const q = query.trim();
  const parts: React.ReactNode[] = [];
  let i = 0;
  const lowerText = text.toLowerCase();
  const lowerQ = q.toLowerCase();
  while (i < text.length) {
    const idx = lowerText.indexOf(lowerQ, i);
    if (idx === -1) { parts.push(text.slice(i)); break; }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark key={idx} style={{ background: 'rgba(99,102,241,0.30)', color: '#fff', padding: '0 2px', borderRadius: 3, fontWeight: 700 }}>
        {text.slice(idx, idx + q.length)}
      </mark>
    );
    i = idx + q.length;
  }
  return <>{parts}</>;
}

function AssistantSearchTab({ onBack }: { onBack?: () => void }) {
  const { showToast } = useApp();
  const [search, setSearch] = useState('');
  const q = search.trim();
  const has = (s: string | undefined) => !!s && q !== '' && s.toLowerCase().includes(q.toLowerCase());

  // داده‌ی واقعیِ کاربر از سرور (نه ثابت‌های فیک/مُرده). مبلغِ سفارش با جداکنندهٔ هزارگان.
  const [_orders, _setOrders] = useState<any[]>([]);
  const [_events, _setEvents] = useState<any[]>([]);
  const [_tasks, _setTasks] = useState<any[]>([]);
  const [_notes, _setNotes] = useState<any[]>([]);
  const _asstSearchLoaded = useRef(false);
  const _loadNotes = () => { (api as any).myList('notes').then((n: any) => { if (Array.isArray(n)) _setNotes(n as any); }).catch(() => {}); };
  useEffect(() => {
    if (_asstSearchLoaded.current) return; _asstSearchLoaded.current = true;
    (async () => {
      try { const o: any = await (api as any).myOrders(); if (Array.isArray(o)) _setOrders(o.map((x: any) => ({
        id: x.id, num: String(x.num || x.id || ''), items: String(x.items || ''),
        status: (['preparing','delivering','delivered','cancelled'].indexOf(x.status) >= 0 ? x.status : 'preparing'),
        restaurant: String(x.restaurant || x.vendor || ''), date: String(x.date || ''),
        total: (typeof x.total === 'number' ? x.total.toLocaleString('fa-IR') : String(x.total || '')),
        eta: x.eta ? String(x.eta) : undefined,
      }))); } catch (_e) {}
      try { const e: any = await (api as any).myList('calendar'); if (Array.isArray(e)) _setEvents(e as any); } catch (_e) {}
      try { const t: any = await (api as any).myList('tasks'); if (Array.isArray(t)) _setTasks(t as any); } catch (_e) {}
      _loadNotes();
    })();
  }, []);
  // یادداشتِ ساخته‌شده توسط دستیار (myCreate('notes')) بلافاصله اینجا دیده شود.
  useEffect(() => {
    const onChanged = (e: any) => { if (e?.detail?.collection === 'notes') _loadNotes(); };
    window.addEventListener('neura-data-changed', onChanged as any);
    return () => window.removeEventListener('neura-data-changed', onChanged as any);
  }, []);

  const matchedOrders = q ? _orders.filter((o: any) =>
    has(o.num) || has(o.items) || has(o.restaurant) || has(o.date) || has(o.total) || has(o.status) || has(o.eta)
  ) : [];
  const matchedEvents = q ? _events.filter((e: any) =>
    has(e.title) || has(e.time) || has(e.date) || has(e.type) || has(e.status) || has(e.description)
  ) : [];
  const matchedTasks = q ? _tasks.filter((t: any) =>
    has(t.title) || has(t.priority) || has(t.dueDate)
  ) : [];

  const totalMatches = matchedOrders.length + matchedEvents.length + matchedTasks.length;

  const orderStatusLabel: Record<DineOrder['status'], { label: string; color: string }> = {
    preparing:  { label: 'در حال آماده‌سازی', color: '#F59E0B' },
    delivering: { label: 'در حال ارسال',     color: '#3B82F6' },
    delivered:  { label: 'تحویل شده',         color: '#10B981' },
    cancelled:  { label: 'لغو شده',           color: '#EF4444' },
  };

  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll px-4 pt-3">
      <div className="flex items-center gap-2 mb-3">
        {onBack && (
          <button onClick={onBack} title="بازگشت"
            className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-eu-primary)' }}>
            <i className="fa-solid fa-arrow-right text-[14px]" />
          </button>
        )}
        <div className="flex-1 flex items-center gap-2 rounded-[10px] px-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
          <i className="fa-solid fa-search text-sm text-[var(--aw-text-muted)]" />
          <input className="flex-1 min-w-0 bg-transparent border-none py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
            placeholder="جستجو در سفارشات، برنامه‌ها و وظایف..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="bg-transparent border-none text-[var(--aw-text-muted)] cursor-pointer" onClick={() => setSearch('')}><i className="fa-solid fa-times text-sm" /></button>}
        </div>
      </div>

      {q && (
        <div className="text-[10.5px] text-[var(--aw-text-muted)] mb-3 px-1">
          {totalMatches > 0 ? <><i className="fa-solid fa-circle-check text-[#10B981] ml-1 text-[9px]" />{toFa(totalMatches)} نتیجه برای «{q}»</> : <><i className="fa-solid fa-circle-info ml-1 text-[9px]" />نتیجه‌ای برای «{q}» یافت نشد</>}
        </div>
      )}

      {/* Orders results */}
      {matchedOrders.length > 0 && (
        <div className="mb-4">
          <SectionTitle icon="fa-solid fa-bag-shopping" title={`سفارشات (${toFa(matchedOrders.length)})`} />
          {matchedOrders.map((o, i) => {
            const st = orderStatusLabel[o.status];
            return (
              <motion.div key={o.id} className="p-3 mb-2" style={euCardStyle}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12.5px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>
                    سفارش #<Highlight text={o.num} query={q} />
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md" style={{ background: `${st.color}18`, color: st.color, fontWeight: 700 }}>{st.label}</span>
                </div>
                <div className="text-[11.5px] text-[var(--aw-text-secondary)] mb-0.5"><Highlight text={o.items} query={q} /></div>
                <div className="flex items-center gap-2 text-[10px] text-[var(--aw-text-muted)] flex-wrap">
                  <span><i className="fa-solid fa-store text-[8px] ml-1" /><Highlight text={o.restaurant} query={q} /></span>
                  <span><i className="fa-regular fa-clock text-[8px] ml-1" /><Highlight text={o.date} query={q} /></span>
                  <span><i className="fa-solid fa-coins text-[8px] ml-1" /><Highlight text={o.total} query={q} /> تومان</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Plans results */}
      {matchedEvents.length > 0 && (
        <div className="mb-4">
          <SectionTitle icon="fa-solid fa-calendar-days" title={`برنامه‌ها (${toFa(matchedEvents.length)})`} />
          {matchedEvents.map((e, i) => {
            const ct = calTypeColors[e.type];
            const ss = planStatusStyles[e.status];
            return (
              <motion.div key={e.id} className="p-3 mb-2 rounded-2xl border"
                style={{ background: ss.bg, borderColor: ss.border }}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${ct.color}15` }}>
                    <i className={`${ct.icon} text-[11px]`} style={{ color: ct.color }} />
                  </div>
                  <span className="flex-1 text-[12.5px] text-[var(--aw-text-primary)] truncate" style={{ fontWeight: 700 }}>
                    <Highlight text={e.title} query={q} />
                  </span>
                  {e.status !== 'pending' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-1" style={{ background: ss.pillBg, color: ss.pillText, fontWeight: 700 }}>
                      <i className={`${ss.icon} text-[8px]`} />{ss.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[var(--aw-text-muted)] flex-wrap mb-1">
                  <span><i className="fa-regular fa-calendar text-[8px] ml-1" /><Highlight text={e.date} query={q} /></span>
                  <span><i className="fa-regular fa-clock text-[8px] ml-1" /><Highlight text={e.time} query={q} /></span>
                  <StatusPill label={ct.label} color={ct.color} />
                </div>
                {e.description && (
                  <div className="text-[10.5px] text-[var(--aw-text-secondary)] leading-5">
                    <Highlight text={e.description} query={q} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Tasks results */}
      {matchedTasks.length > 0 && (
        <div className="mb-4">
          <SectionTitle icon="fa-solid fa-list-check" title={`وظایف (${toFa(matchedTasks.length)})`} />
          {matchedTasks.map((t, i) => {
            const pr = priColors[t.priority];
            const parent = t.eventId ? _events.find((e: any) => e.id === t.eventId) : undefined;
            return (
              <motion.div key={t.id} className="p-3 mb-2" style={euCardStyle}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: t.done ? '#10B981' : 'var(--aw-border)', background: t.done ? 'rgba(16,185,129,0.15)' : 'transparent' }}>
                    {t.done && <i className="fa-solid fa-check text-[8px] text-[#10B981]" />}
                  </div>
                  <span className={`flex-1 text-[12.5px] truncate ${t.done ? 'line-through text-[var(--aw-text-muted)]' : 'text-[var(--aw-text-primary)]'}`} style={{ fontWeight: 600 }}>
                    <Highlight text={t.title} query={q} />
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md flex-shrink-0" style={{ background: `${pr.color}18`, color: pr.color, fontWeight: 700 }}>{pr.label}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[var(--aw-text-muted)] flex-wrap">
                  <span><i className="fa-regular fa-clock text-[8px] ml-1" /><Highlight text={t.dueDate} query={q} /></span>
                  {parent && (
                    <span><i className="fa-solid fa-link text-[8px] ml-1" />{parent.title}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!q && (
        <>
          <SectionTitle icon="fa-solid fa-clock-rotate-left" title="جستجوهای اخیر" />
          <div className="flex flex-wrap gap-2 mb-4">
            {([] as string[]).map((term, i) => (
              <button key={i} type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-[var(--aw-border)] cursor-pointer hover:border-[#6366f1] transition-all"
                style={{ background: 'var(--aw-bg-input)' }}
                onClick={() => setSearch(term)}>
                <i className="fa-solid fa-clock-rotate-left text-[10px] text-[var(--aw-text-muted)]" />
                <span className="text-[11.5px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{term}</span>
              </button>
            ))}
          </div>

          {_notes.length > 0 && <SectionTitle icon="fa-solid fa-sticky-note" title="یادداشت‌های اخیر" />}
          {_notes.map((n: any, i: number) => (
            <motion.div key={n.id} className="p-3 mb-2" style={euCardStyle}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{n.title}</span>
                {n.tag && <span className="text-[9px] px-1.5 py-0.5 rounded-md" style={{ background: `${n.color || '#6366f1'}15`, color: n.color || '#6366f1' }}>{n.tag}</span>}
              </div>
              <div className="text-[11px] text-[var(--aw-text-secondary)] truncate">{n.preview || n.text}</div>
              <div className="text-[9px] text-[var(--aw-text-muted)] mt-1"><i className="fa-regular fa-clock text-[8px] ml-0.5" />{n.date}</div>
            </motion.div>
          ))}
        </>
      )}
    </div>
  );
}

type ReportRange = 'day' | 'week' | 'month' | 'year';
type ReportPeriod = 'hour' | 'day' | 'week' | 'month';

const RANGE_OPTIONS: { id: ReportRange; label: string; days: number }[] = [
  { id: 'day',   label: 'یک روزه',  days: 1 },
  { id: 'week',  label: 'یک هفته',  days: 7 },
  { id: 'month', label: 'یک ماهه',  days: 30 },
  { id: 'year',  label: 'یک ساله',  days: 365 },
];

const PERIOD_OPTIONS: { id: ReportPeriod; label: string }[] = [
  { id: 'hour',  label: 'ساعتی' },
  { id: 'day',   label: 'روزانه' },
  { id: 'week',  label: 'هفتگی' },
  { id: 'month', label: 'ماهانه' },
];

// Only periods finer than the selected range produce a multi-bucket chart.
const VALID_PERIODS: Record<ReportRange, ReportPeriod[]> = {
  day:   ['hour'],
  week:  ['hour', 'day'],
  month: ['day', 'week'],
  year:  ['week', 'month'],
};

const PRIORITY_WEIGHT: Record<AsstTask['priority'], number> = { high: 3, medium: 2, low: 1 };

interface SyntheticDoneRecord { type: 'task' | 'plan' | 'order'; title: string; date: Date; weight: number; meta: string }

function generateSyntheticHistory(tasks: AsstTask[], events: CalEvent[], orders: any[] = []): SyntheticDoneRecord[] {
  // فقط رکوردهای واقعیِ انجام‌شده، با تاریخِ واقعی (نه now برای همه) — برای کاربرِ تازه خالی، صادقانه.
  // تاریخ: وظیفه از completedAt، رویداد از at، سفارش از dateِ ISOِ سرور. این باعث می‌شود نمودارِ
  // زمانی و فیلترِ بازه واقعاً کار کنند (قبلاً همه now بود → یک سطل و فیلترِ بی‌اثر).
  const now = new Date();
  const toDate = (v: any): Date => { if (v == null || v === '') return now; if (typeof v === 'number') return new Date(v); const d = new Date(v); return isNaN(d.getTime()) ? now : d; };
  const records: SyntheticDoneRecord[] = [];
  tasks.forEach((t) => { if (t.done) records.push({ type: 'task', title: t.title, date: toDate((t as any).completedAt), weight: PRIORITY_WEIGHT[t.priority], meta: t.dueDate }); });
  events.forEach((e) => { if (e.status === 'done') records.push({ type: 'plan', title: e.title, date: toDate((e as any).at || (e as any).completedAt), weight: 2, meta: e.time }); });
  (orders || []).forEach((o: any) => {
    const st = String(o.status || '');
    if (st === 'delivered' || st === 'done' || st === 'completed') {
      const totalNum = typeof o.total === 'number' ? o.total : (parseInt(String(o.total).replace(/[^\d]/g, ''), 10) || 0);
      records.push({ type: 'order', title: o.title || ('سفارش' + (o.num ? (' #' + o.num) : '')), date: toDate(o.date || o.at || o.createdAt), weight: 3, meta: totalNum ? String(totalNum) : '' });
    }
  });
  return records;
}

function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function printPDF(title: string, html: string) {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="utf-8"><title>${title}</title>
    <style>
      body { font-family: 'Vazirmatn', Tahoma, sans-serif; padding: 24px; color: #111; background:#fff; }
      h1 { font-size: 18px; margin: 0 0 16px; border-bottom: 2px solid #6366f1; padding-bottom: 8px; }
      h2 { font-size: 14px; margin: 18px 0 8px; color: #6366f1; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12px; }
      th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: right; }
      th { background: #f3f4f6; }
      .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
      .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
      .label { color: #6b7280; font-size: 11px; }
      .value { font-size: 18px; font-weight: 700; }
    </style></head><body>${html}<script>setTimeout(()=>window.print(),250);</script></body></html>`);
  win.document.close();
}

const COLLECTION_OPTIONS: { id: 'order' | 'plan' | 'task'; label: string; icon: string; color: string }[] = [
  { id: 'order', label: 'سفارشات',   icon: 'fa-solid fa-bag-shopping',  color: '#F59E0B' },
  { id: 'plan',  label: 'برنامه‌ها', icon: 'fa-solid fa-calendar-days', color: '#3B82F6' },
  { id: 'task',  label: 'وظایف',     icon: 'fa-solid fa-list-check',    color: '#10B981' },
];

function AssistantReportTab({ tasks, events, orders }: { tasks: AsstTask[]; events: CalEvent[]; orders?: any[] }) {
  const [range, setRange] = useState<ReportRange>('week');
  const [period, setPeriod] = useState<ReportPeriod>('day');
  const [collections, setCollections] = useState<Set<'order' | 'plan' | 'task'>>(new Set(['order', 'plan', 'task']));
  const [openDd, setOpenDd] = useState<null | 'col' | 'range' | 'period'>(null);

  const periodOptions = PERIOD_OPTIONS.filter(p => VALID_PERIODS[range].includes(p.id));
  const selectRange = (r: ReportRange) => {
    setRange(r);
    if (!VALID_PERIODS[r].includes(period)) setPeriod(VALID_PERIODS[r][VALID_PERIODS[r].length - 1]);
  };

  const toggleCollection = (id: 'order' | 'plan' | 'task') => {
    setCollections(prev => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); } else next.add(id);
      return next;
    });
  };

  const history = useMemo(() => generateSyntheticHistory(tasks, events, orders || []), [tasks, events, orders]);

  const rangeDays = RANGE_OPTIONS.find(r => r.id === range)!.days;
  const since = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - rangeDays); return d; }, [rangeDays]);
  const inRange = useMemo(
    () => history.filter(h => h.date >= since && collections.has(h.type)),
    [history, since, collections]
  );

  // Line chart: completed tasks over the range, bucketed by period
  const lineData = useMemo(() => {
    const buckets = new Map<string, { label: string; ts: number; count: number }>();
    const bucketKey = (d: Date) => {
      if (period === 'hour') return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
      if (period === 'day')  return `${d.getMonth() + 1}/${d.getDate()}`;
      if (period === 'week') { const ws = new Date(d); ws.setDate(d.getDate() - d.getDay()); return `هفته ${ws.getMonth() + 1}/${ws.getDate()}`; }
      return `${d.getFullYear()}/${d.getMonth() + 1}`;
    };
    inRange.filter(h => h.type === 'task').forEach(h => {
      const k = bucketKey(h.date);
      const cur = buckets.get(k) || { label: k, ts: h.date.getTime(), count: 0 };
      cur.count += 1; if (h.date.getTime() < cur.ts) cur.ts = h.date.getTime();
      buckets.set(k, cur);
    });
    return Array.from(buckets.values()).sort((a, b) => a.ts - b.ts).map(b => ({ name: b.label, value: b.count }));
  }, [inRange, period]);

  // Pie: count of completed operations split by type
  const pieData = useMemo(() => {
    const c = { task: 0, plan: 0, order: 0 };
    inRange.forEach(h => { c[h.type] += 1; });
    return [
      { name: 'وظایف',     value: c.task,  color: '#10B981' },
      { name: 'برنامه‌ها', value: c.plan,  color: '#3B82F6' },
      { name: 'سفارشات',   value: c.order, color: '#F59E0B' },
    ];
  }, [inRange]);

  // Weighted average by period: sum(weight)/count
  const weightedData = useMemo(() => {
    const buckets = new Map<string, { label: string; ts: number; sumW: number; cnt: number; tasksW: number; tasksCnt: number; ordersW: number; ordersCnt: number }>();
    const bucketKey = (d: Date) => {
      if (period === 'hour') return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
      if (period === 'day')  return `${d.getMonth() + 1}/${d.getDate()}`;
      if (period === 'week') { const ws = new Date(d); ws.setDate(d.getDate() - d.getDay()); return `هفته ${ws.getMonth() + 1}/${ws.getDate()}`; }
      return `${d.getFullYear()}/${d.getMonth() + 1}`;
    };
    inRange.filter(h => h.type === 'task' || h.type === 'order').forEach(h => {
      const k = bucketKey(h.date);
      const cur = buckets.get(k) || { label: k, ts: h.date.getTime(), sumW: 0, cnt: 0, tasksW: 0, tasksCnt: 0, ordersW: 0, ordersCnt: 0 };
      cur.sumW += h.weight; cur.cnt += 1;
      if (h.type === 'task')  { cur.tasksW  += h.weight; cur.tasksCnt  += 1; }
      if (h.type === 'order') { cur.ordersW += h.weight; cur.ordersCnt += 1; }
      if (h.date.getTime() < cur.ts) cur.ts = h.date.getTime();
      buckets.set(k, cur);
    });
    return Array.from(buckets.values()).sort((a, b) => a.ts - b.ts).map(b => ({
      name: b.label,
      tasks:  b.tasksCnt  ? +(b.tasksW  / b.tasksCnt ).toFixed(2) : 0,
      orders: b.ordersCnt ? +(b.ordersW / b.ordersCnt).toFixed(2) : 0,
      total:  b.cnt       ? +(b.sumW    / b.cnt      ).toFixed(2) : 0,
    }));
  }, [inRange, period]);

  // Operation log
  const log = useMemo(() => [...inRange].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 40), [inRange]);

  const fmtDate = (d: Date) => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:00`;

  const exportExcel = () => {
    const headers = ['نوع', 'عنوان', 'تاریخ', 'وزن', 'توضیح'];
    const rows = log.map(l => [
      l.type === 'task' ? 'وظیفه' : l.type === 'plan' ? 'برنامه' : 'سفارش',
      l.title, fmtDate(l.date), l.weight, l.meta,
    ]);
    downloadCSV(`report-${range}-${period}.csv`, headers, rows);
  };

  const exportPDF = () => {
    const summary = `<div class="summary">
      <div class="card"><div class="label">وظایف انجام‌شده</div><div class="value">${pieData[0].value}</div></div>
      <div class="card"><div class="label">برنامه‌های انجام‌شده</div><div class="value">${pieData[1].value}</div></div>
      <div class="card"><div class="label">سفارشات تکمیل‌شده</div><div class="value">${pieData[2].value}</div></div>
    </div>`;
    const wTable = `<h2>میانگین وزنی</h2><table><thead><tr><th>دوره</th><th>وظایف</th><th>سفارشات</th><th>کل</th></tr></thead><tbody>${
      weightedData.map(w => `<tr><td>${w.name}</td><td>${w.tasks}</td><td>${w.orders}</td><td>${w.total}</td></tr>`).join('')
    }</tbody></table>`;
    const lTable = `<h2>لاگ عملیات</h2><table><thead><tr><th>نوع</th><th>عنوان</th><th>تاریخ</th><th>وزن</th><th>توضیح</th></tr></thead><tbody>${
      log.map(l => `<tr><td>${l.type === 'task' ? 'وظیفه' : l.type === 'plan' ? 'برنامه' : 'سفارش'}</td><td>${l.title}</td><td>${fmtDate(l.date)}</td><td>${l.weight}</td><td>${l.meta}</td></tr>`).join('')
    }</tbody></table>`;
    printPDF('گزارش Neura', `<h1>گزارش تجمیعی · بازه ${RANGE_OPTIONS.find(r => r.id === range)!.label} · دوره ${PERIOD_OPTIONS.find(p => p.id === period)!.label}</h1>${summary}${wTable}${lTable}`);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll px-4 pt-3">
      {/* Report filters — three glass dropdowns */}
      {openDd && <div className="fixed inset-0" style={{ zIndex: 19 }} onClick={() => setOpenDd(null)} />}
      <div className="flex gap-2 mb-3 relative" style={{ zIndex: 20 }}>
        {/* Collections */}
        <div className="flex-1 relative min-w-0">
          <div className="text-[9.5px] text-[var(--aw-text-muted)] mb-1 px-0.5" style={{ fontWeight: 700 }}>کالکشن</div>
          <button onClick={() => setOpenDd(o => o === 'col' ? null : 'col')} className="w-full flex items-center justify-between gap-1 py-2 px-2.5 rounded-xl cursor-pointer border" style={{ background: 'color-mix(in srgb, var(--aw-eu-primary, #7b62fc) 8%, var(--aw-bg-card))', borderColor: 'color-mix(in srgb, var(--aw-eu-primary, #7b62fc) 22%, var(--aw-border))', backdropFilter: 'blur(14px) saturate(1.4)', WebkitBackdropFilter: 'blur(14px) saturate(1.4)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.22)' }}>
            <span className="text-[11px] truncate" style={{ fontWeight: 700, color: 'var(--aw-text-primary)' }}>{collections.size === COLLECTION_OPTIONS.length ? 'همه' : collections.size + ' مورد'}</span>
            <i className={`fa-solid fa-chevron-down text-[9px] transition-transform ${openDd === 'col' ? 'rotate-180' : ''}`} style={{ color: 'var(--aw-text-secondary)' }} />
          </button>
          {openDd === 'col' && (
            <div className="absolute top-full mt-1 left-0 right-0 rounded-xl p-1" style={{ zIndex: 30, background: 'color-mix(in srgb, var(--aw-eu-primary, #7b62fc) 10%, var(--aw-bg-modal))', border: '1px solid color-mix(in srgb, var(--aw-eu-primary, #7b62fc) 24%, var(--aw-border))', backdropFilter: 'blur(22px) saturate(1.5)', WebkitBackdropFilter: 'blur(22px) saturate(1.5)', boxShadow: '0 14px 34px rgba(0,0,0,0.28)' }}>
              {COLLECTION_OPTIONS.map(c => { const active = collections.has(c.id); return (
                <button key={c.id} onClick={() => toggleCollection(c.id)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer border-none text-right" style={{ background: active ? `color-mix(in srgb, ${c.color} 18%, transparent)` : 'transparent' }}>
                  <i className={`${c.icon} text-[10px]`} style={{ color: c.color }} />
                  <span className="flex-1 text-[11px]" style={{ color: 'var(--aw-text-primary)', fontWeight: active ? 700 : 500 }}>{c.label}</span>
                  {active && <i className="fa-solid fa-check text-[9px]" style={{ color: c.color }} />}
                </button>
              ); })}
            </div>
          )}
        </div>
        {/* Range */}
        <div className="flex-1 relative min-w-0">
          <div className="text-[9.5px] text-[var(--aw-text-muted)] mb-1 px-0.5" style={{ fontWeight: 700 }}>بازه</div>
          <button onClick={() => setOpenDd(o => o === 'range' ? null : 'range')} className="w-full flex items-center justify-between gap-1 py-2 px-2.5 rounded-xl cursor-pointer border" style={{ background: 'color-mix(in srgb, var(--aw-eu-primary, #7b62fc) 8%, var(--aw-bg-card))', borderColor: 'color-mix(in srgb, var(--aw-eu-primary, #7b62fc) 22%, var(--aw-border))', backdropFilter: 'blur(14px) saturate(1.4)', WebkitBackdropFilter: 'blur(14px) saturate(1.4)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.22)' }}>
            <span className="text-[11px] truncate" style={{ fontWeight: 700, color: 'var(--aw-text-primary)' }}>{RANGE_OPTIONS.find(r => r.id === range)?.label}</span>
            <i className={`fa-solid fa-chevron-down text-[9px] transition-transform ${openDd === 'range' ? 'rotate-180' : ''}`} style={{ color: 'var(--aw-text-secondary)' }} />
          </button>
          {openDd === 'range' && (
            <div className="absolute top-full mt-1 left-0 right-0 rounded-xl p-1" style={{ zIndex: 30, background: 'color-mix(in srgb, var(--aw-eu-primary, #7b62fc) 10%, var(--aw-bg-modal))', border: '1px solid color-mix(in srgb, var(--aw-eu-primary, #7b62fc) 24%, var(--aw-border))', backdropFilter: 'blur(22px) saturate(1.5)', WebkitBackdropFilter: 'blur(22px) saturate(1.5)', boxShadow: '0 14px 34px rgba(0,0,0,0.28)' }}>
              {RANGE_OPTIONS.map(r => { const active = range === r.id; return (
                <button key={r.id} onClick={() => { selectRange(r.id); setOpenDd(null); }} className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer border-none text-right" style={{ background: active ? `color-mix(in srgb, var(--aw-eu-primary, #7b62fc) 18%, transparent)` : 'transparent' }}>
                  <span className="text-[11px]" style={{ color: 'var(--aw-text-primary)', fontWeight: active ? 700 : 500 }}>{r.label}</span>
                  {active && <i className="fa-solid fa-check text-[9px]" style={{ color: 'var(--aw-eu-primary, #7b62fc)' }} />}
                </button>
              ); })}
            </div>
          )}
        </div>
        {/* Period */}
        <div className="flex-1 relative min-w-0">
          <div className="text-[9.5px] text-[var(--aw-text-muted)] mb-1 px-0.5" style={{ fontWeight: 700 }}>دوره</div>
          <button onClick={() => setOpenDd(o => o === 'period' ? null : 'period')} className="w-full flex items-center justify-between gap-1 py-2 px-2.5 rounded-xl cursor-pointer border" style={{ background: 'color-mix(in srgb, var(--aw-eu-primary, #7b62fc) 8%, var(--aw-bg-card))', borderColor: 'color-mix(in srgb, var(--aw-eu-primary, #7b62fc) 22%, var(--aw-border))', backdropFilter: 'blur(14px) saturate(1.4)', WebkitBackdropFilter: 'blur(14px) saturate(1.4)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.22)' }}>
            <span className="text-[11px] truncate" style={{ fontWeight: 700, color: 'var(--aw-text-primary)' }}>{PERIOD_OPTIONS.find(p => p.id === period)?.label}</span>
            <i className={`fa-solid fa-chevron-down text-[9px] transition-transform ${openDd === 'period' ? 'rotate-180' : ''}`} style={{ color: 'var(--aw-text-secondary)' }} />
          </button>
          {openDd === 'period' && (
            <div className="absolute top-full mt-1 left-0 right-0 rounded-xl p-1" style={{ zIndex: 30, background: 'color-mix(in srgb, var(--aw-eu-primary, #7b62fc) 10%, var(--aw-bg-modal))', border: '1px solid color-mix(in srgb, var(--aw-eu-primary, #7b62fc) 24%, var(--aw-border))', backdropFilter: 'blur(22px) saturate(1.5)', WebkitBackdropFilter: 'blur(22px) saturate(1.5)', boxShadow: '0 14px 34px rgba(0,0,0,0.28)' }}>
              {periodOptions.map(p => { const active = period === p.id; return (
                <button key={p.id} onClick={() => { setPeriod(p.id); setOpenDd(null); }} className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer border-none text-right" style={{ background: active ? `color-mix(in srgb, var(--aw-eu-primary, #7b62fc) 18%, transparent)` : 'transparent' }}>
                  <span className="text-[11px]" style={{ color: 'var(--aw-text-primary)', fontWeight: active ? 700 : 500 }}>{p.label}</span>
                  {active && <i className="fa-solid fa-check text-[9px]" style={{ color: 'var(--aw-eu-primary, #7b62fc)' }} />}
                </button>
              ); })}
            </div>
          )}
        </div>
      </div>

      {/* Export buttons */}
      <div className="flex gap-2 mb-4">
        <button className="flex-1 py-2 rounded-[10px] border-none text-white text-[11.5px] cursor-pointer flex items-center justify-center gap-1.5"
          style={{ background: '#10B981', fontWeight: 700 }} onClick={exportExcel}>
          <i className="fa-solid fa-file-excel text-[11px]" /> خروجی اکسل
        </button>
        <button className="flex-1 py-2 rounded-[10px] border-none text-white text-[11.5px] cursor-pointer flex items-center justify-center gap-1.5"
          style={{ background: '#EF4444', fontWeight: 700 }} onClick={exportPDF}>
          <i className="fa-solid fa-file-pdf text-[11px]" /> خروجی PDF
        </button>
      </div>

      {/* Summary cards */}
      <SectionTitle icon="fa-solid fa-chart-pie" title="گزارش تجمیعی" />
      <div className="grid grid-cols-3 gap-2 mb-4">
        {pieData.map((s, i) => (
          <motion.div key={s.name} className="p-3 flex flex-col gap-1.5" style={euCardStyle}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${s.color}18` }}>
              <i className="fa-solid fa-circle-check text-[10px]" style={{ color: s.color }} />
            </div>
            <span className="text-[16px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{toFa(s.value)}</span>
            <span className="text-[10px] text-[var(--aw-text-muted)]">{s.name}</span>
          </motion.div>
        ))}
      </div>

      {/* Line chart: done tasks */}
      <SectionTitle icon="fa-solid fa-chart-line" title="وظایف انجام‌شده در بازه" />
      <div className="p-2 mb-4" style={euCardStyle}>
        {lineData.length === 0 ? (
          <div className="py-8 text-center text-[11px] text-[var(--aw-text-muted)]">داده‌ای برای این بازه/دوره ثبت نشده است.</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(126,95,170,0.10)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)', borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3, fill: '#10B981' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie chart: operations split */}
      <SectionTitle icon="fa-solid fa-chart-pie" title="تفکیک عملیات‌ها" />
      <div className="p-2 mb-4" style={euCardStyle}>
        {pieData.every(p => p.value === 0) ? (
          <div className="py-8 text-center text-[11px] text-[var(--aw-text-muted)]">داده‌ای برای این بازه ثبت نشده است.</div>
        ) : (
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={36} paddingAngle={2}>
                {pieData.map(p => <Cell key={p.name} fill={p.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)', borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--aw-text-secondary)' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Weighted average chart */}
      <SectionTitle icon="fa-solid fa-scale-balanced" title="میانگین وزنی وظایف و سفارشات" />
      <div className="p-2 mb-4" style={euCardStyle}>
        {weightedData.length === 0 ? (
          <div className="py-8 text-center text-[11px] text-[var(--aw-text-muted)]">داده‌ای برای این بازه/دوره ثبت نشده است.</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weightedData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(126,95,170,0.10)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)', borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--aw-text-secondary)' }} />
              <Bar dataKey="tasks"  name="وظایف"   fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="orders" name="سفارشات" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Operation log */}
      <SectionTitle icon="fa-solid fa-list-ul" title={`لاگ عملیات (${toFa(log.length)})`} />
      <div className="p-2" style={euCardStyle}>
        {log.length === 0 ? (
          <div className="py-6 text-center text-[11px] text-[var(--aw-text-muted)]">لاگی برای این بازه ثبت نشده است.</div>
        ) : log.map((l, i) => {
          const meta = l.type === 'task'
            ? { icon: 'fa-solid fa-list-check', color: '#10B981', label: 'وظیفه' }
            : l.type === 'plan'
              ? { icon: 'fa-solid fa-calendar-days', color: '#3B82F6', label: 'برنامه' }
              : { icon: 'fa-solid fa-bag-shopping', color: '#F59E0B', label: 'سفارش' };
          return (
            <div key={`${l.type}-${i}`} className="flex items-center gap-2.5 py-2 border-b border-[rgba(126,95,170,0.08)] last:border-0">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${meta.color}18` }}>
                <i className={`${meta.icon} text-[10px]`} style={{ color: meta.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11.5px] text-[var(--aw-text-primary)] truncate" style={{ fontWeight: 600 }}>{l.title}</div>
                <div className="text-[9.5px] text-[var(--aw-text-muted)]">{meta.label} · {l.meta}</div>
              </div>
              <div className="text-[9.5px] text-[var(--aw-text-muted)] flex-shrink-0 text-left">
                {fmtDate(l.date)}
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md flex-shrink-0" style={{ background: `${meta.color}18`, color: meta.color, fontWeight: 700 }}>w {l.weight}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// agentaction: تشخیصِ خواستِ کاربر برای «انجامِ کار» و اجرای واقعیِ آن روی دادهٔ per-user
// (نه ادعای دروغِ AI). خروجی: { collection, doc, confirm } یا null.
function AssistantNewChat({ resetSignal = 0, loadMessages = null, loadSignal = 0 }: { resetSignal?: number; loadMessages?: { from: 'user' | 'agent'; text: string }[] | null; loadSignal?: number }) {
  const { showToast, speakMessage, speakingMsgId, agents } = useApp();
  // پرسونای واقعیِ دستیار (نام/خوش‌آمدِ ذخیره‌شدهٔ کاربر) — پیش‌تر asst/asstName تعریف‌نشده بودند و کرش می‌دادند.
  const asst: any = (agents || []).find((a: any) => a.id === 'assistant') || null;
  const asstName: string = (asst && (asst.name || asst.title)) || 'دستیار';
  const [messages, setMessages] = useState<{ from: 'user' | 'agent'; text: string }[]>([]);
  // chatpersist: گفتگوی دستیار را per-user ذخیره/بارگذاری کن تا با هارد‌رفرش/ناوبری نپرد
  const __chatLoaded = useRef(false);
  useEffect(() => { if (!getToken()) return; (async () => { try { const v: any = await (api as any).myList('asst_msgs'); if (Array.isArray(v) && v.length) setMessages(v as any); } catch (_) {} __chatLoaded.current = true; })(); }, []);
  useEffect(() => { if (!__chatLoaded.current || !getToken()) return; const h = setTimeout(() => { (api as any).myBulkSave('asst_msgs', messages).catch(() => {}); }, 500); return () => clearTimeout(h); }, [messages]);
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  // ── مکالمهٔ صوتیِ زنده (STT → chat → TTS در حلقه) ──
  const [voiceOn, setVoiceOn] = useState(false);
  const [voiceState, setVoiceState] = useState('idle');
  const vOnRef = useRef(false);
  const vStreamRef = useRef<any>(null);
  const vRecRef = useRef<any>(null);
  const vAudioRef = useRef<any>(null);
  const _b64 = (blob: Blob): Promise<string> => new Promise((res) => { const fr = new FileReader(); fr.onloadend = () => res(String(fr.result).split(',')[1] || ''); fr.readAsDataURL(blob); });
  const _recordTurn = (): Promise<Blob | null> => new Promise((resolve) => {
    const stream = vStreamRef.current; if (!stream) return resolve(null);
    let mr: any; try { mr = new MediaRecorder(stream); } catch { return resolve(null); }
    vRecRef.current = mr;
    const chunks: any[] = []; mr.ondataavailable = (e: any) => { if (e.data && e.data.size) chunks.push(e.data); };
    mr.onstop = () => resolve(chunks.length ? new Blob(chunks, { type: mr.mimeType || 'audio/webm' }) : null);
    let ctx: any = null, analyser: any = null, data: any = null, silenceStart = 0, spoke = false; const started = Date.now();
    try { const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext; ctx = new AC(); const src = ctx.createMediaStreamSource(stream); analyser = ctx.createAnalyser(); analyser.fftSize = 512; src.connect(analyser); data = new Uint8Array(analyser.frequencyBinCount); } catch {}
    const stop = () => { try { mr.state !== 'inactive' && mr.stop(); } catch {} try { ctx && ctx.close(); } catch {} };
    const tick = () => {
      if (!vOnRef.current) return stop();
      let level = 0;
      if (analyser) { analyser.getByteFrequencyData(data); let sum = 0; for (let i = 0; i < data.length; i++) sum += data[i]; level = sum / data.length / 255; }
      const now = Date.now();
      if (level > 0.05) { spoke = true; silenceStart = 0; }
      else if (spoke) { if (!silenceStart) silenceStart = now; else if (now - silenceStart > 1100) return stop(); }
      if (now - started > 15000) return stop();
      requestAnimationFrame(tick);
    };
    try { mr.start(); } catch { return resolve(null); }
    tick();
  });
  const _speak = (text: string): Promise<void> => new Promise((resolve) => {
    try {
      const W = ['صفر', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
      const clean = String(text || '').replace(/[*_#`~>|]/g, '').replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/\d{5,}/g, (m: string) => m.split('').map((x: string) => W[+x]).join('، ')).replace(/\s+/g, ' ').trim();
      if (!clean) return resolve();
      (api as any).tts('assistant', clean).then((r: any) => {
        if (!r || !r.audioBase64 || !vOnRef.current) return resolve();
        let A: any = vAudioRef.current || new Audio(); vAudioRef.current = A; try { A.pause(); } catch {}
        A.src = 'data:' + (r.mime || 'audio/wav') + ';base64,' + r.audioBase64;
        try { window.dispatchEvent(new CustomEvent('neura-voice-speaking', { detail: { on: true } })); } catch {}
        const done = () => { try { window.dispatchEvent(new CustomEvent('neura-voice-speaking', { detail: { on: false } })); } catch {} resolve(); };
        A.onended = done; A.onerror = done; A.play().catch(done);
      }).catch(() => resolve());
    } catch { resolve(); }
  });
  const _voiceLoop = async () => {
    while (vOnRef.current) {
      setVoiceState('listening');
      const blob = await _recordTurn();
      if (!vOnRef.current) break;
      if (!blob || blob.size < 1400) continue;
      setVoiceState('thinking');
      let userText = '';
      try { const b = await _b64(blob); const r: any = await (api as any).stt('assistant', b, blob.type); userText = (r && r.text) ? String(r.text).trim() : ''; } catch {}
      if (!userText) continue;
      setMessages(prev => [...prev, { from: 'user' as const, text: userText }]);
      let reply = '';
      try {
        const r: any = await (api as any).chat('assistant', [{ role: 'user', content: userText }]);
        reply = (r && r.ok && r.text) ? String(r.text) : generateReply(userText);
        if (r && Array.isArray(r.dataChanged)) r.dataChanged.forEach((c: string) => { try { window.dispatchEvent(new CustomEvent('neura-data-changed', { detail: { collection: c } })); } catch (_) {} });
      } catch { reply = generateReply(userText); }
      if (!vOnRef.current) break;
      setMessages(prev => [...prev, { from: 'agent' as const, text: reply }]);
      setVoiceState('speaking');
      await _speak(reply);
    }
    setVoiceState('idle');
  };
  const startVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      vStreamRef.current = stream; vOnRef.current = true; setVoiceOn(true);
      try { window.dispatchEvent(new CustomEvent('neura-voice-toggle', { detail: { on: true, stream } })); } catch {}
      _voiceLoop();
    } catch { showToast('دسترسی میکروفون داده نشد؛ از قفلِ کنارِ نوارِ آدرس اجازه بده'); }
  };
  const stopVoice = () => {
    vOnRef.current = false; setVoiceOn(false); setVoiceState('idle');
    try { vRecRef.current && vRecRef.current.state !== 'inactive' && vRecRef.current.stop(); } catch {}
    try { vAudioRef.current && vAudioRef.current.pause(); } catch {}
    try { window.dispatchEvent(new CustomEvent('neura-voice-speaking', { detail: { on: false } })); } catch {}
    try { window.dispatchEvent(new CustomEvent('neura-voice-toggle', { detail: { on: false } })); } catch {}
    try { vStreamRef.current && vStreamRef.current.getTracks().forEach((t: any) => t.stop()); } catch {}
    vStreamRef.current = null;
  };
  const toggleVoice = () => { if (vOnRef.current) stopVoice(); else void startVoice(); };
  useEffect(() => () => { stopVoice(); }, []);
  // پلِ نام‌ها: render از voiceMode/toggleMic/recording/scrollRef استفاده می‌کند که تعریف‌نشده بودند.
  const voiceMode = voiceOn;
  const toggleMic = toggleVoice;
  const recording = voiceState === 'listening';
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [messages, voiceState]);

  // + (new chat) → reset conversation in-place, no new page
  useEffect(() => {
    if (resetSignal === 0) return;
    setMessages([]);
    setInputText('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [resetSignal]);

  // Selecting a topic from the history drawer loads that topic's sample conversation
  useEffect(() => {
    if (loadSignal === 0) return;
    setMessages(loadMessages || []);
    setInputText('');
  }, [loadSignal]);

  // Lightweight offline intent matcher — picks a relevant reply based on
  // keywords in the question (works without any network/AI backend).
  // fallbackِ صادقانه وقتی سرورِ هوش مصنوعی در دسترس نیست — هیچ عددِ فیک/ادعای انجامِ کار نمی‌سازد.
  const generateReply = (_raw: string): string => 'الان نتونستم به سرورِ هوش مصنوعی وصل شم؛ لطفاً چند لحظه‌ی دیگر دوباره تلاش کنید.';

  const sendMessage = (preset?: string) => {
    const userMsg = (typeof preset === 'string' && preset.trim()) ? preset.trim() : inputText.trim();
    if (!userMsg) return;
    setInputText('');
    const nextMsgs = [...messages, { from: 'user' as const, text: userMsg }];
    setMessages(nextMsgs);
    // agentaction: اجرای واقعیِ کار به‌عهدهٔ ابزارهای سمتِ سرور (create_event/create_task/create_note) است؛
    // بعد از پاسخ، اگر سرور چیزی ثبت کرد (dataChanged) صفحاتِ روزمرگی/جستجو را تازه می‌کنیم تا کاربر ببیندش.
    (async () => {
      try {
        const hist = nextMsgs.map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));
        const r: any = await (api as any).chat('assistant', hist);
        const reply = (r && r.ok && r.text) ? String(r.text) : generateReply(userMsg);
        setMessages(prev => [...prev, { from: 'agent', text: reply }]);
        if (r && Array.isArray(r.dataChanged)) {
          r.dataChanged.forEach((c: string) => { try { window.dispatchEvent(new CustomEvent('neura-data-changed', { detail: { collection: c } })); } catch (_) {} });
        }
      } catch (_) {
        setMessages(prev => [...prev, { from: 'agent', text: generateReply(userMsg) }]);
      }
    })();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-3 aw-scroll space-y-2">
        {messages.length === 0 && (
          <motion.div className="flex flex-col items-center justify-center h-full text-center py-12"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h3 className="text-[15px] text-[var(--aw-text-primary)] mb-1" style={{ fontWeight: 700 }}>گفتگوی جدید</h3>
            <p className="text-[12px] text-[var(--aw-text-muted)] max-w-[220px]">سوالی بپرسید یا دستوری بدهید، دستیار هوشمند آماده کمک است.</p>
            <div className="flex flex-wrap justify-center gap-1.5 mt-4">
              {['برنامه امروزم چیه؟', 'یه تسک جدید بساز', 'یادآوری تنظیم کن'].map((suggestion, i) => (
                <button key={i} className="px-3 py-1.5 rounded-full border border-[var(--aw-border)] bg-transparent text-[11px] text-[var(--aw-text-secondary)] cursor-pointer hover:border-[#6366f1] hover:text-[#6366f1] transition-all"
                  onClick={() => { setInputText(suggestion); inputRef.current?.focus(); }}>
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}
        {messages.map((m, i) => (
          <motion.div key={i} className={`flex ${m.from === 'user' ? 'justify-start' : 'justify-end'}`}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-[12px] ${
              m.from === 'user'
                ? 'bg-[var(--aw-eu-primary)] text-white rounded-br-md'
                : 'rounded-bl-md'
            }`} style={m.from === 'agent' ? { background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' } : {}}>
              {m.from === 'agent' && (
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[8px]" style={{ background: '#6366f1' }}>
                    <i className="fa-solid fa-robot" />
                  </div>
                  <span className="text-[10px] text-[var(--aw-text-muted)]" style={{ fontWeight: 600 }}>دستیار شخصی</span>
                  <button onClick={() => speakMessage('asst-' + i, m.text)} title="خواندن متن"
                    className="mr-auto w-6 h-6 rounded-md border-none cursor-pointer flex items-center justify-center transition-all"
                    style={speakingMsgId === 'asst-' + i
                      ? { background: '#6366f1', color: '#fff' }
                      : { background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
                    <i className={`fa-solid ${speakingMsgId === 'asst-' + i ? 'fa-volume-high' : 'fa-volume-low'} text-[10px]`} />
                  </button>
                </div>
              )}
              <span style={{ lineHeight: '1.7', whiteSpace: 'pre-line' }}>{m.text}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input bar — matches the shared chat popup (Figma) */}
      <div
        className="flex-shrink-0 flex items-center gap-2 px-3"
        style={{
          background: 'var(--aw-chat-surface, rgba(255,255,255,0.2))',
          borderTop: '0.5px solid var(--aw-chat-bd, white)',
          boxShadow: '-2px -2px 4px 0px rgba(123,98,252,0.2)',
          paddingTop: 10,
          paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Send button — circular, lavender */}
        <button
          className="flex-shrink-0 flex items-center justify-center rounded-full border-none cursor-pointer"
          style={{
            width: 40, height: 40,
            background: inputText.trim() ? 'var(--aw-eu-primary)' : 'var(--aw-eu-nav-border)',
            boxShadow: 'inset 2px 2px 1px 0px rgba(255,255,255,0.45), 2px 4px 4px 0px rgba(0,0,0,0.25)',
            border: '1px solid var(--aw-chat-bd, white)',
          }}
          onClick={sendMessage}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <path d={svgChatIcons.p11544700} fill="white" />
          </svg>
        </button>

        {/* Pill input */}
        <div
          className="flex-1 flex items-center gap-2 relative"
          style={{
            height: 40,
            borderRadius: 9999,
            background: 'var(--aw-bg-input)',
            border: '1px solid var(--aw-border)',
            paddingRight: 12,
            paddingLeft: 12,
          }}
        >
          {/* Mic icon (RTL start = right side) */}
          <div className="flex-shrink-0 w-[22px] h-[22px] relative" onClick={toggleVoice} title={voiceOn ? (voiceState === 'listening' ? 'در حال شنیدن… برای پایان بزن' : voiceState === 'thinking' ? 'در حال فکر…' : voiceState === 'speaking' ? 'در حال صحبت…' : 'قطع مکالمه') : 'مکالمهٔ صوتی'} style={{ cursor: 'pointer', filter: voiceOn ? 'drop-shadow(0 0 5px #6366f1)' : undefined }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <path d={svgChatIcons.p7f348f0} fill={voiceOn ? '#6366f1' : '#565656'} />
              <path d={svgChatIcons.p1899c780} fill={voiceOn ? '#6366f1' : '#565656'} />
            </svg>
          </div>

          {/* Text input */}
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-right"
            style={{ fontSize: 14, color: 'var(--aw-text-primary)', fontFamily: "'Kamand', sans-serif", minWidth: 0 }}
            placeholder="پیام خود را بنویسید..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
          />

          {/* ضمیمه حذف شد: بک‌اندِ آپلود وجود ندارد (به‌جای toastِ فیک). */}
        </div>
      </div>
    </div>
  );
}

export function EuContacts() {
  const { showToast } = useApp();
  const [list, setList] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [nm, setNm] = useState('');
  const [ph, setPh] = useState('');
  const [busy, setBusy] = useState(false);
  const reload = () => { api.contacts().then((r: any) => setList(r?.contacts || [])).catch(() => {}); };
  useEffect(() => { reload(); }, []);
  const importPhone = async () => {
    const nav: any = navigator;
    if (!nav.contacts || !nav.contacts.select) {
      // iOS/سافاری/دسکتاپ API مخاطبین را ندارند → به‌جای بن‌بست، مستقیم فایلِ مخاطبین (vCard) را باز کن.
      showToast('این دستگاه اجازهٔ خواندنِ مستقیمِ مخاطبین را نمی‌دهد؛ فایلِ مخاطبینت (vCard) را انتخاب کن یا پایین دستی اضافه کن.');
      importVcf();
      return;
    }
    try {
      setBusy(true);
      const sel = await nav.contacts.select(['name', 'tel'], { multiple: true });
      const arr = (sel || []).map((c: any) => ({ name: (c.name && c.name[0]) || '', phone: (c.tel && c.tel[0]) || '' })).filter((c: any) => c.phone);
      if (arr.length) { const r: any = await api.saveContacts(arr); showToast((r?.added || 0) + ' مخاطب اضافه شد'); reload(); }
    } catch (_) { showToast('وارد کردن لغو شد'); }
    setBusy(false);
  };
  const importVcf = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.vcf,.csv,text/vcard,text/x-vcard,text/csv';
    inp.onchange = async () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      setBusy(true);
      try {
        const txt = await f.text();
        // پارسرِ مقاومِ vCard: تاکردنِ خط، CRLF/CR، گروه‌بندی (item1.TEL)، چند TEL، FN یا N.
        const parseVCard = (raw: string) => {
          const out: any[] = [];
          const unfolded = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n[ \t]/g, '');
          const cards = unfolded.split(/BEGIN:VCARD/i).slice(1);
          for (const card of cards) {
            const body = card.split(/END:VCARD/i)[0];
            let fn = '', nName = ''; const phones: string[] = [];
            for (const line of body.split('\n')) {
              const ci = line.indexOf(':'); if (ci < 0) continue;
              let prop = line.slice(0, ci); const val = line.slice(ci + 1).trim(); if (!val) continue;
              prop = prop.split(';')[0]; const dot = prop.lastIndexOf('.'); if (dot >= 0) prop = prop.slice(dot + 1);
              prop = prop.toUpperCase();
              if (prop === 'FN') fn = val;
              else if (prop === 'N' && !nName) nName = val.replace(/;/g, ' ').replace(/\s+/g, ' ').trim();
              else if (prop === 'TEL') phones.push(val);
            }
            const name = fn || nName;
            for (const p of phones) out.push({ name: name || p, phone: p });
          }
          return out;
        };
        // پارسرِ CSV (خروجیِ گوگل/اوت‌لوک): ستونِ نام و هر ستونِ شماره را پیدا می‌کند.
        const parseCsv = (raw: string) => {
          const out: any[] = [];
          const rows = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim());
          if (!rows.length) return out;
          const cells = (l: string) => {
            const res: string[] = []; let cur = '', q = false;
            for (let i = 0; i < l.length; i++) { const c = l[i];
              if (q) { if (c === '"') { if (l[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
              else { if (c === '"') q = true; else if (c === ',') { res.push(cur); cur = ''; } else cur += c; } }
            res.push(cur); return res;
          };
          const h = cells(rows[0]).map((x) => x.toLowerCase());
          const findIdx = (...ns: string[]) => h.findIndex((x) => ns.some((n) => x.includes(n)));
          const nameIdx = findIdx('display name', 'full name', 'name', 'نام');
          const firstIdx = findIdx('first name'); const lastIdx = findIdx('last name');
          const phoneIdxs = h.map((x, i) => ({ x, i })).filter((o) => (o.x.includes('phone') || o.x.includes('tel') || o.x.includes('mobile') || o.x.includes('شماره') || o.x.includes('تلفن')) && !o.x.includes('type') && !o.x.includes('label')).map((o) => o.i);
          const hasHeader = nameIdx >= 0 || firstIdx >= 0 || phoneIdxs.length > 0;
          for (let r = hasHeader ? 1 : 0; r < rows.length; r++) {
            const c = cells(rows[r]);
            let nm = nameIdx >= 0 ? (c[nameIdx] || '') : ((c[firstIdx] || '') + ' ' + (c[lastIdx] || '')).trim();
            const phs = (phoneIdxs.length ? phoneIdxs.map((i) => c[i]) : c).filter((x) => x && /[0-9]{4,}/.test(String(x)));
            for (const p of phs) { const pp = String(p).split(/[:;]/).pop()!.trim(); if (pp) out.push({ name: (nm || '').trim() || pp, phone: pp }); }
          }
          return out;
        };
        let arr = /BEGIN:VCARD/i.test(txt) ? parseVCard(txt) : parseCsv(txt);
        // حذفِ تکراری بر اساسِ شماره
        const seen: any = {}; arr = arr.filter((c) => { const k = String(c.phone || '').replace(/[^0-9+]/g, ''); if (!k || seen[k]) return false; seen[k] = 1; return true; });
        if (!arr.length) { showToast('مخاطبی در فایل پیدا نشد — فایلِ vCard یا CSV را انتخاب کن'); setBusy(false); return; }
        // ذخیرهٔ تکه‌تکه (هر ۵۰۰ تا) تا حجمِ زیاد هم بی‌مشکل برود
        let added = 0;
        for (let i = 0; i < arr.length; i += 500) {
          const r: any = await api.saveContacts(arr.slice(i, i + 500)).catch(() => null);
          if (r) added += (r.added || 0);
        }
        showToast(added.toLocaleString('fa-IR') + ' مخاطب از فایل اضافه شد (از ' + arr.length.toLocaleString('fa-IR') + ')');
        reload();
      } catch (_) { showToast('خطا در خواندنِ فایل'); }
      setBusy(false);
    };
    inp.click();
  };
  const importGoogle = () => {
    showToast('در گوگل دکمهٔ Export را بزن و «Google CSV» یا «vCard» را دانلود کن؛ بعد همین‌جا «از فایل» را بزن و همان فایل را انتخاب کن.');
    try { window.open('https://contacts.google.com/', '_blank'); } catch (_) {}
  };
  const addManual = async () => {
    if (!ph.trim()) { showToast('شماره را وارد کن'); return; }
    await api.saveContacts([{ name: nm.trim() || ph.trim(), phone: ph.trim() }]).catch(() => {});
    setNm(''); setPh(''); reload(); showToast('اضافه شد');
  };
  const del = async (phone: string) => { await api.deleteContact(phone).catch(() => {}); reload(); };
  const filtered = list.filter((c) => !q || String(c.name || '').includes(q) || String(c.phone || '').includes(q));
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <button onClick={importPhone} disabled={busy} className="py-3 rounded-xl border-none text-white cursor-pointer flex items-center justify-center gap-2 text-[12px]" style={{ background: 'linear-gradient(135deg, #7B62FC, #1E6BFF)', fontWeight: 700, opacity: busy ? 0.7 : 1 }}>
          <i className="fa-solid fa-mobile-screen-button text-[12px]" /> از گوشی
        </button>
        <button onClick={importVcf} disabled={busy} className="py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-[12px] border" style={{ background: 'var(--aw-bg-card)', borderColor: 'var(--aw-primary)', color: 'var(--aw-primary)', fontWeight: 700, opacity: busy ? 0.7 : 1 }}>
          <i className="fa-solid fa-file-import text-[12px]" /> از فایل (vCard/CSV)
        </button>
      </div>
      <button onClick={importGoogle} disabled={busy} className="py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-[12px] border" style={{ background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)', color: 'var(--aw-text-primary)', fontWeight: 700, opacity: busy ? 0.7 : 1 }}>
        <i className="fa-brands fa-google text-[12px]" style={{ color: '#EA4335' }} /> از اکانت گوگل
      </button>
      <div className="text-[10px] text-[var(--aw-text-muted)] px-1">روی هر دستگاهی می‌توانی دستی اضافه کنی (کادرِ پایین). برای واردکردنِ گروهی: «از اکانت گوگل» (خروجی بگیر و فایلش را وارد کن)، روی اندروید/Chrome «از گوشی»، و روی iOS مخاطب را در برنامهٔ «مخاطبین» به فایل ذخیره کن و «از فایل» را بزن.</div>
      <div className="flex gap-2">
        <input value={nm} onChange={(e) => setNm(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addManual(); }} placeholder="نام" className="flex-1 min-w-0 py-2.5 px-3 rounded-[10px] border border-[var(--aw-border)] text-[13px] text-[var(--aw-text-primary)] outline-none" style={{ background: 'var(--aw-bg-input)' }} />
        <input value={ph} onChange={(e) => setPh(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addManual(); }} placeholder="شماره" inputMode="tel" className="flex-1 min-w-0 py-2.5 px-3 rounded-[10px] border border-[var(--aw-border)] text-[13px] text-[var(--aw-text-primary)] outline-none" style={{ background: 'var(--aw-bg-input)' }} dir="ltr" />
        <button onClick={addManual} className="px-4 rounded-[10px] border-none text-white cursor-pointer text-[13px]" style={{ background: 'var(--aw-primary)', fontWeight: 700 }}><i className="fa-solid fa-plus" /></button>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجوی مخاطب…" className="w-full py-2.5 px-3 rounded-[10px] border border-[var(--aw-border)] text-[13px] text-[var(--aw-text-primary)] outline-none" style={{ background: 'var(--aw-bg-input)' }} />
      <div className="text-[11px] text-[var(--aw-text-muted)] px-1">{list.length.toLocaleString('fa-IR')} مخاطب — برای تماس کافیست به دستیار بگویی «به [نام] زنگ بزن».</div>
      <div className="flex flex-col gap-1.5 max-h-[45vh] overflow-y-auto">
        {filtered.map((c, i) => (
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7B62FC, #1E6BFF)', fontWeight: 700 }}>{String(c.name || '?').charAt(0)}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[var(--aw-text-primary)] truncate" style={{ fontWeight: 600 }}>{c.name}</div>
              <div className="text-[11px] text-[var(--aw-text-muted)]" dir="ltr" style={{ textAlign: 'right' }}>{c.phone}</div>
            </div>
            <button onClick={() => del(c.phone)} className="w-7 h-7 rounded-lg border-none bg-transparent cursor-pointer text-[var(--aw-text-muted)] hover:text-[#EF4444]"><i className="fa-solid fa-trash text-[11px]" /></button>
          </div>
        ))}
        {!filtered.length && <div className="text-center text-[12px] text-[var(--aw-text-muted)] py-6">هنوز مخاطبی نداری. از گوشی یا فایل وارد کن یا دستی اضافه کن.</div>}
      </div>
    </div>
  );
}

export function EuAssistantScreen() {
  const { setEuScreen, openChat, showToast, startCall, goBack, speakMessage, speakingMsgId, agents, setAgents, assistantId, setAssistantId } = useApp();
  // reloadSessions پیش‌تر تعریف‌نشده بود و کلیکِ «گفتگوی جدید» را کرش می‌کرد. no-opِ امن
  // (سشنِ جدید سمتِ سرور با api.newSession ساخته می‌شود؛ سیگنالِ ریست چت را خالی می‌کند).
  const reloadSessions = () => {};
  const [tab, setTab] = useState('chat');
  // Personal-assistant agents + the active one (drives header name/theme + welcome).
  const assistantAgents = agents.filter((a: any) => a.team === 'assistant' || a.id === 'assistant');
  const activeAsst = assistantAgents.find((a: any) => a.id === assistantId) || assistantAgents[0];
  // نامِ واقعیِ ایجنت از سرور (agent_prefs overlay)، نه localStorageِ نانوشته.
  const activeAsstName = activeAsst?.name || 'دستیار شخصی';
  const [asstOpen, setAsstOpen] = useState(false);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [events, setEvents] = useState(INITIAL_CAL_EVENTS);
  const _asstDataLoaded = useRef(false);
  useEffect(() => {
    if (!getToken()) return;
    (async () => {
      try { const t: any = await (api as any).myList('tasks'); if (Array.isArray(t)) setTasks(t as any); } catch (_) {}
      try { const e: any = await (api as any).myList('calendar'); if (Array.isArray(e)) setEvents(e as any); } catch (_) {}
      _asstDataLoaded.current = true;
    })();
  }, []);
  useEffect(() => { if (!_asstDataLoaded.current || !getToken()) return; const _h = setTimeout(() => { (api as any).myBulkSave('tasks', tasks).catch(() => {}); }, 700); return () => clearTimeout(_h); }, [tasks]);
  useEffect(() => { if (!_asstDataLoaded.current || !getToken()) return; const _h = setTimeout(() => { (api as any).myBulkSave('calendar', events).catch(() => {}); }, 700); return () => clearTimeout(_h); }, [events]);
  // datachanged: \u062F\u0633\u062A\u06CC\u0627\u0631 \u0627\u0632 \u062F\u0627\u062E\u0644\u0650 \u0686\u062A \u062A\u0633\u06A9 \u0645\u06CC\u200C\u0633\u0627\u0632\u062F \u2192 \u062F\u0627\u062F\u0647\u0654 \u062A\u0627\u0632\u0647 \u0631\u0627 \u0628\u06AF\u06CC\u0631 \u062A\u0627 \u0647\u0645 \u0646\u0645\u0627\u06CC\u0634 \u0632\u0646\u062F\u0647 \u0628\u0627\u0634\u062F \u0648 \u0647\u0645 \u0630\u062E\u06CC\u0631\u0647\u0654 \u06AF\u0631\u0648\u0647\u06CC\u0650 state\u0650 \u0642\u062F\u06CC\u0645\u06CC\u060C \u062A\u0633\u06A9\u0650 \u0646\u0648 \u0631\u0627 \u067E\u0627\u06A9 \u0646\u06A9\u0646\u062F.
  useEffect(() => {
    const onChanged = (e: any) => {
      const coll = e?.detail?.collection;
      if (!getToken()) return;
      if (coll === 'tasks' || coll === 'reminders') { (api as any).myList('tasks').then((t: any) => { if (Array.isArray(t)) setTasks(t as any); }).catch(() => {}); }
      if (coll === 'calendar' || coll === 'events') { (api as any).myList('calendar').then((v: any) => { if (Array.isArray(v)) setEvents(v as any); }).catch(() => {}); }
    };
    window.addEventListener('neura-data-changed', onChanged as any);
    return () => window.removeEventListener('neura-data-changed', onChanged as any);
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const _en = (x: any) => String(x == null ? '' : x).replace(/[\u06F0-\u06F9]/g, (d: string) => String(d.charCodeAt(0) - 0x06F0)).replace(/[\u0660-\u0669]/g, (d: string) => String(d.charCodeAt(0) - 0x0660));
    const _atOf = (ev: any): number => {
      if (typeof ev.at === 'number' && ev.at > 0) return ev.at;
      const m = _en(ev.time).match(/(\d{1,2}):(\d{2})/); if (!m) return 0;
      let day = -1; if (/\u0627\u0645\u0631\u0648\u0632|today/i.test(ev.date || '')) day = 0; else if (/\u0641\u0631\u062F\u0627/.test(ev.date || '')) day = 1; if (day < 0) return 0;
      const fire = new Date(); fire.setDate(fire.getDate() + day); fire.setHours(Number(m[1]), Number(m[2]), 0, 0); return fire.getTime();
    };
    const _pending = (events || []).filter((ev: any) => ev && !ev.done && ev.status !== 'done' && ev.status !== 'cancelled' && !ev.muted && _atOf(ev) > 0);
    const _future = _pending.some((ev: any) => _atOf(ev) > Date.now() - 3600000);
    try { if (_future && (Notification as any).permission === 'default') (Notification as any).requestPermission().catch(() => {}); } catch (_) {}
    const _check = () => {
      const now = Date.now();
      _pending.forEach((ev: any) => {
        const at = _atOf(ev); if (!at) return;
        const key = 'nrfire_' + ev.id + '_' + at;
        let done = false; try { done = !!localStorage.getItem(key); } catch (_) {}
        const diff = now - at;
        if (!done && diff >= 0 && diff < 3600000) {
          try { localStorage.setItem(key, '1'); } catch (_) {}
          try { if ((Notification as any).permission === 'granted') new Notification('\u06CC\u0627\u062F\u0622\u0648\u0631\u0650 \u0646\u0648\u0631\u0627', { body: String(ev.title || ''), icon: '/pwa-192.png' }); } catch (_) {}
          try { showToast('\uD83D\uDD14 ' + String(ev.title || '')); } catch (_) {}
        }
      });
    };
    const _iv = setInterval(_check, 30000); _check();
    return () => clearInterval(_iv);
  }, [events]);
  const [showTopics, setShowTopics] = useState(false);
  const [drawerView, setDrawerView] = useState<'history' | 'folders'>('history');
  const [newChatSignal, setNewChatSignal] = useState(0);
  const [topicMsgs, setTopicMsgs] = useState<{ from: 'user' | 'agent'; text: string }[] | null>(null);
  const [loadSignal, setLoadSignal] = useState(0);
  const [drawerEditId, setDrawerEditId] = useState<number|null>(null);
  const [drawerEditVal, setDrawerEditVal] = useState('');
  const [drawerSearch, setDrawerSearch] = useState('');
  const [topicsList, setTopicsList] = useState<any[]>([]);
  const [foldersList, setFoldersList] = useState<any[]>([]);

  // Drag sheet (mobile) — mirrors the admin chat overlay: 3 snaps (full / below-header / closed)
  const FULL_TOP = 0;
  const [headerBottom, setHeaderBottom] = useState(120);
  const [sheetTop, setSheetTop] = useState<number | null>(null); // null = follow live anchor (below header)
  const [dragging, setDragging] = useState(false);
  const [entered, setEntered] = useState(false);
  const dragRef = useRef<{ startY: number; startTop: number; moved: boolean } | null>(null);
  const curTop = sheetTop != null ? sheetTop : headerBottom;

  useEffect(() => { const r = requestAnimationFrame(() => setEntered(true)); return () => cancelAnimationFrame(r); }, []);

  useEffect(() => {
    const measure = () => {
      const anchor = document.querySelector('[data-chat-top-anchor]') || document.querySelector('header');
      if (anchor) setHeaderBottom(anchor.getBoundingClientRect().bottom);
    };
    measure();
    const ro = new ResizeObserver(measure);
    const anchor = document.querySelector('[data-chat-top-anchor]') || document.querySelector('header');
    if (anchor) ro.observe(anchor);
    const iv = setInterval(measure, 160);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); clearInterval(iv); window.removeEventListener('resize', measure); };
  }, []);

  const onSheetDown = (e: React.PointerEvent) => {
    if (window.innerWidth >= 768) return;
    if ((e.target as HTMLElement).closest('button')) return; // keep header buttons clickable
    dragRef.current = { startY: e.clientY, startTop: curTop, moved: false };
    setDragging(true);
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch (_) {}
  };
  const onSheetMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const d = e.clientY - dragRef.current.startY;
    if (Math.abs(d) > 6) dragRef.current.moved = true;
    setSheetTop(Math.max(FULL_TOP, dragRef.current.startTop + d)); // up to full-screen
  };
  const onSheetUp = () => {
    if (!dragRef.current) return;
    const wasTap = !dragRef.current.moved;
    dragRef.current = null;
    setDragging(false);
    if (wasTap) {
      // Tap: full-screen → collapse below avatar; below avatar → full-screen.
      if (curTop < headerBottom - 4) setSheetTop(null);
      else setSheetTop(FULL_TOP);
      return;
    }
    if (curTop > headerBottom + 90) { goBack(); return; }             // pulled down → close
    if (curTop < headerBottom - 60) { setSheetTop(FULL_TOP); return; } // pulled up → full-screen
    setSheetTop(null);                                                 // snap back below the avatar
  };

  const pendingTasks = tasks.filter(t => !t.done).length;
  const asstTabs = ASSISTANT_TABS.map(t => t.id === 'todo' ? { ...t, badge: pendingTasks } : t);

  const TOPICS_LIST = topicsList;

  const TOPIC_MESSAGES: Record<number, { from: 'user' | 'agent'; text: string }[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
  };

  const FOLDERS_LIST = foldersList;

  const toggleDrawer = (view: 'history' | 'folders') => {
    if (showTopics && drawerView === view) { setShowTopics(false); }
    else { setDrawerView(view); setShowTopics(true); }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  // Mobile: draggable bottom-sheet (like the agent chat overlay) — 3 snaps (full / below-avatar / closed),
  // tap the handle to collapse/close. Desktop: normal flow.
  const sheetStyle: React.CSSProperties = isMobile ? {
    position: 'fixed', top: curTop, bottom: 'var(--kb-h, 0px)', left: 0, right: 0, zIndex: 60,
    borderRadius: curTop > headerBottom + 4 ? '18px 18px 0 0' : 0,
    paddingTop: curTop <= headerBottom - 40 ? 'env(safe-area-inset-top, 0px)' : 0,
    transition: dragging ? 'none' : 'top 0.32s cubic-bezier(0.32,0.72,0,1)',
    background: 'var(--aw-chat-bg, rgba(240,238,250,0.62))',
    backdropFilter: 'blur(20px) saturate(1.2)', WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
    boxShadow: curTop > headerBottom + 4 ? '0 -8px 32px rgba(0,0,0,0.18)' : 'none',
  } : {
    position: 'relative', height: '100%',
    background: 'var(--aw-chat-bg, rgba(240,238,250,0.62))',
    backdropFilter: 'blur(20px) saturate(1.2)', WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
  };

  const sheet = (
    <div data-chat-sheet="1" className="flex flex-col aw-chat-pattern" style={sheetStyle}>
      {/* Drag handle (mobile) — drag to resize, tap to collapse/close */}
      <div className="md:hidden flex justify-center pt-3 pb-2 flex-shrink-0" style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onSheetDown} onPointerMove={onSheetMove} onPointerUp={onSheetUp} onPointerCancel={onSheetUp}>
        <div className="w-12 h-1.5 rounded-full" style={{ background: 'var(--aw-eu-nav-border)' }} />
      </div>
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-[var(--aw-border)] flex-shrink-0"
        style={{ background: 'var(--aw-bg-header)' }}>
        {/* Action icons — right corner (RTL start) */}
        <div className="flex items-center gap-1.5">
          <button className="h-8 px-2.5 rounded-xl border border-[var(--aw-border)] bg-transparent cursor-pointer flex items-center gap-1.5 text-[11px] text-[var(--aw-text-secondary)] hover:text-[#6366f1] hover:border-[#6366f1] transition-all"
            onClick={() => openModal('مخاطبین', <EuContacts />)} title="مخاطبین" style={{ fontWeight: 700 }}>
            <i className="fa-solid fa-address-book text-[12px]" /> مخاطبین
          </button>
          <button className="w-8 h-8 rounded-[10px] border border-[var(--aw-border)] bg-transparent cursor-pointer flex items-center justify-center text-[var(--aw-text-secondary)] hover:text-[#6366f1] hover:border-[#6366f1] transition-all relative"
            style={showTopics && drawerView === 'history' ? { background: 'rgba(99,102,241,0.12)', color: '#6366f1', borderColor: '#6366f1' } : {}}
            onClick={() => toggleDrawer('history')} title="تاریخچه گفتگو">
            <i className="fa-solid fa-clock-rotate-left text-[13px]" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px]" style={{ background: '#6366f1', fontWeight: 700 }}>{TOPICS_LIST.length}</span>
          </button>
          <button className="w-8 h-8 rounded-[10px] border border-[var(--aw-border)] bg-transparent cursor-pointer flex items-center justify-center text-[var(--aw-text-secondary)] hover:text-[#6366f1] hover:border-[#6366f1] transition-all relative"
            style={showTopics && drawerView === 'folders' ? { background: 'rgba(99,102,241,0.12)', color: '#6366f1', borderColor: '#6366f1' } : {}}
            onClick={() => toggleDrawer('folders')} title="پوشه‌ها">
            <i className="fa-solid fa-folder-open text-[13px]" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px]" style={{ background: '#6366f1', fontWeight: 700 }}>{FOLDERS_LIST.length}</span>
          </button>
          <button className="w-8 h-8 rounded-[10px] border border-[var(--aw-border)] bg-transparent cursor-pointer flex items-center justify-center text-[var(--aw-text-secondary)] hover:text-[#6366f1] hover:border-[#6366f1] transition-all"
            onClick={() => { setNewChatSignal(s => s + 1); showToast('گفتگوی جدید'); }} title="گفتگوی جدید">
            <i className="fa-solid fa-plus text-[13px]" />
          </button>
        </div>
        {/* Title — left side: agent-name glass dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setAsstOpen(o => !o)} className="text-right bg-transparent border-none cursor-pointer p-0 flex items-center gap-1.5">
              <div>
                <div className="text-[13px] text-[var(--aw-text-primary)] flex items-center gap-1" style={{ fontWeight: 700 }}>
                  {activeAsstName}
                  <i className={`fa-solid fa-chevron-down text-[8px] transition-transform ${asstOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--aw-eu-primary)' }} />
                </div>
                <div className="text-[10px]" style={{ color: '#10b981' }}>آنلاین</div>
              </div>
            </button>
            <AnimatePresence>
              {asstOpen && (
                <>
                  <div className="fixed inset-0 z-[45]" onClick={() => setAsstOpen(false)} />
                  <motion.div className="absolute top-full mt-2 left-0 z-[46] min-w-[190px] rounded-2xl overflow-hidden p-1.5"
                    initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.96 }} transition={{ duration: 0.18 }}
                    style={{ background: 'color-mix(in srgb, var(--aw-eu-primary) 12%, var(--aw-bg-modal, rgba(240,238,250,0.9)))', backdropFilter: 'blur(22px) saturate(1.5)', WebkitBackdropFilter: 'blur(22px) saturate(1.5)', border: '1px solid color-mix(in srgb, var(--aw-eu-primary) 32%, transparent)', boxShadow: '0 16px 40px rgba(0,0,0,0.28), inset 0 1px 1px rgba(255,255,255,0.35)' }}>
                    {assistantAgents.map((a: any) => {
                      const isActive = a.id === (activeAsst?.id);
                      const nm = a.name || 'دستیار شخصی';
                      return (
                        <button key={a.id} onClick={() => { setAssistantId(a.id); setAsstOpen(false); }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer border-none text-right transition-colors"
                          style={{ background: isActive ? 'color-mix(in srgb, var(--aw-eu-primary) 22%, transparent)' : 'transparent' }}>
                          <span className="w-7 h-7 flex items-center justify-center flex-shrink-0 text-white text-[11px]" style={{ borderRadius: 8, background: a.accent || 'var(--aw-eu-primary)', fontWeight: 700 }}>{(nm || 'د').slice(0, 1)}</span>
                          <span className="flex-1 text-[12.5px] truncate" style={{ color: 'var(--aw-text-primary)', fontWeight: isActive ? 700 : 500 }}>{nm}</span>
                          {isActive && <i className="fa-solid fa-check text-[11px]" style={{ color: 'var(--aw-eu-primary)' }} />}
                        </button>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ borderRadius: 11, background: 'color-mix(in srgb, var(--aw-eu-primary) 18%, transparent)', border: '1px solid color-mix(in srgb, var(--aw-eu-primary) 42%, transparent)', backdropFilter: 'blur(12px) saturate(1.4)', WebkitBackdropFilter: 'blur(12px) saturate(1.4)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4), 0 2px 8px color-mix(in srgb, var(--aw-eu-primary) 18%, transparent)', color: 'var(--aw-eu-primary)' }}>
            <i className="fa-solid fa-robot text-[14px]" />
          </div>
          <button className="w-8 h-8 rounded-[10px] border border-[var(--aw-border)] bg-transparent cursor-pointer flex items-center justify-center text-[var(--aw-text-secondary)] hover:text-[var(--aw-eu-primary)] hover:border-[var(--aw-eu-primary)] transition-all"
            onClick={goBack} title="بازگشت">
            <i className="fa-solid fa-arrow-right text-[14px]" />
          </button>
        </div>
      </div>

      {/* Topics/folders drawer — slides in from the right with a blurred backdrop */}
      <AnimatePresence>
        {showTopics && (
          <>
          <motion.div className="absolute inset-0 z-20 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', height: '100%' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            onClick={() => setShowTopics(false)}>
          <motion.div className="w-[88%] max-w-[360px] overflow-y-auto aw-scroll rounded-2xl"
            style={{ height: '70%', maxHeight: '90%', background: 'var(--aw-bg-card)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid var(--aw-border)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
            initial={{ scale: 0.92, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--aw-border)] sticky top-0 z-10" style={{ background: 'var(--aw-chat-bg, rgba(240,238,250,0.72))', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}>
              <span className="text-[13px] text-[var(--aw-text-primary)] flex items-center gap-1.5" style={{ fontWeight: 700 }}>
                <i className={`fa-solid ${drawerView === 'folders' ? 'fa-folder-open' : 'fa-clock-rotate-left'} text-[12px]`} style={{ color: '#6366f1' }} /> {drawerView === 'folders' ? 'پوشه‌ها' : 'تاریخچه گفتگو'}
              </span>
              <button className="text-[11px] px-2.5 py-1 rounded-lg border-none cursor-pointer text-white flex items-center gap-1"
                style={{ background: '#6366f1', fontWeight: 600 }}
                onClick={() => {
                  if (drawerView === 'folders') {
                    const newId = Date.now();
                    setFoldersList((l: any[]) => [{ id: newId, title: 'پوشه جدید', date: '۰ مورد', active: false }, ...l]);
                    setDrawerEditId(newId); setDrawerEditVal('پوشه جدید');
                  } else {
                    const newId = Date.now();
                    setTopicsList((l: any[]) => [{ id: newId, title: 'گفتگوی جدید', date: 'همین الان', msgs: 0, active: false }, ...l]);
                    setDrawerEditId(newId); setDrawerEditVal('گفتگوی جدید');
                  }
                }}>
                <i className="fa-solid fa-plus text-[9px]" /> جدید
              </button>
            </div>
            {/* Search bar */}
            <div className="px-2.5 pt-2 pb-1 sticky top-[45px] z-10" style={{ background: 'var(--aw-chat-bg, rgba(240,238,250,0.72))', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}>
              <div className="flex items-center gap-2 rounded-xl px-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
                <i className="fa-solid fa-search text-[11px] text-[var(--aw-text-muted)]" />
                <input
                  className="flex-1 bg-transparent border-none py-2 text-[12px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
                  style={{ fontFamily: 'inherit' }}
                  placeholder={drawerView === 'folders' ? 'جستجوی پوشه‌ها...' : 'جستجوی گفتگوها...'}
                  value={drawerSearch}
                  onChange={e => setDrawerSearch(e.target.value)} />
                {drawerSearch && (
                  <button className="border-none bg-transparent text-[var(--aw-text-muted)] text-[11px] cursor-pointer hover:text-[#6366f1]" onClick={() => setDrawerSearch('')}>
                    <i className="fa-solid fa-xmark" />
                  </button>
                )}
              </div>
            </div>
            {(drawerView === 'folders' ? FOLDERS_LIST : TOPICS_LIST).filter((item: any) => !drawerSearch.trim() || (item.title || '').includes(drawerSearch.trim())).map((item: any) => {
              const setList = drawerView === 'folders' ? setFoldersList : setTopicsList;
              const isEditing = drawerEditId === item.id;
              const openItem = () => { setShowTopics(false); setTab('chat'); if (drawerView !== 'folders') { setTopicMsgs(TOPIC_MESSAGES[item.id] || []); setLoadSignal(s => s + 1); } };
              return (
                <div key={item.id} className="w-full flex items-center gap-1 px-2 py-2 transition-all"
                  style={item.active ? { background: 'rgba(99,102,241,0.08)' } : {}}>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border-none cursor-pointer"
                    style={{ background: item.active ? '#6366f122' : 'var(--aw-bg-app)' }} onClick={openItem}>
                    <i className={`fa-solid ${drawerView === 'folders' ? (item.active ? 'fa-folder-open' : 'fa-folder') : (item.active ? 'fa-comment-dots' : 'fa-file-lines')} text-[12px]`}
                      style={{ color: item.active ? '#6366f1' : 'var(--aw-text-muted)' }} />
                  </button>
                  {isEditing ? (
                    <input autoFocus className="flex-1 min-w-0 text-[12px] px-2 py-1 rounded-lg border border-[#6366f1] outline-none bg-transparent text-right"
                      style={{ color: 'var(--aw-text-primary)', fontFamily: 'inherit' }}
                      value={drawerEditVal}
                      onChange={e => setDrawerEditVal(e.target.value)}
                      onBlur={() => { setList((l: any[]) => l.map((x: any) => x.id === item.id ? { ...x, title: drawerEditVal || x.title } : x)); setDrawerEditId(null); }}
                      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setDrawerEditId(null); }} />
                  ) : (
                    <button className="flex-1 min-w-0 text-right border-none bg-transparent cursor-pointer p-0" onClick={openItem}>
                      <div className="text-[12px] text-[var(--aw-text-primary)] truncate" style={{ fontWeight: item.active ? 700 : 500 }}>{item.title}</div>
                      <div className="text-[10px] text-[var(--aw-text-muted)]">{drawerView === 'folders' ? item.date : item.date + ' · ' + item.msgs + ' پیام'}</div>
                    </button>
                  )}
                  {item.active && !isEditing && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#6366f1' }} />}
                  <button className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border-none cursor-pointer"
                    style={{ background: 'transparent', color: 'var(--aw-text-muted)' }}
                    onClick={e => { e.stopPropagation(); setDrawerEditId(item.id); setDrawerEditVal(item.title); }}>
                    <i className="fa-solid fa-pen text-[10px]" />
                  </button>
                  <button className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border-none cursor-pointer"
                    style={{ background: 'transparent', color: '#ef4444' }}
                    onClick={e => { e.stopPropagation(); setList((l: any[]) => l.filter((x: any) => x.id !== item.id)); }}>
                    <i className="fa-solid fa-trash text-[10px]" />
                  </button>
                </div>
              );
            })}
          </motion.div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.div key={tab} className="flex-1 flex flex-col min-h-0"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
          {tab === 'chat' && <AssistantNewChat resetSignal={newChatSignal} loadMessages={topicMsgs} loadSignal={loadSignal} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  return isMobile ? createPortal(sheet, document.body) : sheet;
}


// =====================================================================
//  SEARCH SCREEN (جستجو – مستقل)
// =====================================================================
export function EuSearchScreen() {
  const { setEuScreen } = useApp();
  return (
    <div className="flex flex-col h-full">
      <AssistantSearchTab onBack={() => setEuScreen('euHomeScreen')} />
    </div>
  );
}

// =====================================================================
//  REPORT SCREEN (گزارش – مستقل)
// =====================================================================
export function EuReportScreen() {
  const { setEuScreen } = useApp();
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [events, setEvents] = useState(INITIAL_CAL_EVENTS);
  const [orders, setOrders] = useState<any[]>([]);
  const _reportLoaded = useRef(false);
  useEffect(() => {
    if (_reportLoaded.current || !getToken()) return; _reportLoaded.current = true;
    (async () => {
      try { const t: any = await (api as any).myList('tasks'); if (Array.isArray(t)) setTasks(t as any); } catch (_e) {}
      try { const e: any = await (api as any).myList('calendar'); if (Array.isArray(e)) setEvents(e as any); } catch (_e) {}
      try { const o: any = await (api as any).myOrders(); if (Array.isArray(o)) setOrders(o); } catch (_e) {}
    })();
  }, []);
  return (
    <div className="flex flex-col h-full">
      <AssistantReportTab tasks={tasks} events={events} orders={orders} />
    </div>
  );
}

// =====================================================================
//  PLANNER SCREEN (برنامه‌ها و وظایف – ادغام‌شده)
// =====================================================================
export function EuPlannerScreen() {
  const { setEuScreen, showToast } = useApp();
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [events, setEvents] = useState(INITIAL_CAL_EVENTS);
  const _asstDataLoaded = useRef(false);
  useEffect(() => {
    if (!getToken()) return;
    (async () => {
      try { const t: any = await (api as any).myList('tasks'); if (Array.isArray(t)) setTasks(t as any); } catch (_) {}
      try { const e: any = await (api as any).myList('calendar'); if (Array.isArray(e)) setEvents(e as any); } catch (_) {}
      _asstDataLoaded.current = true;
    })();
  }, []);
  useEffect(() => { if (!_asstDataLoaded.current || !getToken()) return; const _h = setTimeout(() => { (api as any).myBulkSave('tasks', tasks).catch(() => {}); }, 700); return () => clearTimeout(_h); }, [tasks]);
  useEffect(() => { if (!_asstDataLoaded.current || !getToken()) return; const _h = setTimeout(() => { (api as any).myBulkSave('calendar', events).catch(() => {}); }, 700); return () => clearTimeout(_h); }, [events]);
  // datachanged: \u0648\u0642\u062A\u06CC \u062F\u0633\u062A\u06CC\u0627\u0631 \u0627\u0632 \u062F\u0627\u062E\u0644\u0650 \u06AF\u0641\u062A\u06AF\u0648 \u062A\u0633\u06A9/\u06CC\u0627\u062F\u0622\u0648\u0631\u06CC \u0645\u06CC\u200C\u0633\u0627\u0632\u062F (myCreate + \u0631\u0648\u06CC\u062F\u0627\u062F)\u060C \u0627\u06CC\u0646 \u0635\u0641\u062D\u0647 \u062F\u0627\u062F\u0647\u0654 \u062A\u0627\u0632\u0647 \u0631\u0627 \u0627\u0632 \u0633\u0631\u0648\u0631 \u0645\u06CC\u200C\u06AF\u06CC\u0631\u062F
  // \u062A\u0627 \u0647\u0645 \u062A\u0633\u06A9\u0650 \u0646\u0648 \u0632\u0646\u062F\u0647 \u0646\u0645\u0627\u06CC\u0634 \u062F\u0627\u062F\u0647 \u0634\u0648\u062F \u0648 \u0647\u0645 state\u0650 \u0642\u062F\u06CC\u0645\u06CC \u0628\u0627 \u0630\u062E\u06CC\u0631\u0647\u0654 \u06AF\u0631\u0648\u0647\u06CC\u0650 \u0628\u0639\u062F\u06CC\u060C \u062A\u0633\u06A9\u0650 \u062A\u0627\u0632\u0647 \u0631\u0627 \u067E\u0627\u06A9 \u0646\u06A9\u0646\u062F.
  useEffect(() => {
    const onChanged = (e: any) => {
      const coll = e?.detail?.collection;
      if (!getToken()) return;
      if (coll === 'tasks' || coll === 'reminders') { (api as any).myList('tasks').then((t: any) => { if (Array.isArray(t)) setTasks(t as any); }).catch(() => {}); }
      if (coll === 'calendar' || coll === 'events') { (api as any).myList('calendar').then((v: any) => { if (Array.isArray(v)) setEvents(v as any); }).catch(() => {}); }
    };
    window.addEventListener('neura-data-changed', onChanged as any);
    return () => window.removeEventListener('neura-data-changed', onChanged as any);
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const _en = (x: any) => String(x == null ? '' : x).replace(/[\u06F0-\u06F9]/g, (d: string) => String(d.charCodeAt(0) - 0x06F0)).replace(/[\u0660-\u0669]/g, (d: string) => String(d.charCodeAt(0) - 0x0660));
    const _atOf = (ev: any): number => {
      if (typeof ev.at === 'number' && ev.at > 0) return ev.at;
      const m = _en(ev.time).match(/(\d{1,2}):(\d{2})/); if (!m) return 0;
      let day = -1; if (/\u0627\u0645\u0631\u0648\u0632|today/i.test(ev.date || '')) day = 0; else if (/\u0641\u0631\u062F\u0627/.test(ev.date || '')) day = 1; if (day < 0) return 0;
      const fire = new Date(); fire.setDate(fire.getDate() + day); fire.setHours(Number(m[1]), Number(m[2]), 0, 0); return fire.getTime();
    };
    const _pending = (events || []).filter((ev: any) => ev && !ev.done && ev.status !== 'done' && ev.status !== 'cancelled' && !ev.muted && _atOf(ev) > 0);
    const _future = _pending.some((ev: any) => _atOf(ev) > Date.now() - 3600000);
    try { if (_future && (Notification as any).permission === 'default') (Notification as any).requestPermission().catch(() => {}); } catch (_) {}
    const _check = () => {
      const now = Date.now();
      _pending.forEach((ev: any) => {
        const at = _atOf(ev); if (!at) return;
        const key = 'nrfire_' + ev.id + '_' + at;
        let done = false; try { done = !!localStorage.getItem(key); } catch (_) {}
        const diff = now - at;
        if (!done && diff >= 0 && diff < 3600000) {
          try { localStorage.setItem(key, '1'); } catch (_) {}
          try { if ((Notification as any).permission === 'granted') new Notification('\u06CC\u0627\u062F\u0622\u0648\u0631\u0650 \u0646\u0648\u0631\u0627', { body: String(ev.title || ''), icon: '/pwa-192.png' }); } catch (_) {}
          try { showToast('\uD83D\uDD14 ' + String(ev.title || '')); } catch (_) {}
        }
      });
    };
    const _iv = setInterval(_check, 30000); _check();
    return () => clearInterval(_iv);
  }, [events]);

  return (
    <div className="flex flex-col h-full">
      <AnimatePresence mode="wait">
        <motion.div key="calendar" className="flex-1 flex flex-col min-h-0"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
          <AssistantCalendarTab events={events} setEvents={setEvents} tasks={tasks} setTasks={setTasks} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
