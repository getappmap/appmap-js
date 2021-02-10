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
    verticalOrigin: {
      type: Number,
    },
    parent: {
      type: Object,
    },
    parentEventIndex: {
      type: Number,
    },
  },
  data() {
    return {
      expanded: this.events.map((e) =>
        this.cacheState ? e.$hidden.expanded || false : false
      ),
    };
  },
  methods: {
    toggleVisibility(i) {
      const isExpanded = !this.expanded[i];
      this.$set(this.expanded, i, isExpanded);

      // Cache the expanded state on the event
      if (this.cacheState) {
        this.events[i].$hidden.expanded = isExpanded;
      }
    },
    async collectInputs(i) {
      return new Promise((resolve) => {
        this.$nextTick(() => {
          const { nodes } = this.$refs;
          resolve(nodes[i].$refs.flowIn);
        });
      });
    },
    async getOutput(i) {
      return new Promise((resolve) =>
        resolve(this.$refs.nodes[i].$refs.flowOut)
      );
    },
    hasParent() {
      return typeof this.parentEventIndex !== 'undefined';
    },
    nodes() {
      return this.$refs.nodes;
    },
  },
  computed: {
    height() {
      return this.$el.height;
    },
  },
};
</script>

<style lang="scss">
.trace {
  display: inline-block;
}
</style>
