<template>
  <span class="trace">
    <div
      class="trace__event-block"
      v-for="(event, i) in events"
      :key="event.id"
      :ref="eventBlocks"
    >
      <template v-if="hasParent()">
        <v-trace-path
          v-if="i > 0"
          :element-from="collectInputs(i)"
          align="center left"
        />
        <v-trace-path
          v-else
          :element-from="collectInputs(i)"
          shape="line-h"
          align="center left"
          :width="100"
          :x="-100"
        />
      </template>

      <v-trace-node
        :event="event"
        @expandChildren="toggleVisibility(i)"
        ref="nodes"
      />

      <template v-if="expanded[i]">
        <v-trace-path
          :element-from="getOutput(i)"
          :width="-50"
          :height="-50"
          align="center right"
        />
        <v-trace-path
          :element-from="getOutput(i)"
          :width="5"
          :height="height"
          shape="line-v"
          align="center right"
          :x="50"
          :y="50"
        />
      </template>

      <v-trace
        :parent="this"
        :parent-event-index="i"
        :events="event.children"
        v-if="expanded[i]"
        ref="children"
      />
    </div>
  </span>
</template>

<script>
import VTraceNode from './TraceNode.vue';
import VTracePath from './TracePath.vue';

export default {
  name: 'v-trace',
  components: {
    VTraceNode,
    VTracePath,
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
  & > &__event-block {
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
