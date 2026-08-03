// ============================================================
// MARKETING AGENT — TYPE DEFINITIONS
// Canonical TS types for the marketing agent domain.
// Base entity shapes are re-exported from the seed data module
// and extended here with operation/service-level types.
// ============================================================
export type {
  Lead, LeadStatus, FunnelStage, LeadActivity,
  Campaign, Segment, Persona, AiAction, RiskLevel,
  MktConversation, CalendarEvent, KpiItem,
} from '../../components/marketing-data';

import type {
  Lead, FunnelStage, Campaign, Segment, Persona, AiAction,
  MktConversation, CalendarEvent, KpiItem,
} from '../../components/marketing-data';

// ---- Aliases requested by spec ----
export type LeadStage = FunnelStage;
export type LeadTemperature = 'hot' | 'warm' | 'cold';
export type LeadScore = number;
export type LeadTimelineEvent = import('../../components/marketing-data').LeadActivity;
export type MarketingConversation = MktConversation;
export type AudienceSegment = Segment;
export type MarketingApproval = AiAction;
export type MarketingCalendarEvent = CalendarEvent;
export type MarketingAIAction = AiAction;
export type MarketingKPI = KpiItem;

export type CampaignStatus = Campaign['status'];
export type CampaignChannel = string;
export type CampaignGoal = string;
export type MarketingApprovalStatus = 'pending' | 'approved' | 'rejected' | 'edited';

export interface MarketingMessage {
  id: number;
  conversationId: number;
  from: 'me' | 'them' | 'ai';
  text: string;
  time: string;
}

export interface FollowUp {
  id: number;
  leadId: number;
  title: string;
  due: string;
  done: boolean;
}

export interface CampaignPerformance {
  reach: string;
  clicks: string;
  conversions: string;
  roi: string;
}

export interface AudienceRule {
  field: string;
  op: string;
  value: string;
}

export interface MarketingPerformance {
  kpis: MarketingKPI[];
  insight: string;
}

export interface MarketingInsight {
  text: string;
  generatedAt: string;
}

// ---- Approval log entry ----
export interface ApprovalLogEntry {
  id: number;
  approvalId: number;
  action: 'approved' | 'rejected' | 'edited' | 'viewed';
  actor: string;
  at: string;
  note?: string;
}

// ---- Async state machine ----
export type AsyncStatus =
  | 'idle' | 'loading' | 'success' | 'empty' | 'error'
  | 'saving' | 'saved' | 'validation-error'
  | 'unauthorized' | 'permission-denied' | 'offline';

export interface AsyncState<T> {
  status: AsyncStatus;
  data: T;
  error?: string;
}

// ---- Mock scenarios ----
export type MockScenario =
  | 'default'
  | 'empty-leads'
  | 'high-priority-leads'
  | 'campaign-failed'
  | 'campaign-pending-approval'
  | 'budget-warning'
  | 'no-conversations'
  | 'ai-error'
  | 'network-error'
  | 'permission-denied';

// ---- Service interfaces ----
export interface MarketingConversationService {
  list(): Promise<MarketingConversation[]>;
  get(id: number): Promise<MarketingConversation | undefined>;
  create(c: Partial<MarketingConversation>): Promise<MarketingConversation>;
  markRead(id: number): Promise<void>;
}

export interface LeadService {
  list(): Promise<Lead[]>;
  get(id: number): Promise<Lead | undefined>;
  create(l: Partial<Lead>): Promise<Lead>;
  update(id: number, patch: Partial<Lead>): Promise<Lead>;
  remove(id: number): Promise<void>;
  addNote(id: number, note: string): Promise<Lead>;
  addFollowUp(id: number, title: string, due: string): Promise<Lead>;
  setStage(id: number, stage: LeadStage): Promise<Lead>;
  setScore(id: number, score: LeadScore): Promise<Lead>;
  timeline(id: number): Promise<LeadTimelineEvent[]>;
}

export interface CampaignService {
  list(): Promise<Campaign[]>;
  get(id: string): Promise<Campaign | undefined>;
  create(c: Partial<Campaign>): Promise<Campaign>;
  update(id: string, patch: Partial<Campaign>): Promise<Campaign>;
  publish(id: string): Promise<Campaign>;
  pause(id: string): Promise<Campaign>;
  resume(id: string): Promise<Campaign>;
  duplicate(id: string): Promise<Campaign>;
  increaseBudget(id: string, amount: string): Promise<Campaign>;
}

export interface AudienceService {
  list(): Promise<Segment[]>;
  get(id: number): Promise<Segment | undefined>;
  create(s: Partial<Segment>): Promise<Segment>;
  update(id: number, patch: Partial<Segment>): Promise<Segment>;
  duplicate(id: number): Promise<Segment>;
}

export interface PersonaService {
  list(): Promise<Persona[]>;
  create(p: Partial<Persona>): Promise<Persona>;
}

export interface MarketingPerformanceService {
  get(range: string): Promise<MarketingPerformance>;
}

export interface MarketingApprovalService {
  list(): Promise<MarketingApproval[]>;
  approve(id: number, actor: string): Promise<void>;
  reject(id: number, actor: string): Promise<void>;
  update(id: number, patch: Partial<MarketingApproval>): Promise<MarketingApproval>;
  log(): Promise<ApprovalLogEntry[]>;
}

export interface MarketingCalendarService {
  list(): Promise<MarketingCalendarEvent[]>;
  create(e: Partial<MarketingCalendarEvent>): Promise<MarketingCalendarEvent>;
  update(id: number, patch: Partial<MarketingCalendarEvent>): Promise<MarketingCalendarEvent>;
  remove(id: number): Promise<void>;
}

export interface MarketingAIService {
  generate(kind: string, payload?: any): Promise<MarketingInsight>;
}

export interface MarketingAgentService {
  conversations: MarketingConversationService;
  leads: LeadService;
  campaigns: CampaignService;
  audiences: AudienceService;
  personas: PersonaService;
  performance: MarketingPerformanceService;
  approvals: MarketingApprovalService;
  calendar: MarketingCalendarService;
  ai: MarketingAIService;
}
