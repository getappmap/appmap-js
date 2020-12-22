<template>
  <div class="appland-diagram-component" :key="renderKey" />
</template>

<script>
import { ComponentDiagram } from '@appland/diagrams';

export default {
  name: 'diagram-component',
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
      const diagram = new ComponentDiagram(this.$el, {
        theme: this.theme,
        zoom: {
          controls: this.zoomButtons,
        },
      });
      diagram.render(this.data);
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
  .appland-diagram-component {
    @import '~@appland/diagrams/dist/@appland/diagrams';

    grid-column-start: 2;
    grid-column-end: 3;
    border-left: 1px solid #343742;
    width: 100%;
    overflow: scroll;
  }
</style>
