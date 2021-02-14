import VTrace from '@/components/trace/Trace.vue';
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
  component: VTrace,
  argTypes: {
    events: { table: { disable: true } },
  },
  args: {
    events,
  },
};

export const trace = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VTrace },
  template: '<v-trace v-bind="$props" />',
  store,
});
