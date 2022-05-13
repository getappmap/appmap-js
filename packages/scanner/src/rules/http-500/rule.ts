import { Event } from '@appland/models';
import { RuleLogic } from '../../types';

export default function rule(): RuleLogic {
  return {
    matcher: (e: Event) => e.httpServerResponse!.status === 500,
    where: (e: Event) => !!e.httpServerResponse,
  };
}
