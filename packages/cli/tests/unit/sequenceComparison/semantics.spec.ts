import { dirname, join } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import { buildComparisonBundle as sourceBuild } from '../../../src/cmds/sequenceDiagramCompare';
import { Call, flatten, ownedFixture, recording } from './support';
import { scenarios } from './gherkin';

type Bundle = Awaited<ReturnType<typeof sourceBuild>>;
const compiledBuild: typeof sourceBuild = (...args) => {
  const command = require(
    join(__dirname, '../../../built/cmds/sequenceDiagramCompare')
  ) as typeof import('../../../src/cmds/sequenceDiagramCompare');
  return command.buildComparisonBundle(...args);
};
const exec = promisify(execFile);
const cliBuild: typeof sourceBuild = async (base, head, options = {}) => {
  const output = join(dirname(base), `cli-${String(options.loops)}.json`);
  await exec(
    process.execPath,
    [
      join(__dirname, '../../../built/cli.js'),
      'sequence-diagram-compare',
      base,
      head,
      '--output-file',
      output,
      ...(options.loops === undefined ? [] : ['--loops', String(options.loops)]),
    ],
    { cwd: dirname(base), env: { ...process.env, APPMAP_TELEMETRY_DISABLED: 'true' } }
  );
  return JSON.parse(await readFile(output, 'utf8')) as Bundle;
};
const a = (result = 'String'): Call => ({ name: 'a', result });
const parent = (children: Call[]): Call[] => [{ name: 'parent', children }];
const query = (sql: string): Call => ({ name: 'sql', query: sql });
const select = 'SELECT * FROM users WHERE ...';
const remove = 'DELETE FROM orders WHERE ...';
const cases: Record<string, { base: Call[]; head: Call[]; compressed: boolean }> = {
  'return-change': {
    base: parent([a(), a(), a()]),
    head: parent([a(), a('Integer'), a()]),
    compressed: true,
  },
  'truncated-sql': {
    base: parent([query(select), query(select)]),
    head: parent([query(select), query(remove)]),
    compressed: true,
  },
  repetition: { base: parent([a(), a()]), head: parent([a(), a(), a()]), compressed: true },
  'nested-repetition': {
    base: parent([
      { name: 'p', children: [a(), a()] },
      { name: 'p', children: [a(), a()] },
    ]),
    head: parent([
      { name: 'p', children: [a(), a()] },
      { name: 'p', children: [a(), a(), a()] },
    ]),
    compressed: true,
  },
  'insert-before': { base: [a()], head: [a('Integer'), a()], compressed: false },
  'insert-after': { base: [a()], head: [a(), a('Integer')], compressed: false },
  'ordinary-sql-literal': {
    base: [query('SELECT * FROM users WHERE id = 1')],
    head: [query('SELECT * FROM users WHERE id = 2')],
    compressed: false,
  },
  'repeated-sql-literal': {
    base: parent([
      query('SELECT * FROM users WHERE id = 1'),
      query('SELECT * FROM users WHERE id = 1'),
    ]),
    head: parent([
      query('SELECT * FROM users WHERE id = 1'),
      query('SELECT * FROM users WHERE id = 2'),
    ]),
    compressed: true,
  },
  'rpc-server-status': {
    base: parent([
      { name: 'http', http: { kind: 'server', path: '/users', status: 200 } },
      { name: 'http', http: { kind: 'server', path: '/users', status: 200 } },
    ]),
    head: parent([
      { name: 'http', http: { kind: 'server', path: '/users', status: 200 } },
      { name: 'http', http: { kind: 'server', path: '/users', status: 404 } },
    ]),
    compressed: true,
  },
  'rpc-client-route': {
    base: [{ name: 'http', http: { kind: 'client', path: '/users', status: 200 } }],
    head: [{ name: 'http', http: { kind: 'client', path: '/orders', status: 200 } }],
    compressed: false,
  },
  'labels-and-timing': {
    base: [{ name: 'a', labels: ['before'], elapsed: 1 }],
    head: [{ name: 'a', labels: ['after'], elapsed: 20 }],
    compressed: false,
  },
  'shared-target': {
    base: parent([a(), a()]),
    head: parent([a(), a(), a(), a()]),
    compressed: true,
  },
  'query-parent-reparent': {
    base: [
      { ...query('SELECT * FROM users WHERE id = 1'), children: [{ name: 'child' }] },
      query('SELECT * FROM orders WHERE id = 1'),
    ],
    head: [
      query('SELECT * FROM users WHERE id = 1'),
      { ...query('SELECT * FROM orders WHERE id = 1'), children: [{ name: 'child' }] },
    ],
    compressed: false,
  },
  reparent: {
    base: parent([a(), a(), a(), { name: 'p', children: [{ name: 'child' }] }, { name: 'q' }]),
    head: parent([a(), a(), a(), { name: 'p' }, { name: 'q', children: [{ name: 'child' }] }]),
    compressed: true,
  },
};
// Parent element IDs are navigation, not source coordinates or semantic identity.
function canonical(bundle: Bundle) {
  return JSON.parse(
    JSON.stringify(
      bundle.changes.map(({ id, kind, details }) => ({ id, kind, details })),
      (key, value: unknown) => (key === 'parentElementId' ? undefined : value)
    )
  ) as unknown;
}
let fixture: Awaited<ReturnType<typeof ownedFixture>>;
beforeEach(async () => {
  fixture = await ownedFixture();
});
afterEach(async () => {
  await fixture.clean();
});
describe.each([
  ['source', sourceBuild],
  ['compiled', compiledBuild],
  ['actual CLI', cliBuild],
] as const)('Gherkin semantic invariance through %s public API', (_entry, build) => {
  it.each(scenarios(join(__dirname, 'features/semantics.feature')))(
    '$name',
    async ({ name, steps }) => {
      let data: (typeof cases)[string];
      let bundles: Bundle[] = [];
      for (const step of steps) {
        if (step === `Given the ${name} recordings`) {
          data = cases[name];
          expect(data).toBeDefined();
          await fixture.put(recording(data.base), recording(data.head));
        } else if (step === 'When compared with grouping omitted, true and false') {
          bundles = await Promise.all(
            [{}, { loops: true }, { loops: false }].map((options) =>
              build(fixture.base, fixture.head, options)
            )
          );
        } else if (step === 'Then canonical changes and IDs are invariant') {
          expect(canonical(bundles[0])).toEqual(canonical(bundles[2]));
          expect(canonical(bundles[1])).toEqual(canonical(bundles[2]));
          expect(bundles[0].views.sequence).toEqual(bundles[1].views.sequence);
        } else if (step.startsWith('And exactly ')) {
          const [, count, kind] = /^And exactly (\d+) ([\w-]+) changes describe the behavior$/.exec(
            step
          )!;
          for (const bundle of bundles) {
            expect(bundle.changes.map((c) => c.kind)).toEqual(Array(Number(count)).fill(kind));
            if (name === 'query-parent-reparent')
              expect(bundle.changes[0].details?.location).toMatchObject({
                before: { ancestors: [{ name: 'SELECT * FROM users WHERE id = 1' }], index: 0 },
                after: { ancestors: [{ name: 'SELECT * FROM orders WHERE id = 1' }], index: 0 },
              });
            if (name === 'rpc-server-status')
              expect(bundle.changes[0].details?.result).toEqual({ before: '200', after: '404' });
            if (name === 'rpc-client-route')
              expect(bundle.changes[0].details?.name).toEqual({
                before: 'GET https://example.test/users',
                after: 'GET https://example.test/orders',
              });
            if (name === 'labels-and-timing') {
              const base = flatten(bundle.views.sequence.base)[0];
              const head = flatten(bundle.views.sequence.head)[0];
              expect(base.labels).toEqual(['before']);
              expect(head.labels).toEqual(['after']);
              expect(base.elapsed).not.toBe(head.elapsed);
            }
            if (name.startsWith('insert-')) {
              expect(bundle.changes[0].details?.result).toEqual({ after: 'integer' });
              expect(bundle.changes[0].base).toBeUndefined();
            }
          }
        } else if (
          step === 'And navigation retains authentic event subsets on the requested display'
        ) {
          for (const [i, bundle] of bundles.entries()) {
            for (const side of ['base', 'head'] as const) {
              const display = flatten(bundle.views.sequence[side]);
              const raw = flatten(bundles[2].views.sequence[side]);
              for (const change of bundle.changes) {
                const ref = change[side];
                expect(change.views.sequence?.[side]).toEqual(ref);
                if (!ref) continue;
                const target = display.filter((x) => ref.elementIds?.includes(x.elementId!));
                expect(target).toHaveLength(1);
                expect(ref.eventIds?.length).toBe(1);
                expect(target[0].eventIds).toEqual(expect.arrayContaining(ref.eventIds!));
                expect(
                  raw.filter((x) => ref.eventIds?.some((id) => x.eventIds.includes(id)))
                ).toHaveLength(1);
                const location = change.details?.location?.[side === 'base' ? 'before' : 'after'];
                if (location && typeof location === 'object' && !Array.isArray(location)) {
                  const parentId = location.parentElementId;
                  const rawAction = raw.find((x) => x.eventIds.includes(ref.eventIds![0]))!;
                  const rawParent = raw.find((x) => x.children.includes(rawAction));
                  const expected = rawParent
                    ? display.find((x) => x.eventIds.includes(rawParent.eventIds[0]))?.elementId
                    : null;
                  expect(parentId).toBe(expected);
                  // Three repetitions compress to a loop plus one representative,
                  // forcing later parent numbering to diverge from raw source order.
                  if (name === 'reparent' && i < 2 && rawParent) {
                    expect(expected).not.toBe(rawParent.elementId);
                  }
                }
              }
            }
            if (name === 'shared-target') {
              const refs = bundle.changes.map((c) => c.head!);
              expect(refs[0].eventIds).not.toEqual(refs[1].eventIds);
              if (i < 2) expect(refs[0].elementIds).toEqual(refs[1].elementIds);
            }
          }
          if (data!.compressed) {
            expect(
              ['base', 'head'].some((side) =>
                flatten(bundles[0].views.sequence[side as 'base' | 'head']).some(
                  (x) => x.nodeType === 1
                )
              )
            ).toBe(true);
          }
        } else if (step === 'And the overlay contains expanded semantic calls') {
          for (const bundle of bundles) {
            const overlay = flatten(bundle.views.sequence.diff);
            expect(overlay.some((x) => x.nodeType === 1)).toBe(false);
            expect(overlay.every((x) => x.eventIds.length === 1)).toBe(true);
            for (const change of bundle.changes) {
              const ref = change.views.sequence?.diff;
              const target = overlay.find((x) => ref?.elementIds?.includes(x.elementId!));
              expect(target).toBeDefined();
              expect(target?.eventIds).toEqual(ref?.eventIds);
              // Relocation is a semantic changed-call with the existing Move overlay
              // mode (4), not a changed-value mode (3).
              expect(target?.diffMode).toBe(
                change.details?.location ? 4 : change.kind.endsWith('-added') ? 1 : 3
              );
            }
          }
        } else if (
          step ===
          'And change IDs repeat and survive event renumbering and unrelated earlier insertion'
        ) {
          const original = bundles[0].changes.map(({ id, kind }) => ({ id, kind }));
          const repeated = await build(fixture.base, fixture.head);
          expect(repeated.changes.map(({ id, kind }) => ({ id, kind }))).toEqual(original);
          await fixture.put(
            recording(data!.base, 100),
            recording([{ name: '__unrelated', actor: 'Other' }, ...data!.head], 200)
          );
          const extended = await build(fixture.base, fixture.head);
          expect(extended.changes.map(({ id, kind }) => ({ id, kind }))).toEqual(
            expect.arrayContaining(original)
          );
          expect(extended.changes).toHaveLength(original.length + 1);
        } else throw new Error(`Unbound Gherkin step: ${step}`);
      }
    },
    30000
  );
});
