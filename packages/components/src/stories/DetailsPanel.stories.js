import VDetailsPanel from '@/components/DetailsPanel.vue';
import VDetailsButton from '@/components/DetailsButton.vue';
import scenario from '@/stories/data/scenario.json';
import { buildStore, SET_APPMAP_DATA } from '@/store/vsCode';
import bindResolvePath from './support/resolvePath';

const store = buildStore();
store.commit(SET_APPMAP_DATA, scenario);

const { classMap } = store.state.appMap;

export default {
  title: 'AppLand/UI/DetailsPanel',
  component: VDetailsPanel,
  argTypes: {},
  args: {
    title: 'Details Panel',
    appMap: store.state.appMap,
  },
  store,
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VDetailsPanel, VDetailsButton },
  template: `
    <v-details-panel v-bind="$props">
      <template v-slot:buttons>
        <v-details-button>
          Clear selection
        </v-details-button>
        <v-details-button>
          Back to <b>ApplicationController</b>
        </v-details-button>
      </template>
    </v-details-panel>
  `,
  created() {
    bindResolvePath(this);
  },
  store,
});

export const Class = Template.bind({});
Class.args = {
  selectedObject: classMap.search('RootController')[0],
};

export const Database = Template.bind({});
Database.args = {
  selectedObject: classMap.roots.find((obj) => obj.type === CodeObjectType.DATABASE),
};

export const Edge = Template.bind({});
Edge.args = {
  selectedObject: {
    type: 'edge',
    from: classMap.roots.find((obj) => obj.id === 'app/controllers'),
    to: classMap.roots.find((obj) => obj.type === CodeObjectType.DATABASE),
  },
};

export const Event = Template.bind({});
Event.args = {
  selectedObject: store.state.appMap.events.find(
    (e) => e.isCall() && e.parameters && e.parameters.length > 3
  ),
};

export const Function = Template.bind({});
Function.args = {
  selectedObject: store.state.appMap.events.find((e) => e.methodId).codeObject,
};

export const HTTP = Template.bind({});
HTTP.args = {
  selectedObject: classMap.httpObject,
};

export const Null = Template.bind({});

export const Package = Template.bind({});
Package.args = {
  selectedObject: classMap.search('app/controllers')[0],
};

export const Route = Template.bind({});
Route.args = {
  selectedObject: classMap.httpObject.children[0],
};
