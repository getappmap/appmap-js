import { createApp } from 'vue';
import plugin, { VVsCodeExtension } from '@appland/components';

import '@appland/diagrams/dist/style.css';

async function initializeApp() {
  const app = createApp(VVsCodeExtension, {
    appMapUploadable: true,
    flamegraphEnabled: false,
  });
  app.use(plugin);
  const vm = app.mount('#app');

  const params = new URL(document.location).searchParams;
  const appmap = params.get('appmap');
  const res = await fetch(appmap);
  vm.loadData((await res.json()) || {});
}

initializeApp();
