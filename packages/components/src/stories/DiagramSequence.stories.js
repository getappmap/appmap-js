import VDiagramSequence from '@/components/DiagramSequence.vue';
import micropost_diff from '@/stories/data/sequence/Users_profile_profile_display.diff.sequence.json';
import create_api_key from '@/stories/data/sequence/create_api_key.sequence.json';
import list_users from '@/stories/data/sequence/list_users.sequence.json';
import list_users_prefetch from '@/stories/data/sequence/list_users_prefetch.sequence.json';
import show_user from '@/stories/data/sequence/show_user.sequence.json';
import user_not_found from '@/stories/data/sequence/user_not_found.sequence.json';
import { buildStore } from '@/store/vsCode';

const store = buildStore();

export default {
  title: 'AppLand/Diagrams/Sequence',
  component: VDiagramSequence,
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VDiagramSequence },
  template: '<v-diagram-sequence v-bind="$props"/>',
  store,
});

export const MicropostUserProfileDiff = Template.bind({});
MicropostUserProfileDiff.args = {
  serializedDiagram: micropost_diff,
  selectedEvents: [{ id: 536 }],
};
export const Empty = Template.bind({});

export const CreateApiKey = Template.bind({});
CreateApiKey.args = {
  serializedDiagram: create_api_key,
};

export const ListUsers = Template.bind({});
ListUsers.args = {
  serializedDiagram: list_users,
};

export const NonInteractive = Template.bind({});
NonInteractive.args = {
  serializedDiagram: list_users,
  interactive: false,
};

export const ListUsersPrefetch = Template.bind({});
ListUsersPrefetch.args = {
  serializedDiagram: list_users_prefetch,
};

export const ShowUser = Template.bind({});
ShowUser.args = {
  serializedDiagram: show_user,
};

export const UserNotFound = Template.bind({});
UserNotFound.args = {
  serializedDiagram: user_not_found,
};
