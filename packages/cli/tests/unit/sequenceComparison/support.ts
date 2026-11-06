import { mkdtemp, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import type { ComparisonSequenceAction, ComparisonSequenceDiagram } from '@appland/models';

export type Call = {
  name: string;
  actor?: string;
  result?: string;
  properties?: { name: string; class: string }[];
  query?: string;
  http?: { kind: 'server' | 'client'; path: string; status: number };
  labels?: string[];
  elapsed?: number;
  children?: Call[];
};
export function recording(calls: Call[], start = 1): unknown {
  let id = start;
  const events: Record<string, unknown>[] = [];
  const classes = new Map<string, Set<string>>();
  const labels = new Map<string, string[]>();
  function visit(call: Call): void {
    const actor = call.actor || 'Service';
    const methods = classes.get(actor) || new Set<string>();
    methods.add(call.name);
    classes.set(actor, methods);
    if (call.labels) labels.set(`${actor}#${call.name}`, call.labels);
    const callId = id++;
    events.push({
      id: callId,
      event: 'call',
      thread_id: 1,
      defined_class: actor,
      method_id: call.name,
      static: false,
      path: `${actor}/${call.name}.ts`,
      lineno: 1,
      ...(call.query ? { sql_query: { sql: call.query, database_type: 'sqlite' } } : {}),
      ...(call.http?.kind === 'server'
        ? {
            http_server_request: {
              request_method: 'GET',
              path_info: call.http.path,
              normalized_path_info: call.http.path,
            },
          }
        : call.http?.kind === 'client'
          ? {
              http_client_request: {
                request_method: 'GET',
                url: `https://example.test${call.http.path}`,
              },
            }
          : {}),
    });
    (call.children || []).forEach(visit);
    events.push({
      id: id++,
      event: 'return',
      thread_id: 1,
      parent_id: callId,
      ...(call.elapsed === undefined ? {} : { elapsed: call.elapsed }),
      ...(call.http
        ? {
            [call.http.kind === 'server' ? 'http_server_response' : 'http_client_response']: {
              status: call.http.status,
            },
          }
        : {}),
      ...(call.result
        ? {
            return_value: {
              class: call.result,
              ...(call.properties ? { properties: call.properties } : {}),
            },
          }
        : {}),
    });
  }
  calls.forEach(visit);
  return {
    version: '1.2',
    metadata: { name: 'synthetic' },
    events,
    classMap: [...classes].map(([name, methods]) => ({
      name,
      type: 'package',
      children: [
        {
          name,
          type: 'class',
          children: [...methods].map((method) => ({
            name: method,
            type: 'function',
            static: false,
            ...(labels.has(`${name}#${method}`) ? { labels: labels.get(`${name}#${method}`) } : {}),
            location: `${name}/${method}.ts:1`,
          })),
        },
      ],
    })),
  };
}
export function flatten(diagram: ComparisonSequenceDiagram): ComparisonSequenceAction[] {
  const all: ComparisonSequenceAction[] = [];
  const visit = (action: ComparisonSequenceAction): void => {
    all.push(action);
    action.children.forEach(visit);
  };
  diagram.rootActions.forEach(visit);
  return all;
}
export async function ownedFixture(): Promise<{
  dir: string;
  base: string;
  head: string;
  output: string;
  put: (base: unknown, head: unknown) => Promise<void>;
  clean: () => Promise<void>;
}> {
  const dir = await mkdtemp(join(tmpdir(), 'ak7594-cli-'));
  const base = join(dir, 'base.appmap.json');
  const head = join(dir, 'head.appmap.json');
  return {
    dir,
    base,
    head,
    output: join(dir, 'comparison.json'),
    put: async (left, right) => {
      await writeFile(base, JSON.stringify(left));
      await writeFile(head, JSON.stringify(right));
    },
    clean: () => rm(dir, { recursive: true, force: true }),
  };
}
