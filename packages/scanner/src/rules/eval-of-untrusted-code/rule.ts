import { Event, EventNavigator } from '@appland/models';
import { MatchResult, RuleLogic } from '../../types';
import precedingEvents from '../lib/precedingEvents';
import sanitizesData from '../lib/sanitizesData';
import { Eval, EvalSafe, EvalSanitize } from './metadata';

function allArgumentsSanitized(rootEvent: Event, event: Event): boolean {
  return (event.parameters || [])
    .filter((parameter) => parameter.object_id)
    .every((parameter): boolean => {
      /**
       * Here we encounter a problem with the way that Ruby Kernel.eval is recorded.
       *
       * > event
       * Kernel.eval
       * > parameter
       * {name: 'arg', class: 'Array', object_id: 2460, value: '[puts 'Hello, I am safe!']', kind: 'rest', …}
       *
       * The eval parameters are recorded as 'rest' parameters (a list), so even though Kernel.eval is invoked
       * with a single argument - the code string to evaluate - the AppMap contains an array of size 1
       * which contains that code string. The object_id of the parameter array is not the same as the object_id of
       * the code string, so any search for the code string being passed through a sanitize function will
       * fail if an exact object_id  match isrequired.
       */

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
