<template>
  <div class="trace">
    <v-trace-event-block
      v-for="event in events"
      :key="event.id"
      :event="event"
      :selected-event="selectedEvent"
      :highlight-color="highlightColor"
      @updated="$emit('updated')"
      @expand="(e) => $emit('expand', e)"
      @collapse="(e) => $emit('collapse', e)"
      @clickEvent="(e) => $emit('clickEvent', e)"
      ref="nodes"
    />
  </div>
</template>

<script>
import { Event } from '@/lib/models';
import VTraceEventBlock from './TraceEventBlock.vue';

export default {
  name: 'v-trace',
  components: {
    VTraceEventBlock,
  },
  props: {
    events: {
      type: Array,
      required: true,
    },
    cacheState: {
      type: Boolean,
      default: false,
    },
    selectedEvent: Event,
    highlightColor: String,
  },
  methods: {
    nodes() {
      return this.$refs.nodes;
    },
  },
};

// This component is expected to be loaded dynamically as an asynchronous component. As such, we
// must propagate this flag if the module is transformed to CJS during bundling.
export const __esModule = true; // eslint-disable-line no-underscore-dangle
</script>

<style lang="scss">
@font-face {
  font-family: 'IBM Plex Mono';
  src: local('IBM Plex Mono'),
    url(../../assets/fonts/IBM_Plex_Mono/IBMPlexMono-Regular.ttf)
      format('truetype');
}
.trace {
  width: max-content;
  display: inline-block;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.8rem;
}
</style>
