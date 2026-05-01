import {
  buildParentEventMap,
  AppMapEventLike,
} from '../../../../../../src/cmds/query/db/import/parentEventMap';

describe('buildParentEventMap', () => {
  it('returns an empty map for an empty event stream', () => {
    expect(buildParentEventMap([])).toEqual(new Map());
  });

  it('assigns the call directly above as the parent on a single thread', () => {
    const events: AppMapEventLike[] = [
      { id: 1, thread_id: 1, event: 'call' }, // root
      { id: 2, thread_id: 1, event: 'call' }, // child of 1
      { id: 3, thread_id: 1, event: 'call' }, // child of 2
      { id: 4, thread_id: 1, event: 'return' }, // returns from 3
      { id: 5, thread_id: 1, event: 'call' }, // child of 2 again
      { id: 6, thread_id: 1, event: 'return' }, // returns from 5
      { id: 7, thread_id: 1, event: 'return' }, // returns from 2
      { id: 8, thread_id: 1, event: 'return' }, // returns from 1
    ];
    const map = buildParentEventMap(events);
    expect(map.get(1)).toBeUndefined();
    expect(map.get(2)).toBe(1);
    expect(map.get(3)).toBe(2);
    expect(map.get(5)).toBe(2);
  });

  it('keeps threads independent', () => {
    const events: AppMapEventLike[] = [
      { id: 1, thread_id: 1, event: 'call' },
      { id: 2, thread_id: 2, event: 'call' }, // different thread; no parent
      { id: 3, thread_id: 1, event: 'call' }, // child of 1
      { id: 4, thread_id: 2, event: 'call' }, // child of 2
    ];
    const map = buildParentEventMap(events);
    expect(map.get(1)).toBeUndefined();
    expect(map.get(2)).toBeUndefined();
    expect(map.get(3)).toBe(1);
    expect(map.get(4)).toBe(2);
  });

  it('skips events missing id or thread_id', () => {
    const events: AppMapEventLike[] = [
      { id: 1, thread_id: 1, event: 'call' },
      { thread_id: 1, event: 'call' }, // missing id
      { id: 3, event: 'call' }, // missing thread_id
      { id: 4, thread_id: 1, event: 'call' }, // child of 1 (the malformed events were skipped)
    ];
    const map = buildParentEventMap(events);
    expect(map.get(4)).toBe(1);
  });

  it('tolerates extra returns past an empty stack', () => {
    const events: AppMapEventLike[] = [
      { id: 1, thread_id: 1, event: 'return' }, // no matching call
      { id: 2, thread_id: 1, event: 'call' }, // root after a stray return
      { id: 3, thread_id: 1, event: 'call' }, // child of 2
    ];
    const map = buildParentEventMap(events);
    expect(map.get(2)).toBeUndefined();
    expect(map.get(3)).toBe(2);
  });

  it('ignores events with neither call nor return', () => {
    const events: AppMapEventLike[] = [
      { id: 1, thread_id: 1, event: 'call' },
      { id: 2, thread_id: 1, event: 'log' }, // synthetic; not a call/return
      { id: 3, thread_id: 1, event: 'call' }, // still child of 1
    ];
    const map = buildParentEventMap(events);
    expect(map.get(3)).toBe(1);
  });
});
