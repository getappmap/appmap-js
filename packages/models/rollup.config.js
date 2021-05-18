import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import pkg from './package.json';

const configBase = {
  input: 'src/index.js',
  external: Object.keys(pkg.dependencies),
};

const configCjs = {
  ...configBase,
  output: {
    file: 'dist/index.cjs',
    format: 'cjs',
  },
  plugins: [resolve(), commonjs()],
};

const configEsm = {
  ...configBase,
  output: {
    file: 'dist/index.js',
    format: 'esm',
  },
  plugins: [
    alias({
      entries: {
        'sqlite-parser': 'sqlite-parser/dist/sqlite-parser.js',
      },
    }),
    resolve(),
    commonjs(),
    replace({
      'process.env.NODE_ENV': 'production',
      'process.env.ES_BUILD': true,
    }),
  ],
};

export default [configCjs, configEsm];
