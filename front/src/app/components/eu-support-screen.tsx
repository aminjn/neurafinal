import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './app-context';
import { api, getToken } from '../services/api';
import { toFa } from './data';
import { euCardStyle, AgentTabBar, StatusPill, SectionTitle, EmptyState } from './eu-agent-shared';

// =====================================================================
//  3.  SUPPORT SCREEN (پشتیبانی)
// =====================================================================
const SUPPORT_TABS = [
  { id: 'chat', icon: 'fa-solid fa-comments', label: 'گفتگو' },
  { id: 'tickets', icon: 'fa-solid fa-ticket', label: 'تیکت‌ها' },
  { id: 'call', icon: 'fa-solid fa-phone', label: 'تماس' },
  { id: 'faq', icon: 'fa-solid fa-circle-question', label: 'راهنما' },
  { id: 'feedback', icon: 'fa-solid fa-star', label: 'بازخورد' },
];

interface Ticket { id: number; code: string; title: string; status: 'open' | 'inprogress' | 'resolved' | 'closed'; priority: 'high' | 'medium' | 'low'; date: string; lastReply: string; department: string }

const INITIAL_TICKETS: Ticket[] = [];

const ticketStatusMap: Record<string, { color: string; label: string; icon: string }> = {
  open: { color: '#3B82F6', label: 'باز', icon: 'fa-solid fa-circle-dot' },
  inprogress: { color: '#F59E0B', label: 'در بررسی', icon: 'fa-solid fa-spinner' },
  resolved: { color: '#10B981', label: 'حل شده', icon: 'fa-solid fa-circle-check' },
  closed: { color: '#6B7280', label: 'بسته', icon: 'fa-solid fa-lock' },
};

interface FaqItem { id: number; q: string; a: string; category: string }

const FAQ_ITEMS: FaqItem[] = [
  { id: 1, q: 'چگونه سفارش خود را پیگیری کنم؟', a: 'از بخش سفارشات من، وضعیت سفارش‌تان را ببینید. همچنین می‌توانید با ربات پشتیبانی گفتگو کنید.', category: 'سفارش' },
  { id: 2, q: 'چگونه سفارش را لغو کنم؟', a: 'قبل از آماده‌سازی، می‌توانید از بخش سفارشات دکمه لغو را بزنید. بعد از آماده‌سازی با پشتیبانی تماس بگیرید.', category: 'سفارش' },
  { id: 3, q: 'روش‌های پرداخت چیست؟', a: 'پرداخت آنلاین، کارت‌خوان در محل و کیف پول الکترونیکی پشتیبانی می‌شود.', category: 'پرداخت' },
  { id: 4, q: 'زمان تحویل چقدر است؟', a: 'معمولاً ۲۰ تا ۴۵ دقیقه بسته به فاصله رستوران. در ساعات شلوغ ممکن است بیشتر شود.', category: 'تحویل' },
  { id: 5, q: 'چگونه آدرس تحویل را تغییر دهم؟', a: 'از بخش پروفایل > آدرس‌ها، آدرس جدید اضافه یا آدرس فعلی را ویرایش کنید.', category: 'حساب' },
  { id: 6, q: 'اگر غذا مشکل داشت چه کنم؟', a: 'در بخش تیکت‌ها یک درخواست جدید ثبت کنید یا با پشتیبانی تماس بگیرید. مبلغ بازگردانده می‌شود.', category: 'کیفیت' },
];

const SUPPORT_CHAT_MSGS = [];

const priColors: Record<string, { color: string; label: string }> = {
  high: { color: '#EF4444', label: 'فوری' },
  medium: { color: '#F59E0B', label: 'متوسط' },
  low: { color: '#10B981', label: 'عادی' },
};

