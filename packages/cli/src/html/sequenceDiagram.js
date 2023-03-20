import Vue from 'vue';
import Vuex from 'vuex';
import plugin, { VDiagramSequence } from '@appland/components';

import '@appland/diagrams/dist/style.css';

Vue.use(Vuex);
Vue.use(plugin);

async function initializeApp() {
  return new Vue({
    el: '#app',
    render: (h) =>
      h(VDiagramSequence, {
        ref: 'ui',
        props: {
          interactive: false,
        },
      }),
    async mounted() {
      const params = new URL(document.location).searchParams;
      const diagram = params.get('diagram');
      const res = await fetch(`/resource?${encodeURIComponent(diagram)}`);
      const { ui } = this.$refs;

      ui.loadData((await res.json()) || {});
    },
  });
}

initializeApp();
