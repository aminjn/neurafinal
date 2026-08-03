// ============================================================
// MARKETING AGENT — DATA CONTEXT
// Drives all marketing screens via the MarketingAgentService.
// Owns async state (loading/empty/error/saving) + mutations with
// confirmation guardrails for sensitive operations.
// ============================================================
import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useApp } from './app-context';
import { marketingService, IS_MOCK_MODE } from '../services/marketing/marketingService';
import { resolveScenario } from '../services/marketing/marketing.mock';
import { requiresConfirmation, type SensitiveOp, SENSITIVE_OPS } from '../services/marketing/permissions';
import type {
  Lead, Campaign, Segment, Persona, MktConversation, AiAction, CalendarEvent,
  MarketingPerformance, AsyncStatus, LeadStage, MockScenario,
} from '../services/marketing/types';

interface Coll<T> { data: T; status: AsyncStatus; error?: string; }

interface MarketingCtx {
  scenario: MockScenario;
  isMock: boolean;
  conversations: Coll<MktConversation[]>;
  leads: Coll<Lead[]>;
  campaigns: Coll<Campaign[]>;
  segments: Coll<Segment[]>;
  personas: Coll<Persona[]>;
  approvals: Coll<AiAction[]>;
  calendar: Coll<CalendarEvent[]>;
  performance: Coll<MarketingPerformance | null>;
  reload: (which?: string) => void;
  setScenario: (s: MockScenario) => void;
  // mutations
  svc: typeof marketingService;
  run: <T>(label: string, fn: () => Promise<T>, after?: () => void) => Promise<T | undefined>;
  confirmSensitive: (op: SensitiveOp, onConfirm: () => void) => void;
}

const Ctx = createContext<MarketingCtx | null>(null);
export const useMarketing = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useMarketing must be used within MarketingProvider');
  return c;
};

const empty = <T,>(d: T): Coll<T> => ({ data: d, status: 'loading' });

