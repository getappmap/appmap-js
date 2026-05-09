import React, { useEffect, useState } from 'react';
import { api, EndpointRow } from '../lib/api';
import { formatMs, formatPct, methodBadge, severityColor } from '../lib/format';
import ExpandableTable from '../components/ExpandableTable';
import HeatBar from '../components/HeatBar';
import RequestTracePanel from '../components/RequestTracePanel';
import type { Column } from '../components/Table';

export default function Endpoints() {
  const [rows, setRows] = useState<EndpointRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const page = await api.endpoints({ limit: 100, sort: 'count' });
        if (!cancelled) setRows(page.rows);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-400">Error: {error}</div>;

  const maxAvg = Math.max(...rows.map((r) => r.avg_ms ?? 0), 1);

  const columns: Column<EndpointRow>[] = [
    { key: 'heat', label: '', render: (r) => <HeatBar value={r.avg_ms} max={maxAvg} />, className: 'w-24' },
    {
      key: 'method',
      label: 'Method',
      render: (r) => <span className={`px-2 py-0.5 rounded text-xs font-mono ${methodBadge(r.method)}`}>{r.method}</span>,
      className: 'w-20',
    },
    { key: 'route', label: 'Route', render: (r) => <span className="font-mono text-gray-200">{r.route}</span> },
    { key: 'count', label: 'Requests', className: 'text-right' },
    { key: 'avg_ms', label: 'Avg', render: (r) => <span className={severityColor(r.avg_ms)}>{formatMs(r.avg_ms)}</span>, className: 'text-right' },
    { key: 'p95_ms', label: 'p95', render: (r) => <span className={severityColor(r.p95_ms)}>{formatMs(r.p95_ms)}</span>, className: 'text-right' },
    {
      key: 'err_pct',
      label: 'Err%',
      render: (r) => <span className={r.err_pct > 0 ? 'text-red-400 font-semibold' : 'text-gray-500'}>{formatPct(r.err_pct)}</span>,
      className: 'text-right',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Endpoints</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <ExpandableTable
          columns={columns}
          rows={rows}
          rowKey={(r) => `${r.method}:${r.route}`}
          renderExpanded={(r) => (
            <RequestTracePanel focusType="http_server_request" focusValue={r.route} filterRoute={r.route} />
          )}
        />
      </div>
    </div>
  );
}