function SupportTicketsTab() {
  const { showToast } = useApp();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  useEffect(() => { if (!getToken()) return; (async () => { try { const t: any = await (api as any).myList('tickets'); if (Array.isArray(t)) setTickets(t as any); } catch (_) {} })(); }, []);
  const [filter, setFilter] = useState('all');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDept, setNewDept] = useState('عمومی');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);
  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'inprogress').length;

  const submitTicket = () => {
    if (!newTitle.trim()) { showToast('لطفاً عنوان تیکت را وارد کنید'); return; }
    const newTicket: Ticket = {
      id: Date.now(),
      code: `TK-${toFa(4057 + tickets.length)}`,
      title: newTitle,
      status: 'open',
      priority: newPriority,
      date: 'الان',
      lastReply: '—',
      department: newDept,
    };
    setTickets(prev => [newTicket, ...prev]);
    (api as any).myCreate('tickets', newTicket).catch(() => {});
    setNewTitle('');
    setShowNewForm(false);
    showToast('تیکت جدید ثبت شد');
  };

  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll px-4 pt-3">
      {/* Filter pills */}
      <div className="flex gap-1.5 pb-3 overflow-x-auto">
        {[
          { id: 'all', label: `همه (${toFa(tickets.length)})` },
          { id: 'open', label: `باز (${toFa(openCount)})` },
          { id: 'inprogress', label: 'در بررسی' },
          { id: 'resolved', label: 'حل شده' },
        ].map(f => (
          <button key={f.id}
            className={`py-1.5 px-3 rounded-full border text-[10px] cursor-pointer transition-all whitespace-nowrap ${
              filter === f.id ? 'text-white border-transparent' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'
            }`}
            style={filter === f.id ? { background: 'var(--aw-eu-primary)', fontWeight: 600 } : { fontWeight: 500 }}
            onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* New ticket button or form */}
      <AnimatePresence mode="wait">
        {showNewForm ? (
          <motion.div key="form" className="p-3 mb-3" style={euCardStyle}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="text-[12px] text-[var(--aw-text-primary)] mb-2" style={{ fontWeight: 700 }}>ثبت تیکت جدید</div>
            <input className="w-full rounded-lg border border-[var(--aw-border)] px-3 py-2 text-[12px] text-[var(--aw-text-primary)] outline-none mb-2 placeholder:text-[var(--aw-text-muted)]"
              style={{ background: 'var(--aw-bg-input)' }} placeholder="عنوان مشکل..." value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <div className="flex gap-2 mb-2">
              <select className="flex-1 rounded-lg border border-[var(--aw-border)] px-2 py-2 text-[11px] text-[var(--aw-text-primary)] outline-none"
                style={{ background: 'var(--aw-bg-input)' }} value={newDept} onChange={e => setNewDept(e.target.value)}>
                <option value="عمومی">عمومی</option><option value="مالی">مالی</option><option value="لجستیک">لجستیک</option><option value="کیفیت">کیفیت</option>
              </select>
              <select className="flex-1 rounded-lg border border-[var(--aw-border)] px-2 py-2 text-[11px] text-[var(--aw-text-primary)] outline-none"
                style={{ background: 'var(--aw-bg-input)' }} value={newPriority} onChange={e => setNewPriority(e.target.value as 'high' | 'medium' | 'low')}>
                <option value="high">فوری</option><option value="medium">متوسط</option><option value="low">عادی</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-lg border-none text-white text-[11px] cursor-pointer" style={{ background: 'var(--aw-eu-primary)', fontWeight: 600 }} onClick={submitTicket}>
                <i className="fa-solid fa-paper-plane text-[9px] ml-1" />ارسال تیکت
              </button>
              <button className="py-2 px-3 rounded-lg border border-[var(--aw-border)] bg-transparent text-[var(--aw-text-muted)] text-[11px] cursor-pointer" onClick={() => setShowNewForm(false)}>انصراف</button>
            </div>
          </motion.div>
        ) : (
          <motion.button key="btn" className="w-full flex items-center justify-center gap-2 p-3 mb-3 rounded-xl border border-dashed border-[var(--aw-eu-primary)] bg-transparent text-[var(--aw-eu-primary)] text-[12px] cursor-pointer"
            style={{ fontWeight: 600 }} onClick={() => setShowNewForm(true)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <i className="fa-solid fa-plus" /> ثبت تیکت جدید
          </motion.button>
        )}
      </AnimatePresence>

      {filtered.map((tk, i) => {
        const st = ticketStatusMap[tk.status];
        const pr = priColors[tk.priority];
        return (
          <motion.div key={tk.id} className="p-3 mb-2" style={euCardStyle}
            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] text-[var(--aw-eu-primary)]" style={{ fontWeight: 700 }}>{tk.code}</span>
                  <StatusPill label={st.label} color={st.color} />
                  <StatusPill label={pr.label} color={pr.color} />
                </div>
                <div className="text-[13px] text-[var(--aw-text-primary)] mt-1" style={{ fontWeight: 600 }}>{tk.title}</div>
              </div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${st.color}12` }}>
                <i className={`${st.icon} text-[12px]`} style={{ color: st.color }} />
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[var(--aw-text-muted)]">
              <span><i className="fa-solid fa-building text-[8px] ml-1" />{tk.department}</span>
              <span><i className="fa-regular fa-clock text-[8px] ml-1" />{tk.date}</span>
              {tk.lastReply !== '—' && <span><i className="fa-solid fa-reply text-[8px] ml-1" />پاسخ: {tk.lastReply}</span>}
            </div>
          </motion.div>
        );
      })}
      {filtered.length === 0 && <EmptyState icon="fa-solid fa-ticket" text="تیکتی یافت نشد" />}
    </div>
  );
}

function SupportCallTab() {
  const { showToast, openUnifiedCall } = useApp();
  const [contacts, setContacts] = useState<any[]>([]);
  useEffect(() => { (api as any).getSettings().then((st: any) => { const lines = (st && Array.isArray(st.supportLines) && st.supportLines.length) ? st.supportLines : (st && st.supportPhone ? [{ icon: 'fa-solid fa-headset', label: 'پشتیبانی', desc: 'پاسخگویی', phone: st.supportPhone, color: '#3B82F6', available: true }] : []); setContacts(lines); }).catch(() => {}); }, []);
  // شماره‌گیریِ واقعی (tel:) — ارقامِ فارسی به لاتین. اگر شماره نبود، تماسِ درون‌برنامه.
  const dial = (phone: any) => { const p = String(phone || '').replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^\d+]/g, ''); if (p) { try { window.location.href = 'tel:' + p; return; } catch (_e) {} } openUnifiedCall(); };

  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll px-4 pt-3">
      <SectionTitle icon="fa-solid fa-phone-volume" title="تماس سریع" />
      {/* Emergency call banner */}
      <div className="p-3 mb-3 rounded-xl flex items-center gap-3 cursor-pointer" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        onClick={openUnifiedCall}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: '#EF4444' }}>
          <i className="fa-solid fa-phone-volume text-[16px]" />
        </div>
        <div className="flex-1">
          <div className="text-[13px] text-[#EF4444]" style={{ fontWeight: 700 }}>تماس فوری</div>
          <div className="text-[10px] text-[var(--aw-text-secondary)]">برای مشکلات فوری تماس بگیرید</div>
        </div>
        <i className="fa-solid fa-chevron-left text-[var(--aw-text-muted)]" />
      </div>

      {contacts.map((item, i) => (
        <motion.div key={i} className="flex items-center gap-3 p-3 mb-2 cursor-pointer" style={{ ...euCardStyle, opacity: item.available ? 1 : 0.5 }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: item.available ? 1 : 0.5, y: 0 }} transition={{ delay: i * 0.08 }}
          onClick={() => item.available ? dial(item.phone) : showToast('این واحد در حال حاضر در دسترس نیست')}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}15` }}>
            <i className={`${item.icon} text-[17px]`} style={{ color: item.color }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{item.label}</span>
              {item.available ? <StatusPill label="آنلاین" color="#10B981" /> : <StatusPill label="آفلاین" color="#6B7280" />}
            </div>
            <div className="text-[11px] text-[var(--aw-text-secondary)]">{item.desc}</div>
            <div className="text-[10px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-phone text-[8px] ml-1" />{item.phone}</div>
          </div>
          <button className="w-10 h-10 rounded-xl border-none text-white cursor-pointer flex items-center justify-center" style={{ background: item.available ? item.color : '#6B7280' }}
            onClick={(e) => { e.stopPropagation(); if (item.available) dial(item.phone); }}>
            <i className="fa-solid fa-phone text-[14px]" />
          </button>
        </motion.div>
      ))}
    </div>
  );
}

