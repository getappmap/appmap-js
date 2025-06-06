const path = require('path');
const { dirname, join } = path;

module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-essentials'),
  ],

  webpackFinal: async (config, { configType }) => {
    config.resolve.alias = {
      '@': path.resolve(__dirname, '..', 'src'),
      vue$: 'vue/dist/vue.esm-bundler.js', // This must match the alias in packages/components/babel.config.js
    };

    config.resolve.fallback = {
      ...config.resolve.fallback,
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      buffer: require.resolve('buffer'),
    };

    config.module.rules.push({
      test: /\.scss$/,
      use: [
        'style-loader',
        'css-loader',
        'sass-loader',
        {
          loader: 'sass-resources-loader',
          options: {
            resources: ['./src/scss/vue.scss'],
          },
        },
      ],
      include: path.resolve(__dirname, '../'),
    });

    let rule = config.module.rules.find((r) => r.test && r.test.toString().includes('svg'));
    rule.test = new RegExp(rule.test.toString().replace(/(^\/)|(\|svg|svg\|)|(\/$)/g, ''));

    config.module.rules.push({
      test: /\.svg$/,
      use: ['vue-svg-loader'],
    });

    return config;
  },

  framework: {
    name: getAbsolutePath('@storybook/vue-webpack5'),
    options: {},
  },

  core: {
    disableTelemetry: true,
  },

  docs: {
    autodocs: true,
  },
};

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, 'package.json')));
}
