import React, { useState } from 'react';
import { api, CompareRow } from '../lib/api';
import { formatMs, severityColor } from '../lib/format';
import Table, { Column } from '../components/Table';

export default function Compare() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [rows, setRows] = useState<CompareRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!a || !b) return;
    setLoading(true);
    setError(null);
    try {
      const p = await api.compare({ branch_a: a, branch_b: b, sort: 'delta', limit: 100 });
      setRows(p.rows);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<CompareRow>[] = [
    { key: 'method', label: 'Method', className: 'font-mono w-20' },
    { key: 'route', label: 'Route', render: (r) => <span className="font-mono text-gray-200">{r.route}</span> },
    { key: 'a_count', label: 'A reqs', className: 'text-right' },
    { key: 'a_p95_ms', label: 'A p95', render: (r) => <span className={severityColor(r.a_p95_ms)}>{formatMs(r.a_p95_ms)}</span>, className: 'text-right' },
    { key: 'b_count', label: 'B reqs', className: 'text-right' },
    { key: 'b_p95_ms', label: 'B p95', render: (r) => <span className={severityColor(r.b_p95_ms)}>{formatMs(r.b_p95_ms)}</span>, className: 'text-right' },
    {
      key: 'delta',
      label: 'Δ (B/A)',
      render: (r) => {
        if (r.delta == null) return <span className="text-gray-500">-</span>;
        const cls =
          r.delta > 1.5 ? 'text-red-400' : r.delta > 1.1 ? 'text-orange-400' : r.delta < 0.9 ? 'text-green-400' : 'text-gray-300';
        return <span className={cls}>{r.delta.toFixed(2)}×</span>;
      },
      className: 'text-right',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Compare branches</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Branch A (baseline)</label>
          <input
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder="main"
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 font-mono text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Branch B</label>
          <input
            value={b}
            onChange={(e) => setB(e.target.value)}
            placeholder="feat/x"
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 font-mono text-sm"
          />
        </div>
        <button
          onClick={() => void run()}
          disabled={!a || !b || loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-1.5 rounded text-sm"
        >
          {loading ? 'Loading...' : 'Compare'}
        </button>
      </div>

      {error && <div className="text-red-400 mb-4">{error}</div>}

      {rows.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <Table columns={columns} rows={rows} rowKey={(r) => `${r.method}:${r.route}`} />
        </div>
      )}
    </div>
  );
}