function SupportFaqTab() {
  const [open, setOpen] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [faqs, setFaqs] = useState<FaqItem[]>(FAQ_ITEMS);
  useEffect(() => { (api as any).getSettings().then((st: any) => { if (st && Array.isArray(st.faqItems) && st.faqItems.length) setFaqs(st.faqItems); }).catch(() => {}); }, []);
  const allCats = ['all', ...Array.from(new Set(faqs.map(f => f.category)))];
  const filtered = faqs.filter(f =>
    (catFilter === 'all' || f.category === catFilter) &&
    (!search || f.q.includes(search) || f.a.includes(search))
  );

  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll px-4 pt-3">
      <div className="flex items-center gap-2 rounded-xl px-3 border border-[var(--aw-border)] mb-2" style={{ background: 'var(--aw-bg-input)' }}>
        <i className="fa-solid fa-search text-sm text-[var(--aw-text-muted)]" />
        <input className="flex-1 bg-transparent border-none py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
          placeholder="جستجو در سوالات متداول..." value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button className="bg-transparent border-none text-[var(--aw-text-muted)] cursor-pointer" onClick={() => setSearch('')}><i className="fa-solid fa-times text-sm" /></button>}
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 pb-3 overflow-x-auto">
        {allCats.map(c => (
          <button key={c}
            className={`py-1 px-2.5 rounded-full border text-[10px] cursor-pointer transition-all whitespace-nowrap ${
              catFilter === c ? 'text-white border-transparent' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'
            }`}
            style={catFilter === c ? { background: 'var(--aw-eu-primary)', fontWeight: 600 } : { fontWeight: 500 }}
            onClick={() => setCatFilter(c)}>
            {c === 'all' ? 'همه' : c}
          </button>
        ))}
      </div>

      {filtered.map((faq, i) => (
        <motion.div key={faq.id} className="mb-2 cursor-pointer overflow-hidden" style={euCardStyle}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          onClick={() => setOpen(open === faq.id ? null : faq.id)}>
          <div className="flex items-center gap-2 p-3">
            <i className={`fa-solid ${open === faq.id ? 'fa-chevron-down' : 'fa-chevron-left'} text-[10px] text-[var(--aw-eu-primary)] transition-transform`} />
            <span className="flex-1 text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{faq.q}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-md flex-shrink-0" style={{ background: 'rgba(126,95,170,0.1)', color: 'var(--aw-eu-primary)' }}>{faq.category}</span>
          </div>
          <AnimatePresence>
            {open === faq.id && (
              <motion.div className="px-3 pb-3 text-[12px] text-[var(--aw-text-secondary)] pr-7"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ lineHeight: '1.8' }}>
                {faq.a}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
      {filtered.length === 0 && <EmptyState icon="fa-solid fa-circle-question" text="سوالی یافت نشد" />}
    </div>
  );
}

function SupportFeedbackTab() {
  const { showToast } = useApp();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  useEffect(() => { if (!getToken()) return; (async () => { try { const f: any = await (api as any).myList('feedback'); if (Array.isArray(f)) setFeedbacks(f.map((x: any) => ({ rating: x.rating, text: x.text, date: x.date || 'قبلاً' }))); } catch (_) {} })(); }, []);

  const ratingLabels = ['', 'خیلی بد', 'بد', 'متوسط', 'خوب', 'عالی'];
  const ratingEmojis = ['', '😞', '😕', '😐', '😊', '🤩'];

  const submitFeedback = () => {
    if (rating === 0) return;
    const fb = { id: 'fb_' + Date.now(), rating, text: text || '(بدون نظر)', date: 'الان', ts: Date.now() };
    setFeedbacks(prev => [fb, ...prev]);
    (api as any).myCreate('feedback', fb).catch(() => {});
    showToast('بازخورد شما ثبت شد. متشکریم!');
    setRating(0);
    setText('');
  };

  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll px-4 pt-3">
      <SectionTitle icon="fa-solid fa-star" title="امتیازدهی و بازخورد" />

      <div className="p-4 mb-4" style={euCardStyle}>
        <div className="text-center mb-4">
          <div className="text-[14px] text-[var(--aw-text-primary)] mb-3" style={{ fontWeight: 700 }}>تجربه شما چگونه بود؟</div>
          <div className="flex justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s}
                className="w-11 h-11 rounded-full border-2 cursor-pointer text-[18px] transition-all"
                style={{
                  background: s <= rating ? '#F59E0B' : 'transparent',
                  borderColor: s <= rating ? '#F59E0B' : 'var(--aw-border)',
                  color: s <= rating ? '#fff' : 'var(--aw-text-muted)',
                  transform: s === rating ? 'scale(1.15)' : 'scale(1)',
                }}
                onClick={() => setRating(s)}>
                <i className="fa-solid fa-star" />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <motion.div className="text-[13px] text-[var(--aw-text-primary)]" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
              <span className="text-[20px] ml-1">{ratingEmojis[rating]}</span>
              <span style={{ fontWeight: 600 }}>{ratingLabels[rating]}</span>
            </motion.div>
          )}
        </div>

        <textarea
          className="w-full rounded-xl border border-[var(--aw-border)] p-3 text-[12px] text-[var(--aw-text-primary)] outline-none resize-none placeholder:text-[var(--aw-text-muted)]"
          style={{ background: 'var(--aw-bg-input)', minHeight: 80 }}
          placeholder="نظر یا پیشنهاد خود را بنویسید..."
          value={text} onChange={e => setText(e.target.value)}
        />

        <button
          className="w-full mt-3 py-3 rounded-xl border-none text-white text-[13px] cursor-pointer flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, var(--aw-eu-primary), #ec4899)', fontWeight: 600, opacity: rating === 0 ? 0.5 : 1 }}
          disabled={rating === 0}
          onClick={submitFeedback}>
          <i className="fa-solid fa-paper-plane" /> ارسال بازخورد
        </button>
      </div>

      {feedbacks.length > 0 && (
        <>
          <SectionTitle icon="fa-solid fa-clock-rotate-left" title="بازخوردهای قبلی" />
          {feedbacks.map((fb, i) => (
            <motion.div key={i} className="p-3 mb-2" style={euCardStyle}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <i key={s} className={`fa-solid fa-star text-[10px] ${s <= fb.rating ? 'text-[#F59E0B]' : 'text-[var(--aw-text-muted)]'}`} />
                ))}
                <span className="text-[9px] text-[var(--aw-text-muted)] mr-2">{fb.date}</span>
              </div>
              <div className="text-[12px] text-[var(--aw-text-secondary)]">{fb.text}</div>
            </motion.div>
          ))}
        </>
      )}
    </div>
  );
}

