<template v-slot:diagram>
  <div class="diagram-flow" :key="renderKey" />
</template>

<script>
import { CallTree } from '@appland/models';
import { FlowView } from '@appland/diagrams';

export default {
  name: 'v-diagram-flow',

  props: {
    theme: {
      type: String,
      default: 'dark',
      validator: (value) => (['dark', 'light'].indexOf(value) !== -1),
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
    };
  },

  watch: {
    // If a prop changes, update the render key, causing a full re-render.
    $props: {
      handler() { this.renderKey += 1; },
    },
  },

  methods: {
    renderDiagram() {
      const flowView = new FlowView(this.$el, {
        theme: this.theme,
        zoom: {
          controls: this.zoomButtons,
        },
      });

      flowView.setCallTree(this.callTree);
      flowView.render();
      flowView.on('selectedEvent', (e) => this.$store.selectEvent(e));
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
  .diagram-flow {
    @import '~@appland/diagrams/dist/@appland/diagrams';
    max-height: 100vh;
    max-width: 100vw;
    .appmap.appmap--theme-dark {
      background-color:$vs-code-gray1;
      overflow: hidden;
    }
  }
</style>
