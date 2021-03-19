import VDiagramTrace from '@/components/DiagramTrace.vue';
import scenario from '@/stories/data/scenario.json';
import { buildStore, SET_APPMAP_DATA } from '@/store/vsCode';

const store = buildStore();
store.commit(SET_APPMAP_DATA, scenario);

let events = store.state.appMap.events.filter(
  (e) => e.isCall() && e.httpServerRequest
);
if (events.length === 0) {
  events = store.state.appMap.events.filter((e) => e.isCall() && !e.parent);
}

export default {
  title: 'AppLand/Diagrams/Trace',
  component: VDiagramTrace,
  argTypes: {
    events: { table: { disable: true } },
  },
  args: {
    events,
  },
};

export const trace = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VDiagramTrace },
  template:
    '<v-diagram-trace v-bind="$props" :selected-events="eventArray" @clickEvent="(e) => selectedEvent = e" />',
  data() {
    return {
      selectedEvent: null,
    };
  },
  computed: {
    eventArray() {
      if (this.selectedEvent) {
        return [this.selectedEvent];
      }
      return [];
    },
  },
  store,
});
