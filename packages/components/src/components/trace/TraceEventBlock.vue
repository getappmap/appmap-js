<template>
  <div :class="classes" :style="styles">
    <div
      class="event-block__connection"
      :style="connectionStyles"
      v-if="isLastChild"
    />
    <v-trace-node
      :event="event"
      :highlight="selectedEvents.includes(event)"
      :highlight-color="highlightColor"
      :highlight-style="highlightStyle"
      :focused="focusedEvent === event"
      @expandChildren="toggleVisibility()"
      @click.native.stop="$emit('clickEvent', event)"
      ref="node"
    />

    <v-trace
      v-if="isExpanded"
      :events="event.children"
      :selected-events="selectedEvents"
      :focused-event="focusedEvent"
      :highlight-color="highlightColor"
      :highlight-all="highlightAll"
      :highlight-style="highlightStyle"
      ref="children"
      @updated="onUpdate()"
      @expand="(e) => $emit('expand', e)"
      @collapse="(e) => $emit('collapse', e)"
      @clickEvent="(e) => $emit('clickEvent', e)"
    />

    <v-trace-summary
      v-if="!isExpanded && event.children.length > 0"
      :event="event"
      @click.native.stop="toggleVisibility()"
      ref="summary"
    />
  </div>
</template>

<script>
import { Event } from '@appland/models';
import { Color } from '@appland/diagrams';
import VTraceNode from './TraceNode.vue';
import VTraceSummary from './TraceSummary.vue';

export default {
  name: 'v-trace-event-block',
  components: {
    'v-trace': () => import('./Trace.vue'),
    VTraceNode,
    VTraceSummary,
  },
  props: {
    event: {
      type: Event,
      required: true,
    },
    selectedEvents: {
      type: Array,
      default: () => [],
    },
    focusedEvent: {
      type: Object,
      default: null,
    },
    highlightColor: String,
    highlightAll: Boolean,
    highlightStyle: String,
    isFirstChild: Boolean,
    isLastChild: Boolean,
    hasParent: Boolean,
  },
  data() {
    return {
      expanded: false,
      height: 0,
    };
  },
  methods: {
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
      if (this.hasSelectedEventInTree || this.hasFocusedEventInTree) {
        this.expanded = true;
      }
      this.height = this.$el.offsetHeight;
    },
  },
  computed: {
    isExpanded() {
      return (
        this.expanded ||
        this.hasSelectedEventInTree ||
        this.hasFocusedEventInTree
      );
    },
    children() {
      return this.event.children;
    },
    classes() {
      const classNames = ['event-block'];

      if (this.isFirstChild && this.isLastChild) {
        classNames.push('event-block--one-child');
      } else if (this.isFirstChild && !this.isLastChild) {
        classNames.push('event-block--first-child');
      } else if (this.isLastChild && !this.isFirstChild) {
        classNames.push('event-block--last-child');
      }

      return classNames;
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
    connectionStyles() {
      return {
        bottom: `${this.height - 36}px`,
      };
    },
    hasSelectedEventInTree() {
      return (
        this.selectedEvents.length &&
        (this.selectedEvents.map((e) => e.parent).includes(this.event) ||
          this.selectedEvents
            .map((e) => e.ancestors())
            .flat()
            .includes(this.event))
      );
    },
    hasFocusedEventInTree() {
      return (
        this.focusedEvent &&
        this.focusedEvent
          .ancestors()
          .map((e) => e.id)
          .includes(this.event.id)
      );
    },
  },
  updated() {
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

  &:not(:last-child) {
    margin-bottom: 1rem;
  }

  & > * {
    flex: inherit;
  }
  & > .trace {
    margin-left: 74px;
    position: relative;
  }
}

.event-block .trace .event-block--one-child::before {
  content: '';
  position: absolute;
  top: 36px;
  left: -74px;
  width: 74px;
  height: 4px;
  background-color: $gray4;
  z-index: -1;
}

.event-block .trace .event-block--first-child::before {
  content: '';
  position: absolute;
  top: 36px;
  left: -74px;
  width: 74px;
  height: 4px;
  background-color: $gray4;
  z-index: -1;
}

.event-block .trace .event-block--first-child::after {
  content: '';
  position: absolute;
  top: 36px;
  left: -74px;
  width: 37px;
  height: 37px;
  border-radius: 0 25px 0 0;
  border: 4px solid $gray4;
  border-bottom: 0;
  border-left: 0;
  z-index: -1;
}

.event-block
  .trace
  .event-block:not(.event-block--one-child):not(.event-block--first-child):not(.event-block--last-child) {
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 100%;
    width: 33px;
    height: 37px;
    border-radius: 0 0 0 25px;
    border: 4px solid $gray4;
    border-top: 0;
    border-right: 0;
    z-index: -1;
  }
}

.event-block .trace .event-block--last-child .event-block__connection {
  position: absolute;
  top: 74px;
  right: 100%;
  width: 37px;
  border-radius: 0 0 0 25px;
  border: 4px solid $gray4;
  border-top: 0;
  border-right: 0;
  z-index: -1;
}
</style>
