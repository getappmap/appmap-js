import { Event } from '@appland/models';
import Assertion from '../assertion';

const WHITELIST = [/BEGIN/, /COMMIT/, /ROLLBACK/, /RELEASE/, /SAVEPOINT/];

export default function (parentPackages: string[], whitelist: RegExp[] = []): Assertion {
  return Assertion.assert(
    'query-from-invalid-package',
    'Queries from invalid packages',
    'event',
    (e: Event) => parentPackages.includes(e.parent!.codeObject.packageOf),
    (assertion: Assertion): void => {
      assertion.where = (e: Event) =>
        e.sqlQuery !== undefined &&
        e.parent !== undefined &&
        !whitelist.concat(WHITELIST).some((pattern) => pattern.test(e.sqlQuery!));
      assertion.description = `Query must be invoked from one of (${parentPackages.join(',')})`;
    }
  );
}
