import VDiagramFlamegraph from '@/components/DiagramFlamegraph.vue';
import scenario from '@/stories/data/scenario.json';
import { buildStore, SET_APPMAP_DATA } from '@/store/vsCode';
import './scss/fullscreen.scss';

const store = buildStore();
store.commit(SET_APPMAP_DATA, scenario);
const events = store.state.appMap.rootEvents();

export default {
  title: 'AppLand/Diagrams/Flamegraph',
  component: VDiagramFlamegraph,
  parameters: {
    chromatic: {
      delay: 1000,
      diffThreshold: 1,
    },
  },
  args: {
    events,
    title: 'default title',
  },
  argTypes: {},
};

export const Flamegraph = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VDiagramFlamegraph },
  store,
  template: `
    <v-diagram-flamegraph
      v-bind="$props"
      :selected-events="selectedEventArray"
      @select="(e) => { selectedEvent = e; }"
    />
  `,
  data() {
    return { selectedEvent: null };
  },
  computed: {
    selectedEventArray() {
      return this.selectedEvent ? [this.selectedEvent] : [];
    },
  },
});
