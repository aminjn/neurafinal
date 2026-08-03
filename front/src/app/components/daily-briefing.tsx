import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import { api } from '../services/api';
const __ANALYTICS: any = { monthlyRevenue: null, weeklyActivity: null };
let __analyticsLoaded = false;
function __useAnalytics() {
  const [, __af] = React.useState(0);
  React.useEffect(() => {
    if (__analyticsLoaded) { if (__ANALYTICS.monthlyRevenue) __af((x) => x + 1); return; }
    (async () => { try { const a: any = await (api as any).analytics(); if (a && a.monthlyRevenue) { __ANALYTICS.monthlyRevenue = a.monthlyRevenue; __ANALYTICS.weeklyActivity = a.weeklyActivity; __analyticsLoaded = true; __af((x) => x + 1); } } catch (_) {} })();
  }, []);
}

import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './app-context';
import { EuAvatar } from './eu-spectrum-avatar';
import {
  toFa, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS,
  TASK_STATUS_COLORS, TASK_PRIORITY_COLORS,
  WEEKLY_ACTIVITY_DATA, MONTHLY_REVENUE_DATA,
} from './data';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';

// ========================
// BRIEFING DATA
// ========================
const MEETINGS = [];

// Each line maps to a content section:
// 0 → greeting (avatar only)
// 1 → stat cards
// 2 → tasks list
// 3 → meetings list
// 4 → charts (activity + revenue)
// 5 → CTA
// realbriefing: خطوطِ روایت داخلِ کامپوننت از دادهٔ واقعی ساخته می‌شوند (پایین‌تر).

// ========================
// MINI TOOLTIP
// ========================
function MiniTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-2.5 py-1.5 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-modal)', direction: 'rtl', fontSize: 11 }}>
      <div className="text-[10px] text-[var(--aw-text-muted)] mb-0.5">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-1" style={{ color: p.color, fontWeight: 600 }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          {p.name}: {toFa(p.value)}
        </div>
      ))}
    </div>
  );
}

// ========================
// SECTION WRAPPER (animates in)
// ========================
function BriefingSection({ visible, children, delay = 0, id = 'default' }: { visible: boolean; children: React.ReactNode; delay?: number; id?: string }) {
  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key={`briefing-section-${id}`}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } }}
          transition={{ duration: 0.45, ease: 'easeOut', delay }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ========================
// ACCENT HELPERS (mirror admin-panel's derivation so the welcome theme
// follows the personal-assistant agent's accent)
// ========================
function briefHexToRgb(hex: string) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function briefRgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0; const l = (mx + mn) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60); if (h < 0) h += 360;
  }
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}
function briefHsl(h: number, s: number, l: number) { return `hsl(${h}, ${s}%, ${Math.max(0, Math.min(100, l))}%)`; }
// Returns the welcome-screen palette for a given accent hex (or the default cyan/blue when null).
function briefPalette(accent: string | null) {
  if (!accent) {
    return {
      light: '#22A6F0', dark: '#1B4FE8', base: '#2E86FF',
      bg: 'radial-gradient(620px 440px at 50% -8%, rgba(34,166,240,0.20), transparent 62%), radial-gradient(520px 380px at 100% 6%, rgba(63,217,232,0.14), transparent 60%), radial-gradient(560px 380px at 0% 24%, rgba(30,107,255,0.12), transparent 60%), var(--aw-bg-app)',
    };
  }
  const { r, g, b } = briefHexToRgb(accent);
  const { h, s, l } = briefRgbToHsl(r, g, b);
  const sat = Math.max(s, 70);
  const dark = briefHsl(h, sat, Math.max(l - 16, 14));
  const light = briefHsl(h, sat, Math.min(l + 16, 88));
  return {
    light, dark, base: accent,
    bg: `radial-gradient(620px 440px at 50% -8%, rgba(${r},${g},${b},0.20), transparent 62%), radial-gradient(520px 380px at 100% 6%, rgba(${r},${g},${b},0.13), transparent 60%), radial-gradient(560px 380px at 0% 24%, rgba(${r},${g},${b},0.10), transparent 60%), var(--aw-bg-app)`,
  };
}

