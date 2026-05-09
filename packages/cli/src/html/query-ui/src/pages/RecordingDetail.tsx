import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, ExceptionRow, LogRow, RecordingDetail as Detail, RelatedRow } from '../lib/api';
import { formatMs, formatTime, statusColor, severityColor, encodeAppmap } from '../lib/format';
import RequestTracePanel from '../components/RequestTracePanel';

type TabKey = 'trace' | 'logs' | 'exceptions' | 'related';

export default function RecordingDetail() {
  const [params] = useSearchParams();
  const path = params.get('appmap');
  const [data, setData] = useState<{ recording: Detail; counts: Record<string, number> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('trace');

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    void api
      .recording(path)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [path]);

  if (!path) {
    return (
      <div>
        <Link to="/recordings" className="text-blue-400 hover:underline text-sm">&larr; Recordings</Link>
        <div className="mt-4 text-gray-400">No recording specified.</div>
      </div>
    );
  }
  if (error) return <div className="text-red-400">Error: {error}</div>;
  if (!data) return <div className="text-gray-400">Loading...</div>;

  const { recording: r, counts } = data;

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div className="flex-none mb-4">
        <Link to="/recordings" className="text-blue-400 hover:underline text-sm">&larr; Recordings</Link>
        <h1 className="text-xl font-bold mt-2 mb-2 font-mono">{r.label}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
          {r.framework && <span>{r.framework}</span>}
          {r.language && <span>{r.language}</span>}
          {r.git_branch && (
            <span className="bg-gray-800 px-2 py-0.5 rounded font-mono text-xs">{r.git_branch}</span>
          )}
          {r.git_commit && (
            <span className="font-mono text-xs text-gray-500">{r.git_commit.slice(0, 8)}</span>
          )}
          <span>{r.event_count} events</span>
          <span>{counts.sql_queries} SQL</span>
          <span>{counts.function_calls} fn</span>
          <span>{counts.exceptions} exc</span>
          <span className={severityColor(r.elapsed_ms)}>{formatMs(r.elapsed_ms)}</span>
          <span className="text-gray-500">{formatTime(r.timestamp)}</span>
        </div>
        <div className="text-xs text-gray-600 font-mono mt-1 truncate">{r.path}</div>
      </div>

      <div className="flex-none border-b border-gray-800 mb-4">
        <Tabs tab={tab} onChange={setTab} />
      </div>

      <div className="flex-1">
        {tab === 'trace' && <TraceTab path={path} />}
        {tab === 'logs' && <LogsTab path={path} />}
        {tab === 'exceptions' && <ExceptionsTab path={path} />}
        {tab === 'related' && <RelatedTab path={path} />}
      </div>
    </div>
  );
}

function Tabs({ tab, onChange }: { tab: TabKey; onChange: (t: TabKey) => void }) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'trace', label: 'Trace' },
    { key: 'logs', label: 'Logs' },
    { key: 'exceptions', label: 'Exceptions' },
    { key: 'related', label: 'Related' },
  ];
  return (
    <div className="flex gap-2">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-2 text-sm border-b-2 -mb-px ${
            tab === t.key ? 'border-blue-500 text-blue-300' : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function TraceTab({ path }: { path: string }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden" style={{ height: '70vh' }}>
        <iframe
          src={`/viewer.html?appmap=${encodeAppmap(path)}`}
          className="w-full h-full border-0"
          title="AppMap Viewer"
        />
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-sm font-medium text-gray-400 mb-3">Call tree</h2>
        <RequestTracePanel appmap={path} />
      </div>
    </div>
  );
}

function LogsTab({ path }: { path: string }) {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    void api.logs({ appmap: path, limit: 0 }).then((p) => {
      if (!cancelled) setRows(p.rows);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [path]);
  if (loading) return <div className="text-gray-400">Loading...</div>;
  if (rows.length === 0) return <div className="text-gray-500">No log calls captured.</div>;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <ul className="space-y-1 font-mono text-xs">
        {rows.map((r, i) => (
          <li key={i} className="flex gap-3 border-b border-gray-900 pb-1 last:border-b-0">
            <span className="text-purple-400 whitespace-nowrap">[{r.logger}]</span>
            <span className="text-gray-300 flex-1 break-all">{r.message}</span>
            {r.path && <span className="text-gray-600 whitespace-nowrap">{r.path}{r.lineno != null ? `:${r.lineno}` : ''}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExceptionsTab({ path }: { path: string }) {
  const [rows, setRows] = useState<ExceptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    void api.exceptions({ appmap: path, limit: 0, with_logs: 5 }).then((p) => {
      if (!cancelled) setRows(p.rows);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [path]);
  if (loading) return <div className="text-gray-400">Loading...</div>;
  if (rows.length === 0) return <div className="text-gray-500">No exceptions in this recording.</div>;
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.event_id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div>
            <span className="font-mono text-red-400 text-sm">{r.exception_class}</span>
            {r.message && <span className="text-gray-300 text-sm ml-2">: {r.message}</span>}
          </div>
          {r.path && (
            <div className="text-xs text-gray-500 font-mono mt-1">{r.path}{r.lineno != null ? `:${r.lineno}` : ''}</div>
          )}
          {r.recent_logs && r.recent_logs.length > 0 && (
            <div className="mt-2 border-t border-gray-800 pt-2">
              <div className="text-xs text-gray-500 mb-1">Preceding log lines:</div>
              <ul className="font-mono text-xs space-y-0.5">
                {r.recent_logs.map((l, i) => (
                  <li key={i} className="text-gray-300">
                    <span className="text-purple-400 mr-2">[{l.logger}]</span>
                    {l.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RelatedTab({ path }: { path: string }) {
  const [rows, setRows] = useState<RelatedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void api.related({ appmap: path, limit: 20 }).then((p) => {
      if (!cancelled) setRows(p.rows);
    }).catch((e: Error) => {
      if (!cancelled) setError(e.message);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [path]);
  if (loading) return <div className="text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-400">Error: {error}</div>;
  if (rows.length === 0) return <div className="text-gray-500">No related recordings.</div>;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li key={i} className="flex items-baseline gap-3 border-b border-gray-900 pb-2 last:border-b-0">
            <span className="text-blue-400 font-mono text-xs w-12 flex-none">×{r.score}</span>
            <Link
              to={`/recordings/detail?appmap=${encodeAppmap(r.source_path)}`}
              className="font-mono text-xs text-gray-200 hover:text-blue-300 flex-1 truncate"
            >
              {r.appmap_name}
            </Link>
            {r.status_code != null && (
              <span className={`font-mono text-xs ${statusColor(r.status_code)}`}>{r.status_code}</span>
            )}
            {r.elapsed_ms != null && (
              <span className={`text-xs ${severityColor(r.elapsed_ms)}`}>{formatMs(r.elapsed_ms)}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
