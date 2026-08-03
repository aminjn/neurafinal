// Shared async-state UI for marketing screens (loading / skeleton / empty / error / retry)
import React from 'react';
import { motion } from 'motion/react';
import type { AsyncStatus } from '../services/marketing/types';
import { MKT_BLUE } from './marketing-data';

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2 px-4 pt-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-3 rounded-[14px] border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full skeleton-pulse" />
            <div className="flex-1">
              <div className="h-3 w-2/3 rounded skeleton-pulse mb-2" />
              <div className="h-2.5 w-1/3 rounded skeleton-pulse" />
            </div>
          </div>
        </div>
      ))}
      <style>{`.skeleton-pulse{background:linear-gradient(90deg,var(--aw-bg-hover) 25%,var(--aw-bg-card-hover,rgba(255,255,255,0.06)) 37%,var(--aw-bg-hover) 63%);background-size:400% 100%;animation:mktsk 1.2s ease-in-out infinite}@keyframes mktsk{0%{background-position:100% 0}100%{background-position:0 0}}`}</style>
    </div>
  );
}

export function EmptyState({ icon = 'fa-solid fa-inbox', title, hint, ctaLabel, onCta }: { icon?: string; title: string; hint?: string; ctaLabel?: string; onCta?: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(59,130,246,0.1)' }}>
        <i className={`${icon} text-[26px]`} style={{ color: MKT_BLUE }} />
      </div>
      <div className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{title}</div>
      {hint && <div className="text-[12px] text-[var(--aw-text-muted)] mt-1 max-w-[260px]">{hint}</div>}
      {ctaLabel && onCta && (
        <button className="mt-4 px-4 py-2 rounded-xl border-none cursor-pointer text-white text-[12px]" style={{ background: MKT_BLUE, fontWeight: 600 }} onClick={onCta}>{ctaLabel}</button>
      )}
    </motion.div>
  );
}

export function ErrorState({ status, message, onRetry }: { status: AsyncStatus; message?: string; onRetry: () => void }) {
  const isOffline = status === 'offline';
  const isPerm = status === 'permission-denied' || status === 'unauthorized';
  const icon = isOffline ? 'fa-solid fa-wifi' : isPerm ? 'fa-solid fa-lock' : 'fa-solid fa-triangle-exclamation';
  const color = isPerm ? '#F59E0B' : '#EF4444';
  const title = isOffline ? 'اتصال برقرار نیست' : isPerm ? 'دسترسی محدود' : 'خطا در بارگذاری';
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background: `${color}1a` }}>
        <i className={`${icon} text-[26px]`} style={{ color }} />
      </div>
      <div className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{title}</div>
      {message && <div className="text-[12px] text-[var(--aw-text-muted)] mt-1 max-w-[280px]">{message}</div>}
      {!isPerm && (
        <button className="mt-4 px-4 py-2 rounded-xl border-none cursor-pointer text-white text-[12px]" style={{ background: color, fontWeight: 600 }} onClick={onRetry}>
          <i className="fa-solid fa-rotate-right ml-1.5" />تلاش مجدد
        </button>
      )}
    </motion.div>
  );
}

/** Renders the right state for a collection, or children on success. */
export function StateGate({ status, error, onRetry, empty, children }: {
  status: AsyncStatus; error?: string; onRetry: () => void; empty: React.ReactNode; children: React.ReactNode;
}) {
  if (status === 'loading') return <Skeleton />;
  if (status === 'empty') return <>{empty}</>;
  if (status === 'error' || status === 'offline' || status === 'permission-denied' || status === 'unauthorized')
    return <ErrorState status={status} message={error} onRetry={onRetry} />;
  return <>{children}</>;
}
