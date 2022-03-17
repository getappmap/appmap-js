import assert from 'node:assert';
import SQLTransactionScope, { hasTransactionDetails } from '../../src/scope/sqlTransactionScope';
import { Scope } from '../../src/types';
import { fixtureAppMap } from '../util';

function next<T>(iter: Iterator<T>): T {
  const result = iter.next();
  assert(!result.done);
  return result.value;
}

describe('SQL transaction scope', () => {
  it('emits a scope for each SQL transaction', async () => {
    const appMap = await fixtureAppMap('sqlTransactionScopeTest.appmap.json');

    const scopes = new SQLTransactionScope().scopes(appMap.events[Symbol.iterator]());

    const committed: Scope = next(scopes);
    assert(hasTransactionDetails(committed.scope));
    expect(committed.scope.transaction.status).toBe('commit');
    expect([...committed.events()].length).toBe(3);

    const rolledBack: Scope = next(scopes);
    assert(hasTransactionDetails(rolledBack.scope));
    expect(rolledBack.scope.transaction.status).toBe('rollback');
    expect([...rolledBack.events()].length).toBe(3);

    const mockWarn = jest.spyOn(console, 'warn').mockImplementation();
    const rest: Scope = next(scopes);
    assert(hasTransactionDetails(rest.scope));
    expect(rest.scope.transaction.status).toBe('rollback');
    expect([...rest.events()].length).toBe(2);
    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('transaction started within a transaction')
    );
    mockWarn.mockRestore();

    expect(scopes.next().done).toBeTruthy();
  });
});
