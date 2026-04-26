<template>
  <div><slot /></div>
</template>
<script>
import { toRaw } from 'vue';
import eventBus from '@/lib/eventBus';

export default {
  name: 'v-export-json',
  props: {
    appMap: {
      type: Object,
      required: true,
    },
    viewState: {
      type: Object,
      required: true,
    },
  },
  methods: {
    download() {
      const { appMap, viewState } = this;
      if (!appMap) return;

      // appMap.toJSON() includes other data that we don't want. It's more a dump of the internal
      // state of the AppMap object.
      const appmapData = JSON.parse(JSON.stringify(toRaw(appMap)));
      if (viewState) {
        appmapData.viewState = { ...viewState };
      }
      eventBus.emit('exportJSON', appmapData);
    },
  },
};
</script>
