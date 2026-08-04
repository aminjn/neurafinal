import React, { useState, useEffect } from 'react';

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
import { api } from '../services/api';
import { JalaliDatePicker } from './jalali-datepicker';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './app-context';
import { LetterAvatar } from './letter-avatar';
import { ProductDetail, OrderDetail, OrderFlow, SalesAlertsSection, SalesShiftScreen, BUSINESS_TYPES, type PresetCat } from './sales-extra';
import { OrderInvoice } from './end-user-panel';

// بخشِ مرجوعی‌هایِ فروشنده (both-role): درخواست‌هایِ در انتظار + تأیید/رد با بازپرداختِ اتمیکِ سرور.
function SellerReturnsSection() {
  const { showToast } = useApp() as any;
  const [returns, setReturns] = React.useState<any[]>([]);
  const [busy, setBusy] = React.useState('');
  const load = React.useCallback(() => { (api as any).listReturns().then((r: any) => setReturns(Array.isArray(r) ? r : [])).catch(() => {}); }, []);
  React.useEffect(() => { load(); }, [load]);
  const pending = returns.filter(r => r.status === 'pending');
  const resolve = async (r: any, approve: boolean) => {
    if (busy) return; setBusy(r.id);
    try { const res: any = await (api as any).resolveReturn(r.id, approve); showToast && showToast(approve ? ('مرجوعی تأیید و ' + (Number(res.refunded) || 0).toLocaleString('fa-IR') + ' تومان بازپرداخت شد') : 'مرجوعی رد شد', 'success'); load(); }
    catch (_e) { showToast && showToast('عملیات ناموفق بود', 'error'); }
    finally { setBusy(''); }
  };
  if (!pending.length) return null;
  return (
    <div className="mt-3 mb-1 p-3 rounded-2xl border" style={{ background: 'color-mix(in srgb, var(--aw-danger) 8%, transparent)', borderColor: 'var(--aw-danger)' }}>
      <div className="flex items-center gap-2 mb-2"><i className="fa-solid fa-rotate-left text-[13px]" style={{ color: 'var(--aw-danger)' }} /><span className="text-[13px]" style={{ fontWeight: 800, color: 'var(--aw-danger)' }}>درخواست‌های مرجوعی ({(pending.length).toLocaleString('fa-IR')})</span></div>
      <div className="flex flex-col gap-2">
        {pending.map((r, i) => (
          <div key={r.id || i} className="p-2.5 rounded-xl" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[12px]" style={{ fontWeight: 700 }}>{r.buyerName || 'خریدار'} · سفارش #{String(r.orderNum || '')}</span>
              <span className="text-[12px] text-[var(--aw-danger)]" style={{ fontWeight: 800 }}>{(Number(r.amount) || 0).toLocaleString('fa-IR')} ت</span>
            </div>
            <div className="text-[11px] text-[var(--aw-text-secondary)] mt-0.5">{(r.items || []).map((it: any) => (it.name || 'کالا') + ' ×' + (it.qty || 1)).join('، ')}</div>
            {r.reason && <div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">دلیل: {r.reason}</div>}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={() => resolve(r, true)} disabled={!!busy} className="py-2 rounded-[8px] border-none text-white text-[12px] cursor-pointer" style={{ background: '#10B981', fontWeight: 700, opacity: busy ? 0.6 : 1 }}>تأیید و بازپرداخت</button>
              <button onClick={() => resolve(r, false)} disabled={!!busy} className="py-2 rounded-[8px] text-[12px] cursor-pointer bg-transparent" style={{ border: '1px solid var(--aw-border)', color: 'var(--aw-text-secondary)', fontWeight: 700 }}>رد</button>
            </div>
          </div>
        ))}
      </div>
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
  border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)',
  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)',
};
const tabBarStyle: React.CSSProperties = {
  background: 'var(--aw-eu-nav-bg)',
  border: '1px solid var(--aw-eu-nav-border)',
  borderRadius: 9999,
  padding: 3,
  backdropFilter: 'blur(20px)',
};
const activeTabStyle: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--aw-primary) 10%, transparent)',
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

// ========================
// MOCK DATA
// ========================
const PRODUCT_CATEGORIES = [
  { id: 'food', name: 'غذاها', icon: 'fa-solid fa-utensils', count: 24, color: 'var(--aw-primary)' },
  { id: 'drink', name: 'نوشیدنی‌ها', icon: 'fa-solid fa-mug-hot', count: 18, color: 'var(--aw-primary)' },
  { id: 'dessert', name: 'دسرها', icon: 'fa-solid fa-ice-cream', count: 12, color: 'var(--aw-primary)' },
  { id: 'snack', name: 'اسنک‌ها', icon: 'fa-solid fa-cookie', count: 15, color: '#F59E0B' },
  { id: 'package', name: 'بسته‌ای', icon: 'fa-solid fa-box', count: 8, color: 'var(--aw-primary)' },
  { id: 'breakfast', name: 'صبحانه', icon: 'fa-solid fa-egg', count: 9, color: '#10B981' },
  { id: 'grill', name: 'کباب و گریل', icon: 'fa-solid fa-fire-burner', count: 11, color: '#EF4444' },
  { id: 'salad', name: 'سالاد', icon: 'fa-solid fa-leaf', count: 7, color: '#22C55E' },
];

const PRODUCTS = [];

const INVOICES_DATA = [];

const INVOICE_ITEMS: Record<string, { name: string; qty: number; price: number; icon: string }[]> = {
  'INV-1401': [],
  'INV-1402': [],
  'INV-1403': [],
  'INV-1404': [],
};

const CUSTOMERS_DATA = [];

const CUSTOMER_SEGMENTS = [
  { id: 'all', label: 'همه', icon: 'fa-solid fa-users', color: '#10B981' },
  { id: 'vip', label: 'VIP', icon: 'fa-solid fa-crown', color: '#FFD700' },
  { id: 'loyal', label: 'وفادار', icon: 'fa-solid fa-heart', color: 'var(--aw-primary)' },
  { id: 'new', label: 'جدید', icon: 'fa-solid fa-user-plus', color: 'var(--aw-primary)' },
  { id: 'inactive', label: 'غیرفعال', icon: 'fa-solid fa-moon', color: '#6B7280' },
  { id: 'atRisk', label: 'در خطر ریزش', icon: 'fa-solid fa-triangle-exclamation', color: '#EF4444' },
];

const ACTIVITY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active: { label: 'فعال', color: '#10B981', dot: '#10B981' },
  inactive: { label: 'غیرفعال', color: '#6B7280', dot: '#6B7280' },
  risk: { label: 'در خطر ریزش', color: '#EF4444', dot: '#EF4444' },
};

const CUSTOMER_ORDER_HISTORY: Record<string, { id: string; date: string; items: string; total: number; status: string }[]> = {
  c1: [],
  c2: [],
};

const CUSTOMER_CHATS: Record<string, { from: 'cust' | 'me'; text: string; time: string }[]> = {
  c1: [],
  c2: [],
};

const TIER_COLORS: Record<string, string> = {
  'برنزی': '#CD7F32',
  'نقره‌ای': '#C0C0C0',
  'طلایی': '#FFD700',
  'الماسی': '#B9F2FF',
};

const DAILY_SALES = [];

const TOP_PRODUCTS = [];

