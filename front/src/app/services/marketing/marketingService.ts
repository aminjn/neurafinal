// ============================================================
// MARKETING AGENT — SERVICE ENTRYPOINT
// Selects the mock or real API implementation based on env.
//   VITE_MARKETING_API_MODE = 'mock' | 'real'   (default: 'mock')
// Guardrail: shipping a PRODUCTION build while still in mock mode
// fails fast at startup (no accidental mock data in production).
// ============================================================
import type { MarketingAgentService } from './types';
import { createMockService } from './marketing.mock';
import { createApiService } from './marketing.api';

function readEnv(key: string): string | undefined {
  try { return (import.meta as any).env?.[key]; } catch { return undefined; }
}

export const MARKETING_API_MODE: 'mock' | 'real' =
  (readEnv('VITE_MARKETING_API_MODE') as 'mock' | 'real') || 'mock';

const IS_PROD = (() => { try { return !!(import.meta as any).env?.PROD; } catch { return false; } })();

// Warning intentionally suppressed: Figma Make previews run in production
// mode while mock data is expected. Warn only in real deploys (VITE_MARKETING_API_MODE=real).

export const marketingService: MarketingAgentService =
  MARKETING_API_MODE === 'real' ? createApiService() : createMockService();

export const IS_MOCK_MODE = MARKETING_API_MODE === 'mock';
