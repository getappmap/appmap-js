import { Event } from '@appland/models';
import Assertion from '../assertion';

class Options {
  constructor(
    public maxUpdates: number = 5,
    public queryIncludes: string[] = ['\\binsert\\b', '\\bupdate\\b'],
    public updateMethods: string[] = ['put', 'post', 'patch']
  ) {}
}

const ScopeData: Record<string, number> = {};

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

  return Assertion.assert(
    'too-many-updates',
    'Too many SQL and RPC updates performed in one transaction',
    'transaction',
    (event: Event, scopeId: string) => {
      const incrementUpdateCount = () => {
        let count = ScopeData[scopeId];
        if (count) {
          count += 1;
        } else {
          count = 1;
        }
        ScopeData[scopeId] = count;
        return count;
      };

      if (isUpdate(event)) {
        const updateCount = incrementUpdateCount();
        if (updateCount > options.maxUpdates) {
          return true;
        }
      }
    },
    (assertion: Assertion): void => {
      assertion.description = `Too many SQL and RPC updates performed in one transaction`;
    }
  );
}

export default { Options, scanner };
