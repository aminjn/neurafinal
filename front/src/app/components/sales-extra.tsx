// ============================================================
// SALES / CASHIER AGENT — PROTOTYPE EXTRAS (فروشنده / صندوقدار)
// UI-only, mock data, clickable flows. No backend/service layer.
// Detail views, full order flow, alerts, conversations, shift,
// and contextual AI quick actions.
// ============================================================
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './app-context';
import { LetterAvatar } from './letter-avatar';

const SALES = 'var(--aw-primary)';
const SALES_GRAD = 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))';
const card: React.CSSProperties = { background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', borderRadius: 10, border: '1px solid color-mix(in srgb, var(--aw-primary) 18%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.22), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)' };
const fmt = (n: number) => n.toLocaleString('fa-IR') + ' ت';

function Row({ l, v, c }: { l: string; v: React.ReactNode; c?: string }) {
  return <div className="flex justify-between items-center text-[13px] py-1"><span className="text-[var(--aw-text-muted)]">{l}</span><span style={{ color: c || 'var(--aw-text-primary)', fontWeight: 600 }}>{v}</span></div>;
}
function Actions({ items }: { items: { label: string; icon: string; color: string; onClick: () => void }[] }) {
  return <div className="grid grid-cols-2 gap-2 mt-2">{items.map((a, i) => <button key={i} className="flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] border-none cursor-pointer text-[12px] text-white" style={{ background: a.color, fontWeight: 600 }} onClick={a.onClick}><i className={a.icon} />{a.label}</button>)}</div>;
}
function AiBox({ text }: { text: string }) {
  return <div className="p-3 rounded-[10px]" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}><div className="flex items-center gap-1.5 mb-1 text-[12px]" style={{ color: SALES, fontWeight: 700 }}><i className="fa-solid fa-wand-magic-sparkles text-[11px]" />پیشنهاد هوش مصنوعی</div><p className="text-[12px] text-[var(--aw-text-secondary)] m-0 leading-6">{text}</p></div>;
}
const inputCls = 'w-full px-3 py-2 rounded-[10px] text-[13px] outline-none';
const inputStyle: React.CSSProperties = { background: 'var(--aw-bg-input)', border: '1px solid var(--aw-border)', color: 'var(--aw-text-primary)' };

// ---------- VARIANTS / ADDONS (restaurant + store samples) ----------
export function getVariants(category: string) {
  const restaurant = ['food', 'drink', 'dessert', 'snack'].includes(category);
  if (restaurant) {
    return {
      variants: [
        { name: 'سایز', options: ['کوچک', 'متوسط', 'بزرگ'] },
        { name: 'نوشیدنی', options: ['نوشابه', 'دوغ', 'آب‌معدنی'] },
      ],
      addons: [
        { name: 'سس اضافه', price: 15000 },
        { name: 'پنیر اضافه', price: 25000 },
        { name: 'بدون پیاز', price: 0 },
        { name: 'بدون سس', price: 0 },
      ],
    };
  }
  return {
    variants: [
      { name: 'رنگ', options: ['مشکی', 'سفید', 'آبی'] },
      { name: 'سایز', options: ['S', 'M', 'L', 'XL'] },
      { name: 'مدل', options: ['استاندارد', 'حرفه‌ای'] },
    ],
    addons: [
      { name: 'بسته‌بندی هدیه', price: 30000 },
      { name: 'گارانتی', price: 50000 },
    ],
  };
}

// ============================================================
// PRODUCT DETAIL
// ============================================================
export function ProductDetail({ product }: { product: any }) {
  const { showToast, openModal } = useApp();
  const { variants, addons } = getVariants(product.category);
  const lowStock = product.stock <= 5;
  const finalPrice = product.discount ? Math.round(product.price * (1 - product.discount / 100)) : product.price;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[32px]" style={{ background: 'var(--aw-bg-hover)' }}>{product.img}</div>
        <div className="flex-1">
          <div className="text-[15px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{product.name}</div>
          <div className="text-[11px] text-[var(--aw-text-muted)]">{product.category}</div>
          <div className="flex items-center gap-2 mt-1">
            {product.discount > 0 && <span className="text-[11px] line-through text-[var(--aw-text-muted)]">{fmt(product.price)}</span>}
            <span className="text-[14px]" style={{ color: SALES, fontWeight: 700 }}>{fmt(finalPrice)}</span>
            {product.discount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>{product.discount}%</span>}
          </div>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: product.stock > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: product.stock > 0 ? SALES : '#EF4444', fontWeight: 600 }}>{product.stock > 0 ? 'فعال' : 'غیرفعال'}</span>
      </div>

      {lowStock && <div className="p-2.5 rounded-lg flex items-center gap-2 text-[12px]" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}><i className="fa-solid fa-triangle-exclamation" />هشدار موجودی کم — تنها {product.stock} {product.unit} باقی مانده</div>}

      <div className="p-3 rounded-[10px]" style={{ background: 'var(--aw-bg-hover)' }}>
        <Row l="موجودی" v={`${product.stock} ${product.unit}`} c={lowStock ? '#F59E0B' : undefined} />
        <Row l="قیمت پایه" v={fmt(product.price)} />
        <Row l="تخفیف" v={product.discount ? `${product.discount}%` : '—'} />
        <Row l="توضیح" v={'محصول پرفروش با کیفیت بالا'} />
      </div>

      <div>
        <div className="text-[12px] mb-1.5" style={{ fontWeight: 700 }}>Variantها</div>
        <div className="flex flex-col gap-2">
          {variants.map((v, i) => (
            <div key={i}>
              <div className="text-[11px] text-[var(--aw-text-muted)] mb-1">{v.name}</div>
              <div className="flex flex-wrap gap-1.5">{v.options.map((o, oi) => <span key={oi} className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: 'var(--aw-bg-hover)', color: 'var(--aw-text-secondary)' }}>{o}</span>)}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[12px] mb-1.5" style={{ fontWeight: 700 }}>افزودنی‌ها</div>
        <div className="flex flex-wrap gap-1.5">{addons.map((a, i) => <span key={i} className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: SALES }}>{a.name}{a.price ? ` +${fmt(a.price)}` : ''}</span>)}</div>
      </div>

      <div>
        <div className="text-[12px] mb-1.5" style={{ fontWeight: 700 }}>تاریخچه فروش</div>
        <div className="flex items-end gap-1 h-16">
          {[40, 65, 50, 80, 60, 90, 75].map((h, i) => <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: SALES_GRAD, opacity: 0.5 + i * 0.07 }} />)}
        </div>
        <div className="text-[10px] text-[var(--aw-text-muted)] mt-1 text-center">۷ روز اخیر — مجموع ۳۴۲ فروش</div>
      </div>

      <Actions items={[
        { label: 'ویرایش', icon: 'fa-solid fa-pen', color: SALES, onClick: () => showToast('ویرایش محصول ذخیره شد') },
        { label: product.stock > 0 ? 'غیرفعال‌سازی' : 'فعال‌سازی', icon: 'fa-solid fa-power-off', color: '#8B5CF6', onClick: () => openModal('تأیید', <ConfirmContent title={product.stock > 0 ? 'غیرفعال‌سازی محصول' : 'فعال‌سازی محصول'} desc={`آیا «${product.name}» ${product.stock > 0 ? 'غیرفعال' : 'فعال'} شود؟`} confirmLabel="بله" onConfirm={() => showToast(product.stock > 0 ? 'محصول غیرفعال شد' : 'محصول فعال شد')} />) },
        { label: 'بروزرسانی موجودی', icon: 'fa-solid fa-boxes-stacked', color: '#3B82F6', onClick: () => showToast('موجودی بروزرسانی شد') },
        { label: 'ثبت درخواست تأمین', icon: 'fa-solid fa-truck', color: '#F59E0B', onClick: () => showToast('درخواست تأمین ثبت شد') },
        { label: 'گزارش فروش', icon: 'fa-solid fa-chart-line', color: '#06B6D4', onClick: () => showToast('گزارش فروش این محصول') },
      ]} />
    </div>
  );
}

