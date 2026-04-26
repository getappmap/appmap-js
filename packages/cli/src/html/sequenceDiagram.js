import { createApp } from 'vue';
import plugin, { VSequenceDiagram } from '@appland/components';

import '@appland/diagrams/dist/style.css';

async function initializeApp() {
  const params = new URL(document.location).searchParams;
  const diagram = params.get('diagram');
  const res = await fetch(diagram);
  const json = await res.json();

  const app = createApp(VSequenceDiagram, {
    interactive: false,
    serializedDiagram: json || {},
  });
  app.use(plugin);
  app.mount('#app');
}

initializeApp();
