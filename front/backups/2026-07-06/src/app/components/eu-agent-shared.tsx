import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { useApp } from './app-context';
import { toFa } from './data';
import { ImageWithFallback } from './figma/ImageWithFallback';

// ========================
// SHARED STYLES & COMPONENTS
// ========================
export const euCardStyle: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--aw-eu-primary) 5%, transparent)',
  backdropFilter: 'blur(20px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
  borderRadius: 14,
  border: '1px solid color-mix(in srgb, var(--aw-eu-primary) 22%, transparent)',
  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-eu-primary) 12%, transparent)',
};

export function AgentHeader({ title, icon, color, onBack, badge, rightAction }: {
  title: string; icon: string; color: string; onBack: () => void;
  badge?: React.ReactNode; rightAction?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 pt-4 pb-2 flex-shrink-0" style={{ background: 'var(--aw-bg-header)', borderBottom: '1px solid var(--aw-border)', boxShadow: '0 6px 16px color-mix(in srgb, var(--aw-primary) 9%, transparent)' }}>
      <button className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center hover:opacity-80 transition-all"
        style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-eu-primary)' }}
        onClick={onBack}>
        <i className="fa-solid fa-arrow-right text-sm" />
      </button>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <i className={`${icon} text-[16px]`} style={{ color }} />
      </div>
      <h2 className="text-[16px] text-[var(--aw-text-primary)] m-0 flex-1" style={{ fontWeight: 800 }}>{title}</h2>
      {badge}
      {rightAction}
    </div>
  );
}

