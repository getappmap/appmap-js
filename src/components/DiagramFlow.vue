<template v-slot:diagram>
  <div class="appland-diagram-flow" :key="renderKey" />
</template>

<script>
import { buildAppMap } from '@appland/models';
import { FlowView } from '@appland/diagrams';

export default {
  name: 'diagram-flow',

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
    data: {
      type: Object,
      default: () => ({}),
    },
  },

  computed: {
    appmap() {
      return buildAppMap()
        .source(this.data)
        .normalize()
        .build();
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
      deep: true,
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

      flowView.setCallTree(this.appmap.callTree);
      flowView.render();
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
  .appland-diagram-flow {
    @import '~@appland/diagrams/dist/@appland/diagrams';

    grid-column-start: 2;
    grid-column-end: 3;
    border-left: 1px solid #343742;
    width: 100%;
    overflow: scroll;
  }
</style>
