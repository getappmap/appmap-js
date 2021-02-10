import VDiagramFlow from '@/components/DiagramFlow.vue';
import scenario from '@/stories/data/new.json';
import { buildStore, SET_APPMAP_DATA } from '@/store/vsCode';
import './scss/fullscreen.scss';

const store = buildStore();

export default {
  title: 'AppLand/Diagrams/Flow',
  component: VDiagramFlow,
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
  mounted() {
    store.commit(SET_APPMAP_DATA, scenario);
  },
  store,
});
