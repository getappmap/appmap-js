const path = require('path');

module.exports = {
  'stories': [
    '../src/**/*.stories.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx)'
  ],
  'addons': [
    '@storybook/addon-links',
    '@storybook/addon-essentials'
  ],
  webpackFinal: async (config, { configType }) => {
    config.resolve.alias = {
      '@': path.resolve(__dirname, '..', 'src'),
      'vue$': 'vue/dist/vue.esm.js',
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
            resources: [ './src/scss/appland.scss' ],
          },
        },
      ],
      include: path.resolve(__dirname, '../')
    });

    return config;
  }
}
