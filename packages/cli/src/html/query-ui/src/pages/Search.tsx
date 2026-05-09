import React, { useEffect, useRef, useState } from 'react';
import { api, SearchResult } from '../lib/api';
import { formatMs, methodBadge, severityColor, statusColor } from '../lib/format';
import Table, { Column } from '../components/Table';

const EXAMPLES: { label: string; query: string }[] = [
  { label: 'Errors', query: 'status:5xx' },
  { label: 'Slow requests', query: 'duration:>1s' },
  { label: 'Log output', query: 'label:log' },
  { label: 'Security', query: 'label:security' },
  { label: 'SQL on table', query: 'table:users' },
  { label: 'By exception', query: 'exception:NotFound' },
  { label: 'Last hour', query: 'last:1h' },
  { label: 'By branch', query: 'branch:main' },
];

export default function Search() {
  const [input, setInput] = useState('');
  const [debounced, setDebounced] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (input.length >= 2) {
      timer.current = setTimeout(() => setDebounced(input), 300);
    } else {
      setDebounced('');
    }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [input]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Search</h1>
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search... or use filters: status:500 label:log duration:>1s last:1h"
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 pr-20 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
          autoFocus
        />
        {input && (
          <button
            onClick={() => setInput('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {!debounced && (
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map(({ label, query }) => (
            <button
              key={query}
              onClick={() => setInput(query)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-xs"
            >
              {label} <span className="text-gray-500 ml-1">{query}</span>
            </button>
          ))}
        </div>
      )}

      {input.length > 0 && input.length < 2 && (
        <div className="text-gray-500 text-sm mt-2">Type at least 2 characters.</div>
      )}

      {debounced && <SearchResults query={debounced} />}
    </div>
  );
}

function SearchResults({ query }: { query: string }) {
  const [data, setData] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void api
      .search(query, 50)
      .then((r) => {
        if (!cancelled) {
          setData(r);
          setLoading(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [query]);

  if (loading) return <div className="text-gray-400 mt-4">Searching...</div>;
  if (error) return <div className="text-red-400 mt-4">Error: {error}</div>;
  if (!data) return null;

  const filterEntries = Object.entries(data.filters).filter(([, v]) => v != null && v !== '');
  const total =
    (data.requests?.rows.length ?? 0) +
    (data.queries?.rows.length ?? 0) +
    (data.calls?.rows.length ?? 0) +
    (data.exceptions?.rows.length ?? 0) +
    (data.recordings?.rows.length ?? 0);

  if (total === 0) return <div className="text-gray-500 mt-6">No results.</div>;

  return (
    <div className="mt-6 space-y-6">
      {filterEntries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filterEntries.map(([k, v]) => (
            <span key={k} className="bg-blue-900/40 text-blue-300 px-2 py-1 rounded text-xs font-mono">
              {k}: {v}
            </span>
          ))}
        </div>
      )}

      {data.recordings && data.recordings.rows.length > 0 && (
        <Section title={`Recordings (${data.recordings.total})`}>
          <Table
            columns={[
              { key: 'label', label: 'Recording', render: (r: { label: string }) => <span className="text-gray-200 font-mono text-xs">{r.label}</span> },
              { key: 'route', label: 'Route', render: (r: { route?: string | null }) => <span className="font-mono text-xs">{r.route ?? '-'}</span> },
              { key: 'kind', label: 'Kind' },
            ]}
            rows={data.recordings.rows as Record<string, unknown>[]}
            rowKey={(r) => String(r.path)}
          />
        </Section>
      )}

      {data.requests && data.requests.rows.length > 0 && (
        <Section title={`Requests (${data.requests.total})`}>
          <Table
            columns={[
              { key: 'method', label: 'Method', render: (r: { method: string }) => <span className={`font-mono px-2 py-0.5 rounded text-xs ${methodBadge(r.method)}`}>{r.method}</span> },
              { key: 'route', label: 'Route', render: (r: { route: string }) => <span className="font-mono text-xs">{r.route}</span> },
              { key: 'status_code', label: 'Status', render: (r: { status_code: number }) => <span className={`font-mono ${statusColor(r.status_code)}`}>{r.status_code}</span> },
              { key: 'elapsed_ms', label: 'Time', render: (r: { elapsed_ms: number | null }) => <span className={severityColor(r.elapsed_ms)}>{formatMs(r.elapsed_ms)}</span>, className: 'text-right' },
            ]}
            rows={data.requests.rows as Record<string, unknown>[]}
          />
        </Section>
      )}

      {data.queries && data.queries.rows.length > 0 && (
        <Section title={`SQL (${data.queries.total})`}>
          <Table
            columns={[
              { key: 'sql_text', label: 'Query', render: (r: { sql_text: string }) => <span className="font-mono text-xs text-gray-300">{r.sql_text.slice(0, 120)}</span> },
              { key: 'elapsed_ms', label: 'Time', render: (r: { elapsed_ms: number | null }) => <span className={severityColor(r.elapsed_ms)}>{formatMs(r.elapsed_ms)}</span>, className: 'text-right' },
            ]}
            rows={data.queries.rows as Record<string, unknown>[]}
          />
        </Section>
      )}

      {data.calls && data.calls.rows.length > 0 && (
        <Section title={`Functions (${data.calls.total})`}>
          <Table
            columns={[
              { key: 'fn', label: 'Function', render: (r: { fqid: string | null; defined_class: string; method_id: string }) => <span className="font-mono text-xs">{r.fqid ?? `${r.defined_class}.${r.method_id}`}</span> },
              { key: 'elapsed_ms', label: 'Time', render: (r: { elapsed_ms: number | null }) => <span className={severityColor(r.elapsed_ms)}>{formatMs(r.elapsed_ms)}</span>, className: 'text-right' },
            ] as Column<Record<string, unknown>>[]}
            rows={data.calls.rows as Record<string, unknown>[]}
          />
        </Section>
      )}

      {data.exceptions && data.exceptions.rows.length > 0 && (
        <Section title={`Exceptions (${data.exceptions.total})`}>
          <Table
            columns={[
              { key: 'exception_class', label: 'Exception', render: (r: { exception_class: string }) => <span className="font-mono text-red-300 text-xs">{r.exception_class}</span> },
              { key: 'message', label: 'Message', render: (r: { message: string | null }) => <span className="text-gray-400 text-xs">{r.message ?? '-'}</span> },
            ]}
            rows={data.exceptions.rows as Record<string, unknown>[]}
          />
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">{children}</div>
    </div>
  );
}
