import VInstructions from '@/components/chat-search/Instructions.vue';

export default {
  title: 'Pages/ChatSearch/Instructions',
  component: VInstructions,
  argTypes: {},
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VInstructions },
  template: `<div style="background-color: #262C40; padding: 1rem; font-family: system-ui;"><v-instructions v-bind="$props"></v-instructions></div>`,
});

export const InstructionsBeforeAppMapStats = Template.bind({});

const appmapStats = {
  packages: ['app/controllers', 'app/helpers', 'app/models'],
  classes: ['User', 'UsersController', 'SessionsController'],
  routes: ['GET /users', 'GET /users/:id', 'GET /signup', 'POST /signup'],
  tables: ['users', 'microposts'],
  numAppMaps: 100,
};

export const Instructions = Template.bind({});
Instructions.args = {
  appmapStats,
};

export const InstructionsNoAppMaps = Template.bind({});
InstructionsNoAppMaps.args = {
  appmapStats: { numAppMaps: 0 },
};
