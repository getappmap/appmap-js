<template>
  <div class="diagram-flamegraph" @wheel="handleMouseWheel">
    <v-flamegraph-main
      ref="main"
      :events="events"
      :focus="focus"
      :zoom="zoom"
      :title="title"
      @select="propagateSelect"
      @hover="onHover"
    />
    <v-flamegraph-hover :event="hoverEvent" />
    <v-slider :value="zoom" @slide="updateZoom" ref="slider" />
  </div>
</template>

<script>
import VFlamegraphMain from '@/components/flamegraph/FlamegraphMain.vue';
import VFlamegraphHover from '@/components/flamegraph/FlamegraphHover.vue';
import VSlider from '@/components/Slider.vue';
const WHEEL_SENSITIVITY = 1e-3;
const clamp = (val) => (val < 0 ? 0 : val > 1 ? 1 : val);
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
    return { zoom: 0, hoverEvent: null };
  },
  methods: {
    handleMouseWheel(event) {
      event.preventDefault();
      this.zoom = clamp(this.zoom - WHEEL_SENSITIVITY * event.deltaY);
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
.diagram-flamegraph {
  padding: 20px;
  padding-right: 60px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
