import { buildAppMap } from '@appland/models';
import VDiagramFlow from '@/components/DiagramFlow.vue';
import mockupData from '@/stories/data/scenario.json';

const { callTree } = buildAppMap()
  .source(mockupData)
  .normalize()
  .build();

export default {
  title: 'AppLand/Diagrams',
  component: VDiagramFlow,
  argTypes: {
    theme: { control: { type: 'select', options: ['dark', 'light'] } },
    callTree: { table: { disable: true } },
  },
  args: {
    callTree,
  },
};

export const diagramFlow = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VDiagramFlow },
  template: '<v-diagram-flow v-bind="$props" />',
});
