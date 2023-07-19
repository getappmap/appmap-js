module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
  plugins: [
    [
      require.resolve('babel-plugin-module-resolver'),
      {
        root: ['node_modules'],
        alias: {
          '^vue$': 'vue/dist/vue.common.dev.js', // This must match the alias in packages/components/.storybook/main.js
        },
      },
    ],
  ],
};
