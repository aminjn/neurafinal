import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './components/app-context';
import AdminPanel from './components/admin-panel';
import EndUserPanel from './components/end-user-panel';
import ChatOverlay from './components/chat-overlay';
import { ModalOverlay, CallOverlay, UnifiedCallModal, Toast } from './components/overlays';
import FloatingMicFAB from './components/floating-mic-fab';
import { SplashScreen, HomeScreen, AuthScreen } from './components/auth-flow';
import { MarketingProvider } from './components/marketing-context';

function AppContent() {
  const { role, theme, appStage } = useApp();

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.style.background = 'var(--aw-bg-app)';
    document.body.style.color = 'var(--aw-text-primary)';
  }, [theme]);

  // Messenger-style keyboard handling: map the app to the *visual* viewport so
  // that when the on-screen keyboard opens, the whole UI sits above it (the
  // input bar stays visible and the view shifts up) instead of the chat shrinking.
  const appRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const el = appRef.current;
    if (!el) return;
    const apply = () => {
      el.style.height = vv.height + 'px';
      // Always set a transform so this element establishes a containing block —
      // fixed-positioned descendants (the chat sheet) then map to the visible
      // area above the keyboard instead of the full layout viewport.
      el.style.transform = `translateY(${vv.offsetTop || 0}px)`;
    };
    apply();
    vv.addEventListener('resize', apply);
    vv.addEventListener('scroll', apply);
    return () => {
      vv.removeEventListener('resize', apply);
      vv.removeEventListener('scroll', apply);
    };
  }, []);

  return (
    <div
      ref={appRef}
      className={`aw-app mx-auto relative overflow-hidden ${role === 'admin' ? 'neura-admin' : ''}`}
      dir="rtl"
      data-theme={theme}
      style={{
        height: '100dvh',
        background: (theme === 'glass' || theme === 'dark') ? 'transparent' : 'var(--aw-bg-app)',
        fontFamily: "'Kamand', 'Vazirmatn', 'IRANSans', system-ui, sans-serif",
        color: 'var(--aw-text-primary)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {(theme === 'glass' || theme === 'dark') && (
        <div className={`aw-glass-bg ${role === 'admin' ? 'admin-bg' : ''}`} aria-hidden>
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
          <div className="blob blob-4" />
          <div className="blob blob-5" />
          <div className="blob blob-6" />
        </div>
      )}
      {appStage !== 'app' ? (
        <AnimatePresence mode="wait">
          <motion.div key={appStage} className="h-full relative z-10"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            {appStage === 'splash' ? <SplashScreen /> : appStage === 'home' ? <HomeScreen /> : <AuthScreen />}
          </motion.div>
        </AnimatePresence>
      ) : (
      <AnimatePresence mode="wait">
        {role === 'admin' ? (
          <motion.div
            key="admin"
            className="h-full relative z-10"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <AdminPanel />
          </motion.div>
        ) : (
          <motion.div
            key="user"
            className="h-full relative z-10"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <EndUserPanel />
          </motion.div>
        )}
      </AnimatePresence>
      )}
      <ChatOverlay />
      <ModalOverlay />
      <CallOverlay />
      <UnifiedCallModal />
      <Toast />
      <FloatingMicFAB />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MarketingProvider>
        <AppContent />
      </MarketingProvider>
    </AppProvider>
  );
}