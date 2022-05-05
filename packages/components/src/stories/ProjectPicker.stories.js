import ProjectPicker from '@/pages/install-guide/ProjectPicker.vue';

export default {
  title: 'Pages/VS Code/Install Guide',
  component: ProjectPicker,
  args: {
    projects: [
      {
        name: 'MyProject',
        path: '/home/user/my_project',
      },
      {
        name: 'TestApp',
        score: 1,
        path: '/home/user/test_app',
        language: {
          value: 'C#',
          score: 1,
        },
        testFramework: {
          value: 'MSTest',
          score: 1,
        },
        webFramework: {
          value: 'ASP.NET',
          score: 1,
        },
      },
      {
        name: 'DjangoTest',
        score: 2,
        path: '/home/user/django_test',
        language: {
          value: 'Python',
          score: 2,
        },
        testFramework: {
          value: 'PyTest',
          score: 2,
        },
        webFramework: {
          value: 'Django',
          score: 2,
        },
      },
      {
        name: 'MyOtherProject',
        score: 3,
        path: '/home/user/my_other_project',
        agentInstalled: true,
        appMapsRecorded: true,
        language: {
          value: 'Ruby',
          score: 3,
        },
        testFramework: {
          value: 'RSpec',
          score: 3,
        },
        webFramework: {
          value: 'Rails',
          score: 3,
        },
      },
    ],
  },
};

export const projectPicker = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { ProjectPicker },
  template: '<ProjectPicker v-bind="$props" ref="installAgent" />',
});
