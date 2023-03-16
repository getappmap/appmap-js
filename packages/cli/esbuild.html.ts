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
    entryPoints: ['src/html/page.js'],
    plugins: [
      htmlPlugin({
        files: [
          {
            entryPoints: ['src/html/page.js'],
            filename: 'appmap.html',
            title: 'Appmap Viewer',
            htmlTemplate: '<div id="app"></div>',
          },
        ],
      }),
    ],
  })
  .catch(() => process.exit(1));
