import { merge } from '../../src/mergeWindow';
import type { Action, FunctionCall, Loop } from '../../src/types';
import { isFunction, isLoop, NodeType } from '../../src/types';

function call(name: string, id: number, children: Action[] = []): FunctionCall {
  return {
    nodeType: NodeType.Function,
    name,
    caller: { id: 'caller', name: 'Caller', order: 0 },
    callee: { id: 'callee', name: 'Callee', order: 1 },
    static: false,
    digest: name,
    subtreeDigest: name,
    stableProperties: { id: name, event_type: 'function' },
    returnValue: { returnValueType: { name: 'string' }, raisesException: false },
    children,
    eventIds: [id],
    elapsed: id,
  };
}

function eventIds(actions: Action[]): number[] {
  return actions
    .flatMap((action) => [...action.eventIds, ...eventIds(action.children)])
    .sort((a, b) => a - b);
}

function loop(id: number, count: number): Loop {
  return {
    nodeType: NodeType.Loop,
    digest: 'loop',
    subtreeDigest: 'loop:a',
    count,
    eventIds: [],
    elapsed: id,
    children: [call('a', id)],
  };
}

describe('GIVEN native repeated action windows', () => {
  it('WHEN [a,b,a,b,c] is compressed THEN c and every input event ID survive exactly once', () => {
    const input = ['a', 'b', 'a', 'b', 'c'].map((name, index) => call(name, index + 1));
    const expectedIds = eventIds(input);
    const output = merge(input, 2)!;
    expect(output).toHaveLength(2);
    expect(isLoop(output[0])).toBe(true);
    expect(output[0]).toMatchObject({ count: 2, elapsed: 10 });
    expect(output[0].children.map((action) => action.eventIds)).toEqual([
      [1, 3],
      [2, 4],
    ]);
    expect(output[1]).toMatchObject({ name: 'c', eventIds: [5], elapsed: 5 });
    expect(eventIds(output)).toEqual(expectedIds);
    expect(output.reduce((sum, action) => sum + (action.elapsed || 0), 0)).toBe(15);
  });

  it('WHEN windows of sizes 2 through 5 end in partial windows THEN every ordered tail is retained', () => {
    for (let size = 2; size <= 5; size++) {
      for (let tailSize = 1; tailSize < size; tailSize++) {
        const names = Array.from({ length: size }, (_, index) => `member-${index}`);
        const tail = Array.from({ length: tailSize }, (_, index) => `tail-${index}`);
        const input = ['prefix', ...names, ...names, ...tail].map((name, index) =>
          call(name, index + 1)
        );
        const expectedIds = eventIds(input);
        const output = merge(input, size)!;
        expect(output).toHaveLength(2 + tailSize);
        expect(output[0]).toMatchObject({ name: 'prefix' });
        expect(output[1]).toMatchObject({ nodeType: NodeType.Loop, count: 2 });
        expect(
          output.slice(2).map((action) => (isFunction(action) ? action.name : 'loop'))
        ).toEqual(tail);
        expect(eventIds(output)).toEqual(expectedIds);
      }
    }
  });

  it('WHEN repeated nested windows have tails THEN both compression depths preserve all events and timing', () => {
    const makeParent = (offset: number) =>
      call(
        'parent',
        offset + 1,
        ['a', 'b', 'a', 'b', 'c'].map((name, index) => call(name, offset + index + 2))
      );
    const input = [makeParent(0), makeParent(10)];
    const expectedIds = eventIds(input);
    input.forEach((action) => {
      action.children = merge(action.children, 2)!;
    });
    const output = merge(input, 1)!;
    expect(output).toHaveLength(1);
    expect(output[0]).toMatchObject({ nodeType: NodeType.Loop, count: 2, elapsed: 12 });
    const parent = output[0].children[0];
    expect(parent.children).toHaveLength(2);
    expect(parent.children[0]).toMatchObject({ nodeType: NodeType.Loop, count: 2 });
    expect(parent.children[1]).toMatchObject({ name: 'c', eventIds: [6, 16], elapsed: 22 });
    expect(eventIds(output)).toEqual(expectedIds);
  });
});

