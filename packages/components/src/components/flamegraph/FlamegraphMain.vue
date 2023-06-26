<template>
  <div :class="class_" @mouseleave="handleMouseLeave" @mousemove="handleMouseMove">
    <v-flamegraph-branch
      :events="events"
      :budget="budget"
      :focus="focus"
      @select="propagateSelect"
      @hover="propagateHover"
    ></v-flamegraph-branch>
    <v-flamegraph-root :title="title" :selection="selection" @select="propagateSelect" />
  </div>
</template>

<script>
import { nextTick } from 'vue';
import { Event } from '@appland/models';
import VFlamegraphBranch from '@/components/flamegraph/FlamegraphBranch.vue';
import VFlamegraphRoot from '@/components/flamegraph/FlamegraphRoot.vue';
const toCoordinate = ({ scroll, offset, budget }) => (scroll + offset) / budget;
const toScroll = ({ coordinate, offset, budget }) => coordinate * budget - offset;
export default {
  name: 'v-flamegraph-main',
  emits: ['select', 'hover'],
  components: {
    VFlamegraphBranch,
    VFlamegraphRoot,
  },
  data() {
    return {
      baseBudget: NaN,
      mouse: null,
      interval: null,
      focusing: 0,
    };
  },
  props: {
    events: {
      type: Array,
      required: true,
    },
    focus: {
      type: Object,
      default: null,
      validator: (value) => value === null || value instanceof Event,
    },
    zoom: {
      type: Number,
      required: true,
      validator: (value) => value >= 0 && value <= 1,
    },
    title: {
      type: String,
      default: 'root',
    },
  },
  computed: {
    center() {
      return this.baseBudget / 2;
    },
    origin() {
      return this.mouse ?? this.center;
    },
    selection() {
      return this.focus !== null;
    },
    budget() {
      // Exponential zoom:
      // - {zoom = 0, width = baseBudget}
      // - {zoom = 0.1, width = 2 * baseBudget}
      // - {zoom = 0.2, width = 4 * baseBudget}
      // ...
      // - {zoom = 1, width = 1024 * baseBudget}
      return Math.round(this.baseBudget * 2 ** (10 * this.zoom));
    },
    class_() {
      return {
        'flamegraph-main': true,
        'flamegraph-main-focusing': this.focusing > 0,
      };
    },
  },
  watch: {
    budget(newBudget, oldBudget) {
      if (this.$el) {
        const oldScroll = this.$el.scrollLeft;
        const coordinate = toCoordinate({
          scroll: oldScroll,
          offset: this.origin,
          budget: oldBudget,
        });
        const newScroll = toScroll({
          coordinate,
          offset: this.origin,
          budget: newBudget,
        });
        // Allow vue to change the DOM before scrolling.
        // Without this, the scroll position may overflow and be clamped.
        nextTick(() => {
          this.$el.scrollLeft = newScroll;
        });
      }
    },
    focus() {
      this.startFocusing();
      setTimeout(this.stopFocusing, 500);
    },
  },
  methods: {
    startFocusing() {
      this.focusing += 1;
    },
    stopFocusing() {
      this.focusing -= 1;
    },
    handleMouseLeave() {
      this.mouse = null;
    },
    handleMouseMove(event) {
      const { left } = event.currentTarget.getBoundingClientRect();
      this.mouse = event.clientX - left;
    },
    propagateSelect(target) {
      this.$emit('select', target);
    },
    propagateHover(target) {
      this.$emit('hover', target);
    },
    pullBaseBudget() {
      if (this.$el) {
        const width = this.$el.clientWidth;
        // When tabbing out flamegraph clientWidth becomes 0.
        if (width > 0) {
          // I'm not 100% sure that vue does not propagate data assignements if
          // it actually did not changed. So I guard it for performance reason.
          if (this.baseBudget !== width) {
            this.baseBudget = width;
          }
        }
      }
    },
  },
  beforeUnmount() {
    clearInterval(this.interval);
  },
  mounted() {
    this.pullBaseBudget();
    // This is a quick and dirty way to react to width changes.
    // I tried to listen to window resize event and main column drag in the main page.
    // I could compute the left column width and deduce the width of the right column.
    // However this was brittle because it did not consider the context of the main page.
    // On the actual vscode extension there is a padding that does not appear in storybook.
    // The other option is to relay on `vue-resize`.
    // But I would prefer to not introduce a new dependency for this.
    // Also reacting late to this change event is fine and maybe even desirable for performance.
    this.interval = setInterval(this.pullBaseBudget, 1000);
  },
};
</script>

<style lang="scss">
.flamegraph-main {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  flex-shrink: 1;
  overflow: scroll;
}

.flamegraph-main-focusing {
  .flamegraph-item,
  .flamegraph-rest {
    transition: all 0.5s linear;
  }
}
</style>
