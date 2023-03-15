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
  .catch(() => process.exit(1));

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
  .catch(() => process.exit(1));
