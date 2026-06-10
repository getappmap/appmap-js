import esbuild from 'esbuild';
import { htmlPlugin } from '@craftamap/esbuild-plugin-html';

esbuild
  .build({
    minify: true,
    sourcemap: true,
    target: 'es2021',
    metafile: true,
    outdir: 'built/html',
    bundle: true,
    logLevel: 'info',
    define: {
      'process.env.NODE_ENV': '"production"',
      global: 'window',
    },
    alias: {
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
    },
    entryPoints: ['src/html/appmap.js'],
    plugins: [
      htmlPlugin({
        files: [
          {
            entryPoints: ['src/html/appmap.js'],
            filename: 'appmap.html',
            title: 'AppMap Viewer',
            htmlTemplate: '<div id="app"></div>',
          },
        ],
      }),
    ],
  })
  .catch((err) => {
    console.warn(err);
    process.exit(1);
  });
esbuild
  .build({
    minify: true,
    sourcemap: true,
    target: 'es2021',
    metafile: true,
    outdir: 'built/html',
    bundle: true,
    logLevel: 'info',
    define: {
      'process.env': '{}',
      'process.env.NODE_ENV': '"production"',
      global: 'window',
    },
    // inject: [require.resolve('process/browser')],
    alias: {
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
    },
    entryPoints: ['src/html/sequenceDiagram.js'],
    plugins: [
      htmlPlugin({
        files: [
          {
            entryPoints: ['src/html/sequenceDiagram.js'],
            filename: 'sequenceDiagram.html',
            title: 'AppMap Sequence Diagram Viewer',
            htmlTemplate: '<div id="app"></div>',
          },
        ],
      }),
    ],
  })
  .catch((err) => {
    console.warn(err);
    process.exit(1);
  });
esbuild
  .build({
    minify: true,
    sourcemap: true,
    target: 'es2021',
    metafile: true,
    outdir: 'built/html',
    bundle: true,
    logLevel: 'info',
    define: {
      'process.env': '{}',
      'process.env.NODE_ENV': '"production"',
      global: 'window',
    },
    // inject: [require.resolve('process/browser')],
    alias: {
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
    },
    entryPoints: ['src/html/navie.js'],
    plugins: [
      htmlPlugin({
        files: [
          {
            entryPoints: ['src/html/navie.js'],
            filename: 'navie.html',
            title: 'AppMap Navie',
            htmlTemplate: '<div id="app"></div>',
          },
        ],
      }),
    ],
  })
  .catch((err) => {
    console.warn(err);
    process.exit(1);
  });

// Query UI React SPA — main app shell.
//
// Output goes under `built/html/query-ui/` so the cli's `query ui` verb
// can serve it (`packages/cli/src/cmds/query/lib/uiServer.ts` looks
// there). Tailwind CSS is built separately by `build:ui:css` and lands
// at `built/html/query-ui/tailwind.css`, referenced from the inline
// HTML template below.
esbuild
  .build({
    minify: true,
    sourcemap: true,
    target: 'es2021',
    metafile: true,
    outdir: 'built/html/query-ui',
    bundle: true,
    logLevel: 'info',
    define: {
      'process.env': '{}',
      'process.env.NODE_ENV': '"production"',
      global: 'window',
    },
    loader: { '.ts': 'tsx', '.tsx': 'tsx' },
    entryPoints: ['src/html/query-ui/src/main.tsx'],
    plugins: [
      htmlPlugin({
        files: [
          {
            entryPoints: ['src/html/query-ui/src/main.tsx'],
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
          },
        ],
      }),
    ],
  })
  .catch((err) => {
    console.warn(err);
    process.exit(1);
  });

// Query UI — embedded AppMap viewer.
//
// Vue 2 + @appland/components mount that the React detail page loads
// via <iframe src="/viewer.html?appmap=…">. Same alias setup as the
// other Vue-based viewers (appmap.html, sequenceDiagram.html).
//
// The banner installs a `process` shim before the bundle runs because
// transitive deps (e.g. @appland/telemetry's deprecation logger) make
// unguarded `process.stderr.write(...)` calls. The other Vue bundles
// carry the same code but just don't hit that codepath in normal use;
// loadData() in the dashboard's iframe path does.
esbuild
  .build({
    minify: true,
    sourcemap: true,
    target: 'es2021',
    metafile: true,
    outdir: 'built/html/query-ui',
    bundle: true,
    logLevel: 'info',
    define: {
      'process.env': '{}',
      'process.env.NODE_ENV': '"production"',
      global: 'window',
    },
    banner: {
      js: 'window.process=window.process||{env:{},stderr:{write:function(){}},stdout:{write:function(){}},platform:"browser",version:""};',
    },
    alias: {
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
    },
    entryPoints: ['src/html/query-ui/src/viewer.ts'],
    plugins: [
      htmlPlugin({
        files: [
          {
            entryPoints: ['src/html/query-ui/src/viewer.ts'],
            filename: 'viewer.html',
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
  })
  .catch((err) => {
    console.warn(err);
    process.exit(1);
  });
