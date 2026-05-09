import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, DashboardTotals, EndpointRow, FunctionHotspotRow, SqlHotspotRow, ExceptionRow } from '../lib/api';
import { formatMs, formatTime, severityColor } from '../lib/format';
import StatCard from '../components/StatCard';

interface State {
  totals: DashboardTotals;
  endpoints: EndpointRow[];
  fnHotspots: FunctionHotspotRow[];
  sqlHotspots: SqlHotspotRow[];
  exceptions: ExceptionRow[];
}

export default function Dashboard() {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [totals, endpoints, fnHs, sqlHs, exc] = await Promise.all([
          api.dashboard(),
          api.endpoints({ sort: 'avg', limit: 5 }),
          api.functionHotspots({ limit: 5 }),
          api.sqlHotspots({ limit: 5 }),
          api.exceptions({ limit: 5 }),
        ]);
        if (cancelled) return;
        setState({
          totals,
          endpoints: endpoints.rows,
          fnHotspots: fnHs.rows,
          sqlHotspots: sqlHs.rows,
          exceptions: exc.rows,
        });
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <div className="text-red-400">Error: {error}</div>;
  if (!state) return <div className="text-gray-400">Loading...</div>;
  const { totals, endpoints, fnHotspots, sqlHotspots, exceptions } = state;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Recordings" value={totals.recordings} />
        <StatCard label="HTTP Requests" value={totals.requests} />
        <StatCard label="SQL Queries" value={totals.queries} />
        <StatCard label="Function Calls" value={totals.calls} />
        <StatCard label="Exceptions" value={totals.exceptions} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 text-sm">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Avg HTTP latency</div>
          <div className={`text-xl font-bold ${severityColor(totals.avg_request_ms)}`}>{formatMs(totals.avg_request_ms)}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Earliest recording</div>
          <div className="text-base font-mono text-gray-300">{formatTime(totals.earliest)}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Latest recording</div>
          <div className="text-base font-mono text-gray-300">{formatTime(totals.latest)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Slowest Endpoints" link={{ to: '/endpoints', label: 'all' }}>
          {endpoints.length === 0 ? <Empty /> : endpoints.map((e) => (
            <Row key={`${e.method}:${e.route}`} left={<span className="font-mono text-xs">{e.method} {e.route}</span>}>
              <span className={severityColor(e.avg_ms)}>{formatMs(e.avg_ms)}</span>
              <span className="text-gray-500 ml-3 text-xs">{e.count} reqs</span>
            </Row>
          ))}
        </Section>

        <Section title="Hottest Functions" link={{ to: '/functions', label: 'all' }}>
          {fnHotspots.length === 0 ? <Empty /> : fnHotspots.map((h, i) => (
            <Row key={i} left={<span className="font-mono text-xs">{h.fqid ?? `${h.defined_class}.${h.method_id}`}</span>}>
              <span className={severityColor(h.total_ms)}>{formatMs(h.total_ms)}</span>
              <span className="text-gray-500 ml-3 text-xs">{h.calls} calls</span>
            </Row>
          ))}
        </Section>

        <Section title="Slowest SQL" link={{ to: '/sql', label: 'all' }}>
          {sqlHotspots.length === 0 ? <Empty /> : sqlHotspots.map((s, i) => (
            <Row key={i} left={<span className="font-mono text-xs text-gray-300" title={s.sql_text}>{s.sql_text.length > 80 ? s.sql_text.slice(0, 80) + '...' : s.sql_text}</span>}>
              <span className={severityColor(s.total_ms)}>{formatMs(s.total_ms)}</span>
              <span className="text-gray-500 ml-3 text-xs">{s.count}×</span>
            </Row>
          ))}
        </Section>

        <Section title="Recent Exceptions" link={{ to: '/exceptions', label: 'all' }}>
          {exceptions.length === 0 ? <Empty /> : exceptions.map((e) => (
            <Row key={e.event_id} left={<span className="font-mono text-red-400 text-xs">{e.exception_class}</span>}>
              <span className="text-gray-400 text-xs">{(e.message ?? '').slice(0, 60)}</span>
            </Row>
          ))}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, link, children }: { title: string; link?: { to: string; label: string }; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-400">{title}</h2>
        {link && <Link to={link.to} className="text-xs text-blue-400 hover:underline">{link.label}</Link>}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ left, children }: { left: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 border-b border-gray-900 last:border-b-0">
      <div className="flex-1 min-w-0 truncate">{left}</div>
      <div className="flex-none whitespace-nowrap">{children}</div>
    </div>
  );
}

function Empty() {
  return <div className="text-gray-600 text-sm">No data.</div>;
}
