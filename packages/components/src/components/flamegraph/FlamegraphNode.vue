<template>
  <div class="flamegraph-node">
    <v-flamegraph-branch
      v-if="areChildrenVisible"
      :events="children"
      :budget="childrenBudget"
      :focus="childrenFocus"
      @select="propagateSelect"
      @hover="propagateHover"
    />
    <v-flamegraph-item
      :event="event"
      :budget="budget"
      :status="status"
      @select="propagateSelect"
      @hover="propagateHover"
    />
  </div>
</template>

<script>
import { Event } from '@appland/models';
import VFlamegraphBranch from './FlamegraphBranch.vue';
import VFlamegraphItem from './FlamegraphItem.vue';
import { add, getEventDuration } from '../../lib/flamegraph';
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
    budget: {
      type: Number,
      required: true,
    },
    focus: {
      type: Object,
      required: false,
      default: null,
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
    children() {
      return this.event.children;
    },
    areChildrenVisible() {
      return this.event.children.length > 0;
    },
    status() {
      if (this.focus) {
        if (this.event === this.focus) {
          return 'crown';
        } else {
          return 'trunc';
        }
      } else {
        return 'branch';
      }
    },
    childrenFocus() {
      return this.event === this.focus ? null : this.focus;
    },
    childrenBudget() {
      const duration = getEventDuration(this.event);
      if (duration === 0 || (this.focus && this.focus !== this.event)) {
        return this.budget;
      } else {
        return Math.min(
          this.budget,
          Math.floor(
            (this.budget * this.event.children.map(getEventDuration).reduce(add, 0)) / duration
          )
        );
      }
    },
  },
};
</script>

<style scoped lang="scss">
.flamegraph-node {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
</style>
