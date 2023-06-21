<template>
  <div class="flamegraph-node">
    <v-flamegraph-branch
      v-if="areChildrenVisible"
      :events="children"
      :budget="childrenBudget"
      :focus="childrenFocus"
      @selectEvent="propagateSelectEvent"
      @hoverEvent="propagateHoverEvent"
    />
    <v-flamegraph-item
      :event="event"
      :budget="budget"
      :focused="focused"
      @selectEvent="propagateSelectEvent"
      @hoverEvent="propagateHoverEvent"
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
  emits: ['selectEvent', 'hoverEvent'],
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
    propagateSelectEvent(event) {
      this.$emit('selectEvent', event);
    },
    propagateHoverEvent(event) {
      this.$emit('hoverEvent', event);
    },
  },
  computed: {
    children() {
      return this.event.children;
    },
    areChildrenVisible() {
      return this.event.children.length > 0;
    },
    focused() {
      return this.event === this.focus;
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
