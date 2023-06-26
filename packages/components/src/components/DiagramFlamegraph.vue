<template>
  <div class="diagram-flamegraph-main" @mousedown="handleMouseDown" @wheel="handleMouseWheel">
    <div class="diagram-flamegraph-main-left">
      <v-flamegraph-main
        ref="main"
        :events="events"
        :focus="focus"
        :zoom="smoothZoom"
        :title="title"
        @select="propagateSelect"
        @hover="onHover"
      />
      <v-flamegraph-hover :event="hoverEvent" />
    </div>
    <div class="diagram-flamegraph-main-right">
      <v-slider :value="smoothZoom" @slide="updateZoom" ref="slider" />
    </div>
  </div>
</template>

<script>
import VFlamegraphMain from '@/components/flamegraph/FlamegraphMain.vue';
import VFlamegraphHover from '@/components/flamegraph/FlamegraphHover.vue';
import VSlider from '@/components/Slider.vue';
const FPS = 60;
const WHEEL_SENSITIVITY = 1e-3;
const clamp = (val) => (val < 0 ? 0 : val > 1 ? 1 : val);
// {delta:0, transit:0}
// {delta:0.08, transit:0.18} >> a typical mouse wheel tick
// {delta:1, transit:2} >> a complete zoom traversal
const computeZoomTansit = (delta) => 2 * Math.sqrt(delta);
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
    return { zoom: 0, hoverEvent: null, smoothZoom: 0, zoomVelocity: 0 };
  },
  methods: {
    handleMouseDown(event) {
      // Stop zoom animation.
      if (event.button === 0) {
        this.zoom = this.smoothZoom;
      }
    },
    handleMouseWheel(event) {
      event.preventDefault();
      this.updateZoom(clamp(this.smoothZoom - WHEEL_SENSITIVITY * event.deltaY));
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
      const isAlreadySteppingZoom = this.zoomVelocity !== 0;
      this.zoom = zoom;
      const deltaZoom = this.zoom - this.smoothZoom;
      // Prevent NaN by avoiding 0/0.
      if (Math.abs(deltaZoom) > 0) {
        const deltaTime = computeZoomTansit(Math.abs(deltaZoom));
        this.zoomVelocity = deltaZoom / (deltaTime * FPS);
        if (!isAlreadySteppingZoom) {
          this.stepZoom();
        }
      }
    },
    stepZoom() {
      if (Math.abs(this.smoothZoom - this.zoom) <= Math.abs(this.zoomVelocity)) {
        this.zoomVelocity = 0;
        this.smoothZoom = this.zoom;
      } else {
        this.smoothZoom += this.zoomVelocity;
        requestAnimationFrame(this.stepZoom);
      }
    },
    propagateSelect(target) {
      this.$emit('select', target);
    },
  },
  computed: {
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
