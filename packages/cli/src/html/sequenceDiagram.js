import Vue from 'vue';
import Vuex from 'vuex';
import { BlobReader, ZipReader } from '@zip.js/zip.js';
import plugin, { VDiagramSequence } from '@appland/components';

import '@appland/diagrams/dist/style.css';

Vue.use(Vuex);
Vue.use(plugin);

// https://stackoverflow.com/a/18650249/953770
async function blobToBase64(blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// https://stackoverflow.com/a/36183085/953770
async function base64UrltoBlob(base64Url) {
  return fetch(base64Url).then((res) => res.blob());
}

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
      const diagramUrl = params.get('diagram');
      let diagramData;
      if (diagramUrl.endsWith('.zip')) {
        const resourceId = params.get('resourceId');
        if (!resourceId) throw new Error(`resourceId is required with diagram resource ZIP file`);

        const localStorageKey = ['appmap', 'diagram', diagramUrl].join('-');
        let diagramDataEncoded;
        if (!['false', 'no'].includes(params.get('cache')))
          diagramDataEncoded = localStorage.getItem(localStorageKey);
        if (diagramDataEncoded) {
          diagramData = await base64UrltoBlob(diagramDataEncoded);
        } else {
          diagramData = await (await fetch(diagramUrl)).blob();
          diagramDataEncoded = await blobToBase64(diagramData);
          localStorage.setItem(localStorageKey, diagramDataEncoded);
        }

        // Creates a BlobReader object used to read `zipFileBlob`.
        const zipFileReader = new BlobReader(diagramData);
        // Creates a TransformStream object, the content of the first entry in the zip
        // will be written in the `writable` property.
        const dataStream = new TransformStream();
        // Creates a Promise object resolved to the content of the first entry returned
        // as text from `helloWorldStream.readable`.
        const dataStreamPromise = new Response(dataStream.readable).text();

        // Creates a ZipReader object reading the zip content via `zipFileReader`,
        // retrieves metadata (name, dates, etc.) of the first entry, retrieves its
        // content into `helloWorldStream.writable`, and closes the reader.
        const zipReader = new ZipReader(zipFileReader);
        const entries = await zipReader.getEntries();
        const requestedEntry = entries.find((entry) => entry.filename === resourceId);
        if (!requestedEntry) throw new Error(`Resource ${resourceId} not found in ${diagramUrl}`);

        await requestedEntry.getData(dataStream.writable);
        await zipReader.close();
        const diagramDataRaw = await dataStreamPromise;
        diagramData = JSON.parse(diagramDataRaw);
      } else {
        diagramData = (await fetch(diagramUrl)).json();
      }

      const { ui } = this.$refs;

      ui.loadData((await diagramData) || {});
    },
  });
}

initializeApp();