function SupportNewChat({ loadMessages = null, loadSignal = 0 }: { loadMessages?: { from: 'user' | 'agent'; text: string }[] | null; loadSignal?: number }) {
  const [messages, setMessages] = useState<{ from: 'user' | 'agent'; text: string }[]>([]);
  const [inputText, setInputText] = useState('');
  // suppchatpersist: گفتگوی پشتیبانی per-user ذخیره/بازیابی می‌شود تا با بستن/بازکردنِ اپ نپرد.
  const __supLoaded = useRef(false);
  useEffect(() => { if (!getToken()) return; (async () => { try { const v: any = await (api as any).myList('support_msgs'); if (Array.isArray(v) && v.length) setMessages(v as any); } catch (_) {} __supLoaded.current = true; })(); }, []);
  useEffect(() => { if (!__supLoaded.current || !getToken()) return; const h = setTimeout(() => { (api as any).myBulkSave('support_msgs', messages).catch(() => {}); }, 600); return () => clearTimeout(h); }, [messages]);

  useEffect(() => {
    if (loadSignal === 0) return;
    setMessages(loadMessages || []);
    setInputText('');
  }, [loadSignal]);

  const AGENT_REPLIES = [
    'متوجه شدم. بذارید بررسی کنم...',
    'مشکلتون رو ثبت کردم. پیگیری می‌کنم.',
    'بله، الان وضعیت سفارش رو چک می‌کنم.',
    'تیکت شما ثبت شد. به‌زودی پاسخ می‌دیم.',
    'مبلغ به کیف پول شما بازگردانده شد.',
  ];

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    const userMsg = inputText.trim();
    setInputText('');
    const hist = [...messages, { from: 'user', text: userMsg }].map((m: any) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));
    setMessages(prev => [...prev, { from: 'user', text: userMsg }]);
    try {
      const r: any = await (api as any).chat('support', hist);
      const reply = (r && r.ok && r.text) ? String(r.text) : AGENT_REPLIES[0];
      setMessages(prev => [...prev, { from: 'agent', text: reply }]);
    } catch { setMessages(prev => [...prev, { from: 'agent', text: AGENT_REPLIES[0] }]); }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-3 aw-scroll space-y-2">
        {messages.length === 0 && (
          <motion.div className="flex flex-col items-center justify-center h-full text-center py-12"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#f43f5e18' }}>
              <i className="fa-solid fa-headset text-[28px]" style={{ color: '#f43f5e' }} />
            </div>
            <h3 className="text-[15px] text-[var(--aw-text-primary)] mb-1" style={{ fontWeight: 700 }}>گفتگوی جدید</h3>
            <p className="text-[12px] text-[var(--aw-text-muted)] max-w-[220px]">سوال یا مشکلی دارید؟ تیم پشتیبانی آماده کمک است.</p>
            <div className="flex flex-wrap justify-center gap-1.5 mt-4">
              {['مشکل در پرداخت دارم', 'سفارشم کجاست؟', 'درخواست بازگشت وجه'].map((suggestion, i) => (
                <button key={i} className="px-3 py-1.5 rounded-full border border-[var(--aw-border)] bg-transparent text-[11px] text-[var(--aw-text-secondary)] cursor-pointer hover:border-[#f43f5e] hover:text-[#f43f5e] transition-all"
                  onClick={() => { setInputText(suggestion); }}>
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
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[8px]" style={{ background: '#f43f5e' }}>
                    <i className="fa-solid fa-headset" />
                  </div>
                  <span className="text-[10px] text-[var(--aw-text-muted)]" style={{ fontWeight: 600 }}>پشتیبان Neura</span>
                </div>
              )}
              <span style={{ lineHeight: '1.7' }}>{m.text}</span>
            </div>
          </motion.div>
        ))}
      </div>
      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--aw-border)]">
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
          <input className="flex-1 bg-transparent border-none py-2.5 text-[12px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
            placeholder="پیام خود را بنویسید..." value={inputText} onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }} />
        </div>
        <button className="w-10 h-10 rounded-xl border-none text-white cursor-pointer flex items-center justify-center text-[14px]"
          style={{ background: '#f43f5e' }}
          onClick={sendMessage}>
          <i className="fa-solid fa-paper-plane" />
        </button>
      </div>
    </div>
  );
}