export function MarketingProvider({ children }: { children: React.ReactNode }) {
  const { openModal, closeModal, showToast } = useApp();
  const scenario = resolveScenario();

  const [conversations, setConversations] = useState<Coll<MktConversation[]>>(empty([]));
  const [leads, setLeads] = useState<Coll<Lead[]>>(empty([]));
  const [campaigns, setCampaigns] = useState<Coll<Campaign[]>>(empty([]));
  const [segments, setSegments] = useState<Coll<Segment[]>>(empty([]));
  const [personas, setPersonas] = useState<Coll<Persona[]>>(empty([]));
  const [approvals, setApprovals] = useState<Coll<AiAction[]>>(empty([]));
  const [calendar, setCalendar] = useState<Coll<CalendarEvent[]>>(empty([]));
  const [performance, setPerformance] = useState<Coll<MarketingPerformance | null>>(empty(null));

  const fetchInto = useCallback(async function <T>(
    setter: React.Dispatch<React.SetStateAction<Coll<T>>>,
    fn: () => Promise<T>,
    isEmpty: (d: T) => boolean,
  ) {
    setter(prev => ({ ...prev, status: 'loading', error: undefined }));
    try {
      const data = await fn();
      setter({ data, status: isEmpty(data) ? 'empty' : 'success' });
    } catch (e: any) {
      const msg = e?.message || 'خطا';
      const status: AsyncStatus = e?.code === 'PERMISSION' ? 'permission-denied' : e?.code === 'NETWORK' ? 'offline' : 'error';
      setter(prev => ({ ...prev, status, error: msg }));
    }
  }, []);

  const loadConversations = useCallback(() => fetchInto(setConversations, () => marketingService.conversations.list(), d => d.length === 0), [fetchInto]);
  const loadLeads = useCallback(() => fetchInto(setLeads, () => marketingService.leads.list(), d => d.length === 0), [fetchInto]);
  const loadCampaigns = useCallback(() => fetchInto(setCampaigns, () => marketingService.campaigns.list(), d => d.length === 0), [fetchInto]);
  const loadSegments = useCallback(() => fetchInto(setSegments, () => marketingService.audiences.list(), d => d.length === 0), [fetchInto]);
  const loadPersonas = useCallback(() => fetchInto(setPersonas, () => marketingService.personas.list(), d => d.length === 0), [fetchInto]);
  const loadApprovals = useCallback(() => fetchInto(setApprovals, () => marketingService.approvals.list(), d => d.length === 0), [fetchInto]);
  const loadCalendar = useCallback(() => fetchInto(setCalendar, () => marketingService.calendar.list(), d => d.length === 0), [fetchInto]);
  const loadPerformance = useCallback(() => fetchInto(setPerformance, () => marketingService.performance.get('month'), d => !d), [fetchInto]);

  const reload = useCallback((which?: string) => {
    if (!which || which === 'conversations') loadConversations();
    if (!which || which === 'leads') loadLeads();
    if (!which || which === 'campaigns') loadCampaigns();
    if (!which || which === 'segments') loadSegments();
    if (!which || which === 'personas') loadPersonas();
    if (!which || which === 'approvals') loadApprovals();
    if (!which || which === 'calendar') loadCalendar();
    if (!which || which === 'performance') loadPerformance();
  }, [loadConversations, loadLeads, loadCampaigns, loadSegments, loadPersonas, loadApprovals, loadCalendar, loadPerformance]);

  useEffect(() => { reload(); }, [reload]);

  // Generic mutation runner with saving/saved/error toasts
  const run = useCallback(async function <T>(label: string, fn: () => Promise<T>, after?: () => void) {
    showToast(`در حال ${label}...`);
    try {
      const res = await fn();
      showToast(`${label} انجام شد ✅`);
      after?.();
      return res;
    } catch (e: any) {
      const msg = e?.code === 'PERMISSION' ? 'دسترسی لازم را ندارید'
        : e?.code === 'NETWORK' ? 'خطای شبکه — دوباره تلاش کنید'
        : (e?.message || 'خطا در انجام عملیات');
      showToast(`❌ ${msg}`);
      return undefined;
    }
  }, [showToast]);

  const confirmSensitive = useCallback((op: SensitiveOp, onConfirm: () => void) => {
    if (!requiresConfirmation(op)) { onConfirm(); return; }
    openModal('تأیید اقدام حساس', (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[13px]" style={{ color: '#F59E0B' }}>
          <i className="fa-solid fa-shield-halved" />
          <span style={{ fontWeight: 700 }}>این عملیات نیازمند تأیید انسانی است</span>
        </div>
        <p className="text-[13px] text-[var(--aw-text-secondary)] m-0 leading-6">
          عملیات «{SENSITIVE_OPS[op]}» جزو اقدامات حساس است. هوش مصنوعی مجاز به اجرای خودکار آن نیست و باید توسط شما تأیید شود.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button className="py-2.5 rounded-[10px] border-none cursor-pointer text-[13px] text-white" style={{ background: '#10B981', fontWeight: 700 }} onClick={() => { closeModal(); onConfirm(); }}>
            <i className="fa-solid fa-check ml-1" />تأیید و اجرا
          </button>
          <button className="py-2.5 rounded-[10px] cursor-pointer text-[13px] bg-transparent" style={{ border: '1px solid var(--aw-border)', color: 'var(--aw-text-muted)', fontWeight: 700 }} onClick={closeModal}>
            انصراف
          </button>
        </div>
      </div>
    ));
  }, [openModal, closeModal]);

  const setScenario = useCallback((s: MockScenario) => {
    try { localStorage.setItem('MARKETING_MOCK_SCENARIO', s); } catch { /* ignore */ }
    // service reads the scenario at module init, so a reload applies it cleanly
    try { location.reload(); } catch { /* ignore */ }
  }, []);

  const value: MarketingCtx = {
    scenario, isMock: IS_MOCK_MODE,
    conversations, leads, campaigns, segments, personas, approvals, calendar, performance,
    reload, setScenario, svc: marketingService, run, confirmSensitive,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
