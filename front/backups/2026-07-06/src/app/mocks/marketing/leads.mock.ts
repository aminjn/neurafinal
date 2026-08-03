import { MOCK_LEADS, type Lead } from '../../components/marketing-data';
import type { MockScenario } from '../../services/marketing/types';

const clone = (): Lead[] => JSON.parse(JSON.stringify(MOCK_LEADS));

export function leadsSeed(scenario: MockScenario): Lead[] {
  switch (scenario) {
    case 'empty-leads':
      return [];
    case 'high-priority-leads':
      return clone().map(l => ({ ...l, status: 'hot', score: Math.max(l.score, 85) }));
    default:
      return clone();
  }
}
