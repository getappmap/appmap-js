<template>
  <VDiagramSequence :serialized-diagram="serializedDiagram" :interactive="interactive" />
</template>

<script>
import VDiagramSequence from '@/components/DiagramSequence.vue';
import { store } from '@/store/vsCode';

export default {
  name: 'v-sequence-diagram',

  components: {
    VDiagramSequence,
  },

  props: {
    serializedDiagram: {
      type: Object,
    },
    interactive: {
      type: Boolean,
      default: true,
    },
  },

  store,
};
</script>

<style scoped lang="scss"></style>
