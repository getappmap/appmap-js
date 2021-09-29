import { Event } from '@appland/models';
import { Scope } from 'src/types';
import Assertion from '../assertion';

export default function (scope: Scope, where: ((e: Event) => boolean) | null = null): Assertion {
  return Assertion.assert(
    'leaf-expected',
    'Unexpected child events',
    scope,
    (e: Event) => e.children.length > 0,
    (assertion: Assertion): void => {
      if (where) {
        assertion.where = where;
      }
      assertion.description = `${scope} event should not have any child events`;
    }
  );
}
