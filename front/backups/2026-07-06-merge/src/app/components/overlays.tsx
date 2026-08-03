import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './app-context';
import { toFa } from './data';
import { LetterAvatar } from './letter-avatar';

// ========================
// MODAL OVERLAY
// ========================
export function ModalOverlay() {
  const { modal, closeModal } = useApp();
  const [expanded, setExpanded] = useState(false);
  const dragRef = React.useRef({ startY: 0, active: false, moved: 0 });
  const wasOpenRef = React.useRef(false);

  // Reset to the default (70%) snap only when the modal FIRST opens —
  // navigating between screens (back / another option) keeps the current size.
  React.useEffect(() => {
    if (modal.open && !wasOpenRef.current) setExpanded(false);
    wasOpenRef.current = modal.open;
  }, [modal.open]);

  const onGrabDown = (e: React.PointerEvent) => {
    dragRef.current = { startY: e.clientY, active: true, moved: 0 };
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
  };
  const onGrabMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    dragRef.current.moved = e.clientY - dragRef.current.startY;
  };
  const onGrabUp = () => {
    if (!dragRef.current.active) return;
    const dy = dragRef.current.moved;
    dragRef.current.active = false;
    if (dy < -40) setExpanded(true);
    else if (dy > 90) { if (expanded) setExpanded(false); else closeModal(); }
    else setExpanded(v => !v); // small tap toggles size
  };

  return (
    <AnimatePresence>
      {modal.open && (
        <motion.div
          data-block-avatar="1"
          className="fixed inset-0 z-[200] flex items-end md:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="w-full max-w-[480px] md:max-w-[600px] rounded-t-[20px] md:rounded-[20px] md:mb-5 flex flex-col"
            style={{
              height: expanded ? '92vh' : '70vh',
              maxHeight: '92vh',
              transition: 'height 0.32s cubic-bezier(0.32,0.72,0,1)',
              background: 'linear-gradient(180deg, color-mix(in srgb, var(--aw-eu-primary, var(--aw-primary)) 15%, var(--aw-bg-modal)) 0%, color-mix(in srgb, var(--aw-eu-primary, var(--aw-primary)) 15%, var(--aw-bg-modal)) 100%)',
              backdropFilter: 'blur(20px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
              boxShadow: '0 18px 44px color-mix(in srgb, var(--aw-eu-primary, var(--aw-primary)) 28%, transparent), 0 4px 14px color-mix(in srgb, var(--aw-eu-primary, var(--aw-primary)) 18%, transparent), inset 0 1.5px 1px rgba(255,255,255,0.6), inset 0 0 0 1px color-mix(in srgb, var(--aw-eu-primary, var(--aw-primary)) 22%, transparent)',
            }}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* Grabber — drag to resize/close, tap to toggle size */}
            <div
              className="flex justify-center pt-2.5 pb-1.5 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={onGrabDown} onPointerMove={onGrabMove} onPointerUp={onGrabUp} onPointerCancel={onGrabUp}>
              <div className="w-10 h-1.5 rounded-full" style={{ background: 'var(--aw-border)' }} />
            </div>
            <div className="flex justify-between items-center px-5 pb-3 border-b border-[var(--aw-border)] flex-shrink-0">
              <div className="flex items-center gap-2">
                {modal.onBack && (
                  <button className="w-9 h-9 rounded-[12px] flex items-center justify-center cursor-pointer text-sm" style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-primary)' }} onClick={() => modal.onBack && modal.onBack()}>
                    <i className="fa-solid fa-arrow-right" />
                  </button>
                )}
                <span className="text-[15px]" style={{ fontWeight: 700 }}>{modal.title}</span>
              </div>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center border-none text-[var(--aw-text-secondary)] cursor-pointer text-sm" style={{ background: 'var(--aw-bg-input)' }} onClick={closeModal}>
                <i className="fa-solid fa-times" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto aw-scroll p-5">
              {modal.content}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ========================
// CALL OVERLAY
// ========================
export function CallOverlay() {
  const { call, endCall } = useApp();
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);

  if (!call.open) return null;

  const m = String(Math.floor(call.timer / 60)).padStart(2, '0');
  const s = String(call.timer % 60).padStart(2, '0');
  const timerText = call.timer > 0 ? toFa(m) + ':' + toFa(s) : 'در حال برقراری تماس...';

  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(22px) saturate(1.1)', WebkitBackdropFilter: 'blur(22px) saturate(1.1)' }}>
      <div className="text-center">
        <div className="mx-auto mb-4 flex justify-center">
          <LetterAvatar name={call.name} init={call.init} size={90} radius={26} />
        </div>
        <div className="text-xl mb-1" style={{ fontWeight: 700 }}>{call.name}</div>
        <div className="text-[13px] text-[var(--aw-text-secondary)] mb-1.5">{call.role}</div>
        {call.ext && <div className="text-[12px] text-[var(--aw-primary-light)] mb-2">داخلی: {call.ext}</div>}
        <div className="text-[13px] text-[var(--aw-text-secondary)] mb-8">{timerText}</div>

        <div className="flex gap-5 justify-center">
          <button
            className="w-[60px] h-[60px] rounded-full border-none text-[22px] cursor-pointer flex items-center justify-center text-white"
            style={{ background: muted ? 'var(--aw-danger)' : 'var(--aw-bg-card)' }}
            onClick={() => setMuted(!muted)}
          >
            <i className={muted ? 'fa-solid fa-microphone-slash' : 'fa-solid fa-microphone'} />
          </button>
          <button
            className="w-[60px] h-[60px] rounded-full border-none text-[22px] cursor-pointer flex items-center justify-center text-white"
            style={{ background: 'var(--aw-danger)' }}
            onClick={endCall}
          >
            <i className="fa-solid fa-phone-slash" />
          </button>
          <button
            className="w-[60px] h-[60px] rounded-full border-none text-[22px] cursor-pointer flex items-center justify-center text-white"
            style={{ background: speaker ? 'var(--aw-primary)' : 'var(--aw-bg-card)' }}
            onClick={() => setSpeaker(!speaker)}
          >
            <i className="fa-solid fa-volume-up" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ========================
// UNIFIED CALL MODAL
// ========================
const PERSONAL_CONTACTS = [
  { id: 'pc1', name: 'علی رضایی',     relation: 'همکار',     phone: '۰۹۱۲۳۴۵۶۷۸۹', init: 'ع', bg: 'aw-bg-blue' },
  { id: 'pc2', name: 'مریم احمدی',    relation: 'دوست',      phone: '۰۹۱۰۱۲۳۴۵۶۷', init: 'م', bg: 'aw-bg-pink' },
  { id: 'pc3', name: 'سینا کریمی',    relation: 'خانواده',   phone: '۰۹۳۵۸۷۶۵۴۳۲', init: 'س', bg: 'aw-bg-green' },
  { id: 'pc4', name: 'نرگس موسوی',    relation: 'مدیر',      phone: '۰۹۱۹۲۲۲۳۳۴۴', init: 'ن', bg: 'aw-bg-purple' },
  { id: 'pc5', name: 'حمیدرضا صادقی', relation: 'پزشک',      phone: '۰۹۱۲۹۹۸۸۷۷۶', init: 'ح', bg: 'aw-bg-orange' },
  { id: 'pc6', name: 'الهام توکلی',   relation: 'وکیل',      phone: '۰۹۳۸۴۴۵۵۶۶۷', init: 'ا', bg: 'aw-bg-cyan' },
];

export function UnifiedCallModal() {
  const { unifiedCall, closeUnifiedCall, startCall, agents, personnel, customers } = useApp();
  const [search, setSearch] = useState('');

  if (!unifiedCall.open) return null;

  const q = search.trim();
  const filteredContacts = PERSONAL_CONTACTS.filter(c => !q || c.name.includes(q) || c.phone.includes(q) || c.relation.includes(q));
  const filteredCustomers = customers.filter(c => !q || c.name.includes(q) || c.contact.includes(q));
  const filteredPersonnel = personnel.filter(p => !q || p.name.includes(q) || p.role.includes(q));
  const filteredAgents = agents.filter(a => !a.locked && (!q || a.name.includes(q) || a.role.includes(q)));

  const hasResults = filteredContacts.length > 0 || filteredCustomers.length > 0 || filteredPersonnel.length > 0 || filteredAgents.length > 0;

  return (
    <div
      data-block-avatar="1"
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) closeUnifiedCall(); }}
    >
      <div className="w-full max-w-[480px] md:max-w-[600px] max-h-[90vh] overflow-hidden rounded-t-[20px] md:rounded-[20px] md:mb-5 flex flex-col" style={{ background: 'var(--aw-bg-modal)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
        <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--aw-border)]">
          <span className="text-[15px] flex items-center gap-1.5" style={{ fontWeight: 700 }}>
            <i className="fa-solid fa-phone-alt" /> برقراری تماس
          </span>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center border-none text-[var(--aw-text-secondary)] cursor-pointer text-sm" style={{ background: 'var(--aw-bg-input)' }} onClick={closeUnifiedCall}>
            <i className="fa-solid fa-times" />
          </button>
        </div>
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-2 rounded-[10px] px-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
            <i className="fa-solid fa-search text-sm text-[var(--aw-text-muted)]" />
            <input className="flex-1 bg-transparent border-none py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]" placeholder="جستجوی مخاطب..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 aw-scroll">
          {/* Personal Contacts */}
          {filteredContacts.length > 0 && (
            <>
              <div className="text-[12px] text-[var(--aw-text-muted)] py-2.5 px-1 flex items-center gap-1.5" style={{ fontWeight: 700 }}>
                <i className="fa-solid fa-address-book" /> مخاطبین
              </div>
              {filteredContacts.map(c => (
                <CallContactItem key={c.id} name={c.name} meta={[c.relation, c.phone]} bg={c.bg} init={c.init}
                  onCall={() => startCall(c.name, c.relation, c.bg, c.init, '')} />
              ))}
            </>
          )}

          {/* Customers */}
          {filteredCustomers.length > 0 && (
            <>
              <div className="text-[12px] text-[var(--aw-text-muted)] py-2.5 px-1 flex items-center gap-1.5" style={{ fontWeight: 700 }}>
                <i className="fa-solid fa-users" /> مشتریان
              </div>
              {filteredCustomers.map(c => (
                <CallContactItem key={c.id} name={c.name} meta={['مشتری', c.phone]} bg="aw-bg-cyan" init={c.name[0]}
                  onCall={() => startCall(c.name, 'مشتری', 'aw-bg-cyan', c.name[0], '')} />
              ))}
            </>
          )}

          {/* Personnel */}
          {filteredPersonnel.length > 0 && (
            <>
              <div className="text-[12px] text-[var(--aw-text-muted)] py-2.5 px-1 flex items-center gap-1.5" style={{ fontWeight: 700 }}>
                <i className="fa-solid fa-user-tie" /> پرسنل
              </div>
              {filteredPersonnel.map(p => (
                <CallContactItem key={p.id} name={p.name} meta={[p.role, p.status === 'online' ? 'آنلاین' : 'آفلاین']} bg={p.bg} init={p.init} ext={p.voip}
                  statusDot={p.status === 'online' ? 'var(--aw-online)' : 'var(--aw-offline)'}
                  onCall={() => startCall(p.name, p.role, p.bg, p.init, p.voip)} />
              ))}
            </>
          )}

          {/* Agents */}
          {filteredAgents.length > 0 && (
            <>
              <div className="text-[12px] text-[var(--aw-text-muted)] py-2.5 px-1 flex items-center gap-1.5" style={{ fontWeight: 700 }}>
                <i className="fa-solid fa-robot" /> عامل‌های هوشمند
              </div>
              {filteredAgents.map(a => (
                <CallContactItem key={a.id} name={a.name} meta={[a.role]} bg={a.bg} init={a.init} ext={a.voip}
                  statusDot="var(--aw-online)" statusLabel="آنلاین"
                  onCall={() => startCall(a.name, a.role, a.bg, a.init, a.voip)} />
              ))}
            </>
          )}

          {!hasResults && (
            <div className="text-center py-12 text-[var(--aw-text-muted)]">
              <i className="fa-solid fa-search text-[56px] opacity-25 block mb-5" />
              <p className="text-[13px]">مخاطبی یافت نشد</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CallContactItem({ name, meta, bg, init, ext, statusDot, statusLabel, onCall }: {
  name: string; meta: string[]; bg: string; init: string; ext?: string; statusDot?: string; statusLabel?: string; onCall: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] cursor-pointer transition-all border border-transparent hover:bg-[var(--aw-bg-card-hover)] hover:border-[var(--aw-primary)]"
      onClick={onCall}>
      <div className="relative flex-shrink-0">
        <LetterAvatar name={name} init={init} size={40} radius={10} />
        {statusDot && (
          <span className="absolute bottom-0 left-0 w-2.5 h-2.5 rounded-full border-2" style={{ background: statusDot, borderColor: 'var(--aw-bg-modal)' }} />
        )}
      </div>
      <div className="flex-1">
        <div className="text-[13px]" style={{ fontWeight: 600 }}>{name}</div>
        <div className="text-[10px] text-[var(--aw-text-muted)] flex gap-2 items-center">
          {meta.map((m, i) => <span key={i}>{m}</span>)}
          {statusLabel && <span style={{ color: 'var(--aw-online)' }}>{statusLabel}</span>}
        </div>
        {ext && <div className="text-[11px] text-[var(--aw-primary-light)]" style={{ fontWeight: 600 }}>داخلی: {ext}</div>}
      </div>
      <button className="w-9 h-9 rounded-[10px] border-none text-white cursor-pointer flex items-center justify-center text-sm" style={{ background: 'var(--aw-secondary)' }}
        onClick={(e) => { e.stopPropagation(); onCall(); }}>
        <i className="fa-solid fa-phone" />
      </button>
    </div>
  );
}

// ========================
// TOAST
// ========================
export function Toast() {
  const { toast } = useApp();

  return createPortal(
    <AnimatePresence>
      {toast.show && (
        <motion.div
          className="fixed bottom-[100px] left-1/2 px-5 py-2.5 rounded-[10px] text-[13px] text-white"
          style={{ background: 'var(--aw-secondary)', boxShadow: 'var(--aw-shadow)', x: '-50%', zIndex: 2147483000 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}