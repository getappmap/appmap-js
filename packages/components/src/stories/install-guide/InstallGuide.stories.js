import InstallGuide from '@/pages/InstallGuide.vue';
import { InstructionStep } from '@/components/install-guide/Status.vue';

export default {
  title: 'Pages/VS Code',
  component: InstallGuide,
  args: {
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
        agentInstalled: true,
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
        name: 'MyOtherProject',
        score: 3,
        path: '/home/user/my_other_project',
        numHttpRequests: 283,
        numAppMaps: 109,
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
      },
    ],
    editor: 'vscode',
    appMapsDir: 'tmp/appmap',
  },
  argTypes: {
    currentStep: {
      control: { type: 'range', min: 0, max: InstructionStep.NumSteps },
      defaultValue: 0,
    },
  },
};

export const installGuide = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { InstallGuide },
  template: '<InstallGuide v-bind="$props" />',
});
