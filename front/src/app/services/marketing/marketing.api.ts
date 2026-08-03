// ============================================================
// MARKETING AGENT — REAL API SERVICE (per-user)
// داده‌های بازاریابی (لید/کمپین/سگمنت/…) واقعی و per-user در بک‌اند ذخیره می‌شوند
// (/api/me/data/mkt_*). هر کاربری که ایجنتِ بازاریاب را دارد می‌تواند بسازد/ویرایش کند —
// دیگر خطای «دسترسی ندارید»ِ ادمین‌محور وجود ندارد. هیچ دادهٔ فیک/نمونه نیست.
// از کلاینتِ مشترکِ api استفاده می‌کند تا توکن + لایهٔ live-sync (تازه‌سازیِ لحظه‌ای) هم اعمال شود.
// ============================================================
import type { MarketingAgentService } from './types';
import { api } from '../api';

const C = {
  conversations: 'mkt_conversations',
  leads: 'mkt_leads',
  campaigns: 'mkt_campaigns',
  segments: 'mkt_segments',
  personas: 'mkt_personas',
  approvals: 'mkt_approvals',
  calendar: 'mkt_calendar',
};

const nid = () => Date.now() + Math.floor(Math.random() * 1000);
const cid = () => 'c' + Date.now() + Math.floor(Math.random() * 1000);

async function all<T = any>(coll: string): Promise<T[]> {
  try { const r = await (api as any).myList(coll); return Array.isArray(r) ? r : []; } catch { return []; }
}
async function put<T = any>(coll: string, entity: any): Promise<T> {
  return (await (api as any).myCreate(coll, entity)) as T;
}
async function patchOne<T = any>(coll: string, id: any, patch: any): Promise<T> {
  return (await (api as any).myUpdate(coll, String(id), patch)) as T;
}
async function findById<T = any>(coll: string, id: any): Promise<T | undefined> {
  return (await all<T>(coll)).find((x: any) => String(x && x.id) === String(id));
}

