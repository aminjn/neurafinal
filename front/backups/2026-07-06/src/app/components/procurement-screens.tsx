import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './app-context';
import { QuickForm } from './quick-actions';

// ========================
// SHARED STYLES
// ========================
const cardStyle: React.CSSProperties = {
  background: 'var(--aw-bg-card)',
  borderRadius: 10,
  border: '1px solid var(--aw-border)',
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
const REQ_TABS = [
  { id: 'all', label: 'همه', icon: 'fa-solid fa-list' },
  { id: 'new', label: 'جدید', icon: 'fa-solid fa-wand-magic-sparkles' },
  { id: 'pending', label: 'انتظار', icon: 'fa-solid fa-hourglass-half' },
  { id: 'approved', label: 'تأیید', icon: 'fa-solid fa-check' },
  { id: 'rejected', label: 'رد', icon: 'fa-solid fa-xmark' },
];

type ReqStatus = 'new' | 'pending' | 'approved' | 'rejected';

interface PurchaseRequest {
  id: number;
  code: string;
  title: string;
  unit: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  budget: string;
  status: ReqStatus;
  date: string;
  requester: string;
  items: number;
  hasAttachment: boolean;
}

const MOCK_REQUESTS: PurchaseRequest[] = [
  { id: 1, code: 'PR-۱۰۸۵', title: 'خرید لوازم بسته‌بندی', unit: 'انبار', urgency: 'critical', budget: '۴۵,۰۰۰,۰۰۰', status: 'new', date: 'امروز ۰۹:۳۰', requester: 'احمد رضایی', items: 5, hasAttachment: true },
  { id: 2, code: 'PR-۱۰۸۴', title: 'تأمین مواد اولیه تولید', unit: 'تولید', urgency: 'high', budget: '۱۲۰,۰۰۰,۰۰۰', status: 'pending', date: 'دیروز', requester: 'مریم کریمی', items: 8, hasAttachment: true },
  { id: 3, code: 'PR-۱۰۸۳', title: 'خرید تجهیزات اداری', unit: 'اداری', urgency: 'medium', budget: '۱۸,۰۰۰,۰۰۰', status: 'approved', date: '۲ روز پیش', requester: 'سارا احمدی', items: 12, hasAttachment: false },
  { id: 4, code: 'PR-۱۰۸۲', title: 'سفارش قطعات یدکی', unit: 'فنی', urgency: 'high', budget: '۶۵,۰۰۰,۰۰۰', status: 'approved', date: '۳ روز پیش', requester: 'رضا حسینی', items: 3, hasAttachment: true },
  { id: 5, code: 'PR-۱۰۸۱', title: 'خرید لوازم پذیرایی', unit: 'اداری', urgency: 'low', budget: '۵,۵۰۰,۰۰۰', status: 'rejected', date: '۴ روز پیش', requester: 'فاطمه نوری', items: 7, hasAttachment: false },
  { id: 6, code: 'PR-۱۰۸۰', title: 'تأمین نرم‌افزار امنیتی', unit: 'فناوری', urgency: 'critical', budget: '۳۵,۰۰۰,۰۰۰', status: 'new', date: 'امروز ۱۱:۰۰', requester: 'علی بهرامی', items: 2, hasAttachment: true },
];

const reqStatusColors: Record<ReqStatus, { color: string; label: string }> = {
  new: { color: '#3B82F6', label: 'جدید' },
  pending: { color: '#F59E0B', label: 'در انتظار تأیید' },
  approved: { color: '#10B981', label: 'تأیید شده' },
  rejected: { color: '#EF4444', label: 'رد شده' },
};

const urgencyColors: Record<string, { color: string; label: string }> = {
  critical: { color: '#EF4444', label: 'بحرانی' },
  high: { color: '#F97316', label: 'فوری' },
  medium: { color: '#F59E0B', label: 'متوسط' },
  low: { color: '#10B981', label: 'عادی' },
};

export function ProcRequestsScreen() {
  const { showToast, openModal } = useApp();
  const [tab, setTab] = useState('all');
  const filtered = tab === 'all' ? MOCK_REQUESTS : MOCK_REQUESTS.filter(r => r.status === tab);

  return (
    <div className="flex flex-col h-full">
      {/* Summary */}
      <div className="flex gap-2 px-4 mt-3">
        {([
          { label: 'جدید', count: MOCK_REQUESTS.filter(r => r.status === 'new').length, color: '#3B82F6', icon: 'fa-solid fa-wand-magic-sparkles' },
          { label: 'انتظار', count: MOCK_REQUESTS.filter(r => r.status === 'pending').length, color: '#F59E0B', icon: 'fa-solid fa-hourglass-half' },
          { label: 'تأیید', count: MOCK_REQUESTS.filter(r => r.status === 'approved').length, color: '#10B981', icon: 'fa-solid fa-check-circle' },
          { label: 'رد', count: MOCK_REQUESTS.filter(r => r.status === 'rejected').length, color: '#EF4444', icon: 'fa-solid fa-times-circle' },
        ]).map((s, i) => (
          <motion.div key={i} className="flex-1 p-2 flex flex-col items-center gap-0.5" style={{ ...cardStyle, borderRadius: 8 }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <i className={`${s.icon} text-[14px]`} style={{ color: s.color }} />
            <span className="text-[16px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{s.count}</span>
            <span className="text-[9px] text-[var(--aw-text-muted)]">{s.label}</span>
          </motion.div>
        ))}
      </div>

      <TabBar tabs={REQ_TABS} active={tab} onChange={setTab} />

      <div className="flex-1 overflow-y-auto px-4 pb-24 aw-scroll">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2">
            {filtered.map(req => {
              const st = reqStatusColors[req.status];
              const urg = urgencyColors[req.urgency];
              return (
                <div key={req.id} className="p-3" style={cardStyle}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] text-[var(--aw-primary)]" style={{ fontWeight: 700 }}>{req.code}</span>
                        <StatusBadge label={st.label} color={st.color} />
                        <StatusBadge label={urg.label} color={urg.color} />
                      </div>
                      <div className="text-[13px] text-[var(--aw-text-primary)] mt-1" style={{ fontWeight: 600 }}>{req.title}</div>
                    </div>
                    {req.hasAttachment && (
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--aw-primary-bg)' }}>
                        <i className="fa-solid fa-paperclip text-[11px] text-[var(--aw-primary)]" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-[10px] text-[var(--aw-text-muted)]">
                    <span><i className="fa-solid fa-building text-[8px] ml-1" />{req.unit}</span>
                    <span><i className="fa-solid fa-user text-[8px] ml-1" />{req.requester}</span>
                    <span><i className="fa-solid fa-boxes-stacked text-[8px] ml-1" />{req.items} قلم</span>
                    <span><i className="fa-regular fa-clock text-[8px] ml-1" />{req.date}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--aw-border)]">
                    <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>
                      <i className="fa-solid fa-coins text-[10px] ml-1 text-[#F59E0B]" />{req.budget} <span className="text-[10px] text-[var(--aw-text-muted)]">تومان</span>
                    </span>
                    {req.status === 'new' && (
                      <button onClick={() => showToast('درخواست در حال بررسی')} className="text-[10px] px-3 py-1.5 rounded-lg border-none cursor-pointer text-white" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
                        بررسی
                      </button>
                    )}
                    {req.status === 'approved' && (
                      <button onClick={() => openModal('ثبت سفارش خرید', <QuickForm submitLabel="ثبت سفارش" toast="سفارش خرید ثبت شد" fields={[{ key: 'supplier', label: 'تأمین‌کننده' }, { key: 'qty', label: 'تعداد' }, { key: 'date', label: 'تاریخ تحویل', type: 'date' }]} />)} className="text-[10px] px-3 py-1.5 rounded-lg border-none cursor-pointer text-white" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
                        <i className="fa-solid fa-cart-plus text-[8px] ml-1" />ثبت سفارش
                      </button>
                    )}
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
  { id: 'proforma', label: 'پیش‌فاکتور', icon: 'fa-solid fa-file-lines' },
  { id: 'registered', label: 'ثبت‌شده', icon: 'fa-solid fa-check' },
  { id: 'supplying', label: 'تأمین', icon: 'fa-solid fa-truck' },
  { id: 'cancelled', label: 'لغو', icon: 'fa-solid fa-ban' },
];

type OrderStatus = 'proforma' | 'registered' | 'supplying' | 'cancelled';

interface ProcOrder {
  id: number;
  code: string;
  supplier: string;
  amount: string;
  deliveryDate: string;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  status: OrderStatus;
  items: number;
  date: string;
}

const MOCK_ORDERS: ProcOrder[] = [
  { id: 1, code: 'PO-۲۰۴۵', supplier: 'شرکت آلفا تأمین', amount: '۱۲۰,۰۰۰,۰۰۰', deliveryDate: '۱۴۰۴/۱۲/۱۵', paymentStatus: 'partial', status: 'supplying', items: 8, date: '۳ روز پیش' },
  { id: 2, code: 'PO-۲۰۴۴', supplier: 'صنایع بتا', amount: '۴۵,۰۰۰,۰۰۰', deliveryDate: '۱۴۰۴/۱۲/۱۰', paymentStatus: 'unpaid', status: 'registered', items: 5, date: '۵ روز پیش' },
  { id: 3, code: 'PO-۲۰۴۳', supplier: 'تجارت گاما', amount: '۲۸,۰۰۰,۰۰۰', deliveryDate: '۱۴۰۴/۱۲/۲۰', paymentStatus: 'unpaid', status: 'proforma', items: 12, date: 'امروز' },
  { id: 4, code: 'PO-۲۰۴۲', supplier: 'پخش دلتا', amount: '۶۵,۰۰۰,۰۰۰', deliveryDate: '۱۴۰۴/۱۲/۰۸', paymentStatus: 'paid', status: 'supplying', items: 3, date: 'هفته پیش' },
  { id: 5, code: 'PO-۲۰۴۱', supplier: 'شرکت اپسیلون', amount: '۱۵,۰۰۰,۰۰۰', deliveryDate: '—', paymentStatus: 'unpaid', status: 'cancelled', items: 7, date: '۲ هفته پیش' },
  { id: 6, code: 'PO-۲۰۴۰', supplier: 'واردات زتا', amount: '۸۵,۰۰۰,۰۰۰', deliveryDate: '۱۴۰۴/۱۲/۱۸', paymentStatus: 'partial', status: 'registered', items: 4, date: 'دیروز' },
];

const ordStatusColors: Record<OrderStatus, { color: string; label: string; icon: string }> = {
  proforma: { color: '#8B5CF6', label: 'پیش‌فاکتور', icon: 'fa-solid fa-file-lines' },
  registered: { color: '#3B82F6', label: 'ثبت شده', icon: 'fa-solid fa-check-circle' },
  supplying: { color: '#F97316', label: 'در حال تأمین', icon: 'fa-solid fa-truck' },
  cancelled: { color: '#EF4444', label: 'لغو شده', icon: 'fa-solid fa-ban' },
};

const payStatusColors: Record<string, { color: string; label: string }> = {
  paid: { color: '#10B981', label: 'پرداخت شده' },
  partial: { color: '#F59E0B', label: 'نیمه‌پرداخت' },
  unpaid: { color: '#EF4444', label: 'پرداخت نشده' },
};

export function ProcOrdersScreen() {
  const [tab, setTab] = useState('all');
  const filtered = tab === 'all' ? MOCK_ORDERS : MOCK_ORDERS.filter(o => o.status === tab);

  return (
    <div className="flex flex-col h-full">
      <TabBar tabs={ORD_TABS} active={tab} onChange={setTab} />

      <div className="flex-1 overflow-y-auto px-4 pb-24 aw-scroll">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2">
            {filtered.map((ord, i) => {
              const st = ordStatusColors[ord.status];
              const ps = payStatusColors[ord.paymentStatus];
              return (
                <motion.div key={ord.id} className="p-3" style={cardStyle}
                  initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[var(--aw-primary)]" style={{ fontWeight: 700 }}>{ord.code}</span>
                        <StatusBadge label={st.label} color={st.color} />
                      </div>
                      <div className="text-[13px] text-[var(--aw-text-primary)] mt-1" style={{ fontWeight: 600 }}>
                        <i className="fa-solid fa-building text-[10px] ml-1 text-[var(--aw-text-muted)]" />{ord.supplier}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{ord.amount}</span>
                      <span className="text-[9px] text-[var(--aw-text-muted)]">تومان</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-[10px] text-[var(--aw-text-muted)]">
                    <span><i className="fa-solid fa-boxes-stacked text-[8px] ml-1" />{ord.items} قلم</span>
                    <span><i className="fa-solid fa-calendar-check text-[8px] ml-1" />تحویل: {ord.deliveryDate}</span>
                    <StatusBadge label={ps.label} color={ps.color} />
                  </div>

                  {/* Progress Step Indicator */}
                  <div className="flex items-center gap-0 mt-3 px-1">
                    {['پیش‌فاکتور', 'ثبت', 'تأمین', 'تحویل'].map((step, si) => {
                      const stepMap: Record<OrderStatus, number> = { proforma: 0, registered: 1, supplying: 2, cancelled: -1 };
                      const activeStep = stepMap[ord.status];
                      const isActive = activeStep >= si;
                      const isCancelled = ord.status === 'cancelled';
                      return (
                        <div key={si} style={{ display: 'contents' }}>
                          <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px]" style={{
                              background: isCancelled ? 'rgba(239,68,68,0.15)' : isActive ? 'var(--aw-primary)' : 'var(--aw-bg-hover)',
                              color: isCancelled ? '#EF4444' : isActive ? '#fff' : 'var(--aw-text-muted)',
                            }}>
                              {isCancelled ? <i className="fa-solid fa-xmark" /> : isActive ? <i className="fa-solid fa-check" /> : (si + 1)}
                            </div>
                            <span className="text-[8px] text-[var(--aw-text-muted)]">{step}</span>
                          </div>
                          {si < 3 && (
                            <div className="flex-1 h-0.5 mx-1 rounded-full" style={{
                              background: isCancelled ? 'rgba(239,68,68,0.2)' : (activeStep > si ? 'var(--aw-primary)' : 'var(--aw-bg-hover)'),
                              marginBottom: 14,
                            }} />
                          )}
                        </div>
                      );
                    })}
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

const MOCK_DELIVERIES: Delivery[] = [
  { id: 1, orderCode: 'PO-۲۰۴۵', supplier: 'شرکت آلفا تأمین', expectedDate: '۱۴۰۴/۱۲/۱۵', receivedDate: '—', status: 'awaiting', totalItems: 8, receivedItems: 0, note: 'ارسال شده از مبدأ' },
  { id: 2, orderCode: 'PO-۲۰۴۲', supplier: 'پخش دلتا', expectedDate: '۱۴۰۴/۱۲/۰۸', receivedDate: '۱۴۰۴/۱۲/۰۷', status: 'partial', totalItems: 3, receivedItems: 2, note: '۱ قلم در ارسال مجدد' },
  { id: 3, orderCode: 'PO-۲۰۳۹', supplier: 'تأمین‌کار اتا', expectedDate: '۱۴۰۴/۱۲/۰۵', receivedDate: '۱۴۰۴/۱۲/۰۵', status: 'complete', totalItems: 6, receivedItems: 6, note: 'تحویل کامل ✓' },
  { id: 4, orderCode: 'PO-۲۰۳۸', supplier: 'صنایع بتا', expectedDate: '۱۴۰۴/۱۲/۰۳', receivedDate: '۱۴۰۴/۱۲/۰۴', status: 'discrepancy', totalItems: 10, receivedItems: 8, note: '۲ قلم آسیب‌دیده — مرجوعی ثبت شد' },
  { id: 5, orderCode: 'PO-۲۰۳۷', supplier: 'واردات زتا', expectedDate: '۱۴۰۴/۱۲/۰۱', receivedDate: '۱۴۰۴/۱۲/۰۱', status: 'complete', totalItems: 4, receivedItems: 4, note: 'ورود به انبار ثبت شد' },
  { id: 6, orderCode: 'PO-۲۰۴۴', supplier: 'صنایع بتا', expectedDate: '۱۴۰۴/۱۲/۱۰', receivedDate: '—', status: 'awaiting', totalItems: 5, receivedItems: 0, note: 'در انتظار ارسال' },
];

const delStatusColors: Record<DeliveryStatus, { color: string; label: string; icon: string }> = {
  awaiting: { color: '#F59E0B', label: 'در انتظار تحویل', icon: 'fa-solid fa-clock' },
  partial: { color: '#3B82F6', label: 'تحویل جزئی', icon: 'fa-solid fa-circle-half-stroke' },
  complete: { color: '#10B981', label: 'تحویل کامل', icon: 'fa-solid fa-circle-check' },
  discrepancy: { color: '#EF4444', label: 'مغایرت / مرجوعی', icon: 'fa-solid fa-triangle-exclamation' },
};

export function ProcDeliveryScreen() {
  const [tab, setTab] = useState('all');
  const filtered = tab === 'all' ? MOCK_DELIVERIES : MOCK_DELIVERIES.filter(d => d.status === tab);

  return (
    <div className="flex flex-col h-full">
      <TabBar tabs={DEL_TABS} active={tab} onChange={setTab} />

      <div className="flex-1 overflow-y-auto px-4 pb-24 aw-scroll">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2">
            {filtered.map((del, i) => {
              const st = delStatusColors[del.status];
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

const MOCK_PROC_FINANCE: ProcFinanceItem[] = [
  { id: 1, invoiceCode: 'INV-۵۰۲۱', supplier: 'شرکت آلفا تأمین', totalAmount: '۱۲۰,۰۰۰,۰۰۰', paidAmount: '۶۰,۰۰۰,۰۰۰', remainingAmount: '۶۰,۰۰۰,۰۰۰', status: 'pending', dueDate: '۱۴۰۴/۱۲/۲۰', orderCode: 'PO-۲۰۴۵' },
  { id: 2, invoiceCode: 'INV-۵۰۲۰', supplier: 'پخش دلتا', totalAmount: '۶۵,۰۰۰,۰۰۰', paidAmount: '۶۵,۰۰۰,۰۰۰', remainingAmount: '۰', status: 'paid', dueDate: '۱۴۰۴/۱۲/۰۵', orderCode: 'PO-۲۰۴۲' },
  { id: 3, invoiceCode: 'INV-۵۰۱۹', supplier: 'صنایع بتا', totalAmount: '۴۵,۰۰۰,۰۰۰', paidAmount: '۰', remainingAmount: '۴۵,۰۰۰,۰۰۰', status: 'debt', dueDate: '۱۴۰۴/۱۱/۲۸', orderCode: 'PO-۲۰۴۴' },
  { id: 4, invoiceCode: 'INV-۵۰۱۸', supplier: 'تأمین‌کار اتا', totalAmount: '۳۲,۰۰۰,۰۰۰', paidAmount: '۳۲,۰۰۰,۰۰۰', remainingAmount: '۰', status: 'paid', dueDate: '۱۴۰۴/۱۱/۲۵', orderCode: 'PO-۲۰۳۹' },
  { id: 5, invoiceCode: 'INV-۵۰۱۷', supplier: 'واردات زتا', totalAmount: '۸۵,۰۰۰,۰۰۰', paidAmount: '۲۵,۰۰۰,۰۰۰', remainingAmount: '۶۰,۰۰۰,۰۰۰', status: 'debt', dueDate: '۱۴۰۴/۱۲/۱۰', orderCode: 'PO-۲۰۴۰' },
];

const finStatusColors: Record<FinStatus, { color: string; label: string }> = {
  paid: { color: '#10B981', label: 'تسویه شده' },
  pending: { color: '#F59E0B', label: 'در انتظار پرداخت' },
  debt: { color: '#EF4444', label: 'بدهکار' },
};

export function ProcFinanceScreen() {
  const { openModal } = useApp();
  const [tab, setTab] = useState('all');
  const filtered = tab === 'all' ? MOCK_PROC_FINANCE : MOCK_PROC_FINANCE.filter(f => f.status === tab);

  // Summary calc
  const totalDebt = '۱۰۵,۰۰۰,۰۰۰';
  const totalPending = '۶۰,۰۰۰,۰۰۰';
  const totalPaid = '۱۵۷,۰۰۰,۰۰۰';

  return (
    <div className="flex flex-col h-full">
      {/* Summary */}
      <div className="flex gap-2 px-4 mt-3">
        {([
          { label: 'پرداخت شده', value: totalPaid, color: '#10B981', icon: 'fa-solid fa-check-circle' },
          { label: 'در انتظار', value: totalPending, color: '#F59E0B', icon: 'fa-solid fa-hourglass-half' },
          { label: 'بدهی', value: totalDebt, color: '#EF4444', icon: 'fa-solid fa-exclamation-triangle' },
        ]).map((s, i) => (
          <motion.div key={i} className="flex-1 p-2.5 flex flex-col items-center gap-1" style={{ ...cardStyle, borderRadius: 8 }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <i className={`${s.icon} text-[14px]`} style={{ color: s.color }} />
            <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{s.value}</span>
            <span className="text-[9px] text-[var(--aw-text-muted)]">{s.label}</span>
          </motion.div>
        ))}
      </div>

      <TabBar tabs={FIN_TABS} active={tab} onChange={setTab} />

      <div className="flex-1 overflow-y-auto px-4 pb-24 aw-scroll">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2">
            {filtered.map((fin, i) => {
              const st = finStatusColors[fin.status];
              const totalNum = parseInt(fin.totalAmount.replace(/[^\d]/g, ''));
              const paidNum = parseInt(fin.paidAmount.replace(/[^\d]/g, ''));
              const progress = totalNum > 0 ? (paidNum / totalNum) * 100 : 0;
              return (
                <motion.div key={fin.id} className="p-3" style={cardStyle}
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
                      <button onClick={() => openModal('ثبت پرداخت', <QuickForm submitLabel="ثبت پرداخت" toast="پرداخت ثبت شد" fields={[{ key: 'to', label: 'دریافت‌کننده' }, { key: 'amount', label: 'مبلغ (تومان)' }, { key: 'method', label: 'روش', type: 'select', options: ['نقدی', 'کارت‌به‌کارت', 'چک', 'حواله'] }]} />)} className="text-[10px] px-3 py-1.5 rounded-lg border-none cursor-pointer text-white" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
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
    </div>
  );
}