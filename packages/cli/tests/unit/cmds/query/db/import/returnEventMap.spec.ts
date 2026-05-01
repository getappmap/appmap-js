import { buildReturnEventMap } from '../../../../../../src/cmds/query/db/import/returnEventMap';

describe('buildReturnEventMap', () => {
  it('maps call event id → return event via parent_id', () => {
    const events = [
      { id: 1, event: 'call' },
      { id: 2, event: 'return', parent_id: 1, elapsed: 0.5 },
      { id: 3, event: 'call' },
      { id: 4, event: 'return', parent_id: 3, http_server_response: { status_code: 200 } },
    ];
    const map = buildReturnEventMap(events);
    expect(map.get(1)?.elapsed).toBe(0.5);
    expect(map.get(3)?.http_server_response).toEqual({ status_code: 200 });
    expect(map.size).toBe(2);
  });

  it('ignores returns without parent_id', () => {
    const events = [{ id: 1, event: 'return' /* no parent_id */ }];
    expect(buildReturnEventMap(events).size).toBe(0);
  });

  it('ignores non-return events', () => {
    const events = [{ id: 1, event: 'call', parent_id: 999 }];
    expect(buildReturnEventMap(events).size).toBe(0);
  });
});
