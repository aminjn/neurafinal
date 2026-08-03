import { api, getToken } from '../services/api';
// ── فروشگاهِ واقعی: کاتالوگ از /api/shop ──
const __MARKET: any = { shops: [], products: [], offers: [] };
let __marketLoaded = false;
function useMarketData() {
  const [, __f] = useState(0);
  React.useEffect(() => {
    const h = () => __f((x: number) => x + 1);
    window.addEventListener('market-loaded', h);
    if (!__marketLoaded) {
      __marketLoaded = true;
      (async () => {
        try { const sh: any = await (api as any).shopCatalog('shops'); if (Array.isArray(sh)) __MARKET.shops = sh; } catch (_) {}
        try { const pr: any = await (api as any).shopCatalog('products'); if (Array.isArray(pr)) __MARKET.products = pr; } catch (_) {}
        try { const of: any = await (api as any).shopCatalog('offers'); if (Array.isArray(of)) __MARKET.offers = of.filter((o: any) => o.shop); } catch (_) {}
        window.dispatchEvent(new Event('market-loaded'));
      })();
    }
    return () => window.removeEventListener('market-loaded', h);
  }, []);
  return __MARKET;
}
 // marketshops
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './app-context';
import { OrderDetail } from './end-user-panel';
import { toFa } from './data';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { euCardStyle, AgentTabBar, StatusPill, SectionTitle, EmptyState, AgentChatTabUI } from './eu-agent-shared';
import type { ChatListItem, AgentCardItem, AgentTopicItem } from './eu-agent-shared';

function MarketChatTab() {
  const CHAT_LIST: ChatListItem[] = [
    { id: 'digitec', name: 'دیجی‌تک', icon: 'fa-solid fa-microchip', color: '#3B82F6', lastMsg: 'سفارش هدفون شما ارسال شد.', time: '۲۰ دقیقه پیش', unread: 1, online: true },
    { id: 'sabz', name: 'سبز مارکت', icon: 'fa-solid fa-seedling', color: '#10B981', lastMsg: 'تخفیف ویژه میوه‌های تازه فعال شد.', time: '۲ ساعت پیش', unread: 2, online: true },
    { id: 'mod', name: 'مد اسپورت', icon: 'fa-solid fa-shirt', color: '#8B5CF6', lastMsg: 'سایز موجود است، می‌توانید سفارش دهید.', time: 'دیروز', unread: 0, online: true },
    { id: 'support', name: 'پشتیبانی مارکت', icon: 'fa-solid fa-headset', color: '#F59E0B', lastMsg: 'پیگیری سفارش ۸۸۷۷ انجام شد.', time: '۱ روز پیش', unread: 0, online: true },
  ];
  const INTERACTION_MESSAGES: Record<string, { from: 'user' | 'agent'; text: string }[]> = {
    digitec: [
      { from: 'agent', text: 'سلام! سفارش هدفون پرو شما تایید شد.' },
      { from: 'user', text: 'کی به دستم می‌رسه؟' },
      { from: 'agent', text: 'سفارش شما ارسال شد و ۱ تا ۲ روز کاری زمان می‌برد.' },
    ],
    sabz: [
      { from: 'agent', text: 'محصولات تازه روزانه به فروشگاه اضافه شد.' },
      { from: 'user', text: 'تخفیف خاصی دارین؟' },
      { from: 'agent', text: 'بله — ۲۰٪ تخفیف روی میوه‌های تازه با کد FRESH20' },
    ],
    mod: [
      { from: 'user', text: 'پیراهن مدل آلفا سایز L موجوده؟' },
      { from: 'agent', text: 'بله موجود است، می‌توانید سفارش دهید. ارسال ۱ تا ۳ روز کاری.' },
    ],
    support: [
      { from: 'agent', text: 'سلام! پشتیبانی مارکت در خدمت شماست.' },
      { from: 'user', text: 'پیگیری سفارش ۸۸۷۷' },
      { from: 'agent', text: 'سفارش ۸۸۷۷ در حال بسته‌بندی است و فردا ارسال می‌شود.' },
    ],
  };
  const AGENT_CARDS: AgentCardItem[] = [
    { id: 'shop-ai', name: 'دستیار خرید', desc: 'پیشنهاد محصول هوشمند', icon: 'fa-solid fa-wand-magic-sparkles', color: '#EC4899', gradient: 'linear-gradient(135deg, #EC4899, #F472B6)' },
    { id: 'price-ai', name: 'مقایسه قیمت', desc: 'بهترین قیمت بین فروشگاه‌ها', icon: 'fa-solid fa-scale-balanced', color: '#10B981', gradient: 'linear-gradient(135deg, #10B981, #34D399)' },
    { id: 'deal-ai', name: 'ردیاب تخفیف', desc: 'پیشنهادهای ویژه و کدها', icon: 'fa-solid fa-tag', color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)' },
    { id: 'review-ai', name: 'تحلیل نظرات', desc: 'خلاصه نظرات کاربران', icon: 'fa-solid fa-comments', color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)' },
  ];
  const AGENT_TOPICS: Record<string, AgentTopicItem[]> = {
    'shop-ai': [],
    'price-ai': [],
    'deal-ai': [],
    'review-ai': [],
  };
  const TOPIC_MESSAGES: Record<string, { from: 'user' | 'agent'; text: string }[]> = {
    'shop-t1': [
      { from: 'user', text: 'هدفون گیمینگ خوب پیشنهاد بده.' },
      { from: 'agent', text: '🥇 هدفون پرو دیجی‌تک — ۲,۴۵۰,۰۰۰ (۱۰٪ تخفیف)\n🥈 هدفون گیمر X — ۱,۸۵۰,۰۰۰\n🥉 هدفون استودیو Y — ۲,۱۰۰,۰۰۰' },
    ],
    'shop-t2': [
      { from: 'user', text: 'لپ‌تاپ زیر ۴۰ میلیون پیشنهاد بده.' },
      { from: 'agent', text: 'لپ‌تاپ ایسوس مدل K17 — ۳۸,۵۰۰,۰۰۰\nگارانتی ۱۸ ماهه از دیجی‌تک.' },
    ],
    'price-t1': [
      { from: 'user', text: 'هدفون پرو در فروشگاه‌های دیگه چقدره؟' },
      { from: 'agent', text: 'دیجی‌تک: ۲,۴۵۰,۰۰۰ ✅ بهترین قیمت\nمد اسپورت: ۲,۶۸۰,۰۰۰\nسایر: ۲,۵۵۰,۰۰۰' },
    ],
    'price-t2': [
      { from: 'user', text: 'سبزیجات تازه از کجا بخرم؟' },
      { from: 'agent', text: 'سبز مارکت ۱۸٪ ارزان‌تر از میانگین بازار است.' },
    ],
    'deal-t1': [
      { from: 'agent', text: '🔥 تخفیف‌های ویژه امروز:\n• دیجی‌تک ۱۰٪ روی صوتی\n• سبز مارکت ۲۰٪ میوه\n• مد اسپورت ۱۵٪ پوشاک' },
    ],
    'deal-t2': [
      { from: 'agent', text: 'جشنواره دیجی‌تک تا پایان هفته فعال است.' },
    ],
    'rev-t1': [
      { from: 'user', text: 'نظرات کاربران درباره هدفون پرو چیه؟' },
      { from: 'agent', text: '⭐ ۴.۷ از ۵ — ۲۳۸ نظر\n✅ کیفیت صدا عالی\n✅ باتری طولانی\n⚠️ کمی سنگین' },
    ],
  };
  const SUGGESTIONS = {
    'shop-ai': ['چی پیشنهاد میدی؟', 'پرفروش‌ترین‌ها', 'محصولات جدید'],
    'price-ai': ['ارزان‌ترین قیمت', 'مقایسه فروشگاه', 'تخفیف فعلی'],
    'deal-ai': ['تخفیف‌های امروز', 'کد فعال دارین؟', 'جشنواره‌ها'],
    'review-ai': ['نظرات محصول', 'بهترین برند', 'تحلیل کیفیت'],
  };
  return <AgentChatTabUI chatList={CHAT_LIST} interactionMessages={INTERACTION_MESSAGES} agentCards={AGENT_CARDS} agentTopics={AGENT_TOPICS} topicMessages={TOPIC_MESSAGES} suggestionsByAgent={SUGGESTIONS} uniqueKey="market" />;
}

