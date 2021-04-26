import VDiagramFlow from '@/components/DiagramFlow.vue';
import scenario from '@/stories/data/scenario.json';
import { buildStore, SET_APPMAP_DATA } from '@/store/vsCode';
import './scss/fullscreen.scss';

const store = buildStore();
store.commit(SET_APPMAP_DATA, scenario);

export default {
  title: 'AppLand/Diagrams/Flow',
  component: VDiagramFlow,
  parameters: {
    chromatic: { delay: 1000 },
  },
  argTypes: {
    theme: { control: { type: 'select', options: ['dark', 'light'] } },
    callTree: { table: { disable: true } },
  },
  args: {
    callTree: store.state.appMap.callTree,
  },
};

export const flow = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VDiagramFlow },
  template: '<v-diagram-flow v-bind="$props" />',
  store,
});
