import React from 'react';
import { useApp } from './app-context';
import { QuickForm } from './quick-actions';
import { toFa, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from './data';

// Figma-exported icon components
import Layer from '../../imports/Layer4-1/index';
import VuesaxOutlineShop from '../../imports/VuesaxOutlineShop/index';
import Element from '../../imports/Element3-1/index';
import Group from '../../imports/Group159-1/index';
import LineMapsRestaurant from '../../imports/LineMapsRestaurant-1/index';
import AddSquare from '../../imports/AddSquare-1/index';
import VuesaxOutlinePercentageSquare from '../../imports/VuesaxOutlinePercentageSquare/index';
import Gift from '../../imports/Gift/index';

// Glass card base style (Figma node 46:4 gradient geometry, tinted to theme --aw-eu-primary)
const gc: React.CSSProperties = {
  // soft diagonal lavender fill, tinted to theme
  background: 'linear-gradient(135deg, color-mix(in srgb, var(--aw-eu-primary) 22%, white) 0%, color-mix(in srgb, var(--aw-eu-primary) 8%, white) 55%, color-mix(in srgb, var(--aw-eu-primary) 16%, white) 100%)',
  borderRadius: 11,
  // bright light rim (gradient border, brightest at corners) + soft purple outer glow
  border: '1px solid transparent',
  backgroundImage: 'linear-gradient(135deg, color-mix(in srgb, var(--aw-eu-primary) 22%, white) 0%, color-mix(in srgb, var(--aw-eu-primary) 8%, white) 55%, color-mix(in srgb, var(--aw-eu-primary) 16%, white) 100%), linear-gradient(135deg, rgba(255,255,255,0.95) 0%, color-mix(in srgb, var(--aw-eu-primary) 30%, white) 50%, rgba(255,255,255,0.95) 100%)',
  backgroundOrigin: 'border-box',
  backgroundClip: 'padding-box, border-box',
  boxShadow: '0 0 5px 0 color-mix(in srgb, var(--aw-eu-primary) 22%, transparent)',
};

// True glass — translucent tint + blur so content behind shows through
const gcGlass: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--aw-eu-primary) 5%, transparent)',
  backdropFilter: 'blur(20px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
  borderRadius: 11,
  border: '1px solid color-mix(in srgb, var(--aw-eu-primary) 22%, transparent)',
  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-eu-primary) 12%, transparent)',
};

const KAMAND = "'Kamand', 'Vazirmatn', sans-serif";

// ── Icon wrapper helpers ──────────────────────────────────────

/** 56×56 glass quick-action card */
function ActionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...gc, width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
      {children}
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────

function SectionHeader({ title, onMore }: { title: string; onMore?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-2">
      {/* title on RIGHT (first in RTL flex) */}
      <span style={{ fontFamily: KAMAND, fontSize: 16, fontWeight: 500, color: 'var(--aw-text-primary)' }}>
        {title}
      </span>
      {/* link on LEFT (last in RTL flex) */}
      <button
        className="flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
        onClick={onMore}
      >
        <span style={{ fontFamily: KAMAND, fontSize: 10, color: 'var(--aw-text-primary)' }}>مشاهده بیشتر</span>
        <i className="fa-solid fa-chevron-left" style={{ fontSize: 8, color: 'var(--aw-text-primary)' }} />
      </button>
    </div>
  );
}

// ── Simple wallet content (avoids circular import with end-user-panel) ──

function fmtToman(n: number): string {
  return toFa(Math.abs(Math.round(n)).toLocaleString('en-US'));
}
const WALLET_TX_META: Record<string, { icon: string; color: string; bg: string }> = {
  deposit:  { icon: 'fa-arrow-down',     color: '#10b981', bg: 'rgba(16,185,129,0.16)' },
  withdraw: { icon: 'fa-arrow-up',       color: '#f59e0b', bg: 'rgba(245,158,11,0.16)' },
  purchase: { icon: 'fa-robot',          color: '#8B5CF6', bg: 'rgba(139,92,246,0.16)' },
  spend:    { icon: 'fa-cart-shopping',  color: '#ef4444', bg: 'rgba(239,68,68,0.16)' },
};

