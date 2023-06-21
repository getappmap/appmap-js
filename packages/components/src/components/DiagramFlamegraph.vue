<template>
  <div class="diagram-flamegraph">
    <v-flamegraph-branch
      v-if="events.length > 0"
      :events="events"
      :budget="budget"
      :focus="focus"
      @selectEvent="propagateSelectEvent"
      @hoverEvent="handleHoverEvent"
    ></v-flamegraph-branch>
    <v-flamegraph-root
      :budget="budget"
      :title="title"
      @clearSelectEvent="propagateClearSelectEvent"
    ></v-flamegraph-root>
    <v-flamegraph-hover :event="hoverEvent" />
    <v-slider :value="zoom" @slide="updateZoom" />
  </div>
</template>

<script>
import VFlamegraphBranch from '@/components/flamegraph/FlamegraphBranch.vue';
import VFlamegraphRoot from '@/components/flamegraph/FlamegraphRoot.vue';
import VFlamegraphHover from '@/components/flamegraph/FlamegraphHover.vue';
import VSlider from '@/components/Slider.vue';
export default {
  name: 'v-diagram-flamegraph',
  emits: ['selectEvent', 'clearSelectEvent'],
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
    return { zoom: 0.5, hoverEvent: null };
  },
  methods: {
    handleHoverEvent({ type, event }) {
      if (type === 'enter') {
        this.hoverEvent = event;
      } else if (type === 'leave') {
        // Protects against against the case where the enter event is fired before the leave event.
        if (this.hoverEvent === event) {
          this.hoverEvent = null;
        }
      } else {
        console.warn('Unknown hover event type');
      }
    },
    updateZoom(zoom) {
      this.zoom = zoom;
    },
    propagateSelectEvent(event) {
      this.$emit('selectEvent', event);
    },
    propagateClearSelectEvent() {
      this.$emit('clearSelectEvent');
    },
  },
  computed: {
    budget() {
      return 460 + this.zoom * 1000;
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
};
</script>

<style scoped lang="scss">
.diagram-flamegraph {
  width: fit-content;
  min-height: 100%;
  height: fit-content;
  padding: 20px;
  margin: 0px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
</style>
