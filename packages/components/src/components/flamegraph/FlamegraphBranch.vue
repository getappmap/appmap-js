<template>
  <div class="flamegraph-branch">
    <v-flamegraph-node
      v-for="{ key, event, factor } in children"
      :key="key"
      :event="event"
      :factor="factor"
      :focus="focus"
      :base-budget="baseBudget"
      :zoom-budget="zoomBudget"
      @select="propagateSelect"
      @hover="propagateHover"
    />
  </div>
</template>

<script>
import { isEventDurationValid, getEventDuration, add } from '../../lib/flamegraph';
export default {
  name: 'v-flamegraph-branch',
  emits: ['select', 'hover'],
  components: {
    VFlamegraphNode: async () => (await import('./FlamegraphNode.vue')).default,
  },
  props: {
    events: {
      type: Array,
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
  computed: {
    children() {
      const eventCount = this.events.length;
      const validEventArray = this.events.filter(isEventDurationValid);
      // In the case where the children all have a valid duration of 0, we use an arbitrary non-zero
      // total to avoid creating NaN by performing 0/0 while computing the child budgets.
      const totalDuration = validEventArray.map(getEventDuration).reduce(add, 0) || 1;
      const validEventCount = validEventArray.length;
      const invalidEventCount = eventCount - validEventCount;
      const validFactor = this.factor * (validEventCount / eventCount);
      const invalidFactor = this.factor * (invalidEventCount / eventCount);
      const singleInvalidFactor = invalidFactor / invalidEventCount;
      return this.events.map((event) => ({
        key: event.id,
        event,
        factor: isEventDurationValid(event)
          ? validFactor * (getEventDuration(event) / totalDuration)
          : singleInvalidFactor,
      }));
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
};
</script>

<style scoped lang="scss">
.flamegraph-branch {
  flex-grow: 1; // this is only used by the root branch to move the flamegraph to the bottom
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  flex-wrap: nowrap;
}
</style>
