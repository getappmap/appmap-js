<template v-slot:diagram>
  <v-container @click="clearSelection" ref="container">
    <v-trace
      :events="events"
      ref="trace"
      @expand="focusNodeChildren"
      @collapse="focusNode"
    />
  </v-container>
</template>

<script>
import VTrace from '@/components/trace/Trace.vue';
import VContainer from '@/components/Container.vue';
import { CLEAR_OBJECT_STACK } from '@/store/vsCode';

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
  },

  watch: {
    '$store.getters.selectedObject': {
      handler() {
        this.focusHighlighted();
      },
    },
  },

  methods: {
    clearSelection() {
      if (this.$store) {
        this.$store.commit(CLEAR_OBJECT_STACK);
      }
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
        const element = document.querySelector('.trace-node.highlight');
        if (!element) {
          return;
        }

        container.panToElement(element);
      }, 16);
    },
  },

  mounted() {
    this.focusHighlighted();
  },
};
</script>
