import InstallAgent from '@/pages/quickstart-docs/InstallAgent.vue';

export default {
  title: 'Pages/VS Code/Quickstart Docs/Install Agent',
  component: InstallAgent,
  args: {
    codeSnippet: 'npx @appland/appmap install-agent',
  },
};

export const installAgent = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { InstallAgent },
  template: '<InstallAgent v-bind="$props" ref="installAgent" />',
});
