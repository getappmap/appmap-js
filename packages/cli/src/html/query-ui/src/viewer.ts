// Standalone AppMap viewer page.
//
// Loaded via /viewer.html?appmap=<path>. Fetches the raw .appmap.json
// from the gated /file?appmap=<path> endpoint, then mounts the
// @appland/components VVsCodeExtension Vue component to render the
// interactive diagram. Adapted from appmap-apm/src/viewer/main.ts —
// only the URL/API contract differs (path-based id; appmap-js gating).

import Vue from 'vue';
// @ts-ignore — no types for the Vue 2 component
import { VVsCodeExtension } from '@appland/components';
import '@appland/diagrams/dist/style.css';

const params = new URLSearchParams(window.location.search);
const appmapPath = params.get('appmap');

const loadingEl = document.getElementById('loading') as HTMLElement;
const errorEl = document.getElementById('error') as HTMLElement;
const viewerEl = document.getElementById('viewer') as HTMLElement;

function showError(msg: string): void {
  loadingEl.style.display = 'none';
  errorEl.style.display = 'block';
  errorEl.textContent = msg;
}

async function init(): Promise<void> {
  if (!appmapPath) {
    showError('No AppMap path provided. Use ?appmap=<path>');
    return;
  }

  try {
    const res = await fetch(`/file?appmap=${encodeURIComponent(appmapPath)}`);
    if (!res.ok) {
      showError(`Failed to load AppMap: ${res.status} ${res.statusText}`);
      return;
    }
    const data: unknown = await res.json();

    loadingEl.style.display = 'none';

    new Vue({
      el: viewerEl,
      render: (h) =>
        h(VVsCodeExtension, {
          ref: 'viewer',
          props: {
            defaultView: 'viewSequence',
            allowFullscreen: true,
            allowExport: false,
          },
        }),
      async mounted() {
        // Wait for the component ref to be available
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        while (!(this as any).$refs.viewer) {
          await Vue.nextTick();
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any).$refs.viewer.loadData(data);
      },
    });
  } catch (e) {
    showError(`Error: ${(e as Error).message}`);
  }
}

void init();
