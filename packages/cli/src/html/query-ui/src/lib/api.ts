// Thin wrapper around the /api/* REST surface exposed by uiServer.ts.
// All routes return either a Page<T> (rows + total + limit + offset) or
// a small JSON object — the helper just deserializes and propagates
// non-2xx as Error.

export interface Page<T> {
  rows: T[];
  total: number;
  limit: number;
  offset: number;
}

async function getJson<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue;
      url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    let msg: string;
    try {
      const body = (await res.json()) as { error?: string };
      msg = body.error ?? `${res.status} ${res.statusText}`;
    } catch {
      msg = `${res.status} ${res.statusText}`;
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export const api = {
  dashboard: () => getJson<DashboardTotals>('/api/dashboard'),
  endpoints: (params?: Record<string, string | number | undefined>) =>
    getJson<Page<EndpointRow>>('/api/endpoints', params),
  recordings: (params?: Record<string, string | number | undefined>) =>
    getJson<Page<RecordingRow>>('/api/recordings', params),
  recording: (appmap: string) =>
    getJson<{ recording: RecordingDetail; counts: Record<string, number> }>(
      '/api/recording',
      { appmap }
    ),
  requests: (params?: Record<string, string | number | undefined>) =>
    getJson<Page<RequestRow>>('/api/requests', params),
  queries: (params?: Record<string, string | number | undefined>) =>
    getJson<Page<QueryRow>>('/api/queries', params),
  calls: (params?: Record<string, string | number | undefined>) =>
    getJson<Page<CallRow>>('/api/calls', params),
  logs: (params?: Record<string, string | number | undefined>) =>
    getJson<Page<LogRow>>('/api/logs', params),
  exceptions: (params?: Record<string, string | number | undefined>) =>
    getJson<Page<ExceptionRow>>('/api/exceptions', params),
  functionHotspots: (params?: Record<string, string | number | undefined>) =>
    getJson<Page<FunctionHotspotRow>>('/api/functions/hotspots', params),
  sqlHotspots: (params?: Record<string, string | number | undefined>) =>
    getJson<Page<SqlHotspotRow>>('/api/sql/hotspots', params),
  labels: () => getJson<LabelRow[]>('/api/labels'),
  tree: (params: Record<string, string | number | undefined>) =>
    getJson<TreeResult>('/api/tree', params),
  related: (params: Record<string, string | number | undefined>) =>
    getJson<Page<RelatedRow>>('/api/related', params),
  compare: (params: Record<string, string | number | undefined>) =>
    getJson<Page<CompareRow>>('/api/compare', params),
  search: (q: string, limit = 25) => getJson<SearchResult>('/api/search', { q, limit }),
};

// ---- types -------------------------------------------------------------

export interface DashboardTotals {
  recordings: number;
  requests: number;
  queries: number;
  exceptions: number;
  calls: number;
  avg_request_ms: number | null;
  earliest: string | null;
  latest: string | null;
}

export interface EndpointRow {
  method: string;
  route: string;
  count: number;
  avg_ms: number | null;
  p95_ms: number | null;
  err_pct: number;
}

export interface RecordingRow {
  appmap_id: number;
  appmap_name: string;
  source_path: string;
  path: string;
  label: string;
  kind: 'junit' | 'request' | 'other';
  route: string | null;
  status_code: number | null;
  elapsed_ms: number | null;
  sql_count: number;
  branch: string | null;
  timestamp: string | null;
}

export interface RecordingDetail {
  id: number;
  name: string;
  source_path: string;
  path: string;
  label: string;
  language: string | null;
  framework: string | null;
  recorder_type: string | null;
  git_repository: string | null;
  git_branch: string | null;
  git_commit: string | null;
  timestamp: string | null;
  event_count: number;
  sql_query_count: number;
  http_request_count: number;
  elapsed_ms: number | null;
}

export interface RequestRow {
  appmap_name: string;
  event_id: number;
  method: string;
  route: string;
  status_code: number;
  elapsed_ms: number | null;
  branch: string | null;
}

export interface QueryRow {
  appmap_name: string;
  event_id: number;
  elapsed_ms: number | null;
  caller_class: string | null;
  caller_method: string | null;
  sql_text: string;
}

export interface CallRow {
  appmap_name: string;
  event_id: number;
  fqid: string | null;
  defined_class: string;
  method_id: string;
  path: string | null;
  lineno: number | null;
  elapsed_ms: number | null;
  parameters_json: string | null;
  return_value: string | null;
}

export interface LogRow {
  appmap_name: string;
  event_id: number;
  parent_event_id: number | null;
  logger: string;
  method_id: string;
  path: string | null;
  lineno: number | null;
  message: string;
  parameters_json: string | null;
  return_value: string | null;
}

export interface ExceptionRow {
  appmap_id: number;
  appmap_name: string;
  event_id: number;
  return_event_id: number | null;
  exception_class: string;
  message: string | null;
  path: string | null;
  lineno: number | null;
  recent_logs?: LogRow[];
}

export interface FunctionHotspotRow {
  fqid: string | null;
  defined_class: string;
  method_id: string;
  path: string | null;
  lineno: number | null;
  calls: number;
  total_ms: number;
  self_ms: number;
}

export interface SqlHotspotRow {
  count: number;
  avg_ms: number;
  total_ms: number;
  sql_text: string;
}

export interface LabelRow {
  label: string;
  count: number;
  sample_fqid: string;
}

export interface TreeNode {
  event_id: number;
  parent_event_id: number | null;
  thread_id: number | null;
  depth: number;
  kind: 'function' | 'sql' | 'http_server' | 'http_client' | 'exception' | 'log';
  // kind-specific fields are loose here; the renderer reads what it needs.
  [key: string]: unknown;
}

export interface TreeResult {
  nodes: TreeNode[];
  truncated: boolean;
  max_depth_reached?: boolean;
  next_step?: { tool: string; args: Record<string, unknown> } | null;
}

export interface RelatedRow {
  appmap_name: string;
  source_path: string;
  score: number;
  method: string | null;
  route: string | null;
  status_code: number | null;
  elapsed_ms: number | null;
  shared: string[];
}

export interface CompareRow {
  method: string;
  route: string;
  a_count: number;
  a_p95_ms: number | null;
  b_count: number;
  b_p95_ms: number | null;
  delta: number | null;
}

export interface SearchResult {
  query: string;
  filters: Record<string, string>;
  recordings?: Page<RecordingRow>;
  requests?: Page<RequestRow>;
  queries?: Page<QueryRow>;
  calls?: Page<CallRow>;
  exceptions?: Page<ExceptionRow>;
}