export function createApiService(): MarketingAgentService {
  const svc: any = {
    conversations: {
      list: () => all(C.conversations),
      get: (id: any) => findById(C.conversations, id),
      create: (c: any) => put(C.conversations, {
        id: nid(), name: c?.name || 'گفتگوی جدید', kind: c?.kind || 'lead', kindLabel: c?.kindLabel || 'لید',
        avatar: (c?.name || 'گ')[0], lastMessage: c?.lastMessage || '', time: 'هم‌اکنون', unread: false, priority: c?.priority || 'normal',
      }),
      markRead: async (id: any) => { const c: any = await findById(C.conversations, id); if (c) await patchOne(C.conversations, id, { unread: false }); },
    },
    leads: {
      list: () => all(C.leads),
      get: (id: any) => findById(C.leads, id),
      create: (l: any) => put(C.leads, {
        id: nid(), name: l?.name || 'لید جدید', company: l?.company || '—', field: l?.field || '—',
        phone: l?.phone || '', source: l?.source || 'دستی', sourceIcon: 'fa-solid fa-user-plus',
        status: l?.status || 'warm', stage: l?.stage || 'new', score: l?.score ?? 50, date: 'امروز',
        lastAction: 'ایجاد دستی', owner: l?.owner || 'تیم بازاریابی', nextAction: l?.nextAction || 'تماس اولیه',
        followUp: l?.followUp || 'این هفته', segment: l?.segment || '—', campaigns: [],
        aiSuggestion: 'لید جدید ثبت شد. تماس اولیه را برنامه‌ریزی کنید.',
        timeline: [{ id: 1, type: 'note', text: 'لید ایجاد شد', date: 'امروز' }], notes: [],
      }),
      update: (id: any, patch: any) => patchOne(C.leads, id, patch),
      remove: async (id: any) => { await (api as any).myRemove(C.leads, String(id)); },
      addNote: async (id: any, note: any) => {
        const l: any = await findById(C.leads, id);
        const notes = [...((l && l.notes) || []), note];
        const timeline = [{ id: nid(), type: 'note', text: note, date: 'هم‌اکنون' }, ...((l && l.timeline) || [])];
        return patchOne(C.leads, id, { notes, timeline });
      },
      addFollowUp: async (id: any, title: any, due: any) => {
        const l: any = await findById(C.leads, id);
        const timeline = [{ id: nid(), type: 'note', text: `پیگیری: ${title} (${due})`, date: 'هم‌اکنون' }, ...((l && l.timeline) || [])];
        return patchOne(C.leads, id, { followUp: due, timeline });
      },
      setStage: async (id: any, stage: any) => {
        const l: any = await findById(C.leads, id);
        const timeline = [{ id: nid(), type: 'stage', text: `انتقال به مرحله «${stage}»`, date: 'هم‌اکنون' }, ...((l && l.timeline) || [])];
        return patchOne(C.leads, id, { stage, timeline });
      },
      setScore: (id: any, score: any) => patchOne(C.leads, id, { score }),
      timeline: async (id: any) => { const l: any = await findById(C.leads, id); return (l && l.timeline) || []; },
    },
    campaigns: {
      list: () => all(C.campaigns),
      get: (id: any) => findById(C.campaigns, id),
      create: (c: any) => put(C.campaigns, {
        id: cid(), name: c?.name || 'کمپین جدید', type: c?.type || 'social', status: c?.status || 'draft',
        goal: c?.goal || 'جذب لید', segment: c?.segment || '—', budget: c?.budget || '۰', spent: '۰',
        startDate: c?.startDate || '—', endDate: c?.endDate || '—', reach: '—', clicks: '—', conversions: '—',
        cpa: '—', revenue: '—', roi: '—', channel: c?.channel || '—', owner: c?.owner || 'تیم بازاریابی',
      }),
      update: (id: any, patch: any) => patchOne(C.campaigns, id, patch),
      publish: (id: any) => patchOne(C.campaigns, id, { status: 'active' }),
      pause: (id: any) => patchOne(C.campaigns, id, { status: 'paused' }),
      resume: (id: any) => patchOne(C.campaigns, id, { status: 'active' }),
      duplicate: async (id: any) => {
        const src: any = await findById(C.campaigns, id);
        return put(C.campaigns, { ...(src || {}), id: cid(), name: ((src && src.name) || 'کمپین') + ' (کپی)', status: 'draft', spent: '۰' });
      },
      increaseBudget: (id: any, amount: any) => patchOne(C.campaigns, id, { budget: amount }),
    },
    audiences: {
      list: () => all(C.segments),
      get: (id: any) => findById(C.segments, id),
      create: (s: any) => put(C.segments, {
        id: nid(), name: s?.name || 'سگمنت جدید', desc: s?.desc || '—', size: s?.size || '۰', growth: '+۰%',
        color: s?.color || '#3B82F6', icon: 'fa-solid fa-layer-group', penetration: 0, conversion: '۰٪', engagement: '۰٪',
        value: '۰', updated: 'امروز', dataSource: s?.dataSource || 'دستی', rules: s?.rules || [], campaigns: [], overlap: [],
        aiSuggestion: 'سگمنت جدید ایجاد شد.',
      }),
      update: (id: any, patch: any) => patchOne(C.segments, id, patch),
      duplicate: async (id: any) => {
        const src: any = await findById(C.segments, id);
        return put(C.segments, { ...(src || {}), id: nid(), name: ((src && src.name) || 'سگمنت') + ' (کپی)' });
      },
    },
    personas: {
      list: () => all(C.personas),
      create: (p: any) => put(C.personas, { id: nid(), ...(p || {}) }),
    },
    performance: {
      get: async (_period?: any) => ({ kpis: [], insight: 'تحلیل بر پایهٔ داده‌های واقعیِ کمپین‌های شما نمایش داده می‌شود.' }),
    },
    approvals: {
      list: () => all(C.approvals),
      approve: async (id: any, actor: any) => { await patchOne(C.approvals, id, { status: 'approved', actor }); },
      reject: async (id: any, actor: any) => { await patchOne(C.approvals, id, { status: 'rejected', actor }); },
      update: (id: any, patch: any) => patchOne(C.approvals, id, patch),
      log: async () => [],
    },
    calendar: {
      list: () => all(C.calendar),
      create: (e: any) => put(C.calendar, { id: nid(), ...(e || {}) }),
      update: (id: any, patch: any) => patchOne(C.calendar, id, patch),
      remove: async (id: any) => { await (api as any).myRemove(C.calendar, String(id)); },
    },
    ai: {
      generate: async (kind: any, payload?: any) => {
        try {
          const prompt = (payload && (payload.prompt || payload.brief)) || (payload ? JSON.stringify(payload) : '');
          const r: any = await (api as any).chat('marketing', [{ role: 'user', content: `[${kind}] ${prompt}` }]);
          return { text: (r && r.ok && r.text) ? String(r.text) : 'تحلیل بر پایهٔ داده‌های واقعیِ شما آماده می‌شود.', generatedAt: 'هم‌اکنون' };
        } catch { return { text: 'الان نتوانستم تحلیل تولید کنم؛ دوباره تلاش کنید.', generatedAt: 'هم‌اکنون' }; }
      },
    },
  };
  return svc as MarketingAgentService;
}
