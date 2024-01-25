import InstallGuide from '@/pages/InstallGuide.vue';
import { InstructionStep } from '@/components/install-guide/Status.vue';

export default {
  title: 'Pages/VS Code',
  component: InstallGuide,
  args: {
    editor: 'vscode',
    appMapsDir: 'tmp/appmap',
  },
  argTypes: {
    currentStep: {
      control: { type: 'range', min: 0, max: InstructionStep.NumSteps },
      default: 0,
    },
  },
};

// We can't use InstallGuide here because that's the name of the Vue component,
// so we'll just diable the eslint rule for this line.
// eslint-disable-next-line storybook/prefer-pascal-case
export const installGuide = (args, { argTypes }) => ({
  props: Object.keys(argTypes).filter((key) => key !== 'projects'),
  components: { InstallGuide },
  data: () => ({
    projects: [
      {
        name: 'TestApp',
        score: 0,
        path: '/home/user/test_app',
        language: {
          name: 'Go',
          score: 0,
        },
        testFramework: {
          name: 'MSTest',
          score: 0,
        },
        webFramework: {
          name: 'ASP.NET',
          score: 0,
        },
      },
      {
        name: 'DjangoTest',
        score: 2,
        path: '/home/user/django_test',
        agentInstalled: false,
        appMapsRecorded: true,
        language: {
          name: 'Python',
          score: 2,
        },
        testFramework: {
          name: 'None detected',
          score: 1,
        },
        webFramework: {
          name: 'Django',
          score: 3,
        },
      },
      {
        name: 'jsTest',
        score: 2,
        path: '/home/user/js_test',
        agentInstalled: false,
        appMapsRecorded: true,
        language: {
          name: 'JavaScript',
          score: 2,
        },
        testFramework: {
          name: 'jest',
          score: 3,
        },
        webFramework: {
          name: 'next.js',
          score: 3,
        },
      },
      {
        name: 'MyOtherProject',
        score: 3,
        path: '/home/user/my_other_project',
        numHttpRequests: 283,
        numAppMaps: 109,
        agentInstalled: true,
        language: {
          name: 'Ruby',
          score: 3,
        },
        testFramework: {
          name: 'RSpec',
          score: 3,
        },
        webFramework: {
          name: 'Rails',
          score: 3,
        },
        appMaps: [{ name: 'This is an example', requests: 1, sqlQueries: 4, functions: 87 }],
      },
    ],
  }),
  template: '<InstallGuide v-bind="$props" :projects="projects" />',
  mounted() {
    this.$root.$on('perform-install', (path) => {
      const project = this.projects.find((p) => p.path === path);
      if (project) project.agentInstalled = true;
    });
  },
});
installGuide.args = {
  displayAiHelp: true,
};
