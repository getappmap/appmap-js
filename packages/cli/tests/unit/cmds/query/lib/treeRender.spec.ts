import {
  renderFlat,
  renderTree,
  renderTreeForMcp,
  renderTreeForMcpBudgeted,
  StructBudget,
  truncateStructValue,
} from '../../../../../src/cmds/query/lib/treeRender';
import { FunctionNode, LogNode, TreeNode } from '../../../../../src/cmds/query/queries/tree';

function logNode(overrides: Partial<LogNode> = {}): LogNode {
  return {
    kind: 'log',
    event_id: 5,
    parent_event_id: 1,
    thread_id: null,
    depth: 1,
    fqid: 'app/AppLogger#error',
    logger: 'AppLogger',
    method_id: 'error',
    path: 'app/log.rb',
    lineno: 12,
    elapsed_ms: 0.1,
    message: 'connection refused',
    parameters_json: JSON.stringify([
      { name: 'message', class: 'String', value: 'connection refused' },
    ]),
    return_value: null,
    ...overrides,
  };
}

describe('renderTree (log lines)', () => {
  it('renders a log node with its projected message inline', () => {
    const out = renderTree([logNode()] as TreeNode[]);
    expect(out).toContain('LOG');
    expect(out).toContain('AppLogger.error');
    expect(out).toContain('connection refused');
  });

  it('respects the indentation of the log node depth', () => {
    const out = renderTree([logNode({ depth: 3 })] as TreeNode[]);
    // 3 levels of two-space indent = 6 leading spaces.
    expect(out.startsWith('      LOG')).toBe(true);
  });

  it('falls back to logger.method when no message can be projected', () => {
    const out = renderTree([
      logNode({ parameters_json: null, return_value: null }),
    ] as TreeNode[]);
    // No trailing colon when message is empty.
    expect(out).toMatch(/LOG\s+AppLogger\.error\s*$/);
  });

  it('uses a structured return_value when present', () => {
    const out = renderTree([
      logNode({
        parameters_json: null,
        return_value: JSON.stringify({ level: 'error', message: 'from return' }),
      }),
    ] as TreeNode[]);
    expect(out).toContain('AppLogger.error: from return');
  });
});

describe('renderFlat (log lines)', () => {
  it('emits a LOG row when filtering down to log nodes', () => {
    const out = renderFlat([logNode()] as TreeNode[]);
    expect(out).toMatch(/^LOG\s+AppLogger\.error: connection refused$/);
  });
});

// Helper to build a synthetic function-node tree.  Each node is a CALL
// with predictable depth + parent linkage so byte budgets are easy to
// reason about.
function fn(
  event_id: number,
  depth: number,
  parent_event_id: number | null,
  fqid = `app/Foo#m${event_id}`
): FunctionNode {
  return {
    kind: 'function',
    event_id,
    parent_event_id,
    thread_id: 1,
    depth,
    fqid,
    defined_class: 'app/Foo',
    method_id: `m${event_id}`,
    path: 'app/foo.rb',
    lineno: 10,
    is_static: false,
    elapsed_ms: 0.1,
    parameters_json: null,
    return_value: null,
  };
}

