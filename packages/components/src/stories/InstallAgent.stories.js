import InstallAgent from '@/pages/InstallAgent.vue';

export default {
  title: 'Pages/VS Code',
  component: InstallAgent,
  args: {
    languages: [
      {
        id: 'ruby',
        name: 'Ruby',
        link: 'https://appland.com/docs/quickstart/vscode/ruby-step-2.html',
        isDetected: true,
      },
      {
        id: 'ruby3',
        name: 'Ruby 3',
        link: 'https://appland.com/docs/quickstart/vscode/ruby-step-2.html',
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
