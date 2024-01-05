<template>
  <div class="diagram-flamegraph-main" @wheel="handleMouseWheel">
    <div class="diagram-flamegraph-main-left">
      <v-flamegraph-main
        ref="main"
        :events="events"
        :zoom="zoom"
        :title="title"
        :highlighted-event-index="highlightedEventIndex"
        @select="propagateSelect"
        @hover="onHover"
      />
      <v-flamegraph-hover :event="hoverEvent" />
    </div>
    <div class="diagram-flamegraph-main-right">
      <v-slider :value="zoom" @slide="updateZoom" ref="slider" />
    </div>
  </div>
</template>

<script>
import VFlamegraphMain from '@/components/flamegraph/FlamegraphMain.vue';
import VFlamegraphHover from '@/components/flamegraph/FlamegraphHover.vue';
import VSlider from '@/components/Slider.vue';
const WHEEL_SENSITIVITY = 1e-3;
const clamp = (val) => (val < 0 ? 0 : val > 1 ? 1 : val);
// {delta:0, transit:0}
// {delta:0.08, transit:0.18} >> a typical mouse wheel tick
// {delta:1, transit:2} >> a complete zoom traversal
export default {
  name: 'v-diagram-flamegraph',
  emits: ['select'],
  components: {
    VFlamegraphMain,
    VFlamegraphHover,
    VSlider,
  },
  props: {
    events: {
      type: Array,
      required: true,
    },
    title: {
      type: String,
      default: 'root',
    },
    highlightedEventIndex: {
      type: Number,
      default: undefined,
    },
  },
  data() {
    return { zoom: 0, hoverEvent: null };
  },
  methods: {
    handleMouseWheel(event) {
      event.preventDefault();
      const newZoomValue = clamp(this.zoom + WHEEL_SENSITIVITY * (event.deltaY * -1));
      this.updateZoom(newZoomValue);
    },
    onHover({ type, target }) {
      if (type === 'enter') {
        this.hoverEvent = target;
      } else if (type === 'leave') {
        // Protects against the case where the enter event is fired before the leave event.
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
  },
};
</script>

<style scoped lang="scss">
.diagram-flamegraph-main {
  display: flex;
  padding: 20px;
  flex-direction: row;
  flex-wrap: nowrap;
  height: 100%;
}

.diagram-flamegraph-main-left {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.diagram-flamegraph-main-right {
  margin-top: auto;
  margin-bottom: auto;
  margin-left: 10px;
}
</style>
