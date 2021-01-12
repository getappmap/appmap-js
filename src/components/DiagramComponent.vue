<template>
  <div class="diagram-component" :key="renderKey" />
</template>

<script>
import { SELECT_OBJECT } from '@/store/vsCode';
import { ComponentDiagram } from '@appland/diagrams';

function collectAncestors(obj) {
  let currentObj = obj.parent;
  const ancestors = [];
  while (currentObj) {
    ancestors.push(currentObj);
    currentObj = currentObj.parent;
  }
  return ancestors;
}

function getRoute(event) {
  if (!event) {
    return null;
  }

  /* eslint-disable camelcase */
  const { path_info, request_method } = event.http_server_request;
  return `${request_method} ${path_info}`;
  /* eslint-enable camelcase */
}

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
      componentDiagram: null,
      highlightHandler: null,
    };
  },

  watch: {
    // If a prop changes, update the render key, causing a full re-render.
    $props: {
      handler() { this.renderKey += 1; },
      deep: true,
    },

    '$store.getters.selectedObject': {
      handler() {
        this.highlightSelectedComponent();
      },
    },
  },

  methods: {
    bindHighlightHandler() {
      if (!this.componentDiagram) {
        return;
      }

      if (this.highlightHandler) {
        return;
      }

      this.highlightHandler = (d) => this.onHighlight(d);
      this.componentDiagram.on('highlight', this.highlightHandler);
    },

    unbindHighlightHandler() {
      if (!this.componentDiagram) {
        return;
      }

      this.componentDiagram.off('highlight', this.highlightHandler);
      this.highlightHandler = null;
    },

    highlightSelectedComponent() {
      const { selectedObject } = this.$store.getters;
      if (!selectedObject) {
        return;
      }

      const nodeIds = [];
      const { kind, object } = selectedObject;
      switch (kind) {
        case 'package': {
          nodeIds.push(object.id);
          break;
        }
        case 'class':
        case 'function': {
          [object, ...collectAncestors(object)]
            .map((obj) => obj.name)
            .forEach((id) => nodeIds.push(id));

          // HACK
          // If node identifiers were sourced from `CodeObject.id` we wouldn't
          // need to do this.
          nodeIds.push(object.classOf);
          break;
        }
        case 'edge': {
          // TODO.
          // no API exists to highlight an edge
          break;
        }
        case 'http': {
          nodeIds.push('HTTP');
          break;
        }
        case 'database': {
          nodeIds.push('SQL');
          break;
        }
        case 'route': {
          // `object` is an array of events
          if (object.length) {
            const event = object[0];
            nodeIds.push('HTTP', getRoute(event));
          }
          break;
        }
        case 'event': {
          if (object.codeObject) {
            [object.codeObject, ...collectAncestors(object.codeObject)]
              .map((obj) => obj.name)
              .forEach((id) => nodeIds.push(id));

            // HACK
            // If node identifiers were sourced from `CodeObject.id` we wouldn't
            // need to do this.
            nodeIds.push(object.definedClass);
          } else if (object.sql) {
            nodeIds.push('SQL');
          } else if (object.http_server_request) {
            nodeIds.push('HTTP', getRoute(object));
          }
          break;
        }
        default: {
          console.error(`got unknown object kind '${kind}'`);
          console.trace();
        }
      }

      this.unbindHighlightHandler();
      this.componentDiagram.highlight(nodeIds);
      this.bindHighlightHandler();
    },

    onHighlight(nodeIds) {
      if (!nodeIds || !nodeIds.length) {
        this.selectObject(null, null);
      } else {
        this.selectObject('component', { id: nodeIds[0] });
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
        this.componentDiagram.render(this.componentData);
        this.componentDiagram.on('edge', ([from, to]) => this.selectObject('edge', { from, to }));
        this.bindHighlightHandler();
        this.highlightSelectedComponent();
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
