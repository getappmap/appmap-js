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
