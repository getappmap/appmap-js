import Vue from 'vue';
import Vuex from 'vuex';
import plugin, { VChatSearch } from '@appland/components';

import '@appland/diagrams/dist/style.css';

Vue.use(Vuex);
Vue.use(plugin);

async function initializeApp() {
  const params = new URL(document.location).searchParams;
  const rpcUrl = params.get('rpcUrl');
  const rpcPort = params.get('rpcPort');
  const question = params.get('question');

  const props = {};

  if (rpcUrl) {
    props.appmapRpcUrl = rpcUrl;
  } else if (rpcPort) {
    props.appmapRpcPort = parseInt(rpcPort);
  }
  if (question) props.question = question;

  return new Vue({
    el: '#app',
    render: (h) =>
      h(VChatSearch, {
        ref: 'ui',
        props,
      }),
  });
}

initializeApp();
