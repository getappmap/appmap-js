import DiagramComponent from '@/components/DiagramComponent.vue';
import mockupData from '@/stories/data/componentDiagram.json';

export default {
  title: 'AppLand/Diagrams',
  component: DiagramComponent,
  argTypes: {
    theme: { control: { type: 'select', options: ['dark', 'light'] } },
    data: { table: { disable: true } },
  },
  args: {
    data: mockupData,
  },
};

export const diagramComponent = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { DiagramComponent },
  template: '<DiagramComponent v-bind="$props" />',
  args: {
    data: mockupData,
  },
});