// ============================================================
// ORDER DETAIL
// ============================================================
export const ORDER_STATUS_META: Record<string, { label: string; color: string }> = {
  draft: { label: 'پیش‌نویس', color: '#94A3B8' },
  pending: { label: 'در انتظار تأیید', color: '#F59E0B' },
  approved: { label: 'تأییدشده', color: '#3B82F6' },
  preparing: { label: 'در حال آماده‌سازی', color: '#8B5CF6' },
  ready: { label: 'آماده تحویل', color: '#06B6D4' },
  shipped: { label: 'ارسال‌شده', color: '#0EA5E9' },
  completed: { label: 'تکمیل‌شده', color: '#10B981' },
  cancelled: { label: 'لغوشده', color: '#EF4444' },
  returned: { label: 'مرجوع‌شده', color: '#EC4899' },
};

export function OrderDetail({ order }: { order: any }) {
  const { showToast, openModal } = useApp();
  const statusKey = order.status === 'active' ? 'preparing' : order.status === 'completed' ? 'completed' : order.status === 'returned' ? 'returned' : order.status || 'pending';
  const [status, setStatus] = useState(statusKey);
  const st = ORDER_STATUS_META[status] || ORDER_STATUS_META.pending;
  const items = order.itemsList || [];
  const subtotal = items.reduce((s: number, it: any) => s + it.price * it.qty, 0);
  const discount = order.discount || 0;
  const shipping = order.shipping || 0;
  const total = subtotal - discount + shipping;
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-[10px]" style={{ background: 'var(--aw-bg-hover)' }}>
        <Row l="شماره سفارش" v={order.id} />
        <Row l="مشتری" v={order.customer} />
        <Row l="زمان" v={order.time} />
        <Row l="کانال" v={order.channel || order.table || 'حضوری'} />
        <Row l="روش پرداخت" v={order.payment === 'paid' ? 'پرداخت‌شده' : order.method || 'نقدی'} />
        <Row l="وضعیت" v={st.label} c={st.color} />
      </div>

      <div>
        <div className="text-[12px] mb-1.5" style={{ fontWeight: 700 }}>اقلام</div>
        <div className="flex flex-col gap-1.5">
          {items.map((it: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--aw-bg-hover)' }}>
              <span className="text-[12px] text-[var(--aw-text-primary)]">{it.name} ×{it.qty}</span>
              <span className="text-[12px] text-[var(--aw-text-secondary)]">{fmt(it.price * it.qty)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-[10px]" style={{ background: 'var(--aw-bg-hover)' }}>
        <Row l="مبلغ اولیه" v={fmt(subtotal)} />
        <Row l="تخفیف" v={discount ? `- ${fmt(discount)}` : '—'} c="#EF4444" />
        <Row l="هزینه ارسال" v={shipping ? fmt(shipping) : 'رایگان'} />
        <div className="h-px w-full my-1.5" style={{ background: 'var(--aw-border)' }} />
        <Row l="مبلغ نهایی" v={fmt(total)} c={SALES} />
      </div>

      <div>
        <div className="text-[12px] mb-1.5" style={{ fontWeight: 700 }}>تغییر وضعیت</div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(ORDER_STATUS_META).map(([k, v]) => (
            <button key={k} className="text-[10px] px-2 py-1 rounded-full border-none cursor-pointer" style={{ background: k === status ? v.color : `${v.color}1a`, color: k === status ? '#fff' : v.color, fontWeight: 600 }} onClick={() => { setStatus(k); showToast(`وضعیت: ${v.label}`); }}>{v.label}</button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[12px] mb-1.5" style={{ fontWeight: 700 }}>Timeline</div>
        <div className="flex flex-col gap-2">
          {[{ t: 'سفارش ثبت شد', d: order.time }, { t: 'تأیید شد', d: 'چند دقیقه بعد' }, { t: st.label, d: 'اکنون' }].map((e, i) => (
            <div key={i} className="flex items-start gap-2"><div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white flex-shrink-0" style={{ background: SALES }}><i className="fa-solid fa-check" /></div><div className="flex-1"><div className="text-[12px] text-[var(--aw-text-primary)]">{e.t}</div><div className="text-[10px] text-[var(--aw-text-muted)]">{e.d}</div></div></div>
          ))}
        </div>
      </div>

      <Actions items={[
        { label: 'تماس', icon: 'fa-solid fa-phone', color: '#10B981', onClick: () => showToast('در حال تماس...') },
        { label: 'پیام', icon: 'fa-solid fa-comment', color: '#3B82F6', onClick: () => showToast('پیام ارسال شد') },
        { label: 'چاپ رسید', icon: 'fa-solid fa-print', color: '#8B5CF6', onClick: () => showToast('رسید در حال چاپ...') },
        { label: 'ارسال فاکتور', icon: 'fa-solid fa-file-invoice', color: '#06B6D4', onClick: () => showToast('فاکتور ارسال شد') },
        { label: 'ثبت مرجوعی', icon: 'fa-solid fa-rotate-left', color: '#EC4899', onClick: () => openModal('تأیید مرجوعی', <ConfirmContent title="ثبت مرجوعی سفارش" desc={`آیا سفارش ${order.id} مرجوع شود؟ این اقدام در گزارش‌ها ثبت می‌شود.`} confirmLabel="ثبت مرجوعی" danger onConfirm={() => showToast('مرجوعی ثبت شد')} />) },
        { label: 'تکرار سفارش', icon: 'fa-solid fa-repeat', color: '#F59E0B', onClick: () => showToast('سفارش تکرار شد') },
      ]} />
    </div>
  );
}

// ============================================================
// FULL ORDER FLOW (multi-step, clickable)
// ============================================================
const ORDER_TYPES = [
  { id: 'dine', label: 'حضوری', icon: 'fa-solid fa-utensils' },
  { id: 'takeaway', label: 'بیرون‌بر', icon: 'fa-solid fa-bag-shopping' },
  { id: 'delivery', label: 'ارسال', icon: 'fa-solid fa-motorcycle' },
  { id: 'phone', label: 'تلفنی', icon: 'fa-solid fa-phone' },
  { id: 'online', label: 'آنلاین', icon: 'fa-solid fa-globe' },
];
const PAY_METHODS = [
  { id: 'cash', label: 'نقدی', icon: 'fa-solid fa-money-bill' },
  { id: 'card', label: 'کارت‌خوان', icon: 'fa-solid fa-credit-card' },
  { id: 'transfer', label: 'انتقال بانکی', icon: 'fa-solid fa-building-columns' },
  { id: 'wallet', label: 'کیف پول', icon: 'fa-solid fa-wallet' },
  { id: 'split', label: 'ترکیبی', icon: 'fa-solid fa-divide' },
];
const FLOW_PRODUCTS = [];

export function OrderFlow() {
  const { showToast, closeModal, openModal, setAdminScreen, company } = useApp() as any;
  const [step, setStep] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const __loadProducts = async () => { try { const v: any = await (api as any).list('products', company); if (Array.isArray(v)) setProducts(v.map((x: any) => ({ ...x, price: x.priceNum || x.price || 0 }))); } catch (_) {} };
  useEffect(() => { __loadProducts(); }, [company]);
  const addProduct = async () => {
    const n = (typeof window !== 'undefined' && window.prompt) ? window.prompt('نام محصول:') : '';
    if (!n || !n.trim()) return;
    const pr = (typeof window !== 'undefined' && window.prompt) ? window.prompt('قیمت (تومان):') : '';
    const priceNum = parseInt(String(pr || '').replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/\D/g, ''), 10) || 0;
    try { await (api as any).create('products', { id: 'prod_' + Date.now(), name: n.trim(), price: priceNum, priceNum, img: '📦', company }); await __loadProducts(); showToast('محصول اضافه شد'); } catch (_) { showToast('خطا در افزودن محصول'); }
  };
  const [customer, setCustomer] = useState('');
  const [type, setType] = useState('dine');
  const [cart, setCart] = useState<{ id: string; name: string; price: number; qty: number; note?: string }[]>([]);
  const [addons, setAddons] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [discount, setDiscount] = useState(0);
  const [pay, setPay] = useState('cash');
  const toggleAddon = (a: string) => setAddons(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  const ADDONS = ['سس اضافه', 'پنیر اضافه', 'بدون پیاز', 'نوشیدنی', 'بسته‌بندی هدیه'];

  const steps = ['مشتری', 'نوع سفارش', 'محصولات', 'یادداشت', 'تخفیف', 'پرداخت', 'مرور نهایی'];
  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const total = Math.max(0, subtotal - discount);
  const add = (p: any) => setCart(prev => { const e = prev.find(x => x.id === p.id); return e ? prev.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x) : [...prev, { ...p, qty: 1 }]; });
  const dec = (id: string) => setCart(prev => prev.flatMap(x => x.id === id ? (x.qty > 1 ? [{ ...x, qty: x.qty - 1 }] : []) : [x]));

  const next = () => setStep(s => Math.min(steps.length - 1, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));
  const confirm = () => {
    try { (api as any).create('orders', { id: 'so_' + Date.now(), source: 'sales', customer, type, items: cart, total, discount, pay, status: 'preparing', date: new Date().toISOString(), company }).catch(() => {}); } catch (_) {}
    openModal('نتیجه ثبت سفارش', (
      <div className="space-y-3 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(16,185,129,0.15)' }}><i className="fa-solid fa-circle-check text-[30px]" style={{ color: SALES }} /></div>
        <div className="text-[15px]" style={{ fontWeight: 800 }}>سفارش با موفقیت ثبت شد</div>
        <div className="text-[12px] text-[var(--aw-text-muted)]">مبلغ نهایی {fmt(total)} • {PAY_METHODS.find(m => m.id === pay)?.label}</div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button className="py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[12px]" style={{ background: SALES, fontWeight: 700 }} onClick={() => { closeModal(); setAdminScreen('salesInvoicesScreen'); }}><i className="fa-solid fa-file-invoice ml-1" />مشاهده فاکتور</button>
          <button className="py-2.5 rounded-[10px] cursor-pointer text-[12px] bg-transparent" style={{ border: '1px solid var(--aw-border)', color: 'var(--aw-text-muted)', fontWeight: 700 }} onClick={closeModal}>بستن</button>
        </div>
      </div>
    ));
  };

  return (
    <div className="space-y-3">
      {/* Stepper */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full h-1 rounded-full" style={{ background: i <= step ? SALES : 'var(--aw-bg-hover)' }} />
            <span className="text-[8px]" style={{ color: i === step ? SALES : 'var(--aw-text-muted)', fontWeight: i === step ? 700 : 400 }}>{s}</span>
          </div>
        ))}
      </div>

      <div className="min-h-[180px]">
        {step === 0 && (
          <div className="space-y-2">
            <div className="text-[12px] text-[var(--aw-text-muted)]">انتخاب یا ثبت مشتری</div>
            <input className={inputCls} style={inputStyle} value={customer} onChange={e => setCustomer(e.target.value)} placeholder="نام مشتری (اختیاری برای مهمان)" />
            <div className="flex flex-wrap gap-1.5">{['علی محمدی', 'سارا احمدی', 'مهمان'].map(n => <button key={n} className="text-[11px] px-2.5 py-1.5 rounded-full border cursor-pointer" style={{ background: customer === n ? SALES : 'transparent', color: customer === n ? '#fff' : 'var(--aw-text-secondary)', borderColor: 'var(--aw-border)' }} onClick={() => setCustomer(n)}>{n}</button>)}</div>
          </div>
        )}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-2">
            {ORDER_TYPES.map(t => <button key={t.id} className="flex flex-col items-center gap-1.5 p-3 rounded-[10px] border cursor-pointer" style={{ background: type === t.id ? 'rgba(16,185,129,0.1)' : 'transparent', borderColor: type === t.id ? SALES : 'var(--aw-border)' }} onClick={() => setType(t.id)}><i className={`${t.icon} text-[18px]`} style={{ color: SALES }} /><span className="text-[12px]" style={{ fontWeight: 600 }}>{t.label}</span></button>)}
          </div>
        )}
        {step === 2 && (
          <div className="space-y-2">
            <button type="button" onClick={addProduct} style={{ marginBottom: 8, width: '100%', padding: 8, borderRadius: 10, border: '1px dashed var(--aw-border)', background: 'transparent', color: SALES, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>+ افزودن محصول</button>{products.length === 0 && <div style={{ fontSize: 11, color: 'var(--aw-text-muted)', textAlign: 'center', padding: 8 }}>هنوز محصولی ثبت نشده؛ با دکمهٔ بالا اضافه کنید</div>}<div className="grid grid-cols-2 gap-2">{products.map((p: any) => <button key={p.id} className="flex items-center gap-2 p-2.5 rounded-[10px] border cursor-pointer" style={{ background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)' }} onClick={() => add({ id: p.id, name: p.name, price: p.price })}><span className="text-[20px]">{p.img || '📦'}</span><div className="flex-1 text-right"><div className="text-[11px]" style={{ fontWeight: 600 }}>{p.name}</div><div className="text-[10px] text-[var(--aw-text-muted)]">{fmt(p.price)}</div></div><i className="fa-solid fa-plus text-[11px]" style={{ color: SALES }} /></button>)}</div>
            {cart.length > 0 && <div className="flex flex-col gap-1.5 mt-2">{cart.map(c => <div key={c.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--aw-bg-hover)' }}><span className="text-[11px]">{c.name}</span><div className="flex items-center gap-2"><button className="w-6 h-6 rounded border-none cursor-pointer" style={{ background: 'var(--aw-bg-card)' }} onClick={() => dec(c.id)}>−</button><span className="text-[11px] w-5 text-center">{c.qty}</span><button className="w-6 h-6 rounded border-none cursor-pointer text-white" style={{ background: SALES }} onClick={() => add(c)}>+</button></div></div>)}</div>}
            {cart.length > 0 && (
              <div className="mt-2">
                <div className="text-[11px] text-[var(--aw-text-muted)] mb-1">انتخاب افزودنی</div>
                <div className="flex flex-wrap gap-1.5">{ADDONS.map(a => <button key={a} className="text-[11px] px-2.5 py-1 rounded-full border cursor-pointer" style={{ background: addons.includes(a) ? 'rgba(16,185,129,0.12)' : 'transparent', color: addons.includes(a) ? SALES : 'var(--aw-text-secondary)', borderColor: addons.includes(a) ? SALES : 'var(--aw-border)' }} onClick={() => toggleAddon(a)}>{addons.includes(a) && <i className="fa-solid fa-check text-[8px] ml-1" />}{a}</button>)}</div>
              </div>
            )}
          </div>
        )}
        {step === 3 && <textarea className={inputCls} style={{ ...inputStyle, minHeight: 120 }} value={note} onChange={e => setNote(e.target.value)} placeholder="یادداشت سفارش (مثلاً بدون پیاز، تحویل سریع)" />}
        {step === 4 && (
          <div className="space-y-2">
            <div className="text-[12px] text-[var(--aw-text-muted)]">اعمال تخفیف</div>
            <div className="flex flex-wrap gap-1.5">{[0, 10000, 25000, 50000].map(d => <button key={d} className="text-[12px] px-3 py-1.5 rounded-full border cursor-pointer" style={{ background: discount === d ? SALES : 'transparent', color: discount === d ? '#fff' : 'var(--aw-text-secondary)', borderColor: 'var(--aw-border)' }} onClick={() => setDiscount(d)}>{d === 0 ? 'بدون تخفیف' : fmt(d)}</button>)}</div>
          </div>
        )}
        {step === 5 && (
          <div className="grid grid-cols-2 gap-2">{PAY_METHODS.map(m => <button key={m.id} className="flex items-center gap-2 p-3 rounded-[10px] border cursor-pointer" style={{ background: pay === m.id ? 'rgba(16,185,129,0.1)' : 'transparent', borderColor: pay === m.id ? SALES : 'var(--aw-border)' }} onClick={() => setPay(m.id)}><i className={`${m.icon} text-[15px]`} style={{ color: SALES }} /><span className="text-[12px]" style={{ fontWeight: 600 }}>{m.label}</span></button>)}</div>
        )}
        {step === 6 && (
          <div className="p-3 rounded-[10px]" style={{ background: 'var(--aw-bg-hover)' }}>
            <Row l="مشتری" v={customer || 'مهمان'} />
            <Row l="نوع سفارش" v={ORDER_TYPES.find(t => t.id === type)?.label} />
            <Row l="تعداد اقلام" v={cart.reduce((s, c) => s + c.qty, 0)} />
            <Row l="یادداشت" v={note || '—'} />
            <Row l="روش پرداخت" v={PAY_METHODS.find(m => m.id === pay)?.label} />
            <div className="h-px w-full my-1.5" style={{ background: 'var(--aw-border)' }} />
            <Row l="جمع" v={fmt(subtotal)} />
            <Row l="تخفیف" v={discount ? `- ${fmt(discount)}` : '—'} c="#EF4444" />
            <Row l="مبلغ نهایی" v={fmt(total)} c={SALES} />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {step > 0 && <button className="flex-1 py-2.5 rounded-[10px] cursor-pointer text-[13px]" style={{ background: 'var(--aw-bg-hover)', border: '1px solid var(--aw-border)', color: 'var(--aw-text-primary)', fontWeight: 600 }} onClick={back}>قبلی</button>}
        <button className="flex-1 py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[13px]" style={{ background: SALES_GRAD, fontWeight: 700 }} onClick={step === steps.length - 1 ? confirm : (step === 2 && cart.length === 0 ? () => showToast('حداقل یک محصول اضافه کنید') : next)}>
          {step === steps.length - 1 ? 'تأیید سفارش' : 'بعدی'}
        </button>
      </div>
      <button className="w-full py-2 rounded-[10px] cursor-pointer text-[12px] bg-transparent" style={{ border: '1px dashed var(--aw-border)', color: 'var(--aw-text-muted)' }} onClick={() => { try { localStorage.setItem('SALES_ORDER_DRAFT', note || ''); } catch (_) {} showToast('پیش‌نویس ذخیره شد'); closeModal(); }}>ذخیره پیش‌نویس</button>
    </div>
  );
}

// ============================================================
// ALERTS CENTER (نیازمند توجه)
// ============================================================
export function SalesAlertsSection() {
  const { showToast, setAdminScreen } = useApp();
  const alerts = [];
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 px-1 pb-2"><i className="fa-solid fa-bell text-[14px]" style={{ color: '#F59E0B' }} /><span className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>نیازمند توجه</span><span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>{alerts.length}</span></div>
      <div className="flex flex-col gap-2 md:grid md:grid-cols-2">
        {alerts.map((a, i) => (
          <div key={i} className="p-3 flex items-center gap-3" style={{ ...card, borderRight: `3px solid ${a.color}` }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${a.color}1a` }}><i className={`${a.icon} text-[14px]`} style={{ color: a.color }} /></div>
            <div className="flex-1 min-w-0"><div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{a.title}</div><div className="text-[11px] text-[var(--aw-text-muted)]">{a.desc}</div></div>
            <button className="text-[11px] px-3 py-1.5 rounded-lg border-none cursor-pointer text-white flex-shrink-0" style={{ background: a.color, fontWeight: 600 }} onClick={a.onClick}>{a.cta}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SALES CONVERSATIONS SCREEN (گفتگو)
// ============================================================
const SC_AVATAR_GRADS = [
  'linear-gradient(135deg, #8B5CF6, #6D28D9)',
  'linear-gradient(135deg, #2DD4BF, #0D9488)',
  'linear-gradient(135deg, #A78BFA, #7C3AED)',
  'linear-gradient(135deg, #60A5FA, #2563EB)',
  'linear-gradient(135deg, #F472B6, #DB2777)',
  'linear-gradient(135deg, #34D399, #059669)',
  'linear-gradient(135deg, #FBBF24, #D97706)',
  'linear-gradient(135deg, #F87171, #DC2626)',
];
const scAvatarGrad = (str) => {
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return SC_AVATAR_GRADS[h % SC_AVATAR_GRADS.length];
};
const SALES_CONVOS: any[] = [];

const SALES_CHAT_CATS = [
  { id: 'all', label: 'همه', icon: 'fa-solid fa-layer-group' },
  { id: 'customers', label: 'مشتریان', icon: 'fa-solid fa-user' },
  { id: 'agents', label: 'عامل‌های هوشمند', icon: 'fa-solid fa-robot' },
  { id: 'personnel', label: 'پرسنل', icon: 'fa-solid fa-user-tie' },
  { id: 'suppliers', label: 'تأمین‌کنندگان', icon: 'fa-solid fa-truck' },
];

export const SALES_SHIFTS = [];

const SALES_KIND_BG: Record<string, string> = {
  'مشتری VIP': 'bg-violet-600', 'مشتری': 'bg-green-600', 'لید': 'bg-amber-500',
  'شکایت': 'bg-red-600', 'سیستم': 'bg-blue-600',
};

function ManageSalesCatContent({ cat, onEdit, onDelete }: { cat: { id: string; label: string }; onEdit: (id: string, label: string) => void; onDelete: (id: string) => void }) {
  const { showToast, closeModal } = useApp();
  const [val, setVal] = useState(cat.label);
  const save = () => {
    if (!val.trim()) { showToast('نام دسته را وارد کنید'); return; }
    onEdit(cat.id, val.trim());
    showToast('دسته ویرایش شد ✅', 'success');
    closeModal();
  };
  const remove = () => {
    onDelete(cat.id);
    showToast('دسته «' + cat.label + '» حذف شد', 'info');
    closeModal();
  };
  return (
    <div className="p-4">
      <label className="text-[12px] mb-1.5 block" style={{ color: 'var(--aw-text-secondary)', fontWeight: 600 }}>نام دسته</label>
      <input autoFocus value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') save(); }} className={inputCls} style={inputStyle} />
      <div className="flex gap-2 mt-3">
        <button onClick={save} className="flex-1 py-3 rounded-[10px] border-none cursor-pointer text-white text-[13px]" style={{ background: SALES_GRAD, fontWeight: 700 }}><i className="fa-solid fa-check ml-1.5" />ذخیره</button>
        <button onClick={remove} className="py-3 px-4 rounded-[10px] cursor-pointer text-[13px]" style={{ background: 'transparent', color: '#EF4444', border: '1px solid #EF444433', fontWeight: 700 }}><i className="fa-solid fa-trash ml-1.5" />حذف</button>
      </div>
    </div>
  );
}

function AddSalesCatContent({ onAdd }: { onAdd: (label: string) => void }) {
  const { showToast, closeModal } = useApp();
  const [val, setVal] = useState('');
  const submit = () => {
    if (!val.trim()) { showToast('نام دسته را وارد کنید'); return; }
    onAdd(val.trim());
    showToast('دسته «' + val.trim() + '» اضافه شد ✅', 'success');
    closeModal();
  };
  return (
    <div className="p-4">
      <label className="text-[12px] mb-1.5 block" style={{ color: 'var(--aw-text-secondary)', fontWeight: 600 }}>نام دسته جدید</label>
      <input autoFocus value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); }} placeholder="مثلاً پیک‌ها یا همکاران" className={inputCls} style={inputStyle} />
      <button onClick={submit} className="w-full mt-3 py-3 rounded-[10px] border-none cursor-pointer text-white text-[13px]" style={{ background: SALES_GRAD, fontWeight: 700 }}><i className="fa-solid fa-plus ml-1.5" />افزودن دسته</button>
    </div>
  );
}

export function SalesConversationsScreen() {
  const { openChat, setAdminScreen, showToast, openModal } = useApp();
  const [cat, setCat] = useState('all');
  const [customCats, setCustomCats] = useState<{ id: string; label: string; icon: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem('SALES_CHAT_CATS') || '[]'); } catch { return []; }
  });
  const addCat = (label: string) => {
    setCustomCats(prev => {
      const next = [...prev, { id: 'cat_' + Date.now(), label, icon: 'fa-solid fa-tag' }];
      try { localStorage.setItem('SALES_CHAT_CATS', JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const editCat = (id: string, label: string) => {
    setCustomCats(prev => {
      const next = prev.map(c => c.id === id ? { ...c, label } : c);
      try { localStorage.setItem('SALES_CHAT_CATS', JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const deleteCat = (id: string) => {
    setCustomCats(prev => {
      const next = prev.filter(c => c.id !== id);
      try { localStorage.setItem('SALES_CHAT_CATS', JSON.stringify(next)); } catch {}
      return next;
    });
    setCat(c => c === id ? 'all' : c);
  };
  const manageCat = (c: { id: string; label: string }) => openModal('مدیریت دسته', <ManageSalesCatContent cat={c} onEdit={editCat} onDelete={deleteCat} />);
  const allCats = [...SALES_CHAT_CATS, ...customCats];
  const open = (c: any) => {
    openChat('sales_' + c.id, 'contact', {
      name: c.name,
      init: c.name[0] || '؟',
      bg: SALES_KIND_BG[c.kind] || 'bg-teal-600',
      sub: c.kind,
    });
  };
  const filtered = cat === 'all' ? SALES_CONVOS : SALES_CONVOS.filter(c => c.group === cat);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-1.5 p-1 rounded-full overflow-x-auto aw-noscroll" style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)' }}>
        {allCats.map(f => {
          const active = cat === f.id;
          const custom = f.id.startsWith('cat_');
          let lpTimer: any = null;
          return (
            <button key={f.id} onClick={() => setCat(f.id)}
              onContextMenu={custom ? (e) => { e.preventDefault(); manageCat(f); } : undefined}
              onPointerDown={custom ? () => { lpTimer = setTimeout(() => manageCat(f), 600); } : undefined}
              onPointerUp={custom ? () => { if (lpTimer) clearTimeout(lpTimer); } : undefined}
              onPointerLeave={custom ? () => { if (lpTimer) clearTimeout(lpTimer); } : undefined}
              className="flex-shrink-0 flex items-center gap-1.5 py-1.5 px-3 rounded-full border cursor-pointer transition-all text-[11px]"
              style={active
                ? { background: SALES, color: '#fff', borderColor: SALES, fontWeight: 700 }
                : { background: 'transparent', color: 'var(--aw-text-secondary)', borderColor: 'transparent', fontWeight: 600 }}>
              <i className={`${f.icon} text-[10px]`} />{f.label}
              {custom && <i className="fa-solid fa-ellipsis-vertical text-[9px] opacity-60 mr-0.5" onClick={(e) => { e.stopPropagation(); manageCat(f); }} />}
            </button>
          );
        })}
        <button onClick={() => openModal('دسته جدید', <AddSalesCatContent onAdd={addCat} />)} title="افزودن دسته" className="flex-shrink-0 w-8 h-8 rounded-full border cursor-pointer flex items-center justify-center"
          style={{ background: 'transparent', borderColor: SALES, color: SALES }}>
          <i className="fa-solid fa-plus text-[12px]" />
        </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-24 aw-scroll flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-[12px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-comments text-[26px] block mb-2 opacity-50" />گفتگویی در این دسته نیست</div>
        ) : filtered.map(c => (
          <div key={c.id} className="p-3 cursor-pointer transition-all hover:border-[#10B981]" style={card} onClick={() => open(c)}>
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0"><LetterAvatar name={c.name} size={44} radius={10} />{c.unread && <span className="absolute -top-0.5 -left-0.5 w-3 h-3 rounded-full border-2" style={{ background: '#EF4444', borderColor: 'var(--aw-bg-card)' }} />}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap"><span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: c.unread ? 700 : 600 }}>{c.name}</span><span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.12)', color: SALES }}>{c.kind}</span>{c.priority === 'high' && <i className="fa-solid fa-fire text-[10px]" style={{ color: '#EF4444' }} />}</div>
                <div className="text-[11px] text-[var(--aw-text-muted)] mt-1 truncate">{c.last}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-[9px] text-[var(--aw-text-muted)] whitespace-nowrap">{c.time}</span>
                <div className="flex gap-1">
                  <button className="w-7 h-7 rounded-lg border-none cursor-pointer text-white text-[10px]" style={{ background: '#10B981' }} onClick={(e) => { e.stopPropagation(); showToast('در حال تماس...'); }}><i className="fa-solid fa-phone" /></button>
                  <button className="w-7 h-7 rounded-lg border-none cursor-pointer text-white text-[10px]" style={{ background: '#3B82F6' }} onClick={(e) => { e.stopPropagation(); open(c); }}><i className="fa-solid fa-reply" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SHIFT & CASHIER (شیفت و صندوق)
// ============================================================
export function SalesShiftScreen({ embedded = false }: { embedded?: boolean }) {
  const { showToast, setAdminScreen, company } = useApp() as any;
  const cashSales = 0, cardSales = 0, online = 0, returns = 0, opening = 0;
  const expected = opening + cashSales;
  const counted = 0;
  const diff = counted - expected;
  return (
    <div className="flex flex-col h-full">
      {!embedded && (
      <div className="px-4 pt-4 pb-1 flex items-center gap-2">
        <button className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-primary)' }} onClick={() => setAdminScreen('salesQuickReportScreen')}><i className="fa-solid fa-arrow-right" /></button>
        <div><h2 className="text-[18px] text-[var(--aw-text-primary)] m-0" style={{ fontWeight: 800 }}>شیفت و صندوق</h2><p className="text-[12px] text-[var(--aw-text-muted)] mt-0.5 m-0">مدیریت ساده شیفت و تسویه صندوق</p></div>
      </div>
      )}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-24 aw-scroll flex flex-col gap-3">
        <div className="p-3 flex items-center justify-between" style={card}>
          <div><div className="text-[12px] text-[var(--aw-text-muted)]">شروع شیفت</div><div className="text-[14px]" style={{ fontWeight: 700 }}>۰۸:۰۰ صبح</div></div>
          <span className="text-[10px] px-2.5 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.12)', color: SALES, fontWeight: 600 }}>شیفت فعال</span>
          <div><div className="text-[12px] text-[var(--aw-text-muted)]">پایان (تخمینی)</div><div className="text-[14px]" style={{ fontWeight: 700 }}>۱۶:۰۰</div></div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { l: 'موجودی اولیه', v: opening, c: '#3B82F6', i: 'fa-solid fa-vault' },
            { l: 'فروش نقدی', v: cashSales, c: '#10B981', i: 'fa-solid fa-money-bill' },
            { l: 'کارت‌خوان', v: cardSales, c: '#8B5CF6', i: 'fa-solid fa-credit-card' },
            { l: 'پرداخت آنلاین', v: online, c: '#06B6D4', i: 'fa-solid fa-globe' },
            { l: 'مرجوعی', v: returns, c: '#EF4444', i: 'fa-solid fa-rotate-left' },
            { l: 'موجودی شمارش‌شده', v: counted, c: '#F59E0B', i: 'fa-solid fa-calculator' },
          ].map((x, i) => (
            <div key={i} className="p-3" style={card}><div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${x.c}18` }}><i className={`${x.i} text-[13px]`} style={{ color: x.c }} /></div><div className="text-[15px]" style={{ fontWeight: 800 }}>{fmt(x.v)}</div><div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">{x.l}</div></div>
          ))}
        </div>

        <div className="p-3" style={{ ...card, borderRight: `3px solid ${diff === 0 ? SALES : diff > 0 ? '#3B82F6' : '#EF4444'}` }}>
          <div className="flex items-center justify-between"><span className="text-[13px]" style={{ fontWeight: 700 }}>اختلاف صندوق</span><span className="text-[16px]" style={{ color: diff === 0 ? SALES : diff > 0 ? '#3B82F6' : '#EF4444', fontWeight: 800 }}>{diff === 0 ? 'تراز' : (diff > 0 ? '+' : '') + fmt(diff)}</span></div>
          <div className="text-[11px] text-[var(--aw-text-muted)] mt-1">مورد انتظار: {fmt(expected)} • شمارش: {fmt(counted)}</div>
        </div>

        <textarea className={inputCls} style={{ ...inputStyle, minHeight: 70 }} placeholder="توضیح تحویل شیفت (اختیاری)" />
        <button className="w-full py-3 rounded-[10px] border-none cursor-pointer text-white text-[13px]" style={{ background: SALES_GRAD, fontWeight: 700 }} onClick={() => { (api as any).create('shifts', { closedAt: new Date().toISOString(), expected, counted, diff, status: 'closed' }, company); showToast('شیفت با موفقیت تحویل داده شد ✅'); }}><i className="fa-solid fa-right-left ml-1.5" />تحویل شیفت و بستن صندوق</button>
      </div>
    </div>
  );
}

// ============================================================
// BUSINESS TYPE PRESETS (نوع کسب‌وکار) — products screen categories
// Display-only mock presets so the cashier agent fits any business.
// ============================================================
export interface PresetCat { id: string; name: string; icon: string; color: string; count: number; subs: string[] }
export interface BusinessType { id: string; label: string; title: string; cats: PresetCat[] }

const C = ['#F97316', '#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#22C55E', '#FFD700'];
const mk = (name: string, icon: string, i: number, count: number, subs: string[] = []): PresetCat => ({ id: name.replace(/\s/g, '-') + '-' + i, name, icon, color: C[i % C.length], count, subs });

export const BUSINESS_TYPES: BusinessType[] = [
  {
    id: 'restaurant', label: 'رستوران و کافه', title: 'منوی کسب‌وکار',
    cats: [
      mk('غذاها', 'fa-solid fa-utensils', 0, 24, ['پیتزا', 'پاستا', 'برگر', 'خوراک']),
      mk('نوشیدنی‌ها', 'fa-solid fa-mug-hot', 1, 18, ['گرم', 'سرد', 'طبیعی', 'گازدار']),
      mk('دسرها', 'fa-solid fa-cake-candles', 2, 12, ['کیک', 'بستنی', 'شیرینی']),
      mk('صبحانه', 'fa-solid fa-egg', 3, 9, ['املت', 'نیمرو', 'کره و عسل']),
      mk('اسنک‌ها', 'fa-solid fa-cookie', 4, 15, ['سیب‌زمینی', 'ناچو', 'سوخاری']),
      mk('سالاد', 'fa-solid fa-leaf', 5, 7, ['سزار', 'یونانی', 'فصل']),
      mk('کباب و گریل', 'fa-solid fa-fire-burner', 6, 11, ['کوبیده', 'جوجه', 'برگ']),
      mk('بستنی', 'fa-solid fa-ice-cream', 7, 6, ['سنتی', 'میوه‌ای', 'شکلاتی']),
    ],
  },
  {
    id: 'clothing', label: 'فروشگاه پوشاک', title: 'محصولات کسب‌وکار',
    cats: [
      mk('پوشاک زنانه', 'fa-solid fa-person-dress', 0, 42, ['مانتو', 'شومیز', 'شلوار', 'لباس مجلسی']),
      mk('پوشاک مردانه', 'fa-solid fa-shirt', 1, 38, ['پیراهن', 'تیشرت', 'شلوار', 'کت']),
      mk('پوشاک کودک', 'fa-solid fa-child', 2, 25, ['نوزاد', 'دختر', 'پسر']),
      mk('کفش', 'fa-solid fa-shoe-prints', 3, 30, ['زنانه', 'مردانه', 'ورزشی']),
      mk('کیف', 'fa-solid fa-bag-shopping', 4, 18, ['دستی', 'کوله', 'پول']),
      mk('اکسسوری', 'fa-solid fa-gem', 5, 22, ['ساعت', 'عینک', 'کمربند']),
      mk('لباس ورزشی', 'fa-solid fa-dumbbell', 6, 16, ['ست', 'گرمکن', 'شلوارک']),
      mk('پوشاک فصلی', 'fa-solid fa-snowflake', 7, 14, ['پاییزه', 'زمستانه', 'تابستانه']),
    ],
  },
  {
    id: 'grocery', label: 'فروشگاه مواد غذایی', title: 'محصولات کسب‌وکار',
    cats: [
      mk('لبنیات', 'fa-solid fa-cheese', 0, 28, ['شیر', 'ماست', 'پنیر']),
      mk('نوشیدنی', 'fa-solid fa-bottle-water', 1, 35, ['آب', 'نوشابه', 'آبمیوه']),
      mk('تنقلات', 'fa-solid fa-cookie-bite', 2, 40, ['چیپس', 'شکلات', 'بیسکویت']),
      mk('مواد پروتئینی', 'fa-solid fa-drumstick-bite', 3, 22, ['مرغ', 'گوشت', 'تخم‌مرغ']),
      mk('میوه و سبزیجات', 'fa-solid fa-carrot', 4, 30, ['میوه', 'سبزی', 'صیفی']),
      mk('شوینده', 'fa-solid fa-pump-soap', 5, 18, ['ظرفشویی', 'لباسشویی', 'سطوح']),
      mk('مواد غذایی خشک', 'fa-solid fa-wheat-awn', 6, 26, ['برنج', 'حبوبات', 'ماکارونی']),
      mk('محصولات منجمد', 'fa-solid fa-snowflake', 7, 15, ['سبزی', 'فست‌فود', 'بستنی']),
    ],
  },
  {
    id: 'cosmetics', label: 'لوازم آرایشی و بهداشتی', title: 'محصولات کسب‌وکار',
    cats: [
      mk('مراقبت پوست', 'fa-solid fa-hand-sparkles', 0, 32, ['کرم', 'سرم', 'ماسک']),
      mk('مراقبت مو', 'fa-solid fa-pump-medical', 1, 24, ['شامپو', 'ماسک مو', 'رنگ']),
      mk('آرایش صورت', 'fa-solid fa-wand-magic-sparkles', 2, 40, ['کرم‌پودر', 'رژ', 'سایه']),
      mk('عطر', 'fa-solid fa-spray-can-sparkles', 3, 20, ['زنانه', 'مردانه', 'ادکلن']),
      mk('بهداشت شخصی', 'fa-solid fa-soap', 4, 28, ['دهان', 'بدن', 'دست']),
      mk('ابزار آرایشی', 'fa-solid fa-brush', 5, 18, ['براش', 'اسفنج', 'آینه']),
      mk('محصولات مردانه', 'fa-solid fa-mars', 6, 15, ['اصلاح', 'افترشیو']),
      mk('محصولات کودک', 'fa-solid fa-baby', 7, 12, ['شامپو', 'لوسیون']),
    ],
  },
  {
    id: 'digital', label: 'فروشگاه لوازم دیجیتال', title: 'محصولات کسب‌وکار',
    cats: [
      mk('موبایل', 'fa-solid fa-mobile-screen', 0, 30, ['اپل', 'سامسونگ', 'شیائومی', 'سایر برندها']),
      mk('لپ‌تاپ', 'fa-solid fa-laptop', 1, 22, ['اپل', 'ایسوس', 'لنوو']),
      mk('تبلت', 'fa-solid fa-tablet-screen-button', 2, 14, ['اپل', 'سامسونگ']),
      mk('هدفون', 'fa-solid fa-headphones', 3, 26, ['بلوتوث', 'سیمی', 'گیمینگ']),
      mk('لوازم جانبی', 'fa-solid fa-plug', 4, 38, ['شارژر', 'کابل', 'پاوربانک']),
      mk('قطعات', 'fa-solid fa-microchip', 5, 20, ['رم', 'هارد', 'پردازنده']),
      mk('گجت هوشمند', 'fa-solid fa-clock', 6, 16, ['ساعت', 'مچ‌بند', 'خانه هوشمند']),
      mk('تجهیزات شبکه', 'fa-solid fa-wifi', 7, 12, ['مودم', 'روتر', 'سوییچ']),
    ],
  },
  {
    id: 'jewelry', label: 'فروشگاه طلا و جواهر', title: 'محصولات کسب‌وکار',
    cats: [
      mk('انگشتر', 'fa-solid fa-ring', 0, 24, ['طلا', 'جواهر', 'نقره']),
      mk('گردنبند', 'fa-solid fa-gem', 1, 28, ['طلا', 'پلاک‌دار', 'مروارید']),
      mk('دستبند', 'fa-solid fa-circle-notch', 2, 20, ['طلا', 'چرمی', 'مهره']),
      mk('گوشواره', 'fa-solid fa-gem', 3, 26, ['میخی', 'آویز', 'حلقه']),
      mk('زنجیر', 'fa-solid fa-link', 4, 18, ['طلا', 'نقره']),
      mk('پلاک', 'fa-solid fa-tag', 5, 15, ['اسم', 'طرح‌دار']),
      mk('نیم‌ست', 'fa-solid fa-layer-group', 6, 12, ['طلا', 'جواهر']),
      mk('محصولات کودک', 'fa-solid fa-baby', 7, 8, ['پلاک', 'دستبند']),
    ],
  },
  {
    id: 'pharmacy', label: 'داروخانه و محصولات سلامت', title: 'محصولات کسب‌وکار',
    cats: [
      mk('دارو', 'fa-solid fa-pills', 0, 50, ['نسخه‌ای', 'OTC']),
      mk('مکمل', 'fa-solid fa-capsules', 1, 28, ['ویتامین', 'پروتئین']),
      mk('مراقبت پوست', 'fa-solid fa-hand-sparkles', 2, 22, ['کرم', 'ضدآفتاب']),
      mk('بهداشت', 'fa-solid fa-soap', 3, 30, ['دهان', 'بدن']),
      mk('مادر و کودک', 'fa-solid fa-baby', 4, 18, ['شیرخشک', 'پوشک']),
      mk('تجهیزات پزشکی', 'fa-solid fa-stethoscope', 5, 16, ['فشارسنج', 'ماسک']),
      mk('سلامت جنسی', 'fa-solid fa-heart', 6, 10, []),
      mk('گیاهی', 'fa-solid fa-seedling', 7, 14, ['دمنوش', 'عرقیات']),
    ],
  },
  {
    id: 'homeapp', label: 'فروشگاه لوازم خانگی', title: 'محصولات کسب‌وکار',
    cats: [
      mk('آشپزخانه', 'fa-solid fa-blender', 0, 34, ['یخچال', 'گاز', 'مایکروویو']),
      mk('صوتی و تصویری', 'fa-solid fa-tv', 1, 22, ['تلویزیون', 'ساندبار']),
      mk('سرمایش و گرمایش', 'fa-solid fa-fan', 2, 18, ['کولر', 'بخاری', 'پنکه']),
      mk('نظافت', 'fa-solid fa-broom', 3, 20, ['جاروبرقی', 'بخارشو']),
      mk('دکوراسیون', 'fa-solid fa-couch', 4, 26, ['تابلو', 'گلدان']),
      mk('کالای خواب', 'fa-solid fa-bed', 5, 16, ['تشک', 'روتختی']),
      mk('ظروف', 'fa-solid fa-plate-wheat', 6, 30, ['سرویس', 'لیوان']),
      mk('لوازم برقی کوچک', 'fa-solid fa-plug', 7, 24, ['چای‌ساز', 'اتو']),
    ],
  },
  {
    id: 'books', label: 'کتاب‌فروشی و لوازم‌التحریر', title: 'محصولات کسب‌وکار',
    cats: [
      mk('کتاب', 'fa-solid fa-book', 0, 60, ['رمان', 'کودک', 'دانشگاهی']),
      mk('دفتر', 'fa-solid fa-book-open', 1, 30, ['۴۰برگ', '۱۰۰برگ']),
      mk('نوشت‌افزار', 'fa-solid fa-pen', 2, 45, ['خودکار', 'مداد', 'ماژیک']),
      mk('ابزار هنری', 'fa-solid fa-paintbrush', 3, 22, ['رنگ', 'بوم']),
      mk('لوازم مدرسه', 'fa-solid fa-graduation-cap', 4, 28, ['کیف', 'جامدادی']),
      mk('محصولات اداری', 'fa-solid fa-paperclip', 5, 20, ['زونکن', 'منگنه']),
      mk('هدیه', 'fa-solid fa-gift', 6, 16, ['کارت', 'باکس']),
      mk('بازی فکری', 'fa-solid fa-puzzle-piece', 7, 14, ['پازل', 'رومیزی']),
    ],
  },
  {
    id: 'services', label: 'خدمات و فروش ترکیبی', title: 'خدمات و محصولات',
    cats: [
      mk('خدمات', 'fa-solid fa-screwdriver-wrench', 0, 18, ['نصب', 'تعمیر', 'مشاوره']),
      mk('محصولات', 'fa-solid fa-box', 1, 32, ['عمومی']),
      mk('پکیج‌ها', 'fa-solid fa-boxes-stacked', 2, 12, ['پایه', 'ویژه']),
      mk('اشتراک‌ها', 'fa-solid fa-id-card', 3, 8, ['ماهانه', 'سالانه']),
      mk('رزروها', 'fa-solid fa-calendar-check', 4, 10, ['نوبت', 'میز']),
      mk('پیشنهادهای ویژه', 'fa-solid fa-tags', 5, 6, []),
    ],
  },
  {
    id: 'other', label: 'سایر کسب‌وکارها', title: 'محصولات کسب‌وکار',
    cats: [
      mk('دسته‌بندی سفارشی ۱', 'fa-solid fa-shapes', 0, 0, []),
      mk('دسته‌بندی سفارشی ۲', 'fa-solid fa-shapes', 1, 0, []),
      mk('دسته‌بندی سفارشی ۳', 'fa-solid fa-shapes', 2, 0, []),
    ],
  },
];

// ============================================================
// AI QUICK ACTIONS (per screen)
// ============================================================
export const SALES_QUICK_ACTIONS: Record<string, { icon: string; label: string }[]> = {
  salesOrdersScreen: [
    { icon: 'fa-solid fa-cart-plus', label: 'سفارش جدید ثبت کن' },
    { icon: 'fa-solid fa-clock', label: 'سفارش‌های معطل را نشان بده' },
    { icon: 'fa-solid fa-repeat', label: 'سفارش قبلی این مشتری را تکرار کن' },
  ],
  salesMenuScreen: [
    { icon: 'fa-solid fa-box-open', label: 'محصولات رو به اتمام را نشان بده' },
    { icon: 'fa-solid fa-arrow-trend-down', label: 'محصولات کم‌فروش را پیدا کن' },
    { icon: 'fa-solid fa-truck', label: 'درخواست تأمین ثبت کن' },
  ],
  salesCustomersScreen: [
    { icon: 'fa-solid fa-crown', label: 'مشتریان VIP را نشان بده' },
    { icon: 'fa-solid fa-user-clock', label: 'مشتریان غیرفعال را پیدا کن' },
    { icon: 'fa-solid fa-comment-dots', label: 'برای این مشتری پیام آماده کن' },
  ],
  salesInvoicesScreen: [
    { icon: 'fa-solid fa-file-circle-exclamation', label: 'فاکتورهای پرداخت‌نشده را نشان بده' },
    { icon: 'fa-solid fa-bell', label: 'یادآوری پرداخت آماده کن' },
    { icon: 'fa-solid fa-list-check', label: 'فاکتورهای امروز را خلاصه کن' },
  ],
  salesQuickReportScreen: [
    { icon: 'fa-solid fa-chart-line', label: 'عملکرد امروز را تحلیل کن' },
    { icon: 'fa-solid fa-magnifying-glass-chart', label: 'دلیل کاهش فروش را بررسی کن' },
    { icon: 'fa-solid fa-lightbulb', label: 'برای فردا پیشنهاد بده' },
  ],
};

// Mock AI responses + a related CTA for each quick action (prototype only)
export const SALES_AI_RESPONSES: Record<string, { text: string; cta: { label: string; icon: string; screen: string } }> = {
  'سفارش جدید ثبت کن': { text: 'فرم ثبت سفارش جدید آماده است. می‌توانید مشتری و اقلام را انتخاب کنید.', cta: { label: 'ثبت سفارش', icon: 'fa-solid fa-cart-plus', screen: 'salesOrdersScreen' } },
  'سفارش‌های معطل را نشان بده': { text: 'سفارش‌های در انتظار تأیید را در این بخش می‌بینید.', cta: { label: 'مشاهده سفارش‌ها', icon: 'fa-solid fa-bag-shopping', screen: 'salesOrdersScreen' } },
  'سفارش قبلی این مشتری را تکرار کن': { text: 'آخرین سفارشِ این مشتری آماده ثبت مجدد است.', cta: { label: 'ثبت مجدد', icon: 'fa-solid fa-repeat', screen: 'salesOrdersScreen' } },
  'محصولات رو به اتمام را نشان بده': { text: 'محصولاتِ رو به اتمامِ موجودی را در این بخش ببینید.', cta: { label: 'مشاهده محصولات', icon: 'fa-solid fa-box', screen: 'salesMenuScreen' } },
  'محصولات کم‌فروش را پیدا کن': { text: 'محصولاتِ کم‌فروش را در گزارشِ فروش ببینید.', cta: { label: 'مشاهده محصولات', icon: 'fa-solid fa-box', screen: 'salesMenuScreen' } },
  'درخواست تأمین ثبت کن': { text: 'درخواست تأمین برای ۴ قلم رو به اتمام آماده ارسال است.', cta: { label: 'مشاهده محصولات', icon: 'fa-solid fa-truck', screen: 'salesMenuScreen' } },
  'مشتریان VIP را نشان بده': { text: 'مشتریانِ VIP را در بخشِ مشتریان ببینید.', cta: { label: 'مشاهده مشتریان', icon: 'fa-solid fa-crown', screen: 'salesCustomersScreen' } },
  'مشتریان غیرفعال را پیدا کن': { text: 'مشتریانِ غیرفعال را در بخشِ مشتریان ببینید.', cta: { label: 'مشاهده مشتریان', icon: 'fa-solid fa-user-clock', screen: 'salesCustomersScreen' } },
  'برای این مشتری پیام آماده کن': { text: 'می‌توانید برای این مشتری پیام ارسال کنید.', cta: { label: 'ارسال پیام', icon: 'fa-solid fa-paper-plane', screen: 'salesConversationsScreen' } },
  'فاکتورهای پرداخت‌نشده را نشان بده': { text: 'فاکتورهای پرداخت‌نشده را در این بخش ببینید.', cta: { label: 'مشاهده فاکتورها', icon: 'fa-solid fa-file-invoice', screen: 'salesInvoicesScreen' } },
  'یادآوری پرداخت آماده کن': { text: 'یادآوری پرداخت برای ۲ فاکتور سررسیدشده آماده ارسال است.', cta: { label: 'مشاهده فاکتورها', icon: 'fa-solid fa-bell', screen: 'salesInvoicesScreen' } },
  'فاکتورهای امروز را خلاصه کن': { text: 'خلاصهٔ فاکتورهای امروز را در بخشِ فاکتورها ببینید.', cta: { label: 'مشاهده فاکتورها', icon: 'fa-solid fa-list-check', screen: 'salesInvoicesScreen' } },
  'عملکرد امروز را تحلیل کن': { text: 'گزارشِ عملکردِ امروز را در این بخش ببینید.', cta: { label: 'مشاهده گزارش', icon: 'fa-solid fa-chart-pie', screen: 'salesQuickReportScreen' } },
  'دلیل کاهش فروش را بررسی کن': { text: 'روندِ فروش را در گزارشِ تحلیلی بررسی کنید.', cta: { label: 'مشاهده گزارش', icon: 'fa-solid fa-magnifying-glass-chart', screen: 'salesQuickReportScreen' } },
  'برای فردا پیشنهاد بده': { text: 'پیشنهاد: تقویت نیروی پیک ناهار و تخفیف عصرگاهی روی اسنک‌ها.', cta: { label: 'مشاهده گزارش', icon: 'fa-solid fa-lightbulb', screen: 'salesQuickReportScreen' } },
};

// Reusable confirmation modal content (prototype Confirmation Modal state)
export function ConfirmContent({ title, desc, confirmLabel, danger, onConfirm }: { title: string; desc: string; confirmLabel: string; danger?: boolean; onConfirm: () => void }) {
  const { closeModal } = useApp();
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[13px]" style={{ color: danger ? '#EF4444' : SALES }}>
        <i className={`fa-solid ${danger ? 'fa-triangle-exclamation' : 'fa-circle-question'}`} /><span style={{ fontWeight: 700 }}>{title}</span>
      </div>
      <p className="text-[13px] text-[var(--aw-text-secondary)] m-0 leading-6">{desc}</p>
      <div className="grid grid-cols-2 gap-2">
        <button className="py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[13px]" style={{ background: danger ? '#EF4444' : SALES, fontWeight: 700 }} onClick={() => { closeModal(); onConfirm(); }}>{confirmLabel}</button>
        <button className="py-2.5 rounded-[10px] cursor-pointer text-[13px] bg-transparent" style={{ border: '1px solid var(--aw-border)', color: 'var(--aw-text-muted)', fontWeight: 700 }} onClick={closeModal}>انصراف</button>
      </div>
    </div>
  );
}
