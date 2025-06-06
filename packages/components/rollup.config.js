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
  inlineDynamicImports: true,
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
            additionalData: '@import "@/scss/vue.scss";',
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
      terser(),
    ],
  };
  buildFormats.push(esConfig);
}
export default buildFormats;
