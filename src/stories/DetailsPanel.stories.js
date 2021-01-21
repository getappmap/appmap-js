import VDetailsPanel from '@/components/DetailsPanel.vue';
import scenario from '@/stories/data/scenario.json';
import { store, SET_APPMAP_DATA } from '@/store/vsCode';
import { CodeObjectType } from '@/lib/models/codeObject';

store.commit(SET_APPMAP_DATA, scenario);

const { classMap } = store.state.appMap;

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
  template: `
    <v-details-panel v-bind="$props">
      <template v-slot:buttons>
        <a class="clear-btn" href="#" @click.prevent>
          Clear selection
        </a>
        <a class="back-btn" href="#" @click.prevent>
          Back to <b>ApplicationController</b>
        </a>
      </template>
    </v-details-panel>
  `,
  store,
});

export const Class = Template.bind({});
Class.args = {
  selectedObject: classMap.search('RootController')[0],
};

export const Database = Template.bind({});
Database.args = {
  selectedObject: classMap.roots.find(
    (obj) => obj.type === CodeObjectType.DATABASE,
  ),
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
    (e) => e.isCall() && e.parameters && e.parameters.length > 3,
  ),
};

export const Function = Template.bind({});
Function.args = {
  selectedObject: store.state.appMap.events.find((e) => e.codeObject)
    .codeObject,
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
