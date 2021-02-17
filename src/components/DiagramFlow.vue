<template v-slot:diagram>
  <div class="diagram-flow" :key="renderKey" />
</template>

<script>
import { CallTree, Event } from '@/lib/models';
import { FlowView } from '@/lib/diagrams';
import { panToNode } from '@/lib/diagrams/util';
import { CLEAR_OBJECT_STACK, SELECT_OBJECT } from '@/store/vsCode';

export default {
  name: 'v-diagram-flow',

  props: {
    theme: {
      type: String,
      default: 'dark',
      validator: (value) => ['dark', 'light'].indexOf(value) !== -1,
    },
    zoomButtons: {
      type: Boolean,
      default: true,
    },
    callTree: {
      type: Object,
      default: () => new CallTree(),
    },
  },

  data() {
    return {
      renderKey: 0,
      flowView: null,
      selectingEvent: false,
    };
  },

  watch: {
    // If a prop changes, update the render key, causing a full re-render.
    $props: {
      handler() {
        this.renderKey += 1;
      },
    },

    '$store.getters.selectedObject': {
      handler() {
        this.highlightSelectedEvent();
      },
    },
  },

  methods: {
    selectEvent(event) {
      if (this.$store) {
        this.$store.commit(CLEAR_OBJECT_STACK);
        this.$store.commit(SELECT_OBJECT, event);
      }
    },

    renderDiagram() {
      this.flowView = new FlowView(this.$el, {
        theme: this.theme,
        zoom: {
          controls: this.zoomButtons,
        },
      });

      this.flowView.setCallTree(this.callTree);
      this.flowView.render();
      this.callTree.on('selectedEvent', (e) => this.selectEvent(e.input));
      this.highlightSelectedEvent();
    },

    highlightSelectedEvent() {
      if (this.selectingEvent) {
        // This guard prevents us from calling `flowView.highlight` twice and instantly hiding any
        // visible poppers
        this.selectingEvent = false;
        return;
      }

      const { selectedObject } = this.$store.getters;
      if (selectedObject && selectedObject instanceof Event) {
        const { id } = selectedObject;
        this.flowView.highlight(id);

        const element = this.$el.querySelector(`#traceNode${id}`);
        panToNode(this.flowView.container.containerController, element);
      } else {
        this.flowView.highlight(null);
      }
    },
  },

  mounted() {
    this.renderDiagram();
  },

  updated() {
    this.renderDiagram();
  },
};
</script>

<style lang="scss">
@import '@/scss/diagrams/style';
.diagram-flow {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;

  .appmap.appmap--theme-dark {
    background-color: $vs-code-gray1;
    overflow: hidden;
  }
}
</style>
