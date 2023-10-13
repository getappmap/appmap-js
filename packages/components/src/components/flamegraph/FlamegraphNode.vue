<template>
  <div>
    <v-flamegraph-branch
      v-if="areChildrenVisible"
      :events="children"
      :factor="childrenFactor"
      :focus="focus"
      :base-budget="baseBudget"
      :zoom-budget="childrenZoomBudget"
      @select="propagateSelect"
      @hover="propagateHover"
    />
    <v-flamegraph-item
      :event="event"
      :classes="classes"
      :item-style="style"
      :content="content"
      @select="propagateSelect"
      @hover="propagateHover"
      @mousedown="mousedown"
      @mouseup="mouseup"
    />
  </div>
</template>

<script>
import VFlamegraphBranch from './FlamegraphBranch.vue';
import VFlamegraphItem from './FlamegraphItem.vue';
import {
  add,
  getEventDuration,
  isEventDurationValid,
  formatDurationMillisecond,
} from '../../lib/flamegraph';

const MIN_BORDER_WIDTH = 2;
const MIN_TEXT_WIDTH = 50;

export default {
  name: 'v-flamegraph-node',
  emits: ['select', 'hover'],
  components: {
    VFlamegraphBranch,
    VFlamegraphItem,
  },
  props: {
    event: {
      type: Object,
      required: true,
    },
    factor: {
      type: Number,
      required: true,
    },
    focus: {
      type: Object,
      default: null,
    },
    baseBudget: {
      type: Number,
      required: true,
    },
    zoomBudget: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      timer: 0,
    };
  },
  computed: {
    eventType() {
      const type =
        this.event.codeObject && this.event.codeObject.data && this.event.codeObject.type;

      return type ? type : 'default';
    },
    classes() {
      const result = [
        'flamegraph-item',
        `flamegraph-item-${this.eventType}`,
        `flamegraph-item-${this.status}`,
        `flamegraph-item-${this.dimension}`,
      ];

      if (this.isHighlighted) result.push('highlighted');
      return result;
    },
    isHighlighted() {
      return this.$store.state.highlightedEvents.some(
        (highlightedEvent) => highlightedEvent.id === this.event.id
      );
    },
    style() {
      return { width: `${this.width}px` };
    },
    content() {
      if (this.dimension === 'normal') {
        const duration = getEventDuration(this.event);
        if (duration > 0) {
          return `[${formatDurationMillisecond(duration, 3)}] ${this.event.toString()}`;
        } else {
          return this.event.toString();
        }
      } else {
        return '';
      }
    },
    width() {
      if (this.status === 'pruned') {
        return 0;
      } else if (this.status === 'branch') {
        return this.factor * this.zoomBudget;
      } else {
        return this.baseBudget;
      }
    },
    dimension() {
      if (this.width < MIN_BORDER_WIDTH) {
        return 'borderless';
      } else if (this.width < MIN_TEXT_WIDTH) {
        return 'textless';
      } else {
        return 'normal';
      }
    },
    ancestors() {
      return new Set(this.event.ancestors());
    },
    childrenZoomBudget() {
      return this.status === 'crown' ? this.zoomBudget / this.factor : this.zoomBudget;
    },
    status() {
      if (this.focus === null) {
        return 'branch';
      } else {
        if (this.event === this.focus.target) {
          return 'crown';
        } else if (this.focus.ancestors.has(this.event)) {
          return 'trunk';
        } else if (this.ancestors.has(this.focus.target)) {
          return 'branch';
        } else {
          return 'pruned';
        }
      }
    },
    children() {
      return this.event.children;
    },
    areChildrenVisible() {
      return this.event.children.length > 0;
    },
    childrenFactor() {
      if (isEventDurationValid(this.event)) {
        return (
          this.factor *
          Math.min(
            1,
            this.children.map(getEventDuration).reduce(add, 0) / getEventDuration(this.event)
          )
        );
      } else {
        return this.factor;
      }
    },
  },
  methods: {
    propagateSelect(target) {
      this.$emit('select', target);
    },
    propagateHover(event) {
      this.$emit('hover', event);
    },
    mousedown() {
      this.timer = Date.now();
    },
    mouseup() {
      if (new Date() - this.timer < 200) {
        this.propagateSelect(this.event);
      }
    },
  },
};
</script>
