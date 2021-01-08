import VDiagramComponent from '@/components/DiagramComponent.vue';
import mockupData from '@/stories/data/componentDiagram.json';

export default {
  title: 'AppLand/Diagrams',
  component: VDiagramComponent,
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
  components: { VDiagramComponent },
  template: '<v-diagram-component v-bind="$props" />',
  args: {
    data: mockupData,
  },
});
