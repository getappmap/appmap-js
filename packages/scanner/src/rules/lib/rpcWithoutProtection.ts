import { Event, Label } from '@appland/models';
import { RuleLogic } from 'src/types';

export interface RPCWithoutProtectionOptions {
  get expectedLabel(): Label;
}

export function rpcWithoutProtection(
  candidateGenerator: (httpClientRequest: Event) => Generator<Event>,
  options: RPCWithoutProtectionOptions
): RuleLogic {
  return {
    matcher: (httpClientRequest: Event) => {
      for (const candidate of candidateGenerator(httpClientRequest)) {
        if (candidate.codeObject.labels.has(options.expectedLabel)) {
          return false;
        }
      }
      return true;
    },
    where: (e: Event) => !!e.httpClientRequest,
  };
}