describe('GIVEN equal legacy subtree digests but different action metadata', () => {
  it('WHEN labels differ THEN classification metadata is not discarded even though labels are not public digest identity', () => {
    const first = call('a', 1);
    const second = call('a', 2);
    first.labels = ['read'];
    second.labels = ['write'];
    expect(merge([first, second], 1)).toBeUndefined();
  });

  it.each([
    {
      distinction: 'return type',
      change: (action: FunctionCall) => {
        action.returnValue!.returnValueType!.name = 'integer';
      },
    },
    {
      distinction: 'return properties',
      change: (action: FunctionCall) => {
        action.returnValue!.returnValueType!.properties = ['field:Integer'];
      },
    },
    {
      distinction: 'exception flag',
      change: (action: FunctionCall) => {
        action.returnValue!.raisesException = true;
      },
    },
    {
      distinction: 'missing return metadata',
      change: (action: FunctionCall) => {
        action.returnValue = undefined;
      },
    },
    {
      distinction: 'caller',
      change: (action: FunctionCall) => {
        action.caller = { id: 'other', name: 'Other', order: 2 };
      },
    },
    {
      distinction: 'callee',
      change: (action: FunctionCall) => {
        action.callee = { id: 'other', name: 'Other', order: 2 };
      },
    },
    {
      distinction: 'stable attributes',
      change: (action: FunctionCall) => {
        action.stableProperties.id = 'different';
      },
    },
    {
      distinction: 'nested return type',
      change: (action: FunctionCall) => {
        (action.children[0] as FunctionCall).returnValue!.returnValueType!.name = 'integer';
      },
    },
    {
      distinction: 'nested structure',
      change: (action: FunctionCall) => {
        action.children.push(call('extra', 5));
      },
    },
  ])(
    'WHEN $distinction differs THEN compression does not discard the distinction',
    ({ change }) => {
      const first = call('a', 1, [call('child', 2)]);
      const second = call('a', 3, [call('child', 4)]);
      change(second);
      const before = JSON.stringify([first, second]);
      expect(merge([first, second], 1)).toBeUndefined();
      expect(JSON.stringify([first, second])).toBe(before);
    }
  );

  it('WHEN nested loop counts differ THEN they are not collapsed into the first count', () => {
    const first = call('outer', 1, [loop(2, 2)]);
    const second = call('outer', 3, [loop(4, 3)]);
    expect(merge([first, second], 1)).toBeUndefined();
  });

  it('WHEN equivalent returns and stable attributes have different key order THEN event IDs and elapsed time still aggregate', () => {
    const first = call('a', 2, [call('child', 3)]);
    const second = call('a', 7, [call('child', 8)]);
    second.stableProperties = { event_type: 'function', id: 'a' };
    second.returnValue = { raisesException: false, returnValueType: { name: 'string' } };
    const output = merge([first, second], 1)!;
    expect(output).toHaveLength(1);
    expect(output[0]).toMatchObject({ nodeType: NodeType.Loop, count: 2, elapsed: 9 });
    expect(output[0].children[0]).toMatchObject({ eventIds: [2, 7], elapsed: 9 });
    expect(output[0].children[0].children[0]).toMatchObject({ eventIds: [3, 8], elapsed: 11 });
    expect(eventIds(output)).toEqual([2, 3, 7, 8]);
  });

  it('WHEN equivalent nested loops repeat THEN counts remain nested and events aggregate once', () => {
    const output = merge([loop(2, 3), loop(5, 3)], 1)!;
    expect(output).toHaveLength(1);
    expect(output[0]).toMatchObject({ nodeType: NodeType.Loop, count: 2, elapsed: 7 });
    expect(output[0].children[0]).toMatchObject({ nodeType: NodeType.Loop, count: 3 });
    expect(eventIds(output)).toEqual([2, 5]);
  });
});
