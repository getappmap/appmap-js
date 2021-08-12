import InstallAgent from '@/pages/quickstart-docs/InstallAgent.vue';

export default {
  title: 'Pages/VS Code/Quickstart Docs/Install Agent',
  component: InstallAgent,
  args: {
    languages: [
      {
        id: 'ruby',
        name: 'Ruby',
        link: 'https://appland.com/docs/quickstart/vscode/ruby-step-2.html',
        installCommand: 'npx @appland/appmap install-agent ruby',
        isDetected: true,
      },
      {
        id: 'ruby3',
        name: 'Ruby 3',
        link: 'https://appland.com/docs/quickstart/vscode/ruby-step-2.html',
        installCommand: 'npx @appland/appmap install-agent ruby3',
        isDetected: false,
      },
    ],
  },
};

export const installAgent = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { InstallAgent },
  template: '<InstallAgent v-bind="$props" ref="installAgent" />',
});
