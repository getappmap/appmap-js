import VDiagramFlow from '@/components/DiagramFlow.vue';
import scenario from '@/stories/data/scenario.json';
import { store, SET_APPMAP_DATA } from '@/store/vsCode';
import './scss/fullscreen.scss';

store.commit(SET_APPMAP_DATA, scenario);

export default {
  title: 'AppLand/Diagrams',
  component: VDiagramFlow,
  argTypes: {
    theme: { control: { type: 'select', options: ['dark', 'light'] } },
    callTree: { table: { disable: true } },
  },
  args: {
    callTree: store.state.appMap.callTree,
  },
};

export const diagramFlow = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VDiagramFlow },
  template: '<v-diagram-flow v-bind="$props" />',
  store,
});
