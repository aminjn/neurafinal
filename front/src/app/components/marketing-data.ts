// ============================================================
// MARKETING AGENT — MOCK DATA (بازاریاب هوشمند)
// All marketing mock data lives here so components stay clean.
// ============================================================

export const MKT_BLUE = 'var(--aw-primary)';
export const MKT_GRAD = 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))';

// ---------- LEADS ----------
export type LeadStatus = 'hot' | 'warm' | 'cold';
export type FunnelStage = 'new' | 'contacted' | 'interested' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface LeadActivity {
  id: number;
  type: 'call' | 'message' | 'note' | 'email' | 'stage';
  text: string;
  date: string;
}

export interface Lead {
  id: number;
  name: string;
  company: string;
  field: string;
  phone: string;
  source: string;
  sourceIcon: string;
  status: LeadStatus;
  stage: FunnelStage;
  score: number;
  date: string;
  lastAction: string;
  owner: string;
  nextAction: string;
  followUp: string;
  segment: string;
  campaigns: string[];
  aiSuggestion: string;
  timeline: LeadActivity[];
  notes: string[];
}

export const MOCK_LEADS: Lead[] = [];

export const STATUS_META: Record<LeadStatus, { bg: string; color: string; label: string }> = {
  hot: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', label: 'گرم 🔥' },
  warm: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: 'نیمه‌گرم' },
  cold: { bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', label: 'سرد ❄️' },
};

export const FUNNEL_STAGES: { id: FunnelStage; label: string; color: string }[] = [
  { id: 'new', label: 'لید جدید', color: '#3B82F6' },
  { id: 'contacted', label: 'تماس اولیه', color: '#8B5CF6' },
  { id: 'interested', label: 'علاقه‌مند', color: '#06B6D4' },
  { id: 'proposal', label: 'ارسال پیشنهاد', color: '#F59E0B' },
  { id: 'negotiation', label: 'مذاکره', color: '#EC4899' },
  { id: 'won', label: 'تبدیل‌شده', color: '#10B981' },
  { id: 'lost', label: 'ازدست‌رفته', color: '#EF4444' },
];

// ---------- CONVERSATIONS ----------
export interface MktConversation {
  id: number;
  name: string;
  kind: 'lead' | 'customer' | 'ai' | 'team';
  kindLabel: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  priority: 'high' | 'normal';
}

export const MOCK_CONVERSATIONS: MktConversation[] = [];

// ---------- AI ACTIONS / APPROVALS ----------
export type RiskLevel = 'high' | 'medium' | 'low';
export type ActionStatus = 'pending' | 'approved' | 'rejected';
export interface AiAction {
  id: number;
  title: string;
  desc: string;
  type: string;
  typeIcon: string;
  date: string;
  priority: 'high' | 'normal';
  risk: RiskLevel;
  reason: string;
  expected: string;
  owner: string;
  preview: string;
  status?: ActionStatus;
}

export const ACTION_STATUS_META: Record<ActionStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: 'در انتظار', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: 'fa-solid fa-clock' },
  approved: { label: 'تأییدشده', color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: 'fa-solid fa-circle-check' },
  rejected: { label: 'ردشده', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: 'fa-solid fa-circle-xmark' },
};

export const MOCK_AI_ACTIONS: AiAction[] = [];

export const RISK_META: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  high: { label: 'ریسک بالا', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  medium: { label: 'ریسک متوسط', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  low: { label: 'ریسک پایین', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
};

// ---------- SEGMENTS ----------
export interface Segment {
  id: number;
  name: string;
  desc: string;
  size: string;
  growth: string;
  color: string;
  icon: string;
  penetration: number;
  conversion: string;
  engagement: string;
  value: string;
  updated: string;
  dataSource: string;
  rules: string[];
  campaigns: string[];
  overlap: { name: string; pct: number }[];
  aiSuggestion: string;
}

export const MOCK_SEGMENTS: Segment[] = [];

// ---------- PERSONAS ----------
export interface Persona {
  id: number;
  name: string;
  age: string;
  avatar: string;
  desc: string;
  color: string;
  goals: string[];
  pains: string[];
  channels: string[];
  suggestedMessage: string;
  relatedSegments: string[];
}

export const MOCK_PERSONAS: Persona[] = [];

// ---------- CAMPAIGNS ----------
export interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'social' | 'ads' | 'sms' | 'content';
  status: 'active' | 'paused' | 'completed' | 'draft';
  goal: string;
  segment: string;
  budget: string;
  spent: string;
  startDate: string;
  endDate: string;
  reach: string;
  clicks: string;
  conversions: string;
  cpa: string;
  revenue: string;
  roi: string;
  channel: string;
  owner: string;
}

export const MOCK_CAMPAIGNS: Campaign[] = [];

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  active: 'فعال', paused: 'متوقف', completed: 'تکمیل‌شده', draft: 'پیش‌نویس',
};
export const CAMPAIGN_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
  paused: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  completed: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
  draft: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
};
export const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  email: 'ایمیل مارکتینگ', social: 'شبکه اجتماعی', ads: 'تبلیغات کلیکی', sms: 'پیامک', content: 'بازاریابی محتوا',
};
export const CAMPAIGN_TYPE_ICONS: Record<string, string> = {
  email: 'fa-solid fa-envelope', social: 'fa-solid fa-share-nodes', ads: 'fa-solid fa-rectangle-ad', sms: 'fa-solid fa-comment-sms', content: 'fa-solid fa-pen-nib',
};

