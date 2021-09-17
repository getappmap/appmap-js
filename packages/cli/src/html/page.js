const { default: Vue } = require('vue');
const { default: Vuex } = require('vuex');
const { default: plugin, VVsCodeExtension } = require('@appland/components');

require('@appland/diagrams/dist/style.css');

Vue.use(Vuex);
Vue.use(plugin);

async function initializeApp() {
  return new Vue({
    el: '#app',
    render: (h) =>
      h(VVsCodeExtension, {
        ref: 'ui',
        props: {
          appMapUploadable: true,
        },
      }),
    async mounted() {
      const params = new URL(document.location).searchParams;
      const appmap = params.get('appmap');
      const res = await fetch(`/appmap?file=${encodeURIComponent(appmap)}`);
      const { ui } = this.$refs;

      ui.loadData((await res.json()) || {});
    },
  });
}

initializeApp();
