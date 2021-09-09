const { default: Vue } = require('vue');
const { default: Vuex } = require('vuex');
const { default: plugin, VVsCodeExtension } = require('@appland/components');

require('@appland/diagrams/dist/style.css');

Vue.use(Vuex);
Vue.use(plugin);

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

    // Load your appmap.json here
    ui.loadData({});
  },
});

app.$on('viewSource', () => {
  // do something
});