// ========================
// SHARED COMPONENTS
// ========================
function TabBar({ tabs, active, onChange }: { tabs: { id: string; label: string; icon?: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 p-1 mx-4 mt-3 mb-2 overflow-x-auto aw-noscroll" style={tabBarStyle}>
      {tabs.map(t => (
        <button
          key={t.id}
          className="flex-shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 border-none cursor-pointer transition-all text-[11px]"
          style={active === t.id ? activeTabStyle : inactiveTabStyle}
          onClick={() => onChange(t.id)}
        >
          {t.icon && <i className={`${t.icon} text-[11px]`} />}
          <span style={{ whiteSpace: 'nowrap' }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function SectionHeader({ title, icon, count, color, action }: { title: string; icon: string; count?: number; color?: string; action?: { label: string; onClick: () => void } }) {
  const c = 'var(--aw-primary)';
  return (
    <div className="flex items-center gap-2 px-1 pt-3 pb-1">
      <i className={`${icon} text-[14px]`} style={{ color: c }} />
      <span className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{title}</span>
      {count !== undefined && (
        <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--aw-primary-bg)', color: c }}>{count}</span>
      )}
      {action && (
        <button
          className="mr-auto text-[11px] px-3 py-1 rounded-lg border-none cursor-pointer"
          style={{ background: 'var(--aw-primary-bg)', color: c }}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${color}22`, color }}>
      {label}
    </span>
  );
}

function formatPrice(n: number): string {
  return n.toLocaleString('en-US').replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]) + ' ت';
}
// Group thousands then convert to Persian digits (for inputs/labels)
function faMoney(n: number | string): string {
  const num = typeof n === 'string' ? parseInt(n.replace(/[^\d]/g, '') || '0', 10) : n;
  return num.toLocaleString('en-US').replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
}

function EditProductContent({ product }: { product: any }) {
  const { showToast, closeModal } = useApp();
  const [name, setName] = useState(product.name || '');
  const [price, setPrice] = useState(String(product.price || ''));
  const [stock, setStock] = useState(String(product.stock || ''));
  const [discount, setDiscount] = useState(String(product.discount || 0));
  const [unit, setUnit] = useState(product.unit || 'عدد');
  const inputStyle: React.CSSProperties = { background: 'var(--aw-bg-input)', border: '1px solid var(--aw-border)', color: 'var(--aw-text-primary)', borderRadius: 12, padding: '11px 13px', fontSize: 13, width: '100%', outline: 'none', fontFamily: "'Kamand', 'Vazirmatn', sans-serif" };
  const Label = ({ children }: any) => <label className="text-[12px] mb-1.5 block" style={{ color: 'var(--aw-text-secondary)', fontWeight: 600 }}>{children}</label>;
  const priceNum = parseInt(price.replace(/[^\d]/g, '') || '0', 10);
  return (
    <div className="flex flex-col gap-3 p-1">
      <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: '#10B98115' }}>
        <span className="text-[30px]">{product.img}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] truncate" style={{ fontWeight: 700, color: 'var(--aw-text-primary)' }}>{name || product.name}</div>
          <div className="text-[12px]" style={{ color: '#10B981', fontWeight: 700 }}>{faMoney(priceNum)} ت</div>
        </div>
      </div>
      <div><Label>نام محصول</Label><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label>قیمت (تومان)</Label><input style={inputStyle} dir="ltr" inputMode="numeric" value={faMoney(price)} onChange={e => setPrice(e.target.value.replace(/[^\d۰-۹]/g, '').replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))))} /></div>
        <div><Label>تخفیف (٪)</Label><input style={inputStyle} dir="ltr" inputMode="numeric" value={discount} onChange={e => setDiscount(e.target.value.replace(/[^\d]/g, ''))} /></div>
        <div><Label>موجودی</Label><input style={inputStyle} dir="ltr" inputMode="numeric" value={stock} onChange={e => setStock(e.target.value.replace(/[^\d]/g, ''))} /></div>
        <div><Label>واحد</Label>
          <select style={inputStyle} value={unit} onChange={e => setUnit(e.target.value)}>
            {['عدد', 'کیلوگرم', 'بسته', 'جعبه', 'لیتر', 'متر'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <button onClick={() => { const _en = (x: any) => String(x).replace(/[\u06F0-\u06F9]/g, (d: string) => String(d.charCodeAt(0) - 0x06F0)).replace(/[\u0660-\u0669]/g, (d: string) => String(d.charCodeAt(0) - 0x0660)); const _pn = parseInt(_en(price).replace(/[^0-9]/g, '')) || 0; const _sn = parseInt(_en(stock).replace(/[^0-9]/g, '')) || 0; try { (api as any).update('products', product.id, { name: name.trim(), price: _pn, priceNum: _pn, stock: _sn, discount: parseInt(_en(discount)) || 0, unit }); } catch (_) {} showToast('تغییرات محصول ذخیره شد ✅', 'success'); closeModal(); }} className="mt-1 w-full rounded-[12px] border-none cursor-pointer text-white py-3 text-[14px]" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 700, fontFamily: "'Kamand', 'Vazirmatn', sans-serif" }}>
        <i className="fa-solid fa-check-circle ml-1.5" />ذخیره تغییرات
      </button>
    </div>
  );
}

// ========================
// 1) SALES POS SCREEN
// ========================
export function SalesPosScreen() {
  const { showToast, openModal, company } = useApp() as any;
  const [cart, setCart] = useState<{ product: typeof PRODUCTS[0]; qty: number }[]>([]);
  const [selectedCat, setSelectedCat] = useState('food');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'wallet'>('cash');
  const [discount, setDiscount] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);

  const __coPos = (useApp() as any).company;
  const [__posProd, setPosProd] = useState<any[]>([]);
  useEffect(() => { if (!__coPos) return; (async () => { try { const v: any = await (api as any).list('products', __coPos); if (Array.isArray(v)) setPosProd((v as any[]).map(((p: any) => ({ id: p.id, name: p.name, category: p.category || 'food', price: p.priceNum || p.price || 0, stock: p.stock ?? 99, unit: p.unit || 'عدد', img: p.img || p.icon || '📦', discount: p.discount || 0 })))); } catch (_) {} })(); }, [__coPos]);
  const PRODUCTS = __posProd;
  const filteredProducts = PRODUCTS.filter(p => p.category === selectedCat);

  const addToCart = (product: typeof PRODUCTS[0]) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) return prev.map(c => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => c.product.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter(c => c.qty > 0));
  };

  const subtotal = cart.reduce((s, c) => s + c.product.price * c.qty, 0);
  const discountAmount = Math.round(subtotal * discount / 100);
  const tax = Math.round((subtotal - discountAmount) * 0.09);
  const total = subtotal - discountAmount + tax;

  const submitOrder = () => {
    const items = cart.map(c => ({ id: c.product.id, name: c.product.name, price: c.product.price, qty: c.qty }));
    const now = new Date().toISOString();
    const oid = 'pos_' + Date.now();
    try { (api as any).create('orders', { id: oid, source: 'pos', items, subtotal, discount, discountAmount, tax, total, status: 'completed', paid: true, date: now, company }).catch(() => {}); } catch (_) {}
    try { (api as any).create('invoices', { id: 'inv_' + Date.now(), orderId: oid, source: 'pos', items, amount: total, total, status: 'paid', date: now, company }).catch(() => {}); } catch (_) {}
    showToast(`فاکتور ${formatPrice(total)} صادر و ثبت شد ✅`);
    setCart([]);
    setDiscount(0);
    setShowCheckout(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--aw-bg-app)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--aw-bg-header)', borderBottom: '1px solid var(--aw-border)', boxShadow: '0 6px 16px color-mix(in srgb, var(--aw-primary) 9%, transparent)' }}>
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
          <i className="fa-solid fa-cart-shopping text-[14px]" />
        </div>
        <div className="flex-1">
          <div className="text-[15px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>فروش جدید (POS)</div>
          <div className="text-[11px] text-[var(--aw-text-muted)]">ثبت سفارش و صدور فاکتور</div>
        </div>
        {cart.length > 0 && (
          <button
            className="relative px-3 py-2 rounded-[10px] border-none text-white cursor-pointer text-[12px] flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}
            onClick={() => setShowCheckout(true)}
          >
            <i className="fa-solid fa-receipt" />
            تسویه
            <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white" style={{ background: '#EF4444', fontWeight: 700 }}>
              {cart.reduce((s, c) => s + c.qty, 0)}
            </span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {/* Category selector */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
          {PRODUCT_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] border-none cursor-pointer whitespace-nowrap text-[11px] transition-all"
              style={selectedCat === cat.id
                ? { background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', color: '#fff' }
                : { background: 'var(--aw-bg-card)', color: 'var(--aw-text-muted)', border: '1px solid var(--aw-border)' }
              }
              onClick={() => setSelectedCat(cat.id)}
            >
              <i className={`${cat.icon} text-[12px]`} />
              {cat.name}
              <span className="text-[10px] opacity-70">({cat.count})</span>
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 gap-2 px-4">
          {filteredProducts.map(product => {
            const inCart = cart.find(c => c.product.id === product.id);
            return (
              <motion.button
                key={product.id}
                className="relative flex flex-col items-center p-3 rounded-[10px] border-none cursor-pointer text-center transition-all"
                style={{
                  ...cardStyle,
                  outline: inCart ? '2px solid #10B981' : 'none',
                  opacity: product.stock === 0 ? 0.4 : 1,
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => product.stock > 0 && addToCart(product)}
                disabled={product.stock === 0}
              >
                <span className="text-[28px] mb-1">{product.img}</span>
                <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{product.name}</span>
                <span className="text-[12px] mt-0.5" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(product.price)}</span>
                {product.discount > 0 && (
                  <span className="absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded-full text-white" style={{ background: '#EF4444', fontWeight: 700 }}>
                    {product.discount}%
                  </span>
                )}
                {product.stock === 0 && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-[10px] text-[12px] text-white" style={{ background: 'rgba(0,0,0,0.6)', fontWeight: 700 }}>
                    ناموجود
                  </span>
                )}
                {product.stock > 0 && product.stock <= 5 && (
                  <span className="text-[9px] mt-0.5" style={{ color: '#F59E0B' }}>موجودی: {product.stock}</span>
                )}
                {inCart && (
                  <span className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white" style={{ background: '#10B981', fontWeight: 700 }}>
                    {inCart.qty}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Cart summary */}
        {cart.length > 0 && (
          <div className="mx-4 mt-4 p-3 rounded-[10px]" style={cardStyle}>
            <SectionHeader title="سبد خرید" icon="fa-solid fa-basket-shopping" count={cart.reduce((s, c) => s + c.qty, 0)} />
            <div className="flex flex-col gap-2 mt-2">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--aw-bg-app)' }}>
                  <span className="text-[20px]">{item.product.img}</span>
                  <div className="flex-1">
                    <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{item.product.name}</div>
                    <div className="text-[11px]" style={{ color: '#10B981' }}>{formatPrice(item.product.price)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="w-6 h-6 rounded-full border-none cursor-pointer flex items-center justify-center text-white text-[12px]"
                      style={{ background: '#EF4444' }}
                      onClick={() => updateQty(item.product.id, -1)}
                    >−</button>
                    <span className="text-[13px] text-[var(--aw-text-primary)] w-5 text-center" style={{ fontWeight: 700 }}>{item.qty}</span>
                    <button
                      className="w-6 h-6 rounded-full border-none cursor-pointer flex items-center justify-center text-white text-[12px]"
                      style={{ background: '#10B981' }}
                      onClick={() => updateQty(item.product.id, 1)}
                    >+</button>
                  </div>
                  <span className="text-[12px] min-w-[70px] text-left" style={{ color: '#10B981', fontWeight: 700 }}>
                    {formatPrice(item.product.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Checkout overlay */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col"
            style={{ background: 'var(--aw-bg-app)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--aw-bg-header)', borderBottom: '1px solid var(--aw-border)', boxShadow: '0 6px 16px color-mix(in srgb, var(--aw-primary) 9%, transparent)' }}>
              <button className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-primary)' }} onClick={() => setShowCheckout(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
              <span className="text-[15px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>تسویه حساب</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {/* Items summary */}
              <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
                <div className="text-[13px] text-[var(--aw-text-primary)] mb-2" style={{ fontWeight: 700 }}>آیتم‌ها ({cart.reduce((s, c) => s + c.qty, 0)})</div>
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center justify-between py-1.5 text-[12px]">
                    <span className="text-[var(--aw-text-secondary)]">{item.product.img} {item.product.name} × {item.qty}</span>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>{formatPrice(item.product.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Discount */}
              <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
                <div className="text-[12px] text-[var(--aw-text-secondary)] mb-2">تخفیف (درصد)</div>
                <div className="flex gap-2">
                  {[0, 5, 10, 15, 20].map(d => (
                    <button
                      key={d}
                      className="flex-1 py-2 rounded-lg border-none cursor-pointer text-[12px] transition-all"
                      style={discount === d
                        ? { background: '#10B981', color: '#fff', fontWeight: 700 }
                        : { background: 'var(--aw-bg-app)', color: 'var(--aw-text-muted)' }
                      }
                      onClick={() => setDiscount(d)}
                    >
                      {d === 0 ? 'بدون' : `${d}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment method */}
              <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
                <div className="text-[12px] text-[var(--aw-text-secondary)] mb-2">روش پرداخت</div>
                <div className="flex gap-2">
                  {[
                    { id: 'cash' as const, label: 'نقد', icon: 'fa-solid fa-money-bill-wave' },
                    { id: 'card' as const, label: 'کارت', icon: 'fa-solid fa-credit-card' },
                    { id: 'wallet' as const, label: 'کیف پول', icon: 'fa-solid fa-wallet' },
                  ].map(m => (
                    <button
                      key={m.id}
                      className="flex-1 flex flex-col items-center gap-1 py-3 rounded-[10px] border-none cursor-pointer text-[11px] transition-all"
                      style={paymentMethod === m.id
                        ? { background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', color: '#fff' }
                        : { background: 'var(--aw-bg-app)', color: 'var(--aw-text-muted)', border: '1px solid var(--aw-border)' }
                      }
                      onClick={() => setPaymentMethod(m.id)}
                    >
                      <i className={`${m.icon} text-[16px]`} />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
                <div className="flex justify-between py-1 text-[12px]">
                  <span className="text-[var(--aw-text-secondary)]">جمع کل</span>
                  <span className="text-[var(--aw-text-primary)]">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between py-1 text-[12px]">
                    <span className="text-[var(--aw-text-secondary)]">تخفیف ({discount}%)</span>
                    <span style={{ color: '#EF4444' }}>- {formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 text-[12px]">
                  <span className="text-[var(--aw-text-secondary)]">مالیات (۹%)</span>
                  <span className="text-[var(--aw-text-muted)]">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between py-2 mt-1 text-[14px]" style={{ borderTop: '1px solid var(--aw-border)' }}>
                  <span className="text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>مبلغ قابل پرداخت</span>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="p-4" style={{ borderTop: '1px solid var(--aw-border)' }}>
              <button
                className="w-full py-3 rounded-[10px] border-none text-white cursor-pointer text-[14px] flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 700 }}
                onClick={submitOrder}
              >
                <i className="fa-solid fa-check-circle" />
                تایید و صدور فاکتور
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ========================
// 2) SALES ORDERS SCREEN
// ========================
const ORDERS_DATA = [];

const PENDING_APPROVAL_ORDERS = [];

const QUICK_PRODUCTS = [];

export function SalesOrdersScreen() {
  const { showToast, openModal, setAdminScreen, company } = useApp() as any;
  const [activeTab, setActiveTab] = useState('new');
  const [cart, setCart] = useState<{ id: any; name: string; price: number; qty: number }[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [tableName, setTableName] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const __loadProdQ = async () => { try { const v: any = await (api as any).list('products', company); if (Array.isArray(v)) setProducts(v.map((x: any) => ({ ...x, price: x.priceNum || x.price || 0, icon: x.icon || 'fa-solid fa-box', color: x.color || 'var(--aw-primary)' }))); } catch (_) {} };
  useEffect(() => { __loadProdQ(); }, [company]);
  const addProduct = async () => {
    const n = (typeof window !== 'undefined' && window.prompt) ? window.prompt('نام محصول:') : '';
    if (!n || !n.trim()) return;
    const pr = (typeof window !== 'undefined' && window.prompt) ? window.prompt('قیمت (تومان):') : '';
    const priceNum = parseInt(String(pr || '').replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/\D/g, ''), 10) || 0;
    try { await (api as any).create('products', { id: 'prod_' + Date.now(), name: n.trim(), price: priceNum, priceNum, icon: 'fa-solid fa-box', color: 'var(--aw-primary)', company }); await __loadProdQ(); showToast('محصول اضافه شد'); } catch (_) { showToast('خطا در افزودن محصول'); }
  };

  const tabs = [
    { id: 'new', label: 'سفارش جدید', icon: 'fa-solid fa-plus' },
    { id: 'pending', label: 'در انتظار تایید', icon: 'fa-solid fa-hourglass-half' },
    { id: 'active', label: 'فعال', icon: 'fa-solid fa-fire' },
    { id: 'completed', label: 'تکمیل‌شده', icon: 'fa-solid fa-check' },
    { id: 'returned', label: 'مرجوعی', icon: 'fa-solid fa-rotate-left' },
    { id: 'payment', label: 'پرداخت', icon: 'fa-solid fa-credit-card' },
    { id: 'report', label: 'گزارش', icon: 'fa-solid fa-chart-column' },
  ];

  const [pendingList, setPendingList] = useState(PENDING_APPROVAL_ORDERS);
  const approveOrder = (id: string) => {
    setPendingList(prev => prev.filter(o => o.id !== id));
    showToast(`سفارش ${id} تایید و به لیست فعال منتقل شد`, 'success');
  };
  const rejectOrder = (id: string) => {
    setPendingList(prev => prev.filter(o => o.id !== id));
    showToast(`سفارش ${id} رد شد`, 'info');
  };

  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    active: { label: 'در حال آماده‌سازی', color: '#F59E0B', icon: 'fa-solid fa-fire' },
    completed: { label: 'تکمیل شده', color: '#10B981', icon: 'fa-solid fa-check-circle' },
    returned: { label: 'مرجوعی', color: '#EF4444', icon: 'fa-solid fa-rotate-left' },
  };
  const payConfig: Record<string, { label: string; color: string }> = {
    paid: { label: 'پرداخت‌شده', color: '#10B981' },
    pending: { label: 'در انتظار', color: '#F59E0B' },
    refunded: { label: 'بازگشت‌شده', color: 'var(--aw-primary)' },
  };

  const addToCart = (p: any) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  };
  const removeFromCart = (id: number) => {
    setCart(prev => prev.flatMap(i => i.id === id ? (i.qty > 1 ? [{ ...i, qty: i.qty - 1 }] : []) : [i]));
  };
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const submitOrder = () => {
    if (cart.length === 0) { showToast('سبد سفارش خالی است', 'error'); return; }
    try { (api as any).create('orders', { id: 'so_' + Date.now(), source: 'sales', customer: customerName || 'مهمان', table: tableName, items: cart, total: cart.reduce((s: number, c: any) => s + c.price * c.qty, 0), status: 'preparing', date: new Date().toISOString(), company }).catch(() => {}); } catch (_) {}
    showToast(`سفارش ${customerName || 'مهمان'} با موفقیت ثبت شد`, 'success');
    setCart([]); setCustomerName(''); setTableName('');
  };

  const [__srvOrd, setSrvOrd] = useState<any[]>([]);
  // فروش‌های آنلاین: سفارش‌هایی که از فروشگاه/داین/مارکت آمده‌اند (نه POS/فروشِ دستی). واقعی، از سرور.
  const [__onlineSales, setOnlineSales] = useState<any[]>([]);
  useEffect(() => {
    if (!company) return;
    (async () => {
      try {
        const v: any = await (api as any).list('orders', company);
        if (!Array.isArray(v)) return;
        setSrvOrd((v as any[]).filter((o: any) => o.source === 'pos' || o.source === 'sales').map((o: any) => ({ id: o.id, customer: o.customer || 'مهمان', table: o.table || 'میز ۱', items: Array.isArray(o.items) ? o.items.length : (o.items || 0), total: o.total || 0, time: o.time || 'اخیر', status: o.status || 'active', payment: o.paid ? 'paid' : (o.payment || 'pending'), note: o.note || '', source: o.source })));
        setOnlineSales((v as any[]).filter((o: any) => o.source && o.source !== 'pos' && o.source !== 'sales').map((o: any) => ({
          id: o.id,
          total: o.total || 0,
          date: o.date || o.createdAt || o.ts || Date.now(),
          itemsText: Array.isArray(o.items) ? (o.items.map((it: any) => it.name || it.title).filter(Boolean).join('، ') || (o.items.length + ' قلم')) : (o.title || 'فروش آنلاین'),
          source: o.source,
        })));
      } catch (_) {}
    })();
  }, [company]);
  const ORDERS_DATA = __srvOrd;
  const activeOrders = ORDERS_DATA.filter(o => o.status === 'active');
  const completedOrders = ORDERS_DATA.filter(o => o.status === 'completed');
  const returnedOrders = ORDERS_DATA.filter(o => o.status === 'returned');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center px-4 py-3">
        <div className="flex flex-1 items-center gap-1.5 p-1 rounded-full" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
          <button className="flex-1 h-9 rounded-full border cursor-pointer flex items-center justify-center gap-1.5 text-[12px] transition-all" style={{ background: 'var(--aw-primary-bg)', borderColor: 'color-mix(in srgb, var(--aw-primary) 22%, transparent)', color: 'var(--aw-primary)', fontWeight: 700 }}>
            <i className="fa-solid fa-bag-shopping text-[12px]" /> سفارشات
          </button>
          <button className="flex-1 h-9 rounded-full border cursor-pointer flex items-center justify-center gap-1.5 text-[12px] transition-all" style={{ background: 'transparent', borderColor: 'color-mix(in srgb, var(--aw-border) 22%, transparent)', color: 'var(--aw-text-secondary)', fontWeight: 600 }} onClick={() => setAdminScreen('salesInvoicesScreen')}>
            <i className="fa-solid fa-file-invoice text-[12px]" /> فاکتورها
          </button>
        </div>
      </div>

      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {__onlineSales.length > 0 && (
          <div className="mt-3 mb-1 p-3 rounded-2xl border" style={{ background: 'var(--aw-primary-bg)', borderColor: 'var(--aw-primary)' }}>
            <div className="flex items-center gap-2 mb-2"><i className="fa-solid fa-store text-[13px]" style={{ color: 'var(--aw-primary)' }} /><span className="text-[13px]" style={{ fontWeight: 800, color: 'var(--aw-primary)' }}>فروش‌های آنلاین ({(__onlineSales.length).toLocaleString('fa-IR')})</span></div>
            <div className="flex flex-col gap-1.5">
              {__onlineSales.slice(0, 20).map((o: any, i: number) => (
                <div key={o.id || i} onClick={() => openModal('فاکتور فروش', <OrderInvoice order={o} />)} className="p-2.5 rounded-xl flex items-center gap-2 cursor-pointer" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#10B98118' }}><i className="fa-solid fa-file-invoice text-[12px] text-[#10B981]" /></div>
                  <div className="flex-1 min-w-0"><div className="text-[12px] truncate" style={{ fontWeight: 700 }}>{o.itemsText || 'فروش'}</div><div className="text-[10px] text-[var(--aw-text-muted)]">{new Date(o.date || Date.now()).toLocaleDateString('fa-IR')} · مشاهدهٔ فاکتور</div></div>
                  <div className="text-[12px] text-[#10B981]" style={{ fontWeight: 800 }}>{(Number(o.total) || 0).toLocaleString('fa-IR')} <span className="text-[9px]">ت</span></div>
                </div>
              ))}
            </div>
          </div>
        )}
        <SellerReturnsSection />
        {/* Add manual order card (hidden on the new-order form tab) */}
        {activeTab !== 'new' && (
          <button onClick={() => openModal('ثبت سفارش دستی', <OrderFlow />)} className="w-full flex items-center gap-3 p-3 mt-3 mb-1 rounded-2xl border cursor-pointer transition-all" style={{ background: 'var(--aw-primary-bg)', borderColor: 'var(--aw-primary)' }}>
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
              <i className="fa-solid fa-plus text-[16px] text-white" />
            </div>
            <div className="flex-1 text-right">
              <div className="text-[13px]" style={{ fontWeight: 700, color: 'var(--aw-primary)' }}>ثبت سفارش دستی</div>
              <div className="text-[10px] text-[var(--aw-text-muted)]">ایجاد سفارش جدید به‌صورت مرحله‌به‌مرحله</div>
            </div>
            <i className="fa-solid fa-chevron-left text-[12px]" style={{ color: 'var(--aw-primary)' }} />
          </button>
        )}
        {/* ===== TAB: NEW ORDER ===== */}
        {activeTab === 'new' && (
          <div className="flex flex-col gap-3">
            <button className="w-full py-2.5 rounded-[10px] cursor-pointer text-white text-[12px] flex items-center justify-center gap-2" style={{ background: 'color-mix(in srgb, var(--aw-primary) 29%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 55%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25)', fontWeight: 700 }} onClick={() => openModal('فرآیند کامل ثبت سفارش', <OrderFlow />)}>
              <i className="fa-solid fa-list-check" />ثبت سفارش
            </button>

            <SectionHeader title="انتخاب سریع محصول" icon="fa-solid fa-bolt" color="#F59E0B" />
            <button type="button" onClick={addProduct} style={{ marginBottom: 8, width: '100%', padding: 8, borderRadius: 10, border: '1px dashed var(--aw-border)', background: 'transparent', color: 'var(--aw-primary)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>+ افزودن محصول</button>
            {products.length === 0 && <div style={{ fontSize: 11, color: 'var(--aw-text-muted)', textAlign: 'center', padding: 8 }}>هنوز محصولی ثبت نشده؛ با دکمهٔ بالا اضافه کنید</div>}
            <div className="grid grid-cols-3 gap-2">
              {products.map((p: any) => (
                <motion.button
                  key={p.id} whileTap={{ scale: 0.95 }} onClick={() => addToCart(p)}
                  className="aw-no-pill p-3 border-none cursor-pointer flex flex-col items-center gap-1.5"
                  style={{
                    background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)',
                    backdropFilter: 'blur(20px) saturate(1.4)',
                    WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
                    border: '1px solid color-mix(in srgb, var(--aw-primary) 20%, transparent)',
                    borderRadius: 8,
                    boxShadow: '0 0 4px rgba(216,148,255,0.2), inset 0 0 4px rgba(237,206,255,0.15)',
                  }}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: `${p.color}22`, color: p.color }}>
                    <i className={`${p.icon} text-[14px]`} />
                  </div>
                  <span className="text-[11px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{p.name}</span>
                  <span className="text-[10px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(p.price)}</span>
                </motion.button>
              ))}
            </div>

            <SectionHeader title="سبد سفارش" icon="fa-solid fa-cart-shopping" count={cart.length} color="#10B981" />
            {cart.length === 0 ? (
              <div className="p-6 rounded-[10px] text-center text-[12px] text-[var(--aw-text-muted)]" style={cardStyle}>
                <i className="fa-solid fa-cart-shopping text-[24px] mb-2 block" style={{ opacity: 0.4 }} />
                هنوز محصولی اضافه نشده
              </div>
            ) : (
              <div className="rounded-[10px]" style={cardStyle}>
                {cart.map((it, i) => (
                  <div key={it.id} className="flex items-center gap-2 p-3" style={i < cart.length - 1 ? { borderBottom: '1px solid var(--aw-border)' } : {}}>
                    <div className="flex-1">
                      <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{it.name}</div>
                      <div className="text-[10px] text-[var(--aw-text-muted)]">{formatPrice(it.price)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="w-6 h-6 rounded-md border-none cursor-pointer text-[var(--aw-text-primary)]" style={{ background: 'var(--aw-bg-app)' }} onClick={() => removeFromCart(it.id)}>−</button>
                      <span className="text-[12px] text-[var(--aw-text-primary)] min-w-[20px] text-center" style={{ fontWeight: 700 }}>{it.qty}</span>
                      <button className="w-6 h-6 rounded-md border-none cursor-pointer text-white" style={{ background: '#10B981' }} onClick={() => addToCart(products.find((p: any) => p.id === it.id)!)}>+</button>
                    </div>
                    <span className="text-[12px] min-w-[80px] text-left" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(it.price * it.qty)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3" style={{ background: 'var(--aw-bg-app)', borderTop: '1px solid var(--aw-border)', borderRadius: '0 0 14px 14px' }}>
                  <span className="text-[12px] text-[var(--aw-text-muted)]">جمع کل</span>
                  <span className="text-[16px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(cartTotal)}</span>
                </div>
              </div>
            )}

            <button
              className="w-full py-3 rounded-[10px] border-none text-white cursor-pointer text-[13px]"
              style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 700 }}
              onClick={submitOrder}
            >
              <i className="fa-solid fa-check ml-1.5" />ثبت سفارش
            </button>
          </div>
        )}

        {/* ===== TAB: PENDING APPROVAL ===== */}
        {activeTab === 'pending' && (
          <div className="flex flex-col gap-2 mt-1">
            <div className="p-3 rounded-[10px] flex items-center gap-2.5" style={{ ...cardStyle, background: 'linear-gradient(135deg, #F59E0B15, #F59E0B05)', border: '1px solid #F59E0B33' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#F59E0B22', color: '#F59E0B' }}>
                <i className="fa-solid fa-hourglass-half text-[12px]" />
              </div>
              <div className="flex-1">
                <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{pendingList.length.toLocaleString('fa-IR')} سفارش در انتظار تایید</div>
                <div className="text-[10px] text-[var(--aw-text-muted)]">سفارشات قبل از پردازش نیاز به تایید دارند</div>
              </div>
            </div>

            {pendingList.length === 0 ? (
              <div className="p-8 rounded-[10px] text-center text-[12px] text-[var(--aw-text-muted)] mt-2" style={cardStyle}>
                <i className="fa-solid fa-circle-check text-[28px] mb-2 block" style={{ opacity: 0.4, color: '#10B981' }} />
                همه سفارشات بررسی شده‌اند
              </div>
            ) : (
              pendingList.map(o => (
                <motion.div key={o.id} className="p-3 rounded-[10px] cursor-pointer" style={cardStyle} whileTap={{ scale: 0.99 }} onClick={() => openModal(o.id, <OrderDetail order={o} />)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{o.id}</span>
                      <StatusBadge label="در انتظار تایید" color="#F59E0B" />
                    </div>
                    <span className="text-[11px] text-[var(--aw-text-muted)]">{o.time}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-[12px] text-[var(--aw-text-secondary)]"><i className="fa-solid fa-user text-[10px] ml-1" />{o.customer}</div>
                      <div className="text-[11px] text-[var(--aw-text-muted)] mt-0.5"><i className="fa-solid fa-location-dot text-[10px] ml-1" />{o.table} · {o.items} آیتم</div>
                      <div className="text-[10px] mt-1 px-2 py-0.5 rounded inline-block" style={{ background: 'var(--aw-primary-bg)', color: 'var(--aw-primary)' }}><i className="fa-solid fa-tag ml-1" />{o.source}</div>
                      {o.note && <div className="text-[10px] mt-1 mr-1 px-2 py-0.5 rounded inline-block" style={{ background: '#F59E0B22', color: '#F59E0B' }}><i className="fa-solid fa-note-sticky ml-1" />{o.note}</div>}
                    </div>
                    <span className="text-[14px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(o.total)}</span>
                  </div>
                  <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid var(--aw-border)' }}>
                    <button className="flex-1 py-2 rounded-lg border-none text-white cursor-pointer text-[11px]" style={{ background: '#10B981', fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); approveOrder(o.id); }}>
                      <i className="fa-solid fa-check ml-1" />تایید
                    </button>
                    <button className="flex-1 py-2 rounded-[10px] cursor-pointer text-[11px]" style={{ background: 'transparent', color: '#EF4444', border: '1px solid #EF444433', fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); rejectOrder(o.id); }}>
                      <i className="fa-solid fa-xmark ml-1" />رد
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* ===== TAB: ACTIVE / COMPLETED / RETURNED ===== */}
        {(activeTab === 'active' || activeTab === 'completed' || activeTab === 'returned') && (
          <div className="flex flex-col gap-2 mt-1">
            {(activeTab === 'active' ? activeOrders : activeTab === 'completed' ? completedOrders : returnedOrders).map(o => {
              const st = statusConfig[o.status];
              return (
                <motion.div key={o.id} className="p-3 rounded-[10px] cursor-pointer" style={cardStyle} whileTap={{ scale: 0.99 }} onClick={() => openModal(o.id, <OrderDetail order={o} />)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{o.id}</span>
                      <StatusBadge label={st.label} color={st.color} />
                    </div>
                    <span className="text-[11px] text-[var(--aw-text-muted)]">{o.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[12px] text-[var(--aw-text-secondary)]"><i className="fa-solid fa-user text-[10px] ml-1" />{o.customer}</div>
                      <div className="text-[11px] text-[var(--aw-text-muted)] mt-0.5"><i className="fa-solid fa-location-dot text-[10px] ml-1" />{o.table} · {o.items} آیتم</div>
                      {(o as any).note && <div className="text-[10px] mt-1 px-2 py-0.5 rounded inline-block" style={{ background: '#F59E0B22', color: '#F59E0B' }}><i className="fa-solid fa-note-sticky ml-1" />{(o as any).note}</div>}
                      {(o as any).reason && <div className="text-[10px] mt-1 px-2 py-0.5 rounded inline-block" style={{ background: '#EF444422', color: '#EF4444' }}><i className="fa-solid fa-circle-info ml-1" />{(o as any).reason}</div>}
                    </div>
                    <span className="text-[14px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(o.total)}</span>
                  </div>
                  {o.status === 'active' && (
                    <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--aw-border)' }}>
                      <button className="flex-1 py-2 rounded-lg border-none text-white cursor-pointer text-[11px]" style={{ background: '#10B981', fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); try { (api as any).update('orders', o.id, { status: 'completed' }); } catch (_) {} setSrvOrd(prev => prev.map((x: any) => x.id === o.id ? { ...x, status: 'completed' } : x)); showToast('سفارش به عنوان تکمیل‌شده ثبت شد', 'success'); }}>
                        <i className="fa-solid fa-check ml-1" />تکمیل
                      </button>
                      <button className="flex-1 py-2 rounded-[10px] cursor-pointer text-[11px]" style={{ background: 'transparent', color: '#EF4444', border: '1px solid #EF444433', fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); try { (api as any).update('orders', o.id, { status: 'cancelled' }); } catch (_) {} setSrvOrd(prev => prev.map((x: any) => x.id === o.id ? { ...x, status: 'cancelled' } : x)); showToast('سفارش لغو شد', 'info'); }}>
                        <i className="fa-solid fa-xmark ml-1" />لغو
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
            {((activeTab === 'active' && activeOrders.length === 0) ||
              (activeTab === 'completed' && completedOrders.length === 0) ||
              (activeTab === 'returned' && returnedOrders.length === 0)) && (
              <div className="p-8 rounded-[10px] text-center text-[12px] text-[var(--aw-text-muted)] mt-2" style={cardStyle}>
                <i className="fa-solid fa-inbox text-[28px] mb-2 block" style={{ opacity: 0.4 }} />
                موردی برای نمایش وجود ندارد
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: PAYMENT STATUS ===== */}
        {activeTab === 'payment' && (
          <div className="flex flex-col gap-3 mt-1">
            <div className="grid grid-cols-3 gap-2">
              {(['paid', 'pending', 'refunded'] as const).map(k => {
                const list = ORDERS_DATA.filter(o => o.payment === k);
                const sum = list.reduce((s, o) => s + o.total, 0);
                const cfg = payConfig[k];
                return (
                  <div key={k} className="p-3 rounded-[10px]" style={cardStyle}>
                    <div className="text-[10px] text-[var(--aw-text-muted)] mb-1">{cfg.label}</div>
                    <div className="text-[13px]" style={{ color: cfg.color, fontWeight: 700 }}>{formatPrice(sum)}</div>
                    <div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">{list.length.toLocaleString('fa-IR')} سفارش</div>
                  </div>
                );
              })}
            </div>

            <SectionHeader title="جزئیات پرداخت سفارشات" icon="fa-solid fa-credit-card" color="#10B981" />
            <div className="flex flex-col gap-2">
              {ORDERS_DATA.map(o => {
                const p = payConfig[o.payment];
                return (
                  <div key={o.id} className="p-3 rounded-[10px] flex items-center justify-between" style={cardStyle}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: `${p.color}22`, color: p.color }}>
                        <i className={`fa-solid ${o.payment === 'paid' ? 'fa-check' : o.payment === 'pending' ? 'fa-hourglass-half' : 'fa-rotate-left'} text-[12px]`} />
                      </div>
                      <div>
                        <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{o.id}</div>
                        <div className="text-[10px] text-[var(--aw-text-muted)]">{o.customer} · {o.time}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[13px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(o.total)}</span>
                      <StatusBadge label={p.label} color={p.color} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== TAB: ORDERS REPORT ===== */}
        {activeTab === 'report' && (() => {
          const all = ORDERS_DATA;
          const revenue = all.filter(o => o.payment !== 'refunded').reduce((s, o) => s + o.total, 0);
          const avg = all.length ? Math.round(all.reduce((s, o) => s + o.total, 0) / all.length) : 0;
          const returnRate = all.length ? Math.round((returnedOrders.length / all.length) * 100) : 0;
          const stats = [
            { l: 'کل سفارشات', v: all.length.toLocaleString('fa-IR'), c: 'var(--aw-primary)', i: 'fa-solid fa-receipt' },
            { l: 'درآمد کل', v: formatPrice(revenue), c: '#10B981', i: 'fa-solid fa-sack-dollar' },
            { l: 'میانگین سفارش', v: formatPrice(avg), c: 'var(--aw-primary)', i: 'fa-solid fa-chart-line' },
            { l: 'نرخ مرجوعی', v: returnRate.toLocaleString('fa-IR') + '٪', c: '#EF4444', i: 'fa-solid fa-rotate-left' },
          ];
          const breakdown = [
            { l: 'فعال', n: activeOrders.length, c: '#F59E0B' },
            { l: 'تکمیل‌شده', n: completedOrders.length, c: '#10B981' },
            { l: 'مرجوعی', n: returnedOrders.length, c: '#EF4444' },
          ];
          const maxN = Math.max(1, ...breakdown.map(b => b.n));
          const topProducts = [
            { name: 'پیتزا مخصوص', qty: 48, sum: 13680000 },
            { name: 'برگر کلاسیک', qty: 35, sum: 6825000 },
            { name: 'قهوه لاته', qty: 62, sum: 5270000 },
            { name: 'چیزکیک', qty: 21, sum: 2835000 },
          ];
          const week = [
            { d: 'شنبه', n: 12 }, { d: 'یک', n: 18 }, { d: 'دو', n: 9 }, { d: 'سه', n: 22 },
            { d: 'چهار', n: 15 }, { d: 'پنج', n: 28 }, { d: 'جمعه', n: 31 },
          ];
          const maxW = Math.max(...week.map(w => w.n));
          return (
            <div className="flex flex-col gap-3 mt-1">
              <div className="grid grid-cols-2 gap-2">
                {stats.map((s, i) => (
                  <div key={i} className="p-3 rounded-[10px]" style={cardStyle}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${s.c}18` }}><i className={`${s.i} text-[13px]`} style={{ color: s.c }} /></div>
                    <div className="text-[14px]" style={{ fontWeight: 800 }}>{s.v}</div>
                    <div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>

              <SectionHeader title="تفکیک وضعیت سفارشات" icon="fa-solid fa-layer-group" color="var(--aw-primary)" />
              <div className="p-3 rounded-[10px] flex flex-col gap-2.5" style={cardStyle}>
                {breakdown.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--aw-text-secondary)] w-16">{b.l}</span>
                    <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--aw-bg-app)' }}>
                      <div style={{ width: `${(b.n / maxN) * 100}%`, height: '100%', background: b.c, borderRadius: 9999 }} />
                    </div>
                    <span className="text-[11px] w-6 text-left" style={{ color: b.c, fontWeight: 700 }}>{b.n.toLocaleString('fa-IR')}</span>
                  </div>
                ))}
              </div>

              <SectionHeader title="فروش هفتگی" icon="fa-solid fa-calendar-week" color="var(--aw-primary)" />
              <div className="p-3 rounded-[10px]" style={cardStyle}>
                <div className="flex items-end justify-between gap-1.5" style={{ height: 90 }}>
                  {week.map((w, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div className="w-full rounded-t-md" style={{ height: `${(w.n / maxW) * 100}%`, background: 'linear-gradient(180deg, var(--aw-primary-light), var(--aw-primary-dark))', minHeight: 4 }} />
                      <span className="text-[9px] text-[var(--aw-text-muted)]">{w.d}</span>
                    </div>
                  ))}
                </div>
              </div>

              <SectionHeader title="پرفروش‌ترین محصولات" icon="fa-solid fa-fire" color="#F59E0B" />
              <div className="rounded-[10px]" style={cardStyle}>
                {topProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-3" style={i < topProducts.length - 1 ? { borderBottom: '1px solid var(--aw-border)' } : {}}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px]" style={{ background: 'var(--aw-primary-bg, rgba(16,185,129,0.12))', color: '#10B981', fontWeight: 800 }}>{(i + 1).toLocaleString('fa-IR')}</div>
                    <div className="flex-1">
                      <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{p.name}</div>
                      <div className="text-[10px] text-[var(--aw-text-muted)]">{p.qty.toLocaleString('fa-IR')} فروش</div>
                    </div>
                    <span className="text-[12px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(p.sum)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function InvoiceDetailModal({ invoice }: { invoice: any }) {
  const { showToast, company } = useApp() as any;
  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    paid: { label: 'پرداخت‌شده', color: '#10B981', icon: 'fa-check-circle' },
    pending: { label: 'در انتظار', color: '#F59E0B', icon: 'fa-clock' },
    returned: { label: 'مرجوعی', color: 'var(--aw-primary)', icon: 'fa-rotate-left' },
    cancelled: { label: 'لغو‌شده', color: '#EF4444', icon: 'fa-ban' },
  };
  const st = statusConfig[invoice.status] || statusConfig.paid;
  const items = INVOICE_ITEMS[invoice.id] || [{ name: 'محصول پیش‌فرض', qty: invoice.items, price: Math.round((invoice.amount - invoice.tax + invoice.discount) / Math.max(1, invoice.items)), icon: 'fa-solid fa-box' }];
  const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
  return (
    <div className="flex flex-col">
      {/* Status header */}
      <div className="p-4 rounded-[10px] mb-3 text-center" style={{ ...cardStyle, background: `linear-gradient(135deg, ${st.color}15, transparent)`, border: `1px solid ${st.color}33` }}>
        <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: `${st.color}22` }}>
          <i className={`fa-solid ${st.icon} text-[24px]`} style={{ color: st.color }} />
        </div>
        <div className="text-[22px] mb-1" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(invoice.amount)}</div>
        <StatusBadge label={st.label} color={st.color} />
        <div className="text-[10px] text-[var(--aw-text-muted)] mt-2">{invoice.date}</div>
      </div>

      {/* Customer info */}
      <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
        <div className="flex items-center gap-2 mb-2">
          <i className="fa-solid fa-user text-[12px]" style={{ color: 'var(--aw-primary)' }} />
          <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>اطلاعات مشتری</span>
        </div>
        <div className="flex items-center gap-3">
          <LetterAvatar name={invoice.customer} size={40} radius={13} />
          <div className="flex-1">
            <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{invoice.customer}</div>
            <div className="text-[10px] text-[var(--aw-text-muted)] flex items-center gap-1 mt-0.5"><i className="fa-solid fa-phone text-[9px]" />{invoice.phone}</div>
          </div>
          <button onClick={() => { (api as any).create('messages', { to: invoice.customer, text: 'پیام از تیم فروش', from: 'sales' }, company); showToast('پیام به ' + invoice.customer + ' ارسال شد ✅'); }} className="px-2.5 py-1 rounded-md border-none cursor-pointer text-[10px]" style={{ background: 'var(--aw-primary-bg)', color: 'var(--aw-primary)', fontWeight: 600 }}>
            <i className="fa-solid fa-message ml-1 text-[9px]" />پیام
          </button>
        </div>
      </div>

      {/* Products list */}
      <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
        <div className="flex items-center gap-2 mb-2">
          <i className="fa-solid fa-bag-shopping text-[12px]" style={{ color: '#10B981' }} />
          <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>محصولات خریداری‌شده</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full mr-auto" style={{ background: '#10B98122', color: '#10B981', fontWeight: 600 }}>{items.length.toLocaleString('fa-IR')} آیتم</span>
        </div>
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2.5 py-2" style={i < items.length - 1 ? { borderBottom: '1px solid var(--aw-border)' } : {}}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--aw-bg-app)' }}>
              <i className={`${it.icon} text-[14px]`} style={{ color: '#10B981' }} />
            </div>
            <div className="flex-1">
              <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{it.name}</div>
              <div className="text-[10px] text-[var(--aw-text-muted)]">{it.qty.toLocaleString('fa-IR')} × {formatPrice(it.price)}</div>
            </div>
            <span className="text-[12px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(it.qty * it.price)}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
        <div className="flex items-center gap-2 mb-2">
          <i className="fa-solid fa-receipt text-[12px]" style={{ color: '#F59E0B' }} />
          <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>محاسبات</span>
        </div>
        <div className="flex justify-between py-1.5 text-[11px]"><span className="text-[var(--aw-text-muted)]">جمع جزء</span><span className="text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{formatPrice(subtotal)}</span></div>
        <div className="flex justify-between py-1.5 text-[11px]"><span className="text-[var(--aw-text-muted)] flex items-center gap-1"><i className="fa-solid fa-tag text-[9px]" style={{ color: 'var(--aw-primary)' }} />تخفیف</span><span style={{ color: 'var(--aw-primary)', fontWeight: 700 }}>− {formatPrice(invoice.discount)}</span></div>
        <div className="flex justify-between py-1.5 text-[11px]"><span className="text-[var(--aw-text-muted)] flex items-center gap-1"><i className="fa-solid fa-percent text-[9px]" style={{ color: '#F59E0B' }} />مالیات (۹٪)</span><span style={{ color: '#F59E0B', fontWeight: 700 }}>+ {formatPrice(invoice.tax)}</span></div>
        <div className="flex justify-between py-2 mt-1 text-[13px]" style={{ borderTop: '1px dashed var(--aw-border)' }}>
          <span className="text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>مبلغ نهایی</span>
          <span style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(invoice.amount)}</span>
        </div>
      </div>

      {/* Meta */}
      <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
        {[
          { label: 'شماره فاکتور', value: invoice.id, icon: 'fa-solid fa-hashtag' },
          { label: 'تاریخ', value: invoice.date, icon: 'fa-solid fa-calendar' },
          { label: 'روش پرداخت', value: invoice.method, icon: 'fa-solid fa-credit-card' },
        ].map((row, i, arr) => (
          <div key={i} className="flex items-center justify-between py-2" style={i < arr.length - 1 ? { borderBottom: '1px solid var(--aw-border)' } : {}}>
            <span className="text-[11px] text-[var(--aw-text-muted)] flex items-center gap-1.5"><i className={`${row.icon} text-[10px]`} />{row.label}</span>
            <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button className="flex-1 py-2.5 rounded-[10px] border-none cursor-pointer text-[12px]" style={{ background: 'var(--aw-bg-card)', color: 'var(--aw-primary)', border: '1px solid var(--aw-primary-bg)', fontWeight: 600 }} onClick={() => { const ok = __dlCsv('invoice-' + (invoice.id || 'sale') + '.csv', [invoice]); showToast(ok ? 'فاکتور دانلود شد ✅' : 'خطا در دانلود', 'success'); }}>
          <i className="fa-solid fa-download ml-1" />دانلود
        </button>
        <button className="flex-1 py-2.5 rounded-[10px] border-none cursor-pointer text-[12px]" style={{ background: 'var(--aw-bg-card)', color: '#10B981', border: '1px solid #10B98133', fontWeight: 600 }} onClick={() => { (api as any).create('invoices', { ...invoice, status: 'sent' }, company); showToast('فاکتور برای مشتری ارسال شد ✅', 'success'); }}>
          <i className="fa-solid fa-paper-plane ml-1" />ارسال
        </button>
        {invoice.status === 'pending' && (
          <button className="flex-1 py-2.5 rounded-[10px] border-none text-white cursor-pointer text-[12px]" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 700 }} onClick={() => { (api as any).create('invoices', { ...invoice, status: 'paid' }, company); showToast('پرداخت تایید شد ✅', 'success'); }}>
            <i className="fa-solid fa-check ml-1" />تایید
          </button>
        )}
        {invoice.status === 'paid' && (
          <button className="flex-1 py-2.5 rounded-[10px] border-none cursor-pointer text-[12px]" style={{ background: 'var(--aw-bg-card)', color: 'var(--aw-primary)', border: '1px solid var(--aw-primary-bg)', fontWeight: 600 }} onClick={() => { (api as any).create('invoices', { ...invoice, status: 'returned' }, company); showToast('درخواست مرجوعی ثبت شد ✅', 'info'); }}>
            <i className="fa-solid fa-rotate-left ml-1" />مرجوعی
          </button>
        )}
      </div>
    </div>
  );
}

// ========================
// 3) SALES INVOICES SCREEN
// ========================
export function SalesInvoicesScreen() {
  const { showToast, setAdminScreen, openModal, company } = useApp() as any;
  const [activeTab, setActiveTab] = useState('all');
  const [__srvInv, setSrvInv] = useState<any[]>([]);
  useEffect(() => { if (!company) return; (async () => { try { const v: any = await (api as any).list('invoices', company); if (Array.isArray(v)) setSrvInv((v as any[]).filter((iv: any) => iv.source === 'pos' || iv.source === 'sales').map((iv: any) => ({ id: iv.id, customer: iv.customer || 'مهمان', phone: iv.phone || '', amount: iv.amount || iv.total || 0, discount: iv.discount || 0, tax: iv.tax || 0, status: iv.status || 'paid', date: iv.date || '—', items: Array.isArray(iv.items) ? iv.items.length : (iv.items || 0), method: iv.method || 'نقد' }))); } catch (_) {} })(); }, [company]);
  const [selectedInvoice, setSelectedInvoice] = useState<typeof INVOICES_DATA[0] | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [extraInvoices, setExtraInvoices] = useState<typeof INVOICES_DATA>([]);
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cAmount, setCAmount] = useState('');
  const [cDiscount, setCDiscount] = useState('');
  const [cMethod, setCMethod] = useState('نقد');
  const [cStatus, setCStatus] = useState('paid');
  const resetCreate = () => { setCName(''); setCPhone(''); setCAmount(''); setCDiscount(''); setCMethod('نقد'); setCStatus('paid'); };
  const faDigits = (s: string) => s.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  const parseNum = (s: string) => parseInt(faDigits(s).replace(/[^\d]/g, '') || '0', 10);
  const grp = (n: number) => n.toLocaleString('en-US').replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
  const submitInvoice = () => {
    if (!cName.trim()) { showToast('نام مشتری را وارد کنید'); return; }
    const amount = parseNum(cAmount);
    if (amount <= 0) { showToast('مبلغ فاکتور را وارد کنید'); return; }
    const discount = parseNum(cDiscount);
    const tax = Math.round((amount - discount) * 0.09);
    const now = new Date();
    const id = 'INV-' + (1500 + extraInvoices.length + Math.floor(Math.random() * 90));
    const today = '۱۴۰۴/۱۲/' + grp(now.getDate());
    try { (api as any).create('invoices', { id, customer: cName.trim(), phone: cPhone.trim() || '—', amount, discount, tax, status: cStatus, date: today, source: 'sales', company }); } catch (_) {}
    setExtraInvoices(prev => [{ id, customer: cName.trim(), phone: cPhone.trim() || '—', amount, discount, tax, status: cStatus, date: today, items: 1, method: cMethod } as any, ...prev]);
    showToast('فاکتور ' + id + ' با موفقیت ثبت شد ✅', 'success');
    resetCreate();
    setShowCreate(false);
    setActiveTab('all');
  };

  const tabs = [
    { id: 'all', label: 'همه', icon: 'fa-solid fa-list' },
    { id: 'paid', label: 'پرداخت‌شده', icon: 'fa-solid fa-check-circle' },
    { id: 'pending', label: 'در انتظار', icon: 'fa-solid fa-clock' },
    { id: 'returned', label: 'مرجوعی', icon: 'fa-solid fa-rotate-left' },
    { id: 'cancelled', label: 'لغو‌شده', icon: 'fa-solid fa-ban' },
  ];

  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    paid: { label: 'پرداخت‌شده', color: '#10B981', icon: 'fa-check-circle' },
    pending: { label: 'در انتظار', color: '#F59E0B', icon: 'fa-clock' },
    returned: { label: 'مرجوعی', color: 'var(--aw-primary)', icon: 'fa-rotate-left' },
    cancelled: { label: 'لغو‌شده', color: '#EF4444', icon: 'fa-ban' },
  };

  const ALL_INVOICES = [...extraInvoices, ...__srvInv];
  const filtered = ALL_INVOICES.filter(inv => {
    if (activeTab !== 'all' && inv.status !== activeTab) return false;
    if (methodFilter !== 'all' && inv.method !== methodFilter) return false;
    if (searchQuery && !inv.id.includes(searchQuery) && !inv.customer.includes(searchQuery) && !inv.phone.includes(searchQuery)) return false;
    return true;
  });

  const totalPaid = ALL_INVOICES.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const totalPending = ALL_INVOICES.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const totalReturned = ALL_INVOICES.filter(i => i.status === 'returned').reduce((s, i) => s + i.amount, 0);

  const paidInvoices = ALL_INVOICES.filter(i => i.status === 'paid');
  const avgPurchase = paidInvoices.length > 0 ? Math.round(paidInvoices.reduce((s, i) => s + i.amount, 0) / paidInvoices.length) : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-center px-4 py-3">
        <div className="flex flex-1 items-center gap-1.5 p-1 rounded-full" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
          <button className="flex-1 h-9 rounded-full border cursor-pointer flex items-center justify-center gap-1.5 text-[12px] transition-all" style={{ background: 'transparent', borderColor: 'color-mix(in srgb, var(--aw-border) 22%, transparent)', color: 'var(--aw-text-secondary)', fontWeight: 600 }} onClick={() => setAdminScreen('salesOrdersScreen')}>
            <i className="fa-solid fa-bag-shopping text-[12px]" /> سفارشات
          </button>
          <button className="flex-1 h-9 rounded-full border cursor-pointer flex items-center justify-center gap-1.5 text-[12px] transition-all" style={{ background: 'var(--aw-primary-bg)', borderColor: 'color-mix(in srgb, var(--aw-primary) 22%, transparent)', color: 'var(--aw-primary)', fontWeight: 700 }}>
            <i className="fa-solid fa-file-invoice text-[12px]" /> فاکتورها
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="px-4 pt-3" style={{ background: 'var(--aw-bg-header)' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-[10px]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
            <i className="fa-solid fa-magnifying-glass text-[11px] text-[var(--aw-text-muted)]" />
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus
              placeholder="جستجو در شماره فاکتور، مشتری یا تلفن..."
              className="flex-1 bg-transparent border-none outline-none text-[12px] text-[var(--aw-text-primary)]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="w-5 h-5 rounded-[10px] border-none cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-bg-app)', color: 'var(--aw-text-muted)' }}>
                <i className="fa-solid fa-xmark text-[9px]" />
              </button>
            )}
          </div>
        </div>
      )}

      {showFilter && (
        <div className="px-4 pt-3" style={{ background: 'var(--aw-bg-header)' }}>
          <div className="text-[11px] text-[var(--aw-text-muted)] mb-1.5">فیلتر بر اساس روش پرداخت</div>
          <div className="flex gap-1.5 flex-wrap">
            {['all', 'نقد', 'کارت', 'کیف پول'].map(m => (
              <button key={m} onClick={() => setMethodFilter(m)} className="text-[10px] px-2.5 py-1 rounded-full border-none cursor-pointer" style={methodFilter === m
                ? { background: '#10B981', color: '#fff', fontWeight: 600 }
                : { background: 'var(--aw-bg-card)', color: 'var(--aw-text-secondary)', border: '1px solid var(--aw-border)' }}>
                {m === 'all' ? 'همه' : m}
              </button>
            ))}
          </div>
        </div>
      )}

      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="p-2.5 rounded-[10px]" style={cardStyle}>
            <div className="flex items-center gap-1 mb-1"><i className="fa-solid fa-check-circle text-[10px]" style={{ color: '#10B981' }} /><span className="text-[9px] text-[var(--aw-text-muted)]">پرداخت‌شده</span></div>
            <div className="text-[12px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(totalPaid)}</div>
          </div>
          <div className="p-2.5 rounded-[10px]" style={cardStyle}>
            <div className="flex items-center gap-1 mb-1"><i className="fa-solid fa-clock text-[10px]" style={{ color: '#F59E0B' }} /><span className="text-[9px] text-[var(--aw-text-muted)]">در انتظار</span></div>
            <div className="text-[12px]" style={{ color: '#F59E0B', fontWeight: 700 }}>{formatPrice(totalPending)}</div>
          </div>
          <div className="p-2.5 rounded-[10px]" style={cardStyle}>
            <div className="flex items-center gap-1 mb-1"><i className="fa-solid fa-rotate-left text-[10px]" style={{ color: 'var(--aw-primary)' }} /><span className="text-[9px] text-[var(--aw-text-muted)]">مرجوعی</span></div>
            <div className="text-[12px]" style={{ color: 'var(--aw-primary)', fontWeight: 700 }}>{formatPrice(totalReturned)}</div>
          </div>
        </div>

        {/* Analytics: avg + discount suggestion */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-3 rounded-[10px]" style={{ ...cardStyle, background: 'linear-gradient(135deg, var(--aw-primary-bg), transparent)', border: '1px solid var(--aw-primary-bg)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <i className="fa-solid fa-calculator text-[12px]" style={{ color: 'var(--aw-primary)' }} />
              <span className="text-[10px] text-[var(--aw-text-muted)]">میانگین مبلغ خرید</span>
            </div>
            <div className="text-[14px]" style={{ color: 'var(--aw-primary)', fontWeight: 700 }}>{formatPrice(avgPurchase)}</div>
            <div className="text-[9px] text-[var(--aw-text-muted)] mt-0.5">از {paidInvoices.length.toLocaleString('fa-IR')} فاکتور پرداخت‌شده</div>
          </div>
          <div className="p-3 rounded-[10px]" style={{ ...cardStyle, background: 'linear-gradient(135deg, var(--aw-primary-bg), transparent)', border: '1px solid var(--aw-primary-bg)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <i className="fa-solid fa-tag text-[12px]" style={{ color: 'var(--aw-primary)' }} />
              <span className="text-[10px] text-[var(--aw-text-muted)]">پیشنهاد تخفیف</span>
            </div>
            <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>۱۵٪ بالای ۸۰۰K</div>
            <button className="text-[9px] px-2 py-0.5 rounded-md border-none cursor-pointer text-white mt-1" style={{ background: 'var(--aw-primary)', fontWeight: 600 }} onClick={() => { (api as any).create('discount_codes', { label: '۱۵٪ بالای ۸۰۰K', pct: 15, min: 800000, active: true, createdAt: new Date().toISOString() }, company); showToast('کد تخفیف فعال شد ✅', 'success'); }}>اعمال</button>
          </div>
        </div>

        {/* Add invoice card */}
        <button onClick={() => setShowCreate(true)} className="w-full flex items-center gap-3 p-3 mb-3 rounded-2xl border cursor-pointer transition-all" style={{ background: 'var(--aw-primary-bg)', borderColor: 'var(--aw-primary)' }}>
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
            <i className="fa-solid fa-plus text-[16px] text-white" />
          </div>
          <div className="flex-1 text-right">
            <div className="text-[13px]" style={{ fontWeight: 700, color: 'var(--aw-primary)' }}>افزودن فاکتور جدید</div>
            <div className="text-[10px] text-[var(--aw-text-muted)]">ثبت دستی فاکتور و تراکنش</div>
          </div>
          <i className="fa-solid fa-chevron-left text-[12px]" style={{ color: 'var(--aw-primary)' }} />
        </button>

        {/* Invoice list */}
        <SectionHeader title="لیست فاکتورها" icon="fa-solid fa-file-invoice" count={filtered.length} />
        <div className="flex flex-col gap-2 mt-2">
          {filtered.length === 0 && (
            <div className="p-8 rounded-[10px] text-center text-[12px] text-[var(--aw-text-muted)]" style={cardStyle}>
              <i className="fa-solid fa-inbox text-[24px] mb-2 block" style={{ opacity: 0.4 }} />فاکتوری یافت نشد
            </div>
          )}
          {filtered.map(inv => {
            const st = statusConfig[inv.status];
            return (
              <motion.div
                key={inv.id}
                className="p-3 rounded-[10px] cursor-pointer"
                style={cardStyle}
                whileTap={{ scale: 0.98 }}
                onClick={() => openModal('جزئیات فاکتور ' + inv.id, <InvoiceDetailModal invoice={inv} />)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{inv.id}</span>
                    <StatusBadge label={st.label} color={st.color} />
                  </div>
                  <span className="text-[11px] text-[var(--aw-text-muted)]">{inv.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[12px] text-[var(--aw-text-secondary)]"><i className="fa-solid fa-user text-[10px] ml-1" />{inv.customer}</div>
                    <div className="text-[11px] text-[var(--aw-text-muted)] mt-0.5">{inv.items} آیتم · {inv.method}</div>
                  </div>
                  <span className="text-[14px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(inv.amount)}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Invoice detail overlay */}
      <AnimatePresence>
        {false && selectedInvoice && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col"
            style={{ background: 'var(--aw-bg-app)' }}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--aw-bg-header)', borderBottom: '1px solid var(--aw-border)', boxShadow: '0 6px 16px color-mix(in srgb, var(--aw-primary) 9%, transparent)' }}>
              <button className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-primary)' }} onClick={() => setSelectedInvoice(null)}>
                <i className="fa-solid fa-arrow-right" />
              </button>
              <span className="text-[15px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>جزئیات فاکتور {selectedInvoice.id}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                const st = statusConfig[selectedInvoice.status];
                const items = INVOICE_ITEMS[selectedInvoice.id] || [{ name: 'محصول پیش‌فرض', qty: selectedInvoice.items, price: Math.round((selectedInvoice.amount - selectedInvoice.tax + selectedInvoice.discount) / Math.max(1, selectedInvoice.items)), icon: 'fa-solid fa-box' }];
                const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
                return (
                  <>
                    {/* Status header */}
                    <div className="p-4 rounded-[10px] mb-3 text-center" style={{ ...cardStyle, background: `linear-gradient(135deg, ${st.color}15, transparent)`, border: `1px solid ${st.color}33` }}>
                      <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: `${st.color}22` }}>
                        <i className={`fa-solid ${st.icon} text-[24px]`} style={{ color: st.color }} />
                      </div>
                      <div className="text-[22px] mb-1" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(selectedInvoice.amount)}</div>
                      <StatusBadge label={st.label} color={st.color} />
                      <div className="text-[10px] text-[var(--aw-text-muted)] mt-2">{selectedInvoice.date}</div>
                    </div>

                    {/* Customer info */}
                    <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fa-solid fa-user text-[12px]" style={{ color: 'var(--aw-primary)' }} />
                        <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>اطلاعات مشتری</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <LetterAvatar name={selectedInvoice.customer} size={40} radius={13} />
                        <div className="flex-1">
                          <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{selectedInvoice.customer}</div>
                          <div className="text-[10px] text-[var(--aw-text-muted)] flex items-center gap-1 mt-0.5"><i className="fa-solid fa-phone text-[9px]" />{selectedInvoice.phone}</div>
                        </div>
                        <button onClick={() => { (api as any).create('messages', { to: selectedInvoice.customer, name: selectedInvoice.name, text: 'پیام از تیم فروش', from: 'sales', at: new Date().toISOString() }, company); showToast('پیام به ' + selectedInvoice.name + ' ارسال شد ✅'); }} className="px-2.5 py-1 rounded-md border-none cursor-pointer text-[10px]" style={{ background: 'var(--aw-primary-bg)', color: 'var(--aw-primary)', fontWeight: 600 }}>
                          <i className="fa-solid fa-message ml-1 text-[9px]" />پیام
                        </button>
                      </div>
                    </div>

                    {/* Products list */}
                    <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fa-solid fa-bag-shopping text-[12px]" style={{ color: '#10B981' }} />
                        <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>محصولات خریداری‌شده</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full mr-auto" style={{ background: '#10B98122', color: '#10B981', fontWeight: 600 }}>{items.length.toLocaleString('fa-IR')} آیتم</span>
                      </div>
                      {items.map((it, i) => (
                        <div key={i} className="flex items-center gap-2.5 py-2" style={i < items.length - 1 ? { borderBottom: '1px solid var(--aw-border)' } : {}}>
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--aw-bg-app)' }}>
                            <i className={`${it.icon} text-[14px]`} style={{ color: '#10B981' }} />
                          </div>
                          <div className="flex-1">
                            <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{it.name}</div>
                            <div className="text-[10px] text-[var(--aw-text-muted)]">{it.qty.toLocaleString('fa-IR')} × {formatPrice(it.price)}</div>
                          </div>
                          <span className="text-[12px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(it.qty * it.price)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Totals: subtotal / discount / tax / amount */}
                    <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fa-solid fa-receipt text-[12px]" style={{ color: '#F59E0B' }} />
                        <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>محاسبات</span>
                      </div>
                      <div className="flex justify-between py-1.5 text-[11px]"><span className="text-[var(--aw-text-muted)]">جمع جزء</span><span className="text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{formatPrice(subtotal)}</span></div>
                      <div className="flex justify-between py-1.5 text-[11px]"><span className="text-[var(--aw-text-muted)] flex items-center gap-1"><i className="fa-solid fa-tag text-[9px]" style={{ color: 'var(--aw-primary)' }} />تخفیف</span><span style={{ color: 'var(--aw-primary)', fontWeight: 700 }}>− {formatPrice(selectedInvoice.discount)}</span></div>
                      <div className="flex justify-between py-1.5 text-[11px]"><span className="text-[var(--aw-text-muted)] flex items-center gap-1"><i className="fa-solid fa-percent text-[9px]" style={{ color: '#F59E0B' }} />مالیات (۹٪)</span><span style={{ color: '#F59E0B', fontWeight: 700 }}>+ {formatPrice(selectedInvoice.tax)}</span></div>
                      <div className="flex justify-between py-2 mt-1 text-[13px]" style={{ borderTop: '1px dashed var(--aw-border)' }}>
                        <span className="text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>مبلغ نهایی</span>
                        <span style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(selectedInvoice.amount)}</span>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
                      {[
                        { label: 'شماره فاکتور', value: selectedInvoice.id, icon: 'fa-solid fa-hashtag' },
                        { label: 'تاریخ', value: selectedInvoice.date, icon: 'fa-solid fa-calendar' },
                        { label: 'روش پرداخت', value: selectedInvoice.method, icon: 'fa-solid fa-credit-card' },
                      ].map((row, i, arr) => (
                        <div key={i} className="flex items-center justify-between py-2" style={i < arr.length - 1 ? { borderBottom: '1px solid var(--aw-border)' } : {}}>
                          <span className="text-[11px] text-[var(--aw-text-muted)] flex items-center gap-1.5"><i className={`${row.icon} text-[10px]`} />{row.label}</span>
                          <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{row.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button className="flex-1 py-2.5 rounded-[10px] border-none cursor-pointer text-[12px]" style={{ background: 'var(--aw-bg-card)', color: 'var(--aw-primary)', border: '1px solid var(--aw-primary-bg)', fontWeight: 600 }} onClick={() => { const ok = __dlCsv('invoice-' + (invoice.id || 'sale') + '.csv', [invoice]); showToast(ok ? 'فاکتور دانلود شد ✅' : 'خطا در دانلود', 'success'); }}>
                        <i className="fa-solid fa-download ml-1" />دانلود
                      </button>
                      <button className="flex-1 py-2.5 rounded-[10px] border-none cursor-pointer text-[12px]" style={{ background: 'var(--aw-bg-card)', color: '#10B981', border: '1px solid #10B98133', fontWeight: 600 }} onClick={() => { (api as any).create('invoices', { ...invoice, status: 'sent' }, company); showToast('فاکتور برای مشتری ارسال شد ✅', 'success'); }}>
                        <i className="fa-solid fa-paper-plane ml-1" />ارسال
                      </button>
                      {selectedInvoice.status === 'pending' && (
                        <button className="flex-1 py-2.5 rounded-[10px] border-none text-white cursor-pointer text-[12px]" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 700 }} onClick={() => { (api as any).create('invoices', { ...invoice, status: 'paid' }, company); showToast('پرداخت تایید شد ✅', 'success'); }}>
                          <i className="fa-solid fa-check ml-1" />تایید
                        </button>
                      )}
                      {selectedInvoice.status === 'paid' && (
                        <button className="flex-1 py-2.5 rounded-[10px] border-none cursor-pointer text-[12px]" style={{ background: 'var(--aw-bg-card)', color: 'var(--aw-primary)', border: '1px solid var(--aw-primary-bg)', fontWeight: 600 }} onClick={() => { (api as any).create('invoices', { ...invoice, status: 'returned' }, company); showToast('درخواست مرجوعی ثبت شد ✅', 'info'); }}>
                          <i className="fa-solid fa-rotate-left ml-1" />مرجوعی
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Invoice Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-end"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              className="w-full rounded-t-3xl flex flex-col"
              style={{ background: 'var(--aw-bg-app)' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1 rounded-full mx-auto mt-3" style={{ background: 'var(--aw-border)' }} />
              <div className="flex items-center gap-3 px-4 pt-3 pb-3" style={{ borderBottom: '1px solid var(--aw-border)' }}>
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
                  <i className="fa-solid fa-file-circle-plus text-[14px]" />
                </div>
                <div className="flex-1">
                  <div className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>ایجاد فاکتور جدید</div>
                  <div className="text-[10px] text-[var(--aw-text-muted)]">اطلاعات فاکتور را وارد کنید</div>
                </div>
                <button className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-primary)' }} onClick={() => setShowCreate(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
              <div className="p-4 flex flex-col gap-2.5">
                <div>
                  <label className="text-[11px] text-[var(--aw-text-secondary)] mb-1 block flex items-center gap-1.5"><i className="fa-solid fa-user text-[10px]" style={{ color: '#10B981' }} />نام مشتری</label>
                  <input type="text" value={cName} onChange={e => setCName(e.target.value)} placeholder="انتخاب یا وارد کنید" className="w-full px-3 py-2.5 rounded-[10px] border-none text-[12px] text-[var(--aw-text-primary)]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }} />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--aw-text-secondary)] mb-1 block flex items-center gap-1.5"><i className="fa-solid fa-phone text-[10px]" style={{ color: '#10B981' }} />شماره تماس</label>
                  <input type="text" dir="ltr" value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder="۰۹۱۲xxxxxxx" className="w-full px-3 py-2.5 rounded-[10px] border-none text-[12px] text-[var(--aw-text-primary)]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-[var(--aw-text-secondary)] mb-1 block flex items-center gap-1.5"><i className="fa-solid fa-coins text-[10px]" style={{ color: '#10B981' }} />مبلغ کل (تومان)</label>
                    <input type="text" dir="ltr" inputMode="numeric" value={cAmount ? grp(parseNum(cAmount)) : ''} onChange={e => setCAmount(e.target.value)} placeholder="۰" className="w-full px-3 py-2.5 rounded-[10px] border-none text-[12px] text-[var(--aw-text-primary)]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }} />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--aw-text-secondary)] mb-1 block flex items-center gap-1.5"><i className="fa-solid fa-tag text-[10px]" style={{ color: '#10B981' }} />تخفیف (تومان)</label>
                    <input type="text" dir="ltr" inputMode="numeric" value={cDiscount ? grp(parseNum(cDiscount)) : ''} onChange={e => setCDiscount(e.target.value)} placeholder="۰" className="w-full px-3 py-2.5 rounded-[10px] border-none text-[12px] text-[var(--aw-text-primary)]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }} />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[var(--aw-text-secondary)] mb-1 block flex items-center gap-1.5"><i className="fa-solid fa-credit-card text-[10px]" style={{ color: '#10B981' }} />روش پرداخت</label>
                  <div className="flex gap-1.5">
                    {['نقد', 'کارت', 'کیف پول'].map(m => {
                      const on = cMethod === m;
                      return (
                        <button key={m} onClick={() => setCMethod(m)} className="flex-1 py-2 rounded-[10px] border-none cursor-pointer text-[11px]" style={{ background: on ? '#10B981' : 'var(--aw-bg-card)', color: on ? '#fff' : 'var(--aw-text-secondary)', border: on ? '1px solid #10B981' : '1px solid var(--aw-border)', fontWeight: on ? 700 : 600 }}>
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[var(--aw-text-secondary)] mb-1 block flex items-center gap-1.5"><i className="fa-solid fa-circle-info text-[10px]" style={{ color: '#10B981' }} />وضعیت</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {[{ id: 'paid', label: 'پرداخت‌شده', c: '#10B981' }, { id: 'pending', label: 'در انتظار', c: '#F59E0B' }, { id: 'returned', label: 'مرجوعی', c: 'var(--aw-primary)' }].map(s => {
                      const on = cStatus === s.id;
                      return (
                        <button key={s.id} onClick={() => setCStatus(s.id)} className="flex-1 py-2 rounded-[10px] border-none cursor-pointer text-[11px]" style={{ background: on ? s.c : 'var(--aw-bg-card)', color: on ? '#fff' : 'var(--aw-text-secondary)', border: on ? `1px solid ${s.c}` : '1px solid var(--aw-border)', fontWeight: on ? 700 : 600 }}>
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {parseNum(cAmount) > 0 && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-[10px] text-[11px]" style={{ background: '#10B98115' }}>
                    <span className="text-[var(--aw-text-secondary)]">مبلغ نهایی (با مالیات ۹٪)</span>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>{grp(parseNum(cAmount) - parseNum(cDiscount) + Math.round((parseNum(cAmount) - parseNum(cDiscount)) * 0.09))} ت</span>
                  </div>
                )}
                <button className="w-full py-3 rounded-[10px] border-none text-white cursor-pointer text-[13px] mt-2" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 700 }} onClick={submitInvoice}>
                  <i className="fa-solid fa-check ml-1.5" />ثبت فاکتور
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ========================
// 3) SALES MENU / PRODUCTS SCREEN
// ========================
export function SalesMenuScreen() {
  const { showToast, openModal, closeModal, company, companies } = useApp();
  const [catSheetTop, setCatSheetTop] = React.useState(0);
  React.useLayoutEffect(() => {
    const measure = () => {
      const corner = document.querySelector('[data-avatar-corner]');
      const anchor = document.querySelector('[data-chat-top-anchor]');
      let b = 0;
      if (corner && corner.getBoundingClientRect().height > 0) b = corner.getBoundingClientRect().bottom + 6;
      else if (anchor) b = anchor.getBoundingClientRect().bottom;
      setCatSheetTop(Math.max(0, b));
    };
    measure();
    const iv = setInterval(measure, 200);
    window.addEventListener('resize', measure);
    return () => { clearInterval(iv); window.removeEventListener('resize', measure); };
  }, []);
  const _actType = companies[company]?.type;
  const prodTabLabel = _actType === 'کافه و رستوران' ? 'منو' : _actType === 'خدمات' ? 'لیست خدمات' : 'محصولات';
  const bizFromType = _actType === 'کافه و رستوران' ? 'restaurant' : _actType === 'خدمات' ? 'services' : 'other';
  const [activeTab, setActiveTab] = useState('categories');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [npName, setNpName] = useState('');
  const [npCat, setNpCat] = useState('');
  const [npPrice, setNpPrice] = useState('');
  const [npStock, setNpStock] = useState('');
  const [npUnit, setNpUnit] = useState('');
  const [npDesc, setNpDesc] = useState('');
  const [bizType, setBizType] = useState(bizFromType);
  const biz = BUSINESS_TYPES.find(b => b.id === bizType) || BUSINESS_TYPES[0];
  const [categories, setCategories] = useState<PresetCat[]>(() => { const _base = (BUSINESS_TYPES.find(b => b.id === bizFromType) || BUSINESS_TYPES[0]).cats; try { const _sv = JSON.parse(localStorage.getItem('SALES_MENU_CATS') || '[]'); if (Array.isArray(_sv) && _sv.length) return [..._base, ..._sv]; } catch (_) {} return _base; });
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('fa-solid fa-box');
  const [newCatColor, setNewCatColor] = useState('#10B981');
  const [newCatParent, setNewCatParent] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatActive, setNewCatActive] = useState(true);

  // Drive the whole products/menu screen off the company's activity type.
  React.useEffect(() => {
    const b = BUSINESS_TYPES.find(x => x.id === bizFromType) || BUSINESS_TYPES[0];
    setBizType(bizFromType);
    setCategories(b.cats);
    setSelectedCat(null);
    setExpandedCat(null);
  }, [bizFromType]);

  const changeBiz = (id: string) => {
    const b = BUSINESS_TYPES.find(x => x.id === id) || BUSINESS_TYPES[0];
    setBizType(id);
    setCategories(b.cats);
    setSelectedCat(null);
    setExpandedCat(null);
    setActiveTab('categories');
  };

  const catMenu = (cat: PresetCat) => openModal(cat.name, (
    <div className="flex flex-col gap-1">
      {[
        { l: 'ویرایش نام', i: 'fa-solid fa-pen', a: () => showToast('ویرایش نام دسته‌بندی') },
        { l: 'تغییر آیکون', i: 'fa-solid fa-icons', a: () => showToast('تغییر آیکون') },
        { l: 'جابه‌جایی ترتیب', i: 'fa-solid fa-up-down-left-right', a: () => showToast('حالت جابه‌جایی فعال شد') },
        { l: 'افزودن زیردسته', i: 'fa-solid fa-sitemap', a: () => showToast('افزودن زیردسته جدید') },
        { l: 'غیرفعال‌سازی', i: 'fa-solid fa-eye-slash', a: () => showToast('دسته‌بندی غیرفعال شد') },
        { l: 'حذف', i: 'fa-solid fa-trash', a: () => { setCategories(prev => prev.filter(c => c.id !== cat.id)); showToast('دسته‌بندی حذف شد'); }, danger: true },
      ].map((o, i) => (
        <button key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border-none cursor-pointer text-[13px] text-right" style={{ background: 'transparent', color: o.danger ? '#EF4444' : 'var(--aw-text-primary)', fontWeight: 600 }} onClick={() => { closeModal(); o.a(); }}>
          <i className={`${o.i} text-[12px] w-4`} style={{ color: o.danger ? '#EF4444' : '#10B981' }} />{o.l}
        </button>
      ))}
    </div>
  ));

  const CAT_ICONS = ['fa-solid fa-utensils', 'fa-solid fa-shirt', 'fa-solid fa-mobile-screen', 'fa-solid fa-laptop', 'fa-solid fa-couch', 'fa-solid fa-spray-can-sparkles', 'fa-solid fa-book', 'fa-solid fa-ring', 'fa-solid fa-pills', 'fa-solid fa-shoe-prints', 'fa-solid fa-gamepad', 'fa-solid fa-dumbbell', 'fa-solid fa-paw', 'fa-solid fa-gift', 'fa-solid fa-mug-hot', 'fa-solid fa-leaf', 'fa-solid fa-wrench', 'fa-solid fa-box', 'fa-solid fa-car', 'fa-solid fa-gem'];
  const CAT_COLORS = ['#10B981', 'var(--aw-primary)', 'var(--aw-primary)', 'var(--aw-primary)', '#F59E0B', 'var(--aw-primary)', '#EF4444', '#22C55E', 'var(--aw-primary)', '#FFD700'];

  const submitNewCategory = () => {
    if (!newCatName.trim()) { showToast('نام دسته‌بندی را وارد کنید', 'error'); return; }
    if (!newCatActive) { showToast(`دسته‌بندی "${newCatName.trim()}" به‌صورت غیرفعال ذخیره شد`, 'info'); setShowAddCat(false); return; }
    const id = `cat-${Date.now()}`;
    const _newCat = { id, name: newCatName.trim(), icon: newCatIcon, count: 0, color: newCatColor, subs: [] }; setCategories(prev => [...prev, _newCat]); try { const _sv = JSON.parse(localStorage.getItem('SALES_MENU_CATS') || '[]'); localStorage.setItem('SALES_MENU_CATS', JSON.stringify([...(Array.isArray(_sv) ? _sv : []), _newCat])); } catch (_) {}
    showToast(`دسته‌بندی "${newCatName.trim()}" اضافه شد`, 'success');
    setNewCatName(''); setNewCatIcon('fa-solid fa-box'); setNewCatColor('#10B981'); setNewCatParent(''); setNewCatDesc(''); setNewCatActive(true);
    setShowAddCat(false);
  };

  const tabs = [
    { id: 'categories', label: 'دسته‌بندی', icon: 'fa-solid fa-layer-group' },
    { id: 'products', label: prodTabLabel, icon: 'fa-solid fa-box' },
    { id: 'stock', label: 'موجودی', icon: 'fa-solid fa-warehouse' },
  ];

  const __coMenu = (useApp() as any).company;
  const [__menuProd, setMenuProd] = useState<any[]>([]);
  useEffect(() => { if (!__coMenu) return; (async () => { try { const v: any = await (api as any).list('products', __coMenu); if (Array.isArray(v)) setMenuProd((v as any[]).map(((p: any) => ({ id: p.id, name: p.name, category: p.category || 'food', price: p.priceNum || p.price || 0, stock: p.stock ?? 99, unit: p.unit || 'عدد', img: p.img || p.icon || '📦', discount: p.discount || 0 })))); } catch (_) {} })(); }, [__coMenu]);
  const PRODUCTS = __menuProd;
  const _catFiltered = selectedCat ? PRODUCTS.filter(p => p.category === selectedCat) : PRODUCTS;
  // Preset (non-restaurant) categories have no linked mock products → show all as a demo fallback
  const displayProducts = _catFiltered.length > 0 ? _catFiltered : PRODUCTS;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TabBar tabs={tabs} active={activeTab} onChange={(id) => { setActiveTab(id); setSelectedCat(null); }} />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeTab === 'categories' && (
          <>
            <SectionHeader
              title="دسته‌بندی محصولات" icon="fa-solid fa-layer-group" count={categories.length}
              action={{ label: '+ دسته‌بندی جدید', onClick: () => setShowAddCat(true) }}
            />
            <div className="grid grid-cols-2 gap-2 mt-2 md:grid-cols-4">
              {categories.map(cat => {
                const open = expandedCat === cat.id;
                const subs = (cat as PresetCat).subs || [];
                return (
                  <div key={cat.id} className="rounded-[10px] relative" style={{ ...cardStyle, gridColumn: open && subs.length ? '1 / -1' : undefined }}>
                    {/* 3-dot menu */}
                    <button
                      className="absolute top-1.5 left-1.5 w-6 h-6 rounded-lg border-none cursor-pointer flex items-center justify-center z-10"
                      style={{ background: 'var(--aw-bg-app)', color: 'var(--aw-text-muted)' }}
                      onClick={(e) => { e.stopPropagation(); catMenu(cat); }}
                    >
                      <i className="fa-solid fa-ellipsis-vertical text-[11px]" />
                    </button>
                    <button
                      className="w-full p-4 bg-transparent border-none cursor-pointer flex flex-col items-center gap-2"
                      onClick={() => subs.length ? setExpandedCat(open ? null : cat.id) : (setSelectedCat(cat.id), setActiveTab('products'))}
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${cat.color}22` }}>
                        <i className={`${cat.icon} text-[18px]`} style={{ color: cat.color }} />
                      </div>
                      <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{cat.name}</span>
                      <span className="text-[11px] text-[var(--aw-text-muted)]">{cat.count} محصول{subs.length ? ` · ${subs.length} زیردسته` : ''}</span>
                      {subs.length > 0 && <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'} text-[9px] text-[var(--aw-text-muted)]`} />}
                    </button>
                    {/* Sub-categories accordion */}
                    <AnimatePresence>
                      {open && subs.length > 0 && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-3 pb-3">
                          <div className="flex flex-col gap-1.5 pt-1" style={{ borderTop: '1px solid var(--aw-border)' }}>
                            {subs.map((s, si) => (
                              <button key={si} className="flex items-center gap-2 px-2.5 py-2 rounded-lg border-none cursor-pointer text-[12px] text-right" style={{ background: 'var(--aw-bg-app)', color: 'var(--aw-text-secondary)' }} onClick={() => { setSelectedCat(cat.id); setActiveTab('products'); }}>
                                <i className="fa-solid fa-angle-left text-[9px]" style={{ color: cat.color }} />{s}
                              </button>
                            ))}
                            <button className="mt-1 py-2 rounded-lg border-none cursor-pointer text-[12px] text-white" style={{ background: '#10B981', fontWeight: 600 }} onClick={() => { setSelectedCat(cat.id); setActiveTab('products'); }}>
                              <i className="fa-solid fa-box ml-1" />مشاهده محصولات
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'products' && (
          <>
            {selectedCat && (
              <button
                className="flex items-center gap-1 text-[12px] mb-2 px-2 py-1 rounded-[10px] border-none cursor-pointer"
                style={{ background: 'var(--aw-bg-card)', color: '#10B981' }}
                onClick={() => setSelectedCat(null)}
              >
                <i className="fa-solid fa-arrow-right text-[10px]" /> همه محصولات
              </button>
            )}
            <SectionHeader title={selectedCat ? categories.find(c => c.id === selectedCat)?.name || 'محصولات' : 'همه محصولات'} icon="fa-solid fa-box" count={displayProducts.length} action={{ label: '+ افزودن محصول', onClick: () => { setNpCat(selectedCat || ''); setShowAddProduct(true); } }} />
            <div className="flex flex-col gap-2 mt-2">
              {displayProducts.map(product => (
                <div key={product.id} className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer transition-all hover:border-[#10B981]" style={cardStyle} onClick={() => openModal(product.name, <ProductDetail product={product} />)}>
                  <span className="text-[28px]">{product.img}</span>
                  <div className="flex-1">
                    <div className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{product.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[12px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(product.price)}</span>
                      {product.discount > 0 && <StatusBadge label={`${product.discount}% تخفیف`} color="#EF4444" />}
                    </div>
                    <div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">موجودی: {product.stock} {product.unit}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button className="w-7 h-7 rounded-lg border-none cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-bg-app)', color: 'var(--aw-primary)' }} onClick={(e) => { e.stopPropagation(); openModal('ویرایش: ' + product.name, <EditProductContent product={product} />); }}>
                      <i className="fa-solid fa-pen text-[10px]" />
                    </button>
                    <button className="w-7 h-7 rounded-lg border-none cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-bg-app)', color: '#EF4444' }} onClick={(e) => { e.stopPropagation(); try { (api as any).remove('products', product.id); } catch (_) {} setMenuProd(prev => prev.filter((x: any) => x.id !== product.id)); showToast('محصول حذف شد'); }}>
                      <i className="fa-solid fa-trash text-[10px]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'pricing' && (
          <>
            <SectionHeader title="قیمت‌گذاری و تخفیف‌ها" icon="fa-solid fa-tag" color="#F59E0B" />
            <div className="flex flex-col gap-2 mt-2">
              {PRODUCTS.map(product => (
                <div key={product.id} className="flex items-center gap-3 p-3 rounded-[10px]" style={cardStyle}>
                  <span className="text-[20px]">{product.img}</span>
                  <div className="flex-1">
                    <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{product.name}</div>
                  </div>
                  <div className="text-left">
                    <div className="text-[13px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(product.price)}</div>
                    {product.discount > 0 && (
                      <div className="text-[11px]" style={{ color: '#EF4444' }}>
                        <i className="fa-solid fa-arrow-down text-[8px] ml-0.5" />{product.discount}%
                        → {formatPrice(Math.round(product.price * (1 - product.discount / 100)))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'stock' && (
          <>
            <SectionHeader title="وضعیت موجودی" icon="fa-solid fa-warehouse" color="var(--aw-primary)" />
            {/* Low stock alert */}
            {PRODUCTS.filter(p => p.stock <= 5).length > 0 && (
              <div className="p-3 rounded-[10px] mb-3 flex items-center gap-2" style={{ background: '#F59E0B15', border: '1px solid #F59E0B33' }}>
                <i className="fa-solid fa-triangle-exclamation text-[14px]" style={{ color: '#F59E0B' }} />
                <span className="text-[12px]" style={{ color: '#F59E0B', fontWeight: 600 }}>
                  {PRODUCTS.filter(p => p.stock <= 5).length} محصول با موجودی کم یا ناموجود
                </span>
              </div>
            )}
            <div className="flex flex-col gap-2 mt-2">
              {[...PRODUCTS].sort((a, b) => a.stock - b.stock).map(product => {
                const stockColor = product.stock === 0 ? '#EF4444' : product.stock <= 5 ? '#F59E0B' : '#10B981';
                return (
                  <div key={product.id} className="flex items-center gap-3 p-3 rounded-[10px]" style={cardStyle}>
                    <span className="text-[20px]">{product.img}</span>
                    <div className="flex-1">
                      <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{product.name}</div>
                      <div className="w-full h-1.5 rounded-full mt-1.5" style={{ background: 'var(--aw-bg-app)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, product.stock * 2)}%`, background: stockColor }} />
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-[14px]" style={{ color: stockColor, fontWeight: 700 }}>{product.stock}</span>
                      <span className="text-[10px] text-[var(--aw-text-muted)] block">{product.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add product modal */}
      <AnimatePresence>
        {showAddProduct && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col"
            style={{ background: 'var(--aw-bg-app)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--aw-bg-header)', borderBottom: '1px solid var(--aw-border)', boxShadow: '0 6px 16px color-mix(in srgb, var(--aw-primary) 9%, transparent)' }}>
              <button className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-primary)' }} onClick={() => setShowAddProduct(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
              <span className="text-[15px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>افزودن محصول جدید</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {(() => { const _ist: any = { background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }; const _lbl = "text-[12px] text-[var(--aw-text-secondary)] mb-1 block flex items-center gap-1"; const _inp = "w-full px-3 py-2.5 rounded-[10px] border-none text-[13px] text-[var(--aw-text-primary)]"; return (
                <>
                  <div className="mb-3"><label className={_lbl}><i className="fa-solid fa-tag text-[10px]" style={{ color: '#10B981' }} />نام محصول</label>
                    <input className={_inp} style={_ist} placeholder="مثلاً: پیتزا ویژه" dir="rtl" value={npName} onChange={e => setNpName(e.target.value)} /></div>
                  <div className="mb-3"><label className={_lbl}><i className="fa-solid fa-layer-group text-[10px]" style={{ color: '#10B981' }} />دسته‌بندی</label>
                    <select className={_inp} style={_ist} dir="rtl" value={npCat} onChange={e => setNpCat(e.target.value)}>
                      <option value="">انتخاب دسته‌بندی</option>
                      {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select></div>
                  <div className="mb-3"><label className={_lbl}><i className="fa-solid fa-coins text-[10px]" style={{ color: '#10B981' }} />قیمت (تومان)</label>
                    <input className={_inp} style={_ist} placeholder="۰" dir="rtl" inputMode="numeric" value={npPrice} onChange={e => setNpPrice(e.target.value)} /></div>
                  <div className="mb-3"><label className={_lbl}><i className="fa-solid fa-warehouse text-[10px]" style={{ color: '#10B981' }} />موجودی</label>
                    <input className={_inp} style={_ist} placeholder="۰" dir="rtl" inputMode="numeric" value={npStock} onChange={e => setNpStock(e.target.value)} /></div>
                  <div className="mb-3"><label className={_lbl}><i className="fa-solid fa-ruler text-[10px]" style={{ color: '#10B981' }} />واحد</label>
                    <input className={_inp} style={_ist} placeholder="مثلاً: عدد، کیلو، لیوان" dir="rtl" value={npUnit} onChange={e => setNpUnit(e.target.value)} /></div>
                  <div className="mb-3"><label className={_lbl}><i className="fa-solid fa-align-right text-[10px]" style={{ color: '#10B981' }} />توضیحات</label>
                    <input className={_inp} style={_ist} placeholder="توضیح مختصر محصول..." dir="rtl" value={npDesc} onChange={e => setNpDesc(e.target.value)} /></div>
                </>
              ); })()}
              <div className="mb-3">
                <label className="text-[12px] text-[var(--aw-text-secondary)] mb-1 block flex items-center gap-1">
                  <i className="fa-solid fa-image text-[10px]" style={{ color: '#10B981' }} />
                  تصویر محصول
                </label>
                <div className="w-full h-24 rounded-[10px] flex flex-col items-center justify-center gap-1 cursor-pointer" style={{ background: 'var(--aw-bg-card)', border: '2px dashed var(--aw-border)' }}>
                  <i className="fa-solid fa-cloud-arrow-up text-[20px] text-[var(--aw-text-muted)]" />
                  <span className="text-[11px] text-[var(--aw-text-muted)]">آپلود تصویر</span>
                </div>
              </div>
            </div>
            <div className="p-4" style={{ borderTop: '1px solid var(--aw-border)' }}>
              <button
                className="w-full py-3 rounded-[10px] border-none text-white cursor-pointer text-[14px] flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 700 }}
                onClick={async () => { if (!npName.trim()) { showToast('نام محصول را وارد کنید', 'error'); return; } if (!npCat) { showToast('یک دسته‌بندی انتخاب کنید', 'error'); return; } const _en2 = (x: any) => String(x).replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x06F0)).replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660)); const priceNum = parseInt(_en2(npPrice).replace(/[^0-9]/g, '')) || 0; const stockNum = parseInt(_en2(npStock).replace(/[^0-9]/g, '')) || 0; const _prod: any = { id: 'prod_' + Date.now(), name: npName.trim(), category: npCat, price: priceNum, priceNum, stock: stockNum, quantity: stockNum, minStock: 0, salePrice: String(priceNum), purchasePrice: '0', status: stockNum > 0 ? 'sufficient' : 'critical', unit: npUnit.trim() || 'عدد', description: npDesc.trim(), icon: 'fa-solid fa-box', color: 'var(--aw-primary)', company }; try { await (api as any).myCreate('proc_inventory', _prod); setMenuProd(prev => [...prev, _prod]); showToast('محصول جدید اضافه شد ✅', 'success'); setShowAddProduct(false); setNpName(''); setNpPrice(''); setNpStock(''); setNpUnit(''); setNpDesc(''); } catch (_) { showToast('خطا در ثبت محصول', 'error'); } }}
              >
                <i className="fa-solid fa-plus" />
                ثبت محصول
              </button>
            </div>
          </motion.div>
        )}

        {/* Add Category Modal */}
        {showAddCat && (
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 flex items-end"
            style={{ top: catSheetTop || 0 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAddCat(false)}
          >
            <div aria-hidden onClick={() => setShowAddCat(false)} style={{ position: 'fixed', top: catSheetTop || 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }} />
            <motion.div
              className="w-full rounded-t-3xl flex flex-col"
              style={{ background: 'var(--aw-bg-app)', maxHeight: '85%', position: 'relative', zIndex: 1 }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1 rounded-full mx-auto mt-3" style={{ background: 'var(--aw-border)' }} />
              <div className="flex items-center gap-3 px-4 pt-3 pb-3" style={{ borderBottom: '1px solid var(--aw-border)' }}>
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${newCatColor}, ${newCatColor}cc)` }}>
                  <i className={`${newCatIcon} text-[14px]`} />
                </div>
                <div className="flex-1">
                  <div className="text-[15px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>افزودن دسته‌بندی جدید</div>
                  <div className="text-[11px] text-[var(--aw-text-muted)]">یک گروه تازه برای محصولات ایجاد کنید</div>
                </div>
                <button className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-primary)' }} onClick={() => setShowAddCat(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <label className="text-[12px] text-[var(--aw-text-secondary)] mb-1 block">نام دسته‌بندی</label>
                <input
                  type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)}
                  placeholder="مثلاً صبحانه"
                  className="w-full px-3 py-2.5 rounded-[10px] border-none text-[13px] text-[var(--aw-text-primary)] mb-3"
                  style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}
                  dir="rtl"
                />

                <label className="text-[12px] text-[var(--aw-text-secondary)] mb-2 block">آیکون</label>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {CAT_ICONS.map(ic => (
                    <button
                      key={ic} onClick={() => setNewCatIcon(ic)}
                      className="aspect-square rounded-[10px] border-none cursor-pointer flex items-center justify-center transition-all"
                      style={{
                        background: newCatIcon === ic ? `${newCatColor}22` : 'var(--aw-bg-card)',
                        border: newCatIcon === ic ? `1px solid ${newCatColor}` : '1px solid var(--aw-border)',
                        color: newCatIcon === ic ? newCatColor : 'var(--aw-text-muted)',
                      }}
                    >
                      <i className={`${ic} text-[16px]`} />
                    </button>
                  ))}
                </div>

                <label className="text-[12px] text-[var(--aw-text-secondary)] mb-2 block">رنگ</label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {CAT_COLORS.map(c => (
                    <button
                      key={c} onClick={() => setNewCatColor(c)}
                      className="w-9 h-9 rounded-full border-none cursor-pointer transition-all"
                      style={{
                        background: c,
                        boxShadow: newCatColor === c ? `0 0 0 3px var(--aw-bg-app), 0 0 0 5px ${c}` : 'none',
                      }}
                    />
                  ))}
                </div>

                <label className="text-[12px] text-[var(--aw-text-secondary)] mb-1 block">دسته والد (اختیاری)</label>
                <div className="relative mb-3">
                  <div className="w-full px-3 py-2.5 rounded-[10px] text-[13px] text-[var(--aw-text-primary)] flex items-center justify-between" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
                    <span>{newCatParent || 'بدون دسته والد'}</span><i className="fa-solid fa-chevron-down text-[10px] text-[var(--aw-text-muted)]" />
                  </div>
                  <select className="absolute inset-0 opacity-0 cursor-pointer text-base" value={newCatParent} onChange={e => setNewCatParent(e.target.value)}>
                    <option value="">بدون دسته والد</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <label className="text-[12px] text-[var(--aw-text-secondary)] mb-1 block">توضیح کوتاه</label>
                <input
                  type="text" value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} placeholder="توضیح مختصر دسته‌بندی"
                  className="w-full px-3 py-2.5 rounded-[10px] border-none text-[13px] text-[var(--aw-text-primary)] mb-3" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }} dir="rtl"
                />

                <div className="flex items-center justify-between p-3 rounded-[10px] mb-4" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
                  <span className="text-[12px] text-[var(--aw-text-secondary)]">وضعیت دسته‌بندی</span>
                  <button onClick={() => setNewCatActive(a => !a)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border-none cursor-pointer text-[11px] text-white" style={{ background: newCatActive ? '#10B981' : '#94A3B8', fontWeight: 600 }}>
                    <i className={`fa-solid ${newCatActive ? 'fa-toggle-on' : 'fa-toggle-off'}`} />{newCatActive ? 'فعال' : 'غیرفعال'}
                  </button>
                </div>

                <div className="p-3 rounded-[10px] flex flex-col items-center gap-2" style={{ ...cardStyle, background: 'var(--aw-bg-card)' }}>
                  <div className="text-[10px] text-[var(--aw-text-muted)]">پیش‌نمایش</div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${newCatColor}22` }}>
                    <i className={`${newCatIcon} text-[18px]`} style={{ color: newCatColor }} />
                  </div>
                  <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{newCatName.trim() || 'نام دسته‌بندی'}</span>
                </div>
              </div>

              <div className="p-4 flex gap-2" style={{ borderTop: '1px solid var(--aw-border)' }}>
                <button
                  className="flex-1 py-3 rounded-[10px] border-none text-white cursor-pointer text-[14px] flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${newCatColor}, ${newCatColor}cc)`, fontWeight: 700 }}
                  onClick={submitNewCategory}
                >
                  <i className="fa-solid fa-floppy-disk" />ذخیره
                </button>
                <button
                  className="px-5 py-3 rounded-[10px] cursor-pointer text-[14px] bg-transparent"
                  style={{ border: '1px solid var(--aw-border)', color: 'var(--aw-text-muted)', fontWeight: 700 }}
                  onClick={() => setShowAddCat(false)}
                >
                  لغو
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ========================
// 4) SALES CUSTOMERS / LOYALTY SCREEN
// ========================
export function SalesCustomersScreen() {
  const [activeTab, setActiveTab] = useState('list');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [ncName, setNcName] = useState(''); const [ncPhone, setNcPhone] = useState(''); const [ncEmail, setNcEmail] = useState(''); const [ncBirth, setNcBirth] = useState('');
  const [activeSegment, setActiveSegment] = useState('all');
  const [quickFilter, setQuickFilter] = useState('');
  const [showAi, setShowAi] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<{ from: 'ai' | 'me'; text: string }[]>([]);
  const { showToast, openModal } = useApp();

  const tabs = [
    { id: 'list', label: 'مشتریان', icon: 'fa-solid fa-users' },
    { id: 'loyalty', label: 'وفاداری', icon: 'fa-solid fa-star' },
    { id: 'history', label: 'سابقه خرید', icon: 'fa-solid fa-clock-rotate-left' },
    { id: 'offers', label: 'کمپین', icon: 'fa-solid fa-bullhorn' },
  ];

  const __coCust = (useApp() as any).company;
  const [__srvCust, setSrvCust] = useState<any[]>([]);
  useEffect(() => { if (!__coCust) return; (async () => { try { const v: any = await (api as any).list('customers', __coCust); if (Array.isArray(v)) setSrvCust((v as any[]).map(((c: any) => ({ ...c, id: c.id, name: c.name || '', phone: c.phone || '', segment: c.segment || 'regular', tier: c.tier || 'برنزی', points: c.points || 0, cashback: c.cashback || 0, totalSpent: c.totalSpent || 0, spent: c.spent || c.totalSpent || 0, avgBasket: c.avgBasket || 0, purchases: c.purchases || 0, orders: c.orders || 0, roi: c.roi || 0, conv: c.conv || 0, activity: (['active','inactive','risk'].indexOf(c.activity) >= 0 ? c.activity : (c.status === 'lead' ? 'inactive' : 'active')), lastVisit: c.lastVisit || c.lastContact || '—', status: c.status || 'active', type: c.type || 'شخص', channel: c.channel || 'مستقیم', icon: c.icon || 'fa-solid fa-user', tags: Array.isArray(c.tags) ? c.tags : [], interests: Array.isArray(c.interests) ? c.interests : [] })))); } catch (_) {} })(); }, [__coCust]);
  const CUSTOMERS_DATA = __srvCust;
  const filteredCustomers = CUSTOMERS_DATA.filter(c => {
    if (activeSegment !== 'all' && c.segment !== activeSegment) return false;
    if (quickFilter === 'همه فعال' && (c as any).activity !== 'active') return false;
    if (quickFilter === 'بدون خرید ۳۰ روز' && (c as any).activity !== 'inactive') return false;
    if (quickFilter === 'این هفته' && (c as any).activity === 'inactive') return false;
    if (searchQuery && !c.name.includes(searchQuery) && !c.phone.includes(searchQuery)) return false;
    return true;
  });

  const sendAi = (q?: string) => {
    const text = (q || aiInput).trim();
    if (!text) return;
    const responses: Record<string, string> = {};
    const reply = responses[text] || 'این تحلیل بر پایهٔ داده‌های واقعیِ حسابِ شماست و به‌محضِ ثبتِ فروش و مشتری، همین‌جا نمایش داده می‌شود.';
    setAiMessages(prev => [...prev, { from: 'me', text }, { from: 'ai', text: reply }]);
    setAiInput('');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Inline search */}
      {showSearch && (
        <div className="px-4 pt-3" style={{ background: 'var(--aw-bg-header)' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-[10px]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
            <i className="fa-solid fa-magnifying-glass text-[11px] text-[var(--aw-text-muted)]" />
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus
              placeholder="جستجو در نام یا شماره..."
              className="flex-1 bg-transparent border-none outline-none text-[12px] text-[var(--aw-text-primary)]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="w-5 h-5 rounded-[10px] border-none cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-bg-app)', color: 'var(--aw-text-muted)' }}>
                <i className="fa-solid fa-xmark text-[9px]" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter chips overlay */}
      {showFilter && (
        <div className="px-4 pt-3" style={{ background: 'var(--aw-bg-header)' }}>
          <div className="text-[11px] text-[var(--aw-text-muted)] mb-1.5">فیلتر سریع بر اساس فعالیت</div>
          <div className="flex gap-1.5 flex-wrap">
            {['همه فعال', 'این هفته', 'بدون خرید ۳۰ روز', 'تولد این ماه'].map(f => (
              <button key={f} className="text-[10px] px-2.5 py-1 rounded-full border-none cursor-pointer" style={{ background: 'var(--aw-bg-card)', color: 'var(--aw-text-secondary)', border: '1px solid var(--aw-border)' }} onClick={() => { setQuickFilter(prev => prev === f ? '' : f); showToast(`فیلتر «${f}» اعمال شد`, 'info'); setShowFilter(false); }}>
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeTab === 'list' && (
          <>
            {/* Segment chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 pt-3 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
              {CUSTOMER_SEGMENTS.map(seg => {
                const count = seg.id === 'all' ? CUSTOMERS_DATA.length : CUSTOMERS_DATA.filter(c => c.segment === seg.id).length;
                const active = activeSegment === seg.id;
                return (
                  <button
                    key={seg.id} onClick={() => setActiveSegment(seg.id)}
                    className="inline-flex items-center justify-center flex-shrink-0 px-3.5 py-1.5 rounded-full border-none cursor-pointer whitespace-nowrap text-[11px] transition-all"
                    style={active
                      ? { background: 'var(--aw-primary-bg)', color: 'var(--aw-primary)', border: '1px solid color-mix(in srgb, var(--aw-primary) 40%, transparent)', fontWeight: 700, backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)' }
                      : { background: 'var(--aw-eu-nav-bg)', color: 'var(--aw-text-secondary)', border: '1px solid var(--aw-eu-nav-border)', fontWeight: 600, backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)' }}
                  >
                    {seg.label}
                  </button>
                );
              })}
            </div>

            {/* Customer list */}
            <SectionHeader title="لیست مشتریان" icon="fa-solid fa-address-book" count={filteredCustomers.length} />
            <div className="flex flex-col gap-2 mt-2">
              {filteredCustomers.length === 0 ? (
                <div className="p-8 rounded-[10px] text-center text-[12px] text-[var(--aw-text-muted)]" style={cardStyle}>
                  <i className="fa-solid fa-inbox text-[28px] mb-2 block" style={{ opacity: 0.4 }} />
                  مشتری‌ای با این فیلتر یافت نشد
                </div>
              ) : filteredCustomers.map(cust => {
                const act = ACTIVITY_CONFIG[cust.activity];
                const seg = CUSTOMER_SEGMENTS.find(s => s.id === cust.segment)!;
                return (
                  <motion.div
                    key={cust.id}
                    className="p-3.5 rounded-[14px] cursor-pointer"
                    style={{ ...cardStyle, borderRadius: 14 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openModal(cust.name, <SalesCustomerProfile customer={cust} />)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <LetterAvatar name={cust.name} size={48} radius={15} />
                        <span className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 rounded-full" style={{ background: act.dot, border: '2.5px solid var(--aw-bg-card)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[13.5px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{cust.name}</span>
                          <StatusBadge label={cust.tier} color={TIER_COLORS[cust.tier] || '#888'} />
                        </div>
                        <div className="text-[10px] text-[var(--aw-text-muted)] mt-1 flex items-center gap-1" style={{ direction: 'ltr', justifyContent: 'flex-end' }}>
                          {cust.phone}<i className="fa-solid fa-phone text-[8px]" />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: `${act.color}18`, color: act.color, fontWeight: 700 }}>
                          {act.label}
                        </span>
                        <i className="fa-solid fa-chevron-left text-[10px] text-[var(--aw-text-muted)]" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--aw-border)' }}>
                      <div className="flex-1 flex items-center gap-1.5">
                        <i className="fa-solid fa-bag-shopping text-[10px]" style={{ color: 'var(--aw-primary)' }} />
                        <span className="text-[11px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{cust.purchases.toLocaleString('fa-IR')}</span>
                        <span className="text-[9px] text-[var(--aw-text-muted)]">سفارش</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[13px]" style={{ color: '#10B981', fontWeight: 800 }}>{formatPrice(cust.totalSpent)}</span>
                      </div>
                    </div>

                    {cust.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {cust.tags.map((t, i) => (
                          <span key={i} className="text-[9px] px-2 py-0.5 rounded-md" style={{ background: 'var(--aw-primary-bg)', color: 'var(--aw-primary)', fontWeight: 600 }}>
                            # {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'loyalty' && (
          <>
            {/* Loyalty summary */}
            <div className="grid grid-cols-2 gap-2 mt-1 mb-3">
              <div className="p-3 rounded-[10px]" style={{ ...cardStyle, background: 'linear-gradient(135deg, #FFD70022, #F59E0B11)', border: '1px solid #FFD70044' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <i className="fa-solid fa-coins text-[12px]" style={{ color: '#FFD700' }} />
                  <span className="text-[10px] text-[var(--aw-text-muted)]">امتیاز کل توزیع‌شده</span>
                </div>
                <div className="text-[15px]" style={{ color: '#FFD700', fontWeight: 700 }}>{CUSTOMERS_DATA.reduce((s, c) => s + c.points, 0).toLocaleString('fa-IR')}</div>
              </div>
              <div className="p-3 rounded-[10px]" style={{ ...cardStyle, background: 'linear-gradient(135deg, #10B98122, #04785711)', border: '1px solid #10B98144' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <i className="fa-solid fa-wallet text-[12px]" style={{ color: '#10B981' }} />
                  <span className="text-[10px] text-[var(--aw-text-muted)]">کش‌بک فعال</span>
                </div>
                <div className="text-[13px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(CUSTOMERS_DATA.reduce((s, c) => s + c.cashback, 0))}</div>
              </div>
            </div>

            {/* Rewards catalog */}
            <SectionHeader title="جوایز قابل تبدیل" icon="fa-solid fa-gift" color="var(--aw-primary)" />
            <div className="grid grid-cols-2 gap-2 mt-2 mb-4">
              {[
                { name: 'نوشیدنی رایگان', cost: 100, icon: 'fa-solid fa-mug-hot', color: 'var(--aw-primary)' },
                { name: 'دسر هدیه', cost: 200, icon: 'fa-solid fa-ice-cream', color: 'var(--aw-primary)' },
                { name: 'تخفیف ۲۰٪', cost: 350, icon: 'fa-solid fa-percent', color: '#F59E0B' },
                { name: 'پکیج VIP', cost: 800, icon: 'fa-solid fa-crown', color: '#FFD700' },
              ].map((r, i) => (
                <div key={i} className="p-3 rounded-[10px]" style={cardStyle}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${r.color}22` }}>
                      <i className={`${r.icon} text-[14px]`} style={{ color: r.color }} />
                    </div>
                    <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{r.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-coins text-[9px] ml-1" style={{ color: '#FFD700' }} />{r.cost.toLocaleString('fa-IR')} امتیاز</span>
                    <button className="text-[10px] px-2 py-0.5 rounded-md border-none cursor-pointer text-white" style={{ background: r.color, fontWeight: 600 }} onClick={() => { (api as any).create('loyalty_rewards', { name: r.name, showcased: true, createdAt: new Date().toISOString() }, __coCust); showToast(`«${r.name}» در ویترین جوایز قرار گرفت`, 'success'); }}>افزودن</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tier overview */}
            <SectionHeader title="سطوح وفاداری" icon="fa-solid fa-crown" color="#FFD700" />
            <div className="grid grid-cols-2 gap-2 mt-2 mb-4">
              {[
                { tier: 'برنزی', min: 0, max: 200, benefits: 'تخفیف ۵٪', members: 42, icon: 'fa-solid fa-medal' },
                { tier: 'نقره‌ای', min: 200, max: 500, benefits: 'تخفیف ۱۰٪', members: 38, icon: 'fa-solid fa-award' },
                { tier: 'طلایی', min: 500, max: 1000, benefits: 'تخفیف ۱۵٪ + ارسال رایگان', members: 35, icon: 'fa-solid fa-trophy' },
                { tier: 'الماسی', min: 1000, max: 9999, benefits: 'تخفیف ۲۰٪ + VIP', members: 13, icon: 'fa-solid fa-gem' },
              ].map((level, i) => (
                <div key={i} className="p-3 rounded-[10px]" style={cardStyle}>
                  <div className="flex items-center gap-2 mb-2">
                    <i className={`${level.icon} text-[16px]`} style={{ color: TIER_COLORS[level.tier] }} />
                    <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{level.tier}</span>
                  </div>
                  <div className="text-[10px] text-[var(--aw-text-muted)] mb-1">{level.min}–{level.max} امتیاز</div>
                  <div className="text-[10px]" style={{ color: '#10B981' }}>{level.benefits}</div>
                  <div className="text-[10px] text-[var(--aw-text-muted)] mt-1">{level.members} عضو</div>
                </div>
              ))}
            </div>

            {/* Top customers */}
            <SectionHeader title="برترین مشتریان" icon="fa-solid fa-star" color="#F59E0B" />
            <div className="flex flex-col gap-2 mt-2">
              {[...CUSTOMERS_DATA].sort((a, b) => b.points - a.points).slice(0, 3).map((cust, i) => (
                <div key={cust.id} className="flex items-center gap-3 p-3 rounded-[10px]" style={cardStyle}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px]" style={{ background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32', color: '#000', fontWeight: 700 }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{cust.name}</div>
                    <div className="text-[10px] text-[var(--aw-text-muted)]">{formatPrice(cust.totalSpent)} خرید کل</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <i className="fa-solid fa-star text-[10px]" style={{ color: '#FFD700' }} />
                    <span className="text-[13px]" style={{ color: '#FFD700', fontWeight: 700 }}>{cust.points}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <>
            <SectionHeader title="سابقه خرید مشتریان" icon="fa-solid fa-clock-rotate-left" color="var(--aw-primary)" />
            <div className="flex flex-col gap-2 mt-2">
              {CUSTOMERS_DATA.map(cust => (
                <div key={cust.id} className="p-3 rounded-[10px]" style={cardStyle}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <LetterAvatar name={cust.name} size={32} radius={11} />
                      <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{cust.name}</span>
                    </div>
                    <span className="text-[10px] text-[var(--aw-text-muted)]">آخرین: {cust.lastVisit}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--aw-text-muted)]">{cust.purchases} سفارش</span>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>{formatPrice(cust.totalSpent)}</span>
                  </div>
                  <div className="w-full h-1 rounded-full mt-2" style={{ background: 'var(--aw-bg-app)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, cust.purchases * 2.2)}%`, background: 'linear-gradient(90deg, var(--aw-primary), var(--aw-primary))' }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'offers' && (() => {
          const CAMPAIGNS = [];
          const ST = {
            active: { label: 'فعال', bg: 'rgba(16,185,129,0.15)', text: '#10B981' },
            scheduled: { label: 'زمان‌بندی', bg: 'var(--aw-primary-bg)', text: 'var(--aw-primary)' },
            completed: { label: 'تکمیل', bg: 'rgba(148,163,184,0.18)', text: '#94A3B8' },
            paused: { label: 'متوقف', bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
            draft: { label: 'پیش‌نویس', bg: 'rgba(148,163,184,0.15)', text: '#94A3B8' },
          };
          const filters = [
            { id: 'all', label: 'همه' }, { id: 'active', label: 'فعال' }, { id: 'scheduled', label: 'زمان‌بندی شده' },
            { id: 'completed', label: 'تکمیل' }, { id: 'paused', label: 'متوقف' }, { id: 'draft', label: 'پیش‌نویس' },
          ];
          const list = CAMPAIGNS.filter(c => campaignFilter === 'all' || c.status === campaignFilter);
          return (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div className="aw-no-pill p-3 rounded-[8px] border text-center" style={{ background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)' }}>
                  <div className="text-[16px]" style={{ color: '#10B981', fontWeight: 800 }}>{CAMPAIGNS.filter(c => c.status === 'active').length.toLocaleString('fa-IR')}</div>
                  <div className="text-[10px] text-[var(--aw-text-muted)]">فعال</div>
                </div>
                <div className="aw-no-pill p-3 rounded-[8px] border text-center" style={{ background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)' }}>
                  <div className="text-[16px] text-[var(--aw-primary)]" style={{ fontWeight: 800 }}>۱۹.۵M</div>
                  <div className="text-[10px] text-[var(--aw-text-muted)]">بودجه کل</div>
                </div>
                <div className="aw-no-pill p-3 rounded-[8px] border text-center" style={{ background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)' }}>
                  <div className="text-[16px]" style={{ color: '#10B981', fontWeight: 800 }}>+۲۱۰٪</div>
                  <div className="text-[10px] text-[var(--aw-text-muted)]">میانگین ROI</div>
                </div>
              </div>

              {/* Filter chips */}
              <div className="flex gap-1.5 overflow-x-auto aw-noscroll mt-3" style={{ flexWrap: 'nowrap' }}>
                {filters.map(f => (
                  <button key={f.id} onClick={() => setCampaignFilter(f.id)}
                    className={`aw-no-pill py-1.5 px-3 rounded-[20px] border text-[11px] cursor-pointer transition-all whitespace-nowrap flex-shrink-0 ${campaignFilter === f.id ? 'text-white' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'}`}
                    style={campaignFilter === f.id ? { background: 'var(--aw-primary)', borderColor: 'var(--aw-primary)', fontWeight: 700 } : { fontWeight: 600 }}>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Create campaign card */}
              <button onClick={() => { const nm = window.prompt('نام کمپین جدید:'); if (nm) { (api as any).create('campaigns', { name: nm, status: 'active', type: 'فروش', channel: 'حضوری', spent: '۰', conv: '۰', roi: '۰٪', createdAt: new Date().toISOString() }, __coCust); showToast('کمپین «' + nm + '» ساخته شد ✅'); } }} className="w-full flex items-center gap-3 p-3 mt-3 mb-1 rounded-2xl border cursor-pointer transition-all" style={{ background: 'var(--aw-primary-bg)', borderColor: 'var(--aw-primary)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
                  <i className="fa-solid fa-plus text-[16px] text-white" />
                </div>
                <div className="flex-1 text-right">
                  <div className="text-[13px]" style={{ fontWeight: 700, color: 'var(--aw-primary)' }}>ساخت کمپین جدید</div>
                  <div className="text-[10px] text-[var(--aw-text-muted)]">کمپین فروش یا تخفیف راه‌اندازی کنید</div>
                </div>
                <i className="fa-solid fa-chevron-left text-[12px]" style={{ color: 'var(--aw-primary)' }} />
              </button>

              {/* Campaign list */}
              <div className="flex flex-col gap-2 mt-2">
                {list.length === 0 ? (
                  <div className="text-center py-10 text-[12px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-bullhorn text-[24px] block mb-2 opacity-50" />کمپینی در این دسته نیست</div>
                ) : list.map(c => {
                  const st = ST[c.status];
                  return (
                    <div key={c.id} className="p-3.5 rounded-[10px] border border-[var(--aw-border)] cursor-pointer transition-all hover:border-[var(--aw-primary)]" style={{ background: 'var(--aw-bg-card)' }} onClick={() => openModal('کمپین: ' + c.name, <div className="p-4 text-[13px] text-[var(--aw-text-secondary)]" style={{ lineHeight: 2.2 }}>نوع: {c.type}<br />کانال: {c.channel}<br />وضعیت: {c.status}<br />بودجه مصرفی: {c.spent}<br />تبدیل: {c.conv}<br />ROI: {c.roi}</div>)}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: st.bg }}><i className={`${c.icon} text-[14px]`} style={{ color: st.text }} /></div>
                          <div><div className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{c.name}</div><div className="text-[11px] text-[var(--aw-text-muted)]">{c.type} • {c.channel}</div></div>
                        </div>
                        <span className="text-[10px] px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.text, fontWeight: 600 }}>{st.label}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="text-center"><div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{c.spent}</div><div className="text-[9px] text-[var(--aw-text-muted)]">بودجه مصرفی</div></div>
                        <div className="text-center"><div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{c.conv}</div><div className="text-[9px] text-[var(--aw-text-muted)]">تبدیل</div></div>
                        <div className="text-center"><div className="text-[12px]" style={{ color: c.roi.startsWith('-') ? '#EF4444' : '#10B981', fontWeight: 600 }}>{c.roi}</div><div className="text-[9px] text-[var(--aw-text-muted)]">ROI</div></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>

      {/* AI Assistant Modal */}
      <AnimatePresence>
        {showAi && (
          <motion.div
            className="absolute inset-0 z-50 flex items-end"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAi(false)}
          >
            <motion.div
              className="w-full rounded-t-3xl flex flex-col"
              style={{ background: 'var(--aw-bg-app)', maxHeight: '85%', height: '85%' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1 rounded-full mx-auto mt-3" style={{ background: 'var(--aw-border)' }} />
              <div className="flex items-center gap-3 px-4 pt-3 pb-3" style={{ borderBottom: '1px solid var(--aw-border)' }}>
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
                  <i className="fa-solid fa-wand-magic-sparkles text-[16px]" />
                </div>
                <div className="flex-1">
                  <div className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>دستیار AI CRM</div>
                  <div className="text-[10px] flex items-center gap-1" style={{ color: '#10B981' }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />آنلاین · تحلیل لحظه‌ای</div>
                </div>
                <button className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-primary)' }} onClick={() => setShowAi(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              {/* Chat area */}
              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
                {aiMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[80%] px-3 py-2 rounded-2xl text-[12px] whitespace-pre-line" style={m.from === 'me'
                      ? { background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', color: '#fff', borderRadius: '16px 16px 4px 16px' }
                      : { background: 'var(--aw-bg-card)', color: 'var(--aw-text-primary)', border: '1px solid var(--aw-border)', borderRadius: '16px 16px 16px 4px' }}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick questions */}
              <div className="px-4 pt-2 pb-2 flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none', borderTop: '1px solid var(--aw-border)' }}>
                {['بهترین مشتری‌ها', 'مشتری‌های در خطر ریزش', 'پیشنهاد کمپین', 'تحلیل فروش'].map(q => (
                  <button key={q} onClick={() => sendAi(q)} className="text-[10px] px-2.5 py-1.5 rounded-full border-none cursor-pointer whitespace-nowrap" style={{ background: 'var(--aw-bg-card)', color: 'var(--aw-primary)', border: '1px solid var(--aw-primary-bg)', fontWeight: 600 }}>
                    <i className="fa-solid fa-wand-magic-sparkles ml-1 text-[8px]" />{q}
                  </button>
                ))}
              </div>

              <div className="p-3 flex items-center gap-2" style={{ borderTop: '1px solid var(--aw-border)' }}>
                <input
                  type="text" value={aiInput} onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendAi(); }}
                  placeholder="سوال خود را بپرسید..."
                  className="flex-1 px-3 py-2.5 rounded-[10px] bg-transparent text-[12px] text-[var(--aw-text-primary)] outline-none"
                  style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}
                />
                <button onClick={() => sendAi()} className="w-10 h-10 rounded-[10px] border-none cursor-pointer text-white" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
                  <i className="fa-solid fa-paper-plane text-[13px]" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Customer Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="absolute inset-0 z-50 flex items-end"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              className="w-full rounded-t-3xl flex flex-col"
              style={{ background: 'var(--aw-bg-app)' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1 rounded-full mx-auto mt-3" style={{ background: 'var(--aw-border)' }} />
              <div className="flex items-center gap-3 px-4 pt-3 pb-3" style={{ borderBottom: '1px solid var(--aw-border)' }}>
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
                  <i className="fa-solid fa-user-plus text-[14px]" />
                </div>
                <div className="flex-1">
                  <div className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>افزودن مشتری جدید</div>
                  <div className="text-[10px] text-[var(--aw-text-muted)]">اطلاعات پایه را وارد کنید</div>
                </div>
                <button className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-primary)' }} onClick={() => setShowAdd(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
              <div className="p-4 flex flex-col gap-2.5">
                {([
                  { label: 'نام و نام خانوادگی', icon: 'fa-solid fa-user', placeholder: 'مثلاً نگار کاظمی', val: ncName, set: setNcName },
                  { label: 'شماره موبایل', icon: 'fa-solid fa-phone', placeholder: '۰۹۱۲xxxxxxx', val: ncPhone, set: setNcPhone },
                  { label: 'ایمیل (اختیاری)', icon: 'fa-solid fa-envelope', placeholder: 'name@example.com', val: ncEmail, set: setNcEmail },
                  { label: 'تاریخ تولد (اختیاری)', icon: 'fa-solid fa-cake-candles', placeholder: '۱۳۷۵/۰۵/۱۲', val: ncBirth, set: setNcBirth },
                ] as any[]).map((f, i) => (
                  <div key={i}>
                    <label className="text-[11px] text-[var(--aw-text-secondary)] mb-1 block flex items-center gap-1.5"><i className={`${f.icon} text-[10px]`} style={{ color: '#10B981' }} />{f.label}</label>
                    <input type="text" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} className="w-full px-3 py-2.5 rounded-[10px] border-none text-[12px] text-[var(--aw-text-primary)]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }} />
                  </div>
                ))}
                <button className="w-full py-3 rounded-[10px] border-none text-white cursor-pointer text-[13px] mt-2" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 700 }} onClick={() => { if (!ncName.trim()) { showToast('نام مشتری را وارد کنید', 'error'); return; } const _c: any = { id: 'cust_' + Date.now(), name: ncName.trim(), phone: ncPhone.trim(), email: ncEmail.trim(), birth: ncBirth.trim(), segment: 'regular', status: 'active', company: __coCust }; try { (api as any).create('customers', _c); } catch (_) {} setSrvCust(prev => [{ ..._c, tier: 'برنزی', points: 0, cashback: 0, totalSpent: 0, spent: 0, avgBasket: 0, purchases: 0, orders: 0, activity: 'active', lastVisit: 'امروز', type: 'شخص', channel: 'مستقیم', icon: 'fa-solid fa-user', tags: [], interests: [] }, ...prev]); showToast('مشتری جدید با موفقیت ثبت شد', 'success'); setNcName(''); setNcPhone(''); setNcEmail(''); setNcBirth(''); setShowAdd(false); }}>
                  <i className="fa-solid fa-check ml-1.5" />ثبت مشتری
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// ========================
// CUSTOMER PROFILE (modal content — opened via openModal like the app's other popups)
// ========================
function SalesCustomerProfile({ customer: c }: { customer: typeof CUSTOMERS_DATA[0] }) {
  const [profileTab, setProfileTab] = useState<'orders' | 'chats' | 'interests' | 'behavior' | 'ai'>('orders');
  const { showToast } = useApp();
  const seg = CUSTOMER_SEGMENTS.find(s => s.id === c.segment);
  const segColor = seg?.color || '#10B981';

  return (
    <div className="-m-5">
      {/* Profile header with gradient (full-bleed under modal title) */}
      <div className="p-4 text-center relative" style={{ background: `linear-gradient(135deg, var(--aw-primary-bg), transparent)` }}>
        <div className="w-20 h-20 mx-auto mb-2 relative">
          <LetterAvatar name={c.name} size={80} radius={24} style={{ border: `2px solid ${TIER_COLORS[c.tier] || '#10B981'}` }} />
          <span className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: ACTIVITY_CONFIG[c.activity].dot, border: '2px solid var(--aw-bg-modal)' }}>
            <i className="fa-solid fa-circle text-[6px] text-white" />
          </span>
        </div>
        <div className="text-[16px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{c.name}</div>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <StatusBadge label={c.tier} color={TIER_COLORS[c.tier] || '#888'} />
          <StatusBadge label={seg?.label || ''} color={segColor} />
        </div>
        <div className="text-[11px] text-[var(--aw-text-muted)] mt-1.5"><i className="fa-solid fa-phone text-[10px] ml-1" />{c.phone}</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 px-4 -mt-3 mb-3">
        <div className="p-2 rounded-[10px] text-center" style={cardStyle}>
          <div className="text-[14px]" style={{ color: 'var(--aw-primary)', fontWeight: 700 }}>{c.purchases.toLocaleString('fa-IR')}</div>
          <div className="text-[9px] text-[var(--aw-text-muted)]">سفارش</div>
        </div>
        <div className="p-2 rounded-[10px] text-center" style={cardStyle}>
          <div className="text-[10px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(c.totalSpent)}</div>
          <div className="text-[9px] text-[var(--aw-text-muted)]">مجموع</div>
        </div>
        <div className="p-2 rounded-[10px] text-center" style={cardStyle}>
          <div className="text-[14px]" style={{ color: '#FFD700', fontWeight: 700 }}>{c.points.toLocaleString('fa-IR')}</div>
          <div className="text-[9px] text-[var(--aw-text-muted)]">امتیاز</div>
        </div>
        <div className="p-2 rounded-[10px] text-center" style={cardStyle}>
          <div className="text-[10px]" style={{ color: 'var(--aw-primary)', fontWeight: 700 }}>{formatPrice(c.cashback)}</div>
          <div className="text-[9px] text-[var(--aw-text-muted)]">کش‌بک</div>
        </div>
      </div>

      {/* Profile tabs */}
      <div className="flex gap-1 px-4 mb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {[
          { id: 'orders', label: 'سفارش‌ها', icon: 'fa-solid fa-bag-shopping' },
          { id: 'chats', label: 'گفتگوها', icon: 'fa-solid fa-comments' },
          { id: 'interests', label: 'علایق', icon: 'fa-solid fa-heart' },
          { id: 'behavior', label: 'رفتار خرید', icon: 'fa-solid fa-chart-line' },
          { id: 'ai', label: 'AI Insights', icon: 'fa-solid fa-wand-magic-sparkles' },
        ].map(t => (
          <button
            key={t.id} onClick={() => setProfileTab(t.id as any)}
            className="flex-shrink-0 inline-flex items-center justify-center px-3.5 py-1.5 rounded-full cursor-pointer whitespace-nowrap text-[11px] transition-all"
            style={profileTab === t.id
              ? { background: 'var(--aw-primary-bg)', color: 'var(--aw-primary)', border: '1px solid color-mix(in srgb, var(--aw-primary) 40%, transparent)', fontWeight: 700, backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)' }
              : { background: 'var(--aw-eu-nav-bg)', color: 'var(--aw-text-secondary)', border: '1px solid var(--aw-eu-nav-border)', fontWeight: 600, backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4">
        {profileTab === 'orders' && (
          <div className="flex flex-col gap-2">
            {(CUSTOMER_ORDER_HISTORY[c.id] || [
              { id: 'ORD-XXX', date: c.lastVisit, items: 'سفارش پیش‌فرض', total: c.avgBasket, status: 'تکمیل' },
            ]).map(o => (
              <div key={o.id} className="p-3 rounded-[10px]" style={cardStyle}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{o.id}</span>
                  <StatusBadge label={o.status} color="#10B981" />
                </div>
                <div className="text-[11px] text-[var(--aw-text-secondary)] mb-1">{o.items}</div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-calendar text-[9px] ml-1" />{o.date}</span>
                  <span className="text-[12px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(o.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {profileTab === 'chats' && (
          <div className="flex flex-col gap-2">
            {(CUSTOMER_CHATS[c.id] || []).map((m, i) => (
              <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[75%] px-3 py-2 text-[12px]" style={m.from === 'me'
                  ? { background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', color: '#fff', borderRadius: '14px 14px 4px 14px' }
                  : { background: 'var(--aw-bg-card)', color: 'var(--aw-text-primary)', border: '1px solid var(--aw-border)', borderRadius: '14px 14px 14px 4px' }}>
                  {m.text}
                  <div className="text-[9px] mt-1" style={{ opacity: 0.65 }}>{m.time}</div>
                </div>
              </div>
            ))}
            {!(CUSTOMER_CHATS[c.id]?.length) && (
              <div className="p-6 rounded-[10px] text-center text-[12px] text-[var(--aw-text-muted)]" style={cardStyle}>
                <i className="fa-solid fa-comments text-[24px] mb-2 block" style={{ opacity: 0.4 }} />هنوز گفتگویی ثبت نشده
              </div>
            )}
          </div>
        )}

        {profileTab === 'interests' && (
          <div className="flex flex-col gap-3">
            <div className="p-3 rounded-[10px]" style={cardStyle}>
              <div className="text-[11px] text-[var(--aw-text-muted)] mb-2">دسته‌بندی‌های مورد علاقه</div>
              <div className="flex gap-1.5 flex-wrap">
                {c.interests.map((it, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: 'linear-gradient(135deg, var(--aw-primary-bg), var(--aw-primary-bg))', color: 'var(--aw-primary)', border: '1px solid var(--aw-primary-bg)', fontWeight: 600 }}>
                    <i className="fa-solid fa-heart text-[9px] ml-1" />{it}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-[10px]" style={cardStyle}>
              <div className="text-[11px] text-[var(--aw-text-muted)] mb-2">تگ‌ها</div>
              <div className="flex gap-1.5 flex-wrap">
                {c.tags.map((t, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-md" style={{ background: 'var(--aw-bg-app)', color: 'var(--aw-text-secondary)', border: '1px solid var(--aw-border)' }}># {t}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {profileTab === 'behavior' && (
          <div className="flex flex-col gap-2">
            {[
              { label: 'میانگین سبد خرید', value: formatPrice(c.avgBasket), icon: 'fa-solid fa-basket-shopping', color: '#10B981' },
              { label: 'فرکانس خرید', value: c.freq, icon: 'fa-solid fa-repeat', color: 'var(--aw-primary)' },
              { label: 'کانال ترجیحی', value: c.channel, icon: 'fa-solid fa-tower-broadcast', color: 'var(--aw-primary)' },
              { label: 'آخرین بازدید', value: c.lastVisit, icon: 'fa-solid fa-clock', color: '#F59E0B' },
            ].map((r, i) => (
              <div key={i} className="p-3 rounded-[10px] flex items-center gap-3" style={cardStyle}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${r.color}22` }}>
                  <i className={`${r.icon} text-[14px]`} style={{ color: r.color }} />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] text-[var(--aw-text-muted)]">{r.label}</div>
                  <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{r.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {profileTab === 'ai' && (
          <div className="flex flex-col gap-2">
            {[
              { title: 'احتمال خرید بعدی', value: c.activity === 'risk' ? '۲۸٪' : c.activity === 'inactive' ? '۱۵٪' : '۸۴٪', desc: 'بر اساس الگوی ۹۰ روز اخیر', icon: 'fa-solid fa-bullseye', color: '#10B981' },
              { title: 'ریسک ریزش', value: c.activity === 'risk' ? 'بالا ⚠️' : c.activity === 'inactive' ? 'متوسط' : 'پایین ✓', desc: 'مدل پیش‌بینی Churn', icon: 'fa-solid fa-triangle-exclamation', color: c.activity === 'risk' ? '#EF4444' : c.activity === 'inactive' ? '#F59E0B' : '#10B981' },
              { title: 'ارزش طول عمر (LTV)', value: formatPrice(c.totalSpent * 1.8), icon: 'fa-solid fa-gem', desc: 'پیش‌بینی ۱۲ ماه آینده', color: '#FFD700' },
              { title: 'پیشنهاد بعدی', value: `پیشنهاد ${c.interests[0] || 'محصول ویژه'}`, desc: `با ${c.segment === 'vip' ? '۲۰' : '۱۰'}٪ تخفیف اختصاصی`, icon: 'fa-solid fa-lightbulb', color: 'var(--aw-primary)' },
            ].map((ins, i) => (
              <div key={i} className="p-3 rounded-[10px]" style={{ ...cardStyle, background: `linear-gradient(135deg, ${ins.color}11, transparent)`, border: `1px solid ${ins.color}33` }}>
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${ins.color}22` }}>
                    <i className={`${ins.icon} text-[14px]`} style={{ color: ins.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-[var(--aw-text-muted)]">{ins.title}</div>
                    <div className="text-[13px] text-[var(--aw-text-primary)] mt-0.5" style={{ fontWeight: 700 }}>{ins.value}</div>
                    <div className="text-[10px] text-[var(--aw-text-muted)] mt-1">{ins.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========================
// 5) SALES QUICK REPORT SCREEN
// ========================
export function SalesQuickReportScreen() {
  const { setAdminScreen, showToast } = useApp();
  const [subTab, setSubTab] = useState<'report' | 'shift'>('report');
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const periodLabels = { today: 'امروز', week: 'این هفته', month: 'این ماه', custom: 'بازه دلخواه' };
  const periodIcons = { today: 'fa-solid fa-sun', week: 'fa-solid fa-calendar-week', month: 'fa-solid fa-calendar-days', custom: 'fa-solid fa-calendar-days' };
  const periodData: Record<'today' | 'week' | 'month', { revenue: number; orders: number; avgTicket: number; growth: number }> = {
    today: { revenue: 0, orders: 0, avgTicket: 0, growth: 0 },
    week: { revenue: 0, orders: 0, avgTicket: 0, growth: 0 },
    month: { revenue: 0, orders: 0, avgTicket: 0, growth: 0 },
  };

  // Derive custom-range stats from from/to dates (simple deterministic mock based on day span)
  const customData = (() => {
    if (!fromDate || !toDate) return null;
    const f = new Date(fromDate).getTime();
    const t = new Date(toDate).getTime();
    if (isNaN(f) || isNaN(t) || t < f) return null;
    const days = Math.max(1, Math.round((t - f) / 86400000) + 1);
    const revenue = 0;
    const orders = 0;
    return { revenue, orders, avgTicket: orders ? Math.round(revenue / orders) : 0, growth: 0 };
  })();

  const data = period === 'custom' ? (customData || { revenue: 0, orders: 0, avgTicket: 0, growth: 0 }) : periodData[period];

  const lowStockItems = PRODUCTS.filter(p => p.stock <= 5);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 pt-3 pb-1">
        <div className="flex gap-1 p-1 rounded-full" style={{ background: 'color-mix(in srgb, var(--aw-primary) 8%, var(--aw-bg-card))', border: '1px solid color-mix(in srgb, var(--aw-primary) 20%, var(--aw-border))', backdropFilter: 'blur(14px) saturate(1.4)', WebkitBackdropFilter: 'blur(14px) saturate(1.4)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25)' }}>
          <button onClick={() => setSubTab('report')} className="aw-no-pill flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full border-none cursor-pointer text-[12.5px]" style={subTab === 'report' ? { background: 'color-mix(in srgb, var(--aw-primary) 22%, transparent)', color: 'var(--aw-primary)', fontWeight: 700, backdropFilter: 'blur(14px) saturate(1.4)', WebkitBackdropFilter: 'blur(14px) saturate(1.4)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--aw-primary) 30%, transparent)' } : { background: 'transparent', color: 'var(--aw-text-secondary)', fontWeight: 700 }}>
            <i className="fa-solid fa-chart-pie text-[12px]" />گزارش سریع
          </button>
          <button onClick={() => setSubTab('shift')} className="aw-no-pill flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full border-none cursor-pointer text-[12.5px]" style={subTab === 'shift' ? { background: 'color-mix(in srgb, var(--aw-primary) 22%, transparent)', color: 'var(--aw-primary)', fontWeight: 700, backdropFilter: 'blur(14px) saturate(1.4)', WebkitBackdropFilter: 'blur(14px) saturate(1.4)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--aw-primary) 30%, transparent)' } : { background: 'transparent', color: 'var(--aw-text-secondary)', fontWeight: 700 }}>
            <i className="fa-solid fa-cash-register text-[12px]" />شیفت و صندوق
          </button>
        </div>
      </div>

      {subTab === 'shift' ? <div className="flex-1 min-h-0 overflow-hidden"><SalesShiftScreen embedded /></div> : (<>

      {/* Period selector */}
      <div className="flex gap-1 p-1 mx-4 mt-3 mb-2 overflow-x-auto aw-noscroll" style={tabBarStyle}>
        {(['today', 'week', 'month', 'custom'] as const).map(p => (
          <button
            key={p}
            className="flex-1 flex items-center justify-center gap-1 py-2 px-1 border-none cursor-pointer text-[11px] transition-all"
            style={period === p ? activeTabStyle : inactiveTabStyle}
            onClick={() => setPeriod(p)}
          >
            <i className={`${periodIcons[p]} text-[10px]`} />
            <span>{periodLabels[p]}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Custom range picker */}
        {/* Alerts center */}
        <SalesAlertsSection />

        {period === 'custom' && (
          <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
            <div className="flex items-center gap-1.5 mb-2">
              <i className="fa-solid fa-calendar-days text-[12px]" style={{ color: '#10B981' }} />
              <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>انتخاب بازه زمانی</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg" style={{ background: 'var(--aw-bg-app)', border: '1px solid var(--aw-border)' }}>
                <div className="text-[10px] text-[var(--aw-text-muted)] mb-1">از تاریخ</div>
                <JalaliDatePicker className="w-full bg-transparent border-none outline-none text-[12px] text-[var(--aw-text-primary)] !py-0 !px-0" placeholder="از تاریخ" value={fromDate} onChange={v => setFromDate(v)} />
              </div>
              <div className="p-2 rounded-lg" style={{ background: 'var(--aw-bg-app)', border: '1px solid var(--aw-border)' }}>
                <div className="text-[10px] text-[var(--aw-text-muted)] mb-1">تا تاریخ</div>
                <JalaliDatePicker className="w-full bg-transparent border-none outline-none text-[12px] text-[var(--aw-text-primary)] !py-0 !px-0" placeholder="تا تاریخ" value={toDate} onChange={v => setToDate(v)} />
              </div>
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {[
                { label: '۷ روز اخیر', days: 7 },
                { label: '۳۰ روز اخیر', days: 30 },
                { label: '۹۰ روز اخیر', days: 90 },
              ].map(s => (
                <button
                  key={s.days}
                  className="text-[10px] px-2.5 py-1 rounded-full border-none cursor-pointer"
                  style={{ background: '#10B98122', color: '#10B981', fontWeight: 600 }}
                  onClick={() => {
                    const to = new Date();
                    const from = new Date(); from.setDate(from.getDate() - s.days + 1);
                    setFromDate(from.toISOString().slice(0, 10));
                    setToDate(to.toISOString().slice(0, 10));
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {!customData && (
              <div className="text-[10px] text-[var(--aw-text-muted)] mt-2 text-center">
                <i className="fa-solid fa-circle-info ml-1" />برای مشاهده گزارش، بازه زمانی معتبر را انتخاب کنید
              </div>
            )}
          </div>
        )}

        {/* Main stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-3 rounded-[10px]" style={cardStyle}>
            <div className="flex items-center gap-1.5 mb-1">
              <i className="fa-solid fa-coins text-[12px]" style={{ color: '#10B981' }} />
              <span className="text-[11px] text-[var(--aw-text-muted)]">درآمد {periodLabels[period]}</span>
            </div>
            <div className="text-[17px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(data.revenue)}</div>
            <div className="flex items-center gap-1 mt-1">
              <i className="fa-solid fa-arrow-up text-[9px]" style={{ color: '#10B981' }} />
              <span className="text-[10px]" style={{ color: '#10B981' }}>+{data.growth}٪</span>
            </div>
          </div>
          <div className="p-3 rounded-[10px]" style={cardStyle}>
            <div className="flex items-center gap-1.5 mb-1">
              <i className="fa-solid fa-receipt text-[12px]" style={{ color: 'var(--aw-primary)' }} />
              <span className="text-[11px] text-[var(--aw-text-muted)]">تعداد سفارش</span>
            </div>
            <div className="text-[17px]" style={{ color: 'var(--aw-primary)', fontWeight: 700 }}>{data.orders}</div>
            <div className="text-[10px] text-[var(--aw-text-muted)] mt-1">میانگین: {formatPrice(data.avgTicket)}</div>
          </div>
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { l: 'مشتری جدید', v: '۸', c: '#10B981', i: 'fa-solid fa-user-plus' },
            { l: 'بازگشتی', v: '۲۴', c: 'var(--aw-primary)', i: 'fa-solid fa-rotate' },
            { l: 'تخفیف', v: '۹۲۰K', c: '#F59E0B', i: 'fa-solid fa-tag' },
            { l: 'مرجوعی', v: '۲', c: '#EF4444', i: 'fa-solid fa-rotate-left' },
          ].map((k, i) => (
            <div key={i} className="p-2.5 rounded-[10px] text-center" style={cardStyle}>
              <i className={`${k.i} text-[13px]`} style={{ color: k.c }} />
              <div className="text-[14px] mt-1" style={{ fontWeight: 800 }}>{k.v}</div>
              <div className="text-[9px] text-[var(--aw-text-muted)]">{k.l}</div>
            </div>
          ))}
        </div>

        {/* Sales chart placeholder */}
        <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
          <SectionHeader title="روند فروش" icon="fa-solid fa-chart-line" />
          <div className="h-[140px] mt-2 flex items-end gap-1">
            {DAILY_SALES.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <motion.div
                  className="w-full rounded-t-md"
                  style={{ background: 'linear-gradient(180deg, #10B981, #047857)', minHeight: 4 }}
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.amount / 3200) * 100}%` }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                />
                <span className="text-[8px] text-[var(--aw-text-muted)]">{d.hour}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
          <SectionHeader title="پرفروش‌ترین محصولات" icon="fa-solid fa-fire" color="var(--aw-primary)" />
          <div className="flex flex-col gap-2 mt-2">
            {TOP_PRODUCTS.map((prod, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white" style={{ background: i < 3 ? 'var(--aw-primary)' : 'var(--aw-text-muted)', fontWeight: 700 }}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{prod.name}</span>
                    <span className="text-[11px] text-[var(--aw-text-muted)]">{prod.sold} عدد</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--aw-bg-app)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: i < 3 ? 'linear-gradient(90deg, var(--aw-primary), #EF4444)' : 'var(--aw-text-muted)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${prod.pct}%` }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                    />
                  </div>
                </div>
                <span className="text-[11px] min-w-[65px] text-left" style={{ color: '#10B981', fontWeight: 600 }}>{formatPrice(prod.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low-selling products */}
        <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
          <SectionHeader title="محصولات کم‌فروش" icon="fa-solid fa-arrow-trend-down" color="#EF4444" />
          <div className="flex flex-col gap-2 mt-2">
            {[{ name: 'قهوه لاته', sold: 4, img: '☕' }, { name: 'ناچو پنیری', sold: 6, img: '🧀' }, { name: 'سالاد سزار', sold: 7, img: '🥗' }].map((p, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-[18px]">{p.img}</span>
                <span className="flex-1 text-[12px] text-[var(--aw-text-primary)]">{p.name}</span>
                <span className="text-[11px] text-[var(--aw-text-muted)]">{p.sold.toLocaleString('fa-IR')} فروش</span>
                <button className="text-[10px] px-2 py-1 rounded-lg border-none cursor-pointer text-white" style={{ background: '#F59E0B', fontWeight: 600 }} onClick={() => { (api as any).create('discount_codes', { product: p.name, type: 'suggested', createdAt: new Date().toISOString() }); showToast('پیشنهاد تخفیف برای ' + p.name + ' ثبت شد ✅'); }}>تخفیف</button>
              </div>
            ))}
          </div>
        </div>

        {/* Sales by channel */}
        <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
          <SectionHeader title="فروش بر اساس کانال" icon="fa-solid fa-diagram-project" color="var(--aw-primary)" />
          <div className="flex flex-col gap-2 mt-2">
            {[{ ch: 'حضوری', pct: 48, c: '#10B981' }, { ch: 'آنلاین', pct: 32, c: 'var(--aw-primary)' }, { ch: 'تلفنی', pct: 12, c: 'var(--aw-primary)' }, { ch: 'بیرون‌بر', pct: 8, c: '#F59E0B' }].map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--aw-text-secondary)] w-16">{r.ch}</span>
                <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--aw-bg-app)' }}><div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.c }} /></div>
                <span className="text-[11px]" style={{ color: r.c, fontWeight: 600 }}>{r.pct.toLocaleString('fa-IR')}٪</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sales per shift */}
        <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
          <SectionHeader title="فروش هر شیفت" icon="fa-solid fa-business-time" color="var(--aw-primary)" />
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[{ s: 'صبح', v: '۲.۱M', o: 28 }, { s: 'ظهر', v: '۴.۸M', o: 52 }, { s: 'شب', v: '۳.۵M', o: 41 }].map((x, i) => (
              <div key={i} className="p-2.5 rounded-lg text-center" style={{ background: 'var(--aw-bg-app)' }}>
                <div className="text-[12px] text-[var(--aw-text-muted)]">{x.s}</div>
                <div className="text-[14px] mt-0.5" style={{ color: 'var(--aw-primary)', fontWeight: 800 }}>{x.v}</div>
                <div className="text-[9px] text-[var(--aw-text-muted)] mt-0.5">{x.o.toLocaleString('fa-IR')} سفارش</div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak hours table */}
        <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
          <SectionHeader title="ساعات اوج سفارش" icon="fa-solid fa-clock" color="#F59E0B" />
          <div className="mt-2 rounded-lg overflow-hidden" style={{ border: '1px solid var(--aw-border)' }}>
            <div className="grid grid-cols-4 gap-0 px-3 py-2 text-[10px] text-[var(--aw-text-muted)]" style={{ background: 'var(--aw-bg-app)', fontWeight: 600 }}>
              <span>بازه ساعت</span>
              <span className="text-center">سفارش</span>
              <span className="text-center">سهم</span>
              <span className="text-left">روند</span>
            </div>
            {[
              { range: '۱۲:۰۰ – ۱۴:۰۰', orders: 86, share: 28, trend: 'up', label: 'اوج' },
              { range: '۱۹:۰۰ – ۲۱:۰۰', orders: 74, share: 24, trend: 'up', label: 'اوج' },
              { range: '۲۰:۰۰ – ۲۲:۰۰', orders: 58, share: 19, trend: 'up' },
              { range: '۰۸:۰۰ – ۱۰:۰۰', orders: 42, share: 14, trend: 'flat' },
              { range: '۱۵:۰۰ – ۱۷:۰۰', orders: 28, share: 9, trend: 'down' },
              { range: '۲۲:۰۰ – ۲۴:۰۰', orders: 18, share: 6, trend: 'down' },
            ].map((r, i, arr) => (
              <div key={i} className="grid grid-cols-4 gap-0 px-3 py-2 text-[11px] items-center" style={i < arr.length - 1 ? { borderBottom: '1px solid var(--aw-border)' } : {}}>
                <span className="text-[var(--aw-text-primary)] flex items-center gap-1.5">
                  {r.label && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#EF4444' }} />}
                  {r.range}
                </span>
                <span className="text-center text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{r.orders.toLocaleString('fa-IR')}</span>
                <span className="text-center" style={{ color: 'var(--aw-primary)', fontWeight: 600 }}>{r.share.toLocaleString('fa-IR')}٪</span>
                <span className="text-left">
                  <i className={`fa-solid ${r.trend === 'up' ? 'fa-arrow-trend-up' : r.trend === 'down' ? 'fa-arrow-trend-down' : 'fa-minus'} text-[11px]`} style={{ color: r.trend === 'up' ? '#10B981' : r.trend === 'down' ? '#EF4444' : '#F59E0B' }} />
                </span>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-[var(--aw-text-muted)] mt-2 flex items-center gap-1">
            <i className="fa-solid fa-circle-info text-[9px]" style={{ color: '#F59E0B' }} />
            بیشترین سفارش بین <span style={{ color: '#F59E0B', fontWeight: 700 }}>۱۲ تا ۱۴</span> ثبت می‌شود — برای پیک ناهار نیرو افزایش دهید.
          </div>
        </div>

        {/* Sales trend analysis */}
        <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
          <SectionHeader title="تحلیل افزایش/کاهش فروش" icon="fa-solid fa-chart-column" color="var(--aw-primary)" />
          <div className="grid grid-cols-2 gap-2 mt-2 mb-3">
            <div className="p-2.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #10B98122, transparent)', border: '1px solid #10B98144' }}>
              <div className="text-[10px] text-[var(--aw-text-muted)]">رشد دوره</div>
              <div className="text-[18px]" style={{ color: '#10B981', fontWeight: 700 }}>+{data.growth.toLocaleString('fa-IR')}٪</div>
              <div className="text-[9px] text-[var(--aw-text-muted)] mt-0.5"><i className="fa-solid fa-arrow-up text-[8px] ml-1" style={{ color: '#10B981' }} />نسبت به دوره قبل</div>
            </div>
            <div className="p-2.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #EF444422, transparent)', border: '1px solid #EF444444' }}>
              <div className="text-[10px] text-[var(--aw-text-muted)]">دسته کاهشی</div>
              <div className="text-[16px]" style={{ color: '#EF4444', fontWeight: 700 }}>−۸٪</div>
              <div className="text-[9px] text-[var(--aw-text-muted)] mt-0.5">دسته «اسنک» افت داشته</div>
            </div>
          </div>
          {[
            { cat: 'غذاهای اصلی', change: 18, status: 'up', desc: 'بیشترین رشد در پیتزا و پاستا' },
            { cat: 'نوشیدنی‌ها', change: 12, status: 'up', desc: 'تأثیر کمپین تابستانه' },
            { cat: 'دسرها', change: 4, status: 'flat', desc: 'پایدار با نوسان کم' },
            { cat: 'اسنک‌ها', change: -8, status: 'down', desc: 'کاهش بازدید عصرگاهی' },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-2 py-2" style={i < 3 ? { borderBottom: '1px solid var(--aw-border)' } : {}}>
              <i className={`fa-solid ${r.status === 'up' ? 'fa-arrow-trend-up' : r.status === 'down' ? 'fa-arrow-trend-down' : 'fa-minus'} text-[14px]`} style={{ color: r.status === 'up' ? '#10B981' : r.status === 'down' ? '#EF4444' : '#F59E0B' }} />
              <div className="flex-1">
                <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{r.cat}</div>
                <div className="text-[10px] text-[var(--aw-text-muted)]">{r.desc}</div>
              </div>
              <span className="text-[12px]" style={{ color: r.status === 'up' ? '#10B981' : r.status === 'down' ? '#EF4444' : '#F59E0B', fontWeight: 700 }}>
                {r.change > 0 ? '+' : ''}{r.change.toLocaleString('fa-IR')}٪
              </span>
            </div>
          ))}
        </div>

        {/* AI Sales boost suggestions */}
        <div className="p-3 rounded-[10px] mb-3" style={{ background: 'linear-gradient(135deg, var(--aw-primary-bg), var(--aw-primary-bg))', border: '1px solid var(--aw-primary-bg)', borderRadius: 10 }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
              <i className="fa-solid fa-wand-magic-sparkles text-[12px]" />
            </div>
            <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>پیشنهاد افزایش فروش</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-md mr-auto" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', color: '#fff', fontWeight: 600 }}>AI</span>
          </div>
          {[
            { title: 'باندل ناهار اقتصادی', impact: '+۱۸٪', desc: 'پکیج پیتزا + نوشابه + سالاد در ساعت اوج ۱۲–۱۴', icon: 'fa-solid fa-box', color: '#10B981' },
            { title: 'کمپین «دوشنبه دسر»', impact: '+۱۲٪', desc: 'تخفیف ۲۰٪ دسر برای روزهای کم‌فروش هفته', icon: 'fa-solid fa-ice-cream', color: 'var(--aw-primary)' },
            { title: 'بازگشت ۲ مشتری در خطر', impact: '+۸٪', desc: 'ارسال کد تخفیف اختصاصی به سگمنت در خطر ریزش', icon: 'fa-solid fa-user-plus', color: '#F59E0B' },
            { title: 'تبلیغ ساعت طلایی ۱۹–۲۱', impact: '+۱۵٪', desc: 'افزایش بودجه دیجیتال در پیک شام', icon: 'fa-solid fa-bullhorn', color: 'var(--aw-primary)' },
          ].map((s, i) => (
            <div key={i} className="p-2.5 rounded-lg mt-2 flex items-start gap-2.5" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}22` }}>
                <i className={`${s.icon} text-[14px]`} style={{ color: s.color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{s.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: `${s.color}22`, color: s.color, fontWeight: 700 }}>{s.impact}</span>
                </div>
                <div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">{s.desc}</div>
              </div>
              <button onClick={() => { (api as any).create('sales_suggestions', { title: s.title, applied: true, at: new Date().toISOString() }); showToast('پیشنهاد «' + s.title + '» اعمال شد ✅'); }} className="text-[10px] px-2.5 py-1 rounded-md border-none cursor-pointer text-white" style={{ background: s.color, fontWeight: 600 }}>اعمال</button>
            </div>
          ))}
        </div>

        {/* Product performance analysis */}
        <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
          <SectionHeader title="تحلیل عملکرد محصولات" icon="fa-solid fa-chart-pie" color="var(--aw-primary)" />
          <div className="grid grid-cols-3 gap-2 mt-2 mb-3">
            {[
              { label: 'ستاره‌ها', count: 5, icon: 'fa-solid fa-star', color: '#FFD700', desc: 'پرفروش + سودده' },
              { label: 'پر سؤال', count: 3, icon: 'fa-solid fa-circle-question', color: 'var(--aw-primary)', desc: 'پتانسیل رشد' },
              { label: 'سگ‌ها', count: 2, icon: 'fa-solid fa-arrow-down', color: '#EF4444', desc: 'کم‌فروش + کم‌سود' },
            ].map((b, i) => (
              <div key={i} className="p-2 rounded-lg text-center" style={{ background: 'var(--aw-bg-app)', border: `1px solid ${b.color}44` }}>
                <i className={`${b.icon} text-[14px] mb-0.5`} style={{ color: b.color }} />
                <div className="text-[14px]" style={{ color: b.color, fontWeight: 700 }}>{b.count.toLocaleString('fa-IR')}</div>
                <div className="text-[9px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{b.label}</div>
                <div className="text-[8px] text-[var(--aw-text-muted)]">{b.desc}</div>
              </div>
            ))}
          </div>
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--aw-border)' }}>
            <div className="grid grid-cols-12 gap-0 px-3 py-2 text-[10px] text-[var(--aw-text-muted)]" style={{ background: 'var(--aw-bg-app)', fontWeight: 600 }}>
              <span className="col-span-4">محصول</span>
              <span className="col-span-2 text-center">فروش</span>
              <span className="col-span-2 text-center">سود</span>
              <span className="col-span-2 text-center">رشد</span>
              <span className="col-span-2 text-center">عملکرد</span>
            </div>
            {[
              { name: 'پیتزا مخصوص', sold: 48, margin: 42, growth: 22, score: 'star' },
              { name: 'برگر کلاسیک', sold: 35, margin: 38, growth: 14, score: 'star' },
              { name: 'قهوه لاته', sold: 62, margin: 55, growth: 8, score: 'star' },
              { name: 'پاستا آلفردو', sold: 22, margin: 30, growth: 18, score: 'question' },
              { name: 'چیزکیک', sold: 28, margin: 48, growth: -3, score: 'question' },
              { name: 'سالاد سزار', sold: 14, margin: 22, growth: -12, score: 'dog' },
              { name: 'نوشیدنی انرژی‌زا', sold: 8, margin: 18, growth: -18, score: 'dog' },
            ].map((p, i, arr) => {
              const sc = p.score === 'star' ? { color: '#FFD700', label: '⭐' } : p.score === 'question' ? { color: 'var(--aw-primary)', label: '❓' } : { color: '#EF4444', label: '⚠️' };
              return (
                <div key={i} className="grid grid-cols-12 gap-0 px-3 py-2 text-[11px] items-center" style={i < arr.length - 1 ? { borderBottom: '1px solid var(--aw-border)' } : {}}>
                  <span className="col-span-4 text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{p.name}</span>
                  <span className="col-span-2 text-center text-[var(--aw-text-secondary)]">{p.sold.toLocaleString('fa-IR')}</span>
                  <span className="col-span-2 text-center" style={{ color: '#10B981', fontWeight: 600 }}>{p.margin}٪</span>
                  <span className="col-span-2 text-center" style={{ color: p.growth >= 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                    {p.growth > 0 ? '+' : ''}{p.growth.toLocaleString('fa-IR')}٪
                  </span>
                  <span className="col-span-2 text-center text-[13px]">{sc.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue breakdown */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'نقدی', value: '۳۵٪', icon: 'fa-solid fa-money-bill-wave', color: '#10B981' },
            { label: 'کارتی', value: '۵۲٪', icon: 'fa-solid fa-credit-card', color: 'var(--aw-primary)' },
            { label: 'کیف پول', value: '۱۳٪', icon: 'fa-solid fa-wallet', color: 'var(--aw-primary)' },
          ].map((item, i) => (
            <div key={i} className="p-2.5 rounded-[10px] text-center" style={cardStyle}>
              <i className={`${item.icon} text-[14px] mb-1`} style={{ color: item.color }} />
              <div className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{item.value}</div>
              <div className="text-[9px] text-[var(--aw-text-muted)]">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Low stock alerts */}
        {lowStockItems.length > 0 && (
          <div className="p-3 rounded-[10px]" style={{ background: '#F59E0B12', border: '1px solid #F59E0B33', borderRadius: 10 }}>
            <SectionHeader title="هشدار موجودی کم" icon="fa-solid fa-triangle-exclamation" color="#F59E0B" count={lowStockItems.length} />
            <div className="flex flex-col gap-1.5 mt-2">
              {lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between py-1">
                  <span className="text-[12px] text-[var(--aw-text-secondary)]">{item.img} {item.name}</span>
                  <span className="text-[12px]" style={{ color: item.stock === 0 ? '#EF4444' : '#F59E0B', fontWeight: 700 }}>
                    {item.stock === 0 ? 'ناموجود' : `${item.stock} ${item.unit}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </>)}
    </div>
  );
}