export function AddressFormModal({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState('خانه');
  const [q, setQ] = useState('');
  const [preds, setPreds] = useState<any[]>([]);
  const [picked, setPicked] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [mapOn, setMapOn] = useState(false);
  React.useEffect(() => { (api as any).mapStatus().then((r: any) => setMapOn(!!(r && r.configured))).catch(() => {}); }, []);
  React.useEffect(() => {
    if (!mapOn || q.trim().length < 2) { setPreds([]); return; }
    let alive = true;
    const h = setTimeout(() => {
      (api as any).mapAutocomplete(q.trim()).then((r: any) => { if (alive) setPreds(Array.isArray(r && r.predictions) ? r.predictions : []); }).catch(() => {});
    }, 350);
    return () => { alive = false; clearTimeout(h); };
  }, [q, mapOn]);
  const pick = (p: any) => {
    setPicked(p); setPreds([]);
    setQ(p.main_text ? (p.main_text + (p.secondary_text ? '، ' + p.secondary_text : '')) : (p.formatted_address || q));
  };
  const save = async () => {
    const addressText = (picked && (picked.formatted_address || (picked.main_text ? picked.main_text + (picked.secondary_text ? '، ' + picked.secondary_text : '') : ''))) || q.trim();
    if (!addressText) return;
    setBusy(true);
    const loc = picked && picked.location ? picked.location : null;
    const rec: any = { id: 'addr_' + Date.now(), title: title.trim() || 'آدرس', address: addressText, icon: 'fa-solid fa-location-dot' };
    if (loc && loc.lat != null && loc.lng != null) { rec.lat = loc.lat; rec.lng = loc.lng; }
    if (picked && picked.place_id) rec.placeId = picked.place_id;
    try { await (api as any).myCreate('addresses', rec); } catch (_e) {}
    setBusy(false); onDone();
  };
  const IN: React.CSSProperties = { width: '100%', padding: '11px 13px', borderRadius: 12, border: '1px solid var(--aw-border)', background: 'var(--aw-bg-input)', color: 'var(--aw-text-primary)', fontSize: 13, outline: 'none' };
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] text-[var(--aw-text-secondary)]" style={{ fontWeight: 600 }}>عنوان</span>
        <input style={IN} value={title} onChange={e => setTitle(e.target.value)} placeholder="خانه / محل کار / انبار" />
      </div>
      <div className="flex flex-col gap-1 relative">
        <span className="text-[11px] text-[var(--aw-text-secondary)]" style={{ fontWeight: 600 }}>آدرس {mapOn ? '(جستجو روی نقشه)' : ''}</span>
        <textarea style={{ ...IN, minHeight: 64, resize: 'vertical' }} value={q} onChange={e => { setQ(e.target.value); setPicked(null); }} placeholder={mapOn ? 'شروع به تایپِ آدرس کن…' : 'آدرسِ کامل را وارد کن'} />
        {preds.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--aw-border)', background: 'var(--aw-bg-card)' }}>
            {preds.slice(0, 6).map((p: any, i: number) => (
              <button key={p.place_id || i} type="button" onClick={() => pick(p)}
                className="w-full text-right px-3 py-2 cursor-pointer bg-transparent border-none" style={{ borderTop: i ? '1px solid var(--aw-border)' : 'none' }}>
                <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{p.main_text || p.formatted_address || '—'}</div>
                {p.secondary_text ? <div className="text-[10px] text-[var(--aw-text-muted)]">{p.secondary_text}</div> : null}
              </button>
            ))}
          </div>
        )}
      </div>
      {picked && picked.location && (
        <div className="text-[10px] text-[#10B981]"><i className="fa-solid fa-location-crosshairs ml-1" />موقعیت روی نقشه ثبت شد</div>
      )}
      <button type="button" onClick={save} disabled={busy}
        className="mt-1 py-2.5 rounded-xl border-none text-white text-[13px] cursor-pointer"
        style={{ background: 'var(--aw-eu-primary, #7B62FC)', fontWeight: 700, opacity: busy ? 0.6 : 1 }}>
        {busy ? 'در حال ذخیره…' : 'ذخیره آدرس'}
      </button>
    </div>
  );
}

