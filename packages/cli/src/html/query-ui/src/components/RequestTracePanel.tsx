import React, { useEffect, useState, useCallback } from 'react';
import { api, RecordingRow, TreeNode, TreeResult } from '../lib/api';
import { formatMs, severityColor } from '../lib/format';

// Trace panel that drives the appmap-js `tree` query. Two modes:
//
//   - Cross-recording: callers pass `focusType` + `focusValue` and the
//     panel first asks /api/recordings to find recordings exercising that
//     focus, then loads the tree for the first matching recording.
//   - Single-recording: callers pass `appmap` (canonical path); the
//     focus selector is optional.
//
// Click on a function node drills the focus to that node's fqid; a back
// stack tracks history.

interface FocusState {
  focusType: 'function' | 'sql_query' | 'http_server_request' | 'http_client_request';
  focusValue: string;
}

interface Props {
  // Initial focus to seed the tree.
  focusType?: FocusState['focusType'];
  focusValue?: string;
  // If supplied, the panel goes straight to that recording — no
  // recording selector is shown.
  appmap?: string;
  // When the panel is mounted in cross-recording mode (no appmap), this
  // route filter is used to find candidate recordings.
  filterRoute?: string;
}

export default function RequestTracePanel({ focusType, focusValue, appmap, filterRoute }: Props) {
  const [recordings, setRecordings] = useState<RecordingRow[] | null>(null);
  const [selected, setSelected] = useState<string | null>(appmap ?? null);
  const [tree, setTree] = useState<TreeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [focusStack, setFocusStack] = useState<FocusState[]>([]);
  const currentFocus: FocusState | null = focusStack.length > 0
    ? focusStack[focusStack.length - 1]
    : focusType && focusValue ? { focusType, focusValue } : null;

  const [parentDepth, setParentDepth] = useState(2);
  const [childDepth, setChildDepth] = useState(3);
  const [minMs, setMinMs] = useState(0);

  const loadTree = useCallback(
    async (am: string, focus: FocusState | null, pd: number, cd: number, me: number) => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, string | number> = {
          appmap: am,
          parent_depth: pd,
          child_depth: cd,
          min_elapsed_ms: me,
        };
        if (focus) {
          params.focus_type = focus.focusType;
          params.focus_value = focus.focusValue;
        }
        const result = await api.tree(params);
        setTree(result);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial load: either go directly to the supplied appmap, or look up
  // matching recordings first.
  useEffect(() => {
    if (appmap) {
      void loadTree(appmap, currentFocus, parentDepth, childDepth, minMs);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const params: Record<string, string | number> = { limit: 20 };
        if (filterRoute) params.route = filterRoute;
        const page = await api.recordings(params);
        if (cancelled) return;
        setRecordings(page.rows);
        if (page.rows.length > 0) {
          const first = page.rows[0].path;
          setSelected(first);
          void loadTree(first, currentFocus, parentDepth, childDepth, minMs);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appmap, filterRoute, focusType, focusValue]);

  const handleParamChange = (key: 'parentDepth' | 'childDepth' | 'minMs', value: number) => {
    if (key === 'parentDepth') setParentDepth(value);
    if (key === 'childDepth') setChildDepth(value);
    if (key === 'minMs') setMinMs(value);
    if (selected) {
      const pd = key === 'parentDepth' ? value : parentDepth;
      const cd = key === 'childDepth' ? value : childDepth;
      const me = key === 'minMs' ? value : minMs;
      void loadTree(selected, currentFocus, pd, cd, me);
    }
  };

  const handleNodeClick = (node: TreeNode) => {
    if (node.kind !== 'function' || !node.fqid) return;
    const newFocus: FocusState = {
      focusType: 'function',
      focusValue: String(node.fqid),
    };
    setFocusStack([...focusStack, newFocus]);
    if (selected) void loadTree(selected, newFocus, parentDepth, childDepth, minMs);
  };

  const handleBack = () => {
    if (focusStack.length === 0) return;
    const next = focusStack.slice(0, -1);
    setFocusStack(next);
    const focus = next.length > 0 ? next[next.length - 1] : (focusType && focusValue ? { focusType, focusValue } : null);
    if (selected) void loadTree(selected, focus, parentDepth, childDepth, minMs);
  };

  if (error && !recordings && !appmap) return <div className="text-red-400 text-xs py-2">{error}</div>;
  if (!appmap && !recordings) return <div className="text-gray-500 text-xs py-2">Loading recordings...</div>;
  if (!appmap && recordings && recordings.length === 0) {
    return <div className="text-gray-500 text-xs py-2">No matching recordings.</div>;
  }

  return (
    <div className="mt-2">
      {recordings && recordings.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {recordings.map((r) => (
            <button
              key={r.path}
              onClick={() => {
                setSelected(r.path);
                void loadTree(r.path, currentFocus, parentDepth, childDepth, minMs);
              }}
              className={`text-xs px-2 py-1 rounded border ${
                selected === r.path
                  ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                  : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              {r.label || r.appmap_name}
              {r.status_code != null && (
                <span className={`ml-1 ${r.status_code >= 400 ? 'text-red-400' : 'text-green-400'}`}>
                  [{r.status_code}]
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        {focusStack.length > 0 && (
          <button
            onClick={handleBack}
            className="text-xs px-2 py-0.5 rounded border border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-500"
          >
            &larr; Back
          </button>
        )}
        {currentFocus && (
          <span className="text-xs text-gray-400">
            Focus: <span className="text-gray-200 font-mono">{currentFocus.focusValue}</span>
          </span>
        )}
      </div>

      <div className="flex gap-4 items-center text-xs text-gray-400 mb-3">
        <label className="flex items-center gap-1">
          Parent depth
          <input
            type="number"
            min={0}
            max={20}
            value={parentDepth}
            onChange={(e) => handleParamChange('parentDepth', Number(e.target.value))}
            className="w-14 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-gray-200 text-xs"
          />
        </label>
        <label className="flex items-center gap-1">
          Child depth
          <input
            type="number"
            min={0}
            max={20}
            value={childDepth}
            onChange={(e) => handleParamChange('childDepth', Number(e.target.value))}
            className="w-14 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-gray-200 text-xs"
          />
        </label>
        <label className="flex items-center gap-1">
          Min elapsed
          <input
            type="number"
            min={0}
            step={1}
            value={minMs}
            onChange={(e) => handleParamChange('minMs', Number(e.target.value))}
            className="w-20 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-gray-200 text-xs"
          />
          <span>ms</span>
        </label>
      </div>

      <div className="bg-gray-950 border border-gray-800 rounded p-3 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-gray-500 text-xs">Loading trace...</div>
        ) : error ? (
          <div className="text-red-400 text-xs">{error}</div>
        ) : !tree || tree.nodes.length === 0 ? (
          <div className="text-gray-500 text-xs">No trace data.</div>
        ) : (
          <TraceTree nodes={tree.nodes} onNodeClick={handleNodeClick} />
        )}
        {tree?.truncated && (
          <div className="mt-2 text-xs text-yellow-500/80 border-t border-gray-800 pt-2">
            Tree truncated. Increase child depth to drill in further.
          </div>
        )}
      </div>
    </div>
  );
}

function kindBadgeColor(k: TreeNode['kind']): string {
  switch (k) {
    case 'function':
      return 'bg-blue-900/60 text-blue-300';
    case 'sql':
      return 'bg-purple-900/60 text-purple-300';
    case 'http_server':
      return 'bg-green-900/60 text-green-300';
    case 'http_client':
      return 'bg-orange-900/60 text-orange-300';
    case 'exception':
      return 'bg-red-900/60 text-red-300';
    case 'log':
      return 'bg-gray-800 text-gray-300';
  }
}

function kindIcon(k: TreeNode['kind']): string {
  switch (k) {
    case 'function':
      return 'fn';
    case 'sql':
      return 'SQL';
    case 'http_server':
      return 'HTTP';
    case 'http_client':
      return 'OUT';
    case 'exception':
      return 'EXC';
    case 'log':
      return 'log';
  }
}

function nodeLabel(n: TreeNode): string {
  switch (n.kind) {
    case 'function':
      return String(n.fqid ?? `${n.defined_class as string}.${n.method_id as string}`);
    case 'sql': {
      const text = String(n.sql_text ?? '');
      return `SQL: ${text.length > 80 ? text.slice(0, 80) + '...' : text}`;
    }
    case 'http_server':
      return `${n.method as string} ${n.route as string} [${n.status_code as number}]`;
    case 'http_client':
      return `HTTP ${n.method as string} ${n.url as string}${n.status_code ? ` [${n.status_code as number}]` : ''}`;
    case 'exception':
      return `${n.exception_class as string}${n.message ? `: ${String(n.message).slice(0, 60)}` : ''}`;
    case 'log':
      return String(n.message ?? n.method_id ?? 'log');
  }
}

function TraceTree({
  nodes,
  onNodeClick,
}: {
  nodes: TreeNode[];
  onNodeClick: (node: TreeNode) => void;
}) {
  const [expandedSql, setExpandedSql] = useState<Set<number>>(new Set());

  return (
    <div className="font-mono text-xs leading-relaxed overflow-x-auto">
      {nodes.map((node) => {
        const elapsed =
          typeof node.elapsed_ms === 'number' ? (node.elapsed_ms as number) : null;
        const isClickable = node.kind === 'function' && Boolean(node.fqid);
        const sqlText = node.kind === 'sql' ? String(node.sql_text ?? '') : '';
        const sqlExpandable = node.kind === 'sql' && sqlText.length > 80;
        const sqlOpen = expandedSql.has(node.event_id);
        return (
          <div key={`${node.event_id}-${node.depth}`}>
            <div
              className={`flex items-baseline gap-2 py-0.5 rounded ${
                isClickable ? 'cursor-pointer hover:bg-gray-800/60' : ''
              }`}
              style={{ paddingLeft: `${node.depth * 20 + 8}px` }}
              onClick={() => isClickable && onNodeClick(node)}
            >
              <span
                className={`inline-block w-8 text-center rounded text-[10px] font-bold ${kindBadgeColor(node.kind)}`}
              >
                {kindIcon(node.kind)}
              </span>
              <span
                className={`flex-1 text-gray-300 ${
                  isClickable ? 'underline decoration-dotted decoration-gray-600 hover:decoration-blue-400' : ''
                }`}
              >
                {nodeLabel(node)}
                {sqlExpandable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedSql((prev) => {
                        const next = new Set(prev);
                        if (next.has(node.event_id)) next.delete(node.event_id);
                        else next.add(node.event_id);
                        return next;
                      });
                    }}
                    className="ml-2 text-purple-400 hover:text-purple-300 text-[10px] no-underline"
                  >
                    {sqlOpen ? '[collapse]' : '[expand]'}
                  </button>
                )}
              </span>
              {elapsed != null && (
                <span className={`whitespace-nowrap ${severityColor(elapsed)}`}>{formatMs(elapsed)}</span>
              )}
            </div>
            {sqlExpandable && sqlOpen && (
              <pre
                className="text-purple-200 bg-purple-950/30 border border-purple-900/40 rounded p-2 mx-2 my-1 whitespace-pre-wrap break-all text-[11px]"
                style={{ marginLeft: `${node.depth * 20 + 40}px` }}
              >
                {sqlText}
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
}
