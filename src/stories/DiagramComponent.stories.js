import VDiagramComponent from '@/components/DiagramComponent.vue';
import scenario from '@/stories/data/scenario.json';
import { buildAppMap } from '@appland/models';

const appMap = buildAppMap().source(scenario).normalize().build();

export default {
  title: 'AppLand/Diagrams',
  component: VDiagramComponent,
  argTypes: {
    theme: { control: { type: 'select', options: ['dark', 'light'] } },
    componentData: { table: { disable: true } },
  },
  args: {
    componentData: appMap.components,
  },
};

export const diagramComponent = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VDiagramComponent },
  template: '<v-diagram-component v-bind="$props" />',
  args: {
    componentData: appMap.components,
  },
});
