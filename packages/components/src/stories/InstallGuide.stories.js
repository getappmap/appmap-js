import InstallGuide from '@/pages/InstallGuide.vue';

export default {
  title: 'Pages/VS Code',
  component: InstallGuide,
  args: {
    projects: [
      {
        name: 'TestApp',
        score: 1,
        path: '/home/user/test_app',
        language: {
          name: 'Ruby 2.1',
          version: '2.1',
          score: 1,
        },
        testFramework: {
          name: 'MSTest 1.9',
          score: 1,
        },
        webFramework: {
          name: 'ASP.NET 2.2',
          version: '2.2',
          score: 1,
        },
      },
      {
        name: 'DjangoTest',
        score: 2,
        path: '/home/user/django_test',
        agentInstalled: true,
        appMapsRecorded: true,
        language: {
          name: 'Python 1.0',
          version: '1.0',
          score: 1,
        },
        testFramework: {
          name: 'None detected',
          score: 2,
        },
        webFramework: {
          name: 'Django 3.3',
          version: '3.3',
          score: 3,
        },
      },
      {
        name: 'MyOtherProject',
        score: 3,
        path: '/home/user/my_other_project',
        language: {
          name: 'Ruby 2.6',
          version: '2.6',
          score: 3,
        },
        testFramework: {
          name: 'RSpec',
          score: 3,
        },
        webFramework: {
          name: 'Rails 5.9',
          version: '5.9',
          score: 3,
        },
      },
    ],
    editor: 'vscode',
    appMapsDir: 'tmp/appmap',
  },
};

export const installGuide = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { InstallGuide },
  template: '<InstallGuide v-bind="$props" />',
});
