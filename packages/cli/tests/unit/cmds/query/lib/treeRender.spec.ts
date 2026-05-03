import { renderFlat, renderTree } from '../../../../../src/cmds/query/lib/treeRender';
import { LogNode, TreeNode } from '../../../../../src/cmds/query/queries/tree';

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
