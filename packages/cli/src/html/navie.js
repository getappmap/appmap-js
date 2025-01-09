import Vue from 'vue';
import Vuex from 'vuex';
import plugin, { VChatSearch } from '@appland/components';

import '@appland/diagrams/dist/style.css';

Vue.use(Vuex);
Vue.use(plugin);

async function initializeApp() {
  return new Vue({
    el: '#app',
    render: (h) =>
      h(VChatSearch, {
        ref: 'ui',
        props: {},
      }),
  });
}

initializeApp();
