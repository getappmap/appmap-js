<template>
  <div class="diagram-flamegraph" :style="style">
    <v-flamegraph-branch
      v-if="events.length > 0"
      :events="events"
      :budget="budget"
      :focus="focus"
      @select="propagateSelect"
      @hover="onHover"
    ></v-flamegraph-branch>
    <v-flamegraph-root
      :budget="budget"
      :title="title"
      :selection="selection"
      @clear="propagateClear"
    ></v-flamegraph-root>
    <v-flamegraph-hover :event="hoverEvent" />
    <v-slider :value="zoom" @slide="updateZoom" />
  </div>
</template>

<script>
const MIN_WIDTH = 480;
const PADDING = 20;
import VFlamegraphBranch from '@/components/flamegraph/FlamegraphBranch.vue';
import VFlamegraphRoot from '@/components/flamegraph/FlamegraphRoot.vue';
import VFlamegraphHover from '@/components/flamegraph/FlamegraphHover.vue';
import VSlider from '@/components/Slider.vue';
export default {
  name: 'v-diagram-flamegraph',
  emits: ['select', 'clear'],
  components: {
    VFlamegraphBranch,
    VFlamegraphRoot,
    VFlamegraphHover,
    VSlider,
  },
  props: {
    events: {
      type: Array,
      required: true,
    },
    selectedEvents: {
      type: Array,
      required: true,
    },
    title: {
      type: String,
      default: 'root',
    },
  },
  data() {
    return { zoom: 0, hoverEvent: null, baseWidth: MIN_WIDTH, interval: null };
  },
  methods: {
    onHover({ type, target }) {
      if (type === 'enter') {
        this.hoverEvent = target;
      } else if (type === 'leave') {
        // Protects against against the case where the enter event is fired before the leave event.
        if (this.hoverEvent === target) {
          this.hoverEvent = null;
        }
      } else {
        console.warn('Unknown hover event type');
      }
    },
    updateZoom(zoom) {
      this.zoom = zoom;
    },
    propagateSelect(target) {
      this.$emit('select', target);
    },
    propagateClear() {
      this.$emit('clear');
    },
    pullBaseWidth() {
      const newBaseWidth = Math.max(MIN_WIDTH, this.$el.clientWidth);
      // I'm not 100% sure that vue does not propagate data assignements it
      // it actually did not changed. So I guard it for performance reason.
      if (newBaseWidth !== this.baseWidth) {
        this.baseWidth = newBaseWidth;
      }
    },
  },
  computed: {
    style() {
      return { padding: `${PADDING}px` };
    },
    width() {
      // Exponential zoom:
      // - {zoom = 0, width = baseWidth}
      // - {zoom = 0.1, width = 2 * baseWidth}
      // - {zoom = 0.2, width = 4 * baseWidth}
      // ...
      // - {zoom = 1, width = 1024 * baseWidth}
      return this.baseWidth * 2 ** (10 * this.zoom);
    },
    budget() {
      return this.width - 2 * PADDING;
    },
    selection() {
      return this.selectedEvents.length > 0;
    },
    focus() {
      if (this.selectedEvents.length === 0) {
        return null;
      } else {
        if (this.selectedEvents.length > 1) {
          console.warn('Ignoring additional selected events');
        }
        return this.selectedEvents[0];
      }
    },
  },
  mounted() {
    this.pullBaseWidth();
    // This is quick and dirty way to react to width changes.
    // I tried to listen to window resize event and main column drag in the main page.
    // I could compute the left column width and deduce the width of the right column.
    // However this was brittle because it did not consider the context of the main page.
    // On the actual vscode extension there is a padding that does not appear in storybook.
    // The other option is to relay on `vue-resize`.
    // But I would prefer to not introduce a new dependency for this.
    // Also reacting late to this change event is fine and maybe even desirable for performance.
    this.interval = setInterval(this.pullBaseWidth, 1000);
  },
  beforeUnmount() {
    clearInterval(this.interval);
  },
};
</script>

<style scoped lang="scss">
.diagram-flamegraph {
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
</style>
