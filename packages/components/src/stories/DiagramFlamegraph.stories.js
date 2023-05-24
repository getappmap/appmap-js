import VDiagramFlamegraph from '@/components/DiagramFlamegraph.vue';
import scenario from '@/stories/data/scenario.json';
import { buildStore, SET_APPMAP_DATA } from '@/store/vsCode';
import './scss/fullscreen.scss';

const store = buildStore();
store.commit(SET_APPMAP_DATA, scenario);

export default {
  title: 'AppLand/Diagrams/Flamegraph',
  component: VDiagramFlamegraph,
  parameters: {
    chromatic: {
      delay: 1000,
      diffThreshold: 1,
    },
  },
  argTypes: {},
  args: {
    events: store.state.appMap.rootEvents(),
  },
};

export const flamegraph = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VDiagramFlamegraph },
  template: '<v-diagram-flamegraph v-bind="$props" />',
  store,
});
