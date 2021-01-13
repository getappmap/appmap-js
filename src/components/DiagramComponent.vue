<template>
  <div class="diagram-component" :key="renderKey" />
</template>

<script>
import { SELECT_OBJECT } from '@/store/vsCode';
import { ComponentDiagram } from '@appland/diagrams';

export default {
  name: 'v-diagram-component',
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
    componentData: {
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
      this.$nextTick(() => {
        const diagram = new ComponentDiagram(this.$el, {
          theme: this.theme,
          zoom: {
            controls: this.zoomButtons,
          },
        });
        diagram.render(this.componentData);
        diagram
          .on('highlight', (nodeIds) => {
            if (!nodeIds || !nodeIds.length) {
              this.selectObject(null, null);
            } else {
              this.selectObject('component', { id: nodeIds[0] });
            }
          })
          .on('edge', ([from, to]) => this.selectObject('edge', { from, to }));
      });
    },

    selectObject(kind, data) {
      if (this.$store) {
        this.$store.commit(SELECT_OBJECT, { kind, data, clearStack: true });
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
  .diagram-component {
    @import '~@appland/diagrams/dist/@appland/diagrams';
    width: 100%;
    height: 100%;
    .appmap.appmap--theme-dark {
      background-color: $vs-code-gray1;
      overflow: hidden;
    }

  }
</style>