// ---------- CHARTS ----------
export const CONVERSION_DATA = [];
export const LEAD_GROWTH_DATA = [];
export const CHANNEL_DATA = [];
export const CAMPAIGN_PERFORMANCE_DATA = [];

// Funnel conversion data (for performance page)
export const FUNNEL_PERF = [];

// ---------- PERFORMANCE KPIs ----------
export interface KpiItem { label: string; value: string; change: string; icon: string; color: string; note: string; }
export const PERFORMANCE_KPIS: KpiItem[] = [];

export const TIME_FILTERS = [
  { id: 'today', label: 'امروز' },
  { id: 'week', label: 'این هفته' },
  { id: 'month', label: 'این ماه' },
  { id: 'quarter', label: 'سه ماه اخیر' },
];

export const PERFORMANCE_INSIGHT =
  'تحلیل بر پایهٔ داده‌های واقعیِ کمپین‌های شما نمایش داده می‌شود.';

// ---------- CALENDAR ----------
export interface CalendarEvent {
  id: number;
  title: string;
  type: 'email' | 'sms' | 'social' | 'meeting' | 'report' | 'followup' | 'event';
  date: string;
  day: number; // day of month
  time: string;
  color: string;
  icon: string;
}

export const CALENDAR_EVENTS: CalendarEvent[] = [];

export const CALENDAR_TYPE_LABELS: Record<string, string> = {
  email: 'ایمیل', sms: 'پیامک', social: 'شبکه اجتماعی', meeting: 'جلسه', report: 'گزارش', followup: 'پیگیری', event: 'مناسبت',
};

// ---------- AI QUICK ACTIONS (contextual, per screen) ----------
export const MKT_QUICK_ACTIONS: Record<string, { icon: string; label: string }[]> = {
  mktConversationsScreen: [
    { icon: 'fa-solid fa-inbox', label: 'گفتگوهای نیازمند پاسخ را نشان بده' },
    { icon: 'fa-solid fa-pen', label: 'برای این پیام پاسخ بنویس' },
    { icon: 'fa-solid fa-circle-check', label: 'اقدامات نیازمند تأیید را نمایش بده' },
  ],
  mktLeadsScreen: [
    { icon: 'fa-solid fa-fire', label: 'لیدهای داغ امروز را نشان بده' },
    { icon: 'fa-solid fa-bell-slash', label: 'لیدهای بدون پیگیری را پیدا کن' },
    { icon: 'fa-solid fa-snowflake', label: 'برای لیدهای سرد برنامه فعال‌سازی بده' },
    { icon: 'fa-solid fa-comment-dots', label: 'برای این لید پیام آماده کن' },
    { icon: 'fa-solid fa-arrow-right', label: 'اقدام بعدی این لید را پیشنهاد بده' },
  ],
  campaignScreen: [
    { icon: 'fa-solid fa-wand-magic-sparkles', label: 'کمپین جدید طراحی کن' },
    { icon: 'fa-solid fa-magnifying-glass-chart', label: 'کمپین‌های ضعیف را تحلیل کن' },
    { icon: 'fa-solid fa-scale-balanced', label: 'بودجه کمپین‌ها را بهینه کن' },
    { icon: 'fa-solid fa-pen-nib', label: 'متن تبلیغاتی تولید کن' },
    { icon: 'fa-solid fa-layer-group', label: 'سگمنت مناسب این کمپین را پیشنهاد بده' },
  ],
  mktSegmentScreen: [
    { icon: 'fa-solid fa-layer-group', label: 'سگمنت جدید پیشنهاد بده' },
    { icon: 'fa-solid fa-user-tag', label: 'پرسونا بساز' },
    { icon: 'fa-solid fa-star', label: 'سگمنت‌های پربازده را نشان بده' },
    { icon: 'fa-solid fa-clone', label: 'هم‌پوشانی سگمنت‌ها را تحلیل کن' },
  ],
  mktPerformanceScreen: [
    { icon: 'fa-solid fa-calendar-day', label: 'عملکرد ماه را خلاصه کن' },
    { icon: 'fa-solid fa-triangle-exclamation', label: 'مشکل اصلی را پیدا کن' },
    { icon: 'fa-solid fa-trophy', label: 'بهترین کمپین را نمایش بده' },
    { icon: 'fa-solid fa-lightbulb', label: 'برای ماه بعد پیشنهاد بده' },
    { icon: 'fa-solid fa-file-lines', label: 'گزارش مدیریتی آماده کن' },
  ],
};