export function EuSupportScreen() {
  const { setEuScreen, openChat, showToast } = useApp();
  const [tab, setTab] = useState('chat');
  const [showTopics, setShowTopics] = useState(false);
  const [topicMsgs, setTopicMsgs] = useState<{ from: 'user' | 'agent'; text: string }[] | null>(null);
  const [loadSignal, setLoadSignal] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);
  useEffect(() => { if (!getToken()) return; (async () => { try { const t: any = await (api as any).myList('tickets'); if (Array.isArray(t)) setOpenTickets(t.filter((x: any) => x.status === 'open' || x.status === 'inprogress').length); } catch (_) {} })(); }, []);

  const supportTabs = SUPPORT_TABS.map(t => t.id === 'tickets' ? { ...t, badge: openTickets } : t);

  // supportreal: «پرونده‌ها» = گفتگوهای واقعیِ پشتیبانیِ همین کاربر از سرور (نه پیام‌های هاردکد).
  const [__supTopics, setSupTopics] = useState<any[]>([]);
  useEffect(() => {
    if (!getToken() || !showTopics) return;
    (async () => { try { const r: any = await (api as any).chatSessions('support'); const arr = r && Array.isArray(r.sessions) ? r.sessions : (Array.isArray(r) ? r : []); setSupTopics(arr); } catch (_) {} })();
  }, [showTopics]);
  const SUPPORT_TOPICS = __supTopics.map((s: any) => ({ id: s.id, title: s.title || 'گفتگو', date: s.date || '', msgs: s.count || 0, active: false }));

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-header)' }}>
        <button onClick={() => setEuScreen('euHomeScreen')} title="بازگشت"
          className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center"
          style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-eu-primary)' }}>
          <i className="fa-solid fa-arrow-right text-[14px]" />
        </button>
        <div className="flex items-center gap-1.5">
        <button className="w-8 h-8 rounded-xl border border-[var(--aw-border)] bg-transparent cursor-pointer flex items-center justify-center text-[var(--aw-text-secondary)] hover:text-[#f43f5e] hover:border-[#f43f5e] transition-all relative"
          onClick={() => setShowTopics(!showTopics)}>
          <i className="fa-solid fa-folder-open text-[13px]" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px]" style={{ background: '#f43f5e', fontWeight: 700 }}>{SUPPORT_TOPICS.length}</span>
        </button>
        <button className="w-8 h-8 rounded-xl border border-[var(--aw-border)] bg-transparent cursor-pointer flex items-center justify-center text-[var(--aw-text-secondary)] hover:text-[#f43f5e] hover:border-[#f43f5e] transition-all"
          onClick={() => { openChat('support', 'eu'); }}>
          <i className="fa-solid fa-plus text-[13px]" />
        </button>
        </div>
      </div>

      <AgentTabBar tabs={supportTabs} active={tab} onChange={setTab} asFooter />

      {/* Topics drawer */}
      <AnimatePresence>
        {showTopics && (
          <>
          <motion.div className="absolute inset-0 z-20"
            style={{ background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            onClick={() => setShowTopics(false)} />
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4 pointer-events-none">
          <motion.div className="w-[340px] max-w-[92%] max-h-[82%] flex flex-col rounded-2xl overflow-hidden pointer-events-auto"
            style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
            initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.2 }}>
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--aw-border)] flex-shrink-0">
              <span className="text-[13px] text-[var(--aw-text-primary)] flex items-center gap-1.5" style={{ fontWeight: 700 }}>
                <i className="fa-solid fa-folder-open text-[12px]" style={{ color: '#f43f5e' }} /> پرونده‌ها
              </span>
              <button className="text-[11px] px-2.5 py-1 rounded-lg border-none cursor-pointer text-white flex items-center gap-1"
                style={{ background: '#f43f5e', fontWeight: 600 }}
                onClick={() => { showToast('پرونده جدید ایجاد شد'); setShowTopics(false); openChat('support', 'eu'); }}>
                <i className="fa-solid fa-plus text-[9px]" /> جدید
              </button>
            </div>
            <div className="overflow-y-auto aw-scroll">
            {SUPPORT_TOPICS.map(topic => (
              <button key={topic.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 border-none bg-transparent cursor-pointer text-right transition-all hover:bg-[rgba(244,63,94,0.08)]"
                style={topic.active ? { background: 'rgba(244,63,94,0.1)' } : {}}
                onClick={async () => { setShowTopics(false); setTab('chat'); try { const d: any = await (api as any).chatSession('support', topic.id); const msgs = (d && Array.isArray(d.messages) ? d.messages : []).map((m: any) => ({ from: m.role === 'user' ? 'user' : 'agent', text: String(m.content || '') })); setTopicMsgs(msgs); } catch (_) { setTopicMsgs([]); } setLoadSignal(s => s + 1); }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: topic.active ? '#f43f5e22' : 'var(--aw-bg-app)' }}>
                  <i className={`fa-solid ${topic.active ? 'fa-comment-dots' : 'fa-file-lines'} text-[12px]`}
                    style={{ color: topic.active ? '#f43f5e' : 'var(--aw-text-muted)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-[var(--aw-text-primary)] truncate" style={{ fontWeight: topic.active ? 700 : 500 }}>{topic.title}</div>
                  <div className="text-[10px] text-[var(--aw-text-muted)]">{topic.date} · {topic.msgs} پیام</div>
                </div>
                {topic.active && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#f43f5e' }} />}
              </button>
            ))}
            </div>
          </motion.div>
          </div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.div key={tab} className="flex-1 flex flex-col min-h-0 pb-[60px]"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
          {tab === 'chat' && <SupportNewChat loadMessages={topicMsgs} loadSignal={loadSignal} />}
          {tab === 'tickets' && <SupportTicketsTab />}
          {tab === 'call' && <SupportCallTab />}
          {tab === 'faq' && <SupportFaqTab />}
          {tab === 'feedback' && <SupportFeedbackTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
