import { MOCK_AI_ACTIONS, type AiAction } from '../../components/marketing-data';
import type { MockScenario } from '../../services/marketing/types';

const clone = (): AiAction[] => JSON.parse(JSON.stringify(MOCK_AI_ACTIONS));

export function approvalsSeed(scenario: MockScenario): AiAction[] {
  switch (scenario) {
    case 'campaign-pending-approval':
      return [
        { ...clone()[0], id: 99, title: 'تأیید انتشار کمپین تلگرام عید نوروز', type: 'انتشار کمپین', risk: 'high', desc: 'کمپین آماده انتشار است و نیاز به تأیید مدیر دارد' },
        ...clone(),
      ];
    default:
      return clone();
  }
}
