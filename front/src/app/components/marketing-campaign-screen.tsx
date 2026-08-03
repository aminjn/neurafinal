import React, { useState } from 'react';

function __dlCsv(filename: string, rows: any[]): boolean {
  try {
    if (!rows || !rows.length) return false;
    const headers = Object.keys(rows[0]);
    const esc = (v: any) => '"' + String(v == null ? '' : (typeof v === 'object' ? JSON.stringify(v) : v)).replace(/"/g, '""') + '"';
    const csv = [headers.join(','), ...rows.map((r: any) => headers.map((h) => esc(r[h])).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (_) { return false; }
}
function __pickFile(accept: string, cb: (name: string) => void) {
  try { const i = document.createElement('input'); i.type = 'file'; if (accept) i.accept = accept; i.onchange = () => { const f = (i.files && i.files[0]); if (f) cb(f.name); }; i.click(); } catch (_) {}
}
function __speak(text: string) {
  try { const u = new SpeechSynthesisUtterance(text); u.lang = 'fa-IR'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (_) {}
}
function __recMic(onOk: () => void, onErr: () => void) {
  try { (navigator as any).mediaDevices.getUserMedia({ audio: true }).then((st: any) => { onOk(); try { st.getTracks().forEach((t: any) => setTimeout(() => t.stop(), 4000)); } catch (_) {} }).catch(() => onErr()); } catch (_) { onErr(); }
}
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './app-context';
import { JalaliDatePicker } from './jalali-datepicker'; // mktform
import { useMarketing } from './marketing-context';
import { StateGate, EmptyState } from './marketing-ui';
import { TopCTABanner } from './marketing-screens';
import { toFa } from './data';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';
import {
  MKT_BLUE, MKT_GRAD, type Campaign,
  CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS, CAMPAIGN_TYPE_LABELS, CAMPAIGN_TYPE_ICONS,
  CAMPAIGN_PERFORMANCE_DATA, CHANNEL_DATA,
} from './marketing-data';

const staggerContainer = { animate: { transition: { staggerChildren: 0.06 } } };
const fadeInUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } };

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[10px] px-3 py-2 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-modal)', direction: 'rtl', boxShadow: 'var(--aw-shadow-sm)' }}>
      <div className="text-[11px] text-[var(--aw-text-muted)] mb-1">{label}</div>
      {payload.map((p: any, i: number) => (<div key={i} className="text-[12px] flex items-center gap-1.5" style={{ color: p.color, fontWeight: 600 }}><span className="w-2 h-2 rounded-full" style={{ background: p.color }} />{p.name}: {toFa(p.value)}</div>))}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 rounded-[10px] text-[13px] outline-none';
const inputStyle: React.CSSProperties = { background: 'var(--aw-bg-input)', border: '1px solid var(--aw-border)', color: 'var(--aw-text-primary)' };

const CAMPAIGN_TEMPLATES = [
  { id: 'occasion', label: 'کمپین مناسبتی', icon: 'fa-solid fa-gift', color: '#EC4899' },
  { id: 'discount', label: 'تخفیف فروش', icon: 'fa-solid fa-tags', color: '#F59E0B' },
  { id: 'launch', label: 'لانچ محصول', icon: 'fa-solid fa-rocket', color: '#3B82F6' },
  { id: 'awareness', label: 'آگاهی از برند', icon: 'fa-solid fa-bullhorn', color: '#8B5CF6' },
  { id: 'retention', label: 'حفظ مشتری', icon: 'fa-solid fa-heart', color: '#10B981' },
  { id: 'lead', label: 'جذب لید', icon: 'fa-solid fa-magnet', color: '#06B6D4' },
];
const CAMPAIGN_CHANNELS = [
  { id: 'call', label: 'تلفنی', icon: 'fa-solid fa-phone' },
  { id: 'sms', label: 'پیامک', icon: 'fa-solid fa-comment-sms' },
  { id: 'email', label: 'ایمیل', icon: 'fa-solid fa-envelope' },
  { id: 'social', label: 'سوشال مدیا', icon: 'fa-solid fa-hashtag' },
  { id: 'push', label: 'نوتیفیکیشن', icon: 'fa-solid fa-bell' },
  { id: 'whatsapp', label: 'واتساپ', icon: 'fa-brands fa-whatsapp' },
];
const CAMPAIGN_SEGMENTS = ['کسب‌وکارهای کوچک', 'شرکت‌های متوسط', 'سازمان‌های بزرگ', 'فریلنسرها', 'مشتریان وفادار', 'مشتریان غیرفعال'];
const CAMPAIGN_PRODUCTS = ['اشتراک پایه', 'اشتراک حرفه‌ای', 'اشتراک سازمانی', 'افزونه گزارش‌گیری', 'ماژول CRM', 'خدمات پیاده‌سازی'];

// mktform: Field در سطحِ ماژول (هویتِ پایدار) تا فوکوسِ input با هر کیبوردزنی نپرد.
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-[11px] text-[var(--aw-text-muted)] mb-1">{label}</div>{children}</div>;
}

function CampaignForm({ onDone }: { onDone: () => void }) {
  const { closeModal, showToast } = useApp();
  const { run, svc, reload } = useMarketing();
  const [step, setStep] = useState(1);
  const [err, setErr] = useState('');
  // step 1
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('discount');
  const [goal, setGoal] = useState('');
  const [products, setProducts] = useState<string[]>([]);
  // step 2
  const [segment, setSegment] = useState(CAMPAIGN_SEGMENTS[0]);
  const [channels, setChannels] = useState<string[]>(['sms']);
  const [content, setContent] = useState('');
  // step 3
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');

  const grp = (s: string) => { const n = s.replace(/[^\d]/g, ''); return n ? Number(n).toLocaleString('en-US').replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]) : ''; };
  const toggleArr = (arr: string[], v: string, set: (x: string[]) => void) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  const chanLabels = () => channels.map(c => CAMPAIGN_CHANNELS.find(x => x.id === c)?.label).filter(Boolean).join('، ');
  const typeMap: Record<string, Campaign['type']> = { call: 'ads', sms: 'sms', email: 'email', social: 'social', push: 'ads', whatsapp: 'social' };

  const next = () => {
    setErr('');
    if (step === 1) { if (!name.trim()) { setErr('نام کمپین الزامی است'); return; } setStep(2); return; }
    if (step === 2) { if (channels.length === 0) { setErr('حداقل یک کانال اجرا انتخاب کنید'); return; } setStep(3); return; }
  };
  const submit = (publish: boolean) => {
    const tpl = CAMPAIGN_TEMPLATES.find(t => t.id === template)?.label || '';
    run(publish ? 'ساخت و انتشار' : 'ذخیره پیش‌نویس',
      () => svc.campaigns.create({ name, type: typeMap[channels[0]] || 'social', goal: goal || tpl, segment, channel: chanLabels(), budget, status: publish ? 'active' : 'draft' }),
      () => { reload('campaigns'); closeModal(); onDone(); });
  };

  const Steps = () => (
    <div className="flex items-center gap-1.5 mb-3">
      {[1, 2, 3].map(s => (
        <React.Fragment key={s}>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px]" style={{ background: step >= s ? MKT_BLUE : 'var(--aw-bg-hover)', color: step >= s ? '#fff' : 'var(--aw-text-muted)', fontWeight: 800 }}>{step > s ? <i className="fa-solid fa-check text-[9px]" /> : s}</div>
            <span className="text-[10px]" style={{ color: step === s ? 'var(--aw-text-primary)' : 'var(--aw-text-muted)', fontWeight: step === s ? 700 : 500 }}>{s === 1 ? 'پایه' : s === 2 ? 'مخاطب و محتوا' : 'زمان و بودجه'}</span>
          </div>
          {s < 3 && <div className="flex-1 h-px" style={{ background: step > s ? MKT_BLUE : 'var(--aw-border)' }} />}
        </React.Fragment>
      ))}
    </div>
  );
  return (
    <div className="space-y-2.5">
      <Steps />
      {step === 1 && (<>
        <Field label="نام کمپین *"><input className={inputCls} style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="مثلاً جشنواره نوروزی" /></Field>
        <Field label="نوع کمپین">
          <div className="grid grid-cols-3 gap-2">
            {CAMPAIGN_TEMPLATES.map(t => {
              const on = template === t.id;
              return (
                <button key={t.id} onClick={() => setTemplate(t.id)} className="aw-no-pill p-2.5 rounded-[10px] border cursor-pointer flex flex-col items-center gap-1.5" style={{ background: on ? `${t.color}18` : 'var(--aw-bg-card)', borderColor: on ? t.color : 'var(--aw-border)' }}>
                  <i className={`${t.icon} text-[15px]`} style={{ color: t.color }} />
                  <span className="text-[10px] text-center leading-tight" style={{ color: 'var(--aw-text-primary)', fontWeight: on ? 700 : 500 }}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="هدف کمپین"><input className={inputCls} style={inputStyle} value={goal} onChange={e => setGoal(e.target.value)} placeholder="مثلاً افزایش فروش ۲۰٪" /></Field>
        <Field label="انتخاب محصولات">
          <div className="flex flex-wrap gap-1.5">
            {CAMPAIGN_PRODUCTS.map(p => {
              const on = products.includes(p);
              return <button key={p} onClick={() => toggleArr(products, p, setProducts)} className="text-[11px] px-2.5 py-1.5 rounded-full border cursor-pointer" style={{ background: on ? `${MKT_BLUE}18` : 'var(--aw-bg-card)', borderColor: on ? MKT_BLUE : 'var(--aw-border)', color: on ? MKT_BLUE : 'var(--aw-text-secondary)', fontWeight: on ? 700 : 500 }}>{on && <i className="fa-solid fa-check text-[8px] ml-1" />}{p}</button>;
            })}
          </div>
        </Field>
      </>)}
      {step === 2 && (<>
        <Field label="انتخاب سگمنت">
          <select className={inputCls} style={inputStyle} value={segment} onChange={e => setSegment(e.target.value)}>{CAMPAIGN_SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}</select>
        </Field>
        <Field label="کانال اجرا (چند انتخابی)">
          <div className="grid grid-cols-3 gap-2">
            {CAMPAIGN_CHANNELS.map(c => {
              const on = channels.includes(c.id);
              return (
                <button key={c.id} onClick={() => toggleArr(channels, c.id, setChannels)} className="aw-no-pill p-2.5 rounded-[10px] border cursor-pointer flex flex-col items-center gap-1.5" style={{ background: on ? `${MKT_BLUE}18` : 'var(--aw-bg-card)', borderColor: on ? MKT_BLUE : 'var(--aw-border)' }}>
                  <i className={`${c.icon} text-[15px]`} style={{ color: on ? MKT_BLUE : 'var(--aw-text-muted)' }} />
                  <span className="text-[10px]" style={{ color: 'var(--aw-text-primary)', fontWeight: on ? 700 : 500 }}>{c.label}</span>
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="محتوای کمپین"><textarea className={inputCls} style={{ ...inputStyle, minHeight: 72, resize: 'none' }} value={content} onChange={e => setContent(e.target.value)} placeholder="متن پیام / محتوای کمپین را بنویسید…" /></Field>
      </>)}
      {step === 3 && (<>
        <div className="grid grid-cols-2 gap-2">
          <Field label="تاریخ شروع"><JalaliDatePicker value={startDate} onChange={setStartDate} placeholder="۱۴۰۵/۰۱/۰۱" className={inputCls} /></Field>
          <Field label="تاریخ پایان"><JalaliDatePicker value={endDate} onChange={setEndDate} placeholder="۱۴۰۵/۰۱/۱۵" className={inputCls} /></Field>
        </div>
        <Field label="بودجه (تومان)"><input className={inputCls} style={inputStyle} inputMode="numeric" value={budget} onChange={e => setBudget(grp(e.target.value))} placeholder="۵۰,۰۰۰,۰۰۰" /></Field>
        <div className="p-3 rounded-[10px] text-[11px] space-y-1" style={{ background: 'var(--aw-bg-hover)' }}>
          <div className="text-[12px] mb-1" style={{ fontWeight: 700, color: 'var(--aw-text-primary)' }}>خلاصه کمپین</div>
          <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">نام</span><span style={{ fontWeight: 600 }}>{name || '—'}</span></div>
          <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">نوع</span><span style={{ fontWeight: 600 }}>{CAMPAIGN_TEMPLATES.find(t => t.id === template)?.label}</span></div>
          <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">سگمنت</span><span style={{ fontWeight: 600 }}>{segment}</span></div>
          <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">کانال‌ها</span><span style={{ fontWeight: 600 }}>{chanLabels() || '—'}</span></div>
        </div>
      </>)}
      {err && <div className="text-[11px]" style={{ color: '#EF4444' }}>{err}</div>}
      <div className="flex gap-2 pt-1">
        {step > 1 && <button className="py-2.5 px-4 rounded-[10px] cursor-pointer text-[12px]" style={{ background: 'var(--aw-bg-hover)', border: '1px solid var(--aw-border)', color: 'var(--aw-text-primary)', fontWeight: 600 }} onClick={() => { setErr(''); setStep(step - 1); }}><i className="fa-solid fa-arrow-right ml-1" />قبلی</button>}
        {step < 3
          ? <button className="flex-1 py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[12px]" style={{ background: MKT_BLUE, fontWeight: 700 }} onClick={next}>مرحله بعد<i className="fa-solid fa-arrow-left mr-1" /></button>
          : (<>
            <button className="flex-1 py-2.5 rounded-[10px] cursor-pointer text-[12px]" style={{ background: 'var(--aw-bg-hover)', border: '1px solid var(--aw-border)', color: 'var(--aw-text-primary)', fontWeight: 600 }} onClick={() => submit(false)}><i className="fa-solid fa-floppy-disk ml-1" />پیش‌نویس</button>
            <button className="flex-1 py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[12px]" style={{ background: MKT_BLUE, fontWeight: 700 }} onClick={() => submit(true)}><i className="fa-solid fa-rocket ml-1" />اجرا و انتشار</button>
          </>)}
      </div>
    </div>
  );
}

const DETAIL_TABS = [
  { id: 'overview', label: 'نمای کلی' }, { id: 'audience', label: 'مخاطبان' }, { id: 'content', label: 'محتوا' },
  { id: 'performance', label: 'عملکرد' }, { id: 'budget', label: 'بودجه' }, { id: 'ai', label: 'تحلیل AI' },
];

function CampaignDetail({ campaign }: { campaign: Campaign }) {
  const { showToast } = useApp();
  const { run, svc, reload, confirmSensitive } = useMarketing();
  const [tab, setTab] = useState('overview');
  const st = CAMPAIGN_STATUS_COLORS[campaign.status];
  const Row = ({ l, v, c }: { l: string; v: string; c?: string }) => (<div className="flex justify-between text-[13px] py-1"><span className="text-[var(--aw-text-muted)]">{l}</span><span style={{ color: c || 'var(--aw-text-primary)', fontWeight: 600 }}>{v}</span></div>);
  return (
    <div className="space-y-3">
      <div className="flex gap-1 overflow-x-auto aw-scroll pb-1">
        {DETAIL_TABS.map(t => (<button key={t.id} className="flex-shrink-0 py-1.5 px-3 rounded-full text-[11px] border-none cursor-pointer" style={tab === t.id ? { background: MKT_BLUE, color: '#fff', fontWeight: 600 } : { background: 'var(--aw-bg-hover)', color: 'var(--aw-text-muted)', fontWeight: 600 }} onClick={() => setTab(t.id)}>{t.label}</button>))}
      </div>
      {tab === 'overview' && (<div className="p-3 rounded-[10px]" style={{ background: 'var(--aw-bg-hover)' }}><Row l="هدف" v={campaign.goal} /><Row l="کانال" v={campaign.channel} /><Row l="سگمنت" v={campaign.segment} /><Row l="وضعیت" v={CAMPAIGN_STATUS_LABELS[campaign.status]} c={st.text} /><Row l="بودجه کل" v={`${campaign.budget} ت`} /><Row l="بودجه مصرف‌شده" v={`${campaign.spent} ت`} /><Row l="تبدیل" v={campaign.conversions} /><Row l="هزینه جذب" v={campaign.cpa !== '—' ? campaign.cpa + ' ت' : '—'} c="#F59E0B" /><Row l="درآمد حاصل" v={campaign.revenue !== '—' ? campaign.revenue + ' ت' : '—'} c="#10B981" /><Row l="ROI / ROAS" v={campaign.roi} c="#10B981" /><Row l="بازه زمانی" v={`${campaign.startDate} — ${campaign.endDate}`} /></div>)}
      {tab === 'audience' && (<div className="p-3 rounded-[10px]" style={{ background: 'var(--aw-bg-hover)' }}><Row l="سگمنت هدف" v={campaign.segment} /><Row l="بازدید" v={campaign.reach} /><Row l="کلیک" v={campaign.clicks} /><Row l="مسئول" v={campaign.owner} /></div>)}
      {tab === 'content' && (<div className="p-3 rounded-[10px] text-[12px] text-[var(--aw-text-secondary)] leading-6" style={{ background: 'var(--aw-bg-hover)' }}><div className="text-[12px] mb-1" style={{ fontWeight: 700, color: 'var(--aw-text-primary)' }}>محتوای کمپین ({CAMPAIGN_TYPE_LABELS[campaign.type]})</div>محتوای فعال این کمپین در کانال {campaign.channel} منتشر شده است.</div>)}
      {tab === 'performance' && (<div className="grid grid-cols-2 gap-2">{[{ l: 'بازدید', v: campaign.reach }, { l: 'کلیک', v: campaign.clicks }, { l: 'تبدیل', v: campaign.conversions }, { l: 'ROI', v: campaign.roi }].map((m, i) => (<div key={i} className="text-center p-3 rounded-lg" style={{ background: 'var(--aw-bg-hover)' }}><div className="text-[16px]" style={{ fontWeight: 700, color: MKT_BLUE }}>{m.v}</div><div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">{m.l}</div></div>))}</div>)}
      {tab === 'budget' && (<div className="p-3 rounded-[10px]" style={{ background: 'var(--aw-bg-hover)' }}><div className="flex justify-between text-[11px] text-[var(--aw-text-muted)] mb-1.5"><span>مصرف بودجه</span><span>{campaign.spent} / {campaign.budget}</span></div><div className="h-2.5 rounded-full overflow-hidden mb-3" style={{ background: 'var(--aw-bg-input)' }}><div className="h-full rounded-full" style={{ width: `${Math.min(100, (parseFloat((campaign.spent || '').replace(/[^\d]/g, '')) / Math.max(1, parseFloat((campaign.budget || '').replace(/[^\d]/g, '')))) * 100)}%`, background: MKT_GRAD }} /></div><button className="w-full py-2.5 rounded-[10px] border-none cursor-pointer text-[12px] text-white" style={{ background: '#F59E0B', fontWeight: 600 }} onClick={() => confirmSensitive('increase-budget', () => run('افزایش بودجه', () => svc.campaigns.increaseBudget(campaign.id, '۶۰,۰۰۰,۰۰۰'), () => reload('campaigns')))}><i className="fa-solid fa-plus ml-1" />افزایش بودجه</button></div>)}
      {tab === 'ai' && (<div className="p-3 rounded-[10px]" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}><div className="flex items-center gap-1.5 mb-1 text-[12px]" style={{ color: MKT_BLUE, fontWeight: 700 }}><i className="fa-solid fa-wand-magic-sparkles" />تحلیل هوش مصنوعی</div><button className="mt-1 px-3 py-1.5 rounded-lg border-none cursor-pointer text-white text-[11px]" style={{ background: MKT_BLUE, fontWeight: 600 }} onClick={() => run('تحلیل کمپین', () => svc.ai.generate('analyze-campaign', { id: campaign.id }))}>دریافت تحلیل AI</button></div>)}

      <div className="h-px w-full" style={{ background: 'var(--aw-border)' }} />
      <div className="grid grid-cols-2 gap-2">
        {campaign.status === 'active' && <button className="py-2.5 rounded-[10px] text-[12px] text-white cursor-pointer border-none" style={{ background: '#f59e0b', fontWeight: 600 }} onClick={() => confirmSensitive('pause-campaign', () => run('توقف کمپین', () => svc.campaigns.pause(campaign.id), () => reload('campaigns')))}><i className="fa-solid fa-pause ml-1" />توقف</button>}
        {campaign.status === 'paused' && <button className="py-2.5 rounded-[10px] text-[12px] text-white cursor-pointer border-none" style={{ background: '#10b981', fontWeight: 600 }} onClick={() => run('ادامه کمپین', () => svc.campaigns.resume(campaign.id), () => reload('campaigns'))}><i className="fa-solid fa-play ml-1" />ادامه</button>}
        {campaign.status === 'draft' && <button className="py-2.5 rounded-[10px] text-[12px] text-white cursor-pointer border-none" style={{ background: MKT_BLUE, fontWeight: 600 }} onClick={() => confirmSensitive('publish-campaign', () => run('انتشار کمپین', () => svc.campaigns.publish(campaign.id), () => reload('campaigns')))}><i className="fa-solid fa-rocket ml-1" />انتشار</button>}
        <button className="py-2.5 rounded-[10px] text-[12px] text-white cursor-pointer border-none" style={{ background: 'var(--aw-primary)', fontWeight: 600 }} onClick={() => run('ویرایش کمپین', () => svc.campaigns.update(campaign.id, { name: campaign.name }), () => reload('campaigns'))}><i className="fa-solid fa-pen ml-1" />ویرایش</button>
        <button className="py-2.5 rounded-[10px] text-[12px] text-white cursor-pointer border-none" style={{ background: '#8B5CF6', fontWeight: 600 }} onClick={() => run('کپی کمپین', () => svc.campaigns.duplicate(campaign.id), () => reload('campaigns'))}><i className="fa-solid fa-clone ml-1" />کپی</button>
        <button className="py-2.5 rounded-[10px] text-[12px] text-white cursor-pointer border-none" style={{ background: '#06B6D4', fontWeight: 600 }} onClick={() => { const ok = __dlCsv('campaign-' + campaign.id + '.csv', [{ name: campaign.name, type: campaign.type, status: campaign.status, goal: campaign.goal, segment: campaign.segment, channel: campaign.channel, budget: campaign.budget, spent: campaign.spent, reach: campaign.reach, clicks: campaign.clicks, conversions: campaign.conversions, cpa: campaign.cpa, revenue: campaign.revenue, roi: campaign.roi, startDate: campaign.startDate, endDate: campaign.endDate }]); showToast(ok ? 'گزارش کمپین دانلود شد ✅' : 'خطا در تولید گزارش'); }}><i className="fa-solid fa-file-lines ml-1" />گزارش</button>
      </div>
    </div>
  );
}

export default function MarketingCampaignScreen() {
  const { openModal, setAdminScreen } = useApp();
  const { campaigns, reload } = useMarketing();
  const [filter, setFilter] = useState<'all' | 'active' | 'scheduled' | 'paused' | 'completed' | 'draft'>('all');
  const [view, setView] = useState<'list' | 'analytics'>('list');
  const [ctaOpen, setCtaOpen] = useState(false);

  const data = campaigns.data;
  const filtered = data.filter(c => filter === 'all' || c.status === filter);
  const activeCount = data.filter(c => c.status === 'active').length;

  const filters = [
    { id: 'all' as const, label: 'همه' }, { id: 'active' as const, label: 'فعال' }, { id: 'scheduled' as const, label: 'زمان‌بندی شده' },
    { id: 'completed' as const, label: 'تکمیل' }, { id: 'paused' as const, label: 'متوقف' }, { id: 'draft' as const, label: 'پیش‌نویس' },
  ];

  const createManual = () => openModal('ساخت کمپین جدید', <CampaignForm onDone={() => {}} />);

  return (
    <div className="flex flex-col h-full relative">
      <motion.div className="grid grid-cols-4 gap-2 px-4 pt-3 pb-2" variants={staggerContainer} initial="initial" animate="animate">
        <motion.button variants={fadeInUp} onClick={() => setAdminScreen('mktCalendarScreen')} className="aw-no-pill p-2 border cursor-pointer flex flex-col items-center justify-center gap-1.5 aspect-square" style={{ borderRadius: 6, background: `color-mix(in srgb, ${MKT_BLUE} 16%, transparent)`, borderColor: `color-mix(in srgb, ${MKT_BLUE} 40%, transparent)`, color: MKT_BLUE, backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}><i className="fa-solid fa-calendar text-[18px]" /><div className="text-[10px]" style={{ fontWeight: 600 }}>تقویم</div></motion.button>
        <motion.div variants={fadeInUp} className="p-2 border text-center flex flex-col items-center justify-center aspect-square" style={{ borderRadius: 8, background: 'var(--aw-eu-nav-bg)', borderColor: 'var(--aw-eu-nav-border)', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}><div className="text-[16px]" style={{ color: '#10b981', fontWeight: 700 }}>۰</div><div className="text-[10px] text-[var(--aw-text-muted)]">سود خالص</div></motion.div>
        <motion.div variants={fadeInUp} className="p-2 border text-center flex flex-col items-center justify-center aspect-square" style={{ borderRadius: 8, background: 'var(--aw-eu-nav-bg)', borderColor: 'var(--aw-eu-nav-border)', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}><div className="text-[15px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>۰</div><div className="text-[10px] text-[var(--aw-text-muted)]">بودجه بازاریابی</div></motion.div>
        <motion.div variants={fadeInUp} className="p-2 border text-center flex flex-col items-center justify-center aspect-square" style={{ borderRadius: 8, background: 'var(--aw-eu-nav-bg)', borderColor: 'var(--aw-eu-nav-border)', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}><div className="text-[17px]" style={{ color: '#10b981', fontWeight: 700 }}>۰٪</div><div className="text-[10px] text-[var(--aw-text-muted)]">میانگین ROI</div></motion.div>
      </motion.div>

      <div className="px-4 pb-2">
        <div className="flex gap-1.5 overflow-x-auto aw-noscroll" style={{ flexWrap: 'nowrap' }}>{filters.map(f => (<button key={f.id} className={`py-1.5 px-3 rounded-[20px] border text-[11px] cursor-pointer transition-all whitespace-nowrap flex-shrink-0 ${filter === f.id ? 'text-white' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'}`} style={filter === f.id ? { background: MKT_BLUE, borderColor: MKT_BLUE, fontWeight: 600 } : { fontWeight: 600 }} onClick={() => setFilter(f.id)}>{f.label}</button>))}</div>
      </div>
      <TopCTABanner title="ساخت کمپین جدید" subtitle="کمپین بازاریابی جدید راه‌اندازی کنید" onClick={createManual} />

      <div className="flex-1 overflow-y-auto px-4 pb-32 aw-scroll">
        <StateGate status={campaigns.status} error={campaigns.error} onRetry={() => reload('campaigns')} empty={<EmptyState icon="fa-solid fa-bullhorn" title="کمپینی وجود ندارد" ctaLabel="ساخت کمپین جدید" onCta={createManual} />}>
          <AnimatePresence mode="wait">
            {view === 'list' ? (
              <motion.div key="list" variants={staggerContainer} initial="initial" animate="animate" exit={{ opacity: 0 }}>
                {filtered.length === 0 ? <EmptyState icon="fa-solid fa-filter" title="کمپینی در این دسته نیست" /> : filtered.map(campaign => {
                  const stColor = CAMPAIGN_STATUS_COLORS[campaign.status];
                  return (
                    <motion.div key={campaign.id} variants={fadeInUp} className="rounded-[10px] p-3.5 mb-2.5 border border-[var(--aw-border)] cursor-pointer transition-all hover:border-[#3B82F6]" style={{ background: 'var(--aw-bg-card)' }} onClick={() => openModal(campaign.name, <CampaignDetail campaign={campaign} />)}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: stColor.bg }}><i className={`${CAMPAIGN_TYPE_ICONS[campaign.type]} text-[14px]`} style={{ color: stColor.text }} /></div><div><div className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{campaign.name}</div><div className="text-[11px] text-[var(--aw-text-muted)]">{CAMPAIGN_TYPE_LABELS[campaign.type]} • {campaign.channel}</div></div></div>
                        <span className="text-[10px] px-2.5 py-1 rounded-full" style={{ background: stColor.bg, color: stColor.text, fontWeight: 600 }}>{CAMPAIGN_STATUS_LABELS[campaign.status]}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="text-center"><div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{campaign.spent}</div><div className="text-[9px] text-[var(--aw-text-muted)]">بودجه مصرفی</div></div>
                        <div className="text-center"><div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{campaign.conversions}</div><div className="text-[9px] text-[var(--aw-text-muted)]">تبدیل</div></div>
                        <div className="text-center"><div className="text-[12px]" style={{ color: (campaign.roi || '').startsWith('-') ? '#EF4444' : '#10b981', fontWeight: 600 }}>{campaign.roi}</div><div className="text-[9px] text-[var(--aw-text-muted)]">ROI</div></div>
                      </div>
                      {campaign.status !== 'draft' && (<div className="mt-2.5"><div className="flex justify-between text-[10px] text-[var(--aw-text-muted)] mb-1"><span>درصد مصرف بودجه</span></div><div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--aw-bg-input)' }}><motion.div className="h-full rounded-full" style={{ background: MKT_GRAD }} initial={{ width: 0 }} animate={{ width: `${Math.min(100, (parseFloat((campaign.spent || '').replace(/[^\d]/g, '')) / Math.max(1, parseFloat((campaign.budget || '').replace(/[^\d]/g, '')))) * 100)}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} /></div></div>)}
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div key="analytics" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="rounded-[10px] p-3.5 mb-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
                  <div className="text-[13px] text-[var(--aw-text-primary)] mb-3" style={{ fontWeight: 600 }}><i className="fa-solid fa-chart-area ml-1.5" style={{ color: MKT_BLUE }} /> عملکرد کلی کمپین‌ها</div>
                  <div style={{ width: '100%', height: 200 }}><ResponsiveContainer><AreaChart data={CAMPAIGN_PERFORMANCE_DATA}><defs><linearGradient id="campReach" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3B82F6" stopOpacity={0} /></linearGradient><linearGradient id="campConv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="var(--aw-border)" /><XAxis dataKey="month" tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} reversed /><YAxis tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={40} /><Tooltip content={<ChartTooltip />} /><Area type="monotone" dataKey="reach" name="بازدید" stroke="#3B82F6" fill="url(#campReach)" strokeWidth={2} /><Area type="monotone" dataKey="clicks" name="کلیک" stroke="#f59e0b" fill="transparent" strokeWidth={2} strokeDasharray="5 5" /><Area type="monotone" dataKey="conversions" name="تبدیل" stroke="#10b981" fill="url(#campConv)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div>
                </div>
                <div className="rounded-[10px] p-3.5 mb-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
                  <div className="text-[13px] text-[var(--aw-text-primary)] mb-3" style={{ fontWeight: 600 }}><i className="fa-solid fa-chart-pie ml-1.5 text-[#22A6F0]" /> توزیع کانال‌ها</div>
                  <div className="flex items-center"><div style={{ width: 140, height: 140 }}><ResponsiveContainer><PieChart><Pie data={CHANNEL_DATA} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">{CHANNEL_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip content={<ChartTooltip />} /></PieChart></ResponsiveContainer></div><div className="flex-1 pr-4 space-y-2">{CHANNEL_DATA.map((ch, i) => <div key={i} className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: ch.color }} /><span className="text-[11px] text-[var(--aw-text-secondary)]">{ch.name}</span></div><span className="text-[11px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{toFa(ch.value)}٪</span></div>)}</div></div>
                </div>
                <div className="rounded-[10px] p-3.5 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
                  <div className="text-[13px] text-[var(--aw-text-primary)] mb-3" style={{ fontWeight: 600 }}><i className="fa-solid fa-trophy ml-1.5 text-[#f59e0b]" /> بهترین عملکرد</div>
                  {data.filter(c => c.status !== 'draft').sort((a, b) => (parseFloat((b.roi || '').replace(/[^\d.]/g, '')) || 0) - (parseFloat((a.roi || '').replace(/[^\d.]/g, '')) || 0)).slice(0, 3).map((c, i) => (<div key={c.id} className="flex items-center justify-between py-2 border-b border-[var(--aw-border)] last:border-b-0"><div className="flex items-center gap-2"><span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] text-white" style={{ background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : '#CD7F32', fontWeight: 700 }}>{toFa(i + 1)}</span><div><div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{c.name}</div><div className="text-[10px] text-[var(--aw-text-muted)]">{c.channel}</div></div></div><span className="text-[12px]" style={{ color: '#10b981', fontWeight: 700 }}>{c.roi}</span></div>))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </StateGate>
      </div>
    </div>
  );
}
