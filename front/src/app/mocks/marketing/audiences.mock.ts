import { MOCK_SEGMENTS, MOCK_PERSONAS, type Segment, type Persona } from '../../components/marketing-data';
import type { MockScenario } from '../../services/marketing/types';

export function segmentsSeed(_scenario: MockScenario): Segment[] {
  return JSON.parse(JSON.stringify(MOCK_SEGMENTS));
}

export function personasSeed(_scenario: MockScenario): Persona[] {
  return JSON.parse(JSON.stringify(MOCK_PERSONAS));
}
