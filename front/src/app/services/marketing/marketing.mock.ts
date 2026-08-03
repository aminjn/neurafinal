// ============================================================
// MARKETING AGENT — MOCK SERVICE (Repository)
// In-memory + localStorage backed. Honors MARKETING_MOCK_SCENARIO.
// Mutations persist across refresh. Injects latency/errors per
// scenario for QA. NEVER used as a silent fallback for the real API.
// ============================================================
import type {
  MarketingAgentService, MockScenario, Lead, Campaign, Segment, Persona,
  MktConversation, AiAction, CalendarEvent, MarketingPerformance,
  ApprovalLogEntry, MarketingInsight, LeadStage, LeadScore,
} from './types';
import { leadsSeed } from '../../mocks/marketing/leads.mock';
import { conversationsSeed } from '../../mocks/marketing/conversations.mock';
import { campaignsSeed } from '../../mocks/marketing/campaigns.mock';
import { segmentsSeed, personasSeed } from '../../mocks/marketing/audiences.mock';
import { performanceSeed } from '../../mocks/marketing/performance.mock';
import { approvalsSeed } from '../../mocks/marketing/approvals.mock';
import { calendarSeed } from '../../mocks/marketing/calendar.mock';
import { FUNNEL_STAGES } from '../../components/marketing-data';

// ---- scenario resolution ----
export function resolveScenario(): MockScenario {
  let s: string | null = null;
  try { s = localStorage.getItem('MARKETING_MOCK_SCENARIO'); } catch { /* ignore */ }
  if (!s) {
    // Vite exposes import.meta.env.VITE_* (guarded — not available in all bundlers)
    try {
      const g: any = (0, eval)('typeof import.meta !== "undefined" ? import.meta : undefined');
      s = g?.env?.VITE_MARKETING_MOCK_SCENARIO || null;
    } catch { /* ignore */ }
  }
  return (s as MockScenario) || 'default';
}

const delay = (ms = 350) => new Promise(res => setTimeout(res, ms));

class MockError extends Error {
  code: string;
  constructor(code: string, msg: string) { super(msg); this.code = code; }
}

// ---- persistence ----
const KEY = (col: string, sc: MockScenario) => `neura_mkt::${sc}::${col}`;

