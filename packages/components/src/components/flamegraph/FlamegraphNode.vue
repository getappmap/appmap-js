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
      :factor="factor"
      :status="status"
      :base-budget="baseBudget"
      :zoom-budget="zoomBudget"
      @select="propagateSelect"
      @hover="propagateHover"
    />
  </div>
</template>

<script>
import { Event } from '@appland/models';
import VFlamegraphBranch from './FlamegraphBranch.vue';
import VFlamegraphItem from './FlamegraphItem.vue';
import { add, getEventDuration, isEventDurationValid } from '../../lib/flamegraph';
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
      validator: (value) => value instanceof Event,
    },
    factor: {
      type: Number,
      required: true,
      validator: (value) => value >= 0 && value <= 1,
    },
    focus: {
      type: Object,
      required: false,
      default: null,
    },
    baseBudget: {
      type: Number,
      required: true,
      validator: (value) => value >= 0,
    },
    zoomBudget: {
      type: Number,
      required: true,
      validator: (value) => value >= 0,
    },
  },
  methods: {
    propagateSelect(target) {
      this.$emit('select', target);
    },
    propagateHover(event) {
      this.$emit('hover', event);
    },
  },
  computed: {
    childrenZoomBudget() {
      return this.status === 'crown' ? this.zoomBudget / this.factor : this.zoomBudget;
    },
    status() {
      if (this.focus === null) {
        return 'branch';
      } else {
        if (this.event === this.focus) {
          return 'crown';
        } else if (this.focus.ancestors().includes(this.event)) {
          return 'trunk';
        } else if (this.event.ancestors().includes(this.focus)) {
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
};
</script>