function SimpleWalletContent() {
  const { walletBalance, walletTx, walletDeposit, walletWithdraw, showToast } = useApp();
  const [tab, setTab] = React.useState<'overview' | 'history'>('overview');
  const [mode, setMode] = React.useState<null | 'deposit' | 'withdraw'>(null);
  const [amount, setAmount] = React.useState('');

  const faToEn = (s: string) => s.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '');
  const amountNum = parseInt(faToEn(amount)) || 0;
  const quickAmounts = [50000, 100000, 200000, 500000];

  const totalIn = walletTx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOut = walletTx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const agentSpend = walletTx.filter(t => t.type === 'purchase').reduce((s, t) => s + Math.abs(t.amount), 0);
  const agentCount = walletTx.filter(t => t.type === 'purchase').length;

  const confirm = () => {
    if (amountNum <= 0) { showToast('مبلغ معتبر وارد کنید', 'error'); return; }
    if (mode === 'withdraw' && amountNum > walletBalance) { showToast('موجودی کافی نیست', 'error'); return; }
    if (mode === 'deposit') { walletDeposit(amountNum); showToast('واریز با موفقیت انجام شد ✅', 'success'); }
    else { walletWithdraw(amountNum); showToast('برداشت با موفقیت انجام شد ✅', 'success'); }
    setAmount(''); setMode(null); setTab('history');
  };

  const inputCls = 'w-full px-3 py-2.5 rounded-[10px] text-[15px] border border-[var(--aw-border)] bg-[var(--aw-bg-input)] text-[var(--aw-text-primary)] outline-none';

  return (
    <div className="flex flex-col gap-3 p-1">
      {/* Balance card */}
      <div className="p-4 rounded-2xl text-center relative overflow-hidden" style={{ ...gcGlass }}>
        <p className="text-[11px] m-0" style={{ color: 'var(--aw-text-secondary)' }}>موجودی کیف پول</p>
        <h2 className="text-[26px] m-0 mt-1" style={{ fontWeight: 800, direction: 'ltr', color: 'var(--aw-text-primary)' }}>{fmtToman(walletBalance)} <span className="text-[12px]" style={{ color: 'var(--aw-text-muted)' }}>تومان</span></h2>
        <div className="flex gap-2 mt-3">
          <button onClick={() => { setMode(mode === 'deposit' ? null : 'deposit'); setAmount(''); }} className="flex-1 py-2 rounded-xl cursor-pointer text-[12px]" style={{ background: 'color-mix(in srgb, #10B981 16%, transparent)', color: '#10B981', border: '1px solid color-mix(in srgb, #10B981 40%, transparent)', fontWeight: 700, backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}>
            <i className="fa-solid fa-arrow-down text-[11px] ml-1" /> واریز
          </button>
          <button onClick={() => { setMode(mode === 'withdraw' ? null : 'withdraw'); setAmount(''); }} className="flex-1 py-2 rounded-xl cursor-pointer text-[12px]" style={{ background: 'color-mix(in srgb, var(--aw-eu-primary) 18%, transparent)', color: 'var(--aw-eu-primary)', border: '1px solid color-mix(in srgb, var(--aw-eu-primary) 40%, transparent)', fontWeight: 700 }}>
            <i className="fa-solid fa-arrow-up text-[11px] ml-1" /> برداشت
          </button>
        </div>
      </div>

      {/* Inline deposit/withdraw form */}
      {mode && (
        <div className="rounded-xl p-3" style={{ ...gcGlass }}>
          <div className="text-[12px] mb-2" style={{ fontWeight: 700 }}>{mode === 'deposit' ? 'واریز به کیف پول' : 'برداشت از کیف پول'}</div>
          <input className={inputCls} value={amount} onChange={e => setAmount(e.target.value)} placeholder="مبلغ (تومان)" inputMode="numeric" dir="ltr" style={{ textAlign: 'right' }} />
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {quickAmounts.map(q => (
              <button key={q} onClick={() => setAmount(toFa(q.toLocaleString('en-US')))} className="text-[11px] px-2.5 py-1 rounded-full border border-[var(--aw-border)] bg-transparent cursor-pointer" style={{ color: 'var(--aw-text-secondary)' }}>{fmtToman(q)}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button onClick={confirm} className="py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[12px]" style={{ background: mode === 'deposit' ? '#10B981' : '#f59e0b', fontWeight: 700 }}>تأیید {mode === 'deposit' ? 'واریز' : 'برداشت'}</button>
            <button onClick={() => { setMode(null); setAmount(''); }} className="py-2.5 rounded-[10px] cursor-pointer text-[12px] bg-transparent" style={{ border: '1px solid var(--aw-border)', color: 'var(--aw-text-secondary)', fontWeight: 700 }}>انصراف</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-[3px] rounded-full border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
        {[{ id: 'overview', label: 'گزارش' }, { id: 'history', label: 'تراکنش‌ها' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} className="flex-1 py-1.5 rounded-full border-none cursor-pointer text-[12px]"
            style={tab === t.id ? { background: 'var(--aw-eu-primary, #7E5FAA)', color: '#fff', fontWeight: 700 } : { background: 'transparent', color: 'var(--aw-text-muted)', fontWeight: 600 }}>{t.label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3" style={{ ...gcGlass }}>
              <div className="text-[10px] text-[var(--aw-text-muted)] mb-1"><i className="fa-solid fa-arrow-down ml-1" style={{ color: '#10b981' }} />کل واریز</div>
              <div className="text-[15px]" style={{ fontWeight: 800, color: '#10b981', direction: 'ltr', textAlign: 'right' }}>{fmtToman(totalIn)}</div>
            </div>
            <div className="rounded-xl p-3" style={{ ...gcGlass }}>
              <div className="text-[10px] text-[var(--aw-text-muted)] mb-1"><i className="fa-solid fa-arrow-up ml-1" style={{ color: '#ef4444' }} />کل خرج</div>
              <div className="text-[15px]" style={{ fontWeight: 800, color: '#ef4444', direction: 'ltr', textAlign: 'right' }}>{fmtToman(totalOut)}</div>
            </div>
          </div>
          <div className="rounded-xl p-3 flex items-center gap-3" style={{ ...gcGlass }}>
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white flex-shrink-0" style={{ background: '#8B5CF6' }}><i className="fa-solid fa-robot" /></div>
            <div className="flex-1">
              <div className="text-[12px]" style={{ fontWeight: 700 }}>خرید عامل‌ها</div>
              <div className="text-[10px] text-[var(--aw-text-muted)]">{toFa(agentCount)} عامل خریداری‌شده</div>
            </div>
            <div className="text-[14px]" style={{ fontWeight: 800, color: '#8B5CF6', direction: 'ltr' }}>{fmtToman(agentSpend)}</div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="flex flex-col gap-2">
          {walletTx.length === 0 && <div className="text-center text-[12px] text-[var(--aw-text-muted)] py-6">تراکنشی ثبت نشده است.</div>}
          {walletTx.map(t => {
            const meta = WALLET_TX_META[t.type] || WALLET_TX_META.spend;
            return (
              <div key={t.id} className="flex items-center gap-3 rounded-xl p-2.5" style={{ ...gcGlass }}>
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: meta.bg, color: meta.color }}><i className={`fa-solid ${meta.icon} text-[13px]`} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] truncate" style={{ fontWeight: 600 }}>{t.title}</div>
                  <div className="text-[10px] text-[var(--aw-text-muted)]">{t.date}</div>
                </div>
                <div className="text-[13px] flex-shrink-0" style={{ fontWeight: 800, color: t.amount > 0 ? '#10b981' : 'var(--aw-text-primary)', direction: 'ltr' }}>{t.amount > 0 ? '+' : '−'}{fmtToman(t.amount)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Glass Home Screen ──────────────────────────────────────────

function EuHomeScreenGlass() {
  const { openModal, setEuScreen, orders, cartCount } = useApp();

  const activeOrders = orders.filter(o => o.status === 'preparing' || o.status === 'pending');
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

  // RTL order: first in JSX → physical RIGHT, last → physical LEFT
  // Visual L→R: بیشتر | سفارش‌غذا | پشتیبانی | اپلیکیشن | مارکت
  // JSX order:  [مارکت, اپلیکیشن, پشتیبانی, سفارش‌غذا, بیشتر]
  const quickActions: { label: string; icon: React.ReactNode; action: () => void; disabled?: boolean; badge?: number }[] = [
    {
      label: 'سبد خرید',
      badge: cartCount,
      icon: (
        <div style={{ width: 32, height: 32, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="src/icons/png/shop-bag.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
        </div>
      ),
      action: () => setEuScreen('euCartScreen'),
    },
    {
      label: 'ایجنت‌ها',
      disabled: true,
      icon: (
        <div style={{ width: 32, height: 32, position: 'relative', ['--fill-0' as string]: 'var(--aw-text-secondary, #9aa0b4)' }}>
          <Element />
        </div>
      ),
      action: () => {},
    },
    {
      label: 'پشتیبانی',
      icon: (
        <div style={{ width: 30, height: 32, position: 'relative', ['--fill-0' as string]: 'var(--aw-text-secondary, #9aa0b4)' }}>
          <Group />
        </div>
      ),
      action: () => setEuScreen('euSupportScreen'),
    },
  ];

  // Demo order data for when no real orders exist
  const demoOrders = [
    { key: 'o1', icon: 'fa-solid fa-utensils', title: 'سفارش #۱۰۲۴', subtitle: 'پیتزا مخصوص × ۱', price: '۳۲۰,۰۰۰', statusBg: 'rgba(255,141,40,0.15)', statusLabel: 'در حال آماده‌سازی' },
    { key: 'o2', icon: 'fa-regular fa-hourglass-half', title: 'سفارش #۱۰۲۴', subtitle: 'پیتزا مخصوص × ۱', price: '۳۲۰,۰۰۰', statusBg: 'rgba(92,74,189,0.15)', statusLabel: 'در انتظار تایید' },
  ];

  const displayOrders = activeOrders.length > 0
    ? activeOrders.slice(0, 2).map((o, i) => ({
        key: o.id,
        icon: i === 0 ? 'fa-solid fa-utensils' : 'fa-regular fa-hourglass-half',
        title: `سفارش #${toFa(1024 + i)}`,
        subtitle: `${(o as any).items?.[0]?.name || 'پیتزا مخصوص'} × ${toFa((o as any).items?.[0]?.qty || 1)}`,
        price: ((o as any).total || 320000).toLocaleString('fa-IR'),
        statusBg: o.status === 'preparing' ? 'rgba(255,141,40,0.15)' : 'rgba(92,74,189,0.15)',
        statusLabel: ORDER_STATUS_LABELS[o.status] || o.status,
      }))
    : demoOrders;

  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll" style={{ paddingTop: 'var(--eu-header-h, 0px)' }}>

      {/* ── Wallet + Promo squares ── */}
      <div className="flex gap-2 px-4 mt-2">

        {/* Wallet square (RIGHT in RTL) */}
        <div
          className="flex flex-col justify-between px-3.5 py-3 relative overflow-hidden flex-1"
          style={{ ...gcGlass, height: 118, cursor: 'pointer' }}
          onClick={() => openModal('کیف پول', <SimpleWalletContent />)}
        >
          <div className="aw-chat-pattern aw-pattern-sm" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden', opacity: 1, pointerEvents: 'none', zIndex: 0 }} />
          {/* top: wallet icon + plus */}
          <div className="flex items-center justify-between relative z-[1]">
            <div style={{ width: 34, height: 32, position: 'relative', flexShrink: 0, ['--fill-0' as string]: 'var(--aw-eu-primary, #7E5FAA)' }}>
              <Layer />
            </div>
            <button
              style={{
                width: 30, height: 30, borderRadius: 50, flexShrink: 0,
                background: 'var(--aw-eu-glass-card, rgba(255,255,255,0.2))', border: '0.25px solid var(--aw-eu-glass-bd, rgba(255,255,255,1))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
              onClick={(e) => { e.stopPropagation(); openModal('کیف پول', <SimpleWalletContent />); }}
            >
              <i className="fa-solid fa-plus" style={{ fontSize: 13, color: 'var(--aw-eu-ink-strong, #404040)' }} />
            </button>
          </div>
          {/* bottom: balance */}
          <div className="flex flex-col items-end relative z-[1]" style={{ gap: 1 }}>
            <p style={{ fontFamily: KAMAND, fontSize: 10, color: 'var(--aw-text-secondary)', fontWeight: 500, margin: 0 }}>
              موجودی کیف پول
            </p>
            <p style={{ margin: 0, color: 'var(--aw-text-primary)', lineHeight: 1.2 }}>
              <span style={{ fontFamily: KAMAND, fontSize: 17, fontWeight: 900 }}>{'۲,۴۵۰,۰۰۰ '}</span>
              <span style={{ fontFamily: KAMAND, fontSize: 10, fontWeight: 700, color: 'var(--aw-text-secondary)' }}>تومان</span>
            </p>
          </div>
        </div>

        {/* Promo / discount square (LEFT in RTL) */}
        <div
          className="flex flex-col justify-between px-3.5 py-3 relative overflow-hidden flex-1"
          style={{ ...gcGlass, height: 118, cursor: 'pointer' }}
          onClick={() => setEuScreen('euOffersScreen')}
        >
          {/* top: icon */}
          <div className="flex items-center justify-between">
            <div style={{ width: 30, height: 30, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="data:image/png;base64,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" alt="پیشنهاد ویژه" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
          {/* bottom: text */}
          <div className="flex flex-col items-end" style={{ gap: 1 }}>
            <p style={{ fontFamily: KAMAND, fontSize: 15, fontWeight: 800, color: 'var(--aw-text-primary)', margin: 0 }}>
              پیشنهادات ویژه
            </p>
          </div>
        </div>
      </div>

      {/* ── Market + Dine big squares ── */}
      <div className="flex gap-2 px-4 mt-2">

        {/* Market square (RIGHT in RTL) */}
        <div
          className="flex flex-col justify-between px-3.5 py-3 relative overflow-hidden flex-1"
          style={{ ...gcGlass, height: 118, cursor: 'pointer' }}
          onClick={() => setEuScreen('euMarketScreen')}
        >
          <div className="flex items-center justify-between">
            <div style={{ width: 32, height: 32, position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="src/icons/png/shop-bag.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            </div>
            <div style={{
              background: 'var(--aw-eu-glass-card, rgba(255,255,255,0.2))', borderRadius: 3, fontSize: 9,
              color: 'var(--aw-eu-ink-strong, #404040)', padding: '1px 7px', border: '0.25px solid var(--aw-eu-glass-bd, rgba(255,255,255,1))',
              fontFamily: KAMAND, lineHeight: '15px', display: 'inline-block',
            }}>
              فروشگاه
            </div>
          </div>
          <div className="flex flex-col items-end" style={{ gap: 1 }}>
            <p style={{ fontFamily: KAMAND, fontSize: 15, fontWeight: 800, color: 'var(--aw-text-primary)', margin: 0 }}>
              مارکت
            </p>
            <p style={{ fontFamily: KAMAND, fontSize: 10, color: 'var(--aw-text-secondary)', margin: 0 }}>
              خرید از فروشگاه
            </p>
          </div>
        </div>

        {/* Dine square (LEFT in RTL) */}
        <div
          className="flex flex-col justify-between px-3.5 py-3 relative overflow-hidden flex-1"
          style={{ ...gcGlass, height: 118, cursor: 'pointer' }}
          onClick={() => setEuScreen('euDineScreen')}
        >
          <div className="flex items-center justify-between">
            <div style={{ width: 32, height: 32, position: 'relative', flexShrink: 0, ['--fill-0' as string]: 'var(--aw-eu-primary, #7E5FAA)' }}>
              <LineMapsRestaurant />
            </div>
            <div style={{
              background: 'var(--aw-eu-glass-card, rgba(255,255,255,0.2))', borderRadius: 3, fontSize: 9,
              color: 'var(--aw-eu-ink-strong, #404040)', padding: '1px 7px', border: '0.25px solid var(--aw-eu-glass-bd, rgba(255,255,255,1))',
              fontFamily: KAMAND, lineHeight: '15px', display: 'inline-block',
            }}>
              رستوران
            </div>
          </div>
          <div className="flex flex-col items-end" style={{ gap: 1 }}>
            <p style={{ fontFamily: KAMAND, fontSize: 15, fontWeight: 800, color: 'var(--aw-text-primary)', margin: 0 }}>
              سفارش غذا
            </p>
            <p style={{ fontFamily: KAMAND, fontSize: 10, color: 'var(--aw-text-secondary)', margin: 0 }}>
              رستوران‌های نزدیک
            </p>
          </div>
        </div>
      </div>

      {/* ── دسترسی سریع ── */}
      <div className="px-4 mt-3">
        {/* justify-between distributes wide cards across the row */}
        <div className="flex gap-2">
          {quickActions.map((item) => (
            <button
              key={item.label}
              onClick={item.disabled ? undefined : item.action}
              disabled={item.disabled}
              style={{ opacity: item.disabled ? 0.55 : 1, cursor: item.disabled ? 'not-allowed' : 'pointer', flex: 1 }}
              className="flex flex-col items-center gap-[6px] bg-transparent border-none p-0 relative"
            >
              <div className="relative" style={{ width: '100%' }}>
                <div style={{ ...gcGlass, width: '100%', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{item.icon}</div>
                {item.badge ? (
                  <span className="absolute -top-[5px] -left-[5px] min-w-[16px] h-[16px] px-[4px] rounded-full flex items-center justify-center text-white text-[9px]" style={{ background: 'var(--aw-eu-primary, #7E5FAA)', fontWeight: 700, lineHeight: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }}>{toFa(item.badge)}</span>
                ) : null}
              </div>
              <span style={{ fontFamily: KAMAND, fontSize: 10, color: 'var(--aw-text-primary)' }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── فعالیت‌های اخیر ── */}
      <div className="px-4 mt-3">
        {[
          { icon: 'fa-solid fa-utensils', bg: 'rgba(255,141,40,0.16)', color: '#FF8D28', title: 'سفارش #۱۰۲۴ ثبت شد', sub: 'در حال آماده‌سازی', time: '۱۰ دقیقه پیش', action: () => setEuScreen('euOrdersScreen') },
          { icon: 'fa-solid fa-wallet', bg: 'rgba(16,185,129,0.16)', color: '#10B981', title: 'شارژ کیف پول', sub: '۵۰۰,۰۰۰ تومان', time: 'امروز ۰۹:۱۲', action: () => openModal('کیف پول', <SimpleWalletContent />) },
          { icon: 'fa-solid fa-comment-dots', bg: 'rgba(139,92,246,0.16)', color: '#8B5CF6', title: 'پیام از دستیار', sub: 'برنامه امروزت آماده‌ست', time: 'امروز ۰۸:۳۰', action: () => setEuScreen('euAssistantScreen') },
          { icon: 'fa-solid fa-bell', bg: 'rgba(59,130,246,0.16)', color: '#3B82F6', title: 'یادآوری جلسه تیم فنی', sub: 'ساعت ۱۴:۰۰', time: 'امروز', action: () => setEuScreen('euPlannerScreen') },
        ].map((a, i) => (
          <div
            key={i}
            className="flex items-center px-3 gap-3 mb-2 cursor-pointer"
            style={{ ...gcGlass, height: 62, overflow: 'hidden' }}
            onClick={a.action}
          >
            {/* icon chip RIGHT */}
            <div className="flex items-center justify-center flex-shrink-0" style={{ width: 38, height: 38, borderRadius: 10, background: a.bg }}>
              <i className={a.icon} style={{ fontSize: 15, color: a.color }} />
            </div>
            {/* text */}
            <div className="flex-1 flex flex-col items-end min-w-0" style={{ gap: 2 }}>
              <p style={{ fontFamily: KAMAND, fontSize: 13, fontWeight: 700, color: 'var(--aw-text-primary)', margin: 0 }}>{a.title}</p>
              <p className="truncate max-w-full" style={{ fontFamily: KAMAND, fontSize: 11, color: 'var(--aw-text-secondary)', margin: 0 }}>{a.sub}</p>
            </div>
            {/* time LEFT */}
            <span className="flex-shrink-0" style={{ fontFamily: KAMAND, fontSize: 9.5, color: 'var(--aw-text-muted)' }}>{a.time}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

// ── Non-glass Home Screen (preserved from before) ──────────────

function EuHomeScreenDefault() {
  const { openModal, setEuScreen, agents, orders } = useApp();
  const activeOrders = orders.filter(o => o.status === 'preparing' || o.status === 'pending');
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

  const quickActions = [
    { icon: 'fa-solid fa-utensils', label: 'سفارش غذا', action: () => setEuScreen('euDineScreen') },
    { icon: 'fa-solid fa-store', label: 'مارکت', action: () => setEuScreen('euMarketScreen') },
    { icon: 'fa-solid fa-headset', label: 'پشتیبانی', action: () => setEuScreen('euSupportScreen') },
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll">
      {/* Wallet */}
      <div className="flex items-center gap-3 mx-4 mt-4 p-5 rounded-2xl relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--aw-eu-primary-dark), var(--aw-eu-primary))' }}>
        <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center text-white"
          style={{ background: 'rgba(255,255,255,0.15)' }}>
          <i className="fa-solid fa-wallet text-[22px]" />
        </div>
        <div className="flex-1">
          <p className="text-[11px] m-0" style={{ color: 'rgba(255,255,255,0.6)' }}>موجودی کیف پول</p>
          <h3 className="text-[20px] text-white m-0 mt-0.5" style={{ fontWeight: 800 }}>
            ۲,۴۵۰,۰۰۰ <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>تومان</span>
          </h3>
        </div>
        <button className="w-9 h-9 rounded-xl border bg-transparent text-white cursor-pointer flex items-center justify-center"
          style={{ borderColor: 'var(--aw-eu-glass-card, rgba(255,255,255,0.2))', background: 'rgba(255,255,255,0.1)' }}
          onClick={() => openModal('کیف پول', <SimpleWalletContent />)}>
          <i className="fa-solid fa-plus text-[14px]" />
        </button>
      </div>

      {/* Quick actions */}
      <div className="px-4 mt-4">
        <p className="text-[12px] mb-2 px-1" style={{ color: 'var(--aw-text-muted)', fontWeight: 700 }}>دسترسی سریع</p>
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map(item => (
            <button key={item.label} onClick={item.action}
              className="flex flex-col items-center gap-2 p-3 rounded-[14px] cursor-pointer border-none"
              style={{ background: 'var(--aw-eu-card)', border: '1px solid rgba(126,95,170,0.15)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white"
                style={{ background: 'var(--aw-eu-primary)' }}>
                <i className={item.icon} style={{ fontSize: 18 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--aw-text-primary)' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders */}
      {activeOrders.length > 0 && (
        <div className="px-4 mt-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--aw-text-muted)' }}>سفارشات من</span>
            <button className="text-[11px] bg-transparent border-none cursor-pointer"
              style={{ color: 'var(--aw-eu-primary)', fontWeight: 600 }}
              onClick={() => setEuScreen('euOrdersScreen')}>
              مشاهده همه <i className="fa-solid fa-chevron-left text-[8px]" />
            </button>
          </div>
          {activeOrders.slice(0, 2).map(o => (
            <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl mb-2 border cursor-pointer"
              style={{ background: 'var(--aw-eu-card)', borderColor: 'rgba(126,95,170,0.15)' }}
              onClick={() => setEuScreen('euOrdersScreen')}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: ORDER_STATUS_COLORS[o.status]?.bg || 'var(--aw-primary-bg)' }}>
                <i className={`fa-solid fa-utensils text-[14px]`}
                  style={{ color: ORDER_STATUS_COLORS[o.status]?.text || 'var(--aw-eu-primary)' }} />
              </div>
              <div className="flex-1 text-right">
                <div style={{ fontSize: 12, fontWeight: 700 }}>سفارش</div>
                <div style={{ fontSize: 11, color: 'var(--aw-text-muted)' }}>{ORDER_STATUS_LABELS[o.status]}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        {[
          { value: toFa(orders.length), label: 'کل سفارشات' },
          { value: toFa(deliveredOrders), label: 'تحویل شده' },
          { value: toFa(3), label: 'ایجنت فعال' },
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center p-3 rounded-xl border"
            style={{ background: 'var(--aw-eu-card)', borderColor: 'rgba(126,95,170,0.15)' }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--aw-eu-primary)' }}>{s.value}</span>
            <span style={{ fontSize: 10, color: 'var(--aw-text-muted)' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────

export function EuHomeScreen() {
  const { theme } = useApp();
  return (theme === 'glass' || theme === 'dark') ? <EuHomeScreenGlass /> : <EuHomeScreenDefault />;
}