// ========================
// MAIN COMPONENT
// ========================
export default function DailyBriefingScreen({ onDismiss }: { onDismiss: () => void }) {
  __useAnalytics();
  const { tasks, agents, setTeamAccent, defaultAgent, setAgentTeam, setAdminScreen, setRole } = useApp();
  const uid = useId().replace(/:/g, '');
  const gradId = `briefGrad-${uid}`;
  const [currentLine, setCurrentLine] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [skipped, setSkipped] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [checkedMeetings, setCheckedMeetings] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    MEETINGS.forEach(m => { map[m.id] = m.done; });
    return map;
  });
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextLineRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [avatarRect, setAvatarRect] = useState<{ top: number; left: number; width: number } | null>(null);

  // The welcome screen ALWAYS represents the personal assistant (دستیار شخصی):
  // its identity, theme, avatar & spectrum. The user-chosen DEFAULT agent is only
  // the destination opened after pressing «ورود».
  const TEAM_FIRST: Record<string, string> = { assistant: 'assistantScreen', marketing: 'mktConversationsScreen', secretary: 'chatsScreen', finance: 'chatsScreen', procurement: 'chatsScreen', sales: 'salesConversationsScreen' };
  const AVATAR_FALLBACK: Record<string, string> = { secretary: '/src/assets/avatar-secretary.png', marketing: '/src/assets/avatar-marketing.png', finance: '/src/assets/avatar-finance.png' };
  const assistantAg = agents.find(a => a.id === 'assistant') || agents[0];
  const defaultAg = agents.find(a => a.id === defaultAgent) || assistantAg;
  // Welcome mirrors personal-panel header exactly: localStorage name or لادن لرستانی
  const storedName = (typeof localStorage !== 'undefined' && localStorage.getItem('aw-eu-assistant-name')) || '';
  const agentName = storedName || 'لادن لرستانی';
  const agentRole = assistantAg?.role || 'دستیار هوشمند شما';
  const accent = assistantAg?.accent || null;
  const agentTeamKey = 'assistant';
  const portraitSrc = (typeof localStorage !== 'undefined' && localStorage.getItem('aw-eu-assistant-portrait')) || '/src/assets/avatar-portrait.png';
  const pal = briefPalette(accent);
  const greetingLine = `سلام، صبح بخیر! من ${agentName} هستم، ${agentRole}.`;

  // Drive the .neura-admin CSS vars (speech bubble, progress dots, etc.) from the
  // default agent's accent while the welcome screen is shown.
  useEffect(() => {
    setTeamAccent(accent);
  }, [accent, setTeamAccent]);

  // Data
  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const highPriorityCount = pendingTasks.filter(t => t.priority === 'high').length;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const todayMeetings = MEETINGS.length;
  // realbriefing: روایتِ صوتی از دادهٔ واقعی ساخته می‌شود (نه اعدادِ هاردکد که با کارت‌های زیرش تناقض داشت)
  const BRIEFING_LINES = [
    'سلام! من دستیار شخصی شما هستم.',
    'خلاصهٔ گزارش امروز رو براتون آماده کردم.',
    highPriorityCount === 0
      ? 'وظیفهٔ با اولویت بالایی در انتظار بررسی نیست.'
      : `${toFa(highPriorityCount)} وظیفه با اولویت بالا در انتظار بررسی شماست.`,
    todayMeetings === 0
      ? 'جلسه‌ای برای امروز ثبت نشده.'
      : `${toFa(todayMeetings)} جلسه برای امروز برنامه‌ریزی شده.`,
    totalTasks === 0
      ? 'هنوز وظیفه‌ای ثبت نشده؛ بریم شروع کنیم.'
      : `${toFa(doneTasks)} از ${toFa(totalTasks)} وظیفه تا الان انجام شده.`,
    'هر وقت آماده بودید، بریم سراغ کار!',
  ];

  // Which sections are visible
  const showStats = currentLine >= 1 && !isDismissing;
  const showTasks = currentLine >= 2 && !isDismissing;
  const showMeetings = currentLine >= 3 && !isDismissing;
  const showCharts = currentLine >= 4 && !isDismissing;
  const showCTA = currentLine >= 5 && !isDismissing;
  const allDone = currentLine >= BRIEFING_LINES.length;

  // Auto-scroll when new sections appear
  useEffect(() => {
    if (scrollRef.current && currentLine > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 200);
    }
  }, [currentLine]);

  // Typing animation
  useEffect(() => {
    if (skipped) return;
    if (currentLine >= BRIEFING_LINES.length) {
      setIsSpeaking(false);
      setDisplayedText(BRIEFING_LINES[BRIEFING_LINES.length - 1]);
      return;
    }

    const line = currentLine === 0 ? greetingLine : BRIEFING_LINES[currentLine];
    let charIndex = 0;
    setDisplayedText('');
    setIsSpeaking(true);

    typingRef.current = setInterval(() => {
      charIndex++;
      setDisplayedText(line.slice(0, charIndex));
      if (charIndex >= line.length) {
        if (typingRef.current) clearInterval(typingRef.current);
        nextLineRef.current = setTimeout(() => setCurrentLine(prev => prev + 1), 900);
      }
    }, 30);

    return () => {
      if (typingRef.current) clearInterval(typingRef.current);
      if (nextLineRef.current) clearTimeout(nextLineRef.current);
    };
  }, [currentLine, skipped]);

  // Skip handler — only skips speech, shows all content instantly
  const handleSkip = useCallback(() => {
    if (typingRef.current) clearInterval(typingRef.current);
    if (nextLineRef.current) clearTimeout(nextLineRef.current);
    setSkipped(true);
    setIsSpeaking(false);
    setCurrentLine(BRIEFING_LINES.length);
    setDisplayedText(BRIEFING_LINES[BRIEFING_LINES.length - 1]);
  }, []);

  // Dismiss handler — triggers morphing animation, then calls onDismiss
  const handleDismiss = useCallback(() => {
    // Open the user-chosen DEFAULT agent's own workspace on entry.
    const destKey = defaultAg ? (defaultAg.team || defaultAg.id) : null;
    if (destKey === 'assistant') {
      // Personal assistant now lives INSIDE the management panel (merged).
      setAgentTeam('assistant');
      setAdminScreen(TEAM_FIRST['assistant'] as any);
      setRole('admin');
    } else if (destKey && TEAM_FIRST[destKey]) {
      setAgentTeam(destKey as any);
      setAdminScreen(TEAM_FIRST[destKey] as any);
    }
    // Avatar should always start BIG when entering the panel.
    try { localStorage.setItem('aw-eu-avatar-active', '1'); } catch (e) {}
    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      setAvatarRect({ top: rect.top, left: rect.left, width: rect.width });
    }
    setIsDismissing(true);
    // Wait for content to fade out, then call onDismiss
    setTimeout(() => {
      onDismiss();
    }, 700);
  }, [onDismiss, defaultAg, setAgentTeam, setAdminScreen, setRole]);

  return (
    <div className="flex flex-col h-full relative overflow-hidden" style={{ background: pal.bg }}>
      {/* ===== AVATAR + SPEECH BUBBLE (fixed top) ===== */}
      <div className="flex-shrink-0">
        <motion.div
          className="flex flex-col items-center pt-5 pb-3 px-4 relative"
          animate={isDismissing ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          {/* Ambient glow */}
          <div
            className="absolute top-2 w-[180px] h-[180px] rounded-full opacity-15 blur-[50px]"
            style={{ background: `linear-gradient(135deg, ${pal.light}, ${pal.dark})` }}
          />

          {/* Avatar — full spectrum, active (speaking), big size like other screens */}
          <motion.div
            ref={avatarRef}
            className="relative mb-4 w-[280px] flex items-center justify-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <EuAvatar palette="cyan" accent={accent} display speaking={isSpeaking} portrait={portraitSrc} name={agentName} />
          </motion.div>

          {/* Name + Role */}
          <motion.div
            className="text-center mb-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="text-[15px] text-[var(--aw-text-primary)] mb-0.5" style={{ fontWeight: 700 }}>{agentName}</div>
            <div className="text-[11px] text-[var(--aw-text-secondary)]">{agentRole}</div>
          </motion.div>

          {/* Speech bubble */}
          <motion.div
            className="w-full max-w-[380px] rounded-2xl px-4 py-3 border border-[var(--aw-border)] relative"
            style={{ background: 'var(--aw-bg-card)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Pointer */}
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 border-t border-r border-[var(--aw-border)]"
              style={{ background: 'var(--aw-bg-card)' }}
            />

            <div className="text-[13px] text-[var(--aw-text-primary)] leading-relaxed min-h-[22px] max-h-[80px] overflow-y-auto aw-scroll relative z-10" style={{ fontWeight: 500 }}>
              {!allDone ? (
                <>
                  {displayedText}
                  <motion.span
                    className="inline-block w-[2px] h-[13px] mr-0.5 align-middle"
                    style={{ background: 'var(--aw-primary)' }}
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                  />
                </>
              ) : (
                <span className="text-[var(--aw-text-secondary)]">{BRIEFING_LINES[BRIEFING_LINES.length - 1]}</span>
              )}
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1 mt-2">
              {BRIEFING_LINES.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === Math.min(currentLine, BRIEFING_LINES.length - 1) ? 14 : 4,
                    height: 4,
                    background: i <= currentLine ? 'var(--aw-primary)' : 'var(--aw-border)',
                  }}
                />
              ))}
            </div>

            {/* Skip button moved to bottom of screen */}
          </motion.div>
        </motion.div>
      </div>

      {/* ===== CONTENT SECTIONS (appear synced with speech lines) ===== */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto aw-scroll pb-4">

        <div className="px-4 space-y-3">

          {/* Section 1: Stat Cards (line >= 1) */}
          <BriefingSection visible={showStats} id="stats">
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { icon: 'fa-solid fa-fire', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', value: toFa(highPriorityCount), label: 'اولویت بالا' },
                { icon: 'fa-solid fa-calendar-day', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', value: toFa(todayMeetings), label: 'جلسه امروز' },
                { icon: 'fa-solid fa-check-double', color: '#10b981', bg: 'rgba(16,185,129,0.15)', value: `${toFa(doneTasks)}/${toFa(totalTasks)}`, label: 'انجام شده' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  className="rounded-2xl p-3 text-center border border-[var(--aw-border)]"
                  style={{ background: 'var(--aw-bg-card)' }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="w-8 h-8 rounded-lg mx-auto mb-1.5 flex items-center justify-center" style={{ background: s.bg }}>
                    <i className={`${s.icon} text-[13px]`} style={{ color: s.color }} />
                  </div>
                  <div className="text-[16px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{s.value}</div>
                  <div className="text-[10px] text-[var(--aw-text-muted)]">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </BriefingSection>

          {/* Section 2: Tasks To-Do (line >= 2) */}
          <BriefingSection visible={showTasks} id="tasks">
            <div className="rounded-2xl p-3.5 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(46,134,255,0.15)' }}>
                  <i className="fa-solid fa-list-check text-[12px]" style={{ color: '#2E86FF' }} />
                </div>
                <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>وظایف فعال</span>
                <span className="text-[10px] text-[var(--aw-text-muted)] mr-auto">{toFa(pendingTasks.length)} مورد</span>
              </div>
              <div className="space-y-1">
                {pendingTasks.map((task) => {
                  const isDone = checkedTasks[task.id] || false;
                  const pc = TASK_PRIORITY_COLORS[task.priority];
                  const sc = TASK_STATUS_COLORS[task.status];
                  return (
                    <div
                      key={task.id}
                      className="flex items-start gap-2.5 p-2 rounded-xl cursor-pointer transition-all hover:bg-[var(--aw-bg-card-hover)]"
                      onClick={() => setCheckedTasks(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
                    >
                      <button
                        className="w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                        style={{ borderColor: isDone ? '#10b981' : pc?.text || 'var(--aw-border)', background: isDone ? '#10b981' : 'transparent' }}
                      >
                        {isDone && <i className="fa-solid fa-check text-[8px] text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-[12px] mb-0.5 transition-all ${isDone ? 'line-through text-[var(--aw-text-muted)]' : 'text-[var(--aw-text-primary)]'}`}
                          style={{ fontWeight: 500 }}
                        >
                          {task.title}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: pc?.bg, color: pc?.text, fontWeight: 600 }}>
                            {TASK_PRIORITY_LABELS[task.priority]}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: sc?.bg, color: sc?.text, fontWeight: 600 }}>
                            {TASK_STATUS_LABELS[task.status]}
                          </span>
                          <span className="text-[9px] text-[var(--aw-text-muted)]">
                            <i className="fa-solid fa-user text-[7px] ml-0.5" />{task.assignee}
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-[var(--aw-text-muted)] flex-shrink-0 mt-0.5">{task.dueDate}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </BriefingSection>

          {/* Section 3: Meetings To-Do (line >= 3) */}
          <BriefingSection visible={showMeetings} id="meetings">
            <div className="rounded-2xl p-3.5 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}>
                  <i className="fa-solid fa-calendar-check text-[12px]" style={{ color: '#3b82f6' }} />
                </div>
                <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>جلسات امروز</span>
                <span className="text-[10px] text-[var(--aw-text-muted)] mr-auto">{toFa(MEETINGS.length)} جلسه</span>
              </div>
              <div className="space-y-1">
                {MEETINGS.map((m) => {
                  const isDone = checkedMeetings[m.id];
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all hover:bg-[var(--aw-bg-card-hover)]"
                      onClick={() => setCheckedMeetings(prev => ({ ...prev, [m.id]: !prev[m.id] }))}
                    >
                      <button
                        className="w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ borderColor: isDone ? '#10b981' : 'var(--aw-border)', background: isDone ? '#10b981' : 'transparent' }}
                      >
                        {isDone && <i className="fa-solid fa-check text-[8px] text-white" />}
                      </button>
                      <div
                        className="text-[10px] px-1.5 py-0.5 rounded-md flex-shrink-0"
                        style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', fontWeight: 600 }}
                      >
                        {m.time}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-[12px] transition-all ${isDone ? 'line-through text-[var(--aw-text-muted)]' : 'text-[var(--aw-text-primary)]'}`}
                          style={{ fontWeight: 500 }}
                        >
                          {m.title}
                        </div>
                        <div className="text-[10px] text-[var(--aw-text-muted)] truncate">
                          <i className="fa-solid fa-location-dot ml-1 text-[8px]" />{m.location}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </BriefingSection>

          {/* Section 4: Charts (line >= 4) */}
          <BriefingSection visible={showCharts} id="charts">
            <div className="space-y-3">
              {/* Weekly Activity */}
              <div className="rounded-2xl p-3.5 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(46,134,255,0.15)' }}>
                      <i className="fa-solid fa-chart-bar text-[12px]" style={{ color: '#2E86FF' }} />
                    </div>
                    <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>فعالیت هفتگی</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 600 }}>
                    <i className="fa-solid fa-arrow-up ml-0.5 text-[8px]" />
                    رشد
                  </span>
                </div>
                <div style={{ direction: 'ltr' }} className="h-[110px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(__ANALYTICS.weeklyActivity || WEEKLY_ACTIVITY_DATA)} barGap={2}>
                      <XAxis dataKey="day" tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<MiniTooltip />} cursor={{ fill: 'rgba(46,134,255,0.08)' }} />
                      <Bar dataKey="messages" name="پیام" fill="#2E86FF" radius={[4, 4, 0, 0]} barSize={11} isAnimationActive={false} />
                      <Bar dataKey="calls" name="تماس" fill="#22A6F0" radius={[4, 4, 0, 0]} barSize={11} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue Trend */}
              <div className="rounded-2xl p-3.5 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                    <i className="fa-solid fa-chart-line text-[12px]" style={{ color: '#10b981' }} />
                  </div>
                  <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>روند درآمد</span>
                </div>
                <div style={{ direction: 'ltr' }} className="h-[90px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={(__ANALYTICS.monthlyRevenue || MONTHLY_REVENUE_DATA).slice(-6)}>
                      <defs>
                        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<MiniTooltip />} cursor={{ stroke: 'rgba(16,185,129,0.3)', strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="income" name="درآمد" stroke="#10b981" fill={`url(#${gradId})`} strokeWidth={2} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </BriefingSection>

          {/* Section 5: CTA Button — removed from here, now fixed at bottom */}

        </div>
      </div>

      {/* ===== BOTTOM BUTTON — skip while playing, turns into enter-panel when done ===== */}
      <div className="flex-shrink-0 px-4 pb-3 pt-2">
        {allDone ? (
          <button
            className="w-full py-3.5 rounded-2xl border-none text-white text-[14px] cursor-pointer flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${pal.light}, ${pal.dark})`,
              fontWeight: 700,
              boxShadow: `0 4px 20px ${accent ? 'color-mix(in srgb, ' + accent + ' 35%, transparent)' : 'rgba(46,134,255,0.3)'}`,
            }}
            onClick={handleDismiss}
          >
            <i className="fa-solid fa-arrow-left text-[12px]" />
            ورود
          </button>
        ) : (
          <button
            className="w-full py-3.5 rounded-2xl bg-transparent border border-[var(--aw-border)] text-[14px] text-[var(--aw-text-secondary)] cursor-pointer flex items-center justify-center gap-2 hover:text-[var(--aw-text-primary)] hover:border-[var(--aw-primary)] transition-all active:scale-[0.98]"
            style={{ fontWeight: 600 }}
            onClick={handleSkip}
          >
            رد شدن <i className="fa-solid fa-forward text-[10px]" />
          </button>
        )}
      </div>
    </div>
  );
}