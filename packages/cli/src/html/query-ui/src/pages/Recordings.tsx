import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, RecordingRow } from '../lib/api';
import { formatMs, formatTime, statusColor, encodeAppmap } from '../lib/format';
import Table, { Column } from '../components/Table';

export default function Recordings() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<RecordingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const page = await api.recordings({ limit: 200 });
        if (!cancelled) {
          setRows(page.rows);
          setTotal(page.total);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-400">Error: {error}</div>;

  const columns: Column<RecordingRow>[] = [
    {
      key: 'kind',
      label: 'Kind',
      render: (r) => (
        <span className={`px-2 py-0.5 rounded text-xs font-mono ${
          r.kind === 'junit' ? 'bg-blue-900/40 text-blue-300'
            : r.kind === 'request' ? 'bg-green-900/40 text-green-300'
            : 'bg-gray-800 text-gray-400'
        }`}>{r.kind}</span>
      ),
      className: 'w-20',
    },
    {
      key: 'label',
      label: 'Recording',
      render: (r) => <span className="text-gray-200 text-xs font-mono">{r.label}</span>,
    },
    {
      key: 'route',
      label: 'Route',
      render: (r) => r.route ? (
        <span className="font-mono text-xs">
          <span className={r.status_code != null ? statusColor(r.status_code) : 'text-gray-400'}>
            {r.status_code ?? ''}
          </span> {r.route}
        </span>
      ) : <span className="text-gray-600">-</span>,
    },
    {
      key: 'branch',
      label: 'Branch',
      render: (r) => r.branch ? (
        <span className="bg-gray-800 px-2 py-0.5 rounded text-xs font-mono">{r.branch}</span>
      ) : <span className="text-gray-600">-</span>,
    },
    { key: 'sql_count', label: 'SQL', className: 'text-right' },
    {
      key: 'elapsed_ms',
      label: 'Duration',
      render: (r) => formatMs(r.elapsed_ms),
      className: 'text-right',
    },
    {
      key: 'timestamp',
      label: 'Recorded',
      render: (r) => <span className="text-gray-500 text-xs">{formatTime(r.timestamp)}</span>,
    },
  ];

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="text-2xl font-bold">Recordings</h1>
        <span className="text-gray-500 text-sm">{total} total</span>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <Table
          columns={columns}
          rows={rows}
          rowKey={(r) => r.path}
          onRowClick={(r) => navigate(`/recordings/detail?appmap=${encodeAppmap(r.path)}`)}
        />
      </div>
    </div>
  );
}
