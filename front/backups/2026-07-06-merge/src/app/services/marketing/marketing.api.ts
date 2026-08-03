// ============================================================
// MARKETING AGENT — REAL API SERVICE (stub)
// Talks to the documented REST contract (see docs/MARKETING_API.md).
// NOT YET IMPLEMENTED. In real-API mode every method throws — there
// is intentionally NO silent fallback to the mock service.
// ============================================================
import type { MarketingAgentService } from './types';

const BASE = '/api/marketing';

function notImplemented(path: string): never {
  throw new Error(`[MarketingAPI] endpoint not implemented: ${BASE}${path}. اتصال Backend واقعی لازم است.`);
}

export function createApiService(): MarketingAgentService {
  return {
    conversations: {
      list: () => notImplemented('/conversations'),
      get: (id) => notImplemented(`/conversations/${id}`),
      create: () => notImplemented('/conversations'),
      markRead: (id) => notImplemented(`/conversations/${id}/read`),
    },
    leads: {
      list: () => notImplemented('/leads'),
      get: (id) => notImplemented(`/leads/${id}`),
      create: () => notImplemented('/leads'),
      update: (id) => notImplemented(`/leads/${id}`),
      remove: (id) => notImplemented(`/leads/${id}`),
      addNote: (id) => notImplemented(`/leads/${id}/notes`),
      addFollowUp: (id) => notImplemented(`/leads/${id}/follow-ups`),
      setStage: (id) => notImplemented(`/leads/${id}/stage`),
      setScore: (id) => notImplemented(`/leads/${id}/score`),
      timeline: (id) => notImplemented(`/leads/${id}/timeline`),
    },
    campaigns: {
      list: () => notImplemented('/campaigns'),
      get: (id) => notImplemented(`/campaigns/${id}`),
      create: () => notImplemented('/campaigns'),
      update: (id) => notImplemented(`/campaigns/${id}`),
      publish: (id) => notImplemented(`/campaigns/${id}/publish`),
      pause: (id) => notImplemented(`/campaigns/${id}/pause`),
      resume: (id) => notImplemented(`/campaigns/${id}/resume`),
      duplicate: (id) => notImplemented(`/campaigns/${id}/duplicate`),
      increaseBudget: (id) => notImplemented(`/campaigns/${id}/budget`),
    },
    audiences: {
      list: () => notImplemented('/audiences'),
      get: (id) => notImplemented(`/audiences/${id}`),
      create: () => notImplemented('/audiences'),
      update: (id) => notImplemented(`/audiences/${id}`),
      duplicate: (id) => notImplemented(`/audiences/${id}/duplicate`),
    },
    personas: {
      list: () => notImplemented('/personas'),
      create: () => notImplemented('/personas'),
    },
    performance: {
      get: () => notImplemented('/performance'),
    },
    approvals: {
      list: () => notImplemented('/approvals'),
      approve: (id) => notImplemented(`/approvals/${id}/approve`),
      reject: (id) => notImplemented(`/approvals/${id}/reject`),
      update: (id) => notImplemented(`/approvals/${id}`),
      log: () => notImplemented('/approvals/log'),
    },
    calendar: {
      list: () => notImplemented('/calendar'),
      create: () => notImplemented('/calendar'),
      update: (id) => notImplemented(`/calendar/${id}`),
      remove: (id) => notImplemented(`/calendar/${id}`),
    },
    ai: {
      generate: (kind) => notImplemented(`/assistant/${kind}`),
    },
  };
}