describe('renderTreeForMcp (dense per-event lines)', () => {
  it('prefixes each line with #event_id and includes file:line', () => {
    const out = renderTreeForMcp([fn(42, 0, null)] as TreeNode[]);
    expect(out).toMatch(/^#42 CALL {2}app\/Foo#m42 \(app\/foo\.rb:10\) \[/);
  });
});

describe('renderTreeForMcpBudgeted', () => {
  it('returns an empty result on empty input', () => {
    const r = renderTreeForMcpBudgeted([], 1000);
    expect(r).toEqual({
      tree: '',
      rendered_events: 0,
      clipped_events: 0,
      clipped_bytes: 0,
      cutoff_depth: -1,
      partial_depth: -1,
      bytes_used: 0,
    });
  });

  it('renders the full tree when the budget is generous', () => {
    // root → child → grandchild
    const nodes: TreeNode[] = [fn(1, 0, null), fn(2, 1, 1), fn(3, 2, 2)];
    const r = renderTreeForMcpBudgeted(nodes, 10_000);
    expect(r.rendered_events).toBe(3);
    expect(r.clipped_events).toBe(0);
    expect(r.tree.split('\n')).toHaveLength(3);
    expect(r.tree).not.toMatch(/\[clipped:/);
    expect(r.bytes_used).toBeLessThanOrEqual(10_000);
  });

  // Budget enforcement is approximate: clip-marker bytes emitted at
  // cut sites can push `bytes_used` over `budget` by O(markers ×
  // ~80B).  Tests assert <= budget + slop rather than exact equality.
  const BUDGET_SLOP = 300;

  it('fills breadth-first: completes a depth before descending', () => {
    // Two roots, each with two children.  A budget tight enough to
    // exclude depth 1 should keep both depth-0 roots and clip both
    // subtrees at depth 1.
    const nodes: TreeNode[] = [
      fn(1, 0, null),
      fn(2, 0, null),
      fn(3, 1, 1),
      fn(4, 1, 1),
      fn(5, 1, 2),
      fn(6, 1, 2),
    ];
    // Budget covers depth 0 (2 events × ~43B + 2 markers × 80B ≈ 246B)
    // but won't fit all of depth 1 — so cutoff=0 and depth 1 partial-fills.
    const r = renderTreeForMcpBudgeted(nodes, 250);
    expect(r.cutoff_depth).toBe(0);
    // Both depth-0 roots are rendered (breadth-first guarantee).
    expect(r.tree).toMatch(/#1 CALL/);
    expect(r.tree).toMatch(/#2 CALL/);
    // At least some depth-1 events get clipped (the budget can't fit
    // them all even after partial fill).
    expect(r.clipped_events).toBeGreaterThan(0);
    expect(r.clipped_events).toBeLessThanOrEqual(4);
    const clipMarkers = r.tree.match(/\[clipped:/g) ?? [];
    expect(clipMarkers.length).toBeGreaterThan(0);
    expect(r.bytes_used).toBeLessThanOrEqual(250 + BUDGET_SLOP);
  });

  it('partial-fills cutoff+1 in event_id order until the budget is used', () => {
    // Single root with 4 grandchildren spread across two children.  A
    // budget that fits all of depth ≤ 1 plus a few — but not all — of
    // depth 2 should produce a non-empty partial_depth.
    const nodes: TreeNode[] = [
      fn(1, 0, null),
      fn(2, 1, 1),
      fn(3, 1, 1),
      fn(4, 2, 2),
      fn(5, 2, 2),
      fn(6, 2, 3),
      fn(7, 2, 3),
    ];
    // Budget covers depth ≤ 1 lines (~133B) + 2-marker reserve (~160B)
    // → cutoff fits at d=1.  Residual after rendering depth-≤1 = ~167B,
    // enough for some depth-2 events (~47B each) but not all.
    const r = renderTreeForMcpBudgeted(nodes, 300);
    expect(r.cutoff_depth).toBe(1);
    expect(r.partial_depth).toBe(2);
    // Rendered count is between the depth-≤1 events (3) and full (7).
    expect(r.rendered_events).toBeGreaterThan(3);
    expect(r.rendered_events).toBeLessThan(7);
    expect(r.clipped_events).toBe(7 - r.rendered_events);
    expect(r.bytes_used).toBeLessThanOrEqual(300 + BUDGET_SLOP);
  });

  it('emits clip markers only at direct cut sites, not at every ancestor', () => {
    // Linear chain: 1 → 2 → 3 → 4 → 5 with a budget that admits 1..3
    // and clips 4 (and transitively 5).  We expect exactly one marker
    // (under #3) rather than one at every rendered ancestor.
    const nodes: TreeNode[] = [
      fn(1, 0, null),
      fn(2, 1, 1),
      fn(3, 2, 2),
      fn(4, 3, 3),
      fn(5, 4, 4),
    ];
    const r = renderTreeForMcpBudgeted(nodes, 220);
    expect(r.cutoff_depth).toBe(2);
    const clipMarkers = r.tree.match(/\[clipped:/g) ?? [];
    expect(clipMarkers).toHaveLength(1);
    expect(r.tree).toMatch(/focus on #3/);
  });

  it('renders at least one root even when the budget is too small for depth 0', () => {
    const nodes: TreeNode[] = [fn(1, 0, null), fn(2, 0, null), fn(3, 1, 1)];
    const r = renderTreeForMcpBudgeted(nodes, 10);
    // Best-effort first root, everything else clipped.
    expect(r.rendered_events).toBe(1);
    expect(r.clipped_events).toBe(2);
  });

  it('dedupes nodes that share an event_id (function + exception)', () => {
    // The tree query emits one row per kind, so a function that threw
    // an exception appears twice with the same event_id.  The budgeted
    // renderer should treat them as one logical node.
    const dupe: TreeNode[] = [
      fn(1, 0, null),
      fn(2, 1, 1),
      {
        kind: 'exception',
        event_id: 2,
        parent_event_id: 1,
        thread_id: 1,
        depth: 1,
        exception_class: 'BoomError',
        message: 'kaboom',
        path: 'app/foo.rb',
        lineno: 10,
      },
    ];
    const r = renderTreeForMcpBudgeted(dupe, 10_000);
    // 2 logical nodes; only one #2 mention; no clipping.
    expect(r.rendered_events).toBe(2);
    expect(r.clipped_events).toBe(0);
    const mentions = r.tree.match(/#2 /g) ?? [];
    expect(mentions).toHaveLength(1);
  });

  it('records cumulative clipped_bytes from unrendered events', () => {
    const nodes: TreeNode[] = [fn(1, 0, null), fn(2, 1, 1), fn(3, 1, 1)];
    const r = renderTreeForMcpBudgeted(nodes, 100);
    expect(r.clipped_events).toBeGreaterThan(0);
    expect(r.clipped_bytes).toBeGreaterThan(0);
  });
});

describe('truncateStructValue', () => {
  // A real Java-record toString() where the budget-eating fields (two
  // UUIDs) precede the state fields an RCA actually needs.
  const APPROVAL_REQUEST =
    'ApprovalRequest[requestId=d179dbbd-cc67-4384-a97f-36fd9eeedeb2, ' +
    'loanId=LOAN-05dae83b-cc16-4bbe-b693-debf65e49556, ' +
    'borrowerId=b1ffffff-aaaa-bbbb-cccc-123456789012, ' +
    'status=APPROVED, requiredAuthority=RELATIONSHIP_MANAGER]';

  it('clips id-shaped values hard so trailing state fields survive', () => {
    const out = truncateStructValue(APPROVAL_REQUEST);
    // The downstream state fields — the whole point — are intact.
    expect(out).toContain('status=APPROVED');
    expect(out).toContain('requiredAuthority=RELATIONSHIP_MANAGER');
    // UUID values are clipped to the tight idCap, not shown in full.
    expect(out).not.toContain('36fd9eeedeb2');
    expect(out).toContain('requestId=d179dbbd-cc…');
    // Field names are always kept whole.
    expect(out).toContain('borrowerId=');
  });

  it('keeps short non-id values whole within perValueCap', () => {
    const out = truncateStructValue('ConsumeResult[allowed=true, remaining=149, limit=150]');
    expect(out).toBe('ConsumeResult[allowed=true, remaining=149, limit=150]');
  });

  it('parses Java bean { } shape', () => {
    const out = truncateStructValue('Account{id=42, balance=100.00}');
    expect(out).toBe('Account{id=42, balance=100.00}');
  });

  it('parses Python dataclass repr ( ) shape', () => {
    const out = truncateStructValue('Order(id=7, total=10, status=OPEN)');
    expect(out).toContain('Order(');
    expect(out).toContain('status=OPEN');
  });

  it('parses Ruby #<...> shape with colon-separated fields', () => {
    const out = truncateStructValue('#<Order id: 5, total: 10, paid: true>');
    expect(out).toContain('#<Order ');
    expect(out).toContain('paid: true');
    expect(out).toMatch(/>$/);
  });

  it('does not split on commas nested inside a field value', () => {
    // `lines` value carries inner commas; they must not produce extra fields.
    const out = truncateStructValue('Order[id=1, lines=[Line[a, b], Line[c, d]], note=ok]');
    // `note=ok` only survives if the inner commas were treated as nested.
    expect(out).toContain('note=ok');
    expect(out).toContain('lines=[Line[a, b]');
  });

  it('recurses into a collection of structs so each element keeps its fields', () => {
    // A getParticipants-style return: a bare list of records. Flat-clipping
    // each element (it contains a UUID) would collapse it to a stub; the
    // per-element status must survive.
    const out = truncateStructValue(
      '[ParticipantState[partyId=PID-ced84ce5-2001-4994-b50d-8ee47724edf4, share=0.20, status=PENDING], ' +
        'ParticipantState[partyId=PID-5bfa9c9d-2ca6-4dcc-be60-93b86a3cf0ad, share=0.10, status=COMMITTED]]'
    );
    expect(out).toContain('status=PENDING');
    expect(out).toContain('status=COMMITTED');
    expect(out).not.toContain('8ee47724edf4'); // UUID tail clipped
  });

  it('recurses into a struct-valued field', () => {
    const out = truncateStructValue(
      'Result[ok=true, detail=Detail[code=E_PREFLIGHT, retriable=false]]'
    );
    expect(out).toContain('detail=Detail[code=E_PREFLIGHT');
    expect(out).toContain('retriable=false');
  });

  it('elides the field tail past maxFields', () => {
    const budget: StructBudget = { perValueCap: 48, idCap: 12, maxFields: 2, flatCap: 120 };
    const out = truncateStructValue('T[a=1, b=2, c=3, d=4]', budget);
    expect(out).toContain('a=1');
    expect(out).toContain('b=2');
    expect(out).not.toContain('c=3');
    expect(out).toContain('…+2 more');
    expect(out).toMatch(/]$/);
  });

  it('falls back to a flat cap for non-struct values', () => {
    expect(truncateStructValue('USD 7000000.00')).toBe('USD 7000000.00');
    expect(truncateStructValue('true')).toBe('true');
    // `[object Object]` and `Type@1a2b3c` are opaque — no fields to budget.
    expect(truncateStructValue('java.lang.Object@1a2b3c4')).toBe('java.lang.Object@1a2b3c4');
    const long = 'x'.repeat(400);
    const out = truncateStructValue(long);
    expect(out.length).toBe(120);
    expect(out.endsWith('…')).toBe(true);
  });

  it('handles an empty struct body', () => {
    expect(truncateStructValue('EmptyRecord[]')).toBe('EmptyRecord[]');
  });
});

describe('renderTreeForMcp (return values)', () => {
  it('renders a struct return value through the per-field budget', () => {
    const node: FunctionNode = {
      ...fn(1, 0, null),
      return_value:
        'ApprovalRequest[requestId=d179dbbd-cc67-4384-a97f-36fd9eeedeb2, ' +
        'status=APPROVED, requiredAuthority=RELATIONSHIP_MANAGER]',
    };
    const out = renderTreeForMcp([node] as TreeNode[]);
    expect(out).toContain('→ ApprovalRequest[');
    expect(out).toContain('status=APPROVED');
    expect(out).toContain('requiredAuthority=RELATIONSHIP_MANAGER');
    expect(out).not.toContain('36fd9eeedeb2');
  });
});
