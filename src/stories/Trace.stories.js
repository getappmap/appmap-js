import VTrace from '@/components/trace/Trace.vue';
import scenario from '@/stories/data/scenario_large.json';
import { buildStore, SET_APPMAP_DATA } from '@/store/vsCode';

const store = buildStore();
store.commit(SET_APPMAP_DATA, scenario);

export default {
  title: 'AppLand/Diagrams/Trace',
  component: VTrace,
  argTypes: {
    events: { table: { disable: true } },
  },
  args: {
    events: [store.state.appMap.events[0]],
  },
};

export const trace = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VTrace },
  template: '<v-trace v-bind="$props" />',
  store,
});
