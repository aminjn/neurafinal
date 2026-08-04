// __usersettings_applied
import React, { useState, useMemo, useEffect, useRef } from 'react';

function __grpFa(v: any): string {
  const n = String(v == null ? '' : v).replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '');
  return n ? Number(n).toLocaleString('en-US').replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]) : '';
}

function __copy(text: string, ok?: () => void) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(String(text)).then(() => ok && ok()).catch(() => {}); return; }
    const t = document.createElement('textarea'); t.value = String(text); t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); } catch (_) {}
    document.body.removeChild(t); ok && ok();
  } catch (_) {}
}

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
import { motion, AnimatePresence } from 'motion/react';
import { useApp, EuScreen } from './app-context';
import { RoleSwitcher, AgentSelector, SubscribeContent, ProfileContent, FormGroup, FormInput, SettingsGroup, SettingsItem, CustomizeAgentContent, AgentSettingsContent, MoreScreenModal, NOTIF_ICON_SRC } from './admin-panel';
import { COMPANIES, NOTIFICATIONS, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, toFa, orderIcon, Agent, Order } from './data';
import { EuDineScreen, EuAssistantScreen, EuContacts, EuSupportScreen, EuMarketScreen, EuPlannerScreen, EuSearchScreen, EuReportScreen } from './eu-agent-screens';
import { MARKET_PROMO_ITEMS, MKT_OFFERS, AddressFormModal, openMarketOrders } from './eu-market-screen';
import { OFFERS as DINE_OFFERS } from './eu-dine-screen';
import { EuHomeScreen } from './eu-home-screen';
import { EuAvatar } from './eu-spectrum-avatar';
import { LetterAvatar } from './letter-avatar';
import neuraLogo from "figma:asset/0ee60e1dbaa3bcb0e2daccbfdd0200ba026fb510.png";
function logoMaskUrl(){ try { return (window.__VFS_IMG__ && window.__VFS_IMG__["/src/assets/neura-logo-blue.png"]) || ""; } catch(e){ return ""; } }
import copilotAvatar from "figma:asset/80728c20cabe3ba700e3cee6136877e472056e8e.png";

const euPageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

// خریدِ «نمونهٔ دیگرِ» یک ایجنت از کیف‌پول — کامپوننتِ مشترک (وقتی درگاهِ پرداخت اضافه شد، فقط سرور/همین‌جا
// عوض می‌شود، نه همه‌جای برنامه). قیمت از سرور اعمال می‌شود؛ اینجا فقط نمایش و تأیید است.
function BuyAgentInstanceContent({ baseId = 'assistant', title = 'دستیار' }: { baseId?: string; title?: string }) {
  const { closeModal, showToast, setAgents, setAssistantId, walletBalance } = useApp() as any;
  const [busy, setBusy] = useState(false);
  const PRICE = 50000; // پیش‌فرض؛ سرور مقدارِ واقعی (تنظیماتِ سوپرادمین) را اعمال می‌کند
  const enough = (Number(walletBalance) || 0) >= PRICE;
  const pay = async () => {
    setBusy(true);
    try {
      const r: any = await (api as any).buyAgentInstance(baseId);
      if (r && r.ok) {
        try { const ag: any = await api.agents(); if (Array.isArray(ag) && ag.length) setAgents(ag as any); } catch (_) {}
        if (r.instanceId) setAssistantId(r.instanceId);
        try { window.dispatchEvent(new CustomEvent('neura:data-changed')); } catch (_) {}
        showToast(title + 'ِ جدید اضافه شد ✓', 'success');
        closeModal();
      } else showToast('خطا در خرید', 'error');
    } catch (e: any) {
      showToast(e && e.status === 402 ? 'موجودی کیف‌پول کافی نیست — اول شارژ کنید' : 'خطا در خرید', 'error');
    } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-center gap-2 py-1">
        <div className="w-14 h-14 rounded-[18px] flex items-center justify-center text-white" style={{ background: 'var(--aw-eu-primary,#7B62FC)' }}><i className="fa-solid fa-user-plus text-[22px]" /></div>
        <div className="text-[14px]" style={{ fontWeight: 700 }}>افزودنِ {title}ِ دیگر</div>
        <div className="text-[12px] text-[var(--aw-text-muted)] text-center px-2">یک {title}ِ مستقلِ دیگر با نام، گفتگو و تنظیماتِ جدا اضافه می‌شود.</div>
      </div>
      <div className="flex items-center justify-between px-3 py-2.5 rounded-[12px]" style={{ background: 'var(--aw-bg-card)' }}>
        <span className="text-[12px] text-[var(--aw-text-secondary)]">هزینه</span>
        <span className="text-[14px]" style={{ fontWeight: 800 }}>{PRICE.toLocaleString('fa-IR')} تومان</span>
      </div>
      <div className="flex items-center justify-between px-3 py-2 rounded-[12px]" style={{ background: 'var(--aw-bg-card)' }}>
        <span className="text-[12px] text-[var(--aw-text-secondary)]">موجودی کیف‌پول</span>
        <span className="text-[13px]" style={{ fontWeight: 700, color: enough ? '#10B981' : '#ef4444' }}>{(Number(walletBalance) || 0).toLocaleString('fa-IR')} تومان</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <button disabled={busy} onClick={pay} className="py-2.5 rounded-[12px] border-none cursor-pointer text-white text-[13px]" style={{ background: 'var(--aw-eu-primary,#7B62FC)', opacity: busy ? 0.7 : 1, fontWeight: 700 }}>
          <i className="fa-solid fa-wallet" /> {busy ? 'در حال پرداخت…' : 'پرداخت از کیف‌پول'}
        </button>
        <button disabled={busy} onClick={closeModal} className="py-2.5 rounded-[12px] cursor-pointer text-[13px] bg-transparent" style={{ border: '1px solid var(--aw-border)', color: 'var(--aw-text-secondary)', fontWeight: 700 }}>انصراف</button>
      </div>
    </div>
  );
}

// ========================
// EU HEADER
// ========================
const AGENT_SCREEN_META: Partial<Record<EuScreen, { title: string; icon: string; color: string }>> = {
  euDineScreen:      { title: 'سفارش غذا',   icon: 'fa-solid fa-utensils', color: '#14b8a6' },
  euAssistantScreen: { title: 'دستیار شخصی', icon: 'fa-solid fa-robot',    color: '#6366f1' },
  euSupportScreen:   { title: 'پشتیبانی',    icon: 'fa-solid fa-headset',  color: '#f43f5e' },
  euMarketScreen:    { title: 'مارکت',        icon: 'fa-solid fa-store',    color: '#F59E0B' },
};

