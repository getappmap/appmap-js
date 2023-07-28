<template>
  <div
    :class="classes"
    @mouseleave="handleMouseLeave"
    @mouseup="handleMouseUp"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @wheel="handleWheel"
  >
    <v-flamegraph-branch
      :events="events"
      :factor="1"
      :focus="focus"
      :zoom-budget="zoomBudget"
      :base-budget="baseBudget"
      @select="propagateSelect"
      @hover="propagateHover"
    ></v-flamegraph-branch>
    <v-flamegraph-root :title="title" :pruned="pruned" @select="propagateSelect" />
  </div>
</template>

<script>
import { nextTick } from 'vue';
import { Event } from '@appland/models';
import VFlamegraphBranch from '@/components/flamegraph/FlamegraphBranch.vue';
import VFlamegraphRoot from '@/components/flamegraph/FlamegraphRoot.vue';

const FRICTION = 0.99;
const MIN_INERTIA = 1;
const isMouseWheelEvent = ({ deltaX, deltaY }) => deltaX === 0 && Math.abs(deltaY) > 5;
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
      baseBudget: 0,
      mouse: null,
      interval: null,
      focusing: 0,
      inertia: null,
    };
  },
  props: {
    events: {
      type: Array,
      required: true,
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
    focus() {
      if (this.focusedEvent)
        return {
          target: this.focusedEvent,
          ancestors: new Set(this.focusedEvent.ancestors()),
        };

      if (this.selectedEvent)
        return {
          target: this.selectedEvent,
          ancestors: new Set(this.selectedEvent.ancestors()),
        };

      return null;
    },
    selectedEvent() {
      const selectedObj = this.$store.getters.selectedObject;
      return selectedObj instanceof Event ? selectedObj : null;
    },
    focusedEvent() {
      const { focusedEvent } = this.$store.state;
      return focusedEvent instanceof Event ? focusedEvent : null;
    },
    center() {
      return this.baseBudget / 2;
    },
    origin() {
      return this.mouse || this.center;
    },
    pruned() {
      return this.selectedEvent !== null;
    },
    zoomBudget() {
      // Exponential zoom:
      // - {zoom = 0, width = baseBudget}
      // - {zoom = 0.1, width = 2 * baseBudget}
      // - {zoom = 0.2, width = 4 * baseBudget}
      // ...
      // - {zoom = 1, width = 1024 * baseBudget}
      //
      // Math.round to avoid floating point errors.
      return Math.round(this.baseBudget * 2 ** (10 * this.zoom));
    },
    classes() {
      return {
        'flamegraph-main': true,
        'flamegraph-main-focusing': this.focusing > 0,
      };
    },
  },
  watch: {
    zoomBudget(newBudget, oldBudget) {
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
    selectedEvent() {
      this.startFocusing();
      setTimeout(this.stopFocusing, 500);
    },
    focusedEvent() {
      this.startFocusing();
      setTimeout(this.stopFocusing, 500);
    },
  },
  methods: {
    handleMouseDown() {
      this.inertia = null;
    },
    handleMouseUp() {
      this.up = true;
    },
    startFocusing() {
      this.focusing += 1;
    },
    stopFocusing() {
      this.focusing -= 1;
    },
    handleMouseLeave() {
      this.up = false;
      this.mouse = null;
    },
    handleWheel(event) {
      // This is a quick and dirty way to check whether the wheel event comes from the trackpad.
      // Nice to have: handle zoom gestures on trackpad.
      if (!isMouseWheelEvent(event)) {
        event.stopPropagation();
      }
    },
    handleMouseMove(event) {
      const { left } = event.currentTarget.getBoundingClientRect();
      this.mouse = event.clientX - left;
      if (this.$el) {
        if (event.buttons === 1) {
          this.$el.scrollLeft -= event.movementX;
          this.$el.scrollTop -= event.movementY;
        } else if (this.up) {
          this.up = false;
          this.inertia = {
            x: event.movementX,
            y: event.movementY,
          };
          this.stepInertia();
        }
      }
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
    stepInertia() {
      if (this.inertia) {
        this.$el.scrollLeft -= this.inertia.x;
        this.$el.scrollTop -= this.inertia.y;
        this.inertia.x *= FRICTION;
        this.inertia.y *= FRICTION;
        if (Math.abs(this.inertia.x) < MIN_INERTIA && Math.abs(this.inertia.y) < MIN_INERTIA) {
          this.inertia = null;
        } else {
          requestAnimationFrame(this.stepInertia);
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
.github-artifact {
  background-color: #000;

  #app {
    height: 95vh;
  }
}

.flamegraph-main {
  cursor: grab;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.flamegraph-main-focusing {
  .flamegraph-item {
    transition: width 0.5s linear;
  }
}
</style>
