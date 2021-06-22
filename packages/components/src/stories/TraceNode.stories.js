import VTraceNode from '@/components/trace/TraceNode.vue';
import { buildAppMap } from '@appland/models';
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

export const eventDefault = Template.bind({});
eventDefault.args = {
  event: appMap.events.find((e) => e.parameters && e.parameters.length > 2),
};

export const eventSql = Template.bind({});
eventSql.args = {
  event: appMap.events.find((e) => e.sql),
};

export const eventHttp = Template.bind({});
eventHttp.args = {
  event: appMap.events.find((e) => e.httpServerRequest),
};

export const eventHttpClientRequest = Template.bind({});
eventHttpClientRequest.args = {
  event: appMap.events.find((e) => e.httpClientRequest),
};
