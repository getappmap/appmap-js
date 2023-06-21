<template>
  <div class="flamegraph-hover">
    {{ content }}
  </div>
</template>
<script>
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
      return this.event ? this.event.toString() : '';
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
