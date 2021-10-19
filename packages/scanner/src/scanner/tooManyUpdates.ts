import { Event } from '@appland/models';
import Assertion from '../assertion';

class Options {
  constructor(
    public maxUpdates: number = 20,
    public queryIncludes: string[] = ['\\binsert\\b', '\\bupdate\\b'],
    public updateMethods: string[] = ['put', 'post', 'patch']
  ) {}
}

function scanner(options: Options = new Options()): Assertion {
  const sqlPatterns = options.queryIncludes.map((pattern) => new RegExp(pattern, 'i'));

  const isUpdate = (event: Event): boolean => {
    const isSQLUpdate = (): boolean => {
      if (!event.sqlQuery) {
        return false;
      }
      return sqlPatterns.some((pattern) => pattern.test(event.sqlQuery!));
    };

    const isRPCUpdate = (): boolean => {
      if (!event.httpClientRequest) {
        return false;
      }
      return options.updateMethods.includes(event.httpClientRequest!.request_method.toLowerCase());
    };

    return isSQLUpdate() || isRPCUpdate();
  };

  let updateCount = 0;

  return Assertion.assert(
    'too-many-updates',
    'Too many SQL and RPC updates performed in one command',
    (event: Event) => {
      if (isUpdate(event)) {
        updateCount += 1;
        // TODO: Keep counting and report the max. This can't be done efficiently with the current Assertion interface.
        if (updateCount === options.maxUpdates) {
          return true;
        }
      }
    },
    (assertion: Assertion): void => {
      assertion.where = (e: Event) => !!e.sqlQuery || !!e.httpServerRequest;
      assertion.description = `Too many SQL and RPC updates performed in one transaction`;
    }
  );
}

export default { scope: 'command', enumerateScope: false, Options, scanner };
