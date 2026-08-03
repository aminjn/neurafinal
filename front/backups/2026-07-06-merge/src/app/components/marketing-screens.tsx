import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './app-context';
import { useMarketing } from './marketing-context';
import { StateGate, EmptyState } from './marketing-ui';
import { LetterAvatar } from './letter-avatar';
import { SwipeToCall } from './end-user-panel';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';
import {
  MKT_BLUE, MKT_GRAD,
  STATUS_META, FUNNEL_STAGES, type Lead,
  type MktConversation, RISK_META, type AiAction,
  ACTION_STATUS_META, type ActionStatus,
  type Segment, type Persona,
  CONVERSION_DATA, LEAD_GROWTH_DATA, CHANNEL_DATA, FUNNEL_PERF,
  TIME_FILTERS, CALENDAR_TYPE_LABELS, type CalendarEvent,
  CAMPAIGN_STATUS_COLORS, CAMPAIGN_STATUS_LABELS, CAMPAIGN_TYPE_ICONS,
} from './marketing-data';

// ========================
// SHARED STYLES & HELPERS
// ========================
const cardStyle: React.CSSProperties = { background: 'var(--aw-bg-card)', borderRadius: 10, border: '1px solid var(--aw-border)' };
const tabBarStyle: React.CSSProperties = { background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', borderRadius: 9999, padding: 3, backdropFilter: 'blur(20px)' };
const activeTabStyle: React.CSSProperties = { background: 'var(--aw-bg-card)', borderRadius: 9999, color: 'var(--aw-text-primary)', fontWeight: 700, boxShadow: 'inset 0 0 0 1px var(--aw-border), 0 2px 6px rgba(0,0,0,0.10)' };
const inactiveTabStyle: React.CSSProperties = { background: 'transparent', borderRadius: 9999, color: 'var(--aw-text-secondary)' };

function TabBar({ tabs, active, onChange }: { tabs: { id: string; label: string; icon: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 p-1 mx-4 mt-3 mb-2 overflow-x-auto aw-noscroll" style={tabBarStyle}>
      {tabs.map(t => (
        <button key={t.id} className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1.5 border-none cursor-pointer transition-all text-[11px]" style={active === t.id ? activeTabStyle : inactiveTabStyle} onClick={() => onChange(t.id)}>
          {t.icon ? <i className={`${t.icon} text-[12px]`} /> : null}<span style={{ whiteSpace: 'nowrap' }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function SectionHeader({ title, icon, count, color = 'var(--aw-primary)' }: { title: string; icon: string; count?: number; color?: string }) {
  return (
    <div className="flex items-center gap-2 px-1 pt-3 pb-1">
      <i className={`${icon} text-[14px]`} style={{ color: 'var(--aw-primary)' }} />
      <span className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{title}</span>
      {count !== undefined && <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--aw-primary-bg)', color: 'var(--aw-primary)' }}>{count}</span>}
    </div>
  );
}

const QA_SCENARIOS = ['default', 'empty-leads', 'high-priority-leads', 'campaign-failed', 'campaign-pending-approval', 'budget-warning', 'no-conversations', 'ai-error', 'network-error', 'permission-denied'] as const;

// Clear, labelled QA scenario switcher — used on every marketing screen.
export function ScenarioButton() {
  const { isMock, scenario, setScenario } = useMarketing();
  if (!isMock) return null;
  const isActive = scenario !== 'default';
  return (
    <div className="relative flex-shrink-0">
      <button
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer text-[11px]"
        style={{ background: isActive ? 'rgba(245,158,11,0.15)' : 'var(--aw-bg-card)', border: `1px solid ${isActive ? 'rgba(245,158,11,0.4)' : 'var(--aw-border)'}`, color: isActive ? '#F59E0B' : 'var(--aw-text-secondary)', fontWeight: 600 }}
        title="سناریوی تست (QA)"
      >
        <i className="fa-solid fa-flask text-[10px]" />
        <span>سناریو: {scenario}</span>
        <i className="fa-solid fa-chevron-down text-[8px]" />
      </button>
      <select className="absolute inset-0 opacity-0 cursor-pointer text-base" value={scenario} onChange={(e) => setScenario(e.target.value as any)}>
        {QA_SCENARIOS.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}

function ScreenHeader({ title, subtitle, icon }: { title: string; subtitle: string; icon: string }) {
  return (
    <div className="px-4 pt-4 pb-1">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[18px] text-[var(--aw-text-primary)] m-0" style={{ fontWeight: 800 }}>
          <i className={`${icon} ml-2`} style={{ color: MKT_BLUE }} />{title}
        </h2>
        <ScenarioButton />
      </div>
      <p className="text-[12px] text-[var(--aw-text-muted)] mt-1 m-0">{subtitle}</p>
    </div>
  );
}

function PrimaryCTA({ label, icon, onClick, options }: { label: string; icon: string; onClick?: () => void; options?: { label: string; icon: string; onClick: () => void }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed left-0 right-0 z-[60] flex flex-col items-center pointer-events-none md:absolute" style={{ bottom: 'calc(72px + env(safe-area-inset-bottom))' }}>
      <AnimatePresence>
        {open && options && (
          <motion.div className="pointer-events-auto flex flex-col gap-2 mb-2 w-[min(92%,420px)] mx-auto" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
            {options.map((o, i) => (
              <button key={i} className="flex items-center gap-2.5 px-4 py-3 border-none cursor-pointer text-[13px] text-[var(--aw-text-primary)]" style={{ ...cardStyle, boxShadow: 'var(--aw-shadow-sm)', fontWeight: 600 }} onClick={() => { setOpen(false); o.onClick(); }}>
                <i className={o.icon} style={{ color: MKT_BLUE }} />{o.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button className="pointer-events-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full border-none cursor-pointer text-white text-[14px]" style={{ background: MKT_GRAD, boxShadow: '0 6px 20px rgba(59,130,246,0.45)', fontWeight: 700 }} onClick={() => { if (options) setOpen(o => !o); else onClick?.(); }}>
        <i className={open && options ? 'fa-solid fa-xmark' : icon} /><span>{label}</span>
      </button>
    </div>
  );
}

export function TopCTABanner({ title, subtitle, onClick }: { title: string; subtitle: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="mx-4 mt-3 mb-1 flex items-center gap-3 px-4 py-4 cursor-pointer border-none transition-all" style={{ width: 'calc(100% - 32px)', borderRadius: 20, background: 'linear-gradient(135deg, rgba(59,130,246,0.07), rgba(139,92,246,0.05))', border: '1px solid rgba(59,130,246,0.16)' }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: MKT_GRAD, boxShadow: '0 4px 12px rgba(59,130,246,0.4)' }}><i className="fa-solid fa-plus text-white text-[15px]" /></div>
      <div className="flex-1 text-right min-w-0">
        <div className="text-[14px]" style={{ color: MKT_BLUE, fontWeight: 700 }}>{title}</div>
        <div className="text-[11px] text-[var(--aw-text-muted)] mt-0.5">{subtitle}</div>
      </div>
      <i className="fa-solid fa-chevron-left text-[13px]" style={{ color: MKT_BLUE }} />
    </button>
  );
}

function DetailRow({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return <div className="flex justify-between items-center text-[13px] py-1"><span className="text-[var(--aw-text-muted)]">{label}</span><span style={{ color: color || 'var(--aw-text-primary)', fontWeight: 600 }}>{value}</span></div>;
}

function AiBox({ text }: { text: string }) {
  return (
    <div className="p-3 rounded-[10px]" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
      <div className="flex items-center gap-1.5 mb-1 text-[12px]" style={{ color: MKT_BLUE, fontWeight: 700 }}><i className="fa-solid fa-wand-magic-sparkles text-[11px]" />پیشنهاد هوش مصنوعی</div>
      <p className="text-[12px] text-[var(--aw-text-secondary)] m-0 leading-6">{text}</p>
    </div>
  );
}

function ModalActions({ actions }: { actions: { label: string; icon: string; color: string; onClick: () => void }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {actions.map((a, i) => (
        <button key={i} className="flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] border-none cursor-pointer text-[12px] text-white" style={{ background: a.color, fontWeight: 600 }} onClick={a.onClick}><i className={a.icon} />{a.label}</button>
      ))}
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full" style={{ background: 'var(--aw-bg-hover)' }}><div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} /></div>
      <span className="text-[10px]" style={{ color, fontWeight: 700 }}>{score}</span>
    </div>
  );
}

const customTooltipStyle: React.CSSProperties = { background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)', borderRadius: 10, padding: '8px 12px', fontSize: 11, direction: 'rtl' };

// Small form primitives (used in modals)
const inputCls = 'w-full px-3 py-2 rounded-[10px] text-[13px] outline-none';
const inputStyle: React.CSSProperties = { background: 'var(--aw-bg-input)', border: '1px solid var(--aw-border)', color: 'var(--aw-text-primary)' };
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-[11px] text-[var(--aw-text-muted)] mb-1">{label}</div>{children}</div>;
}

// ============================================================
// 1. CONVERSATIONS SCREEN (گفتگو)
// ============================================================
const CONV_TABS = [
  { id: 'all', label: 'همه گفتگوها', icon: 'fa-solid fa-comments' },
  { id: 'leads', label: 'مشتریان و لیدها', icon: 'fa-solid fa-user-group' },
  { id: 'ai', label: 'اقدامات AI', icon: 'fa-solid fa-robot' },
];
const convKindColor: Record<string, string> = { lead: '#EF4444', customer: '#10B981', ai: '#3B82F6', team: '#8B5CF6' };

const MKT_KIND_BG: Record<string, string> = {
  lead: 'bg-amber-500', customer: 'bg-green-600', ai: 'bg-violet-600', team: 'bg-blue-600',
};

export function MktConversationsScreen() {
  const { openChat, showToast, setAdminScreen, startCall } = useApp();
  const { conversations, approvals, run, svc, reload } = useMarketing();
  const [tab, setTab] = useState('all');

  const all = conversations.data;
  const filtered = all.filter(c => tab === 'all' ? true : tab === 'ai' ? c.kind === 'ai' : (c.kind === 'lead' || c.kind === 'customer'));
  const reviewActions = approvals.data.slice(0, 3);

  const openConversation = (c: MktConversation) => {
    run('علامت‌گذاری خوانده‌شده', () => svc.conversations.markRead(c.id), () => reload('conversations'));
    openChat('mkt_' + c.id, 'contact', {
      name: c.name,
      init: (typeof c.avatar === 'string' && c.avatar.length <= 2) ? c.avatar : c.name[0] || '؟',
      bg: MKT_KIND_BG[c.kind] || 'bg-blue-600',
      sub: c.kindLabel,
    });
  };

  return (
    <div className="flex flex-col h-full relative">
      <TabBar tabs={CONV_TABS} active={tab} onChange={setTab} />
      <TopCTABanner title="ایجاد گفتگوی جدید" subtitle="چت یا گروه جدید بسازید" onClick={() => run('ایجاد گفتگو', () => svc.conversations.create({ name: 'گفتگوی جدید', kind: 'lead', kindLabel: 'لید', lastMessage: 'شروع گفتگو' }), () => reload('conversations'))} />
      <div className="flex-1 overflow-y-auto px-4 pb-32 aw-scroll">
        <StateGate status={conversations.status} error={conversations.error} onRetry={() => reload('conversations')}
          empty={<EmptyState icon="fa-solid fa-comments" title="گفتگویی وجود ندارد" hint="با ایجاد گفتگوی جدید شروع کنید" ctaLabel="گفتگوی جدید" onCta={() => run('ایجاد گفتگو', () => svc.conversations.create({ name: 'گفتگوی جدید', kind: 'lead', kindLabel: 'لید', lastMessage: 'شروع گفتگو' }), () => reload('conversations'))} />}>
          <div className="flex flex-col gap-2">
            {filtered.map(c => (
              <SwipeToCall key={c.id} onCall={() => startCall(c.name, c.kindLabel, MKT_BLUE, (c.name || '?').trim()[0] || '?', '')}>
              <div className="p-3 cursor-pointer transition-all hover:border-[#3B82F6]" style={cardStyle} onClick={() => openConversation(c)}>
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    {c.kind === 'ai' ? (
                      <div className="w-11 h-11 rounded-[10px] flex items-center justify-center text-[18px]" style={{ background: MKT_GRAD }}>{c.avatar}</div>
                    ) : (
                      <LetterAvatar name={c.name} size={44} radius={14} />
                    )}
                    {c.unread && <span className="absolute -top-0.5 -left-0.5 w-3 h-3 rounded-full border-2" style={{ background: '#EF4444', borderColor: 'var(--aw-bg-card)' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: c.unread ? 700 : 600 }}>{c.name}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: `${convKindColor[c.kind]}1f`, color: convKindColor[c.kind] }}>{c.kindLabel}</span>
                      {c.priority === 'high' && <i className="fa-solid fa-fire text-[10px]" style={{ color: '#EF4444' }} />}
                    </div>
                    <div className="text-[11px] text-[var(--aw-text-muted)] mt-1 truncate">{c.lastMessage}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[9px] text-[var(--aw-text-muted)] whitespace-nowrap">{c.time}</span>
                  </div>
                </div>
              </div>
              </SwipeToCall>
            ))}
          </div>
        </StateGate>
      </div>
    </div>
  );
}

// ============================================================
// 2. LEADS SCREEN (لیدها)
// ============================================================
const LEADS_TABS = [
  { id: 'all', label: 'همه', icon: 'fa-solid fa-list' },
  { id: 'hot', label: 'گرم', icon: 'fa-solid fa-fire' },
  { id: 'warm', label: 'نیمه‌گرم', icon: 'fa-solid fa-temperature-half' },
  { id: 'cold', label: 'سرد', icon: 'fa-solid fa-snowflake' },
];

function LeadForm({ initial, onDone }: { initial?: Lead; onDone: () => void }) {
  const { closeModal } = useApp();
  const { run, svc, reload } = useMarketing();
  const [name, setName] = useState(initial?.name || '');
  const [company, setCompany] = useState(initial?.company || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [field, setField] = useState(initial?.field || '');
  const [status, setStatus] = useState<Lead['status']>(initial?.status || 'warm');
  const [err, setErr] = useState('');

  const submit = () => {
    if (!name.trim()) { setErr('نام لید الزامی است'); return; }
    if (!phone.trim()) { setErr('شماره تماس الزامی است'); return; }
    const payload = { name, company, phone, field, status };
    const op = initial ? () => svc.leads.update(initial.id, payload) : () => svc.leads.create(payload);
    run(initial ? 'ویرایش لید' : 'افزودن لید', op, () => { reload('leads'); closeModal(); onDone(); });
  };

  return (
    <div className="space-y-2.5">
      <Field label="نام و نام خانوادگی *"><input className={inputCls} style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="مثلاً سارا محمدی" /></Field>
      <Field label="شرکت / کسب‌وکار"><input className={inputCls} style={inputStyle} value={company} onChange={e => setCompany(e.target.value)} /></Field>
      <Field label="حوزه فعالیت"><input className={inputCls} style={inputStyle} value={field} onChange={e => setField(e.target.value)} /></Field>
      <Field label="شماره تماس *"><input className={inputCls} style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="۰۹..." /></Field>
      <Field label="وضعیت">
        <select className={inputCls} style={inputStyle} value={status} onChange={e => setStatus(e.target.value as Lead['status'])}>
          <option value="hot">گرم</option><option value="warm">نیمه‌گرم</option><option value="cold">سرد</option>
        </select>
      </Field>
      {err && <div className="text-[11px]" style={{ color: '#EF4444' }}><i className="fa-solid fa-circle-exclamation ml-1" />{err}</div>}
      <button className="w-full py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[13px]" style={{ background: MKT_BLUE, fontWeight: 700 }} onClick={submit}>{initial ? 'ذخیره تغییرات' : 'افزودن لید'}</button>
    </div>
  );
}

export function MktLeadsScreen({ embedded }: { embedded?: boolean }) {
  const { openModal, showToast } = useApp();
  const { leads, run, svc, reload, confirmSensitive } = useMarketing();
  const [view, setView] = useState<'list' | 'pipeline'>('list');
  const [tab, setTab] = useState('all');

  const data = leads.data;
  const filtered = tab === 'all' ? data : data.filter(l => l.status === tab);
  const counts = { hot: data.filter(l => l.status === 'hot').length, warm: data.filter(l => l.status === 'warm').length, cold: data.filter(l => l.status === 'cold').length };

  const addLead = () => openModal('افزودن لید جدید', <LeadForm onDone={() => {}} />);

  const openLead = (lead: Lead) => {
    const stage = FUNNEL_STAGES.find(s => s.id === lead.stage)!;
    openModal(lead.name, (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <LetterAvatar name={lead.name} size={48} radius={14} />
          <div><div className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{lead.company}</div><div className="text-[11px] text-[var(--aw-text-muted)]">{lead.field} • {lead.phone}</div></div>
        </div>
        <div className="p-3 rounded-[10px]" style={{ background: 'var(--aw-bg-hover)' }}>
          <div className="flex items-center justify-between mb-2"><span className="text-[12px] text-[var(--aw-text-muted)]">امتیاز لید</span><ScoreBar score={lead.score} /></div>
          <DetailRow label="مرحله فعلی" value={stage.label} color={stage.color} />
          <DetailRow label="وضعیت" value={STATUS_META[lead.status].label} color={STATUS_META[lead.status].color} />
          <DetailRow label="منبع ورود" value={lead.source} />
          <DetailRow label="سگمنت" value={lead.segment} />
          <DetailRow label="مسئول" value={lead.owner} />
          <DetailRow label="اقدام بعدی" value={lead.nextAction} color={MKT_BLUE} />
          <DetailRow label="موعد پیگیری" value={lead.followUp} color="#F59E0B" />
        </div>

        {/* Stage changer */}
        <div>
          <div className="text-[12px] mb-1.5" style={{ fontWeight: 700 }}>تغییر مرحله Pipeline</div>
          <div className="flex flex-wrap gap-1.5">
            {FUNNEL_STAGES.map(s => (
              <button key={s.id} className="text-[10px] px-2 py-1 rounded-full border-none cursor-pointer" style={{ background: s.id === lead.stage ? s.color : `${s.color}1a`, color: s.id === lead.stage ? '#fff' : s.color, fontWeight: 600 }}
                onClick={() => run('تغییر مرحله', () => svc.leads.setStage(lead.id, s.id), () => reload('leads'))}>{s.label}</button>
            ))}
          </div>
        </div>

        <AiBox text={lead.aiSuggestion} />

        <div>
          <div className="text-[12px] mb-1.5" style={{ fontWeight: 700 }}>تایم‌لاین تعاملات</div>
          <div className="flex flex-col gap-2">
            {lead.timeline.map(t => (
              <div key={t.id} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px]" style={{ background: 'rgba(59,130,246,0.12)', color: MKT_BLUE }}>
                  <i className={t.type === 'call' ? 'fa-solid fa-phone' : t.type === 'message' ? 'fa-solid fa-comment' : t.type === 'email' ? 'fa-solid fa-envelope' : t.type === 'stage' ? 'fa-solid fa-flag' : 'fa-solid fa-note-sticky'} />
                </div>
                <div className="flex-1"><div className="text-[12px] text-[var(--aw-text-primary)]">{t.text}</div><div className="text-[10px] text-[var(--aw-text-muted)]">{t.date}</div></div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px w-full" style={{ background: 'var(--aw-border)' }} />
        <ModalActions actions={[
          { label: 'تماس', icon: 'fa-solid fa-phone', color: '#10B981', onClick: () => showToast('در حال تماس...') },
          { label: 'پیام', icon: 'fa-solid fa-comment', color: MKT_BLUE, onClick: () => run('آماده‌سازی پیام', () => svc.ai.generate('generate-message', { leadId: lead.id })) },
          { label: 'ثبت یادداشت', icon: 'fa-solid fa-note-sticky', color: '#8B5CF6', onClick: () => run('ثبت یادداشت', () => svc.leads.addNote(lead.id, 'یادداشت جدید'), () => reload('leads')) },
          { label: 'ایجاد پیگیری', icon: 'fa-solid fa-bell', color: '#F59E0B', onClick: () => run('ایجاد پیگیری', () => svc.leads.addFollowUp(lead.id, 'پیگیری', 'فردا'), () => reload('leads')) },
          { label: 'افزایش امتیاز', icon: 'fa-solid fa-arrow-up', color: '#06B6D4', onClick: () => confirmSensitive('lead-score-major-change', () => run('تغییر امتیاز', () => svc.leads.setScore(lead.id, Math.min(100, lead.score + 10)), () => reload('leads'))) },
          { label: 'ویرایش', icon: 'fa-solid fa-pen', color: '#1E6BFF', onClick: () => openModal('ویرایش لید', <LeadForm initial={lead} onDone={() => {}} />) },
          { label: 'تبدیل به مشتری', icon: 'fa-solid fa-handshake', color: '#10B981', onClick: () => run('تبدیل به مشتری', () => svc.leads.setStage(lead.id, 'won'), () => reload('leads')) },
          { label: 'ازدست‌رفته', icon: 'fa-solid fa-xmark', color: '#94A3B8', onClick: () => run('علامت‌گذاری', () => svc.leads.setStage(lead.id, 'lost'), () => reload('leads')) },
          { label: 'حذف لید', icon: 'fa-solid fa-trash', color: '#EF4444', onClick: () => confirmSensitive('delete-lead', () => run('حذف لید', () => svc.leads.remove(lead.id), () => reload('leads'))) },
        ]} />
      </div>
    ));
  };

  const LeadCard = ({ lead }: { lead: Lead }) => {
    const st = STATUS_META[lead.status];
    return (
      <div className="p-3 cursor-pointer transition-all hover:border-[#3B82F6]" style={cardStyle} onClick={() => openLead(lead)}>
        <div className="flex items-start gap-3">
          <LetterAvatar name={lead.name} size={40} radius={12} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap"><span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{lead.name}</span><span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span></div>
            <div className="text-[11px] text-[var(--aw-text-muted)] mt-0.5">{lead.company} • {lead.field}</div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap"><span className="text-[10px] text-[var(--aw-text-muted)]"><i className={`${lead.sourceIcon} text-[9px] ml-1`} />{lead.source}</span><span className="text-[10px] text-[var(--aw-text-muted)]"><i className="fa-regular fa-clock text-[9px] ml-1" />{lead.followUp}</span></div>
            <div className="text-[10px] text-[var(--aw-text-secondary)] mt-1"><i className="fa-solid fa-arrow-right text-[9px] ml-1" style={{ color: MKT_BLUE }} />{lead.nextAction}</div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-[9px] text-[var(--aw-text-muted)]">امتیاز</span><ScoreBar score={lead.score} />
            <div className="flex gap-1 mt-1">
              <button className="w-7 h-7 rounded-lg border-none cursor-pointer text-white text-[10px]" style={{ background: '#10B981' }} onClick={(e) => { e.stopPropagation(); showToast('در حال تماس...'); }}><i className="fa-solid fa-phone" /></button>
              <button className="w-7 h-7 rounded-lg border-none cursor-pointer text-white text-[10px]" style={{ background: MKT_BLUE }} onClick={(e) => { e.stopPropagation(); openLead(lead); }}><i className="fa-solid fa-comment" /></button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full relative">
      {!embedded && (
        <div className="flex gap-1 p-1 mx-4 mt-3" style={tabBarStyle}>
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border-none cursor-pointer text-[12px]" style={view === 'list' ? activeTabStyle : inactiveTabStyle} onClick={() => setView('list')}><i className="fa-solid fa-list" /> نمای لیست</button>
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border-none cursor-pointer text-[12px]" style={view === 'pipeline' ? activeTabStyle : inactiveTabStyle} onClick={() => setView('pipeline')}><i className="fa-solid fa-diagram-project" /> پایپ‌لاین</button>
        </div>
      )}

      {view === 'list' ? (
        <>
          <div className="flex gap-2 px-4 mt-3 mb-1">
            {([{ id: 'hot', label: 'گرم', count: counts.hot, color: '#EF4444', icon: 'fa-solid fa-fire' }, { id: 'warm', label: 'نیمه‌گرم', count: counts.warm, color: '#F59E0B', icon: 'fa-solid fa-temperature-half' }, { id: 'cold', label: 'سرد', count: counts.cold, color: '#3B82F6', icon: 'fa-solid fa-snowflake' }]).map((s) => {
              const active = tab === s.id;
              return (
                <button key={s.id} onClick={() => setTab(active ? 'all' : s.id)} className="aw-no-pill flex-1 p-3 flex flex-col items-center gap-1.5 cursor-pointer transition-all" style={{ ...cardStyle, borderRadius: 10, background: active ? `${s.color}18` : 'var(--aw-bg-card)', border: `1.5px solid ${active ? s.color : 'var(--aw-border)'}` }}>
                  <div className="w-11 h-11 rounded-md flex items-center justify-center" style={{ background: `${s.color}1f` }}><i className={`${s.icon} text-[18px]`} style={{ color: s.color }} /></div>
                  <span className="text-[18px] leading-none" style={{ fontWeight: 800, color: s.color }}>{s.count}</span>
                  <span className="text-[11px]" style={{ color: active ? s.color : 'var(--aw-text-muted)', fontWeight: active ? 700 : 400 }}>{s.label}</span>
                </button>
              );
            })}
          </div>
          <TopCTABanner title="افزودن لید جدید" subtitle="مخاطب یا سرنخ جدید ثبت کنید" onClick={addLead} />
          {tab !== 'all' && (
            <button onClick={() => setTab('all')} className="mx-4 mb-1 py-1.5 rounded-lg cursor-pointer bg-transparent text-[11px] flex items-center justify-center gap-1.5" style={{ border: '1px solid var(--aw-border)', color: 'var(--aw-text-muted)' }}><i className="fa-solid fa-list text-[10px]" />نمایش همه لیدها</button>
          )}
          <div className="flex-1 overflow-y-auto px-4 pt-1 pb-32 aw-scroll">
            <StateGate status={leads.status} error={leads.error} onRetry={() => reload('leads')}
              empty={<EmptyState icon="fa-solid fa-user-plus" title="لیدی ثبت نشده است" hint="اولین لید خود را اضافه کنید" ctaLabel="افزودن لید جدید" onCta={addLead} />}>
              <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2">
                  {filtered.length === 0 ? <EmptyState icon="fa-solid fa-filter" title="موردی در این دسته نیست" /> : filtered.map(lead => <LeadCard key={lead.id} lead={lead} />)}
                </motion.div>
              </AnimatePresence>
            </StateGate>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-32 aw-scroll">
          <StateGate status={leads.status} error={leads.error} onRetry={() => reload('leads')} empty={<EmptyState icon="fa-solid fa-diagram-project" title="پایپ‌لاین خالی است" ctaLabel="افزودن لید" onCta={addLead} />}>
            <div className="flex flex-col gap-3 md:flex-row md:gap-3 md:overflow-x-auto">
              {FUNNEL_STAGES.map(stage => {
                const inStage = data.filter(l => l.stage === stage.id);
                return (
                  <div key={stage.id} className="md:min-w-[240px] md:flex-1">
                    <div className="flex items-center gap-2 px-2 py-2 rounded-t-xl" style={{ background: `${stage.color}14`, borderBottom: `2px solid ${stage.color}` }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} /><span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{stage.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full mr-auto" style={{ background: `${stage.color}26`, color: stage.color }}>{inStage.length}</span>
                    </div>
                    <div className="flex flex-col gap-2 p-2 rounded-b-xl" style={{ background: 'var(--aw-bg-hover)' }}>
                      {inStage.length === 0 && <div className="text-[11px] text-[var(--aw-text-muted)] text-center py-3">خالی</div>}
                      {inStage.map(lead => (
                        <div key={lead.id} className="p-2.5 cursor-pointer" style={cardStyle} onClick={() => openLead(lead)}>
                          <div className="flex items-center gap-2"><span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{lead.name}</span><span className="text-[9px] mr-auto" style={{ color: STATUS_META[lead.status].color }}>{lead.score}</span></div>
                          <div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">{lead.company}</div>
                          <div className="text-[10px] mt-1" style={{ color: MKT_BLUE }}><i className="fa-solid fa-arrow-right text-[8px] ml-1" />{lead.nextAction}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </StateGate>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 3. AUDIENCES SCREEN (مخاطبان)
// ============================================================
const SEGMENT_TABS = [
  { id: 'segments', label: 'سگمنت‌ها', icon: 'fa-solid fa-layer-group' },
  { id: 'personas', label: 'پرسوناها', icon: 'fa-solid fa-user-tag' },
  { id: 'targets', label: 'هدف‌گذاری', icon: 'fa-solid fa-bullseye' },
];

function SegmentForm({ onDone }: { onDone: () => void }) {
  const { closeModal } = useApp();
  const { run, svc, reload } = useMarketing();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [size, setSize] = useState('');
  const [err, setErr] = useState('');
  const submit = () => {
    if (!name.trim()) { setErr('نام سگمنت الزامی است'); return; }
    run('ساخت سگمنت', () => svc.audiences.create({ name, desc, size }), () => { reload('segments'); closeModal(); onDone(); });
  };
  return (
    <div className="space-y-2.5">
      <Field label="نام سگمنت *"><input className={inputCls} style={inputStyle} value={name} onChange={e => setName(e.target.value)} /></Field>
      <Field label="توضیح کوتاه"><input className={inputCls} style={inputStyle} value={desc} onChange={e => setDesc(e.target.value)} /></Field>
      <Field label="تعداد مخاطبان (تقریبی)"><input className={inputCls} style={inputStyle} value={size} onChange={e => setSize(e.target.value)} /></Field>
      {err && <div className="text-[11px]" style={{ color: '#EF4444' }}>{err}</div>}
      <button className="w-full py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[13px]" style={{ background: MKT_BLUE, fontWeight: 700 }} onClick={submit}>ساخت سگمنت</button>
    </div>
  );
}

export function MktSegmentScreen() {
  const { openModal, showToast, setAdminScreen } = useApp();
  const { segments, personas, run, svc, reload, confirmSensitive } = useMarketing();
  const [tab, setTab] = useState('segments');

  const createManual = () => openModal('ساخت سگمنت جدید', <SegmentForm onDone={() => {}} />);
  const createAI = () => run('ساخت سگمنت با AI', async () => { const r = await svc.ai.generate('suggest-segment'); await svc.audiences.create({ name: 'سگمنت پیشنهادی AI', desc: r.text }); }, () => reload('segments'));

  const openSegment = (seg: Segment) => {
    openModal(seg.name, (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[{ l: 'مخاطبان', v: seg.size }, { l: 'نرخ تبدیل', v: seg.conversion }, { l: 'تعامل', v: seg.engagement }].map((x, i) => (
            <div key={i} className="text-center p-2 rounded-lg" style={{ background: 'var(--aw-bg-hover)' }}><div className="text-[14px]" style={{ fontWeight: 700, color: seg.color }}>{x.v}</div><div className="text-[9px] text-[var(--aw-text-muted)] mt-0.5">{x.l}</div></div>
          ))}
        </div>
        <div className="p-3 rounded-[10px]" style={{ background: 'var(--aw-bg-hover)' }}>
          <DetailRow label="ارزش تقریبی" value={`${seg.value} ت`} color="#10B981" />
          <DetailRow label="رشد" value={seg.growth} color="#10B981" />
          <DetailRow label="منبع داده" value={seg.dataSource} />
          <DetailRow label="آخرین به‌روزرسانی" value={seg.updated} />
        </div>
        {seg.rules.length > 0 && <div><div className="text-[12px] mb-1.5" style={{ fontWeight: 700 }}>قوانین سگمنت</div><div className="flex flex-wrap gap-1.5">{seg.rules.map((r, i) => <span key={i} className="text-[10px] px-2 py-1 rounded-full" style={{ background: `${seg.color}1a`, color: seg.color }}>{r}</span>)}</div></div>}
        {seg.overlap.length > 0 && <div><div className="text-[12px] mb-1.5" style={{ fontWeight: 700 }}>هم‌پوشانی با سایر سگمنت‌ها</div>{seg.overlap.map((o, i) => (<div key={i} className="flex items-center gap-2 mb-1.5"><span className="text-[11px] text-[var(--aw-text-secondary)] w-32">{o.name}</span><div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--aw-bg-hover)' }}><div className="h-full rounded-full" style={{ width: `${o.pct}%`, background: seg.color }} /></div><span className="text-[10px]" style={{ color: seg.color }}>{o.pct}%</span></div>))}</div>}
        <AiBox text={seg.aiSuggestion} />
        <ModalActions actions={[
          { label: 'ویرایش قوانین', icon: 'fa-solid fa-pen', color: '#8B5CF6', onClick: () => confirmSensitive('segment-major-change', () => run('ویرایش قوانین', () => svc.audiences.update(seg.id, { updated: 'هم‌اکنون' }), () => reload('segments'))) },
          { label: 'اتصال به کمپین', icon: 'fa-solid fa-bullhorn', color: MKT_BLUE, onClick: () => setAdminScreen('campaignScreen') },
          { label: 'تحلیل با AI', icon: 'fa-solid fa-wand-magic-sparkles', color: '#10B981', onClick: () => run('تحلیل سگمنت', () => svc.ai.generate('suggest-segment', { id: seg.id })) },
          { label: 'Duplicate', icon: 'fa-solid fa-clone', color: '#F59E0B', onClick: () => run('کپی سگمنت', () => svc.audiences.duplicate(seg.id), () => reload('segments')) },
        ]} />
      </div>
    ));
  };

  const openPersona = (p: Persona) => {
    openModal(p.name, (
      <div className="space-y-3">
        <div className="flex items-center gap-3"><span className="text-[36px]">{p.avatar}</span><div><div className="text-[14px]" style={{ fontWeight: 700 }}>{p.name}</div><div className="text-[11px] text-[var(--aw-text-muted)]">{p.desc} • سن {p.age}</div></div></div>
        {[{ t: 'اهداف', items: p.goals, c: '#10B981', i: 'fa-solid fa-bullseye' }, { t: 'دغدغه‌ها', items: p.pains, c: '#EF4444', i: 'fa-solid fa-triangle-exclamation' }, { t: 'کانال‌های مناسب', items: p.channels, c: MKT_BLUE, i: 'fa-solid fa-tower-broadcast' }, { t: 'سگمنت‌های مرتبط', items: p.relatedSegments, c: '#8B5CF6', i: 'fa-solid fa-layer-group' }].map((g, gi) => (
          <div key={gi}><div className="text-[11px] mb-1.5" style={{ color: g.c, fontWeight: 600 }}><i className={`${g.i} text-[9px] ml-1`} />{g.t}</div><div className="flex flex-wrap gap-1">{g.items.map((x, xi) => <span key={xi} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${g.c}1a`, color: g.c }}>{x}</span>)}</div></div>
        ))}
        {p.suggestedMessage && <div><div className="text-[11px] mb-1.5" style={{ color: '#F59E0B', fontWeight: 600 }}><i className="fa-solid fa-comment-dots text-[9px] ml-1" />پیام پیشنهادی</div><p className="text-[12px] text-[var(--aw-text-secondary)] m-0 p-2.5 rounded-lg leading-6" style={{ background: 'var(--aw-bg-hover)' }}>{p.suggestedMessage}</p></div>}
        <ModalActions actions={[
          { label: 'مشاهده', icon: 'fa-solid fa-eye', color: '#8B5CF6', onClick: () => showToast('جزئیات پرسونا') },
          { label: 'ساخت کمپین', icon: 'fa-solid fa-bullhorn', color: MKT_BLUE, onClick: () => setAdminScreen('campaignScreen') },
        ]} />
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-full relative">
      <TabBar tabs={SEGMENT_TABS} active={tab} onChange={setTab} />
      <TopCTABanner title="ساخت سگمنت جدید" subtitle="دسته‌بندی جدید مخاطبان بسازید" onClick={createManual} />
      <div className="flex-1 overflow-y-auto px-4 pb-32 aw-scroll">
        {tab === 'segments' && (
          <StateGate status={segments.status} error={segments.error} onRetry={() => reload('segments')} empty={<EmptyState icon="fa-solid fa-layer-group" title="سگمنتی وجود ندارد" ctaLabel="ساخت سگمنت" onCta={createManual} />}>
            <div className="flex flex-col gap-2 pt-1">
              {segments.data.map(seg => (
                <div key={seg.id} className="p-3 cursor-pointer transition-all hover:border-[#3B82F6]" style={cardStyle} onClick={() => openSegment(seg)}>
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: `${seg.color}18` }}><i className={`${seg.icon} text-[18px]`} style={{ color: seg.color }} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{seg.name}</span><span className="text-[10px]" style={{ color: '#10B981', fontWeight: 600 }}>{seg.growth}</span></div>
                      <div className="text-[11px] text-[var(--aw-text-muted)] mt-0.5">{seg.desc}</div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap"><span className="text-[11px] text-[var(--aw-text-secondary)]"><i className="fa-solid fa-users text-[9px] ml-1" />{seg.size}</span><span className="text-[11px] text-[var(--aw-text-secondary)]"><i className="fa-solid fa-arrows-spin text-[9px] ml-1" />{seg.conversion}</span><span className="text-[11px] text-[var(--aw-text-secondary)]"><i className="fa-solid fa-heart text-[9px] ml-1" />{seg.engagement}</span></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </StateGate>
        )}
        {tab === 'personas' && (
          <StateGate status={personas.status} error={personas.error} onRetry={() => reload('personas')} empty={<EmptyState icon="fa-solid fa-user-tag" title="پرسونایی وجود ندارد" ctaLabel="ساخت پرسونا با AI" onCta={() => run('ساخت پرسونا', async () => { const r = await svc.ai.generate('generate-persona'); await svc.personas.create({ name: 'پرسونای AI', desc: r.text }); }, () => reload('personas'))} />}>
            <div className="flex flex-col gap-3 pt-1">
              {personas.data.map(p => (
                <div key={p.id} className="p-4 cursor-pointer transition-all hover:border-[#3B82F6]" style={cardStyle} onClick={() => openPersona(p)}>
                  <div className="flex items-center gap-3"><span className="text-[28px]">{p.avatar}</span><div className="flex-1"><span className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{p.name}</span><div className="text-[11px] text-[var(--aw-text-muted)]">{p.desc}</div></div><i className="fa-solid fa-chevron-left text-[12px] text-[var(--aw-text-muted)]" /></div>
                  {p.goals.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{p.goals.slice(0, 3).map((g, gi) => <span key={gi} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>{g}</span>)}</div>}
                </div>
              ))}
            </div>
          </StateGate>
        )}
        {tab === 'targets' && (
          <StateGate status={segments.status} error={segments.error} onRetry={() => reload('segments')} empty={<EmptyState icon="fa-solid fa-bullseye" title="هدف‌گذاری در دسترس نیست" />}>
            <div className="flex flex-col gap-2 pt-1">
              {segments.data.map(seg => (
                <div key={seg.id} className="p-3" style={cardStyle}>
                  <div className="flex items-center justify-between mb-2"><span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}><i className={`${seg.icon} text-[12px] ml-1.5`} style={{ color: seg.color }} />{seg.name}</span><span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${seg.color}1a`, color: seg.color }}>نفوذ {seg.penetration}%</span></div>
                  <div className="h-2 rounded-full mb-2" style={{ background: 'var(--aw-bg-hover)' }}><div className="h-full rounded-full" style={{ width: `${seg.penetration}%`, background: seg.color }} /></div>
                  <div className="flex items-center justify-between"><span className="text-[10px] text-[var(--aw-text-muted)]">{seg.size} مخاطب • {seg.campaigns.length} کمپین فعال</span><button className="text-[10px] px-2.5 py-1 rounded-lg border-none cursor-pointer text-white" style={{ background: MKT_BLUE, fontWeight: 600 }} onClick={() => setAdminScreen('campaignScreen')}>هدف‌گیری</button></div>
                </div>
              ))}
            </div>
          </StateGate>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 4. PERFORMANCE SCREEN (عملکرد)
// ============================================================
function MgmtReportModal() {
  const { showToast } = useApp();
  const { svc } = useMarketing();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let ok = true;
    svc.ai.generate('performance-report').then(r => { if (ok) { setText(r.text || ''); setLoading(false); } }).catch(() => { if (ok) setLoading(false); });
    return () => { ok = false; };
  }, []);
  const today = new Date().toLocaleDateString('fa-IR');
  return (
    <div className="space-y-3">
      {loading ? (
        <div className="py-10 flex flex-col items-center gap-2 text-[var(--aw-text-muted)]">
          <i className="fa-solid fa-spinner fa-spin text-[20px]" style={{ color: MKT_BLUE }} />
          <span className="text-[12px]">در حال ساخت گزارش مدیریتی…</span>
        </div>
      ) : (
        <>
          <div className="p-3.5 rounded-[10px]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-[12px]" style={{ color: MKT_BLUE, fontWeight: 700 }}><i className="fa-solid fa-file-lines" />خلاصهٔ مدیریتی</div>
              <span className="text-[10px] text-[var(--aw-text-muted)]">{today}</span>
            </div>
            <p className="text-[12.5px] text-[var(--aw-text-secondary)] leading-7 m-0" style={{ whiteSpace: 'pre-line' }}>{text}</p>
          </div>

          <div className="p-3 rounded-[10px]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
            <div className="flex items-center gap-1.5 mb-1 text-[11.5px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}><i className="fa-solid fa-arrows-spin text-[11px]" style={{ color: MKT_BLUE }} />روند نرخ تبدیل</div>
            <div className="h-[150px] mt-1" dir="ltr"><ResponsiveContainer width="100%" height="100%"><AreaChart data={CONVERSION_DATA}><defs><linearGradient id="mgmtConv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3B82F6" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="var(--aw-border)" /><XAxis dataKey="name" tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" /><Tooltip contentStyle={customTooltipStyle} /><Area type="monotone" dataKey="rate" stroke="#3B82F6" fill="url(#mgmtConv)" strokeWidth={2} name="نرخ تبدیل %" /></AreaChart></ResponsiveContainer></div>
          </div>

          <div className="p-3 rounded-[10px]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
            <div className="flex items-center gap-1.5 mb-1 text-[11.5px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}><i className="fa-solid fa-arrow-trend-up text-[11px]" style={{ color: MKT_BLUE }} />رشد لیدها</div>
            <div className="h-[150px] mt-1" dir="ltr"><ResponsiveContainer width="100%" height="100%"><BarChart data={LEAD_GROWTH_DATA}><defs><linearGradient id="mgmtLead" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#1D4ED8" /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="var(--aw-border)" /><XAxis dataKey="name" tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={customTooltipStyle} /><Bar dataKey="leads" fill="url(#mgmtLead)" radius={[6, 6, 0, 0]} name="تعداد لید" /></BarChart></ResponsiveContainer></div>
          </div>

          <div className="p-3 rounded-[10px]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
            <div className="flex items-center gap-1.5 mb-1 text-[11.5px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}><i className="fa-solid fa-chart-pie text-[11px]" style={{ color: MKT_BLUE }} />سهم کانال‌ها</div>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-[110px] h-[110px]" dir="ltr"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={CHANNEL_DATA} cx="50%" cy="50%" innerRadius={30} outerRadius={48} dataKey="value" stroke="none">{CHANNEL_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie></PieChart></ResponsiveContainer></div>
              <div className="flex-1 flex flex-col gap-1.5">{CHANNEL_DATA.map((ch, i) => (<div key={i} className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ch.color }} /><span className="text-[11px] text-[var(--aw-text-secondary)] flex-1">{ch.name}</span><span className="text-[11px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{ch.value}%</span></div>))}</div>
            </div>
          </div>

          <button className="w-full py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[13px] flex items-center justify-center gap-2" style={{ background: MKT_BLUE, fontWeight: 700 }} onClick={() => showToast('خروجی گزارش مدیریتی (PDF) آماده دانلود شد')}><i className="fa-solid fa-download text-[12px]" />Export گزارش</button>
        </>
      )}
    </div>
  );
}

export function MktPerformanceScreen() {
  const { openModal, showToast } = useApp();
  const { performance, run, svc, reload } = useMarketing();
  const [time, setTime] = useState('month');

  const kpis = performance.data?.kpis || [];
  const insight = performance.data?.insight || '';

  const showAi = (kind: string, title: string) => run(title, async () => { const r = await svc.ai.generate(kind); openModal(title, <p className="text-[13px] text-[var(--aw-text-secondary)] leading-7 m-0">{r.text}</p>); return r; });

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center gap-1.5 px-4 mt-3 overflow-x-auto aw-scroll pb-1">
        {TIME_FILTERS.map(f => (
          <button key={f.id} className="flex-shrink-0 py-1.5 px-3 rounded-full border text-[11px] cursor-pointer transition-all" style={time === f.id ? { background: `color-mix(in srgb, ${MKT_BLUE} 18%, transparent)`, color: MKT_BLUE, borderColor: `color-mix(in srgb, ${MKT_BLUE} 45%, transparent)`, fontWeight: 700, backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' } : { background: 'var(--aw-eu-nav-bg)', color: 'var(--aw-text-secondary)', borderColor: 'var(--aw-eu-nav-border)', fontWeight: 600, backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }} onClick={() => { setTime(f.id); reload('performance'); }}>{f.label}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-32 aw-scroll">
        <StateGate status={performance.status} error={performance.error} onRetry={() => reload('performance')} empty={<EmptyState icon="fa-solid fa-chart-line" title="داده عملکردی موجود نیست" />}>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              {kpis.map((kpi, i) => (
                <div key={i} className="p-2 cursor-pointer transition-all hover:border-[#3B82F6]" style={cardStyle} onClick={() => openModal(kpi.label, <div className="space-y-2"><DetailRow label="مقدار" value={kpi.value} /><DetailRow label="تغییر" value={kpi.change} color={kpi.change.startsWith('-') ? '#EF4444' : '#10B981'} /><DetailRow label="توضیح" value={kpi.note} /></div>)}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-1.5" style={{ background: `${kpi.color}18` }}><i className={`${kpi.icon} text-[12px]`} style={{ color: kpi.color }} /></div>
                  <div className="text-[15px] text-[var(--aw-text-primary)] leading-tight" style={{ fontWeight: 800 }}>{kpi.value}</div>
                  <div className="flex items-center gap-1 mt-0.5"><span className="text-[9px] text-[var(--aw-text-muted)] truncate">{kpi.label}</span><span className="text-[9px] flex-shrink-0" style={{ color: kpi.change.startsWith('-') ? '#EF4444' : '#10B981', fontWeight: 600 }}><i className={`fa-solid ${kpi.change.startsWith('-') ? 'fa-arrow-down' : 'fa-arrow-up'} text-[6px] ml-0.5`} />{kpi.change}</span></div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-[10px]" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12))', border: '1px solid rgba(59,130,246,0.25)' }}>
              <div className="flex items-center gap-1.5 mb-1.5 text-[12px]" style={{ color: MKT_BLUE, fontWeight: 700 }}><i className="fa-solid fa-lightbulb" />بینش هوش مصنوعی</div>
              <p className="text-[12px] text-[var(--aw-text-secondary)] m-0 leading-6">{insight}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="p-3" style={cardStyle}>
                <SectionHeader title="روند نرخ تبدیل" icon="fa-solid fa-arrows-spin" />
                <div className="h-[170px] mt-2"><ResponsiveContainer width="100%" height="100%"><AreaChart data={CONVERSION_DATA}><defs><linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3B82F6" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="var(--aw-border)" /><XAxis dataKey="name" tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" /><Tooltip contentStyle={customTooltipStyle} /><Area type="monotone" dataKey="rate" stroke="#3B82F6" fill="url(#convGrad)" strokeWidth={2} name="نرخ تبدیل %" /></AreaChart></ResponsiveContainer></div>
              </div>
              <div className="p-3" style={cardStyle}>
                <SectionHeader title="رشد لیدها" icon="fa-solid fa-arrow-trend-up" />
                <div className="h-[170px] mt-2"><ResponsiveContainer width="100%" height="100%"><BarChart data={LEAD_GROWTH_DATA}><defs><linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#1D4ED8" /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="var(--aw-border)" /><XAxis dataKey="name" tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={customTooltipStyle} /><Bar dataKey="leads" fill="url(#leadGrad)" radius={[6, 6, 0, 0]} name="تعداد لید" /></BarChart></ResponsiveContainer></div>
              </div>
            </div>

            <div className="p-3" style={cardStyle}>
              <SectionHeader title="قیف تبدیل" icon="fa-solid fa-filter" />
              <div className="flex flex-col gap-1.5 mt-2">
                {FUNNEL_PERF.map((f, i) => (
                  <div key={i} className="flex items-center gap-2"><span className="text-[11px] text-[var(--aw-text-secondary)] w-16">{f.stage}</span><div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: 'var(--aw-bg-hover)' }}><div className="h-full rounded-lg flex items-center justify-end px-2" style={{ width: `${f.value}%`, background: f.color }}><span className="text-[10px] text-white" style={{ fontWeight: 700 }}>{f.value}%</span></div></div></div>
                ))}
              </div>
            </div>

            <div className="p-3" style={cardStyle}>
              <SectionHeader title="عملکرد کانال‌ها" icon="fa-solid fa-tower-broadcast" />
              <div className="flex items-center gap-4 mt-2">
                <div className="w-[130px] h-[130px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={CHANNEL_DATA} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" stroke="none">{CHANNEL_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie></PieChart></ResponsiveContainer></div>
                <div className="flex-1 flex flex-col gap-1.5">{CHANNEL_DATA.map((ch, i) => (<div key={i} className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ch.color }} /><span className="text-[11px] text-[var(--aw-text-secondary)] flex-1">{ch.name}</span><span className="text-[11px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{ch.value}%</span></div>))}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button className="py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[12px] flex items-center justify-center gap-1.5" style={{ background: MKT_BLUE, fontWeight: 700 }} onClick={() => openModal('گزارش مدیریتی', <MgmtReportModal />)}><i className="fa-solid fa-file-lines" />ساخت گزارش مدیریتی</button>
              <button className="py-2.5 rounded-[10px] border cursor-pointer text-[12px] flex items-center justify-center gap-1.5" style={{ background: 'var(--aw-eu-nav-bg)', borderColor: 'var(--aw-eu-nav-border)', color: MKT_BLUE, fontWeight: 600, backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }} onClick={() => showToast('خروجی گزارش (PDF) آماده دانلود است')}><i className="fa-solid fa-download" />Export</button>
            </div>
          </div>
        </StateGate>
      </div>
    </div>
  );
}

// ============================================================
// 5. AI APPROVALS CENTER (مرکز تأیید اقدامات AI)
// ============================================================
export function MktApprovalsScreen() {
  const { openModal, setAdminScreen } = useApp();
  const { approvals, run, svc, reload } = useMarketing();

  const showLog = () => run('بارگذاری Log', async () => {
    const log = await svc.approvals.log();
    openModal('گزارش اقدامات (Log)', (
      <div className="space-y-2">
        {log.length === 0 ? <EmptyState icon="fa-solid fa-clock-rotate-left" title="هنوز اقدامی ثبت نشده" /> : log.map(e => (
          <div key={e.id} className="p-2.5 rounded-lg text-[12px]" style={{ background: 'var(--aw-bg-hover)' }}>
            <span style={{ fontWeight: 600, color: e.action === 'approved' ? '#10B981' : e.action === 'rejected' ? '#EF4444' : MKT_BLUE }}>{e.action === 'approved' ? 'تأیید' : e.action === 'rejected' ? 'رد' : 'ویرایش'}</span>
            <span className="text-[var(--aw-text-muted)]"> توسط {e.actor} • {e.at}</span>
          </div>
        ))}
      </div>
    ));
    return log;
  });

  const openAction = (a: AiAction) => {
    const rk = RISK_META[a.risk];
    openModal(a.title, (
      <div className="space-y-3">
        <DetailRow label="نوع اقدام" value={a.type} />
        <DetailRow label="سطح ریسک" value={rk.label} color={rk.color} />
        <DetailRow label="زمان" value={a.date} />
        <DetailRow label="مسئول" value={a.owner} />
        <div><div className="text-[12px] mb-1" style={{ fontWeight: 700 }}>دلیل پیشنهاد AI</div><p className="text-[12px] text-[var(--aw-text-secondary)] m-0 leading-6">{a.reason}</p></div>
        <div><div className="text-[12px] mb-1" style={{ fontWeight: 700 }}>نتیجه مورد انتظار</div><p className="text-[12px] m-0" style={{ color: '#10B981', fontWeight: 600 }}>{a.expected}</p></div>
        <div><div className="text-[12px] mb-1" style={{ fontWeight: 700 }}>پیش‌نمایش</div><p className="text-[12px] text-[var(--aw-text-secondary)] m-0 p-2.5 rounded-lg leading-6" style={{ background: 'var(--aw-bg-hover)' }}>{a.preview}</p></div>
        <ModalActions actions={[
          { label: 'تأیید', icon: 'fa-solid fa-check', color: '#10B981', onClick: () => run('تأیید اقدام', () => svc.approvals.approve(a.id, 'مدیر'), () => reload('approvals')) },
          { label: 'رد', icon: 'fa-solid fa-xmark', color: '#EF4444', onClick: () => run('رد اقدام', () => svc.approvals.reject(a.id, 'مدیر'), () => reload('approvals')) },
          { label: 'ویرایش', icon: 'fa-solid fa-pen', color: MKT_BLUE, onClick: () => run('ویرایش پیشنهاد', () => svc.approvals.update(a.id, { desc: a.desc + ' (ویرایش‌شده)' }), () => reload('approvals')) },
          { label: 'مشاهده Log', icon: 'fa-solid fa-clock-rotate-left', color: '#8B5CF6', onClick: showLog },
        ]} />
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-1 flex items-center gap-2">
        <button className="w-9 h-9 rounded-[12px] flex items-center justify-center border border-[var(--aw-eu-nav-border)] bg-[var(--aw-eu-nav-bg)] backdrop-blur-xl cursor-pointer text-[var(--aw-text-secondary)]" onClick={() => setAdminScreen('mktConversationsScreen')}><i className="fa-solid fa-arrow-right" /></button>
        <div className="flex-1"><h2 className="text-[18px] text-[var(--aw-text-primary)] m-0" style={{ fontWeight: 800 }}>مرکز تأیید اقدامات AI</h2><p className="text-[12px] text-[var(--aw-text-muted)] mt-0.5 m-0">بررسی و تأیید اقدامات حساس پیش از اجرا</p></div>
        <ScenarioButton />
        <button className="text-[11px] px-2.5 py-1.5 rounded-lg border-none cursor-pointer" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)', color: MKT_BLUE, fontWeight: 600 }} onClick={showLog}><i className="fa-solid fa-clock-rotate-left ml-1" />Log</button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-24 aw-scroll">
        <StateGate status={approvals.status} error={approvals.error} onRetry={() => reload('approvals')} empty={<EmptyState icon="fa-solid fa-circle-check" title="اقدام معلقی وجود ندارد" hint="همه اقدامات هوش مصنوعی بررسی شده‌اند" />}>
          <div className="flex flex-col gap-2">
            {approvals.data.map(a => {
              const rk = RISK_META[a.risk];
              return (
                <div key={a.id} className="p-3 cursor-pointer transition-all hover:border-[#3B82F6]" style={{ ...cardStyle, borderRight: `3px solid ${rk.color}` }} onClick={() => openAction(a)}>
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.12)' }}><i className={`${a.typeIcon} text-[14px]`} style={{ color: MKT_BLUE }} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap"><span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{a.title}</span><span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: rk.bg, color: rk.color }}>{rk.label}</span></div>
                      <div className="text-[11px] text-[var(--aw-text-muted)] mt-0.5">{a.desc}</div>
                      <div className="flex gap-1.5 mt-2">
                        <button className="flex-1 py-1.5 rounded-lg border-none cursor-pointer text-[10px] text-white" style={{ background: '#10B981', fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); run('تأیید اقدام', () => svc.approvals.approve(a.id, 'مدیر'), () => reload('approvals')); }}>تأیید</button>
                        <button className="flex-1 py-1.5 rounded-lg border-none cursor-pointer text-[10px] text-white" style={{ background: MKT_BLUE, fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); openAction(a); }}>مشاهده</button>
                        <button className="flex-1 py-1.5 rounded-lg cursor-pointer text-[10px] bg-transparent" style={{ border: '1px solid var(--aw-border)', color: 'var(--aw-text-muted)', fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); run('رد اقدام', () => svc.approvals.reject(a.id, 'مدیر'), () => reload('approvals')); }}>رد</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </StateGate>
      </div>
    </div>
  );
}

// ============================================================
// CRM SCREEN (ارتباط با مشتری) — لیدها + مخاطبین
// ============================================================
export function MktCrmScreen() {
  const [tab, setTab] = useState<'leads' | 'contacts'>('leads');
  return (
    <div className="flex flex-col h-full relative">
      <div className="flex gap-1 p-1 mx-4 mt-3" style={tabBarStyle}>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border-none cursor-pointer text-[12px]" style={tab === 'leads' ? activeTabStyle : inactiveTabStyle} onClick={() => setTab('leads')}>لیدها</button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border-none cursor-pointer text-[12px]" style={tab === 'contacts' ? activeTabStyle : inactiveTabStyle} onClick={() => setTab('contacts')}>مخاطبین</button>
      </div>
      <div className="flex-1 min-h-0">
        {tab === 'leads' ? <MktLeadsScreen embedded /> : <MktSegmentScreen embedded />}
      </div>
    </div>
  );
}

// ============================================================
// ACTIONS SCREEN (اقدامات) — اقدامات فعال + گزارش عملکرد اخیر
// ============================================================
export function MktActionsScreen() {
  const { openModal, setAdminScreen } = useApp();
  const { approvals, performance, campaigns, leads, calendar, run, svc, reload } = useMarketing();
  const [statusTab, setStatusTab] = useState<'all' | ActionStatus>('all');
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    if (approvals.status === 'idle') reload('approvals');
    if (performance.status === 'idle') reload('performance');
    if (campaigns.status === 'idle') reload('campaigns');
    if (leads.status === 'idle') reload('leads');
    if (calendar.status === 'idle') reload('calendar');
  }, []);
  const kpis = (performance.data?.kpis || []).slice(0, 4);
  const insight = performance.data?.insight || '';
  const activeCampaigns = campaigns.data.filter(c => c.status === 'active').length;
  const hotLeads = leads.data.filter(l => l.status === 'hot').length;
  const newLeads = leads.data.filter(l => l.stage === 'new').length;
  const convKpi = (performance.data?.kpis || []).find(k => k.label.includes('تبدیل'));
  const convRate = convKpi?.value || (leads.data.length ? Math.round((hotLeads / leads.data.length) * 100) + '٪' : '۰٪');
  const actionCampaigns = campaigns.data.filter(c => c.status === 'paused' || c.status === 'draft');
  const upcoming = calendar.data.slice(0, 3);
  const openActionDetail = (a: AiAction) => {
    const rk = RISK_META[a.risk]; const sm = ACTION_STATUS_META[statusOf(a)];
    openModal(a.title, <div className="space-y-2">
      <DetailRow label="شرح" value={a.desc} />
      <DetailRow label="وضعیت" value={sm.label} color={sm.color} />
      <DetailRow label="سطح ریسک" value={rk.label} color={rk.color} />
      {statusOf(a) === 'pending' && <div className="flex gap-1.5 pt-1">
        <button className="flex-1 py-2 rounded-lg border-none cursor-pointer text-[12px] text-white" style={{ background: '#10B981', fontWeight: 600 }} onClick={() => run('تأیید اقدام', () => svc.approvals.approve(a.id, 'مدیر'), () => reload('approvals'))}>تأیید</button>
        <button className="flex-1 py-2 rounded-lg cursor-pointer text-[12px] bg-transparent" style={{ border: '1px solid var(--aw-border)', color: 'var(--aw-text-muted)', fontWeight: 600 }} onClick={() => run('رد اقدام', () => svc.approvals.reject(a.id, 'مدیر'), () => reload('approvals'))}>رد</button>
      </div>}
    </div>);
  };

  const statusOf = (a: AiAction): ActionStatus => a.status ?? 'pending';
  const pendingCount = approvals.data.filter(a => statusOf(a) === 'pending').length;
  const approvedCount = approvals.data.filter(a => statusOf(a) === 'approved').length;
  const rejectedCount = approvals.data.filter(a => statusOf(a) === 'rejected').length;
  const ACTION_TABS = [
    { id: 'all', label: `همه (${approvals.data.length})`, icon: '' },
    { id: 'pending', label: `در انتظار (${pendingCount})`, icon: '' },
    { id: 'approved', label: `تأییدشده (${approvedCount})`, icon: '' },
    { id: 'rejected', label: `ردشده (${rejectedCount})`, icon: '' },
  ];
  const filteredActions = approvals.data.filter(a => statusTab === 'all' ? true : statusOf(a) === statusTab);

  return (
    <div className="flex flex-col h-full relative">
      {/* KPI header */}
      <div className="grid grid-cols-3 gap-2 px-4 pt-3 pb-1">
        {[
          { label: 'نرخ تبدیل', value: convRate, icon: 'fa-solid fa-arrow-trend-up', color: '#10B981' },
          { label: 'لید جدید', value: newLeads, icon: 'fa-solid fa-user-plus', color: MKT_BLUE },
          { label: 'لیدهای داغ', value: hotLeads, icon: 'fa-solid fa-fire', color: '#EF4444' },
        ].map((k, i) => (
          <div key={i} className="p-2.5 flex flex-col items-center text-center" style={{ ...cardStyle, borderRadius: 8 }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-1.5" style={{ background: `${k.color}18` }}><i className={`${k.icon} text-[13px]`} style={{ color: k.color }} /></div>
            <div className="text-[17px] text-[var(--aw-text-primary)] leading-none" style={{ fontWeight: 800 }}>{k.value}</div>
            <div className="text-[10px] text-[var(--aw-text-muted)] mt-1">{k.label}</div>
          </div>
        ))}
      </div>
      {/* Active AI actions */}
      <TabBar tabs={ACTION_TABS} active={statusTab} onChange={(id) => { setStatusTab(id as any); setShowAll(false); }} />
      <div className="flex-1 overflow-y-auto px-4 pt-1 pb-32 aw-scroll">
        <StateGate status={approvals.status} error={approvals.error} onRetry={() => reload('approvals')}
          empty={<EmptyState icon="fa-solid fa-circle-check" title="اقدامی وجود ندارد" hint="همه اقدامات بررسی شده‌اند" />}>
          {filteredActions.length === 0 ? (
            <div className="py-10 text-center text-[12px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-inbox text-[22px] block mb-2 opacity-60" />اقدامی در این وضعیت نیست</div>
          ) : (
          <div className="flex flex-col gap-2 mb-4">
            {(statusTab === 'all' && !showAll ? filteredActions.slice(0, 3) : filteredActions).map(a => {
              const rk = RISK_META[a.risk];
              const st = statusOf(a);
              const sm = ACTION_STATUS_META[st];
              return (
                <div key={a.id} className="p-2.5" style={{ ...cardStyle, background: `${sm.color}12`, border: `1px solid ${sm.color}38` }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.12)' }}><i className={`${a.typeIcon} text-[13px]`} style={{ color: MKT_BLUE }} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap"><span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{a.title}</span><span className="text-[9px] px-1.5 py-0.5 rounded-full inline-flex items-center gap-1" style={{ background: sm.bg, color: sm.color }}><i className={`${sm.icon} text-[8px]`} />{sm.label}</span></div>
                      <div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5 truncate">{a.desc}</div>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg border-none cursor-pointer text-[10px] text-white flex-shrink-0" style={{ background: MKT_BLUE, fontWeight: 600 }} onClick={() => openActionDetail(a)}>مشاهده</button>
                  </div>
                </div>
              );
            })}
            {statusTab === 'all' && !showAll && filteredActions.length > 3 && (
              <button className="w-full py-2 rounded-[10px] cursor-pointer bg-transparent text-[11px]" style={{ border: '1px solid var(--aw-border)', color: MKT_BLUE, fontWeight: 600 }} onClick={() => setShowAll(true)}>مشاهده بیشتر ({filteredActions.length - 3} مورد دیگر)</button>
            )}
          </div>
          )}
        </StateGate>

        {/* Campaigns needing action */}
        {actionCampaigns.length > 0 && (
          <>
            <SectionHeader title="کمپین‌های نیازمند اقدام" icon="fa-solid fa-triangle-exclamation" count={actionCampaigns.length} />
            <div className="flex flex-col gap-2 mb-4">
              {actionCampaigns.map(c => {
                const sc = CAMPAIGN_STATUS_COLORS[c.status] || { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' };
                return (
                  <div key={c.id} className="p-2.5 flex items-center gap-2.5 cursor-pointer transition-all hover:border-[#3B82F6]" style={cardStyle} onClick={() => setAdminScreen('campaignScreen' as any)}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${sc.text}18` }}><i className={`${CAMPAIGN_TYPE_ICONS[c.type] || 'fa-solid fa-bullhorn'} text-[13px]`} style={{ color: sc.text }} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-[var(--aw-text-primary)] truncate" style={{ fontWeight: 600 }}>{c.name}</div>
                      <div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">{c.status === 'paused' ? 'متوقف شده — نیازمند بررسی' : 'پیش‌نویس — آماده انتشار'}</div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: sc.bg, color: sc.text }}>{CAMPAIGN_STATUS_LABELS[c.status] || c.status}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Upcoming events */}
        {upcoming.length > 0 && (
          <>
            <SectionHeader title="رویدادهای پیش‌رو" icon="fa-solid fa-calendar-days" count={calendar.data.length} />
            <div className="flex flex-col gap-2 mb-4">
              {upcoming.map(e => (
                <div key={e.id} className="p-3 flex items-center gap-3 cursor-pointer transition-all hover:border-[#3B82F6]" style={cardStyle} onClick={() => setAdminScreen('campaignScreen' as any)}>
                  <div className="w-10 h-10 rounded-[10px] flex flex-col items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.1)' }}><span className="text-[15px] text-[var(--aw-text-primary)] leading-none" style={{ fontWeight: 800 }}>{e.day}</span></div>
                  <div className="flex-1 min-w-0"><div className="text-[13px] text-[var(--aw-text-primary)] truncate" style={{ fontWeight: 600 }}>{e.title}</div><div className="text-[11px] text-[var(--aw-text-muted)] mt-0.5"><i className="fa-regular fa-clock text-[9px] ml-1" />{e.time} • {e.date}</div></div>
                  <i className="fa-solid fa-chevron-left text-[11px] text-[var(--aw-text-muted)]" />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Recent performance */}
        <SectionHeader title="گزارش عملکرد اخیر" icon="fa-solid fa-chart-line" />
        <StateGate status={performance.status} error={performance.error} onRetry={() => reload('performance')}
          empty={<EmptyState icon="fa-solid fa-chart-line" title="داده عملکردی موجود نیست" />}>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {kpis.map((kpi, i) => (
              <div key={i} className="p-3 cursor-pointer transition-all hover:border-[#3B82F6]" style={cardStyle} onClick={() => openModal(kpi.label, <div className="space-y-2"><DetailRow label="مقدار" value={kpi.value} /><DetailRow label="تغییر" value={kpi.change} color={kpi.change.startsWith('-') ? '#EF4444' : '#10B981'} /><DetailRow label="توضیح" value={kpi.note} /></div>)}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${kpi.color}18` }}><i className={`${kpi.icon} text-[14px]`} style={{ color: kpi.color }} /></div>
                <div className="text-[20px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{kpi.value}</div>
                <div className="flex items-center gap-1.5 mt-0.5"><span className="text-[10px] text-[var(--aw-text-muted)]">{kpi.label}</span><span className="text-[10px]" style={{ color: kpi.change.startsWith('-') ? '#EF4444' : '#10B981', fontWeight: 600 }}><i className={`fa-solid ${kpi.change.startsWith('-') ? 'fa-arrow-down' : 'fa-arrow-up'} text-[7px] ml-0.5`} />{kpi.change}</span></div>
              </div>
            ))}
          </div>
          {insight && (
            <div className="p-3.5 rounded-[10px]" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12))', border: '1px solid rgba(59,130,246,0.25)' }}>
              <div className="flex items-center gap-1.5 mb-1.5 text-[12px]" style={{ color: MKT_BLUE, fontWeight: 700 }}><i className="fa-solid fa-lightbulb" />بینش هوش مصنوعی</div>
              <p className="text-[12px] text-[var(--aw-text-secondary)] m-0 leading-6">{insight}</p>
            </div>
          )}
        </StateGate>
      </div>
    </div>
  );
}

// ============================================================
// 6. MARKETING CALENDAR (تقویم بازاریابی)
// ============================================================
function EventForm({ initial, onDone, defaultDay }: { initial?: CalendarEvent; onDone: () => void; defaultDay?: number }) {
  const { closeModal } = useApp();
  const { run, svc, reload } = useMarketing();
  const [title, setTitle] = useState(initial?.title || '');
  const [type, setType] = useState<CalendarEvent['type']>(initial?.type || 'social');
  const [day, setDay] = useState(String(initial?.day || defaultDay || 1));
  const [time, setTime] = useState(initial?.time || '۰۹:۰۰');
  const [err, setErr] = useState('');
  const submit = () => {
    if (!title.trim()) { setErr('عنوان الزامی است'); return; }
    const payload = { title, type, day: parseInt(day) || 1, time, date: `${day} فروردین` };
    const op = initial ? () => svc.calendar.update(initial.id, payload) : () => svc.calendar.create(payload);
    run(initial ? 'ویرایش رویداد' : 'افزودن رویداد', op, () => { reload('calendar'); closeModal(); onDone(); });
  };
  return (
    <div className="space-y-2.5">
      <Field label="عنوان رویداد *"><input className={inputCls} style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} /></Field>
      <Field label="نوع"><select className={inputCls} style={inputStyle} value={type} onChange={e => setType(e.target.value as CalendarEvent['type'])}>{Object.entries(CALENDAR_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="روز ماه"><input className={inputCls} style={inputStyle} type="number" min={1} max={31} value={day} onChange={e => setDay(e.target.value)} /></Field>
        <Field label="ساعت"><input className={inputCls} style={inputStyle} value={time} onChange={e => setTime(e.target.value)} /></Field>
      </div>
      {err && <div className="text-[11px]" style={{ color: '#EF4444' }}>{err}</div>}
      <button className="w-full py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[13px]" style={{ background: MKT_BLUE, fontWeight: 700 }} onClick={submit}>{initial ? 'ذخیره' : 'افزودن رویداد'}</button>
    </div>
  );
}

const CAL_WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const CAL_MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const calToFa = (n: number | string) => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);

export function MktCalendarScreen() {
  const { openModal, closeModal, setAdminScreen, showToast } = useApp();
  const { calendar, run, svc, reload, confirmSensitive } = useMarketing();
  const [calMonth, setCalMonth] = useState(0);
  const [calYear, setCalYear] = useState(1404);

  const daysInMonth = calMonth <= 5 ? 31 : calMonth <= 10 ? 30 : 29;
  const startDow = calMonth === 11 ? 0 : (calMonth * 2 + 1) % 7;
  const weekCount = Math.ceil((startDow + daysInMonth) / 7);
  const isPrimaryMonth = calMonth === 0;
  const dotColors = (d: number) => isPrimaryMonth ? calendar.data.filter(e => e.day === d).map(e => e.color) : [];
  const gotoPrevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const gotoNextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };

  const openEvent = (e: CalendarEvent, onBack?: () => void) => {
    openModal(e.title, (
      <div className="space-y-3">
        <DetailRow label="نوع" value={CALENDAR_TYPE_LABELS[e.type]} color={e.color} />
        <DetailRow label="تاریخ" value={e.date} />
        <DetailRow label="ساعت" value={e.time} />
        <ModalActions actions={[
          { label: 'ویرایش', icon: 'fa-solid fa-pen', color: MKT_BLUE, onClick: () => openModal('ویرایش رویداد', <EventForm initial={e} onDone={() => {}} />) },
          { label: 'اتصال به کمپین', icon: 'fa-solid fa-link', color: '#8B5CF6', onClick: () => setAdminScreen('campaignScreen') },
          { label: 'تغییر زمان', icon: 'fa-solid fa-clock', color: '#F59E0B', onClick: () => openModal('تغییر زمان', <EventForm initial={e} onDone={() => {}} />) },
          { label: 'حذف', icon: 'fa-solid fa-trash', color: '#EF4444', onClick: () => confirmSensitive('external-report', () => run('حذف رویداد', () => svc.calendar.remove(e.id), () => reload('calendar'))) },
        ]} />
      </div>
    ), onBack || null);
  };

  const addEvent = (defaultDay?: number) => openModal('افزودن رویداد', <EventForm defaultDay={defaultDay} onDone={() => {}} />);

  const openDay = (d: number) => {
    const dayEvents = calendar.data.filter(e => e.day === d);
    openModal(`${calToFa(d)} ${CAL_MONTHS[calMonth]} ${calToFa(calYear)}`, (
      <div className="space-y-2.5">
        {dayEvents.length === 0 ? (
          <div className="p-5 flex flex-col items-center gap-2 text-[var(--aw-text-muted)]" style={cardStyle}>
            <i className="fa-solid fa-calendar-xmark text-[18px]" style={{ opacity: 0.4 }} />
            <span className="text-[11px]">رویدادی در این روز نیست</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {dayEvents.map(e => (
              <div key={e.id} className="p-3 flex items-center gap-3 cursor-pointer" style={{ ...cardStyle, borderRight: `3px solid ${e.color}` }} onClick={() => openEvent(e, () => openDay(d))}>
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: `${e.color}1a` }}><i className={`${e.icon} text-[15px]`} style={{ color: e.color }} /></div>
                <div className="flex-1 min-w-0"><div className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{e.title}</div><div className="text-[11px] text-[var(--aw-text-muted)]">{CALENDAR_TYPE_LABELS[e.type]} • {e.time}</div></div>
                <i className="fa-solid fa-chevron-left text-[11px] text-[var(--aw-text-muted)]" />
              </div>
            ))}
          </div>
        )}
        <button className="w-full py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[13px] flex items-center justify-center gap-2" style={{ background: MKT_BLUE, fontWeight: 700 }} onClick={() => addEvent(d)}><i className="fa-solid fa-plus text-[12px]" />افزودن رویداد به این روز</button>
      </div>
    ), closeModal);
  };

  const gridCols = '26px repeat(7, minmax(0,1fr))';
  const rows = Array.from({ length: weekCount }, (_, wi) =>
    Array.from({ length: 7 }, (_, c) => { const dn = wi * 7 - startDow + c + 1; return (dn >= 1 && dn <= daysInMonth) ? dn : null; })
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-1 flex items-center gap-2">
        <button className="w-9 h-9 rounded-[12px] flex items-center justify-center border border-[var(--aw-eu-nav-border)] bg-[var(--aw-eu-nav-bg)] backdrop-blur-xl cursor-pointer text-[var(--aw-text-secondary)]" onClick={() => setAdminScreen('campaignScreen')}><i className="fa-solid fa-arrow-right" /></button>
        <h2 className="text-[18px] text-[var(--aw-text-primary)] m-0 flex-1" style={{ fontWeight: 800 }}>تقویم</h2>
      </div>

      <TopCTABanner title="ایجاد رویداد جدید" subtitle="رویداد، جلسه یا زمان‌بندی جدید ثبت کنید" onClick={() => addEvent()} />

      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-24 aw-scroll">
        <StateGate status={calendar.status} error={calendar.error} onRetry={() => reload('calendar')} empty={<EmptyState icon="fa-solid fa-calendar" title="رویدادی ثبت نشده" ctaLabel="افزودن رویداد" onCta={() => addEvent()} />}>
          <div className="p-3" style={cardStyle}>
            <div className="flex items-center justify-between mb-3">
              <button className="w-8 h-8 rounded-lg border-none cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-bg-hover)' }} onClick={gotoPrevMonth}>
                <i className="fa-solid fa-chevron-right text-[11px] text-[var(--aw-text-muted)]" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{CAL_MONTHS[calMonth]}</span>
                <span className="text-[13px] text-[var(--aw-text-muted)]">{calToFa(calYear)}</span>
              </div>
              <button className="w-8 h-8 rounded-lg border-none cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-bg-hover)' }} onClick={gotoNextMonth}>
                <i className="fa-solid fa-chevron-left text-[11px] text-[var(--aw-text-muted)]" />
              </button>
            </div>
            <div className="grid mb-1" style={{ gridTemplateColumns: gridCols, gap: 4 }}>
              <div />
              {CAL_WEEKDAYS.map(wd => (
                <div key={wd} className="text-center text-[10px] text-[var(--aw-text-muted)] py-1" style={{ fontWeight: 600 }}>{wd}</div>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              {rows.map((week, wi) => (
                <div key={'w-' + wi} className="grid items-center" style={{ gridTemplateColumns: gridCols, gap: 4 }}>
                  <div className="h-9 rounded-lg flex items-center justify-center text-[10px]" style={{ background: 'color-mix(in srgb, ' + MKT_BLUE + ' 10%, transparent)', color: MKT_BLUE, fontWeight: 700 }}>ه{calToFa(wi + 1)}</div>
                  {week.map((d, c) => {
                    if (d === null) return <div key={'e-' + wi + '-' + c} className="h-9" />;
                    const cols = dotColors(d);
                    const isFriday = c === 6;
                    return (
                      <button key={d} className="h-9 rounded-lg border-none cursor-pointer flex flex-col items-center justify-center gap-0.5 transition-all relative" style={{ background: 'transparent', color: isFriday ? '#EF4444' : 'var(--aw-text-primary)', fontSize: 13 }} onClick={() => openDay(d)}>
                        {calToFa(d)}
                        {cols.length > 0 && (
                          <div className="flex gap-0.5 absolute bottom-0.5">
                            {cols.slice(0, 3).map((cc, ci) => <span key={ci} className="w-1 h-1 rounded-full" style={{ background: cc }} />)}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </StateGate>
      </div>
    </div>
  );
}
