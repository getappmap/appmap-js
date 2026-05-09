import React, { useEffect, useState } from 'react';
import { api, FunctionHotspotRow } from '../lib/api';
import { formatMs, severityColor } from '../lib/format';
import ExpandableTable from '../components/ExpandableTable';
import HeatBar from '../components/HeatBar';
import RequestTracePanel from '../components/RequestTracePanel';
import type { Column } from '../components/Table';

export default function Functions() {
  const [rows, setRows] = useState<FunctionHotspotRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const page = await api.functionHotspots({ limit: 50 });
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

  const columns: Column<FunctionHotspotRow>[] = [
    {
      key: 'fn',
      label: 'Function',
      render: (r) => (
        <div className="flex items-center gap-2">
          <HeatBar value={r.total_ms} max={maxTotal} width="w-24" />
          <FunctionName r={r} />
        </div>
      ),
    },
    { key: 'calls', label: 'Calls', className: 'text-right' },
    { key: 'total_ms', label: 'Total', render: (r) => <span className={severityColor(r.total_ms)}>{formatMs(r.total_ms)}</span>, className: 'text-right' },
    { key: 'self_ms', label: 'Self', render: (r) => <span className={severityColor(r.self_ms)}>{formatMs(r.self_ms)}</span>, className: 'text-right' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Function Hotspots</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <ExpandableTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.fqid ?? `${r.defined_class}.${r.method_id}`}
          isExpandable={(r) => Boolean(r.fqid)}
          renderExpanded={(r) =>
            r.fqid ? <RequestTracePanel focusType="function" focusValue={r.fqid} /> : null
          }
        />
      </div>
    </div>
  );
}

function FunctionName({ r }: { r: FunctionHotspotRow }) {
  const id = r.fqid ?? `${r.defined_class}.${r.method_id}`;
  const sep = id.lastIndexOf('#') >= 0 ? '#' : '.';
  const idx = id.lastIndexOf(sep);
  const prefix = idx >= 0 ? id.slice(0, idx + 1) : '';
  const method = idx >= 0 ? id.slice(idx + 1) : id;
  return (
    <div>
      <span className="font-mono text-gray-200 text-xs">
        {prefix}
        <span className="text-blue-400">{method}</span>
      </span>
      {r.path && <div className="text-xs text-gray-500 mt-0.5">{r.path}{r.lineno != null ? `:${r.lineno}` : ''}</div>}
    </div>
  );
}
