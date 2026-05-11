import {
  renderFlat,
  renderTree,
  renderTreeForMcp,
  renderTreeForMcpBudgeted,
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
