const path = require('path');

module.exports = {
  core: {
    builder: 'webpack5',
  },
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials'],
  webpackFinal: async (config, { configType }) => {
    config.resolve.alias = {
      '@': path.resolve(__dirname, '..', 'src'),
      vue$: 'vue/dist/vue.esm.js',
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
};
