import VTrace from '@/components/trace/Trace.vue';
import scenario from '@/stories/data/java_scenario.json';
import { store, SET_APPMAP_DATA } from '@/store/vsCode';

store.commit(SET_APPMAP_DATA, scenario);

console.log(store.state.appMap.events);
export default {
  title: 'AppLand/Diagrams',
  component: VTrace,
  argTypes: {},
  args: {
    events: [store.state.appMap.events[0]],
  },
};

export const diagramTrace = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VTrace },
  template: '<v-trace v-bind="$props" />',
  store,
});
