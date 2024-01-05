<template>
  <div class="diagram-component" :key="renderKey" />
</template>

<script>
import { ComponentDiagram } from '@appland/diagrams';
import { CodeObject, Event, ClassMap, CodeObjectType } from '@appland/models';
import { SELECT_CODE_OBJECT } from '@/store/vsCode';

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
    highlightedEventIndex: {
      type: Number,
    },
  },

  data() {
    return {
      renderKey: 0,
      componentDiagram: null,
    };
  },

  watch: {
    classMap: {
      handler() {
        this.renderKey += 1;
        this.renderDiagram();
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
        this.highlightSelectedCodeObject();
      },
    },

    '$store.state.highlightedEvents': {
      handler() {
        this.handleHighlightedEvent();
      },
    },

    highlightedEventIndex() {
      this.handleHighlightedEvent();
    },
  },

  computed: {
    highlightedEvent() {
      return (
        Number.isFinite(this.highlightedEventIndex) &&
        this.$store?.state?.highlightedEvents[this.highlightedEventIndex]
      );
    },
    selectedObject() {
      return this.$store?.getters?.selectedObject;
    },
  },

  methods: {
    // In response to the user selecting a code object, find and highlight that code object
    // in the component view. Traverse up the code object's ancestors until we find a
    // code object that is visible in the component view.
    highlightSelectedCodeObject(expandParent = true) {
      const { selectedObject } = this;
      if (!selectedObject) {
        if (this.componentDiagram) this.componentDiagram.highlight(null);
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

      this.highlightCodeObject(codeObject, expandParent);
    },

    handleHighlightedEvent(expandParent = true) {
      let codeObject = this.highlightedEvent?.codeObject;
      if (!(codeObject instanceof CodeObject)) {
        this.highlightSelectedCodeObject();
        return;
      }
      if (codeObject.type === CodeObjectType.FUNCTION) {
        codeObject = codeObject.classObject;
      }
      this.highlightCodeObject(codeObject, expandParent);
    },

    highlightCodeObject(codeObject, expandParent) {
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
          .on('click', (codeObject) => this.selectCodeObject(codeObject))
          .on('edge', (edge) => this.selectCodeObject({ ...edge, type: 'edge' }))
          .on('collapse', () => this.highlightSelectedCodeObject(false))
          .on('expand', () => this.highlightSelectedCodeObject(false))
          .on('makeRoot', (codeObject) => {
            this.$root.$emit('makeRoot', codeObject);
          });
        if (this.selectedObject) {
          this.highlightSelectedCodeObject();
        } else {
          this.handleHighlightedEvent();
        }
      });
    },

    selectCodeObject(codeObject) {
      if (this.$store) {
        this.$store.commit(SELECT_CODE_OBJECT, codeObject);
      }
    },
  },

  mounted() {
    this.renderDiagram();
  },

  updated() {
    this.handleHighlightedEvent();
  },

  activated() {
    if (this.componentDiagram) {
      this.componentDiagram.render(this.classMap);
      if (this.selectedObject) {
        this.highlightSelectedCodeObject();
      } else {
        this.handleHighlightedEvent();
      }
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
