import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import sass from 'rollup-plugin-sass';
import sassRuntime from 'sass';
import pkg from './package.json';

const configBase = {
  input: 'src/index.js',
  external: Object.keys(pkg.dependencies),
  plugins: {
    sass: {
      output: 'dist/style.css',
      runtime: sassRuntime,
    },
  },
};

const configCjs = {
  ...configBase,
  output: {
    file: 'dist/index.cjs',
    format: 'cjs',
  },
  plugins: [resolve(), commonjs(), sass(configBase.plugins.sass)],
};

const configEsm = {
  ...configBase,
  output: {
    file: 'dist/index.js',
    format: 'esm',
  },
  plugins: [
    resolve(),
    commonjs(),
    sass(configBase.plugins.sass),
    replace({
      'process.env.NODE_ENV': 'production',
      'process.env.ES_BUILD': true,
    }),
  ],
};

export default [configCjs, configEsm];
