import React, { useEffect, useState } from 'react';
import { api, SqlHotspotRow } from '../lib/api';
import { formatMs, severityColor } from '../lib/format';
import ExpandableTable from '../components/ExpandableTable';
import HeatBar from '../components/HeatBar';
import RequestTracePanel from '../components/RequestTracePanel';
import type { Column } from '../components/Table';

export default function Sql() {
  const [rows, setRows] = useState<SqlHotspotRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const page = await api.sqlHotspots({ limit: 100 });
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

  const maxTotal = Math.max(...rows.map((r) => r.total_ms ?? 0), 1);

  const columns: Column<SqlHotspotRow>[] = [
    { key: 'heat', label: '', render: (r) => <HeatBar value={r.total_ms} max={maxTotal} width="w-20" />, className: 'w-20' },
    {
      key: 'sql_text',
      label: 'Query',
      render: (r) => (
        <span className="font-mono text-xs text-gray-300" title={r.sql_text}>
          {r.sql_text.length > 120 ? r.sql_text.slice(0, 120) + '...' : r.sql_text}
        </span>
      ),
    },
    { key: 'count', label: 'Calls', className: 'text-right' },
    { key: 'avg_ms', label: 'Avg', render: (r) => <span className={severityColor(r.avg_ms)}>{formatMs(r.avg_ms)}</span>, className: 'text-right' },
    { key: 'total_ms', label: 'Total', render: (r) => <span className={severityColor(r.total_ms)}>{formatMs(r.total_ms)}</span>, className: 'text-right' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">SQL Hotspots</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <ExpandableTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.sql_text}
          renderExpanded={(r) => <RequestTracePanel focusType="sql_query" focusValue={r.sql_text} />}
        />
      </div>
    </div>
  );
}
