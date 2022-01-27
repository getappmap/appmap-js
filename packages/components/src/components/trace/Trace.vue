<template>
  <div class="trace">
    <v-trace-event-block
      v-for="(event, i) in events"
      :key="event.id"
      :event="event"
      :selected-events="selectedEvents"
      :focused-event="focusedEvent"
      :highlighted-events="highlightedEvents"
      :highlighted-event="highlightedEvent"
      :highlighted-event-index="highlightedEventIndex"
      :highlight-color="highlightColor"
      :highlight-all="highlightAll"
      :highlight-style="highlightStyle"
      :has-parent="Boolean(event.parent)"
      :is-first-child="i == 0"
      :is-last-child="i == events.length - 1"
      @updated="$emit('updated')"
      @expand="(e) => $emit('expand', e)"
      @collapse="(e) => $emit('collapse', e)"
      @clickEvent="(e) => $emit('clickEvent', e)"
      ref="nodes"
    />
  </div>
</template>

<script>
import { Event } from '@appland/models';
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
    selectedEvents: {
      type: Array,
      default: () => [],
    },
    focusedEvent: {
      type: Object,
      default: null,
    },
    highlightedEvents: {
      type: Set,
      default: new Set(),
    },
    highlightedEvent: {
      type: Event,
      default: null,
    },
    highlightedEventIndex: {
      type: Number,
      default: null,
    },
    highlightColor: String,
    highlightAll: Boolean,
    highlightStyle: String,
  },
  methods: {
    nodes() {
      return this.$refs.nodes;
    },
  },
};
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
