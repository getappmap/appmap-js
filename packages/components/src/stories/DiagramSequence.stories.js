import VDiagramSequence from '@/components/DiagramSequence.vue';
import forem from '@/stories/data/sequence/forem.sequence.json';
import create_api_key from '@/stories/data/sequence/create_api_key.sequence.json';
import list_users from '@/stories/data/sequence/list_users.sequence.json';
import list_users_prefetch from '@/stories/data/sequence/list_users_prefetch.sequence.json';
import show_user from '@/stories/data/sequence/show_user.sequence.json';
import user_not_found from '@/stories/data/sequence/user_not_found.sequence.json';

export default {
  title: 'AppLand/Diagrams/Sequence',
  component: VDiagramSequence,
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VDiagramSequence },
  template: '<v-diagram-sequence v-bind="$props"/>',
});

export const Forem = Template.bind({});
Forem.args = {
  diagram: forem,
};
export const CreateApiKey = Template.bind({});
CreateApiKey.args = {
  diagram: create_api_key,
};
export const ListUsers = Template.bind({});
ListUsers.args = {
  diagram: list_users,
};
export const ListUsersPrefetch = Template.bind({});
ListUsersPrefetch.args = {
  diagram: list_users_prefetch,
};
export const ShowUser = Template.bind({});
ShowUser.args = {
  diagram: show_user,
};
export const UserNotFound = Template.bind({});
UserNotFound.args = {
  diagram: user_not_found,
};
