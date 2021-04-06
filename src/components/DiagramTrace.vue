<template v-slot:diagram>
  <v-container
    @click.native="clearSelection"
    :zoomControls="zoomControls"
    ref="container"
  >
    <v-trace
      :events="events"
      :selected-events="selectedEvents"
      :highlight-color="highlightColor"
      :highlight-all="highlightAll"
      :highlight-style="highlightStyle"
      ref="trace"
      @expand="focusNodeChildren"
      @collapse="focusNode"
      @clickEvent="(e) => $emit('clickEvent', e)"
    />
  </v-container>
</template>

<script>
import VTrace from '@/components/trace/Trace.vue';
import VContainer from '@/components/Container.vue';
import { VIEW_FLOW, SELECT_OBJECT, CLEAR_OBJECT_STACK } from '@/store/vsCode';

export default {
  name: 'v-diagram-trace',

  components: {
    VTrace,
    VContainer,
  },

  props: {
    events: {
      type: Array,
    },
    selectedEvents: {
      type: Array,
      default: () => [],
    },
    zoomControls: Boolean,
    highlightColor: {
      type: String,
      default: null,
    },
    highlightAll: Boolean,
    highlightStyle: String,
  },

  methods: {
    clearSelection() {
      if (this.$store) {
        this.$store.commit(CLEAR_OBJECT_STACK);
      }
      this.$refs.container.clearScaleTarget();
    },

    focusNode(node) {
      const { container } = this.$refs;
      container.lazyPanToElement(node.$el);
    },

    focusNodeChildren(node) {
      setTimeout(() => {
        const { container } = this.$refs;
        const { $el } = node.$parent;
        container.lazyPanToElement($el.querySelector('.trace > *'));
      }, 16);
    },

    focusHighlighted() {
      setTimeout(() => {
        const { container } = this.$refs;
        const element = container.$el.querySelector('.trace-node.highlight');
        if (!element) {
          return;
        }

        container.panToElement(element);
        container.setScaleTarget(element);
      }, 16);
    },

    focusSelector(selector) {
      const element = this.$el.querySelector(selector);
      if (element) {
        this.$refs.container.panToElement(element);
      }
    },

    onClickEvent(event) {
      this.$emit('clickEvent', event);
    },

    container() {
      return this.$refs.container;
    },

    clearTransform() {
      this.$refs.container.clearTransform();
    },
  },

  created() {
    this.bindKeyboardListener = () => {
      const allowedKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

      this.$refs.container.$el.addEventListener('keyup', (event) => {
        if (!allowedKeys.includes(event.key)) {
          return;
        }

        const { selectedObject } = this.$store.getters;

        if (this.$store.state.currentView !== VIEW_FLOW) {
          return;
        }

        let nextObject = null;

        /* eslint-disable prefer-destructuring */
        // when nothing is selected - select first event
        if (!selectedObject) {
          nextObject = this.events[0];
        } else {
          switch (event.key) {
            case 'ArrowLeft':
              nextObject = selectedObject.parent;
              break;
            case 'ArrowRight':
              nextObject = selectedObject.children[0];
              break;
            case 'ArrowUp':
            case 'ArrowDown':
              {
                const siblings = selectedObject.parent
                  ? selectedObject.parent.children
                  : this.events;

                if (siblings.length < 2) {
                  return;
                }

                const currentIndex = siblings.indexOf(selectedObject);
                const nextIndex =
                  event.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1;

                nextObject = siblings.slice(nextIndex % siblings.length)[0];
              }
              break;
            default:
              break;
          }
        }
        /* eslint-enable prefer-destructuring */

        if (nextObject) {
          this.$store.commit(SELECT_OBJECT, nextObject);
        }
      });
    };
  },

  mounted() {
    this.focusHighlighted();
    this.bindKeyboardListener();
  },

  activated() {
    this.focusHighlighted();
  },

  updated() {
    this.focusHighlighted();
  },
};
</script>
