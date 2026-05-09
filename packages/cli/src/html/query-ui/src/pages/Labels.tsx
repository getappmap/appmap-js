import React, { useEffect, useState } from 'react';
import { api, CallRow, LabelRow } from '../lib/api';

export default function Labels() {
  const [labels, setLabels] = useState<LabelRow[] | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.labels().then(setLabels).catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!active) return;
    setCalls([]);
    void api
      .calls({ label: active, limit: 100 })
      .then((p) => setCalls(p.rows))
      .catch(() => setCalls([]));
  }, [active]);

  if (error) return <div className="text-red-400">Error: {error}</div>;
  if (!labels) return <div className="text-gray-400">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Labels</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {labels.map((l) => (
          <button
            key={l.label}
            onClick={() => setActive(active === l.label ? null : l.label)}
            className={`border rounded-full px-3 py-1 text-xs font-mono transition ${
              active === l.label
                ? 'border-blue-500 bg-blue-900/40 text-blue-200 ring-2 ring-blue-500'
                : labelColor(l.label)
            }`}
          >
            {l.label} <span className="text-gray-500 ml-1">{l.count}</span>
          </button>
        ))}
      </div>

      {active && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-400 mb-3">
            Calls labeled <span className="text-blue-400 font-mono">{active}</span>
          </h2>
          {calls.length === 0 ? (
            <div className="text-gray-500 text-sm">No calls.</div>
          ) : (
            <ul className="space-y-1 font-mono text-xs">
              {calls.map((c) => (
                <li key={`${c.appmap_name}-${c.event_id}`} className="text-gray-300">
                  <span className="text-blue-400">{c.fqid ?? `${c.defined_class}.${c.method_id}`}</span>
                  {c.path && (
                    <span className="text-gray-600 ml-2">
                      {c.path}{c.lineno != null ? `:${c.lineno}` : ''}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function labelColor(label: string): string {
  const prefix = label.split('.')[0];
  const map: Record<string, string> = {
    security: 'border-red-700 bg-red-950 text-red-200',
    log: 'border-purple-700 bg-purple-950 text-purple-200',
    crypto: 'border-yellow-700 bg-yellow-950 text-yellow-200',
    dao: 'border-blue-700 bg-blue-950 text-blue-200',
    job: 'border-green-700 bg-green-950 text-green-200',
    audit: 'border-orange-700 bg-orange-950 text-orange-200',
    secret: 'border-red-700 bg-red-950 text-red-200',
    deserialize: 'border-yellow-700 bg-yellow-950 text-yellow-200',
    system: 'border-gray-600 bg-gray-900 text-gray-300',
  };
  return `${map[prefix] ?? 'border-gray-700 bg-gray-900 text-gray-300'} hover:ring-1 hover:ring-gray-500`;
}
