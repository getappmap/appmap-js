import VDiagramComponent from '@/components/DiagramComponent.vue';
import scenario from '@/stories/data/scenario.json';
import { buildStore, SET_APPMAP_DATA } from '@/store/vsCode';
import './scss/fullscreen.scss';

const store = buildStore();
store.commit(SET_APPMAP_DATA, scenario);

export default {
  title: 'AppLand/Diagrams/Component',
  component: VDiagramComponent,
  argTypes: {
    theme: { control: { type: 'select', options: ['dark', 'light'] } },
  },
  args: {},
};

export const component = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VDiagramComponent },
  template: '<v-diagram-component v-bind="$props" />',
  store,
});
