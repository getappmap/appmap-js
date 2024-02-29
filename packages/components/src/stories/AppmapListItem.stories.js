import VAppmapListItem from '@/components/AppmapListItem.vue';

export default {
  title: 'AppLand/UI/AppMap List Item',
  component: VAppmapListItem,
  argTypes: {},
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VAppmapListItem },
  template: `<v-appmap-list-item v-bind="$props"/>`,
});

export const TestCase = Template.bind({});
TestCase.args = {
  name: 'Users can access the homepage without first navigating through the login flow',
  createdAt: '2021-04-01T12:00:00Z',
  recordingMethod: 'tests',
};

export const Request = Template.bind({});
Request.args = {
  name: 'GET /users',
  createdAt: '2021-04-01T12:00:00Z',
  recordingMethod: 'requests',
};

export const Process = Template.bind({});
Process.args = {
  name: 'node cli.js',
  createdAt: '2021-04-01T12:00:00Z',
  recordingMethod: 'process',
};

export const Remote = Template.bind({});
Remote.args = {
  name: 'Smoke test login flow',
  createdAt: '2021-04-01T12:00:00Z',
  recordingMethod: 'remote',
};

export const CodeBlock = Template.bind({});
CodeBlock.args = {
  name: 'AI conversation gateway',
  createdAt: '2021-04-01T12:00:00Z',
  recordingMethod: 'block',
};
