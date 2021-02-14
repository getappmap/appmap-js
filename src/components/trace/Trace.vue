<template>
  <div class="trace">
    <v-trace-event-block
      v-for="event in events"
      :key="event.id"
      :event="event"
      @updated="$emit('updated')"
      ref="nodes"
    />
  </div>
</template>

<script>
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
  display: inline-block;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.8rem;
}
</style>
