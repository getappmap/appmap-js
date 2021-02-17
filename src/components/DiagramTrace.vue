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
  name: 'v-diagram-flow',

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
        const { container } = this.$refs;
        this.$nextTick(() =>
          container.lazyPanToElement(
            document.querySelector('.trace-node.highlight')
          )
        );
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
      }, 100);
    },
  },
};
</script>
