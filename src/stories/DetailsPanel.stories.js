import VDetailsPanel from '@/components/DetailsPanel.vue';
import scenario from '@/stories/data/scenario.json';
import { store, SET_APPMAP_DATA } from '@/store/vsCode';

store.commit(SET_APPMAP_DATA, scenario);

export default {
  title: 'AppLand/UI/DetailsPanel',
  component: VDetailsPanel,
  argTypes: {},
  args: {
    title: 'Details Panel',
  },
  store,
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VDetailsPanel },
  template: '<v-details-panel v-bind="$props" />',
  store,
});

export const Class = Template.bind({});
Class.args = {
  selectedObject: {
    kind: 'class',
    object: store.state.appMap.classMap.search('RootController')[0],
  },
};

export const Database = Template.bind({});
Database.args = {
  selectedObject: {
    kind: 'database',
    object: null,
  },
};

export const Edge = Template.bind({});
Edge.args = {
  selectedObject: {
    kind: 'edge',
    object: {
      from: 'app/controllers',
      to: 'SQL',
    },
  },
};

export const Event = Template.bind({});
Event.args = {
  selectedObject: {
    kind: 'event',
    object: store.state.appMap.events.find((e) => e.isCall() && e.codeObject && e.parameters.length > 3),
  },
};

export const Function = Template.bind({});
Function.args = {
  selectedObject: {
    kind: 'function',
    object: store.state.appMap.events.find((e) => e.codeObject).codeObject,
  },
};

export const HTTP = Template.bind({});
HTTP.args = {
  selectedObject: {
    kind: 'http',
    object: null,
  },
};

export const Null = Template.bind({});


export const Package = Template.bind({});
Package.args = {
  selectedObject: {
    kind: 'package',
    object: store.state.appMap.classMap.search('app/controllers')[0],
  },
};

export const Route = Template.bind({});
Route.args = {
  selectedObject: {
    kind: 'route',
    object: store.state.appMap.events
      .filter((e) => e.http_server_request && e.http_server_request.path_info === '/admin'),
  },
};
