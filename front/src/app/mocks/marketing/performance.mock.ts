import { PERFORMANCE_KPIS, PERFORMANCE_INSIGHT, type KpiItem } from '../../components/marketing-data';
import type { MockScenario, MarketingPerformance } from '../../services/marketing/types';

export function performanceSeed(scenario: MockScenario): MarketingPerformance {
  const kpis: KpiItem[] = JSON.parse(JSON.stringify(PERFORMANCE_KPIS));
  if (scenario === 'budget-warning') {
    return { kpis, insight: 'هشدار: هزینه جذب مشتری در حال نزدیک شدن به سقف بودجه است.' };
  }
  return { kpis, insight: PERFORMANCE_INSIGHT };
}
