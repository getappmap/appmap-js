import { Event, EventNavigator } from '@appland/models';
import { classNameToOpenAPIType } from '@appland/openapi';
import { MatchResult, RuleLogic } from '../../types';
import precedingEvents from '../lib/precedingEvents';
import sanitizesData from '../lib/sanitizesData';
import { Eval, EvalSafe, EvalSanitize } from './metadata';

function allArgumentsSanitized(rootEvent: Event, event: Event): boolean {
  return (event.parameters || [])
    .filter(
      (parameter) =>
        parameter.value &&
        parameter.object_id &&
        classNameToOpenAPIType(parameter.class) === 'string'
    )
    .every((parameter): boolean => {
      for (const candidate of precedingEvents(rootEvent, event)) {
        if (sanitizesData(candidate.event, parameter.object_id!, EvalSanitize)) {
          return true;
        }
      }
      return false;
    });
}

function matcher(rootEvent: Event): MatchResult[] | undefined {
  for (const event of new EventNavigator(rootEvent).descendants()) {
    if (
      event.event.labels.has(Eval) &&
      !event.event.ancestors().find((ancestor) => ancestor.labels.has(EvalSafe))
    ) {
      if (allArgumentsSanitized(rootEvent, event.event)) {
        return;
      } else {
        return [
          {
            event: event.event,
            message: `${event.event} evaluates untrusted code`,
          },
        ];
      }
    }
  }
}

export default function rule(): RuleLogic {
  return {
    matcher,
  };
}
