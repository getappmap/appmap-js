import DiagramFlow from '@/components/DiagramFlow.vue';
import mockupData from '@/stories/data/scenario.json';

export default {
  title: 'AppLand/Diagrams',
  component: DiagramFlow,
  argTypes: {
    theme: { control: { type: 'select', options: ['dark', 'light'] } },
    data: { table: { disable: true } },
  },
  args: {
    data: mockupData,
  },
};

export const diagramFlow = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { DiagramFlow },
  template: '<DiagramFlow v-bind="$props" />',
});
