<template>
  <div class="event-block" :style="styles">
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
      :highlight="selectedEvents.includes(event)"
      :highlight-color="highlightColor"
      @expandChildren="toggleVisibility()"
      @click.native.stop="$emit('clickEvent', event)"
      ref="node"
    />

    <template v-if="isExpanded && event.children.length > 1">
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
      v-if="isExpanded"
      :events="event.children"
      :selected-events="selectedEvents"
      :highlight-color="highlightColor"
      :highlight-all="highlightAll"
      ref="children"
      @updated="onUpdate()"
      @expand="(e) => $emit('expand', e)"
      @collapse="(e) => $emit('collapse', e)"
      @clickEvent="(e) => $emit('clickEvent', e)"
    />
    <template v-else-if="!isExpanded && event.children.length > 0">
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
        v-if="!isExpanded && event.children.length > 0"
        :event="event"
        @click.native.stop="toggleVisibility()"
        ref="summary"
      />
    </template>
  </div>
</template>

<script>
import { Event } from '@/lib/models';
import Color from '@/lib/diagrams/helpers/color';
import OnResize from '@/components/mixins/onResize';
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
  mixins: [OnResize],
  props: {
    event: {
      type: Event,
      required: true,
    },
    selectedEvents: {
      type: Array,
      default: () => [],
    },
    highlightColor: String,
    highlightAll: Boolean,
    isFirstChild: Boolean,
    hasParent: Boolean,
  },
  data() {
    return {
      expanded: false,
      height: 0,
    };
  },
  methods: {
    onResize() {
      const { children } = this.$refs;
      if (!children) {
        return;
      }

      const nodes = children.nodes();
      if (!nodes) {
        return;
      }

      if (nodes.length > 1) {
        let topHeight;
        let bottomHeight;
        let topNode;
        let bottomNode;

        for (let i = 0; i < nodes.length; i += 1) {
          const currentNode = nodes[i];
          const { offsetTop } = currentNode.$el;

          if (!topNode || topHeight > offsetTop) {
            topNode = currentNode;
            topHeight = offsetTop;
          }

          if (!bottomNode || bottomHeight < offsetTop) {
            bottomNode = currentNode;
            bottomHeight = offsetTop;
          }
        }

        const { y: yA } = topNode.$el.getBoundingClientRect();
        const { y: yB } = bottomNode.$el.getBoundingClientRect();

        this.height = yB - yA;
      }
    },
    toggleVisibility() {
      this.expanded = !this.expanded;

      // Cache the expanded state on the event
      if (this.cacheState) {
        this.event.$hidden.expanded = this.expanded;
      }

      this.$nextTick(() => {
        if (this.expanded) {
          this.$emit('expand', this.$refs.node);
        } else {
          this.$emit('collapse', this.$refs.node);
        }
      });
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
    initialize() {
      if (
        this.selectedEvents.length &&
        (this.selectedEvents.map((e) => e.parent).includes(this.event) ||
          this.selectedEvents
            .map((e) => e.ancestors())
            .flat()
            .includes(this.event))
      ) {
        this.expanded = true;
      }
    },
  },
  computed: {
    isExpanded() {
      return (
        this.expanded ||
        (this.selectedEvents.length &&
          (this.selectedEvents.map((e) => e.parent).includes(this.event) ||
            this.selectedEvents
              .map((e) => e.ancestors())
              .flat()
              .includes(this.event)))
      );
    },
    children() {
      console.log('updating children');
      return this.event.children;
    },
    verticalHeight() {
      return Math.max(this.height, 0);
    },
    styles() {
      let result = {};
      if (
        this.highlightAll &&
        this.highlightColor &&
        this.selectedEvents.includes(this.event)
      ) {
        const color = Color.rgba(this.highlightColor, 0.4);
        result = {
          'background-color': color,
          outline: `0.5rem solid ${color}`,
        };
      }
      return result;
    },
  },
  async updated() {
    this.initialize();
  },
  mounted() {
    this.initialize();
  },
};
</script>

<style lang="scss">
.event-block {
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  margin-bottom: 1rem;

  & > * {
    flex: inherit;
  }
  & > .trace {
    margin-left: 74px;
  }
}
</style>
