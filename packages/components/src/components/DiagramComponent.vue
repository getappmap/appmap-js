<template>
  <div class="diagram-component" :key="renderKey" />
</template>

<script>
import { ComponentDiagram } from '@appland/diagrams';
import { CodeObject, Event, ClassMap, CodeObjectType } from '@appland/models';
import { CLEAR_OBJECT_STACK, SELECT_OBJECT } from '@/store/vsCode';

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
    classMap: ClassMap,
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

    '$store.state.appMap': {
      handler() {
        this.renderKey += 1;
        this.renderDiagram();
      },
    },

    '$store.getters.selectedObject': {
      handler() {
        this.highlightSelectedComponent();
      },
    },
  },

  methods: {
    highlightSelectedComponent(expandParent = true) {
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

      if (codeObject.type === CodeObjectType.FUNCTION) {
        codeObject = codeObject.classObject;
      }

      if (this.componentDiagram.hasObject(codeObject)) {
        this.componentDiagram.highlight(codeObject);
      } else {
        const visibleObjectParent = [...codeObject.ancestors()].find((obj) =>
          this.componentDiagram.hasObject(obj)
        );

        if (visibleObjectParent) {
          const parentCanExpand = [CodeObjectType.PACKAGE, CodeObjectType.HTTP].includes(
            visibleObjectParent.type
          );

          if (expandParent && parentCanExpand) {
            this.componentDiagram.expand(visibleObjectParent);
            this.componentDiagram.highlight(codeObject);
          } else {
            this.componentDiagram.highlight(visibleObjectParent);
          }
        }
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
        this.componentDiagram.render(this.classMap);

        this.componentDiagram
          .on('click', (codeObject) => this.selectObject(codeObject))
          .on('edge', (edge) => this.selectObject({ ...edge, type: 'edge' }))
          .on('collapse', () => this.highlightSelectedComponent(false))
          .on('expand', () => this.highlightSelectedComponent(false))
          .on('makeRoot', (codeObject) => {
            this.$root.$emit('makeRoot', codeObject);
          });
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

  activated() {
    if (this.componentDiagram) {
      this.componentDiagram.render(this.classMap);
      this.highlightSelectedComponent();
    }
  },
};
</script>

<style lang="scss">
@import '~@appland/diagrams/dist/style.css';
.diagram-component {
  width: 100%;
  height: 100%;
  .appmap.appmap--theme-dark {
    overflow: hidden;
  }
}
</style>
