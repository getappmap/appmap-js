<template v-slot:diagram>
  <div class="diagram-flow" :key="renderKey" />
</template>

<script>
import { CallTree } from '@/lib/models';
import { FlowView } from '@/lib/diagrams';
import { panToNode } from '@/lib/diagrams/util';
import { SELECT_OBJECT } from '@/store/vsCode';

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
        this.$store.commit(SELECT_OBJECT, {
          kind: 'event',
          data: event,
          clearStack: true,
        });
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
      const { selectedObject } = this.$store.getters;
      if (selectedObject && selectedObject.kind === 'event') {
        const { id } = selectedObject.object;
        this.flowView.highlight(id);

        const element = this.$el.querySelector(`.node[data-node-id="${id}"]`);
        panToNode(this.flowView.container.containerController, element);
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
  max-height: 100vh;
  max-width: 100vw;
  .appmap.appmap--theme-dark {
    background-color: $vs-code-gray1;
    overflow: hidden;
  }
}
</style>