function MarketAccountTab() {
  const { showToast, euProfile, walletBalance, euPlacedOrders, walletTx, openModal, closeModal, setEuScreen } = useApp();
  const [__addrList, __setAddrList] = useState<any[]>([]);
  const __loadAddresses = () => { (api as any).myList('addresses').then((r: any) => __setAddrList(Array.isArray(r) ? r : [])).catch(() => {}); };
  React.useEffect(() => { __loadAddresses(); }, []);
  const openAddressForm = () => openModal('افزودن آدرس', <AddressFormModal onDone={() => { closeModal(); __loadAddresses(); showToast('آدرس ذخیره شد ✅', 'success'); }} />);
  const [__payM, setPayM] = useState<any[]>([]);
  useEffect(() => { if (!getToken()) return; (async () => { try { const p: any = await (api as any).myList('payment_methods'); if (Array.isArray(p)) setPayM(p); } catch (_) {} })(); }, []);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const toggle = (id: string) => setExpandedSection(prev => prev === id ? null : id);
  const [__nprefs, setNprefs] = useState<Record<string, boolean>>({});
  useEffect(() => { if (!getToken()) return; (async () => { try { const v: any = await (api as any).myList('notif_prefs'); if (Array.isArray(v) && v[0] && v[0].map) setNprefs(v[0].map); } catch (_) {} })(); }, []);
  const __toggleNotif = (k: string, d: boolean) => setNprefs(prev => { const next = { ...prev, [k]: !(prev[k] ?? d) }; (api as any).myCreate('notif_prefs', { id: 'prefs', map: next }).catch(() => {}); return next; });


  const ADDRESSES: any[] = [];
  const [__wishItems, setWishItems] = useState<any[]>([]);
  useEffect(() => { if (!getToken()) return; (async () => { try { const w: any = await (api as any).myList('wishlist'); if (Array.isArray(w)) setWishItems(w.map((x: any) => ({ t: x.t || x.name || '', s: x.s || x.shop || '', p: x.p || '', icon: x.icon || 'fa-solid fa-box' }))); } catch (_) {} })(); }, []);
  const __cashbackItems = (walletTx || []).filter((t: any) => t.type === 'cashback').map((t: any) => ({ t: t.title || 'کش‌بک', s: t.date || 'اخیر', p: (t.amount || 0).toLocaleString('fa-IR'), icon: 'fa-solid fa-coins' }));
  const PAYMENTS = [
    { id: 1, title: 'کیف پول Neura', balance: (walletBalance || 0).toLocaleString('fa-IR') + ' تومان', icon: 'fa-solid fa-wallet', color: '#8B5CF6', isDefault: true },
    ...__payM.map((m: any, i: number) => ({ id: 'pm_' + (m.id || i), title: m.title || m.bank || 'کارت بانکی', last4: m.last4 || (m.number ? '****' + String(m.number).replace(/\D/g, '').slice(-4) : ''), icon: 'fa-solid fa-credit-card', color: '#3B82F6', isDefault: !!m.isDefault })),
  ];
  const HISTORY: any[] = [];

  const SECTIONS = [
    { id: 'addresses', icon: 'fa-solid fa-map-marker-alt', label: 'آدرس‌های ارسال', color: '#3B82F6', count: __addrList.length },
    { id: 'payments', icon: 'fa-solid fa-credit-card', label: 'روش‌های پرداخت', color: '#10B981', count: PAYMENTS.length },
    { id: 'history', icon: 'fa-solid fa-clock-rotate-left', label: 'تاریخچه خرید', color: '#F59E0B', count: HISTORY.length },
  ];

  const statusLabel = (s: string) => s === 'delivered' ? 'تحویل شده' : s === 'shipping' ? 'در حال ارسال' : 'لغو شده';
  const statusColor = (s: string) => s === 'delivered' ? '#10B981' : s === 'shipping' ? '#F59E0B' : '#EF4444';

  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll px-4 pt-3">
      {/* Profile card — glass + wallet pattern */}
      <div className="p-4 mb-3 relative overflow-hidden" style={{ ...euCardStyle, borderRadius: 16 }}>
        <div className="aw-chat-pattern aw-pattern-sm" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden', opacity: 1, pointerEvents: 'none', zIndex: 0 }} />
        <div className="flex items-center gap-3 relative z-[1]">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-[20px]"
            style={{ background: 'color-mix(in srgb, var(--aw-eu-primary) 15%, transparent)', border: '2px solid color-mix(in srgb, var(--aw-eu-primary) 30%, transparent)', color: 'var(--aw-eu-primary)', fontWeight: 800 }}>
            {euProfile.avatar || 'P'}
          </div>
          <div className="flex-1">
            <div className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{euProfile.name}</div>
            <div className="text-[11px] text-[var(--aw-text-muted)]">{euProfile.phone || '۰۹۱۲۳۴۵۶۷۸۹'}</div>
          </div>
          <button className="w-9 h-9 rounded-xl cursor-pointer flex items-center justify-center"
            style={{ background: 'color-mix(in srgb, var(--aw-eu-primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--aw-eu-primary) 22%, transparent)', color: 'var(--aw-eu-primary)' }}
            onClick={() => showToast('ویرایش پروفایل')}>
            <i className="fa-solid fa-pen text-[12px]" />
          </button>
        </div>
        <div className="flex items-center gap-3 mt-3 pt-3 relative z-[1]" style={{ borderTop: '1px solid var(--aw-border)' }}>
          <div className="flex-1 text-center">
            <div className="text-[16px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{(euPlacedOrders || []).filter((o: any) => o.source === 'market').length.toLocaleString('fa-IR')}</div>
            <div className="text-[9px] text-[var(--aw-text-muted)]">خرید</div>
          </div>
          <div className="w-px h-8" style={{ background: 'var(--aw-border)' }} />
          <div className="flex-1 text-center">
            <div className="text-[16px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>—</div>
            <div className="text-[9px] text-[var(--aw-text-muted)]">امتیاز</div>
          </div>
          <div className="w-px h-8" style={{ background: 'var(--aw-border)' }} />
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-0.5">
              <StatusPill label="—" color="#8B5CF6" />
            </div>
            <div className="text-[9px] mt-0.5 text-[var(--aw-text-muted)]">سطح</div>
          </div>
        </div>
      </div>

      {SECTIONS.map((section, si) => (
        <div key={section.id} className="mb-2">
          <motion.div className="p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform" style={euCardStyle}
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: si * 0.06 }}
            onClick={() => toggle(section.id)}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: section.color + '18' }}>
              <i className={`${section.icon} text-[14px]`} style={{ color: section.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{section.label}</div>
              <div className="text-[10px] text-[var(--aw-text-muted)]">{toFa(section.count)} مورد</div>
            </div>
            <i className={`fa-solid fa-chevron-${expandedSection === section.id ? 'up' : 'down'} text-[10px] text-[var(--aw-text-muted)]`} />
          </motion.div>

          <AnimatePresence>
            {expandedSection === section.id && (
              <motion.div className="mt-1 space-y-1"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                {section.id === 'addresses' && __addrList.map((addr: any) => (
                  <div key={addr.id} className="p-3 mr-3 rounded-xl flex items-start gap-2.5" style={euCardStyle}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#3B82F618' }}>
                      <i className={`${addr.icon} text-[12px] text-[#3B82F6]`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{addr.title}</span>
                        {addr.isDefault && <StatusPill label="پیش‌فرض" color="#10B981" />}
                      </div>
                      <div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5" style={{ lineHeight: '1.7' }}>{addr.address}</div>
                    </div>
                  </div>
                ))}
                {section.id === 'payments' && PAYMENTS.map(pay => (
                  <div key={pay.id} className="p-3 mr-3 rounded-xl flex items-center gap-2.5" style={euCardStyle}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: pay.color + '18' }}>
                      <i className={`${pay.icon} text-[12px]`} style={{ color: pay.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{pay.title}</span>
                        {pay.isDefault && <StatusPill label="پیش‌فرض" color="#10B981" />}
                      </div>
                      <div className="text-[10px] text-[var(--aw-text-muted)]">{pay.balance || pay.last4}</div>
                    </div>
                  </div>
                ))}
                {section.id === 'history' && HISTORY.map(h => (
                  <div key={h.id} className="p-3 mr-3 rounded-xl" style={euCardStyle}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{h.items}</span>
                      <StatusPill label={statusLabel(h.status)} color={statusColor(h.status)} />
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[var(--aw-text-muted)]">
                      <span><i className="fa-solid fa-store text-[8px] ml-1" />{h.shop}</span>
                      <span><i className="fa-regular fa-clock text-[8px] ml-1" />{h.date}</span>
                      <span className="text-[#F59E0B] mr-auto" style={{ fontWeight: 700 }}>{h.total} ت</span>
                    </div>
                  </div>
                ))}
                <button className="w-full p-2.5 mr-3 rounded-xl border border-dashed border-[var(--aw-border)] bg-transparent text-[11px] text-[var(--aw-text-muted)] cursor-pointer flex items-center justify-center gap-1.5 hover:border-[#F59E0B] hover:text-[#F59E0B] transition-all"
                  onClick={() => { if (section.id === 'addresses') openAddressForm(); else setEuScreen('euProfileScreen'); }}>
                  <i className="fa-solid fa-plus text-[9px]" />
                  {section.id === 'addresses' ? 'افزودن آدرس جدید' : section.id === 'payments' ? 'افزودن روش پرداخت' : 'مشاهده بیشتر'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      <div className="mt-2 space-y-1.5">
        {[
          {
            id: 'wishlist', icon: 'fa-solid fa-heart', label: 'علاقه‌مندی‌ها', color: '#EF4444', desc: '',
            items: __wishItems,
          },
          {
            id: 'cashback', icon: 'fa-solid fa-gift', label: 'کش‌بک و امتیازها', color: '#8B5CF6', desc: '',
            items: __cashbackItems,
          },
          {
            id: 'notifications', icon: 'fa-solid fa-bell', label: 'تنظیمات اعلان', color: '#F59E0B', desc: 'فعال',
            toggles: [
              { t: 'وضعیت سفارش', s: 'بسته‌بندی، ارسال و تحویل', on: true },
              { t: 'تخفیف‌ها و جشنواره‌ها', s: 'پیشنهادهای ویژه', on: true },
              { t: 'موجود شدن محصول', s: 'علاقه‌مندی‌های ناموجود', on: true },
              { t: 'کاهش قیمت', s: 'محصولات تحت نظر', on: false },
              { t: 'پیشنهاد دستیار خرید', s: 'محصولات مرتبط AI', on: true },
            ],
          },
          {
            id: 'support', icon: 'fa-solid fa-circle-question', label: 'پشتیبانی و راهنما', color: '#6B7280', desc: '',
            links: [
              { t: 'سوالات متداول', s: '۱۸ مقاله', icon: 'fa-solid fa-list' },
              { t: 'تماس با پشتیبانی', s: '۲۴ ساعته', icon: 'fa-solid fa-headset' },
              { t: 'گزارش مشکل سفارش', s: 'برای سفارش‌های اخیر', icon: 'fa-solid fa-triangle-exclamation' },
              { t: 'درخواست مرجوعی', s: 'پیگیری کالای برگشتی', icon: 'fa-solid fa-rotate-left' },
              { t: 'راهنمای ضمانت', s: 'شرایط بازگشت کالا', icon: 'fa-solid fa-shield-halved' },
            ],
          },
        ].map(item => (
          <div key={item.id}>
            <div className="p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform" style={euCardStyle}
              onClick={() => toggle(item.id)}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.color + '18' }}>
                <i className={`${item.icon} text-[13px]`} style={{ color: item.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{item.label}</div>
                {item.desc && <div className="text-[10px] text-[var(--aw-text-muted)]">{item.desc}</div>}
              </div>
              <i className={`fa-solid fa-chevron-${expandedSection === item.id ? 'up' : 'down'} text-[10px] text-[var(--aw-text-muted)]`} />
            </div>
            <AnimatePresence>
              {expandedSection === item.id && (
                <motion.div className="mt-1 space-y-1"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                  {item.items && item.items.map((f, i) => (
                    <div key={i} className="p-3 mr-3 rounded-xl flex items-center gap-2.5" style={euCardStyle}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.color + '18' }}>
                        <i className={`${f.icon} text-[12px]`} style={{ color: item.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{f.t}</div>
                        <div className="text-[10px] text-[var(--aw-text-muted)]">{f.s}</div>
                      </div>
                      <span className="text-[11px]" style={{ color: item.color, fontWeight: 700 }}>{f.p} ت</span>
                    </div>
                  ))}
                  {item.toggles && item.toggles.map((tg, i) => (
                    <div key={i} className="p-3 mr-3 rounded-xl flex items-center gap-2.5" style={euCardStyle}>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{tg.t}</div>
                        <div className="text-[10px] text-[var(--aw-text-muted)]">{tg.s}</div>
                      </div>
                      <div onClick={() => __toggleNotif(tg.t, tg.on)} className="w-9 h-5 rounded-full relative transition-colors cursor-pointer active:scale-95" style={{ background: (__nprefs[tg.t] ?? tg.on) ? '#F59E0B' : 'var(--aw-border)' }}>
                        <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ [(__nprefs[tg.t] ?? tg.on) ? 'left' : 'right']: '2px' } as any} />
                      </div>
                    </div>
                  ))}
                  {item.links && item.links.map((lk, i) => (
                    <div key={i} className="p-3 mr-3 rounded-xl flex items-center gap-2.5 cursor-pointer active:scale-[0.98] transition-transform" style={euCardStyle}
                      onClick={() => setEuScreen('euSupportScreen')}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.color + '18' }}>
                        <i className={`${lk.icon} text-[12px]`} style={{ color: item.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{lk.t}</div>
                        <div className="text-[10px] text-[var(--aw-text-muted)]">{lk.s}</div>
                      </div>
                      <i className="fa-solid fa-chevron-left text-[10px] text-[var(--aw-text-muted)]" />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================================
//  4.  MARKET SCREEN (مارکت — خرید از فروشگاه‌ها)
// =====================================================================
const MARKET_TABS = [
  { id: 'shops', icon: 'fa-solid fa-store', label: 'فروشگاه‌ها' },
  { id: 'catalog', icon: 'fa-solid fa-th-large', label: 'محصول' },
  { id: 'orders', icon: 'fa-solid fa-shopping-cart', label: 'سفارشات' },
  { id: 'deals', icon: 'fa-solid fa-star', label: 'پیشنهادها' },
  { id: 'account', icon: 'fa-solid fa-user', label: 'حساب من' },
];

interface Shop {
  id: number; name: string; type: string; cat?: string; rating: number; distance: string;
  deliveryTime: string; isOpen: boolean; icon: string; color: string; products: number;
}

const MARKET_SHOPS: Shop[] = [
  { id: 1, name: 'دیجی‌تک', type: 'لوازم دیجیتال', cat: 'electronics', rating: 4.8, distance: '۲.۵ km', deliveryTime: '۱-۲ روز', isOpen: true, icon: 'fa-solid fa-microchip', color: '#3B82F6', products: 245 },
  { id: 2, name: 'سبز مارکت', type: 'سوپرمارکت آنلاین', cat: 'grocery', rating: 4.6, distance: '۰.۸ km', deliveryTime: '۴۵ دقیقه', isOpen: true, icon: 'fa-solid fa-seedling', color: '#10B981', products: 580 },
  { id: 3, name: 'مد اسپورت', type: 'پوشاک و ورزشی', cat: 'fashion', rating: 4.5, distance: '۳.۲ km', deliveryTime: '۱-۳ روز', isOpen: true, icon: 'fa-solid fa-shirt', color: '#8B5CF6', products: 320 },
  { id: 4, name: 'بیوتی‌شاپ رز', type: 'لوازم آرایشی بهداشتی', cat: 'beauty', rating: 4.7, distance: '۱.۵ km', deliveryTime: '۱ روز', isOpen: true, icon: 'fa-solid fa-spa', color: '#EC4899', products: 190 },
  { id: 5, name: 'کتاب‌سرا', type: 'کتاب و لوازم‌التحریر', cat: 'books', rating: 4.9, distance: '۴.۰ km', deliveryTime: '۲-۳ روز', isOpen: false, icon: 'fa-solid fa-book', color: '#F59E0B', products: 410 },
];

const SHOP_CATEGORIES = [
  { id: 'all', label: 'همه', icon: 'fa-solid fa-border-all' },
  { id: 'electronics', label: 'دیجیتال', icon: 'fa-solid fa-laptop' },
  { id: 'grocery', label: 'سوپرمارکت', icon: 'fa-solid fa-basket-shopping' },
  { id: 'fashion', label: 'پوشاک', icon: 'fa-solid fa-shirt' },
  { id: 'beauty', label: 'آرایشی', icon: 'fa-solid fa-spa' },
  { id: 'books', label: 'کتاب', icon: 'fa-solid fa-book' },
];

interface MarketProduct {
  id: number; name: string; desc: string; price: string; priceNum: number;
  category: string; shop: string; shopId?: string; image: string; rating: number; inStock: boolean; discount?: number; // orderwire
}

const MKT_CATEGORIES = [
  { id: 'all', label: 'همه', icon: 'fa-solid fa-border-all' },
  { id: 'electronics', label: 'دیجیتال', icon: 'fa-solid fa-laptop' },
  { id: 'fashion', label: 'پوشاک', icon: 'fa-solid fa-shirt' },
  { id: 'grocery', label: 'سوپرمارکت', icon: 'fa-solid fa-basket-shopping' },
  { id: 'beauty', label: 'آرایشی', icon: 'fa-solid fa-spa' },
];

const MARKET_PRODUCTS: MarketProduct[] = [
  { id: 101, name: 'هدفون بی‌سیم پرو', desc: 'نویزکنسلینگ، باتری ۳۰ ساعت', price: '۲,۴۵۰,۰۰۰', priceNum: 2450000, category: 'electronics', shop: 'دیجی‌تک', image: 'https://images.unsplash.com/photo-1755182529034-189a6051faae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aXJlbGVzcyUyMGVhcmJ1ZHMlMjBoZWFkcGhvbmVzJTIwcHJvZHVjdHxlbnwxfHx8fDE3NzE4MzUxODd8MA&ixlib=rb-4.1.0&q=80&w=400', rating: 4.7, inStock: true, discount: 10 },
  { id: 102, name: 'کتانی ورزشی نایک', desc: 'مناسب دویدن، سبک و راحت', price: '۳,۸۰۰,۰۰۰', priceNum: 3800000, category: 'fashion', shop: 'مد اسپورت', image: 'https://images.unsplash.com/photo-1656950246075-68a65e9c3ea6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbmVha2VycyUyMHNob2VzJTIwc3BvcnRzd2VhcnxlbnwxfHx8fDE3NzE4NjEzNDB8MA&ixlib=rb-4.1.0&q=80&w=400', rating: 4.5, inStock: true },
  { id: 103, name: 'ساعت هوشمند', desc: 'ضدآب، سنسور سلامت', price: '۵,۲۰۰,۰۰۰', priceNum: 5200000, category: 'electronics', shop: 'دیجی‌تک', image: 'https://images.unsplash.com/photo-1749831754129-3a84b9fdeb87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRjaCUyMGx1eHVyeSUyMHdyaXN0d2F0Y2glMjBwcm9kdWN0fGVufDF8fHx8MTc3MTg2MTM0MXww&ixlib=rb-4.1.0&q=80&w=400', rating: 4.8, inStock: true, discount: 15 },
  { id: 104, name: 'لپ‌تاپ ۱۵ اینچ', desc: 'پردازنده i7، رم ۱۶GB', price: '۴۵,۰۰۰,۰۰۰', priceNum: 45000000, category: 'electronics', shop: 'دیجی‌تک', image: 'https://images.unsplash.com/photo-1750056393300-102f7c4b8bc2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjBjb21wdXRlciUyMHdvcmtzcGFjZSUyMHByb2R1Y3R8ZW58MXx8fHwxNzcxODYxMzQxfDA&ixlib=rb-4.1.0&q=80&w=400', rating: 4.9, inStock: true },
  { id: 105, name: 'کوله‌پشتی مسافرتی', desc: 'ضدآب، ۴۰ لیتری', price: '۱,۲۰۰,۰۰۰', priceNum: 1200000, category: 'fashion', shop: 'مد اسپورت', image: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWNrcGFjayUyMHRyYXZlbCUyMGJhZyUyMHByb2R1Y3R8ZW58MXx8fHwxNzcxODYwNzg3fDA&ixlib=rb-4.1.0&q=80&w=400', rating: 4.3, inStock: true, discount: 25 },
  { id: 106, name: 'عینک آفتابی', desc: 'فریم فلزی، UV400', price: '۸۵۰,۰۰۰', priceNum: 850000, category: 'fashion', shop: 'مد اسپورت', image: 'https://images.unsplash.com/photo-1764722755184-9863f7b11ab6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5nbGFzc2VzJTIwZmFzaGlvbiUyMGFjY2Vzc29yaWVzfGVufDF8fHx8MTc3MTczODUxNXww&ixlib=rb-4.1.0&q=80&w=400', rating: 4.4, inStock: false },
  { id: 107, name: 'ست مراقبت پوست', desc: 'پاک‌کننده، تونر، مرطوب‌کننده', price: '۶۸۰,۰۰۰', priceNum: 680000, category: 'beauty', shop: 'بیوتی‌شاپ رز', image: 'https://images.unsplash.com/photo-1765852549902-bd9c79d01afb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3NtZXRpY3MlMjBiZWF1dHklMjBwcm9kdWN0cyUyMGRpc3BsYXl8ZW58MXx8fHwxNzcxODYxMzQwfDA&ixlib=rb-4.1.0&q=80&w=400', rating: 4.6, inStock: true },
  { id: 108, name: 'گوشی هوشمند', desc: 'صفحه ۶.۷ اینچ، دوربین ۱۰۸MP', price: '۱۸,۵۰۰,۰۰۰', priceNum: 18500000, category: 'electronics', shop: 'دیجی‌تک', image: 'https://images.unsplash.com/photo-1584658645175-90788b3347b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJvbmljcyUyMHNob3AlMjBzbWFydHBob25lJTIwZGlzcGxheXxlbnwxfHx8fDE3NzE4NjEzMzh8MA&ixlib=rb-4.1.0&q=80&w=400', rating: 4.8, inStock: true, discount: 5 },
  // سبز مارکت — سوپرمارکت آنلاین
  { id: 109, name: 'سبزیجات تازه', desc: 'سبد سبزیجات فصل ارگانیک', price: '۴۵,۰۰۰', priceNum: 45000, category: 'grocery', shop: 'سبز مارکت', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80', rating: 4.7, inStock: true },
  { id: 110, name: 'لبنیات و دوغ محلی', desc: 'دوغ سنتی با نعنا، ۱.۵ لیتر', price: '۳۵,۰۰۰', priceNum: 35000, category: 'grocery', shop: 'سبز مارکت', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80', rating: 4.6, inStock: true },
  { id: 111, name: 'آب‌میوه طبیعی', desc: 'آب‌میوه تازه بدون شکر افزوده', price: '۲۸,۰۰۰', priceNum: 28000, category: 'grocery', shop: 'سبز مارکت', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80', rating: 4.5, inStock: true, discount: 10 },
  { id: 112, name: 'بستنی خانوادگی', desc: 'بستنی زعفرانی با خلال پسته', price: '۹۵,۰۰۰', priceNum: 95000, category: 'grocery', shop: 'سبز مارکت', image: 'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80', rating: 4.8, inStock: true },
  { id: 113, name: 'سالاد آماده', desc: 'سالاد تازه با سس مخصوص', price: '۵۵,۰۰۰', priceNum: 55000, category: 'grocery', shop: 'سبز مارکت', image: 'https://images.unsplash.com/photo-1605034298551-baacf17591d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80', rating: 4.4, inStock: false },
  // بیوتی‌شاپ رز — لوازم آرایشی بهداشتی
  { id: 114, name: 'کرم مرطوب‌کننده', desc: 'مناسب پوست خشک و حساس', price: '۴۲۰,۰۰۰', priceNum: 420000, category: 'beauty', shop: 'بیوتی‌شاپ رز', image: 'https://images.unsplash.com/photo-1765852549902-bd9c79d01afb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3NtZXRpY3MlMjBiZWF1dHklMjBwcm9kdWN0cyUyMGRpc3BsYXl8ZW58MXx8fHwxNzcxODYxMzQwfDA&ixlib=rb-4.1.0&q=80&w=400', rating: 4.6, inStock: true, discount: 15 },
  { id: 115, name: 'سرم ویتامین C', desc: 'روشن‌کننده و ضد لک پوست', price: '۵۸۰,۰۰۰', priceNum: 580000, category: 'beauty', shop: 'بیوتی‌شاپ رز', image: 'https://images.unsplash.com/photo-1765852549902-bd9c79d01afb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3NtZXRpY3MlMjBiZWF1dHklMjBwcm9kdWN0cyUyMGRpc3BsYXl8ZW58MXx8fHwxNzcxODYxMzQwfDA&ixlib=rb-4.1.0&q=80&w=400', rating: 4.7, inStock: true },
];

interface MktCartItem { product: MarketProduct; qty: number }

// Promotion subscription options (boosted shops/products surface first in market)
export const MARKET_PROMO_ITEMS: { key: string; kind: string; name: string; icon: string; color: string }[] = [
  ...MARKET_SHOPS.map(s => ({ key: 'shop:' + s.name, kind: 'فروشگاه', name: s.name, icon: s.icon, color: s.color })),
  ...MARKET_PRODUCTS.filter(p => p.inStock).map(p => ({ key: 'prod:' + p.id, kind: 'محصول', name: p.name, icon: 'fa-solid fa-box', color: '#F59E0B' })),
];

interface MktOrder { id: number; num: string; items: string; status: 'preparing' | 'shipping' | 'delivered' | 'cancelled'; shop: string; date: string; total: string; progress?: number }

const MKT_ORDERS: MktOrder[] = [];

const mktOrderStatusMap: Record<string, { color: string; label: string; icon: string }> = {
  preparing: { color: '#F59E0B', label: 'آماده‌سازی', icon: 'fa-solid fa-box' },
  shipping: { color: '#3B82F6', label: 'در حال ارسال', icon: 'fa-solid fa-truck' },
  delivered: { color: '#10B981', label: 'تحویل شده', icon: 'fa-solid fa-circle-check' },
  cancelled: { color: '#EF4444', label: 'لغو شده', icon: 'fa-solid fa-ban' },
};

export interface MktOffer { id: number; title: string; desc: string; discount: number; shop: string; validUntil: string; code: string; color: string; icon: string }

export const MKT_OFFERS: MktOffer[] = [
  { id: 1, title: 'تخفیف خوش‌آمدگویی', desc: 'اولین خرید از هر فروشگاه', discount: 20, shop: 'همه فروشگاه‌ها', validUntil: 'تا پایان ماه', code: 'WELCOME20', color: '#10B981', icon: 'fa-solid fa-gift' },
  { id: 2, title: 'حراج لوازم دیجیتال', desc: 'تخفیف ویژه روی هدفون و ساعت', discount: 15, shop: 'دیجی‌تک', validUntil: 'تا ۳ روز دیگر', code: 'TECH15', color: '#3B82F6', icon: 'fa-solid fa-bolt' },
  { id: 3, title: 'پیشنهاد AI برای شما', desc: 'کوله‌پشتی مسافرتی — بر اساس علاقه‌مندی شما', discount: 10, shop: 'مد اسپورت', validUntil: 'فقط امروز', code: 'AIPACK10', color: '#EC4899', icon: 'fa-solid fa-wand-magic-sparkles' },
  { id: 4, title: 'جشنواره زیبایی', desc: 'محصولات مراقبت پوست با تخفیف', discount: 30, shop: 'بیوتی‌شاپ رز', validUntil: 'تا هفته آینده', code: 'BEAUTY30', color: '#8B5CF6', icon: 'fa-solid fa-spa' },
];

const MKT_CHAT_MSGS = [];

function MarketShopsTab({ onSelectShop, onBack }: { onSelectShop: (s: Shop) => void; onBack?: () => void }) {
  const { showToast, promotedMarket } = useApp();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [__shopCats, __setShopCats] = useState<any[]>(SHOP_CATEGORIES);
  useEffect(() => { (api as any).getSettings().then((st: any) => { if (st && Array.isArray(st.marketCategories) && st.marketCategories.length) __setShopCats([{ id: 'all', label: 'همه', icon: 'fa-solid fa-border-all' }, ...st.marketCategories]); }).catch(() => {}); }, []);
  const [greetOpen, setGreetOpen] = useState(true);
  const [__mktShops, __setMktShops] = useState<any[]>([]);
  React.useEffect(() => { (api as any).marketShops().then((r: any) => __setMktShops(Array.isArray(r) ? r : [])).catch(() => {}); }, []);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const isPromoted = (s: Shop) => promotedMarket.includes('shop:' + s.name);
  const __shopList: Shop[] = (__mktShops || []).map((c: any) => ({ id: c.id, name: c.name || 'فروشگاه', type: c.type || 'فروشگاه', cat: 'all', rating: 0, distance: '', deliveryTime: '', isOpen: c.isOpen !== false, icon: 'fa-solid fa-store', color: '#3B82F6', products: Number(c.products) || 0 } as any as Shop));
  const filtered = __shopList
    .filter(s => (!search || s.name.includes(search) || s.type.includes(search)))
    .slice()
    .sort((a, b) => (isPromoted(b) ? 1 : 0) - (isPromoted(a) ? 1 : 0));

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
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
          <i className="fa-solid fa-search text-sm text-[var(--aw-text-muted)]" />
          <input ref={searchRef} className="flex-1 min-w-0 bg-transparent border-none py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
            placeholder="جستجوی فروشگاه..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="bg-transparent border-none text-[var(--aw-text-muted)] cursor-pointer" onClick={() => setSearch('')}><i className="fa-solid fa-times text-sm" /></button>}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-1 aw-scroll-x" style={{ scrollbarWidth: 'none' }}>
        {__shopCats.map((c: any) => {
          const on = cat === c.id;
          return (
            <button key={c.id} onClick={() => setCat(c.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] whitespace-nowrap cursor-pointer border transition-all flex-shrink-0"
              style={{ fontWeight: 700, background: on ? 'var(--aw-primary)' : 'var(--aw-bg-card)', color: on ? '#fff' : 'var(--aw-text-secondary)', borderColor: on ? 'var(--aw-primary)' : 'var(--aw-border)' }}>
              <i className={c.icon + ' text-[11px]'} />{c.label}
            </button>
          );
        })}
      </div>

      <SectionTitle icon="fa-solid fa-store" title={`فروشگاه‌ها (${toFa(filtered.length)})`} />
      {filtered.map((shop, i) => {
        return (
        <motion.div key={shop.id} className="p-3 mb-2 cursor-pointer relative" style={{ ...euCardStyle, opacity: shop.isOpen ? 1 : 0.5 }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: shop.isOpen ? 1 : 0.5, y: 0 }} transition={{ delay: i * 0.06 }}
          onClick={() => shop.isOpen ? onSelectShop(shop) : showToast(`${shop.name} در حال حاضر بسته است`)}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-[18px] flex-shrink-0" style={{ background: shop.color }}>
              <i className={shop.icon} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{shop.name}</span>
                {shop.isOpen ? <StatusPill label="فعال" color="#10B981" /> : <StatusPill label="بسته" color="#EF4444" />}
              </div>
              <div className="text-[10px] text-[var(--aw-text-secondary)]">{shop.type}</div>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-0.5 text-[13px] text-[#F59E0B]" style={{ fontWeight: 700 }}>
                <i className="fa-solid fa-star text-[9px]" />{shop.rating}
              </div>
              <span className="text-[9px] text-[var(--aw-text-muted)]">{toFa(shop.products || 0)} محصول</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-[var(--aw-text-muted)] mt-2 pr-15">
            <span><i className="fa-solid fa-location-arrow text-[8px] ml-1" />{shop.distance}</span>
            <span><i className="fa-solid fa-truck text-[8px] ml-1" />{shop.deliveryTime}</span>
          </div>
        </motion.div>
        );
      })}
      {filtered.length === 0 && <EmptyState icon="fa-solid fa-store" text="فروشگاهی یافت نشد" />}
    </div>
  );
}

function MarketCatalogTab({ selectedProduct, setSelectedProduct, onBack }: {
  selectedProduct: MarketProduct | null; setSelectedProduct: (p: MarketProduct | null) => void; onBack?: () => void;
}) {
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const { promotedMarket, cartAdd, cartDec, cartQty, cartCount, setEuScreen, showToast } = useApp();
  const [__wish, setWish] = useState<any[]>([]);
  useEffect(() => { if (!getToken()) return; (async () => { try { const w: any = await (api as any).myList('wishlist'); if (Array.isArray(w)) setWish(w); } catch (_) {} })(); }, []);
  const __isWished = (id: any) => __wish.some((w: any) => String(w.id) === String(id));
  const __toggleWish = (item: any, e: any) => { if (e) e.stopPropagation(); if (__isWished(item.id)) { setWish(prev => prev.filter((w: any) => String(w.id) !== String(item.id))); (api as any).myRemove('wishlist', item.id).catch(() => {}); } else { const doc = { id: item.id, t: item.name, s: item.shop, p: item.price, icon: 'fa-solid fa-box' }; setWish(prev => [...prev, doc]); (api as any).myCreate('wishlist', doc).catch(() => {}); if (showToast) showToast('به علاقه‌مندی‌ها اضافه شد ❤️'); } };
  const [__catProducts, __setCatProducts] = useState<MarketProduct[]>([]);
  React.useEffect(() => { (api as any).marketAllProducts().then((r: any) => { const arr = Array.isArray(r) ? r : []; __setCatProducts(arr.map((it: any) => { const pn = Number(String((it && (it.salePrice || it.purchasePrice)) || 0).replace(/[^0-9]/g, '')) || 0; return { id: Number(it && it.id) || 0, name: (it && it.name) || 'کالا', desc: (it && (it.description || it.category)) || '', price: pn ? pn.toLocaleString('fa-IR') : '۰', priceNum: pn, category: 'all', shop: (it && it.shopName) || 'فروشگاه', shopId: (it && (it._shopId != null ? String(it._shopId) : '')), image: '', rating: 0, inStock: (Number(it && it.quantity) || 0) > 0 } as MarketProduct; })); }).catch(() => {}); }, []);
  const isPromoted = (p: MarketProduct) => promotedMarket.includes('prod:' + p.id);
  const filtered = (__catProducts || [])
    .filter(p => (!search || p.name.includes(search) || p.desc.includes(search)))
    .slice()
    .sort((a, b) => (isPromoted(b) ? 1 : 0) - (isPromoted(a) ? 1 : 0));

  const lineFor = (item: MarketProduct) => ({ source: 'market', key: 'm-' + item.id, name: item.name, priceNum: item.priceNum, shop: item.shop, sellerId: (item as any).shopId || '', productId: item.id });
  const addToCart = useCallback((item: MarketProduct) => cartAdd(lineFor(item)), [cartAdd]);
  const removeFromCart = useCallback((itemId: number) => cartDec('m-' + itemId), [cartDec]);
  const getQty = (id: number) => cartQty('m-' + id);

  if (selectedProduct) {
    return (
      <ProductDetailView product={selectedProduct} onBack={() => setSelectedProduct(null)}
        qty={getQty(selectedProduct.id)} onAdd={() => addToCart(selectedProduct)} onRemove={() => removeFromCart(selectedProduct.id)} />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll">
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} title="بازگشت"
              className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-eu-primary)' }}>
              <i className="fa-solid fa-arrow-right text-[14px]" />
            </button>
          )}
          <div className="flex-1 flex items-center gap-2 rounded-xl px-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
            <i className="fa-solid fa-search text-sm text-[var(--aw-text-muted)]" />
            <input className="flex-1 min-w-0 bg-transparent border-none py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
              placeholder="جستجوی محصول..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button className="bg-transparent border-none text-[var(--aw-text-muted)] cursor-pointer" onClick={() => setSearch('')}><i className="fa-solid fa-times text-sm" /></button>}
          </div>
          <button onClick={() => setEuScreen('euCartScreen')} title="سبد خرید" className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center relative flex-shrink-0"
            style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-eu-primary)' }}>
            <i className="fa-solid fa-cart-shopping text-[13px]" />
            {cartCount > 0 && (<span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center text-white text-[9px]"
              style={{ background: '#EF4444', fontWeight: 800, boxShadow: '0 0 0 2px var(--aw-bg-header)' }}>{toFa(cartCount)}</span>)}
          </button>
        </div>
      </div>

      <div className="flex gap-2 px-4 pb-3 overflow-x-auto aw-scroll">
        {[{ id: 'all', label: 'همه', icon: 'fa-solid fa-border-all' }].map(c => (
          <button key={c.id}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] whitespace-nowrap shrink-0 cursor-pointer transition-all ${
              cat === c.id ? 'text-white border-transparent' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'
            }`}
            style={cat === c.id ? { background: '#F59E0B', fontWeight: 600 } : { fontWeight: 500 }}
            onClick={() => setCat(c.id)}>
            <i className={c.icon} />{c.label}
          </button>
        ))}
      </div>

      <div className="px-4 grid gap-2.5">
        {filtered.map((item, i) => {
          const qty = getQty(item.id);
          return (
            <motion.div key={item.id} className="flex gap-3 p-2.5 cursor-pointer" style={{ ...euCardStyle, opacity: item.inStock ? 1 : 0.55 }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: item.inStock ? 1 : 0.55, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => setSelectedProduct(item)}>
              <div className="w-[76px] h-[76px] rounded-xl overflow-hidden flex-shrink-0 relative">
                <button onClick={(e) => __toggleWish(item, e)} className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center border-none cursor-pointer z-10" style={{ background: 'rgba(0,0,0,0.35)' }} aria-label="علاقه‌مندی"><i className={`fa-${__isWished(item.id) ? 'solid' : 'regular'} fa-heart text-[11px]`} style={{ color: __isWished(item.id) ? '#EF4444' : '#fff' }} /></button>
                <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-cover" />
                {item.discount && (
                  <span className="absolute top-1 right-1 text-[8px] px-1.5 py-0.5 rounded-md text-white" style={{ background: '#EF4444', fontWeight: 700 }}>
                    {toFa(item.discount)}%
                  </span>
                )}
                {!item.inStock && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-[9px] text-white px-2 py-0.5 rounded-md" style={{ background: 'rgba(0,0,0,0.7)', fontWeight: 700 }}>ناموجود</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <div className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{item.name}</div>
                  <div className="text-[10px] text-[var(--aw-text-secondary)] truncate mt-0.5">{item.desc}</div>
                  <div className="text-[9px] text-[var(--aw-text-muted)] mt-0.5"><i className="fa-solid fa-store text-[7px] ml-0.5" />{item.shop}</div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div>
                    <span className="text-[12px] text-[#F59E0B]" style={{ fontWeight: 700 }}>{item.price}</span>
                    <span className="text-[8px] text-[var(--aw-text-muted)] mr-0.5">تومان</span>
                  </div>
                  <span className="text-[9px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-star text-[#F59E0B] text-[7px]" /> {item.rating}</span>
                </div>
                {item.inStock && (
                  <div className="flex items-center justify-end mt-1">
                    {qty === 0 ? (
                      <button className="text-[10px] px-3 py-1.5 rounded-lg border-none text-white cursor-pointer flex items-center gap-1"
                        style={{ background: '#F59E0B', fontWeight: 600 }}
                        onClick={(e) => { e.stopPropagation(); addToCart(item); }}>
                        <i className="fa-solid fa-plus text-[8px]" /> افزودن
                      </button>
                    ) : (
                      <div className="flex items-center gap-0">
                        <button className="w-7 h-7 rounded-lg border-none text-white cursor-pointer flex items-center justify-center text-[11px]"
                          style={{ background: 'var(--aw-danger)' }} onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}>
                          <i className={`fa-solid ${qty === 1 ? 'fa-trash' : 'fa-minus'} text-[9px]`} />
                        </button>
                        <span className="w-7 text-center text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{toFa(qty)}</span>
                        <button className="w-7 h-7 rounded-lg border-none text-white cursor-pointer flex items-center justify-center text-[11px]"
                          style={{ background: '#F59E0B' }} onClick={(e) => { e.stopPropagation(); addToCart(item); }}>
                          <i className="fa-solid fa-plus text-[9px]" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && <EmptyState icon="fa-solid fa-th-large" text="محصولی یافت نشد" />}
      </div>
    </div>
  );
}

function MarketOrdersTab() {
  const { showToast, euPlacedOrders, openModal } = useApp() as any;
  const placedMarket = (euPlacedOrders || []).filter((o: any) => o.source === 'market');
  const allOrders = [...placedMarket.map((o: any) => ({ ...o, shop: o.vendor }))];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto pb-4 aw-scroll px-4 pt-3">
        {allOrders.map((ord: any, i: number) => {
          const st = mktOrderStatusMap[ord.status] || mktOrderStatusMap['preparing'];
          return (
            <motion.div key={ord.id} className="p-3 mb-2" style={euCardStyle}
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.06, 0.4) }}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-[#F59E0B]" style={{ fontWeight: 700 }}>#{ord.num}</span>
                    <StatusPill label={st.label} color={st.color} />
                  </div>
                  <div className="text-[13px] text-[var(--aw-text-primary)] mt-1" style={{ fontWeight: 600 }}>{ord.items}</div>
                </div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${st.color}15` }}>
                  <i className={`${st.icon} text-[14px]`} style={{ color: st.color }} />
                </div>
              </div>
              {ord.progress != null && (
                <div className="w-full h-1.5 rounded-full mb-2" style={{ background: 'rgba(126,95,170,0.1)' }}>
                  <motion.div className="h-full rounded-full" style={{ background: st.color }}
                    initial={{ width: 0 }} animate={{ width: `${ord.progress}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
                </div>
              )}
              <div className="flex items-center gap-3 text-[10px] text-[var(--aw-text-muted)]">
                <span><i className="fa-solid fa-store text-[8px] ml-1" />{ord.shop}</span>
                <span><i className="fa-regular fa-clock text-[8px] ml-1" />{ord.date}</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[rgba(126,95,170,0.1)]">
                <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{(Number(String(ord.total).replace(/[^\d]/g, '')) || 0).toLocaleString('fa-IR')} <span className="text-[9px] text-[var(--aw-text-muted)]">تومان</span></span>
                {(ord.status === 'preparing' || ord.status === 'shipping') && (
                  <button onClick={() => openModal('جزئیات سفارش', <OrderDetail order={ord as any} />)} className="text-[10px] px-3 py-1.5 rounded-lg border border-[#F59E0B] bg-transparent text-[#F59E0B] cursor-pointer" style={{ fontWeight: 600 }}>
                    <i className="fa-solid fa-eye text-[8px] ml-1" />پیگیری
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
        {allOrders.length === 0 && <EmptyState icon="fa-solid fa-shopping-bag" text="سفارشی یافت نشد" />}
      </div>
    </div>
  );
}

function MarketDealsTab() {
  useMarketData();
  const { showToast } = useApp();
  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll px-4 pt-3">
      <SectionTitle icon="fa-solid fa-wand-magic-sparkles" title="پیشنهادهای ویژه" />
      {__MARKET.offers.map((o: any, i: number) => (
        <motion.div key={o.id} className="p-3 mb-2 overflow-hidden relative" style={euCardStyle}
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.07]" style={{ background: o.color, filter: 'blur(24px)' }} />
          <div className="flex items-start gap-3 mb-2 relative">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-[16px]" style={{ background: o.color }}>
              <i className={o.icon} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{o.title}</div>
              <div className="text-[11px] text-[var(--aw-text-secondary)] mt-0.5">{o.desc}</div>
            </div>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-[15px]" style={{ background: `${o.color}cc`, fontWeight: 800 }}>
              {toFa(o.discount)}%
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-[var(--aw-text-muted)]">
            <span><i className="fa-solid fa-store text-[8px] ml-1" />{o.shop}</span>
            <span><i className="fa-solid fa-calendar text-[8px] ml-1" />{o.validUntil}</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[rgba(126,95,170,0.1)]">
            <span className="text-[11px] text-[var(--aw-text-muted)] flex items-center gap-1">
              <i className="fa-solid fa-tag text-[8px]" />کد: <span className="text-[#F59E0B]" style={{ fontWeight: 700 }}>{o.code}</span>
            </span>
            <button className="text-[10px] px-3 py-1.5 rounded-lg border-none text-white cursor-pointer flex items-center gap-1" style={{ background: o.color, fontWeight: 600 }}
              onClick={() => { try { (navigator as any).clipboard?.writeText(o.code); } catch (_) {} showToast(`کد تخفیف ${o.code} کپی شد`); }}>
              <i className="fa-solid fa-copy text-[8px]" /> کپی کد
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ProductDetailView({ product, onBack, qty, onAdd, onRemove }: {
  product: MarketProduct; onBack: () => void; qty: number; onAdd: () => void; onRemove: () => void;
}) {
  const { cartCount, setEuScreen } = useApp(); // marketcart: خودکفا
  const onCart = () => { try { onBack(); } catch (_e) {} setEuScreen('euCartScreen'); };
  const catLabel = MKT_CATEGORIES.find(c => c.id === product.category)?.label || 'محصول';
  const discounted = product.discount ? Math.round(product.priceNum * (1 - product.discount / 100)) : product.priceNum;
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-shrink-0 px-4 pt-2.5 pb-2 flex items-center gap-2" style={{ background: 'var(--aw-bg-header)' }}>
        <button onClick={onBack} title="بازگشت" className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-eu-primary)' }}>
          <i className="fa-solid fa-arrow-right text-[14px]" />
        </button>
        <span className="flex-1 min-w-0 text-[14px] text-[var(--aw-text-primary)] truncate" style={{ fontWeight: 800 }}>{product.name}</span>
        <button onClick={onCart} title="سبد خرید" className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center relative flex-shrink-0"
          style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-eu-primary)' }}>
          <i className="fa-solid fa-cart-shopping text-[13px]" />
          {cartCount > 0 && (<span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center text-white text-[9px]"
            style={{ background: '#EF4444', fontWeight: 800, boxShadow: '0 0 0 2px var(--aw-bg-header)' }}>{toFa(cartCount)}</span>)}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto pb-4 aw-scroll px-4 pt-3">
        <div className="w-full h-[210px] rounded-2xl overflow-hidden relative mb-3">
          <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover" />
          {product.discount && <span className="absolute top-2 right-2 text-[11px] px-2 py-1 rounded-lg text-white" style={{ background: '#EF4444', fontWeight: 700 }}>{toFa(product.discount)}% تخفیف</span>}
          {!product.inStock && <div className="absolute inset-0 bg-black/45 flex items-center justify-center"><span className="text-[13px] text-white px-3 py-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.7)', fontWeight: 700 }}>ناموجود</span></div>}
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: 'var(--aw-eu-primary-bg)', color: 'var(--aw-eu-primary)', fontWeight: 700 }}>{catLabel}</span>
          <span className="text-[10px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-store text-[8px] ml-0.5" />{product.shop}</span>
          <span className="text-[11px] text-[#F59E0B] mr-auto" style={{ fontWeight: 700 }}><i className="fa-solid fa-star text-[9px]" /> {product.rating}</span>
        </div>
        <div className="text-[17px] text-[var(--aw-text-primary)] mb-1.5" style={{ fontWeight: 800 }}>{product.name}</div>
        <div className="text-[12px] text-[var(--aw-text-secondary)] leading-6 mb-3">{product.desc}</div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[19px] text-[#F59E0B]" style={{ fontWeight: 800 }}>{discounted.toLocaleString('fa-IR')}</span>
          <span className="text-[10px] text-[var(--aw-text-muted)]">تومان</span>
          {product.discount && <span className="text-[12px] text-[var(--aw-text-muted)] line-through mr-1">{product.price}</span>}
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {[{ i: 'fa-solid fa-truck', t: 'ارسال سریع' }, { i: 'fa-solid fa-shield-halved', t: 'ضمانت اصالت' }, { i: 'fa-solid fa-rotate-left', t: '۷ روز مرجوعی' }].map((f, k) => (
            <div key={k} className="flex flex-col items-center gap-1 p-2.5 rounded-xl" style={euCardStyle}>
              <i className={`${f.i} text-[14px]`} style={{ color: 'var(--aw-eu-primary)' }} />
              <span className="text-[9px] text-[var(--aw-text-secondary)]" style={{ fontWeight: 600 }}>{f.t}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-shrink-0 px-4 py-3 border-t border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-header)' }}>
        {!product.inStock ? (
          <button disabled className="w-full py-3 rounded-2xl border-none text-white text-[13px]" style={{ background: 'var(--aw-border)', fontWeight: 700, opacity: 0.7 }}>ناموجود</button>
        ) : qty === 0 ? (
          <button className="w-full py-3 rounded-2xl border-none text-white text-[13px] cursor-pointer flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', fontWeight: 700 }} onClick={onAdd}>
            <i className="fa-solid fa-cart-plus text-[12px]" /> افزودن به سبد خرید
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0 flex-shrink-0">
              <button className="w-9 h-9 rounded-lg border-none text-white cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-danger)' }} onClick={onRemove}><i className={`fa-solid ${qty === 1 ? 'fa-trash' : 'fa-minus'} text-[11px]`} /></button>
              <span className="w-9 text-center text-[15px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{toFa(qty)}</span>
              <button className="w-9 h-9 rounded-lg border-none text-white cursor-pointer flex items-center justify-center" style={{ background: '#F59E0B' }} onClick={onAdd}><i className="fa-solid fa-plus text-[11px]" /></button>
            </div>
            <button onClick={onCart} className="flex-1 py-3 rounded-2xl border-none text-white text-[13px] cursor-pointer flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', fontWeight: 700 }}>
              <i className="fa-solid fa-cart-shopping text-[12px]" /> مشاهده سبد خرید ({toFa(qty)})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ShopDetailView({ shop, onBack, selectedProduct, setSelectedProduct, cartCount, onCart }: {
  shop: Shop; onBack: () => void;
  selectedProduct: MarketProduct | null; setSelectedProduct: (p: MarketProduct | null) => void;
  cartCount: number; onCart: () => void;
}) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [__invProducts, __setInvProducts] = useState<any[]>([]);
  React.useEffect(() => { (api as any).marketShopProducts(shop.id).then((r: any) => __setInvProducts(Array.isArray(r) ? r : [])).catch(() => {}); }, [shop && shop.id]);
  const { cartAdd: cartAddCtx, cartDec: cartDecCtx, cartQty: cartQtyCtx } = useApp();
  const __invMapped: MarketProduct[] = (__invProducts || []).map((it: any) => {
    const pn = Number(String((it && (it.salePrice || it.purchasePrice)) || 0).replace(/[^0-9]/g, '')) || 0;
    return { id: Number(it && it.id) || 0, name: (it && it.name) || 'کالا', desc: (it && (it.description || it.category)) || '', price: pn ? pn.toLocaleString('fa-IR') : '۰', priceNum: pn, category: 'all', shop: shop.name, image: '', rating: 0, inStock: (Number(it && it.quantity) || 0) > 0 } as MarketProduct;
  });
  const shopProducts = __invMapped.filter(p => (!search || p.name.includes(search) || p.desc.includes(search)));
  const shopCats = [MKT_CATEGORIES[0]];

  const addToCart = useCallback((item: MarketProduct) => cartAddCtx({ source: 'market', key: 'm-' + item.id, name: item.name, priceNum: item.priceNum, shop: item.shop, sellerId: String(shop.id), productId: item.id }), [cartAddCtx]);
  const removeFromCart = useCallback((itemId: number) => cartDecCtx('m-' + itemId), [cartDecCtx]);
  const getQty = (id: number) => cartQtyCtx('m-' + id);

  if (selectedProduct) {
    return (
      <ProductDetailView product={selectedProduct} onBack={() => setSelectedProduct(null)}
        qty={getQty(selectedProduct.id)} onAdd={() => addToCart(selectedProduct)} onRemove={() => removeFromCart(selectedProduct.id)} />
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Shop header banner — single back button */}
      <div className="flex-shrink-0 px-4 pt-2.5 pb-2" style={{ background: 'var(--aw-bg-header)' }}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} title="بازگشت"
            className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-eu-primary)' }}>
            <i className="fa-solid fa-arrow-right text-[14px]" />
          </button>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-[18px] flex-shrink-0" style={{ background: shop.color }}>
            <i className={shop.icon} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{shop.name}</span>
              <StatusPill label="فعال" color="#10B981" />
            </div>
            <div className="text-[10px] text-[var(--aw-text-secondary)]">{shop.type}</div>
          </div>
          <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
            <div className="flex items-center gap-0.5 text-[13px] text-[#F59E0B]" style={{ fontWeight: 800 }}>
              <i className="fa-solid fa-star text-[9px]" />{shop.rating}
            </div>
            <span className="text-[9px] text-[var(--aw-text-muted)]">{toFa(shop.products || 0)} محصول</span>
          </div>
          <button onClick={onCart} title="سبد خرید"
            className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center relative flex-shrink-0"
            style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-eu-primary)' }}>
            <i className="fa-solid fa-cart-shopping text-[13px]" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center text-white text-[9px]"
                style={{ background: '#EF4444', fontWeight: 800, boxShadow: '0 0 0 2px var(--aw-bg-header)' }}>{toFa(cartCount)}</span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-[var(--aw-text-muted)] mt-2 pr-[52px]">
          <span><i className="fa-solid fa-location-arrow text-[8px] ml-1" />{shop.distance}</span>
          <span><i className="fa-solid fa-truck text-[8px] ml-1" />{shop.deliveryTime}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-4 aw-scroll">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 rounded-xl px-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
            <i className="fa-solid fa-search text-sm text-[var(--aw-text-muted)]" />
            <input className="flex-1 bg-transparent border-none py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
              placeholder={`جستجو در ${shop.name}...`} value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button className="bg-transparent border-none text-[var(--aw-text-muted)] cursor-pointer" onClick={() => setSearch('')}><i className="fa-solid fa-times text-sm" /></button>}
          </div>
        </div>

        {/* Category bar */}
        {shopCats.length > 1 && (
          <div className="flex gap-2 px-4 pb-2 overflow-x-auto aw-scroll">
            {shopCats.map(c => (
              <button key={c.id}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] whitespace-nowrap shrink-0 cursor-pointer transition-all"
                style={cat === c.id
                  ? { background: shop.color, color: '#fff', borderColor: 'transparent', fontWeight: 700 }
                  : { background: 'transparent', color: 'var(--aw-text-secondary)', borderColor: 'var(--aw-border)', fontWeight: 500 }}
                onClick={() => setCat(c.id)}>
                <i className={c.icon} />{c.label}
              </button>
            ))}
          </div>
        )}

        <div className="px-4">
          <SectionTitle icon="fa-solid fa-box-open" title={`محصولات (${toFa(shopProducts.length)})`} />
        </div>

        <div className="px-4 grid gap-2.5">
          {shopProducts.map((item, i) => {
            const qty = getQty(item.id);
            return (
              <motion.div key={item.id} className="flex gap-3 p-2.5 cursor-pointer" style={{ ...euCardStyle, opacity: item.inStock ? 1 : 0.55 }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: item.inStock ? 1 : 0.55, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedProduct(item)}>
                <div className="w-[76px] h-[76px] rounded-xl overflow-hidden flex-shrink-0 relative">
                  <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  {item.discount && (
                    <span className="absolute top-1 right-1 text-[8px] px-1.5 py-0.5 rounded-md text-white" style={{ background: '#EF4444', fontWeight: 700 }}>{toFa(item.discount)}%</span>
                  )}
                  {!item.inStock && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-[9px] text-white px-2 py-0.5 rounded-md" style={{ background: 'rgba(0,0,0,0.7)', fontWeight: 700 }}>ناموجود</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <div className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{item.name}</div>
                    <div className="text-[10px] text-[var(--aw-text-secondary)] truncate mt-0.5">{item.desc}</div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <span className="text-[12px] text-[#F59E0B]" style={{ fontWeight: 700 }}>{item.price}</span>
                      <span className="text-[8px] text-[var(--aw-text-muted)] mr-0.5">تومان</span>
                    </div>
                    <span className="text-[9px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-star text-[#F59E0B] text-[7px]" /> {item.rating}</span>
                  </div>
                  {item.inStock && (
                    <div className="flex items-center justify-end mt-1">
                      {qty === 0 ? (
                        <button className="text-[10px] px-3 py-1.5 rounded-lg border-none text-white cursor-pointer flex items-center gap-1"
                          style={{ background: '#F59E0B', fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); addToCart(item); }}>
                          <i className="fa-solid fa-plus text-[8px]" /> افزودن
                        </button>
                      ) : (
                        <div className="flex items-center gap-0">
                          <button className="w-7 h-7 rounded-lg border-none text-white cursor-pointer flex items-center justify-center text-[11px]"
                            style={{ background: 'var(--aw-danger)' }} onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}>
                            <i className={`fa-solid ${qty === 1 ? 'fa-trash' : 'fa-minus'} text-[9px]`} />
                          </button>
                          <span className="w-7 text-center text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{toFa(qty)}</span>
                          <button className="w-7 h-7 rounded-lg border-none text-white cursor-pointer flex items-center justify-center text-[11px]"
                            style={{ background: '#F59E0B' }} onClick={(e) => { e.stopPropagation(); addToCart(item); }}>
                            <i className="fa-solid fa-plus text-[9px]" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          {shopProducts.length === 0 && <EmptyState icon="fa-solid fa-box-open" text="محصولی یافت نشد" />}
        </div>
      </div>
    </div>
  );
}

export function EuMarketScreen() {
  const { setEuScreen, cartCount, euPlacedOrders } = useApp();
  const [tab, setTab] = useState('shops');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<MarketProduct | null>(null);

  const activeOrders = (euPlacedOrders || []).filter((o: any) => o.source === 'market' && (o.status === 'preparing' || o.status === 'shipping')).length;
  const marketTabs = MARKET_TABS.map(t => {
    if (t.id === 'orders') return { ...t, badge: activeOrders > 0 ? activeOrders : undefined };
    return t;
  });

  // Shop detail — its own page with a single back button (no screen top bar)
  if (selectedShop && tab === 'shops') {
    return (
      <div className="flex flex-col h-full relative">
        <ShopDetailView shop={selectedShop} onBack={() => { setSelectedProduct(null); setSelectedShop(null); }}
          selectedProduct={selectedProduct} setSelectedProduct={setSelectedProduct}
          cartCount={cartCount} onCart={() => { setSelectedProduct(null); setSelectedShop(null); setEuScreen('euCartScreen'); }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {!(tab === 'shops' || tab === 'catalog') && (
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5 flex-shrink-0" style={{ order: 0, background: 'var(--aw-bg-header)' }}>
          <button onClick={() => setEuScreen('euHomeScreen')} title="بازگشت"
            className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-eu-primary)' }}>
            <i className="fa-solid fa-arrow-right text-[14px]" />
          </button>
          <span className="text-[15px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>مارکت</span>
        </div>
      )}
      <AgentTabBar tabs={marketTabs} active={tab} onChange={(t) => { setSelectedProduct(null); setTab(t); }} asFooter />
      <AnimatePresence mode="wait">
        <motion.div key={tab} className="flex-1 flex flex-col min-h-0"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
          {tab === 'shops' && <MarketShopsTab onSelectShop={setSelectedShop} onBack={() => setEuScreen('euHomeScreen')} />}
          {tab === 'catalog' && <MarketCatalogTab selectedProduct={selectedProduct} setSelectedProduct={setSelectedProduct} onBack={() => setEuScreen('euHomeScreen')} />}
          {tab === 'orders' && <MarketOrdersTab />}
          {tab === 'chat' && <MarketChatTab />}
          {tab === 'deals' && <MarketDealsTab />}
          {tab === 'account' && <MarketAccountTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
