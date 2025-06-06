module.exports = {
  chainWebpack: (config) => {
    const svgRule = config.module.rule('svg');

      // Clear existing loaders for svg files
    svgRule.uses.clear();

      // Add vue-loader to handle SVGs as Vue components
    svgRule
        .test(/\.svg$/) // Ensure the rule still targets SVGs
        .use('vue-loader')
        .loader('vue-loader');
  },
  css: {
    loaderOptions: {
      sass: {
        prependData: '@import "src/scss/vue";',
      },
    },
  },
};
