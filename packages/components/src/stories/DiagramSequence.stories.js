import VDiagramSequence from '@/components/DiagramSequence.vue';
import diagram from '@/stories/data/sequence.json';

export default {
  title: 'AppLand/Diagrams/Sequence',
  component: VDiagramSequence,
  args: {
    diagram,
  },
};

export const sequence = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VDiagramSequence },
  template: '<v-diagram-sequence v-bind="$props"/>',
});
