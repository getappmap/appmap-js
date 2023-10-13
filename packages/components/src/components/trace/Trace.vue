<template>
  <div class="trace">
    <v-trace-event-block
      v-for="(event, i) in events"
      :key="event.id"
      :event="event"
      :selected-events-for-diff="selectedEventsForDiff"
      :event-filter-matches="eventFilterMatches"
      :event-filter-match="eventFilterMatch"
      :event-filter-match-index="eventFilterMatchIndex"
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
    selectedEventsForDiff: {
      type: Array,
      default: () => [],
    },
    eventFilterMatches: {
      type: Set,
      default: new Set(),
    },
    eventFilterMatch: {
      type: Event,
      default: null,
    },
    eventFilterMatchIndex: {
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
.trace {
  width: max-content;
  display: inline-block;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.8rem;
}
</style>
