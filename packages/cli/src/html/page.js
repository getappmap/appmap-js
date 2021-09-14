const { default: Vue } = require('vue');
const { default: Vuex } = require('vuex');
const { default: plugin, VVsCodeExtension } = require('@appland/components');

require('@appland/diagrams/dist/style.css');

Vue.use(Vuex);
Vue.use(plugin);

// eslint-disable-next-line no-unused-vars
const app = new Vue({
  el: '#app',
  render: (h) =>
    h(VVsCodeExtension, {
      ref: 'ui',
      props: {
        appMapUploadable: true,
      },
    }),
  mounted() {
    const { ui } = this.$refs;

    const params = new URL(document.location).searchParams;
    const appmap = params.get('appmap');

    if (appmap) {
      ui.loadData(appmap);
    } else {
      ui.loadData({});
    }
  },
});
