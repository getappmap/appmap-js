<template>
  <div class="flamegraph-branch">
    <v-flamegraph-node
      v-for="{ key, event, budget, focus } in children"
      :key="key"
      :event="event"
      :budget="budget"
      :focus="focus"
      @select="propagateSelect"
      @hover="propagateHover"
    />
    <v-flamegraph-rest :budget="rest" />
  </div>
</template>

<script>
import VFlamegraphRest from './FlamegraphRest.vue';
import { isEventDurationValid, getEventDuration, add } from '../../lib/flamegraph';
const getBudget = ({ budget }) => budget;
const empty = new Set();
export default {
  name: 'v-flamegraph-branch',
  emits: ['select', 'hover'],
  components: {
    VFlamegraphNode: async () => (await import('./FlamegraphNode.vue')).default,
    VFlamegraphRest,
  },
  props: {
    events: {
      type: Array,
      required: true,
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
  computed: {
    validDurationEventArray() {
      return this.events.filter(isEventDurationValid);
    },
    totalDuration() {
      return this.validDurationEventArray.map(getEventDuration).reduce(add, 0);
    },
    ancestors() {
      if (this.focus) {
        const ancestors = new Set(this.focus.ancestors());
        ancestors.add(this.focus);
        return ancestors;
      } else {
        return empty;
      }
    },
    validBudget() {
      const eventCount = this.events.length;
      const validEventCount = this.validDurationEventArray.length;
      const validBudget = Math.floor(this.budget * (validEventCount / eventCount));
      return validBudget;
    },
    singleInvalidBudget() {
      const eventCount = this.events.length;
      const validEventCount = this.validDurationEventArray.length;
      const invalidEventCount = eventCount - validEventCount;
      const invalidBudget = Math.floor(this.budget * (invalidEventCount / eventCount));
      const singleInvalidBudget = Math.floor(invalidBudget / invalidEventCount);
      return singleInvalidBudget;
    },
    children() {
      if (this.focus) {
        return this.events.map((event) => {
          const focused = this.ancestors.has(event);
          return {
            key: event.id,
            event,
            budget: focused ? this.budget : 0,
            focus: focused ? this.focus : null,
          };
        });
      } else {
        return this.events.map((event) => {
          if (isEventDurationValid(event)) {
            return {
              key: event.id,
              event,
              budget: Math.floor(this.validBudget * (getEventDuration(event) / this.totalDuration)),
              focus: null,
            };
          } else {
            return {
              key: event.id,
              event,
              budget: this.singleInvalidBudget,
              focus: null,
            };
          }
        });
      }
    },
    rest() {
      const rest = this.budget - this.children.map(getBudget).reduce(add, 0);
      if (rest < 0) {
        console.warn('children budget overflow, this should never happen', rest);
        console.dir({
          budget: this.budget,
          children: this.children,
        });
        return 0;
      } else {
        return rest;
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
  },
};
</script>

<style scoped lang="scss">
.flamegraph-branch {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  flex-wrap: nowrap;
}
</style>
