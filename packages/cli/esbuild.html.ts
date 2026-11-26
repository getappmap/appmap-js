import esbuild from 'esbuild';
import { htmlPlugin } from '@craftamap/esbuild-plugin-html';

// Every bundle below is loaded by a browser, so each one needs the same
// Node-globals treatment. Keep this shared rather than repeated per build:
// when `appmap.js` alone was missing `'process.env': '{}'`, the bare
// `process.env.NODE_DEBUG` read at the top of `node_modules/util/util.js`
// survived into the bundle and threw `process is not defined` at module
// init (reached via assert -> assertion_error -> require('util/')), so the
// viewer never mounted.
export const BROWSER_DEFINE: Record<string, string> = {
  'process.env': '{}',
  'process.env.NODE_ENV': '"production"',
  global: 'window',
};

// Node core modules that the Vue-based viewers pull in transitively.
const BROWSER_ALIAS: Record<string, string> = {
  http: require.resolve('stream-http'),
  https: require.resolve('https-browserify'),
};

const BASE_OPTIONS: esbuild.BuildOptions = {
  minify: true,
  sourcemap: true,
  target: 'es2021',
  metafile: true,
  bundle: true,
  logLevel: 'info',
  define: BROWSER_DEFINE,
};

interface HtmlFile {
  entryPoints: string[];
  filename: string;
  title?: string;
  htmlTemplate: string;
}

function browserBuild(
  options: esbuild.BuildOptions & { entryPoints: string[] },
  htmlFile: Omit<HtmlFile, 'entryPoints'>
): esbuild.BuildOptions {
  return {
    ...BASE_OPTIONS,
    ...options,
    plugins: [
      htmlPlugin({
        files: [{ entryPoints: options.entryPoints, ...htmlFile }],
      }),
    ],
  };
}

const VIEWER_ENTRY_POINTS = {
  appmap: 'src/html/appmap.js',
  sequenceDiagram: 'src/html/sequenceDiagram.js',
  navie: 'src/html/navie.js',
  queryUiViewer: 'src/html/query-ui/src/viewer.ts',
};

export const BROWSER_BUILDS: esbuild.BuildOptions[] = [
  // The Vue viewers. Nearly all of each one is @appland/components, so
  // they're built together with code splitting: the shared code lands once
  // in built/html/chunks/ rather than in every bundle. Splitting requires
  // ESM output, hence `format` and `scriptLoading: 'module'`.
  //
  // query-ui/viewer is the AppMap viewer that the Query UI's React detail
  // page loads via <iframe src="/viewer.html?appmap=…">. That server only
  // serves built/html/query-ui/, so uiServer.ts mounts the chunks too.
  //
  // The banner installs a `process` shim before the bundle runs because
  // transitive deps (e.g. @appland/telemetry's deprecation logger) make
  // unguarded `process.stderr.write(...)` calls; the query-ui viewer's
  // loadData() path hits them in normal use. esbuild prepends the banner to
  // every output file, chunks included, so the shim is in place before any
  // shared code runs.
  {
    ...BASE_OPTIONS,
    outdir: 'built/html',
    alias: BROWSER_ALIAS,
    format: 'esm',
    splitting: true,
    chunkNames: 'chunks/[name]-[hash]',
    banner: {
      js: 'window.process=window.process||{env:{},stderr:{write:function(){}},stdout:{write:function(){}},platform:"browser",version:""};',
    },
    entryPoints: [
      { in: VIEWER_ENTRY_POINTS.appmap, out: 'appmap' },
      { in: VIEWER_ENTRY_POINTS.sequenceDiagram, out: 'sequenceDiagram' },
      { in: VIEWER_ENTRY_POINTS.navie, out: 'navie' },
      { in: VIEWER_ENTRY_POINTS.queryUiViewer, out: 'query-ui/viewer' },
    ],
    plugins: [
      htmlPlugin({
        files: [
          {
            entryPoints: [VIEWER_ENTRY_POINTS.appmap],
            filename: 'appmap.html',
            title: 'AppMap Viewer',
            htmlTemplate: '<div id="app"></div>',
            scriptLoading: 'module',
          },
          {
            entryPoints: [VIEWER_ENTRY_POINTS.sequenceDiagram],
            filename: 'sequenceDiagram.html',
            title: 'AppMap Sequence Diagram Viewer',
            htmlTemplate: '<div id="app"></div>',
            scriptLoading: 'module',
          },
          {
            entryPoints: [VIEWER_ENTRY_POINTS.navie],
            filename: 'navie.html',
            title: 'AppMap Navie',
            htmlTemplate: '<div id="app"></div>',
            scriptLoading: 'module',
          },
          {
            entryPoints: [VIEWER_ENTRY_POINTS.queryUiViewer],
            filename: 'query-ui/viewer.html',
            scriptLoading: 'module',
            htmlTemplate: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AppMap Viewer</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body, #viewer { width: 100%; height: 100%; overflow: hidden; }
      body { background: #0a0a0f; color: #e5e7eb; font-family: system-ui, sans-serif; }
      #loading { display: flex; align-items: center; justify-content: center; height: 100%; color: #6b7280; }
      #error { display: none; padding: 2rem; color: #ef4444; }
    </style>
  </head>
  <body>
    <div id="loading">Loading AppMap...</div>
    <div id="error"></div>
    <div id="viewer"></div>
  </body>
</html>`,
          },
        ],
      }),
    ],
  },

  // Query UI React SPA — main app shell.
  //
  // Output goes under `built/html/query-ui/` so the cli's `query ui` verb
  // can serve it (`packages/cli/src/cmds/query/lib/uiServer.ts` looks
  // there). Tailwind CSS is built separately by `build:ui:css` and lands
  // at `built/html/query-ui/tailwind.css`, referenced from the inline
  // HTML template below.
  browserBuild(
    {
      outdir: 'built/html/query-ui',
      loader: { '.ts': 'tsx', '.tsx': 'tsx' },
      entryPoints: ['src/html/query-ui/src/main.tsx'],
    },
    {
      filename: 'index.html',
      htmlTemplate: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AppMap Query UI</title>
    <link rel="stylesheet" href="./tailwind.css" />
  </head>
  <body class="bg-gray-950 text-gray-100">
    <div id="root"></div>
  </body>
</html>`,
    }
  ),
];

if (require.main === module) {
  for (const options of BROWSER_BUILDS) {
    esbuild.build(options).catch((err) => {
      console.warn(err);
      process.exit(1);
    });
  }
}
