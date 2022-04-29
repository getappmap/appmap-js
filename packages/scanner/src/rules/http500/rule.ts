import { Event } from '@appland/models';
import { RuleLogic } from 'src/types';

export default function rule(): RuleLogic {
  return {
    matcher: (e: Event) => e.httpServerResponse!.status === 500,
    where: (e: Event) => !!e.httpServerResponse,
  };
}
