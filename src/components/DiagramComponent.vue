<template>
  <div class="diagram-component" :key="renderKey" />
</template>

<script>
import { CLEAR_OBJECT_STACK, SELECT_OBJECT } from '@/store/vsCode';
import { ComponentDiagram } from '@/lib/diagrams';
import { CodeObject, Event } from '@/lib/models';

export default {
  name: 'v-diagram-component',
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
    componentData: {
      type: Object,
      default: () => ({}),
    },
  },

  data() {
    return {
      renderKey: 0,
      componentDiagram: null,
    };
  },

  watch: {
    // If a prop changes, update the render key, causing a full re-render.
    $props: {
      handler() {
        this.renderKey += 1;
      },
      deep: true,
    },

    '$store.getters.selectedObject': {
      handler() {
        this.highlightSelectedComponent();
      },
    },
  },

  methods: {
    highlightSelectedComponent() {
      const { selectedObject } = this.$store.getters;
      if (!selectedObject) {
        this.componentDiagram.highlight(null);
        return;
      }

      let codeObject = selectedObject;
      if (selectedObject instanceof Event) {
        codeObject = selectedObject.codeObject;
      }

      if (!(codeObject instanceof CodeObject)) {
        return;
      }

      // TODO.
      // We're attempting to highlight any visible component within the hierarchy. We should instead
      // make the selected object visible via expand/collapse.
      if (this.componentDiagram.hasObject(codeObject)) {
        this.componentDiagram.highlight(codeObject);
      } else {
        const visibleObject = [
          ...codeObject.descendants(),
          codeObject,
          ...codeObject.ancestors(),
        ].find((obj) => this.componentDiagram.hasObject(obj));

        this.componentDiagram.highlight(visibleObject);
      }
    },

    renderDiagram() {
      this.$nextTick(() => {
        this.componentDiagram = new ComponentDiagram(this.$el, {
          theme: this.theme,
          zoom: {
            controls: this.zoomButtons,
          },
        });
        this.componentDiagram.render(this.$store.state.appMap.classMap);

        this.componentDiagram
          .on('click', (codeObject) => this.selectObject(codeObject))
          .on('edge', (edge) => this.selectObject({ ...edge, type: 'edge' }));
        this.highlightSelectedComponent();
      });
    },

    selectObject(object) {
      if (this.$store) {
        this.$store.commit(CLEAR_OBJECT_STACK);
        this.$store.commit(SELECT_OBJECT, object);
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
.diagram-component {
  width: 100%;
  height: 100%;
  .appmap.appmap--theme-dark {
    background-color: $vs-code-gray1;
    overflow: hidden;
  }
}
</style>
