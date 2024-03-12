import VInstructions from '@/components/chat-search/Instructions.vue';

export default {
  title: 'Pages/ChatSearch/Instructions',
  component: VInstructions,
  argTypes: {},
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VInstructions },
  template: `<div style="font-family: system-ui;"><v-instructions v-bind="$props"></v-instructions></div>`,
});

export const Instructions = Template.bind({});
Instructions.args = {
  appmaps: [
    {
      recordingMethod: 'requests',
      name: 'GET /dashboard',
      createdAt: '2024-02-28T18:06:23Z',
      path: 'tmp/appmap/0.appmap.json',
    },
    {
      recordingMethod: 'requests',
      name: 'POST /login',
      createdAt: '2024-02-28T18:06:23Z',
      path: 'tmp/appmap/0.appmap.json',
    },
    {
      recordingMethod: 'requests',
      name: 'GET /login',
      createdAt: '2024-02-28T18:05:12Z',
      path: 'tmp/appmap/0.appmap.json',
    },
    {
      recordingMethod: 'requests',
      name: 'GET /',
      createdAt: '2024-02-28T18:05:12Z',
      path: 'tmp/appmap/0.appmap.json',
    },
    {
      recordingMethod: 'tests',
      name: 'Users can access home page without first navigating to the secret dashboard',
      createdAt: '2024-02-27T15:43:39Z',
      path: 'tmp/appmap/1.appmap.json',
    },
    {
      recordingMethod: 'tests',
      name: 'API keys can be revoked by administrators',
      createdAt: '2024-02-27T15:43:35Z',
      path: 'tmp/appmap/0.appmap.json',
    },
  ],
};

export const InstructionsNoAppMaps = Template.bind({});
