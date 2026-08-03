import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, PanInfo } from 'motion/react';
import { useApp } from './app-context';
import { MKT_QUICK_ACTIONS } from './marketing-data';
import { SALES_QUICK_ACTIONS, SALES_AI_RESPONSES } from './sales-extra';

const FAB_SIZE = 64;
const FAB_EXPANDED_SCALE = 4;
const CENTER_SNAP_RADIUS = 120;
const RIGHT_SWIPE_THRESHOLD = 120; // px to the right to trigger navigation

export default function FloatingMicFAB() {
  const { agents, euScreen, role, briefingSeen, adminScreen, agentTeam, setEuScreen, setAdminScreen, setChatTab, setAgentTeam, openChat, showToast, appStage } = useApp();

  // Contextual AI quick actions per agent (marketing & sales)
  const mktQuickActions = (role === 'admin' && agentTeam === 'marketing') ? (MKT_QUICK_ACTIONS[adminScreen] || [])
    : (role === 'admin' && agentTeam === 'sales') ? (SALES_QUICK_ACTIONS[adminScreen] || [])
    : [];
  const quickActionsTitle = agentTeam === 'sales' ? 'فروشنده هوشمند من' : 'بازاریاب هوشمند من';
  const [isTalking, setIsTalking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [nearCenter, setNearCenter] = useState(false);
  const [nearRight, setNearRight] = useState(false);
  const [isDismissingExpanded, setIsDismissingExpanded] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerQA, setDrawerQA] = useState<{ label: string } | null>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const [fabOrigin, setFabOrigin] = useState<{ x: number; y: number } | null>(null);

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  const isAgentScreen = ['euDineScreen', 'euAssistantScreen', 'euSupportScreen', 'euMarketScreen'].includes(euScreen);

  // Hide during the entry flow (splash / home / auth)
  if (appStage !== 'app') return null;
  // Hide FAB on Daily Briefing screen (admin panel, first visit)
  if (role === 'admin' && !briefingSeen) return null;
  // Hide on the personal panel — the avatar carries the mic there
  if (role === 'user') return null;
  // Hide on the admin panel too — the top avatar carries the mic
  if (role === 'admin') return null;

  const getScreenCenter = () => ({
    cx: window.innerWidth / 2,
    cy: window.innerHeight / 2,
  });

  const handleDragStart = () => {
    setIsDragging(true);
    if (fabRef.current) {
      const rect = fabRef.current.getBoundingClientRect();
      setFabOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
  };

  const handleDrag = (_: any, info: PanInfo) => {
    if (!fabOrigin) return;
    const { cx, cy } = getScreenCenter();
    const currentX = fabOrigin.x + info.offset.x;
    const currentY = fabOrigin.y + info.offset.y;
    const dist = Math.sqrt((currentX - cx) ** 2 + (currentY - cy) ** 2);
    setNearCenter(dist < CENTER_SNAP_RADIUS);
    // Detect right swipe (mostly horizontal, moving right)
    const isRightSwipe = info.offset.x > RIGHT_SWIPE_THRESHOLD && Math.abs(info.offset.y) < Math.abs(info.offset.x);
    setNearRight(isRightSwipe);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (!fabOrigin) {
      setIsDragging(false);
      setNearCenter(false);
      setNearRight(false);
      return;
    }

    const { cx, cy } = getScreenCenter();
    const currentX = fabOrigin.x + info.offset.x;
    const currentY = fabOrigin.y + info.offset.y;
    const dist = Math.sqrt((currentX - cx) ** 2 + (currentY - cy) ** 2);

    // Check right swipe first
    const isRightSwipe = info.offset.x > RIGHT_SWIPE_THRESHOLD && Math.abs(info.offset.y) < Math.abs(info.offset.x);
    if (isRightSwipe) {
      if (role === 'admin') {
        setAgentTeam('secretary');
        setChatTab('agents');
        setAdminScreen('chatsScreen');
        // Open secretary chat directly
        setTimeout(() => openChat('secretary', 'agent'), 100);
      } else {
        setEuScreen('euAssistantScreen');
      }
    } else if (dist < CENTER_SNAP_RADIUS) {
      setIsExpanded(true);
      setIsTalking(true);
    }

    setIsDragging(false);
    setNearCenter(false);
    setNearRight(false);
    // Reset drag offset
    dragX.set(0);
    dragY.set(0);
  };

  const handleFabClick = () => {
    if (isExpanded || isDragging) return;
    if (isTalking) return;
    // Sales/marketing: open the contextual quick-actions drawer instead of voice
    if (mktQuickActions.length > 0) { setDrawerQA(null); setShowDrawer(true); return; }
    setIsTalking(true);
  };

  const handleEndCall = () => {
    setIsTalking(false);
  };

  const handleCloseExpanded = () => {
    setIsDismissingExpanded(true);
    setTimeout(() => {
      setIsExpanded(false);
      setIsTalking(false);
      dragX.set(0);
      dragY.set(0);
      setIsDismissingExpanded(false);
    }, 600);
  };

  const sec = agents.find(a => a.id === 'secretary');
  const fabBottom = isAgentScreen ? 160 : 88;
  const fabLeft = 16;

  const expandedSize = FAB_SIZE * FAB_EXPANDED_SCALE; // 256px

  return (
    <>
      {/* Center drop-zone indicator while dragging */}
      <AnimatePresence>
        {isDragging && (
          <>
            {/* Right swipe indicator */}
            <motion.div
              className="fixed z-[98] pointer-events-none flex items-center justify-center rounded-2xl"
              style={{
                top: '50%',
                right: 24,
                transform: 'translateY(-50%)',
                width: 80,
                height: 80,
                border: nearRight ? '3px solid rgba(126,95,170,0.7)' : '2px dashed rgba(159,141,198,0.3)',
                background: nearRight ? 'rgba(126,95,170,0.12)' : 'rgba(159,141,198,0.05)',
              }}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.25 }}
            >
              <motion.div
                className="flex flex-col items-center gap-1"
                animate={{ opacity: nearRight ? 1 : 0.45 }}
              >
                <i className="fa-solid fa-robot text-[18px]" style={{ color: nearRight ? '#7E5FAA' : 'var(--aw-text-muted)' }} />
                <span className="text-[9px] text-center" style={{ color: nearRight ? '#7E5FAA' : 'var(--aw-text-muted)', fontWeight: 600, lineHeight: 1.2 }}>
                  {role === 'admin' ? 'منشی هوشمند' : 'دستیار شخصی'}
                </span>
              </motion.div>
            </motion.div>

            {/* Center drop-zone */}
            <motion.div
              className="fixed z-[98] rounded-full pointer-events-none flex items-center justify-center"
              style={{
                top: '50%',
                left: '50%',
                width: expandedSize,
                height: expandedSize,
                marginTop: -(expandedSize / 2),
                marginLeft: -(expandedSize / 2),
                border: nearCenter ? '3px solid rgba(236,72,153,0.6)' : '2px dashed rgba(159,141,198,0.35)',
                background: nearCenter ? 'rgba(236,72,153,0.08)' : 'rgba(159,141,198,0.05)',
              }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.25 }}
            >
              <motion.div
                className="flex flex-col items-center gap-1.5"
                animate={{ opacity: nearCenter ? 1 : 0.5 }}
              >
                <i className="fa-solid fa-expand text-[20px]" style={{ color: nearCenter ? '#EC4899' : 'var(--aw-text-muted)' }} />
                <span className="text-[11px]" style={{ color: nearCenter ? '#EC4899' : 'var(--aw-text-muted)', fontWeight: 600 }}>
                  {nearCenter ? 'رها کنید — شروع مکالمه' : 'شروع مکالمه'}
                </span>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Pulsing rings when talking (only when not expanded) */}
      <AnimatePresence>
        {isTalking && !isExpanded && (
          <>
            <motion.span
              className="fixed w-[48px] h-[48px] rounded-full z-[99] pointer-events-none"
              style={{ bottom: fabBottom, left: fabLeft, border: '2px solid #EC4899' }}
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.span
              className="fixed w-[48px] h-[48px] rounded-full z-[99] pointer-events-none"
              style={{ bottom: fabBottom, left: fabLeft, border: '2px solid #EC4899' }}
              initial={{ scale: 1, opacity: 0.4 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Expanded full overlay */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[150]"
              style={{ background: 'rgba(13,11,46,0.7)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={handleCloseExpanded}
            />

            {/* Expanded FAB circle in center */}
            <motion.div
              className="fixed z-[151] rounded-full flex flex-col items-center justify-center text-white cursor-pointer overflow-hidden"
              style={{
                background: isDismissingExpanded
                  ? 'linear-gradient(135deg, #EC4899, #BE185D)'
                  : isTalking
                    ? 'linear-gradient(135deg, #00E676, #00C853)'
                    : 'linear-gradient(135deg, #EC4899, #BE185D)',
                boxShadow: isTalking && !isDismissingExpanded
                  ? '0 8px 60px rgba(0,230,118,0.5)'
                  : '0 4px 16px rgba(236,72,153,0.4)',
              }}
              initial={{ 
                width: expandedSize, height: expandedSize,
                top: '50%', left: '50%',
                marginTop: -(expandedSize / 2), marginLeft: -(expandedSize / 2),
                scale: 0, opacity: 0,
                fontSize: FAB_SIZE * 1.4,
              }}
              animate={isDismissingExpanded ? {
                width: FAB_SIZE, height: FAB_SIZE,
                top: `calc(100% - ${fabBottom + FAB_SIZE}px)`,
                left: fabLeft,
                marginTop: 0, marginLeft: 0,
                scale: 1, opacity: 1,
                fontSize: 22,
              } : {
                width: expandedSize, height: expandedSize,
                top: '50%', left: '50%',
                marginTop: -(expandedSize / 2), marginLeft: -(expandedSize / 2),
                scale: 1, opacity: 1,
                fontSize: FAB_SIZE * 1.4,
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={isDismissingExpanded 
                ? { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
                : { type: 'spring', stiffness: 260, damping: 22 }
              }
            >
              {/* Pulsing rings for expanded state */}
              {isTalking && (
                <>
                  <motion.span
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ border: '2px solid rgba(0,230,118,0.4)' }}
                    animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                  />
                  <motion.span
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ border: '2px solid rgba(0,230,118,0.3)' }}
                    animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
                  />
                </>
              )}

              {/* Avatar letter */}
              <span style={{ fontWeight: 700, lineHeight: 1 }}>
                {isTalking && !isDismissingExpanded ? <i className="fa-solid fa-microphone" style={{ fontSize: 'inherit' }} /> : (role === 'admin' ? 'ن' : 'P')}
              </span>

              {/* Sound wave visualizer when talking */}
              {isTalking && !isDismissingExpanded && (
                <div className="flex items-center justify-center gap-[3px] mt-3">
                  {Array.from({ length: 16 }, (_, i) => (
                    <motion.div
                      key={i}
                      className="w-[3px] rounded-full"
                      style={{ background: 'rgba(255,255,255,0.7)' }}
                      animate={{
                        height: [4 + Math.random() * 4, 10 + Math.random() * 20, 4 + Math.random() * 4],
                      }}
                      transition={{
                        duration: 0.4 + Math.random() * 0.3,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        delay: i * 0.03,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Status label */}
              {!isDismissingExpanded && (
                <span className="mt-2 text-[14px] text-white/80" style={{ fontWeight: 600 }}>
                  {isTalking ? 'در حال مکالمه...' : 'دستیار صوتی'}
                </span>
              )}
            </motion.div>

            {/* Action buttons around expanded circle */}
            {!isDismissingExpanded && (
            <motion.div
              className="fixed z-[152] flex items-center gap-4"
              style={{
                top: `calc(50% + ${expandedSize / 2 + 24}px)`,
                left: '50%',
                transform: 'translateX(-50%)',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              {/* Start / End call */}
              {!isTalking ? (
                <motion.button
                  className="w-14 h-14 rounded-full border-none text-white cursor-pointer flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #00E676, #00C853)',
                    boxShadow: '0 4px 20px rgba(0,230,118,0.4)',
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsTalking(true)}
                >
                  <i className="fa-solid fa-microphone text-[20px]" />
                </motion.button>
              ) : (
                <motion.button
                  className="w-14 h-14 rounded-full border-none text-white cursor-pointer flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                    boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCloseExpanded}
                >
                  <i className="fa-solid fa-phone-slash text-[18px]" />
                </motion.button>
              )}

              {/* Close / Minimize */}
              <motion.button
                className="w-12 h-12 rounded-full border border-white/20 bg-white/10 text-white cursor-pointer flex items-center justify-center backdrop-blur-sm"
                whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.2)' }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCloseExpanded}
              >
                <i className="fa-solid fa-compress text-[16px]" />
              </motion.button>
            </motion.div>
            )}

            {/* Contextual marketing quick actions */}
            {!isDismissingExpanded && mktQuickActions.length > 0 && (
              <motion.div
                className="fixed z-[152] w-[min(88%,360px)]"
                style={{ bottom: 24, left: '50%', transform: 'translateX(-50%)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.25, duration: 0.3 }}
              >
                <div className="rounded-2xl p-3 border border-white/15" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
                  <div className="text-[12px] text-white/90 mb-2 flex items-center gap-1.5" style={{ fontWeight: 700 }}>
                    <i className="fa-solid fa-wand-magic-sparkles" /> {quickActionsTitle}
                  </div>
                  <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto aw-scroll">
                    {mktQuickActions.map((qa, i) => (
                      <button
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-white/90 text-[12px] cursor-pointer text-right hover:bg-white/15 transition-all"
                        style={{ fontWeight: 500 }}
                        onClick={() => { showToast(qa.label); handleCloseExpanded(); }}
                      >
                        <i className={`${qa.icon} text-[12px] text-[#9F8DC6]`} />
                        <span className="flex-1">{qa.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Quick-actions Drawer (click to open) */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div className="fixed inset-0 z-[150]" style={{ background: 'rgba(13,11,46,0.5)', backdropFilter: 'blur(4px)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDrawer(false)} />
            <motion.div
              className="fixed left-0 right-0 bottom-0 z-[151] rounded-t-3xl p-4 pb-[max(20px,env(safe-area-inset-bottom))] md:right-auto md:left-4 md:bottom-4 md:w-[380px] md:rounded-3xl"
              style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)', boxShadow: '0 -8px 40px rgba(0,0,0,0.3)', direction: 'rtl' }}
              initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ background: agentTeam === 'sales' ? 'linear-gradient(135deg,#10B981,#047857)' : 'linear-gradient(135deg,#3B82F6,#1D4ED8)' }}><i className="fa-solid fa-wand-magic-sparkles text-[14px]" /></div>
                <span className="text-[14px] text-[var(--aw-text-primary)] flex-1" style={{ fontWeight: 800 }}>{quickActionsTitle}</span>
                <button className="w-8 h-8 rounded-full border-none cursor-pointer bg-transparent text-[var(--aw-text-muted)]" onClick={() => setShowDrawer(false)}><i className="fa-solid fa-xmark" /></button>
              </div>

              {!drawerQA ? (
                <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto aw-scroll">
                  {mktQuickActions.map((qa, i) => (
                    <button key={i} className="flex items-center gap-2.5 px-3 py-3 rounded-xl border cursor-pointer text-[12px] text-[var(--aw-text-primary)] text-right" style={{ background: 'var(--aw-bg-hover)', borderColor: 'var(--aw-border)', fontWeight: 600 }} onClick={() => setDrawerQA(qa)}>
                      <i className={`${qa.icon} text-[13px]`} style={{ color: agentTeam === 'sales' ? '#10B981' : '#3B82F6' }} />
                      <span className="flex-1">{qa.label}</span>
                      <i className="fa-solid fa-chevron-left text-[10px] text-[var(--aw-text-muted)]" />
                    </button>
                  ))}
                </div>
              ) : (() => {
                const resp = SALES_AI_RESPONSES[drawerQA.label];
                return (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'var(--aw-bg-hover)' }}>
                      <i className="fa-solid fa-user text-[11px] text-[var(--aw-text-muted)]" /><span className="text-[12px] text-[var(--aw-text-secondary)]">{drawerQA.label}</span>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: agentTeam === 'sales' ? 'rgba(16,185,129,0.08)' : 'rgba(59,130,246,0.08)', border: `1px solid ${agentTeam === 'sales' ? 'rgba(16,185,129,0.25)' : 'rgba(59,130,246,0.25)'}` }}>
                      <p className="text-[12px] text-[var(--aw-text-secondary)] m-0 leading-6">{resp ? resp.text : 'تحلیل هوشمند آماده شد. (نمونه نمایشی)'}</p>
                    </div>
                    {resp && (
                      <button className="w-full py-2.5 rounded-xl border-none cursor-pointer text-white text-[13px]" style={{ background: agentTeam === 'sales' ? 'linear-gradient(135deg,#10B981,#047857)' : 'linear-gradient(135deg,#3B82F6,#1D4ED8)', fontWeight: 700 }} onClick={() => { setShowDrawer(false); setAdminScreen(resp.cta.screen as any); }}>
                        <i className={`${resp.cta.icon} ml-1.5`} />{resp.cta.label}
                      </button>
                    )}
                    <button className="w-full py-2 rounded-xl cursor-pointer text-[12px] bg-transparent" style={{ border: '1px solid var(--aw-border)', color: 'var(--aw-text-muted)', fontWeight: 600 }} onClick={() => setDrawerQA(null)}><i className="fa-solid fa-arrow-right ml-1" />بازگشت به اقدامات</button>
                  </div>
                );
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB button (draggable) */}
      {!isExpanded && (
        <motion.button
          ref={fabRef}
          className="fixed w-[64px] h-[64px] rounded-full border-none text-white cursor-grab active:cursor-grabbing z-[100] flex items-center justify-center touch-none"
          style={{
            bottom: fabBottom,
            left: fabLeft,
            background: isTalking
              ? 'linear-gradient(135deg, #00E676, #00C853)'
              : 'linear-gradient(135deg, #EC4899, #BE185D)',
            boxShadow: isTalking
              ? '0 4px 20px rgba(0,230,118,0.5)'
              : '0 4px 16px rgba(236,72,153,0.4)',
            fontWeight: 700,
            fontSize: 22,
            x: dragX,
            y: dragY,
          }}
          drag
          dragMomentum={false}
          dragElastic={0.1}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          initial={{ scale: 0, opacity: 0 }}
          animate={isTalking
            ? { scale: [1, 1.08, 1], opacity: 1 }
            : { scale: 1, opacity: 1 }
          }
          transition={isTalking
            ? { scale: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.35 } }
            : { delay: 0.1, duration: 0.35, ease: 'easeOut' }
          }
          whileHover={!isTalking && !isDragging ? { scale: 1.15, boxShadow: '0 6px 24px rgba(236,72,153,0.55)' } : {}}
          whileTap={!isTalking ? { scale: 0.95 } : {}}
          onClick={handleFabClick}
        >
          {isTalking ? (
            <i className="fa-solid fa-microphone text-[22px]" />
          ) : (
            role === 'admin' ? 'ن' : 'P'
          )}
          <span
            className="absolute -top-0.5 -left-0.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: 'var(--aw-bg-app)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
          >
            {isTalking ? (
              <motion.span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: '#00E676' }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            ) : (
              <i className="fa-solid fa-microphone text-[10px]" style={{ color: '#EC4899' }} />
            )}
          </span>
        </motion.button>
      )}

      {/* End call button — appears when talking (only when not expanded) */}
      <AnimatePresence>
        {isTalking && !isExpanded && (
          <motion.button
            className="fixed w-[36px] h-[36px] rounded-full border-none text-white cursor-pointer z-[100] flex items-center justify-center"
            style={{
              bottom: fabBottom,
              left: fabLeft + FAB_SIZE + 4,
              background: 'linear-gradient(135deg, #EF4444, #DC2626)',
              boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
            }}
            initial={{ scale: 0, opacity: 0, x: -20 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0, opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
            onClick={handleEndCall}
          >
            <i className="fa-solid fa-phone-slash text-[13px]" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}