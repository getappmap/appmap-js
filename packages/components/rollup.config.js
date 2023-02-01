import path from 'path';
import vue from 'rollup-plugin-vue';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import image from '@rollup/plugin-image';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import minimist from 'minimist';
import svg from './build/rollup-vue-svg';
import pkg from './package.json';

const argv = minimist(process.argv.slice(2));
const baseConfig = {
  input: 'src/index.js',
  external: Object.keys(pkg.dependencies),
  plugins: {
    preVue: [
      alias({
        resolve: ['.js', '.jsx', '.ts', '.tsx', '.vue', '.svg'],
        entries: {
          '@': path.resolve(__dirname, 'src'),
        },
      }),
    ],
    replace: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.ES_BUILD': JSON.stringify('false'),
    },
    vue: {
      css: true,
      data: {
        scss: () => '@import "src/scss/vue";',
      },
      style: {
        preprocessOptions: {
          scss: {
            importer: [
              (url) => ({
                file: url
                  .replace(/^~/, `${path.resolve(__dirname, 'node_modules')}/`)
                  .replace(/^@/, `${path.resolve(__dirname, 'src')}/`),
              }),
            ],
          },
        },
      },
      template: {
        isProduction: true,
      },
    },
    babel: {
      exclude: 'node_modules/**',
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue'],
    },
  },
};

// Customize configs for individual targets
const buildFormats = [];
if (!argv.format || argv.format === 'es') {
  const esConfig = {
    ...baseConfig,
    output: {
      file: 'dist/index.js',
      format: 'esm',
      exports: 'named',
      freeze: false,
    },
    plugins: [
      replace({
        ...baseConfig.plugins.replace,
        'process.env.ES_BUILD': JSON.stringify('true'),
      }),
      ...baseConfig.plugins.preVue,
      svg(),
      typescript({
        tsconfig: 'tsconfig.json',
      }),
      vue(baseConfig.plugins.vue),
      image({ exclude: ['**/*.svg'] }),
      commonjs(),

      // The Trace component is expected to be loaded dynamically as an asynchronous component.
      // However, because it's no longer a single module (it's bundled into a much larger module),
      // we must retain the `__esModule` flag in order for Vue to properly perform dynamic loading.
      //
      // See the following source:
      // https://github.com/vuejs/vue/blob/b51430f598b354ed60851bb62885539bd25de3d8/src/core/vdom/helpers/resolve-async-component.js#L18-L28
      // This may go away after updating to Vue 3?
      replace({ 'var Trace': 'var Trace = { __esModule: true, //' }),

      terser(),
    ],
  };
  buildFormats.push(esConfig);
}
export default buildFormats;