function load<T>(col: string, sc: MockScenario, seed: () => T): T {
  try {
    const raw = localStorage.getItem(KEY(col, sc));
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  const data = seed();
  try { localStorage.setItem(KEY(col, sc), JSON.stringify(data)); } catch { /* ignore */ }
  return data;
}

function save<T>(col: string, sc: MockScenario, data: T): void {
  try { localStorage.setItem(KEY(col, sc), JSON.stringify(data)); } catch { /* ignore */ }
}

function guardNetwork(sc: MockScenario) {
  if (sc === 'network-error') throw new MockError('NETWORK', 'خطای شبکه — اتصال برقرار نشد');
}
function guardPermission(sc: MockScenario) {
  if (sc === 'permission-denied') throw new MockError('PERMISSION', 'دسترسی لازم برای این عملیات را ندارید');
}

const nextId = (arr: { id: number | string }[]) =>
  (arr.reduce((m, x) => Math.max(m, typeof x.id === 'number' ? x.id : 0), 0) || 0) + 1;

export function createMockService(): MarketingAgentService {
  const sc = resolveScenario();

  return {
    conversations: {
      async list() { await delay(); guardNetwork(sc); return load<MktConversation[]>('conversations', sc, () => conversationsSeed(sc)); },
      async get(id) { await delay(150); return (load<MktConversation[]>('conversations', sc, () => conversationsSeed(sc))).find(c => c.id === id); },
      async create(c) {
        await delay(); guardNetwork(sc); guardPermission(sc);
        const arr = load<MktConversation[]>('conversations', sc, () => conversationsSeed(sc));
        const item: MktConversation = { id: nextId(arr), name: c.name || 'گفتگوی جدید', kind: c.kind || 'lead', kindLabel: c.kindLabel || 'لید', avatar: (c.name || 'گ')[0], lastMessage: c.lastMessage || '', time: 'هم‌اکنون', unread: false, priority: c.priority || 'normal' };
        arr.unshift(item); save('conversations', sc, arr); return item;
      },
      async markRead(id) {
        await delay(120);
        const arr = load<MktConversation[]>('conversations', sc, () => conversationsSeed(sc));
        const c = arr.find(x => x.id === id); if (c) c.unread = false; save('conversations', sc, arr);
      },
    },

    leads: {
      async list() { await delay(); guardNetwork(sc); return load<Lead[]>('leads', sc, () => leadsSeed(sc)); },
      async get(id) { await delay(150); return (load<Lead[]>('leads', sc, () => leadsSeed(sc))).find(l => l.id === id); },
      async create(l) {
        await delay(); guardNetwork(sc); guardPermission(sc);
        const arr = load<Lead[]>('leads', sc, () => leadsSeed(sc));
        const item: Lead = {
          id: nextId(arr), name: l.name || 'لید جدید', company: l.company || '—', field: l.field || '—',
          phone: l.phone || '', source: l.source || 'دستی', sourceIcon: 'fa-solid fa-user-plus',
          status: l.status || 'warm', stage: l.stage || 'new', score: l.score ?? 50, date: 'امروز',
          lastAction: 'ایجاد دستی', owner: l.owner || 'تیم بازاریابی', nextAction: l.nextAction || 'تماس اولیه',
          followUp: l.followUp || 'این هفته', segment: l.segment || '—', campaigns: [], aiSuggestion: 'لید جدید ثبت شد. تماس اولیه را برنامه‌ریزی کنید.',
          timeline: [{ id: 1, type: 'note', text: 'لید ایجاد شد', date: 'امروز' }], notes: [],
        };
        arr.unshift(item); save('leads', sc, arr); return item;
      },
      async update(id, patch) {
        await delay(); guardNetwork(sc); guardPermission(sc);
        const arr = load<Lead[]>('leads', sc, () => leadsSeed(sc));
        const i = arr.findIndex(l => l.id === id); if (i < 0) throw new MockError('NOT_FOUND', 'لید یافت نشد');
        arr[i] = { ...arr[i], ...patch }; save('leads', sc, arr); return arr[i];
      },
      async remove(id) {
        await delay(); guardNetwork(sc); guardPermission(sc);
        const arr = load<Lead[]>('leads', sc, () => leadsSeed(sc));
        save('leads', sc, arr.filter(l => l.id !== id));
      },
      async addNote(id, note) {
        await delay(); const arr = load<Lead[]>('leads', sc, () => leadsSeed(sc));
        const l = arr.find(x => x.id === id)!; l.notes = [...l.notes, note];
        l.timeline = [{ id: nextId(l.timeline), type: 'note', text: note, date: 'هم‌اکنون' }, ...l.timeline];
        save('leads', sc, arr); return l;
      },
      async addFollowUp(id, title, due) {
        await delay(); const arr = load<Lead[]>('leads', sc, () => leadsSeed(sc));
        const l = arr.find(x => x.id === id)!; l.followUp = due;
        l.timeline = [{ id: nextId(l.timeline), type: 'note', text: `پیگیری: ${title} (${due})`, date: 'هم‌اکنون' }, ...l.timeline];
        save('leads', sc, arr); return l;
      },
      async setStage(id, stage: LeadStage) {
        await delay(); guardNetwork(sc); const arr = load<Lead[]>('leads', sc, () => leadsSeed(sc));
        const l = arr.find(x => x.id === id)!; l.stage = stage;
        const label = FUNNEL_STAGES.find(s => s.id === stage)?.label || stage;
        l.timeline = [{ id: nextId(l.timeline), type: 'stage', text: `انتقال به مرحله «${label}»`, date: 'هم‌اکنون' }, ...l.timeline];
        save('leads', sc, arr); return l;
      },
      async setScore(id, score: LeadScore) {
        await delay(); guardPermission(sc); const arr = load<Lead[]>('leads', sc, () => leadsSeed(sc));
        const l = arr.find(x => x.id === id)!; l.score = score; save('leads', sc, arr); return l;
      },
      async timeline(id) {
        await delay(150); const arr = load<Lead[]>('leads', sc, () => leadsSeed(sc));
        return arr.find(x => x.id === id)?.timeline || [];
      },
    },

    campaigns: {
      async list() { await delay(); guardNetwork(sc); return load<Campaign[]>('campaigns', sc, () => campaignsSeed(sc)); },
      async get(id) { await delay(150); return (load<Campaign[]>('campaigns', sc, () => campaignsSeed(sc))).find(c => c.id === id); },
      async create(c) {
        await delay(); guardNetwork(sc); guardPermission(sc);
        const arr = load<Campaign[]>('campaigns', sc, () => campaignsSeed(sc));
        const item: Campaign = {
          id: 'c' + Date.now(), name: c.name || 'کمپین جدید', type: c.type || 'social', status: c.status || 'draft',
          goal: c.goal || 'جذب لید', segment: c.segment || '—', budget: c.budget || '۰', spent: '۰',
          startDate: c.startDate || '—', endDate: c.endDate || '—', reach: '—', clicks: '—', conversions: '—',
          cpa: '—', revenue: '—', roi: '—', channel: c.channel || '—', owner: c.owner || 'تیم بازاریابی',
        };
        arr.unshift(item); save('campaigns', sc, arr); return item;
      },
      async update(id, patch) {
        await delay(); guardPermission(sc); const arr = load<Campaign[]>('campaigns', sc, () => campaignsSeed(sc));
        const i = arr.findIndex(c => c.id === id); arr[i] = { ...arr[i], ...patch }; save('campaigns', sc, arr); return arr[i];
      },
      async publish(id) { return this.update(id, { status: 'active' }); },
      async pause(id) { return this.update(id, { status: 'paused' }); },
      async resume(id) { return this.update(id, { status: 'active' }); },
      async duplicate(id) {
        await delay(); const arr = load<Campaign[]>('campaigns', sc, () => campaignsSeed(sc));
        const src = arr.find(c => c.id === id)!; const copy: Campaign = { ...src, id: 'c' + Date.now(), name: src.name + ' (کپی)', status: 'draft', spent: '۰' };
        arr.unshift(copy); save('campaigns', sc, arr); return copy;
      },
      async increaseBudget(id, amount) {
        await delay(); guardPermission(sc); const arr = load<Campaign[]>('campaigns', sc, () => campaignsSeed(sc));
        const c = arr.find(x => x.id === id)!; c.budget = amount; save('campaigns', sc, arr); return c;
      },
    },

    audiences: {
      async list() { await delay(); guardNetwork(sc); return load<Segment[]>('segments', sc, () => segmentsSeed(sc)); },
      async get(id) { await delay(150); return (load<Segment[]>('segments', sc, () => segmentsSeed(sc))).find(s => s.id === id); },
      async create(s) {
        await delay(); guardPermission(sc); const arr = load<Segment[]>('segments', sc, () => segmentsSeed(sc));
        const item: Segment = {
          id: nextId(arr), name: s.name || 'سگمنت جدید', desc: s.desc || '—', size: s.size || '۰', growth: '+۰%',
          color: s.color || '#3B82F6', icon: 'fa-solid fa-layer-group', penetration: 0, conversion: '۰٪', engagement: '۰٪',
          value: '۰', updated: 'امروز', dataSource: s.dataSource || 'دستی', rules: s.rules || [], campaigns: [], overlap: [],
          aiSuggestion: 'سگمنت جدید ایجاد شد.',
        };
        arr.unshift(item); save('segments', sc, arr); return item;
      },
      async update(id, patch) {
        await delay(); const arr = load<Segment[]>('segments', sc, () => segmentsSeed(sc));
        const i = arr.findIndex(s => s.id === id); arr[i] = { ...arr[i], ...patch }; save('segments', sc, arr); return arr[i];
      },
      async duplicate(id) {
        await delay(); const arr = load<Segment[]>('segments', sc, () => segmentsSeed(sc));
        const src = arr.find(s => s.id === id)!; const copy: Segment = { ...src, id: nextId(arr), name: src.name + ' (کپی)' };
        arr.unshift(copy); save('segments', sc, arr); return copy;
      },
    },

    personas: {
      async list() { await delay(); guardNetwork(sc); return load<Persona[]>('personas', sc, () => personasSeed(sc)); },
      async create(p) {
        await delay(); const arr = load<Persona[]>('personas', sc, () => personasSeed(sc));
        const item: Persona = {
          id: nextId(arr), name: p.name || 'پرسونای جدید', age: p.age || '—', avatar: p.avatar || '🧑',
          desc: p.desc || '—', color: '#8B5CF6', goals: p.goals || [], pains: p.pains || [], channels: p.channels || [],
          suggestedMessage: p.suggestedMessage || '', relatedSegments: p.relatedSegments || [],
        };
        arr.unshift(item); save('personas', sc, arr); return item;
      },
    },

    performance: {
      async get(_range) { await delay(); guardNetwork(sc); return performanceSeed(sc) as MarketingPerformance; },
    },

    approvals: {
      async list() { await delay(); guardNetwork(sc); return load<AiAction[]>('approvals_v2', sc, () => approvalsSeed(sc)); },
      async approve(id, actor) {
        await delay(); guardPermission(sc);
        const arr = load<AiAction[]>('approvals_v2', sc, () => approvalsSeed(sc));
        save('approvals_v2', sc, arr.map(a => a.id === id ? { ...a, status: 'approved' } : a));
        appendLog(sc, { approvalId: id, action: 'approved', actor });
      },
      async reject(id, actor) {
        await delay();
        const arr = load<AiAction[]>('approvals_v2', sc, () => approvalsSeed(sc));
        save('approvals_v2', sc, arr.map(a => a.id === id ? { ...a, status: 'rejected' } : a));
        appendLog(sc, { approvalId: id, action: 'rejected', actor });
      },
      async update(id, patch) {
        await delay(); const arr = load<AiAction[]>('approvals_v2', sc, () => approvalsSeed(sc));
        const i = arr.findIndex(a => a.id === id); arr[i] = { ...arr[i], ...patch }; save('approvals_v2', sc, arr);
        appendLog(sc, { approvalId: id, action: 'edited', actor: 'مدیر' });
        return arr[i];
      },
      async log() { await delay(120); return load<ApprovalLogEntry[]>('approval_log', sc, () => []); },
    },

    calendar: {
      async list() { await delay(); guardNetwork(sc); return load<CalendarEvent[]>('calendar', sc, () => calendarSeed(sc)); },
      async create(e) {
        await delay(); const arr = load<CalendarEvent[]>('calendar', sc, () => calendarSeed(sc));
        const item: CalendarEvent = {
          id: nextId(arr), title: e.title || 'رویداد جدید', type: e.type || 'event', date: e.date || '—',
          day: e.day || 1, time: e.time || '۰۹:۰۰', color: e.color || '#3B82F6', icon: e.icon || 'fa-solid fa-star',
        };
        arr.unshift(item); save('calendar', sc, arr); return item;
      },
      async update(id, patch) {
        await delay(); const arr = load<CalendarEvent[]>('calendar', sc, () => calendarSeed(sc));
        const i = arr.findIndex(e => e.id === id); arr[i] = { ...arr[i], ...patch }; save('calendar', sc, arr); return arr[i];
      },
      async remove(id) {
        await delay(); const arr = load<CalendarEvent[]>('calendar', sc, () => calendarSeed(sc));
        save('calendar', sc, arr.filter(e => e.id !== id));
      },
    },

    ai: {
      async generate(kind, _payload) {
        await delay(700);
        if (sc === 'ai-error') throw new MockError('AI', 'سرویس هوش مصنوعی در دسترس نیست');
        const map: Record<string, string> = {
          'design-campaign': 'کمپین پیشنهادی: تمرکز روی اینستاگرام با بودجه ۳۰ میلیون و سگمنت فریلنسرها.',
          'analyze-campaign': 'این کمپین عملکرد خوبی دارد؛ پیشنهاد افزایش ۱۵٪ بودجه برای رشد بیشتر.',
          'suggest-segment': 'سگمنت پیشنهادی: «کسب‌وکارهای نوپا» با پتانسیل تبدیل بالا.',
          'generate-persona': 'پرسونای پیشنهادی: «مدیر بازاریابی دیجیتال» با تمرکز روی ROI.',
          'analyze-lead': 'این لید آماده تبدیل است؛ تماس تلفنی امروز توصیه می‌شود.',
          'generate-message': 'پیام پیشنهادی آماده شد و در پیش‌نویس قرار گرفت.',
          'performance-report': 'گزارش مدیریتی ماه آماده شد: نرخ تبدیل ۴.۸٪، ROI کلی ۲۸۰٪.',
        };
        return { text: map[kind] || 'تحلیل هوشمند آماده شد.', generatedAt: 'هم‌اکنون' } as MarketingInsight;
      },
    },
  };
}

function appendLog(sc: MockScenario, entry: Omit<ApprovalLogEntry, 'id' | 'at'>) {
  try {
    const raw = localStorage.getItem(KEY('approval_log', sc));
    const arr: ApprovalLogEntry[] = raw ? JSON.parse(raw) : [];
    arr.unshift({ id: (arr[0]?.id || 0) + 1, at: new Date().toLocaleString('fa-IR'), ...entry });
    localStorage.setItem(KEY('approval_log', sc), JSON.stringify(arr));
  } catch { /* ignore */ }
}

/** Clears persisted mock data for the active scenario (QA reset). */
export function resetMockData() {
  const sc = resolveScenario();
  ['conversations', 'leads', 'campaigns', 'segments', 'personas', 'approvals', 'approvals_v2', 'approval_log', 'calendar'].forEach(col => {
    try { localStorage.removeItem(KEY(col, sc)); } catch { /* ignore */ }
  });
}
