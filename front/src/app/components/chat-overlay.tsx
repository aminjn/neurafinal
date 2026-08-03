import React, { useState, useEffect, useRef } from 'react';

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
import { LetterAvatar } from './letter-avatar';
import { useApp } from './app-context';
import { toFa } from './data';
import svgChatIcons from '../../imports/Frame2147223516/svg-6y73huub0v';

export default function ChatOverlay() {
  const {
    chat, isTyping, closeChat, toggleTopics, switchTopic, createNewTopic,
    renameTopic, removeTopic,
    sendMessage, getMessages, getTopics,
    agents, personnel, customers, startCall, openModal, showToast,
    groupChats, updateGroupChat, removeGroupChat, speakMessage, speakingMsgId
  } = useApp();
  const [inputText, setInputText] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
  const [editTopicTitle, setEditTopicTitle] = useState('');
  // Locally-created history entries, keyed by chat id
  const [extraHistory, setExtraHistory] = useState<Record<string, any[]>>({});
  // Ids of history entries the user removed, keyed by chat id
  const [deletedHistory, setDeletedHistory] = useState<Record<string, string[]>>({});
  const msgsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messages = getMessages();
  const [headerBottom, setHeaderBottom] = useState(120);

  // Mobile drag-sheet: 3 snap points — full-screen (top), below-avatar (default), closed.
  const FULL_TOP = 0;
  const [sheetTop, setSheetTop] = useState<number | null>(null); // null = follow live anchor (below avatar)
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startY: number; startTop: number; moved: boolean } | null>(null);
  const curTop = sheetTop != null ? sheetTop : headerBottom;
  const onSheetDown = (e: React.PointerEvent) => {
    if (window.innerWidth >= 768) return;
    dragRef.current = { startY: e.clientY, startTop: curTop, moved: false };
    setDragging(true);
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch (_) {}
  };
  const onSheetMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const d = e.clientY - dragRef.current.startY;
    if (Math.abs(d) > 6) dragRef.current.moved = true;
    const next = Math.max(FULL_TOP, dragRef.current.startTop + d); // allow dragging up to full-screen
    setSheetTop(next);
  };
  const onSheetUp = () => {
    if (!dragRef.current) return;
    const wasTap = !dragRef.current.moved;
    dragRef.current = null;
    setDragging(false);
    if (wasTap) {
      // Tap (no drag): toggle. Full-screen → collapse below avatar; below avatar → full-screen.
      if (curTop < headerBottom - 4) setSheetTop(null);
      else setSheetTop(FULL_TOP);
      return;
    }
    if (curTop > headerBottom + 90) { closeChat(); return; }       // pulled down → close
    if (curTop < headerBottom - 60) { setSheetTop(FULL_TOP); return; } // pulled up → full-screen
    setSheetTop(null);                                              // snap back below the avatar
  };

  useEffect(() => {
    const measure = () => {
      const corner = document.querySelector('[data-avatar-corner]');
      const anchor = document.querySelector('[data-chat-top-anchor]') || document.querySelector('header');
      if (corner && corner.getBoundingClientRect().height > 0) {
        setHeaderBottom(corner.getBoundingClientRect().bottom + 6);
      } else if (anchor) {
        setHeaderBottom(anchor.getBoundingClientRect().bottom);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    const anchor = document.querySelector('[data-chat-top-anchor]') || document.querySelector('header');
    if (anchor) ro.observe(anchor);
    // anchor POSITION (not size) shifts when the avatar grows/shrinks — re-measure on a light interval while open
    const iv = chat.open ? setInterval(measure, 120) : null;
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); if (iv) clearInterval(iv); window.removeEventListener('resize', measure); };
  }, [chat.open]);

  // reset the drag-sheet position whenever a chat opens
  useEffect(() => { setSheetTop(null); }, [chat.open, chat.id]);

  // Mock chat history data per contact — grouped by date category
  type HistoryItem = { id: string; title: string; date: string; dateCategory: 'today' | 'yesterday' | 'week' | 'month' | 'older'; preview: string; msgCount: number };
  const CHAT_HISTORY: Record<string, HistoryItem[]> = {
    assistant: [],
    support: [],
    restaurant: [],
    market: [],
  };

  const DEFAULT_HISTORY: HistoryItem[] = [];

  const baseHistory = (chat.id ? CHAT_HISTORY[chat.id] : null) || DEFAULT_HISTORY;
  const ckey0 = chat.id || 'default';
  const removedIds = deletedHistory[ckey0] || [];
  const allHistory = [ ...((chat.id && extraHistory[chat.id]) || []), ...baseHistory ].filter(h => !removedIds.includes(h.id));
  const filteredHistory = historySearch.trim()
    ? allHistory.filter(h => h.title.includes(historySearch) || h.preview.includes(historySearch))
    : allHistory;

  const DATE_LABELS: Record<string, string> = { today: 'امروز', yesterday: 'دیروز', week: '۷ روز گذشته', month: '۳۰ روز گذشته', older: 'قدیمی‌تر' };
  const groupedHistory: Record<string, HistoryItem[]> = {};
  filteredHistory.forEach(h => {
    if (!groupedHistory[h.dateCategory]) groupedHistory[h.dateCategory] = [];
    groupedHistory[h.dateCategory].push(h);
  });
  const categoryOrder: Array<'today' | 'yesterday' | 'week' | 'month' | 'older'> = ['today', 'yesterday', 'week', 'month', 'older'];

  // Persist an edited history title. New (locally-created) entries keep the edit;
  // static mock entries just acknowledge with a toast.
  const commitHistoryTitle = (id: string) => {
    const v = editTitle.trim();
    const ckey = chat.id || 'default';
    if (id.startsWith('new-')) {
      setExtraHistory(prev => ({
        ...prev,
        [ckey]: (prev[ckey] || []).map(it => it.id === id ? { ...it, title: v || it.title } : it),
      }));
    }
    setEditingId(null);
    if (v) showToast('عنوان تغییر کرد');
  };

  // Delete a history entry — works for every entry (static + locally-created).
  const deleteHistoryItem = (id: string, title: string) => {
    const ckey = chat.id || 'default';
    if (id.startsWith('new-')) {
      setExtraHistory(prev => ({ ...prev, [ckey]: (prev[ckey] || []).filter(it => it.id !== id) }));
    }
    setDeletedHistory(prev => ({ ...prev, [ckey]: [ ...(prev[ckey] || []), id ] }));
    if (activeHistoryId === id) setActiveHistoryId(null);
    if (editingId === id) setEditingId(null);
    showToast('گفتگو حذف شد: ' + title);
  };

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (chat.open) {
      setInputText('');
    }
  }, [chat.open, chat.id]);

  if (!chat.open) return null;

  // Get header info
  let headerName = '';
  let headerSub = '';
  let headerBg = '';
  let headerInit = '';
  let headerVoip = '';
  let headerAvatar: string | undefined = undefined;
  let showTopicsToggle = false;
  let isOnline = true;
  let isEuAgentChat = false;

  if (chat.type === 'agent' && chat.id) {
    const a = agents.find(x => x.id === chat.id);
    if (a) {
      headerName = a.name;
      headerSub = a.role;
      headerBg = a.bg;
      headerInit = a.init;
      headerVoip = a.voip;
      headerAvatar = a.avatar;
      showTopicsToggle = true;
    }
  } else if (chat.type === 'personnel' && chat.id) {
    const p = personnel.find(x => x.id === chat.id);
    if (p) {
      headerName = p.name;
      headerSub = p.role;
      headerBg = p.bg;
      headerInit = p.init;
      headerVoip = p.voip;
      isOnline = p.status === 'online';
    }
  } else if (chat.type === 'eu' && chat.id) {
    // Check if it's an assistant-conducted conversation (ac1-ac7)
    const assistantChatMeta: Record<string, { name: string; init: string; bg: string; sub: string }> = {};
    // User-to-user and group chat metadata
    const userChatMeta: Record<string, { name: string; init: string; bg: string; sub: string; online: boolean }> = {};
    const acMeta = assistantChatMeta[chat.id];
    const uMeta = userChatMeta[chat.id];
    if (acMeta) {
      headerName = acMeta.name;
      headerSub = acMeta.sub;
      headerBg = acMeta.bg;
      headerInit = acMeta.init;
    } else if (uMeta) {
      headerName = uMeta.name;
      headerSub = uMeta.sub;
      headerBg = uMeta.bg;
      headerInit = uMeta.init;
      isOnline = uMeta.online;
    } else {
      const a = agents.find(x => x.id === chat.id);
      if (a) {
        headerName = a.name;
        headerSub = a.role;
        headerBg = a.bg;
        headerInit = a.init;
        headerVoip = a.voip;
        headerAvatar = a.avatar;
        isEuAgentChat = true;
      }
    }
  } else if (chat.type === 'group' && chat.id) {
    const gc = groupChats.find(g => g.id === chat.id);
    if (gc) {
      headerName = gc.name;
      headerSub = toFa(gc.memberIds.length) + ' عضو';
      headerBg = gc.bg;
      headerInit = gc.name[0] || 'گ';
    }
  } else if (chat.type === 'contact' && chat.contactMeta) {
    headerName = chat.contactMeta.name;
    headerSub = chat.contactMeta.sub;
    headerBg = chat.contactMeta.bg;
    headerInit = chat.contactMeta.init;
  } else if (chat.type === 'customer' && chat.id) {
    const c = customers.find(x => x.id === chat.id);
    if (c) {
      headerName = c.name;
      headerSub = 'مشتری | ' + c.contact;
      headerBg = 'aw-bg-cyan';
      headerInit = c.name[0];
      headerVoip = '';
    }
  }

  const topics = chat.type === 'agent' && chat.id ? getTopics(chat.id) : [];

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
    inputRef.current?.focus();
  };

  const handleAttach = () => {
    openModal('ارسال فایل', <AttachOptions />);
  };

  const handleCall = () => {
    if (headerName && headerBg && headerInit) {
      startCall(headerName, headerSub, headerBg, headerInit, headerVoip || '');
    }
  };

  const handleBack = () => {
    if (chat.topicsOpen) {
      toggleTopics();
    } else {
      closeChat();
    }
  };

  return (
    <>
    {/* Desktop backdrop */}
    <motion.div className="hidden md:block fixed inset-0 z-[99]" style={{ background: 'rgba(0,0,0,0.18)' }} onClick={closeChat} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} />

    {/* (mobile) لمسِ فضای بالای شیت = بستن چت */}
    <div className="md:hidden fixed left-0 right-0 z-[98]" style={{ top: 0, height: Math.max(0, curTop) }} onClick={closeChat} />

    <motion.div
      data-chat-sheet="1"
      className="fixed z-[100] flex flex-col aw-chat-pattern"
      style={window.innerWidth >= 768 ? {
        /* Desktop: left sidebar */
        top: 0, bottom: 0, left: 0, right: 'auto',
        width: 500,
        borderRadius: 0,
        background: 'var(--aw-chat-bg, rgba(238,238,238,0.72))',
        backdropFilter: 'blur(24px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
        boxShadow: '2px 0 20px rgba(0,0,0,0.15)',
        borderRight: '1px solid var(--aw-border)',
      } : {
        /* Mobile: draggable sheet */
        top: curTop,
        bottom: 'var(--kb-h, 0px)', left: 0, right: 0,
        borderRadius: curTop > headerBottom + 4 ? '18px 18px 0 0' : 0,
        background: 'var(--aw-chat-bg, rgba(238,238,238,0.72))',
        backdropFilter: 'blur(28px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.3)',
        boxShadow: '0 -4px 30px rgba(123,98,252,0.18)',
        transition: dragging ? 'none' : 'top 0.3s cubic-bezier(0.32,0.72,0,1), border-radius 0.3s',
      }}
      initial={window.innerWidth >= 768 ? { x: '-100%', opacity: 0.5 } : { y: '100%' }}
      animate={window.innerWidth >= 768 ? { x: 0, opacity: 1 } : { y: 0 }}
      exit={window.innerWidth >= 768 ? { x: '-100%' } : { y: '100%' }}
      transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* Drag handle — desktop slide / mobile resize-sheet */}
      <div className="hidden md:flex justify-center pt-2 pb-1 flex-shrink-0">
        <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(123,98,252,0.25)' }} />
      </div>
      <div className="md:hidden flex justify-center pt-3 pb-2 flex-shrink-0" style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onSheetDown} onPointerMove={onSheetMove} onPointerUp={onSheetUp} onPointerCancel={onSheetUp}>
        <div className="w-12 h-1.5 rounded-full" style={{ background: 'var(--aw-eu-nav-border)' }} />
      </div>

      {/* Header — agent info card matching Figma; also a drag zone on mobile */}
      <div
        onPointerDown={(e) => { if (window.innerWidth < 768) onSheetDown(e); }}
        onPointerMove={(e) => { if (window.innerWidth < 768) onSheetMove(e); }}
        onPointerUp={(e) => { if (window.innerWidth < 768) onSheetUp(); }}
        onPointerCancel={() => { if (window.innerWidth < 768) onSheetUp(); }}
        className="flex items-center gap-3 px-3 py-3 flex-shrink-0"
        style={window.innerWidth >= 768 ? {
          background: 'var(--aw-bg-header)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--aw-border)',
          margin: 0,
        } : {
          background: 'var(--aw-chat-surface, rgba(255,255,255,0.5))',
          borderRadius: 14,
          border: '0.5px solid var(--aw-chat-bd, rgba(255,255,255,0.8))',
          boxShadow: '0 2px 8px rgba(123,98,252,0.12)',
          backdropFilter: 'blur(12px)',
          margin: '0 12px 8px',
        }}
      >
        {/* back arrow — RTL first = right side */}
        <button
          className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-primary)', fontSize: 14 }}
          onPointerDown={e => e.stopPropagation()} onPointerMove={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()}
          onClick={handleBack}
        >
          <i className="fa-solid fa-arrow-right" />
        </button>

        {/* Avatar circle */}
        {chat.type === 'group' ? (
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 relative overflow-hidden cursor-pointer ${headerBg}`}
            style={{ fontWeight: 700, boxShadow: '0 2px 8px rgba(123,98,252,0.25)' }}
            onClick={() => { if (chat.id) openModal('تنظیمات گروه', <GroupSettingsContent groupId={chat.id} />); }}
          >
            {(() => {
              const gc = groupChats.find(g => g.id === chat.id);
              return gc?.image ? <img src={gc.image} alt={headerName} className="w-full h-full object-cover" /> : <i className="fa-solid fa-users" />;
            })()}
          </div>
        ) : (
          <div className="relative flex-shrink-0">
            {headerAvatar
              ? <div className="rounded-full overflow-hidden" style={{ width: 40, height: 40 }}><img src={headerAvatar} alt="" className="w-full h-full" style={{ objectFit: 'cover', objectPosition: 'center 18%' }} draggable={false} /></div>
              : <LetterAvatar name={headerName} init={headerInit} size={40} />}
            <span className="absolute bottom-0 left-0 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: isOnline ? 'var(--aw-online)' : 'var(--aw-offline)' }} />
          </div>
        )}

        {/* Name + subtitle */}
        <div
          className={`flex-1 min-w-0 ${chat.type === 'group' ? 'cursor-pointer' : ''}`}
          onClick={() => { if (chat.type === 'group' && chat.id) openModal('تنظیمات گروه', <GroupSettingsContent groupId={chat.id} />); }}
        >
          <div className="text-[14px] truncate" style={{ fontWeight: 700, color: 'var(--aw-text-primary)', fontFamily: "'Kamand', sans-serif" }}>
            {headerName}
          </div>
          <div className="text-[11px] flex items-center gap-1 flex-wrap" style={{ color: '#737373', fontFamily: "'Kamand', sans-serif" }}>
            <span>{headerSub}</span>
            {headerVoip && <><span>|</span><span>داخلی: {headerVoip}</span></>}
            <span>|</span>
            {isTyping ? (
              <span style={{ color: '#7b62fc' }}>در حال تایپ...</span>
            ) : isOnline ? (
              <span style={{ color: '#10b981' }}>آنلاین</span>
            ) : (
              <span style={{ color: '#9ca3af' }}>آفلاین</span>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex gap-1 flex-shrink-0" onPointerDown={e => e.stopPropagation()} onPointerMove={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()}>
          {headerName && !isEuAgentChat && (
            <button
              className="w-8 h-8 rounded-[10px] border-none cursor-pointer flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: 14 }}
              onClick={handleCall}
            >
              <i className="fa-solid fa-phone" />
            </button>
          )}
          <button
            className="w-8 h-8 rounded-[10px] border-none cursor-pointer flex items-center justify-center"
            style={historyOpen ? { background: 'rgba(123,98,252,0.18)', color: '#7b62fc', fontSize: 13 } : { background: 'rgba(0,0,0,0.06)', color: 'var(--aw-text-primary)', fontSize: 13 }}
            onClick={() => setHistoryOpen(!historyOpen)}
          >
            <i className="fa-solid fa-clock-rotate-left" />
          </button>

        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-hidden flex relative">
        {/* History drawer — slides in from the right with a blurred backdrop */}
        <AnimatePresence>
        {historyOpen && (
          <>
          <motion.div className="absolute inset-0 z-20"
            style={{ background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            onClick={() => setHistoryOpen(false)} />
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4 pointer-events-none">
          <motion.div className="w-[340px] max-w-[92%] max-h-[82%] flex flex-col rounded-2xl overflow-hidden pointer-events-auto"
            style={{ background: 'var(--aw-bg-card)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid var(--aw-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}
            initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}>
          {/* Popup header — matches دستیار شخصی style: title + solid جدید button + close */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--aw-border)] sticky top-0 z-10" style={{ background: 'var(--aw-chat-bg, rgba(240,238,250,0.72))', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}>
            <span className="text-[13px] text-[var(--aw-text-primary)] flex items-center gap-1.5" style={{ fontWeight: 700 }}>
              <i className="fa-solid fa-clock-rotate-left text-[12px]" style={{ color: 'var(--aw-primary)' }} /> تاریخچه گفتگو
            </span>
            <div className="flex items-center gap-1.5">
              <button className="text-[11px] px-2.5 py-1 rounded-lg border-none cursor-pointer text-white flex items-center gap-1"
                style={{ background: 'var(--aw-primary)', fontWeight: 600 }}
                onClick={() => {
                  const ckey = chat.id || 'default';
                  const count = ((extraHistory[ckey] || []).length) + 1;
                  const newId = 'new-' + Date.now();
                  const autoTitle = 'گفتگوی جدید ' + toFa(count);
                  const newItem = { id: newId, title: autoTitle, date: 'الان', dateCategory: 'today', preview: '', msgCount: 0 };
                  setExtraHistory(prev => ({ ...prev, [ckey]: [newItem, ...(prev[ckey] || [])] }));
                  setHistorySearch('');
                  setInputText('');
                  if (chat.type === 'agent') { createNewTopic(); }
                  setActiveHistoryId(newId);
                  setEditingId(newId);
                  setEditTitle(autoTitle);
                }}>
                <i className="fa-solid fa-plus text-[9px]" /> جدید
              </button>
              <button className="w-7 h-7 rounded-lg border-none bg-transparent text-[var(--aw-text-muted)] cursor-pointer flex items-center justify-center hover:text-[var(--aw-text-primary)]"
                onClick={() => setHistoryOpen(false)} title="بستن">
                <i className="fa-solid fa-xmark text-[13px]" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="px-2.5 pt-2 pb-1 flex-shrink-0">
            <div className="flex items-center gap-2 rounded-xl px-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
              <i className="fa-solid fa-search text-[11px] text-[var(--aw-text-muted)]" />
              <input
                className="flex-1 bg-transparent border-none py-2 text-[12px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
                style={{ fontFamily: 'inherit' }}
                placeholder="جستجوی گفتگوها..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)} />
              {historySearch && (
                <button className="border-none bg-transparent text-[var(--aw-text-muted)] text-[11px] cursor-pointer hover:text-[var(--aw-primary)]" onClick={() => setHistorySearch('')}>
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>
          </div>

          {/* Card list — matches دستیار شخصی style */}
          <div className="flex-1 overflow-y-auto px-2 py-2 aw-scroll">
            {filteredHistory.length === 0 && (
              <div className="text-center text-[12px] text-[var(--aw-text-muted)] py-8">نتیجه‌ای یافت نشد</div>
            )}
            {filteredHistory.map(h => {
              const isActive = activeHistoryId === h.id;
              const isEditing = editingId === h.id;
              const select = () => { if (!isEditing) { setActiveHistoryId(h.id); showToast('بارگذاری: ' + h.title); } };
              return (
                <div key={h.id} className="w-full flex items-center gap-1 px-2 py-2 rounded-xl transition-all mb-0.5"
                  style={isActive ? { background: 'var(--aw-primary-bg)' } : {}}>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border-none cursor-pointer"
                    style={{ background: isActive ? 'var(--aw-primary-bg)' : 'var(--aw-bg-app)' }} onClick={select}>
                    <i className={`fa-solid ${isActive ? 'fa-comment-dots' : 'fa-file-lines'} text-[12px]`}
                      style={{ color: isActive ? 'var(--aw-primary)' : 'var(--aw-text-muted)' }} />
                  </button>
                  {isEditing ? (
                    <input autoFocus
                      className="flex-1 min-w-0 text-[12px] px-2 py-1 rounded-lg border outline-none bg-transparent text-right"
                      style={{ color: 'var(--aw-text-primary)', fontFamily: 'inherit', borderColor: 'var(--aw-primary)', fontWeight: 600 }}
                      value={editTitle}
                      onFocus={e => e.target.select()}
                      onChange={e => setEditTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') commitHistoryTitle(h.id); if (e.key === 'Escape') setEditingId(null); }}
                      onBlur={() => commitHistoryTitle(h.id)}
                      onClick={e => e.stopPropagation()} />
                  ) : (
                    <button className="flex-1 min-w-0 text-right border-none bg-transparent cursor-pointer p-0" onClick={select}>
                      <div className="text-[12px] truncate" style={{ fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--aw-primary)' : 'var(--aw-text-primary)' }}>{h.title}</div>
                      <div className="text-[10px] text-[var(--aw-text-muted)]">{h.date + ' · ' + toFa(h.msgCount || 0) + ' پیام'}</div>
                    </button>
                  )}
                  {isActive && !isEditing && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--aw-primary)' }} />}
                  {!isEditing && (
                    <>
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border-none cursor-pointer"
                        style={{ background: 'transparent', color: 'var(--aw-text-muted)' }}
                        onClick={e => { e.stopPropagation(); setEditingId(h.id); setEditTitle(h.title); }} title="تغییر نام">
                        <i className="fa-solid fa-pen text-[10px]" />
                      </button>
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border-none cursor-pointer"
                        style={{ background: 'transparent', color: '#ef4444' }}
                        onClick={e => { e.stopPropagation(); deleteHistoryItem(h.id, h.title); }} title="حذف">
                        <i className="fa-solid fa-trash text-[10px]" />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          </motion.div>
          </div>
          </>
        )}
        </AnimatePresence>

        {/* Topics sidebar */}
        {showTopicsToggle && (
          <div className={`overflow-hidden transition-all duration-300 flex flex-col border-l border-[var(--aw-border)] ${chat.topicsOpen ? 'w-[260px]' : 'w-0'}`} style={{ background: 'var(--aw-bg-card)' }}>
            <div className="flex justify-between items-center p-3.5 border-b border-[var(--aw-border)]">
              <span className="text-[13px] flex items-center gap-1.5" style={{ fontWeight: 700 }}>
                <i className="fa-solid fa-folder-open" /> پرونده‌ها
              </span>
              <button className="border-none text-white py-1.5 px-3 rounded-lg text-[11px] cursor-pointer flex items-center gap-1" style={{ background: 'var(--aw-primary)', fontWeight: 600 }} onClick={createNewTopic}>
                <i className="fa-solid fa-plus" /> جدید
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 aw-scroll">
              {topics.map(t => {
                const isEditing = editingTopicId === t.id;
                return (
                <div key={t.id}
                  className={`group p-2.5 px-3 rounded-[10px] cursor-pointer transition-all mb-1 border ${
                    chat.topicId === t.id ? 'border-[var(--aw-primary)]' : 'border-transparent hover:bg-[var(--aw-bg-card-hover)]'
                  }`}
                  style={chat.topicId === t.id ? { background: 'var(--aw-primary-bg)' } : {}}
                  onClick={() => { if (!isEditing) switchTopic(t.id); }}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <input
                        autoFocus
                        className="flex-1 bg-[var(--aw-bg-input)] border border-[var(--aw-border)] rounded-md px-2 py-1 text-[12px] text-[var(--aw-text-primary)] outline-none"
                        value={editTopicTitle}
                        onChange={e => setEditTopicTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && chat.id) {
                            const v = editTopicTitle.trim();
                            if (v) { renameTopic(chat.id, t.id, v); showToast('نام پرونده تغییر یافت'); }
                            setEditingTopicId(null);
                          } else if (e.key === 'Escape') {
                            setEditingTopicId(null);
                          }
                        }}
                      />
                      <button
                        className="w-6 h-6 rounded-md border-none bg-transparent text-[var(--aw-primary)] text-[11px] cursor-pointer flex items-center justify-center"
                        onClick={() => {
                          const v = editTopicTitle.trim();
                          if (v && chat.id) { renameTopic(chat.id, t.id, v); showToast('نام پرونده تغییر یافت'); }
                          setEditingTopicId(null);
                        }}
                      >
                        <i className="fa-solid fa-check" />
                      </button>
                      <button
                        className="w-6 h-6 rounded-[10px] border-none bg-transparent text-[var(--aw-text-muted)] text-[11px] cursor-pointer flex items-center justify-center"
                        onClick={() => setEditingTopicId(null)}
                      >
                        <i className="fa-solid fa-times" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] truncate" style={{ fontWeight: 600 }}>{t.title}</div>
                        <div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">{t.date} | {toFa(t.messages.length)} پیام</div>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="w-6 h-6 rounded-md border-none bg-transparent text-[var(--aw-text-muted)] text-[11px] cursor-pointer flex items-center justify-center hover:text-[var(--aw-primary)] hover:bg-[var(--aw-primary-bg)]"
                          onClick={e => { e.stopPropagation(); setEditingTopicId(t.id); setEditTopicTitle(t.title); }}
                          title="تغییر نام"
                        >
                          <i className="fa-solid fa-pen" />
                        </button>
                        <button
                          className="w-6 h-6 rounded-md border-none bg-transparent text-[var(--aw-text-muted)] text-[11px] cursor-pointer flex items-center justify-center hover:text-[var(--aw-primary)] hover:bg-[var(--aw-primary-bg)]"
                          onClick={e => { e.stopPropagation(); switchTopic(t.id); showToast('پرونده باز شد: ' + t.title); }}
                          title="ویرایش/باز کردن"
                        >
                          <i className="fa-solid fa-pen-to-square" />
                        </button>
                        <button
                          className="w-6 h-6 rounded-md border-none bg-transparent text-[var(--aw-text-muted)] text-[11px] cursor-pointer flex items-center justify-center hover:text-red-400 hover:bg-red-500/10"
                          onClick={e => {
                            e.stopPropagation();
                            if (chat.id) { removeTopic(chat.id, t.id); showToast('پرونده حذف شد: ' + t.title); }
                          }}
                          title="حذف"
                        >
                          <i className="fa-solid fa-trash" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={msgsRef} className="flex-1 min-w-0 min-h-0 h-full overflow-y-auto px-3 pt-2 pb-3 flex flex-col gap-2 aw-scroll" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y' }}>
          {messages.length === 0 && (
            <div className="self-end max-w-[82%] px-3.5 py-2.5 rounded-[18px] text-[13px] break-words"
              style={{ background: 'var(--aw-chat-recv, rgba(255,255,255,0.7))', color: 'var(--aw-text-primary)', lineHeight: 1.7, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', backdropFilter: 'blur(8px)', border: '0.5px solid var(--aw-chat-bd, rgba(255,255,255,0.8))', fontFamily: "'Kamand', sans-serif" }}>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>سلام! 👋 دنبال چی می‌گردی؟</div>
              <div className="text-[12px] text-[var(--aw-text-secondary)]">می‌تونی بپرسی، یا یکی از گزینه‌های پایین رو انتخاب کنی.</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['سفارش غذا', 'خرید از مارکت', 'یادآوری بساز', 'جستجو'].map(s => (
                  <button key={s} onClick={() => { setInputText(s); setTimeout(() => inputRef.current?.focus(), 30); }}
                    className="text-[11px] px-2.5 py-1 rounded-full border cursor-pointer" style={{ background: 'color-mix(in srgb, var(--aw-eu-primary, #7b62fc) 12%, transparent)', borderColor: 'color-mix(in srgb, var(--aw-eu-primary, #7b62fc) 30%, transparent)', color: 'var(--aw-eu-primary, #7b62fc)', fontWeight: 700 }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`max-w-[78%] px-3.5 py-2.5 rounded-[18px] text-[13px] relative break-words ${
              m.sent ? 'self-start' : 'self-end'
            }`} style={{
              background: m.sent
                ? 'linear-gradient(135deg, #7b62fc, #5c4abd)'
                : 'var(--aw-chat-recv, rgba(255,255,255,0.7))',
              color: m.sent ? '#fff' : 'var(--aw-text-primary)',
              lineHeight: 1.6,
              boxShadow: m.sent
                ? '0 2px 8px rgba(123,98,252,0.25)'
                : '0 1px 4px rgba(0,0,0,0.08)',
              backdropFilter: m.sent ? 'none' : 'blur(8px)',
              border: m.sent ? 'none' : '0.5px solid var(--aw-chat-bd, rgba(255,255,255,0.8))',
              fontFamily: "'Kamand', sans-serif",
            }}>
              <div>{m.text}</div>
              <div className="text-[10px] mt-1 opacity-60 flex items-center gap-1" style={{ justifyContent: m.sent ? 'flex-end' : 'flex-start' }}>
                {m.sent && <i className="fa-solid fa-check-double text-[8px]" />}
                {m.time}
                {!m.sent && chat.type === 'eu' && (
                  <button onClick={() => speakMessage('co-' + m.id, m.text)} title="خواندن متن"
                    className="mr-1 w-5 h-5 rounded-md border-none cursor-pointer flex items-center justify-center transition-all"
                    style={speakingMsgId === 'co-' + m.id
                      ? { background: '#7b62fc', color: '#fff' }
                      : { background: 'rgba(123,98,252,0.14)', color: '#7b62fc' }}>
                    <i className={`fa-solid ${speakingMsgId === 'co-' + m.id ? 'fa-volume-high' : 'fa-volume-low'} text-[9px]`} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="self-end px-4 py-3 rounded-[18px]" style={{ background: 'var(--aw-chat-recv, rgba(255,255,255,0.7))', backdropFilter: 'blur(8px)', border: '0.5px solid var(--aw-chat-bd, rgba(255,255,255,0.8))' }}>
              <div className="flex gap-1.5 items-center">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input bar — Figma design */}
      <div
        className="flex-shrink-0 flex items-center gap-2 px-3"
        style={{
          background: 'var(--aw-chat-surface, rgba(255,255,255,0.2))',
          borderTop: '0.5px solid var(--aw-chat-bd, white)',
          boxShadow: '-2px -2px 4px 0px rgba(123,98,252,0.2)',
          paddingTop: 10,
          paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Send button — circular, lavender */}
        <button
          className="flex-shrink-0 flex items-center justify-center rounded-full border-none cursor-pointer"
          style={{
            width: 40, height: 40,
            background: inputText.trim() ? 'var(--aw-eu-primary)' : 'var(--aw-eu-nav-border)',
            boxShadow: 'inset 2px 2px 1px 0px rgba(255,255,255,0.45), 2px 4px 4px 0px rgba(0,0,0,0.25)',
            border: '1px solid var(--aw-chat-bd, white)',
          }}
          onClick={handleSend}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <path d={svgChatIcons.p11544700} fill="white" />
          </svg>
        </button>

        {/* Pill input */}
        <div
          className="flex-1 flex items-center gap-2 relative"
          style={{
            height: 40,
            borderRadius: 9999,
            background: 'var(--aw-bg-input)',
            border: '1px solid var(--aw-border)',
            paddingRight: 12,
            paddingLeft: 12,
          }}
        >
          {/* Mic icon (RTL start = right side) */}
          <div className="flex-shrink-0 w-[22px] h-[22px] relative" onClick={() => __recMic(() => showToast('ضبط صدا شروع شد...'), () => showToast('دسترسی به میکروفون داده نشد'))} style={{ cursor: 'pointer' }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <path d={svgChatIcons.p7f348f0} fill="#565656" />
              <path d={svgChatIcons.p1899c780} fill="#565656" />
            </svg>
          </div>

          {/* Text input */}
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-right"
            style={{
              fontSize: 14,
              color: 'var(--aw-text-primary)',
              fontFamily: "'Kamand', sans-serif",
              minWidth: 0,
            }}
            placeholder="پیام خود را بنویسید..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          />

          {/* Add/attach icon (RTL end = left side) */}
          <div className="flex-shrink-0 w-[22px] h-[22px] relative" onClick={handleAttach} style={{ cursor: 'pointer' }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <path d={svgChatIcons.p12f1a600} fill="#565656" />
              <path d={svgChatIcons.p29988c00} fill="#565656" />
              <path d={svgChatIcons.p2050cb80} fill="#565656" />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
    </>
  );
}

function GroupSettingsContent({ groupId }: { groupId: string }) {
  const { groupChats, updateGroupChat, removeGroupChat, agents, personnel, customers, company, closeModal, closeChat, showToast } = useApp();
  const gc = groupChats.find(g => g.id === groupId);
  const [name, setName] = useState(gc?.name || '');
  const [image, setImage] = useState<string | null>(gc?.image || null);
  const [adding, setAdding] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!gc) return <div className="text-center text-[var(--aw-text-muted)] py-6 text-[13px]">گروه یافت نشد</div>;

  const isMember = (id: string, type: string) => gc.memberIds.some(m => m.id === id && m.type === type);
  const companyAgents = agents.filter(a => !a.company || a.company === company).filter(a => !a.locked);
  const candidates = [
    ...companyAgents.map(a => ({ id: a.id, type: 'agent' as const, name: a.name, sub: a.role, init: a.init, bg: a.bg })),
    ...personnel.map(p => ({ id: p.id, type: 'personnel' as const, name: p.name, sub: p.role, init: p.name[0], bg: 'bg-blue-500' })),
    ...customers.map(c => ({ id: c.id, type: 'customer' as const, name: c.name, sub: c.contact, init: c.name[0], bg: 'bg-emerald-500' })),
  ].filter(i => !isMember(i.id, i.type)).filter(i => !searchQ || i.name.includes(searchQ) || i.sub.includes(searchQ));

  const memberRecords = gc.memberIds.map(m => {
    if (m.type === 'agent') {
      const a = agents.find(x => x.id === m.id);
      return a ? { id: a.id, type: m.type, name: a.name, sub: a.role, init: a.init, bg: a.bg } : null;
    }
    if (m.type === 'personnel') {
      const p = personnel.find(x => x.id === m.id);
      return p ? { id: p.id, type: m.type, name: p.name, sub: p.role, init: p.name[0], bg: 'bg-blue-500' } : null;
    }
    if (m.type === 'customer') {
      const c = customers.find(x => x.id === m.id);
      return c ? { id: c.id, type: m.type, name: c.name, sub: c.contact, init: c.name[0], bg: 'bg-emerald-500' } : null;
    }
    return null;
  }).filter(Boolean) as { id: string; type: 'agent' | 'personnel' | 'customer'; name: string; sub: string; init: string; bg: string }[];

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveBasics = () => {
    if (!name.trim()) { showToast('نام معتبر وارد کنید'); return; }
    updateGroupChat(groupId, { name: name.trim(), image });
    showToast('تنظیمات گروه ذخیره شد');
  };

  const removeMember = (id: string, type: string) => {
    updateGroupChat(groupId, { memberIds: gc.memberIds.filter(m => !(m.id === id && m.type === type)) });
    showToast('عضو حذف شد');
  };

  const addMember = (it: { id: string; type: 'agent' | 'personnel' | 'customer' }) => {
    updateGroupChat(groupId, { memberIds: [...gc.memberIds, { id: it.id, type: it.type }] });
    showToast('عضو اضافه شد');
  };

  const deleteGroup = () => {
    removeGroupChat(groupId);
    showToast('گروه حذف شد');
    closeModal();
    closeChat();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Image + name */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          className={`w-16 h-16 rounded-[14px] flex items-center justify-center text-white flex-shrink-0 overflow-hidden border-none cursor-pointer relative ${gc.bg}`}
          style={{ fontWeight: 700, fontSize: 22 }}
        >
          {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <i className="fa-solid fa-users" />}
          <span className="absolute bottom-0 right-0 left-0 text-[9px] text-white py-0.5 text-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <i className="fa-solid fa-camera" />
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
        <div className="flex-1">
          <label className="text-[11px] text-[var(--aw-text-muted)] block mb-1">نام گروه</label>
          <input
            className="w-full bg-[var(--aw-bg-input)] border border-[var(--aw-border)] rounded-[10px] px-3 py-2 text-[13px] text-[var(--aw-text-primary)] outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>
      <button
        className="w-full py-2 rounded-[10px] border-none text-white cursor-pointer text-[12px]"
        style={{ background: 'var(--aw-primary)', fontWeight: 700 }}
        onClick={saveBasics}
      >
        ذخیره تغییرات
      </button>

      {/* Members */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px]" style={{ fontWeight: 700 }}>اعضا ({toFa(memberRecords.length)})</span>
          <button
            className="text-[11px] text-[var(--aw-primary)] bg-transparent border-none cursor-pointer flex items-center gap-1"
            onClick={() => setAdding(a => !a)}
          >
            <i className={`fa-solid fa-${adding ? 'minus' : 'plus'} text-[10px]`} />
            {adding ? 'بستن' : 'افزودن عضو'}
          </button>
        </div>

        {adding && (
          <div className="mb-2 border border-[var(--aw-border)] rounded-[10px] overflow-hidden" style={{ background: 'var(--aw-bg-card)' }}>
            <input
              className="w-full bg-transparent border-b border-[var(--aw-border)] px-3 py-2 text-[12px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
              placeholder="جستجو..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
            />
            <div className="max-h-[180px] overflow-y-auto aw-scroll">
              {candidates.length === 0 && (
                <div className="text-center py-3 text-[var(--aw-text-muted)] text-[11px]">یافت نشد</div>
              )}
              {candidates.map(it => (
                <div key={it.type + it.id}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[var(--aw-bg-card-hover)]"
                  onClick={() => addMember(it)}>
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center text-white text-[11px] flex-shrink-0 ${it.bg}`} style={{ fontWeight: 700 }}>{it.init}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px]" style={{ fontWeight: 600 }}>{it.name}</div>
                    <div className="text-[10px] text-[var(--aw-text-muted)] truncate">{it.sub}</div>
                  </div>
                  <i className="fa-solid fa-plus text-[var(--aw-primary)] text-[11px]" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1 max-h-[260px] overflow-y-auto aw-scroll">
          {memberRecords.map(m => (
            <div key={m.type + m.id} className="flex items-center gap-2 p-2 rounded-[10px]" style={{ background: 'var(--aw-bg-input)' }}>
              <div className={`w-8 h-8 rounded-md flex items-center justify-center text-white text-[12px] flex-shrink-0 ${m.bg}`} style={{ fontWeight: 700 }}>{m.init}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px]" style={{ fontWeight: 600 }}>{m.name}</div>
                <div className="text-[10px] text-[var(--aw-text-muted)] truncate">{m.sub}</div>
              </div>
              <button
                className="w-7 h-7 rounded-[10px] border-none bg-transparent text-red-400 cursor-pointer flex items-center justify-center text-[11px] hover:text-red-300"
                onClick={() => removeMember(m.id, m.type)}
                title="حذف"
              >
                <i className="fa-solid fa-times" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        className="w-full py-2.5 rounded-[10px] border border-red-500/40 bg-transparent text-red-400 cursor-pointer text-[12px] hover:bg-red-500/10"
        onClick={deleteGroup}
      >
        <i className="fa-solid fa-trash ml-1.5" />
        حذف گروه
      </button>
    </div>
  );
}

function AttachOptions() {
  const { closeModal, showToast } = useApp();
  const items = [
    { icon: 'fa-solid fa-image', color: 'var(--aw-primary)', label: 'تصویر' },
    { icon: 'fa-solid fa-file', color: 'var(--aw-accent)', label: 'فایل' },
    { icon: 'fa-solid fa-camera', color: 'var(--aw-secondary)', label: 'دوربین' },
    { icon: 'fa-solid fa-map-marker-alt', color: 'var(--aw-danger)', label: 'مکان' },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer border border-[var(--aw-border)] hover:border-[var(--aw-primary)] transition-all" style={{ background: 'var(--aw-bg-card)' }}
          onClick={() => { closeModal(); showToast(item.label + ' انتخاب شد'); }}>
          <i className={`${item.icon} text-base w-5 text-center`} style={{ color: item.color }} />
          <span className="text-[13px]" style={{ fontWeight: 500 }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}