// @ts-ignore
import { Event } from '@appland/models';
import Assertion from '../assertion';

const Whitelist = [/BEGIN/, /COMMIT/, /ROLLBACK/, /RELEASE/, /SAVEPOINT/];

export default function (parentPackages: string[], whitelist: RegExp[] = []) {
  return Assertion.assert(
    'event',
    (e: Event) => parentPackages.includes(e.parent!.codeObject.packageOf),
    (assertion: Assertion): void => {
      assertion.where = (e: Event) =>
        e.sqlQuery !== undefined &&
        e.parent !== undefined &&
        !whitelist
          .concat(Whitelist)
          .some((pattern) => pattern.test(e.sqlQuery!));
      assertion.description = `Query must be invoked from one of (${parentPackages.join(
        ','
      )})`;
    }
  );
}
