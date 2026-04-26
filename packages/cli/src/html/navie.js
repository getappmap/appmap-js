import { createApp } from 'vue';
import plugin, { VChatSearch } from '@appland/components';

import '@appland/diagrams/dist/style.css';

async function initializeApp() {
  const params = new URL(document.location).searchParams;
  const rpcPort = params.get('rpcPort');
  const question = params.get('question');

  const props = {};
  if (rpcPort) props.appmapRpcPort = parseInt(rpcPort);
  if (question) props.question = question;

  const app = createApp(VChatSearch, props);
  app.use(plugin);
  app.mount('#app');
}

initializeApp();
