import ProjectPicker from '@/pages/install-guide/ProjectPicker.vue';

export default {
  title: 'Pages/VS Code/Install Guide Pages',
  component: ProjectPicker,
  args: {
    projects: [
      {
        name: 'TestApp',
        score: 1,
        path: '/home/user/test_app',
        language: {
          name: 'C#',
          score: 1,
        },
        testFramework: {
          name: 'MSTest',
          score: 1,
        },
        webFramework: {
          name: 'ASP.NET',
          score: 1,
        },
      },
      {
        name: 'DjangoTest',
        score: 2,
        path: '/home/user/django_test',
        language: {
          name: 'Python',
          score: 2,
        },
        testFramework: {
          name: 'PyTest',
          score: 2,
        },
        webFramework: {
          name: 'Django',
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
  },
};

export const projectPicker = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { ProjectPicker },
  template: '<ProjectPicker v-bind="$props" ref="installAgent" />',
});
