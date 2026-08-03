import { MOCK_CONVERSATIONS, type MktConversation } from '../../components/marketing-data';
import type { MockScenario } from '../../services/marketing/types';

const clone = (): MktConversation[] => JSON.parse(JSON.stringify(MOCK_CONVERSATIONS));

export function conversationsSeed(scenario: MockScenario): MktConversation[] {
  switch (scenario) {
    case 'no-conversations':
      return [];
    default:
      return clone();
  }
}
