import { MOCK_CAMPAIGNS, type Campaign } from '../../components/marketing-data';
import type { MockScenario } from '../../services/marketing/types';

const clone = (): Campaign[] => JSON.parse(JSON.stringify(MOCK_CAMPAIGNS));

export function campaignsSeed(scenario: MockScenario): Campaign[] {
  const data = clone();
  switch (scenario) {
    case 'campaign-failed':
      // simulate a failed/under-performing campaign
      data[0] = { ...data[0], status: 'paused', roi: '-۱۲٪', revenue: '۸,۰۰۰,۰۰۰' };
      return data;
    case 'campaign-pending-approval':
      data[5] = { ...data[5], name: data[5].name + ' (در انتظار تأیید)' };
      return data;
    case 'budget-warning':
      // spend almost equals budget
      data[0] = { ...data[0], spent: '۴۹,۵۰۰,۰۰۰' };
      return data;
    default:
      return data;
  }
}
