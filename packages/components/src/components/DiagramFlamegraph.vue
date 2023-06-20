<template>
  <div class="diagram-flamegraph">
    <v-flamegraph-branch
      v-if="events.length > 0"
      :events="events"
      :budget="budget"
      :focus="focus"
      @selectEvent="propagateSelectEvent"
    ></v-flamegraph-branch>
    <v-flamegraph-root
      :budget="budget"
      :title="title"
      @clearSelectEvent="propagateClearSelectEvent"
    ></v-flamegraph-root>
    <v-slider :value="this.zoom" @slide="updateZoom" />
  </div>
</template>

<script>
import VFlamegraphBranch from '@/components/flamegraph/FlamegraphBranch.vue';
import VFlamegraphRoot from '@/components/flamegraph/FlamegraphRoot.vue';
import VSlider from '@/components/Slider.vue';
export default {
  name: 'v-diagram-flamegraph',
  emits: ['selectEvent', 'clearSelectEvent'],
  components: {
    VFlamegraphBranch,
    VFlamegraphRoot,
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
    return { zoom: 0.5 };
  },
  methods: {
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
  height: 100%;
  overflow: scroll;
  padding: 20px 20px 20px 20px;
  margin: 0px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
</style>
