<template>
  <div class="flamegraph-hover">
    {{ content }}
  </div>
</template>
<script>
import { getEventDuration, isEventDurationValid, printDuration } from '@/lib/flamegraph';
import { Event } from '@appland/models';
export default {
  name: 'v-flamegraph-hover',
  props: {
    event: {
      type: Object,
      default: null,
      validator: (value) => value === null || value instanceof Event,
    },
  },
  computed: {
    content() {
      if (this.event) {
        if (isEventDurationValid(this.event)) {
          return `[${printDuration(getEventDuration(this.event), 6)}] ${this.event.toString()}`;
        } else {
          return this.event.toString();
        }
      } else {
        return '';
      }
    },
  },
};
</script>
<style scoped lang="scss">
.flamegraph-hover {
  font-family: 'IBM Plex Mono', monospace;
  white-space: nowrap;
  color: #b8bec6;
  padding: 10px;
  font-size: 12px;
  height: 32px;
  text-align: left;
}
</style>