function EuHeader() {
  const { openModal, euScreen, setEuScreen, goBack, theme, setAppStage, ttsSpeaking, cartCount, agents, assistantId, setAssistantId, setAgents, showToast } = useApp();
  const isGlass = theme === 'glass' || theme === 'dark';
  const agentMeta = AGENT_SCREEN_META[euScreen];
  // شمارشِ واقعیِ اعلان‌ها برای بَجِ هدر (به‌جای نقطه/عددِ فیک). خالی برای کاربرِ تازه.
  const _euHdrApp = useApp() as any;
  // بَجِ هدر = تعدادِ اعلان‌های واقعی (سفارشِ فعال + یادآوری + کارِ باز + اعلانِ ذخیره‌شده)، نه فقط collectionِ خالی.
  const [_euStored, _setEuStored] = useState<any[]>([]);
  const [_euCal, _setEuCal] = useState<any[]>([]);
  const [_euTasks, _setEuTasks] = useState<any[]>([]);
  React.useEffect(() => {
    let _live = true;
    (async () => {
      try {
        const v: any = _euHdrApp.role === 'user'
          ? await (api as any).myList('notifications')
          : await (api as any).list('notifications', _euHdrApp.company);
        if (_live && Array.isArray(v)) _setEuStored(v);
      } catch (_e) {}
      if (_euHdrApp.role === 'user') {
        try { const c: any = await (api as any).myList('calendar'); if (_live && Array.isArray(c)) _setEuCal(c); } catch (_e) {}
        try { const t: any = await (api as any).myList('tasks'); if (_live && Array.isArray(t)) _setEuTasks(t); } catch (_e) {}
      }
    })();
    return () => { _live = false; };
  }, [_euHdrApp.role, _euHdrApp.company]);
  const _euNotifCount = buildEuFeed({ stored: _euStored, calendar: _euCal, tasks: _euTasks, orders: (_euHdrApp.euPlacedOrders || []) }).length;
  // Personal-assistant agents for the top name dropdown.
  const asstAgents = (agents || []).filter((a: any) => a.team === 'assistant' || a.id === 'assistant');
  const activeAsst = asstAgents.find((a: any) => a.id === assistantId) || asstAgents[0];
  // نامِ نمایشیِ دستیار = نامِ واقعیِ ایجنت از سرور (api.agents با overlayِ agent_prefs)، نه localStorageِ محلی.
  // قبلاً برای 'assistant' از کلیدِ aw-eu-assistant-name خوانده می‌شد که هیچ‌وقت نوشته نمی‌شد → اسمِ ذخیره‌شده نمایش داده نمی‌شد.
  const asstDisplayName = (id: string) => (agents.find((a: any) => a.id === id)?.name) || 'دستیار شخصی';
  const asstNameOptions = asstAgents.map((a: any) => ({ id: a.id, name: asstDisplayName(a.id) }));
  const addAssistant = () => {
    const id = 'asst_' + Date.now();
    setAgents((prev: any[]) => [...prev, { id, name: 'دستیار جدید', role: 'دستیار شخصی', gender: 'm', team: 'assistant', bg: 'aw-bg-indigo', init: 'د', locked: false, accent: '#7B62FC', instructions: 'مدیریت امور شخصی، یادآوری‌ها و برنامه‌ریزی روزانه.' }]);
    setAssistantId(id); showToast && showToast('دستیار شخصی جدید افزوده شد');
  };

  if (isGlass) {
    return (
      <header className="flex-shrink-0" style={{ position: 'relative', zIndex: 110 }}>
        {/* Progressive blur: heavy blur concentrated in the mid transition band (where tint is semi-transparent) */}
        {[
          { b: 2, m: 'linear-gradient(to top, #000 0%, #000 8%, transparent 22%)' },
          { b: 6, m: 'linear-gradient(to top, transparent 8%, #000 20%, #000 32%, transparent 46%)' },
          { b: 14, m: 'linear-gradient(to top, transparent 20%, #000 34%, #000 46%, transparent 60%)' },
          { b: 26, m: 'linear-gradient(to top, transparent 32%, #000 46%, #000 60%, transparent 74%)' },
          { b: 32, m: 'linear-gradient(to top, transparent 46%, #000 60%, #000 74%, transparent 88%)' },
          { b: 20, m: 'linear-gradient(to top, transparent 62%, #000 78%)' },
        ].map((l, i) => (
          <div key={i} aria-hidden style={{ position: 'absolute', inset: 0, backdropFilter: `blur(${l.b}px)`, WebkitBackdropFilter: `blur(${l.b}px)`, maskImage: l.m, WebkitMaskImage: l.m, pointerEvents: 'none', zIndex: 0 }} />
        ))}
        {/* Tint shade on top — opaque top ~40% hides content, semi through the blur band, transparent at bottom */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, color-mix(in srgb, var(--aw-eu-primary) 22%, var(--aw-bg-app)) 0%, color-mix(in srgb, var(--aw-eu-primary) 22%, var(--aw-bg-app)) 40%, color-mix(in srgb, var(--aw-eu-primary) 16%, transparent) 62%, color-mix(in srgb, var(--aw-eu-primary) 7%, transparent) 82%, transparent 100%)', pointerEvents: 'none', zIndex: 0 }} />
        {/* Top icon row — logo on left, icons on right (fixed across all screens) */}
        <div className="flex items-center relative md:hidden px-[16px] pt-[40px] pb-[8px]" style={{ zIndex: 30 }}>
          {/* LEFT side: Neura logo (click → home) */}
          <button onClick={() => setAppStage('home')} className="flex items-center gap-[3px] bg-transparent border-none cursor-pointer p-0">
            <img src={neuraLogo} alt="" className="neura-logo h-[24px] w-[24px] object-contain" />
            <span style={{ fontFamily: "'Neogrey', 'Space Grotesk', sans-serif", fontWeight: 500, fontSize: 16, color: 'var(--aw-text-primary)' }}>neura</span>
          </button>

          {/* RIGHT side: icons (from right: search, bell, settings) */}
          <div className="flex-1 flex items-center justify-end gap-[16px]">
            <button
              className="w-[26px] h-[26px] bg-transparent border-none cursor-pointer flex items-center justify-center p-0"
              style={{ color: 'var(--aw-eu-primary)', fontSize: 16 }}
              onClick={() => setEuScreen('euSearchScreen')}
              title="جستجو"
            >
              <span aria-hidden style={{ display: 'block', width: 25, height: 25, background: 'var(--aw-eu-primary)', WebkitMaskImage: 'url("/src/icons/search.svg")', maskImage: 'url("/src/icons/search.svg")', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center', WebkitMaskSize: 'contain', maskSize: 'contain' }} />
            </button>
            <button
              className="w-[20px] h-[20px] bg-transparent border-none cursor-pointer flex items-center justify-center p-0 relative"
              style={{ color: 'var(--aw-text-secondary)', fontSize: 16 }}
              onClick={() => openModal('اعلان‌ها', <EuNotifications />)}
            >
              <img src="/src/icons/png/bell.png" alt="" className="nav-icon-img" style={{ width: 20, height: 20, objectFit: 'contain' }} />
              {_euNotifCount > 0 && (<span className="absolute top-[1px] right-[1px] w-[7px] h-[7px] rounded-full" style={{ background: '#FF4D4D', border: '1.5px solid rgba(255,255,255,0.9)' }} />)}
            </button>
            <button
              className="w-[20px] h-[20px] bg-transparent border-none cursor-pointer flex items-center justify-center p-0"
              style={{ color: 'var(--aw-text-primary)', fontSize: 16 }}
              onClick={() => openModal('تنظیمات', <EuSettingsContent />)}
            >
              <img src="/src/icons/png/setting.png" alt="" className="nav-icon-img" style={{ width: 20, height: 20, objectFit: 'contain' }} />
            </button>
          </div>
        </div>

        {/* Desktop header row */}
        <div className="hidden md:flex items-center px-6 pt-3 pb-2 gap-2">
          <div className="flex items-center gap-2 flex-1">
            <img src={neuraLogo} alt="Neura" className="neura-logo h-6 w-auto object-contain" />
            <span className="text-[15px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>
              {agentMeta?.title || EU_NAV_ITEMS.find(i => i.id === euScreen)?.label || 'خانه'}
            </span>
          </div>
          <button className="w-[34px] h-[34px] rounded-[10px] bg-transparent border-none cursor-pointer text-[var(--aw-text-primary)] text-[16px] flex items-center justify-center"
            onClick={() => openModal('تنظیمات', <EuSettingsContent />)}>
            <i className="fa-solid fa-gear" />
          </button>
        </div>

        {/* Avatar row — draggable: up = shrink/deactivate, down = activate. Agent selector sits bottom-right. */}
        <div className="md:hidden relative" style={{ zIndex: 1 }} data-chat-top-anchor>
          <EuAvatar speaking={ttsSpeaking} portrait={(activeAsst as any)?.avatar || ((activeAsst as any)?.gender === 'm' ? '/src/avatars/m4.png' : '/src/assets/avatar-portrait.png')} /* asstavatar */ name={activeAsst ? asstDisplayName(activeAsst.id) : undefined} accent={activeAsst?.accent || undefined} nameOptions={asstNameOptions} activeNameId={activeAsst?.id} onPickName={(id) => setAssistantId(id)} onAddName={() => openModal('افزودنِ دستیار', <BuyAgentInstanceContent baseId="assistant" title="دستیار" />)} cornerSlot={<AgentSelector />} onChatClick={() => setEuScreen('euAssistantScreen')} onLongPress={() => openModal('شخصی‌سازی دستیار', <CustomizeAgentContent agentId={activeAsst?.id || 'assistant'} />)} />
        </div>
      </header>
    );
  }

  return (
    <header className="flex-shrink-0 border-b border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-header)', backdropFilter: 'blur(20px)' }}>
      <div className="flex items-center px-3 md:px-6 pt-2 mb-1.5 relative">
        <div className="flex gap-0.5 z-10">
          {!agentMeta && (
            <button className="w-[38px] h-[38px] rounded-[10px] bg-transparent border-none text-[var(--aw-text-secondary)] text-base cursor-pointer relative flex items-center justify-center hover:text-[var(--aw-eu-primary)]"
              onClick={() => openModal('اعلان‌ها', <EuNotifications />)}>
              <i className="fa-solid fa-bell" />
              {_euNotifCount > 0 && (<span className="absolute top-1 right-1 w-[16px] h-[16px] rounded-full flex items-center justify-center text-white text-[9px]" style={{ background: 'var(--aw-danger)', fontWeight: 700 }}>{toFa(_euNotifCount)}</span>)}
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center gap-1.5 md:justify-start md:mr-4">
          {agentMeta ? (
            <>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center md:hidden" style={{ background: `${agentMeta.color}18` }}>
                <i className={`${agentMeta.icon} text-[13px]`} style={{ color: agentMeta.color }} />
              </div>
              <span className="text-[15px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{agentMeta.title}</span>
            </>
          ) : (
            <>
              <img src={neuraLogo} alt="Neura" className="neura-logo md:hidden" style={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }} />
              <span className="text-[15px] text-[var(--aw-text-primary)] font-[Neogrey] md:hidden" style={{ fontWeight: 700 }}>neura</span>
              <span className="hidden md:block text-[15px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>
                {EU_NAV_ITEMS.find(i => i.id === euScreen)?.label || 'خانه'}
              </span>
            </>
          )}
        </div>
        <div className="flex gap-0.5 z-10 md:hidden">
          {!agentMeta && (
            <button className="w-[38px] h-[38px] rounded-[10px] bg-transparent border-none text-[var(--aw-text-secondary)] text-base cursor-pointer flex items-center justify-center hover:text-[var(--aw-eu-primary)]"
              onClick={() => openModal('تنظیمات', <EuSettingsContent />)}>
              <i className="fa-solid fa-sliders" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function EuSearchPanel() {
  const { setEuScreen, closeModal } = useApp();
  return (
    <div>
      <div className="flex flex-col gap-2">
        {[
          { icon: 'fa-solid fa-utensils', label: 'سفارش غذا', screen: 'euDineScreen' as EuScreen },
          { icon: 'fa-solid fa-store', label: 'مارکت', screen: 'euMarketScreen' as EuScreen },
          { icon: 'fa-solid fa-magnifying-glass', label: 'جستجوی پیشرفته', screen: 'euSearchScreen' as EuScreen },
        ].map(item => (
          <button key={item.screen} onClick={() => { closeModal(); setEuScreen(item.screen); }}
            className="flex items-center gap-3 p-3 rounded-[10px] border-none cursor-pointer text-right transition-all"
            style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)', color: 'var(--aw-text-primary)' }}>
            <i className={`${item.icon} w-5 text-center`} style={{ color: 'var(--aw-eu-primary)' }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ========================
// EU AI SETTINGS HUB
// ========================
function EuSettingsContent() {
  const { openModal, closeModal, showToast } = useApp();
  const handleNav = (open: () => void) => { closeModal(); setTimeout(open, 180); };
  const back = () => openModal('تنظیمات', <EuSettingsContent />);

  return (
    <div>
      {/* AI Hero banner */}
      <div className="p-4 rounded-2xl mb-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #B83D9E, #7E5FAA 60%, #3B82F6)' }}>
        <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
        <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="flex items-center gap-3 relative">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)' }}>
            <i className="fa-solid fa-wand-magic-sparkles text-[20px] text-white" />
          </div>
          <div className="flex-1">
            <div className="text-[14px] text-white" style={{ fontWeight: 800 }}>دستیار هوشمند من</div>
            <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.85)' }}>تنظیمات شخصی، پلن، کیف پول و پشتیبانی</div>
          </div>
          <div className="px-2 py-1 rounded-full text-[9px] text-white flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.22)', fontWeight: 700 }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#00E676' }} />فعال
          </div>
        </div>
      </div>

      <SettingsGroup title="حساب کاربری">
        <SettingsItem icon="fa-solid fa-user-circle" label="پروفایل من" onClick={() => handleNav(() => openModal('پروفایل من', <EuProfileBody />))} />
        <SettingsItem icon="fa-solid fa-address-book" label="مخاطبان" onClick={() => handleNav(() => openModal('مخاطبان', <EuContacts />))} />
        <SettingsItem icon="fa-solid fa-sliders" label="تنظیمات برنامه" onClick={() => handleNav(() => openModal('تنظیمات برنامه', <EuAppSettings />))} />
      </SettingsGroup>

      <SettingsGroup title="هوش مصنوعی شخصی">
        <SettingsItem icon="fa-solid fa-wand-magic-sparkles" label="تنظیمات دستیار هوشمند" onClick={() => handleNav(() => openModal('شخصی‌سازی دستیار', <CustomizeAgentContent />, back))} />
        <SettingsItem icon="fa-solid fa-robot" label="تنظیمات عامل" onClick={() => handleNav(() => openModal('تنظیمات عامل', <AgentSettingsContent onBack={back} />, back))} />
      </SettingsGroup>

      <SettingsGroup title="پرداخت و اشتراک">
        <SettingsItem icon="fa-solid fa-wallet" label="کیف پول و پرداخت" onClick={() => handleNav(() => openModal('کیف پول و پرداخت', <EuWalletSettings />))} />
        <SettingsItem icon="fa-solid fa-crown" label="اشتراک و پلن‌ها" onClick={() => handleNav(() => openModal('اشتراک و پلن‌ها', <EuSubscriptionSettings />))} />
      </SettingsGroup>

      <SettingsGroup title="پشتیبانی">
        <SettingsItem icon="fa-solid fa-life-ring" label="تنظیمات پشتیبانی" onClick={() => handleNav(() => openModal('پشتیبانی', <EuSupportSettings />))} />
      </SettingsGroup>

      <SettingsGroup title="مدیریت کسب‌وکار">
        <SettingsItem icon="fa-solid fa-briefcase" label="تنظیمات مدیریتی (شرکت، پرسنل، KPI، پلن‌ها، …)" onClick={() => handleNav(() => openModal('تنظیمات مدیریتی', <MoreScreenModal />))} />
      </SettingsGroup>

      <div className="text-[10px] text-center text-[var(--aw-text-muted)] mt-2">
        <i className="fa-solid fa-shield-halved ml-1" style={{ color: 'var(--aw-eu-primary)' }} />
        داده‌های شما به‌صورت رمزنگاری‌شده روی هوش مصنوعی شخصی شما ذخیره می‌شود
      </div>
    </div>
  );
}

function EuProfileSettings() {
  const { showToast, closeModal } = useApp();
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const r: any = await api.me();
        const us = r && r.user ? r.user : r;
        if (us) setForm({ name: us.name || '', phone: us.phone || us.username || '', email: us.email || '', address: us.address || '' });
      } catch (_) {}
    })();
  }, []);
  const u = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const saveProfile = async () => {
    setSaving(true);
    try { await api.updateMe(form); showToast('پروفایل ذخیره شد', 'success'); closeModal(); }
    catch (_) { showToast('خطا در ذخیرهٔ پروفایل', 'error'); }
    setSaving(false);
  };
  return (
    <div>
      <div className="flex flex-col items-center mb-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-[28px]" style={{ background: 'linear-gradient(135deg, #B83D9E, #7E5FAA)', fontWeight: 700 }}>{(form.name || 'ک').charAt(0)}</div>
          <button onClick={() => __pickFile('image/*', (n: string) => showToast('عکس انتخاب شد: ' + n, 'success'))} className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full border-none cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-eu-primary, #7B62FC)', border: '3px solid var(--aw-bg-card)' }}>
            <i className="fa-solid fa-camera text-[11px] text-white" />
          </button>
        </div>
        <div className="text-[13px] mt-2" style={{ fontWeight: 700 }}>{form.name}</div>
        <div className="text-[10px] text-[var(--aw-text-muted)]">کاربر Neura</div>
      </div>
      <FormGroup label="نام و نام خانوادگی"><FormInput value={form.name} onChange={(e: any) => u('name', e.target.value)} /></FormGroup>
      <FormGroup label="شماره موبایل"><FormInput value={form.phone} onChange={(e: any) => u('phone', e.target.value)} /></FormGroup>
      <FormGroup label="ایمیل"><FormInput value={form.email} onChange={(e: any) => u('email', e.target.value)} /></FormGroup>
      <FormGroup label="آدرس">
        <textarea value={form.address} onChange={e => u('address', e.target.value)} rows={3} className="w-full p-2.5 rounded-[10px] border border-[var(--aw-border)] text-[13px] text-[var(--aw-text-primary)] outline-none resize-y" style={{ background: 'var(--aw-bg-input)' }} />
      </FormGroup>
      <button className="w-full py-2.5 rounded-[10px] border-none text-white cursor-pointer text-[13px]" style={{ background: 'linear-gradient(135deg, #B83D9E, #7E5FAA)', fontWeight: 700 }} onClick={saveProfile} disabled={saving}>{saving ? 'در حال ذخیره…' : 'ذخیره تغییرات'}</button>
    </div>
  );
}

function EuWalletSettings() {
  // __realdata3
  const { showToast, walletBalance, walletTx, euProfile } = useApp() as any;
  const [tab, setTab] = useState<'cards' | 'tx' | 'subs' | 'cb'>('tx'); // rmpay: تبِ کارت‌ها حذف شد
  const [CARDS, setCARDS] = useState<any[]>([]);
  const [SUBS, setSUBS] = useState<any[]>([]);
  const __loadCards = async () => { try { const pm: any = await (api as any).myList('payment_methods'); if (Array.isArray(pm)) setCARDS(pm.map((p: any) => ({ id: p.id, bank: p.label || 'کارت', last4: p.last4 || '', color: 'linear-gradient(135deg, #1E3A8A, #3B82F6)', primary: !!p.isDefault }))); } catch (_) {} };
  useEffect(() => { __loadCards(); (async () => { try { const w: any = await (api as any).getWallet(); if (w && w.subscription) setSUBS([{ id: 'sub', name: w.subscription.plan, price: (w.subscription.price || 0).toLocaleString('fa-IR') + ' تومان', cycle: 'ماهانه', renew: (w.subscription.expiresAt ? new Date(w.subscription.expiresAt).toLocaleDateString('fa-IR') : '—'), active: true }]); else setSUBS([]); } catch (_) {} })(); }, []);
  const addCard = async () => { const bank = (typeof window !== 'undefined' && window.prompt) ? window.prompt('نام بانک/کارت:') : ''; if (!bank || !bank.trim()) return; const l4 = (typeof window !== 'undefined' && window.prompt) ? window.prompt('۴ رقمِ آخرِ کارت:') : ''; const last4 = String(l4 || '').replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/\D/g, '').slice(-4); try { await (api as any).myCreate('payment_methods', { id: 'pm_' + Date.now(), type: 'card', label: bank.trim(), last4, isDefault: CARDS.length === 0 }); showToast('کارت افزوده شد'); __loadCards(); } catch (_) { showToast('خطا در افزودن کارت'); } };
  const TX = (walletTx || []).map((t: any, i: number) => ({ id: 't' + i, title: t.title || '', amount: t.amount, date: t.date || '', type: t.type || 'spend' }));
  const CASHBACK_LEVELS = [
    { name: 'برنزی', rate: '۲٪', from: 0, to: 1000000, color: '#B45309' },
    { name: 'نقره‌ای', rate: '۳.۵٪', from: 1000000, to: 5000000, color: '#9CA3AF' },
    { name: 'طلایی', rate: '۵٪', from: 5000000, to: 20000000, color: '#F59E0B' },
  ];
  const [cashbackEarned, setCashbackEarned] = useState(0);
  useEffect(() => { (async () => { try { const w: any = await (api as any).getWallet(); if (w && typeof w.cashback === 'number') setCashbackEarned(w.cashback); } catch (_) {} })(); }, []);
  const TABS = [
    { id: 'tx' as const, label: 'تراکنش‌ها', icon: 'fa-solid fa-right-left' },
    { id: 'subs' as const, label: 'اشتراک‌ها', icon: 'fa-solid fa-repeat' },
    { id: 'cb' as const, label: 'کش‌بک', icon: 'fa-solid fa-gift' },
  ];
  const fmt = (n: number) => (n < 0 ? '-' : '+') + Math.abs(n).toLocaleString('fa-IR');

  return (
    <div>
      <div className="p-4 rounded-2xl mb-3 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #7E5FAA, #B83D9E)' }}>
        <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.7)' }}>موجودی کیف پول</div>
        <div className="text-[24px] text-white mt-1" style={{ fontWeight: 800, direction: 'ltr' }}>{walletBalance.toLocaleString('fa-IR')} <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>تومان</span></div>
      </div>

      <div className="grid grid-cols-4 gap-1 p-1 rounded-[10px] mb-3" style={{ background: 'var(--aw-bg-hover)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="py-2 rounded-lg border-none cursor-pointer flex flex-col items-center gap-1 transition-all" style={tab === t.id ? { background: 'var(--aw-eu-primary, #7B62FC)', color: '#fff', fontWeight: 700 } : { background: 'transparent', color: 'var(--aw-text-muted)' }}>
            <i className={`${t.icon} text-[12px]`} />
            <span className="text-[10px]">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'cards' && (
        <div className="flex flex-col gap-2">
          {CARDS.map(c => (
            <div key={c.id} className="p-3.5 rounded-2xl text-white relative overflow-hidden" style={{ background: c.color }}>
              <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div className="flex items-center justify-between relative">
                <div className="text-[11px]" style={{ fontWeight: 700, opacity: 0.85 }}>بانک {c.bank}</div>
                {c.primary && <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>پیش‌فرض</span>}
              </div>
              <div className="text-[16px] mt-3 tracking-widest" style={{ direction: 'ltr', fontWeight: 700 }}>•••• •••• •••• {c.last4}</div>
              <div className="text-[10px] mt-1" style={{ opacity: 0.7 }}>به نام {(euProfile && euProfile.name) || 'صاحب کارت'}</div>
            </div>
          ))}
          <button onClick={addCard} className="py-3 rounded-[10px] border-2 border-dashed cursor-pointer text-[12px]" style={{ borderColor: 'var(--aw-eu-primary)', background: 'transparent', color: 'var(--aw-eu-primary)', fontWeight: 700 }}>
            <i className="fa-solid fa-plus ml-1" />افزودن کارت جدید
          </button>
        </div>
      )}

      {tab === 'tx' && (
        <div className="flex flex-col gap-1.5">
          {TX.map(t => {
            const cfg: Record<string, { bg: string; color: string; icon: string }> = {
              spend: { bg: '#EF444415', color: '#EF4444', icon: 'fa-solid fa-arrow-up' },
              topup: { bg: '#10B98115', color: '#10B981', icon: 'fa-solid fa-arrow-down' },
              sub: { bg: '#3B82F615', color: '#3B82F6', icon: 'fa-solid fa-repeat' },
              cb: { bg: '#B83D9E15', color: '#B83D9E', icon: 'fa-solid fa-gift' },
            };
            const c = cfg[t.type];
            return (
              <div key={t.id} className="flex items-center gap-2.5 p-3 rounded-[10px]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: c.bg }}>
                  <i className={`${c.icon} text-[12px]`} style={{ color: c.color }} />
                </div>
                <div className="flex-1">
                  <div className="text-[12px]" style={{ fontWeight: 600 }}>{t.title}</div>
                  <div className="text-[10px] text-[var(--aw-text-muted)]">{t.date}</div>
                </div>
                <div className="text-[12px]" style={{ fontWeight: 700, color: t.amount < 0 ? '#EF4444' : '#10B981', direction: 'ltr' }}>{fmt(t.amount)}</div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'subs' && (
        <div className="flex flex-col gap-2">
          {SUBS.map(s => (
            <div key={s.id} className="p-3 rounded-[10px] flex items-center gap-3" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)', opacity: s.active ? 1 : 0.55 }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: s.active ? 'linear-gradient(135deg, #B83D9E, #7E5FAA)' : 'var(--aw-bg-input)' }}>
                <i className="fa-solid fa-cube text-[14px] text-white" />
              </div>
              <div className="flex-1">
                <div className="text-[12px]" style={{ fontWeight: 700 }}>{s.name}</div>
                <div className="text-[10px] text-[var(--aw-text-muted)]">{s.cycle} • تمدید: {s.renew}</div>
              </div>
              <div className="text-left">
                <div className="text-[11px]" style={{ fontWeight: 700, color: 'var(--aw-eu-primary)' }}>{s.price}</div>
                <div className="text-[9px] mt-0.5" style={{ color: s.active ? '#10B981' : '#6B7280', fontWeight: 700 }}>{s.active ? 'فعال' : 'لغو شده'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'cb' && (
        <div className="flex flex-col gap-3">
          <div className="p-4 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, #F59E0B, #B45309)' }}>
            <i className="fa-solid fa-gift text-[20px] text-white mb-1" />
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.85)' }}>کل کش‌بک کسب‌شده</div>
            <div className="text-[20px] text-white mt-0.5" style={{ fontWeight: 800 }}>{cashbackEarned.toLocaleString('fa-IR')} <span className="text-[11px]">تومان</span></div>
          </div>
          <div className="text-[11px] text-[var(--aw-text-muted)] px-1" style={{ fontWeight: 600 }}>سطوح کش‌بک</div>
          {CASHBACK_LEVELS.map((l, i) => (
            <div key={i} className="p-3 rounded-[10px] flex items-center gap-3" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${l.color}22` }}>
                <i className="fa-solid fa-medal text-[14px]" style={{ color: l.color }} />
              </div>
              <div className="flex-1">
                <div className="text-[12px]" style={{ fontWeight: 700 }}>{l.name}</div>
                <div className="text-[10px] text-[var(--aw-text-muted)]">از {l.from.toLocaleString('fa-IR')} تا {l.to.toLocaleString('fa-IR')} تومان</div>
              </div>
              <div className="text-[13px]" style={{ fontWeight: 800, color: l.color }}>{l.rate}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EuSubscriptionSettings() {
  // پلن‌ها از سوپرادمین (settings.neuraPlans) — نه هاردکدِ کلاینت. fallback: PLANSِ پیش‌فرض.
  const [__saPlans, __setSaPlans] = useState<any[] | null>(null);
  useEffect(() => { (async () => { try { const st: any = await (api as any).getSettings(); if (st && Array.isArray(st.neuraPlans) && st.neuraPlans.length) __setSaPlans(st.neuraPlans); } catch (_e) {} })(); }, []);
  const { showToast, setWalletBalance, agents } = useApp();
  const [sub, setSub] = useState<any>(null);
  useEffect(() => { (async () => { try { const w: any = await (api as any).getWallet(); if (w) setSub(w.subscription || null); } catch (_) {} })(); }, []);
  const [aiUsage, setAiUsage] = useState<any>({ used: 0, total: 10000, tokens: '۰', limit: '۱۰,۰۰۰' });
  useEffect(() => { (async () => { try { const u: any = await (api as any).usage(); if (u && typeof u.used === 'number') setAiUsage({ used: u.used, total: 10000, tokens: u.used.toLocaleString('fa-IR'), limit: '۱۰,۰۰۰' }); } catch (_) {} })(); }, []);
  const percent = (aiUsage.used / aiUsage.total) * 100;
  const curPlan = sub?.planId || 'free';
  const PLANS = [
    { id: 'free', name: 'پایه', price: 'رایگان', priceNum: 0, tokens: '۲,۰۰۰ توکن', features: ['دستیار پایه', 'پشتیبانی ایمیلی'], color: '#6B7280' },
    { id: 'pro', name: 'Neura Pro', price: '۱۴۹,۰۰۰ / ماه', priceNum: 149000, tokens: '۱۰,۰۰۰ توکن', features: ['دستیار پیشرفته', 'صدای پریمیوم', 'پشتیبانی ۲۴/۷'], color: '#B83D9E' },
    { id: 'max', name: 'Neura Max', price: '۳۹۹,۰۰۰ / ماه', priceNum: 399000, tokens: 'نامحدود', features: ['همه ایجنت‌ها', 'API دسترسی', 'آموزش اختصاصی'], color: '#F59E0B' },
  ].map(p => ({ ...p, current: p.id === curPlan }));
  const buyPlan = async (p: any) => {
    if (p.current) return;
    if (p.priceNum > 0 && typeof window !== 'undefined' && window.confirm && !window.confirm(`ارتقا به ${p.name} و کسرِ ${p.priceNum.toLocaleString('fa-IR')} تومان از کیف‌پول؟`)) return;
    try {
      const w: any = await (api as any).walletSubscribe(p.name, p.priceNum, { planId: p.id, months: 1 });
      if (w && w.subscription) setSub(w.subscription);
      if (w && typeof w.balance === 'number' && setWalletBalance) setWalletBalance(w.balance);
      showToast('اشتراک فعال شد', 'success');
    } catch (e: any) { showToast(e && e.status === 402 ? 'موجودی کیف‌پول کافی نیست' : 'خطا در خرید اشتراک'); }
  };
  return (
    <div>
      {/* mysubs: my agents list — ایجنت‌های من + اعتبار */}
      {Array.isArray(agents) && agents.filter((a: any) => a && a.id !== 'assistant').length > 0 && (
        <div className="mb-4">
          <div className="text-[11px] text-[var(--aw-text-muted)] mb-2 px-1" style={{ fontWeight: 600 }}>ایجنت‌های من</div>
          <div className="flex flex-col gap-2">
            {agents.filter((a: any) => a && a.id !== 'assistant').map((a: any) => {
              const exp = a.expiresAt ? (() => { try { return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(a.expiresAt)); } catch (e) { return ''; } })() : '';
              return (
                <div key={a.id} className="p-3 rounded-[10px] flex items-center gap-2.5" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)', opacity: a.expired ? 0.6 : 1 }}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-[13px] flex-shrink-0 ${a.bg || 'aw-bg-purple'}`} style={{ fontWeight: 700 }}>{a.init || (a.name || 'ا').charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] truncate" style={{ fontWeight: 700 }}>{a.name}</div>
                    <div className="text-[10.5px] text-[var(--aw-text-muted)] truncate">{a.role || ''}</div>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <div className="text-[9.5px] text-[var(--aw-text-muted)]">اعتبار تا</div>
                    <div className="text-[11px]" style={{ fontWeight: 700, color: a.expired ? 'var(--aw-danger, #ef4444)' : 'var(--aw-eu-primary)' }}>{exp || 'نامحدود'}</div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: a.expired ? 'rgba(239,68,68,0.14)' : 'rgba(16,185,129,0.14)', color: a.expired ? '#ef4444' : '#10B981', fontWeight: 700 }}>{a.expired ? 'منقضی' : 'فعال'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="p-4 rounded-2xl mb-3" style={{ background: 'linear-gradient(135deg, #B83D9E, #7E5FAA)' }}>
        <div className="flex items-center gap-2 mb-2">
          <i className="fa-solid fa-crown text-white text-[14px]" />
          <span className="text-[12px] text-white" style={{ fontWeight: 700 }}>پلن فعلی شما</span>
          <span className="mr-auto text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.22)', color: '#fff', fontWeight: 700 }}>فعال</span>
        </div>
        <div className="text-[18px] text-white" style={{ fontWeight: 800 }}>{sub?.plan || 'پایه (رایگان)'}</div>
        <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.75)' }}>{sub?.expiresAt ? ('تمدید در ' + new Date(sub.expiresAt).toLocaleDateString('fa-IR')) : 'بدون اشتراک فعال'}</div>
      </div>

      <div className="p-3.5 rounded-[10px] mb-3" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-bolt text-[12px]" style={{ color: '#F59E0B' }} />
            <span className="text-[12px]" style={{ fontWeight: 700 }}>مصرف هوش مصنوعی</span>
          </div>
          <span className="text-[11px]" style={{ fontWeight: 700, color: 'var(--aw-eu-primary)' }}>{aiUsage.tokens} / {aiUsage.limit}</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--aw-bg-input)' }}>
          <div className="h-full rounded-full" style={{ width: `${percent}%`, background: 'linear-gradient(90deg, #B83D9E, #F59E0B)' }} />
        </div>
        <div className="text-[10px] text-[var(--aw-text-muted)] mt-1.5">{toFa(Math.round(percent))}٪ از ظرفیت ماهانه شما مصرف شده است</div>
      </div>

      <div className="text-[11px] text-[var(--aw-text-muted)] mb-2 px-1" style={{ fontWeight: 600 }}>ارتقا پلن</div>
      <div className="flex flex-col gap-2">
        {(__saPlans && __saPlans.length ? __saPlans : PLANS).map((p: any) => (
          <div key={p.id} className="p-3 rounded-[10px]" style={{ background: 'var(--aw-bg-card)', border: `1px solid ${p.current ? p.color : 'var(--aw-border)'}` }}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${p.color}22` }}>
                <i className="fa-solid fa-cube text-[12px]" style={{ color: p.color }} />
              </div>
              <span className="text-[13px] flex-1" style={{ fontWeight: 700 }}>{p.name}</span>
              <span className="text-[12px]" style={{ fontWeight: 700, color: p.color }}>{p.price}</span>
            </div>
            <div className="text-[10px] text-[var(--aw-text-muted)] mb-1.5">{p.tokens}</div>
            <div className="flex flex-wrap gap-1 mb-2">
              {p.features.map((f, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-md" style={{ background: 'var(--aw-bg-input)', color: 'var(--aw-text-secondary)' }}>✓ {f}</span>
              ))}
            </div>
            <button disabled={p.current} onClick={() => buyPlan(p)} className="w-full py-2 rounded-lg border-none cursor-pointer text-[11px] text-white" style={{ background: p.current ? '#6B7280' : p.color, fontWeight: 700, opacity: p.current ? 0.6 : 1 }}>
              {p.current ? 'پلن فعلی' : 'ارتقا به این پلن'}
            </button>
          </div>
        ))}
      </div>

      {/* ── Separate category: Promotion ── */}
      <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--aw-border)' }}>
        <div className="flex items-center gap-2 mb-2.5 px-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(123,98,252,0.14)' }}>
            <i className="fa-solid fa-bolt text-[12px]" style={{ color: '#7B62FC' }} />
          </div>
          <div>
            <div className="text-[12.5px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>خرید پروموشن</div>
            <div className="text-[9.5px] text-[var(--aw-text-muted)]">دسته‌ی جدا در مدیریت پلن‌ها</div>
          </div>
        </div>
        <EuPromotionSettings />
      </div>
    </div>
  );
}

function EuPromotionSettings() {
  const { showToast, promotedMarket, setPromotedMarket, setWalletBalance } = useApp();
  const [__promoShops, __setPromoShops] = useState<any[]>([]);
  const [__promoPrice, __setPromoPrice] = useState<number>(49000);
  useEffect(() => { (async () => {
    try { const sh: any = await (api as any).marketShops(); if (Array.isArray(sh)) __setPromoShops(sh.map((c: any) => ({ key: 'shop:' + (c.name || 'فروشگاه'), kind: 'فروشگاه', name: c.name || 'فروشگاه', icon: 'fa-solid fa-store', color: '#3B82F6' }))); } catch (_e) {}
    try { const st: any = await (api as any).getSettings(); if (st && typeof st.promoMonthlyPrice === 'number') __setPromoPrice(st.promoMonthlyPrice); } catch (_e) {}
  })(); }, []);
  return (
    <div>
      <div className="p-3.5 rounded-2xl mb-3 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #7B62FC, #9D7BFF)' }}>
        <i className="fa-solid fa-bolt absolute -left-2 -top-2 text-[60px] text-white/10" />
        <div className="flex items-center gap-2 mb-1">
          <i className="fa-solid fa-bolt text-white text-[13px]" />
          <span className="text-[12.5px] text-white" style={{ fontWeight: 800 }}>اشتراک پروموشن</span>
        </div>
        <div className="text-[10px] leading-5" style={{ color: 'rgba(255,255,255,0.82)' }}>
          فروشگاه یا محصولی که پروموشن آن را فعال کنید، در «فروشگاه‌ها» و «کاتالوگ» مارکت ابتدا و به‌صورت ویژه نمایش داده می‌شود.
        </div>
        <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', fontWeight: 700 }}>
          <i className="fa-solid fa-tag text-[8px]" /> {__promoPrice.toLocaleString('fa-IR')} تومان / ماه برای هر مورد
        </div>
      </div>

      <div className="text-[11px] text-[var(--aw-text-muted)] mb-2 px-1" style={{ fontWeight: 600 }}>انتخاب فروشگاه یا محصول برای پروموشن</div>
      <div className="flex flex-col gap-1.5">
        {__promoShops.length === 0 && (<div className="text-center text-[12px] text-[var(--aw-text-muted)] py-8">فروشگاهی برای پروموشن نیست.</div>)}
        {__promoShops.map((it: any) => {
          const active = promotedMarket.includes(it.key);
          return (
            <div key={it.key} className="flex items-center gap-2.5 p-2.5 rounded-[10px] border" style={{ background: 'var(--aw-bg-card)', borderColor: active ? 'rgba(123,98,252,0.5)' : 'var(--aw-border)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ background: it.color }}>
                <i className={`${it.icon} text-[13px]`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-[var(--aw-text-primary)] truncate" style={{ fontWeight: 700 }}>{it.name}</div>
                <div className="text-[9.5px] text-[var(--aw-text-muted)]">{it.kind}</div>
              </div>
              <button
                onClick={async () => {
                  if (active) { setPromotedMarket(prev => prev.filter(k => k !== it.key)); showToast('پروموشن لغو شد', 'info'); return; }
                  try {
                    const w: any = await (api as any).walletWithdraw(__promoPrice);
                    if (w && typeof w.balance === 'number' && setWalletBalance) setWalletBalance(w.balance);
                    setPromotedMarket(prev => [...prev, it.key]);
                    showToast(`پروموشن ${it.name} فعال شد (${__promoPrice.toLocaleString('fa-IR')} تومان کسر شد)`, 'success');
                  } catch (e: any) { showToast(e && e.status === 402 ? 'موجودی کیف‌پول کافی نیست' : 'خطا در فعال‌سازی پروموشن'); }
                }}
                className="py-1.5 px-3 rounded-lg border-none text-[10.5px] cursor-pointer flex items-center gap-1 flex-shrink-0 text-white"
                style={active ? { background: '#10B981', fontWeight: 700 } : { background: '#7B62FC', fontWeight: 700 }}>
                <i className={`fa-solid ${active ? 'fa-circle-check' : 'fa-bolt'} text-[9px]`} />
                {active ? 'فعال' : 'خرید پروموشن'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EuSupportSettings() {
  const { openModal, closeModal, showToast } = useApp();
  const FAQS = [
    { q: 'چگونه می‌توانم دستیار هوشمندم را شخصی‌سازی کنم؟', a: 'از تنظیمات > دستیار هوشمند می‌توانید عکس، جنسیت، صدا، لحن و سن آن را تغییر دهید.' },
    { q: 'مصرف توکن چگونه محاسبه می‌شود؟', a: 'هر پیام یا درخواست شما بر اساس طول و پیچیدگی توکن مصرف می‌کند.' },
    { q: 'چطور پلن خود را ارتقا دهم؟', a: 'از مسیر تنظیمات > اشتراک و پلن‌ها پلن دلخواه را انتخاب کنید.' },
    { q: 'آیا کش‌بک قابل برداشت است؟', a: 'بله، پس از رسیدن به سقف ۱۰۰هزار تومان قابل برداشت یا استفاده در خرید است.' },
  ];
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div>
      <div className="p-3.5 rounded-2xl mb-3" style={{ background: 'linear-gradient(135deg, #3B82F6, #1E40AF)' }}>
        <div className="flex items-center gap-2.5">
          <i className="fa-solid fa-life-ring text-[18px] text-white" />
          <div className="flex-1">
            <div className="text-[12px] text-white" style={{ fontWeight: 800 }}>پشتیبانی ۲۴/۷</div>
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.8)' }}>میانگین زمان پاسخ: کمتر از ۳ دقیقه</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <button onClick={() => { closeModal(); setTimeout(() => openModal('گزارش مشکل', <EuReportProblem />), 180); }} className="p-3 rounded-[10px] border cursor-pointer flex flex-col items-center gap-1.5" style={{ background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)' }}>
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: '#EF444422' }}>
            <i className="fa-solid fa-triangle-exclamation text-[14px]" style={{ color: '#EF4444' }} />
          </div>
          <span className="text-[11px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>گزارش مشکل</span>
        </button>
        <button onClick={() => openModal('پشتیبانی نورا', <div className="p-4 text-[13px] text-[var(--aw-text-secondary)]" style={{ lineHeight: 2 }}>تیم پشتیبانی نورا ۲۴ ساعته پاسخ‌گوست.<br />تلفن: ۰۲۱-۹۱۰۰۰۰۰۰<br />ایمیل: support@neura.app<br />همچنین می‌توانید از بخش «پشتیبانی» تیکت ثبت کنید.</div>)} className="p-3 rounded-[10px] border cursor-pointer flex flex-col items-center gap-1.5" style={{ background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)' }}>
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: '#10B98122' }}>
            <i className="fa-solid fa-headset text-[14px]" style={{ color: '#10B981' }} />
          </div>
          <span className="text-[11px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>تماس با پشتیبانی</span>
        </button>
      </div>

      <div className="text-[11px] text-[var(--aw-text-muted)] mb-2 px-1" style={{ fontWeight: 600 }}>سوالات متداول (FAQ)</div>
      <div className="flex flex-col gap-1.5">
        {FAQS.map((f, i) => (
          <div key={i} className="rounded-[10px] overflow-hidden" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full p-3 flex items-center gap-2 cursor-pointer border-none bg-transparent text-right">
              <i className="fa-solid fa-circle-question text-[12px]" style={{ color: 'var(--aw-eu-primary)' }} />
              <span className="flex-1 text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{f.q}</span>
              <i className={`fa-solid fa-chevron-${open === i ? 'up' : 'down'} text-[10px] text-[var(--aw-text-muted)]`} />
            </button>
            {open === i && (
              <div className="px-3 pb-3 text-[11px] text-[var(--aw-text-secondary)]" style={{ lineHeight: 1.7 }}>{f.a}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EuReportProblem() {
  const { showToast, closeModal } = useApp();
  const [cat, setCat] = useState('عملکرد دستیار');
  const [desc, setDesc] = useState('');
  const CATS = ['عملکرد دستیار', 'پرداخت', 'اپلیکیشن', 'حساب کاربری', 'دیگر'];
  return (
    <div>
      <div className="p-3 rounded-[10px] mb-3 flex items-center gap-2" style={{ background: '#EF444415', border: '1px solid #EF444433' }}>
        <i className="fa-solid fa-info-circle text-[12px]" style={{ color: '#EF4444' }} />
        <span className="text-[10px] text-[var(--aw-text-secondary)]">مشکل خود را با جزئیات شرح دهید تا سریع‌تر بررسی شود</span>
      </div>
      <FormGroup label="دسته‌بندی مشکل">
        <div className="flex gap-1.5 flex-wrap">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)} className="text-[11px] px-3 py-1.5 rounded-full border-none cursor-pointer" style={cat === c ? { background: 'var(--aw-eu-primary, #7B62FC)', color: '#fff', fontWeight: 600 } : { background: 'var(--aw-bg-card)', color: 'var(--aw-text-secondary)', border: '1px solid var(--aw-border)' }}>{c}</button>
          ))}
        </div>
      </FormGroup>
      <FormGroup label="شرح مشکل">
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={5} placeholder="توضیح دهید چه اتفاقی افتاد..." className="w-full p-2.5 rounded-[10px] border border-[var(--aw-border)] text-[13px] text-[var(--aw-text-primary)] outline-none resize-y" style={{ background: 'var(--aw-bg-input)' }} />
      </FormGroup>
      <button onClick={() => { if (!desc.trim()) { showToast('توضیح را وارد کنید', 'error'); return; } try { (api as any).myCreate('reports', { category: cat, desc: desc.trim(), at: new Date().toISOString() }); } catch (_) {} showToast('گزارش شما ارسال شد', 'success'); setDesc(''); closeModal(); }} className="w-full py-2.5 rounded-[10px] border-none text-white cursor-pointer text-[13px]" style={{ background: 'linear-gradient(135deg, #B83D9E, #7E5FAA)', fontWeight: 700 }}>ارسال گزارش</button>
    </div>
  );
}

function WalletModal() {
  const { showToast, closeModal, walletBalance, walletTx, walletDeposit, walletWithdraw } = useApp();
  const [walletTab, setWalletTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');

  // walletdefaults: quick amounts — دکمه‌های واریز از settings.walletQuickAmounts (سوپرادمین) می‌آیند.
  const [depositQuick, setDepositQuick] = useState<string[]>(['۱,۰۰۰,۰۰۰', '۲,۰۰۰,۰۰۰', '۵,۰۰۰,۰۰۰', '۱۰,۰۰۰,۰۰۰']);
  useEffect(() => { (async () => {
    try { const st: any = await (api as any).getSettings();
      if (Array.isArray(st?.walletQuickAmounts) && st.walletQuickAmounts.length)
        setDepositQuick(st.walletQuickAmounts.map((n: any) => toFa(Number(n).toLocaleString('en-US'))));
    } catch (_) {}
  })(); }, []);
  const QUICK_AMOUNTS = walletTab === 'deposit'
    ? depositQuick
    : ['۱۰۰,۰۰۰', '۵۰۰,۰۰۰', '۱,۰۰۰,۰۰۰', '۲,۰۰۰,۰۰۰'];
  const TRANSACTIONS = (walletTx || []).slice(0, 12).map((t: any, i: number) => ({ id: t.id || i, title: t.title, amount: (t.amount >= 0 ? '+' : '-') + Math.abs(t.amount).toLocaleString('fa-IR'), date: t.date, type: (t.amount >= 0 ? 'deposit' : 'withdraw') as 'deposit' | 'withdraw' }));

  return (
    <div className="flex flex-col gap-4">
      {/* Balance */}
      <div className="p-4 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, var(--aw-eu-primary-dark), var(--aw-eu-primary))' }}>
        <p className="text-[11px] m-0" style={{ color: 'rgba(255,255,255,0.6)' }}>موجودی فعلی</p>
        <h2 className="text-[24px] text-white m-0 mt-1" style={{ fontWeight: 800, direction: 'ltr' }}>{walletBalance.toLocaleString('fa-IR')} <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>تومان</span></h2>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-[10px]" style={{ background: 'var(--aw-bg-hover)' }}>
        <button
          className="flex-1 py-2.5 rounded-lg border-none cursor-pointer text-[13px] flex items-center justify-center gap-1.5 transition-all"
          style={walletTab === 'deposit' ? { background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', fontWeight: 700 } : { background: 'transparent', color: 'var(--aw-text-muted)', fontWeight: 500 }}
          onClick={() => setWalletTab('deposit')}
        >
          <i className="fa-solid fa-arrow-down text-[11px]" />
          واریز
        </button>
        <button
          className="flex-1 py-2.5 rounded-lg border-none cursor-pointer text-[13px] flex items-center justify-center gap-1.5 transition-all"
          style={walletTab === 'withdraw' ? { background: 'linear-gradient(135deg, #F97316, #EA580C)', color: '#fff', fontWeight: 700 } : { background: 'transparent', color: 'var(--aw-text-muted)', fontWeight: 500 }}
          onClick={() => setWalletTab('withdraw')}
        >
          <i className="fa-solid fa-arrow-up text-[11px]" />
          برداشت
        </button>
      </div>

      {/* Amount input */}
      <div className="flex flex-col gap-2">
        <label className="text-[12px] text-[var(--aw-text-muted)]" style={{ fontWeight: 600 }}>
          {walletTab === 'deposit' ? 'مبلغ واریز (تومان)' : 'مبلغ برداشت (تومان)'}
        </label>
        <input
          type="text"
          value={amount}
          onChange={e => setAmount(__grpFa(e.target.value))}
          placeholder="مبلغ را وارد کنید"
          className="w-full p-3 rounded-[10px] border text-[14px] text-[var(--aw-text-primary)] outline-none"
          style={{ background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)', direction: 'rtl', fontWeight: 600 }}
        />
        {/* Quick amounts */}
        <div className="flex gap-2 flex-wrap">
          {QUICK_AMOUNTS.map(qa => (
            <button
              key={qa}
              className="px-3 py-1.5 rounded-lg border cursor-pointer text-[11px] transition-all hover:border-[var(--aw-eu-primary)]"
              style={{ background: amount === qa ? 'rgba(126,95,170,0.15)' : 'var(--aw-bg-card)', borderColor: amount === qa ? 'var(--aw-eu-primary)' : 'var(--aw-border)', color: amount === qa ? 'var(--aw-eu-primary)' : 'var(--aw-text-muted)', fontWeight: 600 }}
              onClick={() => setAmount(qa)}
            >
              {qa}
            </button>
          ))}
        </div>
      </div>

      {/* Submit button */}
      <button
        onClick={() => { const _a = parseInt(String(amount).replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^\d]/g, ''), 10); if (!_a || _a <= 0) { showToast('مبلغ را وارد کنید'); return; } (walletTab === 'deposit' ? walletDeposit(_a) : walletWithdraw(_a)); closeModal(); /* toastِ نتیجه داخلِ walletDeposit/withdraw بعد از تأییدِ سرور */ }}
        className="w-full py-3 rounded-[10px] border-none cursor-pointer text-white text-[14px] transition-all"
        style={{
          background: walletTab === 'deposit' ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #F97316, #EA580C)',
          fontWeight: 700,
          opacity: amount ? 1 : 0.5,
        }}
      >
        <i className={`fa-solid ${walletTab === 'deposit' ? 'fa-arrow-down' : 'fa-arrow-up'} text-[12px] ml-1.5`} />
        {walletTab === 'deposit' ? 'واریز به کیف پول' : 'برداشت از کیف پول'}
      </button>

      {/* Recent transactions */}
      <div className="flex flex-col gap-2 mt-1">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-clock-rotate-left text-[12px] text-[var(--aw-eu-primary)]" />
          <span className="text-[12px] text-[var(--aw-text-muted)]" style={{ fontWeight: 600 }}>تراکنش‌های اخیر</span>
        </div>
        {TRANSACTIONS.map(tx => (
          <div key={tx.id} className="flex items-center gap-3 p-3 rounded-[10px]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: tx.type === 'deposit' ? 'rgba(16,185,129,0.12)' : 'rgba(249,115,22,0.12)' }}>
              <i className={`fa-solid ${tx.type === 'deposit' ? 'fa-arrow-down' : 'fa-arrow-up'} text-[12px]`} style={{ color: tx.type === 'deposit' ? '#10B981' : '#F97316' }} />
            </div>
            <div className="flex-1">
              <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{tx.title}</span>
              <p className="text-[10px] text-[var(--aw-text-muted)] m-0 mt-0.5">{tx.date}</p>
            </div>
            <span className="text-[13px]" style={{ fontWeight: 700, color: tx.type === 'deposit' ? '#10B981' : '#F97316', direction: 'ltr' }}>{tx.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// وضعیتِ سفارش به فارسی (هر دو واژگانِ مارکت و آشپزخانهٔ داین)
const __EU_ORD_FA: Record<string, string> = {
  pending: 'در انتظار تایید', preparing: 'در حال آماده‌سازی', confirmed: 'تایید شد', shipping: 'در حال ارسال',
  delivering: 'در حال ارسال', delivered: 'تحویل شده', cancelled: 'لغو شده',
  received: 'ثبت شد', cooking: 'در حال آماده‌سازی', ready: 'آماده', served: 'سرو شد', paid: 'تسویه‌شده',
};
const __euActiveOrder = (o: any) => ['pending', 'preparing', 'confirmed', 'shipping', 'delivering', 'received', 'cooking', 'ready'].includes(String(o && o.status));
const __euFmtDate = (d: any) => /^\d{4}-\d{2}-\d{2}T/.test(String(d)) ? new Date(d).toLocaleString('fa-IR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (d || '');
// اعلان‌های واقعی از دادهٔ خودِ کاربر: سفارش‌های فعال + یادآوری‌های تقویم + کارهای بازِ روزمرگی + اعلان‌های ذخیره‌شده.
function buildEuFeed({ stored, calendar, tasks, orders }: { stored: any[]; calendar: any[]; tasks: any[]; orders: any[] }) {
  const out: any[] = [];
  (orders || []).filter(__euActiveOrder).forEach((o: any) => out.push({
    id: 'ord_' + o.id, type: 'order', icon: orderIcon(o).icon,
    title: 'سفارش ' + (o.num ? '#' + o.num : '') + (o.source === 'dine' ? ' (غذا)' : ' (مارکت)'),
    desc: __EU_ORD_FA[String(o.status)] || String(o.status || ''), time: __euFmtDate(o.date), _sort: 4,
  }));
  (calendar || []).filter((e: any) => e && !e.done && e.status !== 'done' && e.status !== 'cancelled' && (e.title)).forEach((e: any) => out.push({
    id: 'cal_' + e.id, type: 'reminder', icon: 'fa-solid fa-bell',
    title: e.title, desc: [e.date, e.time].filter(Boolean).join(' · ') || 'یادآوریِ روزمرگی', time: e.time || '', _sort: 3,
  }));
  (tasks || []).filter((t: any) => t && !t.done && t.status !== 'done' && t.title).slice(0, 20).forEach((t: any) => out.push({
    id: 'task_' + t.id, type: 'task', icon: 'fa-solid fa-list-check',
    title: t.title, desc: 'کارِ بازِ روزمرگی' + (t.dueDate ? ' · ' + t.dueDate : ''), time: '', _sort: 2,
  }));
  (stored || []).forEach((n: any) => out.push({ ...n, type: (n.type || 'info'), target: (n.target || ''), _sort: (n.type === 'order' || n.type === 'chat') ? 4 : 1 }));
  return out.sort((a, b) => (b._sort || 0) - (a._sort || 0));
}

function EuNotifications() {
  const { closeModal, openChat, setEuScreen, agents, euPlacedOrders } = useApp() as any;

  const __appN = useApp() as any; const __coN = __appN.company; const __roleN = __appN.role;
  const [__stored, setStored] = useState<any[]>([]);
  const [__cal, setCal] = useState<any[]>([]);
  const [__tasks, setTasks] = useState<any[]>([]);
  useEffect(() => { (async () => {
    try { const v: any = __roleN === 'user' ? await (api as any).myList('notifications') : await (api as any).list('notifications', __coN); if (Array.isArray(v)) setStored(v.slice().reverse()); } catch (_) {}
    if (__roleN === 'user') {
      try { const c: any = await (api as any).myList('calendar'); if (Array.isArray(c)) setCal(c); } catch (_) {}
      try { const t: any = await (api as any).myList('tasks'); if (Array.isArray(t)) setTasks(t); } catch (_) {}
    }
  })(); }, [__coN, __roleN]);
  const euNotifs: any[] = buildEuFeed({ stored: __stored, calendar: __cal, tasks: __tasks, orders: (euPlacedOrders || []) });

  return (
    <div>
      {euNotifs.length === 0 && (
        <div className="text-center text-[13px] text-[var(--aw-text-muted)] py-16">
          <i className="fa-regular fa-bell-slash text-[26px] mb-2 block opacity-60" />
          هنوز اعلانی نداری.
        </div>
      )}
      {euNotifs.map(n => (
        <div key={n.id} className="flex items-start gap-2.5 p-3 rounded-[10px] mb-1.5 cursor-pointer border border-[var(--aw-border)] transition-all hover:border-[var(--aw-eu-primary)]" style={{ background: 'var(--aw-bg-card)' }}
          onClick={() => {
            closeModal();
            if (n.type === 'chat') {
              const a = agents.find((x: any) => x.id === n.target);
              if (a && !a.locked) setTimeout(() => openChat(n.target, 'eu'), 200);
            } else if (n.type === 'order') {
              openMarketOrders(setEuScreen);
            } else if (n.type === 'reminder' || n.type === 'task') {
              setEuScreen('euPlannerScreen');
            }
          }}>
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(8px)' }}>
            {NOTIF_ICON_SRC[n.icon]
              ? <img src={NOTIF_ICON_SRC[n.icon]} alt="" className="nav-icon-img" style={{ width: 22, height: 22, objectFit: 'contain' }} />
              : <i className={`${n.icon} text-sm`} style={{ color: 'var(--aw-eu-primary)' }} />}
          </div>
          <div className="flex-1">
            <div className="text-[13px] mb-0.5" style={{ fontWeight: 600 }}>{n.title}</div>
            <div className="text-[11px] text-[var(--aw-text-secondary)]">{n.desc}</div>
            <div className="text-[10px] text-[var(--aw-text-muted)] mt-1">{n.time}</div>
            {(n.type === 'chat' || n.type === 'order' || n.type === 'reminder' || n.type === 'task') && (
              <span className="text-[11px] text-[var(--aw-eu-primary)] mt-1 inline-block" style={{ fontWeight: 600 }}>
                {n.type === 'chat' ? 'مشاهده چت' : n.type === 'order' ? 'مشاهده سفارش' : 'مشاهده در روزمرگی'} ←
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ========================
// EU NAV
// ========================
const EU_NAV_ITEMS: { id: EuScreen; icon: string; label: string }[] = [
  { id: 'euHomeScreen', icon: 'fa-solid fa-home', label: 'خانه' },
  { id: 'euPlannerScreen', icon: 'fa-solid fa-calendar-check', label: 'روزمرگی' },
  { id: 'euChatListScreen', icon: 'fa-solid fa-comments', label: 'گفتگو' },
  { id: 'euReportScreen', icon: 'fa-solid fa-chart-pie', label: 'گزارش' },
];

const EU_NAV_ICON_SRC: Record<string, string> = {
  euHomeScreen: '/src/icons/png/home.png',
  euChatListScreen: '/src/icons/png/chat.png',
  euMarketScreen: '/src/icons/png/shop-market.png',
  euPlannerScreen: '/src/icons/png/calendar.png',
  euSearchScreen: '/src/icons/png/search.png',
  euReportScreen: '/src/icons/png/reports-charts.png',
  euProfileScreen: '/src/icons/png/profile.png',
};
function EuNavIcon({ id, fa, size, active }: { id: string; fa: string; size: number; active?: boolean }) {
  const src = EU_NAV_ICON_SRC[id];
  if (src) return <img src={src} alt="" className="nav-icon-img" style={{ width: size + 4, height: size + 4, objectFit: 'contain', filter: active ? 'brightness(0) opacity(0.72)' : undefined }} />;
  return <i className={fa} style={{ fontSize: size, color: active ? 'color-mix(in srgb, var(--aw-eu-primary) 82%, black)' : undefined }} />;
}
function EuNav() {
  const { euScreen, setEuScreen, orders, theme } = useApp();
  const isGlass = true; void theme;
  const activeOrderCount = orders.filter(o => o.status === 'preparing' || o.status === 'pending').length;
  const badgeMap: Partial<Record<EuScreen, number>> = {
    euChatListScreen: undefined,
    euDineScreen: activeOrderCount > 0 ? activeOrderCount : undefined,
  };

  if (isGlass) {
    return (
      <div
        className="flex-shrink-0 md:hidden px-3"
        style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))', paddingTop: 4 }}
      >
        <nav
          className="flex items-center rounded-[1000px]"
          style={{
            background: 'color-mix(in srgb, var(--aw-eu-primary) 10%, transparent)',
            backdropFilter: 'blur(20px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
            boxShadow: 'inset 0 0 2.6px rgba(255,255,255,0.25)',
            padding: 5,
          }}
        >
          {EU_NAV_ITEMS.map((item) => {
            const badge = badgeMap[item.id];
            const isActive = euScreen === item.id;
            return (
              <button
                key={item.id}
                className="flex-1 flex flex-col items-center gap-[2px] border-none cursor-pointer transition-all relative rounded-[100px]"
                style={{
                  padding: '6px 2px',
                  background: isActive ? 'color-mix(in srgb, var(--aw-eu-primary) 15%, transparent)' : 'transparent',
                  color: isActive ? 'var(--aw-eu-primary)' : 'var(--aw-text-secondary)',
                  fontWeight: isActive ? 800 : 500,
                  boxShadow: isActive ? 'inset 0 0 3px rgba(255,255,255,0.55)' : 'none',
                  backdropFilter: isActive ? 'blur(4px)' : undefined,
                  WebkitBackdropFilter: isActive ? 'blur(4px)' : undefined,
                }}
                onClick={() => setEuScreen(item.id)}
              >
                <EuNavIcon id={item.id} fa={item.icon} size={14} active={isActive} />
                <span style={{ fontSize: 8, whiteSpace: 'nowrap' }}>{item.label}</span>
                {badge != null && badge > 0 && (
                  <span className="absolute top-0.5 right-1 rounded-full flex items-center justify-center text-white" style={{ background: '#ef4444', fontWeight: 700, fontSize: 8, minWidth: 14, height: 14, padding: '0 2px' }}>
                    {toFa(badge)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <nav
      className="flex-shrink-0 flex border-t border-[var(--aw-border)] px-2 py-1 md:hidden"
      style={{ background: 'var(--aw-bg-header)', backdropFilter: 'blur(20px)', paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}
    >
      {EU_NAV_ITEMS.map((item) => {
        const badge = badgeMap[item.id];
        const isActive = euScreen === item.id;
        return (
          <button
            key={item.id}
            className={`flex-1 flex flex-col items-center gap-1 py-1 px-1 border-none bg-transparent cursor-pointer transition-all text-[10px] relative ${
              isActive ? 'text-[var(--aw-eu-primary)]' : 'text-[var(--aw-text-muted)]'
            }`}
            style={{ fontWeight: isActive ? 700 : 500 }}
            onClick={() => setEuScreen(item.id)}
          >
            <span className="flex items-center justify-center rounded-full transition-all" style={{
              width: 46, height: 30,
              background: isActive ? 'linear-gradient(135deg, var(--aw-eu-primary), var(--aw-eu-primary-dark))' : 'transparent',
              boxShadow: isActive ? '0 4px 12px color-mix(in srgb, var(--aw-eu-primary) 45%, transparent)' : 'none',
            }}>
              <EuNavIcon id={item.id} fa={item.icon} size={18} active={isActive} />
            </span>
            <span>{item.label}</span>
            {badge != null && badge > 0 && (
              <span className="absolute top-0 right-1/4 w-[16px] h-[16px] rounded-full flex items-center justify-center text-white text-[9px]" style={{ background: 'var(--aw-danger)', fontWeight: 700 }}>
                {toFa(badge)}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

// ========================
// DESKTOP SIDEBAR (EU — collapsible like admin)
// ========================
function EuSidebar({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const { euScreen, setEuScreen, openModal, openUnifiedCall, orders } = useApp();
  const badgeMap: Partial<Record<EuScreen, number>> = {
    euChatListScreen: undefined,
  };
  const w = expanded ? 240 : 68;

  return (
    <aside
      className="hidden md:flex flex-col flex-shrink-0 border-l border-[var(--aw-border)] h-full overflow-hidden"
      style={{
        width: w, minWidth: w,
        background: 'var(--aw-bg-card)',
        transition: 'width 0.28s cubic-bezier(.4,0,.2,1), min-width 0.28s cubic-bezier(.4,0,.2,1)',
      }}
    >
      {/* Logo row + toggle button */}
      <div className="flex items-center px-2 py-3 border-b border-[var(--aw-border)]" style={{ minHeight: 56 }}>
        {expanded ? (
          <>
            <div className="flex items-center gap-2 flex-1 min-w-0 pr-1">
              <img src={neuraLogo} alt="Neura" className="neura-logo" style={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }} />
              <span className="text-[16px] text-[var(--aw-text-primary)] font-[Neogrey] whitespace-nowrap" style={{ fontWeight: 700 }}>neura</span>
            </div>
            <button
              className="w-[32px] h-[32px] rounded-[10px] bg-transparent border-none text-[var(--aw-text-muted)] text-[13px] cursor-pointer flex items-center justify-center flex-shrink-0 transition-all hover:text-[var(--aw-eu-primary)] hover:bg-[var(--aw-bg-card-hover)]"
              onClick={onToggle}
              title="کوچک کردن منو"
            >
              <i className="fa-solid fa-angles-right" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 w-full">
            <img src={neuraLogo} alt="Neura" className="neura-logo" style={{ width: 24, height: 24, objectFit: 'contain', flexShrink: 0 }} />
            <button
              className="w-[30px] h-[30px] rounded-[8px] bg-transparent border-none text-[var(--aw-text-muted)] text-[12px] cursor-pointer flex items-center justify-center transition-all hover:text-[var(--aw-eu-primary)] hover:bg-[var(--aw-bg-card-hover)]"
              onClick={onToggle}
              title="باز کردن منو"
            >
              <i className="fa-solid fa-angles-left" />
            </button>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 aw-scroll">
        {EU_NAV_ITEMS.map((item) => {
          const badge = badgeMap[item.id];
          const isActive = euScreen === item.id;
          return (
            <button
              key={item.id}
              title={!expanded ? item.label : undefined}
              className={`w-full flex items-center gap-3 mb-1 border-none rounded-[10px] cursor-pointer transition-all text-[13px] relative ${
                expanded ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'
              } ${isActive ? 'text-white' : 'bg-transparent text-[var(--aw-text-secondary)] hover:bg-[var(--aw-bg-card-hover)]'}`}
              style={isActive ? { background: 'var(--aw-eu-primary, #7B62FC)', fontWeight: 600, boxShadow: '0 2px 10px rgba(126,95,170,0.3)' } : { fontWeight: 500 }}
              onClick={() => setEuScreen(item.id)}
            >
              <i className={`${item.icon} ${expanded ? 'w-5' : 'w-full'} text-center text-[15px]`} />
              {expanded && <span className="whitespace-nowrap">{item.label}</span>}
              {expanded && badge != null && badge > 0 && (
                <span className="mr-auto min-w-[20px] h-5 rounded-[10px] flex items-center justify-center text-white text-[11px] px-1.5" style={{ background: 'var(--aw-danger)', fontWeight: 700 }}>
                  {toFa(badge)}
                </span>
              )}
              {!expanded && badge != null && badge > 0 && (
                <span className="absolute top-0.5 left-1 w-[16px] h-[16px] rounded-full flex items-center justify-center text-white text-[9px]" style={{ background: 'var(--aw-danger)', fontWeight: 700 }}>
                  {toFa(badge)}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className={`py-3 border-t border-[var(--aw-border)] space-y-1.5 ${expanded ? 'px-3' : 'px-2'}`}>
        <button title={!expanded ? 'تماس' : undefined} className={`w-full flex items-center gap-3 py-2.5 border-none rounded-[10px] cursor-pointer transition-all text-[13px] bg-transparent text-[var(--aw-text-secondary)] hover:bg-[var(--aw-bg-card-hover)] ${expanded ? 'px-3' : 'px-0 justify-center'}`} style={{ fontWeight: 500 }} onClick={openUnifiedCall}>
          <i className={`fa-solid fa-phone ${expanded ? 'w-5' : 'w-full'} text-center text-[var(--aw-secondary)]`} />
          {expanded && <span>تماس</span>}
        </button>
        <button title={!expanded ? 'اعلان‌ها' : undefined} className={`w-full flex items-center gap-3 py-2.5 border-none rounded-[10px] cursor-pointer transition-all text-[13px] bg-transparent text-[var(--aw-text-secondary)] hover:bg-[var(--aw-bg-card-hover)] ${expanded ? 'px-3' : 'px-0 justify-center'}`} style={{ fontWeight: 500 }} onClick={() => openModal('اعلان‌ها', <EuNotifications />)}>
          <i className={`fa-solid fa-bell ${expanded ? 'w-5' : 'w-full'} text-center`} />
          {expanded && <span>اعلان‌ها</span>}
        </button>
      </div>

      {/* Agent selector (expanded only) */}
      {expanded && (
        <div className="px-3 pb-3"><AgentSelector /></div>
      )}
    </aside>
  );
}

// EuHomeScreen is imported from ./eu-home-screen

// ========================
// SWIPE TO CALL
// ========================
export function SwipeToCall({ onCall, children }: { onCall: () => void; children: React.ReactNode }) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = React.useRef<number | null>(null);
  const startY = React.useRef<number | null>(null);
  const dxRef = React.useRef(0);
  const triggered = React.useRef(false);
  const moved = React.useRef(false);
  const vScroll = React.useRef(false);
  const downTarget = React.useRef<HTMLElement | null>(null);
  const THRESHOLD = 70;
  const MAX = 160;

  const setD = (v: number) => { dxRef.current = v; setDx(v); };

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    startY.current = e.clientY;
    triggered.current = false;
    moved.current = false;
    vScroll.current = false;
    downTarget.current = e.target as HTMLElement;
    setDragging(true);
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch (_) {}
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current == null || startY.current == null) return;
    const d = e.clientX - startX.current; // signed: + right, - left
    const dy = e.clientY - startY.current;
    // Vertical intent ⇒ this is a scroll, not a swipe: abandon the horizontal slide
    // and mark it moved so no synthetic click is dispatched on release.
    if (vScroll.current || (Math.abs(dy) > 8 && Math.abs(dy) >= Math.abs(d))) {
      vScroll.current = true;
      moved.current = true;
      if (dxRef.current !== 0) setD(0);
      return;
    }
    if (Math.abs(d) > 6) moved.current = true;
    const clamped = Math.max(-MAX, Math.min(d, MAX));
    setD(clamped);
  };
  const finish = (allowClick: boolean) => {
    if (startX.current == null) return;
    if (Math.abs(dxRef.current) >= THRESHOLD && !triggered.current) { triggered.current = true; onCall(); }
    else if (allowClick && !moved.current && !vScroll.current && downTarget.current) {
      // pointer capture swallows the native click — re-dispatch it so child onClick fires
      downTarget.current.click();
    }
    startX.current = null;
    startY.current = null;
    downTarget.current = null;
    setDragging(false);
    setD(0);
  };

  const ready = Math.abs(dx) >= THRESHOLD;

  return (
    <div className="relative overflow-hidden rounded-[10px] mb-1">
      {/* call reveal on the side being swiped toward */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end pl-3 pr-4 pointer-events-none transition-colors"
        style={{
          background: ready ? 'var(--aw-secondary)' : 'rgba(0,230,118,0.18)',
          color: ready ? '#fff' : 'var(--aw-secondary)',
          opacity: dx < 0 ? 1 : 0,
          width: Math.max(-dx, 0),
        }}>
        <i className="fa-solid fa-phone text-[14px]" />
      </div>
      <div className="absolute inset-y-0 left-0 flex items-center justify-start pr-3 pl-4 pointer-events-none transition-colors"
        style={{
          background: ready ? 'var(--aw-secondary)' : 'rgba(0,230,118,0.18)',
          color: ready ? '#fff' : 'var(--aw-secondary)',
          opacity: dx > 0 ? 1 : 0,
          width: Math.max(dx, 0),
        }}>
        <i className="fa-solid fa-phone text-[14px]" />
      </div>
      <div
        style={{ transform: `translateX(${dx}px)`, transition: dragging ? 'none' : 'transform 0.2s ease', touchAction: 'pan-y' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => finish(true)}
        onPointerCancel={() => finish(false)}
        onClickCapture={(e) => { if (moved.current) { e.preventDefault(); e.stopPropagation(); moved.current = false; } }}
      >
        {children}
      </div>
    </div>
  );
}

// ========================
// EU — NEW CONVERSATION (search app users)
// ========================
function __chatBg(i: number): string {
  const P = ['bg-blue-600', 'bg-pink-500', 'bg-emerald-600', 'bg-amber-600', 'bg-violet-600', 'bg-cyan-600', 'bg-rose-600', 'bg-teal-600', 'bg-indigo-600', 'bg-fuchsia-600', 'bg-sky-600', 'bg-lime-600', 'bg-orange-600', 'bg-red-600'];
  return P[((i % P.length) + P.length) % P.length];
}

function NewConversationModal() {
  const { openChat, closeModal, setEuScreen, agents, showToast } = useApp() as any;
  const [q, setQ] = useState('');
  const [neura, setNeura] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupMode, setGroupMode] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({}); // sub -> name
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const selCount = Object.keys(selected).length;
  const toggleSel = (u: any) => setSelected(prev => { const n = { ...prev }; if (n[u.sub]) delete n[u.sub]; else n[u.sub] = u.name; return n; });
  const createGroup = async () => {
    if (selCount < 2) { showToast('حداقل ۲ نفر را انتخاب کنید', 'error'); return; }
    setCreating(true);
    try {
      const nm = groupName.trim() || ('گروه ' + Object.values(selected).slice(0, 3).join('، '));
      const r: any = await (api as any).groupCreate(nm, Object.keys(selected));
      const g = r && r.group;
      if (g && g.id) { openChat('pgroup_' + g.id, 'contact', { name: g.name, init: 'گ', bg: 'bg-[var(--aw-eu-primary,#7B62FC)]', sub: (g.members?.length || selCount + 1) + ' عضو' } as any, []); closeModal(); }
      else showToast('ساخت گروه ناموفق بود', 'error');
    } catch (_) { showToast('ساخت گروه ناموفق بود', 'error'); }
    finally { setCreating(false); }
  };

  // مخاطبینِ کاربر را می‌گیریم و از سرور می‌پرسیم کدام‌شان «کاربرِ نورا» هستند (فقط همان‌ها قابلِ پیام‌اند).
  React.useEffect(() => { (async () => {
    try {
      const r: any = await api.contacts(); const list = (r && r.contacts) || [];
      const phones = list.map((c: any) => c.phone).filter(Boolean);
      if (phones.length) {
        const rr: any = await (api as any).peerResolve(phones);
        const nameByPhone: any = {}; list.forEach((c: any) => { if (c.phone) nameByPhone[String(c.phone).replace(/\D/g, '').slice(-10)] = c.name; });
        setNeura((rr?.users || []).map((u: any) => ({ sub: String(u.sub), name: nameByPhone[String(u.phone).replace(/\D/g, '').slice(-10)] || u.name || u.phone, phone: u.phone })));
      }
    } catch (_e) {}
    setLoading(false);
  })(); }, []);

  const AGENT_META: Record<string, { label: string; icon: string; screen: string }> = {
    assistant: { label: 'دستیار شخصی', icon: 'fa-solid fa-robot', screen: 'euAssistantScreen' },
    support: { label: 'پشتیبانی', icon: 'fa-solid fa-headset', screen: 'euSupportScreen' },
    restaurant: { label: 'سفارش غذا', icon: 'fa-solid fa-utensils', screen: 'euDineScreen' },
    market: { label: 'مارکت', icon: 'fa-solid fa-store', screen: 'euMarketScreen' },
  };
  const pinnedIds = ['assistant', 'support'];
  const otherIds = ['restaurant', 'market'];
  const agentRow = (id: string) => {
    const m = AGENT_META[id]; if (!m) return null;
    const a = (agents || []).find((x: any) => x.id === id);
    return (
      <div key={id} className="flex items-center gap-3 p-2.5 rounded-[10px] cursor-pointer border border-transparent hover:bg-[var(--aw-bg-card-hover)] active:scale-[0.98] transition-all"
        onClick={() => { closeModal(); setEuScreen(m.screen); }}>
        <div className="w-11 h-11 rounded-[13px] flex items-center justify-center text-white flex-shrink-0" style={{ background: 'var(--aw-eu-primary, #7B62FC)' }}><i className={`${m.icon} text-[16px]`} /></div>
        <div className="flex-1 min-w-0"><div className="text-[13px]" style={{ fontWeight: 700, color: 'var(--aw-text-primary)' }}>{(a && a.name) || m.label}</div><div className="text-[11px] text-[var(--aw-text-muted)]">ایجنت</div></div>
        <i className="fa-solid fa-chevron-left text-[11px] text-[var(--aw-text-muted)]" />
      </div>
    );
  };
  const sq = q.trim();
  const filteredUsers = neura.filter((u) => !sq || String(u.name || '').includes(sq) || String(u.phone || '').includes(sq));
  const openPeer = (u: any) => { openChat('peer_' + u.sub, 'contact', { name: u.name, init: String(u.name || '?').charAt(0), bg: 'bg-[var(--aw-eu-primary,#7B62FC)]', sub: 'کاربر نورا' }, []); closeModal(); };

  return (
    <div className="flex flex-col" style={{ maxHeight: '66vh' }}>
      {/* سوییچِ «گفتگوی جدید» / «گروه جدید» */}
      <div className="flex items-center gap-1.5 p-1 mb-2 rounded-full flex-shrink-0" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
        <button className="flex-1 h-8 rounded-full border-none cursor-pointer text-[12px] flex items-center justify-center gap-1.5" style={!groupMode ? { background: 'var(--aw-eu-primary,#7B62FC)', color: '#fff', fontWeight: 700 } : { background: 'transparent', color: 'var(--aw-text-secondary)', fontWeight: 600 }} onClick={() => setGroupMode(false)}><i className="fa-solid fa-comment text-[11px]" /> گفتگوی جدید</button>
        <button className="flex-1 h-8 rounded-full border-none cursor-pointer text-[12px] flex items-center justify-center gap-1.5" style={groupMode ? { background: 'var(--aw-eu-primary,#7B62FC)', color: '#fff', fontWeight: 700 } : { background: 'transparent', color: 'var(--aw-text-secondary)', fontWeight: 600 }} onClick={() => setGroupMode(true)}><i className="fa-solid fa-users text-[11px]" /> گروه جدید</button>
      </div>

      {groupMode && (
        <div className="flex items-center gap-2 rounded-[10px] px-3 mb-2 border border-[var(--aw-border)] flex-shrink-0" style={{ background: 'var(--aw-bg-input)' }}>
          <i className="fa-solid fa-users text-[12px] text-[var(--aw-eu-primary,#7B62FC)]" />
          <input className="flex-1 bg-transparent border-none py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
            placeholder="نامِ گروه…" value={groupName} onChange={e => setGroupName(e.target.value)} />
        </div>
      )}

      <div className="flex items-center gap-2 rounded-[10px] px-3 border border-[var(--aw-border)] flex-shrink-0" style={{ background: 'var(--aw-bg-input)' }}>
        <i className="fa-solid fa-search text-[12px] text-[var(--aw-text-muted)]" />
        <input className="flex-1 bg-transparent border-none py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
          placeholder={groupMode ? 'افزودنِ اعضا…' : 'جستجوی کاربر یا شماره…'} value={q} onChange={e => setQ(e.target.value)} />
        {q && <button className="border-none bg-transparent text-[var(--aw-text-muted)] text-[12px] cursor-pointer" onClick={() => setQ('')}><i className="fa-solid fa-xmark" /></button>}
      </div>

      <div className="overflow-y-auto mt-2 aw-scroll -mx-1 px-1">
        {/* ایجنت‌ها — فقط در حالتِ گفتگوی تکی */}
        {!sq && !groupMode && (
          <>
            <div className="text-[11px] text-[var(--aw-text-muted)] px-1 mt-1 mb-1" style={{ fontWeight: 700 }}>ایجنت‌ها</div>
            {pinnedIds.map(agentRow)}
            {otherIds.map(agentRow)}
          </>
        )}

        {/* کاربرانِ نورا از میان مخاطبینِ من */}
        <div className="text-[11px] text-[var(--aw-text-muted)] px-1 mt-3 mb-1" style={{ fontWeight: 700 }}>{groupMode ? ('اعضای گروه' + (selCount ? ' (' + toFa(selCount) + ')' : '')) : 'کاربرانِ نورا (از مخاطبین تو)'}</div>
        {loading ? (
          <div className="text-center text-[12px] text-[var(--aw-text-muted)] py-6">در حال بررسی مخاطبین…</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center text-[12px] text-[var(--aw-text-muted)] py-6">
            <i className="fa-solid fa-user-slash text-[18px] mb-2 block opacity-50" />
            {neura.length === 0 ? 'هیچ‌کدام از مخاطبینت هنوز در نورا نیستند. وقتی عضو شوند اینجا می‌آیند.' : 'کاربری با این جست‌وجو نیست.'}
          </div>
        ) : (
          filteredUsers.map((u) => {
            const isSel = !!selected[u.sub];
            return (
            <div key={u.sub} className="flex items-center gap-3 p-2.5 rounded-[10px] cursor-pointer border border-transparent hover:bg-[var(--aw-bg-card-hover)] active:scale-[0.98] transition-all" onClick={() => groupMode ? toggleSel(u) : openPeer(u)}>
              <div className="relative flex-shrink-0"><LetterAvatar name={u.name} init={String(u.name || '?').charAt(0)} size={44} radius={13} /></div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] truncate" style={{ fontWeight: 600, color: 'var(--aw-text-primary)' }}>{u.name}</div>
                <div className="text-[11px] text-[var(--aw-text-muted)] truncate" dir="ltr" style={{ textAlign: 'right' }}>{u.phone}</div>
              </div>
              {groupMode ? (
                <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2" style={{ borderColor: isSel ? 'var(--aw-eu-primary,#7B62FC)' : 'var(--aw-border)', background: isSel ? 'var(--aw-eu-primary,#7B62FC)' : 'transparent', color: '#fff' }}>{isSel && <i className="fa-solid fa-check text-[10px]" />}</span>
              ) : (
                <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--aw-eu-primary, #7B62FC)', color: '#fff' }}><i className="fa-solid fa-comment-dots text-[13px]" /></span>
              )}
            </div>
          ); })
        )}
      </div>

      {/* دکمهٔ ساختِ گروه */}
      {groupMode && (
        <button disabled={creating || selCount < 2} onClick={createGroup}
          className="mt-2 w-full py-3 rounded-[12px] border-none cursor-pointer text-white text-[13px] flex items-center justify-center gap-2 flex-shrink-0"
          style={{ background: selCount < 2 ? 'var(--aw-text-muted)' : 'var(--aw-eu-primary,#7B62FC)', opacity: creating ? 0.7 : 1, fontWeight: 700 }}>
          <i className="fa-solid fa-users" /> {creating ? 'در حال ساخت…' : ('ساختِ گروه' + (selCount ? ' با ' + toFa(selCount) + ' نفر' : ''))}
        </button>
      )}
    </div>
  );
}

// ========================
// EU OFFERS (پیشنهادها) — Market + Dine
// ========================
function EuOffersScreen() {
  const { showToast, setEuScreen, goBack } = useApp();
  const [tab, setTab] = useState<'market' | 'dine'>('market');

  // پیشنهادهای واقعی از settings.marketOffers (سوپرادمین تعریف می‌کند) — نه هاردکد. پیش‌فرض خالی.
  const [__offersReal, __setOffersReal] = useState<any[]>([]);
  useEffect(() => { (async () => { try { const st: any = await (api as any).getSettings(); if (st && Array.isArray(st.marketOffers)) __setOffersReal(st.marketOffers); } catch (_e) {} })(); }, []);
  const __mapOffer = (o: any, i: number, pfx: string) => ({ id: pfx + (o.id != null ? o.id : i), title: o.title || 'پیشنهاد', desc: o.desc || '', discount: Number(o.discount) || 0, place: o.shop || o.restaurant || o.place || '', validUntil: o.validUntil || '', code: o.code || '', color: o.color || (pfx === 'd' ? '#14b8a6' : '#F59E0B'), icon: o.icon || 'fa-solid fa-gift' });
  const __dineOffers = __offersReal.filter((o: any) => o.source === 'dine' || o.restaurant);
  const __mktOffers = __offersReal.filter((o: any) => !(o.source === 'dine' || o.restaurant));

  const SECTIONS = [
    { key: 'market', title: 'مارکت', icon: 'fa-solid fa-store', accent: '#F59E0B', go: () => setEuScreen('euMarketScreen'),
      items: __mktOffers.map((o, i) => __mapOffer(o, i, 'm')) },
    { key: 'dine', title: 'سفارش غذا', icon: 'fa-solid fa-utensils', accent: '#14b8a6', go: () => setEuScreen('euDineScreen'),
      items: __dineOffers.map((o, i) => __mapOffer(o, i, 'd')) },
  ];
  const active = SECTIONS.find(s => s.key === tab) || SECTIONS[0];

  return (
    <div className="flex-1 overflow-y-auto pb-6 aw-scroll">
      {/* Header: back + market/dine switch */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <button onClick={goBack} className="w-9 h-9 rounded-[10px] border border-[var(--aw-border)] bg-transparent cursor-pointer flex items-center justify-center text-[var(--aw-text-secondary)] active:scale-95 transition-transform flex-shrink-0">
          <i className="fa-solid fa-chevron-right text-[13px]" />
        </button>
        <div className="flex flex-1 p-1 rounded-[12px]" style={{ background: 'var(--aw-bg-input)', border: '1px solid var(--aw-border)' }}>
          {SECTIONS.map(sec => {
            const on = tab === sec.key;
            return (
              <button key={sec.key} onClick={() => setTab(sec.key as 'market' | 'dine')}
                className="flex-1 border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all active:scale-95"
                style={{ padding: '8px 10px', borderRadius: 9, fontSize: 13, fontWeight: on ? 700 : 600,
                  background: on ? sec.accent : 'transparent', color: on ? '#fff' : 'var(--aw-text-secondary)',
                  boxShadow: on ? `0 2px 8px color-mix(in srgb, ${sec.accent} 40%, transparent)` : 'none' }}>
                <i className={`${sec.icon} text-[12px]`} /> {sec.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active section */}
      <div className="mt-2">
          {/* Section header */}
          <div className="flex items-center justify-between px-4 mb-2">
            <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--aw-bg-input)', color: 'var(--aw-text-muted)', fontWeight: 600 }}>{toFa(active.items.length)} پیشنهاد</span>
            <button onClick={active.go} className="text-[12px] bg-transparent border-none cursor-pointer flex items-center gap-1" style={{ color: 'var(--aw-eu-primary)', fontWeight: 600 }}>
              مشاهده همه <i className="fa-solid fa-chevron-left text-[9px]" />
            </button>
          </div>

          {/* Offer cards */}
          <div className="px-4 flex flex-col gap-2">
            {active.items.length === 0 && (<div className="text-center text-[13px] text-[var(--aw-text-muted)] py-12">هنوز پیشنهادی ثبت نشده است.</div>)}
            {active.items.map((o: any) => (
              <div key={o.id} className="rounded-[14px] p-3 relative overflow-hidden" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
                <div className="flex items-start gap-3">
                  <span className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0 text-white" style={{ background: o.color }}>
                    <i className={`${o.icon} text-[16px]`} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13.5px] truncate" style={{ fontWeight: 700, color: 'var(--aw-text-primary)' }}>{o.title}</span>
                      <span className="text-[12px] px-2 py-0.5 rounded-lg flex-shrink-0 text-white" style={{ background: o.color, fontWeight: 800, direction: 'ltr' }}>{toFa(o.discount)}٪</span>
                    </div>
                    <div className="text-[11.5px] text-[var(--aw-text-secondary)] mt-0.5 leading-relaxed">{o.desc}</div>
                    <div className="flex items-center gap-2 mt-1 text-[10.5px] text-[var(--aw-text-muted)]">
                      <span className="flex items-center gap-1"><i className="fa-solid fa-shop text-[9px]" /> {o.place}</span>
                      <span className="opacity-50">•</span>
                      <span className="flex items-center gap-1"><i className="fa-regular fa-clock text-[9px]" /> {o.validUntil}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2.5 pt-2.5" style={{ borderTop: '1px dashed var(--aw-border)' }}>
                  <span className="text-[12px] px-2.5 py-1 rounded-lg tracking-wider" style={{ background: 'var(--aw-bg-input)', color: 'var(--aw-text-primary)', fontWeight: 700, direction: 'ltr' }}>{o.code}</span>
                  <button onClick={() => __copy(o.code, () => showToast(`کد تخفیف ${o.code} کپی شد ✅`))} className="text-[11px] px-3 py-1.5 rounded-lg border-none text-white cursor-pointer flex items-center gap-1 active:scale-95 transition-transform" style={{ background: o.color, fontWeight: 600 }}>
                    <i className="fa-solid fa-copy text-[9px]" /> کپی کد
                  </button>
                </div>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
}

// ========================
// EU CHAT — ADD CATEGORY MODAL
// ========================
function RenameCatModal({ current, onSave }: { current: string; onSave: (label: string) => void }) {
  const { closeModal } = useApp();
  const [name, setName] = useState(current);
  const submit = () => { const v = name.trim(); if (!v) return; onSave(v); closeModal(); };
  return (
    <div className="flex flex-col gap-3">
      <input autoFocus value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); }}
        placeholder="نام دسته"
        className="w-full rounded-[10px] px-3 py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none border border-[var(--aw-border)]"
        style={{ background: 'var(--aw-bg-input)' }} />
      <div className="grid grid-cols-2 gap-2">
        <button onClick={submit} className="py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[13px]" style={{ background: 'var(--aw-eu-primary, #7B62FC)', fontWeight: 700 }}>ذخیره</button>
        <button onClick={closeModal} className="py-2.5 rounded-[10px] cursor-pointer text-[13px] bg-transparent" style={{ border: '1px solid var(--aw-border)', color: 'var(--aw-text-secondary)', fontWeight: 700 }}>انصراف</button>
      </div>
    </div>
  );
}

function ManageCatModal({ label, memberIds, options, onSave, onDelete }: { label: string; memberIds: string[]; options: { id: string; name: string; init: string; bg: string; isGroup: boolean }[]; onSave: (label: string, ids: string[]) => void; onDelete: () => void }) {
  const { closeModal } = useApp();
  const [name, setName] = useState(label);
  const [members, setMembers] = useState<string[]>(memberIds);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [q, setQ] = useState('');
  const byId = (id: string) => options.find(o => o.id === id);
  const memberObjs = members.map(byId).filter(Boolean) as typeof options;
  const sq = q.trim().toLowerCase();
  const available = options.filter(o => !members.includes(o.id) && (!sq || o.name.toLowerCase().includes(sq)));
  const remove = (id: string) => setMembers(m => m.filter(x => x !== id));
  const add = (id: string) => setMembers(m => [...m, id]);
  const save = () => { onSave(name.trim() || label, members); closeModal(); };
  return (
    <div className="flex flex-col gap-3" style={{ maxHeight: '66vh' }}>
      {/* Group name */}
      <div>
        <div className="text-[11px] text-[var(--aw-text-muted)] mb-1">نام گروه</div>
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="نام گروه"
          className="w-full rounded-[10px] px-3 py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none border border-[var(--aw-border)]"
          style={{ background: 'var(--aw-bg-input)' }} />
      </div>

      {/* Members */}
      <div className="flex items-center justify-between">
        <div className="text-[11px] text-[var(--aw-text-muted)]">مخاطبان دسته ({toFa(members.length)})</div>
        <button onClick={() => setShowAdd(s => !s)} className="text-[11px] text-[var(--aw-eu-primary)] bg-transparent border-none cursor-pointer flex items-center gap-1">
          <i className={`fa-solid ${showAdd ? 'fa-xmark' : 'fa-plus'} text-[10px]`} /> {showAdd ? 'بستن' : 'افزودن مخاطب'}
        </button>
      </div>

      {showAdd ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 rounded-[10px] px-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
            <i className="fa-solid fa-search text-[12px] text-[var(--aw-text-muted)]" />
            <input autoFocus className="flex-1 bg-transparent border-none py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
              placeholder="جستجوی مخاطب..." value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div className="overflow-y-auto aw-scroll -mx-1 px-1" style={{ maxHeight: '32vh' }}>
            {available.length === 0 ? (
              <div className="text-center text-[12px] text-[var(--aw-text-muted)] py-8">مخاطبی برای افزودن نیست</div>
            ) : available.map(o => (
              <div key={o.id} onClick={() => add(o.id)} className="flex items-center gap-3 p-2.5 rounded-[10px] cursor-pointer border border-transparent hover:bg-[var(--aw-bg-card-hover)] active:scale-[0.98] transition-all">
                <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-white flex-shrink-0 ${o.bg}`} style={{ fontWeight: 700, fontSize: 16 }}>{o.init}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] truncate" style={{ fontWeight: 600, color: 'var(--aw-text-primary)' }}>{o.name}</div>
                  <div className="text-[11px] text-[var(--aw-text-muted)] flex items-center gap-1"><i className={`fa-solid ${o.isGroup ? 'fa-users' : 'fa-user'} text-[9px]`} /> {o.isGroup ? 'گروه' : 'گفتگو'}</div>
                </div>
                <span className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--aw-eu-primary) 16%, transparent)', color: 'var(--aw-eu-primary)' }}><i className="fa-solid fa-plus text-[12px]" /></span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-y-auto aw-scroll -mx-1 px-1" style={{ maxHeight: '34vh' }}>
          {memberObjs.length === 0 ? (
            <div className="text-center text-[12px] text-[var(--aw-text-muted)] py-8">
              <i className="fa-solid fa-user-plus text-[20px] mb-2 block opacity-50" />
              هنوز مخاطبی در این دسته نیست
            </div>
          ) : memberObjs.map(o => (
            <div key={o.id} className="flex items-center gap-3 p-2.5 rounded-[10px] border border-transparent">
              <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-white flex-shrink-0 ${o.bg}`} style={{ fontWeight: 700, fontSize: 16 }}>{o.init}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] truncate" style={{ fontWeight: 600, color: 'var(--aw-text-primary)' }}>{o.name}</div>
                <div className="text-[11px] text-[var(--aw-text-muted)] flex items-center gap-1"><i className={`fa-solid ${o.isGroup ? 'fa-users' : 'fa-user'} text-[9px]`} /> {o.isGroup ? 'گروه' : 'گفتگو'}</div>
              </div>
              <button onClick={() => remove(o.id)} className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 border-none cursor-pointer" style={{ background: 'color-mix(in srgb, var(--aw-danger) 14%, transparent)', color: 'var(--aw-danger)' }} title="حذف از دسته">
                <i className="fa-solid fa-xmark text-[13px]" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex-shrink-0 flex flex-col gap-2 pt-1">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={save} className="py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[13px]" style={{ background: 'var(--aw-eu-primary, #7B62FC)', fontWeight: 700 }}>ذخیره</button>
          <button onClick={closeModal} className="py-2.5 rounded-[10px] cursor-pointer text-[13px] bg-transparent" style={{ border: '1px solid var(--aw-border)', color: 'var(--aw-text-secondary)', fontWeight: 700 }}>انصراف</button>
        </div>
        {confirmDel ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--aw-text-secondary)] flex-1">این دسته حذف شود؟</span>
            <button onClick={() => { onDelete(); closeModal(); }} className="text-[11px] px-3 py-1.5 rounded-lg border-none cursor-pointer text-white" style={{ background: 'var(--aw-danger)', fontWeight: 700 }}>بله، حذف کن</button>
            <button onClick={() => setConfirmDel(false)} className="text-[11px] px-3 py-1.5 rounded-lg cursor-pointer bg-transparent" style={{ border: '1px solid var(--aw-border)', color: 'var(--aw-text-secondary)' }}>خیر</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDel(true)} className="text-[11px] text-[var(--aw-danger)] bg-transparent border-none cursor-pointer flex items-center justify-center gap-1 py-1">
            <i className="fa-solid fa-trash text-[10px]" /> حذف دسته
          </button>
        )}
      </div>
    </div>
  );
}

function ConfirmDeleteCatModal({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  const { closeModal } = useApp();
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[13px] text-[var(--aw-text-secondary)]">
        دسته «<span style={{ fontWeight: 700, color: 'var(--aw-text-primary)' }}>{label}</span>» حذف شود؟ گفتگوها حذف نمی‌شوند و فقط از این دسته خارج می‌گردند.
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => { onConfirm(); closeModal(); }} className="py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[13px]" style={{ background: 'var(--aw-danger)', fontWeight: 700 }}>حذف دسته</button>
        <button onClick={closeModal} className="py-2.5 rounded-[10px] cursor-pointer text-[13px] bg-transparent" style={{ border: '1px solid var(--aw-border)', color: 'var(--aw-text-secondary)', fontWeight: 700 }}>انصراف</button>
      </div>
    </div>
  );
}

function AddChatCategoryModal({ onAdd }: { onAdd: (label: string) => void }) {
  const { closeModal } = useApp();
  const [name, setName] = useState('');
  const submit = () => { const v = name.trim(); if (!v) return; onAdd(v); closeModal(); };
  return (
    <div className="flex flex-col gap-3">
      <input autoFocus value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); }}
        placeholder="نام دسته‌بندی جدید"
        className="w-full rounded-[10px] px-3 py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none border border-[var(--aw-border)]"
        style={{ background: 'var(--aw-bg-input)' }} />
      <div className="grid grid-cols-2 gap-2">
        <button onClick={submit} className="py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[13px]" style={{ background: 'var(--aw-eu-primary, #7B62FC)', fontWeight: 700 }}>افزودن</button>
        <button onClick={closeModal} className="py-2.5 rounded-[10px] cursor-pointer text-[13px] bg-transparent" style={{ border: '1px solid var(--aw-border)', color: 'var(--aw-text-secondary)', fontWeight: 700 }}>انصراف</button>
      </div>
    </div>
  );
}

function AddToChatCategoryModal({ options, selected, onSave }: { options: { id: string; name: string; init: string; bg: string; isGroup: boolean }[]; selected: string[]; onSave: (ids: string[]) => void }) {
  const { closeModal } = useApp();
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string[]>(selected);
  const toggle = (id: string) => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const sq = q.trim().toLowerCase();
  const filtered = options.filter(o => !sq || o.name.toLowerCase().includes(sq));
  const save = () => { onSave(picked); closeModal(); };
  return (
    <div className="flex flex-col" style={{ maxHeight: '62vh' }}>
      <div className="flex items-center gap-2 rounded-[10px] px-3 border border-[var(--aw-border)] flex-shrink-0" style={{ background: 'var(--aw-bg-input)' }}>
        <i className="fa-solid fa-search text-[12px] text-[var(--aw-text-muted)]" />
        <input autoFocus className="flex-1 bg-transparent border-none py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
          placeholder="جستجوی گفتگو..." value={q} onChange={e => setQ(e.target.value)} />
        {q && <button className="border-none bg-transparent text-[var(--aw-text-muted)] text-[12px] cursor-pointer" onClick={() => setQ('')}><i className="fa-solid fa-xmark" /></button>}
      </div>
      <div className="overflow-y-auto mt-2 aw-scroll -mx-1 px-1 flex-1">
        {filtered.length === 0 ? (
          <div className="text-center text-[12px] text-[var(--aw-text-muted)] py-10">گفتگویی یافت نشد</div>
        ) : filtered.map(o => {
          const on = picked.includes(o.id);
          return (
            <div key={o.id} onClick={() => toggle(o.id)}
              className="flex items-center gap-3 p-2.5 rounded-[10px] cursor-pointer border border-transparent hover:bg-[var(--aw-bg-card-hover)] active:scale-[0.98] transition-all">
              <div className={`w-11 h-11 rounded-[13px] flex items-center justify-center text-white flex-shrink-0 ${o.bg}`} style={{ fontWeight: 700, fontSize: 17 }}>{o.init}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] truncate" style={{ fontWeight: 600, color: 'var(--aw-text-primary)' }}>{o.name}</div>
                <div className="text-[11px] text-[var(--aw-text-muted)] flex items-center gap-1"><i className={`fa-solid ${o.isGroup ? 'fa-users' : 'fa-user'} text-[9px]`} /> {o.isGroup ? 'گروه' : 'گفتگو'}</div>
              </div>
              <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ background: on ? 'var(--aw-eu-primary, #7B62FC)' : 'transparent', borderColor: on ? 'var(--aw-eu-primary, #7B62FC)' : 'var(--aw-border)', color: '#fff' }}>
                {on && <i className="fa-solid fa-check text-[11px]" />}
              </span>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3 flex-shrink-0">
        <button onClick={save} className="py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[13px]" style={{ background: 'var(--aw-eu-primary, #7B62FC)', fontWeight: 700 }}>ذخیره ({toFa(picked.length)})</button>
        <button onClick={closeModal} className="py-2.5 rounded-[10px] cursor-pointer text-[13px] bg-transparent" style={{ border: '1px solid var(--aw-border)', color: 'var(--aw-text-secondary)', fontWeight: 700 }}>انصراف</button>
      </div>
    </div>
  );
}

// ========================
// EU CHAT LIST
// ========================
function EuChatListScreen() {
  const { agents, openChat, openModal, setEuScreen, startCall, showToast } = useApp();
  // دستیار شخصی و پشتیبانی همیشه بالا؛ بقیهٔ ایجنت‌ها زیرِ این دو.
  const euAgentIds = ['assistant', 'support', 'restaurant', 'market'];
  const euAgents = euAgentIds.map(id => agents.find(a => a.id === id)).filter((a): a is Agent => a != null);
  // پیشِ‌نمایشِ واقعیِ گفتگو (موضوعِ آخرین سشن) به‌جای lastMsgِ بریفینگِ خودکار.
  const [__sessPreview, __setSessPreview] = useState<Record<string, string>>({});
  useEffect(() => { euAgents.forEach((a: any) => { (api as any).chatSessions(a.id).then((r: any) => { const ss = (r && Array.isArray(r.sessions)) ? r.sessions : []; if (ss.length) __setSessPreview(prev => ({ ...prev, [a.id]: String(ss[0].title || '') })); }).catch(() => {}); }); /* eslint-disable-next-line */ }, []);
  const unreadMap: Record<string, number> = {};
  // مخاطبانِ واقعیِ کاربر (per-user) — منبعِ USER_CONVERSATIONS/convoOptions به‌جای نام‌های فیک.
  const [__euContacts, __setEuContacts] = useState<{ name: string; phone: string }[]>([]);
  useEffect(() => { (api as any).contacts().then((r: any) => __setEuContacts(Array.isArray(r?.contacts) ? r.contacts : [])).catch(() => {}); }, []);
  // گفتگوهای واقعیِ کاربر-به-کاربرِ نورا — بعد از ایجنت‌ها در همین لیست نمایش داده می‌شوند.
  const [__peerConvs, __setPeerConvs] = useState<any[]>([]);
  const [__groups, __setGroups] = useState<any[]>([]);
  const __loadPeerConvs = () => {
    (api as any).peerConversations().then((r: any) => __setPeerConvs(Array.isArray(r?.conversations) ? r.conversations : [])).catch(() => {});
    (api as any).groupList().then((r: any) => __setGroups(Array.isArray(r?.groups) ? r.groups : [])).catch(() => {});
  };
  useEffect(() => { __loadPeerConvs(); const h = () => __loadPeerConvs(); window.addEventListener('neura:data-changed', h); return () => window.removeEventListener('neura:data-changed', h); }, []);
  const [chatListTab, setChatListTab] = useState<'interactions' | 'agents'>('interactions');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatFilter, setChatFilter] = useState('all');
  const [favIds] = useState<string[]>([]); // مورد علاقه‌ی واقعی (بدونِ seedِ فیک)
  // دسته‌بندیِ گفتگوها per-user روی سرور (collection chat_categories) — پایدار با هارد‌رفرش/دستگاهِ دیگر.
  const [customCats, setCustomCats] = useState<{ id: string; label: string }[]>([]);
  const [catMembers, setCatMembers] = useState<Record<string, string[]>>({});
  const __catsLoaded = useRef(false);
  useEffect(() => { (async () => { try { const v: any = await (api as any).myList('chat_categories'); if (Array.isArray(v)) { setCustomCats(v.map((c: any) => ({ id: String(c.id), label: String(c.label || '') }))); setCatMembers(Object.fromEntries(v.map((c: any) => [String(c.id), Array.isArray(c.members) ? c.members : []]))); } } catch (_e) {} __catsLoaded.current = true; })(); }, []);
  useEffect(() => { if (!__catsLoaded.current) return; const h = setTimeout(() => { const docs = customCats.map(c => ({ id: c.id, label: c.label, members: catMembers[c.id] || [] })); (api as any).myBulkSave('chat_categories', docs).catch(() => {}); }, 600); return () => clearTimeout(h); }, [customCats, catMembers]);
  const setMembers = (catId: string, ids: string[]) => setCatMembers(prev => ({ ...prev, [catId]: ids }));
  const renameCat = (catId: string, label: string) => setCustomCats(prev => prev.map(c => c.id === catId ? { ...c, label } : c));
  const openAddToCat = (catId: string) => openModal('افزودن گفتگو به دسته', <AddToChatCategoryModal options={convoOptions} selected={catMembers[catId] || []} onSave={ids => setMembers(catId, ids)} />);
  const openManageCat = (catId: string) => openModal('مدیریت گفتگوها', <ManageCatModal label={customCats.find(c => c.id === catId)?.label || ''} memberIds={catMembers[catId] || []} options={convoOptions} onSave={(label, ids) => { renameCat(catId, label); setMembers(catId, ids); }} onDelete={() => deleteCat(catId)} />);
  const deleteCat = (catId: string) => {
    const __lbl = customCats.find(c => c.id === catId)?.label || '';
    setCustomCats(prev => prev.filter(c => c.id !== catId));
    setCatMembers(prev => { const next = { ...prev }; delete next[catId]; return next; });
    if (chatFilter === catId) setChatFilter('all');
    showToast('دسته «' + __lbl + '» حذف شد');
  };
  const addCat = (label: string) => setCustomCats(prev => {
    const id = 'cat_' + Date.now();
    const next = [...prev, { id, label }];
    setChatFilter(id);
    setTimeout(() => openManageCat(id), 60); // after creating a group, manage its conversations
    return next;
  });
  const CHAT_FILTERS = [
    { id: 'all', label: 'همه' },
    { id: 'calls', label: 'تماس‌ها' },
    { id: 'unread', label: 'نخوانده‌ها' },
    { id: 'favorites', label: 'مورد علاقه‌ها' },
    { id: 'groups', label: 'گروه‌ها' },
    ...customCats,
  ];

  const USER_CONVERSATIONS: any[] = [];

  const convoOptions = [
    ...euAgents.map(a => ({ id: a.id, name: a.name, init: a.init, bg: a.bg, isGroup: false })),
    ...USER_CONVERSATIONS.map(u => ({ id: u.id, name: u.name, init: u.init, bg: u.bg, isGroup: !!(u as any).isGroup })),
  ];

  const AGENT_CARDS = [
    { id: 'assistant', icon: 'fa-solid fa-brain', color: '#7E5FAA', label: 'دستیار شخصی', desc: 'مدیریت امور روزانه و یادآوری‌ها' },
    { id: 'support', icon: 'fa-solid fa-headset', color: '#3B82F6', label: 'پشتیبانی', desc: 'رفع مشکلات و پاسخ به سوالات' },
    { id: 'restaurant', icon: 'fa-solid fa-utensils', color: '#F59E0B', label: 'سفارش غذا', desc: 'سفارش آنلاین از رستوران‌ها' },
    { id: 'market', icon: 'fa-solid fa-store', color: '#00E676', label: 'مارکت', desc: 'خرید محصولات و کالاها' },
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll">
      {/* Tab bar */}
      <div className="flex mx-3 mt-3 mb-1" style={{ background: 'color-mix(in srgb, var(--aw-eu-primary) 12%, transparent)', backdropFilter: 'blur(20px) saturate(1.5)', WebkitBackdropFilter: 'blur(20px) saturate(1.5)', border: '1px solid color-mix(in srgb, var(--aw-eu-primary) 20%, transparent)', borderRadius: 9999, padding: 4, boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25)' }}>
        <button
          className="flex-1 border-none cursor-pointer flex items-center justify-center transition-all"
          style={{
            borderRadius: 9999,
            padding: '8px 12px',
            background: chatListTab === 'interactions' ? 'color-mix(in srgb, var(--aw-eu-primary) 46%, transparent)' : 'transparent',
            backdropFilter: chatListTab === 'interactions' ? 'blur(12px)' : 'none',
            WebkitBackdropFilter: chatListTab === 'interactions' ? 'blur(12px)' : 'none',
            border: chatListTab === 'interactions' ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent',
            boxShadow: chatListTab === 'interactions' ? 'inset 0 1px 2px rgba(255,255,255,0.4), 0 2px 6px color-mix(in srgb, var(--aw-eu-primary) 25%, transparent)' : 'none',
            color: chatListTab === 'interactions' ? '#fff' : 'var(--aw-text-secondary)',
            fontWeight: chatListTab === 'interactions' ? 800 : 500,
            fontSize: 12,
            fontFamily: "'Kamand', 'Vazirmatn', sans-serif",
          }}
          onClick={() => setChatListTab('interactions')}
        >
          تعاملات من
        </button>
        <button
          className="flex-1 border-none cursor-pointer flex items-center justify-center transition-all"
          style={{
            borderRadius: 9999,
            padding: '8px 12px',
            background: chatListTab === 'agents' ? 'color-mix(in srgb, var(--aw-eu-primary) 46%, transparent)' : 'transparent',
            backdropFilter: chatListTab === 'agents' ? 'blur(12px)' : 'none',
            WebkitBackdropFilter: chatListTab === 'agents' ? 'blur(12px)' : 'none',
            border: chatListTab === 'agents' ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent',
            boxShadow: chatListTab === 'agents' ? 'inset 0 1px 2px rgba(255,255,255,0.4), 0 2px 6px color-mix(in srgb, var(--aw-eu-primary) 25%, transparent)' : 'none',
            color: chatListTab === 'agents' ? '#fff' : 'var(--aw-text-secondary)',
            fontWeight: chatListTab === 'agents' ? 800 : 500,
            fontSize: 12,
            fontFamily: "'Kamand', 'Vazirmatn', sans-serif",
          }}
          onClick={() => setChatListTab('agents')}
        >
          عامل هوشمند
        </button>
      </div>

      {chatListTab === 'interactions' ? (
        <>
          {/* Search bar + new conversation */}
          <div className="px-3 pt-3 pb-1 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-[10px] px-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
              <i className="fa-solid fa-search text-[12px] text-[var(--aw-text-muted)]" />
              <input
                className="flex-1 bg-transparent border-none py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
                placeholder="جستجو در گفتگوها..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="border-none bg-transparent text-[var(--aw-text-muted)] text-[12px] cursor-pointer hover:text-[var(--aw-primary)]" onClick={() => setSearchQuery('')}>
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>
            <button
              className="w-[42px] h-[42px] rounded-[10px] border-none cursor-pointer flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
              style={{ background: 'var(--aw-eu-primary, #7B62FC)', color: '#fff', boxShadow: '0 3px 10px rgba(123,98,252,0.35)' }}
              onClick={() => openModal('گفتگوی جدید', <NewConversationModal />)}
              title="گفتگوی جدید با کاربران"
            >
              <i className="fa-solid fa-pen-to-square text-[15px]" />
            </button>
          </div>
          {/* WhatsApp-style filter chips */}
          <div className="flex items-center gap-2 px-3 pt-1.5 pb-1 overflow-x-auto aw-scroll" style={{ scrollbarWidth: 'none' }}>
            {CHAT_FILTERS.map(f => {
              const active = chatFilter === f.id;
              return (
                <button key={f.id} onClick={() => setChatFilter(f.id)}
                  className="flex-shrink-0 border-none cursor-pointer transition-all active:scale-95"
                  style={{
                    padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                    fontFamily: "'Kamand', 'Vazirmatn', sans-serif", whiteSpace: 'nowrap',
                    background: active ? 'var(--aw-eu-primary, #7B62FC)' : 'var(--aw-bg-input)',
                    color: active ? '#fff' : 'var(--aw-text-secondary)',
                    border: active ? 'none' : '1px solid var(--aw-border)',
                    boxShadow: active ? '0 2px 8px rgba(123,98,252,0.30)' : 'none',
                  }}>
                  {f.label}
                </button>
              );
            })}
            <button onClick={() => openModal('دسته‌بندی جدید', <AddChatCategoryModal onAdd={addCat} />)}
              className="flex-shrink-0 border-none cursor-pointer flex items-center justify-center active:scale-95 transition-transform"
              title="افزودن دسته‌بندی"
              style={{ width: 30, height: 30, borderRadius: 999, background: 'var(--aw-bg-input)', border: '1px solid var(--aw-border)', color: 'var(--aw-eu-primary, #7B62FC)' }}>
              <i className="fa-solid fa-plus text-[12px]" />
            </button>
          </div>
          {chatFilter.startsWith('cat_') && (
            <div className="px-3 pt-1 flex justify-end items-center gap-3">
              <button onClick={() => openManageCat(chatFilter)} className="text-[11px] text-[var(--aw-eu-primary)] bg-transparent border-none cursor-pointer flex items-center gap-1">
                <i className="fa-solid fa-gear text-[10px]" /> مدیریت گفتگوها
              </button>
            </div>
          )}
          <div className="px-3 pt-1">
            {(() => {
              // Build unified conversation list interleaved by recency
              const items: Array<{ key: string; type: 'agent' | 'user'; order: number }> =
                euAgents.map((ag, i) => ({ key: ag.id, type: 'agent' as const, order: i }));

              const sq = searchQuery.trim().toLowerCase();
              const rendered = items.map(item => {
                // filter / category gate
                let fUnread = 0, fGroup = false, fOnline = false;
                if (item.type === 'agent') { fUnread = unreadMap[item.key] || 0; fOnline = true; }
                else { const uu = USER_CONVERSATIONS.find(uc => uc.id === item.key); fUnread = uu?.unread || 0; fGroup = !!(uu as any)?.isGroup; fOnline = !!uu?.online; }
                if (chatFilter === 'unread' && fUnread <= 0) return null;
                if (chatFilter === 'groups' && !fGroup) return null;
                if (chatFilter === 'favorites' && !favIds.includes(item.key)) return null;
                if (chatFilter === 'calls' && !fOnline) return null;
                if (chatFilter.startsWith('cat_') && !(catMembers[chatFilter] || []).includes(item.key)) return null;
                if (item.type === 'agent') {
                  const a = euAgents.find(ag => ag.id === item.key);
                  if (!a) return null;
                  if (sq && !a.name.toLowerCase().includes(sq) && !a.role.toLowerCase().includes(sq) && !(a.lastMsg || '').toLowerCase().includes(sq)) return null;
                  const unread = unreadMap[a.id] || 0;
                  if (a.locked) {
                    return (
                      <SwipeToCall key={a.id} onCall={() => startCall(a.name, a.role, a.bg, a.init, a.voip)}>
                      <div className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer opacity-60"
                        onClick={() => openModal('فعال‌سازی ' + a.name, <SubscribeContent agentId={a.id} />)}>
                        <div className={`w-12 h-12 rounded-[10px] flex items-center justify-center text-white flex-shrink-0 relative ${a.bg}`} style={{ fontWeight: 700, fontSize: 18 }}>
                          {a.init}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="text-sm" style={{ fontWeight: 600 }}>{a.name}</span>
                            <span className="text-[10px] text-black px-2 py-0.5 rounded-md" style={{ background: 'var(--aw-accent)', fontWeight: 700 }}>
                              <i className="fa-solid fa-lock" /> خرید اشتراک
                            </span>
                          </div>
                          <div className="text-[10px] text-[var(--aw-text-muted)] flex items-center gap-1"><i className="fa-solid fa-robot" /> {a.role}</div>
                          <div className="text-[12px] text-[var(--aw-text-secondary)] truncate">{__sessPreview[a.id] || 'برای شروع، پیام بدهید'}</div>
                        </div>
                      </div>
                      </SwipeToCall>
                    );
                  }
                  return (
                    <SwipeToCall key={a.id} onCall={() => startCall(a.name, a.role, a.bg, a.init, a.voip)}>
                    <div className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer border border-transparent hover:bg-[var(--aw-bg-card-hover)] active:scale-[0.98]"
                      onClick={() => {
                        if (a.id === 'assistant') { setEuScreen('euAssistantScreen'); return; }
                        if (a.id === 'restaurant') { setEuScreen('euDineScreen'); return; }
                        if (a.id === 'support') { setEuScreen('euSupportScreen'); return; }
                        if (a.id === 'market') { setEuScreen('euMarketScreen'); return; }
                        openChat(a.id, 'eu');
                      }}>
                      <div className={`w-12 h-12 rounded-[10px] flex items-center justify-center text-white flex-shrink-0 relative ${a.bg}`} style={{ fontWeight: 700, fontSize: 18 }}>
                        {a.init}
                        <span className="absolute bottom-0.5 left-0.5 w-[13px] h-[13px] rounded-full border-2 border-[var(--aw-bg-app)]" style={{ background: 'var(--aw-online)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-sm" style={{ fontWeight: 600 }}>{a.name}</span>
                          <span className="text-[11px] text-[var(--aw-text-muted)]">{a.lastTime || 'الان'}</span>
                        </div>
                        <div className="text-[10px] text-[var(--aw-text-muted)] flex items-center gap-1"><i className="fa-solid fa-robot" /> {a.role}</div>
                        <div className="flex items-center justify-between">
                          <div className="text-[12px] text-[var(--aw-text-secondary)] truncate flex-1">{__sessPreview[a.id] || 'برای شروع، پیام بدهید'}</div>
                          {unread > 0 && (
                            <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-[9px] flex-shrink-0 mr-1" style={{ background: 'var(--aw-danger)', fontWeight: 700 }}>
                              {toFa(unread)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    </SwipeToCall>
                  );
                }

                // User conversation
                const u = USER_CONVERSATIONS.find(uc => uc.id === item.key);
                if (!u) return null;
                if (sq && !u.name.toLowerCase().includes(sq) && !u.lastMsg.toLowerCase().includes(sq)) return null;
                return (
                  <SwipeToCall key={u.id} onCall={() => startCall(u.name, (u as any).isGroup ? 'گروه' : 'کاربر', u.bg, u.init, '')}>
                  <div className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer border border-transparent hover:bg-[var(--aw-bg-card-hover)] active:scale-[0.98]"
                    onClick={() => openChat(u.id, 'eu')}>
                    <div className="relative flex-shrink-0">
                      <LetterAvatar name={u.name} init={u.init} size={48} radius={14} />
                      {u.online && (
                        <span className="absolute bottom-0.5 left-0.5 w-[13px] h-[13px] rounded-full border-2 border-[var(--aw-bg-app)]" style={{ background: 'var(--aw-online)' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-sm" style={{ fontWeight: 600 }}>{u.name}</span>
                        <span className="text-[11px] text-[var(--aw-text-muted)]">{u.time}</span>
                      </div>
                      <div className="text-[10px] text-[var(--aw-text-muted)] flex items-center gap-1">
                        <i className={`fa-solid ${(u as any).isGroup ? 'fa-users' : 'fa-user'}`} /> {(u as any).isGroup ? 'گروه' : 'کاربر'}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-[12px] text-[var(--aw-text-secondary)] truncate flex-1">{u.lastMsg}</div>
                        {u.unread > 0 && (
                          <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-[9px] flex-shrink-0 mr-1" style={{ background: 'var(--aw-danger)', fontWeight: 700 }}>
                            {toFa(u.unread)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  </SwipeToCall>
                );
              });
              return rendered.some(Boolean) ? rendered : (
                <div className="text-center text-[12px] text-[var(--aw-text-muted)] py-12">
                  <i className="fa-solid fa-comment-slash text-[22px] mb-2 block opacity-50" />
                  {chatFilter.startsWith('cat_') ? 'این دسته هنوز گفتگویی ندارد' : 'گفتگویی در این دسته نیست'}
                  {chatFilter.startsWith('cat_') && (
                    <div className="mt-3">
                      <button onClick={() => openManageCat(chatFilter)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] border-none cursor-pointer text-white text-[12px] active:scale-95 transition-transform"
                        style={{ background: 'var(--aw-eu-primary, #7B62FC)', fontWeight: 700 }}>
                        <i className="fa-solid fa-plus text-[11px]" /> افزودن گفتگو
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
            {/* گروه‌ها — بعد از ایجنت‌ها */}
            {(chatFilter === 'all' || chatFilter === 'unread') && __groups
              .filter((g: any) => { const sq = searchQuery.trim(); return !sq || String(g.name || '').includes(sq) || String(g.lastText || '').includes(sq); })
              .map((g: any) => (
              <div key={'pgroup_' + g.id} className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer border border-transparent hover:bg-[var(--aw-bg-card-hover)] active:scale-[0.98]"
                onClick={() => openChat('pgroup_' + g.id, 'contact', { name: g.name, init: 'گ', bg: 'bg-[var(--aw-eu-primary,#7B62FC)]', sub: toFa(g.memberCount || (g.members || []).length) + ' عضو' } as any, [])}>
                <div className="relative flex-shrink-0 w-12 h-12 rounded-[14px] flex items-center justify-center text-white" style={{ background: 'var(--aw-eu-primary,#7B62FC)' }}><i className="fa-solid fa-users text-[18px]" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5"><span className="text-sm" style={{ fontWeight: 600 }}>{g.name}</span></div>
                  <div className="text-[10px] text-[var(--aw-text-muted)] flex items-center gap-1"><i className="fa-solid fa-users" /> گروه · {toFa(g.memberCount || (g.members || []).length)} عضو</div>
                  <div className="text-[12px] text-[var(--aw-text-secondary)] truncate">{g.lastText}</div>
                </div>
              </div>
            ))}
            {/* گفتگوهای کاربر-به-کاربرِ نورا — بعد از ایجنت‌ها */}
            {(chatFilter === 'all' || chatFilter === 'unread') && __peerConvs
              .filter((c: any) => { const sq = searchQuery.trim(); return !sq || String(c.name || '').includes(sq) || String(c.lastText || '').includes(sq); })
              .map((c: any) => (
              <SwipeToCall key={'peer_' + c.sub} onCall={() => startCall(c.name, 'کاربر نورا', 'bg-[var(--aw-eu-primary,#7B62FC)]', String(c.name || '?').charAt(0), '')}>
                <div className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer border border-transparent hover:bg-[var(--aw-bg-card-hover)] active:scale-[0.98]"
                  onClick={() => openChat('peer_' + c.sub, 'contact', { name: c.name, init: String(c.name || '?').charAt(0), bg: 'bg-[var(--aw-eu-primary,#7B62FC)]', sub: 'کاربر نورا' } as any, [])}>
                  <div className="relative flex-shrink-0"><LetterAvatar name={c.name} init={String(c.name || '?').charAt(0)} size={48} radius={14} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-sm" style={{ fontWeight: 600 }}>{c.name}</span>
                    </div>
                    <div className="text-[10px] text-[var(--aw-text-muted)] flex items-center gap-1"><i className="fa-solid fa-user" /> کاربر نورا</div>
                    <div className="text-[12px] text-[var(--aw-text-secondary)] truncate">{c.lastText}</div>
                  </div>
                </div>
              </SwipeToCall>
            ))}
          </div>
        </>
      ) : (
        <div className="p-4">
          {/* Search bar */}
          <div className="mb-3">
            <div className="flex items-center gap-2 rounded-[10px] px-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
              <i className="fa-solid fa-search text-[12px] text-[var(--aw-text-muted)]" />
              <input
                className="flex-1 bg-transparent border-none py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
                placeholder="جستجو در عامل‌ها..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="border-none bg-transparent text-[var(--aw-text-muted)] text-[12px] cursor-pointer hover:text-[var(--aw-primary)]" onClick={() => setSearchQuery('')}>
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>
          </div>

          {/* Conversations done by AI assistant on behalf of user */}
          <div className="mt-0">
            <h4 className="text-[13px] mb-2.5 flex items-center gap-1.5" style={{ fontWeight: 700, color: 'var(--aw-text-primary)' }}>
              <i className="fa-solid fa-headset text-[12px] text-[var(--aw-eu-primary)]" /> گفتگوهای دستیار از طرف شما
            </h4>
            {(() => {
              const ASSISTANT_CHATS: any[] = [];
              const sq = searchQuery.trim().toLowerCase();
              const filtered = ASSISTANT_CHATS.filter(c => {
                if (!sq) return true;
                return c.name.toLowerCase().includes(sq) || c.lastMsg.toLowerCase().includes(sq);
              });
              if (filtered.length === 0) return (
                <div className="text-center text-[12px] text-[var(--aw-text-muted)] py-6">گفتگویی یافت نشد</div>
              );
              return filtered.map(c => (
                <SwipeToCall key={c.id} onCall={() => startCall(c.name, 'گفتگوی دستیار', c.bg, c.init, '')}>
                <div className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer border border-transparent hover:bg-[var(--aw-bg-card-hover)] active:scale-[0.98]"
                  onClick={() => openChat(c.id, 'eu')}>
                  <div className={`w-12 h-12 rounded-[10px] flex items-center justify-center text-white flex-shrink-0 relative ${c.bg}`} style={{ fontWeight: 700, fontSize: 18 }}>
                    {c.init}
                    <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-[var(--aw-bg-app)]" style={{ background: 'var(--aw-eu-primary, #7B62FC)', fontSize: 8 }}>
                      <i className="fa-solid fa-robot text-white" />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-sm" style={{ fontWeight: 600 }}>{c.name}</span>
                      <span className="text-[11px] text-[var(--aw-text-muted)]">{c.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[12px] text-[var(--aw-text-secondary)] truncate flex-1">{c.lastMsg}</div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md flex-shrink-0 mr-1 ${c.status === 'done' ? 'text-green-400' : 'text-yellow-400'}`}
                        style={{ background: c.status === 'done' ? 'rgba(0,230,118,0.12)' : 'rgba(255,193,7,0.12)', fontWeight: 600 }}>
                        {c.status === 'done' ? 'انجام‌شده' : 'در جریان'}
                      </span>
                    </div>
                  </div>
                </div>
                </SwipeToCall>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// ========================
// EU AGENT DISCOVERY
// ========================
function EuAgentDiscoveryScreen() {
  const { agents, openChat, startCall, openModal, setEuScreen, goBack, openUnifiedCall } = useApp();
  const [search, setSearch] = useState('');

  const allAgents = agents.filter(a => !a.locked && (!search || a.name.includes(search) || a.role.includes(search)));
  const grouped: Record<string, Agent[]> = {};
  allAgents.forEach(a => {
    const comp = a.company || 'alpha';
    if (!grouped[comp]) grouped[comp] = [];
    grouped[comp].push(a);
  });

  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll">
      <div className="p-4">
        <h3 className="text-base mb-3 flex items-center gap-1.5" style={{ fontWeight: 700 }}>
          <button
            className="w-8 h-8 rounded-[10px] bg-transparent border border-[var(--aw-border)] text-[var(--aw-text-secondary)] cursor-pointer flex items-center justify-center hover:text-[var(--aw-eu-primary)] hover:border-[var(--aw-eu-primary)] transition-all"
            onClick={goBack}
          >
            <i className="fa-solid fa-arrow-right text-sm" />
          </button>
          <i className="fa-solid fa-search text-[var(--aw-eu-primary)]" /> جستجوی عامل‌ها
        </h3>
      </div>
      <div className="px-4 pb-2.5 flex gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-[10px] px-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
          <i className="fa-solid fa-search text-sm text-[var(--aw-text-muted)]" />
          <input className="flex-1 bg-transparent border-none py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]" placeholder="جستجوی عامل در همه شرکت‌ها..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && (
            <button className="bg-transparent border-none text-[var(--aw-text-muted)] cursor-pointer text-sm" onClick={() => setSearch('')}>
              <i className="fa-solid fa-times" />
            </button>
          )}
        </div>
        <button
          className="w-[42px] h-[42px] rounded-[10px] border border-[var(--aw-border)] text-[var(--aw-secondary)] cursor-pointer flex items-center justify-center text-base hover:border-[var(--aw-secondary)] hover:bg-[var(--aw-secondary)] hover:text-white transition-all"
          style={{ background: 'var(--aw-bg-input)' }}
          onClick={openUnifiedCall}
          title="تماس با فیلتر"
        >
          <i className="fa-solid fa-phone" />
        </button>
      </div>
      <div className="px-4">
        {Object.entries(grouped).map(([compKey, compAgents]) => (
          <div key={compKey}>
            <div className="text-[12px] text-[var(--aw-text-muted)] py-2.5 px-1 flex items-center gap-1.5" style={{ fontWeight: 700 }}>
              <i className="fa-solid fa-building" /> {COMPANIES[compKey]?.name || compKey}
            </div>
            {compAgents.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3.5 rounded-[10px] mb-2 cursor-pointer border transition-all hover:border-[var(--aw-eu-primary)]" style={{ background: 'var(--aw-eu-card)', borderColor: 'rgba(126,95,170,0.15)' }}
                onClick={() => openChat(a.id, 'eu')}>
                <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-white text-base relative ${a.bg}`} style={{ fontWeight: 700 }}>
                  {a.init}
                  <span className="absolute bottom-0 left-0 w-2.5 h-2.5 rounded-full border-2 border-[var(--aw-bg-app)]" style={{ background: 'var(--aw-online)' }} />
                </div>
                <div className="flex-1">
                  <div className="text-[13px]" style={{ fontWeight: 600 }}>{a.name}</div>
                  <div className="text-[11px] text-[var(--aw-text-secondary)]">{a.role}</div>
                </div>
                <div className="flex gap-1.5">
                  <button className="w-[34px] h-[34px] rounded-lg border-none text-white cursor-pointer flex items-center justify-center text-[13px]" style={{ background: 'var(--aw-eu-primary, #7B62FC)' }} onClick={(e) => { e.stopPropagation(); openChat(a.id, 'eu'); }}>
                    <i className="fa-solid fa-comment" />
                  </button>
                  <button className="w-[34px] h-[34px] rounded-lg border-none text-white cursor-pointer flex items-center justify-center text-[13px]" style={{ background: 'var(--aw-secondary)' }} onClick={(e) => { e.stopPropagation(); startCall(a.name, a.role, a.bg, a.init, a.voip); }}>
                    <i className="fa-solid fa-phone" />
                  </button>
                  <button className="w-[34px] h-[34px] rounded-lg border-none text-white cursor-pointer flex items-center justify-center text-[13px]" style={{ background: 'var(--aw-primary, #2E86FF)' }} onClick={(e) => { e.stopPropagation(); openModal(a.name, <AgentProfileModal agent={a} />); }}>
                    <i className="fa-solid fa-info" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
        {Object.keys(grouped).length === 0 && (
          <div className="text-center py-12 text-[var(--aw-text-muted)]">
            <i className="fa-solid fa-robot text-[56px] opacity-25 block mb-5" />
            <p className="text-[13px]">عاملی یافت نشد</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AgentProfileModal({ agent: a }: { agent: Agent }) {
  const { closeModal, openChat, startCall } = useApp();
  const comp = COMPANIES[a.company || 'alpha'];
  return (
    <div>
      <div className="text-center mb-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-[26px] mx-auto mb-2.5 ${a.bg}`} style={{ fontWeight: 700 }}>{a.init}</div>
        <h3 className="text-base">{a.name}</h3>
        <p className="text-[12px] text-[var(--aw-text-secondary)]">{a.role}</p>
        {comp && <p className="text-[11px] text-[var(--aw-text-muted)]">{comp.name}</p>}
      </div>
      <div className="flex justify-between py-2 border-b border-[var(--aw-border-light)] text-[12px]">
        <span className="text-[var(--aw-text-secondary)]">وضعیت</span>
        <span className="text-[var(--aw-online)]" style={{ fontWeight: 700 }}>آنلاین</span>
      </div>
      <div className="flex justify-between py-2 border-b border-[var(--aw-border-light)] text-[12px]">
        <span className="text-[var(--aw-text-secondary)]">کارهای انجام شده</span>
        <span style={{ fontWeight: 700 }}>—</span>
      </div>
      <div className="flex justify-between py-2 border-b border-[var(--aw-border-light)] text-[12px]">
        <span className="text-[var(--aw-text-secondary)]">کارهای معلق</span>
        <span style={{ fontWeight: 700 }}>—</span>
      </div>
      {a.voip && (
        <div className="flex justify-between py-2 border-b border-[var(--aw-border-light)] text-[12px]">
          <span className="text-[var(--aw-text-secondary)]">داخلی VoIP</span>
          <span style={{ fontWeight: 700 }}>{a.voip}</span>
        </div>
      )}
      <div className="flex gap-2 mt-4">
        <button className="flex-1 py-2.5 px-5 border-none rounded-[10px] text-[13px] text-white cursor-pointer" style={{ background: 'var(--aw-secondary)', fontWeight: 600 }} onClick={() => { closeModal(); setTimeout(() => openChat(a.id, 'eu'), 200); }}>
          <i className="fa-solid fa-comment" /> چت
        </button>
        <button className="flex-1 py-2.5 px-5 border-none rounded-[10px] text-[13px] text-white cursor-pointer" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }} onClick={() => { closeModal(); startCall(a.name, a.role, a.bg, a.init, a.voip); }}>
          <i className="fa-solid fa-phone" /> تماس
        </button>
      </div>
    </div>
  );
}

// ========================
// EU ORDERS
// ========================
// EuOrdersScreen حذف شد: «سفارشاتِ من»یِ موازی و خراب (تاریخِ خام/۰ تومان) بود. حالا یک جای واحد داریم =
// تبِ «سفارشات»ِ مارکت (MarketOrdersTab)، که از هر ورودی با openMarketOrders باز می‌شود (R14/R10).

// orderitems: شرحِ سفارش را امن رِندر کن. آیتم‌های واقعیِ داین/مارکت آرایه‌ای از آبجکت‌اند
// ({name,qty,price})؛ رِندرِ مستقیمِ آرایهٔ آبجکت به‌عنوانِ فرزندِ React خطای #31 می‌دهد (کرشِ صفحه).
function __orderItemsText(o: any): string {
  const it = o && (o.items ?? o.desc);
  if (Array.isArray(it)) {
    return it.map((x: any) => {
      if (x == null) return '';
      if (typeof x === 'string') return x;
      const nm = x.name || x.title || '';
      return x.qty && x.qty > 1 ? `${nm}×${x.qty}` : nm;
    }).filter(Boolean).join('، ') || (it.length ? it.length + ' قلم' : '');
  }
  if (it && typeof it === 'object') return it.name || it.title || '';
  return it != null ? String(it) : '';
}

// orderdate: تاریخِ ISO را به تاریخِ فارسیِ خوانا تبدیل کن (وگرنه رشتهٔ فعلی مثل «هم‌اکنون» را نگه‌دار)
function __faOrderDate(d: any): string {
  if (!d) return '';
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) { const dt = new Date(s); if (!isNaN(dt.getTime())) return dt.toLocaleDateString('fa-IR') + ' ' + dt.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }); }
  return s;
}

export function OrderDetail({ order: o }: { order: Order }) {
  const { closeModal, openChat, openModal, showToast } = useApp() as any;
  const __num = (o as any).num || (o as any).id || '';
  const __st = String((o as any).status || '');
  const __statusLabel = (ORDER_STATUS_LABELS as any)[o.status] || ((__st === 'return_requested') ? 'درخواستِ مرجوعی' : (__st === 'refunded' ? 'مرجوعی‌شده' : 'ثبت شد'));
  const __canReturn = !['return_requested', 'refunded', 'cancelled'].includes(__st);

  return (
    <div>
      <div className="text-center mb-4">
        <i className={`${orderIcon(o).icon} text-[40px] text-[var(--aw-eu-primary)] mb-2.5 block`} />
        <h3>سفارش #{__num}</h3>
      </div>
      <div className="flex justify-between py-2 border-b border-[var(--aw-border-light)] text-[12px]">
        <span className="text-[var(--aw-text-secondary)]">وضعیت</span>
        <span style={{ fontWeight: 700, color: ORDER_STATUS_COLORS[o.status]?.text }}>{ORDER_STATUS_LABELS[o.status]}</span>
      </div>
      <div className="flex justify-between py-2 border-b border-[var(--aw-border-light)] text-[12px]">
        <span className="text-[var(--aw-text-secondary)]">شرح</span>
        <span style={{ fontWeight: 600 }}>{__orderItemsText(o)}</span>
      </div>
      <div className="flex justify-between py-2 border-b border-[var(--aw-border-light)] text-[12px]">
        <span className="text-[var(--aw-text-secondary)]">مبلغ کل</span>
        <span style={{ fontWeight: 700 }}>{(o as any).total != null ? Number((o as any).total).toLocaleString('fa-IR') + ' تومان' : ((o as any).price + ' ریال')}</span>
      </div>
      <div className="flex justify-between py-2 border-b border-[var(--aw-border-light)] text-[12px]">
        <span className="text-[var(--aw-text-secondary)]">تاریخ</span>
        <span style={{ fontWeight: 700 }}>{__faOrderDate(o.date)}</span>
      </div>
      <div className="flex gap-2 mt-4">
        <button className="flex-1 py-2.5 px-3 border-none rounded-[10px] text-[13px] text-white cursor-pointer" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }}
          onClick={() => { closeModal(); setTimeout(() => openChat('assistant', 'eu', undefined, [{ id: Date.now(), text: `پیگیری سفارش #${__num} — وضعیت: ${__statusLabel}`, sent: false, time: '' } as any]), 200); }}>
          <i className="fa-solid fa-comment" /> پیگیری با دستیار
        </button>
        <button className="flex-1 py-2.5 px-3 rounded-[10px] text-[13px] cursor-pointer" style={{ background: 'transparent', border: '1px solid var(--aw-eu-primary)', color: 'var(--aw-eu-primary)', fontWeight: 600 }}
          onClick={() => openModal('فاکتور سفارش', <OrderInvoice order={o} />)}>
          <i className="fa-solid fa-file-invoice" /> مشاهده فاکتور
        </button>
      </div>
      {__st === 'return_requested' && <div className="mt-2 text-[11px] text-center text-[#F59E0B]"><i className="fa-solid fa-clock ml-1" />درخواستِ مرجوعی ثبت شد و در انتظارِ تأییدِ فروشنده است.</div>}
      {__st === 'refunded' && <div className="mt-2 text-[11px] text-center text-[#10B981]"><i className="fa-solid fa-check ml-1" />مرجوعی تأیید و وجه به کیفِ‌پولتان بازگشت.</div>}
      {__canReturn && (o as any).source === 'market' && (
        <button className="w-full mt-2 py-2.5 rounded-[10px] text-[12px] cursor-pointer" style={{ background: 'transparent', border: '1px solid var(--aw-danger)', color: 'var(--aw-danger)', fontWeight: 600 }}
          onClick={() => openModal('درخواست مرجوعی', <ReturnRequestForm order={o} />)}>
          <i className="fa-solid fa-rotate-left ml-1" /> درخواست مرجوعی
        </button>
      )}
    </div>
  );
}

// فرمِ درخواستِ مرجوعیِ خریدار: دلیل + ثبت روی سرور (سفارش «درخواستِ مرجوعی» می‌شود و فروشنده مطلع).
function ReturnRequestForm({ order: o }: { order: any }) {
  const { closeModal, showToast, setEuPlacedOrders } = useApp() as any;
  const [reason, setReason] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const REASONS = ['کالا معیوب بود', 'مغایرت با توضیحات', 'اشتباه در سفارش', 'دیگر نمی‌خواهم'];
  const submit = async () => {
    if (busy) return; setBusy(true);
    try {
      await (api as any).requestReturn(o.id, reason.trim() || 'بدون توضیح');
      showToast && showToast('درخواستِ مرجوعی ثبت شد ✅', 'success');
      try { const _o: any = await (api as any).myOrders(); if (Array.isArray(_o)) setEuPlacedOrders(_o); } catch (_e) {}
      closeModal();
    } catch (e: any) {
      const dup = e && String(e.message || e).includes('already');
      showToast && showToast(dup ? 'قبلاً برای این سفارش درخواست ثبت شده' : 'ثبتِ درخواست ناموفق بود', 'error');
    } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[12px] text-[var(--aw-text-secondary)]">دلیلِ مرجوعیِ سفارش #{toFa(String(o.num || o.id || ''))} را انتخاب یا بنویس:</div>
      <div className="flex flex-wrap gap-1.5">
        {REASONS.map(r => (
          <button key={r} onClick={() => setReason(r)} className="text-[11px] px-2.5 py-1.5 rounded-full cursor-pointer" style={reason === r ? { background: 'var(--aw-eu-primary)', color: '#fff', border: 'none', fontWeight: 700 } : { background: 'transparent', border: '1px solid var(--aw-border)', color: 'var(--aw-text-secondary)' }}>{r}</button>
        ))}
      </div>
      <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="توضیحِ بیشتر (اختیاری)" rows={2}
        className="w-full rounded-[10px] px-3 py-2 text-[12px] text-[var(--aw-text-primary)] outline-none border border-[var(--aw-border)] resize-none" style={{ background: 'var(--aw-bg-input)' }} />
      <div className="grid grid-cols-2 gap-2">
        <button onClick={submit} disabled={busy} className="py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[13px]" style={{ background: 'var(--aw-danger)', fontWeight: 700, opacity: busy ? 0.6 : 1 }}>{busy ? 'در حال ثبت…' : 'ثبتِ درخواست'}</button>
        <button onClick={closeModal} className="py-2.5 rounded-[10px] cursor-pointer text-[13px] bg-transparent" style={{ border: '1px solid var(--aw-border)', color: 'var(--aw-text-secondary)', fontWeight: 700 }}>انصراف</button>
      </div>
    </div>
  );
}

// فاکتورِ رسمیِ سفارش (مشتری و فروشنده هر دو): سرآیتم‌ها با قیمتِ واحد×تعداد=جمعِ خط، جمعِ جزء، حق‌سرویس/مالیاتِ
// داین (اگر بود)، مبلغِ کل، کش‌بک، روشِ پرداخت، وضعیت. قابلِ چاپ/ذخیره‌یِ PDF (چاپِ مرورگر). دادهٔ واقعیِ همان سفارش.
export function OrderInvoice({ order: o }: { order: any }) {
  const num = o.num || o.id || '';
  const __src: any[] = Array.isArray(o.lines) ? o.lines : (Array.isArray(o.items) ? o.items : []);
  const lines: any[] = __src.map((it: any) => ({ name: it.name || 'کالا', qty: Number(it.qty) || 1, price: Number(it.priceNum ?? it.price) || 0 }));
  const computed = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const total = Number(o.total) || computed;
  const svc = Number(o.service) || 0, tax = Number(o.tax) || 0;
  const subtotal = (svc || tax) ? Math.max(0, total - svc - tax) : (computed || total);
  const fa = (n: number) => (Number(n) || 0).toLocaleString('fa-IR');
  const row = (label: string, val: string, strong = false) => (
    <div className="flex justify-between py-1.5 text-[12px]" style={{ borderBottom: '1px dashed var(--aw-border-light)' }}>
      <span className="text-[var(--aw-text-secondary)]">{label}</span>
      <span style={{ fontWeight: strong ? 800 : 600, color: 'var(--aw-text-primary)' }}>{val}</span>
    </div>
  );
  return (
    <div id="neura-invoice">
      <div className="text-center mb-3">
        <div className="text-[15px]" style={{ fontWeight: 800, color: 'var(--aw-eu-primary)' }}>فاکتور فروش</div>
        <div className="text-[11px] text-[var(--aw-text-muted)]">نئورا · شماره #{toFa(String(num))}</div>
      </div>
      {row('فروشنده', o.vendor || o.shop || 'فروشگاه')}
      {row('تاریخ', __faOrderDate(o.date))}
      {row('وضعیت', (ORDER_STATUS_LABELS as any)[o.status] || 'ثبت‌شده')}
      <div className="mt-3 mb-1 text-[12px]" style={{ fontWeight: 700 }}>اقلام</div>
      <div className="rounded-[10px] overflow-hidden" style={{ border: '1px solid var(--aw-border)' }}>
        <div className="flex text-[10px] px-2 py-1.5" style={{ background: 'var(--aw-bg-input)', color: 'var(--aw-text-muted)', fontWeight: 700 }}>
          <span className="flex-1">کالا</span><span className="w-10 text-center">تعداد</span><span className="w-24 text-left">قیمت واحد</span><span className="w-24 text-left">جمع</span>
        </div>
        {lines.length === 0 && <div className="px-2 py-3 text-[11px] text-center text-[var(--aw-text-muted)]">{__orderItemsText(o)}</div>}
        {lines.map((l, i) => (
          <div key={i} className="flex text-[11px] px-2 py-1.5 items-center" style={{ borderTop: '1px solid var(--aw-border-light)' }}>
            <span className="flex-1" style={{ fontWeight: 600 }}>{l.name}</span>
            <span className="w-10 text-center">{toFa(l.qty)}</span>
            <span className="w-24 text-left" style={{ direction: 'ltr' }}>{fa(l.price)}</span>
            <span className="w-24 text-left" style={{ direction: 'ltr', fontWeight: 700 }}>{fa(l.price * l.qty)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3">
        {row('جمع اقلام', fa(subtotal) + ' تومان')}
        {svc > 0 && row('حق سرویس', fa(svc) + ' تومان')}
        {tax > 0 && row('مالیات', fa(tax) + ' تومان')}
        {o.cashback ? row('کش‌بک', '+' + fa(o.cashback) + ' تومان') : null}
        {row('روش پرداخت', 'کیف پول نئورا')}
        {row('مبلغ کل', fa(total) + ' تومان', true)}
      </div>
      <button onClick={() => { try { window.print(); } catch (_e) {} }} className="w-full mt-4 py-2.5 rounded-[10px] border-none text-white text-[13px] cursor-pointer" style={{ background: 'var(--aw-eu-primary, #7B62FC)', fontWeight: 700 }}>
        <i className="fa-solid fa-print ml-1.5" /> چاپ / ذخیرهٔ فاکتور
      </button>
    </div>
  );
}

// ========================
// EU PROFILE
// ========================
function EuProfileScreen() {
  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll">
      <EuProfileBody />
    </div>
  );
}

export function EuProfileBody() {
  const { euProfile, openModal } = useApp();
  const back = () => openModal('پروفایل من', <EuProfileBody />);

  return (
    <>
      {/* Profile Header */}
      <div className="text-center py-6">
        <div className="w-[88px] h-[88px] rounded-full flex items-center justify-center text-white text-[38px] mx-auto mb-3 overflow-hidden" style={{ background: euProfile.avatarImage ? 'transparent' : '#7b62fc', boxShadow: euProfile.avatarImage ? 'none' : '0 8px 24px rgba(123,98,252,0.4)', fontWeight: 700 }}>
          {euProfile.avatarImage
            ? <img src={euProfile.avatarImage} alt={euProfile.name} className="w-full h-full object-cover" />
            : euProfile.avatar}
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="text-[20px]" style={{ fontWeight: 700, color: 'var(--aw-text-primary)' }}>{euProfile.name}</div>
          {euProfile.verified ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px]"
              style={{ background: 'rgba(52,199,89,0.15)', color: '#34C759', fontWeight: 700 }}>
              احراز شده
            </span>
          ) : (
            <button onClick={() => openModal('احراز هویت', <ProfileContent />)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border-none cursor-pointer"
              style={{ background: 'rgba(255,56,60,0.12)', color: '#FF383C', fontWeight: 700 }}>
              <i className="fa-solid fa-circle-exclamation text-[9px]" />
              احراز نشده!
            </button>
          )}
        </div>
        {euProfile.username && <div className="text-[13px] text-[#5C4ABD] mt-0.5" style={{ fontWeight: 700 }} dir="ltr">@{euProfile.username}</div>}
        {euProfile.email && <div className="text-[13px] text-[#8F8F8F] mt-0.5">{euProfile.email}</div>}
      </div>

      {/* Settings — unified with admin structure (SettingsGroup / SettingsItem) */}
      <div className="px-4">
        <SettingsGroup title="حساب کاربری">
          <SettingsItem icon="fa-solid fa-user-pen" label="ویرایش پروفایل" onClick={() => openModal('ویرایش پروفایل', <ProfileContent />, back)} />
          <SettingsItem icon="fa-solid fa-wallet" label="مالی" onClick={() => openModal('بخش مالی', <EuFinanceContent />, back)} />
          <SettingsItem icon="fa-solid fa-shield-halved" label="تنظیمات امنیتی" onClick={() => openModal('تنظیمات امنیتی', <EuSecurityContent />, back)} />
          <SettingsItem icon="fa-solid fa-bell" label="اعلان‌ها" onClick={() => openModal('اعلان‌ها', <EuNotifications />, back)} />
          <SettingsItem icon="fa-solid fa-cog" label="تنظیمات" onClick={() => openModal('تنظیمات برنامه', <EuAppSettings />, back)} />
        </SettingsGroup>

        <SettingsGroup title="سایر">
          <SettingsItem icon="fa-solid fa-headset" label="پشتیبانی" onClick={() => openModal('پشتیبانی', <EuSupportContent />, back)} />
          <SettingsItem icon="fa-solid fa-circle-question" label="سوالات متداول" onClick={() => openModal('سوالات متداول', <EuFaqContent />, back)} />
          <SettingsItem icon="fa-solid fa-file-contract" label="قوانین و حریم خصوصی" onClick={() => openModal('قوانین و حریم خصوصی', <EuLegalContent />, back)} />
          <SettingsItem icon="fa-solid fa-question-circle" label="راهنما" onClick={() => openModal('راهنما', <HelpContent />, back)} />
          <SettingsItem icon="fa-solid fa-sign-out-alt" label="خروج" danger onClick={() => openModal('خروج', <EuLogoutContent />, back)} />
        </SettingsGroup>
      </div>
    </>
  );
}

// ====== FINANCE ======
type FinanceTab = 'wallet' | 'history' | 'methods' | 'invoices' | 'transactions';

function EuFinanceContent() {
  const { showToast, euPlacedOrders, walletBalance, walletTx, walletDeposit, walletWithdraw } = useApp() as any;
  const orders = (euPlacedOrders || []) as any[]; // euorders: تاریخچه/فاکتور از سفارش‌های واقعیِ کاربر
  const [tab, setTab] = useState<FinanceTab>('wallet');
  const balance = walletBalance;
  const [opAmount, setOpAmount] = useState('');
  const [opMode, setOpMode] = useState<'deposit' | 'withdraw' | null>(null);

  const transactions = (walletTx || []).map((t: any, i: number) => ({ id: i, type: (t.amount >= 0 ? 'deposit' : (t.type === 'purchase' ? 'purchase' : 'withdraw')) as 'deposit' | 'withdraw' | 'purchase', amount: t.amount, date: t.date, desc: t.title }));

  // invoicereal: فاکتور از سفارش‌های واقعیِ کاربر (هر سفارش = یک فاکتور) — نه تبِ همیشه‌خالی
  const invoices: { id: string; date: string; amount: string; status: 'paid' | 'pending' | 'refund'; desc: string }[] = orders.map((o: any) => ({
    id: String(o.num || o.id || ''),
    date: o.date || '',
    amount: (Number(String(o.total).replace(/[^\d]/g, '')) || 0).toLocaleString('fa-IR') + ' تومان',
    status: (o.status === 'delivered' ? 'paid' : (o.status === 'cancelled' ? 'refund' : 'pending')) as 'paid' | 'pending' | 'refund',
    desc: (o.source === 'dine' ? 'سفارش غذا' : 'خرید از مارکت') + (o.restaurant ? ' — ' + o.restaurant : ''),
  }));

  const [paymentMethods, setPaymentMethods] = useState<any[]>([{ id: 'pm_wallet', type: 'wallet', label: 'کیف پول Neura', last4: '', icon: 'fa-solid fa-wallet', color: '#8B5CF6', isDefault: true }]);
  useEffect(() => { (async () => { try { const pm: any = await (api as any).myList('payment_methods'); if (Array.isArray(pm)) setPaymentMethods([{ id: 'pm_wallet', type: 'wallet', label: 'کیف پول Neura', last4: '', icon: 'fa-solid fa-wallet', color: '#8B5CF6', isDefault: pm.length === 0 }, ...pm]); } catch (_) {} })(); }, []);
  const addPaymentMethod = async () => {
    const bank = (typeof window !== 'undefined' && window.prompt) ? window.prompt('نام بانک/کارت:') : '';
    if (!bank || !bank.trim()) return;
    const last4raw = (typeof window !== 'undefined' && window.prompt) ? window.prompt('۴ رقمِ آخرِ کارت:') : '';
    const last4 = String(last4raw || '').replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/\D/g, '').slice(-4);
    const rec: any = { id: 'pm_' + Date.now(), type: 'card', label: bank.trim(), last4, icon: 'fa-solid fa-credit-card', color: '#3B82F6', isDefault: false };
    try { await (api as any).myCreate('payment_methods', rec); setPaymentMethods(prev => [...prev, rec]); showToast('روش پرداخت افزوده شد'); } catch (_) { showToast('خطا در افزودن روش پرداخت'); }
  };
  const removePaymentMethod = async (id: string) => {
    if (id === 'pm_wallet') { showToast('کیف پول قابلِ حذف نیست'); return; }
    try { await (api as any).myRemove('payment_methods', id); setPaymentMethods(prev => prev.filter(p => p.id !== id)); showToast('روش پرداخت حذف شد'); } catch (_) { showToast('خطا در حذف'); }
  };

  const formatNum = (n: number) => Math.abs(n).toLocaleString('fa-IR');

  const submitOp = () => {
    const parsed = parseInt(String(opAmount).replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^\d]/g, ''), 10);
    if (!parsed || parsed <= 0) { showToast('مبلغ معتبر وارد کنید'); return; }
    if (opMode === 'withdraw' && parsed > balance) { showToast('موجودی کافی نیست'); return; }
    (opMode === 'deposit' ? walletDeposit(parsed) : walletWithdraw(parsed)); // toastِ نتیجه داخلِ تابع، بعد از تأییدِ سرور
    setOpMode(null); setOpAmount('');
  };

  const TABS: { id: FinanceTab; label: string; icon: string }[] = [
    { id: 'wallet',       label: 'کیف پول',       icon: 'fa-solid fa-wallet' },
    { id: 'history',      label: 'تاریخچه خرید',  icon: 'fa-solid fa-clock-rotate-left' },
    { id: 'invoices',     label: 'فاکتورها',       icon: 'fa-solid fa-file-invoice' },
    { id: 'transactions', label: 'تراکنش‌ها',      icon: 'fa-solid fa-right-left' },
  ];

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto aw-scroll pb-1">
        {TABS.map(t => (
          <button key={t.id}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border text-[11px] cursor-pointer whitespace-nowrap shrink-0 transition-all"
            style={tab === t.id
              ? { background: 'color-mix(in srgb, var(--aw-eu-primary) 20%, transparent)', color: 'var(--aw-eu-primary)', borderColor: 'color-mix(in srgb, var(--aw-eu-primary) 45%, transparent)', fontWeight: 700, backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }
              : { background: 'var(--aw-eu-nav-bg)', color: 'var(--aw-text-secondary)', borderColor: 'var(--aw-eu-nav-border)', fontWeight: 500, backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}
            onClick={() => setTab(t.id)}>
            <i className={`${t.icon} text-[10px]`} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'wallet' && (
        <div>
          <div className="p-4 rounded-2xl mb-3 relative overflow-hidden"
            style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--aw-eu-primary) 18%, var(--aw-bg-modal)), var(--aw-bg-modal))', border: '1px solid color-mix(in srgb, var(--aw-eu-primary) 30%, var(--aw-border))', backdropFilter: 'blur(24px) saturate(1.4)', WebkitBackdropFilter: 'blur(24px) saturate(1.4)' }}>
            <div className="aw-chat-pattern aw-pattern-sm" style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 1, pointerEvents: 'none', zIndex: 0 }} />
            <div className="relative z-[1]">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--aw-eu-primary) 20%, transparent)', border: '1px solid color-mix(in srgb, var(--aw-eu-primary) 35%, transparent)', color: 'var(--aw-eu-primary)' }}>
                  <i className="fa-solid fa-wallet text-[18px]" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p className="text-[11px] m-0" style={{ color: 'var(--aw-text-secondary)', fontWeight: 500 }}>موجودی کیف پول</p>
                  <h2 className="text-[24px] m-0 mt-0.5" style={{ fontWeight: 900, direction: 'ltr', unicodeBidi: 'plaintext', color: 'var(--aw-text-primary)' }}>{formatNum(balance)} <span className="text-[11px]" style={{ color: 'var(--aw-text-secondary)', fontWeight: 700 }}>تومان</span></h2>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="flex-1 py-2 rounded-xl text-[12px] cursor-pointer"
                  style={{ background: 'color-mix(in srgb, #10B981 18%, transparent)', color: '#10B981', border: '1px solid color-mix(in srgb, #10B981 40%, transparent)', fontWeight: 700, backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}
                  onClick={() => { setOpMode('deposit'); setOpAmount(''); }}>
                  <i className="fa-solid fa-arrow-down text-[11px] ml-1" /> واریز
                </button>
                <button className="flex-1 py-2 rounded-xl text-[12px] cursor-pointer"
                  style={{ background: 'color-mix(in srgb, var(--aw-eu-primary) 18%, transparent)', color: 'var(--aw-eu-primary)', border: '1px solid color-mix(in srgb, var(--aw-eu-primary) 40%, transparent)', fontWeight: 700, backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}
                  onClick={() => { setOpMode('withdraw'); setOpAmount(''); }}>
                  <i className="fa-solid fa-arrow-up text-[11px] ml-1" /> برداشت
                </button>
              </div>
            </div>
          </div>

          {opMode && (
            <div className="rounded-[10px] border border-[var(--aw-border)] p-3 mb-3" style={{ background: 'var(--aw-bg-card)' }}>
              <div className="text-[12px] mb-2" style={{ fontWeight: 700 }}>
                {opMode === 'deposit' ? 'واریز به کیف پول' : 'برداشت از کیف پول'}
              </div>
              <input type="text" inputMode="numeric"
                className="w-full text-center py-2.5 rounded-[10px] border border-[var(--aw-border)] text-[16px] outline-none mb-2 text-[var(--aw-text-primary)]"
                style={{ background: 'var(--aw-bg-input)', fontWeight: 700 }}
                placeholder="مبلغ به تومان"
                value={opAmount}
                onChange={e => setOpAmount(__grpFa(e.target.value))} />
              <div className="flex gap-1.5 mb-2 flex-wrap">
                {[100000, 500000, 1000000, 2000000].map(v => (
                  <button key={v}
                    className="py-1 px-2.5 rounded-md border border-[var(--aw-border)] bg-transparent text-[10.5px] cursor-pointer text-[var(--aw-text-secondary)]"
                    onClick={() => setOpAmount(__grpFa(String(v)))}>
                    {v.toLocaleString('fa-IR')}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-[10px] border-none text-white text-[12px] cursor-pointer"
                  style={{ background: opMode === 'deposit' ? '#10B981' : '#F59E0B', fontWeight: 700 }}
                  onClick={submitOp}>
                  تأیید {opMode === 'deposit' ? 'واریز' : 'برداشت'}
                </button>
                <button className="px-4 rounded-[10px] border border-[var(--aw-border)] bg-transparent text-[12px] cursor-pointer text-[var(--aw-text-secondary)]"
                  onClick={() => setOpMode(null)}>انصراف</button>
              </div>
            </div>
          )}

          <div className="text-[11px] text-[var(--aw-text-muted)] mb-1.5 px-1" style={{ fontWeight: 700 }}>آخرین تراکنش‌ها</div>
          {transactions.slice(0, 5).map(t => (
            <div key={t.id} className="flex items-center gap-2.5 p-2.5 mb-1.5 rounded-[10px] border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: t.amount > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }}>
                <i className={`fa-solid ${t.amount > 0 ? 'fa-arrow-down' : 'fa-arrow-up'} text-[10px]`}
                  style={{ color: t.amount > 0 ? '#10B981' : '#EF4444' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11.5px] truncate" style={{ fontWeight: 600 }}>{t.desc}</div>
                <div className="text-[9.5px] text-[var(--aw-text-muted)]">{t.date}</div>
              </div>
              <div className="text-[12px] flex-shrink-0" style={{ color: t.amount > 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                {t.amount > 0 ? '+' : '−'}{formatNum(t.amount)}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-[var(--aw-text-muted)] text-[11.5px]">
              <i className="fa-solid fa-shopping-bag text-[28px] opacity-25 block mb-2" />
              تاریخچه‌ای موجود نیست
            </div>
          ) : orders.map(o => (
            <div key={o.id} className="flex items-center gap-3 p-3 rounded-[10px] mb-1.5 border border-[var(--aw-border)]"
              style={{ background: 'var(--aw-bg-card)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: ORDER_STATUS_COLORS[o.status]?.bg || 'var(--aw-primary-bg)' }}>
                <i className="fa-solid fa-receipt text-[12px]" style={{ color: ORDER_STATUS_COLORS[o.status]?.text || 'var(--aw-eu-primary)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px]" style={{ fontWeight: 600 }}>سفارش #{o.num}</div>
                <div className="text-[10px] text-[var(--aw-text-muted)]">{o.date}</div>
              </div>
              <div className="text-left">
                <div className="text-[11px]" style={{ fontWeight: 700 }}>{o.price}</div>
                <span className="text-[8.5px] px-1.5 py-0.5 rounded-md" style={{ background: ORDER_STATUS_COLORS[o.status]?.bg, color: ORDER_STATUS_COLORS[o.status]?.text, fontWeight: 700 }}>
                  {ORDER_STATUS_LABELS[o.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'methods' && (
        <div>
          {paymentMethods.map(pm => (
            <div key={pm.id} className="flex items-center gap-3 p-3 rounded-[10px] mb-1.5 border border-[var(--aw-border)]"
              style={{ background: 'var(--aw-bg-card)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ background: pm.color }}>
                <i className={`${pm.icon} text-[14px]`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px]" style={{ fontWeight: 600 }}>{pm.label}</span>
                  {pm.isDefault && <span className="text-[8px] px-1.5 py-0.5 rounded-md text-white" style={{ background: 'var(--aw-eu-primary, #7B62FC)', fontWeight: 700 }}>پیش‌فرض</span>}
                </div>
                <div className="text-[10.5px] text-[var(--aw-text-muted)]">
                  {pm.type === 'card' ? `**** **** **** ${pm.last4}` : 'موجودی داخلی'}
                </div>
              </div>
              {pm.id !== 'pm_wallet' && <button className="w-8 h-8 rounded-lg border border-[var(--aw-border)] bg-transparent cursor-pointer text-[var(--aw-text-muted)]"
                onClick={() => removePaymentMethod(pm.id)}>
                <i className="fa-solid fa-trash text-[10px]" />
              </button>}
            </div>
          ))}
          <button className="w-full py-2.5 rounded-[10px] border border-dashed text-[12px] cursor-pointer flex items-center justify-center gap-1.5"
            style={{ borderColor: 'var(--aw-eu-primary)', color: 'var(--aw-eu-primary)', background: 'transparent', fontWeight: 600 }}
            onClick={addPaymentMethod}>
            <i className="fa-solid fa-plus text-[10px]" /> افزودن روش پرداخت
          </button>
        </div>
      )}

      {tab === 'invoices' && (
        <div>
          {invoices.map(inv => {
            const meta = inv.status === 'paid'
              ? { label: 'پرداخت شده', color: '#10B981' }
              : inv.status === 'pending'
                ? { label: 'در انتظار', color: '#F59E0B' }
                : { label: 'مرجوع', color: '#EF4444' };
            return (
              <div key={inv.id} className="flex items-center gap-3 p-3 rounded-[10px] mb-1.5 border border-[var(--aw-border)]"
                style={{ background: 'var(--aw-bg-card)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${meta.color}18` }}>
                  <i className="fa-solid fa-file-invoice text-[12px]" style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px]" style={{ fontWeight: 600 }}>{inv.id}</div>
                  <div className="text-[10px] text-[var(--aw-text-muted)] truncate">{inv.desc} · {inv.date}</div>
                </div>
                <div className="text-left">
                  <div className="text-[11px]" style={{ fontWeight: 700 }}>{inv.amount}</div>
                  <span className="text-[8.5px] px-1.5 py-0.5 rounded-md" style={{ background: `${meta.color}18`, color: meta.color, fontWeight: 700 }}>{meta.label}</span>
                </div>
                <button className="w-8 h-8 rounded-lg border border-[var(--aw-border)] bg-transparent cursor-pointer text-[var(--aw-text-muted)]"
                  onClick={() => { const ok = __dlCsv('invoice-' + inv.id + '.csv', [inv]); showToast(ok ? 'فاکتور دانلود شد ✅' : 'خطا در دانلود'); }}>
                  <i className="fa-solid fa-download text-[10px]" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'transactions' && (
        <div>
          {transactions.map(t => (
            <div key={t.id} className="flex items-center gap-2.5 p-2.5 mb-1.5 rounded-[10px] border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: t.amount > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }}>
                <i className={`fa-solid ${t.type === 'deposit' ? 'fa-arrow-down' : t.type === 'withdraw' ? 'fa-arrow-up' : 'fa-bag-shopping'} text-[11px]`}
                  style={{ color: t.amount > 0 ? '#10B981' : '#EF4444' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11.5px] truncate" style={{ fontWeight: 600 }}>{t.desc}</div>
                <div className="text-[9.5px] text-[var(--aw-text-muted)]">{t.date} · {t.type === 'deposit' ? 'واریز' : t.type === 'withdraw' ? 'برداشت' : 'خرید'}</div>
              </div>
              <div className="text-[12px] flex-shrink-0" style={{ color: t.amount > 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                {t.amount > 0 ? '+' : '−'}{formatNum(t.amount)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ====== SECURITY ======
type SecurityTab = 'password' | 'twofa' | 'thirdparty' | 'logs';

function EuSecurityContent() {
  const { showToast } = useApp();
  const [tab, setTab] = useState<SecurityTab>('password');
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFAMethod, setTwoFAMethod] = useState<'sms' | 'app' | 'email'>('sms');
  const [pwdSaved, setPwdSaved] = useState(false);

  const [providers, setProviders] = useState([
    { id: 'google',   name: 'Google',   icon: 'fa-brands fa-google',   color: '#EA4335', connected: false, email: '' },
    { id: 'apple',    name: 'Apple',    icon: 'fa-brands fa-apple',    color: '#000000', connected: false, email: '' },
    { id: 'github',   name: 'GitHub',   icon: 'fa-brands fa-github',   color: '#181717', connected: false, email: '' },
    { id: 'linkedin', name: 'LinkedIn', icon: 'fa-brands fa-linkedin', color: '#0A66C2', connected: false, email: '' },
  ]);
  useEffect(() => {
    (async () => {
      try {
        const me: any = await (api as any).me();
        if (me?.user?.twofa) { setTwoFAEnabled(!!me.user.twofa.enabled); if (me.user.twofa.method) setTwoFAMethod(me.user.twofa.method); }
        const pv = me?.user?.prefs?.providers;
        if (Array.isArray(pv) && pv.length) setProviders(pv);
      } catch (_) {}
      try { const lg: any = await (api as any).securityLog(); if (Array.isArray(lg)) setSecurityLog(lg); } catch (_) {}
    })();
  }, []);
  const toggle2fa = async () => {
    if (twoFAEnabled) {
      const pw = (typeof window !== 'undefined' && window.prompt) ? window.prompt('برای غیرفعال‌کردن ورود دو مرحله‌ای، رمز عبور خود را وارد کنید:') : '';
      if (!pw) return;
      try { await (api as any).twofaDisable(pw.trim()); setTwoFAEnabled(false); showToast('دو مرحله‌ای غیرفعال شد'); }
      catch (e: any) { showToast(e && e.message === 'wrong_password' ? 'رمز عبور نادرست است' : 'خطا در غیرفعال‌سازی'); }
      return;
    }
    try {
      const st: any = await (api as any).twofaSetup();
      if (typeof window !== 'undefined' && window.alert) window.alert('این کلید را در اپ Authenticator (مثل Google Authenticator) وارد کنید:\n\n' + st.secret + '\n\nسپس کد ۶ رقمیِ نمایش‌داده‌شده را در مرحلهٔ بعد وارد کنید.');
      const code = (typeof window !== 'undefined' && window.prompt) ? window.prompt('کد ۶ رقمیِ اپ Authenticator را وارد کنید:') : '';
      if (!code) return;
      const r: any = await (api as any).twofaEnable(code.trim(), twoFAMethod);
      setTwoFAEnabled(true);
      if (r && Array.isArray(r.recoveryCodes) && typeof window !== 'undefined' && window.alert) {
        window.alert('ورود دو مرحله‌ای فعال شد ✅\n\nکدهای بازیابی (در جای امن نگه دارید — هرکدام فقط یک‌بار مصرف می‌شود):\n\n' + r.recoveryCodes.join('\n'));
      }
      showToast('دو مرحله‌ای فعال شد');
    } catch (e: any) { showToast(e && e.message === 'invalid_otp' ? 'کد واردشده نادرست است' : 'خطا در فعال‌سازی'); }
  };

  const [securityLog, setSecurityLog] = useState<any[]>([]);

  const submitPwd = async () => {
    if (!oldPwd) { showToast('پسورد فعلی را وارد کنید'); return; }
    if (newPwd.length < 6) { showToast('پسورد جدید حداقل ۶ کاراکتر'); return; }
    if (newPwd !== confirmPwd) { showToast('تکرار پسورد مطابقت ندارد'); return; }
    try {
      await (api as any).changePassword(oldPwd, newPwd);
      showToast('پسورد با موفقیت تغییر کرد');
      setOldPwd(''); setNewPwd(''); setConfirmPwd('');
      setPwdSaved(true);
      setTimeout(() => setPwdSaved(false), 3000);
    } catch (e: any) {
      showToast(e && e.message === 'wrong_password' ? 'پسورد فعلی نادرست است' : (e && e.message === 'weak_password' ? 'پسورد جدید ضعیف است' : 'خطا در تغییر پسورد'));
    }
  };

  const toggleProvider = (id: string) => {
    /* providerlink */ const target = providers.find(p => p.id === id);
    if (target && target.connected) {
      setProviders(prev => { const next = prev.map(p => p.id === id ? { ...p, connected: false, email: '' } : p); (api as any).updateMe({ prefs: { providers: next } }).catch(() => {}); return next; });
      showToast('اکانت قطع شد');
      return;
    }
    // اتصالِ واقعیِ OAuth هنوز فعال نشده — بدونِ اتصالِ الکی/ایمیلِ فیک.
    showToast(id === 'google'
      ? 'برای ورود با گوگل، ایمیلِ گوگل را در «ویرایش پروفایل» ثبت کنید تا حسابتان با ایمیل/گوگل هم قابلِ ورود شود.'
      : 'اتصالِ این اکانت هنوز فعال نشده است.');
  };

  const TABS: { id: SecurityTab; label: string; icon: string }[] = [
    { id: 'password',   label: 'پسورد',          icon: 'fa-solid fa-key' },
    { id: 'twofa',      label: 'دو مرحله‌ای',    icon: 'fa-solid fa-mobile-screen-button' },
    { id: 'thirdparty', label: 'اکانت‌های ثالث', icon: 'fa-solid fa-link' },
    { id: 'logs',       label: 'لاگ امنیتی',     icon: 'fa-solid fa-clock-rotate-left' },
  ];

  const logMeta = (type: string) => {
    if (type === 'login')      return { icon: 'fa-solid fa-right-to-bracket', color: '#3B82F6', label: 'ورود' };
    if (type === 'pwd')        return { icon: 'fa-solid fa-key',              color: '#F59E0B', label: 'تغییر پسورد' };
    if (type === '2fa')        return { icon: 'fa-solid fa-shield-halved',    color: '#10B981', label: 'تغییر 2FA' };
    return                            { icon: 'fa-solid fa-link',             color: '#8B5CF6', label: 'اتصال اکانت' };
  };

  return (
    <div>
      <div className="flex gap-1.5 mb-3 overflow-x-auto aw-scroll pb-1">
        {TABS.map(t => (
          <button key={t.id}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border text-[11px] cursor-pointer whitespace-nowrap shrink-0 transition-all"
            style={tab === t.id
              ? { background: 'color-mix(in srgb, var(--aw-eu-primary) 20%, transparent)', color: 'var(--aw-eu-primary)', borderColor: 'color-mix(in srgb, var(--aw-eu-primary) 45%, transparent)', fontWeight: 700, backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }
              : { background: 'var(--aw-eu-nav-bg)', color: 'var(--aw-text-secondary)', borderColor: 'var(--aw-eu-nav-border)', fontWeight: 500, backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}
            onClick={() => setTab(t.id)}>
            <i className={`${t.icon} text-[10px]`} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'password' && (
        <div>
          {pwdSaved && (
            <div className="flex items-center gap-2 p-2.5 mb-3 rounded-[10px]" style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.30)' }}>
              <i className="fa-solid fa-circle-check text-[14px]" style={{ color: '#10B981' }} />
              <span className="text-[11.5px]" style={{ color: '#10B981', fontWeight: 700 }}>پسورد با موفقیت تغییر کرد</span>
            </div>
          )}
          <FormGroup label="پسورد فعلی">
            <div className="relative">
              <FormInput type={showPwd ? 'text' : 'password'} value={oldPwd} onChange={e => setOldPwd(e.target.value)} placeholder="پسورد فعلی" />
            </div>
          </FormGroup>
          <FormGroup label="پسورد جدید">
            <FormInput type={showPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="حداقل ۶ کاراکتر" />
          </FormGroup>
          <FormGroup label="تکرار پسورد جدید">
            <FormInput type={showPwd ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="تکرار پسورد" />
          </FormGroup>
          <label className="flex items-center gap-2 mb-3 cursor-pointer text-[11.5px] text-[var(--aw-text-secondary)]">
            <input type="checkbox" checked={showPwd} onChange={e => setShowPwd(e.target.checked)} />
            نمایش پسوردها
          </label>
          <button className="w-full py-2.5 rounded-[10px] border-none text-white text-[12.5px] cursor-pointer"
            style={{ background: 'var(--aw-eu-primary, #7B62FC)', fontWeight: 700 }} onClick={submitPwd}>
            <i className="fa-solid fa-check text-[10px] ml-1" /> ذخیره پسورد
          </button>
        </div>
      )}

      {tab === 'twofa' && (
        <div>
          <div className="rounded-[10px] p-3 mb-3 border" style={{
            background: twoFAEnabled ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
            borderColor: twoFAEnabled ? 'rgba(16,185,129,0.30)' : 'rgba(245,158,11,0.30)',
          }}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-shield-halved text-[14px]" style={{ color: twoFAEnabled ? '#10B981' : '#F59E0B' }} />
                <span className="text-[12.5px]" style={{ fontWeight: 700 }}>ورود دو مرحله‌ای</span>
              </div>
              <button
                className="w-11 h-6 rounded-full border-none cursor-pointer relative transition-all"
                style={{ background: twoFAEnabled ? '#10B981' : 'var(--aw-border)' }}
                onClick={toggle2fa}>
                <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                  style={{ right: twoFAEnabled ? 2 : 22 }} />
              </button>
            </div>
            <div className="text-[10.5px] text-[var(--aw-text-secondary)] leading-5">
              با فعال‌سازی، علاوه بر پسورد، یک کد یکبار مصرف نیز برای ورود نیاز خواهد بود.
            </div>
          </div>

          {twoFAEnabled && (
            <div>
              <div className="text-[11px] text-[var(--aw-text-muted)] mb-1.5 px-1" style={{ fontWeight: 700 }}>روش تأیید</div>
              {([
                { id: 'sms'   as const, icon: 'fa-solid fa-mobile-screen', label: 'پیامک',          desc: 'کد به موبایل ارسال می‌شود' },
                { id: 'app'   as const, icon: 'fa-solid fa-shield',        label: 'اپ Authenticator', desc: 'Google Authenticator یا مشابه' },
                { id: 'email' as const, icon: 'fa-solid fa-envelope',      label: 'ایمیل',           desc: 'کد به ایمیل ارسال می‌شود' },
              ]).map(m => (
                <button key={m.id}
                  className="w-full flex items-center gap-2.5 p-3 mb-1.5 rounded-[10px] border cursor-pointer text-right"
                  style={{
                    background: twoFAMethod === m.id ? 'var(--aw-eu-primary-bg)' : 'var(--aw-bg-card)',
                    borderColor: twoFAMethod === m.id ? 'var(--aw-eu-primary)' : 'var(--aw-border)',
                  }}
                  onClick={() => { setTwoFAMethod(m.id); (api as any).updateMe({ prefs: { twofaMethod: m.id } }).catch(() => {}); showToast('روش انتخاب شد'); }}>
                  <i className={`${m.icon} text-[14px]`} style={{ color: twoFAMethod === m.id ? 'var(--aw-eu-primary)' : 'var(--aw-text-muted)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px]" style={{ fontWeight: 600 }}>{m.label}</div>
                    <div className="text-[10px] text-[var(--aw-text-muted)]">{m.desc}</div>
                  </div>
                  {twoFAMethod === m.id && <i className="fa-solid fa-circle-check text-[12px]" style={{ color: 'var(--aw-eu-primary)' }} />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'thirdparty' && (
        <div>
          <div className="text-[11px] text-[var(--aw-text-muted)] mb-2 leading-5 px-1">
            با اتصال اکانت‌های زیر، می‌توانید بدون پسورد وارد شوید.
          </div>
          {providers.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 mb-1.5 rounded-[10px] border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ background: p.color }}>
                <i className={`${p.icon} text-[16px]`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px]" style={{ fontWeight: 600 }}>{p.name}</div>
                <div className="text-[10px] text-[var(--aw-text-muted)] truncate">
                  {p.connected ? p.email : 'متصل نشده'}
                </div>
              </div>
              <button className="py-1.5 px-3 rounded-lg border-none text-[10.5px] cursor-pointer text-white"
                style={{ background: p.connected ? '#EF4444' : '#10B981', fontWeight: 700 }}
                onClick={() => toggleProvider(p.id)}>
                {p.connected ? 'قطع اتصال' : 'اتصال'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'logs' && (
        <div>
          {securityLog.map(l => {
            const m = logMeta(l.type);
            return (
              <div key={l.id} className="flex items-center gap-2.5 p-2.5 mb-1.5 rounded-[10px] border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${m.color}18` }}>
                  <i className={`${m.icon} text-[11px]`} style={{ color: m.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11.5px]" style={{ fontWeight: 700 }}>{m.label}</span>
                    {!l.success && <span className="text-[8.5px] px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(239,68,68,0.18)', color: '#EF4444', fontWeight: 700 }}>ناموفق</span>}
                  </div>
                  <div className="text-[9.5px] text-[var(--aw-text-muted)] truncate">{l.device} · {l.location} · {l.ip}</div>
                </div>
                <div className="text-[9.5px] text-[var(--aw-text-muted)] flex-shrink-0">{l.date}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EuSettingsItem({ icon, label, onClick, danger }: { icon: string; label: string; onClick?: () => void; danger?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-3 mb-2 cursor-pointer transition-all hover:brightness-[0.98]"
      style={{
        height: 40,
        borderRadius: 12,
        background: 'var(--aw-eu-glass-card, rgba(255,255,255,0.2))',
        boxShadow: 'inset 0 0 0 0.5px var(--aw-eu-glass-bd, rgb(255,255,255)), 0px 4px 4px rgba(123,98,252,0.2)',
      }}
      onClick={onClick}>
      <i className={`${icon} text-[16px] w-5 text-center`} style={{ color: danger ? '#FF383C' : 'var(--aw-text-primary)' }} />
      <span className="flex-1 text-[14px]" style={{ fontWeight: 500, color: danger ? '#FF383C' : 'var(--aw-text-primary)', fontFamily: "'Kamand', 'Vazirmatn', sans-serif" }}>{label}</span>
      <i className="fa-solid fa-chevron-left text-[13px]" style={{ color: '#8F8F8F' }} />
    </div>
  );
}

function EuAppSettings() {
  const { showToast, theme, setTheme, themeAuto, setThemeAuto, closeModal } = useApp();
  const [lang, setLang] = useState('fa');
  const [notifOn, setNotifOn] = useState(true);
  useEffect(() => {
    (async () => { try { const r: any = await (api as any).me(); const pf = r && r.user && r.user.prefs; if (pf) { if (pf.lang) setLang(pf.lang); if (typeof pf.notifOn === 'boolean') setNotifOn(pf.notifOn); if (pf.theme) { setThemeAuto(false); setTheme(pf.theme); } if (pf.themeAuto === true) setThemeAuto(true); } } catch (_) {} })();
  }, []);
  const LANGS: { id: string; label: string }[] = [
    { id: 'fa', label: 'فارسی' },
    { id: 'en', label: 'English' },
    { id: 'ar', label: 'العربیة' },
  ];
  const [langOpen, setLangOpen] = useState(false);

  const themeOptions: { id: string; icon: string; label: string }[] = [
    { id: 'glass', icon: 'fa-solid fa-sun', label: 'روشن' },
    { id: 'dark', icon: 'fa-solid fa-moon', label: 'تیره' },
    { id: 'bw', icon: 'fa-solid fa-circle-half-stroke', label: 'سیاه‌سفید' },
    { id: 'auto', icon: 'fa-solid fa-clock', label: 'خودکار' },
  ];

  return (
    <div>
      {/* Theme Selector */}
      <div className="mb-4">
        <div className="text-[12px] text-[var(--aw-text-muted)] mb-2 px-1" style={{ fontWeight: 600 }}>تم برنامه</div>
        <div className="grid grid-cols-2 gap-2">
          {themeOptions.map(t => {
            const isActive = t.id === 'auto' ? themeAuto : (!themeAuto && theme === t.id);
            return (
            <button
              key={t.id}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-[10px] border cursor-pointer transition-all ${
                isActive
                  ? 'border-[var(--aw-eu-primary)] text-[var(--aw-eu-primary)]'
                  : 'border-[var(--aw-border)] text-[var(--aw-text-secondary)]'
              }`}
              style={{
                background: isActive ? 'var(--aw-primary-bg)' : 'var(--aw-bg-card)',
                fontWeight: isActive ? 700 : 500,
              }}
              onClick={() => {
                if (t.id === 'auto') { setThemeAuto(true); (api as any).updateMe({ prefs: { themeAuto: true } }).catch(() => {}); showToast('تم خودکار (بر اساس ساعت) فعال شد'); }
                else { setThemeAuto(false); setTheme(t.id as any); (api as any).updateMe({ prefs: { theme: t.id, themeAuto: false } }).catch(() => {}); showToast('تم «' + t.label + '» فعال شد'); }
              }}
            >
              <i className={`${t.icon} text-lg`} />
              <span className="text-[11px]">{t.label}</span>
            </button>
            );
          })}
        </div>
      </div>

      <div className="relative">
        <EuSettingsItem icon="fa-solid fa-language" label={'زبان: ' + (LANGS.find(l => l.id === lang)?.label || 'فارسی')} onClick={() => setLangOpen(v => !v)} />
        {langOpen && (
          <div className="rounded-[10px] overflow-hidden mb-2 -mt-1 border" style={{ background: 'var(--aw-bg-modal)', borderColor: 'var(--aw-border)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}>
            {LANGS.map(l => (
              <button key={l.id} onClick={() => { setLang(l.id); setLangOpen(false); (api as any).updateMe({ prefs: { lang: l.id } }).catch(() => {}); showToast('زبان «' + l.label + '» انتخاب شد'); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-right border-none bg-transparent cursor-pointer text-[13px]"
                style={{ color: 'var(--aw-text-primary)', fontWeight: lang === l.id ? 700 : 500 }}>
                {l.label}
                {lang === l.id && <i className="fa-solid fa-check text-[12px]" style={{ color: 'var(--aw-eu-primary)' }} />}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 px-3 mb-2" style={{ minHeight: 52 }}>
        <i className="fa-solid fa-bell text-[16px] w-5 text-center" style={{ color: 'var(--aw-text-primary)' }} />
        <span className="flex-1 text-[14px]" style={{ fontWeight: 500, color: 'var(--aw-text-primary)' }}>اعلان‌ها: {notifOn ? 'فعال' : 'غیرفعال'}</span>
        <button className="w-11 h-6 rounded-full border-none cursor-pointer relative transition-all flex-shrink-0"
          style={{ background: notifOn ? 'var(--aw-eu-primary)' : 'var(--aw-border)' }}
          onClick={() => { const _n = !notifOn; setNotifOn(_n); (api as any).updateMe({ prefs: { notifOn: _n } }).catch(() => {}); showToast(_n ? 'اعلان‌ها فعال شد' : 'اعلان‌ها غیرفعال شد'); }}>
          <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ right: notifOn ? 2 : 22 }} />
        </button>
      </div>
      <EuSettingsItem icon="fa-solid fa-microphone-lines" label="دسترسی میکروفون و دوربین" onClick={async () => { const ok = await requestMediaPermission(true); showToast(ok ? 'دسترسی داده شد ✅' : 'دسترسی داده نشد — از قفلِ کنارِ نوارِ آدرس، میکروفون را Allow کن'); }} />
      <EuSettingsItem icon="fa-solid fa-database" label="پاک‌سازی کش" onClick={async () => { try { if (typeof caches !== 'undefined') { const __ks = await caches.keys(); await Promise.all(__ks.map(k => caches.delete(k))); } } catch (_e) {} try { sessionStorage.clear(); } catch (_e) {} showToast('کش پاک‌سازی شد'); closeModal(); }} />
    </div>
  );
}

function HelpContent() {
  return (
    <div>
      {[
        { q: 'چگونه سفارش غذا ثبت کنم؟', a: 'از صفحه خانه روی "سفارش غذا" کلیک کنید و با عامل رستوران گفتگو کنید.' },
        { q: 'چگونه با پشتیبانی تماس بگیرم؟', a: 'از منوی خانه روی "پشتیبانی" کلیک کنید یا از دکمه تماس استفاده کنید.' },
        { q: 'چگونه سفارش را لغو کنم؟', a: 'به بخش سفارشات رفته، سفارش مورد نظر را انتخاب و دکمه لغو را بزنید.' },
        { q: 'چگونه پروفایل خود را ویرایش کنم؟', a: 'از بخش پروفایل، گزینه "ویرایش پروفایل" را انتخاب کنید.' },
      ].map((item, i) => (
        <div key={i} className="rounded-[10px] p-3.5 mb-2 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
          <div className="text-[13px] mb-1 flex items-center gap-1.5" style={{ fontWeight: 600 }}>
            <i className="fa-solid fa-question-circle text-[var(--aw-eu-primary)]" /> {item.q}
          </div>
          <div className="text-[12px] text-[var(--aw-text-secondary)]">{item.a}</div>
        </div>
      ))}
    </div>
  );
}

// ====== SUPPORT (TICKETING) ======
type TicketStatus = 'open' | 'pending' | 'answered' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high';
type TicketMessage = { id: number; from: 'user' | 'agent'; body: string; date: string };
type Ticket = {
  id: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  updated: string;
  messages: TicketMessage[];
};

const TICKET_STATUS_META: Record<TicketStatus, { label: string; color: string; bg: string }> = {
  open:     { label: 'باز',           color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  pending:  { label: 'در انتظار پاسخ', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  answered: { label: 'پاسخ داده شده',  color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  closed:   { label: 'بسته شده',       color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
};

const TICKET_PRIORITY_META: Record<TicketPriority, { label: string; color: string }> = {
  low:    { label: 'کم',     color: '#10B981' },
  medium: { label: 'متوسط',  color: '#F59E0B' },
  high:   { label: 'بالا',   color: '#EF4444' },
};

const TICKET_CATEGORIES = ['فنی', 'مالی', 'سفارشات', 'حساب کاربری', 'سایر'];

const INITIAL_TICKETS: Ticket[] = [];

function EuSupportContent() {
  const { showToast } = useApp();
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const __tkLoaded = React.useRef(false);
  useEffect(() => { (async () => { try { const v: any = await (api as any).myList('support_tickets'); if (Array.isArray(v) && v.length) setTickets(v as any); } catch (_) {} __tkLoaded.current = true; })(); }, []);
  useEffect(() => { if (!__tkLoaded.current) return; const h = setTimeout(() => { (api as any).myBulkSave('support_tickets', tickets).catch(() => {}); }, 700); return () => clearTimeout(h); }, [tickets]);
  const [view, setView] = useState<'list' | 'detail' | 'new'>('list');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | TicketStatus>('all');
  const [reply, setReply] = useState('');

  const [draft, setDraft] = useState({ subject: '', category: TICKET_CATEGORIES[0], priority: 'medium' as TicketPriority, body: '' });

  const filtered = useMemo(
    () => tickets.filter(t => filter === 'all' || t.status === filter),
    [tickets, filter],
  );

  const active = tickets.find(t => t.id === activeId) || null;

  const submitNew = () => {
    if (!draft.subject.trim() || !draft.body.trim()) { showToast('عنوان و متن تیکت را وارد کنید'); return; }
    const id = 'TK-' + Math.floor(1100 + Math.random() * 900);
    const ticket: Ticket = {
      id, subject: draft.subject.trim(), category: draft.category, priority: draft.priority,
      status: 'open', updated: 'هم‌اکنون',
      messages: [{ id: 1, from: 'user', body: draft.body.trim(), date: 'هم‌اکنون' }],
    };
    setTickets(prev => [ticket, ...prev]);
    setDraft({ subject: '', category: TICKET_CATEGORIES[0], priority: 'medium', body: '' });
    setActiveId(id);
    setView('detail');
    showToast('تیکت با موفقیت ثبت شد');
  };

  const sendReply = () => {
    if (!active || !reply.trim()) return;
    setTickets(prev => prev.map(t => t.id === active.id ? {
      ...t,
      status: 'pending',
      updated: 'هم‌اکنون',
      messages: [...t.messages, { id: t.messages.length + 1, from: 'user', body: reply.trim(), date: 'هم‌اکنون' }],
    } : t));
    setReply('');
    showToast('پیام ارسال شد');
  };

  const closeTicket = (id: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'closed', updated: 'هم‌اکنون' } : t));
    showToast('تیکت بسته شد');
  };

  if (view === 'new') {
    return (
      <div>
        <button className="text-[11.5px] mb-3 cursor-pointer bg-transparent border-none text-[var(--aw-eu-primary)] flex items-center gap-1" style={{ fontWeight: 600 }} onClick={() => setView('list')}>
          <i className="fa-solid fa-chevron-right text-[9px]" /> بازگشت
        </button>
        <div className="rounded-[10px] p-3 border border-[var(--aw-border)] mb-2" style={{ background: 'var(--aw-bg-card)' }}>
          <label className="text-[11px] text-[var(--aw-text-muted)] block mb-1" style={{ fontWeight: 600 }}>عنوان تیکت</label>
          <input type="text" value={draft.subject} onChange={e => setDraft(d => ({ ...d, subject: e.target.value }))}
            placeholder="مثلاً: مشکل در پرداخت" className="w-full px-3 py-2 rounded-lg border border-[var(--aw-border)] text-[12px] outline-none" style={{ background: 'var(--aw-bg)' }} />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="rounded-[10px] p-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
            <label className="text-[11px] text-[var(--aw-text-muted)] block mb-1" style={{ fontWeight: 600 }}>دسته‌بندی</label>
            <select value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
              className="w-full px-2 py-2 rounded-lg border border-[var(--aw-border)] text-[12px] outline-none" style={{ background: 'var(--aw-bg)' }}>
              {TICKET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="rounded-[10px] p-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
            <label className="text-[11px] text-[var(--aw-text-muted)] block mb-1" style={{ fontWeight: 600 }}>اولویت</label>
            <div className="flex gap-1">
              {(['low','medium','high'] as TicketPriority[]).map(p => {
                const m = TICKET_PRIORITY_META[p];
                const active = draft.priority === p;
                return (
                  <button key={p} onClick={() => setDraft(d => ({ ...d, priority: p }))}
                    className="flex-1 py-1.5 rounded-md text-[10.5px] cursor-pointer border transition-all"
                    style={{ background: active ? `${m.color}22` : 'transparent', color: active ? m.color : 'var(--aw-text-muted)', borderColor: active ? m.color : 'var(--aw-border)', fontWeight: 700 }}>
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="rounded-[10px] p-3 border border-[var(--aw-border)] mb-3" style={{ background: 'var(--aw-bg-card)' }}>
          <label className="text-[11px] text-[var(--aw-text-muted)] block mb-1" style={{ fontWeight: 600 }}>متن پیام</label>
          <textarea value={draft.body} onChange={e => setDraft(d => ({ ...d, body: e.target.value }))}
            placeholder="مشکل یا سوال خود را به‌صورت کامل بنویسید..." rows={5}
            className="w-full px-3 py-2 rounded-lg border border-[var(--aw-border)] text-[12px] outline-none resize-none" style={{ background: 'var(--aw-bg)' }} />
        </div>
        <button onClick={submitNew} className="w-full py-2.5 rounded-[10px] border-none text-white text-[12.5px] cursor-pointer flex items-center justify-center gap-1.5" style={{ background: 'var(--aw-eu-primary, #7B62FC)', fontWeight: 700 }}>
          <i className="fa-solid fa-paper-plane text-[10px]" /> ثبت تیکت
        </button>
      </div>
    );
  }

  if (view === 'detail' && active) {
    const sMeta = TICKET_STATUS_META[active.status];
    const pMeta = TICKET_PRIORITY_META[active.priority];
    return (
      <div>
        <button className="text-[11.5px] mb-3 cursor-pointer bg-transparent border-none text-[var(--aw-eu-primary)] flex items-center gap-1" style={{ fontWeight: 600 }} onClick={() => { setView('list'); setActiveId(null); }}>
          <i className="fa-solid fa-chevron-right text-[9px]" /> بازگشت
        </button>
        <div className="rounded-[10px] p-3 border border-[var(--aw-border)] mb-3" style={{ background: 'var(--aw-bg-card)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-[12.5px]" style={{ fontWeight: 700 }}>{active.subject}</div>
            <span className="text-[9px] px-1.5 py-0.5 rounded-md" style={{ background: sMeta.bg, color: sMeta.color, fontWeight: 700 }}>{sMeta.label}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[var(--aw-text-muted)]">
            <span>#{active.id}</span>
            <span>·</span>
            <span>{active.category}</span>
            <span>·</span>
            <span style={{ color: pMeta.color, fontWeight: 700 }}>اولویت {pMeta.label}</span>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          {active.messages.map(m => (
            <div key={m.id} className="rounded-[10px] p-3 border" style={{ background: m.from === 'user' ? 'rgba(126,95,170,0.08)' : 'var(--aw-bg-card)', borderColor: m.from === 'user' ? 'rgba(126,95,170,0.25)' : 'var(--aw-border)' }}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-[10.5px] flex items-center gap-1" style={{ color: m.from === 'user' ? 'var(--aw-eu-primary)' : 'var(--aw-text-secondary)', fontWeight: 700 }}>
                  <i className={`fa-solid ${m.from === 'user' ? 'fa-user' : 'fa-headset'} text-[9px]`} />
                  {m.from === 'user' ? 'شما' : 'کارشناس پشتیبانی'}
                </div>
                <div className="text-[9.5px] text-[var(--aw-text-muted)]">{m.date}</div>
              </div>
              <div className="text-[11.5px] text-[var(--aw-text-secondary)] leading-6">{m.body}</div>
            </div>
          ))}
        </div>

        {active.status !== 'closed' ? (
          <>
            <div className="rounded-[10px] p-2 border border-[var(--aw-border)] mb-2 flex items-end gap-2" style={{ background: 'var(--aw-bg-card)' }}>
              <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="پاسخ خود را بنویسید..." rows={2}
                className="flex-1 px-2 py-1.5 rounded-lg text-[12px] outline-none resize-none border-none" style={{ background: 'transparent' }} />
              <button onClick={sendReply} disabled={!reply.trim()} className="w-9 h-9 rounded-lg border-none text-white cursor-pointer flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--aw-eu-primary, #7B62FC)', opacity: reply.trim() ? 1 : 0.4 }}>
                <i className="fa-solid fa-paper-plane text-[11px]" />
              </button>
            </div>
            <button onClick={() => closeTicket(active.id)} className="w-full py-2 rounded-[10px] border border-[var(--aw-border)] text-[11.5px] cursor-pointer text-[var(--aw-danger)]" style={{ background: 'transparent', fontWeight: 600 }}>
              <i className="fa-solid fa-xmark-circle text-[10px] ml-1" /> بستن تیکت
            </button>
          </>
        ) : (
          <div className="text-center py-3 text-[11px] text-[var(--aw-text-muted)] border border-dashed border-[var(--aw-border)] rounded-[10px]">
            این تیکت بسته شده است.
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setView('new')} className="w-full py-2.5 rounded-[10px] border-none text-white text-[12.5px] cursor-pointer flex items-center justify-center gap-1.5 mb-3" style={{ background: 'var(--aw-eu-primary, #7B62FC)', fontWeight: 700 }}>
        <i className="fa-solid fa-plus text-[10px]" /> ثبت تیکت جدید
      </button>

      <div className="flex gap-1 mb-3 overflow-x-auto pb-1 aw-scroll">
        {([['all','همه'], ['open','باز'], ['pending','در انتظار'], ['answered','پاسخ داده شده'], ['closed','بسته']] as const).map(([id, label]) => {
          const active = filter === id;
          return (
            <button key={id} onClick={() => setFilter(id as any)} className="px-3 py-1.5 rounded-lg text-[11px] cursor-pointer border whitespace-nowrap" style={{ background: active ? 'var(--aw-eu-primary)' : 'transparent', color: active ? '#fff' : 'var(--aw-text-secondary)', borderColor: active ? 'var(--aw-eu-primary)' : 'var(--aw-border)', fontWeight: 700 }}>
              {label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-[var(--aw-text-muted)]">
          <i className="fa-solid fa-inbox text-[32px] opacity-25 block mb-2" />
          <p className="text-[11.5px]">تیکتی یافت نشد</p>
        </div>
      ) : filtered.map(t => {
        const sMeta = TICKET_STATUS_META[t.status];
        const pMeta = TICKET_PRIORITY_META[t.priority];
        return (
          <div key={t.id} onClick={() => { setActiveId(t.id); setView('detail'); }}
            className="rounded-[10px] p-3 mb-2 border border-[var(--aw-border)] cursor-pointer transition-all hover:border-[var(--aw-eu-primary)]"
            style={{ background: 'var(--aw-bg-card)' }}>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[12.5px] truncate flex-1 ml-2" style={{ fontWeight: 700 }}>{t.subject}</div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md flex-shrink-0" style={{ background: sMeta.bg, color: sMeta.color, fontWeight: 700 }}>{sMeta.label}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[var(--aw-text-muted)]">
              <div className="flex items-center gap-1.5">
                <span>#{t.id}</span>
                <span>·</span>
                <span>{t.category}</span>
                <span>·</span>
                <span style={{ color: pMeta.color, fontWeight: 700 }}>{pMeta.label}</span>
              </div>
              <span>{t.updated}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ====== FAQ ======
const FAQ_CATEGORIES = [
  {
    title: 'حساب کاربری',
    icon: 'fa-solid fa-user',
    color: '#3B82F6',
    items: [
      { q: 'چگونه نام کاربری خود را تغییر دهم؟', a: 'از مسیر تنظیمات → ویرایش پروفایل می‌توانید نام کاربری را ویرایش کنید. توجه داشته باشید نام کاربری باید بدون فاصله و یکتا باشد.' },
      { q: 'چگونه احراز هویت را انجام دهم؟', a: 'در صفحه ویرایش پروفایل روی نشان «تایید نشده» کلیک کنید و مراحل ارسال و تایید کد را دنبال کنید.' },
      { q: 'چگونه ورود دو مرحله‌ای را فعال کنم؟', a: 'به تنظیمات امنیتی → ورود دو مرحله‌ای رفته و کلید فعال‌سازی را روشن کرده، روش دلخواه (پیامک/برنامه/ایمیل) را انتخاب کنید.' },
    ],
  },
  {
    title: 'مالی و پرداخت',
    icon: 'fa-solid fa-wallet',
    color: '#10B981',
    items: [
      { q: 'چگونه کیف پول خود را شارژ کنم؟', a: 'وارد بخش مالی → کیف پول شده و روی «واریز» بزنید. سپس مبلغ را وارد کرده و پرداخت را تکمیل کنید.' },
      { q: 'مدت زمان بازگشت وجه چقدر است؟', a: 'بازگشت وجه برای پرداخت‌های ناموفق حداکثر ۷۲ ساعت کاری زمان می‌برد.' },
      { q: 'آیا می‌توانم برای کیف پولم برداشت تنظیم کنم؟', a: 'بله، از بخش مالی → کیف پول گزینه «برداشت» را انتخاب و حساب مقصد را وارد کنید.' },
    ],
  },
  {
    title: 'سفارشات و خرید',
    icon: 'fa-solid fa-bag-shopping',
    color: '#F59E0B',
    items: [
      { q: 'چگونه سفارش را لغو کنم؟', a: 'از بخش سفارشات، سفارش مورد نظر را انتخاب و در صورت قابل لغو بودن، دکمه لغو را بزنید.' },
      { q: 'مدت زمان تحویل چقدر است؟', a: 'بسته به نوع سفارش و شهر، بین ۳۰ دقیقه تا ۳ روز کاری متغیر است.' },
      { q: 'فاکتورهای رسمی را از کجا دریافت کنم؟', a: 'از بخش مالی → فاکتورها می‌توانید فاکتور هر سفارش را دانلود کنید.' },
    ],
  },
  {
    title: 'فنی و عیب‌یابی',
    icon: 'fa-solid fa-bug',
    color: '#EF4444',
    items: [
      { q: 'چرا اعلان‌ها را دریافت نمی‌کنم؟', a: 'مطمئن شوید در تنظیمات اعلان‌ها فعال‌اند و دسترسی notification از سطح سیستم‌عامل به اپ داده شده باشد.' },
      { q: 'برنامه به‌درستی بارگذاری نمی‌شود.', a: 'یک‌بار از اپ خارج و دوباره وارد شوید. اگر مشکل ادامه داشت، از طریق بخش پشتیبانی تیکت ثبت کنید.' },
    ],
  },
];

function EuFaqContent() {
  const [query, setQuery] = useState('');
  const [openKey, setOpenKey] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const sections = useMemo(() => FAQ_CATEGORIES.map(cat => ({
    ...cat,
    items: cat.items.filter(it => !q || it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)),
  })).filter(cat => cat.items.length > 0), [q]);

  return (
    <div>
      <div className="rounded-[10px] p-2 border border-[var(--aw-border)] mb-3 flex items-center gap-2" style={{ background: 'var(--aw-bg-card)' }}>
        <i className="fa-solid fa-magnifying-glass text-[11px] text-[var(--aw-text-muted)] mr-1" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="جستجو در سوالات..."
          className="flex-1 bg-transparent border-none outline-none text-[12px]" />
        {query && (
          <button onClick={() => setQuery('')} className="bg-transparent border-none cursor-pointer text-[var(--aw-text-muted)]">
            <i className="fa-solid fa-xmark text-[10px]" />
          </button>
        )}
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-10 text-[var(--aw-text-muted)]">
          <i className="fa-solid fa-circle-question text-[32px] opacity-25 block mb-2" />
          <p className="text-[11.5px]">سوالی یافت نشد</p>
        </div>
      ) : sections.map(cat => (
        <div key={cat.title} className="mb-3">
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${cat.color}22` }}>
              <i className={`${cat.icon} text-[11px]`} style={{ color: cat.color }} />
            </div>
            <div className="text-[12px]" style={{ fontWeight: 700 }}>{cat.title}</div>
          </div>
          {cat.items.map((it, i) => {
            const key = cat.title + i;
            const open = openKey === key;
            return (
              <div key={key} className="rounded-[10px] border border-[var(--aw-border)] mb-1.5 overflow-hidden" style={{ background: 'var(--aw-bg-card)' }}>
                <button onClick={() => setOpenKey(open ? null : key)} className="w-full flex items-center justify-between gap-2 p-3 text-right bg-transparent border-none cursor-pointer">
                  <span className="text-[12px] flex-1" style={{ fontWeight: 600 }}>{it.q}</span>
                  <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'} text-[10px] text-[var(--aw-text-muted)] flex-shrink-0`} />
                </button>
                {open && (
                  <div className="px-3 pb-3 pt-0 text-[11.5px] text-[var(--aw-text-secondary)] leading-6 border-t border-[var(--aw-border)]" style={{ paddingTop: '0.6rem' }}>
                    {it.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ====== LEGAL (TERMS / PRIVACY) ======
const LEGAL_TERMS = [
  { title: '۱. پذیرش شرایط', body: 'با ایجاد حساب کاربری در Neura، شما با تمامی بندهای این توافق‌نامه و مقررات ذکر شده موافقت می‌کنید. در صورت عدم پذیرش، استفاده از سرویس مجاز نیست.' },
  { title: '۲. مسئولیت کاربر', body: 'کاربر متعهد می‌شود از حساب کاربری خود به‌صورت صحیح و قانونی استفاده کند و هرگونه فعالیت غیرقانونی، آسیب‌رسان یا خلاف اخلاق ممنوع است.' },
  { title: '۳. حق نشر و مالکیت معنوی', body: 'تمامی محتوا، طرح، علائم تجاری و کد منبع متعلق به Neura است و هرگونه کپی‌برداری، توزیع یا استفاده تجاری بدون اجازه کتبی ممنوع است.' },
  { title: '۴. پرداخت‌ها و بازپرداخت', body: 'پرداخت‌ها از طریق درگاه‌های معتبر انجام می‌شود. در صورت تراکنش ناموفق، مبلغ ظرف ۷۲ ساعت کاری به حساب کاربر بازگردانده می‌شود.' },
  { title: '۵. لغو و تعلیق حساب', body: 'Neura این حق را برای خود محفوظ می‌دارد در صورت تخلف کاربر از مقررات، حساب وی را بدون اطلاع قبلی تعلیق یا حذف کند.' },
  { title: '۶. تغییر شرایط', body: 'این شرایط ممکن است در هر زمان به‌روز شود. تغییرات از طریق اعلان درون‌برنامه‌ای به اطلاع کاربران خواهد رسید.' },
];

const LEGAL_PRIVACY = [
  { title: '۱. اطلاعات جمع‌آوری شده', body: 'ما اطلاعاتی همچون نام، شماره موبایل، آدرس ایمیل، آدرس IP و رفتار استفاده از اپ را جهت ارائه خدمات بهتر ذخیره می‌کنیم.' },
  { title: '۲. استفاده از اطلاعات', body: 'اطلاعات صرفاً برای ارائه سرویس، احراز هویت، پشتیبانی، بهبود تجربه کاربری و امنیت حساب کاربری استفاده می‌شود.' },
  { title: '۳. اشتراک‌گذاری با اشخاص ثالث', body: 'هیچ‌گاه اطلاعات شخصی شما به اشخاص ثالث فروخته نمی‌شود. تنها در موارد قانونی یا ضروری برای ارائه خدمت با شرکای منتخب به اشتراک گذاشته می‌شود.' },
  { title: '۴. امنیت داده', body: 'تمامی داده‌ها رمزنگاری شده و در سرورهای امن نگهداری می‌شوند. دسترسی به داده‌های حساس فقط برای کارشناسان مجاز ممکن است.' },
  { title: '۵. حقوق کاربر', body: 'شما می‌توانید در هر زمان درخواست مشاهده، اصلاح یا حذف داده‌های شخصی خود را از طریق بخش پشتیبانی ارسال کنید.' },
  { title: '۶. کوکی‌ها', body: 'برای ارتقاء تجربه کاربری از کوکی استفاده می‌شود. می‌توانید از تنظیمات مرورگر، استفاده از کوکی را غیرفعال کنید.' },
];

function EuLegalContent() {
  const [tab, setTab] = useState<'terms' | 'privacy'>('terms');
  const sections = tab === 'terms' ? LEGAL_TERMS : LEGAL_PRIVACY;

  return (
    <div>
      <div className="flex gap-1 mb-3 p-1 rounded-[10px] border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
        {([['terms','قوانین و مقررات','fa-solid fa-file-contract'], ['privacy','حریم خصوصی','fa-solid fa-user-shield']] as const).map(([id, label, icon]) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id as any)} className="flex-1 py-2 rounded-lg text-[11.5px] cursor-pointer border-none flex items-center justify-center gap-1.5" style={{ background: active ? 'var(--aw-eu-primary)' : 'transparent', color: active ? '#fff' : 'var(--aw-text-secondary)', fontWeight: 700 }}>
              <i className={`${icon} text-[10px]`} /> {label}
            </button>
          );
        })}
      </div>

      <div className="rounded-[10px] p-3 border border-[var(--aw-border)] mb-3" style={{ background: 'rgba(126,95,170,0.08)', borderColor: 'rgba(126,95,170,0.25)' }}>
        <div className="flex items-start gap-2">
          <i className="fa-solid fa-circle-info text-[12px] mt-0.5" style={{ color: 'var(--aw-eu-primary)' }} />
          <div>
            <div className="text-[11.5px] mb-0.5" style={{ fontWeight: 700, color: 'var(--aw-eu-primary)' }}>
              {tab === 'terms' ? 'شرایط استفاده از سرویس Neura' : 'سیاست حفظ حریم خصوصی Neura'}
            </div>
            <div className="text-[10.5px] text-[var(--aw-text-secondary)]">آخرین به‌روزرسانی: ۲۰ فروردین ۱۴۰۵</div>
          </div>
        </div>
      </div>

      {sections.map((s, i) => (
        <div key={i} className="rounded-[10px] p-3 border border-[var(--aw-border)] mb-2" style={{ background: 'var(--aw-bg-card)' }}>
          <div className="text-[12px] mb-1.5" style={{ fontWeight: 700, color: 'var(--aw-eu-primary)' }}>{s.title}</div>
          <div className="text-[11.5px] text-[var(--aw-text-secondary)] leading-7">{s.body}</div>
        </div>
      ))}

      <div className="text-center text-[10px] text-[var(--aw-text-muted)] py-3">
        © ۱۴۰۵ Neura. تمامی حقوق محفوظ است.
      </div>
    </div>
  );
}

function EuLogoutContent() {
  const { closeModal, showToast, logout } = useApp();
  return (
    <div>
      <div className="text-center mb-4">
        <i className="fa-solid fa-sign-out-alt text-[40px] text-[var(--aw-danger)] mb-3 block" />
        <p className="text-[14px]">آیا مطمئن هستید؟</p>
      </div>
      <div className="flex gap-2">
        <button className="flex-1 py-2.5 px-5 border-none rounded-[10px] text-[13px] text-white cursor-pointer" style={{ background: 'var(--aw-danger)', fontWeight: 600 }} onClick={() => { closeModal(); showToast('با موفقیت خارج شدید'); logout(); }}>بله، خروج</button>
        <button className="flex-1 py-2.5 px-5 rounded-[10px] text-[13px] cursor-pointer border border-[var(--aw-border)] text-[var(--aw-text-secondary)]" style={{ background: 'transparent', fontWeight: 600 }} onClick={closeModal}>انصراف</button>
      </div>
    </div>
  );
}

// ========================
// UNIFIED CART SCREEN (general cart from header)
// ========================
function EuCartScreen() {
  const { euCart, cartAdd, cartDec, cartRemove, checkoutCart, setEuScreen, showToast, openModal, closeModal } = useApp() as any;
  // __euCheckoutAddr: آدرسِ تحویلِ اجباری (نکسا‌مپ)
  const [__addrs, __setAddrs] = useState<any[]>([]);
  const [__selAddr, __setSelAddr] = useState<any>(null);
  const __loadAddrs = () => (api as any).myList('addresses').then((r: any) => { if (Array.isArray(r)) { __setAddrs(r); __setSelAddr((p: any) => p || r[0] || null); } }).catch(() => {});
  useEffect(() => { __loadAddrs(); }, []);
  const grouped: Record<string, any[]> = {};
  euCart.forEach((l: any) => { (grouped[l.source] = grouped[l.source] || []).push(l); });
  const total = euCart.reduce((s: number, c: any) => s + c.priceNum * c.qty, 0);
  const SRC_META: Record<string, { label: string; icon: string; color: string }> = {
    market: { label: 'مارکت', icon: 'fa-solid fa-store', color: '#F59E0B' },
    dine: { label: 'سفارش غذا', icon: 'fa-solid fa-utensils', color: '#14b8a6' },
  };
  const fa = (n: number) => toFa(n.toLocaleString('en-US'));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 pt-3 pb-2 flex-shrink-0">
        <button onClick={() => setEuScreen('euHomeScreen')} className="w-9 h-9 rounded-[10px] border border-[var(--aw-border)] bg-transparent cursor-pointer flex items-center justify-center text-[var(--aw-eu-primary)]" title="بازگشت">
          <i className="fa-solid fa-arrow-right text-[13px]" />
        </button>
        <span className="text-[16px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>سبد خرید</span>
      </div>

      {euCart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'var(--aw-primary-bg)' }}>
            <i className="fa-solid fa-cart-shopping text-[30px] text-[var(--aw-eu-primary)]" style={{ opacity: 0.7 }} />
          </div>
          <span className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>سبد خرید شما خالی است</span>
          <span className="text-[12px] text-[var(--aw-text-muted)]">از مارکت یا سفارش غذا آیتم اضافه کنید</span>
          <div className="flex gap-2 mt-2">
            <button onClick={() => setEuScreen('euMarketScreen')} className="px-4 py-2 rounded-[10px] border-none text-white text-[12px] cursor-pointer" style={{ background: '#F59E0B', fontWeight: 700 }}><i className="fa-solid fa-store ml-1.5" />مارکت</button>
            <button onClick={() => setEuScreen('euDineScreen')} className="px-4 py-2 rounded-[10px] border-none text-white text-[12px] cursor-pointer" style={{ background: '#14b8a6', fontWeight: 700 }}><i className="fa-solid fa-utensils ml-1.5" />سفارش غذا</button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto aw-scroll px-4 pb-3 flex flex-col gap-4">
            {Object.entries(grouped).map(([source, lines]) => {
              const meta = SRC_META[source] || { label: source, icon: 'fa-solid fa-box', color: 'var(--aw-eu-primary)' };
              const subTotal = lines.reduce((s, l) => s + l.priceNum * l.qty, 0);
              return (
                <div key={source} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-1 pt-1">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${meta.color}22`, color: meta.color }}><i className={`${meta.icon} text-[11px]`} /></span>
                    <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{meta.label}</span>
                    <span className="text-[10px] text-[var(--aw-text-muted)]">({toFa(lines.length)} قلم)</span>
                  </div>
                  {lines.map(l => (
                    <div key={l.key} className="p-3 flex items-center gap-3 rounded-[10px]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
                      <div className="flex-1 min-w-0">
                        <span className="block text-[13px] text-[var(--aw-text-primary)] truncate" style={{ fontWeight: 600 }}>{l.name}</span>
                        <span className="block text-[11px] mt-0.5" style={{ color: meta.color, fontWeight: 700 }}>{fa(l.priceNum)} تومان</span>
                        {(l.shop || l.restaurant) && <span className="block text-[10px] text-[var(--aw-text-muted)] mt-0.5">{l.shop || l.restaurant}</span>}
                      </div>
                      <div className="flex items-center gap-0 flex-shrink-0">
                        <button onClick={() => cartDec(l.key)} className="w-7 h-7 rounded-lg border-none text-white cursor-pointer flex items-center justify-center text-[10px]" style={{ background: 'var(--aw-danger)' }}>
                          <i className={`fa-solid ${l.qty === 1 ? 'fa-trash' : 'fa-minus'} text-[9px]`} />
                        </button>
                        <span className="w-7 text-center text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{toFa(l.qty)}</span>
                        <button onClick={() => cartAdd(l)} className="w-7 h-7 rounded-lg border-none text-white cursor-pointer flex items-center justify-center text-[10px]" style={{ background: meta.color }}>
                          <i className="fa-solid fa-plus text-[9px]" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-1 text-[11px] text-[var(--aw-text-muted)]">
                    <span>جمع {meta.label}</span>
                    <span style={{ fontWeight: 700, color: 'var(--aw-text-primary)' }}>{fa(subTotal)} تومان</span>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Delivery address (نکسا‌مپ) — اجباری */}
          <div className="flex-shrink-0 px-4 pt-2">
            <div className="text-[12px] mb-1.5" style={{ fontWeight: 700 }}>آدرسِ تحویل</div>
            {__addrs.length === 0 && (<div className="text-[11px] text-[var(--aw-text-muted)] mb-1.5">آدرسی ثبت نشده — با نقشه اضافه کن.</div>)}
            <div className="flex flex-col gap-1.5 mb-2">
              {__addrs.map((a: any) => (
                <button key={a.id} onClick={() => __setSelAddr(a)} className="text-right p-2 rounded-[10px] border text-[12px] cursor-pointer" style={{ borderColor: (__selAddr && __selAddr.id === a.id) ? 'var(--aw-eu-primary)' : 'var(--aw-border)', background: 'var(--aw-bg-input)', color: 'var(--aw-text-primary)' }}>
                  <i className="fa-solid fa-location-dot text-[10px] ml-1" style={{ color: 'var(--aw-eu-primary)' }} />{a.title || a.text || 'آدرس'}
                </button>
              ))}
            </div>
            <button onClick={() => openModal('افزودن آدرس', <AddressFormModal onDone={() => { closeModal(); __loadAddrs(); showToast('آدرس ذخیره شد ✅', 'success'); }} />)} className="text-[11px] text-[var(--aw-eu-primary)] bg-transparent border-none cursor-pointer">+ افزودن آدرسِ جدید (نقشه)</button>
          </div>
          {/* Checkout bar */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-[var(--aw-border)] mb-[84px] md:mb-0" style={{ background: 'var(--aw-bg-header)', backdropFilter: 'blur(16px)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-[var(--aw-text-muted)]">مبلغ کل</span>
              <span className="text-[16px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{fa(total)} <span className="text-[11px]" style={{ fontWeight: 600 }}>تومان</span></span>
            </div>
            <button
              onClick={() => { if (!__selAddr) { showToast('لطفاً آدرسِ تحویل را انتخاب کنید', 'error'); return; } try { (window as any).__euOrderAddress = __selAddr.title || __selAddr.text || ''; } catch (_e) {} checkoutCart(); showToast('سفارش در حال ثبت است…', 'info'); openMarketOrders(setEuScreen); }}
              className="w-full py-3 rounded-[10px] border-none text-white text-[14px] cursor-pointer flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, var(--aw-eu-primary), #5c4abd)', fontWeight: 700 }}>
              <i className="fa-solid fa-credit-card text-[12px]" /> پرداخت و ثبت سفارش
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ========================
// END USER PANEL MAIN
// ========================
// یک‌بار که اجازه داده شد، دیگر هرگز نمی‌پرسیم (پایدار در localStorage — حتی بعدِ رفرش/نصب روی هوم).
let __permAskedThisLoad = false;
function __permGranted(): boolean { try { return localStorage.getItem('aw-perm-granted') === '1'; } catch (_) { return false; } }
function __setPermGranted() { try { localStorage.setItem('aw-perm-granted', '1'); } catch (_) {} }
// شناسهٔ کاربر از JWT (sub) — تا دسترسی «per-user» و فقط یک‌بار پرسیده شود (نه هر ورود).
function __permUid(): string { try { const t = localStorage.getItem('aw-token') || ''; const p = t.split('.')[1]; if (!p) return ''; const j = JSON.parse(decodeURIComponent(escape(atob(p.replace(/-/g, '+').replace(/_/g, '/'))))); return String(j.sub || j.id || ''); } catch (_) { return ''; } }
function __permAsked(): boolean { try { const u = __permUid(); return !!u && localStorage.getItem('aw-perm-asked:' + u) === '1'; } catch (_) { return false; } }
function __setPermAsked() { try { const u = __permUid(); if (u) localStorage.setItem('aw-perm-asked:' + u, '1'); } catch (_) {} }
async function requestMediaPermissionEx(wantVideo?: boolean): Promise<{ ok: boolean; reason?: string }> {
  try { if (typeof window !== 'undefined' && (window as any).isSecureContext === false) return { ok: false, reason: 'insecure' }; } catch (_) {}
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return { ok: false, reason: 'unsupported' };
  try {
    const st = await navigator.mediaDevices.getUserMedia(wantVideo ? { audio: true, video: true } : { audio: true });
    st.getTracks().forEach(t => t.stop()); __setPermGranted(); return { ok: true };
  } catch (e: any) {
    if (wantVideo) { try { const s2 = await navigator.mediaDevices.getUserMedia({ audio: true }); s2.getTracks().forEach(t => t.stop()); __setPermGranted(); return { ok: true }; } catch (e2) { e = e2; } }
    const name = (e && e.name) || '';
    let reason = 'denied';
    if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') reason = 'blocked';
    else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') reason = 'nomic';
    else if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') reason = 'busy';
    return { ok: false, reason, raw: name + (e && e.message ? ': ' + String(e.message).slice(0, 90) : '') };
  }
}
// تشخیصِ دقیقِ علتِ مشکل — برای نمایش به کاربر/پشتیبانی تا حدس نزنیم.
async function __permDiag(): Promise<string> {
  const bits: string[] = [];
  try { bits.push('proto=' + location.protocol); } catch (_) {}
  try { bits.push('secure=' + String((window as any).isSecureContext)); } catch (_) {}
  try { bits.push('md=' + String(!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia))); } catch (_) {}
  try { bits.push('iframe=' + String(window.top !== window.self)); } catch (_) { bits.push('iframe=cross'); }
  try {
    const perms = (navigator as any).permissions;
    if (perms && perms.query) { const m = await perms.query({ name: 'microphone' as any }); bits.push('mic=' + m.state); }
    else bits.push('mic=noAPI');
  } catch (_) { bits.push('mic=err'); }
  return bits.join(' · ');
}
async function requestMediaPermission(wantVideo?: boolean): Promise<boolean> { return (await requestMediaPermissionEx(wantVideo)).ok; }
// مرورگرِ داخلیِ اپ‌ها (واتساپ/اینستاگرام/تلگرام/…) — این‌ها معمولاً میکروفون را بلاک می‌کنند.
function __isInAppBrowser(): boolean {
  try {
    const ua = (navigator.userAgent || '');
    if (/; *wv\)|wv/.test(ua)) return true; // Android WebView
    return /(FBAN|FBAV|Instagram|Line|MicroMessenger|WhatsApp|Telegram|GSA|Snapchat|Twitter)/i.test(ua);
  } catch (_) { return false; }
}

function PermissionGate() {
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failReason, setFailReason] = useState<string>('');
  const [diag, setDiag] = useState<string>('');
  useEffect(() => {
    let dead = false;
    (async () => {
      if (__permGranted() || __permAsked()) return;   // اجازه داده شده یا قبلاً از این کاربر پرسیده‌ایم — دیگر هرگز نپرس
      if (__permAskedThisLoad) return;           // این ورود قبلاً پرسیده شده
      // اگر مرورگر از permissions API پشتیبانی می‌کند و میکروفون granted است، فلگ را ست و نپرس
      let micGranted = false;
      try {
        const perms = (navigator as any).permissions;
        if (perms && perms.query) {
          const mic = await perms.query({ name: 'microphone' as any });
          micGranted = mic.state === 'granted';
        }
      } catch (_) {}
      if (dead) return;
      if (micGranted) { __setPermGranted(); return; }
      __permAskedThisLoad = true;
      __setPermAsked();                          // per-user: فقط یک‌بار می‌پرسیم (حتی اگر رد کند، دیگر مزاحم نمی‌شویم)
      setAsk(true);
    })();
    return () => { dead = true; };
  }, []);
  const request = async () => {
    setBusy(true); setFailReason('');
    const r = await requestMediaPermissionEx(false); // فقط میکروفون — تا روی اندروید قطعاً فعال شود
    setBusy(false);
    if (r.ok) { setAsk(false); return; }              // اجازه داده شد → دیگر هرگز نمی‌پرسد
    // اگر داخلِ مرورگرِ یک اپ (واتساپ/اینستاگرام/…) باشیم، علتِ واقعی همان است
    setFailReason(__isInAppBrowser() ? 'inapp' : (r.reason || 'denied'));
    try { setDiag(((r as any).raw ? (r as any).raw + ' · ' : '') + (await __permDiag())); } catch (_) {}
  };
  const copyLink = () => { try { navigator.clipboard?.writeText(window.location.href); } catch (_) {} };
  const FAIL_MSG: Record<string, string> = {
    inapp: 'تو این صفحه را داخلِ مرورگرِ یک اپ (مثلِ واتساپ/اینستاگرام) باز کرده‌ای و آن‌ها میکروفون را بلاک می‌کنند. روی منوی ⋮ بالا بزن و «Open in Chrome / باز کردن در مرورگر» را انتخاب کن، بعد دوباره وارد شو.',
    insecure: 'این صفحه روی اتصالِ امن (HTTPS) باز نشده و مرورگر اجازهٔ میکروفون نمی‌دهد. آدرس را با https باز کن.',
    unsupported: 'این مرورگر از میکروفون پشتیبانی نمی‌کند یا داخلِ مرورگرِ یک اپ هستی. لینک را در Chrome باز کن.',
    blocked: 'قبلاً «رد/Block» زده شده، برای همین مرورگر دیگر نمی‌پرسد. از قفلِ 🔒 کنارِ نوارِ آدرس → Permissions → میکروفون را Allow کن، بعد صفحه را تازه کن.',
    nomic: 'میکروفونی روی این دستگاه پیدا نشد.',
    busy: 'میکروفون توسطِ یک برنامهٔ دیگر در حالِ استفاده است؛ آن را ببند و دوباره تلاش کن.',
    denied: 'اجازه داده نشد. از قفلِ 🔒 کنارِ نوارِ آدرس → Permissions → میکروفون را Allow کن، بعد صفحه را تازه کن.',
  };
  if (!ask) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--aw-bg-card, #fff)', borderRadius: 20, padding: '24px 20px', maxWidth: 340, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 14px', background: 'linear-gradient(135deg,#7B62FC,#1E6BFF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fa-solid fa-microphone-lines" style={{ color: '#fff', fontSize: 26 }} />
        </div>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8, color: 'var(--aw-text-primary)' }}>دسترسی به میکروفون و دوربین</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--aw-text-secondary)', marginBottom: 18 }}>
          برای گفتگوی صوتی با دستیار به اجازهٔ میکروفون نیاز داریم.
        </div>
        {failReason && (
          <div style={{ fontSize: 11.5, lineHeight: 1.9, color: '#ef4444', background: 'rgba(239,68,68,0.08)', borderRadius: 12, padding: '10px 12px', marginBottom: 14, textAlign: 'right' }}>
            {FAIL_MSG[failReason] || FAIL_MSG.denied}
            {diag && <div dir="ltr" style={{ marginTop: 8, fontSize: 9.5, opacity: 0.7, color: 'var(--aw-text-muted)', wordBreak: 'break-all', textAlign: 'left' }}>{diag}</div>}
          </div>
        )}
        {(failReason === 'inapp' || failReason === 'unsupported') && (
          <button onClick={copyLink} style={{ width: '100%', padding: '10px', marginBottom: 8, borderRadius: 12, border: '1px solid var(--aw-primary,#6366f1)', background: 'transparent', color: 'var(--aw-primary,#6366f1)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
            کپیِ لینک (در Chrome پیست کن)
          </button>
        )}
        <button onClick={request} disabled={busy} style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#7B62FC,#1E6BFF)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: busy ? 0.7 : 1 }}>
          {busy ? 'در حال درخواست…' : failReason ? 'تلاش دوباره' : 'اجازه می‌دهم'}
        </button>
        <button onClick={() => setAsk(false)} style={{ width: '100%', padding: '10px', marginTop: 8, borderRadius: 12, border: 'none', background: 'transparent', color: 'var(--aw-text-muted)', fontSize: 12, cursor: 'pointer' }}>
          بعداً
        </button>
      </div>
    </div>
  );
}

export default function EndUserPanel() {
  const { euScreen } = useApp();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [headerH, setHeaderH] = useState(0);
  const headerRef = React.useRef<HTMLDivElement | null>(null);
  const behindHeader = euScreen === 'euHomeScreen';
  React.useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setHeaderH(el.offsetHeight));
    ro.observe(el);
    setHeaderH(el.offsetHeight);
    return () => ro.disconnect();
  }, [euScreen]);

  const isAgentScreen = euScreen === 'euDineScreen' || euScreen === 'euAssistantScreen' || euScreen === 'euSupportScreen' || euScreen === 'euMarketScreen';
  // These screens carry their OWN tab bar as the footer — hide the global nav so there aren't two.
  const ownFooter = euScreen === 'euDineScreen' || euScreen === 'euSupportScreen' || euScreen === 'euMarketScreen';

  return (
    <div className="flex h-full min-h-0" style={{ direction: 'rtl' }}>
      <PermissionGate />
      {/* Desktop Sidebar — only for non-agent screens */}
      {!isAgentScreen && <EuSidebar expanded={sidebarExpanded} onToggle={() => setSidebarExpanded(p => !p)} />}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 has-glass-footer" style={{ order: 2, position: 'relative', ['--eu-header-h' as string]: headerH + 'px' }}>
        {/* Header always rendered so avatar stays fixed at top. On home it overlays so content scrolls behind the blurred gradient. */}
        <div ref={headerRef} style={behindHeader ? { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 110 } : undefined}>
          <EuHeader />
        </div>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {euScreen === 'euHomeScreen' && <motion.div key="euHome" className="flex flex-col h-full" variants={euPageVariants} initial="initial" animate="animate" exit="exit"><EuHomeScreen /></motion.div>}
            {euScreen === 'euChatListScreen' && <motion.div key="euChats" className="flex flex-col h-full" variants={euPageVariants} initial="initial" animate="animate" exit="exit"><EuChatListScreen /></motion.div>}
            {euScreen === 'euOffersScreen' && <motion.div key="euOffers" className="flex flex-col h-full" variants={euPageVariants} initial="initial" animate="animate" exit="exit"><EuOffersScreen /></motion.div>}
            {euScreen === 'euAgentDiscovery' && <motion.div key="euDiscover" className="flex flex-col h-full" variants={euPageVariants} initial="initial" animate="animate" exit="exit"><EuAgentDiscoveryScreen /></motion.div>}
            {euScreen === 'euPlannerScreen' && <motion.div key="euPlanner" className="flex flex-col h-full" variants={euPageVariants} initial="initial" animate="animate" exit="exit"><EuPlannerScreen /></motion.div>}
            {euScreen === 'euSearchScreen' && <motion.div key="euSearch" className="flex flex-col h-full" variants={euPageVariants} initial="initial" animate="animate" exit="exit"><EuSearchScreen /></motion.div>}
            {euScreen === 'euReportScreen' && <motion.div key="euReport" className="flex flex-col h-full" variants={euPageVariants} initial="initial" animate="animate" exit="exit"><EuReportScreen /></motion.div>}
            {euScreen === 'euProfileScreen' && <motion.div key="euProfile" className="flex flex-col h-full" variants={euPageVariants} initial="initial" animate="animate" exit="exit"><EuProfileScreen /></motion.div>}
            {euScreen === 'euDineScreen' && <motion.div key="euDine" className="flex flex-col h-full" variants={euPageVariants} initial="initial" animate="animate" exit="exit"><EuDineScreen /></motion.div>}
            {euScreen === 'euAssistantScreen' && <motion.div key="euAssistant" className="flex flex-col h-full" variants={euPageVariants} initial="initial" animate="animate" exit="exit"><EuAssistantScreen /></motion.div>}
            {euScreen === 'euSupportScreen' && <motion.div key="euSupport" className="flex flex-col h-full" variants={euPageVariants} initial="initial" animate="animate" exit="exit"><EuSupportScreen /></motion.div>}
            {euScreen === 'euMarketScreen' && <motion.div key="euMarket" className="flex flex-col h-full" variants={euPageVariants} initial="initial" animate="animate" exit="exit"><EuMarketScreen /></motion.div>}
            {euScreen === 'euCartScreen' && <motion.div key="euCart" className="flex flex-col h-full" variants={euPageVariants} initial="initial" animate="animate" exit="exit"><EuCartScreen /></motion.div>}
          </AnimatePresence>
        </div>

        {/* Bottom nav — hidden on screens that provide their own footer tab bar */}
        {!ownFooter && <div className="glass-footer-mount"><EuNav /></div>}
      </div>
    </div>
  );
}