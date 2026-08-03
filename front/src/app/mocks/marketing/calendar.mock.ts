import { CALENDAR_EVENTS, type CalendarEvent } from '../../components/marketing-data';
import type { MockScenario } from '../../services/marketing/types';

export function calendarSeed(_scenario: MockScenario): CalendarEvent[] {
  return JSON.parse(JSON.stringify(CALENDAR_EVENTS));
}
