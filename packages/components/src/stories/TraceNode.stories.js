import { buildAppMap } from '@appland/models';
import VTraceNode from '@/components/trace/TraceNode.vue';
import scenario from './data/scenario.json';

const appMap = buildAppMap(scenario).build();

export default {
  title: 'AppLand/UI/TraceNode',
  component: VTraceNode,
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VTraceNode },
  template: `<v-trace-node v-bind="$props" />`,
});

export const EventDefault = Template.bind({});
EventDefault.args = {
  event: appMap.events.find((e) => e.parameters && e.parameters.length > 2),
};

export const EventSql = Template.bind({});
EventSql.args = {
  event: appMap.events.find((e) => e.sql),
};

export const EventHttp = Template.bind({});
EventHttp.args = {
  event: appMap.events.find((e) => e.httpServerRequest),
};

export const EventHttpClientRequest = Template.bind({});
EventHttpClientRequest.args = {
  event: appMap.events.find((e) => e.httpClientRequest),
};
