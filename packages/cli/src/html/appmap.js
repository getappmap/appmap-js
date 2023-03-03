import Vue from 'vue';
import Vuex from 'vuex';
import plugin, { VVsCodeExtension } from '@appland/components';

import '@appland/diagrams/dist/style.css';

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
      const res = await fetch(appmap);

      const { ui } = this.$refs;

      ui.loadData((await res.json()) || {});
    },
  });
}

initializeApp();
