const path = require('path');

module.exports = {
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

    let rule = config.module.rules.find(
      (r) =>
        r.test &&
        r.test.toString().includes('svg') &&
        r.loader &&
        r.loader.includes('file-loader')
    );
    rule.test = /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|cur|ani)(\?.*)?$/;

    config.module.rules.push({
      test: /\.svg$/,
      use: ['vue-svg-loader'],
    });

    return config;
  },
};
