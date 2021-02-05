<template>
  <span class="trace">
    <div
      class="trace__event-block"
      v-for="(event, i) in events"
      :key="event.id"
    >
      <v-trace-node :event="event" @expandChildren="toggleVisibility(i)" />
      <v-trace :events="event.children" v-if="expanded[i]" />
    </div>
  </span>
</template>

<script>
import VTraceNode from './TraceNode.vue';

export default {
  name: 'v-trace',
  components: {
    VTraceNode,
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
  },
};
</script>

<style lang="scss">
.trace {
  &:nth-child(2) {
    margin-left: 5rem;
  }

  &__event-block {
    display: flex;
    flex-shrink: 0;
    align-items: start;
    margin-bottom: 1rem;
    & > * {
      flex: inherit;
    }
  }
}
</style>
