import path from 'path';
import vue from 'rollup-plugin-vue';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import image from '@rollup/plugin-image';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import minimist from 'minimist';
import svg from './build/rollup-vue-svg';

const argv = minimist(process.argv.slice(2));
const baseConfig = {
  input: 'src/index.js',
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

// ESM/UMD/IIFE shared settings: externals
// Refer to https://rollupjs.org/guide/en/#warning-treating-module-as-external-dependency
const external = [
  // list external dependencies, exactly the way it is written in the import statement.
  // eg. 'jquery'
  'd3',
  'deepmerge',
  'sql-formatter',
  'd3-flame-graph',
  'dagre',
  'vuex',
  'vue',
];

// UMD/IIFE shared settings: output.globals
// Refer to https://rollupjs.org/guide/en#output-globals for details
const globals = {
  // Provide global variable names to replace your external imports
  // eg. jquery: '$'
  vue: 'Vue',
};

// Customize configs for individual targets
const buildFormats = [];
if (!argv.format || argv.format === 'es') {
  const esConfig = {
    ...baseConfig,
    external,
    output: {
      file: 'dist/appmap.esm.js',
      format: 'esm',
      exports: 'named',
    },
    plugins: [
      replace({
        ...baseConfig.plugins.replace,
        'process.env.ES_BUILD': JSON.stringify('true'),
      }),
      ...baseConfig.plugins.preVue,
      svg(),
      vue(baseConfig.plugins.vue),
      image({ exclude: ['**/*.svg'] }),
      commonjs(),
      terser(),
    ],
  };
  buildFormats.push(esConfig);
}

if (!argv.format || argv.format === 'cjs') {
  const umdConfig = {
    ...baseConfig,
    external,
    output: {
      compact: true,
      file: 'dist/appmap.ssr.js',
      format: 'cjs',
      name: 'appmap',
      exports: 'named',
      globals,
    },
    plugins: [
      replace(baseConfig.plugins.replace),
      ...baseConfig.plugins.preVue,
      vue({
        ...baseConfig.plugins.vue,
        template: {
          ...baseConfig.plugins.vue.template,
          optimizeSSR: true,
        },
      }),
      image(),
      babel(baseConfig.plugins.babel),
      commonjs(),
    ],
  };
  buildFormats.push(umdConfig);
}

if (!argv.format || argv.format === 'iife') {
  const unpkgConfig = {
    ...baseConfig,
    external,
    output: {
      compact: true,
      file: 'dist/appmap.min.js',
      format: 'iife',
      name: 'appmap',
      exports: 'named',
      globals,
    },
    plugins: [
      replace(baseConfig.plugins.replace),
      ...baseConfig.plugins.preVue,
      vue(baseConfig.plugins.vue),
      image(),
      babel(baseConfig.plugins.babel),
      commonjs(),
      terser({
        output: {
          ecma: 5,
        },
      }),
    ],
  };
  buildFormats.push(unpkgConfig);
}

// Export config
export default buildFormats;
