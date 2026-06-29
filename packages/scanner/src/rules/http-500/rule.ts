import type { Event } from '@appland/models';
import type { RuleLogic } from '../../types';

export default function rule(): RuleLogic {
  return {
    matcher: (e: Event) => e.httpServerResponse!.status === 500,
    where: (e: Event) => !!e.httpServerResponse,
  };
}
