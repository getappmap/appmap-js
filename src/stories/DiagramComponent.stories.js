import VDiagramComponent from '@/components/DiagramComponent.vue';
import scenario from '@/stories/data/scenario.json';
import { store, SET_APPMAP_DATA } from '@/store/vsCode';
import './scss/fullscreen.scss';

store.commit(SET_APPMAP_DATA, scenario);

export default {
  title: 'AppLand/Diagrams',
  component: VDiagramComponent,
  argTypes: {
    theme: { control: { type: 'select', options: ['dark', 'light'] } },
  },
  args: {},
};

export const diagramComponent = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VDiagramComponent },
  template: '<v-diagram-component v-bind="$props" />',
  store,
});
