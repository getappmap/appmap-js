import React, { useEffect, useState } from 'react';
import { api, ExceptionRow } from '../lib/api';

export default function Exceptions() {
  const [rows, setRows] = useState<ExceptionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const page = await api.exceptions({ limit: 100, with_logs: 5 });
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
  if (rows.length === 0) return <div>
    <h1 className="text-2xl font-bold mb-6">Exceptions</h1>
    <div className="text-gray-500">No exceptions recorded.</div>
  </div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Exceptions</h1>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={`${r.appmap_id}-${r.event_id}`} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <span className="font-mono text-red-400 text-sm">{r.exception_class}</span>
                {r.message && (
                  <span className="text-gray-300 text-sm ml-2">: {r.message}</span>
                )}
              </div>
              <div className="text-xs text-gray-500 whitespace-nowrap">
                {r.appmap_name}
              </div>
            </div>
            {r.path && (
              <div className="text-xs text-gray-500 font-mono mb-2">
                {r.path}{r.lineno != null ? `:${r.lineno}` : ''}
              </div>
            )}
            {r.recent_logs && r.recent_logs.length > 0 && (
              <div className="mt-2 border-t border-gray-800 pt-2">
                <div className="text-xs text-gray-500 mb-1">Recent log lines (preceding throw):</div>
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
    </div>
  );
}
