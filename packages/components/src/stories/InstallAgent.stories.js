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
    appmaps: [
      {
        name: 'Appmap 1',
        path: '/path/to/appmap',
        requests: 4,
        sqlQueries: 29,
        functions: 136,
      },
      {
        name: 'Appmap 2',
        path: '/another/path/to/appmap',
        requests: 1,
        sqlQueries: 15,
        functions: 22,
      },
      {
        name: 'Appmap 3',
        path: '/one/more/path/to/appmap',
        requests: 12,
        sqlQueries: 7,
        functions: 279,
      },
    ],
  },
};

export const installAgent = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { InstallAgent },
  template: '<InstallAgent v-bind="$props" ref="installAgent" />',
});
