<template>
  <div class="event-block">
    <template v-if="hasParent">
      <v-trace-path
        v-if="isFirstChild"
        :element-from="collectInputs()"
        shape="line-h"
        align="center left"
        :width="100"
        :x="-100"
      />

      <v-trace-path
        v-else
        :element-from="collectInputs()"
        align="center left"
        :x="-2"
        :width="48"
      />
    </template>

    <v-trace-node
      :event="event"
      @expandChildren="toggleVisibility()"
      ref="node"
    />

    <template v-if="expanded && event.children.length > 1">
      <v-trace-path
        :element-from="getOutput()"
        :width="-50"
        :height="-50"
        align="center right"
      />
      <v-trace-path
        :element-from="getOutput()"
        :width="4"
        :height="verticalHeight"
        :v-if="verticalHeight > 0"
        shape="line-v"
        align="center right"
        :x="50"
        :y="45"
        :key="verticalHeight"
      />
    </template>

    <v-trace
      v-if="expanded"
      :events="event.children"
      ref="children"
      @updated="onUpdate()"
    />
    <template v-else-if="!expanded && event.children.length > 0">
      <v-trace-path
        shape="line-h"
        :width="16"
        :height="4"
        :elementFrom="getRef('summary')"
        align="bottom left"
        :y="-11"
        key="summary"
      />
      <v-trace-summary
        v-if="!expanded && event.children.length > 0"
        :event="event"
        @click="toggleVisibility()"
        ref="summary"
      />
    </template>
  </div>
</template>

<script>
import { Event } from '@/lib/models';
import VTraceNode from './TraceNode.vue';
import VTracePath from './TracePath.vue';
import VTraceSummary from './TraceSummary.vue';

export default {
  name: 'v-trace-event-block',
  components: {
    'v-trace': () => import('./Trace.vue'),
    VTraceNode,
    VTracePath,
    VTraceSummary,
  },
  props: {
    event: {
      type: Event,
      required: true,
    },
  },
  data() {
    return {
      expanded: this.cacheState ? this.event.$hidden.expanded || false : false,
      height: 0,
    };
  },
  methods: {
    toggleVisibility() {
      // this.expanded = !this.expanded;
      this.$set(this, 'expanded', !this.expanded);

      // Cache the expanded state on the event
      if (this.cacheState) {
        this.event.$hidden.expanded = this.expanded;
      }
    },
    async collectInputs() {
      return new Promise((resolve) => {
        this.$nextTick(() => {
          const { node } = this.$refs;
          resolve(node.$refs.flowIn);
        });
      });
    },
    async getOutput() {
      return new Promise((resolve) =>
        this.$nextTick(() => resolve(this.$refs.node.$refs.flowOut))
      );
    },
    async getRef(ref) {
      return new Promise((resolve) =>
        this.$nextTick(() => resolve(this.$refs[ref]))
      );
    },
    onUpdate() {
      const { children } = this.$refs;
      if (!children) {
        return;
      }

      const nodes = children.nodes();
      if (!nodes) {
        return;
      }

      if (nodes.length > 1) {
        const { y: yA } = nodes[0].$el.getBoundingClientRect();
        const { y: yB } = nodes[nodes.length - 1].$el.getBoundingClientRect();
        this.height = yB - yA;
        console.log(`${this.event} set height to ${this.height}`);
      }

      this.$emit('updated');
    },
  },
  computed: {
    hasParent() {
      return this.event.parent;
    },
    isFirstChild() {
      return this.$parent.$children[0] === this;
    },
    verticalHeight() {
      return Math.max(this.height, 0);
    },
  },
  updated() {
    this.onUpdate();
  },
  mounted() {
    // setTimeout(() => {
    //   this.expanded = true;
    // }, 16);
  },
};
</script>

<style lang="scss">
.event-block {
  display: flex;
  flex-shrink: 0;
  align-items: start;
  margin-bottom: 1rem;
  & > * {
    flex: inherit;
  }
  & > .trace {
    margin-left: 74px;
  }
}
</style>
