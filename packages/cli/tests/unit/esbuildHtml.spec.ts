import { BROWSER_BUILDS, BROWSER_DEFINE } from '../../esbuild.html';

// Regression guard for "Uncaught ReferenceError: process is not defined" in
// `appmap open`. The viewer bundles run in a browser, where `process` does not
// exist; esbuild's `define` is what erases the `process.env` reads that
// transitive Node deps make at module scope. `appmap.js` once drifted out of
// sync with its siblings and lost that define, which broke the viewer at load.
describe('browser bundle build options', () => {
  const entryPointOf = (options: (typeof BROWSER_BUILDS)[number]) =>
    (options.entryPoints as string[])[0];

  it('covers every browser entry point', () => {
    expect(BROWSER_BUILDS.map(entryPointOf)).toEqual([
      'src/html/appmap.js',
      'src/html/sequenceDiagram.js',
      'src/html/navie.js',
      'src/html/query-ui/src/main.tsx',
      'src/html/query-ui/src/viewer.ts',
    ]);
  });

  describe.each(BROWSER_BUILDS.map((options) => [entryPointOf(options), options] as const))(
    '%s',
    (_entryPoint, options) => {
      it('shims the Node globals that browsers lack', () => {
        expect(options.define).toEqual(BROWSER_DEFINE);
      });

      it("erases `process.env` reads so a bare `process` can't survive bundling", () => {
        expect(options.define?.['process.env']).toBe('{}');
      });
    }
  );
});
