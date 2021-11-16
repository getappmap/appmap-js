import { Event, Label } from '@appland/models';
import Assertion from '../../assertion';

export interface RPCWithoutProtectionOptions {
  get expectedLabel(): Label;
}

export function rpcWithoutProtection(
  id: string,
  summaryTitle: string,
  candidateGenerator: (httpClientRequest: Event) => Generator<Event>,
  options: RPCWithoutProtectionOptions
): Assertion {
  return Assertion.assert(
    id,
    summaryTitle,
    (httpClientRequest: Event) => {
      for (const candidate of candidateGenerator(httpClientRequest)) {
        if (candidate.codeObject.labels.has(options.expectedLabel)) {
          return false;
        }
      }
      return true;
    },
    (assertion: Assertion): void => {
      assertion.where = (e: Event) => !!e.httpClientRequest;
      assertion.description = summaryTitle;
    }
  );
}
