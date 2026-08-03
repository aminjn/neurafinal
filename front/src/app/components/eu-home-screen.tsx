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

// Inlined home-card icons (base64 so they render in the offline standalone bundle too)
const IC_SHOP_BAG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOdEVYdFNvZnR3YXJlAEZpZ21hnrGWYwAAA1hJREFUeAHtV0tW2zAUVUzgMKu7AtwVNFlBnRXgAXCYFVYAWQHpCigrSJjxGWBWULKChhXgrKAecvgkvde8lwpZCjTtOXTQd45iR9K7upLez8a8sTRCA1mWxc1ms9VoNBKzoEwmkxL65cPDwyjP89K8hsD29nby+PjYh2Jq/qJMp9PB/f39FxApggS4OFh/x2uMRsZjtJEFsibECDJ01linHuZcctcVeKPB/8T6JHOKu7u7jk2iaSPIzqlwjIn77rFtbW1leKQkdnZ2tmOPbW5ufhNyOcYGno1d4LW1vLzcx7OjY5E9iQBgXGLxnu/O1B4w58YzNpax2B07OTmpdi7zUtpXjQAYtuR16N6TioLrYs5YRTiKotinyw1hzhXfV1ZW0hoBSEvARyYsiZCtnQ4WLoTI2hz9a9FPfAQSAShC2gqui9mihgd5H9JXPdu1Ixd8aWmpCAGIgRKodgLw9ULmfJyjr3rvagQUHJ5QmrAk/Lm9vS3cAQStqs9nhB6SH3wEqqNDsJhHoAL3GSlIzXw/pKwkIWs1AtakxKcMP1cvMbYbqdhui/HEh4ET0P5xjQAsM+cTO/jsU0b/gb4jmGQegjv6Djfb82HAdqo5uKaZp81CsUSrG5kwwOPo/Px8xJ3L4lyUu4zF57u4roo0Tm0P4PtGrkgxNPbbGNRFf1uv8VkuQKidmrAwkHQARCIHgTnHaCTVt8m4glA9WzeaA6RGNcbCRwilbZ4IlHv4v2ueJ6Mh+5gf0HKcRtuHYV4SnsALp/BH4sOPzBvLfwJNs6Aw2CBvVMGJSYYGahYQl0Dl54x0oSIyVDPCuHJ4SjdUS0icmdUNKu4VVMqIdIkJCEAOZXFWvKz/LkUvk3LLKxqGMb+YR6AqGMAy9YFIPmAgYonVPj09zdhwBR0hlIbygF6XHYZ9BDQfrPtArJrw2j5q1nzoqwIT8kDLp4txzQ/DIAHs6oq74042NjZq4daq9354yJWyUC0EC1ZCbBjrIEiAhoc73pXFejjyvp2Gf1ewcArjvCAW/8N4u+4c76cZUyt2dGh+JZRS7i5GPwkVWuHOgJ4MM0EbYUyvy9bvursPEqCI2/TM01dNYhYTXgsT2ddXfxv6hHFhdXW1BUJxqO53pGCjcZp/XX4Cri/auhTuYxkAAAAASUVORK5CYII=';
const IC_DINE = 'data:image/png;base64,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';

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
function __grpFa(v: any): string {
  const n = String(v == null ? '' : v).replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '');
  return n ? Number(n).toLocaleString('en-US').replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]) : '';
}

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
          <input className={inputCls} value={amount} onChange={e => setAmount(__grpFa(e.target.value))} placeholder="مبلغ (تومان)" inputMode="numeric" dir="ltr" style={{ textAlign: 'right' }} />
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
  const { openModal, setEuScreen, orders, cartCount, walletBalance } = useApp();

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
          <img src={IC_SHOP_BAG} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
        </div>
      ),
      action: () => setEuScreen('euCartScreen'),
    },
    {
      label: 'ایجنت‌ها',
      icon: (
        <div style={{ width: 32, height: 32, position: 'relative', ['--fill-0' as string]: 'var(--aw-text-secondary, #9aa0b4)' }}>
          <Element />
        </div>
      ),
      action: () => setEuScreen('euAgentDiscovery'),
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

  // فقط سفارش‌های واقعی — بدونِ دموِ فیک؛ خالی وقتی سفارشی نیست.
  const displayOrders = activeOrders.slice(0, 2).map((o, i) => ({
        key: o.id,
        icon: i === 0 ? 'fa-solid fa-utensils' : 'fa-regular fa-hourglass-half',
        title: 'سفارش' + ((o as any).id ? ' #' + (o as any).id : ''),
        subtitle: ((o as any).items?.[0]?.name || 'سفارش') + ' × ' + toFa((o as any).items?.[0]?.qty || 1),
        price: (Number((o as any).total) || 0).toLocaleString('fa-IR'),
        statusBg: o.status === 'preparing' ? 'rgba(255,141,40,0.15)' : 'rgba(92,74,189,0.15)',
        statusLabel: ORDER_STATUS_LABELS[o.status] || o.status,
      }));

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
              <span style={{ fontFamily: KAMAND, fontSize: 17, fontWeight: 900 }}>{fmtToman(walletBalance) + ' '}</span>
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
              <img src={IC_SHOP_BAG} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
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
            <div style={{ width: 32, height: 32, position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={IC_DINE} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
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
        {orders.slice(0, 4).map((o: any) => ({ icon: 'fa-solid fa-utensils', bg: 'rgba(255,141,40,0.16)', color: '#FF8D28', title: 'سفارش' + (o.num ? (' #' + o.num) : ''), sub: (ORDER_STATUS_LABELS as any)[o.status] || 'ثبت شد', time: o.date || '', action: () => setEuScreen('euOrdersScreen') })).map((a, i) => (
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
  const { openModal, setEuScreen, agents, orders, walletBalance, ownedAgents } = useApp();
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
            {fmtToman(walletBalance)} <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>تومان</span>
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
          { value: toFa((ownedAgents || []).length), label: 'ایجنت فعال' },
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