export function AgentTabBar({ tabs, active, onChange, asFooter = false }: { tabs: { id: string; icon: string; label: string; badge?: number }[]; active: string; onChange: (id: string) => void; asFooter?: boolean }) {
  if (asFooter) {
    // PNG icon set shared with the main footer (EuNav), keyed by tab id.
    const ICON_SRC: Record<string, string> = {
      shops: 'src/icons/png/shop-market.png', catalog: 'src/icons/png/shop.png', orders: 'src/icons/png/delivery.png',
      chat: 'src/icons/png/chat.png', deals: 'src/icons/png/discount.png', offers: 'src/icons/png/discount.png',
      account: 'src/icons/png/profile.png', restaurants: 'src/icons/png/food.png', tickets: 'src/icons/png/support.png',
      call: 'src/icons/png/call.png', faq: 'src/icons/png/website.png', feedback: 'src/icons/png/notifications.png',
    };
    // Match the main app footer (EuNav glass): rounded translucent pill, icon over label.
    return (
      <div className="flex-shrink-0 px-3" style={{ order: 2, paddingBottom: 'max(10px, env(safe-area-inset-bottom))', paddingTop: 4 }}>
        <nav className="flex items-center rounded-[1000px]"
          style={{
            background: 'linear-gradient(81.82deg, color-mix(in srgb, var(--aw-eu-primary) 22.5%, transparent) 0%, color-mix(in srgb, var(--aw-eu-primary) 13.5%, transparent) 50%, color-mix(in srgb, var(--aw-eu-primary) 22.5%, transparent) 100%)',
            backdropFilter: 'blur(20px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
            boxShadow: 'inset 0 0 2.6px rgba(255,255,255,0.25)',
            padding: 3,
          }}>
          {tabs.map(t => {
            const isActive = active === t.id;
            const src = ICON_SRC[t.id];
            return (
              <button key={t.id}
                className="flex-1 flex flex-col items-center gap-[2px] border-none cursor-pointer transition-all relative rounded-[100px]"
                style={{
                  padding: '6px 2px',
                  background: isActive ? 'color-mix(in srgb, var(--aw-eu-primary) 30%, transparent)' : 'transparent',
                  color: isActive ? 'var(--aw-eu-primary)' : 'var(--aw-text-secondary)',
                  fontWeight: isActive ? 800 : 500,
                  boxShadow: isActive ? 'inset 0 0 3px rgba(255,255,255,0.55)' : 'none',
                  backdropFilter: isActive ? 'blur(4px)' : undefined,
                }}
                onClick={() => onChange(t.id)}>
                {src
                  ? <img src={src} alt="" className="nav-icon-img" style={{ width: 18, height: 18, objectFit: 'contain' }} />
                  : <i className={`${t.icon}`} style={{ fontSize: 14, color: isActive ? 'var(--aw-eu-primary)' : undefined }} />}
                <span style={{ fontSize: 8, whiteSpace: 'nowrap' }}>{t.label}</span>
                {t.badge != null && t.badge > 0 && (
                  <span className="absolute top-0.5 right-1 rounded-full flex items-center justify-center text-white" style={{ background: '#ef4444', fontWeight: 700, fontSize: 8, minWidth: 14, height: 14, padding: '0 2px' }}>{toFa(t.badge)}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }
  return (
    <div className="flex-shrink-0 flex gap-1.5 px-3 overflow-x-auto aw-noscroll"
      style={{ background: 'var(--aw-bg-header)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--aw-border)', paddingTop: 10, paddingBottom: 8 }}>
      {tabs.map(t => (
        <button key={t.id}
          className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full border cursor-pointer transition-all relative"
          style={active === t.id
            ? { background: 'var(--aw-eu-primary)', color: '#fff', borderColor: 'transparent', fontWeight: 700 }
            : { background: 'transparent', color: 'var(--aw-text-secondary)', borderColor: 'var(--aw-border)', fontWeight: 600 }}
          onClick={() => onChange(t.id)}>
          <i className={`${t.icon} text-[13px]`} />
          <span className="text-[12px] whitespace-nowrap">{t.label}</span>
          {t.badge != null && t.badge > 0 && (
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px]" style={{ background: active === t.id ? 'rgba(255,255,255,0.3)' : 'var(--aw-danger)', fontWeight: 700 }}>{toFa(t.badge)}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function StatusPill({ label, color }: { label: string; color: string }) {
  return <span className="text-[10px] px-2 py-0.5 rounded-full inline-flex items-center" style={{ background: `${color}18`, color, fontWeight: 600 }}>{label}</span>;
}

export function SectionTitle({ icon, title, extra }: { icon: string; title: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2 px-1">
      <div className="text-[12px] text-[var(--aw-text-muted)] flex items-center gap-1" style={{ fontWeight: 700 }}>
        <i className={icon} /> {title}
      </div>
      {extra}
    </div>
  );
}

export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="text-center py-12 text-[var(--aw-text-muted)]">
      <i className={`${icon} text-[48px] opacity-20 block mb-4`} />
      <p className="text-[12px]">{text}</p>
    </div>
  );
}

// Mini chat preview for chat tabs
export function MiniChatPreview({ messages, agentName, agentIcon, agentColor, onOpenFull }: {
  messages: { from: 'user' | 'agent'; text: string }[];
  agentName: string; agentIcon: string; agentColor: string; onOpenFull: () => void;
}) {
  const [inputText, setInputText] = useState('');
  const { showToast } = useApp();
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-3 aw-scroll space-y-2">
        {messages.map((m, i) => (
          <motion.div key={i} className={`flex ${m.from === 'user' ? 'justify-start' : 'justify-end'}`}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-[12px] ${
              m.from === 'user'
                ? 'bg-[var(--aw-eu-primary)] text-white rounded-br-md'
                : 'rounded-bl-md'
            }`} style={m.from === 'agent' ? { background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' } : {}}>
              {m.from === 'agent' && (
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[8px]" style={{ background: agentColor }}>
                    <i className={agentIcon} />
                  </div>
                  <span className="text-[10px] text-[var(--aw-text-muted)]" style={{ fontWeight: 600 }}>{agentName}</span>
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
            onKeyDown={e => { if (e.key === 'Enter' && inputText.trim()) { showToast('پیام ارسال شد'); setInputText(''); } }} />
        </div>
        <button className="w-10 h-10 rounded-xl border-none text-white cursor-pointer flex items-center justify-center text-[14px]"
          style={{ background: agentColor }}
          onClick={() => { if (inputText.trim()) { showToast('پیام ارسال شد'); setInputText(''); } else { onOpenFull(); } }}>
          <i className={inputText.trim() ? 'fa-solid fa-paper-plane' : 'fa-solid fa-expand'} />
        </button>
      </div>
    </div>
  );
}

export interface ChatListItem { id: string; name: string; icon: string; color: string; lastMsg: string; time: string; unread: number; online: boolean }
export interface AgentCardItem { id: string; name: string; desc: string; icon: string; color: string; gradient: string }
export interface AgentTopicItem { id: string; title: string; date: string; msgs: number; active?: boolean; category?: string }
export interface ChatMsgItem { from: 'user' | 'agent'; text: string }

export function AgentChatTabUI({
  chatList,
  interactionMessages,
  agentCards,
  agentTopics,
  topicMessages,
  suggestionsByAgent = {},
  defaultSuggestions = ['پیشنهاد بده', 'مقایسه قیمت', 'پرفروش‌ترین'],
  uniqueKey = 'chat',
}: {
  chatList: ChatListItem[];
  interactionMessages: Record<string, ChatMsgItem[]>;
  agentCards: AgentCardItem[];
  agentTopics: Record<string, AgentTopicItem[]>;
  topicMessages: Record<string, ChatMsgItem[]>;
  suggestionsByAgent?: Record<string, string[]>;
  defaultSuggestions?: string[];
  uniqueKey?: string;
}) {
  const { showToast } = useApp();
  const [chatSub, setChatSub] = useState<'interactions' | 'agent'>('interactions');
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [showTopics, setShowTopics] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [liveMsgs, setLiveMsgs] = useState<ChatMsgItem[]>([]);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    const txt = chatInput.trim();
    setLiveMsgs(prev => [...prev, { from: 'user', text: txt }]);
    setChatInput('');
    setTimeout(() => {
      setLiveMsgs(prev => [...prev, { from: 'agent', text: `متوجه شدم. در مورد «${txt}» بررسی می‌کنم و نتیجه رو اعلام می‌کنم.` }]);
    }, 800);
  };

  if (activeChat) {
    const chatInfo = chatList.find(c => c.id === activeChat);
    const agentInfo = agentCards.find(a => a.id === activeChat);
    const isAgent = !!agentInfo;
    const info = chatInfo
      ? { name: chatInfo.name, icon: chatInfo.icon, color: chatInfo.color, online: chatInfo.online, gradient: undefined as string | undefined }
      : agentInfo
        ? { name: agentInfo.name, icon: agentInfo.icon, color: agentInfo.color, online: true, gradient: agentInfo.gradient }
        : null;

    let msgs: ChatMsgItem[] = [];
    if (isAgent) { if (activeTopic) msgs = topicMessages[activeTopic] || []; }
    else { msgs = interactionMessages[activeChat] || []; }
    const allMsgs = [...msgs, ...liveMsgs];
    const topics = isAgent ? (agentTopics[activeChat] || []) : [];
    const suggestions = isAgent ? (suggestionsByAgent[activeChat] || defaultSuggestions) : defaultSuggestions;

    return (
      <div className="flex-1 flex flex-col min-h-0 relative">
        <div className="flex items-center gap-2.5 px-4 pt-3 pb-2 flex-shrink-0 border-b border-[var(--aw-border)]">
          <button className="w-8 h-8 rounded-lg border border-[var(--aw-border)] bg-transparent text-[var(--aw-text-secondary)] cursor-pointer flex items-center justify-center"
            onClick={() => { setActiveChat(null); setActiveTopic(null); setLiveMsgs([]); setShowTopics(false); }}>
            <i className="fa-solid fa-arrow-right text-[11px]" />
          </button>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0 relative" style={{ background: info?.gradient || info?.color }}>
            <i className={`${info?.icon} text-[13px]`} />
            {info?.online && <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-[var(--aw-bg-header)]" style={{ background: '#10B981' }} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{info?.name}</div>
            <div className="text-[10px] text-[#10B981]">
              {isAgent ? (activeTopic ? (topics.find(t => t.id === activeTopic)?.title || 'گفتگوی جدید') : 'گفتگوی جدید') : (info?.online ? 'آنلاین' : 'آفلاین')}
            </div>
          </div>
          {isAgent && (
            <div className="flex items-center gap-1.5">
              <button className="w-8 h-8 rounded-lg border border-[var(--aw-border)] bg-transparent cursor-pointer flex items-center justify-center text-[var(--aw-text-secondary)] relative"
                onClick={() => setShowTopics(!showTopics)}>
                <i className="fa-solid fa-folder-open text-[12px]" />
                {topics.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[7px]" style={{ background: info?.color, fontWeight: 700 }}>{toFa(topics.length)}</span>}
              </button>
              <button className="w-8 h-8 rounded-lg border border-[var(--aw-border)] bg-transparent cursor-pointer flex items-center justify-center text-[var(--aw-text-secondary)]"
                onClick={() => { setActiveTopic(null); setLiveMsgs([]); setShowTopics(false); showToast('گفتگوی جدید'); }}>
                <i className="fa-solid fa-plus text-[12px]" />
              </button>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showTopics && isAgent && (
            <motion.div className="absolute top-[56px] left-4 right-4 z-30 rounded-xl overflow-hidden"
              style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
              initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.2 }}>
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--aw-border)]">
                <span className="text-[13px] text-[var(--aw-text-primary)] flex items-center gap-1.5" style={{ fontWeight: 700 }}>
                  <i className="fa-solid fa-folder-open text-[12px]" style={{ color: info?.color }} /> پرونده‌ها
                </span>
                <button className="text-[11px] px-2.5 py-1 rounded-lg border-none cursor-pointer text-white flex items-center gap-1" style={{ background: info?.color, fontWeight: 600 }}
                  onClick={() => { setActiveTopic(null); setLiveMsgs([]); setShowTopics(false); showToast('گفتگوی جدید ایجاد شد'); }}>
                  <i className="fa-solid fa-plus text-[9px]" /> جدید
                </button>
              </div>
              {topics.map(topic => (
                <button key={topic.id} className="w-full flex items-center gap-3 px-3 py-2.5 border-none bg-transparent cursor-pointer text-right"
                  style={activeTopic === topic.id ? { background: `${info?.color}15` } : {}}
                  onClick={() => { setActiveTopic(topic.id); setLiveMsgs([]); setShowTopics(false); }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: activeTopic === topic.id ? `${info?.color}22` : 'var(--aw-bg-app)' }}>
                    <i className={`fa-solid ${activeTopic === topic.id ? 'fa-comment-dots' : 'fa-file-lines'} text-[12px]`} style={{ color: activeTopic === topic.id ? info?.color : 'var(--aw-text-muted)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-[var(--aw-text-primary)] truncate" style={{ fontWeight: activeTopic === topic.id ? 700 : 500 }}>{topic.title}</div>
                    <div className="text-[10px] text-[var(--aw-text-muted)]">{topic.date} · {toFa(topic.msgs)} پیام</div>
                  </div>
                  {activeTopic === topic.id && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: info?.color }} />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto aw-scroll px-4 pt-3 pb-2">
          {allMsgs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 px-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${info?.color}18` }}>
                <i className={`${info?.icon} text-[24px]`} style={{ color: info?.color }} />
              </div>
              <div className="text-[14px] text-[var(--aw-text-primary)] mb-1" style={{ fontWeight: 700 }}>گفتگوی جدید</div>
              <div className="text-[12px] text-[var(--aw-text-muted)] text-center" style={{ lineHeight: '2' }}>پیام خود را بنویسید تا {info?.name} به شما کمک کند.</div>
              {isAgent && (
                <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
                  {suggestions.map(s => (
                    <button key={s} className="text-[10px] px-3 py-1.5 rounded-full border bg-transparent cursor-pointer" style={{ borderColor: `${info?.color}40`, color: info?.color, fontWeight: 600 }} onClick={() => setChatInput(s)}>{s}</button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            allMsgs.map((msg, i) => (
              <motion.div key={i} className={`flex mb-2 ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                {msg.from === 'agent' && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0 ml-1.5 mt-1" style={{ background: info?.gradient || info?.color, fontSize: 10 }}>
                    <i className={`${info?.icon}`} />
                  </div>
                )}
                <div className="max-w-[80%] px-3 py-2 rounded-2xl text-[12px]" style={{ background: msg.from === 'user' ? 'var(--aw-eu-primary)' : 'var(--aw-bg-hover)', color: msg.from === 'user' ? '#fff' : 'var(--aw-text-primary)', borderBottomLeftRadius: msg.from === 'user' ? 16 : 4, borderBottomRightRadius: msg.from === 'user' ? 4 : 16, lineHeight: '1.9', whiteSpace: 'pre-line' }}>{msg.text}</div>
              </motion.div>
            ))
          )}
        </div>

        <div className="flex-shrink-0 px-4 pb-3 pt-1">
          <div className="flex items-center gap-2 rounded-xl px-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
            <input className="flex-1 bg-transparent border-none py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]" placeholder="پیام خود را بنویسید..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSend(); }} />
            <button className="w-8 h-8 rounded-lg border-none text-white cursor-pointer flex items-center justify-center" style={{ background: chatInput.trim() ? (info?.color || 'var(--aw-eu-primary)') : 'var(--aw-text-muted)', opacity: chatInput.trim() ? 1 : 0.4 }} onClick={handleSend}>
              <i className="fa-solid fa-paper-plane text-[11px]" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex mx-4 mt-3 mb-1 flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--aw-eu-primary) 13%, white)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', borderRadius: 9999, padding: 4, boxShadow: 'inset 0 1px 2px color-mix(in srgb, var(--aw-eu-primary) 8%, transparent)' }}>
        <button
          className="flex-1 border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all"
          style={{ borderRadius: 9999, padding: '8px 12px', background: chatSub === 'interactions' ? 'color-mix(in srgb, var(--aw-eu-primary) 52%, white)' : 'transparent', boxShadow: chatSub === 'interactions' ? 'inset 0 1px 1px rgba(255,255,255,0.35)' : 'none', color: chatSub === 'interactions' ? 'color-mix(in srgb, var(--aw-eu-primary) 82%, black)' : 'var(--aw-text-secondary)', fontWeight: chatSub === 'interactions' ? 800 : 500, fontSize: 12, fontFamily: "'Kamand', 'Vazirmatn', sans-serif" }}
          onClick={() => setChatSub('interactions')}>
          تعاملات
          {chatList.reduce((s, c) => s + c.unread, 0) > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: chatSub === 'interactions' ? 'rgba(92,74,189,0.2)' : 'var(--aw-danger)', color: chatSub === 'interactions' ? 'rgb(92,74,189)' : '#fff', fontWeight: 700 }}>{toFa(chatList.reduce((s, c) => s + c.unread, 0))}</span>
          )}
        </button>
        <button
          className="flex-1 border-none cursor-pointer flex items-center justify-center transition-all"
          style={{ borderRadius: 9999, padding: '8px 12px', background: chatSub === 'agent' ? 'color-mix(in srgb, var(--aw-eu-primary) 52%, white)' : 'transparent', boxShadow: chatSub === 'agent' ? 'inset 0 1px 1px rgba(255,255,255,0.35)' : 'none', color: chatSub === 'agent' ? 'color-mix(in srgb, var(--aw-eu-primary) 82%, black)' : 'var(--aw-text-secondary)', fontWeight: chatSub === 'agent' ? 800 : 500, fontSize: 12, fontFamily: "'Kamand', 'Vazirmatn', sans-serif" }}
          onClick={() => setChatSub('agent')}>
          عامل هوشمند
        </button>
      </div>

      <AnimatePresence mode="wait">
        {chatSub === 'interactions' && (
          <motion.div key={`${uniqueKey}-interactions`} className="flex-1 overflow-y-auto pb-4 aw-scroll px-4 pt-2"
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.18 }}>
            {chatList.map((chat, i) => (
              <motion.div key={chat.id} className="p-3 mb-1.5 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform" style={euCardStyle}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => { setActiveChat(chat.id); setLiveMsgs([]); }}>
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white" style={{ background: chat.color }}>
                    <i className={`${chat.icon} text-[15px]`} />
                  </div>
                  {chat.online && <span className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--aw-eu-card)]" style={{ background: '#10B981' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] text-[var(--aw-text-primary)] truncate" style={{ fontWeight: 700 }}>{chat.name}</span>
                    <span className="text-[9px] text-[var(--aw-text-muted)] whitespace-nowrap flex-shrink-0">{chat.time}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-[11px] text-[var(--aw-text-muted)] truncate" style={{ lineHeight: '1.5' }}>{chat.lastMsg}</span>
                    {chat.unread > 0 && (
                      <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px]" style={{ background: 'var(--aw-eu-primary)', fontWeight: 700 }}>{toFa(chat.unread)}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {chatSub === 'agent' && (
          <motion.div key={`${uniqueKey}-agent`} className="flex-1 overflow-y-auto pb-4 aw-scroll px-4 pt-2"
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
            <div className="mb-3">
              {agentCards.map((agent, i) => (
                <motion.div key={agent.id} className="p-3 mb-1.5 rounded-2xl cursor-pointer relative overflow-hidden active:scale-[0.98] transition-transform flex items-center gap-3"
                  style={euCardStyle} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                  onClick={() => { setActiveChat(agent.id); setActiveTopic(null); setLiveMsgs([]); }}>
                  <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-[0.12]" style={{ background: agent.color, filter: 'blur(18px)' }} />
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0 relative" style={{ background: agent.gradient }}>
                    <i className={`${agent.icon} text-[15px]`} />
                  </div>
                  <div className="flex-1 min-w-0 relative">
                    <div className="text-[13px] text-[var(--aw-text-primary)] mb-0.5" style={{ fontWeight: 700 }}>{agent.name}</div>
                    <div className="text-[10px] text-[var(--aw-text-muted)] truncate" style={{ lineHeight: '1.5' }}>{agent.desc}</div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 relative">
                    {(agentTopics[agent.id]?.length || 0) > 0 && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: `${agent.color}18`, color: agent.color, fontWeight: 600 }}>{toFa(agentTopics[agent.id]?.length || 0)} پرونده</span>
                    )}
                    <span className="text-[9px] px-2.5 py-1 rounded-full text-white whitespace-nowrap" style={{ background: agent.color, fontWeight: 600 }}>
                      <i className="fa-solid fa-plus text-[7px] ml-0.5" />چت جدید
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {(() => {
              const allTopics = agentCards.flatMap(agent => (agentTopics[agent.id] || []).map(topic => ({ ...topic, agent })));
              const cats = Array.from(new Set(allTopics.map(t => t.category).filter(Boolean))) as string[];
              const groups = cats.length
                ? cats.map(cat => ({ cat, items: allTopics.filter(t => t.category === cat) }))
                : [{ cat: 'چت‌های اخیر', items: allTopics }];
              let gi = 0;
              return groups.map(g => (
                <div key={g.cat}>
                  <SectionTitle icon="fa-solid fa-folder-open" title={g.cat} />
                  {g.items.sort((a, b) => (a.active ? -1 : 1) - (b.active ? -1 : 1)).map((item) => {
                    const i = gi++;
                    return (
                <motion.div key={item.id} className="p-3 mb-1.5 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform" style={euCardStyle}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => { setActiveChat(item.agent.id); setActiveTopic(item.id); setLiveMsgs([]); }}>
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white" style={{ background: item.agent.gradient }}>
                      <i className={`${item.agent.icon} text-[15px]`} />
                    </div>
                    {item.active && <span className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--aw-eu-card)]" style={{ background: '#10B981' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] text-[var(--aw-text-primary)] truncate" style={{ fontWeight: 700 }}>{item.title}</span>
                      <span className="text-[9px] text-[var(--aw-text-muted)] whitespace-nowrap flex-shrink-0">{item.date}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-[11px] text-[var(--aw-text-muted)] truncate" style={{ lineHeight: '1.5' }}>{item.agent.name} · {toFa(item.msgs)} پیام</span>
                      {item.active && (
                        <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px]" style={{ background: item.agent.color, fontWeight: 700 }}>
                          <i className="fa-solid fa-comment-dots text-[8px]" />
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
                    );
                  })}
                </div>
              ));
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
